/**
 * Email HTML from a resolved document. Email clients are the hard target:
 * classic Outlook lays out with Word (no flexbox, no sizes on divs, no
 * padding on inline elements), and Gmail drops `<style>` for some accounts.
 * So (docs/rfcs/0001-primitives-and-exporters.md, Email):
 *
 * 1. Right without `<style>`: layout at desktop width, colors, fonts, sizes
 *    and spacing are inline. The stylesheet only adds phone overrides,
 *    hiding, hover and client resets.
 * 2. Widths are the resolver's, in px: Word sizes tables, cells and images by
 *    their attributes and ignores the sizes of divs.
 * 3. Tables for layout (`role="presentation"`, no spacing or borders),
 *    spacing as cell padding, never margins.
 * 4. Outlook-only markup only inside `<!--[if mso]>`.
 *
 * Choices measured against classic Outlook (unlayer/email-renderer,
 * oracle/CALIBRATION.md): a 100% table with a px `max-width` is that width in
 * Word, so a box with its own width is `width="100%" style="max-width:…"`,
 * fluid elsewhere; a cell's width includes its padding; line heights are px
 * with `mso-line-height-rule: exactly` (Word drops unitless ones). Buttons
 * are tables, not VML: Word draws a VML button's label in its own font,
 * wrapped inside the shape's fixed size.
 */
import { assetParts, Diagnostics, lineHeightPx, linkParts, type Asset, type Diagnostic, type Json, type LinkValue, type ResolvedDocument, type ResolvedNode } from "@unlayer-internal/elements-core";
import { Stylesheet } from "./classes";
import { attrs, border, css, escapeText, fontFamily, insets, length, px, radius, styleAttr, textDeclarations, textValue, type Declarations } from "./css";

export interface EmailOptions {
  /** How a merge tag is written (default `{{name}}`). */
  mergeTag?: (name: string) => string;
  /** What every class name in the stylesheet starts with (default "e"). */
  classPrefix?: string;
}

export interface EmailHtml {
  /** The whole email, from `<!DOCTYPE html>`. */
  html: string;
  /** What goes in `<head>`: meta tags, Outlook's settings, the title, the stylesheet. */
  head: string;
  /** What goes in `<body>`: the preview text and the email. */
  body: string;
  /** The `<body>`'s own style. */
  bodyStyle: string;
  /** What email can't do as asked (Outlook's square corners, an image without a width), and size budgets. */
  diagnostics: Diagnostic[];
}

/** An email is on a phone below its content width plus this. */
export const EMAIL_PHONE_MARGIN = 20;
/** Gmail clips a message at this many bytes of HTML ("[Message clipped]"). */
export const GMAIL_CLIP_BYTES = 102_400;
/** Gmail reads this much of a `<style>`. */
export const GMAIL_STYLE_BYTES = 16_384;

interface Context {
  options: EmailOptions;
  sheet: Stylesheet;
  fonts: Map<string, string>;
  d: Diagnostics;
}

/** Text styles a phone override changes, inherited down to the text that doesn't set them itself. */
type MobileText = Record<string, Json>;
const TEXT_KEYS = ["color", "fontFamily", "fontSize", "fontWeight", "fontStyle", "lineHeight", "letterSpacing", "textAlign", "textTransform"];

const TABLE = { role: "presentation", cellpadding: "0", cellspacing: "0", border: "0" };
const VALIGN: Record<string, string> = { start: "top", center: "middle", end: "bottom", stretch: "top" };
const ALIGN: Record<string, string | undefined> = { start: undefined, center: "center", end: "right", stretch: undefined };
const TEXT_ALIGN: Record<string, string | undefined> = { left: "left", justify: "left", center: "center", right: "right" };

const isNode = (child: ResolvedNode | string): child is ResolvedNode => typeof child !== "string";
const shown = (node: ResolvedNode) => !(node.hidden?.mobile && node.hidden?.desktop);

export function renderEmail(resolved: ResolvedDocument, options: EmailOptions = {}): EmailHtml {
  const root = resolved.root;
  const context: Context = { options, sheet: new Stylesheet(options.classPrefix), fonts: new Map(), d: new Diagnostics() };
  collectFonts(root, context);
  const width = root.width ?? 600;
  const email = renderRoot(root, context);

  const background = root.style.backgroundColor as string | undefined;
  const lang = root.props.lang as string | undefined;
  const dir = root.props.dir as string | undefined;
  const title = typeof root.props.title === "string" ? root.props.title : undefined;
  const preview = typeof root.props.previewText === "string" && root.props.previewText ? root.props.previewText : undefined;

  const resets =
    "table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}img{-ms-interpolation-mode:bicubic}a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important}";
  const stylesheet = resets + context.sheet.css(`@media (max-width: ${width + EMAIL_PHONE_MARGIN}px)`, `@media (min-width: ${width + EMAIL_PHONE_MARGIN + 1}px)`);
  const head = [
    '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="x-apple-disable-message-reformatting">',
    '<meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">',
    '<meta name="color-scheme" content="light">',
    '<meta name="supported-color-schemes" content="light">',
    "<!--[if mso]><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->",
    title !== undefined ? `<title>${escapeText(title)}</title>` : "",
    // Outlook falls back to Times New Roman for a family it has to download: web fonts only for the others.
    context.fonts.size ? `<!--[if !mso]><!--><style>${[...context.fonts.values()].join("")}</style><!--<![endif]-->` : "",
    `<style>${stylesheet}</style>`,
  ].join("");

  // Preview text: shown after the subject in inbox lists, hidden in the email; the filler keeps
  // clients from adding the email's first words after it.
  const preheader = preview
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all" aria-hidden="true">${escapeText(preview)}${"&#847;&zwnj;&nbsp;".repeat(30)}</div>`
    : "";
  // Gmail drops <html>'s attributes and <body>: the language, direction and background are kept on the email too.
  const body =
    preheader +
    `<div${attrs({ role: "article", "aria-roledescription": "email", "aria-label": title, lang, dir })}${styleAttr([["background-color", background]])}>${email}</div>`;
  const bodyStyle = css([
    ["margin", "0"],
    ["padding", "0"],
    ["background-color", background],
  ]);
  const html =
    `<!DOCTYPE html><html${attrs({ lang, dir, xmlns: "http://www.w3.org/1999/xhtml", "xmlns:o": "urn:schemas-microsoft-com:office:office" })}>` +
    `<head>${head}</head><body${styleAttr([["margin", "0"], ["padding", "0"], ["background-color", background]])}>${body}</body></html>`;

  const bytes = new TextEncoder().encode(html).length;
  if (bytes > GMAIL_CLIP_BYTES) {
    context.d.warning("email/size", `The email is ${Math.round(bytes / 1024)} KB; Gmail clips a message after ${GMAIL_CLIP_BYTES / 1024} KB ("[Message clipped]")`, "root");
  }
  const styleBytes = new TextEncoder().encode(stylesheet).length;
  if (styleBytes > GMAIL_STYLE_BYTES) {
    context.d.warning("email/style-size", `The stylesheet is ${Math.round(styleBytes / 1024)} KB; Gmail reads ${GMAIL_STYLE_BYTES / 1024} KB of a <style>`, "root");
  }
  return { html, head, body, bodyStyle, diagnostics: context.d.list };
}

// ─── Markup helpers ─────────────────────────────────────────────────────────

type Attributes = Record<string, string | number | undefined | null | false>;

function table(attributes: Attributes, style: Declarations, rows: string): string {
  return `<table${attrs({ id: attributes.id, ...TABLE, ...attributes })}${styleAttr(style)}>${rows}</table>`;
}

/** A color Word reads as a `bgcolor` attribute (hex only). */
const bgcolor = (value: Json | undefined) => (typeof value === "string" && /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(value) ? value : undefined);

/** Markup in pieces: what only Outlook reads, what all but Outlook read, and what everyone reads; neighbours of a kind share one comment. */
class Conditional {
  private parts: Array<["mso" | "not" | "all", string]> = [];
  mso(html: string) {
    return this.add("mso", html);
  }
  notMso(html: string) {
    return this.add("not", html);
  }
  all(html: string) {
    return this.add("all", html);
  }
  private add(kind: "mso" | "not" | "all", html: string) {
    if (!html) return this;
    const last = this.parts[this.parts.length - 1];
    if (last && last[0] === kind) last[1] += html;
    else this.parts.push([kind, html]);
    return this;
  }
  toString(): string {
    return this.parts.map(([kind, html]) => (kind === "mso" ? `<!--[if mso]>${html}<![endif]-->` : kind === "not" ? `<!--[if !mso]><!-->${html}<!--<![endif]-->` : html)).join("");
  }
}

/** Joined class names, or undefined. */
const names = (...classes: Array<string | undefined>) => classes.filter(Boolean).join(" ") || undefined;

// ─── Widths ─────────────────────────────────────────────────────────────────

const sized = (node: ResolvedNode) => node.style.width !== undefined || node.style.maxWidth !== undefined;

/**
 * A box's table: filling its cell, or its own width as a percentage or a px
 * maximum (fluid on phones; Word takes the maximum as the width).
 */
function boxWidth(node: ResolvedNode, fill: boolean): { attributes: Attributes; style: Declarations } {
  if (fill || (!sized(node) && node.definition.sizing === "stretch")) return { attributes: { width: "100%" }, style: [] };
  if (typeof node.style.width === "string" && node.style.width.endsWith("%") && node.style.maxWidth === undefined) {
    return { attributes: { width: node.style.width }, style: [] };
  }
  if (node.width !== null) return { attributes: { width: "100%" }, style: [["max-width", px(node.width)]] };
  return { attributes: {}, style: [] };
}

/** A phone width for a table or div: a percentage of its cell, or a px maximum. */
function phoneWidth(value: Json): Declarations {
  const written = length(value);
  if (written === undefined) return [];
  return typeof value === "string" && value.endsWith("%") ? [["width", written], ["max-width", "none"]] : [["width", "100%"], ["max-width", written]];
}

/**
 * Where a child sits across a stack: one that fills the width fills it; one
 * with its own size (a Button, an Image, a box with a width) sits where the
 * stack's `align` says, else where its text alignment says. As a cell's
 * `align`, which every client (Word too) applies to the tables and images in it.
 */
function cellAlign(child: ResolvedNode, stack: ResolvedNode): string | undefined {
  if (child.type === "Divider") return TEXT_ALIGN[stack.text.textAlign] === "left" ? undefined : TEXT_ALIGN[stack.text.textAlign];
  if (child.definition.sizing !== "shrink" && !sized(child)) return undefined;
  const align = stack.style.align as string | undefined;
  if (align) return ALIGN[align];
  const text = TEXT_ALIGN[stack.text.textAlign];
  return text === "left" ? undefined : text;
}

// ─── Classes: phones, hiding, hover ─────────────────────────────────────────

function phoneClass(context: Context, declarations: Declarations, selector = ""): string | undefined {
  const text = css(declarations, true);
  return text ? context.sheet.classFor("phone", `&${selector}{${text}}`) : undefined;
}

/** Hidden on phones: a class. Hidden on desktop: inline, and shown on phones by a class (`display` is how it shows). */
function hiding(node: ResolvedNode, context: Context, display: string): { className?: string; style: Declarations } {
  if (node.hidden?.mobile) return { className: context.sheet.classFor("phone", "&{display:none!important}"), style: [] };
  if (node.hidden?.desktop) return { className: context.sheet.classFor("phone", `&{display:${display}!important}`), style: [["display", "none"]] };
  return { style: [] };
}

function hoverClass(node: ResolvedNode, context: Context, selector = ""): string | undefined {
  if (!node.hover) return undefined;
  const declarations: Declarations = [];
  for (const [key, value] of Object.entries(node.hover)) {
    if (key === "color") declarations.push(["color", value as string]);
    else if (key === "backgroundColor") declarations.push(["background-color", value as string]);
    else if (key === "textDecoration") declarations.push(["text-decoration", value as string]);
  }
  return context.sheet.classFor("all", `&:hover${selector}{${css(declarations, true)}}`);
}

/** What a phone override does to a box: its padding, border and background. */
function phoneBox(node: ResolvedNode): Declarations {
  const mobile = node.mobile ?? {};
  return [
    ["padding", insets(mobile.padding)],
    ...border(mobile.border),
    ["background-color", mobile.backgroundColor as string | undefined],
  ];
}

/** The phone text styles of a node's own text: its own overrides, and its parents' where it doesn't set the style itself. */
function mobileTextOf(node: ResolvedNode, inherited: MobileText): MobileText {
  const out: MobileText = {};
  for (const key of TEXT_KEYS) if (inherited[key] !== undefined && node.style[key] === undefined) out[key] = inherited[key];
  for (const key of TEXT_KEYS) if (node.mobile?.[key] !== undefined) out[key] = node.mobile[key];
  return out;
}

/** Phone text styles as CSS; the line height in px, as inline, so a larger size gets a taller line. */
function phoneText(node: ResolvedNode, mobile: MobileText): Declarations {
  const out: Declarations = [];
  for (const [key, value] of Object.entries(mobile)) {
    if (key === "lineHeight") continue;
    const written = textValue(key, value);
    if (written !== undefined) out.push([key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`), written]);
  }
  if (mobile.fontSize !== undefined || mobile.lineHeight !== undefined) {
    const size = (mobile.fontSize as number | undefined) ?? node.text.fontSize;
    out.push(["line-height", px(lineHeightPx((mobile.lineHeight as never) ?? node.text.lineHeight, size))]);
  }
  return out;
}

// ─── Text ───────────────────────────────────────────────────────────────────

/**
 * All of a node's text styles: every client gets them on the element with the
 * text, as Outlook doesn't carry styles down through tables. The line height
 * in px, exactly.
 */
function fullText(node: ResolvedNode, { weight = false, align = true } = {}): Declarations {
  const { text } = node;
  return [
    ["color", text.color],
    ["font-family", fontFamily(text.fontFamily)],
    ["font-size", px(text.fontSize)],
    ["font-weight", weight || text.fontWeight !== 400 ? String(text.fontWeight) : undefined],
    ["font-style", text.fontStyle === "italic" ? "italic" : undefined],
    ["line-height", px(text.lineHeightPx)],
    ["mso-line-height-rule", "exactly"],
    ["letter-spacing", text.letterSpacing ? px(text.letterSpacing) : undefined],
    ["text-align", align ? text.textAlign : undefined],
    ["text-transform", text.textTransform !== "none" ? text.textTransform : undefined],
  ];
}

/** Text inside text: only what differs from its parent, and its line height in px where its size changes it. */
function runText(node: ResolvedNode, parent: ResolvedNode, always: Array<"color"> = []): Declarations {
  const out = textDeclarations(node.text, parent.text, always).filter(([property]) => property !== "line-height");
  if (node.text.lineHeightPx !== parent.text.lineHeightPx) out.push(["line-height", px(node.text.lineHeightPx)]);
  return out;
}

function inline(node: ResolvedNode, context: Context): string {
  return node.children.map((child) => (typeof child === "string" ? escapeText(child) : renderInline(child, node, context))).join("");
}

function renderInline(node: ResolvedNode, parent: ResolvedNode, context: Context): string {
  if (!shown(node)) return "";
  const hidden = hiding(node, context, "inline");
  switch (node.type) {
    case "Span": {
      const style = styleAttr([...runText(node, parent), ["text-decoration", node.style.textDecoration as string | undefined], ["background-color", node.style.backgroundColor as string | undefined], ...hidden.style]);
      return `<span${attrs({ id: node.id, class: hidden.className })}${style}>${inline(node, context)}</span>`;
    }
    case "Link": {
      const { href, target } = linkParts(node.props.href as LinkValue);
      const style = styleAttr([
        ...runText(node, parent, ["color"]),
        ["text-decoration", node.style.textDecoration as string | undefined],
        ["background-color", node.style.backgroundColor as string | undefined],
        ...hidden.style,
      ]);
      const className = names(hidden.className, hoverClass(node, context));
      return `<a${attrs({ id: node.id, class: className, href, target, rel: target === "_blank" ? "noopener noreferrer" : undefined })}${style}>${inline(node, context)}</a>`;
    }
    case "Image":
      return renderImage(node, context, false, true);
    case "LineBreak":
      return "<br>";
    case "MergeTag":
      return escapeText((context.options.mergeTag ?? ((name: string) => `{{${name}}}`))(node.props.name as string));
    default:
      throw new Error(`[Elements] The email exporter can't render a ${node.type} inside text`);
  }
}

// ─── Boxes and stacks ───────────────────────────────────────────────────────

const BOX_KEYS = ["padding", "border", "backgroundColor"];

/**
 * A node's box (background, padding, border, corners, height, width) as a
 * one-cell table around its content; Word has none of these on a div or a
 * paragraph. No table where there's no box: the content fills its cell.
 */
function boxed(node: ResolvedNode, context: Context, fill: boolean, inner: (id: string | undefined) => string): string {
  const { style } = node;
  const mobile = node.mobile ?? {};
  const framed = ["padding", "border", "borderRadius", "backgroundColor", "height"].some((key) => style[key] !== undefined) || BOX_KEYS.some((key) => mobile[key] !== undefined);
  const width = boxWidth(node, fill);
  const ownWidth = width.attributes.width !== "100%" || width.style.length > 0 || mobile.width !== undefined || mobile.maxWidth !== undefined;
  if (!framed && !ownWidth) return inner(node.id);
  if (style.borderRadius !== undefined && node.type !== "Button") {
    context.d.add("email/outlook-degraded", "info", `borderRadius on this ${node.type} shows square corners in classic Outlook`, `${node.path}.style.borderRadius`, node.id);
  }
  const phoneWidths = mobile.maxWidth !== undefined ? phoneWidth(mobile.maxWidth) : mobile.width !== undefined ? phoneWidth(mobile.width) : [];
  const height = style.height !== undefined ? toNumber(style.height) : undefined;
  const cell = `<td${attrs({ class: phoneClass(context, phoneBox(node)), bgcolor: bgcolor(style.backgroundColor), height })}${styleAttr([
    ["padding", insets(style.padding)],
    ["background-color", style.backgroundColor as string | undefined],
    ...border(style.border),
    ["border-radius", radius(style.borderRadius)],
    ["height", height !== undefined ? px(height) : undefined],
    ["overflow", style.overflow === "hidden" ? "hidden" : undefined],
  ])}>${inner(undefined)}</td>`;
  return table({ id: node.id, class: phoneClass(context, phoneWidths), ...width.attributes }, width.style, `<tr>${cell}</tr>`);
}

const toNumber = (value: Json) => (typeof value === "number" ? value : Number.parseFloat(String(value)));

/** Children stacked down a table, one row each, `gap` as the cells' bottom padding. */
function stackRows(node: ResolvedNode, context: Context, mobile: MobileText): { rows: string; className?: string } {
  const children = node.children.filter(isNode).filter(shown);
  const gap = typeof node.style.gap === "number" ? node.style.gap : 0;
  const rows = children
    .map((child, index) => {
      const last = index === children.length - 1;
      const cell = `<td${attrs({ align: cellAlign(child, node) })}${styleAttr([["padding-bottom", !last && gap ? px(gap) : undefined]])}>${render(child, node, context, false, mobile)}</td>`;
      const hidden = hiding(child, context, "table-row");
      const row = `<tr${attrs({ class: hidden.className })}${styleAttr(hidden.style)}>${cell}</tr>`;
      // What's hidden on desktop isn't Outlook's at all (Outlook is never a phone).
      return child.hidden?.desktop ? `<!--[if !mso]><!-->${row}<!--<![endif]-->` : row;
    })
    .join("");
  const phoneGap = node.mobile?.gap;
  const className =
    phoneGap === undefined
      ? undefined
      : context.sheet.classFor("phone", `&>tbody>tr>td{padding-bottom:${length(phoneGap)}!important}&>tbody>tr:last-child>td{padding-bottom:0!important}`);
  return { rows, className };
}

// ─── The root and Sections ──────────────────────────────────────────────────

function renderRoot(root: ResolvedNode, context: Context): string {
  const width = root.width ?? 600;
  const mobile = mobileTextOf(root, {});
  const children = root.children.filter(isNode).filter(shown);
  const gap = typeof root.style.gap === "number" ? root.style.gap : 0;

  // The content at the content width, centered; Sections span the window, in runs between them.
  const parts: Array<{ html: string; node?: ResolvedNode }> = [];
  let run: ResolvedNode[] = [];
  const flush = () => {
    if (!run.length) return;
    const stack = stackRows({ ...root, children: run }, context, mobile);
    parts.push({ html: table({ class: stack.className, width: "100%" }, [["max-width", px(width)]], stack.rows) });
    run = [];
  };
  for (const node of children) {
    if (node.type === "Section") {
      flush();
      parts.push({ html: "", node });
    } else run.push(node);
  }
  flush();

  // Between a Section and its neighbours the gap is a row of its own, outside the Section's background.
  const spacer = gap ? `<tr><td${styleAttr([["font-size", "0"], ["line-height", px(gap)], ["mso-line-height-rule", "exactly"]])}>&nbsp;</td></tr>` : "";
  const rows = parts.map((part) => (part.node ? renderSection(part.node, root, context, mobile) : `<tr><td align="center">${part.html}</td></tr>`)).join(spacer);
  const background = root.style.backgroundColor as string | undefined;
  return table({ width: "100%", bgcolor: bgcolor(background) }, [["background-color", background]], rows);
}

/** A band across the window: its background and border on a full-width cell, its content at the content width. */
function renderSection(node: ResolvedNode, root: ResolvedNode, context: Context, inherited: MobileText): string {
  const width = root.width ?? 600;
  const padding = (node.style.padding as { top: number; right: number; bottom: number; left: number } | undefined) ?? { top: 0, right: 0, bottom: 0, left: 0 };
  const mobile = mobileTextOf(node, inherited);
  const stack = stackRows(node, context, mobile);
  const sides = padding.left || padding.right;
  const content = sides
    ? table({ width: "100%" }, [["max-width", px(width)]], `<tr><td${styleAttr([["padding", `0 ${px(padding.right)} 0 ${px(padding.left)}`]])}>${table({ class: stack.className, width: "100%" }, [], stack.rows)}</td></tr>`)
    : table({ class: stack.className, width: "100%" }, [["max-width", px(width)]], stack.rows);
  const hidden = hiding(node, context, "table-row");
  const phonePadding = node.mobile?.padding as { top: number; right: number; bottom: number; left: number } | undefined;
  const cell = `<td${attrs({
    id: node.id,
    align: "center",
    bgcolor: bgcolor(node.style.backgroundColor),
    class: phoneClass(context, [
      ["padding-top", phonePadding ? px(phonePadding.top) : undefined],
      ["padding-bottom", phonePadding ? px(phonePadding.bottom) : undefined],
      ...border(node.mobile?.border),
      ["background-color", node.mobile?.backgroundColor as string | undefined],
    ]),
  })}${styleAttr([
    ["padding-top", padding.top ? px(padding.top) : undefined],
    ["padding-bottom", padding.bottom ? px(padding.bottom) : undefined],
    ["background-color", node.style.backgroundColor as string | undefined],
    ...border(node.style.border),
  ])}>${content}</td>`;
  const row = `<tr${attrs({ class: hidden.className })}${styleAttr(hidden.style)}>${cell}</tr>`;
  return node.hidden?.desktop ? `<!--[if !mso]><!-->${row}<!--<![endif]-->` : row;
}

// ─── Rows ───────────────────────────────────────────────────────────────────

/**
 * A Row that stacks on phones is "fluid hybrid": each child is an
 * inline-block div as wide as its desktop width at most and 100% otherwise,
 * so the children sit side by side where there's room and stack where there
 * isn't, without media queries; Outlook, which ignores divs' sizes, gets a
 * table of the same widths in conditional comments. Gaps are spacers: a
 * cell for Outlook, an inline-block for the rest (as tall as the gap on
 * phones, where the children stack). A Row that stays side by side is a
 * table row.
 */
function renderRow(node: ResolvedNode, context: Context, fill: boolean, inherited: MobileText): string {
  const mobile = mobileTextOf(node, inherited);
  const children = node.children.filter(isNode).filter(shown);
  const gap = typeof node.style.gap === "number" ? node.style.gap : 0;
  const align = (node.style.align as string | undefined) ?? "start";
  const valign = VALIGN[align];
  const wrap = node.style.wrap as string;
  if (wrap === "wrap") {
    context.d.warning("email/unsupported", 'wrap: "wrap" isn\'t possible in email; this Row stacks on phones instead', `${node.path}.style.wrap`, node.id);
  }
  if (align === "stretch" && children.some((child) => child.style.backgroundColor !== undefined || child.style.border !== undefined)) {
    context.d.add("email/degraded", "info", "A Row's children aren't stretched to one height in email: each background or border ends with its content", `${node.path}.style.align`, node.id);
  }
  const justify = node.style.justify as string | undefined;
  if (justify === "between") {
    context.d.warning("email/unsupported", 'justify: "between" isn\'t possible in email; the children start at the left', `${node.path}.style.justify`, node.id);
  }
  for (const child of children) {
    if (child.width === null) {
      context.d.warning("email/width", `This ${child.type} takes its own size in a Row, and its size isn't known: give it a width, so Outlook can lay the Row out`, `${child.path}.style.width`, child.id);
    }
  }

  let inner: string;
  if (wrap === "none") {
    const cells = children
      .map((child, index) => {
        const spacer = index && gap ? `<td${attrs({ width: gap })}${styleAttr([["width", px(gap)]])}></td>` : "";
        const hidden = hiding(child, context, "table-cell");
        const cell = `<td${attrs({ class: hidden.className, width: child.width ?? undefined, valign })}${styleAttr([["width", child.width !== null ? px(child.width) : undefined], ...hidden.style])}>${render(child, node, context, child.width !== null, mobile)}</td>`;
        return child.hidden?.desktop ? `<!--[if !mso]><!-->${spacer}${cell}<!--<![endif]-->` : spacer + cell;
      })
      .join("");
    inner = table({ width: "100%" }, [], `<tr>${cells}</tr>`);
  } else {
    const out = new Conditional().mso(`<table${attrs({ ...TABLE, width: "100%" })}><tr>`);
    let first = true;
    const spacer = gap ? phoneClass(context, [["height", px(typeof node.mobile?.gap === "number" ? node.mobile.gap : gap)]]) : undefined;
    for (const child of children) {
      const desktop = !child.hidden?.desktop;
      if (!first && gap) {
        if (desktop) out.mso(`<td${attrs({ width: gap })}${styleAttr([["width", px(gap)]])}></td>`);
        out.notMso(`<div${attrs({ class: spacer })}${styleAttr([["display", "inline-block"], ["width", px(gap)]])}></div>`);
      }
      if (desktop) out.mso(`<td${attrs({ width: child.width ?? undefined, valign })}${styleAttr([["width", child.width !== null ? px(child.width) : undefined]])}>`);
      const hidden = hiding(child, context, "inline-block");
      const column = `<div${attrs({ class: hidden.className })}${styleAttr([
        ["display", "inline-block"],
        ["vertical-align", valign],
        ["width", child.width !== null ? "100%" : undefined],
        ["max-width", child.width !== null ? px(child.width) : undefined],
        ...hidden.style,
      ])}>${render(child, node, context, child.width !== null, mobile)}</div>`;
      if (desktop) out.all(column).mso("</td>");
      else out.notMso(column);
      first = false;
    }
    out.mso("</tr></table>");
    inner = out.toString();
  }

  // On phones the children take the whole width, one under another (inline-blocks of 100%: each on a line of its own).
  const stack = wrap !== "none" ? context.sheet.classFor("phone", "&>div{width:100%!important;max-width:100%!important}") : undefined;
  const width = boxWidth(node, fill);
  const { style } = node;
  if (style.borderRadius !== undefined) {
    context.d.add("email/outlook-degraded", "info", "borderRadius on this Row shows square corners in classic Outlook", `${node.path}.style.borderRadius`, node.id);
  }
  const mobileWidth = node.mobile?.maxWidth ?? node.mobile?.width;
  const cell = `<td${attrs({ class: names(stack, phoneClass(context, phoneBox(node))), align: justify === "center" ? "center" : justify === "end" ? "right" : undefined, bgcolor: bgcolor(style.backgroundColor) })}${styleAttr([
    // No line boxes between the children: their inline-blocks touch.
    ["font-size", wrap !== "none" ? "0" : undefined],
    ["padding", insets(style.padding)],
    ["background-color", style.backgroundColor as string | undefined],
    ...border(style.border),
    ["border-radius", radius(style.borderRadius)],
  ])}>${inner}</td>`;
  return table({ id: node.id, class: mobileWidth !== undefined ? phoneClass(context, phoneWidth(mobileWidth)) : undefined, ...width.attributes }, width.style, `<tr>${cell}</tr>`);
}

// ─── Nodes ──────────────────────────────────────────────────────────────────

/** `fill`: the node's cell is exactly its width (a Row's child), so it fills it rather than placing itself. */
function render(node: ResolvedNode, parent: ResolvedNode, context: Context, fill: boolean, inherited: MobileText): string {
  switch (node.type) {
    case "Row":
      return renderRow(node, context, fill, inherited);
    case "Column": {
      const mobile = mobileTextOf(node, inherited);
      if (node.style.justify !== undefined && node.style.justify !== "start") {
        context.d.add("email/degraded", "info", "justify on a Column has no effect in email: its children start at the top", `${node.path}.style.justify`, node.id);
      }
      return boxed(node, context, fill, (id) => {
        const stack = stackRows(node, context, mobile);
        return table({ id, class: stack.className, width: "100%" }, [], stack.rows);
      });
    }
    case "Text":
    case "Paragraph":
    case "Heading": {
      const tag = node.type === "Text" ? "div" : node.type === "Paragraph" ? "p" : `h${node.props.level}`;
      const mobile = mobileTextOf(node, inherited);
      return boxed(node, context, fill, (id) => {
        const style = styleAttr([...(tag === "div" ? [] : ([["margin", "0"]] as Declarations)), ...fullText(node, { weight: node.type === "Heading" }), ["text-decoration", node.style.textDecoration as string | undefined]]);
        return `<${tag}${attrs({ id, class: phoneClass(context, phoneText(node, mobile)) })}${style}>${inline(node, context)}</${tag}>`;
      });
    }
    case "Button":
      return renderButton(node, context, fill, mobileTextOf(node, inherited));
    case "Link": {
      // A link as a block: around an image, or text of its own.
      const { href, target } = linkParts(node.props.href as LinkValue);
      const onlyImage = node.children.every((child) => typeof child !== "string" && child.type === "Image");
      const mobile = mobileTextOf(node, inherited);
      const style = styleAttr(
        onlyImage
          ? [["text-decoration", "none"]]
          : [...fullText(node, { align: false }), ["text-decoration", node.style.textDecoration as string | undefined], ["background-color", node.style.backgroundColor as string | undefined]]
      );
      const className = names(onlyImage ? undefined : phoneClass(context, phoneText(node, mobile)), hoverClass(node, context));
      const content = node.children.map((child) => (typeof child === "string" ? escapeText(child) : child.type === "Image" ? renderImage(child, context, fill, true) : renderInline(child, node, context))).join("");
      return `<a${attrs({ id: node.id, class: className, href, target, rel: target === "_blank" ? "noopener noreferrer" : undefined })}${style}>${content}</a>`;
    }
    case "Image":
      return renderImage(node, context, fill, false);
    case "Divider":
      return renderDivider(node, context);
    default:
      throw new Error(`[Elements] The email exporter can't render a ${node.type} here (in a ${parent.type})`);
  }
}

/**
 * A button as a one-cell table: its background, border and corners on the
 * cell, its padding both on the link (so all of it is clickable) and, for
 * Outlook, which has no padding on links, as the cell's `mso-padding-alt`.
 * Square corners in classic Outlook.
 */
function renderButton(node: ResolvedNode, context: Context, fill: boolean, mobile: MobileText): string {
  const { href, target } = linkParts(node.props.href as LinkValue);
  const { style } = node;
  const width = boxWidth(node, fill);
  const ownWidth = width.attributes.width !== undefined;
  const link = `<a${attrs({ href, target, rel: target === "_blank" ? "noopener noreferrer" : undefined, class: phoneClass(context, [...phoneText(node, mobile), ["padding", insets(node.mobile?.padding)]]) })}${styleAttr([
    ["display", ownWidth ? "block" : "inline-block"],
    ["padding", insets(style.padding)],
    ...fullText(node),
    ["text-decoration", (style.textDecoration as string | undefined) ?? "none"],
    ["border-radius", radius(style.borderRadius)],
  ])}>${inline(node, context)}</a>`;
  const cell = `<td${attrs({ align: TEXT_ALIGN[node.text.textAlign], bgcolor: bgcolor(style.backgroundColor), class: names(hoverClass(node, context), phoneClass(context, [...border(node.mobile?.border), ["background-color", node.mobile?.backgroundColor as string | undefined]])) })}${styleAttr([
    ["background-color", style.backgroundColor as string | undefined],
    ...border(style.border),
    ["border-radius", radius(style.borderRadius)],
    ["mso-padding-alt", insets(style.padding)],
  ])}>${link}</td>`;
  const mobileWidth = node.mobile?.maxWidth ?? node.mobile?.width;
  return table(
    { id: node.id, class: mobileWidth !== undefined ? phoneClass(context, phoneWidth(mobileWidth)) : undefined, ...width.attributes },
    width.style,
    `<tr>${cell}</tr>`
  );
}

/**
 * An image: its width attribute in px (Word's size for it), fluid elsewhere
 * (100% of its cell, its width at most). `hide`: it's hidden by its own style
 * (in a link), not by the cell it's in.
 */
function renderImage(node: ResolvedNode, context: Context, fill: boolean, hide: boolean): string {
  const { src, width: ownWidth, height: ownHeight } = assetParts(node.props.src as Asset);
  const width = node.width;
  if (width === null) {
    context.d.warning(
      "email/image-width",
      "This Image has no width: Outlook shows it at the size of its file, however wide that is. Give it a width, or the file's width in src",
      `${node.path}.props.src`,
      node.id
    );
  }
  const percent = !fill && typeof node.style.width === "string" && node.style.width.endsWith("%") && node.style.maxWidth === undefined;
  const height = node.style.height !== undefined ? toNumber(node.style.height) : undefined;
  const mobile = node.mobile?.maxWidth ?? node.mobile?.width;
  const hidden = hide ? hiding(node, context, "block") : { style: [] as Declarations, className: undefined };
  const className = names(hidden.className, mobile !== undefined ? phoneClass(context, [["max-width", length(mobile)]]) : undefined);
  if (node.style.borderRadius !== undefined) {
    context.d.add("email/outlook-degraded", "info", "borderRadius on this Image shows square corners in classic Outlook", `${node.path}.style.borderRadius`, node.id);
  }
  const style = styleAttr([
    ["display", "block"],
    ["width", width !== null ? "100%" : undefined],
    ["max-width", percent ? (node.style.width as string) : width !== null ? px(width) : "100%"],
    ["height", height !== undefined ? px(height) : "auto"],
    ["border", "0"],
    ...border(node.style.border),
    ["border-radius", radius(node.style.borderRadius)],
    ...hidden.style,
  ]);
  // Its height in proportion, for Word, when the file's size is known.
  const scaled = height ?? (width !== null && ownWidth && ownHeight ? Math.round((ownHeight * width) / ownWidth) : undefined);
  return `<img${attrs({ id: node.id, class: className, src, alt: (node.props.alt as string) ?? "", width: width ?? undefined, height: scaled, border: "0" })}${style}>`;
}

/** A line: a table with a top border and an empty cell Word can't make taller. */
function renderDivider(node: ResolvedNode, context: Context): string {
  const value = node.style.width;
  const percent = typeof value === "string" && value.endsWith("%");
  const mobile = node.mobile?.width;
  const line = table(
    { width: percent ? value : "100%", class: mobile !== undefined ? phoneClass(context, phoneWidth(mobile)) : undefined, ...(node.style.padding === undefined ? { id: node.id } : {}) },
    [["max-width", !percent && value !== undefined ? length(value) : undefined]],
    `<tr><td${styleAttr([
      ["border-top", `${px(node.style.thickness as number)} ${node.style.lineStyle} ${node.style.color}`],
      ["font-size", "0"],
      ["line-height", "0"],
      ["mso-line-height-rule", "exactly"],
    ])}>&nbsp;</td></tr>`
  );
  if (node.style.padding === undefined && node.mobile?.padding === undefined) return line;
  const align = TEXT_ALIGN[node.text.textAlign];
  return table(
    { id: node.id, width: "100%" },
    [],
    `<tr><td${attrs({ align: align === "left" ? undefined : align, class: phoneClass(context, [["padding", insets(node.mobile?.padding)]]) })}${styleAttr([["padding", insets(node.style.padding)]])}>${line}</td></tr>`
  );
}

// ─── Fonts ──────────────────────────────────────────────────────────────────

/** A CSS string, with what could end it or the stylesheet escaped. */
const cssString = (value: string) => `"${value.replace(/[\\"\n\r<>]/g, (c) => `\\${c.charCodeAt(0).toString(16)} `)}"`;

function collectFonts(node: ResolvedNode, context: Context): void {
  const family = node.text.fontFamily;
  if (typeof family === "object" && family.src) {
    const key = `${family.name}\n${family.src}`;
    if (!context.fonts.has(key)) context.fonts.set(key, `@font-face{font-family:${cssString(family.name)};src:url(${cssString(family.src)})}`);
  }
  for (const child of node.children) if (typeof child !== "string") collectFonts(child, context);
}
