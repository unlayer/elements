/**
 * Email layout: widths from the resolver as Word reads them (table and cell
 * attributes, px maximums), where a child sits in its cell, `<Box>` (a node's
 * box as a table around its content) and `<Stack>` (children as table rows);
 * a Row's gaps and its children's shares on phones; what a Layer draws.
 */
import { assetParts, type Asset } from "../../kinds";
import { toPx, type ResolvedNode } from "../../resolve";
import type { Json } from "../../model";
import { h, NotOutlook, withId, type Child, type Html, type Style, type StyleValue } from "../jsx";
import { length } from "../shared/css";
import { isNode, shown, type Props } from "./context";
import { bgcolor, ownBorders, Table } from "./markup";
import { hiding } from "./styles";
import { gapsAfter, type GapAt } from "../shared/gaps";

export const VALIGN: Record<string, string> = { start: "top", center: "middle", end: "bottom", stretch: "top" };
const ALIGN: Record<string, string | undefined> = { start: undefined, center: "center", end: "right", stretch: undefined };
export const TEXT_ALIGN: Record<string, string | undefined> = { left: "left", justify: "left", center: "center", right: "right" };

const sized = (node: ResolvedNode) => node.style.width !== undefined || node.style.maxWidth !== undefined;

export const toNumber = (value: Json) => (typeof value === "number" ? value : Number.parseFloat(String(value)));

/** A Row's child that takes its own size (`flex: "none"`), whatever its component's sizing. */
const ownSize = (node: ResolvedNode) => node.style.flex === "none" || node.style.flex === 0;

/**
 * A box's table: filling its cell (`width` 100%), or its own width as a
 * percentage or a px maximum (fluid on phones; Word takes the maximum as the
 * width), or neither (as wide as its content: a Row's child of its own size, a Menu's link).
 */
export function boxWidth(node: ResolvedNode, fill: boolean): { width?: string; maxWidth?: number } {
  if (fill || (!sized(node) && node.definition.sizing === "stretch" && !ownSize(node))) return { width: "100%" };
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
 * Left is a cell's own unless its text runs right to left (`rtl`).
 */
export function cellAlign(child: ResolvedNode, stack: ResolvedNode, rtl = false): string | undefined {
  const text = TEXT_ALIGN[stack.text.textAlign];
  const written = text === "left" && !rtl ? undefined : text;
  if (child.type === "Divider") {
    if (stack.style.alignItems && stack.style.alignItems !== "stretch") return ALIGN[stack.style.alignItems as string];
    return written;
  }
  if (child.definition.sizing !== "shrink" && !sized(child)) return undefined;
  const align = (child.style.alignSelf ?? stack.style.alignItems) as string | undefined;
  if (align) return ALIGN[align];
  return written;
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
  // A cell's CSS height leaves out its padding; Word's attribute, and a page's box, hold it.
  const padding = style.padding as { top: number; bottom: number } | undefined;
  const contentHeight = height !== undefined && padding ? Math.max(0, height - padding.top - padding.bottom) : height;
  return (
    <Table id={node.id} phone={phoneWidth(mobile.maxWidth ?? mobile.width)} width={width.width} style={{ maxWidth: width.maxWidth, borderCollapse: ownBorders(style, mobile) }}>
      <tr>
        <td
          phone={{ padding: mobile.padding, border: mobile.border, backgroundColor: mobile.backgroundColor }}
          bgcolor={bgcolor(style.backgroundColor)}
          height={height}
          // What's in a box of its own height starts at its top, as on a page.
          valign={height !== undefined ? "top" : undefined}
          style={{
            padding: style.padding,
            backgroundColor: style.backgroundColor,
            border: style.border,
            borderRadius: style.borderRadius,
            height: contentHeight,
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
export function Stack({ node, rtl, render, style }: { node: ResolvedNode; rtl: boolean; render: Props["render"]; style?: StyleValue }): Html {
  const children = node.children.filter(isNode).filter(shown);
  const gaps = gapsAfter(children);
  return (
    <Table width="100%" style={style}>
      {children.map((child, index) => {
        const hidden = hiding(child, "table-row");
        const below = gapBelow(node, gaps[index]);
        const row = (
          <tr class={hidden.class} style={hidden.style}>
            <td align={cellAlign(child, node, rtl)} phone={below.phone} style={below.style}>
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

export const gapOf = (props: Props) => (typeof props.style.gap === "number" ? props.style.gap : 0);
/** The gap on phones: the Row's phone gap, else its gap. */
export const phoneGapOf = (props: Props) => (typeof props.mobile.gap === "number" ? props.mobile.gap : gapOf(props));
export const valignOf = (props: Props) => VALIGN[(props.style.alignItems as string | undefined) ?? "start"];

/** A child that shares its Row (no width of its own, a flex). */
const sharing = (child: ResolvedNode) => child.width !== null && child.style.width === undefined && child.style.flex !== "none" && child.style.flex !== 0;

/**
 * Each child's width on phones in a side-by-side Row whose children share it: a table shares its width out by its
 * cells' content, flexbox (as on desktop) by their widths. A cell's share is a percentage, and the gaps are the cells'
 * side padding, inside their width (a cell's share of the gaps, split so neighbours leave one gap between them): the
 * shares add up to the whole, which every client's table gives exactly. None where a padding would be negative.
 */
export function phoneShares(children: readonly ResolvedNode[], gap: number): Map<ResolvedNode, Style> | undefined {
  const onPhones = children.filter((child) => !child.hidden?.mobile);
  // Only children that share the Row: one of its own size keeps it, as on the page.
  if (onPhones.length < 2) return undefined;
  // Beside one of its own size, they take what it leaves: a table would shrink it with them.
  if (!onPhones.every(sharing)) {
    const beside = onPhones.filter(sharing);
    return beside.length ? new Map(beside.map((child) => [child, { width: "auto" }])) : undefined;
  }
  const total = onPhones.reduce((sum, child) => sum + child.width!, 0);
  const gaps = gap * (onPhones.length - 1);
  const out = new Map<ResolvedNode, Style>();
  let left = 0;
  for (const [index, child] of onPhones.entries()) {
    const share = child.width! / total;
    const right = index === onPhones.length - 1 ? 0 : share * gaps - left;
    if (left < -0.01 || right < -0.01) return undefined;
    const px = (n: number) => Math.round(n * 100) / 100;
    out.set(child, { width: `${px(share * 100)}%`, paddingLeft: left ? px(left) : undefined, paddingRight: right ? px(right) : undefined, boxSizing: "border-box" });
    left = gap - right;
  }
  return out;
}

/** What an email draws of a Layer: its Image, the child over it and its height; or why it can't. */
export function layerShape(node: ResolvedNode): { base: ResolvedNode; over?: ResolvedNode; height: number } | { problem: string; path: string } {
  const children = node.children.filter(isNode).filter(shown);
  const [base, over] = children;
  if (!base || base.type !== "Image" || children.length > 2) {
    return { problem: `In an email, a Layer is an Image with one child over it (drawn as the image's background); this one has ${children.length > 2 ? `${children.length} children` : base ? `a ${base.type} under` : "no children"}`, path: node.path };
  }
  if (base.width === null || node.contentWidth === null || Math.abs(base.width - node.contentWidth) > 1) {
    return { problem: "In an email, a Layer's Image is as wide as the Layer (it's drawn as its background): give it width 100%", path: `${base.path}.style.width` };
  }
  if (typeof node.style.height === "number") return { base, over, height: node.style.height };
  const { width, height } = assetParts(base.props.src as Asset);
  if (!width || !height) {
    return { problem: "In an email, a Layer is as tall as its Image, which needs its file's width and height (src={{ src, width, height }}); or give the Layer a height", path: `${base.path}.props.src` };
  }
  return { base, over, height: Math.round((base.width * height) / width) };
}
