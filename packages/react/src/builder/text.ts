/**
 * A text tool's HTML read back as blocks of runs, as the builder draws it. Runs are compat's run parser's (it fails
 * closed), with merge tags as MergeTags. A `<p>` is a block of its own: the builder's export resets a paragraph's
 * margins (`p { margin: 0 }`, and its editor writes `margin: 0px` on each), so one has none unless its own style gives
 * it some, which are its padding. A `<ul>` or `<ol>` is a List, its padding its indent and its items' margin its gap.
 * What isn't read exactly is said in `left`, and the block is kept as its markup.
 */
import type { Child, Json, Node } from "@unlayer-internal/elements-core";
import { parseRuns, type Run } from "../compat/runs";
import { color, fontWeight, px } from "../compat/values";
import { textJsonHtml } from "./text-json";

export interface TextPart {
  /** A Paragraph's runs, or a List. */
  node: Node;
  /** Its margins above and below, in px. */
  margin: { top: number; bottom: number };
  /** A paragraph's indent (its `padding-inline-start`), in px. */
  indent?: number;
}

const TAG = /<\s*(\/?)\s*([a-zA-Z][a-zA-Z0-9]*)([^>]*?)(\/?)\s*>/g;
const style = (attrs: string) => /\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attrs)?.slice(1).find((v) => v !== undefined) ?? "";
const declarations = (css: string) => Object.fromEntries(css.split(";").map((d) => d.split(":")).filter((p) => p.length >= 2 && p[0].trim()).map(([name, ...rest]) => [name.trim().toLowerCase(), rest.join(":").trim()]));
/** A tag's attributes, its quoted values whole. */
const ATTRIBUTES = `(?:[^>"']|"[^"]*"|'[^']*')*`;
/**
 * Markup in pieces, so a `<p>` is read only where it starts a tag: a comment, an element whose text isn't markup
 * (with its text), a `<p>` (its attributes), any other tag, and from a tag that never closes, the rest.
 */
const PIECES = new RegExp(
  `<!--[\\s\\S]*?(?:-->|$)|<(script|style|textarea|title|xmp|iframe|noembed|noframes|noscript|plaintext)\\b${ATTRIBUTES}>[\\s\\S]*?(?:<\\/\\1\\s*>|$)|<p(?=[\\s/>])(${ATTRIBUTES})>|<[a-zA-Z/!?]${ATTRIBUTES}>|<[a-zA-Z/!?][\\s\\S]*$`,
  "gi",
);

/**
 * Markup's paragraphs with the margin they draw with, where markup crosses between the builder and an Html block: the
 * builder's stylesheet has `p{margin:0}`, a browser's own is 1em above and below. `css` (no spaces or quotes) goes
 * first in a paragraph's style, so its own declarations still win over it, as they do over a stylesheet; a `margin`
 * of its own needs nothing. Only a tag that is a paragraph changes, and what's added has no quote to end a value
 * with. Where markup is sanitized, this comes before it.
 */
export function withParagraphMargin(html: string, css: string): string {
  return html.replace(PIECES, (piece, _raw, attrs: string | undefined) => {
    if (attrs === undefined) return piece;
    const own = /(?:^|[\s/])style\s*=\s*(["']?)/i.exec(attrs);
    if (!own) return `<p style=${css}${attrs.startsWith("/") ? " " : ""}${attrs}>`;
    if (!own[1] || declarations(style(attrs)).margin !== undefined) return piece;
    const at = own.index + own[0].length;
    return `<p${attrs.slice(0, at)}${css};${attrs.slice(at)}>`;
  });
}

/** The attributes of a tag (their names), but its style. */
const attributeNames = (attrs: string) => [...attrs.matchAll(/([a-zA-Z][\w-]*)\s*=/g)].map((m) => m[1].toLowerCase()).filter((name) => name !== "style");

/** A margin's length in px (0, px, or ems of the text's size); undefined for anything else. */
const length = (value: string, fontSize: number): number | undefined => {
  const em = /^(\d*\.?\d+)em$/.exec(value.trim());
  if (em) return Number(em[1]) * fontSize;
  const read = px(value);
  return read !== undefined && read >= 0 ? read : undefined;
};

/** The margins above and below that a block's declarations give it (`given` where they don't), or null where one isn't read (a side margin, a length it doesn't take). */
function margins(d: Record<string, string>, given: number, fontSize: number): { top: number; bottom: number } | null {
  const out = { top: given, bottom: given };
  for (const [name, value] of Object.entries(d)) {
    if (!name.startsWith("margin")) continue;
    const values = value.split(/\s+/).map((v) => length(v, fontSize));
    if (values.some((v) => v === undefined) || !values.length) return null;
    const [a, b = a, c = a, e = b] = values as number[];
    if (name === "margin") {
      if (values.length > 4 || b !== 0 || e !== 0) return null;
      out.top = a;
      out.bottom = c;
    } else if (name === "margin-block") {
      if (values.length > 2) return null;
      out.top = a;
      out.bottom = b;
    } else if (name === "margin-top" || name === "margin-block-start") out.top = a;
    else if (name === "margin-bottom" || name === "margin-block-end") out.bottom = a;
    else if (values.length > 1 || a !== 0) return null;
  }
  return out;
}

/** Text with merge tags (`{{name}}`) as MergeTags; a Document's page tokens as PageNumbers, where `pages`. */
export function mergeTags(runs: Run[], pages: boolean): Child[] {
  return runs.flatMap((run): Child[] => {
    if (typeof run !== "string") return [{ ...(run as Node), ...(run.children ? { children: mergeTags(run.children, pages) } : {}) }];
    const out: Child[] = [];
    let last = 0;
    for (const match of run.matchAll(/\{\{\s*([\w.-]+)\s*\}\}/g)) {
      if (match.index! > last) out.push(run.slice(last, match.index));
      const name = match[1];
      if (pages && (name === "page_number" || name === "page_count")) out.push({ type: "PageNumber", ...(name === "page_count" ? { props: { total: true } } : {}) });
      else out.push({ type: "MergeTag", props: { name } });
      last = match.index! + match[0].length;
    }
    if (last < run.length) out.push(run.slice(last));
    return out;
  });
}

/** The builder's tools with text. */
export type TextToolName = "text" | "paragraph" | "heading" | "button";

/**
 * A tool's text as the builder's exporter writes it. A paragraph (its rich-text tool), a heading and a button are
 * written from their rich text (`textJson`, what its editor saves) where they have one, through text-json.ts; a text
 * (its older tool) from its `text`, which the editor writes from the rich text each time it saves a design, and from
 * its rich text only where it has no `text`. A heading's or a button's lines are each a `<span>` in its direction (its
 * alignment nothing on a span): unwrapped where that's the block's own.
 */
export function richText(values: Record<string, unknown>, tool: TextToolName, dir: string): RichText {
  const text = typeof values.text === "string" ? values.text : undefined;
  if (typeof values.textJson !== "string" || (tool === "text" && text)) return { html: text ?? "" };
  const { html, unread } = textJsonHtml(values.textJson);
  // A node the editor saves that isn't read is never dropped: its `text` (the editor's own export of it), else its
  // markup as written, without that node.
  const nodes = unread.join(", ");
  if (unread.length && text) return { html: text, said: `its rich text has nodes Elements doesn't read (${nodes}): its text, the builder's export of it, is read` };
  return { html: tool === "heading" || tool === "button" ? unwrapLines(html, dir) : html, ...(unread.length ? { markup: `rich text nodes Elements doesn't read (${nodes}), left out of it` } : {}) };
}

/** A tool's text as HTML, what's said about it, and why it's kept as markup, where it is. */
export interface RichText {
  html: string;
  said?: string;
  markup?: string;
}

/** Spans each holding a line in the block's direction, their words in a row (as inline spans are drawn); the HTML as it is otherwise. */
function unwrapLines(html: string, dir: string): string {
  let out = "";
  let at = 0;
  const OPEN = /<span dir="(ltr|rtl|auto)"(?: style="text-align: (?:left|center|right|justify|start|end);")?>/y;
  while (at < html.length) {
    OPEN.lastIndex = at;
    const open = OPEN.exec(html);
    if (!open || open[1] !== dir) return html;
    const end = closing(html, "span", OPEN.lastIndex);
    if (!end) return html;
    out += html.slice(OPEN.lastIndex, end.start);
    at = end.end;
  }
  return out;
}

/** How deep markup may nest to be read as runs: deeper than any text's, shallow enough to read and draw. */
export const DEEPEST = 64;
const VOID = new Set(["br", "img", "hr", "input", "meta", "link", "wbr", "source", "area", "col", "embed", "param", "track"]);

/** Whether markup nests deeper than DEEPEST (reading it as runs, and drawing them, would run out of stack). */
export function tooDeep(html: string): boolean {
  let depth = 0;
  for (const match of html.matchAll(TAG)) {
    if (match[1]) depth = Math.max(0, depth - 1);
    else if (!match[4] && !VOID.has(match[2].toLowerCase()) && ++depth > DEEPEST) return true;
  }
  return false;
}

/** Whether the HTML has blocks of its own (a `<p>`, a list) rather than lines. */
const blocky = (html: string) => /<\s*(p|ul|ol|h[1-6])\b/i.test(html);
const P_STYLES = new Set(["line-height", "text-align", "padding-inline-start"]);

/** The HTML as parts, each a block, and what isn't read. */
export function readText(html: string, { weight = 400, pages = false, links = true, fontSize = 16, lineHeight = 1.5 as Json } = {}): { parts: TextPart[]; left: string[] } {
  const left: string[] = [];
  if (tooDeep(html)) return { parts: [], left: [`markup nested more than ${DEEPEST} deep`] };
  const runs = (inner: string, bold = weight): Child[] => {
    const read = parseRuns(inner, { weight: bold, links, builder: true });
    left.push(...read.left);
    return mergeTags(read.children, pages);
  };
  const NONE = { top: 0, bottom: 0 };
  if (!blocky(html)) return { parts: [{ node: { type: "Paragraph", children: runs(html) }, margin: NONE }], left };
  const parts: TextPart[] = [];
  let inline = "";
  const flush = () => {
    if (inline.trim()) parts.push({ node: { type: "Paragraph", children: runs(inline) }, margin: NONE });
    inline = "";
  };
  // The top level: `<p>`s, headings and lists as blocks, what's between them as lines.
  let at = 0;
  for (const match of [...html.matchAll(TAG)]) {
    if (match.index! < at) continue;
    const tag = match[2].toLowerCase();
    if (match[1] || !/^(p|ul|ol|h[1-6])$/.test(tag)) continue;
    inline += html.slice(at, match.index);
    const end = closing(html, tag, match.index! + match[0].length);
    if (end === null) {
      left.push(`a <${tag}> that isn't closed`);
      return { parts, left };
    }
    const inner = html.slice(match.index! + match[0].length, end.start);
    flush();
    if (tag === "p") {
      const part = readParagraph(match[3], inner, runs, fontSize, left);
      if (part) parts.push(part);
    } else if (tag[0] === "h") parts.push(readHeading(Number(tag[1]), match[3], inner, runs, fontSize, lineHeight, left));
    else parts.push(readList(tag, match[3], inner, runs, fontSize, left));
    at = end.end;
  }
  inline += html.slice(at);
  flush();
  return { parts, left };
}

/** A heading's size and margins in the browser's stylesheet, in ems of its parent's size and of its own, h1 to h6. */
const HEADING_SIZES = [2, 1.5, 1.17, 1, 0.83, 0.67];
const HEADING_MARGINS = [0.67, 0.83, 1, 1.33, 1.67, 2.33];
const HEADING_STYLES = new Set(["font-size", "font-weight", "line-height", "text-align", "color"]);
const round = (value: number) => Math.round(value * 100) / 100;

/**
 * An `<h1>` to `<h6>` in text (the builder's editor writes one in its own style) as a Heading of its level, drawn as the
 * browser draws it there: in bold, its size its level's share of the text's, its margins its level's, its line as tall
 * as the text's (a percentage is the text's size's, inherited as a length), but where its style says otherwise.
 */
function readHeading(level: number, attrs: string, inner: string, runs: (html: string, weight?: number) => Child[], fontSize: number, lineHeight: Json, left: string[]): TextPart {
  const d = declarations(style(attrs));
  const size = d["font-size"] === undefined ? round(HEADING_SIZES[level - 1] * fontSize) : length(d["font-size"], fontSize);
  if (size === undefined) left.push(`a heading's font size ${d["font-size"]}`);
  const own = size ?? fontSize;
  const weight = d["font-weight"] === undefined ? 700 : fontWeight(d["font-weight"]);
  if (weight === undefined) left.push(`a heading's font weight ${d["font-weight"]}`);
  const css: Record<string, Json> = { fontSize: own, fontWeight: weight ?? 700 };
  const height = d["line-height"];
  if (height !== undefined) {
    const share = /^(\d*\.?\d+)%$/.exec(height);
    if (share) css.lineHeight = Number(share[1]) / 100;
    else if (px(height) !== undefined) css.lineHeight = `${px(height)}px`;
    else left.push(`a heading's line height ${height}`);
  } else css.lineHeight = typeof lineHeight === "number" ? `${round(lineHeight * fontSize)}px` : lineHeight;
  if (d["text-align"] !== undefined) css.textAlign = d["text-align"];
  if (d.color !== undefined) {
    const value = color(d.color);
    if (value) css.color = value;
    else left.push(`a heading's color ${d.color}`);
  }
  const margin = margins(d, round(HEADING_MARGINS[level - 1] * own), own);
  if (!margin) left.push("a heading's margins");
  const dir = /\bdir\s*=\s*"?(ltr|rtl|auto)\b/i.exec(attrs)?.[1].toLowerCase();
  if (Object.keys(d).some((name) => !HEADING_STYLES.has(name) && !name.startsWith("margin")) || attributeNames(attrs).some((name) => name !== "dir")) left.push("a heading with attributes of its own");
  return { node: { type: "Heading", props: { level, ...(dir ? { dir } : {}) }, style: css, children: runs(inner, weight ?? 700) }, margin: margin ?? { top: 0, bottom: 0 } };
}

/** A `<p>` as a Paragraph: its line height, alignment, direction and indent its own, its margins none but its style's. */
function readParagraph(attrs: string, inner: string, runs: (html: string) => Child[], fontSize: number, left: string[]): TextPart | undefined {
  const d = declarations(style(attrs));
  const own: Record<string, Json> = {};
  if (d["line-height"] !== undefined) {
    const height = /^(\d*\.?\d+)%$/.exec(d["line-height"]);
    if (height) own.lineHeight = Number(height[1]) / 100;
    else if (px(d["line-height"]) !== undefined) own.lineHeight = `${px(d["line-height"])}px`;
    else left.push(`a paragraph's line height ${d["line-height"]}`);
  }
  if (d["text-align"] !== undefined) own.textAlign = d["text-align"];
  const indent = d["padding-inline-start"] === undefined ? 0 : length(d["padding-inline-start"], fontSize);
  if (indent === undefined) left.push(`a paragraph's indent ${d["padding-inline-start"]}`);
  const margin = margins(d, 0, fontSize);
  if (!margin) left.push("a paragraph's margins");
  const dir = /\bdir\s*=\s*"?(ltr|rtl|auto)\b/i.exec(attrs)?.[1].toLowerCase();
  const other = Object.keys(d).filter((name) => !P_STYLES.has(name) && !name.startsWith("margin"));
  if (other.length || attributeNames(attrs).some((name) => name !== "dir") || (/\bdir\s*=/.test(attrs) && !dir)) left.push("a paragraph with attributes of its own");
  const children = runs(inner);
  // An empty paragraph is nothing; one with only a line break, a line of its height.
  if (!children.length && !/<\s*br\b/i.test(inner)) return undefined;
  const node: Node = { type: "Paragraph", ...(dir ? { props: { dir } } : {}), ...(Object.keys(own).length ? { style: own } : {}), children: children.length ? children : ["\u200b"] };
  return { node, margin: margin ?? { top: 0, bottom: 0 }, ...(indent ? { indent } : {}) };
}

/** Where the element opened before `from` closes (nested ones of its kind skipped), or null. */
function closing(html: string, tag: string, from: number): { start: number; end: number } | null {
  const re = new RegExp(`<\\s*(\\/?)\\s*${tag}\\b[^>]*>`, "gi");
  re.lastIndex = from;
  let depth = 1;
  for (let match = re.exec(html); match; match = re.exec(html)) {
    depth += match[1] ? -1 : 1;
    if (!depth) return { start: match.index, end: match.index + match[0].length };
  }
  return null;
}

/**
 * A `<ul>` or `<ol>` as a List: its padding its indent (the browser's 40px), its items' margin above its gap, its
 * margins the browser's but where its style says otherwise; an item's direction and alignment its own. An item
 * showing no marker that holds only a list (how the builder's editor nests one) is that list, in the item before it.
 * What a List doesn't hold (other markers, a direction of its own, other attributes) is said in `left`.
 */
function readList(tag: string, attrs: string, inner: string, runs: (html: string) => Child[], fontSize: number, left: string[]): TextPart {
  const d = declarations(style(attrs));
  const indent = px(d["padding-left"] ?? d.padding ?? "40px");
  if (indent === undefined) left.push(`a list's indent ${d["padding-left"]}`);
  const marker = d["list-style-type"];
  if (marker !== undefined && marker !== (tag === "ol" ? "decimal" : "disc")) left.push(`a list's markers ${marker}`);
  if (Object.keys(d).some((name) => !["padding-left", "padding", "list-style-type"].includes(name) && !name.startsWith("margin")) || attributeNames(attrs).some((name) => name !== "start" || tag !== "ol")) left.push("a list with attributes of its own");
  const start = /\bstart\s*=\s*"?(\d+)/.exec(attrs)?.[1];
  const items: Node[] = [];
  let gap: number | undefined;
  let at = 0;
  for (const match of [...inner.matchAll(TAG)]) {
    if (match.index! < at || match[1] || match[2].toLowerCase() !== "li") continue;
    const end = closing(inner, "li", match.index! + match[0].length);
    if (end === null) {
      left.push("a list item that isn't closed");
      break;
    }
    at = end.end;
    const body = inner.slice(match.index! + match[0].length, end.start);
    const li = declarations(style(match[3]));
    const dir = /\bdir\s*=\s*"?(ltr|rtl)\b/i.exec(match[3])?.[1].toLowerCase();
    if (Object.keys(li).some((name) => !["margin-top", "text-align", "list-style-type"].includes(name)) || attributeNames(match[3]).some((name) => name !== "dir")) left.push("a list item with attributes of its own");
    // Its words and the lists in it, in their order.
    const children: Child[] = [];
    let rest = body;
    for (let nested = /<\s*(ul|ol)\b([^>]*)>/i.exec(rest); nested; nested = /<\s*(ul|ol)\b([^>]*)>/i.exec(rest)) {
      children.push(...runs(rest.slice(0, nested.index)));
      const tag = nested[1].toLowerCase();
      const close = closing(rest, tag, nested.index + nested[0].length);
      if (!close) {
        left.push("a list that isn't closed");
        rest = "";
        break;
      }
      children.push(readList(tag, nested[2], rest.slice(nested.index + nested[0].length, close.start), runs, fontSize, left).node);
      rest = rest.slice(close.end);
    }
    if (rest) children.push(...runs(rest));
    if (li["list-style-type"] !== undefined) {
      // An item with no marker holding only a list: that list, nested in the item before it.
      const only = children.filter((child) => typeof child !== "string" || child.trim());
      const before = items[items.length - 1];
      if (li["list-style-type"] === "none" && only.length === 1 && typeof only[0] !== "string" && only[0].type === "List" && before) {
        before.children = [...(before.children ?? []), only[0]];
        continue;
      }
      left.push(`a list item's marker ${li["list-style-type"]}`);
    }
    const space = px(li["margin-top"] ?? "0px") ?? 0;
    if (items.length) gap ??= space;
    const align = li["text-align"];
    items.push({ type: "ListItem", ...(dir === "rtl" ? { props: { dir } } : {}), ...(align ? { style: { textAlign: align } } : {}), children });
  }
  const own: Record<string, Json> = {};
  if (indent !== undefined && indent !== 24) own.indent = indent;
  if (gap) own.gap = gap;
  const props: Record<string, Json> = {};
  if (tag === "ol") props.type = "number";
  if (tag === "ol" && start && Number(start) !== 1) props.start = Number(start);
  const node: Node = { type: "List", ...(Object.keys(props).length ? { props } : {}), ...(Object.keys(own).length ? { style: own } : {}), children: items };
  // A list has the browser's margins (1em above and below) but where its style says otherwise.
  const margin = margins(d, fontSize, fontSize);
  if (!margin) left.push("a list's margins");
  return { node, margin: margin ?? { top: fontSize, bottom: fontSize } };
}
