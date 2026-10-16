/**
 * Renders every template to a file: `out/onboarding/welcome.html` for
 * `emails/onboarding/welcome.tsx`, with its `PreviewProps`. For backends that
 * can't run JavaScript, or platforms that only take HTML; when your code can
 * call Elements, render at send time with the real data instead.
 */

import { cp, mkdir, writeFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { discoverTemplates, type TemplateEntry } from "./discover.js";
import { createLoader } from "./loader.js";
import { assertDistinctOutputs } from "./outputs.js";
import { inspectProject } from "./project.js";
import type { TemplateError } from "./errors.js";

export interface ExportOptions {
  /** The templates folder. */
  dir: string;
  /** Where to write the files. Existing files with the same names are replaced; nothing else is deleted. Default: `out`. */
  outDir?: string;
  /** Format the HTML for reading (Prettier). */
  pretty?: boolean;
  /** Write plain text instead of HTML. */
  plainText?: boolean;
  /** Also write each template's design JSON (`<name>.design.json`), which the Unlayer builder opens with `loadDesign()`. */
  design?: boolean;
  /** The extension of the files written, without the dot: `html` (default), `txt` with plainText, or e.g. `blade.php`. */
  extension?: string;
  /** More Vite plugins for loading templates (see loadVitePlugins). */
  plugins?: unknown[];
}

export interface ExportedTemplate {
  template: string;
  files: string[];
  error?: TemplateError;
  warnings: string[];
}

export interface ExportResult {
  outDir: string;
  templates: ExportedTemplate[];
  failed: number;
}

async function prettyHtml(html: string): Promise<string> {
  const prettier = await import("prettier");
  return prettier.format(html, { parser: "html", printWidth: 120, htmlWhitespaceSensitivity: "ignore" });
}

export async function exportTemplates(options: ExportOptions): Promise<ExportResult> {
  const dir = path.resolve(options.dir);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    throw new Error(`The templates folder ${dir} doesn't exist. Point the export at the folder with your templates: --dir ./emails`);
  }
  const outDir = path.resolve(options.outDir ?? "out");
  if (dir === outDir || dir.startsWith(outDir + path.sep)) {
    throw new Error(`The output folder ${outDir} holds the templates. Pick another one: --outDir out`);
  }
  const project = inspectProject(dir);
  if (!project.canRender) throw new Error(project.warnings.join("\n"));
  const extension = (options.extension ?? (options.plainText ? "txt" : "html")).replace(/^\./, "");
  const templates = await discoverTemplates(dir);
  const base = (template: TemplateEntry) => template.path.slice(0, -path.extname(template.path).length);
  assertDistinctOutputs(templates, (template) => [
    path.join(outDir, `${base(template)}.${extension}`),
    ...(options.design ? [path.join(outDir, `${base(template)}.design.json`)] : []),
  ]);
  const loader = await createLoader({ project, watch: false, plugins: options.plugins });
  const results: ExportedTemplate[] = [];
  try {
    await mkdir(outDir, { recursive: true });
    for (const template of templates) {
      const result = await loader.render(path.join(dir, template.path));
      const warnings = result.logs.filter((log) => log.level === "error" || log.level === "warn").map((log) => log.message);
      if (!result.ok) {
        results.push({ template: template.path, files: [], error: result.error, warnings });
        continue;
      }
      // Without its plain text there's nothing to write: an empty file would pass for an email without text.
      if (options.plainText && result.textError) {
        results.push({ template: template.path, files: [], error: { message: `No plain text version: ${result.textError}`, phase: "render" }, warnings });
        continue;
      }
      const files: string[] = [];
      const write = async (relative: string, content: string) => {
        const file = path.join(outDir, relative);
        await mkdir(path.dirname(file), { recursive: true });
        await writeFile(file, content);
        const shown = path.relative(process.cwd(), file);
        files.push(shown.startsWith("..") ? file : shown);
      };
      if (options.plainText) {
        await write(`${base(template)}.${extension}`, result.text);
      } else {
        await write(`${base(template)}.${extension}`, options.pretty ? await prettyHtml(result.html) : result.html);
      }
      if (options.design) {
        if (result.json) await write(`${base(template)}.design.json`, `${JSON.stringify(result.json, null, 2)}\n`);
        else if (result.jsonError) warnings.push(`No design JSON: ${result.jsonError}`);
      }
      results.push({ template: template.path, files, warnings });
    }
    // Images and other files the templates use, at the same /static/ path as in the preview.
    const staticDir = path.join(dir, "static");
    if (existsSync(staticDir)) await cp(staticDir, path.join(outDir, "static"), { recursive: true });
  } finally {
    await loader.close();
  }
  return { outDir, templates: results, failed: results.filter((r) => r.error).length };
}
