/**
 * `npx @unlayer/migrate <dir> --from beefree`: Beefree templates (their JSON) → Elements code. Each `.json` file that
 * is a Beefree template is converted to a design (`from-beefree`); it's checked against Beefree's own HTML export of it
 * when that's beside it (`<name>.html`), and is unverified otherwise (see design-source.ts for the rest: the code,
 * the check, what's written).
 */

import { readFile } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import type { DeclaredDifference } from "@unlayer/convert-core";
import type { Args } from "./args";
import type { Io, Options } from "./cli";
import { runDesignSource, type DesignSource } from "./design-source";
import { beefreeToDesign, BeefreeFormatError, readBeefree } from "./from-beefree";

/** Beefree's HTML export of a template, which the migration is checked against: `<name>.html` beside its JSON. */
export function exportedHtml(path: string): string {
  return join(dirname(path), `${basename(path, extname(path))}.html`);
}

/** A BeefreeFormatError for a file that isn't a Beefree template (skipped), as opposed to one it can't read. */
function notATemplate(error: BeefreeFormatError): boolean {
  return /^Not (a|a full) Beefree/.test(error.message);
}

/** The reason as a list reads it: the converter's sentence, without the trailing period. */
const reason = (text: string) => text.replace(/\.\s*$/, "");

/** Why a social icon's alt text differs: Elements' Social block writes it, from the network's name. */
export const SOCIAL_ALT = "social icon alt text is “<network> icon” (the editor's Social block writes it this way)";
/** Why the hamburger's glyphs are gone: Unlayer menus have no hamburger button. */
export const MENU_TOGGLE = "menu toggle glyph left out (Unlayer menus have no hamburger button on phones)";
/** Why the menu's links show on phones: they aren't folded into a button there. */
export const MENU_LINKS = "menu links shown on phones, where Beefree folds them into a hamburger button (Unlayer menus have none)";

type Plain = Record<string, any>;
const plain = (value: unknown): value is Plain => typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * The content differences the Beefree conversion makes on purpose, each naming exactly what it replaces: a social
 * icon's alt text (on its image, by source, from Beefree's alt to the editor's "<network> icon"), and a hamburger
 * menu's open and close glyphs (in Beefree's `menu-open` and `menu-close` elements; in its newer exports, the button
 * `bee-hamburger-controls`) and its links shown where Beefree folds them away (its `menu-links` element, or
 * `with-bee-hamburger`). The check expects only these.
 */
export function beefreeDeclared(bytes: Buffer, design: unknown): DeclaredDifference[] {
  const { page } = readBeefree(bytes);
  const modules: Plain[] = [];
  for (const row of Array.isArray(page.rows) ? page.rows : []) {
    for (const column of plain(row) && Array.isArray(row.columns) ? row.columns : []) {
      for (const module of plain(column) && Array.isArray(column.modules) ? column.modules : []) if (plain(module)) modules.push(module);
    }
  }
  // Beefree's alt text for each icon image.
  const alts = new Map<string, string>();
  for (const module of modules.filter((m) => /social$/.test(String(m.type)))) {
    for (const icon of module.descriptor?.iconsList?.icons ?? []) {
      const src = String(icon?.image?.src ?? "").trim();
      if (src && !alts.has(src)) alts.set(src, String(icon.image.alt ?? ""));
    }
  }
  const declared: DeclaredDifference[] = [];
  const seen = new Set<string>();
  const rows = plain(design) && plain(design.body) && Array.isArray(design.body.rows) ? design.body.rows : [];
  for (const block of rows.flatMap((r: Plain) => (r.columns ?? []).flatMap((c: Plain) => c.contents ?? []))) {
    if (block?.type !== "social") continue;
    for (const icon of block.values?.icons?.icons ?? []) {
      const src = String(icon?.imgUrl ?? "");
      const from = alts.get(src);
      const to = `${icon?.name} icon`;
      if (from === undefined || from === to || seen.has(`${src}\n${from}`)) continue;
      seen.add(`${src}\n${from}`);
      declared.push({ kind: "alt", src, from, to, reason: SOCIAL_ALT });
    }
  }
  if (modules.some((m) => /menu$/.test(String(m.type)) && m.descriptor?.computedStyle?.hamburger?.mobile === true)) {
    declared.push(
      { kind: "text", text: "☰", parentClass: "menu-open", reason: MENU_TOGGLE },
      { kind: "text", text: "✕", parentClass: "menu-close", reason: MENU_TOGGLE },
      { kind: "shown", className: "menu-links", reason: MENU_LINKS },
      // Beefree's newer exports: the button (its icons are background images) and the list it folds.
      { kind: "hidden", className: "bee-hamburger-controls", reason: MENU_TOGGLE.replace("glyph", "button") },
      { kind: "shown", className: "with-bee-hamburger", reason: MENU_LINKS },
    );
  }
  return declared;
}

export const BEEFREE_SOURCE: DesignSource = {
  name: "Beefree",
  file: /\.json$/i,
  noneFound: "No Beefree templates found (.json files).",
  noneChecked: "No template was checked: no JSON file here is a Beefree template.",
  classify(_path, bytes) {
    try {
      readBeefree(bytes);
      return undefined;
    } catch (error) {
      if (!(error instanceof BeefreeFormatError)) return { status: "failed", reason: `couldn't read it: ${(error as Error).message.split("\n")[0]}` };
      return notATemplate(error) ? { status: "skipped", reason: `not a Beefree template: ${reason(error.message.replace(/^Not (a|a full) Beefree template:?\s*/, ""))}` } : { status: "failed", reason: reason(error.message) };
    }
  },
  async convert(input, bytes) {
    const result = beefreeToDesign(bytes);
    const html = await readFile(exportedHtml(input.path), "utf8").catch(() => undefined);
    return {
      design: result.design,
      // Grouped by what it says (a row's place is where): "Row 5: its columns are aligned to the middle…".
      warnings: result.warnings.map((w) => {
        const text = w.where && w.message.startsWith(`${w.where}: `) ? w.message.slice(w.where.length + 2) : w.message;
        return { reason: reason(text), ...(w.where ? { detail: w.where } : {}) };
      }),
      info: [{ reason: `Beefree ${result.version} template` }],
      kept: result.fallbacks.map((f) => ({ reason: `${f.module}: ${reason(f.reason)}`, detail: f.module })),
      reference: html !== undefined ? { html } : { missing: `no exported HTML: put Beefree's HTML export of it beside it as ${basename(exportedHtml(input.path))} to check it` },
      declared: beefreeDeclared(bytes, result.design),
    };
  },
  failure(error) {
    if (!(error instanceof BeefreeFormatError)) return undefined;
    return notATemplate(error) ? { status: "skipped", reason: `not a Beefree template: ${reason(error.message)}` } : { status: "failed", reason: reason(error.message) };
  },
};

export function runBeefree(args: Args, options: Options, io: Io): Promise<number> {
  return runDesignSource(BEEFREE_SOURCE, args, options, io);
}
