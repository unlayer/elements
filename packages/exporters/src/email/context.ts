/**
 * What the email writer's components share: the render's state, where a node
 * is being written, and how a child is written (through `context.render`, so
 * components don't import each other).
 */
import type { Diagnostics, Json, ResolvedNode } from "@unlayer-internal/elements-core";
import type { Html } from "../jsx";
import type { Stylesheet } from "../shared/classes";

export interface EmailOptions {
  /** How a merge tag is written (default `{{name}}`). */
  mergeTag?: (name: string) => string;
  /** What every class name in the stylesheet starts with (default "e"). */
  classPrefix?: string;
}

/** Text styles a phone override changes, inherited down to the text that doesn't set them itself. */
export type MobileText = Record<string, Json>;

/** Where a node is written. */
export interface Place {
  parent: ResolvedNode;
  /** Its cell is exactly its width (a Row's child), so it fills it rather than placing itself. */
  fill: boolean;
  /** The phone text styles its parents set, for the text in it. */
  mobile: MobileText;
  /** Inside text. */
  inline: boolean;
}

export interface Context {
  options: EmailOptions;
  sheet: Stylesheet;
  d: Diagnostics;
  /** Writes a child: a block (`place.inline` false) or a run of text. */
  render(node: ResolvedNode, place: Place): Html;
}

/** One component's writer. */
export type Writer = (node: ResolvedNode, place: Place, context: Context) => Html;

export const isNode = (child: ResolvedNode | string): child is ResolvedNode => typeof child !== "string";
export const shown = (node: ResolvedNode) => !(node.hidden?.mobile && node.hidden?.desktop);

/** A child written inside text. */
export const inText = (parent: ResolvedNode): Place => ({ parent, fill: false, mobile: {}, inline: true });
