/**
 * npx @unlayer/migrate — migrate React Email templates to Unlayer Elements.
 *
 * For each template: convert its source (props, loops and conditions stay),
 * then check the result: render the original and the migrated template with
 * the same props, compare the words they show, and check the design JSON the
 * visual editor would open. Only checked templates are written.
 */

import { isUtf8 } from "node:buffer";
import { existsSync, readFileSync, realpathSync, rmSync, rmdirSync } from "node:fs";
import { lstat, mkdir, open, readFile, readdir, realpath, rename, rm, stat } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import Module, { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs, type Args } from "./args";
import { resolutionOrder, type Origin } from "./resolution";

export interface Io {
  cwd: string;
  /**
   * The folder the converter's React, React Email and Elements resolve from
   * (the command sets it up before the CLI loads: see bin.ts). Without it, the
   * current folder.
   */
  project?: string;
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
  --strict         Fail (and don't write) a template the check finds any
                   difference in, also in how it looks. Without it, every
                   template is written, with what looks different listed.
  --force          With --strict, write templates the check fails anyway.
  --overwrite      Replace files already at a destination that this run
                   didn't produce: what an earlier run wrote, or files
                   git can restore.
  --allow-dirty    Replace files git can't restore (changed since the last
                   commit, not committed, or not in a repository) with
                   --write, or with --overwrite. Without it, they're
                   refused, so git can always undo a migration.
  --from <source>  What to migrate from (default and only: react-email).
  -h, --help       Show this help.

compare checks a template you migrated yourself against the original in the
same way: rendered with the original's PreviewProps (and each true/false prop
flipped), every word, link and image must be there, and the visual editor
must get every block.

Run it from your project folder: templates load with your project's React,
React Email and TypeScript paths. Exit code 0 when every template converted
with the same content (what looks different is listed), 1 for a usage error
or when no templates were found, 2 when a template failed to convert, its
content differs (with --strict, anything differs), a file couldn't be read,
or the run couldn't go on.`;

/** What happened to one file. */
/** A style the migrated template shows differently, with the words it's on. */
export interface StyleChange {
  property: string;
  original: string;
  converted: string;
  words: string[];
  /** Only on screens at least this wide (a rule for wider screens than the desktop width checked, as `md:`). */
  width?: number;
  /** Only in dark mode. */
  dark?: true;
  /** Only on phones. */
  phone?: true;
}

export interface FileResult {
  file: string;
  status: "migrated" | "check-failed" | "failed" | "skipped";
  /** Why it was skipped or failed. */
  reason?: string;
  /** Where the migrated template was written. */
  output?: string;
  design?: string;
  /**
   * Web fonts the design uses. Register them when you create the editor
   * (`fonts: { customFonts }`): it then shows them and links them in its export.
   */
  fonts?: Array<{ label: string; value: string; url: string }>;
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
  /** Links, image sources and image text the migrated template has that the original doesn't. */
  addedAttributes?: string[];
  /** Style values computed from props that the migrated template drops: they change how it looks. */
  lostStyles?: string[];
  /** Those of them that show or hide content: the migrated template shows it whatever the props (content). */
  lostShown?: string[];
  /**
   * How the migrated template looks different from the original, one line per kind (a style, where words
   * sit, CSS the check doesn't verify): it's written anyway, to fix in the editor (with --strict, it fails).
   */
  looks?: string[];
  /** Text the migrated template shows in another style (size, bold, italics, letter case, underline, color, background, a link's target). */
  styles?: StyleChange[];
  /**
   * What the check couldn't verify, with why: a style, or whether words are
   * shown, that the original (or the migration) sets in a way it can't read.
   * The check fails on it.
   */
  unverified?: Array<{ what: string; side: "original" | "migrated"; cause: string; words: string[]; width?: number }>;
  /** At a phone's width: words, links and images the original shows there that the migrated template doesn't, and the other way round. */
  phone?: { missing: string[]; added: string[]; missingAttributes?: string[]; addedAttributes?: string[] };
  /** Text and images that sit elsewhere across the page on desktop (a column stacked or moved, a block on the other side), and how far. */
  layout?: Array<{ items: string[]; by: number }>;
  /** How much of the styles the check compared: words, and properties left out because one side couldn't be worked out. */
  styleCoverage?: { words: number; unknown: number };
  /** Blocks the visual editor wouldn't get. */
  designWarnings?: string[];
  /** Problems with a boolean prop flipped (branches the preview props don't take). */
  variants?: Array<CheckParts & { change: string; error?: string }>;
}

/** A check's parts, as the library returns them (the main render's, or a flipped prop's). */
interface CheckParts {
  missing?: string[];
  added?: string[];
  missingAttributes?: string[];
  addedAttributes?: string[];
  styles?: StyleChange[];
  unverified?: FileResult["unverified"];
  phone?: FileResult["phone"];
  layout?: FileResult["layout"];
  lostShown?: string[];
}

interface Options {
  write: boolean;
  out?: string;
  design: boolean;
  mergeTags: boolean;
  force: boolean;
  /** Fail (and don't write) a template the check finds any difference in, also one in how it looks. */
  strict: boolean;
  /** Replace files at the destinations that this run didn't produce. */
  overwrite: boolean;
  /** With --write, replace templates git can't restore. */
  allowDirty: boolean;
}

type Library = typeof import("@unlayer/from-react-email");

export async function main(argv: string[], io: Io, library?: Library): Promise<number> {
  // Ctrl-C (or a kill) is heard for the whole run: once it comes, nothing more is written.
  watchSignals(true);
  try {
    return await run(argv, io, library);
  } finally {
    watchSignals(false);
  }
}

async function run(argv: string[], io: Io, library?: Library): Promise<number> {
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
    strict: args.flag("strict"),
    overwrite: args.flag("overwrite"),
    allowDirty: args.flag("allow-dirty"),
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
  // A template can use React Email only through the project's own components (a ui file).
  for (const input of inputs.files) {
    if (!input.reactEmail && !input.migrated) input.reactEmail = await reactEmailThroughProject(input.path);
  }
  const candidates = inputs.files.filter((f) => f.reactEmail);
  if (!candidates.length && inputs.unreadable.length) {
    for (const result of inputs.unreadable) io.stdout(`${line(result)}\n`);
    io.stdout(`\n${summary(inputs.unreadable, options)}\n`);
    return 2;
  }
  if (!candidates.length) {
    // Run again after --write (in CI): the templates are done.
    const done = inputs.files.filter((f) => f.migrated).length;
    if (done) {
      io.stdout(`${done} template${done === 1 ? "" : "s"} already migrated (importing @unlayer/react-elements): nothing to do.\n`);
      return 0;
    }
    io.stderr("No React Email templates found (files that import react-email or @react-email/*, or the project's components that do).\n");
    return 1;
  }

  // --write replaces the templates themselves: only ones git can give back as they were.
  if (options.write && !options.allowDirty) {
    const unsafe = await notRestorable(candidates.map((input) => input.path));
    if (unsafe.length) {
      io.stderr(
        `--write replaces templates in place, and git couldn't restore these:\n${unsafe.map((u) => `  ${relative(io.cwd, u.file)} (${u.why})`).join("\n")}\n` +
          "Commit them first (then git can undo the migration), write copies with --out <dir>, or pass --allow-dirty.\n"
      );
      return 1;
    }
  }

  const reportFile = args.option("report");
  let destinations: Destinations;
  try {
    destinations = await reserveDestinations(inputs.files, candidates, options, reportFile, io.cwd);
  } catch (error) {
    io.stderr(`${message(error)}\n`);
    return 1;
  }

  if (!supportedElements(io, candidates.map((input) => input.path))) return 1;
  // Checked where each template and its migrated copy load their packages from.
  const copies = otherCopies(io, candidates.flatMap((input) => [input.path, outputPath(input, options, io.cwd)]));
  if (copies) {
    io.stderr(`${copies}\n`);
    return 1;
  }
  const lib = library ?? ((await import("@unlayer/from-react-email")) as Library);
  const results: FileResult[] = [...inputs.unreadable];
  // Templates another one renders are left for now. With --write, a pass that writes the templates using one may
  // free it (the migrated ones render their own markup): it's tried again, until a pass writes nothing more.
  let todo = candidates;
  // A dry run's migrated templates, read in place of the files (it says what --write does).
  const wouldWrite = new Map<string, string>();
  for (;;) {
    // --out writes copies of every template.
    const used = options.out === undefined ? await importedInputs(inputs.files, wouldWrite) : { uses: new Map() as Uses, computed: [] };
    if (used.computed.length) {
      io.stderr(
        `These import a module by a path worked out when they run (import() or require with a computed path), so what they render can't be told, nor which files --write may replace:\n${used.computed.map((file) => `  ${relative(io.cwd, file)}`).join("\n")}\n` +
          "Write copies with --out <dir> instead, or migrate the templates that don't use them on their own.\n"
      );
      return 2;
    }
    const left: Array<{ input: Input; result: FileResult }> = [];
    const pending: Array<{ input: Input; result: FileResult; writes: PendingWrite[]; code?: string }> = [];
    for (const input of todo) {
      const use = used.uses.get(input.path);
      if (use && !use.through) {
        left.push({ input, result: { file: relative(io.cwd, input.path), status: "skipped", reason: `imported by ${relative(io.cwd, use.importer)}: its markup is inlined into the templates that use it` } });
        continue;
      }
      if (use?.through) {
        // Reached only through a module outside the folder, which may render it or only list or send it:
        // what it is decides. A shared piece is left as it is; an email of its own is migrated.
        const kind = await sharedPiece(await readFile(input.path, "utf8"));
        const via = `${relative(io.cwd, use.through)} (outside the folder)`;
        const by = relative(io.cwd, use.importer);
        if (kind === "shared") {
          results.push({ file: relative(io.cwd, input.path), status: "skipped", reason: `a shared piece (it takes content: children or a prop typed to hold JSX) that ${via} may render for ${by}: left as it is` });
          continue;
        }
        if (kind === "unknown") {
          results.push({ file: relative(io.cwd, input.path), status: "failed", reason: `imported through ${via} by ${by}, and whether it's an email of its own or a shared piece that module renders can't be told (its props aren't typed here): --write leaves it. If it's an email, migrate it on its own: npx @unlayer/migrate ${relative(io.cwd, input.path)} --write` });
          continue;
        }
      }
      const { writes = [], code, ...result } = await migrateFile(input, options, lib, io, destinations);
      results.push(result);
      pending.push({ input, result, writes, code });
    }
    let wrote = false;
    // A template edited since the run checked it with git: git couldn't give that edit back, so it isn't replaced.
    const edited = new Map<string, string>();
    if (options.write && !options.allowDirty) {
      const inPlace = pending.flatMap(({ writes }) => writes.filter((w) => w.replaces).map((w) => w.path));
      for (const { file, why } of inPlace.length ? await notRestorable(inPlace) : []) edited.set(file, why);
    }
    for (const { result, writes } of pending) {
      const changed = writes.find((w) => edited.has(w.path));
      if (changed) {
        result.status = "failed";
        result.reason = `it changed during the run, and git couldn't restore it (${edited.get(changed.path)}): not replaced. Commit it, then run again`;
        continue;
      }
      try {
        // The template replaced last: a design file that can't be written leaves it as it was.
        for (const write of [...writes].sort((a, b) => Number(a.kind === "output") - Number(b.kind === "output"))) {
          await writeDestination(write.path, write.text, destinations, write.replaces);
          result[write.kind] = relative(io.cwd, write.path);
          wrote ||= write.kind === "output";
        }
      } catch (error) {
        result.status = "failed";
        result.reason = `couldn't write output: ${message(error)}`;
      }
    }
    if (options.out === undefined && !options.write) {
      for (const { input, result, code } of pending) {
        if (result.status !== "migrated" || code === undefined) continue;
        wouldWrite.set(await canonicalPath(input.path), code);
        wrote = true;
      }
    }
    if (options.out !== undefined || !wrote || !left.length) {
      results.push(...left.map((l) => l.result));
      break;
    }
    todo = left.map((l) => l.input);
  }
  // An editor registers each font family once: give every template the stylesheet that loads what all of them use.
  const withFonts = results.filter((r) => r.fonts);
  lib.shareEditorFonts(withFonts.map((r) => r.fonts!)).forEach((fonts, i) => (withFonts[i].fonts = fonts));
  // In the templates' order (a later pass's after the first's otherwise), files it couldn't read first.
  const read = results.splice(inputs.unreadable.length).sort((a, b) => a.file.localeCompare(b.file));
  results.push(...read);
  for (const result of results) io.stdout(`${line(result)}\n`);
  io.stdout(`\n${summary(results, options)}\n`);
  // Files the run left that use a template it replaced (a component file, a helper that sends it): they now get Elements'.
  if (options.write) {
    const written = new Set(results.filter((r) => r.output).map((r) => resolve(io.cwd, r.file)));
    const left = new Set(inputs.files.filter((f) => !written.has(f.path)).map((f) => f.path));
    if (written.size && left.size) {
      const stale = [...(await importedInputs(inputs.files, undefined, left)).uses].filter(([file, use]) => written.has(file) && !use.through);
      if (stale.length) {
        io.stdout(`\nStill using a migrated template (send it with renderToHtml from @unlayer/react-elements, or render it in an Elements template):\n${stale.map(([file, use]) => `  ${relative(io.cwd, use.importer)} → ${relative(io.cwd, file)}`).join("\n")}\n`);
      }
    }
  }
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
  if (results.some((r) => r.status === "failed" || r.status === "check-failed")) return 2;
  // A run ends with 0 only when it checked what it was given: a template migrated, or nothing left to migrate.
  // A template left as it is because another file imports it wasn't checked either.
  const unchecked = results.some((r) => r.status === "skipped" && /its markup is inlined/.test(r.reason ?? ""));
  if (!results.some((r) => r.status === "migrated") && (unchecked || !results.some((r) => r.reason?.startsWith("already migrated")))) {
    io.stderr(
      unchecked
        ? "No email template was checked: the ones here are left as they are, as other files import them (see above). Migrate them with --out <dir>, or with the files that import them.\n"
        : "No email template was checked: nothing here renders React Email's <Html> (shared components and helpers are skipped).\n"
    );
    return 1;
  }
  return 0;
}

// ============================================
// One template
// ============================================

interface Input {
  path: string;
  /** The folder the output layout is relative to. */
  base: string;
  /** Imports React Email, or (a template) the project's files that do. */
  reactEmail: boolean;
  /** Imports @unlayer/react-elements: migrated already. */
  migrated: boolean;
}

function outputPath(input: Input, options: Options, cwd: string): string {
  return options.out !== undefined ? join(resolve(cwd, options.out), relative(input.base, input.path)) : input.path;
}

function designPath(target: string): string {
  return join(dirname(target), `${basename(target, extname(target))}.design.json`);
}

/** Each output, and whether a file already there may be replaced (the template itself with --write, the report, or --overwrite). */
type Destinations = Map<string, { canonical: string; root?: string; replace: boolean }>;

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
  const reserve = async (path: string, owner: string, outputRoot?: string, ownSource = false, replace = ownSource || options.overwrite) => {
    const canonical = await safeDestination(path, outputRoot);
    if (sources.has(canonical) && !ownSource) throw new Error(`Output would overwrite a source input: ${relative(cwd, path)}. Use --write to replace a template itself.`);
    // A file this run didn't scan or produce is someone's work: never replaced silently.
    if (!replace && (await fileInfo(path))) throw new Error(`Output already exists: ${relative(cwd, path)}. This run didn't produce it: choose an empty folder, or pass --overwrite to replace it.`);
    const previous = owners.get(canonical);
    if (previous !== undefined) throw new Error(`${previous} and ${owner} have the same output: ${relative(cwd, path)}. Use separate destinations.`);
    owners.set(canonical, owner);
    destinations.set(path, { canonical, root: outputRoot, replace });
  };
  if (options.write || options.out !== undefined) {
    for (const input of candidates) {
      const target = outputPath(input, options, cwd);
      await reserve(target, relative(cwd, input.path), root, options.write && target === input.path);
      if (options.design) await reserve(designPath(target), relative(cwd, input.path), root);
    }
  }
  // A report replaces the one a run wrote before; any other file only with --overwrite (it's someone's work).
  if (report) await reserve(resolve(cwd, report), "--report", undefined, false, options.overwrite || (await isReport(resolve(cwd, report))));
  // --overwrite replaces what a run wrote before, or what git can restore: never someone's work it can't (`--out .`
  // over an uncommitted welcome.tsx), unless --allow-dirty.
  const atRisk: string[] = [];
  if (!options.allowDirty) for (const [path, d] of destinations) if (d.replace && d.root !== undefined && !sources.has(d.canonical) && existsSync(path) && !(await isOutput(path))) atRisk.push(path);
  const unsafe = atRisk.length ? await notRestorable(atRisk) : [];
  if (unsafe.length) throw new Error(`--overwrite would replace ${unsafe.map((u) => `${relative(cwd, u.file)} (${u.why})`).join(", ")}, which a run didn't write and git can't restore. Commit it, choose a folder of its own for --out, or pass --allow-dirty.`);
  return destinations;
}

/** Whether a file is one a run wrote: a migrated template (its header) or a design (its rows and counters). */
async function isOutput(path: string): Promise<boolean> {
  const text = await readFile(path, "utf8").catch(() => "");
  if (/^\/\*\* @jsxRuntime automatic \*\/\r?\n\/\/ Migrated from React Email by @unlayer\/migrate/.test(text)) return true;
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed?.body?.rows) && typeof parsed?.counters === "object";
  } catch {
    return false;
  }
}

/** Whether a file is a report this CLI wrote (Markdown with its title, or JSON with its results), or nothing yet. */
async function isReport(path: string): Promise<boolean> {
  const text = await readFile(path, "utf8").catch(() => undefined);
  if (text === undefined) return true;
  if (text.startsWith("# React Email → Unlayer Elements migration")) return true;
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) && parsed.every((r) => r && typeof r.file === "string" && typeof r.status === "string");
  } catch {
    return false;
  }
}

async function checkDestination(path: string, destinations: Destinations): Promise<void> {
  const expected = destinations.get(path);
  if (!expected || await safeDestination(path, expected.root) !== expected.canonical) throw new Error(`Output destination changed: ${path}`);
}

async function writeExclusive(path: string, text: string, mode?: number): Promise<void> {
  const handle = await open(path, "wx", mode);
  try {
    try {
      await handle.writeFile(text);
      // The file's own permissions, as they were: creating it applies the umask (664 would become 644).
      if (mode !== undefined) await handle.chmod(mode & 0o7777);
    } finally { await handle.close(); }
  } catch (error) {
    await rm(path, { force: true });
    throw error;
  }
}

/** Replace the directory entry, rather than truncating a symlink/hard-link target. */
async function writeDestination(path: string, text: string, destinations: Destinations, replaces?: Buffer): Promise<void> {
  if (stoppedBy) throw new Error(`the run was stopped (${stoppedBy}): nothing more is written`);
  await checkDestination(path, destinations);
  await mkdir(dirname(path), { recursive: true });
  await checkDestination(path, destinations);
  // A new name each time: removing it never removes someone else's file.
  const temporary = join(dirname(path), `.${basename(path)}.unlayer-write-${randomUUID()}`);
  const remove = () => rmSync(temporary, { force: true });
  const release = removedOnExit(remove);
  try {
    const existing = await fileInfo(path);
    if (existing && !destinations.get(path)?.replace) throw new Error(`${path} appeared during the run: pass --overwrite to replace it`);
    await writeExclusive(temporary, text, existing?.mode);
    await checkDestination(path, destinations);
    // The template itself: only as it was converted (an edit made during the run isn't lost).
    if (replaces && !(await readFile(path).catch(() => undefined))?.equals(replaces)) throw new Error("it changed while the run converted it: not replaced, run again");
    await rename(temporary, path);
  } finally {
    release();
    remove();
  }
}

function cleanProbeDirectories(directory: string, firstCreated: string | undefined): void {
  if (!firstCreated) return;
  while (true) {
    try { rmdirSync(directory); } catch { return; } // Never remove a directory that acquired content.
    if (directory === firstCreated) return;
    directory = dirname(directory);
  }
}

// Temporary files go when the run ends however it ends: an error, Ctrl-C, a kill.
const cleanups = new Set<() => void>();
const SIGNALS = ["SIGINT", "SIGTERM", "SIGHUP"] as const;
/** The signal that stopped the run, if one did: nothing is written after it. */
let stoppedBy: NodeJS.Signals | undefined;
let watching = 0;

function cleanUp(): void {
  for (const cleanup of cleanups) {
    try { cleanup(); } catch { /* the rest still go */ }
  }
  cleanups.clear();
}

function interrupted(signal: NodeJS.Signals): void {
  stoppedBy = signal;
  cleanUp();
  for (const s of SIGNALS) process.off(s, interrupted);
  process.off("exit", cleanUp);
  // End as the signal would have without this handler.
  process.kill(process.pid, signal);
}

/**
 * Listens for the stop signals while a run lasts (runs inside one another count). Listeners stay for the whole
 * run: one removed while a signal waits to be handled (a long render) would swallow it.
 */
function watchSignals(on: boolean): void {
  watching += on ? 1 : -1;
  if (on && watching === 1) {
    stoppedBy = undefined;
    for (const signal of SIGNALS) process.on(signal, interrupted);
    process.on("exit", cleanUp);
  } else if (!on && watching === 0) {
    for (const signal of SIGNALS) process.off(signal, interrupted);
    process.off("exit", cleanUp);
  }
}

/** Run `cleanup` (synchronous) if the process ends before the returned release is called. */
function removedOnExit(cleanup: () => void): () => void {
  cleanups.add(cleanup);
  return () => {
    cleanups.delete(cleanup);
  };
}

interface PendingWrite {
  path: string;
  text: string;
  kind: "output" | "design";
  /** Written in place of the template itself: what it held when it was converted, which it must still hold. */
  replaces?: Buffer;
}

async function migrateFile(input: Input, options: Options, lib: Library, io: Io, destinations: Destinations): Promise<FileResult & { writes?: PendingWrite[]; code?: string }> {
  const file = input.path;
  const name = relative(io.cwd, file) || basename(file);
  const bytes = await readFile(file);
  const source = bytes.toString("utf8");
  // Run again on migrated templates (in CI, or after --write): they're done.
  if (await importsElements(file, source)) return { file: name, status: "skipped", reason: "already migrated: it imports @unlayer/react-elements" };
  // Checking a template runs its code and calls its default export: a helper (one that sends an email) is never loaded.
  const notLoaded = await notATemplate(file, source);
  if (notLoaded) return { file: name, status: notLoaded.fail ? "failed" : "skipped", reason: notLoaded.reason };
  // Text in another encoding (a Latin-1 é) reads as U+FFFD: it would be written back that way.
  if (!isUtf8(bytes)) return { file: name, status: "failed", reason: "it isn't saved as UTF-8 (another encoding, like Latin-1): save it as UTF-8, then run again" };

  const release: Array<() => void> = [];
  try {
    let Original: any;
    let props: Record<string, unknown>;
    let previewed = false;
    try {
      const template = templateComponent(defaultExport(await importFile(file, io, release)));
      if (!template) return { file: name, status: "skipped", reason: "no default-exported component (a shared component or helper file)" };
      Original = template.component;
      props = template.props;
      previewed = template.previewed;
    } catch (error) {
      // A .js file loads as plain JavaScript: JSX there doesn't parse.
      if (/\.(js|mjs|cjs)$/.test(file) && (await jsxInJs(source))) return { file: name, status: "failed", reason: "it has JSX in a .js file, which can't be loaded: rename it to .jsx" };
      return { file: name, status: "failed", reason: `couldn't load it: ${message(error)}` };
    }

    let tailwind: Awaited<ReturnType<Library["templateTailwind"]>>;
    try {
      tailwind = await lib.templateTailwind(Original, props);
    } catch {
      // The config written in the source is used instead.
    }

    let converted: Awaited<ReturnType<Library["convertSource"]>>;
    try {
      converted = await lib.convertSource(source, { fileName: file, tailwindConfig: tailwind?.config, tailwind: tailwind?.component, loadModule: await moduleLoader(file) });
    } catch (error) {
      return { file: name, status: "failed", reason: `couldn't convert it: ${message(error)}` };
    }

    // Verify the final rebased source in its destination directory before writing
    // the target. This also checks file-relative resources and module resolution.
    const writing = options.write || options.out !== undefined;
    const target = writing ? outputPath(input, options, io.cwd) : file;
    const code = lineEndings(target === file ? converted.code : lib.rebaseImports(converted.code, file, target), source);
    // The check runs with this CLI's packages: a React Email package the template's project lacks would pass it and crash there.
    const missing = [...new Set([...code.matchAll(/from\s+["']((?:@react-email\/[^"'/]+|react-email|react-dom))(?:\/[^"']*)?["']/g)].map((m) => m[1]))].filter((name) => !hasPackage(file, name));
    if (missing.length) return { file: name, status: "failed", reason: `the migrated template imports ${missing.join(", ")}, which this project doesn't have: install it (npm install ${missing.join(" ")})` };
    const extension = extname(file);
    // A new name each time: removing it never removes someone else's file.
    const probe = join(dirname(target), `.${basename(file, extension)}.unlayer-migrate-${randomUUID()}${extension}`);
    let firstCreated: string | undefined;
    const removeProbe = () => {
      rmSync(probe, { force: true });
      cleanProbeDirectories(dirname(probe), firstCreated);
    };
    const releaseProbe = removedOnExit(removeProbe);
    let verification: Awaited<ReturnType<Library["verifyConversion"]>>;
    let design: unknown;
    let mergeTags: { used: string[]; kept: string[] } | undefined;
    try {
      if (writing) await checkDestination(target, destinations);
      try {
        firstCreated = await mkdir(dirname(probe), { recursive: true });
        if (writing) await checkDestination(target, destinations);
        await writeExclusive(probe, code);
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (!code || !["EACCES", "EPERM", "EROFS"].includes(code)) throw error;
        return { file: name, status: "failed", reason: `can't write a temporary copy ${target === file ? "next to it" : "in its output folder"} to check it (read-only folder)` };
      }
      const migrated = templateComponent(defaultExport(await importFile(probe, io, release, file)));
      // Checked as exported (memo and forwardRef included), the way users render it.
      const Migrated = migrated?.exported;
      if (!Migrated) throw new Error("the migrated file has no default export");
      // The migrated preview props are the original's with their JSX converted (classes become styles): the design uses them.
      const designProps = Object.keys(migrated.props).length ? migrated.props : props;
      verification = await lib.verifyConversion(Original, Migrated as (props: unknown) => ReturnType<typeof Original>, { props, designProps });
      // A component that doesn't render <Html> is a shared piece (a footer, a button), not an email:
      // replacing it would turn it into a whole email inside the templates that use it.
      // A dry run says what --write does; --out writes copies of them too.
      if (options.out === undefined && !/<html[\s>]/i.test(verification.originalHtml)) return { file: name, status: "skipped", reason: "not an email template (it doesn't render <Html>): a shared component, left as it is" };
      // Nor is a layout templates wrap: one that renders its children, or takes content in props typed to hold JSX
      // (`content: ReactNode`). This holds when an import of it can't be followed.
      // One with PreviewProps is an email of its own (React Email previews it), with optional content passed in.
      if (options.out === undefined && !previewed && (await sharedPiece(source)) === "shared") return { file: name, status: "skipped", reason: "a layout (it renders content passed to it), not an email template: a shared component, left as it is" };
      design = verification.design;
      if (options.design && options.mergeTags) {
        const tagged = await lib.mergeTagDesign(Migrated as (props: unknown) => ReturnType<typeof Original>, designProps, verification.design, { source: code, helpers: converted.helpers });
        design = tagged.design;
        mergeTags = tagged;
      }
    } catch (error) {
      const original = await originalFailure(Original, props, io.cwd);
      if (original) return { file: name, status: "failed", reason: `the original template doesn't render: ${original}` };
      return { file: name, status: "failed", reason: `the migrated template doesn't render: ${renderFailure(error)}` };
    } finally {
      releaseProbe();
      removeProbe();
    }

    const report = converted.report;
    // Content the migration lost or added (or the editor wouldn't get) fails it: that's a converter bug, as anything it
    // can't map is kept as HTML. How it looks only differs: written and listed, to fix in the editor (not with --strict).
    const lostShown = report.lostShown ?? [];
    const failsContent = contentProblems({ ...verification, lostShown }).length || verification.designWarnings.length || verification.variants.some((v) => v.error || contentProblems(v).length);
    const lostLooks = (report.lostStyles ?? []).filter((style) => !lostShown.includes(style));
    const looks = [
      ...lookProblems(verification),
      ...phoneWidths(verification.originalHtml),
      ...(lostLooks.length ? [`lost styles: ${lostLooks.join("; ")}`] : []),
      ...verification.variants.filter((v) => !v.error && !contentProblems(v).length).map((v) => `with ${v.change}: ${lookProblems(v).join("; ")}`),
    ];
    const result: FileResult = {
      file: name,
      status: failsContent || (options.strict && looks.length) ? "check-failed" : "migrated",
      ...(looks.length ? { looks } : {}),
      editable: report.nativeRatio,
      kept: report.fallbacks,
      differences: group(report.notes),
      changes: group([
        ...(report.info ?? []),
        ...(mergeTags?.used.length ? [{ reason: "text props became merge tags in the design JSON", detail: mergeTags.used.join(", ") }] : []),
        ...(mergeTags?.kept ?? []).map((path) => ({ reason: "text prop kept as its sample value in the design JSON (the template changes or tests it, or an image shows it)", detail: path })),
      ]),
      missingText: verification.missing,
      addedText: verification.added,
      missingAttributes: verification.missingAttributes,
      addedAttributes: verification.addedAttributes,
      ...(report.lostStyles?.length ? { lostStyles: report.lostStyles } : {}),
      ...(lostShown.length ? { lostShown } : {}),
      ...(verification.styles.length ? { styles: verification.styles } : {}),
      ...(verification.unverified.length ? { unverified: verification.unverified } : {}),
      ...(lib.phoneDiffers(verification.phone) ? { phone: verification.phone } : {}),
      ...(verification.layout.length ? { layout: verification.layout } : {}),
      styleCoverage: verification.styleCoverage,
      variants: verification.variants,
      designWarnings: verification.designWarnings,
      ...(options.design && verification.editorFonts.length ? { fonts: verification.editorFonts } : {}),
    };

    const writes: PendingWrite[] = [];
    // Every template is written: one whose content differs too, flagged (git or the original folder keeps it as it was).
    // With --strict, only one with no difference (or any, with --force).
    if (writing && (result.status === "migrated" || !options.strict || options.force)) {
      writes.push({ path: target, text: code, kind: "output", ...(resolve(target) === resolve(file) ? { replaces: bytes } : {}) });
      if (options.design) writes.push({ path: designPath(target), text: `${JSON.stringify(design, null, 2)}\n`, kind: "design" });
    }
    return { ...result, writes, code };
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
  if (!supportedElements(io, [originalPath, migratedPath])) return 1;
  const copies = otherCopies(io, [originalPath, migratedPath]);
  if (copies) {
    io.stderr(`${copies}\n`);
    return 1;
  }
  const lib = library ?? ((await import("@unlayer/from-react-email")) as Library);
  const release: Array<() => void> = [];
  try {
    let Original: any;
    let Migrated: any;
    let props: Record<string, unknown>;
    try {
      const original = templateComponent(defaultExport(await importFile(originalPath, io, release)));
      const migrated = templateComponent(defaultExport(await importFile(migratedPath, io, release)));
      if (!original || !migrated) {
        io.stderr("Both files need a default-exported template component.\n");
        return 1;
      }
      Original = original.component;
      Migrated = migrated.exported;
      props = original.props;
    } catch (error) {
      io.stderr(`Couldn't load the templates: ${message(error)}\n`);
      return 2;
    }
    let check: Awaited<ReturnType<Library["verifyConversion"]>>;
    try {
      check = await lib.verifyConversion(Original, Migrated, { props });
    } catch (error) {
      const original = await originalFailure(Original, props, io.cwd);
      io.stderr(original ? `The original template doesn't render: ${original}\n` : `The migrated template doesn't render: ${renderFailure(error)}\n`);
      return 2;
    }
    // The content must be the same; how it looks is listed (with --strict, it must be the same too).
    const found = [
      ...contentProblems(check),
      ...(check.designWarnings.length ? check.designWarnings.map((w) => `the editor wouldn't get: ${w}`) : []),
      ...check.variants.filter((v) => v.error || contentProblems(v).length).map((v) => `with ${v.change}: ${variantProblems(v)}`),
    ];
    const looks = [...lookProblems(check), ...phoneWidths(check.originalHtml), ...check.variants.filter((v) => !v.error && !contentProblems(v).length).map((v) => `with ${v.change}: ${lookProblems(v).join("; ")}`)];
    const name = `${relative(io.cwd, migratedPath)} against ${relative(io.cwd, originalPath)}`;
    const strict = args.flag("strict");
    if (!found.length && !(strict && looks.length)) {
      const flipped = Object.values(props).filter((v) => typeof v === "boolean").length;
      io.stdout(`✓ ${name}: same words, links and images${flipped ? ` (also with each of ${flipped} true/false props flipped)` : ""}; the editor gets every block.\n`);
      if (looks.length) io.stdout(`  It looks different:\n${looks.map((p) => `  - ${p}`).join("\n")}\n`);
      return 0;
    }
    io.stdout(`✗ ${name}:\n${[...found, ...looks].map((p) => `  - ${p}`).join("\n")}\n`);
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
      // How it looks that differs: written anyway, listed to fix in the editor.
      const looks = result.looks?.length ? `\n    looks different: ${result.looks.join("; ")}` : "";
      if (result.status === "migrated") return `✓ ${result.file}: ${editable}${differences}${written}${looks}`;
      const found = [
        ...contentProblems({ ...result, missing: result.missingText, added: result.addedText }),
        ...(result.designWarnings?.length ? [`${result.designWarnings.length} block(s) the editor wouldn't get`] : []),
        ...(result.variants ?? []).filter((v) => v.error || contentProblems(v).length).map((v) => `with ${v.change}: ${variantProblems(v)}`),
      ];
      // Its content differs (a converter bug: report it), or, with --strict, how it looks.
      return found.length
        ? `✗ ${result.file}: ${result.output ? "written, but its content differs" : "check failed"} (${found.join("; ")})${written}${looks}`
        : `✗ ${result.file}: check failed (looks different, with --strict)${written}${looks}`;
    }
  }
}

/** Moved text and images: `"Order", "Status" 149px to the left`. */
function moves(layout: NonNullable<FileResult["layout"]>): string {
  return layout.map((m) => `${quote(m.items)} ${Math.abs(m.by)}px to the ${m.by < 0 ? "left" : "right"}`).join("; ");
}

/** What couldn't be verified, one line per cause: `the color of "Hello", "world" (the rule \`.x:has(b)\` …)`. */
function unverifiedList(items: NonNullable<FileResult["unverified"]>): string {
  const name: Record<string, string> = { shown: "whether it's shown", "shown on phones": "whether a phone shows it", "where it sits": "where it sits across the page", look: "the look", size: "the size", bold: "the weight", italic: "italics", transform: "letter case", underline: "underline", color: "the color", background: "the background", target: "the link target" };
  return items
    .map((u) => `${name[u.what] ?? u.what} of ${quote(u.words)}${wider(u.width)} (${u.side === "migrated" ? "the migrated template writes " : ""}${u.cause})`)
    .join("; ");
}

function summary(results: FileResult[], options: Options): string {
  const count = (status: FileResult["status"]) => results.filter((r) => r.status === status).length;
  const looks = results.filter((r) => r.status === "migrated" && r.looks?.length).length;
  const parts = [
    `${count("migrated")} migrated and checked${looks ? ` (${looks} look${looks === 1 ? "s" : ""} different: see above)` : ""}`,
    ...(count("check-failed") ? [options.strict ? `${count("check-failed")} failed the check` : `${count("check-failed")} with content that differs (a converter bug: please report it)`] : []),
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
    const check = r.status === "migrated" ? (r.looks?.length ? "passed, looks different" : "passed") : r.status === "check-failed" ? "failed" : "-";
    const editable = r.editable === undefined ? "-" : `${Math.round(r.editable * 100)}%`;
    lines.push(`| ${r.file} | ${r.status}${r.reason ? `: ${r.reason}` : ""} | ${editable} | ${check} | ${r.differences?.length ?? 0} |`);
  }
  for (const r of results) {
    if (r.status === "skipped") continue;
    lines.push("", `## ${r.file}`, "");
    if (r.reason) lines.push(r.reason, "");
    if (r.output) lines.push(`Written to \`${r.output}\`${r.design ? ` (design JSON: \`${r.design}\`)` : ""}.`, "");
    if (r.fonts?.length) lines.push(`**Web fonts to register with the editor** (\`fonts.customFonts\`): ${r.fonts.map((f) => f.label).join(", ")}`, "");
    if (r.missingText?.length) lines.push(`**Lost text:** ${quote(r.missingText)}`, "");
    if (r.addedText?.length) lines.push(`**Extra text:** ${quote(r.addedText)}`, "");
    if (r.missingAttributes?.length) lines.push(`**Lost links or images:** ${quote(r.missingAttributes)}`, "");
    if (r.addedAttributes?.length) lines.push(`**Extra links or images:** ${quote(r.addedAttributes)}`, "");
    if (r.status === "migrated" && r.looks?.length) lines.push("Its content is the same; it looks different in the ways below. Written anyway: fix them in the editor.", "");
    if (r.lostShown?.length) lines.push("**Shown whatever the props** (the original shows or hides it by them):", ...r.lostShown.map((s) => `- ${s}`), "");
    const lostLooks = (r.lostStyles ?? []).filter((style) => !r.lostShown?.includes(style));
    if (lostLooks.length) lines.push("**Lost styles** (change how it looks):", ...lostLooks.map((s) => `- ${s}`), "");
    if (r.styles?.length) lines.push("**Shown in another style:**", ...r.styles.map((c) => `- ${c.property}: ${c.original} → ${c.converted}, on ${quote(c.words)}${wider(c.width)}`), "");
    if (r.unverified?.length) lines.push("**Couldn't verify** (what the check can't read):", ...unverifiedList(r.unverified).split("; ").map((line) => `- ${line}`), "");
    if (r.phone?.missing.length) lines.push(`**On phones, lost text:** ${quote(r.phone.missing)}`, "");
    if (r.phone?.added.length) lines.push(`**On phones, extra text:** ${quote(r.phone.added)}`, "");
    if (r.phone?.missingAttributes?.length) lines.push(`**On phones, lost links or images:** ${quote(r.phone.missingAttributes)}`, "");
    if (r.phone?.addedAttributes?.length) lines.push(`**On phones, extra links or images:** ${quote(r.phone.addedAttributes)}`, "");
    if (r.layout?.length) lines.push(`**Moved across the page:** ${moves(r.layout)}`, "");
    if (r.styleCoverage?.words) lines.push(`Styles compared on ${r.styleCoverage.words} words${r.styleCoverage.unknown ? ` (${r.styleCoverage.unknown} values couldn't be worked out, and were left out)` : ""}.`, "");
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
  return [...(variant.error ? [`fails (${variant.error})`] : []), ...problems(variant)].join("; ");
}

/**
 * What a check found, one line per kind: the run, `compare` and each flipped
 * prop all fail on the same list, so a part of the check can't be read in one
 * place and missed in another.
 */
function problems(check: CheckParts): string[] {
  return [...contentProblems(check), ...lookProblems(check)];
}

/** Whether words show (or whether that can be told), as opposed to how they look. */
const SHOWN = new Set(["shown", "shown on phones"]);

/**
 * CSS the check doesn't read that adds words (`::before { content: "Sale:" }`) or hides them (an ellipsis, a line
 * clamp, a clipping `overflow`): which words a reader gets, not how they look.
 */
// A list's numbering (`list item: decimal from 3` where the other side has `disc`) is words a reader reads too.
const WORDS_LOOK = /::(before|after) \{ content|`content( \(unread\))?`|text-overflow|line-clamp|`overflow|`list item: [^`]*\b(decimal|alpha|roman|latin|greek|armenian|georgian|hebrew|cjk|type [aAiI1]|from|reversed|value)\b/;
const wordsLook = (u: { what: string; cause: string }) => u.what === "look" && WORDS_LOOK.test(u.cause);

/**
 * What the reader gets that differs: words, links and images lost or added (on desktop or phones, or out of
 * order), whether they show where that can't be told, and inbox-preview text shown in the email.
 */
function contentProblems(check: CheckParts): string[] {
  const shown = check.unverified?.filter((u) => SHOWN.has(u.what)) ?? [];
  const words = check.unverified?.filter(wordsLook) ?? [];
  const preview = check.styles?.filter((c) => c.property === "shown") ?? [];
  return [
    ...(check.missing?.length ? [`lost text: ${quote(check.missing)}`] : []),
    ...(check.added?.length ? [`extra text: ${quote(check.added)}`] : []),
    ...(check.missingAttributes?.length ? [`lost links/images: ${quote(check.missingAttributes)}`] : []),
    ...(check.addedAttributes?.length ? [`extra links/images: ${quote(check.addedAttributes)}`] : []),
    ...(preview.length ? [`shown in another place: ${styleChanges(preview)}`] : []),
    ...(shown.length ? [`couldn't verify: ${unverifiedList(shown)}`] : []),
    ...(words.length ? [`words CSS adds or hides, which the check doesn't read: ${unverifiedList(words)}`] : []),
    ...(check.phone?.missing.length ? [`on phones, lost text: ${quote(check.phone.missing)}`] : []),
    ...(check.phone?.added.length ? [`on phones, extra text: ${quote(check.phone.added)}`] : []),
    ...(check.phone?.missingAttributes?.length ? [`on phones, lost links/images: ${quote(check.phone.missingAttributes)}`] : []),
    ...(check.phone?.addedAttributes?.length ? [`on phones, extra links/images: ${quote(check.phone.addedAttributes)}`] : []),
    ...(check.lostShown?.length ? [`shown whatever the props, where the original shows or hides it by them: ${check.lostShown.join("; ")}`] : []),
  ];
}

/** Elements' phone settings (and what shows only on phones or only on desktop) apply at this width and under. */
const ELEMENTS_PHONE = 480;

/**
 * The widths the original's phone styles apply under (`max-width: 600px`, Tailwind's `max-sm:`), where they aren't
 * Elements': between the two, a reader gets the desktop version on one side and the phone one on the other. The check
 * reads a phone at 375px and a desktop at 700px, so it doesn't compare them there: said, for the user to look at.
 */
function phoneWidths(html: string): string[] {
  // Each width, and whether a rule under it shows or hides something.
  const widths = new Map<number, boolean>();
  const px = (n: string, unit: string) => Math.round(Number(n) * (/r?em/i.test(unit) ? 16 : 1));
  for (const m of html.matchAll(/@media([^{]*)\{/gi)) {
    const query = m[1].replace(/\s+/g, " ");
    const upper =
      /max-(?:device-)?width\s*:\s*([\d.]+)(px|r?em)/i.exec(query) ??
      /\bwidth\s*<=?\s*([\d.]+)(px|r?em)/i.exec(query) ??
      (/not all and/i.test(query) ? /min-width\s*:\s*([\d.]+)(px|r?em)/i.exec(query) : null);
    if (!upper || (/min-(?:device-)?width/i.test(query) && !/not all and/i.test(query))) continue;
    const width = px(upper[1], upper[2]);
    if (Math.abs(width - ELEMENTS_PHONE) <= 1) continue;
    // The block's rules, to its closing brace.
    const from = (m.index ?? 0) + m[0].length;
    let at = from;
    for (let depth = 1; at < html.length && depth > 0; at++) {
      if (html[at] === "{") depth++;
      else if (html[at] === "}") depth--;
    }
    const shows = /\b(display|visibility|max-height|mso-hide)\s*:/i.test(html.slice(from, at));
    widths.set(width, (widths.get(width) ?? false) || shows);
  }
  return [...widths]
    .sort(([a], [b]) => a - b)
    .map(([width, shows]) => {
      const [low, high, version] = width > ELEMENTS_PHONE ? [ELEMENTS_PHONE + 1, width, "desktop"] : [width + 1, ELEMENTS_PHONE, "phone"];
      const what = shows ? `the ${version} version, with what shows only on ${version === "phone" ? "phones" : "desktop"}` : `its ${version} styles`;
      return `the original's phone styles apply up to ${width}px, Elements' up to ${ELEMENTS_PHONE}px: between ${low}px and ${high}px the migration shows ${what}`;
    });
}

/** How it looks that differs: a style, where words sit, CSS the check doesn't model (or can't read). */
function lookProblems(check: CheckParts): string[] {
  const styles = check.styles?.filter((c) => c.property !== "shown") ?? [];
  const unverified = check.unverified?.filter((u) => !SHOWN.has(u.what) && !wordsLook(u)) ?? [];
  return [
    ...(styles.length ? [`shown in another style: ${styleChanges(styles)}`] : []),
    ...(unverified.length ? [`couldn't verify: ${unverifiedList(unverified)}`] : []),
    ...(check.layout?.length ? [`moved: ${moves(check.layout)}`] : []),
  ];
}

/** Style changes in a line: "color #e11d48 → #000000 on "Hello", "world"". */
function styleChanges(changes: StyleChange[]): string {
  return changes.map((c) => `${c.property} ${c.original} → ${c.converted} on ${quote(c.words)}${wider(c.width)}${c.dark ? " in dark mode" : ""}${c.phone ? " on phones" : ""}`).join("; ");
}

/** " on screens 768px and wider", for a difference only wider screens than the desktop width show. */
function wider(width: number | undefined): string {
  return width ? ` on screens ${width}px and wider` : "";
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
const REACT_EMAIL_IMPORT = /from\s+["'](@react-email\/[^"']+|react-email)["']/;
const IGNORED = new Set(["node_modules", ".git", ".next", "dist", "build", "out", ".turbo", "coverage"]);

async function collect(paths: string[], cwd: string): Promise<{ files: Input[]; missing: string[]; unreadable: FileResult[] }> {
  const files: Input[] = [];
  const missing: string[] = [];
  const unreadable: FileResult[] = [];
  const seen = new Set<string>();
  const add = async (path: string, base: string) => {
    if (seen.has(path)) return;
    seen.add(path);
    let text: string;
    try {
      text = await readFile(path, "utf8");
    } catch (error) {
      // A link to a file that's gone, or one without read permission: it fails, the others still run.
      const code = (error as NodeJS.ErrnoException).code;
      const why = code === "ENOENT" ? "it links to a file that doesn't exist" : code === "EACCES" || code === "EPERM" ? "no permission to read it" : message(error);
      unreadable.push({ file: relative(cwd, path), status: "failed", reason: `couldn't read it: ${why}` });
      return;
    }
    files.push({ path, base, reactEmail: REACT_EMAIL_IMPORT.test(text), migrated: await importsElements(path, text) });
  };
  for (const given of paths) {
    const path = resolve(cwd, given);
    if (!existsSync(path)) {
      missing.push(given);
      continue;
    }
    if ((await stat(path)).isDirectory()) {
      const links: string[] = [];
      for (const file of await walk(path, links)) await add(file, path);
      // Listed, as a template there would otherwise be left out without a word.
      for (const link of links) unreadable.push({ file: relative(cwd, link), status: "skipped", reason: "a symbolic link to a folder, not followed: give the folder (or the link itself) to migrate what's in it" });
    } else {
      await add(path, dirname(path));
    }
  }
  return { files: files.sort((a, b) => a.path.localeCompare(b.path)), missing, unreadable };
}

/** Whether a module imports Elements: an import or export from it, not a comment or a string that names it. */
async function importsElements(path: string, source: string): Promise<boolean> {
  if (!source.includes("@unlayer/react-elements")) return false;
  const ts = (await import("typescript")).default;
  const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, /\.m?ts$/.test(path) ? ts.ScriptKind.TS : ts.ScriptKind.TSX);
  // Types only (`import type { EmailProps }`) don't make a template migrated: it still renders with React Email.
  const typesOnly = (s: import("typescript").ImportDeclaration | import("typescript").ExportDeclaration) => {
    if (ts.isExportDeclaration(s)) return s.isTypeOnly;
    const clause = s.importClause;
    const named = clause?.namedBindings && ts.isNamedImports(clause.namedBindings) ? clause.namedBindings.elements : undefined;
    return !!clause && (clause.isTypeOnly || (!clause.name && !!named?.length && named.every((e) => e.isTypeOnly)));
  };
  const fromElements = file.statements.filter(
    (s): s is import("typescript").ImportDeclaration | import("typescript").ExportDeclaration =>
      (ts.isImportDeclaration(s) || ts.isExportDeclaration(s)) &&
      !!s.moduleSpecifier &&
      ts.isStringLiteral(s.moduleSpecifier) &&
      s.moduleSpecifier.text === "@unlayer/react-elements" &&
      !typesOnly(s)
  );
  // Re-exporting Elements (or importing it for its effects) counts as using it.
  if (fromElements.some((s) => ts.isExportDeclaration(s) || !s.importClause)) return true;
  // Otherwise a name it imports must be used as a value (a component, a call): a type imported without `type`
  // (`import { EmailProps } from …` in a React Email template) doesn't make it migrated.
  const names = new Set<string>();
  for (const s of fromElements) {
    const clause = (s as import("typescript").ImportDeclaration).importClause!;
    if (clause.name) names.add(clause.name.text);
    const bindings = clause.namedBindings;
    if (bindings && ts.isNamespaceImport(bindings)) names.add(bindings.name.text);
    else if (bindings) for (const e of bindings.elements) if (!e.isTypeOnly) names.add(e.name.text);
  }
  let used = false;
  const visit = (node: import("typescript").Node): void => {
    if (used || ts.isImportDeclaration(node) || ts.isTypeNode(node) || ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) return;
    if (ts.isIdentifier(node) && names.has(node.text)) {
      const parent = node.parent;
      // Not a property's name (`a.Email`, `{ Email: 1 }`): the binding itself.
      if (!((ts.isPropertyAccessExpression(parent) && parent.name === node) || (ts.isPropertyAssignment(parent) && parent.name === node) || (ts.isJsxAttribute(parent) && parent.name === node))) used = true;
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return used;
}

/** The source files in a folder and the ones in it; a symbolic link to a folder isn't followed, but goes in `links`. */
async function walk(dir: string, links: string[] = []): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || IGNORED.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isSymbolicLink() && (await stat(path).catch(() => undefined))?.isDirectory()) links.push(path);
    else if (entry.isDirectory()) out.push(...(await walk(path, links)));
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

function templateComponent(value: any): { component: any; exported: any; props: Record<string, unknown>; previewed: boolean } | undefined {
  const exported = value;
  let props: Record<string, unknown> | undefined;
  let wrapped = false;
  const seen = new Set<unknown>();
  while (value && !seen.has(value)) {
    seen.add(value);
    props ??= value.PreviewProps;
    if (typeof value === "function") return { component: value, exported, props: props ?? {}, previewed: props !== undefined };
    if (value.$$typeof === Symbol.for("react.memo")) { value = value.type; wrapped = true; }
    else if (value.$$typeof === Symbol.for("react.forward_ref")) { value = value.render; wrapped = true; }
    else if ("$$typeof" in Object(value)) throw new Error("unsupported React template wrapper");
    else if (wrapped) throw new Error("the React template wrapper has no renderable component");
    else return undefined;
  }
  if (wrapped) throw new Error("the React template wrapper has no renderable component");
  return undefined;
}

/**
 * Why the original template doesn't render, or undefined when it does: when a
 * check fails, the migration isn't to blame for that.
 */
async function originalFailure(Original: any, props: Record<string, unknown>, cwd: string): Promise<string | undefined> {
  try {
    const [{ default: React }, { render }] = await Promise.all([import("react"), import("@react-email/components")]);
    await render(React.createElement(Original, props));
    return undefined;
  } catch (error) {
    const text = message(error);
    // JSX compiled the classic way (React.createElement) in a file the project's JSX settings don't reach:
    // the first JSX file in the stack (a path, or a URL with the loader's query).
    const frame = /React is not defined/.test(text) ? /((?:file:\/\/)?\/[^\s()?]+?\.[cm]?[jt]sx)(?:\?[^\s()]*?)?:\d+/.exec((error as Error).stack ?? "")?.[1] : undefined;
    const file = frame?.startsWith("file:") ? fileURLToPath(frame) : frame;
    return file ? `${text} in ${relative(cwd, file)}, which was loaded without the project's JSX settings` : text;
  }
}

/** Why a migrated template doesn't render. */
function renderFailure(error: unknown): string {
  return message(error);
}

/** The migrated code with the source's line endings: CRLF when most of its lines end that way. */
function lineEndings(code: string, source: string): string {
  const crlf = source.match(/\r\n/g)?.length ?? 0;
  return crlf && crlf * 2 >= (source.match(/\n/g)?.length ?? 0) ? code.replace(/\r?\n/g, "\r\n") : code;
}

/** Whether `name` is installed where `file` would find it (a node_modules folder above it). */
function hasPackage(file: string, name: string): boolean {
  for (let dir = dirname(file); ; dir = dirname(dir)) {
    if (existsSync(join(dir, "node_modules", name, "package.json"))) return true;
    if (dirname(dir) === dir) return false;
  }
}

/** CommonJS requires bypass the module hooks: they need the same order as hooks.ts. */
function sharedCjsPackages(projectFolder: string): () => void {
  type Resolve = (request: string, parent: NodeJS.Module | undefined, isMain?: boolean, options?: unknown) => string;
  const api = Module as typeof Module & { _resolveFilename: Resolve };
  const previous = api._resolveFilename;
  const project = createRequire(pathToFileURL(join(projectFolder, "noop.js")));
  const self = createRequire(import.meta.url);
  let resolving = false;
  const resolvePackage: Resolve = (request, parent, isMain, options) => {
    // A require never comes from the converter, which is an ES module.
    const order = resolving ? undefined : resolutionOrder(request, false);
    if (!order) return previous(request, parent, isMain, options);
    resolving = true;
    try {
      const from: Record<Origin, () => string> = {
        project: () => project.resolve(request),
        importer: () => previous(request, parent, isMain, options),
        self: () => self.resolve(request),
      };
      let failure: unknown;
      for (const origin of order) {
        try { return from[origin](); } catch (error) { failure ??= error; }
      }
      throw failure;
    } finally { resolving = false; }
  };
  api._resolveFilename = resolvePackage;
  return () => { if (api._resolveFilename === resolvePackage) api._resolveFilename = previous; };
}

/** Where `name` resolves from `folder` (its real path), or undefined when it isn't installed there. */
function resolveFrom(folder: string, name: string): string | undefined {
  try {
    return realpathSync(createRequire(join(folder, "noop.js")).resolve(name));
  } catch {
    return undefined;
  }
}

/**
 * The converter loads React Email and Elements once, from the project (the
 * folder of the first template given); a template, and its migrated copy, load
 * them from their own folder where it has them (hooks.ts). Where those differ
 * (two apps of a monorepo), the check would render with copies other than the
 * template's: say which folder to migrate in a run of its own.
 */
function otherCopies(io: Pick<Io, "cwd" | "project">, files: string[]): string | undefined {
  if (io.project === undefined) return undefined; // called directly: packages resolve as usual
  const self = dirname(fileURLToPath(import.meta.url));
  for (const name of ["@react-email/components", "@unlayer/react-elements"]) {
    const used = resolveFrom(io.project, name) ?? resolveFrom(self, name);
    for (const folder of new Set(files.map((file) => dirname(file)))) {
      const own = resolveFrom(folder, name);
      if (own && own !== used) {
        const where = relative(io.cwd, folder) || ".";
        return `${where} has its own ${name}, other than the one this run checks with (from ${relative(io.cwd, io.project) || "."}): migrate that folder in a run of its own (npx @unlayer/migrate ${where}), writing inside it.`;
      }
    }
  }
  return undefined;
}

function realpathOr(path: string): string {
  try {
    return realpathSync(path);
  } catch {
    return path;
  }
}

/** The monorepo `dir` is in: the nearest folder with pnpm-workspace.yaml, or a package.json with workspaces. */
function workspaceRoot(dir: string): string | undefined {
  for (let current = dir; ; current = dirname(current)) {
    if (existsSync(join(current, "pnpm-workspace.yaml"))) return current;
    try {
      if (JSON.parse(readFileSync(join(current, "package.json"), "utf8")).workspaces) return current;
    } catch {
      // no package.json here, or not one that parses
    }
    if (dirname(current) === current) return undefined;
  }
}

/** Whether JavaScript source only parses as JSX. */
async function jsxInJs(source: string): Promise<boolean> {
  const ts = (await import("typescript")).default;
  const errors = (fileName: string) => ts.transpileModule(source, { fileName, reportDiagnostics: true }).diagnostics?.length ?? 0;
  // TypeScript parses .js with JSX allowed: .ts and .tsx differ only in that.
  return errors("template.ts") > 0 && errors("template.tsx") === 0;
}

/** Import JSX and TypeScript with React's automatic JSX runtime, honoring the project's tsconfig paths. */
async function importFile(
  path: string,
  io: Pick<Io, "cwd" | "project">,
  release: Array<() => void>,
  // Whose project settings (tsconfig paths) apply: a migrated copy's are its template's, wherever it's written.
  configFrom = path,
): Promise<Record<string, any>> {
  const { cwd, project = io.cwd } = io;
  release.push(sharedCjsPackages(project));
  const url = pathToFileURL(path).href;
  if (/\.(mjs|cjs|js)$/.test(path)) return import(`${url}?t=${Date.now()}`);
  const { tsImport } = await import("tsx/esm/api");
  const tsconfig = join(
    tmpdir(),
    `unlayer-migrate-tsconfig-${randomUUID()}.json`,
  );
  const base = projectConfig(dirname(configFrom)) ?? projectConfig(dirname(path));
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
  // neither the template's folder nor the project has it (hooks.ts's order),
  // and retain the project's resolved aliases.
  if (!resolveFrom(dirname(path), "@unlayer/react-elements") && !resolveFrom(project, "@unlayer/react-elements")) {
    paths["@unlayer/react-elements"] = [
      createRequire(import.meta.url).resolve("@unlayer/react-elements"),
    ];
  }
  // tsx applies the JSX settings only to the files `include` lists, by their real
  // paths: a workspace package's TSX (outside the app) needs them too.
  const workspace = workspaceRoot(dirname(path));
  const roots = [cwd, dirname(path), ...(base ? [dirname(base)] : []), ...(workspace ? [workspace] : [])];
  const include = [...new Set(roots.flatMap((root) => [root, realpathOr(root)]))];
  const removeConfig = () => rmSync(tsconfig, { force: true });
  const releaseConfig = removedOnExit(removeConfig);
  try {
    const handle = await open(tsconfig, "wx");
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
          include: include.map((root) => join(root, "**/*").split(sep).join("/")),
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
    releaseConfig();
    removeConfig();
  }
}

/**
 * Reads the project files a template imports (relative paths and tsconfig
 * aliases, resolved the way TypeScript does, else the way Node does), so the
 * components in them can be inlined. Packages in node_modules aren't read.
 */
async function moduleLoader(file: string): Promise<(specifier: string, fromFile: string) => { fileName: string; source: string } | undefined> {
  const ts = (await import("typescript")).default;
  const configFile = projectConfig(dirname(file));
  const options = configFile
    ? ts.parseJsonConfigFileContent(ts.readConfigFile(configFile, ts.sys.readFile).config ?? {}, ts.sys, dirname(configFile)).options
    : { allowJs: true, jsx: ts.JsxEmit.ReactJSX };
  return (specifier, fromFile) => {
    // TypeScript's resolution can't follow what Node does at run time with `moduleResolution: node`
    // (a package's exports, #imports paths) or without a tsconfig: Node's own is the fallback.
    let target = ts.resolveModuleName(specifier, fromFile, { ...options, allowJs: true }, ts.sys).resolvedModule?.resolvedFileName;
    if (!target) {
      try { target = createRequire(fromFile).resolve(specifier); } catch { /* not a file Node finds either */ }
    }
    if (!target || !isAbsolute(target)) return undefined; // a builtin (node:fs)
    // A workspace package (linked into node_modules) is the project's own code: followed to its real path.
    try {
      target = realpathSync(target);
    } catch {
      // a file that's gone: as resolved
    }
    if (target.includes(`${sep}node_modules${sep}`) || target.endsWith(".d.ts")) return undefined;
    const text = ts.sys.readFile(target);
    return text === undefined ? undefined : { fileName: target, source: text };
  };
}

/** Reading what a module imports and passes on, to follow imports between the project's files. */
async function moduleSyntax(overlay?: Map<string, string>) {
  const ts = (await import("typescript")).default;
  // A file's text, or what a dry run would write in its place (by its real path).
  const text = async (path: string) => (overlay?.size && overlay.get(await canonicalPath(path))) || readFile(path, "utf8");
  const parse = async (path: string) => ts.createSourceFile(path, await text(path), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  /** A module's imports: local name → where it comes from and the name it has there (`*` for a namespace). */
  const importsOf = (file: import("typescript").SourceFile) => {
    const out = new Map<string, { specifier: string; imported: string }>();
    for (const statement of file.statements) {
      if (!ts.isImportDeclaration(statement) || statement.importClause?.isTypeOnly || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
      const specifier = statement.moduleSpecifier.text;
      const clause = statement.importClause;
      if (clause?.name) out.set(clause.name.text, { specifier, imported: "default" });
      const bindings = clause?.namedBindings;
      if (bindings && ts.isNamespaceImport(bindings)) out.set(bindings.name.text, { specifier, imported: "*" });
      else if (bindings) for (const e of bindings.elements) if (!e.isTypeOnly) out.set(e.name.text, { specifier, imported: (e.propertyName ?? e.name).text });
    }
    return out;
  };
  /**
   * The names a module passes on from other modules: `export … from` lines, and imports it exports
   * again (`import Shell from "./shell"; export { Shell }`, `export default Shell`). `*` for `export *`.
   */
  const reExports = async (path: string) => {
    const file = await parse(path);
    const imported = importsOf(file);
    const out: Array<{ specifier: string; exported: string; imported: string }> = [];
    for (const statement of file.statements) {
      if (ts.isExportAssignment(statement) && !statement.isExportEquals && ts.isIdentifier(statement.expression)) {
        const from = imported.get(statement.expression.text);
        if (from) out.push({ specifier: from.specifier, exported: "default", imported: from.imported });
      }
      if (!ts.isExportDeclaration(statement) || statement.isTypeOnly) continue;
      if (!statement.moduleSpecifier) {
        if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
          for (const e of statement.exportClause.elements) {
            const from = !e.isTypeOnly && imported.get((e.propertyName ?? e.name).text);
            if (from) out.push({ specifier: from.specifier, exported: e.name.text, imported: from.imported });
          }
        }
        continue;
      }
      if (!ts.isStringLiteral(statement.moduleSpecifier)) continue;
      const specifier = statement.moduleSpecifier.text;
      if (!statement.exportClause) out.push({ specifier, exported: "*", imported: "*" });
      else if (ts.isNamedExports(statement.exportClause)) {
        for (const e of statement.exportClause.elements) if (!e.isTypeOnly) out.push({ specifier, exported: e.name.text, imported: (e.propertyName ?? e.name).text });
      } else out.push({ specifier, exported: statement.exportClause.name.text, imported: "*" });
    }
    return out;
  };
  return { ts, parse, text, importsOf, reExports };
}

/**
 * Whether a template uses React Email through the project's own files: it
 * imports one that imports React Email (a ui file that wraps it or passes it
 * on), directly or through files that pass that one on.
 */
async function reactEmailThroughProject(path: string): Promise<boolean> {
  // A template the check can't load (a wrapped one) is still one: it fails, saying why.
  const not = await notATemplate(path, await readFile(path, "utf8"));
  if (not && !not.fail) return false;
  const { parse, importsOf, reExports } = await moduleSyntax();
  const load = await moduleLoader(path);
  const seen = new Set<string>();
  const reaches = async (from: string, specifier: string, depth = 0): Promise<boolean> => {
    const loaded = load(specifier, from);
    if (!loaded || depth > 8 || seen.has(loaded.fileName)) return false;
    seen.add(loaded.fileName);
    if (REACT_EMAIL_IMPORT.test(loaded.source)) return true;
    for (const next of await reExports(loaded.fileName).catch(() => [])) if (await reaches(loaded.fileName, next.specifier, depth + 1)) return true;
    return false;
  };
  for (const { specifier } of importsOf(await parse(path)).values()) if (await reaches(path, specifier)) return true;
  return false;
}

/** Who uses a scanned file's template, and how: straight, or through a module outside the folder. */
type Uses = Map<string, { importer: string; through?: string }>;

/**
 * A module's top-level names, for following only what an import uses: what
 * each export name is locally, what each local's declaration refers to (other
 * locals, imported names, modules imported by `import()`/`require`), and the
 * declarations its default export is: what migrating the file rewrites.
 */
interface ModuleShape {
  exports: Map<string, string>;
  refers: Map<string, { locals: Set<string>; imports: Set<string>; dynamic: string[]; computed: boolean }>;
  imports: Map<string, { specifier: string; imported: string }>;
  template: Set<string>;
  /**
   * The whole module's bare imports (`import "./x"`), modules imported by `import()`/`require`, and the
   * imported names its code uses, for a module used whole.
   */
  whole: { bare: string[]; dynamic: string[]; computed: boolean; imports: Set<string> };
  /** Whether it has ES exports (a CommonJS module counts as using everything it imports). */
  esm: boolean;
}

const DEFAULT = "<default>";

function shapeOf(ts: typeof import("typescript"), file: import("typescript").SourceFile, imports: ModuleShape["imports"]): ModuleShape {
  const exports = new Map<string, string>();
  const declarations = new Map<string, import("typescript").Node[]>();
  const declare = (name: string, node: import("typescript").Node) => declarations.set(name, [...(declarations.get(name) ?? []), node]);
  const bound = (name: import("typescript").BindingName, out: string[] = []): string[] => {
    if (ts.isIdentifier(name)) out.push(name.text);
    else for (const element of name.elements) if (!ts.isOmittedExpression(element)) bound(element.name, out);
    return out;
  };
  let esm = false;
  for (const statement of file.statements) {
    const modifiers = ts.canHaveModifiers(statement) ? ts.getModifiers(statement) ?? [] : [];
    const exported = modifiers.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    const isDefault = modifiers.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword);
    if (exported || ts.isExportAssignment(statement) || ts.isExportDeclaration(statement)) esm = true;
    if ((ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) && (statement.name || isDefault)) {
      const name = statement.name?.text ?? DEFAULT;
      declare(name, statement);
      if (exported) exports.set(isDefault ? "default" : name, name);
    } else if (ts.isVariableStatement(statement)) {
      for (const d of statement.declarationList.declarations) for (const name of bound(d.name)) {
        declare(name, d);
        if (exported) exports.set(name, name);
      }
    } else if (ts.isEnumDeclaration(statement)) {
      declare(statement.name.text, statement);
      if (exported) exports.set(statement.name.text, statement.name.text);
    } else if (ts.isExportAssignment(statement) && !statement.isExportEquals) {
      if (ts.isIdentifier(statement.expression)) exports.set("default", statement.expression.text);
      else {
        declare(DEFAULT, statement.expression);
        exports.set("default", DEFAULT);
      }
    } else if (ts.isExportDeclaration(statement) && !statement.moduleSpecifier && !statement.isTypeOnly && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
      for (const e of statement.exportClause.elements) if (!e.isTypeOnly) exports.set(e.name.text, (e.propertyName ?? e.name).text);
    } else if (ts.isExpressionStatement(statement)) {
      // `Welcome.PreviewProps = …`: part of what it names.
      let target: import("typescript").Expression = statement.expression;
      while (ts.isBinaryExpression(target) || ts.isPropertyAccessExpression(target) || ts.isElementAccessExpression(target) || ts.isCallExpression(target)) {
        target = ts.isBinaryExpression(target) ? target.left : target.expression;
      }
      if (ts.isIdentifier(target)) declare(target.text, statement);
    }
  }
  const refers: ModuleShape["refers"] = new Map();
  const read = (name: string, nodes: readonly import("typescript").Node[]) => {
    const found = { locals: new Set<string>(), imports: new Set<string>(), dynamic: [] as string[], computed: false };
    const visit = (node: import("typescript").Node) => {
      // A type (`ComponentProps<typeof Welcome>`) renders nothing: a name read only there isn't used (a class's
      // `extends Base` is a value).
      if (ts.isTypeNode(node) && !ts.isExpressionWithTypeArguments(node)) return;
      if (ts.isIdentifier(node)) {
        // A property's name (`a.b`, `{ b: 1 }`) names no binding.
        const parent = node.parent;
        const property = (ts.isPropertyAccessExpression(parent) && parent.name === node) || (ts.isPropertyAssignment(parent) && parent.name === node) || (ts.isJsxAttribute(parent) && parent.name === node);
        if (!property && node.text !== name && declarations.has(node.text)) found.locals.add(node.text);
        // `Welcome.PreviewProps` reads its sample data: it doesn't render the template.
        const preview = ts.isPropertyAccessExpression(parent) && parent.expression === node && parent.name.text === "PreviewProps";
        if (!property && !preview && imports.has(node.text)) found.imports.add(node.text);
      }
      if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === "require"))) {
        const argument = node.arguments[0];
        if (argument && (ts.isStringLiteral(argument) || ts.isNoSubstitutionTemplateLiteral(argument))) found.dynamic.push(argument.text);
        else if (argument) found.computed = true;
      }
      ts.forEachChild(node, visit);
    };
    nodes.forEach(visit);
    return found;
  };
  for (const [name, nodes] of declarations) refers.set(name, read(name, nodes));
  const all = read("", file.statements.filter((statement) => !ts.isImportDeclaration(statement)));
  const bare = file.statements.flatMap((statement) => (ts.isImportDeclaration(statement) && !statement.importClause && ts.isStringLiteral(statement.moduleSpecifier) ? [statement.moduleSpecifier.text] : []));
  // What the default export is, through `memo(…)`/`forwardRef(…)` and names: the declarations the migration rewrites.
  const template = new Set<string>();
  const reach = (name: string | undefined, depth = 0) => {
    if (!name || template.has(name) || depth > 5) return;
    template.add(name);
    for (const node of declarations.get(name) ?? []) {
      let value: import("typescript").Node | undefined = ts.isVariableDeclaration(node) ? node.initializer : ts.isExportAssignment(node) ? node.expression : node;
      while (value && (ts.isParenthesizedExpression(value) || ts.isAsExpression(value) || ts.isSatisfiesExpression(value))) value = value.expression;
      if (value && ts.isIdentifier(value)) reach(value.text, depth + 1);
      else if (value && ts.isCallExpression(value)) for (const argument of value.arguments) if (ts.isIdentifier(argument)) reach(argument.text, depth + 1);
    }
  };
  reach(exports.get("default"));
  return { exports, refers, imports, template, whole: { bare, dynamic: all.dynamic, computed: all.computed, imports: all.imports }, esm };
}

/** The locals `names` (export names) stand for and every local their declarations use. */
function closureOf(shape: ModuleShape, names: string[]): Set<string> {
  const out = new Set<string>();
  const add = (local: string) => {
    if (out.has(local)) return;
    out.add(local);
    for (const next of shape.refers.get(local)?.locals ?? []) add(next);
  };
  for (const name of names) {
    const local = shape.exports.get(name);
    if (local !== undefined) add(local);
  }
  return out;
}

/**
 * Keep shared source files available to importers that aren't migrated.
 * `overlay`: files a dry run would write, by real path, read in their place.
 */
async function importedInputs(inputs: Input[], overlay?: Map<string, string>, importers?: Set<string>): Promise<{ uses: Uses; computed: string[] }> {
  const { ts, parse, text, importsOf, reExports } = await moduleSyntax(overlay);
  const scanned = new Map(await Promise.all(inputs.map(async (input) => [await canonicalPath(input.path), input.path] as const)));
  const uses: Uses = new Map();
  const computed = new Set<string>();
  const shapes = new Map<string, Promise<ModuleShape | undefined>>();
  const shape = (path: string) => {
    if (!shapes.has(path)) shapes.set(path, parse(path).then((file) => shapeOf(ts, file, importsOf(file)), () => undefined));
    return shapes.get(path)!;
  };
  /**
   * The imports `names` of a module use: those their declarations refer to
   * (all of them for "all", or a CommonJS module), by module, with the names taken there.
   */
  const usedImports = (module: ModuleShape, names: string[] | "all", path: string) => {
    const everything = names === "all" || !module.esm;
    const locals = everything ? [...module.refers.keys()] : [...closureOf(module, names)];
    const taken = new Map<string, Set<string> | "all">();
    const take = (specifier: string, name: string) => {
      const known = taken.get(specifier);
      if (name === "*" || known === "all") taken.set(specifier, "all");
      else taken.set(specifier, (known ?? new Set<string>()).add(name));
    };
    // A module used whole uses the imports its code reads (a CommonJS one, all of them).
    const bindings = everything ? (module.esm ? [...module.whole.imports] : [...module.imports.keys()]) : locals.flatMap((local) => [...(module.refers.get(local)?.imports ?? [])]);
    for (const binding of bindings) {
      const from = module.imports.get(binding);
      if (from) take(from.specifier, from.imported);
    }
    for (const refers of everything ? [module.whole] : locals.map((local) => module.refers.get(local))) {
      for (const specifier of refers?.dynamic ?? []) take(specifier, "*");
      if (refers?.computed) computed.add(path);
    }
    if (everything) for (const specifier of module.whole.bare) take(specifier, "*");
    return [...taken].map(([specifier, names]) => ({ specifier, names: names === "all" ? ("all" as const) : [...names] }));
  };
  for (const input of inputs) {
    const load = await moduleLoader(input.path);
    const seen = new Set<string>();
    // Follow an import to the modules that define the names it takes, through re-export files, and on through what
    // those names use in the project's own modules (inside the folder or out). A scanned file is used when what's taken
    // from it reaches its template (the declaration its default export is): migrating it rewrites only that. `through`
    // is the first module outside the folder on the way: what's reached past it is judged by what it is (sharedPiece).
    const follow = async (from: string, specifier: string, names: string[] | "all", depth = 0, through?: string): Promise<void> => {
      const loaded = load(specifier, from);
      if (!loaded || depth > 12) return;
      const forwards = await reExports(loaded.fileName).catch(() => []);
      const forwarded = names === "all" ? forwards : forwards.filter((r) => r.exported === "*" || names.includes(r.exported));
      const canonical = await canonicalPath(loaded.fileName);
      const dependency = scanned.get(canonical);
      const module = await shape(loaded.fileName);
      const reached = !module || !module.esm || names === "all" ? true : [...closureOf(module, names)].some((local) => module.template.has(local));
      if (dependency && dependency !== input.path && reached && module?.template.size !== 0) {
        // Used straight (or through re-export files) wins over reached through another module.
        const known = uses.get(dependency);
        if (!known || (known.through && !through)) uses.set(dependency, { importer: input.path, ...(through ? { through } : {}) });
      }
      // `export *` passes the importer's names on; a namespace (`export * as Parts`) passes all of its own.
      for (const r of forwarded) await follow(loaded.fileName, r.specifier, r.imported !== "*" ? [r.imported] : r.exported === "*" ? names : "all", depth + 1, through);
      const key = `${canonical}\u0000${names === "all" ? "*" : [...names].sort().join(",")}`;
      if (!module || seen.has(key) || /[\\/]node_modules[\\/]/.test(canonical)) return;
      seen.add(key);
      for (const next of usedImports(module, names, loaded.fileName)) await follow(loaded.fileName, next.specifier, next.names, depth + 1, dependency ? through : (through ?? loaded.fileName));
    };
    // Only a template keeps what it imports: an index that lists the templates, or a route or helper that sends them,
    // doesn't. A template the check can't load (a wrapped one) still uses what it imports.
    // `importers`: the files to follow from instead, whatever they are.
    if (importers ? !importers.has(input.path) : await notATemplate(input.path, await text(input.path)).then((not) => not && !not.fail)) continue;
    const own = await shape(input.path);
    if (!own) continue;
    for (const next of usedImports(own, "all", input.path)) await follow(input.path, next.specifier, next.names);
  }
  return { uses, computed: [...computed] };
}

/**
 * Migrations render with the project's Elements, else this package's. One
 * outside the supported range writes other settings than the converter expects
 * (an older one ignores the phone layout and root props), and the check, which
 * compares words, can't tell: stop before converting. Checked where the
 * templates are, as they load it from there (an app in a monorepo has its own).
 */
export function supportedElements(io: Pick<Io, "cwd" | "stderr">, files: string[], range?: string): boolean {
  const folders = [...new Set(files.map((file) => dirname(file)))];
  const messages = new Set<string>();
  for (const folder of folders.length ? folders : [io.cwd]) {
    const { error } = elementsMismatch(folder, range);
    if (error) messages.add(error);
  }
  for (const text of messages) io.stderr(`${text}\n`);
  return !messages.size;
}

export function elementsMismatch(cwd: string, range = ownPackage().peerDependencies?.["@unlayer/react-elements"]): { error?: string } {
  const minimum = parseVersion(/^\^(.+)$/.exec(range ?? "")?.[1]); // a workspace link in development: nothing to check
  if (!minimum) return {};
  for (const [from, where] of [[join(cwd, "noop.js"), "this project has"], [import.meta.url, "@unlayer/migrate came with"]] as const) {
    let version: string;
    try {
      version = JSON.parse(readFileSync(createRequire(from).resolve("@unlayer/react-elements/package.json"), "utf8")).version;
    } catch {
      continue; // not installed there
    }
    const found = parseVersion(version);
    if (!found) return {};
    if (satisfiesCaret(found, minimum)) return {};
    const newer = compareVersions(found, minimum) > 0 ? ", or update @unlayer/migrate" : "";
    return { error: `@unlayer/migrate needs @unlayer/react-elements ${range}, but ${where} ${version}. Install a supported version: npm install @unlayer/react-elements@"${range}"${newer}` };
  }
  return {};
}

interface Version {
  release: number[];
  /** Prerelease identifiers (`beta.1` → ["beta", "1"]). */
  pre: string[];
}

function parseVersion(text: string | undefined): Version | undefined {
  const found = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/.exec(text ?? "");
  return found ? { release: found.slice(1, 4).map(Number), pre: found[4]?.split(".") ?? [] } : undefined;
}

/** Semver order: the release numbers, then a prerelease before its release, identifier by identifier. */
function compareVersions(a: Version, b: Version): number {
  for (let i = 0; i < 3; i++) if (a.release[i] !== b.release[i]) return a.release[i] - b.release[i];
  if (!a.pre.length || !b.pre.length) return b.pre.length - a.pre.length;
  for (let i = 0; i < Math.max(a.pre.length, b.pre.length); i++) {
    const [x, y] = [a.pre[i], b.pre[i]];
    if (x === y) continue;
    if (x === undefined || y === undefined) return x === undefined ? -1 : 1;
    const [xNumber, yNumber] = [/^\d+$/.test(x), /^\d+$/.test(y)];
    if (xNumber && yNumber) return Number(x) - Number(y);
    return xNumber ? -1 : yNumber ? 1 : x < y ? -1 : 1;
  }
  return 0;
}

/**
 * Whether `version` is in `^minimum`, as npm reads it: up to the next major
 * (the next minor below 1.0.0), and a prerelease only when the range is one
 * of the same version (`^0.2.0-beta.0` takes `0.2.0-beta.1`; `^0.2.0` doesn't).
 */
function satisfiesCaret(version: Version, minimum: Version): boolean {
  const [major, minor, patch] = minimum.release;
  const limit = major > 0 ? [major + 1, 0, 0] : minor > 0 ? [0, minor + 1, 0] : [0, 0, patch + 1];
  if (compareVersions(version, minimum) < 0 || compareVersions(version, { release: limit, pre: [] }) >= 0) return false;
  return !version.pre.length || (minimum.pre.length > 0 && version.release.every((n, i) => n === minimum.release[i]));
}

function ownPackage(): { peerDependencies?: Record<string, string> } {
  return createRequire(import.meta.url)("../package.json");
}

/** The nearest tsconfig.json, or jsconfig.json (JavaScript projects, Next.js), at or above `dir`. */
function projectConfig(dir: string): string | undefined {
  for (let current = dir; ; current = dirname(current)) {
    for (const name of ["tsconfig.json", "jsconfig.json"]) if (existsSync(join(current, name))) return join(current, name);
    if (dirname(current) === current) return undefined;
  }
}

/**
 * Why a file isn't loaded, or undefined when it's a template: a template's default
 * export is a component (a function, `memo` or `forwardRef` of one, or a class
 * extending React's `Component` with `render`) that isn't async and returns JSX,
 * or that has `PreviewProps` (React Email's own convention). Read from the source,
 * as loading a file runs its code. `fail` marks a template the check can't load
 * (one wrapped in another function), as opposed to a file that isn't one.
 */
async function notATemplate(path: string, source: string): Promise<{ reason: string; fail?: true } | undefined> {
  const ts = (await import("typescript")).default;
  type Node = import("typescript").Node;
  // A .ts file has no JSX: read as TSX, `<T>value` would be misread.
  const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, /\.m?ts$/.test(path) ? ts.ScriptKind.TS : ts.ScriptKind.TSX);
  const skip = (reason: string) => ({ reason });
  // A file that doesn't parse can't be told apart from a template: it fails, saying where (never a helper, skipped).
  const broken = (file as unknown as { parseDiagnostics?: import("typescript").DiagnosticWithLocation[] }).parseDiagnostics?.[0];
  if (broken) {
    const { line } = file.getLineAndCharacterOfPosition(broken.start);
    return { reason: `it doesn't parse (line ${line + 1}: ${ts.flattenDiagnosticMessageText(broken.messageText, " ")}): fix it, then run again`, fail: true };
  }
  const declared = new Map<string, Node>();
  const previewed = new Set<string>();
  // React's functions by the names they're imported as (`memo as remember`, `React.memo`).
  const fromReact = new Map<string, string>();
  const namespaces = new Set(["React"]);
  // React Email's <Html> by the names it's imported as (`Html`, `Email.Html`).
  const htmlTags = new Set<string>();
  let exported: Node | undefined;
  for (const statement of file.statements) {
    if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier) && statement.moduleSpecifier.text === "react") {
      const clause = statement.importClause;
      if (clause?.name) namespaces.add(clause.name.text);
      const bindings = clause?.namedBindings;
      if (bindings && ts.isNamespaceImport(bindings)) namespaces.add(bindings.name.text);
      else if (bindings) for (const e of bindings.elements) fromReact.set(e.name.text, (e.propertyName ?? e.name).text);
    }
    if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier) && /^(@react-email\/|react-email$)/.test(statement.moduleSpecifier.text)) {
      const bindings = statement.importClause?.namedBindings;
      if (bindings && ts.isNamespaceImport(bindings)) htmlTags.add(`${bindings.name.text}.Html`);
      else if (bindings) for (const e of bindings.elements) if ((e.propertyName ?? e.name).text === "Html") htmlTags.add(e.name.text);
    }
    const isDefault = ts.canHaveModifiers(statement) && (ts.getModifiers(statement) ?? []).some((m) => m.kind === ts.SyntaxKind.DefaultKeyword);
    if (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) {
      if (statement.name) declared.set(statement.name.text, statement);
      if (isDefault) exported = statement;
    } else if (ts.isVariableStatement(statement)) {
      for (const d of statement.declarationList.declarations) if (ts.isIdentifier(d.name) && d.initializer) declared.set(d.name.text, d.initializer);
    } else if (ts.isExportAssignment(statement) && !statement.isExportEquals) exported = statement.expression;
    else if (ts.isExportDeclaration(statement) && !statement.moduleSpecifier && !statement.isTypeOnly && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
      const named = statement.exportClause.elements.find((e) => e.name.text === "default");
      if (named) exported = named.propertyName ?? named.name;
    } else if (ts.isExpressionStatement(statement) && ts.isBinaryExpression(statement.expression) && statement.expression.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
      const target = statement.expression.left;
      if (ts.isPropertyAccessExpression(target) && target.name.text === "PreviewProps" && ts.isIdentifier(target.expression)) previewed.add(target.expression.text);
    }
  }
  if (!exported) return skip("no default-exported component (a shared component or helper file)");
  const reactFunction = (callee: Node) =>
    ts.isIdentifier(callee) ? fromReact.get(callee.text) ?? callee.text
    : ts.isPropertyAccessExpression(callee) && ts.isIdentifier(callee.expression) && namespaces.has(callee.expression.text) ? callee.name.text
    : undefined;
  // Through names, parentheses, `as`, `memo(…)` and `forwardRef(…)`, to the component.
  let node: Node | undefined = exported;
  let previewProps = false;
  let wrapper: string | undefined;
  for (let depth = 0; node && depth < 8 && !ts.isFunctionLike(node) && !ts.isClassLike(node); depth++) {
    if (ts.isIdentifier(node)) {
      previewProps ||= previewed.has(node.text);
      node = declared.get(node.text);
    } else if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) node = node.expression;
    else if (ts.isCallExpression(node) && ["memo", "forwardRef"].includes(reactFunction(node.expression) ?? "")) node = node.arguments[0];
    // A React type the check can't render (`lazy(…)`) is loaded, to fail as unsupported.
    else if ((ts.isCallExpression(node) && reactFunction(node.expression) === "lazy") || (ts.isObjectLiteralExpression(node) && node.properties.some((p) => p.name?.getText(file) === "$$typeof"))) return undefined;
    else {
      if (ts.isCallExpression(node)) {
        wrapper = node.expression.getText(file);
        // What it wraps: an async function sends or loads an email (a helper), it isn't one.
        let wrapped: Node | undefined = node.arguments[0];
        if (wrapped && ts.isIdentifier(wrapped)) wrapped = declared.get(wrapped.text);
        if (wrapped && ts.isFunctionLike(wrapped) && (ts.getModifiers(wrapped as import("typescript").FunctionLikeDeclaration) ?? []).some((m) => m.kind === ts.SyntaxKind.AsyncKeyword)) {
          return skip(`not loaded: its default export wraps an async function in ${wrapper}(…) (a helper that sends or loads an email)`);
        }
      }
      node = undefined;
    }
  }
  if (node && (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) && node.name) previewProps ||= previewed.has(node.name.text);
  /** An email (it renders React Email's <Html>, or has preview props) the check can't load fails: it's never skipped as a helper. */
  const helperOrFail = (reason: string, failReason: string) => (rendersHtml() || previewProps ? { reason: failReason, fail: true as const } : skip(reason));
  if (node && ts.isClassLike(node)) {
    // Only React's classes are components: another class with render() may be a helper (a mailer).
    const base = node.heritageClauses?.find((c) => c.token === ts.SyntaxKind.ExtendsKeyword)?.types[0]?.expression;
    const component = base && (ts.isIdentifier(base) ? fromReact.get(base.text) : reactFunction(base));
    if (!component || !["Component", "PureComponent"].includes(component)) {
      return helperOrFail(
        "not loaded: its default export is a class that doesn't extend React's Component (a helper, not a template)",
        "its default export is a class that doesn't extend React's Component directly, which the check can't load: export a function component"
      );
    }
    return node.members.some((m) => ts.isMethodDeclaration(m) && m.name.getText(file) === "render") ? undefined : helperOrFail("not loaded: its default export is a class without render()", "its default export is a class without render(), which the check can't load: export a function component");
  }
  /** Whether JSX anywhere in the file renders React Email's <Html>. */
  function rendersHtml(): boolean {
    let found = false;
    const visit = (child: Node) => {
      if (found) return;
      if ((ts.isJsxOpeningElement(child) || ts.isJsxSelfClosingElement(child)) && htmlTags.has(child.tagName.getText(file))) found = true;
      else ts.forEachChild(child, visit);
    };
    visit(file);
    return found;
  };
  /** Whether the file has JSX anywhere (its email may render <Html> through a shared layout). */
  const hasJsx = () => {
    let found = false;
    const visit = (child: Node) => {
      if (found) return;
      if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child) || ts.isJsxFragment(child)) found = true;
      else ts.forEachChild(child, visit);
    };
    visit(file);
    return found;
  };
  // An email the check can't reach: it fails rather than being skipped as a helper.
  if (wrapper && (rendersHtml() || hasJsx())) return { reason: `its default export is wrapped in ${wrapper}(…), which the check can't unwrap: export the component itself`, fail: true };
  if (!node || !ts.isFunctionLike(node)) return skip("not loaded: its default export isn't a component (a helper, or a file that passes one on)");
  if ((ts.getModifiers(node as import("typescript").FunctionLikeDeclaration) ?? []).some((m) => m.kind === ts.SyntaxKind.AsyncKeyword)) {
    return helperOrFail(
      "not loaded: its default export is async (a helper, or a template that loads data: load it first and pass it as props)",
      "its default export is async, which Elements can't render (it renders synchronously): load the data first and pass it as props"
    );
  }
  // Values its body declares (`const email = <Html>…</Html>; return email;`).
  const locals = new Map<string, Node>();
  const collect = (child: Node) => {
    if (ts.isFunctionLike(child) || ts.isClassLike(child)) return;
    if (ts.isVariableDeclaration(child) && ts.isIdentifier(child.name) && child.initializer) locals.set(child.name.text, child.initializer);
    ts.forEachChild(child, collect);
  };
  const fnBody = (node as import("typescript").FunctionLikeDeclaration).body;
  if (fnBody && ts.isBlock(fnBody)) ts.forEachChild(fnBody, collect);
  /** JSX, in either branch of a condition, or a value declared as JSX. */
  const jsx = (e: Node | undefined, depth = 0): boolean => {
    while (e && (ts.isParenthesizedExpression(e) || ts.isAsExpression(e) || ts.isSatisfiesExpression(e) || ts.isNonNullExpression(e))) e = e.expression;
    if (!e) return false;
    if (ts.isJsxElement(e) || ts.isJsxSelfClosingElement(e) || ts.isJsxFragment(e)) return true;
    if (ts.isIdentifier(e) && depth < 5 && locals.has(e.text)) return jsx(locals.get(e.text), depth + 1);
    if (ts.isConditionalExpression(e)) return jsx(e.whenTrue) || jsx(e.whenFalse);
    // A call that wraps JSX (`shell(<Text>…</Text>)`) to a function of the file's own that returns JSX: the email. Any
    // other call isn't read as one, as loading the file calls it: a renderer (`render(<Welcome />)`) or a sender
    // (`resend.emails.send({ react: <Text /> })`, which would send the email).
    if (ts.isCallExpression(e)) {
      // (`Spanish(props)` in `locale === "es" ? Spanish(props) : English(props)`, `renderBody(p)`: the same.)
      const fn = ts.isIdentifier(e.expression) ? declared.get(e.expression.text) : undefined;
      return !!fn && ts.isFunctionLike(fn) && returnsJsx(fn as import("typescript").FunctionLikeDeclaration);
    }
    return ts.isBinaryExpression(e) && [ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(e.operatorToken.kind) && (jsx(e.left) || jsx(e.right));
  };
  /** A function whose own returns are JSX (or a choice between JSX). */
  const returnsJsx = (fn: import("typescript").FunctionLikeDeclaration): boolean => {
    const direct = (r: Node | undefined): boolean => {
      while (r && (ts.isParenthesizedExpression(r) || ts.isAsExpression(r) || ts.isSatisfiesExpression(r))) r = r.expression;
      return !!r && (ts.isJsxElement(r) || ts.isJsxSelfClosingElement(r) || ts.isJsxFragment(r) || (ts.isConditionalExpression(r) && (direct(r.whenTrue) || direct(r.whenFalse))));
    };
    if (!fn.body) return false;
    if (!ts.isBlock(fn.body)) return direct(fn.body);
    let found = false;
    const own = (child: Node) => {
      if (found || ts.isFunctionLike(child) || ts.isClassLike(child)) return;
      if (ts.isReturnStatement(child) && direct(child.expression)) found = true;
      else ts.forEachChild(child, own);
    };
    ts.forEachChild(fn.body, own);
    return found;
  };
  const body = (node as import("typescript").FunctionLikeDeclaration).body;
  let returns = !!body && !ts.isBlock(body) && jsx(body);
  // Its own returns, not those of functions inside it.
  const visit = (child: Node) => {
    if (returns || ts.isFunctionLike(child) || ts.isClassLike(child)) return;
    if (ts.isReturnStatement(child) && jsx(child.expression)) returns = true;
    else ts.forEachChild(child, visit);
  };
  if (body && ts.isBlock(body)) ts.forEachChild(body, visit);
  return returns || previewProps
    ? undefined
    : helperOrFail("not loaded: its default export doesn't return JSX (a helper, not a template)", "its default export renders an email in a way the check can't load: return the email's JSX (<Html>…</Html>) from a component");
}

/** The local a statement exports as the default (`export { Layout as default }`). */
function exportedAsDefault(ts: typeof import("typescript"), statement: import("typescript").Statement): import("typescript").Identifier | undefined {
  if (!ts.isExportDeclaration(statement) || statement.moduleSpecifier || statement.isTypeOnly || !statement.exportClause || !ts.isNamedExports(statement.exportClause)) return undefined;
  const named = statement.exportClause.elements.find((e) => e.name.text === "default");
  const local = named && (named.propertyName ?? named.name);
  return local && ts.isIdentifier(local) ? local : undefined;
}

/**
 * Whether a module's default-exported component renders its `children`
 * (`({ children }) =>`, `props.children`): a layout that templates wrap.
 */
async function rendersChildren(source: string): Promise<boolean> {
  const ts = (await import("typescript")).default;
  const file = ts.createSourceFile("template.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const declared = new Map<string, import("typescript").Node>();
  let exported: import("typescript").Node | undefined;
  for (const statement of file.statements) {
    const isDefault = ts.canHaveModifiers(statement) && (ts.getModifiers(statement) ?? []).some((m) => m.kind === ts.SyntaxKind.DefaultKeyword);
    if (ts.isFunctionDeclaration(statement)) {
      if (statement.name) declared.set(statement.name.text, statement);
      if (isDefault) exported = statement;
    } else if (ts.isVariableStatement(statement)) {
      for (const d of statement.declarationList.declarations) if (ts.isIdentifier(d.name) && d.initializer) declared.set(d.name.text, d.initializer);
    } else if (ts.isExportAssignment(statement) && !statement.isExportEquals) exported = statement.expression;
    else exported = exportedAsDefault(ts, statement) ?? exported;
  }
  // Through a name, parentheses, `memo(…)` and `forwardRef(…)`, to the function.
  let fn = exported;
  for (let depth = 0; fn && depth < 5 && !ts.isFunctionLike(fn); depth++) {
    if (ts.isIdentifier(fn)) fn = declared.get(fn.text);
    else if (ts.isParenthesizedExpression(fn)) fn = fn.expression;
    else if (ts.isCallExpression(fn)) fn = fn.arguments[0];
    else fn = undefined;
  }
  if (!fn || !ts.isFunctionLike(fn)) return false;
  const param = fn.parameters[0]?.name;
  const body = (fn as import("typescript").FunctionLikeDeclaration).body;
  if (!param || !body) return false;
  /** Whether `name` is read in the body, other than where it's declared. */
  const used = (name: string) => {
    let found = false;
    const visit = (node: import("typescript").Node) => {
      if (found) return;
      if (ts.isIdentifier(node) && node.text === name && !(ts.isBindingElement(node.parent) && node.parent.name === node) && !(ts.isPropertyAccessExpression(node.parent) && node.parent.name === node)) found = true;
      else ts.forEachChild(node, visit);
    };
    visit(body);
    return found;
  };
  /** The local a `children` element of a destructuring pattern binds. */
  const bound = (pattern: import("typescript").ObjectBindingPattern) => {
    const element = pattern.elements.find((e) => (e.propertyName ?? e.name).getText() === "children");
    return element && ts.isIdentifier(element.name) ? element.name.text : undefined;
  };
  if (ts.isObjectBindingPattern(param)) {
    const local = bound(param);
    return local !== undefined && used(local);
  }
  if (!ts.isIdentifier(param)) return false;
  // `props.children`, or `const { children } = props` then used.
  let found = false;
  const visit = (node: import("typescript").Node) => {
    if (found) return;
    if (ts.isPropertyAccessExpression(node) && node.name.text === "children" && ts.isIdentifier(node.expression) && node.expression.text === param.text) found = true;
    else if (ts.isVariableDeclaration(node) && ts.isObjectBindingPattern(node.name) && node.initializer?.getText() === param.text) {
      const local = bound(node.name);
      found = local !== undefined && used(local);
    } else ts.forEachChild(node, visit);
  };
  visit(body);
  return found;
}

/**
 * What a template file reached through a module outside the folder is: a
 * shared piece that takes content (it renders `children`, or its props are
 * typed to hold JSX), an email of its own (its props are typed in the file
 * and hold no JSX, or it takes none), or unknown (untyped props, or a props
 * type from another file): that module may render it inside its own markup.
 */
async function sharedPiece(source: string): Promise<"shared" | "email" | "unknown"> {
  if (await rendersChildren(source)) return "shared";
  const ts = (await import("typescript")).default;
  const file = ts.createSourceFile("template.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const declared = new Map<string, import("typescript").Node>();
  // A component's type, where a variable has one (`const Reset: React.FC<ResetProps> = …`).
  const typed = new Map<import("typescript").Node, import("typescript").TypeNode>();
  const types = new Map<string, import("typescript").Node>();
  let exported: import("typescript").Node | undefined;
  for (const statement of file.statements) {
    const isDefault = ts.canHaveModifiers(statement) && (ts.getModifiers(statement) ?? []).some((m) => m.kind === ts.SyntaxKind.DefaultKeyword);
    if (ts.isFunctionDeclaration(statement)) {
      if (statement.name) declared.set(statement.name.text, statement);
      if (isDefault) exported = statement;
    } else if (ts.isVariableStatement(statement)) {
      for (const d of statement.declarationList.declarations) {
        if (!ts.isIdentifier(d.name) || !d.initializer) continue;
        declared.set(d.name.text, d.initializer);
        if (d.type) typed.set(d.initializer, d.type);
      }
    } else if (ts.isExportAssignment(statement) && !statement.isExportEquals) exported = statement.expression;
    else if (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) types.set(statement.name.text, statement);
    else exported = exportedAsDefault(ts, statement) ?? exported;
  }
  // A template React Email previews (`PreviewProps`) is an email of its own, whatever its props hold.
  const name = exported && (ts.isFunctionDeclaration(exported) ? exported.name?.text : ts.isIdentifier(exported) ? exported.text : undefined);
  if (name && file.statements.some((s) => ts.isExpressionStatement(s) && ts.isBinaryExpression(s.expression) && s.expression.operatorToken.kind === ts.SyntaxKind.EqualsToken && ts.isPropertyAccessExpression(s.expression.left) && ts.isIdentifier(s.expression.left.expression) && s.expression.left.expression.text === name && s.expression.left.name.text === "PreviewProps")) return "email";
  let fn = exported;
  let componentType: import("typescript").TypeNode | undefined;
  for (let depth = 0; fn && depth < 5 && !ts.isFunctionLike(fn); depth++) {
    if (ts.isIdentifier(fn)) {
      fn = declared.get(fn.text);
      if (fn) componentType = typed.get(fn) ?? componentType;
    } else if (ts.isParenthesizedExpression(fn)) fn = fn.expression;
    else if (ts.isCallExpression(fn)) fn = fn.arguments[0];
    else fn = undefined;
  }
  if (!fn || !ts.isFunctionLike(fn)) return "unknown";
  const param = fn.parameters[0];
  if (!param) return "email";
  // `React.FC<Props>`, `FunctionComponent<Props>`: the props are its type argument.
  const fromComponent = componentType && ts.isTypeReferenceNode(componentType) && /^(React\.)?(FC|FunctionComponent|VFC|VoidFunctionComponent)$/.test(componentType.typeName.getText(file)) ? componentType.typeArguments?.[0] : undefined;
  const propsType = param.type ?? fromComponent;
  if (!propsType) return "unknown";
  // The props' type as written here: inline, or an interface or type declared in this file (and what it extends from here).
  const written: string[] = [];
  const read = (type: import("typescript").Node, depth = 0): boolean => {
    if (depth > 5) return false;
    if (ts.isTypeReferenceNode(type) && ts.isIdentifier(type.typeName)) {
      const own = types.get(type.typeName.text);
      if (!own) return /^(Readonly|Partial|Required)$/.test(type.typeName.text) && (type.typeArguments ?? []).every((t) => read(t, depth + 1));
      written.push(own.getText(file));
      const bases = ts.isInterfaceDeclaration(own) ? (own.heritageClauses ?? []).flatMap((c) => c.types.map((t) => t.expression)) : [];
      return bases.every((base) => ts.isIdentifier(base) && types.has(base.text) && read(types.get(base.text) as never, depth + 1)) && (!ts.isTypeAliasDeclaration(own) || read(own.type, depth + 1));
    }
    if (ts.isInterfaceDeclaration(type)) {
      written.push(type.getText(file));
      return true;
    }
    if (ts.isIntersectionTypeNode(type) || ts.isUnionTypeNode(type)) return type.types.every((t) => read(t, depth + 1));
    if (ts.isTypeLiteralNode(type)) {
      written.push(type.getText(file));
      return true;
    }
    return false;
  };
  if (!read(propsType)) return "unknown";
  return written.some((text) => /\b(ReactNode|ReactElement|ReactChild|ReactFragment|ReactPortal|PropsWithChildren|JSX\.Element|Element)\b/.test(text)) ? "shared" : "email";
}

/**
 * Files git can't give back as they are: outside a repository (or without
 * git), not committed (untracked or ignored), changed since the last commit
 * (staged or not, compared byte for byte with the committed file), or marked
 * so git doesn't look at them (skip-worktree, assume-unchanged). --write
 * replaces only files git can restore.
 */
async function notRestorable(files: string[]): Promise<Array<{ file: string; why: string }>> {
  const { execFile } = await import("node:child_process");
  const git = (cwd: string, args: string[]) =>
    new Promise<string | undefined>((done) => execFile("git", args, { cwd, maxBuffer: 64 * 1024 * 1024 }, (error, stdout) => done(error ? undefined : stdout)));
  const out: Array<{ file: string; why: string }> = [];
  const byRepository = new Map<string, Array<{ file: string; path: string }>>();
  for (const file of files) {
    const root = (await git(dirname(file), ["rev-parse", "--show-toplevel"]))?.trim();
    if (!root) {
      out.push({ file, why: "not in a git repository" });
      continue;
    }
    const top = await canonicalPath(root);
    const list = byRepository.get(top) ?? [];
    list.push({ file, path: relative(top, await canonicalPath(file)).split(sep).join("/") });
    byRepository.set(top, list);
  }
  for (const [root, list] of byRepository) {
    const paths = list.map((f) => f.path);
    const tracked = new Set((await git(root, ["ls-files", "-z", "--", ...paths]))?.split("\0").filter(Boolean) ?? []);
    const changedOutput = await git(root, ["diff", "--name-only", "-z", "HEAD", "--", ...paths]);
    const changed = new Set(changedOutput?.split("\0").filter(Boolean) ?? []);
    // Index flags (skip-worktree "S", assume-unchanged in lowercase) hide changes from git diff.
    const flags = new Map((await git(root, ["ls-files", "-v", "-z", "--", ...paths]))?.split("\0").filter(Boolean).map((line) => [line.slice(2), line[0]] as const) ?? []);
    // What's on disk against what's committed, whatever the index says.
    const committed = new Map(
      (await git(root, ["ls-tree", "-z", "HEAD", "--", ...paths]))?.split("\0").filter(Boolean).map((line) => [line.slice(line.indexOf("\t") + 1), line.split(/\s/)[2]] as const) ?? []
    );
    const onDisk = (await git(root, ["hash-object", "--", ...paths]))?.trim().split("\n") ?? [];
    list.forEach(({ file, path }, i) => {
      if (!tracked.has(path)) out.push({ file, why: "not committed" });
      // No commit yet: nothing to restore from.
      else if (changedOutput === undefined || !committed.has(path)) out.push({ file, why: "not committed" });
      else if (flags.get(path) !== "H") out.push({ file, why: "marked in git so its changes don't show (skip-worktree or assume-unchanged)" });
      else if (changed.has(path) || onDisk[i] !== committed.get(path)) out.push({ file, why: "changed since the last commit" });
    });
  }
  return out;
}

function findUp(name: string, from: string): string | undefined {
  for (let dir = from; ; dir = dirname(dir)) {
    const candidate = join(dir, name);
    if (existsSync(candidate)) return candidate;
    if (dirname(dir) === dir) return undefined;
  }
}
