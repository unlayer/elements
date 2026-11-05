/**
 * A Row as a row of the builder's, its children as columns (their widths, and their share of its gap and side
 * padding, the columns' widths and padding; its border theirs, as the builder stretches them to its height), and a box
 * directly in the root or a Section as a row of its own column.
 */
import type { Json, Node, ResolvedNode } from "@unlayer-internal/elements-core";
import { columnWith, rowWith, type Block, type Row, type RowFields } from "./design";
import { hiddenOf, merge } from "./hide";
import { blockTool, type Place } from "./tools";
import { builderBorder, cssPx, cssSides, encode, type Values } from "./values";

export type Sides = { top: number; right: number; bottom: number; left: number };
type Child = { child: Node; path: string };

export const ZERO: Sides = { top: 0, right: 0, bottom: 0, left: 0 };
export const add = (a: Sides, b: Partial<Sides>): Sides => ({ top: a.top + (b.top ?? 0), right: a.right + (b.right ?? 0), bottom: a.bottom + (b.bottom ?? 0), left: a.left + (b.left ?? 0) });
export const padding = (node: { style?: Record<string, Json> }): Sides => (node.style?.padding as Sides | undefined) ?? ZERO;
export const gapOf = (node: ResolvedNode) => (typeof node.style.gap === "number" ? node.style.gap : 0);
/** A box with a look of its own: a Column that can't fold into the blocks around it. */
const BOX = ["backgroundColor", "border", "borderRadius", "width", "minWidth", "maxWidth", "height", "overflow", "justifyContent"];
export const hasBox = (node: Node) => BOX.some((key) => node.style?.[key] !== undefined) || Boolean(node.hidden);
/** A builder row's hiding, from the node it's made of. */
export const hiding = (node: Node) => ({ hideOnMobile: node.hidden?.mobile || undefined, hideOnDesktop: node.hidden?.desktop || undefined });

/** What a row needs from the template it's in (raise.tsx). */
export interface Writer {
  at(path: string): ResolvedNode;
  put<T extends { values: Values }>(made: T, values?: Values): T;
  sayLeftOut(tool: string, node: Node, path: string, fields: readonly string[]): void;
  place: Place;
  childrenOf(node: Node, path: string): Child[];
  stack(node: Node, path: string, own: ResolvedNode, around: Sides): Block[];
}

/** An id the template gives a row or a column, as the builder's. */
export const builderId = (id: string | undefined, htmlClassNames: string): Values => (id ? { _meta: { htmlID: id, htmlClassNames } } : {});

/** A row of the builder's for a Row: each child a column, its width and its share of the gap its column's. */
export function rowOf({ at, put, sayLeftOut, place, childrenOf, stack }: Writer, node: Node, path: string, band: Values, outer: Sides, bandHidden: Values, arranged?: ResolvedNode): Row {
  const own = arranged ?? at(path);
  const gap = gapOf(own);
  const rowPad = add(padding(node), outer);
  const all = childrenOf(node, path);
  const n = all.length;
  if (!arranged && node.mobile?.border !== undefined) place.report.push(`${path}: the builder's row has no border on phones: left out`);
  if (!arranged) sayLeftOut("row", node, path, ["style.padding", "style.gap", "mobile.gap", "style.backgroundColor", "style.border", "mobile.border", "style.alignItems", "props.stackOnMobile", ...TEXT_FOLDED]);
  const stacks = node.props?.stackOnMobile !== false;
  const rowBorder = (own.style.border as Record<string, Json> | undefined) ?? {};
  const columns = all.map(({ child, path: childPath }, i) => {
    // A child hidden on desktop takes no room there: the least share a column can have in the builder.
    const width = child.hidden?.desktop ? 0 : (at(childPath)?.width ?? 0);
    // The Row's top and bottom padding is the builder's row's; its sides and its gap, the columns' own.
    const halves: Sides = { top: 0, bottom: 0, left: i > 0 ? gap / 2 : rowPad.left, right: i < n - 1 ? gap / 2 : rowPad.right };
    const share = width + halves.left + halves.right;
    const isColumn = child.type === "Column";
    const style = child.style ?? {};
    // The Row's border is its columns' in the builder, which stretches them to the row's height: top and bottom on
    // each, its sides on the first and last. The column's own over it.
    const fromRow = { top: rowBorder.top, bottom: rowBorder.bottom, ...(i === 0 ? { left: rowBorder.left } : {}), ...(i === n - 1 ? { right: rowBorder.right } : {}) };
    const lines = Object.fromEntries(Object.entries({ ...fromRow, ...((isColumn ? style.border : undefined) as object) }).filter(([, line]) => line !== undefined));
    const columnPadding = isColumn ? add(padding(child), halves) : halves;
    // Where the columns stack on phones, each is as wide as the row (its sides only the Row's), the phone gap above
    // all but the first.
    const phoneGap = typeof own.mobile?.gap === "number" ? own.mobile.gap : gap;
    const ownPhone = isColumn ? ((child.mobile?.padding as Sides | undefined) ?? padding(child)) : ZERO;
    const phonePadding = stacks && n > 1 ? add(ownPhone, { left: rowPad.left, right: rowPad.right, top: i > 0 ? phoneGap : 0 }) : isColumn ? (child.mobile?.padding as Sides | undefined) : undefined;
    if (isColumn && !arranged) sayLeftOut("column", child, childPath, ["style.padding", "mobile.padding", "style.backgroundColor", "style.border", "mobile.border", "style.borderRadius", "style.width", "style.flex", "style.gap", "style.alignItems", ...TEXT_FOLDED]);
    const columnOwn = isColumn ? at(childPath) : own;
    const contents = isColumn ? stack(withoutPadding(child), childPath, columnOwn, ZERO) : ([] as Block[]).concat(blockTool(child, childPath, own, ZERO, place));
    const element = columnWith(
      {
        padding: cssSides(columnPadding),
        backgroundColor: isColumn ? (style.backgroundColor as string | undefined) : undefined,
        border: builderBorder(lines as never),
        borderRadius: isColumn && style.borderRadius !== undefined ? (encode("radius", style.borderRadius) as string) : undefined,
      },
      contents
    );
    // Its phone padding (where the columns stack, the Row's sides and gap in it) and border, as the builder's phone values.
    const phone = { ...(phonePadding && cssSides(phonePadding) !== cssSides(columnPadding) ? { padding: cssSides(phonePadding) } : {}), ...(isColumn && child.mobile?.border ? { border: builderBorder(child.mobile.border as never) } : {}) };
    return { share, element: put(element, merge(merge(isColumn ? hiddenOf("column", child) : {}, isColumn ? builderId(child.id, "u_column") : {}), Object.keys(phone).length ? { _override: { mobile: phone } } : {})) };
  });
  const alignItems = own.style.alignItems as string | undefined;
  // The band's (a Section's background and hiding) over the Row's own.
  const fields: RowFields = {
    padding: `${cssPx(rowPad.top)} 0px ${cssPx(rowPad.bottom)} 0px`,
    noStackMobile: node.props?.stackOnMobile === false || undefined,
    columnsBackgroundColor: own.style.backgroundColor as string | undefined,
    ...hiding(node),
    ...band,
  };
  const made = rowWith(
    columns.map((c) => Math.max(1, Math.round(c.share))),
    fields,
    columns.map((c) => c.element)
  );
  const values: Values = { ...(alignItems && alignItems !== "start" ? { alignItems: ALIGN_ITEMS[alignItems] } : {}), ...builderId(node.id, "u_row") };
  return put(made, merge(merge(values, arranged ? {} : hiddenOf("row", node, ["style.border"])), bandHidden));
}

/** A row of its own for a box directly in the root or a Section: one column, the box's. */
export function boxRowOf({ at, put, sayLeftOut, stack }: Writer, node: Node, path: string, band: Values, outer: Sides, bandHidden: Values): Row {
  const own = at(path);
  sayLeftOut("column", node, path, ["style.padding", "mobile.padding", "style.backgroundColor", "style.border", "mobile.border", "style.borderRadius", "style.gap", "style.alignItems", ...TEXT_FOLDED]);
  const style = node.style ?? {};
  const column = columnWith(
    {
      padding: cssSides(padding(node)),
      backgroundColor: style.backgroundColor as string | undefined,
      border: builderBorder(style.border as never),
      borderRadius: style.borderRadius !== undefined ? (encode("radius", style.borderRadius) as string) : undefined,
    },
    stack(withoutPadding(node), path, own, ZERO)
  );
  const { hidden: _, ...visible } = node;
  const made = rowWith([1], { padding: cssSides(outer), ...hiding(node), ...band }, [put(column, merge(merge(hiddenOf("column", visible as Node), builderId(node.id, "u_column")), phoneBox(node)))]);
  return put(made, bandHidden);
}

/** Text styles a container passes down, which its blocks take as their own in the builder. */
export const TEXT_FOLDED = ["color", "fontFamily", "fontSize", "fontWeight", "fontStyle", "lineHeight", "letterSpacing", "textAlign", "textTransform"].map((key) => `style.${key}`);

/** Elements' alignItems as the builder row's. */
const ALIGN_ITEMS: Record<string, string> = { start: "flex-start", center: "center", end: "flex-end", stretch: "stretch" };

/** A box's phone padding and border, as its column's phone values. */
function phoneBox(node: Node): Values {
  const phone = { ...(node.mobile?.padding ? { padding: cssSides(node.mobile.padding as Sides) } : {}), ...(node.mobile?.border ? { border: builderBorder(node.mobile.border as never) } : {}) };
  return Object.keys(phone).length ? { _override: { mobile: phone } } : {};
}

/** A Column's node without its padding (its column's, in the builder). */
function withoutPadding(node: Node): Node {
  const { padding: _padding, ...style } = node.style ?? {};
  return { ...node, style };
}
