/**
 * A text block's HTML (a heading's, a text's, a button's `text`) as the runs of a Paragraph, a Heading or a Button:
 * words, Span, Link and LineBreak, drawn as the browser draws the HTML. Paragraphs (`<p>`, `<div>`) are lines one under
 * another, as legacy writes them with no space between; a paragraph holding only a line break is an empty line, an
 * empty one nothing. Markup no run holds (an image, a list, a paragraph's own style, a style no run takes) is said in
 * `left`: the block keeps its legacy HTML.
 */
import type { Json } from "@unlayer-internal/elements-core";
import type { TreeNode } from "./lower";

export type Run = TreeNode | string;

const TAG = /<\s*(\/?)\s*([a-zA-Z][a-zA-Z0-9]*)([^>]*?)\/?\s*>/g;
const ATTRIBUTE = /([a-zA-Z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'" };

function decode(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, name: string) => {
    if (name[0] === "#") {
      const code = name[1].toLowerCase() === "x" ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
    }
    return ENTITIES[name.toLowerCase()] ?? match;
  });
}

function attributes(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const match of text.matchAll(ATTRIBUTE)) out[match[1].toLowerCase()] = decode(match[2] ?? match[3] ?? "");
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
  const text = (raw: string) => {
    // White space as written: the browser shows it as it shows legacy's, and its plain text keeps its line breaks.
    const value = decode(raw);
    if (value) top().children.push(value);
  };
  for (const match of html.matchAll(TAG)) {
    text(html.slice(last, match.index));
    last = match.index! + match[0].length;
    const closing = match[1] === "/";
    const tag = match[2].toLowerCase();
    const attrs = attributes(match[3]);
    if (tag === "br") {
      top().children.push({ type: "LineBreak" });
      continue;
    }
    if (tag === "p" || tag === "div") {
      endParagraph();
      // A paragraph's own style (its alignment, its spacing) isn't a run's; margins of 0 are legacy's own.
      const own = (attrs.style ?? "").split(";").map((d) => d.trim()).filter((d) => d && !/^margin(-block-start|-block-end|-top|-bottom)?\s*:\s*0(px)?$/i.test(d));
      if (!closing && (own.length || Object.keys(attrs).some((name) => name !== "style"))) left.push(`<${tag}> with its own attributes`);
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
      if (!href || Object.keys(attrs).some((name) => !["href", "target", "style", "rel"].includes(name))) left.push("a link with no href, or with attributes a Link doesn't take");
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
  text(html.slice(last));
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
    if (child.type === "Span" && inner?.length === 1 && typeof inner[0] !== "string" && inner[0].type === "Span") {
      out.push({ ...inner[0], style: { ...child.style, ...inner[0].style } });
    } else if (child.type === "Span" && inner && !inner.length) continue;
    else out.push(inner ? { ...child, children: inner } : child);
  }
  return out;
}
