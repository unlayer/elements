/**
 * Page layout: flexbox. Where a child sits in a stack or a Row, a box's
 * styles, and a stack's own.
 */
import type { ResolvedNode } from "@unlayer-internal/elements-core";
import type { Style } from "../jsx";
import { length, type Declarations } from "../shared/css";

export const FLEX_ALIGN: Record<string, string> = { start: "flex-start", center: "center", end: "flex-end", stretch: "stretch" };
const TEXT_ALIGN: Record<string, string> = { left: "flex-start", justify: "flex-start", center: "center", right: "flex-end" };
export const JUSTIFY: Record<string, string> = { start: "flex-start", center: "center", end: "flex-end", "space-between": "space-between" };

/**
 * Where a child sits across a stack (root, Section, Column): one that fills
 * the width (a Text, a Row) fills it; one with its own size (a Button, an
 * Image, a box with a width) sits where the stack's `align` says, else where
 * its text alignment says, as in email.
 */
export function alignSelf(child: ResolvedNode, stack: ResolvedNode): Declarations {
  if (child.type === "Divider") return [];
  const sized = child.style.width !== undefined || child.style.maxWidth !== undefined;
  if (child.definition.sizing !== "shrink" && !sized) return [];
  const align = (child.style.alignSelf ?? stack.style.alignItems) as string | undefined;
  if (align === "stretch") return [];
  // A box that fills the width up to a maximum still fills it: placed, not shrunk to its content.
  const fill: Declarations = child.definition.sizing === "stretch" && child.style.width === undefined ? [["width", "100%"]] : [];
  const place = align ? FLEX_ALIGN[align] : TEXT_ALIGN[stack.text.textAlign];
  // With its padding on top of its width, or at its file's width, it may be wider than its place: it runs past the end, as a line of text does.
  const safe: Declarations = (child.style.boxSizing === "content-box" || child.compat?.ownWidth) && place !== "flex-start" ? [["align-self", `safe ${place}`]] : [];
  return [["align-self", place], ...safe, ...fill];
}

/**
 * A Layer's child: in its one cell, over the ones before it. One that fills the width (a Column, a Text) fills it, as
 * in a stack and in email; the Layer's justifyItems places those with their own size.
 */
export function layerPlacement(child: ResolvedNode): Declarations {
  const sized = child.style.width !== undefined || child.style.maxWidth !== undefined;
  const fills = child.definition.sizing === "stretch" && !sized;
  return [["grid-area", "1 / 1"], ["min-width", "0"], ...(fills ? ([["justify-self", "stretch"]] as Declarations) : [])];
}

/** A Row's child: its width as a flex basis, or its share of what's left. */
export function rowPlacement(child: ResolvedNode, row: ResolvedNode): Declarations {
  const out: Declarations = [];
  const width = length(child.style.width);
  if (width !== undefined) out.push(["flex", `0 1 ${width}`]);
  else if (child.style.flex === "none" || child.style.flex === 0) out.push(["flex", "0 0 auto"]);
  else out.push(["flex", `${typeof child.style.flex === "number" ? child.style.flex : 1} 1 0%`]);
  if (child.style.minWidth === undefined) out.push(["min-width", "0"]);
  // Content with its own size keeps it, not the Row's height.
  if (child.definition.sizing === "shrink" && child.type !== "Link") out.push(["align-self", FLEX_ALIGN[(row.style.alignItems as string) ?? "start"]]);
  return out;
}

/** A box's styles; `withWidth` false where its parent's layout sets its width (in a Row). */
export function box(node: ResolvedNode, withWidth = true): Style {
  const { style } = node;
  const framed = style.padding !== undefined || style.border !== undefined;
  return {
    boxSizing: framed || (withWidth && style.width !== undefined) ? "border-box" : undefined,
    width: withWidth ? style.width : undefined,
    minWidth: style.minWidth,
    maxWidth: style.maxWidth,
    height: style.height,
    padding: style.padding,
    backgroundColor: style.backgroundColor,
    border: style.border,
    borderRadius: style.borderRadius,
    overflow: style.overflow === "hidden" ? "hidden" : undefined,
    // (A page break of today's components, in a printed document.)
    breakAfter: node.compat?.breakAfter === "page" ? "page" : undefined,
    pageBreakAfter: node.compat?.breakAfter === "page" ? "always" : undefined,
  };
}

/** A stack's own styles: a flex column with its gap. */
export function stackOf(node: ResolvedNode): Style {
  return {
    display: "flex",
    flexDirection: "column",
    gap: node.style.gap,
    justifyContent: node.style.justifyContent ? JUSTIFY[node.style.justifyContent as string] : undefined,
  };
}
