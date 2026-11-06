/**
 * Printed documents: a Document's children on pages of its size, as print HTML (a page writer's
 * output with each page a box of the page's size, and CSS's @page) and as PDF (@unlayer/react-elements/pdf, without a
 * browser). Pages are given (Document.Page) or made by PageBreaks; a PageHeader and a PageFooter go on every page, and a
 * PageNumber says which page it's on. Nothing flows from one page to the next: a page holds what it's given.
 */
import { defineComponent, prop, type SupportByTarget } from "./define";
import { boolean, enumOf, insets } from "./kinds";
import type { Json } from "./model";
import { ROOT_DEFAULT_STYLE, ROOT_PROPS, ROOT_STYLE, TEXT_EDITOR } from "./roots";
import { boxStyle, inheritedTextStyle, layoutStyle, pick } from "./styles";

const WRITTEN: SupportByTarget = { email: { level: "full", source: "writer" }, web: { level: "full", source: "writer" } };

/** Paper sizes, in inches (ISO's in mm, converted): CSS's page sizes. */
const SIZES = {
  A3: [297 / 25.4, 420 / 25.4],
  A4: [210 / 25.4, 297 / 25.4],
  A5: [148 / 25.4, 210 / 25.4],
  Letter: [8.5, 11],
  Legal: [8.5, 14],
  Tabloid: [11, 17],
} as const;
export type PageSize = keyof typeof SIZES;

/** A CSS px: 96 to the inch. */
const PX_PER_INCH = 96;

type Sides = { top: number; right: number; bottom: number; left: number };

export interface PageBox {
  /** The page, in CSS px (96 to the inch). */
  width: number;
  height: number;
  margin: Sides;
  /** What's inside the margins. */
  contentWidth: number;
  contentHeight: number;
  /** The page's size as CSS's @page size says it ("A4 portrait"). */
  css: string;
}

/** A Document's page, from its props (size, orientation, margin). */
export function pageBox(props: Record<string, Json | undefined>): PageBox {
  const size = (props.size as PageSize | undefined) ?? "A4";
  const [w, h] = SIZES[size] ?? SIZES.A4;
  const landscape = props.orientation === "landscape";
  const width = Math.round((landscape ? h : w) * PX_PER_INCH * 100) / 100;
  const height = Math.round((landscape ? w : h) * PX_PER_INCH * 100) / 100;
  const margin = (props.margin as Sides | undefined) ?? { top: 48, right: 48, bottom: 48, left: 48 };
  return {
    width,
    height,
    margin,
    contentWidth: Math.round(width - margin.left - margin.right),
    contentHeight: Math.round(height - margin.top - margin.bottom),
    css: `${size} ${landscape ? "landscape" : "portrait"}`,
  };
}

const PAGE_STYLE = {
  ...inheritedTextStyle,
  backgroundColor: { ...boxStyle.backgroundColor, description: "The page's background, out to its edges." },
  ...pick(layoutStyle, "gap", "alignItems"),
};

export const Document = defineComponent({
  type: "Document",
  label: "Document",
  description:
    "A printed document: its children on pages of its size (Document.Page, or split by PageBreaks), a PageHeader and a PageFooter on each. Renders to print HTML, and to PDF with @unlayer/react-elements/pdf.",
  categories: ["root"],
  props: {
    size: prop(enumOf(["A3", "A4", "A5", "Letter", "Legal", "Tabloid"]), { support: WRITTEN, label: "Page size", default: "A4" }),
    orientation: prop(enumOf(["portrait", "landscape"]), { support: WRITTEN, label: "Orientation", default: "portrait" }),
    margin: prop(insets(), {
      support: WRITTEN,
      label: "Margins",
      description: "Around each page's content (its header and footer too), in px: 96 to the inch.",
      default: { top: 48, right: 48, bottom: 48, left: 48 },
    }),
    ...ROOT_PROPS,
  },
  style: { ...ROOT_STYLE, backgroundColor: { ...ROOT_STYLE.backgroundColor, description: "Each page's background, out to its edges." } },
  defaultStyle: ROOT_DEFAULT_STYLE,
  children: { types: ["DocumentPage", "PageBreak", "PageHeader", "PageFooter"], categories: ["section", "layout", "block"] },
  sizing: "none",
  targets: { web: {} },
  editor: {
    groups: [
      { title: "Document", paths: ["props.size", "props.orientation", "props.margin", "props.title"] },
      { title: "Background", paths: ["style.backgroundColor"] },
      TEXT_EDITOR,
    ],
  },
});

export const DocumentPage = defineComponent({
  type: "DocumentPage",
  label: "Page",
  description: "One page of a Document (Document.Page in JSX): its children stacked down it, inside the Document's margins.",
  categories: [],
  props: {},
  style: PAGE_STYLE,
  children: { categories: ["section", "layout", "block"] },
  sizing: "stretch",
  targets: { web: {} },
  editor: { groups: [{ title: "Page", paths: ["style.backgroundColor", "style.gap"] }, TEXT_EDITOR] },
});

export const PageBreak = defineComponent({
  type: "PageBreak",
  label: "Page break",
  description: "In a Document, where a page ends: what follows starts the next page.",
  categories: [],
  props: {},
  style: {},
  children: {},
  sizing: "none",
  targets: { web: {} },
});

const HEADER_STYLE = { ...inheritedTextStyle, ...pick(boxStyle, "padding", "backgroundColor", "border"), ...pick(layoutStyle, "gap", "alignItems") };

export const PageHeader = defineComponent({
  type: "PageHeader",
  label: "Page header",
  description: "In a Document: drawn at the top of every page, inside its margins.",
  categories: [],
  props: {},
  style: HEADER_STYLE,
  children: { categories: ["layout", "block"] },
  sizing: "stretch",
  targets: { web: {} },
  editor: { groups: [{ title: "Header", paths: ["style.padding", "style.backgroundColor", "style.border", "style.gap"] }, TEXT_EDITOR] },
});

export const PageFooter = defineComponent({
  type: "PageFooter",
  label: "Page footer",
  description: "In a Document: drawn at the bottom of every page, inside its margins.",
  categories: [],
  props: {},
  style: HEADER_STYLE,
  children: { categories: ["layout", "block"] },
  sizing: "stretch",
  targets: { web: {} },
  editor: { groups: [{ title: "Footer", paths: ["style.padding", "style.backgroundColor", "style.border", "style.gap"] }, TEXT_EDITOR] },
});

export const PageNumber = defineComponent({
  type: "PageNumber",
  label: "Page number",
  description: "In a Document's text: the number of the page it's on, or (total) how many pages there are.",
  categories: ["inline"],
  props: {
    total: prop(boolean(), { support: WRITTEN, label: "Page count", description: "How many pages the Document has, instead of this page's number.", default: false }),
  },
  style: {},
  children: {},
  sizing: "none",
  targets: { web: {} },
});

/**
 * A Document's pages: each Document.Page, and the other content between them in runs a PageBreak ends (an empty run
 * is no page, but a document without content has one blank page); its PageHeader and PageFooter, for every page.
 */
export function documentPages<N extends { type: string; children: Array<N | string> }>(root: N): { pages: Array<{ page?: N; children: N[] }>; header?: N; footer?: N } {
  const pages: Array<{ page?: N; children: N[] }> = [];
  let run: N[] = [];
  const end = () => {
    if (run.length) pages.push({ children: run });
    run = [];
  };
  let header: N | undefined;
  let footer: N | undefined;
  for (const child of root.children) {
    if (typeof child === "string") continue;
    if (child.type === "PageHeader") header = child;
    else if (child.type === "PageFooter") footer = child;
    else if (child.type === "PageBreak") end();
    else if (child.type === "DocumentPage") {
      end();
      pages.push({ page: child, children: child.children.filter((c): c is N => typeof c !== "string") });
    } else run.push(child);
  }
  end();
  // A document has a page, if a blank one.
  if (!pages.length) pages.push({ children: [] });
  return { pages, header, footer };
}
