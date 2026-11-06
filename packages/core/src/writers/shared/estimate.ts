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

/** A node's width on one line: its own where it's known, else its text's (an image's in it), its padding and border. With `phone`, a phone's width of that much room. */
function widthOf(node: ResolvedNode, phone?: number): number {
  const own = phone === undefined ? undefined : node.mobile?.width;
  if (typeof own === "number") return own;
  if (typeof own === "string") return (Number.parseFloat(own) / 100) * phone!;
  if (node.width !== null) return node.width;
  const images = node.children.reduce((sum: number, child) => sum + (typeof child !== "string" && child.type === "Image" && child.width !== null ? child.width : 0), 0);
  return characters(node) * node.text.fontSize * CHARACTER + images + horizontalFrame(node.style);
}

/** The width a Row's children shown on desktop take side by side, with its gaps between them, estimated. With `phone`, those shown on a phone with that much room. */
export function oneLineWidth(row: ResolvedNode, phone?: number): number {
  const children = row.children.filter((child): child is ResolvedNode => typeof child !== "string" && !(phone === undefined ? child.hidden?.desktop : child.hidden?.mobile));
  const gap = gapOf(row, phone !== undefined);
  return children.reduce((sum, child) => sum + widthOf(child, phone), 0) + gap * Math.max(0, children.length - 1);
}

const gapOf = (row: ResolvedNode, phone: boolean) => (phone && typeof row.mobile?.gap === "number" ? row.mobile.gap : typeof row.style.gap === "number" ? row.style.gap : 0);

/** A Row that wraps (a Menu) whose children look wider than it on one line: where it can't wrap, they don't fit. */
export function wrapsPastIts(row: ResolvedNode): number | null {
  if (row.type !== "Row" || row.style.flexWrap !== "wrap" || row.contentWidth === null) return null;
  const width = oneLineWidth(row);
  return width > row.contentWidth + 0.5 ? Math.round(width) : null;
}

/** Where a Row kept side by side that wraps looks too wide for one line (at a small phone's width on phones), with a gap to keep between its lines. */
export function wrapsWithGap(row: ResolvedNode): "desktop" | "phones" | "desktop and phones" | null {
  if (row.props.stackOnMobile !== false || (row.style.flexWrap !== "wrap" && row.style.flexWrap !== "words") || row.contentWidth === null) return null;
  const room = Math.min(row.contentWidth, 320);
  const desktop = !row.hidden?.desktop && gapOf(row, false) > 0 && oneLineWidth(row) > row.contentWidth + 0.5;
  const phones = !row.hidden?.mobile && gapOf(row, true) > 0 && oneLineWidth(row, room) > room + 0.5;
  return desktop && phones ? "desktop and phones" : desktop ? "desktop" : phones ? "phones" : null;
}
