/**
 * A text block's HTML (a heading's, a text's, a button's `text`) as the runs of a Paragraph, a Heading or a Button:
 * words, Span, Link and LineBreak, drawn as the browser draws the HTML. Paragraphs (`<p>` with no margins, as legacy's
 * own are written, and `<div>`) are lines one under another; a paragraph holding only a line break is an empty line, an
 * empty one nothing. It fails closed: anything it doesn't read exactly as the browser does (markup no run holds, a
 * comment, an entity it doesn't know, a `<p>` with the browser's margins, white space between paragraphs, a link's
 * target or an attribute a run doesn't take) is said in `left`, and the block keeps its legacy HTML.
 */
import type { Json } from "@unlayer-internal/elements-core";
import type { TreeNode } from "./lower";

export type Run = TreeNode | string;

const TAG = /<\s*(\/?)\s*([a-zA-Z][a-zA-Z0-9]*)([^>]*?)\/?\s*>/g;
const ATTRIBUTE = /([a-zA-Z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
/**
 * The named entities read (as HTML names them: case matters), each the character the browser draws. Another is said in
 * `left`, as is one without its semicolon (which the browser may read as an entity, or not).
 */
const ENTITIES: Record<string, string> = {
  amp: "&", AMP: "&", lt: "<", LT: "<", gt: ">", GT: ">", quot: '"', QUOT: '"', apos: "'", nbsp: " ",
  copy: "©", COPY: "©", reg: "®", REG: "®", trade: "™", mdash: "—", ndash: "–", hellip: "…",
  lsquo: "‘", rsquo: "’", sbquo: "‚", ldquo: "“", rdquo: "”", bdquo: "„", laquo: "«", raquo: "»",
  lsaquo: "‹", rsaquo: "›", euro: "€", pound: "£", yen: "¥", cent: "¢", sect: "§", para: "¶",
  middot: "·", bull: "•", deg: "°", plusmn: "±", times: "×", divide: "÷", frac12: "½",
  frac14: "¼", frac34: "¾", iexcl: "¡", iquest: "¿", shy: "­", ensp: " ", emsp: " ",
  thinsp: " ", zwnj: "‌", zwj: "‍", lrm: "‎", rlm: "‏", dagger: "†", Dagger: "‡",
  permil: "‰", larr: "←", rarr: "→", uarr: "↑", darr: "↓", harr: "↔",
};
const ENTITY = /&(#[xX][0-9a-fA-F]+|#\d+|[a-zA-Z][a-zA-Z0-9]*);/g;
/** The names HTML reads without their semicolon ("&copy 2024"): another & followed by letters is text ("S&P 500"). */
const NO_SEMICOLON = (
  "AElig AMP Aacute Acirc Agrave Aring Atilde Auml COPY Ccedil ETH Eacute Ecirc Egrave Euml GT Iacute Icirc Igrave Iuml LT " +
  "Ntilde Oacute Ocirc Ograve Oslash Otilde Ouml QUOT REG THORN Uacute Ucirc Ugrave Uuml Yacute aacute acirc acute aelig " +
  "agrave amp aring atilde auml brvbar ccedil cedil cent copy curren deg divide eacute ecirc egrave eth euml frac12 frac14 " +
  "frac34 gt iacute icirc iexcl igrave iquest iuml laquo lt macr micro middot nbsp not ntilde oacute ocirc ograve ordf ordm " +
  "oslash otilde ouml para plusmn pound quot raquo reg sect shy sup1 sup2 sup3 szlig thorn times uacute ucirc ugrave uml " +
  "uuml yacute yen yuml"
).split(" ");

/**
 * Text with its entities decoded. One it doesn't read as the browser does is said in `left`: an unknown name, a name
 * without its semicolon, or a number the browser reads otherwise (none, a surrogate, past Unicode, or 128 to 159, which
 * it reads as Windows-1252).
 */
function decode(text: string, left: string[]): string {
  const out = text.replace(ENTITY, (match, name: string) => {
    if (name[0] === "#") {
      const code = name[1] === "x" || name[1] === "X" ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
      if (code > 0 && code <= 0x10ffff && !(code >= 0x80 && code <= 0x9f) && !(code >= 0xd800 && code <= 0xdfff)) return String.fromCodePoint(code);
    } else if (Object.prototype.hasOwnProperty.call(ENTITIES, name)) return ENTITIES[name];
    left.push(`the entity ${match}`);
    return match;
  });
  // An & the browser may read as an entity without its semicolon: a number, or one of the names it reads so.
  const rest = text.replace(ENTITY, "");
  if (/&#(\d|[xX][0-9a-fA-F])/.test(rest) || [...rest.matchAll(/&([a-zA-Z]+)/g)].some((m) => NO_SEMICOLON.some((name) => m[1].startsWith(name)))) {
    left.push("an entity without its semicolon");
  }
  return out;
}

function attributes(text: string, left: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const match of text.matchAll(ATTRIBUTE)) out[match[1].toLowerCase()] = decode(match[2] ?? match[3] ?? "", left);
  // An attribute with no value (`hidden`), or one written without quotes, is one too.
  for (const name of text.replace(ATTRIBUTE, " ").match(/[a-zA-Z][\w:-]*/g) ?? []) out[name.toLowerCase()] ??= "";
  return out;
}

const pxOf = (value: string) => (/^-?[\d.]+px$/.test(value.trim()) ? parseFloat(value) : undefined);
const WEIGHTS: Record<string, number> = { normal: 400, bold: 700 };

/** A `style` attribute as a run's style: the properties a Span or a Link takes; the others are said in `left`. */
function runStyle(css: string | undefined, left: string[]): Record<string, Json> {
  const out: Record<string, Json> = {};
  for (const declaration of (css ?? "").split(";")) {
    const [property, ...rest] = declaration.split(":");
    const name = property?.trim().toLowerCase();
    const value = rest.join(":").trim();
    if (!name || !value) continue;
    const weight = WEIGHTS[value] ?? (/^[1-9]00$/.test(value) ? Number(value) : undefined);
    if (name === "color" && !/[!;]/.test(value)) out.color = value;
    else if (name === "background-color" && !/[!;]/.test(value)) out.backgroundColor = value;
    else if (name === "font-weight" && weight !== undefined) out.fontWeight = weight;
    else if (name === "font-style" && (value === "italic" || value === "normal")) out.fontStyle = value;
    else if ((name === "text-decoration" || name === "text-decoration-line") && ["none", "underline", "line-through"].includes(value)) out.textDecoration = value;
    else if (name === "text-transform" && ["none", "uppercase", "lowercase", "capitalize"].includes(value)) out.textTransform = value;
    else if (name === "font-size" && pxOf(value) !== undefined) out.fontSize = pxOf(value)!;
    else if (name === "letter-spacing" && pxOf(value) !== undefined) out.letterSpacing = pxOf(value)!;
    else left.push(`${name}: ${value}`);
  }
  return out;
}

/** What a tag adds to the style of the text in it (`<b>` its weight: the browser's bolder than the text around it). */
function tagStyle(tag: string, weight: number): Record<string, Json> | undefined {
  switch (tag) {
    case "b":
    case "strong":
      return { fontWeight: weight < 400 ? 400 : weight < 600 ? 700 : 900 };
    case "i":
    case "em":
      return { fontStyle: "italic" };
    case "u":
      return { textDecoration: "underline" };
    case "s":
    case "strike":
      return { textDecoration: "line-through" };
    case "span":
      return {};
  }
  return undefined;
}

type Frame = { tag: string; node: TreeNode | null; children: Run[]; weight: number };

/**
 * The HTML as runs, and what in it no run holds. `weight` is the block's font weight, which a `<b>` makes bolder;
 * `links` says whether text may hold links (a button's can't: it's one).
 */
export function parseRuns(html: string, { weight = 400, links = true }: { weight?: number; links?: boolean } = {}): { children: Run[]; left: string[] } {
  const left: string[] = [];
  // A comment, a processing instruction or a declaration (`<!-- -->`, `<?php ?>`, `<![CDATA[`): the browser doesn't show
  // it, or shows it otherwise; it's not read.
  if (/<[!?]/.test(html)) left.push("a comment or a processing instruction");
  const lines: Run[][] = [];
  let current: Frame = { tag: "", node: null, children: [], weight };
  const stack: Frame[] = [current];
  const top = () => stack[stack.length - 1];
  /** A paragraph ends: its runs are a line (or none, where it's empty). */
  const endParagraph = () => {
    if (stack.length > 1) left.push("a paragraph inside text that's styled");
    const runs = tidy(current.children);
    // A line break that ends a paragraph doesn't start another line (unless it's all the paragraph has).
    if (runs.length > 1 && isBreak(runs[runs.length - 1])) runs.pop();
    if (runs.length) lines.push(runs.length === 1 && isBreak(runs[0]) ? [] : runs);
    current = { tag: "", node: null, children: [], weight };
    stack.splice(0, stack.length, current);
  };
  let last = 0;
  /** Whether the last tag read was a paragraph's (opening or closing). */
  let afterParagraph = false;
  const text = (raw: string, beforeParagraph: boolean) => {
    // White space between paragraphs: the browser may draw it as a line of its own (in a run of text), or not.
    if (raw && !raw.trim() && (afterParagraph || beforeParagraph)) left.push("white space between paragraphs");
    // White space as written: the browser shows it as it shows legacy's, and its plain text keeps its line breaks.
    const value = decode(raw, left);
    if (value) top().children.push(value);
  };
  for (const match of html.matchAll(TAG)) {
    const tag = match[2].toLowerCase();
    text(html.slice(last, match.index), tag === "p" || tag === "div");
    last = match.index! + match[0].length;
    const closing = match[1] === "/";
    const attrs = attributes(match[3], left);
    afterParagraph = tag === "p" || tag === "div";
    if (tag === "br") {
      top().children.push({ type: "LineBreak" });
      continue;
    }
    if (tag === "p" || tag === "div") {
      endParagraph();
      // A paragraph's own style (its alignment, its spacing) isn't a run's; margins of 0 are legacy's own.
      const declarations = (attrs.style ?? "").split(";").map((d) => d.trim()).filter(Boolean);
      const zero = (d: string, side = "(-block-start|-block-end|-top|-bottom)?") => new RegExp(`^margin${side}\\s*:\\s*0(px)?$`, "i").test(d);
      const own = declarations.filter((d) => !zero(d));
      if (!closing && (own.length || Object.keys(attrs).some((name) => name !== "style"))) left.push(`<${tag}> with its own attributes`);
      // A <p> without margins of 0 above and below has the browser's (1em each): lines aren't spaced so.
      const both = declarations.some((d) => zero(d, "")) || ["(-top|-block-start)", "(-bottom|-block-end)"].every((side) => declarations.some((d) => zero(d, side)));
      if (!closing && tag === "p" && !both) left.push("a <p> with the browser's margins");
      continue;
    }
    if (closing) {
      const at = stack.map((frame) => frame.tag).lastIndexOf(tag);
      if (at <= 0) continue;
      while (stack.length > at) {
        const frame = stack.pop()!;
        if (frame.node) top().children.push({ ...frame.node, children: frame.children });
        else top().children.push(...frame.children);
      }
      continue;
    }
    const weightHere = top().weight;
    if (tag === "a" && links) {
      const style = runStyle(attrs.style, left);
      const href = attrs.href ?? "";
      const target = attrs.target;
      // A Link writes its href, where it opens (a new window, "_blank", or its own, "_self") and its style: another
      // target, or another attribute (its rel), isn't written.
      if (!href || Object.keys(attrs).some((name) => !["href", "target", "style"].includes(name))) left.push("a link with no href, or with attributes a Link doesn't take");
      if (target !== undefined && target !== "_blank" && target !== "_self") left.push(`a link opening in ${JSON.stringify(target)}`);
      stack.push({ tag, node: { type: "Link", props: { href: target === "_blank" || target === "_self" ? { href, target } : href }, ...(Object.keys(style).length ? { style } : {}) }, children: [], weight: (style.fontWeight as number | undefined) ?? weightHere });
      continue;
    }
    const own = tagStyle(tag, weightHere);
    if (!own || Object.keys(attrs).some((name) => name !== "style")) {
      left.push(`<${tag}>`);
      stack.push({ tag, node: null, children: [], weight: weightHere });
      continue;
    }
    const style = { ...own, ...runStyle(attrs.style, left) };
    stack.push({ tag, node: Object.keys(style).length ? { type: "Span", style } : null, children: [], weight: (style.fontWeight as number | undefined) ?? weightHere });
  }
  text(html.slice(last), false);
  while (stack.length > 1) {
    const frame = stack.pop()!;
    if (frame.node) top().children.push({ ...frame.node, children: frame.children });
    else top().children.push(...frame.children);
  }
  endParagraph();
  const children: Run[] = [];
  lines.forEach((line, index) => {
    if (index) children.push({ type: "LineBreak" });
    children.push(...line);
  });
  // An empty line last: a line break there would end the line before it, so it's one more.
  if (lines.length > 1 && !lines[lines.length - 1].length) children.push({ type: "LineBreak" });
  return { children, left };
}

const isBreak = (run: Run | undefined) => typeof run === "object" && run.type === "LineBreak";

/** Runs as one writes them: words side by side as one, a Span holding only a Span as one Span, empty Spans left out. */
function tidy(children: Run[]): Run[] {
  const out: Run[] = [];
  for (const child of children) {
    if (typeof child === "string") {
      if (typeof out[out.length - 1] === "string") out[out.length - 1] = (out[out.length - 1] as string) + child;
      else if (child) out.push(child);
      continue;
    }
    const inner = child.children ? tidy(child.children) : undefined;
    // (Not where both set one property, as an underline around a strike: the browser draws both.)
    const overlap = (a: Record<string, Json> = {}, b: Record<string, Json> = {}) => Object.keys(a).some((key) => key in b);
    if (child.type === "Span" && inner?.length === 1 && typeof inner[0] !== "string" && inner[0].type === "Span" && !overlap(child.style, inner[0].style)) {
      out.push({ ...inner[0], style: { ...child.style, ...inner[0].style } });
    } else if (child.type === "Span" && inner && !inner.length) continue;
    else out.push(inner ? { ...child, children: inner } : child);
  }
  return out;
}
