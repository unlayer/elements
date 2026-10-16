/**
 * `check`: renders templates and runs the preview's checks on each, for a
 * terminal, a CI job or a coding agent: render errors, Elements and React
 * warnings, the design JSON and plain text, email client compatibility, links
 * and images, and Gmail's clipping size. The findings and their levels are the
 * Checks drawer's (shared/findings.ts): errors are to fix, warnings to check.
 */

import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { clientFindings, groupFindings, linkFindings, renderingFindings, type Finding, type GroupedFindings } from "../../shared/findings.js";
import { createChecks, type TemplateChecks } from "./checks.js";
import { discoverTemplates, selectTemplates, unknownTemplatesMessage, type TemplateEntry } from "./discover.js";
import { UsageError } from "./errors.js";
import { createLoader, readSource, type RenderMode, type RenderResult } from "./loader.js";
import { shown } from "./paths.js";
import { inspectProject, type ProjectInfo } from "./project.js";

export interface CheckOptions {
  /** The templates folder. */
  dir: string;
  /** The templates to check (see selectTemplates); none: every template. */
  templates?: string[];
  /** Request each link and image URL (default true). */
  network?: boolean;
  /** What's to check fails the check too, not only what's to fix. */
  strict?: boolean;
  /** More Vite plugins for loading templates (see loadVitePlugins). */
  plugins?: unknown[];
  /** How long each URL has to answer (default: the link check's). */
  timeoutMs?: number;
  fetch?: typeof fetch;
}

export interface CheckedTemplate extends GroupedFindings {
  /** The template's path in the templates folder. */
  path: string;
  /** Its file, from the working directory. */
  file: string;
  /** Nothing to fix (with strict, nothing to check either). */
  ok: boolean;
  /** null when it doesn't render. */
  mode: RenderMode | null;
  /** The size of its HTML; null when it doesn't render. */
  bytes: number | null;
}

export interface CheckReport {
  /** Every template is ok: the command exits with 0. */
  ok: boolean;
  strict: boolean;
  /** Whether link and image URLs were requested. */
  network: boolean;
  /** Worst first: the most to fix, then the most to check, then by path. */
  templates: CheckedTemplate[];
  summary: { templates: number; toFix: number; toCheck: number; notes: number };
}

/**
 * The project and the templates a one-off command (`check`, `render`) works on:
 * the templates folder must exist and have templates, Elements and React must
 * be installed, and every template named must be there; otherwise a UsageError.
 */
export async function selectProjectTemplates(
  dirOption: string,
  requested: string[],
  command: string
): Promise<{ dir: string; project: ProjectInfo; selected: TemplateEntry[] }> {
  const dir = path.resolve(dirOption);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    throw new UsageError(`The templates folder ${shown(dir)} doesn't exist. Point the ${command} at the folder with your templates: --dir ./emails`);
  }
  const project = inspectProject(dir);
  if (!project.canRender) throw new UsageError(project.warnings.join("\n"));
  const all = await discoverTemplates(dir);
  if (!all.length) {
    throw new UsageError(`There are no templates in ${shown(dir)}: they're .tsx, .jsx or .js files with an export default. Point the ${command} at the folder with your templates: --dir ./emails`);
  }
  const { selected, unknown } = selectTemplates(dir, requested, all);
  if (unknown.length) throw new UsageError(unknownTemplatesMessage(unknown, shown(dir), all));
  return { dir, project, selected };
}

export interface FindingsContext {
  project: ProjectInfo;
  checks: TemplateChecks;
  /** Request each link and image URL. */
  network: boolean;
  timeoutMs?: number;
  fetch?: typeof fetch;
}

/**
 * What check reports for one template rendered from `file`: rendering, email
 * client and link findings, grouped by level (errors are to fix). Render
 * errors point at their file from the working directory.
 */
export async function templateFindings(result: RenderResult, file: string, context: FindingsContext): Promise<GroupedFindings> {
  const findings: Finding[] = renderingFindings(result, context.project.warnings);
  if (result.ok) {
    findings.push(...clientFindings(await context.checks.compat(result, await readSource(file))));
    findings.push(...linkFindings(await context.checks.links(result, { network: context.network, timeoutMs: context.timeoutMs, fetch: context.fetch })));
  }
  // Render errors point at files relative to the project: show them from here, like the template.
  for (const finding of findings) if (finding.file) finding.file = shown(path.resolve(context.project.root, finding.file));
  return groupFindings(findings);
}

export async function checkTemplates(options: CheckOptions): Promise<CheckReport> {
  const { dir, project, selected } = await selectProjectTemplates(options.dir, options.templates ?? [], "check");
  const network = options.network !== false;
  const strict = options.strict === true;
  const loader = await createLoader({ project, watch: false, plugins: options.plugins });
  const context: FindingsContext = { project, checks: createChecks(loader, dir), network, timeoutMs: options.timeoutMs, fetch: options.fetch };
  const templates: CheckedTemplate[] = [];
  try {
    for (const template of selected) {
      const file = path.join(dir, template.path);
      const result = await loader.render(file);
      const grouped = await templateFindings(result, file, context);
      templates.push({
        path: template.path,
        file: shown(file),
        ok: grouped.toFix.length === 0 && (!strict || grouped.toCheck.length === 0),
        mode: result.ok ? result.mode : null,
        bytes: result.ok ? Buffer.byteLength(result.html, "utf8") : null,
        ...grouped,
      });
    }
  } finally {
    await loader.close();
  }
  templates.sort((a, b) => b.toFix.length - a.toFix.length || b.toCheck.length - a.toCheck.length || a.path.localeCompare(b.path));
  const total = (key: keyof GroupedFindings) => templates.reduce((sum, t) => sum + t[key].length, 0);
  return {
    ok: templates.every((t) => t.ok),
    strict,
    network,
    templates,
    summary: { templates: templates.length, toFix: total("toFix"), toCheck: total("toCheck"), notes: total("notes") },
  };
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** Where a finding is, for its line: the file and line of a render error, the template lines of a client finding, a link's text and URL. */
function where(finding: Finding): string | undefined {
  if (finding.kind === "render" && finding.file) {
    return `${finding.file}${finding.line ? `:${finding.line}${finding.column ? `:${finding.column}` : ""}` : ""}`;
  }
  if (finding.kind === "client" && finding.lines?.length) return `line${finding.lines.length > 1 ? "s" : ""} ${finding.lines.join(", ")}`;
  if (finding.kind === "link") return `${finding.label ? `“${truncate(finding.label, 30)}” → ` : ""}${finding.url ? truncate(finding.url, 60) : "(no URL)"}`;
  if (finding.kind === "image") return finding.url ? truncate(finding.url, 60) : "(no src)";
  return undefined;
}

/** One line per finding: `Button 1 · “Click me” → javascript:alert(1) · Email clients don't run javascript: links.` */
export function findingLine(finding: Finding): string {
  return [finding.block, where(finding), finding.message.split("\n")[0].trim()].filter(Boolean).join(" · ");
}

function count(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/** The report for a terminal: each template, worst first, with a line for each thing to fix or check, then a summary. */
export function formatCheckReport(report: CheckReport, options: { color?: boolean; dir?: string } = {}): string {
  const paint = (code: number) => (text: string) => (options.color ? `\u001b[${code}m${text}\u001b[0m` : text);
  const red = paint(31);
  const yellow = paint(33);
  const green = paint(32);
  const dim = paint(2);
  const lines: string[] = [];
  for (const template of report.templates) {
    const icon = template.toFix.length ? red("✗") : template.toCheck.length ? yellow("!") : green("✓");
    const about = template.mode ? `${template.mode}, ${Math.max(1, Math.round((template.bytes ?? 0) / 1024))} KB` : "doesn't render";
    const found = [
      template.toFix.length ? red(`${template.toFix.length} to fix`) : "",
      template.toCheck.length ? yellow(`${template.toCheck.length} to check`) : "",
      template.notes.length ? dim(count(template.notes.length, "note")) : "",
    ].filter(Boolean);
    lines.push(`${icon} ${template.path} ${dim(`(${about})`)}${found.length ? `: ${found.join(", ")}` : ""}`);
    for (const finding of template.toFix) lines.push(`    ${red("fix  ")}  ${findingLine(finding)}`);
    for (const finding of template.toCheck) lines.push(`    ${yellow("check")}  ${findingLine(finding)}`);
  }
  const { summary } = report;
  if (!summary.templates) {
    lines.push(`No templates${options.dir ? ` in ${options.dir}` : ""}. Templates are .tsx, .jsx or .js files with an export default.`);
    return `${lines.join("\n")}\n`;
  }
  const found =
    summary.toFix || summary.toCheck ? `${red(`${summary.toFix} to fix`)}, ${yellow(`${summary.toCheck} to check`)}` : green("nothing to fix or check");
  const notes = summary.notes ? ` ${dim(`(${count(summary.notes, "note")}: --json lists them)`)}` : "";
  const offline = report.network ? "" : " Links and images weren't requested (--offline).";
  const strict = report.strict && !summary.toFix && summary.toCheck ? " With --strict, what's to check fails the check too." : "";
  lines.push("", `Checked ${count(summary.templates, "template")}: ${found}.${notes}${offline}${strict}`);
  return `${lines.join("\n")}\n`;
}
