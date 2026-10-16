/**
 * A walk's output: strings, and where it isn't settled yet or can fail, parts that say so. A hole is what a component
 * that suspended renders once its promise settles (the walk goes on with its siblings meanwhile, so their promises
 * start at once); a boundary is a part of the template that's left out when it fails (`onError: "omit"`); an error is
 * where one failed. Flattening reads them in tree order, whenever they settle: so the output, the order of the
 * records (the marks, numbered here) and the error a render throws are the same whatever settles first.
 */
import type { RenderError } from "./errors";
import type { Edge } from "./marks";

export interface MarkPart {
  t: "mark";
  record: object;
  edge?: Edge;
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
export type Part = string | MarkPart | Hole | BoundaryPart | ErrorPart;

export const PENDING = Symbol("pending");

export interface Flat {
  html: string;
  /** The records the marks stand for, numbered by where they are. */
  recorded: object[];
  /** The parts left out (`onError: "omit"`), in tree order. */
  omitted: RenderError[];
}

type Item = string | MarkPart;

/** Parts in tree order as strings and marks; the first error that isn't left out, or PENDING before an unsettled hole. */
function resolve(parts: Part[], items: Item[], omitted: RenderError[], omit: boolean): ErrorPart | typeof PENDING | undefined {
  for (const part of parts) {
    if (typeof part === "string" || part.t === "mark") items.push(part);
    else if (part.t === "error") return part;
    else if (part.t === "hole") {
      if (!part.settled) return PENDING;
      const stop = resolve(part.parts, items, omitted, omit);
      if (stop) return stop;
    } else {
      const own: Item[] = [];
      const inner: RenderError[] = [];
      const stop = resolve(part.parts, own, inner, omit);
      if (stop === PENDING) return PENDING;
      if (stop) {
        // Left out whole: what it recorded too (its head tags, its scopes).
        if (omit && !stop.fatal) omitted.push(stop.error);
        else return stop;
      } else {
        for (const item of own) items.push(item);
        for (const error of inner) omitted.push(error);
      }
    }
  }
  return undefined;
}

/** The output as HTML, its marks numbered in tree order (`nonce` in each); PENDING while a hole before any error is open. */
export function flatten(parts: Part[], nonce: string, omit: boolean): Flat | typeof PENDING {
  const items: Item[] = [];
  const omitted: RenderError[] = [];
  const stop = resolve(parts, items, omitted, omit);
  if (stop === PENDING) return PENDING;
  if (stop) throw stop.error;
  const recorded: object[] = [];
  const index = new Map<object, number>();
  let html = "";
  for (const item of items) {
    if (typeof item === "string") {
      html += item;
      continue;
    }
    let at = index.get(item.record);
    if (at === undefined) index.set(item.record, (at = recorded.push(item.record) - 1));
    // (A record that writes nothing, as a <Head>'s, is numbered where it is.)
    if (item.edge !== "h") html += `<unlayer-mark data-n="${nonce}" data-i="${at}"${item.edge ? ` data-e="${item.edge}"` : ""}></unlayer-mark>`;
  }
  return { html, recorded, omitted };
}
