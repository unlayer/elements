/**
 * The layout engine both modes share.
 *
 * Front ends (runtime: the rendered template; codemod: its source) describe
 * the template as a tree of boxes (Container, Section, wrappers), rows of
 * columns, content blocks and code holes, with styles already resolved.
 * The engine turns that tree into Elements Rows. It never looks at content.
 *
 * How CSS boxes become Elements rows:
 * - A box's background is painted on the Row's content box
 *   (`columnsBackgroundColor`) while the box spans the full content width.
 * - A box inset from its parent (padding or margins around it), narrower than
 *   it, or with a border or rounded corners is a "card": its rows get empty
 *   spacer columns for the space outside it, and its background, border and
 *   radius go on the columns inside.
 * - An unpainted box narrower than its parent (a max-width text, a centered
 *   box) is "narrow": spacer columns for the space around it, its parent's
 *   padding kept as padding on its columns.
 * - Phones: React Email's rows are tables and never stack, unless the template
 *   makes a column full width there (`mobile:!block`). So a row stacks only
 *   then; rows of several columns, and rows inset by a card's spacers, keep
 *   their columns side by side (`noStackMobile`, widths in proportion). Rows
 *   that only a narrow box insets stack: the spacers collapse and the content
 *   takes the phone's width, as a max-width box does.
 * - A Section outside the Container paints a full-width band (`backgroundColor`).
 * - Padding inside a box becomes padding on its columns. Vertical space that
 *   belongs to an outer box (a card's margin, the padding above it) becomes a
 *   spacer row painted like that outer box.
 * - Vertical margins collapse like CSS: siblings share the larger margin.
 */

import { el, expr, hole, type BoxSides, type ElementNode, type Expr, type ReportBuilder } from "@unlayer/convert-core";
import { borderProp } from "./boxes";
import { cellsFrom, collapse, fill, LAYOUTS, type Block } from "./map";
import { sidesToCss, ZERO } from "./styles";

// ============================================
// The tree front ends build
// ============================================

export interface BorderSide {
  width: string;
  style: string;
  color: string;
}

export interface Borders {
  top?: BorderSide;
  right?: BorderSide;
  bottom?: BorderSide;
  left?: BorderSide;
}

export interface BoxStyle {
  background?: string;
  /** A background image (an Elements Row `backgroundImage`, without `fullWidth`). */
  image?: Record<string, unknown>;
  border?: Borders;
  /** CSS border-radius, e.g. "8px". */
  radius?: string;
  padding: BoxSides;
  margin: BoxSides;
  /** A width in px. Narrower than the space it's in, the box is placed by `align`. */
  width?: number;
  align?: "left" | "center" | "right";
  /** Visible CSS with no Elements equivalent (`box-shadow`, …), for the report. */
  dropped?: string[];
}

export type Flow = BoxNode | RowNode | ContentNode | RowsHole;

/** A vertical box: Container, Section, or a wrapper element. */
export interface BoxNode {
  kind: "box";
  /** The email's Container (its background is the content box's). */
  container?: boolean;
  /** For the report: what the box was ("Section", "div", …). */
  label?: string;
  style: BoxStyle;
  children: Flow[];
  key?: Expr;
}

/** A row of columns (a React Email Row). */
export interface RowNode {
  kind: "row";
  style: BoxStyle;
  columns: Array<ColumnNode | ColumnsHole>;
  /** `cond ? <>…</> : <>…</>`: the column widths of each branch. */
  branches?: { condition: string; whenTrue: Array<number | string | undefined>; whenFalse: Array<number | string | undefined> };
  key?: Expr;
}

export interface ColumnNode {
  kind: "column";
  style: BoxStyle;
  /** px, or a percentage of the row. */
  width?: number | string;
  /** Full width on phones in the original (`mobile:!block`): its row stacks there. */
  stacks?: boolean;
  blocks: Block[];
  key?: Expr;
}

/** Code that produces columns (`{items.map(i => <Column>…)}`). */
export interface ColumnsHole {
  kind: "columns";
  code: string;
  slots: ColumnNode[][];
  /** `list.map(item => <Column/>)`: one column per item of `list` (its code). */
  mappedOver?: string;
}

/** One content block (Paragraph, Image, Html fallback, or code producing blocks). */
export interface ContentNode {
  kind: "content";
  block: Block;
  key?: Expr;
}

/** Code that produces rows or boxes (`{items.map(i => <Section>…)}`). */
export interface RowsHole {
  kind: "rows";
  code: string;
  slots: Flow[][];
}

export const NO_STYLE: BoxStyle = { padding: ZERO, margin: ZERO };

export interface LayoutOptions {
  contentWidth: number;
  report: ReportBuilder;
}

/** Lay out `flow` (the Body's children) as Elements Rows. */
export function layout(flow: Flow[], options: LayoutOptions): ElementNode[] {
  const engine = new Engine(options);
  return engine.run(flow);
}

// ============================================
// Engine
// ============================================

interface Frame {
  parent?: Frame;
  /**
   * band: full-width background; fill: the content box's background;
   * card: painted on the columns, inset by spacer columns; narrow: unpainted,
   * inset by spacer columns.
   */
  kind: "root" | "band" | "fill" | "card" | "narrow";
  background?: string;
  image?: Record<string, unknown>;
  border?: Borders;
  radius?: string;
  /** Spacer widths around this frame, inside its parent (card / narrow). */
  outer: { left: number; right: number };
  /** Width available inside the frame. */
  width: number;
  /** Rows inside the frame, holes' rows included, for its border and corners. */
  rows: ElementNode[];
  /** The list the frame's rows go in, and its first and last entries there. */
  output: ElementNode[];
  first?: ElementNode;
  last?: ElementNode;
  label: string;
}

interface Ctx {
  frame: Frame;
  /** Padding inside the frame, on the first and last columns. */
  inset: { left: number; right: number };
  inContainer: boolean;
}

/** What the engine knows about a Row it made. */
interface RowInfo {
  frame: Frame;
  /** Per column: how many column frames (card/narrow) it sits inside. */
  depths: number[];
  /** Columns come from code: vertical space can't go on them. */
  holes?: boolean;
  /** The row's columns stack on phones. */
  stacks?: boolean;
}

type ColumnSpec = { kind: "column"; node: ColumnNode } | { kind: "hole"; code: string; slots: ColumnNode[][]; mappedOver?: string };

const ZERO_INSET = { left: 0, right: 0 };

/**
 * A card whose spacers and columns must stay side by side on phones: its
 * paint, side borders or corners would break apart if they stacked. A box
 * with only a top or bottom border (a divider) loses nothing.
 */
function loadBearing(frame: Frame): boolean {
  return frame.kind === "card" && Boolean(frame.background || frame.image || frame.radius || frame.border?.left || frame.border?.right);
}

/** A border side's width in px (0 without one). */
function edgeWidth(side: BorderSide | undefined): number {
  return side ? Number.parseFloat(side.width) || 0 : 0;
}

/** A phone's width, for what columns side by side have room for there. */
const PHONE_WIDTH = 375;

/** Cells → the Row's layout prop (a named layout when there's one). */
function LAYOUT_OF(cells: number[]): Record<string, unknown> {
  const name = LAYOUTS[cellsFrom(cells).join(",")];
  return name === "OneColumn" ? {} : name ? { layout: name } : { cells };
}


class Engine {
  private readonly report: ReportBuilder;
  private readonly info = new WeakMap<ElementNode, RowInfo>();
  private out: ElementNode[] = [];
  private pending: Array<{ height: number; frame: Frame }> = [];

  constructor(private readonly options: LayoutOptions) {
    this.report = options.report;
  }

  run(flow: Flow[]): ElementNode[] {
    const root: Frame = {
      kind: "root",
      outer: { left: 0, right: 0 },
      width: this.options.contentWidth,
      rows: [],
      output: this.out,
      label: "Body",
    };
    this.flow(flow, { frame: root, inset: { left: 0, right: 0 }, inContainer: false });
    this.settle(root);
    return this.merge(this.out);
  }

  /**
   * Neighbouring rows that differ only in vertical padding become one row:
   * the space between them moves onto the blocks (and spacer rows fold into
   * their neighbours). Fewer rows to edit, and a box's background image
   * spans its whole content instead of restarting on every row.
   */
  private merge(rows: ElementNode[]): ElementNode[] {
    for (const row of rows) if (row.type === "#expr") row.slots = row.slots?.map((slot) => this.merge(slot as ElementNode[]));
    const out: ElementNode[] = [];
    for (const row of rows) {
      const previous = out[out.length - 1];
      const merged = previous && mergeRows(previous, row, this.info);
      if (merged) out[out.length - 1] = merged;
      else out.push(row);
    }
    return out;
  }

  // ------------------------------------------
  // Vertical flow
  // ------------------------------------------

  private flow(items: Flow[], ctx: Ctx): void {
    let below = 0; // bottom margin of the previous sibling
    let run: Block[] = [];
    const flushRun = () => {
      if (!run.length) return;
      const blocks = run.map((b) => ({ ...b, margin: { ...b.margin } }));
      run = [];
      // The run's outer margins collapse with its siblings'.
      const top = blocks[0].margin.top;
      const bottom = blocks[blocks.length - 1].margin.bottom;
      blocks[0].margin.top = 0;
      blocks[blocks.length - 1].margin.bottom = 0;
      this.space(Math.max(below, top), ctx.frame);
      this.emit(ctx, [{ kind: "column", node: { kind: "column", style: NO_STYLE, blocks } }]);
      below = bottom;
    };
    for (const item of items) {
      if (item.kind === "content") {
        run.push(item.block);
        continue;
      }
      flushRun();
      if (item.kind === "rows") {
        this.space(below, ctx.frame);
        below = 0;
        this.rowsHole(item, ctx);
        continue;
      }
      const margin = item.style.margin;
      this.space(Math.max(below, Math.max(0, margin.top)), ctx.frame);
      if (item.kind === "box") this.box(item, ctx);
      else this.row(item, ctx);
      below = Math.max(0, margin.bottom);
    }
    flushRun();
    this.space(below, ctx.frame);
  }

  private box(node: BoxNode, ctx: Ctx): void {
    const label = node.label ?? (node.container ? "Container" : "Section");
    this.noteDropped(node.style, label);
    const { inner, opened } = this.enter(node.style, ctx, label, node.children, node.container);
    this.space(node.style.padding.top, inner.frame);
    this.flow(node.children, inner);
    this.space(node.style.padding.bottom, inner.frame);
    if (opened) this.close(opened);
  }

  /** A styled Row is a box around a plain row. */
  private row(node: RowNode, ctx: Ctx): void {
    const style = node.style;
    this.noteDropped(style, "Row");
    const specs = specsOf(node.columns);
    const styled = style.background || style.image || style.border || style.radius || style.width !== undefined || hasSides(style.padding);
    if (!styled) {
      this.emit(ctx, specs, { branches: node.branches, key: node.key });
      return;
    }
    const plain: RowNode = { ...node, style: NO_STYLE };
    const { inner, opened } = this.enter({ ...style, margin: ZERO }, ctx, "Row", [plain]);
    this.space(style.padding.top, inner.frame);
    this.emit(inner, specs, { branches: node.branches, key: node.key });
    this.space(style.padding.bottom, inner.frame);
    if (opened) this.close(opened);
  }

  private noteDropped(style: BoxStyle, label: string): void {
    for (const what of style.dropped ?? []) this.report.note("style not converted", `${what} (${label})`);
  }

  /**
   * Enter a box: a new frame when it paints or sits differently, else the
   * same frame with more inset.
   */
  private enter(style: BoxStyle, ctx: Ctx, label: string, children: Flow[], container = false): { inner: Ctx; opened?: Frame } {
    const parent = ctx.frame;
    const margin = { left: Math.max(0, style.margin.left), right: Math.max(0, style.margin.right) };
    const available = parent.width - ctx.inset.left - ctx.inset.right - margin.left - margin.right;
    // Like a table, a box grows to fit the fixed widths inside it (icons with gaps in a narrow box).
    const wanted = style.width !== undefined ? Math.max(style.width, minContent(children) + style.padding.left + style.padding.right) : undefined;
    const width = wanted !== undefined && wanted < available - 0.5 ? wanted : available;
    const slack = available - width;
    const before = style.align === "center" ? slack / 2 : style.align === "right" ? slack : 0;
    const outer = { left: ctx.inset.left + margin.left + before, right: ctx.inset.right + margin.right + slack - before };
    const padding = { left: Math.max(0, style.padding.left), right: Math.max(0, style.padding.right) };
    const inContainer = ctx.inContainer || container;
    const painted = Boolean(style.background || style.image);
    const spaced = outer.left > 0.5 || outer.right > 0.5;
    const insideCard = columnFrames(parent).length > 0;
    const decorated = Boolean(style.border || style.radius);

    let kind: Frame["kind"] | undefined;
    if (!inContainer && painted && !insideCard) {
      kind = "band";
      // A band spans the page; Elements draws borders on columns, inside the content width.
      if (decorated) this.report.note("box border/radius dropped (full-width band)", label);
    }
    else if ((painted || decorated) && (spaced || decorated || insideCard)) kind = "card";
    else if (painted) kind = "fill";
    else if (spaced && width < available - 0.5) kind = "narrow";

    const sameInset = { left: ctx.inset.left + margin.left + padding.left, right: ctx.inset.right + margin.right + padding.right };
    if (!kind) return { inner: { frame: parent, inset: sameInset, inContainer } };

    const columnFrame = kind === "card" || kind === "narrow";
    // A narrow box keeps the parent's padding around it as padding on its
    // columns, not spacers: it stays when spacers collapse on phones. Inside a
    // card, rows keep their spacers on phones: only the side the box sits
    // against keeps its padding (lining up with the card's other rows); the
    // other joins the spacer.
    let keep = kind === "narrow" ? ctx.inset : ZERO_INSET;
    if (kind === "narrow" && columnFrames(parent).some((f) => f.kind === "card")) {
      keep = style.align === "center" ? ZERO_INSET : style.align === "right" ? { left: 0, right: ctx.inset.right } : { left: ctx.inset.left, right: 0 };
    }
    const frame: Frame = {
      parent,
      kind,
      background: style.background,
      image: style.image,
      border: decorated && kind !== "band" ? style.border : undefined,
      radius: decorated && kind !== "band" ? style.radius : undefined,
      outer: columnFrame ? { left: outer.left - keep.left, right: outer.right - keep.right } : { left: 0, right: 0 },
      // Inside its border: the columns at its edges add the border's width to their cells.
      width: columnFrame ? width + keep.left + keep.right - (kind === "card" && decorated ? edgeWidth(style.border?.left) + edgeWidth(style.border?.right) : 0) : parent.width,
      rows: [],
      output: this.out,
      label,
    };
    if (kind === "card" && style.image) this.report.note("background image dropped on an inset box", String(style.image.url ?? ""));
    // A band or fill keeps the space around it as padding on the columns.
    const inset = columnFrame ? { left: padding.left + keep.left, right: padding.right + keep.right } : sameInset;
    return { inner: { frame, inset, inContainer }, opened: frame };
  }

  /** Close a frame: settle its space, then draw its border and corners. */
  private close(frame: Frame): void {
    this.settle(frame);
    if (frame.kind !== "card" || !(frame.border || frame.radius) || !frame.first || !frame.last) return;
    const depth = columnFrames(frame).length;
    // Columns the template stacks on phones each take a piece of the outline there.
    const stacked = frame.rows.some((row) => {
      const info = this.info.get(row);
      return info?.stacks && info.depths.filter((d) => d >= depth).length > 1;
    });
    if (stacked && loadBearing(frame)) this.report.note("box outline breaks apart on phones (its columns stack)", frame.label);
    // Loops make an unknown number of rows, and columns that stack on phones
    // would each take a piece of the edge: the top and bottom edges get thin
    // rows of their own.
    const wide = (row: ElementNode) => {
      const info = this.info.get(row);
      return Boolean(info?.stacks && info.depths.filter((d) => d >= depth).length > 1);
    };
    if (frame.first.type !== "Row" || (frame.border?.top && wide(frame.first))) this.edgeRow(frame, "top");
    if (frame.last.type !== "Row" || (frame.border?.bottom && wide(frame.last))) this.edgeRow(frame, "bottom");
    const radius = frame.radius ? corners(frame.radius) : undefined;
    const border = frame.border ?? {};
    for (const row of frame.rows) {
      const info = this.info.get(row);
      if (!info) continue;
      const inside = info.depths.flatMap((d, i) => (d >= depth ? [i] : []));
      if (!inside.length) continue;
      const columns = row.children as ElementNode[];
      const first = row === frame.first;
      const last = row === frame.last;
      inside.forEach((at, n) => {
        const column = columns[at];
        const leftEdge = n === 0;
        const rightEdge = n === inside.length - 1;
        const sides: Borders = {
          ...(leftEdge ? { left: border.left } : {}),
          ...(rightEdge ? { right: border.right } : {}),
          ...(first ? { top: border.top } : {}),
          ...(last ? { bottom: border.bottom } : {}),
        };
        const props: Record<string, unknown> = { ...column.props, border: mergeBorder(column.props?.border as Record<string, string> | undefined, sides) };
        if (radius && (first || last) && (leftEdge || rightEdge)) {
          const [tl, tr, br, bl] = radius;
          props.borderRadius = [
            first && leftEdge ? tl : "0px",
            first && rightEdge ? tr : "0px",
            last && rightEdge ? br : "0px",
            last && leftEdge ? bl : "0px",
          ].join(" ");
        }
        column.props = props;
      });
    }
  }

  private edgeRow(frame: Frame, edge: "top" | "bottom"): void {
    const row = this.build({ frame, inset: { left: 0, right: 0 }, inContainer: true }, [emptyColumn(0)]);
    const at = edge === "top" ? frame.output.indexOf(frame.first as ElementNode) : frame.output.indexOf(frame.last as ElementNode) + 1;
    frame.output.splice(at, 0, row);
    for (let f: Frame | undefined = frame; f; f = f.parent) f.rows.push(row);
    if (edge === "top") frame.first = row;
    else frame.last = row;
  }

  // ------------------------------------------
  // Vertical space
  // ------------------------------------------

  private space(height: number, frame: Frame): void {
    if (height > 0.5) this.pending.push({ height, frame });
  }

  /**
   * Space waiting above the next row in `frame`: what belongs to the same
   * frame goes on the row's columns (returned); the rest gets spacer rows
   * painted like the box it belongs to.
   */
  private takeSpace(frame: Frame): number {
    let top = 0;
    const pending = this.pending;
    this.pending = [];
    for (const p of pending) {
      if (p.frame === frame) top += p.height;
      else this.spacer(p.height, p.frame);
    }
    return top;
  }

  /** Space left inside `frame` as it ends: below its last row, or a spacer row. */
  private settle(frame: Frame): void {
    const mine = this.pending.filter((p) => within(p.frame, frame));
    if (!mine.length) return;
    this.pending = this.pending.filter((p) => !within(p.frame, frame));
    for (const p of mine) {
      const last = this.out[this.out.length - 1];
      const info = last && this.info.get(last);
      if (last && info && info.frame === p.frame && !info.holes && !info.stacks) padColumns(last, info, { ...ZERO, bottom: p.height });
      else this.spacer(p.height, p.frame);
    }
  }

  private spacer(height: number, frame: Frame): void {
    this.push(this.build({ frame, inset: { left: 0, right: 0 }, inContainer: true }, [emptyColumn(height)]), frame);
  }

  // ------------------------------------------
  // Rows
  // ------------------------------------------

  private emit(ctx: Ctx, specs: ColumnSpec[], options: { branches?: RowNode["branches"]; key?: Expr } = {}): void {
    const top = this.takeSpace(ctx.frame);
    const row = this.build(ctx, specs, options);
    const info = this.info.get(row) as RowInfo;
    // Space can't go on columns from code, or on columns that stack on phones (each would repeat it).
    if (top && (info.holes || info.stacks)) this.spacer(top, ctx.frame);
    else if (top) padColumns(row, info, { ...ZERO, top });
    this.push(row, ctx.frame);
  }

  private push(node: ElementNode, frame: Frame): void {
    this.out.push(node);
    for (let f: Frame | undefined = frame; f; f = f.parent) {
      if (node.type === "Row") f.rows.push(node);
      if (f.output === this.out) {
        f.first ??= node;
        f.last = node;
      }
    }
  }

  /** Code producing rows: each slot is laid out where the code sits. */
  private rowsHole(node: RowsHole, ctx: Ctx): void {
    // Space can't go inside code: it gets rows of its own.
    const top = this.takeSpace(ctx.frame);
    if (top) this.spacer(top, ctx.frame);
    const outer = this.out;
    const slots = node.slots.map((slot) => {
      this.out = [];
      this.flow(slot, ctx);
      this.settle(ctx.frame);
      const rows = this.out;
      // The list key moves to what the item became (several rows get index keys when printed).
      const key = slot.length === 1 && slot[0].kind !== "rows" ? slot[0].key : undefined;
      if (key && rows.length === 1) rows[0].props = { key, ...rows[0].props };
      return rows;
    });
    this.out = outer;
    this.push(hole(node.code, slots), ctx.frame);
  }

  /**
   * Side by side on phones, columns keep their share of the row while their
   * padding keeps its px: a narrow column with wide padding (an icon with a
   * gap after it) would have no room left. Its padding becomes spacer
   * columns, which shrink with the row. Columns with their own background or
   * border keep it (a spacer wouldn't look the same).
   */
  private foldPadding(columns: ElementNode[], depths: number[], specs: ColumnSpec[], cells: number[], first: number): Record<string, unknown> {
    const phone = PHONE_WIDTH / this.options.contentWidth;
    const outCells: number[] = [];
    const outColumns: ElementNode[] = [];
    const outDepths: number[] = [];
    let folded = false;
    columns.forEach((column, i) => {
      const spec = specs[i - first];
      const own = spec?.kind === "column" ? spec.node.style : undefined;
      const padding = sidesOf(column.props?.padding);
      const wide = padding.left + padding.right >= 0.5 * cells[i] * phone;
      if (!own || own.background || own.border || own.radius || !wide || padding.left + padding.right >= cells[i]) {
        outCells.push(cells[i]);
        outColumns.push(column);
        outDepths.push(depths[i]);
        return;
      }
      folded = true;
      const spacer = () => el("Column", { backgroundColor: column.props?.backgroundColor });
      if (padding.left > 0.5) {
        outCells.push(padding.left);
        outColumns.push(spacer());
        outDepths.push(depths[i]);
      }
      const rest = { ...padding, left: 0, right: 0 };
      column.props = { ...column.props, padding: hasSides(rest) ? sidesToCss(rest) : undefined };
      outCells.push(cells[i] - padding.left - padding.right);
      outColumns.push(column);
      outDepths.push(depths[i]);
      if (padding.right > 0.5) {
        outCells.push(padding.right);
        outColumns.push(spacer());
        outDepths.push(depths[i]);
      }
    });
    if (!folded) return LAYOUT_OF(cells);
    columns.splice(0, columns.length, ...outColumns);
    depths.splice(0, depths.length, ...outDepths);
    return LAYOUT_OF(roundCells(outCells));
  }

  /** Build an Elements Row: spacer columns for the frames it's inside, then its columns. */
  private build(ctx: Ctx, specs: ColumnSpec[], options: { branches?: RowNode["branches"]; key?: Expr } = {}): ElementNode {
    const frames = columnFrames(ctx.frame);
    const depth = frames.length;
    const holes = specs.some((s) => s.kind === "hole");
    // Code that makes the columns: their widths can be written for `cond ? <>…</> : <>…</>`
    // and for one column per item of a list.
    const only = specs.length === 1 && specs[0].kind === "hole" ? specs[0] : undefined;
    // One column per item (a slot per branch when the callback chooses one), all as wide.
    const sameWidth = only?.slots.every((slot) => slot.length === 1 && slot[0].width === only.slots[0][0]?.width);
    const mapped = only?.mappedOver && only.slots.length && sameWidth ? { list: only.mappedOver, column: only.slots[0][0] } : undefined;
    const counted = !holes || Boolean(options.branches) || Boolean(mapped);
    const area = depth ? frames[depth - 1].width : this.options.contentWidth;
    const available = area - ctx.inset.left - ctx.inset.right;

    // Spacers: one per column frame on each side. Columns from code can't
    // take the inset as padding, so it becomes spacers too.
    const left: Array<{ width: number; depth: number }> = [];
    const right: Array<{ width: number; depth: number }> = [];
    if (counted) {
      frames.forEach((f, i) => {
        if (f.outer.left > 0.5) left.push({ width: f.outer.left, depth: i });
        if (f.outer.right > 0.5) right.unshift({ width: f.outer.right, depth: i });
      });
      if (holes && ctx.inset.left > 0.5) left.push({ width: ctx.inset.left, depth });
      if (holes && ctx.inset.right > 0.5) right.unshift({ width: ctx.inset.right, depth });
    } else if (frames.some((f) => f.outer.left > 0.5 || f.outer.right > 0.5) || ctx.inset.left > 0.5 || ctx.inset.right > 0.5) {
      this.report.note("inset dropped around a generated column list");
    }

    const columns: ElementNode[] = [];
    const depths: number[] = [];
    const add = (node: ElementNode, d: number) => {
      columns.push(node);
      depths.push(d);
    };
    for (const s of left) add(el("Column", { backgroundColor: paintAt(frames, s.depth) }), s.depth);
    const widths: Array<number | undefined> = [];
    specs.forEach((spec, i) => {
      if (spec.kind === "hole") {
        for (const col of new Set(spec.slots.flat())) this.noteDropped(col.style, "Column");
        const slots = spec.slots.map((slot) => slot.map((col) => column(col, paintAt(frames, depth), ZERO_INSET)));
        add(hole(spec.code, slots), depth);
        return;
      }
      const inset = holes ? ZERO_INSET : { left: i === 0 ? ctx.inset.left : 0, right: i === specs.length - 1 ? ctx.inset.right : 0 };
      this.noteDropped(spec.node.style, "Column");
      add(column(spec.node, paintAt(frames, depth), inset), depth);
      widths.push(widthOf(spec.node.width, available));
    });
    for (const s of right) add(el("Column", { backgroundColor: paintAt(frames, s.depth) }), s.depth);

    // Cells in px: spacers, then the columns (with the inset inside the first and last).
    const laidOut = (contentWidths: Array<number | undefined>) => {
      const filled = fill(contentWidths, available);
      // A 100%-wide table shares spare width out in proportion, as fixed widths can add up short.
      const sum = filled.reduce((a, b) => a + b, 0);
      const out = sum > 0 ? filled.map((w) => (w * available) / sum) : filled;
      if (!holes) {
        out[0] += ctx.inset.left;
        out[out.length - 1] += ctx.inset.right;
      }
      const cells = [...left.map((s) => s.width), ...out, ...right.map((s) => s.width)];
      // A bordered card's border sits on the first and last columns inside it.
      const at = [...left.map((s) => s.depth), ...out.map(() => depth), ...right.map((s) => s.depth)];
      frames.forEach((f, i) => {
        if (f.kind !== "card" || !f.border) return;
        const first = at.findIndex((d) => d > i);
        const last = at.length - 1 - [...at].reverse().findIndex((d) => d > i);
        if (first < 0) return;
        cells[first] += edgeWidth(f.border.left);
        cells[last] += edgeWidth(f.border.right);
      });
      return roundCells(cells);
    };
    let layoutProps: Record<string, unknown> = {};
    let pxCells: number[] | undefined;
    if (options.branches) {
      const { condition, whenTrue, whenFalse } = options.branches;
      const cells = (ws: Array<number | string | undefined>) => JSON.stringify(laidOut(ws.map((w) => widthOf(w, available))));
      layoutProps = { cells: expr(`${condition} ? ${cells(whenTrue)} : ${cells(whenFalse)}`) };
    } else if (mapped) {
      // One cell per item: its fixed width, or an equal share of the row.
      const width = widthOf(mapped.column.width, available);
      const each = width !== undefined ? `() => ${Math.round(width)}` : `(_item, _index, all) => Math.round(${Math.round(available)} / all.length)`;
      const cells = [...left.map((s) => String(Math.round(s.width))), `...${mapped.list}.map(${each})`, ...right.map((s) => String(Math.round(s.width)))];
      layoutProps = { cells: expr(`[${cells.join(", ")}]`) };
    } else if (!holes) {
      pxCells = laidOut(widths);
      // One column is a Row's default: no layout prop.
      layoutProps = LAYOUT_OF(pxCells);
    } else if (widths.some((w) => w !== undefined)) {
      this.report.note("column widths dropped for a generated column list");
    }

    // Phones: stack where the template does; otherwise keep columns side by
    // side as its tables do, and a card's spacers with them. Spacers that
    // only narrow the content collapse, and the content takes the width.
    const marked = specs.some((s) => (s.kind === "hole" ? s.slots.some((slot) => slot.some((c) => c.stacks)) : s.node.stacks));
    const several = specs.length > 1 || holes;
    const multiple = columns.length > 1 || holes;
    const stacks = multiple && (marked || (!several && !frames.some(loadBearing)));
    const noStackMobile = multiple && !stacks;
    // Side by side on phones, a max-width box inside a card keeps its share of the row there.
    if (noStackMobile && !several && frames.some((f) => f.kind === "narrow") && frames.some(loadBearing)) {
      this.report.note("narrow box inside a card keeps its share of the width on phones (wraps more there)", ctx.frame.label);
    }
    // Stacked, every column is full width; the box's side padding is only on the outer ones.
    if (stacks && marked && specs.length > 1 && (ctx.inset.left > 0.5 || ctx.inset.right > 0.5)) {
      this.report.note("side padding on phones only around the outer columns (they stack)", `${Math.round(ctx.inset.left)}px`);
    }
    if (noStackMobile && pxCells) layoutProps = this.foldPadding(columns, depths, specs, pxCells, left.length);
    const row = el(
      "Row",
      { ...(options.key ? { key: options.key } : {}), ...layoutProps, ...(noStackMobile ? { noStackMobile: true } : {}), ...rowPaint(ctx.frame) },
      columns
    );
    this.info.set(row, { frame: ctx.frame, depths, holes, stacks });
    return row;
  }
}


/** One row from two, when they're the same but for their content column's vertical padding. */
function mergeRows(a: ElementNode, b: ElementNode, info: WeakMap<ElementNode, RowInfo>): ElementNode | undefined {
  const ia = info.get(a);
  const ib = info.get(b);
  if (!ia || !ib || a.type !== "Row" || b.type !== "Row") return undefined;
  const { key: keyA, ...propsA } = a.props ?? {};
  const { key: keyB, ...propsB } = b.props ?? {};
  if (keyB !== undefined || JSON.stringify(propsA) !== JSON.stringify(propsB)) return undefined;
  if (JSON.stringify(ia.depths) !== JSON.stringify(ib.depths)) return undefined;
  const depth = Math.max(...ia.depths);
  const at = ia.depths.indexOf(depth);
  if (ia.depths.filter((d) => d === depth).length !== 1) return undefined;
  const colsA = a.children as ElementNode[];
  const colsB = b.children as ElementNode[];
  // Spacer columns identical; the content columns alike but for vertical padding.
  for (let i = 0; i < colsA.length; i++) {
    if (i === at) continue;
    if (JSON.stringify(colsA[i].props ?? {}) !== JSON.stringify(colsB[i].props ?? {})) return undefined;
  }
  const ca = colsA[at];
  const cb = colsB[at];
  if (ca.type !== "Column" || cb.type !== "Column") return undefined;
  const { padding: padA, ...restA } = ca.props ?? {};
  const { padding: padB, ...restB } = cb.props ?? {};
  if (restA.border || restA.borderRadius || restB.border || restB.borderRadius || JSON.stringify(restA) !== JSON.stringify(restB)) return undefined;
  const pa = sidesOf(padA);
  const pb = sidesOf(padB);
  if (pa.left !== pb.left || pa.right !== pb.right) return undefined;
  const blocksA = (ca.children ?? []) as ElementNode[];
  const blocksB = (cb.children ?? []) as ElementNode[];
  let top = pa.top;
  let bottom = pb.bottom;
  if (!blocksA.length) top = pa.top + pa.bottom + pb.top;
  else if (!blocksB.length) bottom = pa.bottom + pb.top + pb.bottom;
  else {
    const gap = pa.bottom + pb.top;
    if (gap) {
      const first = blocksB[0];
      const last = blocksA[blocksA.length - 1];
      if (first.type !== "#expr") first.props = { ...first.props, containerPadding: addTo(first.props?.containerPadding, { top: gap }) };
      else if (last.type !== "#expr") last.props = { ...last.props, containerPadding: addTo(last.props?.containerPadding, { bottom: gap }) };
      else return undefined;
    }
  }
  const padding = { top, right: pa.right, bottom, left: pa.left };
  const column = el("Column", { ...restA, padding: hasSides(padding) ? sidesToCss(padding) : undefined }, [...blocksA, ...blocksB]);
  const columns = colsA.map((c, i) => (i === at ? column : c));
  const row = el("Row", { ...(keyA !== undefined ? { key: keyA } : {}), ...propsA }, columns);
  info.set(row, ia);
  return row;
}

function addTo(css: unknown, add: Partial<BoxSides>): string {
  const sides = sidesOf(css);
  return sidesToCss({ top: sides.top + (add.top ?? 0), right: sides.right, bottom: sides.bottom + (add.bottom ?? 0), left: sides.left });
}

function specsOf(columns: Array<ColumnNode | ColumnsHole>): ColumnSpec[] {
  return columns.map((c) => (c.kind === "columns" ? { kind: "hole", code: c.code, slots: c.slots, mappedOver: c.mappedOver } : { kind: "column", node: c }));
}

function emptyColumn(height: number): ColumnSpec {
  return { kind: "column", node: { kind: "column", style: { ...NO_STYLE, padding: { ...ZERO, top: height } }, blocks: [] } };
}

function column(node: ColumnNode, background: string | undefined, inset: { left: number; right: number }): ElementNode {
  const style = node.style;
  const padding = { ...style.padding, left: style.padding.left + inset.left, right: style.padding.right + inset.right };
  return el(
    "Column",
    {
      ...(node.key ? { key: node.key } : {}),
      backgroundColor: style.background ?? background,
      padding: hasSides(padding) ? sidesToCss(padding) : undefined,
      border: borderProp(style.border),
      borderRadius: style.radius,
    },
    collapse(node.blocks)
  );
}

// ============================================
// Helpers
// ============================================

/** The width the fixed-width columns and images in `flow` need side by side (px). */
function minContent(flow: Flow[]): number {
  let widest = 0;
  for (const item of flow) {
    let need = 0;
    if (item.kind === "row") {
      const fixed = item.columns.map((c) => (c.kind === "column" && typeof c.width === "number" ? c.width : 0));
      need = fixed.reduce((a, b) => a + b, 0) + item.style.padding.left + item.style.padding.right;
    } else if (item.kind === "box") {
      need = minContent(item.children) + item.style.padding.left + item.style.padding.right;
    } else if (item.kind === "content" && item.block.node.type === "Image") {
      const width = Number.parseFloat(String(item.block.node.props?.width ?? ""));
      if (Number.isFinite(width)) need = width + item.block.padding.left + item.block.padding.right;
    }
    widest = Math.max(widest, need);
  }
  return widest;
}

function hasSides(sides: BoxSides): boolean {
  return Boolean(sides.top || sides.right || sides.bottom || sides.left);
}

/** Card and narrow frames from the outermost in: each adds spacer columns. */
function columnFrames(frame: Frame): Frame[] {
  const out: Frame[] = [];
  for (let f: Frame | undefined = frame; f; f = f.parent) if (f.kind === "card" || f.kind === "narrow") out.unshift(f);
  return out;
}

/** The background a column `depth` frames deep shows: the innermost painted card around it. */
function paintAt(frames: Frame[], depth: number): string | undefined {
  for (let i = depth - 1; i >= 0; i--) if (frames[i].kind === "card" && frames[i].background) return frames[i].background;
  return undefined;
}

/** Row-level paint: the full-width band, and the content box's background and image. */
function rowPaint(frame: Frame): Record<string, unknown> {
  let band: Frame | undefined;
  let fill: Frame | undefined;
  for (let f: Frame | undefined = frame; f; f = f.parent) {
    if (f.kind === "band" && !band) band = f;
    if (f.kind === "fill" && !fill && !band) fill = f;
  }
  const image = fill?.image ? { ...fill.image, fullWidth: false } : band?.image ? { ...band.image, fullWidth: true } : undefined;
  return {
    backgroundColor: band?.background,
    columnsBackgroundColor: fill?.background,
    backgroundImage: image,
  };
}

/** Whether `frame` is `ancestor` or inside it. */
function within(frame: Frame, ancestor: Frame): boolean {
  for (let f: Frame | undefined = frame; f; f = f.parent) if (f === ancestor) return true;
  return false;
}

/** Add padding to the columns of a row that sit in its own frame (not its spacers). */
function padColumns(row: ElementNode, info: RowInfo, add: BoxSides): void {
  const depth = columnFrames(info.frame).length;
  (row.children as ElementNode[]).forEach((column, i) => {
    if (info.depths[i] !== depth || column.type !== "Column") return;
    const own = sidesOf(column.props?.padding);
    column.props = {
      ...column.props,
      padding: sidesToCss({ top: own.top + add.top, right: own.right + add.right, bottom: own.bottom + add.bottom, left: own.left + add.left }),
    };
  });
}

function sidesOf(value: unknown): BoxSides {
  if (typeof value !== "string") return { ...ZERO };
  const parts = value.trim().split(/\s+/).map((p) => Number.parseFloat(p) || 0);
  const [top, right = top, bottom = top, left = right] = parts;
  return { top, right, bottom, left };
}

function widthOf(width: number | string | undefined, total: number): number | undefined {
  if (typeof width === "number") return width;
  if (typeof width === "string" && width.trim().endsWith("%")) return (Number.parseFloat(width) / 100) * total;
  return undefined;
}

/** Cells as whole px: rows of the same card keep their edges aligned. */
function roundCells(widths: number[]): number[] {
  return widths.map((w) => Math.max(1, Math.round(w)));
}

/** "8px" / "8px 4px" / "8px 4px 2px 0px" → [tl, tr, br, bl]. */
function corners(radius: string): [string, string, string, string] {
  const parts = radius.trim().split(/\s+/).map((p) => (/^\d+(\.\d+)?$/.test(p) ? `${p}px` : p));
  const [tl, tr = tl, br = tl, bl = tr] = parts;
  return [tl, tr, br, bl];
}

/** Borders → the Column `border` prop (borderTopWidth, borderTopStyle, …). */
function mergeBorder(existing: Record<string, string> | undefined, sides: Borders): Record<string, string> | undefined {
  const out: Record<string, string> = { ...(existing ?? {}) };
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
