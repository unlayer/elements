/**
 * A collected template's content (the walker's: see src/engine/output.ts), read: its text as React wrote it and as
 * it reads, the markup a component of the template's own rendered, and markup cut by what's recorded in it.
 */
import { htmlOf, type Item, type Markup, type RecordItem } from "../engine";
import type { Recorded } from "../utils/collect";

export { htmlOf };

const ENTITIES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#x27;": "'" };

/** Text as it reads: what React escaped (or markup given as HTML spelled), unescaped. */
export const textOf = (html: string): string => html.replace(/&amp;|&lt;|&gt;|&quot;|&#x27;/g, (e) => ENTITIES[e]);

/** An item's record, typed. */
export const recordOf = (item: RecordItem) => item.record as Recorded & Record<string, any>;

/** What's in a scope or a component of the template's own: their content is where they are. */
export const transparent = (item: Item): item is RecordItem => typeof item !== "string" && item.kind === "record" && (recordOf(item).kind === "boundary" || recordOf(item).kind === "tailwind");

/** An element of markup at the top of some content: its tag, its HTML, and what's between its tags. */
export interface Part {
  tag: string;
  html: string;
  inner?: string;
}

/** Content that's markup only (its components' markup in, those that failed left out): its text and top elements. */
export function partsOf(items: readonly Item[], out: Array<string | Part> = []): Array<string | Part> {
  for (const item of items) {
    if (typeof item === "string") {
      if (typeof out[out.length - 1] === "string") out[out.length - 1] += item;
      else out.push(item);
    } else if (item.kind === "markup") out.push(item);
    else if (item.kind === "cut") out.push({ tag: item.tag, html: htmlOf([item]), inner: htmlOf(item.items) });
    else partsOf(item.items, out);
  }
  return out;
}

/** What content renders when it's markup only, as HTML (undefined when a Row, Column or block is in it). */
export const markupOnly = (items: readonly Item[]): string | undefined => (items.every(onlyMarkup) ? htmlOf(items) : undefined);

const onlyMarkup = (item: Item): boolean => typeof item === "string" || item.kind === "markup" || ((item.kind === "cut" || transparent(item)) && item.items.every(onlyMarkup));

/** Whether content has markup in it, at its top. */
export const hasMarkup = (items: readonly Item[]): boolean => items.some((item) => typeof item !== "string" && item.kind !== "record");

/** A piece of markup between records: text, markup written whole, and the tags of markup a record cuts. */
export type Token = string | Markup | { open: string } | { close: true };

/**
 * Content as it's written, cut where it's recorded in: the records in it (not what's in them), and the runs of markup
 * and text between them. React writes markup whole, so markup a record is in (a `<div>` around a block, a `<p>`
 * around a component) starts in one run and ends in another.
 */
export function runs(items: readonly Item[], out: Array<RecordItem | Token[]> = []): Array<RecordItem | Token[]> {
  const token = (t: Token) => {
    const run = out[out.length - 1];
    if (!Array.isArray(run)) out.push([t]);
    else if (typeof t === "string" && typeof run[run.length - 1] === "string") run[run.length - 1] += t;
    else run.push(t);
  };
  for (const item of items) {
    if (typeof item === "string" || item.kind === "markup") token(item);
    else if (item.kind === "record") out.push(item);
    else {
      token({ open: item.tag });
      runs(item.items, out);
      if (item.close) token({ close: true });
    }
  }
  return out;
}

/** The tag a run starts with (none where it starts with text or an end tag). */
export const startOf = (run: Token[]): string | undefined => {
  const first = run[0];
  return typeof first === "string" || "close" in first ? undefined : "open" in first ? first.open : first.tag;
};
