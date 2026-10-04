/**
 * CSS → the layout engine's box styles, shared by both front ends.
 */

import type { BoxStyle, BorderSide, Borders, Flow } from "./layout";
import { NO_STYLE } from "./layout";
import type { Block, MapCtx } from "./map";
import { addSides, backgroundColor, backgroundImage, boxSides, color, parseBorder, px, toPx, unconverted, ZERO, type BoxSides, type Style } from "./styles";

/**
 * A box's style: background, border, corners, padding, margins, width and placement.
 * `table`: the box is a React Email table (Section, Row, Container), whose
 * `align` attribute ("center" unless given) places it when it's narrower.
 */
export function boxStyle(style: Style | undefined, options: { fitWidth?: () => number | undefined; table?: { align?: unknown } } = {}): BoxStyle {
  if (!style) return { ...NO_STYLE };
  const image = backgroundImage(style, false);
  if (image) delete image.fullWidth;
  const radius = toPx(style.borderRadius);
  const dropped = unconverted(style);
  return {
    ...(dropped.length ? { dropped } : {}),
    background: backgroundColor(style),
    image,
    border: borders(style),
    radius: radius ? (typeof style.borderRadius === "string" && /\s/.test(style.borderRadius.trim()) ? style.borderRadius : px(radius)) : undefined,
    padding: positive(boxSides(style, "padding")),
    margin: boxSides(style, "margin"),
    width: widthOf(style, options.fitWidth),
    align: options.table ? tableAlign(style, options.table.align) : alignOf(style),
  };
}

/**
 * A table's placement: its `align` attribute (React Email writes "center")
 * sets auto side margins, and CSS margins override the sides they set
 * (`mr-auto` keeps it centered; `m-0` puts it on the left).
 */
function tableAlign(style: Style, align: unknown): BoxStyle["align"] {
  const parts = typeof style.margin === "string" ? style.margin.trim().split(/\s+/) : style.margin !== undefined ? [String(style.margin)] : [];
  const cssRight = style.marginRight ?? (parts.length ? parts[1] ?? parts[0] : undefined);
  const cssLeft = style.marginLeft ?? (parts.length ? parts[3] ?? parts[1] ?? parts[0] : undefined);
  const attr = String(align ?? "center").toLowerCase();
  const left = cssLeft !== undefined ? String(cssLeft) : attr === "center" || attr === "right" ? "auto" : "0";
  const right = cssRight !== undefined ? String(cssRight) : attr === "center" || attr === "left" ? "auto" : "0";
  if (left === "auto" && right === "auto") return "center";
  if (left === "auto") return "right";
  return "left";
}

/** A column's width for the row's cells: px (with its padding, as table cells count it) or a percentage. */
export function columnWidth(style: Style, attrWidth?: unknown): number | string | undefined {
  const raw = style.width ?? attrWidth;
  if (typeof raw === "string" && raw.trim().endsWith("%")) return raw.trim();
  const width = toPx(raw);
  if (width === undefined) return undefined;
  const padding = boxSides(style, "padding");
  return width + padding.left + padding.right;
}

/** Border sides that show: a width above 0 and a style other than none. */
export function borders(style: Style): Borders | undefined {
  const all = parseBorder(style.border);
  const out: Borders = {};
  for (const side of ["Top", "Right", "Bottom", "Left"] as const) {
    const own = parseBorder(style[`border${side}`]);
    const width = style[`border${side}Width`] ?? own.width ?? style.borderWidth ?? all.width;
    const kind = style[`border${side}Style`] ?? own.style ?? style.borderStyle ?? all.style;
    const tint = style[`border${side}Color`] ?? own.color ?? style.borderColor ?? all.color;
    const w = toPx(width);
    if (!w || !kind || kind === "none" || kind === "hidden") continue;
    out[side.toLowerCase() as keyof Borders] = { width: px(w), style: String(kind), color: color(tint) ?? "#000000" } satisfies BorderSide;
  }
  return Object.keys(out).length ? out : undefined;
}

/** `margin: 0 auto` → center; `margin-left: auto` → right. */
export function alignOf(style: Style): BoxStyle["align"] {
  const parts = typeof style.margin === "string" ? style.margin.trim().split(/\s+/) : [];
  const right = style.marginRight ?? (parts.length ? parts[1] ?? parts[0] : undefined);
  const left = style.marginLeft ?? (parts.length ? parts[3] ?? parts[1] ?? parts[0] : undefined);
  if (left === "auto" && right === "auto") return "center";
  if (left === "auto") return "right";
  return undefined;
}

function widthOf(style: Style, fitWidth?: () => number | undefined): number | undefined {
  const fit = /^(fit|max|min)-content$/.test(String(style.width ?? "").trim()) ? fitWidth?.() : undefined;
  const sizes = [fit, toPx(style.width), toPx(style.maxWidth)].filter((n): n is number => n !== undefined && n > 0);
  return sizes.length ? Math.min(...sizes) : undefined;
}

function positive(sides: { top: number; right: number; bottom: number; left: number }) {
  return { top: Math.max(0, sides.top), right: Math.max(0, sides.right), bottom: Math.max(0, sides.bottom), left: Math.max(0, sides.left) };
}

/**
 * A text block that draws a box of its own — a background (a code or quote
 * box), a border, or a max-width (`max-w-[380px] mx-auto`) — becomes a box
 * around the paragraph, so the box shows and the text wraps where the
 * original's does. Its padding moves inside the box and its vertical margins
 * onto it, so they still collapse with its siblings.
 */
export function textBox(block: Block, style: Style): Flow {
  if (!needsTextBox(style)) return { kind: "content", block };
  const maxWidth = toPx(style.maxWidth) ?? toPx(style.width);
  const look = boxStyle(style);
  const { top, bottom } = block.margin;
  return {
    kind: "box",
    label: "text box",
    style: {
      ...NO_STYLE,
      background: look.background,
      border: look.border,
      radius: look.radius,
      padding: block.padding,
      width: maxWidth,
      align: maxWidth ? alignOf(style) ?? "left" : undefined,
      margin: { ...ZERO, top, bottom },
    },
    children: [{ kind: "content", block: { ...block, margin: { ...block.margin, top: 0, bottom: 0 }, padding: { ...ZERO } } }],
  };
}

/** Whether a text element's own box (background, border, max-width) shows. */
export function needsTextBox(style: Style): boolean {
  return toPx(style.maxWidth) !== undefined || Boolean(backgroundColor(style)) || Boolean(borders(style));
}

/** Inside a column of several, a text's own box can't be drawn: say what's lost. */
export function noteTextBox(style: Style, ctx: MapCtx): void {
  if (toPx(style.maxWidth) !== undefined) ctx.report.note("text max-width dropped (text runs wider)", String(style.maxWidth));
  if (backgroundColor(style)) ctx.report.note("text background dropped", backgroundColor(style));
  if (borders(style)) ctx.report.note("text border dropped");
}

/**
 * Columns side by side: React Email's cells sit in the middle of the row
 * unless told otherwise (a <td>'s default); Elements email columns sit at the
 * top. Taller neighbours show the difference.
 */
export function noteVerticalAlign(columns: Style[], ctx: MapCtx): void {
  if (columns.length < 2) return;
  const off = columns.map((s) => String(s.verticalAlign ?? "middle").trim()).find((a) => a !== "top" && a !== "baseline");
  if (off) ctx.report.note("column vertical alignment (Elements email columns align to the top)", off);
}

/** A Row with one Column is one box: the column's look inside the row's. */
export function mergeRowAndColumn(row: BoxStyle, column: BoxStyle): BoxStyle {
  return {
    background: column.background ?? row.background,
    image: column.image ?? row.image,
    border: column.border ?? row.border,
    radius: column.radius ?? row.radius,
    padding: addSides(row.padding, column.padding),
    margin: row.margin,
    width: row.width,
    align: row.align,
    ...droppedOf(row, column),
  };
}

/** A column holding one styled box (a card): the box's look on the column. */
export function mergeColumnAndBox(column: BoxStyle, box: BoxStyle): BoxStyle {
  return {
    ...column,
    background: box.background ?? column.background,
    image: box.image ?? column.image,
    border: box.border ?? column.border,
    radius: box.radius ?? column.radius,
    padding: addSides(column.padding, box.padding),
    ...droppedOf(column, box),
  };
}

function droppedOf(a: BoxStyle, b: BoxStyle): Pick<BoxStyle, "dropped"> {
  const dropped = [...(a.dropped ?? []), ...(b.dropped ?? [])];
  return dropped.length ? { dropped } : {};
}

/** A flattened box's padding, added around the blocks it held. */
export function wrapPadding(blocks: Block[], padding: BoxSides, ctx: MapCtx): Block[] {
  if (!blocks.length || !(padding.top || padding.right || padding.bottom || padding.left)) return blocks;
  ctx.report.info("nested section padding moved onto its blocks");
  return blocks.map((block, i) => ({
    ...block,
    padding: addSides(block.padding, {
      top: i === 0 ? padding.top : 0,
      right: padding.right,
      bottom: i === blocks.length - 1 ? padding.bottom : 0,
      left: padding.left,
    }),
  }));
}

/** Borders → an Elements `border` prop (borderTopWidth, borderTopStyle, …). */
export function borderProp(sides: Borders | undefined): Record<string, string> | undefined {
  if (!sides) return undefined;
  const out: Record<string, string> = {};
  for (const side of ["top", "right", "bottom", "left"] as const) {
    const border = sides[side];
    if (!border) continue;
    const name = side[0].toUpperCase() + side.slice(1);
    out[`border${name}Width`] = border.width;
    out[`border${name}Style`] = border.style;
    out[`border${name}Color`] = border.color;
  }
  return Object.keys(out).length ? out : undefined;
}
