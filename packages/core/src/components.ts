/**
 * The components' definitions. This is the first slice (Email, Page, Section,
 * layouts, text, links, buttons, images, dividers); tables, lists, grids,
 * layers, documents, canvases and shapes follow in their own steps.
 */
import { defineComponent, prop, type ComponentDefinition, type CompositeEditor } from "./define";
import { asset, color, enumOf, insets, length, link, text } from "./kinds";
import type { Json } from "./model";
import { boxStyle, layoutStyle, pick, placementStyle, textStyle } from "./styles";

const ROOT_PROPS = {
  title: prop(text(), { label: "Title", description: "The document's title (shown in a browser tab, and by some email clients)." }),
  lang: prop(text({ maxLength: 35 }), { label: "Language", description: 'Its language, as a BCP 47 tag ("en", "ar").' }),
  dir: prop(enumOf(["ltr", "rtl", "auto"]), { label: "Text direction" }),
};

/** A root's own style: the window's background, the text styles its content inherits, and how it stacks its children. */
const ROOT_STYLE = {
  ...textStyle,
  backgroundColor: { ...boxStyle.backgroundColor, label: "Background color", description: "The window's background, behind the content." },
  ...pick(layoutStyle, "gap", "align"),
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
  style: { ...textStyle, ...pick(boxStyle, "backgroundColor", "padding", "border"), ...pick(layoutStyle, "gap", "align") },
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
  props: {},
  style: {
    ...textStyle,
    ...boxStyle,
    ...layoutStyle,
    wrap: {
      kind: enumOf(["stack", "none", "wrap"]),
      label: "On narrow screens",
      description: '"stack": children stack full-width on phones (the default in Email and Page); "none": they stay side by side; "wrap": they wrap onto more lines (web only).',
    },
    ...placementStyle,
  },
  children: { categories: ["layout", "block"] },
  sizing: "stretch",
  targets: { email: {}, web: {} },
  editor: {
    groups: [
      { title: "Layout", paths: ["style.gap", "style.align", "style.justify", "style.wrap"] },
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
  style: { ...textStyle, ...boxStyle, ...layoutStyle, ...placementStyle },
  children: { categories: ["layout", "block"] },
  sizing: "stretch",
  targets: { email: {}, web: {} },
  editor: {
    groups: [
      { title: "Layout", paths: ["style.gap", "style.align"] },
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
    color: { kind: color(), label: "Line color" },
    thickness: { kind: length(["px"], { min: 1 }), label: "Thickness" },
    lineStyle: { kind: enumOf(["solid", "dashed", "dotted"]), label: "Line style" },
    width: { kind: length(["px", "%"]), label: "Length", mobile: true },
    padding: { kind: insets(), label: "Padding", mobile: true },
    ...placementStyle,
  },
  defaultStyle: { color: "#bbbbbb", thickness: 1, lineStyle: "solid", width: "100%" },
  children: {},
  sizing: "stretch",
  targets: { email: {}, web: {} },
  editor: { groups: [{ title: "Line", paths: ["style.color", "style.thickness", "style.lineStyle", "style.width"] }, SPACING_EDITOR] },
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

export const COMPONENTS: Readonly<Record<string, ComponentDefinition>> = Object.freeze(
  Object.fromEntries(
    [Email, Page, Section, Row, Column, Text, Paragraph, Heading, Span, Link, Button, Image, Divider, LineBreak, MergeTag].map((d) => [
      d.type,
      d as unknown as ComponentDefinition,
    ])
  )
);

export function definitionOf(type: string): ComponentDefinition | undefined {
  return Object.prototype.hasOwnProperty.call(COMPONENTS, type) ? COMPONENTS[type] : undefined;
}
