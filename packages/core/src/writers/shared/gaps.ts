/**
 * Where a layout's gap goes: between the children that show, on desktop and
 * on phones apart, so a hidden child leaves no gap behind. Every writer of a
 * gap (a Row's spacers, a stack's and a List's padding, a page List's margins,
 * the root's rows) reads it from here.
 */
import type { ResolvedNode } from "../../resolve";

/** Whether a gap goes beside a child on desktop and on phones (`false` where the child, or every child on that side, is hidden there). */
export interface GapAt {
  desktop: boolean;
  phone: boolean;
}

/** What shows where: a node, or a run of them (hidden where all of them are). */
type Shown = Pick<ResolvedNode, "hidden">;

/**
 * Whether each child has a gap before it: where it shows and so does a child
 * before it, on desktop and on phones apart. A hidden child takes no gap, so
 * the gaps add up to what the resolver counts (desktop) and what stacks (phones).
 */
export function gapsBefore(children: readonly Shown[]): GapAt[] {
  let desktop = false;
  let phone = false;
  return children.map((child) => {
    const at = { desktop: desktop && !child.hidden?.desktop, phone: phone && !child.hidden?.mobile };
    desktop ||= !child.hidden?.desktop;
    phone ||= !child.hidden?.mobile;
    return at;
  });
}

/** Whether each child has a gap after it: where it shows and so does a child after it. */
export const gapsAfter = (children: readonly Shown[]): GapAt[] => gapsBefore([...children].reverse()).reverse();

/** A gap's own element: shown where its gap is more than 0 (`desktop` and `phone` are the gap's sizes there), hidden elsewhere. */
export const gapShown = (at: GapAt, desktop: number, phone: number): GapAt => ({ desktop: at.desktop && desktop > 0, phone: at.phone && phone > 0 });

/** The `hidden` of a gap's own element: hidden where there's no gap. */
export const gapHidden = (at: GapAt) => ({ desktop: !at.desktop, mobile: !at.phone });

/** A run of nodes, as one thing that shows or hides: hidden on a side where every one of them is. */
export const runHidden = (nodes: readonly ResolvedNode[]): Shown["hidden"] => ({
  desktop: nodes.every((node) => node.hidden?.desktop),
  mobile: nodes.every((node) => node.hidden?.mobile),
});
