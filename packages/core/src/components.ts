/**
 * The components' definitions: Email, Page, Section, layouts, text, links,
 * buttons, images, dividers, lists and tables; grids, layers, documents,
 * canvases and shapes follow in their own steps.
 */
import { defineComponent, prop, type ComponentDefinition, type CompositeEditor } from "./define";
import { asset, boolean, enumOf, insets, length, line, link, number, text } from "./kinds";
import type { Json } from "./model";
import { boxStyle, inheritedTextStyle, layoutStyle, pick, placementStyle, textStyle } from "./styles";

const ROOT_PROPS = {
  title: prop(text(), { label: "Title", description: "The document's title (shown in a browser tab, and by some email clients)." }),
  lang: prop(text({ maxLength: 35 }), { label: "Language", description: 'Its language, as a BCP 47 tag ("en", "ar").' }),
  dir: prop(enumOf(["ltr", "rtl", "auto"]), { label: "Text direction" }),
};

/** A root's own style: the window's background, the text styles its content inherits, and how it stacks its children. */
const ROOT_STYLE = {
  ...inheritedTextStyle,
  backgroundColor: { ...boxStyle.backgroundColor, label: "Background color", description: "The window's background, behind the content." },
  ...pick(layoutStyle, "gap", "alignItems"),
};

const ROOT_DEFAULT_STYLE = {
  color: "#000000",
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: 16,
  fontWeight: 400,
  lineHeight: 1.5,
  textAlign: "left",
} as const;

const TEXT_EDITOR = { title: "Text", paths: ["style.fontFamily", "style.fontSize", "style.fontWeight", "style.color", "style.lineHeight", "style.letterSpacing", "style.textAlign"] };
const SPACING_EDITOR = { title: "Spacing", paths: ["style.padding"] };

export const Email = defineComponent({
  type: "Email",
  label: "Email",
  description: "An email. Its children are stacked down the content width, centered in the window.",
  categories: ["root"],
  props: {
    width: prop(length(["px"], { min: 200 }), { label: "Content width", default: 600 }),
    previewText: prop(text(), { label: "Preview text", description: "Shown after the subject in inbox lists, not in the email." }),
    ...ROOT_PROPS,
  },
  style: ROOT_STYLE,
  defaultStyle: ROOT_DEFAULT_STYLE,
  children: { categories: ["section", "layout", "block"] },
  sizing: "none",
  responsive: true,
  targets: { email: {} },
  editor: {
    groups: [
      { title: "Email", paths: ["props.width", "props.previewText", "props.title"] },
      { title: "Background", paths: ["style.backgroundColor"] },
      TEXT_EDITOR,
    ],
  },
});

export const Page = defineComponent({
  type: "Page",
  label: "Page",
  description: "A web page. Its children are stacked down the content width, centered in the window.",
  categories: ["root"],
  props: {
    width: prop(length(["px"], { min: 200 }), { label: "Content width", description: "The widest the content gets.", default: 1200 }),
    description: prop(text(), { label: "Description", description: "The page's meta description." }),
    ...ROOT_PROPS,
  },
  style: ROOT_STYLE,
  defaultStyle: ROOT_DEFAULT_STYLE,
  children: { categories: ["section", "layout", "block"] },
  sizing: "none",
  responsive: true,
  targets: { web: {} },
  editor: {
    groups: [
      { title: "Page", paths: ["props.width", "props.title", "props.description"] },
      { title: "Background", paths: ["style.backgroundColor"] },
      TEXT_EDITOR,
    ],
  },
});

export const Section = defineComponent({
  type: "Section",
  label: "Section",
  description: "A band across the whole window, directly in an Email or Page: its background spans the window, its children are stacked at the content width.",
  categories: ["section"],
  props: {},
  style: { ...inheritedTextStyle, ...pick(boxStyle, "backgroundColor", "padding", "border"), ...pick(layoutStyle, "gap", "alignItems") },
  children: { categories: ["layout", "block"] },
  sizing: "stretch",
  targets: { email: {}, web: {} },
  editor: { groups: [{ title: "Section", paths: ["style.backgroundColor", "style.padding", "style.border", "style.gap"] }, TEXT_EDITOR] },
});

export const Row = defineComponent({
  type: "Row",
  label: "Row",
  description: "Lays its children out side by side. A child takes its width, or a share of what's left (its flex, 1 by default).",
  categories: ["layout", "block"],
  props: {
    stackOnMobile: prop(boolean(), { label: "Stack on phones", description: "Its children stack full-width on phones (in an Email or a Page).", default: true }),
  },
  style: {
    ...inheritedTextStyle,
    ...boxStyle,
    ...layoutStyle,
    alignItems: {
      ...layoutStyle.alignItems,
      email: { level: "partial", values: ["stretch"], shows: "children not stretched to one height: each background or border ends with its content", source: "writer" },
    },
    justifyContent: {
      ...layoutStyle.justifyContent,
      email: { level: "none", values: ["space-between"], shows: "children start at the left", source: "writer" },
    },
    flexWrap: {
      kind: enumOf(["nowrap", "wrap"]),
      label: "Wrap",
      description: '"wrap": children that don\'t fit wrap onto another line, as CSS flex-wrap (web only).',
      email: { level: "none", values: ["wrap"], shows: "children on one line on desktop, stacked on phones", source: "writer" },
    },
    ...placementStyle,
  },
  children: { categories: ["layout", "block"] },
  sizing: "stretch",
  targets: { email: {}, web: {} },
  editor: {
    groups: [
      { title: "Layout", paths: ["style.gap", "style.alignItems", "style.justifyContent", "props.stackOnMobile"] },
      { title: "Box", paths: ["style.backgroundColor", "style.padding", "style.border", "style.borderRadius"] },
    ],
  },
});

export const Column = defineComponent({
  type: "Column",
  label: "Column",
  description: "Stacks its children vertically, with its own spacing and box.",
  categories: ["layout", "block"],
  props: {},
  style: {
    ...inheritedTextStyle,
    ...boxStyle,
    ...layoutStyle,
    justifyContent: {
      ...layoutStyle.justifyContent,
      email: { level: "partial", values: ["center", "end", "space-between"], shows: "no effect: its children start at the top", source: "writer" },
    },
    ...placementStyle,
  },
  children: { categories: ["layout", "block"] },
  sizing: "stretch",
  targets: { email: {}, web: {} },
  editor: {
    groups: [
      { title: "Layout", paths: ["style.gap", "style.alignItems"] },
      { title: "Box", paths: ["style.backgroundColor", "style.padding", "style.border", "style.borderRadius", "style.width"] },
    ],
  },
});

const TEXT_BLOCK_STYLE = {
  ...textStyle,
  ...pick(boxStyle, "width", "maxWidth", "padding", "backgroundColor", "border", "borderRadius"),
  ...placementStyle,
};
const TEXT_CHILDREN = { text: true, categories: ["inline"] } as const;

export const Text = defineComponent({
  type: "Text",
  label: "Text",
  description: "A block of text with no meaning of its own (a div).",
  categories: ["block"],
  props: {},
  style: TEXT_BLOCK_STYLE,
  children: TEXT_CHILDREN,
  sizing: "stretch",
  targets: { email: {}, web: {} },
  editor: { groups: [TEXT_EDITOR, SPACING_EDITOR] },
});

export const Paragraph = defineComponent({
  type: "Paragraph",
  label: "Paragraph",
  description: "A paragraph of text.",
  categories: ["block"],
  props: {},
  style: TEXT_BLOCK_STYLE,
  children: TEXT_CHILDREN,
  sizing: "stretch",
  targets: { email: {}, web: {} },
  editor: { groups: [TEXT_EDITOR, SPACING_EDITOR] },
});

export const Heading = defineComponent({
  type: "Heading",
  label: "Heading",
  description: "A heading, from level 1 (the page's title) to 6.",
  categories: ["block"],
  props: {
    level: prop(enumOf([1, 2, 3, 4, 5, 6]), { label: "Level", default: 1 }),
  },
  style: TEXT_BLOCK_STYLE,
  defaultStyle: { fontWeight: 700, lineHeight: 1.25 },
  defaultStyleBy: {
    prop: "level",
    values: { 1: { fontSize: 32 }, 2: { fontSize: 24 }, 3: { fontSize: 20 }, 4: { fontSize: 18 }, 5: { fontSize: 16 }, 6: { fontSize: 14 } },
  },
  children: TEXT_CHILDREN,
  sizing: "stretch",
  targets: { email: {}, web: {} },
  editor: { groups: [{ title: "Heading", paths: ["props.level"] }, TEXT_EDITOR, SPACING_EDITOR] },
});

const RUN_STYLE = {
  ...pick(textStyle, "color", "fontFamily", "fontSize", "fontWeight", "fontStyle", "letterSpacing", "textTransform", "textDecoration"),
  backgroundColor: boxStyle.backgroundColor,
};

export const Span = defineComponent({
  type: "Span",
  label: "Span",
  description: "Styled text inside text.",
  categories: ["inline"],
  props: {},
  style: RUN_STYLE,
  children: { text: true, categories: ["inline"] },
  sizing: "none",
  targets: { email: {}, web: {} },
});

export const Link = defineComponent({
  type: "Link",
  label: "Link",
  description: "A link: text inside text, or around an Image.",
  categories: ["inline", "block"],
  props: {
    href: prop(link(), { label: "Link", required: true }),
  },
  style: { ...RUN_STYLE, ...placementStyle },
  defaultStyle: { color: "#0000ee", textDecoration: "underline" },
  hover: ["color", "textDecoration", "backgroundColor"],
  children: { text: true, categories: ["inline"], types: ["Image"] },
  sizing: "shrink",
  targets: { email: {}, web: {} },
  editor: { groups: [{ title: "Link", paths: ["props.href", "style.color", "style.textDecoration", "hover.color"] }] },
});

type ButtonColors = { color?: string; backgroundColor?: string; hoverColor?: string; hoverBackgroundColor?: string };

/** A button's colors, as one editor: the builder's button-color widget, for one. */
export const buttonColors: CompositeEditor<ButtonColors> = {
  editor: "buttonColors",
  covers: ["style.color", "style.backgroundColor", "hover.color", "hover.backgroundColor"],
  read: (node) => ({
    color: node.style?.color as string | undefined,
    backgroundColor: node.style?.backgroundColor as string | undefined,
    hoverColor: node.hover?.color as string | undefined,
    hoverBackgroundColor: node.hover?.backgroundColor as string | undefined,
  }),
  write: (value) => ({
    style: { color: value.color as Json | undefined, backgroundColor: value.backgroundColor as Json | undefined },
    hover: { color: value.hoverColor as Json | undefined, backgroundColor: value.hoverBackgroundColor as Json | undefined },
  }),
};

export const Button = defineComponent({
  type: "Button",
  label: "Button",
  description: "A link drawn as a button.",
  categories: ["block"],
  props: {
    href: prop(link(), { label: "Link", required: true }),
  },
  style: {
    ...textStyle,
    ...pick(boxStyle, "width", "maxWidth", "padding", "backgroundColor", "border", "borderRadius"),
    ...placementStyle,
  },
  defaultStyle: {
    color: "#ffffff",
    backgroundColor: "#0879a1",
    fontSize: 14,
    lineHeight: 1.2,
    textAlign: "center",
    padding: { top: 10, right: 20, bottom: 10, left: 20 },
    borderRadius: 4,
  },
  hover: ["color", "backgroundColor"],
  children: { text: true, types: ["Span", "MergeTag", "LineBreak"] },
  sizing: "shrink",
  targets: { email: {}, web: {} },
  editor: {
    groups: [
      { title: "Button", paths: ["props.href", "style.width"] },
      { title: "Colors", composite: buttonColors },
      TEXT_EDITOR,
      { title: "Spacing", paths: ["style.padding", "style.border", "style.borderRadius"] },
    ],
  },
});

export const Image = defineComponent({
  type: "Image",
  label: "Image",
  description: "An image in the content. Without a width it takes its own size, no wider than its parent.",
  categories: ["block"],
  props: {
    src: prop(asset(), { label: "Image", required: true }),
    alt: prop(text(), { label: "Alternate text", description: "Read out by screen readers, and shown where images don't load.", default: "" }),
  },
  style: {
    ...pick(boxStyle, "width", "maxWidth", "height", "border", "borderRadius"),
    ...placementStyle,
  },
  children: {},
  sizing: "shrink",
  targets: { email: {}, web: {} },
  editor: { groups: [{ title: "Image", paths: ["props.src", "props.alt", "style.width"] }, { title: "Box", paths: ["style.border", "style.borderRadius"] }] },
});

export const Divider = defineComponent({
  type: "Divider",
  label: "Divider",
  description: "A horizontal line.",
  categories: ["block"],
  props: {},
  style: {
    borderTop: { kind: line(), label: "Line", description: 'The line, as CSS border-top: "1px solid #bbbbbb".', email: { level: "full", source: "writer" } },
    width: { kind: length(["px", "%"]), label: "Length", mobile: true, email: { level: "full", source: "writer" } },
    padding: { kind: insets(), label: "Padding", mobile: true, email: { level: "full", source: "outlook-captures" } },
  },
  defaultStyle: { borderTop: { width: 1, style: "solid", color: "#bbbbbb" }, width: "100%" },
  children: {},
  sizing: "stretch",
  targets: { email: {}, web: {} },
  editor: { groups: [{ title: "Line", paths: ["style.borderTop", "style.width"] }, SPACING_EDITOR] },
});

export const LineBreak = defineComponent({
  type: "LineBreak",
  label: "Line break",
  description: "Starts a new line inside text.",
  categories: ["inline"],
  props: {},
  style: {},
  children: {},
  sizing: "none",
  targets: { email: {}, web: {} },
});

export const MergeTag = defineComponent({
  type: "MergeTag",
  label: "Merge tag",
  description: "A value the sending service fills in (a name, a link), written in the service's own syntax.",
  categories: ["inline"],
  props: {
    name: prop(text({ maxLength: 200 }), { label: "Name", required: true }),
  },
  style: {},
  children: {},
  sizing: "none",
  targets: { email: {}, web: {} },
});

export const List = defineComponent({
  type: "List",
  label: "List",
  description: "A bulleted or numbered list of ListItems. Its markers sit in a column of their own (indent) before the items.",
  categories: ["block"],
  props: {
    type: prop(enumOf(["bullet", "number"]), { label: "Type", default: "bullet" }),
    start: prop(number({ min: 0, integer: true }), { label: "Starts at", description: "The first item's number, in a numbered list.", default: 1 }),
  },
  style: {
    ...inheritedTextStyle,
    ...pick(boxStyle, "width", "maxWidth", "padding", "backgroundColor", "border"),
    gap: { kind: length(["px"]), label: "Gap", description: "Space between items.", mobile: true, email: { level: "full", source: "writer" } },
    indent: { kind: length(["px"], { min: 0 }), label: "Indent", description: "The width of the markers' column, before the items.", email: { level: "full", source: "writer" } },
    ...placementStyle,
  },
  defaultStyle: { indent: 24 },
  children: { types: ["ListItem"] },
  sizing: "stretch",
  targets: { email: {}, web: {} },
  editor: { groups: [{ title: "List", paths: ["props.type", "props.start", "style.gap", "style.indent"] }, TEXT_EDITOR, SPACING_EDITOR] },
});

export const ListItem = defineComponent({
  type: "ListItem",
  label: "List item",
  description: "An item of a List: text, and a List of its own to nest one.",
  categories: [],
  props: {},
  style: pick(textStyle, "color", "fontFamily", "fontSize", "fontWeight", "fontStyle", "lineHeight", "letterSpacing", "textAlign", "textTransform", "textDecoration"),
  children: { text: true, categories: ["inline"], types: ["List"] },
  sizing: "stretch",
  targets: { email: {}, web: {} },
  editor: { groups: [TEXT_EDITOR] },
});

export const Table = defineComponent({
  type: "Table",
  label: "Table",
  description: "A table of data: TableRows of TableCells. Columns take their cells' widths; the rest share what's left.",
  categories: ["block"],
  props: {},
  style: {
    ...inheritedTextStyle,
    ...pick(boxStyle, "width", "maxWidth", "backgroundColor", "border"),
    cellPadding: { kind: insets(), label: "Cell padding", description: "Every cell's padding, where the cell doesn't set its own.", email: { level: "full", source: "writer" } },
    rowBorder: { kind: line(), label: "Line between rows", email: { level: "full", source: "writer" } },
    ...placementStyle,
  },
  children: { types: ["TableRow"] },
  sizing: "stretch",
  targets: { email: {}, web: {} },
  editor: { groups: [{ title: "Table", paths: ["style.cellPadding", "style.rowBorder", "style.border", "style.backgroundColor"] }, TEXT_EDITOR] },
});

export const TableRow = defineComponent({
  type: "TableRow",
  label: "Table row",
  description: "A row of a Table. A header row's cells are header cells, in bold.",
  categories: [],
  props: {
    header: prop(boolean(), { label: "Header", description: "Its cells head the columns below them.", default: false }),
  },
  style: { ...pick(textStyle, "color", "fontFamily", "fontSize", "fontWeight", "fontStyle", "lineHeight", "letterSpacing", "textAlign", "textTransform"), backgroundColor: boxStyle.backgroundColor },
  defaultStyleBy: { prop: "header", values: { true: { fontWeight: 700 } } },
  children: { types: ["TableCell"] },
  sizing: "stretch",
  targets: { email: {}, web: {} },
  editor: { groups: [{ title: "Row", paths: ["props.header", "style.backgroundColor"] }, TEXT_EDITOR] },
});

export const TableCell = defineComponent({
  type: "TableCell",
  label: "Table cell",
  description: "A cell of a TableRow: text, and images. Its width sets its column's.",
  categories: [],
  props: {
    colSpan: prop(number({ min: 1, integer: true }), { label: "Columns", description: "How many columns it spans.", default: 1 }),
  },
  style: {
    ...textStyle,
    ...pick(boxStyle, "padding", "backgroundColor", "border"),
    width: { kind: length(["px", "%"]), label: "Width", description: "Its column's width (of a cell spanning one column).", email: { level: "full", source: "writer" } },
    verticalAlign: { kind: enumOf(["top", "middle", "bottom"]), label: "Vertical alignment", email: { level: "full", source: "caniemail" } },
  },
  children: { text: true, categories: ["inline"], types: ["Image"] },
  sizing: "none",
  targets: { email: {}, web: {} },
  editor: { groups: [{ title: "Cell", paths: ["props.colSpan", "style.width", "style.verticalAlign"] }, TEXT_EDITOR, { title: "Box", paths: ["style.padding", "style.backgroundColor", "style.border"] }] },
});

export const COMPONENTS: Readonly<Record<string, ComponentDefinition>> = Object.freeze(
  Object.fromEntries(
    [Email, Page, Section, Row, Column, Text, Paragraph, Heading, Span, Link, Button, Image, Divider, LineBreak, MergeTag, List, ListItem, Table, TableRow, TableCell].map((d) => [
      d.type,
      d as unknown as ComponentDefinition,
    ])
  )
);

export function definitionOf(type: string): ComponentDefinition | undefined {
  return Object.prototype.hasOwnProperty.call(COMPONENTS, type) ? COMPONENTS[type] : undefined;
}
