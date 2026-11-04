/**
 * Text and heading blocks as a Paragraph and a Heading: their HTML as runs (runs.ts), their text styles, padding and
 * phone settings. They always draw: a value that can't be read is said, and drawn as the browser would without it. HTML
 * no run holds (an image, a list, a paragraph's own style) is written as it is, in the box today's components write
 * around a block and with the block's text styles, as a Raw node.
 */
import type { Json } from "@unlayer-internal/elements-core";
import { cssValueSafe, generateHtmlFromTextJson } from "@unlayer-internal/shared-elements";
import { collectDeviceStyles, cssIdent, deviceStylesCss } from "../../utils/device-overrides";
import { contentBox, givenId, type DesignBlock, type Place, type TreeNode } from "../lower";
import { parseRuns } from "../runs";
import { fontOfValues, spaceBeforeTag, textTransformOfText } from "../quirks";
import { deviceValues, drawnWeight, letterSpacing, lineHeight, px, sides, some, type Values } from "../values";

const ALIGNS = new Set(["left", "center", "right", "justify"]);
const DIRECTIONS = new Set(["ltr", "rtl", "auto"]);

const PERCENT = /^\s*[\d.]+%\s*$/;
/** A heading's font size in the browser's own styles, in em, by its level. */
const HEADING_EMS = [2, 1.5, 1.17, 1, 0.83, 0.67];

const said = (value: unknown) => value !== undefined && value !== "";

/** What a value that can't be read is, in words. */
const unread = (place: Place, what: string, value: unknown) => place.note(`A text's ${what} ${JSON.stringify(value)} can't be read: it's drawn without it.`);

/** The font size around a block: a printed document's stylesheet's, or the browser's. */
const around = (mode: Place["mode"]) => (mode === "document" ? 15 : 16);

/** A length in px: from em and % of the font size around the block, and rem and pt, as the browser works them out. */
function fontPx(value: unknown, mode: Place["mode"]): number | undefined {
  const match = typeof value === "string" ? /^\s*(\d*\.?\d+)(r?em|%|pt)\s*$/.exec(value) : null;
  if (!match) return px(value);
  return Math.round(Number(match[1]) * { em: around(mode), rem: 16, "%": around(mode) / 100, pt: 4 / 3 }[match[2] as "em"] * 100) / 100;
}

/** Whether a block's padding is a share of its place, which isn't one length on every window: it's written as it is. */
const paddingShare = (value: unknown) => typeof value === "string" && value.includes("%");

/** A block's padding in px, from what `fontPx` reads. */
const paddingOf = (value: unknown, mode: Place["mode"]) => sides(typeof value === "string" ? value.trim().split(/\s+/).map((part) => fontPx(part, mode) ?? part).join(" ") : value);

/** A block's text styles as legacy writes them; a heading's tag is bold where it says no weight, and in the browser's size where it says none. */
function textStyles(values: Values, place: Place, level: number | undefined): Record<string, Json> {
  const size = fontPx(values.fontSize, place.mode);
  if (said(values.fontSize) && size === undefined) unread(place, "font size", values.fontSize);
  let height = values.lineHeight === "normal" ? 1.15 : lineHeight(values.lineHeight);
  if (height === undefined) {
    if (said(values.lineHeight)) unread(place, "line height", values.lineHeight);
    // What the browser gives text that says none it reads: a page's 1.5, else the font's own.
    height = place.mode === "web" ? 1.5 : 1.15;
  }
  const spacing = said(values.letterSpacing) ? letterSpacing(values.letterSpacing, size ?? 16) : 0;
  if (spacing === undefined) unread(place, "letter spacing", values.letterSpacing);
  const align = ALIGNS.has(values.textAlign) ? values.textAlign : undefined;
  if (said(values.textAlign) && !align) unread(place, "alignment", values.textAlign);
  return Object.fromEntries(
    Object.entries({
      fontSize: size ?? (level ? Math.round(HEADING_EMS[level - 1] * around(place.mode) * 100) / 100 : undefined),
      lineHeight: height,
      fontWeight: (said(values.fontWeight) ? drawnWeight(values.fontWeight, "A text", place.note) : undefined) ?? (level ? 700 : undefined),
      color: typeof values.color === "string" && values.color ? values.color : undefined,
      textAlign: align,
      fontFamily: fontOfValues(values.fontFamily),
      letterSpacing: spacing || undefined,
      textTransform: textTransformOfText(values.textTransform),
    }).filter(([, value]) => value !== undefined)
  ) as Record<string, Json>;
}

/** What legacy's stylesheet reads of a text block for a device: its padding, font size, line height and alignment. */
const DEVICE_KEYS = ["containerPadding", "fontSize", "lineHeight", "textAlign"];

/** A block's phone settings as the new engine's. */
function phoneStyles(phone: Values, stored: Values, place: Place): Record<string, Json> {
  const out: Record<string, Json> = {};
  for (const [key, value] of Object.entries<unknown>(phone)) {
    const read = key === "containerPadding" ? paddingOf(value, place.mode) : key === "fontSize" ? fontPx(value, place.mode) : key === "lineHeight" ? lineHeight(value) : ALIGNS.has(value as string) ? (value as string) : undefined;
    if (read !== undefined) out[key === "containerPadding" ? "padding" : key] = read;
    else unread(place, `${key} on phones`, value);
  }
  for (const key of Object.keys(stored._override?.mobile ?? {})) if (key !== "hideMobile" && !DEVICE_KEYS.includes(key)) place.note(`A text's ${key} on phones isn't read: it's drawn without it.`, "info");
  return out;
}

/**
 * A text or heading block's HTML as its exporter writes it: a text's from its textJson (the design's `text` is that
 * without its formatting), through the configured sanitizer, a non-breaking space before a tag made a space (legacy's
 * own step).
 */
export const textHtml = (values: Values, place: Place): string => {
  const textJson = place.source?.textJson;
  const html = typeof textJson === "string" ? generateHtmlFromTextJson(textJson) : typeof values.text === "string" ? values.text : "";
  return spaceBeforeTag(place.config.toSafeHtml ? place.config.toSafeHtml(html) : html);
};

/**
 * The style legacy gives a block's links where it doesn't take the body's: their color, and no underline where it
 * says none. Null on a page where its hover style is another: for what has no place for that (a text tool read back).
 */
export function linkStyleOf(values: Values, mode: Place["mode"]): Record<string, Json> | undefined | null {
  const style = values.linkStyle;
  if (!style || style.inherit !== false) return undefined;
  const color = typeof style.linkColor === "string" && style.linkColor ? style.linkColor : undefined;
  const underline = style.linkUnderline !== false;
  if (mode === "web" && (style.linkHoverColor !== style.linkColor || (style.linkHoverUnderline !== false) !== underline)) return null;
  return { ...(color ? { color } : {}), ...(underline ? {} : { textDecoration: "none" }) };
}

/** What a block's links change to under the pointer: what differs from their style (an email's stylesheet has none). */
function linkHoverOf(values: Values, mode: Place["mode"]): Record<string, Json> {
  const style = values.linkStyle;
  if (!style || style.inherit !== false || mode === "email") return {};
  const line = style.linkHoverUnderline !== false;
  return { ...(typeof style.linkHoverColor === "string" && style.linkHoverColor && style.linkHoverColor !== style.linkColor ? { color: style.linkHoverColor } : {}), ...(line !== (style.linkUnderline !== false) ? { textDecoration: line ? "underline" : "none" } : {}) };
}

/** The links among runs in the block's link style (in what a link doesn't set itself), and under the pointer. */
export function styled(runs: Array<TreeNode | string>, style: Record<string, Json> | undefined, hover: Record<string, Json> = {}): Array<TreeNode | string> {
  if (!Object.keys(style ?? {}).length && !Object.keys(hover).length) return runs;
  return runs.map((run) => {
    if (typeof run === "string") return run;
    const children = run.children && styled(run.children, style, hover);
    if (run.type === "Link") return { ...run, style: { ...style, ...run.style }, ...(Object.keys(hover).length ? { hover } : {}), ...(children ? { children } : {}) };
    return children ? { ...run, children } : run;
  });
}

/** CSS for a declaration's value: what can't end its rule. */
const declared = (property: string, value: unknown) => (value !== undefined && value !== "" && cssValueSafe(String(value)) ? `${property}: ${value};` : "");

/**
 * A block whose HTML no run holds: the HTML as it is, in legacy's box and tag with its text styles as they're written
 * (the browser reads what it reads of them), for its head CSS and the user's to select. Its stylesheet says what its
 * phone settings and links are, as legacy's does.
 */
function written(type: "Paragraph" | "Heading", values: Values, html: string, level: number, place: Place): TreeNode {
  const id = givenId(values) ?? place.id ?? "";
  const font = fontOfValues(values.fontFamily);
  // (A paragraph's % is a multiple, which a run in another size draws at its own: legacy writes it so.)
  const height = type === "Paragraph" && PERCENT.test(String(values.lineHeight)) ? parseFloat(values.lineHeight) / 100 : values.lineHeight;
  const styles = Object.entries({ "font-family": font, "font-size": values.fontSize, "font-weight": values.fontWeight, color: values.color, "letter-spacing": values.letterSpacing, "line-height": height, "text-align": values.textAlign, "word-wrap": "break-word" }).map(([property, value]) => declared(property, value)).filter(Boolean).join(" ");
  const tag = type === "Paragraph" ? "div" : `h${level}`;
  const inner = `<${tag} class="v-line-height v-font-size v-text-align" style="${`${type === "Paragraph" ? "" : "margin: 0px; "}${styles}`.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}">${html}</${tag}>`;
  const outlook = type === "Heading" && place.mode === "email" ? [`<!--[if mso]><table role="presentation" width="100%"><tr><td><![endif]-->`, `<!--[if mso]></td></tr></table><![endif]-->`] : ["", ""];
  const name = type.toLowerCase();
  const device: Record<string, string[]> = {};
  collectDeviceStyles({ ...values, _meta: { htmlID: id } }, "contents", type, place.mode, device);
  const rule = (selector: string, style: Record<string, Json> | null | undefined) => {
    const body = [declared("color", style?.color), declared("text-decoration", style?.textDecoration)].filter(Boolean).join(" ");
    return body ? `#${cssIdent(id)} ${selector} { ${body} }` : "";
  };
  return {
    type: "Raw",
    props: {
      html: contentBox(`${outlook[0]}${inner}${outlook[1]}`, { id, className: `u_content_${name}`, padding: values.containerPadding ?? "10px", override: values._override }, place.body.fontFamily?.value, place.mode),
      css: [deviceStylesCss(device, place.mode), rule("a", linkStyleOf(values, "email")), rule("a:hover", linkHoverOf(values, place.mode))].filter(Boolean).join("\n"),
    },
  };
}

function textBlock(tool: "Paragraph" | "Heading", block: DesignBlock, place: Place): TreeNode {
  const { values, phone: phoneValues } = deviceValues(block.values, DEVICE_KEYS, place.mode);
  const template = place.config.textDirection ?? place.body.textDirection ?? "ltr";
  // Legacy writes the template's direction, whatever a block says (its text is laid out so).
  if (values.textDirection !== undefined && !DIRECTIONS.has(values.textDirection)) unread(place, "direction", values.textDirection);
  else if (values.textDirection !== undefined && values.textDirection !== template) place.note(`A text's own direction ${JSON.stringify(values.textDirection)} isn't drawn: it's in its template's, as it was.`, "info");
  const dir = values.textDirection === template ? values.textDirection : undefined;
  const given = tool === "Heading" ? /^h([1-6])$/.exec(String(values.headingType ?? "h1"))?.[1] : undefined;
  if (tool === "Heading" && !given) unread(place, "heading level", values.headingType);
  // (A tag that isn't a heading's is text in the block's styles, to the browser and in plain text.)
  const type = given ? "Heading" : "Paragraph";
  const level = given ? Number(given) : undefined;
  const style = textStyles(values, place, level);
  const html = textHtml(values, place);
  const { children, left } = parseRuns(place.keep(html), { weight: (style.fontWeight as number | undefined) ?? 400 });
  const ownSize = ownFontSize(children);
  // A paragraph's line height on phones is its runs' too, in legacy's CSS: a run in another font size has its own here.
  // The HTML as it is, or in its own values and its settings for each device as legacy's stylesheet applies them.
  if (left.length || (type === "Paragraph" && ownSize && phoneValues.lineHeight !== undefined) || paddingShare(values.containerPadding) || paddingShare(phoneValues.containerPadding)) return written(tool, block.values, html, level ?? 1, place);
  const phone = phoneStyles(phoneValues, block.values, place);
  let padding = paddingOf(values.containerPadding ?? "10px", place.mode);
  if (!padding) {
    unread(place, "padding", values.containerPadding);
    padding = sides("10px");
  }
  // A heading's line height in % is one height for all its text (the CSS inherits the px), where a run in a larger or
  // smaller font draws its line in the new engine's as tall as its own font makes it.
  if (type === "Heading" && ownSize) {
    const size = style.fontSize as number | undefined;
    style.lineHeight = pinned(values.lineHeight, size) ?? style.lineHeight;
    if (phone.fontSize !== undefined || phone.lineHeight !== undefined) {
      const onPhones = pinned(phoneValues.lineHeight ?? values.lineHeight, (phone.fontSize as number | undefined) ?? size);
      if (onPhones !== undefined) phone.lineHeight = onPhones;
    }
  }
  return {
    type,
    ...(level || dir ? { props: { ...(level ? { level } : {}), ...(dir ? { dir } : {}) } } : {}),
    style: { ...style, ...(some(padding) ? { padding: padding! } : {}) },
    ...(Object.keys(phone).length ? { mobile: phone } : {}),
    // An empty block is a line of its height, as legacy's.
    children: children.length ? styled(children, linkStyleOf(values, "email") ?? undefined, linkHoverOf(values, place.mode)) : ["\u200b"],
  };
}

/** A line height in %, as px at a font size. */
const pinned = (height: unknown, size: number | undefined) => (typeof height === "string" && PERCENT.test(height) && size !== undefined ? `${Math.round(parseFloat(height) * size) / 100}px` : undefined);

/** Whether a run sets its own font size. */
function ownFontSize(runs: Array<TreeNode | string>): boolean {
  return runs.some((run) => typeof run !== "string" && (run.style?.fontSize !== undefined || ownFontSize(run.children ?? [])));
}

export const heading = (block: DesignBlock, place: Place) => textBlock("Heading", block, place);
export const text = (block: DesignBlock, place: Place) => textBlock("Paragraph", block, place);
