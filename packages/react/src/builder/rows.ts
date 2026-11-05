/**
 * A builder row as the template's nodes. A row with a band (a background across the width, or a Section's border
 * hidden on it) is a `Section` (a box, in a header or a footer, which hold none); a row of several columns, or with a
 * look of its own, a `Row` of `Column`s with their shares; a one-column row its column's blocks, the row's and the
 * column's space folded into them, or a `Column` where the column has a box. A page break among a column's blocks
 * splits the row there (in a Document).
 */
import type { Json, Node } from "@unlayer-internal/elements-core";
import { ColumnDefaults, RowDefaults } from "./tool-defaults";
import { color, givenId, hidden as hiddenOn, sides, some, type Sides, type Values } from "./read-values";
import { readRadius } from "./reading";
import { readBlock, type Context, type Slot } from "./blocks";
import { readHidden } from "./hide";
import { sayUnread } from "./unread";
import { readBorder } from "./values";

const ZERO: Sides = { top: 0, right: 0, bottom: 0, left: 0 };
const obj = (value: unknown): Values => (value && typeof value === "object" && !Array.isArray(value) ? (value as Values) : {});
const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const add = (a: Sides, b: Sides): Sides => ({ top: a.top + b.top, right: a.right + b.right, bottom: a.bottom + b.bottom, left: a.left + b.left });
const defined = (record: Record<string, Json | undefined>) => Object.fromEntries(Object.entries(record).filter(([, v]) => v !== undefined)) as Record<string, Json>;
const ALIGN_ITEMS: Record<string, string> = { "flex-start": "start", center: "center", "flex-end": "end", stretch: "stretch" };
/** Styles a box keeps its own padding inside: a block holding one isn't padded by its place. */
const BOX = ["backgroundColor", "border", "borderRadius", "width", "maxWidth", "minWidth", "height", "overflow", "justifyContent"];

export interface Where {
  context(where: string): Context;
  /** The body's values (its content width, which an image's place is a share of). */
  body: Values;
  /** In a Document: page breaks are its. */
  document: boolean;
  /** In a Document's header or footer, which hold no Section. */
  part: boolean;
}

/** A column's blocks, page breaks among them where it's a Document's. */
function blocksOf(column: Values, where: string, at: Where, slot: Omit<Slot, "column">): Node[] {
  return arr(column.contents).flatMap((content, i) => {
    const path = `${where}.contents[${i}]`;
    const { type, values } = obj(content);
    if (type === "page_break") {
      if (at.document && !at.part) return [{ type: "PageBreak" }];
      at.context(path).say("a page break is a Document's, between its pages: left out");
      return [];
    }
    return readBlock(type, obj(values), at.context(path), { ...slot, column: obj(column.values) });
  });
}

/** Space folded into blocks: above the first, below the last, at the sides of each. */
function fold(blocks: Node[], space: Sides): Node[] {
  if (!some(space)) return blocks;
  return blocks.map((block, i) => {
    const s = { top: i === 0 ? space.top : 0, right: space.right, bottom: i === blocks.length - 1 ? space.bottom : 0, left: space.left };
    if (!some(s)) return block;
    // A block that holds its place's padding (a Paragraph, a Divider, a Column around a block) takes it; one with a box
    // of its own, or another, is in a Column of it.
    const holds = ["Paragraph", "Heading", "Divider", "Column"].includes(block.type) && !BOX.some((key) => block.style?.[key] !== undefined);
    if (holds) return { ...block, style: { ...block.style, padding: add((block.style?.padding as Sides | undefined) ?? ZERO, s) } };
    const { hidden, ...shown } = block;
    return { type: "Column", style: { padding: s }, ...(hidden ? { hidden } : {}), children: [shown] };
  });
}

/** A column's phone padding and border. */
function phoneOf(columnValues: Values): Record<string, Json> {
  const phone = obj(obj(columnValues._override).mobile);
  return defined({ padding: sides(phone.padding), border: phone.border === undefined ? undefined : readBorder(phone.border) });
}

/** A column as a Column: its id, its share, its box and padding, its phone values and hiding. */
function columnOf(columnValues: Values, children: Node[], share: string | undefined, say: (message: string) => void): Node {
  const hidden = readHidden("column", "Column", columnValues, say);
  const phone = { ...phoneOf(columnValues), ...hidden.mobile };
  const id = givenId(columnValues);
  const radius = readRadius(columnValues.borderRadius);
  if (radius === undefined && columnValues.borderRadius) say(`a column's border radius ${JSON.stringify(columnValues.borderRadius)} isn't one Elements draws: left out`);
  const style = defined({
    width: share,
    padding: some(sides(columnValues.padding) ?? ZERO),
    backgroundColor: color(columnValues.backgroundColor),
    border: readBorder(columnValues.border),
    borderRadius: radius || undefined,
    ...hidden.style,
  });
  return {
    type: "Column",
    ...(id ? { id } : {}),
    ...(Object.keys(style).length ? { style } : {}),
    ...(Object.keys(phone).length ? { mobile: phone } : {}),
    ...(hidden.hidden.mobile || hidden.hidden.desktop ? { hidden: hidden.hidden } : {}),
    children,
  };
}

/**
 * What the builder draws as tall as its row, a Row's: its columns are stretched to the row's height, so a background
 * every column has, and a line along the top or the bottom of each, are one across the row (the new email's columns
 * end with their content), taken off the columns. Where the columns stack on phones, each draws the lines again
 * there, as the builder's do, and the Row none (as today's rows were drawn).
 */
function stretched(columns: Node[], stacks: boolean): { style: Record<string, Json>; mobile?: Record<string, Json> } {
  if (columns.length < 2) return { style: {} };
  const style = (column: Node) => (column.style ?? {}) as Record<string, any>;
  const same = (values: unknown[]) => values[0] !== undefined && values.every((value) => JSON.stringify(value) === JSON.stringify(values[0]));
  const out: Record<string, Json> = {};
  const backgrounds = columns.map((column) => style(column).backgroundColor);
  if (same(backgrounds) && columns.every((column) => style(column).borderRadius === undefined)) out.backgroundColor = backgrounds[0];
  const lines: Record<string, Json> = {};
  for (const side of ["top", "bottom"] as const) {
    const each = columns.map((column) => style(column).border?.[side]);
    if (same(each)) lines[side] = each[0];
  }
  if (!out.backgroundColor && !Object.keys(lines).length) return { style: {} };
  for (const column of columns) {
    const { backgroundColor, border, ...rest } = style(column);
    const own = Object.fromEntries(Object.entries(border ?? {}).filter(([side]) => !(side in lines)));
    const kept = { ...rest, ...(out.backgroundColor === undefined && backgroundColor !== undefined ? { backgroundColor } : {}), ...(Object.keys(own).length ? { border: own } : {}) };
    if (Object.keys(kept).length) column.style = kept as Record<string, Json>;
    else delete column.style;
    if (stacks && Object.keys(lines).length && !column.mobile?.border) column.mobile = { ...column.mobile, border: { ...own, ...lines } as Json };
  }
  if (!Object.keys(lines).length) return { style: out };
  return { style: { ...out, border: lines }, ...(stacks ? { mobile: { border: Object.fromEntries(Object.keys(lines).map((side) => [side, "none"])) } } : {}) };
}

export function readRow(row: Values, where: string, at: Where): Node[] {
  // A value an item doesn't have is its tool's default, as the builder gives it.
  const values = { ...RowDefaults, ...obj(row.values) } as Values;
  const columns = arr(row.columns).map(obj).map((column) => ({ ...column, values: { ...ColumnDefaults, ...obj(column.values) } }));
  const say = at.context(where).say;
  if (!columns.length) {
    say("a row with no columns: left out");
    return [];
  }
  sayUnread("row", obj(row.values), undefined, say);
  arr(row.columns).forEach((column, c) => sayUnread("column", obj(obj(column).values), undefined, at.context(`${where}.columns[${c}]`).say));
  const rowHidden = readHidden("row", "Row", values, say);
  const { border: sectionBorder, ...rowOwn } = rowHidden.style;
  const alignItems = typeof values.alignItems === "string" && Object.hasOwn(ALIGN_ITEMS, values.alignItems) ? ALIGN_ITEMS[values.alignItems] : undefined;
  const rowStyle = defined({ backgroundColor: color(values.columnsBackgroundColor), ...(alignItems && alignItems !== "start" ? { alignItems } : {}), ...rowOwn });
  const layout = columns.length > 1 || Object.keys(rowStyle).length > 0;
  // (A row with an id of its own is a Section, which holds it.)
  const band = !!(givenId(values) && !layout) || color(values.backgroundColor) !== undefined || sectionBorder !== undefined;
  const padding = sides(values.padding) ?? ZERO;
  // Its padding on phones, where it's another.
  const given = sides(obj(obj(values._override).mobile).padding);
  const phonePadding = given && JSON.stringify(given) !== JSON.stringify(padding) ? given : undefined;

  const cells = arr(row.cells).map((cell) => (typeof cell === "number" && cell > 0 ? cell : 0));
  const stacks = values.noStackMobile !== true && obj(obj(values._override).mobile).noStackMobile !== true;
  const contents = columns.map((column, c) => blocksOf(column, `${where}.columns[${c}]`, at, { body: at.body, row: values, cells: cells.length === columns.length ? cells : columns.map(() => 1), index: c, stacks }));
  if (layout && contents.some((blocks) => blocks.some((node) => node.type === "PageBreak"))) {
    say("a page break in a column beside others: a page break is the Document's, between its pages: left out");
    contents.forEach((blocks, c) => (contents[c] = blocks.filter((node) => node.type !== "PageBreak")));
  }

  /** The row's content: a Row of its columns, a box, or its blocks with its space. */
  const content = (blocks: Node[][]): Node[] => {
    if (layout) {
      const total = cells.reduce((sum, cell) => sum + cell, 0);
      const shares = columns.length > 1 && total > 0 && cells.length === columns.length;
      if (columns.length > 1 && !shares) say("its columns' widths can't be read: they share the row equally");
      const id = givenId(values);
      const children = columns.map((column, c) => columnOf(obj(column.values), blocks[c], shares ? `${Math.round((cells[c] / total) * 10000) / 100}%` : undefined, say));
      const row = stretched(children, stacks);
      const mobile = { ...rowHidden.mobile, ...row.mobile, ...(phonePadding && !band ? { padding: phonePadding } : {}) };
      return [
        {
          type: "Row",
          ...(id && !band ? { id } : {}),
          ...(stacks ? {} : { props: { stackOnMobile: false } }),
          style: defined({ ...rowStyle, ...row.style, padding: band ? undefined : some(padding) }),
          ...(Object.keys(mobile).length ? { mobile } : {}),
          children,
        },
      ];
    }
    const column = columnOf(obj(columns[0].values), blocks[0], undefined, say);
    const space = band ? ZERO : padding;
    // The row's padding on phones, where no band holds it.
    const phone = band ? undefined : phonePadding;
    if (BOX.some((key) => column.style?.[key] !== undefined) || column.hidden || column.mobile || column.id) {
      // A box: the row's space around it is a Row's padding, where there's no band to hold it.
      return some(space) || phone ? [{ type: "Row", ...(some(space) ? { style: { padding: space } } : {}), ...(phone ? { mobile: { padding: phone } } : {}), children: [column] }] : [column];
    }
    const inner = (column.style?.padding as Sides | undefined) ?? ZERO;
    const own = add(space, inner);
    // Space that's another on phones is a Column's around the blocks, the column's own inside it.
    if (phone) return [{ type: "Column", ...(some(own) ? { style: { padding: own } } : {}), mobile: { padding: add(phone, inner) }, ...(blocks[0].length ? { children: blocks[0] } : {}) }];
    // A row with nothing in it but space is that space; with nothing at all, nothing.
    if (!blocks[0].length) return some(own) ? [{ type: "Column", style: { padding: own } }] : [];
    return fold(blocks[0], own);
  };

  /** The content in the row's band (a Section, or in a header or footer a box), hidden where the row is. */
  const banded = (nodes: Node[]): Node[] => {
    const visibility = hiddenOn(values);
    if (!band) return visibility ? nodes.map((node) => ({ ...node, hidden: { ...node.hidden, ...visibility } })) : nodes;
    const id = givenId(values);
    const style = defined({ backgroundColor: color(values.backgroundColor), border: sectionBorder, padding: some(padding) });
    return [{ type: at.part ? "Column" : "Section", ...(id ? { id } : {}), style, ...(phonePadding ? { mobile: { padding: phonePadding } } : {}), ...(visibility ? { hidden: visibility } : {}), children: nodes }];
  };

  if (!layout && contents[0].some((node) => node.type === "PageBreak")) {
    const runs: Node[][] = [[]];
    for (const node of contents[0]) {
      if (node.type === "PageBreak") runs.push([]);
      else runs[runs.length - 1].push(node);
    }
    // A row holding only a page break is the Document's page break.
    return runs.flatMap((run, i) => [...(i ? [{ type: "PageBreak" }] : []), ...(run.length ? banded(content([run])) : [])]);
  }
  return banded(content(contents));
}
