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

/** The element that starts at `start` (a `<tag …>`), as [its inner HTML's start, its inner HTML's end, its end]. */
function elementAt(html: string, start: number): [number, number, number] | undefined {
  const name = /^<([a-zA-Z][\w:-]*)/.exec(html.slice(start))?.[1];
  const openEnd = html.indexOf(">", start);
  if (!name || openEnd < 0) return undefined;
  if (VOID.test(name) || html[openEnd - 1] === "/") return [openEnd + 1, openEnd + 1, openEnd + 1];
  const tags = new RegExp(`<(/?)${name}(?=[\\s>/])`, "gi");
  tags.lastIndex = openEnd + 1;
  let depth = 1;
  for (let m = tags.exec(html); m; m = tags.exec(html)) {
    depth += m[1] ? -1 : 1;
    if (depth === 0) return [openEnd + 1, m.index, html.indexOf(">", m.index) + 1];
  }
  return undefined;
}

/** Where the start tag that holds `attribute` (searched from `from`) begins. */
function tagWith(html: string, attribute: RegExp, from = 0, to = html.length): number | undefined {
  attribute.lastIndex = from;
  const match = attribute.exec(html);
  if (!match || match.index >= to) return undefined;
  const start = html.lastIndexOf("<", match.index);
  return start >= from ? start : undefined;
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * A block's own HTML in a document the editor exported (`exportHtml`): what's inside its padding, found by its
 * `_meta.htmlID`. Undefined when the document doesn't have it.
 */
export function blockHtml(document: string | undefined, htmlID: unknown): string | undefined {
  if (!document || typeof htmlID !== "string" || !htmlID) return undefined;
  const start = tagWith(document, new RegExp(`\\sid=["']${escapeRegExp(htmlID)}["']`, "g"));
  const block = start === undefined ? undefined : elementAt(document, start);
  if (!block) return undefined;
  const [from, to] = block;
  // The editor wraps a block's HTML in an element with its padding (`v-container-padding-padding`).
  const padded = tagWith(document, /\sclass=["'][^"']*\bv-container-padding-padding\b/g, from, to);
  const inner = padded === undefined ? undefined : elementAt(document, padded);
  const html = (inner ? document.slice(inner[0], inner[1]) : document.slice(from, to)).trim();
  return html || undefined;
}
