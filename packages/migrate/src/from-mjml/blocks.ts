/**
 * MJML's content components → design blocks. Each takes the width its column gives it (inside the column's padding)
 * and its resolved attributes; what a block can't hold is noted, and what has no block at all is kept as the HTML MJML
 * compiles it to.
 */

import type { Resolved } from "./attributes";
import { fallbackBlock, type Context } from "./context";
import { border, borderValues, boxValue, colorValue, cssDeclarations, fontLabel, fontSize, fontWeight, letterSpacing, padding, px } from "./css";
import { asShown, blockHtml, pinColors } from "./fallback";
import { webFont } from "./head";
import { styledText, visibleHtml, type Declaration } from "./html";
import { social } from "./social";
import type { DesignContent, Values } from "./types";

/** A font stack as a design font: the label the editor shows, the stack, and its web font's URL when MJML links one. */
export function designFont(stack: string, ctx: Context): Values {
  const url = webFont(stack, ctx.head.fonts);
  return { label: fontLabel(stack), value: stack, ...(url ? { url } : {}) };
}

/** The font a block names: only when it isn't the body's. */
function blockFont(a: Record<string, string>, ctx: Context): Values {
  const stack = a["font-family"];
  return stack && stack !== ctx.bodyFont ? { fontFamily: designFont(stack, ctx) } : {};
}

function px2(n: number): string {
  return `${Math.round(n * 100) / 100}px`;
}

/** A length as the design types it (`8px`): a unitless number gets px; anything else is kept as written. */
function length(value: string | undefined): string | undefined {
  const v = (value ?? "").trim();
  if (!v) return undefined;
  return /^-?[\d.]+$/.test(v) ? `${Number(v)}px` : v;
}

/** A corner radius as the design types it (each corner in px). */
function radius(value: string | undefined): string | undefined {
  const v = (value ?? "").trim();
  if (!v) return undefined;
  const parts = v.split(/\s+/).map((part) => (/^-?[\d.]+(px)?$/.test(part) ? `${parseFloat(part)}px` : part));
  return parts.join(" ");
}

const note = (ctx: Context, reason: string, detail?: string) => ctx.warnings.push(detail === undefined ? { reason } : { reason, detail });

/** The CSS classes a node adds (`css-class`), as one element's class list, for the `mj-style` rules that target them. */
export function cssClasses(a: Record<string, string>): string[] {
  const list = (a["css-class"] ?? "").trim().replace(/\s+/g, " ");
  return list ? [list] : [];
}

export function contentBlocks(node: Resolved, width: number, ctx: Context, classes: string[]): DesignContent[] {
  switch (node.tag) {
    case "mj-text":
      return [text(node, ctx, classes)];
    case "mj-button":
      return [button(node, ctx, classes)];
    case "mj-image":
      return [image(node, width, ctx)];
    case "mj-divider":
      return [divider(node)];
    case "mj-spacer":
      return [spacer(node, ctx)];
    case "mj-raw":
      return raw(node, ctx);
    case "mj-table":
      return [table(node, width, ctx)];
    case "mj-navbar":
      return [navbar(node, width, ctx)];
    case "mj-social":
      return [social(node, width, ctx)];
    case "mj-carousel":
      return [fallbackBlock(ctx, node.tag, "mj-carousel: an interactive image gallery", () => blockHtml(node, width, ctx))];
    case "mj-accordion":
      return [fallbackBlock(ctx, node.tag, "mj-accordion: interactive sections that open and close", () => blockHtml(node, width, ctx))];
    default:
      return [fallbackBlock(ctx, node.tag, `${node.tag}: not an MJML component this converter knows`, () => blockHtml(node, width, ctx))];
  }
}

/** The styles a text block has no setting for, written around its HTML. */
function wrapped(html: string, declarations: Array<[string, string | undefined]>): string {
  const style = cssDeclarations(declarations);
  return style ? `<div style="${style}">${html}</div>` : html;
}

const HEADING_SIZES: Record<string, number> = { h1: 2, h2: 1.5, h3: 1.17, h4: 1 };
const HEADING_MARGINS: Record<string, number> = { h1: 0.67, h2: 0.83, h3: 1, h4: 1.33 };
/** The declarations a heading's own style may have for it to become a Heading block (each has a setting). */
const HEADING_STYLES = new Set(["font-size", "font-weight", "color", "line-height", "text-align", "margin", "margin-top", "margin-bottom", "letter-spacing", "font-family"]);

function styleOf(attributes: string): Map<string, string> {
  const style = /\bstyle\s*=\s*("([^"]*)"|'([^']*)')/i.exec(attributes);
  const out = new Map<string, string>();
  for (const declaration of (style?.[2] ?? style?.[3] ?? "").split(";")) {
    const at = declaration.indexOf(":");
    if (at > 0) out.set(declaration.slice(0, at).trim().toLowerCase(), declaration.slice(at + 1).trim().replace(/\s*!important$/i, ""));
  }
  return out;
}

/** A text that's one heading (`<h2>…</h2>`, with only inline content and styles a Heading has): its parts. */
function headingIn(html: string): { level: string; inner: string; style: Map<string, string> } | undefined {
  const match = /^\s*<(h[1-4])(\s[^>]*)?>([\s\S]*?)<\/\1>\s*$/i.exec(html);
  if (!match) return undefined;
  const [, level, attributes = "", inner] = match;
  if (/<\/?(h[1-6]|p|div|table|ul|ol|li|blockquote|section|img)\b/i.test(inner)) return undefined;
  if (/\s(class|id|align)\s*=/i.test(attributes)) return undefined;
  const style = styleOf(attributes);
  for (const name of style.keys()) if (!HEADING_STYLES.has(name)) return undefined;
  return { level: level.toLowerCase(), inner: inner.trim(), style };
}

/** What MJML writes on an `mj-text`'s box from its attributes (a stylesheet rule wins over these only with !important). */
const TEXT_BOX = ["font-family", "font-size", "line-height", "text-align", "color"];
const TEXT_BOX_IF_SET = ["font-style", "font-weight", "letter-spacing", "text-decoration", "text-transform", "height"];
/** What the text's box inherits from the cell around it, where the box sets nothing. */
const INHERITED = new Set(["font-weight", "font-style", "letter-spacing", "text-transform", "word-spacing", "white-space", "font-variant", "text-indent", "visibility"]);

/**
 * The text's attributes with what `mj-style` rules give its box: a rule on the box itself (`.footer div`) wins where
 * MJML writes nothing or with `!important`; what the cell it's in gets (`.footer`) is inherited where neither sets it.
 */
function textAttributes(a: Record<string, string>, own: Declaration[], cell: Declaration[]): { attrs: Record<string, string>; extra: Array<[string, string]> } {
  const attrs = { ...a };
  const extra: Array<[string, string]> = [];
  const writtenByMjml = (property: string) => TEXT_BOX.includes(property) || (TEXT_BOX_IF_SET.includes(property) && !!a[property]);
  const ownProperties = new Set(own.map((d) => d.property));
  const apply = (d: Declaration) => {
    const attribute = { "font-family": "font-family", "font-size": "font-size", "line-height": "line-height", "text-align": "align", color: "color", "font-weight": "font-weight", "letter-spacing": "letter-spacing", "font-style": "font-style", "text-decoration": "text-decoration", "text-transform": "text-transform" }[d.property];
    if (attribute) attrs[attribute] = d.value;
    else extra.push([d.property, d.value]);
  };
  for (const d of cell) if (INHERITED.has(d.property) && !writtenByMjml(d.property) && !ownProperties.has(d.property)) apply(d);
  for (const d of own) if (d.important || !writtenByMjml(d.property)) apply(d);
  return { attrs, extra };
}

function text(node: Resolved, ctx: Context, classes: string[]): DesignContent {
  const styled = styledText(node.content, ctx, [...classes, ...cssClasses(node.attrs)]);
  const { attrs: a, extra } = textAttributes(node.attrs, styled.own, styled.cell);
  // A table in the text inherits its color in MJML's page; Elements' colors tables as the page's text.
  const html = /<table\b/i.test(styled.html) ? pinColors(styled.html, colorValue(a.color)) : styled.html;
  const size = fontSize(a["font-size"]) ?? 13;
  const pad = padding(a);
  const background = a["container-background-color"];
  const heading = background || extra.length ? undefined : headingIn(html);
  if (heading) return headingBlock({ ...node, attrs: a }, heading, size, ctx);
  const spacing = letterSpacing(a["letter-spacing"], size);
  let content = wrapped(html, [
    ["font-style", a["font-style"]],
    ["text-decoration", a["text-decoration"]],
    ["text-transform", a["text-transform"]],
    ["height", length(a.height)],
    ...extra,
  ]);
  // The cell's background (the padding too): around the text, with the padding inside it.
  if (background) content = wrapped(content, [["background-color", background], ["padding", boxValue(pad)]]);
  return {
    type: "text",
    values: {
      text: content,
      color: colorValue(a.color),
      fontSize: px2(size),
      lineHeight: a["line-height"] || "normal",
      textAlign: a.align || "left",
      ...blockFont(a, ctx),
      ...(a["font-weight"] ? { fontWeight: fontWeight(a["font-weight"]) ?? 400 } : {}),
      ...(spacing !== undefined ? { letterSpacing: px2(spacing) } : {}),
      containerPadding: background ? "0px" : boxValue(pad),
    },
  };
}

function headingBlock(node: Resolved, heading: { level: string; inner: string; style: Map<string, string> }, size: number, ctx: Context): DesignContent {
  const a = node.attrs;
  const { level, inner, style } = heading;
  // Its size: its own (in px, or relative to the text's: `inherit`, em, %), else the browser's for its level.
  const ownSize = (style.get("font-size") ?? "").trim().toLowerCase();
  const relative = ownSize === "inherit" || ownSize === "unset" ? 1 : /^[\d.]+em$/.test(ownSize) ? parseFloat(ownSize) : /^[\d.]+%$/.test(ownSize) ? parseFloat(ownSize) / 100 : undefined;
  const headingSize = fontSize(ownSize) ?? Math.round(size * (relative ?? HEADING_SIZES[level]) * 100) / 100;
  // The heading's margins (the browser's, or its own) are space in the block's padding.
  const margin = (side: "top" | "bottom") => {
    const all = style.get("margin")?.trim().split(/\s+/);
    const value = style.get(`margin-${side}`) ?? (all ? all[side === "top" ? 0 : all.length > 2 ? 2 : 0] : undefined);
    if (value !== undefined) return Number.isFinite(px(value)) ? px(value) : /^[\d.]+em$/.test(value) ? parseFloat(value) * headingSize : 0;
    return HEADING_MARGINS[level] * headingSize;
  };
  const inherits = (value: string | undefined) => value === undefined || /^(inherit|unset)$/i.test(value.trim());
  const pad = padding(a);
  const stack = inherits(style.get("font-family")) ? a["font-family"] : style.get("font-family");
  const spacing = letterSpacing(inherits(style.get("letter-spacing")) ? a["letter-spacing"] : style.get("letter-spacing"), headingSize);
  const weight = (inherits(style.get("font-weight")) && style.has("font-weight") ? fontWeight(a["font-weight"]) ?? 400 : fontWeight(style.get("font-weight"))) ?? 700;
  ctx.info.push({ reason: "mj-text holding one heading became a Heading" });
  return {
    type: "heading",
    values: {
      headingType: level,
      text: wrapped(inner, [
        ["font-style", a["font-style"]],
        ["text-decoration", a["text-decoration"]],
        ["text-transform", a["text-transform"]],
      ]).replace(/^<div /, "<span ").replace(/<\/div>$/, "</span>"),
      color: colorValue(inherits(style.get("color")) ? a.color : style.get("color")),
      fontSize: px2(headingSize),
      fontWeight: weight,
      lineHeight: inherits(style.get("line-height")) ? a["line-height"] || "normal" : style.get("line-height"),
      textAlign: inherits(style.get("text-align")) ? a.align || "left" : style.get("text-align"),
      ...(stack && stack !== ctx.bodyFont ? { fontFamily: designFont(stack, ctx) } : {}),
      ...(spacing !== undefined ? { letterSpacing: px2(spacing) } : {}),
      containerPadding: boxValue([pad[0] + margin("top"), pad[1], pad[2] + margin("bottom"), pad[3]]),
    },
  };
}

/** What MJML writes on a button's link: rules win over these only with !important. */
const BUTTON_LINK = ["display", "background", "color", "font-family", "font-size", "font-weight", "line-height", "margin", "text-decoration", "text-transform", "padding", "border-radius"];

/**
 * The button's attributes with what `mj-style` rules give its link (an `a { color: inherit !important }` reset): an
 * `!important` one, or one MJML doesn't write. `inherit` takes what the cell around it gets, else the page's black.
 */
function buttonAttributes(a: Record<string, string>, own: Declaration[], cell: Declaration[]): Record<string, string> {
  const attrs = { ...a };
  const names: Record<string, string> = { color: "color", "font-family": "font-family", "font-size": "font-size", "font-weight": "font-weight", "line-height": "line-height", "letter-spacing": "letter-spacing", "text-decoration": "text-decoration", "text-transform": "text-transform", "font-style": "font-style" };
  for (const d of own) {
    const name = names[d.property];
    if (!name || !(d.important || !BUTTON_LINK.includes(d.property))) continue;
    attrs[name] = /^(inherit|unset)$/i.test(d.value) ? cell.find((c) => c.property === d.property)?.value ?? (d.property === "color" ? "#000000" : "") : d.value;
    if (!attrs[name]) delete attrs[name];
  }
  return attrs;
}

function button(node: Resolved, ctx: Context, classes: string[]): DesignContent {
  const styled = styledText(node.content, ctx, [...classes, ...cssClasses(node.attrs)], "a");
  const a = buttonAttributes(node.attrs, styled.own, styled.cell);
  const size = fontSize(a["font-size"]) ?? 13;
  const spacing = letterSpacing(a["letter-spacing"], size);
  if (a.height && a.height !== "auto") note(ctx, "button height not kept (Elements sizes a button by its padding)", a.height);
  if (a["container-background-color"]) note(ctx, "block background not kept", `mj-button: ${a["container-background-color"]}`);
  const label = wrapped(styled.html, [
    ["font-style", a["font-style"]],
    ["text-decoration", a["text-decoration"] === "none" ? undefined : a["text-decoration"]],
    ["text-transform", a["text-transform"] === "none" ? undefined : a["text-transform"]],
  ]).replace(/^<div /, "<span ").replace(/<\/div>$/, "</span>");
  const background = colorValue(a["background-color"]);
  const color = colorValue(a.color);
  const width = length(a.width);
  return {
    type: "button",
    values: {
      text: label,
      href: { name: "web", values: { href: a.href ?? "", target: a.target || "_blank" } },
      buttonColors: { color, backgroundColor: background, hoverColor: color, hoverBackgroundColor: background },
      size: width ? { autoWidth: false, width } : { autoWidth: true, width: "100%" },
      fontSize: px2(size),
      fontWeight: fontWeight(a["font-weight"]) ?? 400,
      ...blockFont(a, ctx),
      lineHeight: a["line-height"] || "120%",
      ...(spacing !== undefined ? { letterSpacing: px2(spacing) } : {}),
      padding: boxValue(padding(a, "inner-padding")),
      border: borderValues(a.border) ?? {},
      borderRadius: radius(a["border-radius"]) ?? "0px",
      textAlign: a.align || "center",
      containerPadding: boxValue(padding(a)),
    },
  };
}

function image(node: Resolved, width: number, ctx: Context): DesignContent {
  const a = node.attrs;
  const pad = padding(a);
  const box = Math.max(1, width - pad[1] - pad[3]);
  const given = px(a.width);
  const shown = Number.isFinite(given) && given > 0 ? Math.min(given, box) : box;
  if (a.height && a.height !== "auto") note(ctx, "image height not kept (Elements keeps an image's proportions)", a.height);
  if (radius(a["border-radius"]) && !/^0(px)?$/.test(a["border-radius"].trim())) note(ctx, "image border radius dropped", a["border-radius"]);
  if (border(a.border)) note(ctx, "image border dropped", a.border);
  if (a["fluid-on-mobile"] === "true") note(ctx, "image full width on phones not kept (it keeps its share of the column)");
  if (a["container-background-color"]) note(ctx, "block background not kept", `mj-image: ${a["container-background-color"]}`);
  return {
    type: "image",
    values: {
      src: { url: a.src ?? "", width: Math.round(shown), autoWidth: false, maxWidth: `${Math.round((shown / box) * 10000) / 100}%` },
      altText: a.alt ?? "",
      textAlign: a.align || "center",
      ...(a.href ? { action: { name: "web", values: { href: a.href, target: a.target || "_blank" } } } : {}),
      containerPadding: boxValue(pad),
    },
  };
}

function divider(node: Resolved): DesignContent {
  const a = node.attrs;
  const widthPx = px(a["border-width"]);
  return {
    type: "divider",
    values: {
      border: { borderTopWidth: px2(Number.isFinite(widthPx) ? widthPx : 4), borderTopStyle: a["border-style"] || "solid", borderTopColor: colorValue(a["border-color"]) },
      width: length(a.width) ?? "100%",
      textAlign: a.align || "center",
      containerPadding: boxValue(padding(a)),
    },
  };
}

/** A spacer: an empty divider (no line) its height tall, which the editor shows and lets you resize. */
function spacer(node: Resolved, ctx: Context): DesignContent {
  const a = node.attrs;
  const height = px(a.height);
  const pad = padding(a);
  ctx.info.push({ reason: "mj-spacer became an empty divider of its height" });
  return {
    type: "divider",
    values: {
      border: { borderTopWidth: "0px", borderTopStyle: "solid", borderTopColor: "transparent" },
      width: "100%",
      textAlign: "center",
      containerPadding: boxValue([pad[0] + (Number.isFinite(height) ? height : 20), pad[1], pad[2], pad[3]]),
    },
  };
}

/** `mj-raw` in a column: its HTML as an Html block, as it is; markup no reader sees (Outlook-only, comments) goes. */
function raw(node: Resolved, ctx: Context): DesignContent[] {
  if (!visibleHtml(node.content)) {
    if (node.content.trim()) ctx.info.push({ reason: "mj-raw with nothing a reader sees left out (comments, Outlook-only markup)" });
    return [];
  }
  ctx.fallbacks.push({ tag: node.tag, reason: "mj-raw: the template's own HTML" });
  return [{ type: "html", values: { html: asShown(node.content, ctx), containerPadding: "0px" } }];
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'" };

function decode(text: string): string {
  return text.replace(/&(#x[\da-f]+|#\d+|[a-z]+\d*);/gi, (all, name: string) => {
    if (/^#x/i.test(name)) return String.fromCodePoint(parseInt(name.slice(2), 16));
    if (/^#/.test(name)) return String.fromCodePoint(Number(name.slice(1)));
    return ENTITIES[name.toLowerCase()] ?? all;
  });
}

/** Attributes a plain grid's rows and cells may have: where text sits, not how it looks (a Table sets that itself). */
const GRID_ATTRIBUTES = new Set(["style", "align", "valign", "width", "height"]);
const GRID_STYLES = /^(padding(-(top|right|bottom|left))?|text-align|vertical-align|width|height)$/;

function plainAttributes(attributes: string): boolean {
  for (const [, name] of attributes.matchAll(/([^\s=]+)\s*(?:=\s*("[^"]*"|'[^']*'|[^\s>]+))?/g)) {
    if (!GRID_ATTRIBUTES.has(name.toLowerCase())) return false;
  }
  for (const property of styleOf(attributes).keys()) if (!GRID_STYLES.test(property)) return false;
  return true;
}

/**
 * A table that's a plain grid: rows of the same number of cells, plain text in each, nothing spanning, and no style of
 * its own on a row or cell but where its text sits (colors, backgrounds and borders would be lost).
 */
function grid(html: string): { headers?: string[]; rows: string[][] } | undefined {
  const body = html.replace(/<!--[\s\S]*?-->/g, "").replace(/<\/?(thead|tbody|tfoot)\b[^>]*>/gi, "");
  const rows: Array<{ header: boolean; cells: string[] }> = [];
  let rest = body;
  for (const match of body.matchAll(/<tr\b([^>]*)>([\s\S]*?)<\/tr>/gi)) {
    rest = rest.replace(match[0], "");
    if (!plainAttributes(match[1])) return undefined;
    const cells: string[] = [];
    let header = true;
    let leftover = match[2];
    for (const cell of match[2].matchAll(/<(t[dh])\b([^>]*)>([\s\S]*?)<\/\1>/gi)) {
      leftover = leftover.replace(cell[0], "");
      if (!plainAttributes(cell[2])) return undefined;
      if (/</.test(cell[3])) return undefined;
      if (cell[1].toLowerCase() === "td") header = false;
      cells.push(decode(cell[3].replace(/\s+/g, " ").trim()));
    }
    if (leftover.trim() || !cells.length) return undefined;
    rows.push({ header, cells });
  }
  if (rest.trim() || !rows.length) return undefined;
  const columns = rows[0].cells.length;
  if (rows.some((r) => r.cells.length !== columns)) return undefined;
  const [first, ...others] = rows;
  return first.header && others.length ? { headers: first.cells, rows: others.map((r) => r.cells) } : { rows: rows.map((r) => r.cells) };
}

function table(node: Resolved, width: number, ctx: Context): DesignContent {
  const a = node.attrs;
  const found = grid(node.content);
  if (!found) return fallbackBlock(ctx, node.tag, "mj-table: not a plain grid (cells with markup, spans or rows of other lengths)", () => blockHtml(node, width, ctx));
  note(ctx, "mj-table became a Table: its cells' own styles aren't kept");
  const cellsOf = (cells: string[]) => ({ cells: cells.map((text) => ({ text, width: 0 })), height: 0 });
  const size = fontSize(a["font-size"]) ?? 13;
  const cellPadding = px(a.cellpadding);
  const none = { borderTopWidth: "0px", borderTopStyle: "solid", borderTopColor: "transparent", borderLeftWidth: "0px", borderLeftStyle: "solid", borderLeftColor: "transparent", borderRightWidth: "0px", borderRightStyle: "solid", borderRightColor: "transparent", borderBottomWidth: "0px", borderBottomStyle: "solid", borderBottomColor: "transparent" };
  return {
    type: "table",
    values: {
      table: { headers: found.headers ? [cellsOf(found.headers)] : [], rows: found.rows.map(cellsOf), footers: [] },
      columns: (found.headers ?? found.rows[0]).length,
      rows: found.rows.length,
      enableHeader: !!found.headers,
      border: borderValues(a.border) ?? none,
      headerBackgroundColor: "transparent",
      headerFontSize: px2(size),
      contentBackgroundColor: "transparent",
      contentFontSize: px2(size),
      contentLineHeight: a["line-height"] || "22px",
      contentTextAlign: a.align || "left",
      contentPadding: px2(Number.isFinite(cellPadding) ? cellPadding : 0),
      headerPadding: px2(Number.isFinite(cellPadding) ? cellPadding : 0),
      containerPadding: boxValue(padding(a)),
    },
  };
}

function navbar(node: Resolved, width: number, ctx: Context): DesignContent {
  const a = node.attrs;
  const links = node.children.filter((c) => c.tag === "mj-navbar-link");
  // A hamburger shows other words on phones (its icons): kept as it is.
  if (a.hamburger === "hamburger" || links.some((l) => /</.test(l.content)) || node.children.some((c) => c.tag !== "mj-navbar-link")) {
    return fallbackBlock(ctx, node.tag, "mj-navbar: a menu with a hamburger, or links with markup", () => blockHtml(node, width, ctx));
  }
  const first = links[0]?.attrs ?? {};
  const keys = ["color", "font-family", "font-size", "font-weight", "padding", "text-transform", "letter-spacing"];
  if (links.some((l) => keys.some((k) => (l.attrs[k] ?? "") !== (first[k] ?? "")))) note(ctx, "navbar links in different styles: the menu uses the first one's");
  if (first["text-transform"] && first["text-transform"] !== "none") note(ctx, "navbar letter case not kept (a menu has no setting for it)", first["text-transform"]);
  if (first["text-decoration"] && first["text-decoration"] !== "none") note(ctx, "navbar link underline not kept", first["text-decoration"]);
  const size = fontSize(first["font-size"]) ?? 13;
  const spacing = letterSpacing(first["letter-spacing"], size);
  const color = colorValue(first.color);
  const base = a["base-url"] ?? "";
  ctx.warnings.push({ reason: "mj-navbar became a Menu" });
  return {
    type: "menu",
    values: {
      menu: {
        items: links.map((link, i) => ({
          key: String(i + 1),
          text: decode(link.content.replace(/\s+/g, " ").trim()),
          link: { name: "web", values: { href: `${base}${link.attrs.href ?? ""}`, target: link.attrs.target || "_blank" } },
        })),
      },
      fontSize: px2(size),
      textColor: color,
      linkColor: color,
      ...(first["font-family"] && first["font-family"] !== ctx.bodyFont ? { fontFamily: designFont(first["font-family"], ctx) } : {}),
      ...(first["font-weight"] ? { fontWeight: fontWeight(first["font-weight"]) ?? 400 } : {}),
      ...(spacing !== undefined ? { letterSpacing: px2(spacing) } : {}),
      padding: boxValue(padding(first)),
      align: a.align || "center",
      layout: "horizontal",
      separator: "",
      containerPadding: boxValue(padding(a)),
    },
  };
}
