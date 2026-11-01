/**
 * Layouts made of the others (RFC 0001, step 8). A Grid is a component of its own in the template (validated,
 * described, a block of its own in the builder's design) and, before layout, the Rows of Columns it is: the resolver
 * and every writer lay out only those, so a Grid draws the same in every output with nothing of its own to support.
 */
import { defineComponent, prop, type SupportByTarget } from "./define";
import { boolean, enumOf, number } from "./kinds";
import type { Json, Node } from "./model";
import { boxStyle, css, inheritedTextStyle, layoutStyle, pick, placementStyle } from "./styles";

const WRITTEN: SupportByTarget = { email: { level: "full", source: "writer" }, web: { level: "full", source: "writer" } };

/** Styles of a Grid that are its box's (the Column it is), not its rows'. */
const BOX = [...Object.keys(boxStyle), "flex", ...Object.keys(inheritedTextStyle)];

const only = (style: Record<string, Json> | undefined, keys: readonly string[]) => {
  const out = Object.fromEntries(Object.entries(style ?? {}).filter(([key]) => keys.includes(key)));
  return Object.keys(out).length ? out : undefined;
};

/** A Grid as the Column of Rows it is: its children `columns` to a Row, each in a cell of equal width (the last Row's empty cells too). */
function arrangeGrid(node: Node): Node {
  const columns = Math.max(1, Math.floor(Number(node.props?.columns ?? 2)));
  const stackOnMobile = node.props?.stackOnMobile !== false;
  const style = node.style ?? {};
  const gap = style.gap;
  const rowGap = style.rowGap ?? gap;
  const children = (node.children ?? []).filter((child): child is Node => typeof child === "object" && child !== null);
  const rows: Node[] = [];
  for (let start = 0; start < children.length; start += columns) {
    const cells: Node[] = children.slice(start, start + columns).map((child) => ({ type: "Column", children: [child] }));
    // The last Row's empty cells keep its cells as wide as the others; on phones, where the cells stack, they're not drawn.
    while (cells.length < columns) cells.push({ type: "Column", hidden: { mobile: true }, children: [] });
    const mobileGap = node.mobile?.gap;
    rows.push({
      type: "Row",
      props: { stackOnMobile },
      style: { ...(gap !== undefined ? { gap } : {}), ...(style.alignItems !== undefined ? { alignItems: style.alignItems } : {}) },
      ...(mobileGap !== undefined ? { mobile: { gap: mobileGap } } : {}),
      children: cells,
    });
  }
  const box = only(style, BOX);
  const mobileBox = only(node.mobile, BOX);
  const mobileRowGap = node.mobile?.rowGap ?? node.mobile?.gap;
  return {
    type: "Column",
    ...(node.id ? { id: node.id } : {}),
    style: { ...box, ...(rowGap !== undefined ? { gap: rowGap } : {}) },
    ...(mobileBox || mobileRowGap !== undefined ? { mobile: { ...mobileBox, ...(mobileRowGap !== undefined ? { gap: mobileRowGap } : {}) } } : {}),
    ...(node.hidden ? { hidden: node.hidden } : {}),
    ...(node.compat ? { compat: node.compat } : {}),
    children: rows,
  };
}

export const Grid = defineComponent({
  type: "Grid",
  label: "Grid",
  description: "Its children in columns of equal width, row after row; on phones, one under another.",
  categories: ["layout", "block"],
  props: {
    columns: prop(number({ min: 1, max: 12, integer: true }), { support: WRITTEN, label: "Columns", description: "How many children to a row.", default: 2 }),
    stackOnMobile: prop(boolean(), { support: WRITTEN, label: "Stack on phones", description: "Its children one under another on phones (in an Email or a Page).", default: true }),
  },
  style: {
    ...inheritedTextStyle,
    ...boxStyle,
    gap: { ...layoutStyle.gap, description: "Space between its children, across and down (unless rowGap is set)." },
    rowGap: { ...layoutStyle.gap, label: "Row gap", description: "Space between its rows (gap by default); on phones, where the children stack, gap is between them." },
    alignItems: { ...layoutStyle.alignItems, description: "Where each child sits in its row's height, as CSS align-items." },
    ...placementStyle,
  },
  children: { categories: ["layout", "block"] },
  sizing: "stretch",
  targets: { email: {}, web: {} },
  editor: {
    groups: [
      { title: "Grid", paths: ["props.columns", "props.stackOnMobile", "style.gap", "style.rowGap", "style.alignItems"] },
      { title: "Box", paths: ["style.backgroundColor", "style.padding", "style.border", "style.borderRadius", "style.width"] },
    ],
  },
  arrange: arrangeGrid,
});

/**
 * A Layer's children over each other, each in its whole box (as CSS grid places children in one cell): an image with
 * words on it. On a page any children go; an email draws one shape of it, an Image as wide as the Layer with one child
 * over it, the image as the cell's background (which Outlook gets as VML), and reports any other.
 */
export const Layer = defineComponent({
  type: "Layer",
  label: "Layer",
  description: "Its children over each other, in one box as tall as the tallest: an image with words on it. In an email, an Image with one child over it.",
  categories: ["layout", "block"],
  props: {},
  style: {
    ...inheritedTextStyle,
    ...pick(boxStyle, "width", "minWidth", "maxWidth", "backgroundColor", "border", "borderRadius"),
    height: { ...boxStyle.height, description: "Its height: the image under its children covers it, cut at its sides or its top and bottom." },
    alignItems: {
      ...layoutStyle.alignItems,
      description: "Where its children sit in its height, as CSS align-items.",
      support: { email: { level: "partial", values: ["stretch"], shows: "the child over the image as tall as its content", source: "writer" }, web: css },
    },
    justifyItems: {
      kind: enumOf(["start", "center", "end", "stretch"]),
      label: "Justify items",
      description: "Where its children sit across its width, as CSS justify-items: stretched to it by default.",
      support: { email: { level: "full", source: "writer" }, web: css },
    },
    ...placementStyle,
  },
  defaultStyle: { alignItems: "start", justifyItems: "stretch" },
  children: { categories: ["layout", "block"] },
  sizing: "stretch",
  targets: { email: { note: "An Image as wide as the Layer, with one child over it" }, web: {} },
  editor: {
    groups: [
      { title: "Layer", paths: ["style.height", "style.alignItems", "style.justifyItems"] },
      { title: "Box", paths: ["style.backgroundColor", "style.border", "style.borderRadius", "style.width"] },
    ],
  },
});
