/**
 * What the page writer's components share: the render's state, and how a
 * child is written (through `context.render`, so components don't import
 * each other).
 */
import type { ResolvedNode } from "@unlayer-internal/elements-core";
import type { Stylesheet } from "../shared/classes";
import type { Html } from "../jsx";
import type { Declarations } from "../shared/css";

export interface PageOptions {
  /** How a merge tag is written (default `{{name}}`). */
  mergeTag?: (name: string) => string;
  /** What every class name in the stylesheet starts with (default "e"), for HTML embedded where other CSS is. */
  classPrefix?: string;
}

export interface Context {
  options: PageOptions;
  sheet: Stylesheet;
  /** Writes a child; `placement` is what its parent's layout adds (a Row's flex, a stack's align-self). */
  render(node: ResolvedNode, parent: ResolvedNode, placement: Declarations): Html;
}

/** One component's writer. */
export type Writer = (node: ResolvedNode, parent: ResolvedNode, context: Context, placement: Declarations) => Html;

export const isNode = (child: ResolvedNode | string): child is ResolvedNode => typeof child !== "string";
