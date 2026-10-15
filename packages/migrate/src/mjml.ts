/**
 * `npx @unlayer/migrate <dir> --from mjml`: MJML templates → Elements code, as React Email templates are migrated.
 * Each `.mjml` file is converted to a design (`from-mjml`) and checked against the HTML MJML compiles the original to
 * (see design-source.ts for the rest: the code, the check, what's written).
 */

import { isUtf8 } from "node:buffer";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, extname, isAbsolute, relative, resolve, sep } from "node:path";
import { applyDeclared, describeDeclared } from "@unlayer/convert-core";
import type { Args } from "./args";
import { message, type Io, type Options } from "./cli";
import { checkDesign, runDesignSource, type DesignCheck, type DesignSource, type SourceInput } from "./design-source";
import { isMjml3, isMjmlDocument, mjmlToDesign, MjmlVersionError, referenceHtml, type IncludeResolver, type MjmlToDesignResult } from "./from-mjml";

/**
 * Reads an `mj-include` for a template under `root`: relative to the file that includes it (`.mjml` added when the
 * path has no extension and the file isn't there), never outside `root` (the folder given), even through a link.
 * `shown`: how the run names `root`.
 */
export function includeResolver(root: string, shown = root): IncludeResolver {
  const realRoot = (() => {
    try {
      return realpathSync(root);
    } catch {
      return root;
    }
  })();
  return (path, from) => {
    if (path.includes("\0") || isAbsolute(path) || /^[a-zA-Z]:/.test(path)) return { error: "an absolute path, not read" };
    const folder = from ? dirname(from) : root;
    const candidates = [resolve(folder, path), ...(extname(path) ? [] : [resolve(folder, `${path}.mjml`)])];
    const found = candidates.find((c) => existsSync(c));
    if (!found) return { error: "not found" };
    let real: string;
    try {
      real = realpathSync(found);
    } catch {
      return { error: "not found" };
    }
    const offset = relative(realRoot, real);
    if (offset === "" || offset === ".." || offset.startsWith(`..${sep}`) || isAbsolute(offset)) return { error: `outside ${shown}, not read` };
    try {
      return { file: real, source: readFileSync(real, "utf8") };
    } catch (error) {
      return { error: message(error) };
    }
  };
}

const MJML3 = "it's MJML 3 (it wraps its content in <mj-container>), which MJML 5 doesn't read: upgrade it first with npx mjml-migrate <input> <output>, then migrate the output";

/** Converts an MJML template, keeping the converter's result (for the source adapter and the measurement). */
async function convert(input: SourceInput, source: string, io: Pick<Io, "cwd">): Promise<{ result: MjmlToDesignResult; reference: string }> {
  const result = await mjmlToDesign(source, { filePath: input.path, resolveInclude: includeResolver(input.base, relative(io.cwd, input.base) || ".") });
  const { html } = await referenceHtml(structuredClone(result.document));
  return { result, reference: html };
}

export const MJML_SOURCE: DesignSource = {
  name: "MJML",
  file: /\.mjml$/i,
  noneFound: "No MJML templates found (.mjml files).",
  noneChecked: "No template was checked: nothing here is an MJML document (partials are skipped).",
  classify(_path, bytes) {
    // Text in another encoding (a Latin-1 é) would read as U+FFFD.
    if (!isUtf8(bytes)) return { status: "failed", reason: "it isn't saved as UTF-8 (another encoding, like Latin-1): save it as UTF-8, then run again" };
    const text = bytes.toString("utf8");
    if (isMjml3(text)) return { status: "failed", reason: MJML3 };
    if (!isMjmlDocument(text)) return { status: "skipped", reason: "not an MJML document (no <mjml> root): a partial, converted where a template includes it" };
    return undefined;
  },
  async convert(input, bytes, io) {
    const { result, reference } = await convert(input, bytes.toString("utf8"), io);
    return {
      design: result.design,
      warnings: result.warnings,
      info: result.info,
      kept: result.fallbacks.map((f) => ({ reason: f.reason, detail: f.tag })),
      ...(result.title ? { title: result.title } : {}),
      reference: { html: reference },
      declared: result.declared,
      unread: result.warnings.filter((w) => /^mj-include (left out|not followed)$/.test(w.reason)).map((w) => `mj-include ${w.detail}`),
    };
  },
  failure(error) {
    return error instanceof MjmlVersionError ? { status: "failed", reason: error.message } : undefined;
  },
};

/** What converting and checking one MJML template gives. */
export interface MjmlCheck extends DesignCheck {
  conversion: MjmlToDesignResult;
  referenceHtml: string;
  check: NonNullable<DesignCheck["check"]>;
}

/**
 * Convert an MJML template and check the result as a run does: render its Elements code (written to a temporary file
 * in `folder`, loaded as a migrated template is) and compare it with MJML's HTML for the original. `root`: the folder
 * its includes must stay in.
 */
export async function convertMjml(file: string, source: string, folder: string, root: string, io: Pick<Io, "cwd" | "project">): Promise<MjmlCheck> {
  const { result, reference } = await convert({ path: file, base: root }, source, io);
  // What the check expects: MJML's HTML with the differences the conversion declares made (see design-source.ts).
  const expected = applyDeclared(reference, result.declared);
  const checked = await checkDesign("MJML", file, { design: result.design, title: result.title }, expected.html, folder, io);
  for (const warning of checked.codegenWarnings) result.warnings.push({ reason: "codegen", detail: warning });
  for (const applied of expected.applied) result.warnings.push(describeDeclared(applied));
  return { ...checked, conversion: result, referenceHtml: reference, check: checked.check! };
}

export function runMjml(args: Args, options: Options, io: Io): Promise<number> {
  return runDesignSource(MJML_SOURCE, args, options, io);
}
