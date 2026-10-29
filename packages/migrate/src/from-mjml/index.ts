/**
 * MJML → an Unlayer design: `mjmlToDesign()` reads an MJML template (MJML 4 or 5) and gives the design the editor
 * opens, in the shape `renderToJson()` writes. Pure: it reads no files (the caller's resolver reads includes) and has
 * no CLI in it. What it does with each tag:
 *
 * 1. Resolved at parse time, never reported: `mj-attributes` (`mj-all`, per tag), `mj-class`, MJML's defaults,
 *    `mj-include`, `mj-title`, `mj-preview` (the preview text), `mj-font` (web fonts).
 * 2. Approximated, with a warning: `mj-wrapper`, `mj-group`, a section's background image or rounded corners,
 *    `mj-navbar` (a Menu), `mj-spacer` (an empty divider), `mj-table` (a Table when it's a plain grid).
 * 3. Kept as the HTML MJML compiles it to, with a warning: `mj-hero`, `mj-carousel`, `mj-accordion`, and anything it
 *    doesn't know.
 *
 * `mj-social` becomes a Social block. What it changes in the content (each icon's alt text, as the editor writes it;
 * MJML's own icons, white on a colored square, as the editor's for the network) is declared, for the check to expect.
 */

import { headAttributes, resolveAttributes, type Resolved } from "./attributes";
import { designFont } from "./blocks";
import type { Context } from "./context";
import { colorValue, px } from "./css";
import { readHead } from "./head";
import { bodyRows, columnsLeftToRight } from "./layout";
import { parseMjml } from "./parse";
import type { Design, DesignRow, MjmlToDesignOptions, MjmlToDesignResult, Note, Values } from "./types";

export { isMjml3, isMjmlDocument } from "./parse";
export { referenceHtml } from "./fallback";
export { mjmlRuntime } from "./runtime";
export { MjmlVersionError } from "./types";
export type { Design, Fallback, IncludeResolver, MjmlNode, MjmlToDesignOptions, MjmlToDesignResult, Note } from "./types";

/** MJML's default font stack (`mj-text`'s and every component's). */
const MJML_FONT = "Ubuntu, Helvetica, Arial, sans-serif";

/** The font stack most of the text uses: the body's, so blocks only name another one. */
function commonFont(body: Resolved): string {
  const counts = new Map<string, number>();
  const visit = (node: Resolved) => {
    if (["mj-text", "mj-button", "mj-navbar-link", "mj-table"].includes(node.tag) && node.attrs["font-family"]) {
      counts.set(node.attrs["font-family"], (counts.get(node.attrs["font-family"]) ?? 0) + 1);
    }
    node.children.forEach(visit);
  };
  visit(body);
  return [...counts].sort((x, y) => y[1] - x[1])[0]?.[0] ?? MJML_FONT;
}

/** The design's ids and counters, as renderToJson numbers them. */
function numbered(rows: DesignRow[], bodyValues: Values): Design {
  const counters: Record<string, number> = {};
  const next = (name: string) => (counters[name] = (counters[name] ?? 0) + 1);
  for (const row of rows) {
    row.values._meta = { htmlID: `u_row_${next("u_row")}`, htmlClassNames: "u_row" };
    for (const column of row.columns) {
      column.values._meta = { htmlID: `u_column_${next("u_column")}`, htmlClassNames: "u_column" };
      for (const content of column.contents) {
        const name = `u_content_${content.type}`;
        content.values._meta = { htmlID: `${name}_${next(name)}`, htmlClassNames: name };
      }
    }
  }
  return { counters, body: { rows, values: { ...bodyValues, _meta: { htmlID: "u_body", htmlClassNames: "u_body" } } } };
}

export async function mjmlToDesign(source: string, options: MjmlToDesignOptions = {}): Promise<MjmlToDesignResult> {
  const warnings: Note[] = [];
  const info: Note[] = [];
  const document = parseMjml(source, options, { warnings, info });
  const headNode = document.children?.find((c) => c.tagName === "mj-head");
  const bodyNode = document.children?.find((c) => c.tagName === "mj-body");
  if (!bodyNode) throw new Error("it has no <mj-body>");
  const head = readHead(headNode, { warnings, info });
  const body = resolveAttributes(bodyNode, headAttributes(headNode));
  const bodyFont = commonFont(body);
  // Elements lays out every row's columns in the email's direction (right to left: the first on the right), where MJML
  // lays out each section's and group's by its own `direction`, left to right unless it says otherwise, whatever
  // <mjml dir> says (that's the page's): right to left only where none shows its columns left to right.
  const rtl = String(document.attributes?.dir ?? "").trim().toLowerCase() === "rtl";
  const direction = rtl && !columnsLeftToRight(body) ? "rtl" : "ltr";
  if (rtl && direction === "ltr") warnings.push({ reason: "mjml dir rtl not kept: its sections show their columns left to right, which Elements would reverse in a right-to-left email" });
  const ctx: Context = { head, headNode, root: document, bodyFont, direction, warnings, info, fallbacks: [], jobs: [], declared: [] };
  const width = Number.isFinite(px(body.attrs.width)) ? px(body.attrs.width) : 600;
  const rows = bodyRows(body, width, ctx);
  // Blocks compiling (a job may start another: a Social block that ends up as MJML's HTML).
  for (let done = 0; done < ctx.jobs.length; ) {
    const batch = ctx.jobs.slice(done);
    done = ctx.jobs.length;
    await Promise.all(batch);
  }

  const multiColumn = rows.some((r) => r.columns.length > 1 && !(r.values._override as { mobile?: { noStackMobile?: boolean } } | undefined)?.mobile?.noStackMobile);
  const breakpoint = head.breakpoint && Number.isFinite(px(head.breakpoint)) ? px(head.breakpoint) : 480;
  if (multiColumn) warnings.push({ reason: "columns stack on narrower screens", detail: `MJML stacks them below ${breakpoint}px, Elements below ${width + 20}px` });
  for (const rule of head.conditional) {
    const selectors = rule.condition === "state" ? rule.css.slice(0, rule.css.indexOf("{")).trim() : rule.condition;
    warnings.push({ reason: rule.condition === "state" ? "mj-style rule for a state (hover, focus) not kept" : "mj-style rule for some screens not kept", detail: selectors.replace(/\s+/g, " ").slice(0, 120) });
  }
  if (document.attributes?.["owa"] === "desktop") info.push({ reason: "Outlook.com's desktop layout setting (owa) not kept" });

  const bodyValues: Values = {
    contentWidth: `${Math.round(width)}px`,
    displayMode: "email",
    // MJML's page without a background is white; the editor's default is grey.
    backgroundColor: body.attrs["background-color"] ? colorValue(body.attrs["background-color"]) : "#ffffff",
    // A web font loads only for content: an empty template has none (Elements would add its <Font> among no rows).
    fontFamily: rows.length ? designFont(bodyFont, ctx) : { label: designFont(bodyFont, ctx).label, value: bodyFont },
    textColor: "#000000",
    ...(head.preview ? { preheaderText: head.preview } : {}),
    ...(direction === "rtl" ? { textDirection: "rtl" } : {}),
  };
  return { design: numbered(rows, bodyValues), warnings, fallbacks: ctx.fallbacks, info, document, declared: ctx.declared, ...(head.title ? { title: head.title } : {}) };
}
