/**
 * A legacy Paragraph's or Heading's `html`, the markup today's components draw as it is, as the new components'
 * children (JSX source): <b>/<strong>, <i>/<em>, <u>, <s>, <sup>, <sub>, <span style> and <a href style> become Span
 * and Link, <br> a LineBreak, and paragraphs (<p>) and other blocks (<div>, <li>, ...) lines of their own; entities
 * are decoded. What a run of text can't hold (an image, a list's bullets, a style such as line-height) is left out,
 * and each is named in what's returned for the caller to report: the migration never drops markup quietly.
 */
import { decodeHtmlEntities } from "@unlayer/convert-core";

const TAG = /<\s*(\/?)\s*([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g;
const ATTRIBUTE = /([a-zA-Z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
/** What draws nothing (a comment), and elements whose content isn't text (a style sheet, a script). */
const COMMENT = /<!--[\s\S]*?-->/g;
const NOT_TEXT = /<\s*(style|script|title|head)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi;

/** A CSS length as the new components read it: rem and em (at 16px, or `em`) in px; a width that follows the window at a phone's (375px, never below 0). */
export function inPx(value: string, em = 16): string {
  return value
    .replace(/calc\(\s*(-?[\d.]+)px\s*([-+])\s*([\d.]+)vw\s*\)/g, (_, base: string, sign: string, share: string) => `${Math.max(0, Math.round(Number(base) + (sign === "-" ? -1 : 1) * Number(share) * 3.75))}px`)
    .replace(/(^|\s)(-?\d*\.?\d+)rem(?=\s|$)/g, (_, before: string, amount: string) => `${before}${Number(amount) * 16}px`)
    .replace(/(^|\s)(-?\d*\.?\d+)em(?=\s|$)/g, (_, before: string, amount: string) => `${before}${Math.round(Number(amount) * em * 100) / 100}px`);
}

/** A run's style from a `style` attribute: the properties a Span or Link takes, in the new names. */
const RUN_STYLES: Record<string, string> = {
  color: "color",
  "background-color": "backgroundColor",
  "font-weight": "fontWeight",
  "font-style": "fontStyle",
  "font-size": "fontSize",
  "font-family": "fontFamily",
  "letter-spacing": "letterSpacing",
  "text-decoration": "textDecoration",
  "text-decoration-line": "textDecoration",
  "text-transform": "textTransform",
};

/** Font weights by name, as the new components take them. */
const WEIGHTS: Record<string, number | string> = { normal: "normal", bold: "bold", bolder: 700, lighter: 100 };

/** Tags whose content is a run of text, with the style each gives it. */
const RUNS: Record<string, string[]> = {
  b: ["fontWeight: 700"],
  strong: ["fontWeight: 700"],
  i: ['fontStyle: "italic"'],
  em: ['fontStyle: "italic"'],
  u: ['textDecoration: "underline"'],
  s: ['textDecoration: "line-through"'],
  strike: ['textDecoration: "line-through"'],
  del: ['textDecoration: "line-through"'],
  sup: ['verticalAlign: "super"'],
  sub: ['verticalAlign: "sub"'],
  span: [],
};
/** Tags that are blocks: what's in one starts on a line of its own (a paragraph's after a blank line, its margins). */
const BLOCKS = new Set(["p", "div", "li", "ul", "ol", "dl", "dt", "dd", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre", "center", "address", "section", "article", "header", "footer", "table", "thead", "tbody", "tfoot", "tr", "td", "th", "caption"]);
/** What's left out of a block whose own look a run of text doesn't draw (bullets, a heading's size, a table's cells); <p> and <div> are only lines, and a list's or a table's parts go with it. */
function look(tag: string): string | undefined {
  if (tag === "ul" || tag === "ol" || tag === "dl") return `<${tag}> list is left out: its items are written as lines, with no bullets or numbers`;
  if (tag === "table") return "<table> is left out: its cells are written as lines";
  if (["p", "div", "li", "dt", "dd", "thead", "tbody", "tfoot", "tr", "td", "th", "caption"].includes(tag)) return undefined;
  return `<${tag}> is left out, its text written on lines of its own`;
}

const attributes = (text: string): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const match of text.matchAll(ATTRIBUTE)) out[match[1].toLowerCase()] = decodeHtmlEntities(match[2] ?? match[3] ?? "");
  return out;
};

/**
 * A `style` attribute as the entries of a style object's source (each value written by `expression`), and the
 * declarations no run of text takes, as they're written.
 */
function runStyle(css: string | undefined, expression: (value: string) => string = JSON.stringify): { entries: string[]; dropped: string[] } {
  const entries: string[] = [];
  const dropped: string[] = [];
  for (const declaration of (css ?? "").split(";")) {
    const [property, ...rest] = declaration.split(":");
    const value = rest.join(":").trim();
    if (!property?.trim() || !value) continue;
    const key = RUN_STYLES[property.trim().toLowerCase()];
    if (!key) {
      dropped.push(`${property.trim()}: ${value}`);
      continue;
    }
    if (key === "fontWeight" && !HOLE.test(value)) {
      // 100 to 900 in hundreds, normal or bold, as the new components take it (bolder and lighter as beside normal text).
      const weight = WEIGHTS[value.toLowerCase()] ?? (/^\d+$/.test(value) ? Math.min(900, Math.max(100, Math.round(Number(value) / 100) * 100)) : undefined);
      if (weight === undefined) dropped.push(`${property.trim()}: ${value}`);
      else entries.push(`${key}: ${JSON.stringify(weight)}`);
      continue;
    }
    // In em, a letter spacing is of the size in this style, where it says.
    const size = key === "letterSpacing" ? /(?:^|;)\s*font-size\s*:\s*([\d.]+)(px|rem)/i.exec(css ?? "") : null;
    const em = size ? Number(size[1]) * (size[2].toLowerCase() === "rem" ? 16 : 1) : 16;
    const length = key === "fontSize" || key === "letterSpacing" ? inPx(value, em) : value;
    entries.push(`${key}: ${expression(key === "textDecoration" ? value.split(/\s+/)[0] : length)}`);
  }
  return { entries, dropped };
}

/** Where an expression sits in markup built by a template literal (`<b>${value}</b>`): its index between these. */
export const hole = (index: number) => `\uE000${index}\uE001`;
const HOLE = /\uE000(\d+)\uE001/;
const HOLES = /\uE000(\d+)\uE001/g;

/** Text as JSX source: as it is where JSX keeps it so, else a string expression (spaces at its ends, braces, angle brackets). */
export function plain(value: string): string {
  if (!value) return "";
  // (JSX text decodes entities: `&apos;` that's meant as those letters goes in a string.)
  return /^[^{}<>\s][^{}<>]*[^{}<>\s]$|^[^{}<>\s]$/.test(value) && !/\s{2,}|&#?\w+;/.test(value) ? value : `{${JSON.stringify(value)}}`;
}

/** Text, or JSX source (an element, a line break). */
type Part = { text: string } | { jsx: string };
/** An element open in the markup, and what's in it so far; `open` and `close` are its JSX (none for one left out). */
type Frame = { tag: string; open: string; close: string; parts: Part[]; block?: boolean; apart?: boolean };

/**
 * The markup as children's JSX source, the components they use, and what's left out of it (each a phrase that follows
 * "its html's"). `holes` are the expressions of a template literal the markup came from, each where its hole() is;
 * `name` is the name a component is written as (another where the template has one of its own by that name).
 */
export function inlineHtml(html: string, given: string[] = [], name = (component: string) => component): { jsx: string; used: Set<string>; dropped: string[] } {
  const holes = [...given];
  const used = new Set<string>();
  const dropped = new Set<string>();
  const text = (value: string) => value.split(HOLES).map((part, index) => (index % 2 ? `{${holes[Number(part)]}}` : plain(part))).join("");
  /** A value as an expression: a string, or the template literal's expression (or a template literal) where it holds one. */
  const expression = (raw: string) => {
    if (!HOLE.test(raw)) return JSON.stringify(raw);
    const only = /^\uE000(\d+)\uE001$/.exec(raw);
    if (only) return holes[Number(only[1])];
    return `\`${raw.split(HOLES).map((part, index) => (index % 2 ? `\${${holes[Number(part)]}}` : part.replace(/[`\\]|\$\{/g, (m) => `\\${m}`))).join("")}\``;
  };
  /** Markup as it's written, its holes as the template literal's `${expressions}`. */
  const source = (raw: string) => raw.replace(HOLES, (_, index: string) => `\${${holes[Number(index)]}}`);
  /** Parts as JSX source, runs of text joined. */
  const jsx = (parts: Part[]) => {
    let out = "";
    let run = "";
    for (const part of parts) {
      if ("text" in part) run += part.text;
      else {
        out += text(run) + part.jsx;
        run = "";
      }
    }
    return out + text(run);
  };

  const root: Frame = { tag: "", open: "", close: "", parts: [] };
  const stack: Frame[] = [root];
  const top = () => stack[stack.length - 1];
  /**
   * Line breaks owed before what comes next (a block ended or began), the ones written since the last text (a block
   * starting there needs fewer), and whether anything has been written (a block at the start needs none).
   */
  let owed = 0;
  let trailing = 0;
  let started = false;
  /** Spaces at the end of what's written: a line ends there (HTML doesn't draw them). */
  const trimEnd = () => {
    const parts = top().parts;
    const last = parts[parts.length - 1];
    if (last && "text" in last) last.text = last.text.replace(/ +$/, "");
  };
  const lineBreak = () => {
    used.add("LineBreak");
    top().parts.push({ jsx: `<${name("LineBreak")} />` });
    trailing++;
  };
  const breakLines = () => {
    if (owed && started) {
      trimEnd();
      for (let n = 0; n < owed; n++) lineBreak();
    }
    owed = 0;
  };
  /** A block's start or end: a line of its own, a paragraph's a blank line from what's around it. */
  const block = (tag: string) => {
    if (started) owed = Math.max(owed, (tag === "p" ? 2 : 1) - trailing);
  };
  const pushText = (raw: string) => {
    let value = decodeHtmlEntities(raw.replace(/\s+/g, " "));
    const parts = top().parts;
    const last = parts[parts.length - 1];
    // A line starts where a block does, and spaces next to each other are one: HTML draws neither.
    if (owed || !started || (last && "text" in last && last.text.endsWith(" "))) value = value.replace(/^ +/, "");
    if (!value) return;
    breakLines();
    started = true;
    trailing = 0;
    top().parts.push({ text: value });
  };
  const close = () => {
    const frame = stack.pop()!;
    if (frame.open) top().parts.push({ jsx: `${frame.open}${jsx(frame.parts)}${frame.close}` });
    else top().parts.push(...frame.parts);
    // Boxes in a line of their own (inline-block) never run into each other; runs of text would.
    if (frame.apart) top().parts.push({ jsx: '{" "}' });
  };

  const markup = html.replace(COMMENT, "").replace(NOT_TEXT, (_, tag: string) => {
    dropped.add(`<${tag.toLowerCase()}> is left out, with what's in it`);
    return "";
  });
  let at = 0;
  for (const match of markup.matchAll(TAG)) {
    pushText(markup.slice(at, match.index));
    at = match.index! + match[0].length;
    const closing = match[1] === "/";
    const tag = match[2].toLowerCase();
    if (tag === "br") {
      if (!closing) {
        breakLines();
        started = true;
        lineBreak();
      }
      continue;
    }
    if (tag === "img" || tag === "hr") {
      if (!closing) dropped.add(tag === "img" ? `image ${source(match[0])} is left out: text holds no image (put it in an Image beside this block)` : "<hr> is left out: text holds no line (put a Divider beside this block)");
      continue;
    }
    if (closing) {
      // A closing tag closes what's open since its element (as a browser does); one that closes nothing draws nothing.
      if (!stack.some((frame) => frame.tag === tag)) continue;
      while (top().tag !== tag) close();
      const wasBlock = top().block;
      close();
      if (BLOCKS.has(tag) || wasBlock) block(tag);
      continue;
    }
    const attrs = attributes(match[3]);
    // An attribute from code, as today's markup writes it (`<a${htmlAttribute("href", url)}>`), is the attribute it is.
    for (const [, index] of match[3].replace(/"[^"]*"|'[^']*'/g, "").matchAll(HOLES)) {
      const fromCode = /^\s*\w*htmlAttribute\w*\(\s*["'`]([\w-]+)["'`]\s*,\s*([\s\S]+?)\s*\)\s*$/i.exec(holes[Number(index)]);
      if (!fromCode) continue;
      holes.push(fromCode[2]);
      attrs[fromCode[1].toLowerCase()] = hole(holes.length - 1);
    }
    const onItsOwnLine = !BLOCKS.has(tag) && /(^|;)\s*display\s*:\s*block\b/i.test(attrs.style ?? "");
    const style = runStyle(attrs.style, expression);
    for (const declaration of style.dropped) if (!(onItsOwnLine && /^display\s*:/i.test(declaration))) dropped.add(`style ${source(declaration)} (on <${tag}>) is left out: a run of text doesn't take it`);
    const styled = (base: string[]) => {
      const all = [...base, ...style.entries];
      return all.length ? ` style={{ ${all.join(", ")} }}` : "";
    };
    let open = "";
    let component = "";
    if (Object.prototype.hasOwnProperty.call(RUNS, tag)) component = "Span";
    else if (tag === "a" && attrs.href) component = "Link";
    else if (tag === "p") dropped.add("paragraphs (<p>) are lines a blank line apart: the 1em today's draw above and below each is left out");
    else if (tag === "a") dropped.add("<a> without an href is left out, its text kept");
    else if (!BLOCKS.has(tag)) dropped.add(`<${tag}> is left out, its text kept`);
    else if (look(tag)) dropped.add(look(tag)!);
    if (BLOCKS.has(tag) || onItsOwnLine) {
      block(tag);
      breakLines();
    }
    if (component === "Link") {
      const target = attrs.target;
      const href = target === "_blank" || target === "_self" ? `{{ href: ${expression(attrs.href)}, target: ${JSON.stringify(target)} }}` : HOLE.test(attrs.href) ? `{${expression(attrs.href)}}` : JSON.stringify(attrs.href);
      if (target && target !== "_blank" && target !== "_self") dropped.add(`<a>'s target ${JSON.stringify(target)} is left out: a link opens in a new window ("_blank") or in its own ("_self")`);
      const title = attrs.title === undefined ? "" : ` title=${HOLE.test(attrs.title) ? `{${expression(attrs.title)}}` : JSON.stringify(attrs.title)}`;
      open = `<${name("Link")} href=${href}${title}${styled([])}>`;
    } else if (component === "Span" || style.entries.length) {
      // A block's or another element's style a run takes is its text's.
      component = "Span";
      open = `<${name("Span")}${styled(Object.prototype.hasOwnProperty.call(RUNS, tag) ? RUNS[tag] : [])}>`;
    }
    if (component) used.add(component);
    // An element written closed (`<span />`) holds nothing.
    if (!/\/\s*$/.test(match[3])) stack.push({ tag, open, close: component ? `</${name(component)}>` : "", parts: [], block: onItsOwnLine, apart: /(^|;)\s*display\s*:\s*inline-(block|flex)\b/i.test(attrs.style ?? "") });
  }
  pushText(markup.slice(at));
  // What isn't closed ends with the markup, as a browser draws it.
  while (stack.length > 1) close();
  if (owed) trimEnd();
  return { jsx: jsx(root.parts), used, dropped: [...dropped] };
}
