/**
 * npx @unlayer/migrate — migrate React Email templates to Unlayer Elements.
 *
 * For each template: convert its source (props, loops and conditions stay),
 * then check the result: render the original and the migrated template with
 * the same props, compare the words they show, and check the design JSON the
 * visual editor would open. Only checked templates are written.
 */

import { existsSync } from "node:fs";
import { lstat, mkdir, open, readFile, readdir, realpath, rename, rm, rmdir, stat } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import Module, { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
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
template's PreviewProps, every word must be preserved without extra words,
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
  /** Words the migrated template shows that the original doesn't. */
  addedText?: string[];
  /** Links, image sources and image text the original has that the migrated template doesn't. */
  missingAttributes?: string[];
  /** Blocks the visual editor wouldn't get. */
  designWarnings?: string[];
  /** Problems with a boolean prop flipped (branches the preview props don't take). */
  variants?: Array<{ change: string; missing: string[]; added: string[]; missingAttributes: string[]; error?: string }>;
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

  const reportFile = args.option("report");
  let destinations: Destinations;
  try {
    destinations = await reserveDestinations(inputs.files, candidates, options, reportFile, io.cwd);
  } catch (error) {
    io.stderr(`${message(error)}\n`);
    return 1;
  }

  const lib = library ?? ((await import("@unlayer/from-react-email")) as Library);
  const dependencies = options.write ? await importedInputs(inputs.files) : new Map<string, string>();
  const results: FileResult[] = [];
  const pending: Array<{ result: FileResult; writes: PendingWrite[] }> = [];
  for (const input of candidates) {
    const importer = dependencies.get(input.path);
    if (importer) {
      results.push({ file: relative(io.cwd, input.path), status: "skipped", reason: `imported by ${relative(io.cwd, importer)}: its markup is inlined into the templates that use it` });
      continue;
    }
    const { writes = [], ...result } = await migrateFile(input, options, lib, io, destinations);
    results.push(result);
    pending.push({ result, writes });
  }

  for (const { result, writes } of pending) {
    try {
      for (const write of writes) {
        await writeDestination(write.path, write.text, destinations);
        result[write.kind] = relative(io.cwd, write.path);
      }
    } catch (error) {
      result.status = "failed";
      result.reason = `couldn't write output: ${message(error)}`;
    }
  }
  for (const result of results) io.stdout(`${line(result)}\n`);
  io.stdout(`\n${summary(results, options)}\n`);
  if (reportFile) {
    const target = resolve(io.cwd, reportFile);
    try {
      await writeDestination(target, reportFile.endsWith(".json") ? `${JSON.stringify(results, null, 2)}\n` : markdownReport(results), destinations);
    } catch (error) {
      io.stderr(`Couldn't write report: ${message(error)}\n`);
      return 2;
    }
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

type Destinations = Map<string, { canonical: string; root?: string }>;

/** Resolve existing ancestors too, including symlinked directories. */
async function canonicalPath(path: string): Promise<string> {
  try {
    return await realpath(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT" || dirname(path) === path) throw error;
    return join(await canonicalPath(dirname(path)), basename(path));
  }
}

async function fileInfo(path: string) {
  try { return await lstat(path); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return undefined;
  }
}

async function safeDestination(path: string, root?: string): Promise<string> {
  const info = await fileInfo(path);
  if (info?.isSymbolicLink()) throw new Error(`Refusing symlink output: ${path}`);
  if (info && !info.isFile()) throw new Error(`Output isn't a regular file: ${path}`);
  const canonical = await canonicalPath(path);
  if (root) {
    // The chosen folder and its nested directories must remain real directories.
    // Ancestors above it may be platform links (for example macOS /tmp).
    for (let directory = dirname(path); ; directory = dirname(directory)) {
      if ((await fileInfo(directory))?.isSymbolicLink()) {
        throw new Error(`Refusing symlink output in output folder: ${directory}`);
      }
      if (directory === root) break;
      if (dirname(directory) === directory) throw new Error(`Output escapes the output folder: ${path}`);
    }
    const offset = relative(await canonicalPath(root), canonical);
    if (offset === ".." || offset.startsWith(`..${sep}`) || isAbsolute(offset)) {
      throw new Error(`Output escapes the output folder: ${path}`);
    }
  }
  return canonical;
}

async function reserveDestinations(inputs: Input[], candidates: Input[], options: Options, report: string | undefined, cwd: string): Promise<Destinations> {
  const sources = new Set(await Promise.all(inputs.map((input) => canonicalPath(input.path))));
  const destinations: Destinations = new Map();
  const owners = new Map<string, string>();
  const root = options.out !== undefined ? resolve(cwd, options.out) : undefined;
  const reserve = async (path: string, owner: string, outputRoot?: string, ownSource = false) => {
    const canonical = await safeDestination(path, outputRoot);
    if (sources.has(canonical) && !ownSource) throw new Error(`Output would overwrite a source input: ${relative(cwd, path)}. Use --write to replace a template itself.`);
    const previous = owners.get(canonical);
    if (previous !== undefined) throw new Error(`${previous} and ${owner} have the same output: ${relative(cwd, path)}. Use separate destinations.`);
    owners.set(canonical, owner);
    destinations.set(path, { canonical, root: outputRoot });
  };
  if (options.write || options.out !== undefined) {
    for (const input of candidates) {
      const target = outputPath(input, options, cwd);
      await reserve(target, relative(cwd, input.path), root, options.write && target === input.path);
      if (options.design) await reserve(designPath(target), relative(cwd, input.path), root);
    }
  }
  if (report) await reserve(resolve(cwd, report), "--report");
  return destinations;
}

async function checkDestination(path: string, destinations: Destinations): Promise<void> {
  const expected = destinations.get(path);
  if (!expected || await safeDestination(path, expected.root) !== expected.canonical) throw new Error(`Output destination changed: ${path}`);
}

async function writeExclusive(path: string, text: string, mode?: number): Promise<void> {
  const handle = await open(path, "wx", mode);
  try {
    try { await handle.writeFile(text); }
    finally { await handle.close(); }
  } catch (error) {
    await rm(path, { force: true });
    throw error;
  }
}

/** Replace the directory entry, rather than truncating a symlink/hard-link target. */
async function writeDestination(path: string, text: string, destinations: Destinations): Promise<void> {
  await checkDestination(path, destinations);
  await mkdir(dirname(path), { recursive: true });
  await checkDestination(path, destinations);
  const temporary = join(dirname(path), `.${basename(path)}.unlayer-write-${randomUUID()}`);
  let created = false;
  try {
    const mode = (await fileInfo(path))?.mode;
    await writeExclusive(temporary, text, mode);
    created = true;
    await checkDestination(path, destinations);
    await rename(temporary, path);
  } finally {
    if (created) await rm(temporary, { force: true });
  }
}

async function cleanProbeDirectories(directory: string, firstCreated: string | undefined): Promise<void> {
  if (!firstCreated) return;
  while (true) {
    try { await rmdir(directory); } catch { return; } // Never remove a directory that acquired content.
    if (directory === firstCreated) return;
    directory = dirname(directory);
  }
}

interface PendingWrite {
  path: string;
  text: string;
  kind: "output" | "design";
}

async function migrateFile(input: Input, options: Options, lib: Library, io: Io, destinations: Destinations): Promise<FileResult & { writes?: PendingWrite[] }> {
  const file = input.path;
  const name = relative(io.cwd, file) || basename(file);
  const source = await readFile(file, "utf8");

  const release: Array<() => void> = [];
  try {
    let Original: any;
    let props: Record<string, unknown>;
    try {
      const template = templateComponent(defaultExport(await importFile(file, io.cwd, release)));
      if (!template) return { file: name, status: "skipped", reason: "no default-exported component (a shared component or helper file)" };
      Original = template.component;
      props = template.props;
    } catch (error) {
      return { file: name, status: "failed", reason: `couldn't load it: ${message(error)}` };
    }

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

    // Verify the final rebased source in its destination directory before writing
    // the target. This also checks file-relative resources and module resolution.
    const writing = options.write || options.out !== undefined;
    const target = writing ? outputPath(input, options, io.cwd) : file;
    const code = target === file ? converted.code : lib.rebaseImports(converted.code, file, target);
    const extension = extname(file);
    const probe = join(dirname(target), `.${basename(file, extension)}.unlayer-migrate-${randomUUID()}${extension}`);
    let probeCreated = false;
    let firstCreated: string | undefined;
    let verification: Awaited<ReturnType<Library["verifyConversion"]>>;
    let design: unknown;
    let mergeTags: { used: string[]; kept: string[] } | undefined;
    try {
      if (writing) await checkDestination(target, destinations);
      firstCreated = await mkdir(dirname(probe), { recursive: true });
      if (writing) await checkDestination(target, destinations);
      await writeExclusive(probe, code);
      probeCreated = true;
      const Migrated = templateComponent(defaultExport(await importFile(probe, io.cwd, release)))?.component;
      if (!Migrated) throw new Error("the migrated file has no default export");
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
      if (probeCreated) await rm(probe, { force: true });
      await cleanProbeDirectories(dirname(probe), firstCreated);
    }

    const report = converted.report;
    const result: FileResult = {
      file: name,
      status:
        verification.missing.length || verification.added.length || verification.missingAttributes.length || verification.designWarnings.length || verification.variants.length
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
      addedText: verification.added,
      missingAttributes: verification.missingAttributes,
      variants: verification.variants,
      designWarnings: verification.designWarnings,
    };

    const writes: PendingWrite[] = [];
    if (writing && (result.status === "migrated" || options.force)) {
      writes.push({ path: target, text: code, kind: "output" });
      if (options.design) writes.push({ path: designPath(target), text: `${JSON.stringify(design, null, 2)}\n`, kind: "design" });
    }
    return { ...result, writes };
  } finally {
    for (const unregister of release.reverse()) unregister();
  }
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
  const release: Array<() => void> = [];
  try {
    let Original: any;
    let Migrated: any;
    let props: Record<string, unknown>;
    try {
      const original = templateComponent(defaultExport(await importFile(originalPath, io.cwd, release)));
      const migrated = templateComponent(defaultExport(await importFile(migratedPath, io.cwd, release)));
      if (!original || !migrated) {
        io.stderr("Both files need a default-exported template component.\n");
        return 1;
      }
      Original = original.component;
      Migrated = migrated.component;
      props = original.props;
    } catch (error) {
      io.stderr(`Couldn't load the templates: ${message(error)}\n`);
      return 2;
    }
    let check: Awaited<ReturnType<Library["verifyConversion"]>>;
    try {
      check = await lib.verifyConversion(Original, Migrated, { props });
    } catch (error) {
      io.stderr(`The migrated template doesn't render: ${message(error)}\n`);
      return 2;
    }
    const problems = [
      ...(check.missing.length ? [`lost text: ${quote(check.missing)}`] : []),
      ...(check.added.length ? [`extra text: ${quote(check.added)}`] : []),
      ...(check.missingAttributes.length ? [`lost links/images: ${quote(check.missingAttributes)}`] : []),
      ...(check.designWarnings.length ? check.designWarnings.map((w) => `the editor wouldn't get: ${w}`) : []),
      ...check.variants.map((v) => `with ${v.change}: ${variantProblems(v)}`),
    ];
    const name = `${relative(io.cwd, migratedPath)} against ${relative(io.cwd, originalPath)}`;
    if (!problems.length) {
      const flipped = Object.values(props).filter((v) => typeof v === "boolean").length;
      io.stdout(`✓ ${name}: same words, links and images${flipped ? ` (also with each of ${flipped} true/false props flipped)` : ""}; the editor gets every block.\n`);
      return 0;
    }
    io.stdout(`✗ ${name}:\n${problems.map((p) => `  - ${p}`).join("\n")}\n`);
    return 2;
  } finally {
    for (const unregister of release.reverse()) unregister();
  }
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
        ...(result.addedText?.length ? [`extra text: ${quote(result.addedText)}`] : []),
        ...(result.missingAttributes?.length ? [`lost links/images: ${quote(result.missingAttributes)}`] : []),
        ...(result.designWarnings?.length ? [`${result.designWarnings.length} block(s) the editor wouldn't get`] : []),
        ...(result.variants ?? []).map((v) => `with ${v.change}: ${variantProblems(v)}`),
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
    if (r.addedText?.length) lines.push(`**Extra text:** ${quote(r.addedText)}`, "");
    if (r.missingAttributes?.length) lines.push(`**Lost links or images:** ${quote(r.missingAttributes)}`, "");
    if (r.designWarnings?.length) lines.push("**The editor wouldn't get:**", ...r.designWarnings.map((w) => `- ${w}`), "");
    if (r.variants?.length) {
      lines.push("**With a prop flipped:**", ...r.variants.map((v) => `- \`${v.change}\`: ${variantProblems(v)}`), "");
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

function variantProblems(variant: NonNullable<FileResult["variants"]>[number]): string {
  return [
    ...(variant.error ? [`fails (${variant.error})`] : []),
    ...(variant.missing.length ? [`lost text: ${quote(variant.missing)}`] : []),
    ...(variant.added.length ? [`extra text: ${quote(variant.added)}`] : []),
    ...(variant.missingAttributes.length ? [`lost links/images: ${quote(variant.missingAttributes)}`] : []),
  ].join("; ");
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

function templateComponent(value: any): { component: any; props: Record<string, unknown> } | undefined {
  let props: Record<string, unknown> | undefined;
  let wrapped = false;
  const seen = new Set<unknown>();
  while (value && !seen.has(value)) {
    seen.add(value);
    props ??= value.PreviewProps;
    if (typeof value === "function") return { component: value, props: props ?? {} };
    if (value.$$typeof === Symbol.for("react.memo")) { value = value.type; wrapped = true; }
    else if (value.$$typeof === Symbol.for("react.forward_ref")) { value = value.render; wrapped = true; }
    else if ("$$typeof" in Object(value)) throw new Error("unsupported React template wrapper");
    else if (wrapped) throw new Error("the React template wrapper has no renderable component");
    else return undefined;
  }
  if (wrapped) throw new Error("the React template wrapper has no renderable component");
  return undefined;
}

/** CommonJS requires need the same project-first package resolution as hooks.ts. */
function sharedCjsPackages(cwd: string): () => void {
  type Resolve = (request: string, parent: NodeJS.Module | undefined, isMain?: boolean, options?: unknown) => string;
  const api = Module as typeof Module & { _resolveFilename: Resolve };
  const previous = api._resolveFilename;
  const project = createRequire(pathToFileURL(join(cwd, "noop.js")));
  const self = createRequire(import.meta.url);
  let resolving = false;
  const resolvePackage: Resolve = (request, parent, isMain, options) => {
    if (resolving || !/^(react|react-dom|@react-email\/[^/]+|react-email|@unlayer\/react-elements)(\/.*)?$/.test(request)) {
      return previous(request, parent, isMain, options);
    }
    resolving = true;
    try {
      try { return project.resolve(request); } catch { /* Try the importing module next. */ }
      try { return previous(request, parent, isMain, options); } catch { return self.resolve(request); }
    } finally { resolving = false; }
  };
  api._resolveFilename = resolvePackage;
  return () => { if (api._resolveFilename === resolvePackage) api._resolveFilename = previous; };
}

/** Import JSX and TypeScript with React's automatic JSX runtime, honoring the project's tsconfig paths. */
async function importFile(
  path: string,
  cwd: string,
  release: Array<() => void>,
): Promise<Record<string, any>> {
  release.push(sharedCjsPackages(cwd));
  const url = pathToFileURL(path).href;
  if (/\.(mjs|cjs|js)$/.test(path)) return import(`${url}?t=${Date.now()}`);
  const { tsImport } = await import("tsx/esm/api");
  const tsconfig = join(
    tmpdir(),
    `unlayer-migrate-tsconfig-${randomUUID()}.json`,
  );
  const base = findUp("tsconfig.json", dirname(path));
  const ts = (await import("typescript")).default;
  const compiler = base
    ? ts.parseJsonConfigFileContent(
        ts.readConfigFile(base, ts.sys.readFile).config ?? {},
        ts.sys,
        dirname(base),
      ).options
    : {};
  const paths = { ...compiler.paths };
  const pathBase =
    compiler.baseUrl ??
    (compiler as { pathsBasePath?: string }).pathsBasePath ??
    (base ? dirname(base) : cwd);
  for (const [alias, entries] of Object.entries(paths))
    paths[alias] = entries.map((entry) => resolve(pathBase, entry));
  // CJS imports bypass ESM hooks. Only supply Elements from the CLI when
  // the project doesn't have it, and retain the project's resolved aliases.
  try {
    createRequire(join(cwd, "noop.js")).resolve("@unlayer/react-elements");
  } catch {
    paths["@unlayer/react-elements"] = [
      createRequire(import.meta.url).resolve("@unlayer/react-elements"),
    ];
  }
  let created = false;
  try {
    const handle = await open(tsconfig, "wx");
    created = true;
    try {
      await handle.writeFile(
        JSON.stringify({
          ...(base ? { extends: base } : {}),
          compilerOptions: {
            allowJs: true,
            jsx: "react-jsx",
            jsxImportSource: "react",
            ...(Object.keys(paths).length ? { paths } : {}),
          },
          // Imports outside the template folder need the same JSX runtime too.
          include: [
            ...new Set([cwd, dirname(path), ...(base ? [dirname(base)] : [])]),
          ].map((root) => join(root, "**/*").split(sep).join("/")),
        }),
      );
    } finally {
      await handle.close();
    }
    const packageFile = findUp("package.json", dirname(path));
    const commonjs =
      path.endsWith(".cts") ||
      (!path.endsWith(".mts") &&
        (!packageFile ||
          JSON.parse(await readFile(packageFile, "utf8")).type !== "module"));
    if (!commonjs)
      return await tsImport(url, { parentURL: pathToFileURL(join(cwd, "noop.js")).href, tsconfig });
    // tsImport's ESM-to-CJS bridge can hand untransformed TSX to Node.
    // Scoped require takes the CJS transform directly. Its config is read
    // synchronously from TSX_TSCONFIG_PATH when registering the scope.
    const { register } = await import("tsx/cjs/api");
    const previous = process.env.TSX_TSCONFIG_PATH;
    const scope = (() => {
      try {
        process.env.TSX_TSCONFIG_PATH = tsconfig;
        return register({ namespace: randomUUID() });
      } finally {
        if (previous === undefined) delete process.env.TSX_TSCONFIG_PATH;
        else process.env.TSX_TSCONFIG_PATH = previous;
      }
    })();
    release.push(scope);
    return scope.require(path, pathToFileURL(join(cwd, "noop.js")));
  } finally {
    if (created) await rm(tsconfig, { force: true });
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

/** Keep shared source files available to importers that aren't migrated. */
async function importedInputs(inputs: Input[]): Promise<Map<string, string>> {
  const ts = (await import("typescript")).default;
  const scanned = new Map(await Promise.all(inputs.map(async (input) => [await canonicalPath(input.path), input.path] as const)));
  const dependencies = new Map<string, string>();
  for (const input of inputs) {
    const load = await moduleLoader(input.path);
    const file = ts.createSourceFile(input.path, await readFile(input.path, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const specifiers = new Set<string>();
    const visit = (node: import("typescript").Node) => {
      if ((ts.isImportDeclaration(node) && !node.importClause?.isTypeOnly) || (ts.isExportDeclaration(node) && !node.isTypeOnly)) {
        if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) specifiers.add(node.moduleSpecifier.text);
      } else if (ts.isImportEqualsDeclaration(node) && !node.isTypeOnly && ts.isExternalModuleReference(node.moduleReference)) {
        const value = node.moduleReference.expression;
        if (value && ts.isStringLiteral(value)) specifiers.add(value.text);
      } else if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === "require"))) {
        const value = node.arguments[0];
        if (value && ts.isStringLiteral(value)) specifiers.add(value.text);
      }
      ts.forEachChild(node, visit);
    };
    visit(file);
    for (const specifier of specifiers) {
      const loaded = load(specifier, input.path);
      if (!loaded) continue;
      const dependency = scanned.get(await canonicalPath(loaded.fileName));
      if (dependency && dependency !== input.path) dependencies.set(dependency, input.path);
    }
  }
  return dependencies;
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
