/**
 * Image display-width resolution.
 *
 * In Unlayer's value model an image's display size is `autoWidth` + `maxWidth`,
 * kept separate from the natural `src.width`/`height`. A fixed display size is
 * `autoWidth: false` with `maxWidth` as a PERCENT of the column's content slot
 * (e.g. `"50%"`) — not the natural-size field. Encoding a fixed width that way
 * keeps it stable when the design JSON is opened in an editor, which treats
 * `src.width`/`height` as the intrinsic dimensions and may refresh them.
 *
 * Authors pass pixels, so a px pin is captured as `{ autoWidth:false,
 * maxWidth:<px> }` and converted here to the equivalent percent using the same
 * available-width geometry the renderers use (contentWidth × column share, minus
 * paddings/borders), so the emitted value renders at the requested on-screen size.
 */

/** Parse a CSS length to px, strictly: a number or a numeric string with an
 *  optional px unit ("12" / "12px"). Non-px units ("1.5em", "calc(…)") return
 *  undefined so the pinning pass leaves them untouched instead of misreading
 *  them as px (SizeInput allows non-px CSS strings). */
function toPx(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value !== "string") return undefined;
  const m = /^(\d+(?:\.\d+)?)(?:px)?$/.exec(value.trim());
  return m ? parseFloat(m[1]) : undefined;
}

/** Left/right edge sizes from a CSS box shorthand (padding/margin). */
function edges(value: unknown): { left: number; right: number } {
  if (value == null) return { left: 0, right: 0 };
  if (typeof value === "number") return { left: value, right: value };
  const parts = String(value)
    .trim()
    .split(/\s+/)
    .map((p) => parseFloat(p) || 0);
  // CSS order: 1 = all; 2 = [v h]; 3 = [t h b]; 4 = [t r b l].
  if (parts.length === 1) return { left: parts[0], right: parts[0] };
  if (parts.length === 2 || parts.length === 3)
    return { left: parts[1], right: parts[1] };
  return { left: parts[3] || 0, right: parts[1] || 0 };
}

/** Left/right border widths from a per-side border object. */
function borderEdges(border: unknown): { left: number; right: number } {
  if (!border || typeof border !== "object") return { left: 0, right: 0 };
  const b = border as Record<string, unknown>;
  return {
    left: toPx(b.borderLeftWidth) || 0,
    right: toPx(b.borderRightWidth) || 0,
  };
}

/** A body `contentWidth` is treated as fixed px when it's a number or a numeric
 *  string with an optional px unit (`600`, `"600px"`, or `"600"`). Percentages
 *  and keywords like `"auto"` are NOT fixed — callers fall back to the responsive
 *  base width. This matches the exporter's body-width math, which reads a bare
 *  numeric string as px and falls back for %/auto, so the slot geometry lines up
 *  with the width the image is actually rendered against. (It deliberately does
 *  not copy Row's `toContentWidthPx`, whose parseInt would misread `"50%"` as 50.) */
function fixedContentWidth(contentWidth: unknown): number | undefined {
  if (typeof contentWidth === "number")
    return Number.isFinite(contentWidth) ? contentWidth : undefined;
  if (typeof contentWidth === "string") {
    const m = /^(\d+(?:\.\d+)?)(?:px)?$/.exec(contentWidth.trim());
    if (m) return parseFloat(m[1]);
  }
  return undefined;
}

/** Unlayer's body content width fallback when `contentWidth` isn't fixed px. */
const FALLBACK_BODY_CONTENT_WIDTH = 500;
/** Unlayer's default content-block padding when a block sets none. */
const DEFAULT_CONTAINER_PADDING = "10px";

export interface SlotContext {
  bodyValues?: { contentWidth?: number | string; padding?: unknown; border?: unknown };
  rowValues?: { padding?: unknown; border?: unknown };
  rowCells?: number[];
  columnIndex?: number;
  columnValues?: { padding?: unknown; border?: unknown };
  /** The image block's own containerPadding (defaults to 10px like the editor). */
  containerPadding?: unknown;
}

/**
 * Width in px available to a content block, mirroring the renderers'
 * available-width math: contentWidth, minus body/row/column/container paddings
 * and borders, scaled by the column's share of the row.
 */
export function contentSlotWidth(ctx: SlotContext): number {
  const { bodyValues = {}, rowValues = {}, columnValues = {} } = ctx;
  const rowCells = ctx.rowCells && ctx.rowCells.length ? ctx.rowCells : [1];
  const columnIndex = ctx.columnIndex ?? 0;

  const bodyWidth = fixedContentWidth(bodyValues.contentWidth) ?? FALLBACK_BODY_CONTENT_WIDTH;

  const bp = edges(bodyValues.padding);
  const bb = borderEdges(bodyValues.border);
  const bodyAvail = bodyWidth - bp.left - bp.right - bb.left - bb.right;

  const rp = edges(rowValues.padding);
  const rb = borderEdges(rowValues.border);
  const rowAvail = bodyAvail - rp.left - rp.right - rb.left - rb.right;

  const rowSpan = rowCells.reduce((a, b) => a + b, 0) || 1;
  const colSpan = rowCells[columnIndex] || 1;
  const colWidth = (colSpan / rowSpan) * rowAvail;

  const cp = edges(columnValues.padding);
  const cb = borderEdges(columnValues.border);
  const colAvail = colWidth - cp.left - cp.right - cb.left - cb.right;

  const ip = edges(ctx.containerPadding ?? DEFAULT_CONTAINER_PADDING);
  return colAvail - ip.left - ip.right;
}

const PERCENT = /^\d+(?:\.\d+)?%$/;

/** Round to 2 decimals, matching the editor's percent precision. */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Convert a px display pin on an image `src` to the editor's canonical percent.
 *
 * Only touches a pinned image (`autoWidth === false`) whose `maxWidth` is a
 * px/number placeholder; a percent `maxWidth` is already canonical and is left
 * as-is, and a responsive image (`autoWidth !== false`) is untouched. A pin
 * wider than the slot clamps to 100%, mirroring the editor.
 */
export function pinImageSrc<T extends Record<string, any> | undefined>(
  src: T,
  availableWidth: number | undefined
): T {
  if (!src || typeof src !== "object") return src;
  if ((src as Record<string, any>).autoWidth !== false) return src;

  const maxWidth = (src as Record<string, any>).maxWidth;
  if (typeof maxWidth === "string" && PERCENT.test(maxWidth.trim())) return src;

  const pinPx = toPx(maxWidth);
  if (pinPx == null) return src;

  const avail = availableWidth && availableWidth > 0 ? availableWidth : undefined;
  const pct = avail ? (pinPx >= avail ? 100 : round2((pinPx / avail) * 100)) : 100;

  return { ...src, autoWidth: false, maxWidth: `${pct}%` } as T;
}
