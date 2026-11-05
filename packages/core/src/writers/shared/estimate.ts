/**
 * Sizes estimated where text isn't measured yet (RFC 0002): a character's width from its font size, a little under
 * most Latin text's, so text is never thought longer than it is, and only what looks clearly too big is said.
 */
import { horizontalFrame, type ResolvedNode } from "../../resolve";

/** A character's average width, in ems. */
export const CHARACTER = 0.45;

/** The characters a node's text runs hold. */
export const characters = (node: ResolvedNode): number =>
  node.children.reduce((sum: number, child) => sum + (typeof child === "string" ? child.length : child.type === "MergeTag" ? String(child.props.name ?? "").length + 4 : characters(child)), 0);

/** A node's width on one line: its own where it's known, else its text's (an image's in it), its padding and border. */
function widthOf(node: ResolvedNode): number {
  if (node.width !== null) return node.width;
  const images = node.children.reduce((sum: number, child) => sum + (typeof child !== "string" && child.type === "Image" && child.width !== null ? child.width : 0), 0);
  return characters(node) * node.text.fontSize * CHARACTER + images + horizontalFrame(node.style);
}

/** The width a Row's children shown on desktop take side by side, with its gaps between them, estimated. */
export function oneLineWidth(row: ResolvedNode): number {
  const children = row.children.filter((child): child is ResolvedNode => typeof child !== "string" && !child.hidden?.desktop);
  const gap = typeof row.style.gap === "number" ? row.style.gap : 0;
  return children.reduce((sum, child) => sum + widthOf(child), 0) + gap * Math.max(0, children.length - 1);
}

/** A Row that wraps (a Menu) whose children look wider than it on one line: where it can't wrap, they don't fit. */
export function wrapsPastIts(row: ResolvedNode): number | null {
  if (row.type !== "Row" || row.style.flexWrap !== "wrap" || row.contentWidth === null) return null;
  const width = oneLineWidth(row);
  return width > row.contentWidth + 0.5 ? Math.round(width) : null;
}
