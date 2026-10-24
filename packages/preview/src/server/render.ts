/**
 * `render`: renders templates with their `PreviewProps` and gives back what a
 * program needs to use them elsewhere: the mode, the HTML and the design JSON
 * the Unlayer editor opens. The Unlayer CLI's `unlayer elements push` runs it
 * to create and update templates in an Unlayer project; with `check`, each
 * template also carries the findings `check` reports for it.
 */

import path from "node:path";
import type { GroupedFindings } from "../../shared/findings.js";
import { selectProjectTemplates, templateFindings, type FindingsContext } from "./check.js";
import { createChecks } from "./checks.js";
import { createLoader, type RenderMode } from "./loader.js";
import { shown } from "./paths.js";

export interface RenderTemplatesOptions {
  /** The templates folder. */
  dir: string;
  /** The templates to render (see selectTemplates): `.` for every one. */
  templates: string[];
  /** Also run check's checks on each template. */
  check?: boolean;
  /** With check: request each link and image URL (default true). */
  network?: boolean;
  /** More Vite plugins for loading templates (see loadVitePlugins). */
  plugins?: unknown[];
  /** How long a template may take to load and render before it fails (default: 30 seconds). */
  renderTimeoutMs?: number;
  timeoutMs?: number;
  fetch?: typeof fetch;
  /** Called with each template as soon as it's rendered (and checked). */
  onTemplate?: (template: RenderedTemplateJson) => void;
}

export interface RenderedTemplateJson {
  /** The template's path in the templates folder. */
  path: string;
  /** Its file, from the working directory. */
  file: string;
  /** It rendered, and with check, has nothing to fix. */
  ok: boolean;
  /** null when it doesn't render. */
  mode: RenderMode | null;
  /** null when it doesn't render. */
  html: string | null;
  /** The design JSON the Unlayer editor opens; null when it couldn't be made (see designError) or the template doesn't render. */
  design: unknown;
  designError?: string;
  /** Why it doesn't render, with the file (from the working directory), line and code around it. */
  error?: { message: string; file?: string; line?: number; column?: number; frame?: string };
  /** What Elements and React warned about while rendering. */
  warnings: string[];
  /** With check: check's findings for the template, and whether it has nothing to fix. */
  check?: { ok: boolean } & GroupedFindings;
}

export interface RenderTemplatesResult {
  templates: RenderedTemplateJson[];
  /** How many didn't render, or with check, have something to fix. */
  failed: number;
}

/** Renders the templates named (a UsageError when one isn't there, or when Elements isn't installed). */
export async function renderTemplates(options: RenderTemplatesOptions): Promise<RenderTemplatesResult> {
  const { dir, project, selected } = await selectProjectTemplates(options.dir, options.templates, "render");
  const loader = await createLoader({ project, watch: false, plugins: options.plugins, renderTimeoutMs: options.renderTimeoutMs });
  const context: FindingsContext = {
    project,
    checks: createChecks(loader, dir),
    network: options.network !== false,
    timeoutMs: options.timeoutMs,
    fetch: options.fetch,
  };
  const templates: RenderedTemplateJson[] = [];
  try {
    for (const template of selected) {
      const file = path.join(dir, template.path);
      const result = await loader.render(file);
      const warnings = result.logs.filter((log) => log.level === "error" || log.level === "warn").map((log) => log.message);
      let rendered: RenderedTemplateJson;
      if (result.ok) {
        rendered = {
          path: template.path,
          file: shown(file),
          ok: true,
          mode: result.mode,
          html: result.html,
          design: result.json ?? null,
          ...(result.jsonError ? { designError: result.jsonError } : {}),
          warnings,
        };
      } else {
        const { message, file: errorFile, line, column, frame } = result.error;
        rendered = {
          path: template.path,
          file: shown(file),
          ok: false,
          mode: null,
          html: null,
          design: null,
          error: { message, file: errorFile ? shown(path.resolve(project.root, errorFile)) : undefined, line, column, frame },
          warnings,
        };
      }
      if (options.check) {
        const grouped = await templateFindings(result, file, context);
        const checkOk = grouped.toFix.length === 0;
        rendered.check = { ok: checkOk, ...grouped };
        rendered.ok = rendered.ok && checkOk;
      }
      templates.push(rendered);
      options.onTemplate?.(rendered);
    }
  } finally {
    await loader.close();
  }
  return { templates, failed: templates.filter((t) => !t.ok).length };
}
