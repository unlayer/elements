/**
 * What the email components get: one props object per node, with
 * what every component needs worked out (its styles, its phone text styles, its
 * text), and `render()` for its children, so components don't import each
 * other.
 */
import type { Json, ResolvedNode } from "@unlayer-internal/elements-core";
import type { Html } from "../jsx";
import type { Declarations } from "../shared/css";

export interface EmailOptions {
  /** How a merge tag is written (default `{{name}}`): into the HTML as it is, the name in it escaped. */
  mergeTag?: (name: string) => string;
  /** What every class name in the stylesheet starts with (default "e"). */
  classPrefix?: string;
  /** The window's width in px at and below which what's hidden on phones is (default: where its phone styles start). */
  hideBelow?: number;
}

export interface Props {
  node: ResolvedNode;
  /** Its styles, its component's defaults included. */
  style: Record<string, Json>;
  /** Its own phone styles (empty where it has none). */
  mobile: Record<string, Json>;
  parent: ResolvedNode;
  /** Its cell is exactly its width (a Row's child), so it fills it rather than placing itself. */
  fill: boolean;
  /** Inside text. */
  inline: boolean;
  /** The phone text styles of its text: its own, and its parents' where it doesn't set them itself (a run inside text: its own only, as CSS carries the text's to it). */
  phoneText: Declarations;
  /** Its text, and the runs in it. */
  text(): Html;
  /** Writes a child: a block (with `fill` where its cell is exactly its width), or with `inline`, a run inside text. */
  render(child: ResolvedNode, how?: { fill?: boolean; inline?: boolean }): Html;
  options: EmailOptions;
}

/** A component's markup in this output, from its props. */
export type Component = (props: Props) => Html;

export const isNode = (child: ResolvedNode | string): child is ResolvedNode => typeof child !== "string";
export const shown = (node: ResolvedNode) => !(node.hidden?.mobile && node.hidden?.desktop);
