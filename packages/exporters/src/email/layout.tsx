/**
 * Email layout: widths from the resolver as Word reads them (table and cell
 * attributes, px maximums), where a child sits in its cell, a box as a table
 * around its content, and a stack of children as table rows.
 */
import type { Json, ResolvedNode } from "@unlayer-internal/elements-core";
import { Fragment, h, NotOutlook, type Html, type Style } from "../jsx";
import { length } from "../shared/css";
import { isNode, shown, type Context, type MobileText } from "./context";
import { bgcolor, Table } from "./markup";
import { hiding, phoneBox, phoneClass } from "./styles";

export const VALIGN: Record<string, string> = { start: "top", center: "middle", end: "bottom", stretch: "top" };
const ALIGN: Record<string, string | undefined> = { start: undefined, center: "center", end: "right", stretch: undefined };
export const TEXT_ALIGN: Record<string, string | undefined> = { left: "left", justify: "left", center: "center", right: "right" };

export const sized = (node: ResolvedNode) => node.style.width !== undefined || node.style.maxWidth !== undefined;

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
  return {};
}

/** A phone width for a table or div: a percentage of its cell, or a px maximum. */
export function phoneWidth(value: Json): Style {
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
  const align = stack.style.align as string | undefined;
  if (align) return ALIGN[align];
  const text = TEXT_ALIGN[stack.text.textAlign];
  return text === "left" ? undefined : text;
}

const BOX_KEYS = ["padding", "border", "backgroundColor"];

/**
 * A node's box (background, padding, border, corners, height, width) as a
 * one-cell table around its content; Word has none of these on a div or a
 * paragraph. No table where there's no box: the content fills its cell, and
 * takes the node's id.
 */
export function boxed(node: ResolvedNode, context: Context, fill: boolean, content: (id: string | undefined) => Html): Html {
  const { style } = node;
  const mobile = node.mobile ?? {};
  const framed = ["padding", "border", "borderRadius", "backgroundColor", "height"].some((key) => style[key] !== undefined) || BOX_KEYS.some((key) => mobile[key] !== undefined);
  const width = boxWidth(node, fill);
  const ownWidth = width.width !== "100%" || width.maxWidth !== undefined || mobile.width !== undefined || mobile.maxWidth !== undefined;
  if (!framed && !ownWidth) return content(node.id);
  if (style.borderRadius !== undefined && node.type !== "Button") {
    context.d.add("email/outlook-degraded", "info", `borderRadius on this ${node.type} shows square corners in classic Outlook`, `${node.path}.style.borderRadius`, node.id);
  }
  const height = style.height !== undefined ? toNumber(style.height) : undefined;
  const boxClass = phoneClass(context, phoneBox(node));
  const inner = content(undefined);
  const widthClass = phoneClass(context, mobile.maxWidth !== undefined ? phoneWidth(mobile.maxWidth) : mobile.width !== undefined ? phoneWidth(mobile.width) : {});

  return (
    <Table id={node.id} class={widthClass} width={width.width} style={{ maxWidth: width.maxWidth }}>
      <tr>
        <td
          class={boxClass}
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
          {inner}
        </td>
      </tr>
    </Table>
  );
}

/** Children stacked down a table, one row each, `gap` as the cells' bottom padding. */
export function stackRows(node: ResolvedNode, context: Context, mobile: MobileText): { rows: Html; className?: string } {
  const children = node.children.filter(isNode).filter(shown);
  const gap = typeof node.style.gap === "number" ? node.style.gap : 0;
  const rows = children.map((child, index) => {
    const last = index === children.length - 1;
    const content = context.render(child, { parent: node, fill: false, mobile, inline: false });
    const hidden = hiding(child, context, "table-row");
    const row = (
      <tr class={hidden.className} style={hidden.style}>
        <td align={cellAlign(child, node)} style={{ paddingBottom: !last && gap ? gap : undefined }}>
          {content}
        </td>
      </tr>
    );
    // What's hidden on desktop isn't Outlook's at all (Outlook is never a phone).
    return child.hidden?.desktop ? <NotOutlook>{row}</NotOutlook> : row;
  });
  const phoneGap = node.mobile?.gap;
  const className =
    phoneGap === undefined
      ? undefined
      : context.sheet.classFor("phone", `&>tbody>tr>td{padding-bottom:${length(phoneGap)}!important}&>tbody>tr:last-child>td{padding-bottom:0!important}`);
  return { rows: <>{rows}</>, className };
}
