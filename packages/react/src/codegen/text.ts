/** Text in a design: what can be written as JSX children, and a block's HTML taken from an exported document. */
import { tags, type Tag } from "../utils/html-tags";

/**
 * The text of `html` when it can be JSX children that render back to exactly it: words apart by single spaces, with
 * nothing React escapes (`&`, `<`, `>`, quotes) and no braces. Otherwise undefined (the HTML goes in a prop).
 */
export function plainText(html: unknown): string | undefined {
  if (typeof html !== "string" || !html) return undefined;
  return /^[^\s&<>"'{}]+(?: [^\s&<>"'{}]+)*$/.test(html) ? html : undefined;
}

const VOID = /^(area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)$/i;
/** The class the editor's wrapper of a block's HTML has (see blockHtml), as a class attribute's names are split. */
const PADDED = /(?:^|[\t\n\f\r ])v-container-padding-padding(?:[\t\n\f\r ]|$)/;

/**
 * A document read once (see blockHtml), its tags as a browser reads them (a tag in a comment, a script or an
 * attribute's value is text): each start tag by where it begins, where each id's begins (its first), where each that
 * holds the padding class does (in order), and each element's end tag by its start (the end tag of its name that brings
 * its name's depth back to it, as an element's end is read here, whatever's between). Looking each block up from the
 * document's start (and reading to its end for an element that has no end tag, or back to its `<` for each id) took
 * time growing with the number of blocks squared.
 */
interface Read {
  starts: Map<number, Tag>;
  ids: Map<string, number>;
  padded: number[];
  ends: Map<number, [number, number]>;
}
let last: { document: string; read: Read } | undefined;
function read(document: string): Read {
  if (last?.document === document) return last.read;
  const starts = new Map<number, Tag>();
  const ids = new Map<string, number>();
  const padded: number[] = [];
  const ends = new Map<number, [number, number]>();
  const open = new Map<string, number[]>();
  tags(document, (tag, lt) => {
    const stack = open.get(tag.name) ?? open.set(tag.name, []).get(tag.name)!;
    if (tag.close) {
      if (stack.length) ends.set(stack.pop()!, [lt, tag.end]);
      return;
    }
    starts.set(lt, tag);
    stack.push(lt);
    // (An attribute given twice is its first, as a browser reads it.)
    const id = tag.attributes.find((a) => a.name === "id")?.value;
    if (id !== undefined && !ids.has(id)) ids.set(id, lt);
    if (PADDED.test(tag.attributes.find((a) => a.name === "class")?.value ?? "")) padded.push(lt);
  });
  last = { document, read: { starts, ids, padded, ends } };
  return last.read;
}

/** The element that starts at `start` (a `<tag …>`), as [its inner HTML's start, its inner HTML's end, its end]. */
function elementAt(start: number, { starts, ends }: Read): [number, number, number] | undefined {
  const tag = starts.get(start);
  if (!tag) return undefined;
  if (VOID.test(tag.name) || tag.selfClosing) return [tag.end, tag.end, tag.end];
  const end = ends.get(start);
  return end && [tag.end, end[0], end[1]];
}

/**
 * A block's own HTML in a document the editor exported (`exportHtml`): what's inside its padding, found by its
 * `_meta.htmlID`. Undefined when the document doesn't have it.
 */
export function blockHtml(document: string | undefined, htmlID: unknown): string | undefined {
  if (!document || typeof htmlID !== "string" || !htmlID) return undefined;
  const found = read(document);
  const start = found.ids.get(htmlID);
  const block = start === undefined ? undefined : elementAt(start, found);
  if (!block) return undefined;
  const [from, to] = block;
  // The editor wraps a block's HTML in an element with its padding (`v-container-padding-padding`): the first in it.
  const { padded } = found;
  let low = 0;
  let high = padded.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    if (padded[middle] < from) low = middle + 1;
    else high = middle;
  }
  const first = padded[low];
  const inner = first !== undefined && first < to ? elementAt(first, found) : undefined;
  const html = (inner ? document.slice(inner[0], inner[1]) : document.slice(from, to)).trim();
  return html || undefined;
}
