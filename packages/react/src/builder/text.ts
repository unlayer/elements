/**
 * A text tool's HTML read back as blocks of runs, as legacy (and so the builder) draws it. Runs are compat's run
 * parser's (it fails closed), with merge tags as MergeTags. A `<p>` without margins of 0 has the browser's (1em above
 * and below, between two of them once): each is a block of its own, its margins its padding. A `<ul>` or `<ol>` is a
 * List, its padding its indent and its items' margin its gap. What isn't read exactly is said in `left`, and the
 * block is kept as its markup.
 */
import type { Child, Json, Node } from "@unlayer-internal/elements-core";
import { parseRuns, type Run } from "../compat/runs";
import { px } from "../compat/values";

export interface TextPart {
  /** A Paragraph's runs, or a List. */
  node: Node;
  /** The browser's margin above and below it (a `<p>`'s, a list's), in ems. */
  margin: number;
}

const TAG = /<\s*(\/?)\s*([a-zA-Z][a-zA-Z0-9]*)([^>]*?)(\/?)\s*>/g;
const style = (attrs: string) => /\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attrs)?.slice(1).find((v) => v !== undefined) ?? "";
const declarations = (css: string) => Object.fromEntries(css.split(";").map((d) => d.split(":")).filter((p) => p.length >= 2 && p[0].trim()).map(([name, ...rest]) => [name.trim().toLowerCase(), rest.join(":").trim()]));
const zero = (value: string | undefined) => value !== undefined && /^0(px)?$/.test(value);

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

/** Whether the HTML has blocks of its own (a `<p>` with the browser's margins, a list) rather than lines. */
const blocky = (html: string) => /<\s*(ul|ol)\b/i.test(html) || [...html.matchAll(/<\s*p\b([^>]*)>/gi)].some((m) => !margins0(m[1]));
const margins0 = (attrs: string) => {
  const d = declarations(style(attrs));
  return zero(d.margin) || ((zero(d["margin-top"]) || zero(d["margin-block-start"])) && (zero(d["margin-bottom"]) || zero(d["margin-block-end"])));
};

/** The HTML as parts, each a block, and what isn't read. */
export function readText(html: string, { weight = 400, pages = false, links = true } = {}): { parts: TextPart[]; left: string[] } {
  const left: string[] = [];
  const runs = (inner: string): Child[] => {
    const read = parseRuns(inner, { weight, links, builder: true });
    left.push(...read.left);
    return mergeTags(read.children, pages);
  };
  if (!blocky(html)) return { parts: [{ node: { type: "Paragraph", children: runs(html) }, margin: 0 }], left };
  const parts: TextPart[] = [];
  let inline = "";
  const flush = () => {
    if (inline.trim()) parts.push({ node: { type: "Paragraph", children: runs(inline) }, margin: 0 });
    inline = "";
  };
  // The top level: `<p>`s and lists as blocks, what's between them as lines.
  let at = 0;
  for (const match of [...html.matchAll(TAG)]) {
    if (match.index! < at) continue;
    const tag = match[2].toLowerCase();
    if (match[1] || (tag !== "p" && tag !== "ul" && tag !== "ol")) continue;
    inline += html.slice(at, match.index);
    const end = closing(html, tag, match.index! + match[0].length);
    if (end === null) {
      left.push(`a <${tag}> that isn't closed`);
      return { parts, left };
    }
    const inner = html.slice(match.index! + match[0].length, end.start);
    flush();
    if (tag === "p") {
      const d = declarations(style(match[3]));
      const own: Record<string, Json> = {};
      if (d["line-height"] !== undefined) {
        const height = /^(\d*\.?\d+)%$/.exec(d["line-height"]);
        if (height) own.lineHeight = Number(height[1]) / 100;
        else if (px(d["line-height"]) !== undefined) own.lineHeight = `${px(d["line-height"])}px`;
        else left.push(`a paragraph's line height ${d["line-height"]}`);
      }
      if (d["text-align"] !== undefined) own.textAlign = d["text-align"];
      const other = Object.keys(d).filter((name) => !["line-height", "text-align", "margin", "margin-top", "margin-bottom", "margin-block-start", "margin-block-end"].includes(name));
      if (other.length || /\b(class|id|dir)\s*=/.test(match[3])) left.push("a paragraph with attributes of its own");
      parts.push({ node: { type: "Paragraph", ...(Object.keys(own).length ? { style: own } : {}), children: runs(inner) }, margin: margins0(match[3]) ? 0 : 1 });
    } else {
      const list = readList(tag, match[3], inner, runs, left);
      parts.push({ node: list.node, margin: list.margin });
    }
    at = end.end;
  }
  inline += html.slice(at);
  flush();
  return { parts, left };
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

/** A `<ul>` or `<ol>` as a List: its padding its indent (the browser's 40px), its items' margin above its gap. */
function readList(tag: string, attrs: string, inner: string, runs: (html: string) => Child[], left: string[]): { node: Node; margin: number } {
  const d = declarations(style(attrs));
  const indent = px(d["padding-left"] ?? d.padding ?? "40px");
  if (indent === undefined) left.push(`a list's indent ${d["padding-left"]}`);
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
    const body = inner.slice(match.index! + match[0].length, end.start);
    const space = px(declarations(style(match[3]))["margin-top"] ?? "0px") ?? 0;
    if (items.length) gap ??= space;
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
      children.push(readList(tag, nested[2], rest.slice(nested.index + nested[0].length, close.start), runs, left).node);
      rest = rest.slice(close.end);
    }
    if (rest) children.push(...runs(rest));
    items.push({ type: "ListItem", children });
    at = end.end;
  }
  const own: Record<string, Json> = {};
  if (indent !== undefined && indent !== 24) own.indent = indent;
  if (gap) own.gap = gap;
  const props: Record<string, Json> = {};
  if (tag === "ol") props.type = "number";
  if (tag === "ol" && start && Number(start) !== 1) props.start = Number(start);
  const node: Node = { type: "List", ...(Object.keys(props).length ? { props } : {}), ...(Object.keys(own).length ? { style: own } : {}), children: items };
  return { node, margin: zero(d.margin) || (zero(d["margin-top"]) && zero(d["margin-bottom"])) ? 0 : 1 };
}
