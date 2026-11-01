/**
 * Page HTML (`<Page>`) from a resolved document: one element per node, its
 * styles inline, flexbox for the root, Rows and Columns. The only stylesheet
 * is what inline styles can't do: phone overrides, hiding, hover, and fonts.
 *
 * Each component is written by its own file here (Button.tsx, Row.tsx, …), in
 * JSX that writes strings (../jsx.ts); `context.ts`, `layout.tsx` and
 * `styles.tsx` are what they share.
 */
import type { ResolvedDocument, ResolvedNode } from "@unlayer-internal/elements-core";
import { Stylesheet } from "../shared/classes";
import { attrs, css, escapeText, styleAttr, type Declarations } from "../shared/css";
import { fontFaces } from "../shared/fonts";
import type { Html } from "../jsx";
import type { Context, PageOptions, Writer } from "./context";
import { writeButton } from "./Button";
import { writeColumn } from "./Column";
import { writeDivider } from "./Divider";
import { writeHeading } from "./Heading";
import { writeImage } from "./Image";
import { writeLineBreak } from "./LineBreak";
import { writeLink } from "./Link";
import { writeMergeTag } from "./MergeTag";
import { writePage } from "./Page";
import { writeParagraph } from "./Paragraph";
import { writeRow } from "./Row";
import { writeSection } from "./Section";
import { writeSpan } from "./Span";
import { writeText } from "./Text";

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

/** Each component's writer. (The root is written by `writePage`.) */
const WRITERS: Record<string, Writer> = {
  Section: writeSection,
  Row: writeRow,
  Column: writeColumn,
  Text: writeText,
  Paragraph: writeParagraph,
  Heading: writeHeading,
  Span: writeSpan,
  Link: writeLink,
  Button: writeButton,
  Image: writeImage,
  Divider: writeDivider,
  LineBreak: writeLineBreak,
  MergeTag: writeMergeTag,
};

function render(this: Context, node: ResolvedNode, parent: ResolvedNode, placement: Declarations): Html {
  const writer = WRITERS[node.type];
  if (!writer) throw new Error(`[Elements] The page exporter can't render a ${node.type}`);
  return writer(node, parent, this, placement);
}

export function renderPage(resolved: ResolvedDocument, options: PageOptions = {}): PageHtml {
  const root = resolved.root;
  const context: Context = { options, sheet: new Stylesheet(options.classPrefix), render };
  const fonts = fontFaces(root, { swap: true });
  const body = String(writePage(root, context));

  const stylesheet = [...fonts, context.sheet.css(PHONE, DESKTOP)].join("");
  const head = [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    typeof root.props.title === "string" ? `<title>${escapeText(root.props.title)}</title>` : "",
    typeof root.props.description === "string" ? `<meta${attrs({ name: "description", content: root.props.description })}>` : "",
    stylesheet ? `<style>${stylesheet}</style>` : "",
  ].join("");
  const bodyStyle = css([
    ["margin", "0"],
    ["background-color", root.style.backgroundColor as string | undefined],
  ]);
  const html = `<!DOCTYPE html><html${attrs({ lang: root.props.lang as string | undefined, dir: root.props.dir as string | undefined })}><head>${head}</head><body${styleAttr([["margin", "0"], ["background-color", root.style.backgroundColor as string | undefined]])}>${body}</body></html>`;
  return { html, head, body, bodyStyle };
}
