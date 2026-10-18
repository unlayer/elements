/**
 * A walk's output: text (escaped, as written), markup, records, and where it isn't settled yet or can fail, parts that
 * say so. A hole is what a component that suspended renders once its promise settles (the walk goes on with its
 * siblings meanwhile, so their promises start at once); a boundary is a part of the template that's left out when it
 * fails (`onError: "omit"`); an error is where one failed. Flattening reads them in tree order, whenever they settle:
 * so the content, the order of the records and the error a render throws are the same whatever settles first.
 *
 * A collecting walk's flattened output is the template's content as a tree (`Item`): its text, the markup it wrote
 * whole, the markup a record is in (`<p>Hello <Name /></p>`: "cut" by it), and its records with what's inside them.
 */
import type { RenderError } from "./errors";

export interface HostPart {
  t: "host";
  tag: string;
  /** Its start and end tags, as written (no end tag for a void element). */
  open: string;
  close: string;
  parts: Part[];
}
export interface RecordPart {
  t: "record";
  record: object;
  parts: Part[];
  /** It writes nothing: in the records, not in the content; what's inside it is its record's own (`content`: a <Head>'s tags). */
  quiet?: boolean;
}
export interface Hole {
  t: "hole";
  parts: Part[];
  settled: boolean;
}
export interface BoundaryPart {
  t: "boundary";
  parts: Part[];
}
export interface ErrorPart {
  t: "error";
  error: RenderError;
  /** A template that isn't one (an undefined component, an object as a child): never left out. */
  fatal: boolean;
}
export type Part = string | HostPart | RecordPart | Hole | BoundaryPart | ErrorPart;

/** Markup written whole: no record in it. `inner` is what's between its tags (none for a void element). */
export interface Markup {
  kind: "markup";
  tag: string;
  html: string;
  inner?: string;
}
/** Markup a record is in, so it's cut where the record is. */
export interface Cut {
  kind: "cut";
  tag: string;
  open: string;
  close: string;
  items: Item[];
}
export interface RecordItem {
  kind: "record";
  record: object;
  items: Item[];
}
/** The content: text (a string, escaped as written), markup, and records. */
export type Item = string | Markup | Cut | RecordItem;

export const PENDING = Symbol("pending");

export interface Flat {
  content: Item[];
  /** The records, in tree order (quiet ones too). */
  recorded: object[];
  /** The parts left out (`onError: "omit"`), in tree order. */
  omitted: RenderError[];
}

/** The HTML of content. */
export function htmlOf(items: readonly Item[]): string {
  let html = "";
  for (const item of items) html += typeof item === "string" ? item : item.kind === "markup" ? item.html : item.kind === "cut" ? item.open + htmlOf(item.items) + item.close : htmlOf(item.items);
  return html;
}

/** Content added to `into`, text joined to the text before it, as it's written. */
function add(into: Item[], item: Item): void {
  const last = into.length - 1;
  if (typeof item === "string" && typeof into[last] === "string") into[last] += item;
  else into.push(item);
}

/** Where a resolution's records and left-out parts go (a boundary's own, until it's resolved), and the policy. */
interface Found {
  recorded: object[];
  omitted: RenderError[];
  omit: boolean;
}

/** Parts in tree order as content; the first error that isn't left out, or PENDING before an unsettled hole. */
function resolve(parts: Part[], into: Item[], found: Found): ErrorPart | typeof PENDING | undefined {
  for (const part of parts) {
    if (typeof part === "string") {
      if (part) add(into, part);
      continue;
    }
    switch (part.t) {
      case "host": {
        const inside: Item[] = [];
        const stop = resolve(part.parts, inside, found);
        if (stop) return stop;
        if (inside.every((item) => typeof item === "string" || item.kind === "markup")) {
          const inner = htmlOf(inside);
          into.push({ kind: "markup", tag: part.tag, html: part.open + inner + part.close, inner: part.close ? inner : undefined });
        } else into.push({ kind: "cut", tag: part.tag, open: part.open, close: part.close, items: inside });
        break;
      }
      case "record": {
        found.recorded.push(part.record);
        const inside: Item[] = [];
        const stop = resolve(part.parts, inside, found);
        if (stop) return stop;
        if (!part.quiet) into.push({ kind: "record", record: part.record, items: inside });
        else (part.record as { content?: Item[] }).content = inside;
        break;
      }
      case "hole": {
        if (!part.settled) return PENDING;
        const stop = resolve(part.parts, into, found);
        if (stop) return stop;
        break;
      }
      case "boundary": {
        const own: Item[] = [];
        const ownFound: Found = { recorded: [], omitted: [], omit: found.omit };
        const stop = resolve(part.parts, own, ownFound);
        if (stop === PENDING) return PENDING;
        if (stop) {
          // Left out whole: what it recorded too (its head tags, its scopes).
          if (found.omit && !stop.fatal) found.omitted.push(stop.error);
          else return stop;
        } else {
          for (const item of own) add(into, item);
          for (const record of ownFound.recorded) found.recorded.push(record);
          for (const error of ownFound.omitted) found.omitted.push(error);
        }
        break;
      }
      default:
        return part;
    }
  }
  return undefined;
}

/** The output as content, its records in tree order; PENDING while a hole before any error is open. */
export function flatten(parts: Part[], omit: boolean): Flat | typeof PENDING {
  const content: Item[] = [];
  const found: Found = { recorded: [], omitted: [], omit };
  const stop = resolve(parts, content, found);
  if (stop === PENDING) return PENDING;
  if (stop) throw stop.error;
  return { content, recorded: found.recorded, omitted: found.omitted };
}
