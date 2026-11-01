/**
 * What the page components get: one props object per node, with
 * where its parent's layout places it, its classes, and its children
 * written, so components don't import each other.
 */
import type { Json, ResolvedNode } from "@unlayer-internal/elements-core";
import type { Html } from "../jsx";
import type { Declarations } from "../shared/css";

export interface PageOptions {
  /** How a merge tag is written (default `{{name}}`). */
  mergeTag?: (name: string) => string;
  /** What every class name in the stylesheet starts with (default "e"), for HTML embedded where other CSS is. */
  classPrefix?: string;
}

export interface Props {
  node: ResolvedNode;
  /** Its styles, its component's defaults included. */
  style: Record<string, Json>;
  parent: ResolvedNode;
  /** What its parent's layout adds to its style: a Row's flex, a stack's `align-self`. */
  placement: Declarations;
  /** Its classes: its phone styles, hiding, hover, a Row's stacking on phones. */
  classes(): string | undefined;
  /** Its children: its text and the runs in it, or the nodes it lays out. */
  children(): Html;
  /** Writes a child with what this node's layout adds to it. */
  render(child: ResolvedNode, placement: Declarations): Html;
  options: PageOptions;
}

/** A component's markup in this output, from its props. */
export type Component = (props: Props) => Html;

export const isNode = (child: ResolvedNode | string): child is ResolvedNode => typeof child !== "string";
