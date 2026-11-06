/**
 * Page HTML (`<Page>`) from a laid-out template: one element per node, its
 * styles inline, flexbox for the root, Rows and Columns. The only stylesheet
 * is what inline styles can't do: phone overrides, hiding, hover, and fonts.
 *
 * Each component is written by its own file here (Button.tsx, Row.tsx, …), in
 * JSX that writes strings (../jsx.ts), from one props object (context.ts);
 * `layout.tsx` and `styles.tsx` are what they share.
 */
import type { ResolvedDocument, ResolvedNode } from "../../resolve";
import { Fragment, h, withStylesheet, type Html } from "../jsx";
import { Stylesheet } from "../shared/classes";
import { attrs, css, escapeText, styleAttr, type Declarations } from "../shared/css";
import { fontFaces } from "../shared/fonts";
import { isNode, type PageOptions, type Props, type Component } from "./context";
import { alignSelf, layerPlacement, rowPlacement } from "./layout";
import { classesFor } from "./styles";
import { Button } from "./Button";
import { Column } from "./Column";
import { Divider } from "./Divider";
import { Heading } from "./Heading";
import { HtmlBlock } from "./Html";
import { Image } from "./Image";
import { LineBreak } from "./LineBreak";
import { Link } from "./Link";
import { List } from "./List";
import { ListItem } from "./ListItem";
import { MergeTag } from "./MergeTag";
import { Page } from "./Page";
import { Paragraph } from "./Paragraph";
import { Row } from "./Row";
import { Layer } from "./Layer";
import { Document, documentCss } from "./Document";
import { PageNumber } from "./PageNumber";
import { Canvas } from "./Canvas";
import { Svg } from "./Svg";
import { Section } from "./Section";
import { Span } from "./Span";
import { Table } from "./Table";
import { TableCell } from "./TableCell";
import { TableRow } from "./TableRow";
import { Text } from "./Text";
import { Video } from "./Video";

export type { PageOptions } from "./context";

export interface PageHtml {
  /** The whole document, from `<!DOCTYPE html>`. */
  html: string;
  /** What goes in `<head>`: meta tags, the title, the stylesheet. */
  head: string;
  /** What goes in `<body>`. */
  body: string;
  /** The `<body>`'s own style (the window's background), for a page that embeds `body`. */
  bodyStyle: string;
}

/** Below this width a Page is on a phone. */
export const PAGE_PHONE_WIDTH = 480;
const PHONE = `@media (max-width: ${PAGE_PHONE_WIDTH}px)`;
const DESKTOP = `@media (min-width: ${PAGE_PHONE_WIDTH + 1}px)`;

/** The components. (The root, `Page`, is called on its own.) */
const COMPONENTS: Record<string, Component> = {
  Section,
  Row,
  Column,
  Layer,
  // A Document's header and footer, and a page, are stacks in their box.
  PageHeader: Column,
  PageFooter: Column,
  DocumentPage: Column,
  PageNumber,
  Svg,
  Text,
  Paragraph,
  Heading,
  Span,
  Link,
  Button,
  Image,
  Divider,
  LineBreak,
  MergeTag,
  List,
  ListItem,
  Table,
  TableRow,
  TableCell,
  Video,
  Html: HtmlBlock,
};

/** What a node's component gets. `inRtl`: its parent's text runs right to left. */
function propsOf(node: ResolvedNode, parent: ResolvedNode, placement: Declarations, options: PageOptions, inRtl = false): Props {
  const rtl = node.props.dir === "rtl" || (inRtl && node.props.dir !== "ltr");
  const render: Props["render"] = (child, childPlacement) => write(child, node, childPlacement, options, rtl);
  return {
    node,
    style: node.style,
    parent,
    placement,
    classes: () => classesFor(node, parent),
    children: () => {
      // Text and the runs in it; else the nodes it lays out, each placed by its layout.
      if (node.definition.children.text) return <>{node.children.map((child) => (typeof child === "string" ? child : render(child, [])))}</>;
      const place = (child: ResolvedNode) => (node.type === "Row" ? rowPlacement(child, node) : node.type === "Layer" ? layerPlacement(child) : alignSelf(child, node, rtl));
      return <>{node.children.filter(isNode).map((child) => render(child, place(child)))}</>;
    },
    rtl,
    render,
    options,
  };
}

function write(node: ResolvedNode, parent: ResolvedNode, placement: Declarations, options: PageOptions, inRtl: boolean): Html {
  const component = COMPONENTS[node.type];
  if (!component) throw new Error(`[Elements] The page exporter can't render a ${node.type}`);
  return component(propsOf(node, parent, placement, options, inRtl));
}

export function renderPage(resolved: ResolvedDocument, options: PageOptions = {}): PageHtml {
  const root = resolved.root;
  const sheet = new Stylesheet(options.classPrefix);
  const fonts = fontFaces(root, { swap: true });
  const document = root.type === "Document";
  const writer = document ? Document : root.type === "Canvas" ? Canvas : Page;
  const body = withStylesheet(sheet, () => String(writer(propsOf(root, root, [], options))));

  // A Canvas and a Document are of a fixed size, whatever the window: no phone layout.
  const fixed = !root.definition.responsive;
  const stylesheet = [...fonts, sheet.css(fixed ? null : PHONE, fixed ? null : DESKTOP), document ? documentCss(root) : ""].join("");
  const head = [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    typeof root.props.title === "string" ? `<title>${escapeText(root.props.title)}</title>` : "",
    typeof root.props.description === "string" ? `<meta${attrs({ name: "description", content: root.props.description })}>` : "",
    stylesheet ? `<style>${stylesheet}</style>` : "",
  ].join("");
  // A Document's background is its pages', not the window's.
  const background = document ? undefined : (root.style.backgroundColor as string | undefined);
  const bodyStyle = css([
    ["margin", "0"],
    ["background-color", background],
  ]);
  const html = `<!DOCTYPE html><html${attrs({ lang: root.props.lang as string | undefined, dir: root.props.dir as string | undefined })}><head>${head}</head><body${styleAttr([["margin", "0"], ["background-color", background]])}>${body}</body></html>`;
  return { html, head, body, bodyStyle };
}
