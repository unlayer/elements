/**
 * What a collecting walk's records give the walker to walk in their place: a mark where a recorded Row, Column, block
 * or scope starts and ends ("o", "c"), stands ("block"), or where a record writes nothing ("h", a <Head>'s), and a
 * boundary around a component of the template's own, where a part that fails is left out (`onError: "omit"`).
 *
 * They're the walker's own nodes, never React's: it writes a mark as the marker normalize.tsx parses, numbered in tree
 * order once everything has rendered (see output.ts), so the records' order doesn't depend on when promises settle.
 */
import type React from "react";

const MARK = Symbol("@unlayer/react-elements/mark");

export type Edge = "o" | "c" | "h";

export interface MarkNode {
  $$typeof: typeof MARK;
  record: object;
  edge?: Edge;
}

export interface BoundaryNode {
  $$typeof: typeof MARK;
  /** Its record (a component's), whose start and end are marked; null for markup, which isn't marked. */
  boundary: object | null;
  child: React.ReactNode;
}

/** (Typed as React's nodes: they're walked where React's are, and only by the walker.) */
export const mark = (record: object, edge?: Edge): React.ReactElement => ({ $$typeof: MARK, record, edge }) as unknown as React.ReactElement;
export const boundary = (record: object | null, child: React.ReactNode): React.ReactElement => ({ $$typeof: MARK, boundary: record, child }) as unknown as React.ReactElement;

export const isMark = (node: any): node is MarkNode | BoundaryNode => node?.$$typeof === MARK;
