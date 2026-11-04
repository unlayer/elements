/**
 * Email HTML from a laid-out template. Email clients are the hard target:
 * classic Outlook lays out with Word (no flexbox, no sizes on divs, no
 * padding on inline elements), and Gmail drops `<style>` for some accounts.
 * So (docs/rfcs/0001-primitives-and-exporters.md, "Email"):
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
 * JSX that writes strings (../jsx.ts), from one props object (context.ts);
 * `markup.tsx`, `layout.tsx` and `styles.tsx` are what they share. What email
 * can't do as asked is found in one pass (support.ts).
 *
 * Choices measured against captures of real classic Outlook: a 100% table with a px `max-width` is that width in
 * Word, so a box with its own width is `width="100%" style="max-width:…"`,
 * fluid elsewhere; a cell's width includes its padding; line heights are px
 * with `mso-line-height-rule: exactly` (Word drops unitless ones). Buttons
 * are tables, not VML: Word draws a VML button's label in its own font,
 * wrapped inside the shape's fixed size.
 */
import { Diagnostics, type Diagnostic, type ResolvedDocument, type ResolvedNode } from "@unlayer-internal/elements-core";
import { Fragment, h, raw, withPhoneAtHiding, withStylesheet, type Html } from "../jsx";
import { utf8Bytes } from "../shared/bytes";
import { Stylesheet } from "../shared/classes";
import { attrs, css, escapeText, styleAttr } from "../shared/css";
import { fontFaces } from "../shared/fonts";
import { shown, type EmailOptions, type Props, type Component } from "./context";
import { Button } from "./Button";
import { Column } from "./Column";
import { Divider } from "./Divider";
import { Email } from "./Email";
import { Heading } from "./Heading";
import { Image } from "./Image";
import { LineBreak } from "./LineBreak";
import { Link } from "./Link";
import { List } from "./List";
import { ListItem } from "./ListItem";
import { MergeTag } from "./MergeTag";
import { Paragraph } from "./Paragraph";
import { Raw } from "./Raw";
import { Row } from "./Row";
import { Layer } from "./Layer";
import { Section } from "./Section";
import { Span } from "./Span";
import { Table } from "./Table";
import { TableCell } from "./TableCell";
import { TableRow } from "./TableRow";
import { Text } from "./Text";
import { Video } from "./Video";
import { mobileTextOf, phoneText, type MobileText } from "./styles";

export type { EmailOptions } from "./context";

/** The components, by where they go: in a stack or a Row, or inside text. (The root, `Email`, is called on its own.) */
const BLOCKS: Record<string, Component> = {
  Section,
  Row,
  Layer,
  Column,
  Text,
  Paragraph,
  Heading,
  Button,
  Link,
  Image,
  Divider,
  List,
  ListItem,
  Table,
  TableRow,
  TableCell,
  Video,
  Raw,
  // The authorable twin of Raw: the same markup, written the same way.
  Html: Raw,
};
const INLINES: Record<string, Component> = {
  Span,
  Link,
  Image,
  LineBreak,
  MergeTag,
};

/** Where a node is written: its parent, whether it fills its cell, the phone text styles it inherits, inside text or not. */
interface Place {
  parent: ResolvedNode;
  fill: boolean;
  mobile: MobileText;
  inline: boolean;
}

/** What a node's component gets. */
function propsOf(node: ResolvedNode, place: Place, options: EmailOptions): Props {
  const mobileText = mobileTextOf(node, place.mobile);
  // Inside text, CSS carries the text's phone styles down to its runs: a run writes only its own, its line
  // height from the text's phone line height where it has one (as on desktop, the run's size times the text's).
  const ownText = mobileTextOf(node, {});
  if (ownText.fontSize !== undefined && mobileText.lineHeight !== undefined) ownText.lineHeight = mobileText.lineHeight;
  const render: Props["render"] = (child, how = {}) => write(child, { parent: node, fill: how.fill ?? false, mobile: mobileText, inline: how.inline ?? false }, options);
  return {
    node,
    style: node.style,
    mobile: node.mobile ?? {},
    parent: place.parent,
    fill: place.fill,
    inline: place.inline,
    phoneText: phoneText(node, place.inline ? ownText : mobileText),
    text: () => <>{node.children.map((child) => (typeof child === "string" ? child : render(child, { inline: true })))}</>,
    render,
    options,
  };
}

function write(node: ResolvedNode, place: Place, options: EmailOptions): Html {
  if (place.inline) {
    if (!shown(node)) return raw("");
    // Markup an importer brought in, among text: only what it is.
    if (node.type === "Raw") return raw(String(node.props.html));
    const component = INLINES[node.type];
    if (!component) throw new Error(`[Elements] The email exporter can't render a ${node.type} inside text`);
    return component(propsOf(node, place, options));
  }
  const component = BLOCKS[node.type];
  if (!component) throw new Error(`[Elements] The email exporter can't render a ${node.type} here (in a ${place.parent.type})`);
  // A block of a template of today's components: its phone styles start where what's hidden does (`hideBelow`).
  return node.compat?.ownPhone ? withPhoneAtHiding(() => component(propsOf(node, place, options))) : component(propsOf(node, place, options));
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
  /** What only the written email shows: its size against Gmail's limits. (What email can't do as asked is `emailSupport`'s, found before writing.) */
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
  const sheet = new Stylesheet(options.classPrefix);
  // What email can't do as asked is found before writing (prepareTemplate: emailSupport); here, only what needs the written email.
  const d = new Diagnostics();
  const fonts = fontFaces(root, { swap: false });
  const width = root.width ?? 600;
  const email = withStylesheet(sheet, () => String(Email(propsOf(root, { parent: root, fill: false, mobile: {}, inline: false }, options))));

  const background = root.style.backgroundColor as string | undefined;
  const lang = root.props.lang as string | undefined;
  const dir = root.props.dir as string | undefined;
  const title = typeof root.props.title === "string" ? root.props.title : undefined;
  const preview = typeof root.props.previewText === "string" && root.props.previewText ? root.props.previewText : undefined;

  const resets =
    "table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}img{-ms-interpolation-mode:bicubic}a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important}";
  const phoneQuery = `@media (max-width: ${width + EMAIL_PHONE_MARGIN}px)`;
  const stylesheet = resets + sheet.css(phoneQuery, `@media (min-width: ${width + EMAIL_PHONE_MARGIN + 1}px)`, options.hideBelow ? `@media (max-width: ${options.hideBelow}px)` : phoneQuery);
  const head = [
    '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="x-apple-disable-message-reformatting">',
    '<meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">',
    '<meta name="color-scheme" content="light">',
    '<meta name="supported-color-schemes" content="light">',
    "<!--[if mso]><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->",
    title !== undefined ? `<title>${escapeText(title)}</title>` : "",
    // Web fonts where classic Outlook doesn't read them: it then draws the next font in each stack (seen in captures of it), where a face it can't load could leave it a default.
    fonts.length ? `<!--[if !mso]><!--><style>${fonts.join("")}</style><!--<![endif]-->` : "",
    `<style>${stylesheet}</style>`,
  ].join("");

  // Preview text: shown after the subject in inbox lists, hidden in the email; the filler keeps
  // clients from adding the email's first words after it. `data-skip-in-text` marks it as the preview for tools that
  // read the HTML (React Email's and today's components mark theirs so; plain text made from the HTML leaves it out).
  const preheader = preview
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all" aria-hidden="true" data-skip-in-text="true">${typeof root.compat?.previewHtml === "string" ? root.compat.previewHtml : escapeText(preview)}${"&#847;&zwnj;&nbsp;".repeat(30)}</div>`
    : "";
  // Gmail drops <html>'s attributes and <body>: the language, direction and background are kept on the email too. A word
  // too long for its line (a long link) breaks onto the next rather than widening the email past a phone's screen: in a
  // table cell too, whose width its longest word would set (word-break: break-word, as legacy's cells have it).
  const body =
    preheader +
    `<div${attrs({ role: "article", "aria-roledescription": "email", "aria-label": title, lang, dir })}${styleAttr([["background-color", background], ["overflow-wrap", "break-word"], ["word-break", "break-word"]])}>${email}</div>`;
  const bodyStyle = css([
    ["margin", "0"],
    ["padding", "0"],
    ["background-color", background],
  ]);
  const html =
    `<!DOCTYPE html><html${attrs({ lang, dir, xmlns: "http://www.w3.org/1999/xhtml", "xmlns:o": "urn:schemas-microsoft-com:office:office" })}>` +
    `<head>${head}</head><body${styleAttr([["margin", "0"], ["padding", "0"], ["background-color", background]])}>${body}</body></html>`;

  const bytes = utf8Bytes(html);
  if (bytes > GMAIL_CLIP_BYTES) {
    d.warning("email/size", `The email is ${Math.round(bytes / 1024)} KB; Gmail clips a message after ${GMAIL_CLIP_BYTES / 1024} KB ("[Message clipped]")`, "root");
  }
  const styleBytes = utf8Bytes(stylesheet);
  if (styleBytes > GMAIL_STYLE_BYTES) {
    d.warning("email/style-size", `The stylesheet is ${Math.round(styleBytes / 1024)} KB; Gmail reads ${GMAIL_STYLE_BYTES / 1024} KB of a <style>`, "root");
  }
  return { html, head, body, bodyStyle, diagnostics: d.list };
}
