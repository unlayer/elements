/**
 * Which files in the templates folder are templates. The same rules as React
 * Email's preview, so a folder moved from it lists the same templates:
 *
 * - `.js`, `.jsx` and `.tsx` files with an `export default`;
 * - folders whose name starts with `_` are skipped (`_components`), as are
 *   `static/` (files the preview serves), `node_modules` and dot folders.
 */

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export const TEMPLATE_EXTENSIONS = new Set([".js", ".jsx", ".tsx"]);
const EXPORT_DEFAULT = /\bexport\s+default\b/;

export interface TemplateEntry {
  /** Path relative to the templates folder, with `/` separators: `onboarding/welcome.tsx`. */
  path: string;
  /** File name without its extension: `welcome`. */
  name: string;
}

function skipFolder(name: string): boolean {
  return name.startsWith("_") || name.startsWith(".") || name === "node_modules" || name === "static";
}

/** Whether `source` is a template's source (has an `export default`). */
export function isTemplateSource(source: string): boolean {
  return EXPORT_DEFAULT.test(source);
}

/** Whether a file at `relative` (to the templates folder) could be a template, by its name and folders alone. */
export function isTemplatePath(relative: string): boolean {
  const parts = relative.split(/[\\/]/);
  if (parts.slice(0, -1).some(skipFolder)) return false;
  return TEMPLATE_EXTENSIONS.has(path.extname(relative));
}

/** The templates in `dir`, sorted by path. */
export async function discoverTemplates(dir: string): Promise<TemplateEntry[]> {
  const found: TemplateEntry[] = [];
  async function walk(folder: string, prefix: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(folder, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (!skipFolder(entry.name)) await walk(path.join(folder, entry.name), relative);
        continue;
      }
      if (!entry.isFile() || !TEMPLATE_EXTENSIONS.has(path.extname(entry.name))) continue;
      const source = await readFile(path.join(folder, entry.name), "utf8").catch(() => "");
      if (!isTemplateSource(source)) continue;
      found.push({ path: relative, name: entry.name.slice(0, -path.extname(entry.name).length) });
    }
  }
  await walk(dir, "");
  return found.sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * The absolute file for a template path from a request, or undefined when it
 * isn't inside the templates folder (`../`, absolute paths, skipped folders).
 */
export function resolveTemplatePath(dir: string, relative: string): string | undefined {
  if (typeof relative !== "string" || relative === "" || relative.includes("\0")) return undefined;
  if (path.isAbsolute(relative) || !isTemplatePath(relative)) return undefined;
  const file = path.resolve(dir, relative);
  const root = path.resolve(dir) + path.sep;
  return file.startsWith(root) ? file : undefined;
}

export interface TemplateSelection {
  selected: TemplateEntry[];
  /** What was asked for that names no template. */
  unknown: string[];
}

/**
 * The templates the command line names: paths relative to the templates folder
 * (`welcome.tsx`) or to the working directory (`emails/welcome.tsx`), with or
 * without the extension, or folders of templates (`billing`). Nothing named:
 * every template. They stay in the folder's order.
 */
export function selectTemplates(dir: string, requested: string[], templates: TemplateEntry[], cwd = process.cwd()): TemplateSelection {
  if (!requested.length) return { selected: templates, unknown: [] };
  const root = path.resolve(dir);
  const chosen = new Set<string>();
  const unknown: string[] = [];
  for (const arg of requested) {
    let hits: TemplateEntry[] = [];
    for (const file of [path.resolve(root, arg), path.resolve(cwd, arg)]) {
      const relative = path.relative(root, file).split(path.sep).join("/");
      if (relative.startsWith("..") || path.isAbsolute(relative)) continue;
      hits =
        relative === ""
          ? templates
          : templates.filter((t) => t.path === relative || t.path.startsWith(`${relative}/`) || t.path.slice(0, -path.extname(t.path).length) === relative);
      if (hits.length) break;
    }
    if (hits.length) for (const t of hits) chosen.add(t.path);
    else unknown.push(arg);
  }
  return { selected: templates.filter((t) => chosen.has(t.path)), unknown };
}

/** What to say when the command line names templates that aren't there. */
export function unknownTemplatesMessage(unknown: string[], dirShown: string, templates: TemplateEntry[]): string {
  const names = templates.map((t) => t.path);
  const listed = names.length > 8 ? `${names.slice(0, 8).join(", ")} and ${names.length - 8} more` : names.join(", ");
  return [
    `No template ${unknown.join(", ")} in ${dirShown}. Name templates by their path in the templates folder (or from here), or a folder of them.`,
    names.length ? `Its templates: ${listed}` : `It has no templates: they're .tsx, .jsx or .js files with an export default.`,
  ].join("\n");
}
