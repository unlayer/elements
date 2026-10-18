/**
 * What a collecting walk's collector gives the walker to walk in place of an element it records (see
 * utils/record.tsx): a record, whose children (a Row's Columns, a rich text block's markup) are walked inside it, or
 * which writes nothing (`quiet`: a <Head>'s entry, whose children are its own content, its tags); and a boundary around
 * a component of the template's own, the part left out when it fails (`onError: "omit"`).
 *
 * They're the walker's own nodes, never React's: what's walked inside a record is that record's content in the walk's
 * output (output.ts), so the template comes out as a tree of its records, its markup and its text.
 */
import type React from "react";

const NODE = Symbol("@unlayer/react-elements/record");

export interface RecordNode {
  $$typeof: typeof NODE;
  record: object;
  children?: React.ReactNode;
  quiet?: boolean;
}

export interface BoundaryNode {
  $$typeof: typeof NODE;
  /** Its record (a component's), whose content is what it renders; null for markup, which isn't recorded. */
  boundary: object | null;
  child: React.ReactNode;
}

/** (Typed as React's nodes: they're walked where React's are, and only by the walker.) */
export const recordNode = (record: object, children?: React.ReactNode, quiet?: boolean): React.ReactElement => ({ $$typeof: NODE, record, children, quiet }) as unknown as React.ReactElement;
export const boundary = (record: object | null, child: React.ReactNode): React.ReactElement => ({ $$typeof: NODE, boundary: record, child }) as unknown as React.ReactElement;

export const isWalkerNode = (node: any): node is RecordNode | BoundaryNode => node?.$$typeof === NODE;
