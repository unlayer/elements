/**
 * The components' definitions: Email, Page, Section, layouts, text, links,
 * buttons, images, dividers, lists and tables; grids, layers, documents,
 * canvases and shapes follow in their own steps.
 */
import { defineComponent, prop, type ComponentDefinition, type CompositeEditor, type SupportByTarget } from "./define";
import { attributes, asset, boolean, enumOf, insets, length, line, link, number, text, video } from "./kinds";
import type { Json } from "./model";
import { boxStyle, css, inheritedTextStyle, layoutStyle, pick, placementStyle, textStyle } from "./styles";
import { Menu, Social } from "./composites";
import { Grid, Layer } from "./layouts";
import { ROOT_DEFAULT_STYLE, ROOT_PROPS, ROOT_STYLE, TEXT_EDITOR } from "./roots";
import { Document, DocumentPage, PageBreak, PageFooter, PageHeader, PageNumber } from "./document";
import { Canvas, SHAPES, Svg } from "./canvas";

/** A prop each output writes as given. */
const WRITTEN: SupportByTarget = { email: { level: "full", source: "writer" }, web: { level: "full", source: "writer" } };

/** A block of text's own direction, beside its neighbours' (an Arabic paragraph in an English email). */
const TEXT_DIR = {
  dir: prop(enumOf(["ltr", "rtl", "auto"]), { support: WRITTEN, label: "Text direction", description: "Its text's direction, where it differs from the template's; it starts on that side unless aligned otherwise." }),
};

const SPACING_EDITOR = { title: "Spacing", paths: ["style.padding"] };

export const Email = defineComponent({
  type: "Email",
  label: "Email",
  description: "An email. Its children are stacked down the content width, centered in the window.",
  categories: ["root"],
  props: {
    width: prop(length(["px"], { min: 200 }), { support: WRITTEN, label: "Content width", default: 600 }),
    previewText: prop(text(), { support: WRITTEN, label: "Preview text", description: "Shown after the subject in inbox lists, not in the email." }),
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
    width: prop(length(["px"], { min: 200 }), { support: WRITTEN, label: "Content width", description: "The widest the content gets.", default: 1200 }),
    description: prop(text(), { support: WRITTEN, label: "Description", description: "The page's meta description." }),
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
    stackOnMobile: prop(boolean(), { support: WRITTEN, label: "Stack on phones", description: "Its children stack full-width on phones (in an Email or a Page).", default: true }),
    ...TEXT_DIR,
  },
  style: {
    ...inheritedTextStyle,
    ...boxStyle,
    ...layoutStyle,
    alignItems: {
      ...layoutStyle.alignItems,
      support: { email: { level: "partial", values: ["stretch"], shows: "children not stretched to one height: each background or border ends with its content", source: "writer" }, web: css },
    },
    justifyContent: {
      ...layoutStyle.justifyContent,
      support: { email: { level: "none", values: ["space-between"], shows: "children start at the left", source: "writer" }, web: css },
    },
    flexWrap: {
      kind: enumOf(["nowrap", "wrap", "words"]),
      label: "Wrap",
      description: '"wrap": children that don\'t fit wrap onto another line, as CSS flex-wrap (in an email, in a Row kept side by side on phones). "words": in an email, also a space of the text\'s font apart, on lines at least as tall as its, as words are.',
      // A Row kept side by side wraps in an email (but classic Outlook, which the email's checks say where it matters).
      support: {
        email: { level: "none", values: ["wrap", "words"], when: (_, row) => row.props.stackOnMobile !== false, shows: "children on one line on desktop, stacked on phones", source: "writer" },
        web: css,
      },
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
      support: { email: { level: "partial", values: ["center", "end", "space-between"], shows: "no effect: its children start at the top", source: "writer" }, web: css },
    },
    breakAfter: { kind: enumOf(["page"]), label: "Break after", description: "\"page\": a printed page ends after it.", support: { email: { level: "none", shows: "no break: an email has no pages", source: "writer" }, web: css } },
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
  props: TEXT_DIR,
  style: TEXT_BLOCK_STYLE,
  children: { ...TEXT_CHILDREN, types: ["Image"] },
  sizing: "stretch",
  targets: { email: {}, web: {} },
  editor: { groups: [TEXT_EDITOR, SPACING_EDITOR] },
});

export const Paragraph = defineComponent({
  type: "Paragraph",
  label: "Paragraph",
  description: "A paragraph of text.",
  categories: ["block"],
  props: TEXT_DIR,
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
    level: prop(enumOf([1, 2, 3, 4, 5, 6]), { support: WRITTEN, label: "Level", default: 1 }),
    ...TEXT_DIR,
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
  description: "Styled text inside text; raised or lowered (superscript, subscript) with verticalAlign.",
  categories: ["inline"],
  props: {},
  style: {
    ...RUN_STYLE,
    verticalAlign: {
      kind: enumOf(["baseline", "super", "sub"]),
      label: "Raise or lower",
      description: '"super": superscript (®, a footnote mark); "sub": subscript; as CSS vertical-align.',
      // Written as <sup> and <sub>, which every client (Word too) raises and lowers.
      support: { email: { level: "full", source: "caniemail" }, web: css },
    },
  },
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
    href: prop(link(), { support: WRITTEN, label: "Link", required: true }),
    title: prop(text(), { support: WRITTEN, label: "Title", description: "Shown as a tooltip by mail clients and browsers that show one." }),
    "aria-label": prop(text(), { support: WRITTEN, label: "Label for screen readers", description: "What a screen reader says for it, where its text alone doesn't say enough (\"Read more about pricing\")." }),
    attrs: prop(attributes(), { support: WRITTEN, editable: false, label: "More attributes", description: "More attributes for it: a class, a `data-` attribute." }),
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
    href: prop(link(), { support: WRITTEN, label: "Link", required: true }),
    title: prop(text(), { support: WRITTEN, label: "Title", description: "Shown as a tooltip by mail clients and browsers that show one." }),
    "aria-label": prop(text(), { support: WRITTEN, label: "Label for screen readers", description: "What a screen reader says for it, where its text alone doesn't say enough (\"Read more about pricing\")." }),
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
    src: prop(asset(), { support: WRITTEN, label: "Image", required: true }),
    alt: prop(text(), { support: WRITTEN, label: "Alternate text", description: "Read out by screen readers, and shown where images don't load.", default: "" }),
    title: prop(text(), { support: WRITTEN, label: "Title", description: "Shown as a tooltip by mail clients and browsers that show one." }),
  },
  style: {
    ...pick(boxStyle, "width", "maxWidth", "height", "border", "borderRadius"),
    ...placementStyle,
    alignSelf: { kind: enumOf(["start", "center", "end"]), label: "Place", description: "Where it sits in its stack on phones, where that's another place than on desktop.", mobile: true, support: { email: { level: "full", source: "caniemail" }, web: css } },
    verticalAlign: { kind: enumOf(["top", "middle"]), label: "Place in its line", description: "Where it sits in a line of text it's in.", support: { email: { level: "full", source: "caniemail" }, web: css } },
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
    borderTop: { kind: line(), label: "Line", description: 'The line, as CSS border-top: "1px solid #bbbbbb".', support: { email: { level: "full", source: "writer" }, web: css } },
    width: { kind: length(["px", "%"]), label: "Length", mobile: true, support: { email: { level: "full", source: "writer" }, web: css } },
    padding: { kind: insets(), label: "Padding", mobile: true, support: { email: { level: "full", source: "outlook-captures" }, web: css } },
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
    name: prop(text({ maxLength: 200 }), { support: WRITTEN, label: "Name", required: true }),
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
    type: prop(enumOf(["bullet", "number"]), { support: WRITTEN, label: "Type", default: "bullet" }),
    start: prop(number({ min: 0, integer: true }), { support: WRITTEN, label: "Starts at", description: "The first item's number, in a numbered list.", default: 1 }),
  },
  style: {
    ...inheritedTextStyle,
    ...pick(boxStyle, "width", "maxWidth", "padding", "backgroundColor", "border"),
    gap: { kind: length(["px"]), label: "Gap", description: "Space between items.", mobile: true, support: { email: { level: "full", source: "writer" }, web: css } },
    indent: { kind: length(["px"], { min: 0 }), label: "Indent", description: "The width of the markers' column, before the items.", support: { email: { level: "full", source: "writer" }, web: css } },
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
  props: TEXT_DIR,
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
    cellPadding: { kind: insets(), label: "Cell padding", description: "Every cell's padding, where the cell doesn't set its own.", support: { email: { level: "full", source: "writer" }, web: css } },
    rowBorder: { kind: line(), label: "Line between rows", support: { email: { level: "full", source: "writer" }, web: css } },
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
    header: prop(boolean(), { support: WRITTEN, label: "Header", description: "Its cells head the columns below them.", default: false }),
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
    colSpan: prop(number({ min: 1, integer: true }), { support: WRITTEN, label: "Columns", description: "How many columns it spans.", default: 1 }),
    ...TEXT_DIR,
  },
  style: {
    ...textStyle,
    ...pick(boxStyle, "padding", "backgroundColor", "border"),
    width: { kind: length(["px", "%"]), label: "Width", description: "Its column's width (of a cell spanning one column).", support: { email: { level: "full", source: "writer" }, web: css } },
    verticalAlign: { kind: enumOf(["top", "middle", "bottom"]), label: "Vertical alignment", support: { email: { level: "full", source: "caniemail" }, web: css } },
  },
  children: { text: true, categories: ["inline"], types: ["Image"] },
  sizing: "none",
  targets: { email: {}, web: {} },
  editor: { groups: [{ title: "Cell", paths: ["props.colSpan", "style.width", "style.verticalAlign"] }, TEXT_EDITOR, { title: "Box", paths: ["style.padding", "style.backgroundColor", "style.border"] }] },
});

export const Video = defineComponent({
  type: "Video",
  label: "Video",
  description: "A YouTube or Vimeo video: its player on a page; in an email (which can't play one), its thumbnail, linked to it.",
  categories: ["block"],
  props: {
    src: prop(video(), { support: WRITTEN, label: "Video", required: true, description: "The video's YouTube or Vimeo link." }),
    thumbnail: prop(asset(), {
      support: { email: { level: "full", source: "writer" }, web: { level: "none", shows: "the video's player: a page plays the video", source: "writer" } },
      label: "Thumbnail",
      description: "The image an email shows, linked to the video. A YouTube video's own where there's none; a Vimeo video's can't be found without the network.",
    }),
    title: prop(text(), { support: WRITTEN, label: "Title", description: "The player's title on a page, the thumbnail's alternate text in an email.", default: "Video" }),
  },
  style: { ...pick(boxStyle, "width", "maxWidth"), ...placementStyle },
  children: {},
  sizing: "stretch",
  targets: { email: {}, web: {} },
  editor: { groups: [{ title: "Video", paths: ["props.src", "props.thumbnail", "props.title", "style.width", "style.maxWidth"] }] },
});

export const Raw = defineComponent({
  type: "Raw",
  label: "Raw HTML",
  description:
    "Markup another format holds that Elements has no component for (a builder block), written as it is, with the rules it needs in the stylesheet and what it reads as in plain text.",
  categories: ["block"],
  props: {
    html: prop(text(), { support: WRITTEN, label: "HTML", required: true, description: "The markup, written as it is." }),
    css: prop(text(), { support: WRITTEN, label: "CSS", description: "Rules for the stylesheet, written once however many nodes carry them." }),
    text: prop(text(), { support: WRITTEN, label: "Plain text", description: "What it reads as in the plain-text version." }),
  },
  style: {},
  children: {},
  sizing: "stretch",
  targets: { email: {}, web: {} },
  imported: true,
});

/**
 * Raw's authorable twin: markup no component says (the builder's HTML block), written as it is by the same writers.
 * A PDF and an image can't draw markup: they draw its plain text, and say so.
 */
export const Html = defineComponent({
  type: "Html",
  label: "HTML",
  description:
    "Markup written as it is, for what no component says (the builder's HTML block): in an email and on a page as given, nothing in it checked or escaped. A Document's PDF and a Canvas's image draw its plain text.",
  categories: ["block"],
  props: {
    html: prop(text(), { support: WRITTEN, label: "HTML", required: true, description: "The markup, written as it is: only markup you trust." }),
    text: prop(text(), { support: WRITTEN, label: "Plain text", description: "What it reads as in the plain-text version, and in a PDF or an image (its markup's words where there's none)." }),
  },
  style: {},
  children: {},
  sizing: "stretch",
  targets: { email: {}, web: {} },
  editor: { groups: [{ title: "HTML", paths: ["props.html", "props.text"] }] },
});

export const COMPONENTS: Readonly<Record<string, ComponentDefinition>> = Object.freeze(
  Object.fromEntries(
    [Email, Page, Document, DocumentPage, PageBreak, PageHeader, PageFooter, PageNumber, Canvas, Svg, ...SHAPES, Section, Row, Column, Grid, Layer, Text, Paragraph, Heading, Span, Link, Button, Image, Divider, LineBreak, MergeTag, List, ListItem, Table, TableRow, TableCell, Video, Social, Menu, Html, Raw].map((d) => [
      d.type,
      d as unknown as ComponentDefinition,
    ])
  )
);

export function definitionOf(type: string): ComponentDefinition | undefined {
  return Object.prototype.hasOwnProperty.call(COMPONENTS, type) ? COMPONENTS[type] : undefined;
}
