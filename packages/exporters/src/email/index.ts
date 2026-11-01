/**
 * Email HTML from a resolved document. Email clients are the hard target:
 * classic Outlook lays out with Word (no flexbox, no sizes on divs, no
 * padding on inline elements), and Gmail drops `<style>` for some accounts.
 * So (docs/rfcs/0001-primitives-and-exporters.md, Email):
 *
 * 1. Right without `<style>`: layout at desktop width, colors, fonts, sizes
 *    and spacing are inline. The stylesheet only adds phone overrides,
 *    hiding, hover and client resets.
 * 2. Widths are the resolver's, in px: Word sizes tables, cells and images by
 *    their attributes and ignores the sizes of divs.
 * 3. Tables for layout (`role="presentation"`, no spacing or borders),
 *    spacing as cell padding, never margins.
 * 4. Outlook-only markup only inside `<!--[if mso]>`.
 *
 * Each component is written by its own file here (Button.tsx, Row.tsx, …), in
 * JSX that writes strings (../jsx.ts); `context.ts`, `markup.tsx`, `layout.tsx`
 * and `styles.tsx` are what they share.
 *
 * Choices measured against classic Outlook (unlayer/email-renderer,
 * oracle/CALIBRATION.md): a 100% table with a px `max-width` is that width in
 * Word, so a box with its own width is `width="100%" style="max-width:…"`,
 * fluid elsewhere; a cell's width includes its padding; line heights are px
 * with `mso-line-height-rule: exactly` (Word drops unitless ones). Buttons
 * are tables, not VML: Word draws a VML button's label in its own font,
 * wrapped inside the shape's fixed size.
 */
import { Diagnostics, type Diagnostic, type ResolvedDocument, type ResolvedNode } from "@unlayer-internal/elements-core";
import { Stylesheet } from "../shared/classes";
import { raw, type Html } from "../jsx";
import { attrs, css, escapeText, styleAttr } from "../shared/css";
import { fontFaces } from "../shared/fonts";
import { shown, type Context, type EmailOptions, type Place, type Writer } from "./context";
import { writeButton } from "./Button";
import { writeColumn } from "./Column";
import { writeDivider } from "./Divider";
import { writeEmail } from "./Email";
import { writeHeading } from "./Heading";
import { writeImage } from "./Image";
import { writeLineBreak } from "./LineBreak";
import { writeLink } from "./Link";
import { writeMergeTag } from "./MergeTag";
import { writeParagraph } from "./Paragraph";
import { writeRow } from "./Row";
import { writeSpan } from "./Span";
import { writeText } from "./Text";

export type { EmailOptions } from "./context";

/** Each component's writer, where it goes: in a stack or a Row, or inside text. (The root and Sections are written by `writeEmail`.) */
const BLOCKS: Record<string, Writer> = {
  Row: writeRow,
  Column: writeColumn,
  Text: writeText,
  Paragraph: writeParagraph,
  Heading: writeHeading,
  Button: writeButton,
  Link: writeLink,
  Image: writeImage,
  Divider: writeDivider,
};
const INLINES: Record<string, Writer> = {
  Span: writeSpan,
  Link: writeLink,
  Image: writeImage,
  LineBreak: writeLineBreak,
  MergeTag: writeMergeTag,
};

function render(this: Context, node: ResolvedNode, place: Place): Html {
  if (place.inline) {
    if (!shown(node)) return raw("");
    const writer = INLINES[node.type];
    if (!writer) throw new Error(`[Elements] The email exporter can't render a ${node.type} inside text`);
    return writer(node, place, this);
  }
  const writer = BLOCKS[node.type];
  if (!writer) throw new Error(`[Elements] The email exporter can't render a ${node.type} here (in a ${place.parent.type})`);
  return writer(node, place, this);
}

export interface EmailHtml {
  /** The whole email, from `<!DOCTYPE html>`. */
  html: string;
  /** What goes in `<head>`: meta tags, Outlook's settings, the title, the stylesheet. */
  head: string;
  /** What goes in `<body>`: the preview text and the email. */
  body: string;
  /** The `<body>`'s own style. */
  bodyStyle: string;
  /** What email can't do as asked (Outlook's square corners, an image without a width), and size budgets. */
  diagnostics: Diagnostic[];
}

/** An email is on a phone below its content width plus this. */
export const EMAIL_PHONE_MARGIN = 20;
/** Gmail clips a message at this many bytes of HTML ("[Message clipped]"). */
export const GMAIL_CLIP_BYTES = 102_400;
/** Gmail reads this much of a `<style>`. */
export const GMAIL_STYLE_BYTES = 16_384;

export function renderEmail(resolved: ResolvedDocument, options: EmailOptions = {}): EmailHtml {
  const root = resolved.root;
  const context: Context = { options, sheet: new Stylesheet(options.classPrefix), d: new Diagnostics(), render };
  const fonts = fontFaces(root, { swap: false });
  const width = root.width ?? 600;
  const email = writeEmail(root, context);

  const background = root.style.backgroundColor as string | undefined;
  const lang = root.props.lang as string | undefined;
  const dir = root.props.dir as string | undefined;
  const title = typeof root.props.title === "string" ? root.props.title : undefined;
  const preview = typeof root.props.previewText === "string" && root.props.previewText ? root.props.previewText : undefined;

  const resets =
    "table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}img{-ms-interpolation-mode:bicubic}a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important}";
  const stylesheet = resets + context.sheet.css(`@media (max-width: ${width + EMAIL_PHONE_MARGIN}px)`, `@media (min-width: ${width + EMAIL_PHONE_MARGIN + 1}px)`);
  const head = [
    '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="x-apple-disable-message-reformatting">',
    '<meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">',
    '<meta name="color-scheme" content="light">',
    '<meta name="supported-color-schemes" content="light">',
    "<!--[if mso]><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->",
    title !== undefined ? `<title>${escapeText(title)}</title>` : "",
    // Outlook falls back to Times New Roman for a family it has to download: web fonts only for the others.
    fonts.length ? `<!--[if !mso]><!--><style>${fonts.join("")}</style><!--<![endif]-->` : "",
    `<style>${stylesheet}</style>`,
  ].join("");

  // Preview text: shown after the subject in inbox lists, hidden in the email; the filler keeps
  // clients from adding the email's first words after it.
  const preheader = preview
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all" aria-hidden="true">${escapeText(preview)}${"&#847;&zwnj;&nbsp;".repeat(30)}</div>`
    : "";
  // Gmail drops <html>'s attributes and <body>: the language, direction and background are kept on the email too.
  const body =
    preheader +
    `<div${attrs({ role: "article", "aria-roledescription": "email", "aria-label": title, lang, dir })}${styleAttr([["background-color", background]])}>${email}</div>`;
  const bodyStyle = css([
    ["margin", "0"],
    ["padding", "0"],
    ["background-color", background],
  ]);
  const html =
    `<!DOCTYPE html><html${attrs({ lang, dir, xmlns: "http://www.w3.org/1999/xhtml", "xmlns:o": "urn:schemas-microsoft-com:office:office" })}>` +
    `<head>${head}</head><body${styleAttr([["margin", "0"], ["padding", "0"], ["background-color", background]])}>${body}</body></html>`;

  const bytes = new TextEncoder().encode(html).length;
  if (bytes > GMAIL_CLIP_BYTES) {
    context.d.warning("email/size", `The email is ${Math.round(bytes / 1024)} KB; Gmail clips a message after ${GMAIL_CLIP_BYTES / 1024} KB ("[Message clipped]")`, "root");
  }
  const styleBytes = new TextEncoder().encode(stylesheet).length;
  if (styleBytes > GMAIL_STYLE_BYTES) {
    context.d.warning("email/style-size", `The stylesheet is ${Math.round(styleBytes / 1024)} KB; Gmail reads ${GMAIL_STYLE_BYTES / 1024} KB of a <style>`, "root");
  }
  return { html, head, body, bodyStyle, diagnostics: context.d.list };
}
