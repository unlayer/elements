/**
 * Where today's components draw something other than their design asks, and the new engine, given the design,
 * draws it as they do (RFC 0001, "Moving the existing components"). Each is one function and one test, so the major
 * that drops them deletes this file.
 */

import { cssValueSafe } from "@unlayer-internal/shared-elements";
import { cssValue } from "../utils/device-overrides";

type Sides = { top: number; right: number; bottom: number; left: number };

/**
 * A Row's padding, in an email: legacy writes its sides outside the content width, where a wide window shows
 * nothing of them and a phone none either (its phone CSS zeroes them). They're left out; its top and bottom stay.
 */
export function rowPaddingInEmail(padding: Sides): Sides {
  return { top: padding.top, right: 0, bottom: padding.bottom, left: 0 };
}

/**
 * What's left of a Row's side padding in an email where its sides differ: legacy's content sits off centre by half their
 * difference (it's centred between them), which the difference alone on the side that has more draws, without taking
 * more of a narrow window than legacy's content leaves. None on phones (legacy's phone CSS zeroes them).
 */
export function rowOffsetInEmail(padding: Sides): Partial<Pick<Sides, "left" | "right">> | undefined {
  if (padding.left === padding.right) return undefined;
  return padding.left > padding.right ? { left: padding.left - padding.right } : { right: padding.right - padding.left };
}

/** A text block's letter case: legacy's heading and text exporters don't write textTransform, so text is drawn as written. */
export function textTransformOfText(_value: unknown): undefined {
  return undefined;
}

/**
 * A block's font: legacy reads `{ label, value }`, which its props make from a stack; a stack given as a string in
 * `values` isn't read, and the block is in the body's font.
 */
export function fontOfValues(value: unknown): string | undefined {
  return value && typeof value === "object" && typeof (value as { value?: unknown }).value === "string" ? (value as { value: string }).value || undefined : undefined;
}

/**
 * A divider's length: legacy writes a length given as the builder stores it (`{ width, autoWidth }`) as "[object
 * Object]", which no browser reads, and draws no line where it would be (its space is kept): a line of no length.
 */
export function dividerLength(width: unknown): unknown {
  return width !== null && typeof width === "object" ? 0 : width;
}

/**
 * The line height of a table's header and footer: legacy gives them none, so a page's (1.5, which its cells inherit
 * here too), and in an email or a printed document the font's own ("normal", about 1.15 of Arial's, Georgia's and
 * Times's size at the sizes tables use), where a cell needs one every client reads.
 */
export function linesInHeaderAndFooter(mode: "email" | "web" | "document"): number | undefined {
  return mode === "web" ? undefined : 1.15;
}

/**
 * A text block's HTML as legacy's text and heading exporters write it: the first non-breaking space between a word
 * and a tag is a plain space (where a line may break).
 */
export function spaceBeforeTag(html: string): string {
  return html.replace(/([^\s<>])&nbsp;(<)/, "$1 $2");
}

/**
 * A button's colors under the pointer: legacy's page writes them in its stylesheet; its email writes none, so an
 * email's button doesn't change.
 */
export function buttonHover(mode: "email" | "web" | "document", colors: { hoverColor?: unknown; hoverBackgroundColor?: unknown }): Record<string, string> | undefined {
  if (mode === "email") return undefined;
  const hover = Object.fromEntries(
    [
      ["color", colors.hoverColor],
      ["backgroundColor", colors.hoverBackgroundColor],
    ].filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1] !== "")
  );
  return Object.keys(hover).length ? hover : undefined;
}

/**
 * An image's own box: legacy's image exporters don't write the border, corner radius or background an Image's props
 * give it (`borderWidth`, `borderRadius`, `backgroundColor`), so it's drawn without them.
 */
export function imageBox(_values: Record<string, unknown>): Record<string, never> {
  return {};
}

/**
 * Whether legacy writes an email image twice, the second for classic Outlook in a conditional comment, which its plain
 * text reads too (the image's alternate text is there twice): where the image has its own width and height.
 */
export function outlookCopy(src: { width?: unknown; height?: unknown; url?: unknown }): boolean {
  return typeof src.width === "number" && src.width > 0 && typeof src.height === "number" && src.height > 0 && !/\{\{|\[\[|<%/.test(String(src.url ?? ""));
}

/**
 * A row's background (or its columns') in an email: legacy's email writes a color with transparency (rgba with an
 * alpha under 1) as transparent, so the row has none.
 */
export function rowColorInEmail(value: string | undefined): string | undefined {
  const rgba = value && /^rgba\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)$/i.exec(value.trim());
  return rgba && Number(rgba[1]) < 1 ? undefined : value;
}

/**
 * A page's or printed document's text and background colors: legacy's stylesheet takes a hex, rgb() or rgba() color,
 * or transparent; another (a name, hsl(), rgb() that isn't one) is its default, black text on white.
 */
export function pageBodyColor(value: string | undefined, fallback: "#000000" | "#ffffff"): string {
  const text = typeof value === "string" ? value.trim() : "";
  const rgb = /^rgb(a?)\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(,\s*\d*\.?\d+\s*)?\)$/i.exec(text);
  const color = rgb ? !rgb[1] === !rgb[5] && [rgb[2], rgb[3], rgb[4]].every((n) => Number(n) <= 255) && !(Number(rgb[5]?.slice(1)) > 1) : /^(#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|transparent)$/i.test(text);
  return color ? value! : fallback;
}

/**
 * What the editor's page and printed document have for all that's on them, in the page's root so a page holding the
 * parts of one keeps its own: every box's padding inside its width, and paragraphs with no margins.
 */
export const PAGE_BASE_CSS = "main{box-sizing:border-box}main *,main :after,main :before{box-sizing:inherit}main p{margin:0}main sub,main sup{line-height:0}";

/**
 * What the editor's whole page or printed document has for the window it's alone in, which a template rendered inside
 * another page leaves to that page: the rem, and a printed document's height and, on a screen, its margin (in print, a
 * PDF's own margins apply).
 */
export function wholePageCss(mode: "email" | "web" | "document", body: { documentMargin?: unknown }): string {
  if (mode === "email") return "";
  if (mode === "web") return "html{font-size:14px}";
  const margin = typeof body.documentMargin === "string" && cssValueSafe(body.documentMargin) ? `@media screen{body{padding:${body.documentMargin}}}` : "";
  return `html{font-size:14px}main{min-height:100vh}${margin}`;
}

/**
 * What legacy's stylesheet gives the markup of a user's own block (the new engine's blocks have these as their own).
 * In an email, tables and their cells are in the template's text color, which is the only color an Html block's text
 * has: the new email's root has none. In a printed document, backgrounds print, and a `content` class of the user's
 * takes the template's text and background, as legacy's own `.content` does.
 */
export function ownMarkupCss(mode: "email" | "web" | "document", body: { textColor?: string; backgroundColor?: string; fontFamily?: { value?: string } }): string {
  const text = pageBodyColor(body.textColor, "#000000");
  if (mode === "email") return `table, td { color: ${text}; }`;
  if (mode !== "document") return "";
  const font = body.fontFamily?.value || "Arial, Helvetica, sans-serif";
  return `body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }\n.content { width: 100%; font-family: ${cssValueSafe(font) ? font : "inherit"}; font-size: 15px; color: ${text}; background-color: ${pageBodyColor(body.backgroundColor, "#ffffff")}; -webkit-print-color-adjust: exact; }`;
}

/** A background picture as CSS writes it. */
export interface Picture {
  url: string;
  repeat?: string;
  position?: string;
  size?: string;
  /** What classic Outlook's VML reads: tiled, else one frame. */
  tile: boolean;
}

/** The corners and sides legacy names a picture's position by, as CSS. */
const PICTURE_POSITIONS: Record<string, string> = {
  top: "left top",
  left: "left top",
  "top-left": "left top",
  "left-top": "left top",
  "top-center": "center top",
  "center-top": "center top",
  right: "right top",
  "top-right": "right top",
  "right-top": "right top",
  center: "center center",
  "center-center": "center center",
  "center-left": "left center",
  "left-center": "left center",
  "center-right": "right center",
  "right-center": "right center",
  bottom: "left bottom",
  "bottom-left": "left bottom",
  "left-bottom": "left bottom",
  "bottom-center": "center bottom",
  "center-bottom": "center bottom",
  "bottom-right": "right bottom",
  "right-bottom": "right bottom",
};

/**
 * A row's or the body's background picture, as legacy reads it: `repeat` as CSS (`false` none, `true` isn't one: the
 * browser's default, which repeats), a `position` by its name or `customPosition` (none it knows: the browser's), a
 * `size` of contain, cover or `customSize`. An email has no size (its exporter writes none, as classic Outlook has none).
 */
export function pictureOf(value: unknown, mode: "email" | "web" | "document"): Picture | undefined {
  const picture = (value ?? {}) as { url?: unknown; repeat?: unknown; position?: unknown; customPosition?: unknown; size?: unknown; customSize?: unknown };
  if (typeof picture.url !== "string" || !picture.url.trim()) return undefined;
  const pair = (list: unknown) => (Array.isArray(list) ? cssValue(list.map((part) => part ?? "auto").join(" ")) : undefined);
  const repeat = picture.repeat === true ? undefined : typeof picture.repeat === "string" && picture.repeat ? cssValue(picture.repeat) : "no-repeat";
  const position = picture.position === "custom" ? pair(picture.customPosition) : PICTURE_POSITIONS[String(picture.position)];
  const size = mode === "email" ? undefined : picture.size === "contain" || picture.size === "cover" ? picture.size : picture.size === "custom" ? pair(picture.customSize) : undefined;
  return { url: picture.url, repeat, position, size, tile: picture.repeat === true || (typeof picture.repeat === "string" && picture.repeat.includes("repeat") && picture.repeat !== "no-repeat") };
}

/** A printed document's body's picture, as its stylesheet reads it: its older settings (`repeat`, `center`, `cover` as flags) alone. */
export function documentBodyPicture(value: unknown): Picture | undefined {
  const picture = (value ?? {}) as { url?: unknown; repeat?: unknown; center?: unknown; cover?: unknown };
  if (typeof picture.url !== "string" || !picture.url.trim()) return undefined;
  return { url: picture.url, repeat: picture.repeat ? "repeat" : "no-repeat", position: picture.center ? "center top" : "left top", size: picture.cover ? "cover" : undefined, tile: !!picture.repeat };
}

/** A picture's rule for a stylesheet: the URL in a string CSS can't be ended by. */
export function pictureCss(picture: Picture): string {
  const url = picture.url.replace(/[\\"\n\r<>]/g, (c) => encodeURIComponent(c));
  return [`background-image: url("${url}")`, picture.repeat && `background-repeat: ${picture.repeat}`, picture.position && `background-position: ${picture.position}`, picture.size && `background-size: ${picture.size}`].filter(Boolean).join("; ");
}
