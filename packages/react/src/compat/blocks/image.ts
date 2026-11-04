/**
 * An image block as an Image (in a Link where its action is a link) in a Column with the block's padding, placed
 * by its alignment. Its width and maximum width are legacy's: a share of its place (100% where it takes its own size)
 * at most its own width or that share of the place legacy works out from the design (the content width, the row's and
 * column's padding and the column's share), as legacy writes them. It always draws: what can't be read is said; with
 * no URL its block has its padding and nothing in it.
 */
import type { Json } from "@unlayer-internal/elements-core";
import { contentSlotWidth } from "../../utils/image-sizing";
import type { TreeNode } from "../lower";
import { imageBox, imagePadding, outlookCopy } from "../quirks";
import { ALIGN, attribute, columnsStack, deviceValues, drawnImageUrl, drawnLink, inAttribute, moreRoom, sides, some, webLink, type Sides, type Values } from "../values";
import type { Lowering } from "./index";

const round = (n: number) => Math.round(n * 100) / 100;

/** A length legacy writes ("50%", "120px", 120 as px), or undefined for others. */
function length(value: unknown): { value: number; unit: "px" | "%" } | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? { value: round(value), unit: "px" } : undefined;
  const match = typeof value === "string" ? /^\s*(\d*\.?\d+)(px|%)\s*$/.exec(value) : null;
  return match ? { value: round(Number(match[1])), unit: match[2] as "px" | "%" } : undefined;
}

const css = (l: { value: number; unit: "px" | "%" }): Json => (l.unit === "px" ? l.value : `${l.value}%`);

/** The width and maximum width legacy draws an image at, in a place `room` px wide; undefined where it can't be read. */
export function imageSize(src: Values, room: number): { width: Json; maxWidth: Json } | undefined {
  const natural = typeof src.width === "number" && src.width > 0 ? src.width : undefined;
  if (src.autoWidth !== false) {
    // As wide as its place, at most its own width (or the place's, where it's wider).
    const max = natural === undefined ? undefined : room > 0 && natural > room ? room : natural;
    return { width: "100%", maxWidth: max === undefined ? "100%" : round(max) };
  }
  const given = length(src.maxWidth);
  if (!given) return undefined;
  const max = given.unit === "%" ? (room * given.value) / 100 : Math.min(given.value, room);
  return { width: css(given), maxWidth: round(max) };
}

export const image: Lowering = (block, place): TreeNode => {
  const { values, phone } = deviceValues(block.values, ["containerPadding", "src", "textAlign"], place.mode);
  const asEmail = (values.mode ?? place.mode) === "email";
  const said = (what: string, value: unknown) => place.note(`An image's ${what} ${JSON.stringify(value)} can't be read: it's drawn without it.`);
  const src: Values = values.src && typeof values.src === "object" ? values.src : {};
  const padding = sides(values.containerPadding ?? "10px");
  if (!padding) said("padding", values.containerPadding);
  let align = ALIGN[values.textAlign ?? "center"];
  if (!align) {
    said("alignment", values.textAlign);
    // An email's markup has it as a cell's align, which "middle" centers; a page's as text-align, which ignores it.
    align = asEmail && values.textAlign === "middle" ? "center" : "start";
  }
  const box = { ...(some(padding) ? { padding: padding! } : {}), alignItems: align };
  const url = src.url ? drawnImageUrl(src.url, place.keep, (message) => place.note(`An image's URL ${message}`)) : undefined;
  if (!url) {
    // Legacy's block has its padding, and nothing in it.
    if (!src.url) place.note("An image with no URL draws nothing.", "info");
    return { type: "Column", style: box };
  }
  const ownBorder = values.border && typeof values.border === "object" ? values.border : {};
  const borders = ["Left", "Right"].map((side) => parseFloat(String(ownBorder[`border${side}Width`] ?? 0)) || 0);
  const room =
    contentSlotWidth({ bodyValues: place.body, rowValues: place.row, rowCells: place.cells, columnIndex: place.index, columnValues: place.column, containerPadding: imagePadding(values, place.source) }) -
    borders[0] -
    borders[1];
  let size = imageSize(src, room);
  if (!size) {
    // A pinned width that can't be read: as wide as its place, at most its own width, as CSS draws it.
    said("width", src.maxWidth);
    size = imageSize({ ...src, autoWidth: true }, room)!;
  }
  // Phone settings: the block's padding, the image's width and where it sits.
  const columnPhone: Record<string, Json> = {};
  const imagePhone: Record<string, Json> = {};
  for (const [key, value] of Object.entries(phone)) {
    if (key === "containerPadding") {
      if (sides(value)) columnPhone.padding = sides(value)!;
      else said("padding on phones", value);
    } else if (key === "textAlign") {
      if (ALIGN[value as string]) imagePhone.alignSelf = ALIGN[value as string];
      else said("alignment on phones", value);
    } else if (key === "src" && value && typeof value === "object") {
      // Legacy's phone rule: the width given there (or 100%), at most that width or the image's own.
      const merged = { ...src, ...(value as Values) };
      const max = merged.autoWidth === false ? length(merged.maxWidth) : undefined;
      const limit = length(max ? css(max) : merged.width || "100%");
      if (!limit) {
        said("width on phones", merged.maxWidth ?? merged.width);
        continue;
      }
      imagePhone.width = max ? css(max) : "100%";
      imagePhone.maxWidth = css(limit);
    } else if (key === "src") said("width on phones", value);
  }
  for (const key of Object.keys(block.values._override?.mobile ?? {})) if (!["hideMobile", "containerPadding", "src", "textAlign"].includes(key)) place.note(`An image's ${key} on phones isn't read: it's drawn without it.`, "info");
  const alt = typeof values.altText === "string" ? place.keep(inAttribute(values.altText)) : "";
  const asset: Record<string, Json> = { src: url };
  for (const side of ["width", "height"] as const) if (typeof src[side] === "number" && src[side] > 0) asset[side] = src[side];
  // In an email, legacy's maximum is the image's own on phones too, where a stacked column is wider than on desktop: the
  // new email's caps an image at the width it's drawn at on desktop, so a maximum past that (legacy's place leaves the
  // block's padding in) is the image's on phones, in a row of columns that stack (a row's only column is no wider there).
  const slot =
    contentSlotWidth({ bodyValues: place.body, rowValues: place.row, rowCells: place.cells, columnIndex: place.index, columnValues: place.column, containerPadding: values.containerPadding ?? "10px" }) -
    borders[0] -
    borders[1];
  const share = typeof size.width === "string" && size.width.endsWith("%") ? (slot * parseFloat(size.width)) / 100 : typeof size.width === "number" ? size.width : slot;
  const stacks = columnsStack(place);
  // (Its own padding on phones, narrower than on desktop, gives it that room in any row: from where those settings start.)
  if (place.mode === "email" && typeof size.maxWidth === "number" && imagePhone.maxWidth === undefined && moreRoom(columnPhone.padding as Sides | undefined, padding)) imagePhone.maxWidth = size.maxWidth;
  const stackedMaxWidth = place.mode === "email" && stacks && typeof size.maxWidth === "number" && size.maxWidth > share + 0.5 ? size.maxWidth : undefined;
  // Legacy gives an image its alternate text as its title too (a tooltip).
  const props = { src: asset, alt, ...(alt ? { title: alt } : {}) };
  const sized = { width: size.width, maxWidth: size.maxWidth, ...imageBox(values) };
  const withPhone = Object.keys(imagePhone).length ? { mobile: imagePhone } : {};
  const drawn: TreeNode = { type: "Image", props, style: sized, ...withPhone, ...(stackedMaxWidth !== undefined ? { compat: { stackedMaxWidth } } : {}) };
  const column = (child: TreeNode): TreeNode => ({ type: "Column", style: box, ...(Object.keys(columnPhone).length ? { mobile: columnPhone } : {}), children: [child] });
  const action = webLink(values.action) === null ? undefined : drawnLink(values.action, place.keep, place.note);
  const href = (action?.href as { href?: string } | undefined)?.href ? (action as Record<string, Json>) : undefined;
  // As legacy's plain text reads it: a link's address, or its alternate text.
  const text: TreeNode | undefined = place.mode !== "email" && !asEmail ? undefined : href ? { type: "Paragraph", children: [{ type: "Link", props: href, children: [] }] } : imageText(src, alt, asEmail);
  const reading = text ? { textAs: text } : {};
  if (place.mode === "email") {
    // An email image shorter than a line of text: legacy's sits in a line of the cell's text, as tall as its font makes
    // it, by its middle where it's centered and its top where it's to a side.
    const short = asEmail && shorterThanALine(src, size.maxWidth, room);
    const image = short ? { ...drawn, style: { ...sized, verticalAlign: align === "center" ? "middle" : "top" } } : drawn;
    const linked = href ? { type: "Link", props: href, children: [image] } : image;
    return { ...column(short ? { type: "Text", style: { lineHeight: "normal", textAlign: align === "start" ? "left" : align === "end" ? "right" : "center" }, children: [linked] } : linked), ...reading };
  }
  if (!href) return { ...column(drawn), ...reading };
  // On a page, a link shrinks to what it holds: the box that sizes the image is around it, as legacy's link is as wide
  // as its place gives the image.
  const { alignSelf: _, ...boxPhone } = imagePhone;
  const inBox: TreeNode = { type: "Image", props, style: { width: "100%", ...imageBox(values) } };
  return {
    ...column({
      type: "Column",
      style: { width: size.width, maxWidth: size.maxWidth, alignItems: "stretch" },
      ...(Object.keys(boxPhone).length ? { mobile: boxPhone } : {}),
      children: [{ type: "Link", props: href, children: [inBox] }],
    }),
    ...reading,
  };
};

/**
 * An email image as legacy's plain text reads it: legacy writes a second image for classic Outlook (in a conditional
 * comment, which the plain text reads too) where it knows the image's height, so its alternate text is there twice.
 */
function imageText(src: Values, alt: string, asEmail: boolean): TreeNode {
  const img = `<img alt="${attribute(alt)}">`;
  return { type: "Column", children: [{ type: "Raw", props: { html: img.repeat(asEmail && outlookCopy(src) ? 2 : 1) } }] };
}

/** Whether an email image is drawn shorter than a line of 16px text (its height known from its own size). */
function shorterThanALine(src: Values, maxWidth: Json, room: number): boolean {
  if (!(typeof src.width === "number" && src.width > 0 && typeof src.height === "number" && src.height > 0)) return false;
  const width = Math.min(typeof maxWidth === "number" ? maxWidth : room, room);
  return (width * src.height) / src.width < 24;
}
