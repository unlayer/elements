/**
 * A small HTML tokenizer for the rich text Beefree stores (TinyMCE's and its newer editor's): enough to clean it as
 * Beefree's own exporter does (editor attributes and pasted comments out, line heights from the block, paragraphs
 * without margins) without a DOM. Text and markup it doesn't touch are written back as they were.
 */

export interface StartTag {
  kind: "start";
  name: string;
  attrs: Array<[string, string | undefined]>;
  selfClosing: boolean;
}

export type Token = StartTag | { kind: "end"; name: string } | { kind: "text"; text: string } | { kind: "comment"; text: string };

const TAG = /<!--[\s\S]*?(?:-->|$)|<(\/?)([a-zA-Z][\w:-]*)((?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*)\s*(\/?)>/g;
const ATTR = /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;

export function tokenize(html: string): Token[] {
  const tokens: Token[] = [];
  let last = 0;
  for (const match of html.matchAll(TAG)) {
    if (match.index! > last) tokens.push({ kind: "text", text: html.slice(last, match.index) });
    last = match.index! + match[0].length;
    if (match[0].startsWith("<!--")) {
      tokens.push({ kind: "comment", text: match[0] });
      continue;
    }
    const name = match[2].toLowerCase();
    if (match[1]) {
      tokens.push({ kind: "end", name });
      continue;
    }
    const attrs: StartTag["attrs"] = [];
    for (const attr of (match[3] ?? "").matchAll(ATTR)) attrs.push([attr[1].toLowerCase(), attr[2] ?? attr[3] ?? attr[4]]);
    tokens.push({ kind: "start", name, attrs, selfClosing: !!match[4] });
  }
  if (last < html.length) tokens.push({ kind: "text", text: html.slice(last) });
  return tokens;
}

const escapeAttr = (value: string) => value.replace(/&(?!(#\d+|#x[\da-f]+|[a-z][\w]*);)/gi, "&amp;").replace(/"/g, "&quot;");

export function serialize(tokens: Token[]): string {
  return tokens
    .map((token) => {
      if (token.kind === "text" || token.kind === "comment") return token.text;
      if (token.kind === "end") return `</${token.name}>`;
      const attrs = token.attrs.map(([name, value]) => (value === undefined ? ` ${name}` : ` ${name}="${escapeAttr(value)}"`)).join("");
      return `<${token.name}${attrs}${token.selfClosing ? " /" : ""}>`;
    })
    .join("");
}

export const getAttr = (tag: StartTag, name: string) => tag.attrs.find(([key]) => key === name)?.[1];

export function setAttr(tag: StartTag, name: string, value: string | undefined): void {
  const index = tag.attrs.findIndex(([key]) => key === name);
  if (value === undefined) {
    if (index >= 0) tag.attrs.splice(index, 1);
  } else if (index >= 0) tag.attrs[index] = [name, value];
  else tag.attrs.push([name, value]);
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'" };

/** Character references in an attribute value (`&#39;Montserrat&#39;`). */
export function decodeEntities(value: string): string {
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (whole, ref: string) => {
    if (ref[0] === "#") {
      const code = ref[1] === "x" || ref[1] === "X" ? parseInt(ref.slice(2), 16) : parseInt(ref.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
    }
    return ENTITIES[ref.toLowerCase()] ?? whole;
  });
}

/** An inline style's declarations, in order (property names lowercased, values decoded). */
export function parseStyle(style: string | undefined): Array<[string, string]> {
  if (!style) return [];
  const out: Array<[string, string]> = [];
  for (const part of decodeEntities(style).split(/;(?![^(]*\))/)) {
    const colon = part.indexOf(":");
    if (colon < 0) continue;
    const name = part.slice(0, colon).trim().toLowerCase();
    const value = part.slice(colon + 1).trim();
    if (name && value) out.push([name, value]);
  }
  return out;
}

export const styleString = (declarations: Array<[string, string]>) => declarations.map(([name, value]) => `${name}: ${value}`).join("; ") + (declarations.length ? ";" : "");

/** Whether tokens hold only whitespace text (and comments). */
const blank = (token: Token) => (token.kind === "text" && !token.text.trim()) || token.kind === "comment";

/**
 * The tokens' single outer element, where everything is inside one (`<div class="txtTinyMce-wrapper">…</div>`): its
 * start tag and what's inside. Undefined when there's more than one element at the top, or text beside it.
 */
export function singleRoot(tokens: Token[], names: readonly string[]): { tag: StartTag; inner: Token[] } | undefined {
  const first = tokens.findIndex((token) => !blank(token));
  let end = tokens.length - 1;
  while (end > first && blank(tokens[end])) end--;
  const open = tokens[first];
  const close = tokens[end];
  if (!open || open.kind !== "start" || !names.includes(open.name) || open.selfClosing || !close || close.kind !== "end" || close.name !== open.name) return undefined;
  // The start tag's own end must be the last one: count its depth.
  let depth = 0;
  for (let i = first; i <= end; i++) {
    const token = tokens[i];
    if (token.kind === "start" && token.name === open.name && !token.selfClosing) depth++;
    else if (token.kind === "end" && token.name === open.name && --depth === 0 && i !== end) return undefined;
  }
  return { tag: open, inner: tokens.slice(first + 1, end) };
}

/** The visible text of some HTML (tags out, references decoded), for checks such as "is there anything to show". */
export function textOf(html: string): string {
  return decodeEntities(
    tokenize(html)
      .filter((token): token is { kind: "text"; text: string } => token.kind === "text")
      .map((token) => token.text)
      .join("")
  );
}

/** Whether HTML is only text and character references: no tags (what a component's children can hold). */
export const isPlain = (html: string) => tokenize(html).every((token) => token.kind === "text");

/** Text escaped for HTML. */
export const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
