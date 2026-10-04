/**
 * npx @unlayer/migrate — migrate React Email templates to Unlayer Elements.
 *
 * For each template: convert its source (props, loops and conditions stay),
 * then check the result: render the original and the migrated template with
 * the same props, compare the words they show, and check the design JSON the
 * visual editor would open. Only checked templates are written.
 */

import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, extname, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

export interface Io {
  cwd: string;
  stdout(text: string): void;
  stderr(text: string): void;
}

export const USAGE = `Migrate React Email templates to Unlayer Elements.

Usage:
  npx @unlayer/migrate <files or folders...> [options]
  npx @unlayer/migrate compare <original> <migrated>

Each template is converted (its props, loops and conditions stay), then
checked: the original and the migrated template are rendered with the
template's PreviewProps, every word the original shows must still be there,
and the visual editor must get every block. Nothing is written unless you ask:

  --write          Replace each template with its migrated version.
  --out <dir>      Write migrated templates to <dir>, keeping the folder
                   layout (relative imports are rewritten to still resolve).
  --design         Also write <name>.design.json next to each migrated
                   template, for the visual editor's loadDesign(). Text
                   props shown as given become merge tags ({{name}}).
  --no-merge-tags  Keep the sample values in the design JSON instead.
  --report <file>  Write the migration report (.md or .json).
  --force          Write templates even when the check finds a problem.
  --from <source>  What to migrate from (default and only: react-email).
  -h, --help       Show this help.

compare checks a template you migrated yourself against the original in the
same way: rendered with the original's PreviewProps (and each true/false prop
flipped), every word, link and image must be there, and the visual editor
must get every block.

Run it from your project folder: templates load with your project's React,
React Email and TypeScript paths. Exit code 0 when every template converted
and passed the check, 1 for a usage error or when no templates were found,
2 when a template failed to convert or the check found a problem.`;

/** What happened to one file. */
export interface FileResult {
  file: string;
  status: "migrated" | "check-failed" | "failed" | "skipped";
  /** Why it was skipped or failed. */
  reason?: string;
  /** Where the migrated template was written. */
  output?: string;
  design?: string;
  /** Share of content blocks that are editable Elements blocks (the rest are kept as HTML). */
  editable?: number;
  /** Blocks kept as HTML, with why. */
  kept?: Array<{ reason: string; detail?: string }>;
  /** What differs from the original, by kind. */
  differences?: Array<{ reason: string; count: number; examples: string[] }>;
  /** What the migration did that doesn't change the look (components inlined, classes split). */
  changes?: Array<{ reason: string; count: number; examples: string[] }>;
  /** Words the original shows that the migrated template doesn't. */
  missingText?: string[];
  /** Links, image sources and image text the original has that the migrated template doesn't. */
  missingAttributes?: string[];
  /** Blocks the visual editor wouldn't get. */
  designWarnings?: string[];
  /** Problems with a boolean prop flipped (branches the preview props don't take). */
  variants?: Array<{ change: string; missing: string[]; missingAttributes: string[]; error?: string }>;
}

interface Options {
  write: boolean;
  out?: string;
  design: boolean;
  mergeTags: boolean;
  force: boolean;
}

type Library = typeof import("@unlayer/from-react-email");

export async function main(argv: string[], io: Io, library?: Library): Promise<number> {
  let args: Args;
  try {
    args = parseArgs(argv);
  } catch (error) {
    io.stderr(`${(error as Error).message}\n\n${USAGE}\n`);
    return 1;
  }
  if (args.flag("help")) {
    io.stdout(`${USAGE}\n`);
    return 0;
  }
  if (args.positional[0] === "compare") return compare(args.positional.slice(1), args, io, library);
  const from = args.option("from") ?? "react-email";
  if (from !== "react-email") {
    io.stderr(`Unknown --from "${from}". Supported: react-email.\n`);
    return 1;
  }
  if (!args.positional.length) {
    io.stderr(`Pass the templates to migrate (files or folders).\n\n${USAGE}\n`);
    return 1;
  }
  const options: Options = {
    write: args.flag("write"),
    out: args.option("out"),
    design: args.flag("design"),
    mergeTags: !args.flag("no-merge-tags"),
    force: args.flag("force"),
  };
  if (options.write && options.out !== undefined) {
    io.stderr("Use --write or --out, not both.\n");
    return 1;
  }

  const inputs = await collect(args.positional, io.cwd);
  if (inputs.missing.length) {
    io.stderr(`Not found: ${inputs.missing.join(", ")}\n`);
    return 1;
  }
  const candidates = inputs.files.filter((f) => f.reactEmail);
  if (!candidates.length) {
    io.stderr("No React Email templates found (files that import @react-email/*).\n");
    return 1;
  }

  // Reserve destinations before executing templates or making any writes.
  // Different input roots (or .tsx/.jsx siblings with --design) may collide.
  if (options.write || options.out !== undefined) {
    const destinations = new Map<string, string>();
    for (const input of candidates) {
      const target = outputPath(input, options, io.cwd);
      for (const destination of [target, ...(options.design ? [designPath(target)] : [])]) {
        const previous = destinations.get(destination);
        if (previous !== undefined) {
          io.stderr(`Inputs ${relative(io.cwd, previous)} and ${relative(io.cwd, input.path)} have the same output: ${relative(io.cwd, destination)}. Pass their common parent folder or use separate output folders.\n`);
          return 1;
        }
        destinations.set(destination, input.path);
      }
    }
  }

  const lib = library ?? ((await import("@unlayer/from-react-email")) as Library);
  const results: FileResult[] = [];
  for (const input of candidates) {
    const result = await migrateFile(input, options, lib, io);
    results.push(result);
    io.stdout(`${line(result)}\n`);
  }

  io.stdout(`\n${summary(results, options)}\n`);
  const reportFile = args.option("report");
  if (reportFile) {
    const target = resolve(io.cwd, reportFile);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, reportFile.endsWith(".json") ? `${JSON.stringify(results, null, 2)}\n` : markdownReport(results));
    io.stdout(`Report: ${relative(io.cwd, target)}\n`);
  }
  return results.some((r) => r.status === "failed" || r.status === "check-failed") ? 2 : 0;
}

// ============================================
// One template
// ============================================

interface Input {
  path: string;
  /** The folder the output layout is relative to. */
  base: string;
  reactEmail: boolean;
}

function outputPath(input: Input, options: Options, cwd: string): string {
  return options.out !== undefined ? join(resolve(cwd, options.out), relative(input.base, input.path)) : input.path;
}

function designPath(target: string): string {
  return join(dirname(target), `${basename(target, extname(target))}.design.json`);
}

async function migrateFile(input: Input, options: Options, lib: Library, io: Io): Promise<FileResult> {
  const file = input.path;
  const name = relative(io.cwd, file) || basename(file);
  const source = await readFile(file, "utf8");

  let Original: any;
  try {
    Original = defaultExport(await importFile(file, io.cwd));
  } catch (error) {
    return { file: name, status: "failed", reason: `couldn't load it: ${message(error)}` };
  }
  if (typeof Original !== "function") {
    return { file: name, status: "skipped", reason: "no default-exported component (a shared component or helper file)" };
  }
  const props = Original.PreviewProps ?? {};

  let tailwindConfig: Record<string, unknown> | undefined;
  try {
    tailwindConfig = await lib.templateTailwindConfig(Original, props);
  } catch {
    // The config written in the source is used instead.
  }

  let converted: Awaited<ReturnType<Library["convertSource"]>>;
  try {
    converted = await lib.convertSource(source, { fileName: file, tailwindConfig, loadModule: await moduleLoader(file) });
  } catch (error) {
    return { file: name, status: "failed", reason: `couldn't convert it: ${message(error)}` };
  }

  // Check it from a file next to the original, so its relative imports resolve.
  const extension = extname(file);
  const probe = join(dirname(file), `.${basename(file, extension)}.unlayer-migrate-${process.pid}-${Date.now()}${extension}`);
  let verification: Awaited<ReturnType<Library["verifyConversion"]>>;
  let design: unknown;
  let mergeTags: { used: string[]; kept: string[] } | undefined;
  try {
    await writeFile(probe, converted.code);
    const Migrated = defaultExport(await importFile(probe, io.cwd));
    if (typeof Migrated !== "function") throw new Error("the migrated file has no default export");
    verification = await lib.verifyConversion(Original, Migrated as (props: unknown) => ReturnType<typeof Original>, { props });
    design = verification.design;
    if (options.design && options.mergeTags) {
      const tagged = await lib.mergeTagDesign(Migrated as (props: unknown) => ReturnType<typeof Original>, props, verification.design);
      design = tagged.design;
      mergeTags = tagged;
    }
  } catch (error) {
    return { file: name, status: "failed", reason: `the migrated template doesn't render: ${message(error)}` };
  } finally {
    await rm(probe, { force: true });
  }

  const report = converted.report;
  const result: FileResult = {
    file: name,
    status:
      verification.missing.length || verification.missingAttributes.length || verification.designWarnings.length || verification.variants.length
        ? "check-failed"
        : "migrated",
    editable: report.nativeRatio,
    kept: report.fallbacks,
    differences: group(report.notes),
    changes: group([
      ...(report.info ?? []),
      ...(mergeTags?.used.length ? [{ reason: "text props became merge tags in the design JSON", detail: mergeTags.used.join(", ") }] : []),
      ...(mergeTags?.kept ?? []).map((path) => ({ reason: "text prop kept as its sample value in the design JSON (the template changes or tests it)", detail: path })),
    ]),
    missingText: verification.missing,
    missingAttributes: verification.missingAttributes,
    variants: verification.variants,
    designWarnings: verification.designWarnings,
  };

  const writing = options.write || options.out !== undefined;
  if (writing && (result.status === "migrated" || options.force)) {
    const target = outputPath(input, options, io.cwd);
    const code = target === file ? converted.code : lib.rebaseImports(converted.code, file, target);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, code);
    result.output = relative(io.cwd, target);
    if (options.design) {
      const designFile = designPath(target);
      await writeFile(designFile, `${JSON.stringify(design, null, 2)}\n`);
      result.design = relative(io.cwd, designFile);
    }
  }
  return result;
}

// ============================================
// compare: a template migrated by hand
// ============================================

async function compare(paths: string[], args: Args, io: Io, library?: Library): Promise<number> {
  if (paths.length !== 2) {
    io.stderr(`compare needs the original template and the migrated one.\n\n${USAGE}\n`);
    return 1;
  }
  const [originalPath, migratedPath] = paths.map((p) => resolve(io.cwd, p));
  for (const [given, path] of [[paths[0], originalPath], [paths[1], migratedPath]]) {
    if (!existsSync(path)) {
      io.stderr(`Not found: ${given}\n`);
      return 1;
    }
  }
  const lib = library ?? ((await import("@unlayer/from-react-email")) as Library);
  let Original: any;
  let Migrated: any;
  try {
    Original = defaultExport(await importFile(originalPath, io.cwd));
    Migrated = defaultExport(await importFile(migratedPath, io.cwd));
  } catch (error) {
    io.stderr(`Couldn't load the templates: ${message(error)}\n`);
    return 2;
  }
  if (typeof Original !== "function" || typeof Migrated !== "function") {
    io.stderr("Both files need a default-exported template component.\n");
    return 1;
  }
  let check: Awaited<ReturnType<Library["verifyConversion"]>>;
  try {
    check = await lib.verifyConversion(Original, Migrated, { props: Original.PreviewProps ?? {} });
  } catch (error) {
    io.stderr(`The migrated template doesn't render: ${message(error)}\n`);
    return 2;
  }
  const problems = [
    ...(check.missing.length ? [`lost text: ${quote(check.missing)}`] : []),
    ...(check.missingAttributes.length ? [`lost links/images: ${quote(check.missingAttributes)}`] : []),
    ...(check.designWarnings.length ? check.designWarnings.map((w) => `the editor wouldn't get: ${w}`) : []),
    ...check.variants.map((v) => `with ${v.change}: ${v.error ? `fails (${v.error})` : `lost ${quote([...v.missing, ...v.missingAttributes])}`}`),
  ];
  const name = `${relative(io.cwd, migratedPath)} against ${relative(io.cwd, originalPath)}`;
  if (!problems.length) {
    const flipped = Object.values(Original.PreviewProps ?? {}).filter((v) => typeof v === "boolean").length;
    io.stdout(`✓ ${name}: same words, links and images${flipped ? ` (also with each of ${flipped} true/false props flipped)` : ""}; the editor gets every block.\n`);
    return 0;
  }
  io.stdout(`✗ ${name}:\n${problems.map((p) => `  - ${p}`).join("\n")}\n`);
  return 2;
}

function group(notes: Array<{ reason: string; detail?: string }>): Array<{ reason: string; count: number; examples: string[] }> {
  const byReason = new Map<string, { count: number; examples: string[] }>();
  for (const note of notes) {
    const entry = byReason.get(note.reason) ?? { count: 0, examples: [] };
    entry.count++;
    if (note.detail && entry.examples.length < 5 && !entry.examples.includes(note.detail)) entry.examples.push(note.detail);
    byReason.set(note.reason, entry);
  }
  return [...byReason].map(([reason, { count, examples }]) => ({ reason, count, examples }));
}

// ============================================
// Output
// ============================================

function line(result: FileResult): string {
  switch (result.status) {
    case "skipped":
      return `- ${result.file}: skipped (${result.reason})`;
    case "failed":
      return `✗ ${result.file}: ${result.reason}`;
    default: {
      const editable = `${Math.round((result.editable ?? 0) * 100)}% editable`;
      const differences = result.differences?.length ? `, ${result.differences.length} kind${result.differences.length > 1 ? "s" : ""} of difference` : "";
      const written = result.output ? ` → ${result.output}` : "";
      if (result.status === "migrated") return `✓ ${result.file}: ${editable}${differences}${written}`;
      const problems = [
        ...(result.missingText?.length ? [`lost text: ${quote(result.missingText)}`] : []),
        ...(result.missingAttributes?.length ? [`lost links/images: ${quote(result.missingAttributes)}`] : []),
        ...(result.designWarnings?.length ? [`${result.designWarnings.length} block(s) the editor wouldn't get`] : []),
        ...(result.variants ?? []).map((v) => `with ${v.change}: ${v.error ? `fails (${v.error})` : `lost ${quote([...v.missing, ...v.missingAttributes])}`}`),
      ];
      return `✗ ${result.file}: check failed (${problems.join("; ")})${written}`;
    }
  }
}

function summary(results: FileResult[], options: Options): string {
  const count = (status: FileResult["status"]) => results.filter((r) => r.status === status).length;
  const parts = [
    `${count("migrated")} migrated and checked`,
    ...(count("check-failed") ? [`${count("check-failed")} failed the check`] : []),
    ...(count("failed") ? [`${count("failed")} failed`] : []),
    ...(count("skipped") ? [`${count("skipped")} skipped`] : []),
  ];
  const written = results.filter((r) => r.output).length;
  const next = options.write || options.out !== undefined ? `${written} written.` : "Nothing written: pass --write or --out <dir> to write the migrated templates.";
  return `${results.length} template${results.length > 1 ? "s" : ""}: ${parts.join(", ")}. ${next}`;
}

function markdownReport(results: FileResult[]): string {
  const lines = ["# React Email → Unlayer Elements migration", ""];
  lines.push("| Template | Result | Editable | Check | Differences |", "|---|---|---|---|---|");
  for (const r of results) {
    const check = r.status === "migrated" ? "passed" : r.status === "check-failed" ? "failed" : "-";
    const editable = r.editable === undefined ? "-" : `${Math.round(r.editable * 100)}%`;
    lines.push(`| ${r.file} | ${r.status}${r.reason ? `: ${r.reason}` : ""} | ${editable} | ${check} | ${r.differences?.length ?? 0} |`);
  }
  for (const r of results) {
    if (r.status === "skipped") continue;
    lines.push("", `## ${r.file}`, "");
    if (r.reason) lines.push(r.reason, "");
    if (r.output) lines.push(`Written to \`${r.output}\`${r.design ? ` (design JSON: \`${r.design}\`)` : ""}.`, "");
    if (r.missingText?.length) lines.push(`**Lost text:** ${quote(r.missingText)}`, "");
    if (r.missingAttributes?.length) lines.push(`**Lost links or images:** ${quote(r.missingAttributes)}`, "");
    if (r.designWarnings?.length) lines.push("**The editor wouldn't get:**", ...r.designWarnings.map((w) => `- ${w}`), "");
    if (r.variants?.length) {
      lines.push("**With a prop flipped:**", ...r.variants.map((v) => `- \`${v.change}\`: ${v.error ? `fails: ${v.error}` : `lost ${quote([...v.missing, ...v.missingAttributes])}`}`), "");
    }
    if (r.kept?.length) {
      lines.push("**Kept as HTML** (renders the same, not editable in the visual editor):");
      for (const k of r.kept) lines.push(`- ${k.reason}${k.detail ? `: ${k.detail}` : ""}`);
      lines.push("");
    }
    if (r.changes?.length) {
      lines.push("**What the migration did:**");
      for (const c of r.changes) lines.push(`- ${c.reason}${c.count > 1 ? ` (×${c.count})` : ""}${c.examples.length ? `: ${c.examples.map((e) => `\`${e}\``).join(", ")}` : ""}`);
      lines.push("");
    }
    if (r.differences?.length) {
      lines.push("**Differences from the original:**");
      for (const d of r.differences) lines.push(`- ${d.reason}${d.count > 1 ? ` (×${d.count})` : ""}${d.examples.length ? `: ${d.examples.map((e) => `\`${e}\``).join(", ")}` : ""}`);
      lines.push("");
    }
  }
  return `${lines.join("\n")}\n`;
}

function quote(words: string[]): string {
  const shown = words.slice(0, 12).map((w) => `"${w}"`).join(", ");
  return words.length > 12 ? `${shown} and ${words.length - 12} more` : shown;
}

function message(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).split("\n")[0];
}

// ============================================
// Files
// ============================================

const SOURCE = /\.(tsx|jsx|ts|js|mts|mjs)$/;
const IGNORED = new Set(["node_modules", ".git", ".next", "dist", "build", "out", ".turbo", "coverage"]);

async function collect(paths: string[], cwd: string): Promise<{ files: Input[]; missing: string[] }> {
  const files: Input[] = [];
  const missing: string[] = [];
  const seen = new Set<string>();
  const add = async (path: string, base: string) => {
    if (seen.has(path)) return;
    seen.add(path);
    const text = await readFile(path, "utf8");
    files.push({ path, base, reactEmail: /from\s+["'](@react-email\/[^"']+|react-email)["']/.test(text) });
  };
  for (const given of paths) {
    const path = resolve(cwd, given);
    if (!existsSync(path)) {
      missing.push(given);
      continue;
    }
    if ((await stat(path)).isDirectory()) {
      for (const file of await walk(path)) await add(file, path);
    } else {
      await add(path, dirname(path));
    }
  }
  return { files: files.sort((a, b) => a.path.localeCompare(b.path)), missing };
}

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || IGNORED.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(path)));
    else if (SOURCE.test(entry.name) && !/\.(test|spec|stories)\.[^.]+$/.test(entry.name) && !entry.name.endsWith(".d.ts")) out.push(path);
  }
  return out;
}

/** A module's default export (a CommonJS module arrives with its exports as the default). */
function defaultExport(mod: Record<string, any>): unknown {
  let value = mod.default;
  if (value && typeof value === "object" && !("$$typeof" in value) && "default" in value) value = value.default;
  return value;
}

/** Import a .tsx/.ts file with React's automatic JSX runtime, honoring the project's tsconfig paths. */
async function importFile(path: string, cwd: string): Promise<Record<string, any>> {
  const url = pathToFileURL(path).href;
  if (/\.(mjs|cjs|js)$/.test(path)) return import(`${url}?t=${Date.now()}`);
  const { tsImport } = (await import("tsx/esm/api")) as { tsImport: (specifier: string, options: { parentURL: string; tsconfig?: string }) => Promise<any> };
  const tsconfig = join(tmpdir(), `unlayer-migrate-tsconfig-${process.pid}-${Date.now()}.json`);
  const base = findUp("tsconfig.json", dirname(path));
  await writeFile(
    tsconfig,
    JSON.stringify({
      ...(base ? { extends: base } : {}),
      compilerOptions: { jsx: "react-jsx", jsxImportSource: "react" },
      // Imports outside the template folder need the same JSX runtime too.
      include: [...new Set([cwd, dirname(path), ...(base ? [dirname(base)] : [])])]
        .map((root) => join(root, "**/*").split(sep).join("/")),
    })
  );
  try {
    return await tsImport(url, { parentURL: pathToFileURL(join(cwd, "noop.js")).href, tsconfig });
  } finally {
    await rm(tsconfig, { force: true });
  }
}

/**
 * Reads the project files a template imports (relative paths and tsconfig
 * aliases, resolved the way TypeScript does), so the components in them can
 * be inlined. Packages in node_modules aren't read.
 */
async function moduleLoader(file: string): Promise<(specifier: string, fromFile: string) => { fileName: string; source: string } | undefined> {
  const ts = (await import("typescript")).default;
  const configFile = ts.findConfigFile(dirname(file), ts.sys.fileExists);
  const options = configFile
    ? ts.parseJsonConfigFileContent(ts.readConfigFile(configFile, ts.sys.readFile).config ?? {}, ts.sys, dirname(configFile)).options
    : { allowJs: true, jsx: ts.JsxEmit.ReactJSX };
  return (specifier, fromFile) => {
    const resolved = ts.resolveModuleName(specifier, fromFile, { ...options, allowJs: true }, ts.sys).resolvedModule;
    const target = resolved?.resolvedFileName;
    if (!target || resolved.isExternalLibraryImport || target.includes(`${sep}node_modules${sep}`) || target.endsWith(".d.ts")) return undefined;
    const text = ts.sys.readFile(target);
    return text === undefined ? undefined : { fileName: target, source: text };
  };
}

function findUp(name: string, from: string): string | undefined {
  for (let dir = from; ; dir = dirname(dir)) {
    const candidate = join(dir, name);
    if (existsSync(candidate)) return candidate;
    if (dirname(dir) === dir) return undefined;
  }
}

// ============================================
// Arguments
// ============================================

interface Args {
  positional: string[];
  option(name: string): string | undefined;
  flag(name: string): boolean;
}

const VALUE_OPTIONS = new Set(["out", "report", "from"]);
const FLAGS = new Set(["write", "design", "no-merge-tags", "force", "help"]);
const ALIASES: Record<string, string> = { h: "help", o: "out" };

function parseArgs(argv: string[]): Args {
  const positional: string[] = [];
  const values = new Map<string, string>();
  const flags = new Set<string>();
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("-") || arg === "-") {
      positional.push(arg);
      continue;
    }
    const [rawName, inline] = arg.replace(/^--?/, "").split(/=(.*)/s, 2);
    const name = ALIASES[rawName] ?? rawName;
    if (VALUE_OPTIONS.has(name)) {
      const value = inline ?? argv[++i];
      if (value === undefined) throw new Error(`--${name} needs a value.`);
      if (!value.trim()) throw new Error(`--${name} needs a non-empty value.`);
      values.set(name, value);
    } else if (FLAGS.has(name)) {
      flags.add(name);
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  return { positional, option: (name) => values.get(name), flag: (name) => flags.has(name) };
}
