/**
 * What a template keeps in the builder's design JSON, so it comes back as it was: each body, row, column and block
 * carries, in its `values._elements`, the Elements node it was made from and the values it was written with. The
 * builder keeps any key in `values` as it is (it shows no editor for one it doesn't know), through loading, editing,
 * saving and duplicating; a key beside `values` it drops.
 *
 * On the way back, a builder value that differs from the one written was changed in the builder, and wins; the rest
 * of the node (its styles the builder has no editor for yet) comes from `node`.
 */
import type { Json, Node } from "@unlayer-internal/elements-core";

/** The format's version: a later one reads this one. */
export const PAYLOAD_VERSION = 1;

/** Where a template keeps itself in an item's values. */
export const PAYLOAD_KEY = "_elements";

/** A node a row, a column or a run of blocks stands for, without the children the builder holds. */
export interface Group {
  /** The same for every row (or block) of one node: rows of a Section, blocks of a Column. */
  key: string;
  node: Node;
}

export interface Payload {
  v: number;
  /** The node, without its children where the builder holds them (a row's columns, a column's blocks). */
  node?: Node;
  /** The values written, by key: a value that isn't the same now was changed in the builder. */
  w?: Record<string, Json>;
  /** A row: the Section it's part of. */
  sec?: Group;
  /** A row: the Grid it's a row of (its columns its cells). */
  grid?: Group;
  /** A row of blocks directly in the root or a Section (no Row of its own), or its column. */
  run?: true;
  /** A column that is a Row's child that isn't a Column (a block of its own size). */
  direct?: true;
  /** A block: the boxes it's in, in the column it's in, outermost first (a Column in a Column). */
  wrap?: Group[];
  /** A block the builder shows as HTML: it can be moved, not edited. */
  locked?: true;
}

/** Values the builder sets for itself, or rebuilds: not written by a template, so not compared. */
export const BUILDER_OWN = new Set([PAYLOAD_KEY, "_meta", "selectable", "draggable", "duplicatable", "deletable", "hideable", "locked"]);

/** A node without its children (they're the builder's rows, columns or blocks). */
export function bare(node: Node): Node {
  const { children: _children, ...rest } = node;
  return rest;
}

/** The values written, to compare with what the builder has on the way back. */
export function written(values: Record<string, unknown>): Record<string, Json> {
  const out: Record<string, Json> = {};
  for (const [key, value] of Object.entries(values)) if (!BUILDER_OWN.has(key) && value !== undefined) out[key] = value as Json;
  return JSON.parse(JSON.stringify(out));
}
