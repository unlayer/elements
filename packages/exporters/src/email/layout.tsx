/**
 * Email layout: widths from the resolver as Word reads them (table and cell
 * attributes, px maximums), where a child sits in its cell, `<Box>` (a node's
 * box as a table around its content) and `<Stack>` (children as table rows).
 */
import { toPx, type Json, type ResolvedNode } from "@unlayer-internal/elements-core";
import { h, NotOutlook, withId, type Child, type Html, type Style, type StyleValue } from "../jsx";
import { length } from "../shared/css";
import { isNode, shown, type Props } from "./context";
import { bgcolor, Table } from "./markup";
import { hiding } from "./styles";
import { gapsAfter, type GapAt } from "../shared/gaps";

export const VALIGN: Record<string, string> = { start: "top", center: "middle", end: "bottom", stretch: "top" };
const ALIGN: Record<string, string | undefined> = { start: undefined, center: "center", end: "right", stretch: undefined };
export const TEXT_ALIGN: Record<string, string | undefined> = { left: "left", justify: "left", center: "center", right: "right" };

const sized = (node: ResolvedNode) => node.style.width !== undefined || node.style.maxWidth !== undefined;

export const toNumber = (value: Json) => (typeof value === "number" ? value : Number.parseFloat(String(value)));

/**
 * A box's table: filling its cell (`width` 100%), or its own width as a
 * percentage or a px maximum (fluid on phones; Word takes the maximum as the
 * width), or neither (as wide as its content).
 */
export function boxWidth(node: ResolvedNode, fill: boolean): { width?: string; maxWidth?: number } {
  if (fill || (!sized(node) && node.definition.sizing === "stretch")) return { width: "100%" };
  if (typeof node.style.width === "string" && node.style.width.endsWith("%") && node.style.maxWidth === undefined) return { width: node.style.width };
  if (node.width !== null) return { width: "100%", maxWidth: node.width };
  // As wide as its content, up to its maximum.
  const max = toPx(node.style.maxWidth, node.available);
  return max !== null ? { maxWidth: max } : {};
}

/** A phone width for a table or div: a percentage of its cell, or a px maximum. */
export function phoneWidth(value: Json | undefined): Style {
  const written = length(value);
  if (written === undefined) return {};
  return typeof value === "string" && value.endsWith("%") ? { width: written, maxWidth: "none" } : { width: "100%", maxWidth: written };
}

/**
 * Where a child sits across a stack: one that fills the width fills it; one
 * with its own size (a Button, an Image, a box with a width) sits where the
 * stack's `align` says, else where its text alignment says. As a cell's
 * `align`, which every client (Word too) applies to the tables and images in it.
 */
export function cellAlign(child: ResolvedNode, stack: ResolvedNode): string | undefined {
  if (child.type === "Divider") return TEXT_ALIGN[stack.text.textAlign] === "left" ? undefined : TEXT_ALIGN[stack.text.textAlign];
  if (child.definition.sizing !== "shrink" && !sized(child)) return undefined;
  const align = stack.style.alignItems as string | undefined;
  if (align) return ALIGN[align];
  const text = TEXT_ALIGN[stack.text.textAlign];
  return text === "left" ? undefined : text;
}

/** Whether a node has a box of its own to write: a background, padding, border, corners, a height or a width. */
function hasBox(node: ResolvedNode, fill: boolean): boolean {
  const { style } = node;
  const mobile = node.mobile ?? {};
  const width = boxWidth(node, fill);
  return (
    ["padding", "border", "borderRadius", "backgroundColor", "height"].some((key) => style[key] !== undefined) ||
    ["padding", "border", "backgroundColor", "width", "maxWidth"].some((key) => mobile[key] !== undefined) ||
    width.width !== "100%" ||
    width.maxWidth !== undefined
  );
}

/**
 * A node's box as a one-cell table around its content (Word has no box on a
 * div or a paragraph), with the node's id. Without a box, the content alone,
 * with the id.
 */
export function Box({ node, fill, children }: { node: ResolvedNode; fill: boolean; children?: Child }): Html {
  const content = (Array.isArray(children) ? children[0] : children) as Html;
  if (!hasBox(node, fill)) return withId(content, node.id);
  const { style } = node;
  const mobile = node.mobile ?? {};
  const width = boxWidth(node, fill);
  const height = style.height !== undefined ? toNumber(style.height) : undefined;
  return (
    <Table id={node.id} phone={phoneWidth(mobile.maxWidth ?? mobile.width)} width={width.width} style={{ maxWidth: width.maxWidth }}>
      <tr>
        <td
          phone={{ padding: mobile.padding, border: mobile.border, backgroundColor: mobile.backgroundColor }}
          bgcolor={bgcolor(style.backgroundColor)}
          height={height}
          style={{
            padding: style.padding,
            backgroundColor: style.backgroundColor,
            border: style.border,
            borderRadius: style.borderRadius,
            height,
            overflow: style.overflow === "hidden" ? "hidden" : undefined,
          }}
        >
          {content}
        </td>
      </tr>
    </Table>
  );
}

/**
 * A row's gap below it, for a table of rows with the gap as their cells' bottom padding (a stack, a list):
 * inline where a row after it shows on desktop, and by a class where phones need another (the phone gap, or none).
 */
export function gapBelow(node: ResolvedNode, at: GapAt): { style: Style; phone?: Style } {
  const gap = typeof node.style.gap === "number" ? node.style.gap : 0;
  const phoneGap = typeof node.mobile?.gap === "number" ? node.mobile.gap : gap;
  const desktop = at.desktop ? gap : 0;
  const phone = at.phone ? phoneGap : 0;
  return { style: { paddingBottom: desktop || undefined }, phone: phone !== desktop ? { paddingBottom: phone } : undefined };
}

/** A node's children stacked down a table, one row each, its `gap` as the cells' bottom padding. */
export function Stack({ node, render, style }: { node: ResolvedNode; render: Props["render"]; style?: StyleValue }): Html {
  const children = node.children.filter(isNode).filter(shown);
  const gaps = gapsAfter(children);
  return (
    <Table width="100%" style={style}>
      {children.map((child, index) => {
        const hidden = hiding(child, "table-row");
        const below = gapBelow(node, gaps[index]);
        const row = (
          <tr class={hidden.class} style={hidden.style}>
            <td align={cellAlign(child, node)} phone={below.phone} style={below.style}>
              {render(child)}
            </td>
          </tr>
        );
        // What's hidden on desktop isn't Outlook's at all (Outlook is never a phone).
        return child.hidden?.desktop ? <NotOutlook>{row}</NotOutlook> : row;
      })}
    </Table>
  );
}
