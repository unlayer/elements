/**
 * Formats migrated through a design (MJML, Beefree): each template is converted to an Unlayer design, written as
 * Elements TSX (`designToElements`), rendered as a migrated React Email template is, and checked against the HTML the
 * original renders to (MJML's compile, Beefree's export) with the same check. The templates stay where they are:
 * `<name>.tsx` is written beside each one (`--write`) or in `--out`, with the same rules for files already there, the
 * same report and the same exit codes as a React Email run.
 */

import { existsSync, rmSync } from "node:fs";
import { mkdir, readdir, readFile, stat } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { applyDeclared, compareText, describeDeclared, editorFonts, phoneDiffers, shareEditorFonts, type DeclaredDifference, type TextCheck } from "@unlayer/convert-core";
import type { Args } from "./args";
import {
  checkDestination,
  cleanProbeDirectories,
  contentProblems,
  designPath,
  finishRun,
  group,
  IGNORED,
  importFile,
  lookProblems,
  message,
  phoneWidths,
  removedOnExit,
  reserveDestinations,
  SEE_HELP,
  supportedElements,
  withContentHash,
  writeExclusive,
  writeResults,
  type Destinations,
  type FileResult,
  type Io,
  type Options,
  type PendingWrite,
} from "./cli";

/** A template file to migrate. */
export interface SourceInput {
  path: string;
  /** The folder given: the output layout is relative to it (and an MJML template's includes stay in it). */
  base: string;
}

/** What a format's converter gives for one template. */
export interface SourceConversion {
  design: unknown;
  /** What's approximated or not kept: a reason to group by, and where or what. */
  warnings: Array<{ reason: string; detail?: string }>;
  /** What the conversion did that doesn't change how it looks. */
  info: Array<{ reason: string; detail?: string }>;
  /** Blocks kept as HTML: why, and what (the tag or module). */
  kept: Array<{ reason: string; detail?: string }>;
  /** The template's title, for the file's header. */
  title?: string;
  /** The HTML the original renders, to check against; or why there's none (the template is then unverified). */
  reference: { html: string } | { missing: string };
  /**
   * Content the converter knows it changes (an icon's alt text the editor writes its own way): the check expects
   * exactly these, and lists each one as a difference. Anything else that differs still fails.
   */
  declared?: DeclaredDifference[];
  /**
   * Parts of the original the converter couldn't read (an mj-include outside the folder): its reference has the same
   * gap, so the check can't vouch for the template, and it fails.
   */
  unread?: string[];
}

/** A format migrated through a design. */
export interface DesignSource {
  /** Its name, in the migrated files' header and the report's title. */
  name: string;
  /** Its template files, when a folder is walked. */
  file: RegExp;
  /** Said when the paths given hold none. */
  noneFound: string;
  /** Said when none of the files found is a template. */
  noneChecked: string;
  /** Why a file isn't a template (skipped) or can't be migrated (failed), told from its bytes before converting. */
  classify(path: string, bytes: Buffer): { status: "skipped" | "failed"; reason: string } | undefined;
  convert(input: SourceInput, bytes: Buffer, io: Pick<Io, "cwd" | "project">): Promise<SourceConversion>;
  /** A conversion error that says the file isn't a template (skipped) or one it can't read (failed, with why). */
  failure?(error: unknown): { status: "skipped" | "failed"; reason: string } | undefined;
}

/** A component name from a file name: `order-shipped.mjml` → `OrderShipped`, `01.mjml` → `Email01`. */
export function componentName(file: string): string {
  const words = basename(file, extname(file)).split(/[^A-Za-z0-9]+/).filter(Boolean);
  const name = words.map((w) => w[0].toUpperCase() + w.slice(1)).join("");
  return !name ? "Email" : /^[0-9]/.test(name) ? `Email${name}` : name;
}

/** The share of a design's content blocks that aren't Html blocks, spacers (a divider with no line) not counted. */
export function designEditable(design: Record<string, unknown>): number {
  type Content = { type?: string; values?: { border?: { borderTopWidth?: string } } };
  const rows = ((design.body as { rows?: Array<{ columns?: Array<{ contents?: Content[] }> }> } | undefined)?.rows ?? []);
  const blocks = rows
    .flatMap((row) => (row.columns ?? []).flatMap((column) => column.contents ?? []))
    .filter((block) => !(block.type === "divider" && /^0(px)?$/.test(String(block.values?.border?.borderTopWidth ?? "").trim())));
  return blocks.length ? blocks.filter((block) => block.type !== "html").length / blocks.length : 1;
}

/** What rendering a design's Elements code, and checking it, gives. */
export interface DesignCheck {
  /** The Elements TSX, with its header. */
  code: string;
  migratedHtml: string;
  /** The check against the original's HTML, when there's one. */
  check?: TextCheck;
  /** The design the code renders (renderToJson), which `--design` writes. */
  design: Record<string, unknown>;
  /** What the editor wouldn't get (renderToJson's warnings). */
  designWarnings: string[];
  editorFonts: Array<{ label: string; value: string; url: string }>;
  /** What codegen said didn't convert as it is. */
  codegenWarnings: string[];
}

/** Decodes the few entities a title has, for a comment. */
function plainTitle(title: string | undefined): string | undefined {
  return title
    ?.replace(/<[^>]*>/g, "")
    .replace(/&(amp|lt|gt|quot|#39|apos|nbsp);/g, (_, e: string) => ({ amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", apos: "'", nbsp: " " })[e] ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * A design as Elements code, rendered (written to a temporary file in `folder`, loaded as a migrated template is) and,
 * when there's the original's HTML, checked against it.
 */
export async function checkDesign(source: string, file: string, conversion: Pick<SourceConversion, "design" | "title">, reference: string | undefined, folder: string, io: Pick<Io, "cwd" | "project">): Promise<DesignCheck> {
  const { designToElements } = await import("@unlayer/react-elements/codegen");
  const generated = designToElements(conversion.design as never, { componentName: componentName(file) });
  const title = plainTitle(conversion.title);
  const header = `/** @jsxRuntime automatic */\n// Migrated from ${source} by @unlayer/migrate: ${basename(file).replace(/[\r\n\u2028\u2029]+/g, " ")}${title ? ` (${title})` : ""}\n`;
  const code = `${header}${generated.code}`;
  const probe = join(folder, `.${basename(file, extname(file))}.unlayer-migrate-${randomUUID()}.tsx`);
  let firstCreated: string | undefined;
  const removeProbe = () => {
    rmSync(probe, { force: true });
    cleanProbeDirectories(dirname(probe), firstCreated);
  };
  const releaseProbe = removedOnExit(removeProbe);
  const release: Array<() => void> = [];
  try {
    firstCreated = await mkdir(folder, { recursive: true });
    await writeExclusive(probe, code);
    const module = await importFile(probe, io, release, file);
    let component = module.default;
    if (component && typeof component === "object" && "default" in component) component = component.default;
    if (typeof component !== "function") throw new Error("the generated module has no default-exported component");
    const React = (await import("react")).default;
    const { renderToHtml, renderToJson } = await import("@unlayer/react-elements");
    const element = React.createElement(component);
    const migratedHtml = renderToHtml(element);
    const warnings: string[] = [];
    const warn = console.warn;
    const error = console.error;
    console.warn = (...args: unknown[]) => void warnings.push(args.map(String).join(" "));
    console.error = (...args: unknown[]) => {
      const text = args.map(String).join(" ");
      if (text.startsWith("[Unlayer]")) warnings.push(text);
      else error(...args);
    };
    let design: Record<string, unknown>;
    try {
      design = renderToJson(element) as unknown as Record<string, unknown>;
    } finally {
      console.warn = warn;
      console.error = error;
    }
    return {
      code,
      migratedHtml,
      ...(reference !== undefined ? { check: compareText(reference, migratedHtml) } : {}),
      design,
      designWarnings: warnings,
      editorFonts: editorFonts(design, undefined),
      codegenWarnings: generated.warnings,
    };
  } finally {
    for (const unregister of release.reverse()) unregister();
    releaseProbe();
    removeProbe();
  }
}

/** The template files in the paths given (folders walked, without node_modules, build output and dot folders). */
async function collect(source: DesignSource, paths: string[], cwd: string): Promise<{ files: SourceInput[]; missing: string[]; links: string[] }> {
  const files: SourceInput[] = [];
  const missing: string[] = [];
  const links: string[] = [];
  const seen = new Set<string>();
  const walk = async (dir: string, base: string): Promise<void> => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".") || IGNORED.has(entry.name)) continue;
      const path = join(dir, entry.name);
      if (entry.isSymbolicLink() && (await stat(path).catch(() => undefined))?.isDirectory()) links.push(path);
      else if (entry.isDirectory()) await walk(path, base);
      else if (source.file.test(entry.name) && !seen.has(path)) {
        seen.add(path);
        files.push({ path, base });
      }
    }
  };
  for (const given of paths) {
    const path = resolve(cwd, given);
    if (!existsSync(path)) {
      missing.push(given);
      continue;
    }
    if ((await stat(path)).isDirectory()) await walk(path, path);
    else if (!seen.has(path)) {
      seen.add(path);
      files.push({ path, base: dirname(path) });
    }
  }
  return { files: files.sort((a, b) => a.path.localeCompare(b.path)), missing, links };
}

/** Where a migrated template goes: `<name>.tsx` beside the template, or in --out with the same layout. */
function targetOf(input: SourceInput, options: Options, cwd: string): string {
  const name = `${basename(input.path, extname(input.path))}.tsx`;
  const folder = options.out !== undefined ? join(resolve(cwd, options.out), relative(input.base, dirname(input.path))) : dirname(input.path);
  return join(folder, name);
}

/** Why a file couldn't be read, said as a reader would. */
function unreadable(error: unknown): string {
  const code = (error as NodeJS.ErrnoException).code;
  return code === "ENOENT" ? "it links to a file that doesn't exist" : code === "EACCES" || code === "EPERM" ? "no permission to read it" : message(error);
}

/** One template: converted, checked (where the original's HTML is there), and what to write. */
async function migrateOne(source: DesignSource, input: SourceInput, options: Options, io: Io, destinations: Destinations): Promise<FileResult & { writes?: PendingWrite[] }> {
  const name = relative(io.cwd, input.path) || basename(input.path);
  let bytes: Buffer;
  try {
    bytes = await readFile(input.path);
  } catch (error) {
    return { file: name, status: "failed", reason: `couldn't read it: ${unreadable(error)}` };
  }
  const not = source.classify(input.path, bytes);
  if (not) return { file: name, ...not };
  const writing = options.write || options.out !== undefined;
  const target = targetOf(input, options, io.cwd);
  let conversion: SourceConversion;
  let checked: DesignCheck;
  let expected: ReturnType<typeof applyDeclared> | undefined;
  try {
    if (writing) await checkDestination(target, destinations);
    conversion = await source.convert(input, bytes, io);
    expected = "html" in conversion.reference ? applyDeclared(conversion.reference.html, conversion.declared ?? []) : undefined;
    checked = await checkDesign(source.name, input.path, conversion, expected?.html, dirname(target), io);
  } catch (error) {
    const known = source.failure?.(error);
    if (known) return { file: name, ...known };
    const code = (error as NodeJS.ErrnoException).code;
    if (code && ["EACCES", "EPERM", "EROFS"].includes(code)) return { file: name, status: "failed", reason: `can't write a temporary copy ${options.out === undefined ? "next to it" : "in its output folder"} to check it (read-only folder)` };
    return { file: name, status: "failed", reason: `couldn't convert it: ${message(error)}` };
  }
  const { check, design, designWarnings } = checked;
  const kept = conversion.kept;
  // The declared differences the check expected (each change it made), or all of them when there's nothing to check.
  const declared = expected ? expected.applied.map(describeDeclared) : (conversion.declared ?? []).map((declaration) => describeDeclared({ declaration, count: 1 }));
  const differences = group([...conversion.warnings, ...declared, ...checked.codegenWarnings.map((w) => ({ reason: "codegen", detail: w }))]);
  const looks = check ? [...lookProblems(check), ...phoneWidths("html" in conversion.reference ? conversion.reference.html : "")] : [];
  const unread = conversion.unread ?? [];
  const failsContent = (check ? contentProblems(check).length > 0 : false) || designWarnings.length > 0 || unread.length > 0;
  const missing = "missing" in conversion.reference ? conversion.reference.missing : undefined;
  // --strict: any difference fails, a block kept as HTML too, and a template there's nothing to check against.
  const strictFails = options.strict && (looks.length > 0 || differences.length > 0 || kept.length > 0 || missing !== undefined);
  const result: FileResult = {
    file: name,
    status: failsContent || strictFails ? "check-failed" : missing !== undefined ? "unverified" : "migrated",
    ...(missing !== undefined ? { unchecked: missing } : {}),
    ...(unread.length ? { unread } : {}),
    ...(looks.length ? { looks } : {}),
    editable: designEditable(design),
    fallbacks: kept.length,
    kept,
    differences,
    changes: group(conversion.info),
    ...(check
      ? {
          missingText: check.missing,
          addedText: check.added,
          missingAttributes: check.missingAttributes,
          addedAttributes: check.addedAttributes,
          ...(check.styles.length ? { styles: check.styles } : {}),
          ...(check.unverified.length ? { unverified: check.unverified } : {}),
          ...(phoneDiffers(check.phone) ? { phone: check.phone } : {}),
          ...(check.layout.length ? { layout: check.layout } : {}),
          styleCoverage: check.styleCoverage,
        }
      : {}),
    designWarnings,
    ...(options.design && checked.editorFonts.length ? { fonts: checked.editorFonts } : {}),
  };
  const writes: PendingWrite[] = [];
  // Every template is written (one whose content differs too, flagged); with --strict only one with no difference.
  if (writing && (result.status === "migrated" || result.status === "unverified" || !options.strict || options.force)) {
    writes.push({ path: target, text: withContentHash(checked.code), kind: "output" });
    if (options.design) writes.push({ path: designPath(target), text: `${JSON.stringify(design, null, 2)}\n`, kind: "design" });
  }
  return { ...result, writes };
}

export async function runDesignSource(source: DesignSource, args: Args, options: Options, io: Io): Promise<number> {
  const inputs = await collect(source, args.positional, io.cwd);
  if (inputs.missing.length) {
    io.stderr(`Not found: ${inputs.missing.join(", ")}\n${SEE_HELP}\n`);
    return 1;
  }
  const results: FileResult[] = inputs.links.map((link) => ({ file: relative(io.cwd, link), status: "skipped" as const, reason: "a symbolic link to a folder, not followed: give the folder (or the link itself) to migrate what's in it" }));
  if (!inputs.files.length) {
    io.stderr(`${source.noneFound}\n`);
    return 1;
  }
  // Files that aren't templates (an MJML partial, a JSON file that isn't a Beefree template) are listed, never written.
  const templates: SourceInput[] = [];
  for (const input of inputs.files) {
    const bytes = await readFile(input.path).catch(() => undefined);
    const not = bytes && source.classify(input.path, bytes);
    if (not?.status === "skipped") results.push({ file: relative(io.cwd, input.path), ...not });
    else templates.push(input);
  }
  const reportFile = args.option("report");
  let destinations: Destinations;
  try {
    const asInputs = templates.map((t) => ({ path: t.path, base: t.base, reactEmail: false, migrated: false, written: false }));
    // Beside each template with --write (as --out writes into a folder): a file already there is someone's.
    destinations = await reserveDestinations(asInputs, asInputs, options, reportFile, io.cwd, (input) => targetOf(input, options, io.cwd));
  } catch (error) {
    io.stderr(`${message(error)}\n`);
    return 1;
  }
  if (!supportedElements(io, templates.map((t) => targetOf(t, options, io.cwd)))) return 1;

  const pending: Array<{ result: FileResult; writes: PendingWrite[] }> = [];
  for (const input of templates) {
    const { writes = [], ...result } = await migrateOne(source, input, options, io, destinations);
    results.push(result);
    pending.push({ result, writes });
  }
  await writeResults(pending, options, destinations, io);
  // An editor registers each font family once: give every template the stylesheet that loads what all of them use.
  const withFonts = results.filter((r) => r.fonts);
  shareEditorFonts(withFonts.map((r) => r.fonts!)).forEach((fonts, i) => (withFonts[i].fonts = fonts));
  results.sort((a, b) => a.file.localeCompare(b.file));
  return finishRun(results, options, io, destinations, reportFile, source.name, source.noneChecked);
}
