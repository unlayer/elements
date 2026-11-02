/**
 * A text block's HTML in the builder (a heading's, a text's, a button's `text`) as the runs of a Paragraph, a Heading
 * or a Button: words, Span, Link, LineBreak and MergeTag. The builder writes the HTML it was given back as its editor
 * keeps it (a paragraph around it, `<strong>` for a bold span), so two HTMLs are the same text when their runs are.
 * Markup no run holds (an image, a list, a style no run takes) is left out and said: nothing is dropped quietly.
 */
import { linkParts, type Child, type Json, type LinkValue, type Node } from "@unlayer-internal/elements-core";

const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const cssPx = (n: number) => `${Math.round(n * 100) / 100}px`;

/** A run's style as CSS (a Span's, a Link's). */
function runCss(style: Record<string, Json> | undefined): string {
  if (!style) return "";
  const out: string[] = [];
  const map: Record<string, string> = { color: "color", backgroundColor: "background-color", fontWeight: "font-weight", fontStyle: "font-style", textDecoration: "text-decoration", textTransform: "text-transform" };
  for (const [key, value] of Object.entries(style)) {
    if (value === undefined || value === null) continue;
    if (map[key]) out.push(`${map[key]}:${value}`);
    else if (key === "fontSize" || key === "letterSpacing") out.push(`${key === "fontSize" ? "font-size" : "letter-spacing"}:${cssPx(Number(value))}`);
    else if (key === "fontFamily") out.push(`font-family:${String(value).replace(/"/g, "'")}`);
  }
  return out.join(";");
}

/** A text block's runs as the HTML today's text tools (and the builder) take. */
export function runsHtml(node: Node): string {
  return (node.children ?? [])
    .map((child) => {
      if (typeof child === "string") return escapeHtml(child);
      const css = runCss(child.style);
      const style = css ? ` style="${css}"` : "";
      switch (child.type) {
        case "LineBreak":
          return "<br>";
        case "MergeTag":
          return `{{${child.props?.name}}}`;
        case "PageNumber":
          // The builder has no page numbers: a token in their place, read back as one.
          return child.props?.total ? "{{page_count}}" : "{{page_number}}";
        case "Link":
          const { href, target } = linkParts(child.props?.href as LinkValue);
          return `<a href="${escapeHtml(href)}" target="${target ?? "_blank"}"${style}>${runsHtml(child)}</a>`;
        default:
          return `<span${style}>${runsHtml(child)}</span>`;
      }
    })
    .join("");
}

const TAG = /<\s*(\/?)\s*([a-zA-Z][a-zA-Z0-9]*)([^>]*?)\/?\s*>/g;
const ATTRIBUTE = /([a-zA-Z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'" };

function decode(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, name: string) => {
    if (name[0] === "#") return String.fromCodePoint(name[1].toLowerCase() === "x" ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10));
    return ENTITIES[name.toLowerCase()] ?? match;
  });
}

function attributes(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const match of text.matchAll(ATTRIBUTE)) out[match[1].toLowerCase()] = decode(match[2] ?? match[3] ?? "");
  return out;
}

/** A color as hex where the builder wrote it as rgb() (its editor does), so the same color reads the same. */
const hex = (value: string) => {
  const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*1(?:\.0+)?\s*)?\)$/i.exec(value);
  return rgb ? `#${rgb.slice(1, 4).map((n) => Number(n).toString(16).padStart(2, "0")).join("")}` : value;
};
const px = (value: string) => (/^-?[\d.]+px$/.test(value.trim()) ? parseFloat(value) : undefined);

/** A `style` attribute as a run's style: the properties a Span or a Link takes. */
function runStyle(css: string | undefined, left: string[]): Record<string, Json> {
  const out: Record<string, Json> = {};
  for (const declaration of (css ?? "").split(";")) {
    const [property, ...rest] = declaration.split(":");
    const name = property?.trim().toLowerCase();
    const value = rest.join(":").trim();
    if (!name || !value) continue;
    if (name === "color") out.color = hex(value);
    else if (name === "background-color") out.backgroundColor = hex(value);
    else if (name === "font-weight") out.fontWeight = value === "bold" ? 700 : value === "normal" ? 400 : Number(value) || value;
    else if (name === "font-style") out.fontStyle = value;
    else if (name === "text-decoration" || name === "text-decoration-line") out.textDecoration = value.split(/\s+/)[0];
    else if (name === "text-transform") out.textTransform = value;
    else if (name === "font-family") out.fontFamily = value;
    else if (name === "font-size" && px(value) !== undefined) out.fontSize = px(value)!;
    else if (name === "letter-spacing" && px(value) !== undefined) out.letterSpacing = px(value)!;
    else if (name !== "line-height") left.push(`${name}: ${value}`);
  }
  return out;
}

/** What a tag adds to the style of the text in it. */
const TAG_STYLE: Record<string, Record<string, Json>> = { b: { fontWeight: 700 }, strong: { fontWeight: 700 }, i: { fontStyle: "italic" }, em: { fontStyle: "italic" }, u: { textDecoration: "underline" }, s: { textDecoration: "line-through" }, strike: { textDecoration: "line-through" } };

/** Words, with a merge tag ({{name}}) as a MergeTag, as the builder writes one. */
function words(text: string, into: Child[]) {
  let last = 0;
  for (const match of text.matchAll(/\{\{\s*([\w.-]+)\s*\}\}/g)) {
    if (match.index! > last) into.push(text.slice(last, match.index));
    // A Document's page number, as toDesign() writes it (outside a Document, fromDesign() makes it a merge tag again).
    if (match[1] === "page_number" || match[1] === "page_count") into.push({ type: "PageNumber", ...(match[1] === "page_count" ? { props: { total: true } } : {}) });
    else into.push({ type: "MergeTag", props: { name: match[1] } });
    last = match.index! + match[0].length;
  }
  if (last < text.length) into.push(text.slice(last));
}

type Frame = { tag: string; node: Node | null; children: Child[] };

/** The HTML as runs, and what in it no run holds. */
export function parseRuns(html: string): { children: Child[]; left: string[] } {
  const left: string[] = [];
  const root: Frame = { tag: "", node: null, children: [] };
  const stack: Frame[] = [root];
  const top = () => stack[stack.length - 1];
  let paragraphs = 0;
  let last = 0;
  const text = (raw: string) => {
    const value = decode(raw.replace(/\s*\n\s*/g, " "));
    if (value) words(value, top().children);
  };
  for (const match of html.matchAll(TAG)) {
    text(html.slice(last, match.index));
    last = match.index! + match[0].length;
    const closing = match[1] === "/";
    const tag = match[2].toLowerCase();
    if (tag === "br") {
      top().children.push({ type: "LineBreak" });
      continue;
    }
    if (tag === "p" || tag === "div") {
      // Paragraphs one under another (the builder sets no space between them): a line break between each.
      if (!closing && paragraphs++ > 0) top().children.push({ type: "LineBreak" });
      if (!closing && /text-align\s*:/i.test(attributes(match[3]).style ?? "")) left.push("a paragraph's own alignment");
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
    const attrs = attributes(match[3]);
    if (tag === "a") {
      const style = runStyle(attrs.style, left);
      stack.push({ tag, node: { type: "Link", props: { href: attrs.href ?? "" }, ...(Object.keys(style).length ? { style } : {}) }, children: [] });
    } else if (tag === "span" || TAG_STYLE[tag]) {
      const style = { ...TAG_STYLE[tag], ...runStyle(attrs.style, left) };
      stack.push({ tag, node: Object.keys(style).length ? { type: "Span", style } : null, children: [] });
    } else {
      left.push(`<${tag}>`);
      stack.push({ tag, node: null, children: [] });
    }
  }
  text(html.slice(last));
  while (stack.length > 1) {
    const frame = stack.pop()!;
    if (frame.node) top().children.push({ ...frame.node, children: frame.children });
    else top().children.push(...frame.children);
  }
  return { children: tidy(root.children), left };
}

/** Runs as one writes them: words side by side as one, a Span holding only a Span as one Span. */
function tidy(children: Child[]): Child[] {
  const out: Child[] = [];
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

/** Whether two HTMLs are the same text: the same runs, and the same markup no run holds (an image added is a change). */
export function sameText(a: unknown, b: unknown): boolean {
  if (typeof a !== "string" || typeof b !== "string") return a === b;
  if (a === b) return true;
  const [x, y] = [parseRuns(a), parseRuns(b)];
  return JSON.stringify(x.children) === JSON.stringify(y.children) && JSON.stringify([...new Set(x.left)].sort()) === JSON.stringify([...new Set(y.left)].sort());
}

/** Whether a node's runs are all its HTML holds (else editing its text in the builder loses the rest: a link's hover). */
export function heldByHtml(node: Node): boolean {
  return JSON.stringify(parseRuns(runsHtml(node)).children) === JSON.stringify(tidy(node.children ?? []));
}
