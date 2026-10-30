/** Text in a design: what can be written as JSX children, and a block's HTML taken from an exported document. */

/**
 * The text of `html` when it can be JSX children that render back to exactly it: words apart by single spaces, with
 * nothing React escapes (`&`, `<`, `>`, quotes) and no braces. Otherwise undefined (the HTML goes in a prop).
 */
export function plainText(html: unknown): string | undefined {
  if (typeof html !== "string" || !html) return undefined;
  return /^[^\s&<>"'{}]+(?: [^\s&<>"'{}]+)*$/.test(html) ? html : undefined;
}

const VOID = /^(area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)$/i;

/**
 * A document read once (see blockHtml): where each id's start tag begins (its first), where each tag that holds the
 * padding class does (in order, with where its class is), and where each element's end tag is (by its start: the end
 * tag of its name that brings its name's depth back to it, as an element's end is read here, whatever's between).
 * Looking each block up from the document's start (and reading to its end for an element that has no end tag) took
 * time growing with the number of blocks squared.
 */
interface Read {
  ids: Map<string, number>;
  padded: Array<{ at: number; start: number }>;
  ends: Map<number, number>;
}
let last: { document: string; read: Read } | undefined;
function read(document: string): Read {
  if (last?.document === document) return last.read;
  const ids = new Map<string, number>();
  for (const id of document.matchAll(/\sid=["']([^"']*)["']/g)) {
    const start = document.lastIndexOf("<", id.index);
    if (!ids.has(id[1]) && start >= 0) ids.set(id[1], start);
  }
  const padded: Read["padded"] = [];
  for (const m of document.matchAll(/\sclass=["'][^"']*\bv-container-padding-padding\b/g)) padded.push({ at: m.index, start: document.lastIndexOf("<", m.index) });
  const ends = new Map<number, number>();
  const open = new Map<string, number[]>();
  for (const tag of document.matchAll(/<(\/?)([a-zA-Z][\w:-]*)(?=[\s>/])/g)) {
    const name = tag[2].toLowerCase();
    const stack = open.get(name) ?? open.set(name, []).get(name)!;
    if (!tag[1]) stack.push(tag.index);
    else if (stack.length) ends.set(stack.pop()!, tag.index);
  }
  last = { document, read: { ids, padded, ends } };
  return last.read;
}

/** The element that starts at `start` (a `<tag …>`), as [its inner HTML's start, its inner HTML's end, its end]. */
function elementAt(html: string, start: number, ends: Map<number, number>): [number, number, number] | undefined {
  const name = /<([a-zA-Z][\w:-]*)/y;
  name.lastIndex = start;
  const found = name.exec(html)?.[1];
  const openEnd = html.indexOf(">", start);
  if (!found || openEnd < 0) return undefined;
  if (VOID.test(found) || html[openEnd - 1] === "/") return [openEnd + 1, openEnd + 1, openEnd + 1];
  const end = ends.get(start);
  return end === undefined ? undefined : [openEnd + 1, end, html.indexOf(">", end) + 1];
}

/**
 * A block's own HTML in a document the editor exported (`exportHtml`): what's inside its padding, found by its
 * `_meta.htmlID`. Undefined when the document doesn't have it.
 */
export function blockHtml(document: string | undefined, htmlID: unknown): string | undefined {
  if (!document || typeof htmlID !== "string" || !htmlID) return undefined;
  const { ids, padded, ends } = read(document);
  const start = ids.get(htmlID);
  const block = start === undefined ? undefined : elementAt(document, start, ends);
  if (!block) return undefined;
  const [from, to] = block;
  // The editor wraps a block's HTML in an element with its padding (`v-container-padding-padding`): the first in it.
  let low = 0;
  let high = padded.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    if (padded[middle].at < from) low = middle + 1;
    else high = middle;
  }
  const first = padded[low];
  const inner = first && first.at < to && first.start >= from ? elementAt(document, first.start, ends) : undefined;
  const html = (inner ? document.slice(inner[0], inner[1]) : document.slice(from, to)).trim();
  return html || undefined;
}
