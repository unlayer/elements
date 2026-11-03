/**
 * An image block as an Image (in a Link where its action is a web link) in a Column with the block's padding, placed
 * by its alignment. Its width and maximum width are legacy's: a share of its place (100% where it takes its own size)
 * at most its own width or that share of the place legacy works out from the design (the content width, the row's and
 * column's padding and the column's share), as legacy writes them.
 */
import type { Json } from "@unlayer-internal/elements-core";
import { contentSlotWidth } from "../../utils/image-sizing";
import type { DesignBlock, Place, TreeNode } from "../lower";
import { imageBox, imagePadding, outlookCopy } from "../quirks";
import { ALIGN, px, sides, some, webLink, type Values } from "../values";

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

export function image(block: DesignBlock, place: Place): TreeNode | undefined {
  const { values } = block;
  if (values.mode !== undefined && values.mode !== place.mode) return undefined;
  const src: Values = values.src ?? {};
  const padding = sides(values.containerPadding ?? "10px");
  // A dynamic image's URL is resized by legacy; a full-width one sits past the column's padding.
  if (typeof src.url !== "string" || !src.url || src.dynamic || values.fullWidth || !padding || (values.textAlign !== undefined && !ALIGN[values.textAlign])) return undefined;
  // A linked image keeps its legacy HTML: legacy's link holds the image at the size its place gives it (on a page a
  // link the new engine draws shrinks to its image's own size; in an email a share of the place isn't one on phones).
  const href = webLink(values.action);
  if (href !== null) return undefined;
  const ownBorder = values.border && typeof values.border === "object" ? values.border : {};
  const borders = ["Left", "Right"].map((side) => parseFloat(String(ownBorder[`border${side}Width`] ?? 0)) || 0);
  const room =
    contentSlotWidth({ bodyValues: place.body, rowValues: place.row, rowCells: place.cells, columnIndex: place.index, columnValues: place.column, containerPadding: imagePadding(values, place.source) }) -
    borders[0] -
    borders[1];
  const size = imageSize(src, room);
  if (!size) return undefined;
  // An email image shorter than a line of text: legacy's sits in a line of the cell's text (its strut's height, the
  // font's), which the new email's image doesn't; it keeps its legacy HTML.
  if (place.mode === "email" && shorterThanALine(src, size.maxWidth, room)) return undefined;
  // Phone settings (a page's: an email's keep their legacy HTML): the block's padding, and the image's width.
  const phone: Values = values._override?.mobile ?? {};
  const columnPhone: Record<string, Json> = {};
  const imagePhone: Record<string, Json> = {};
  for (const [key, value] of Object.entries(phone)) {
    if (key === "hideMobile") continue;
    if (key === "containerPadding" && sides(value)) columnPhone.padding = sides(value)!;
    else if (key === "src" && value && typeof value === "object") {
      // Legacy's phone rule: the width given there (or 100%), at most that width or the image's own.
      const merged = { ...src, ...value };
      const max = merged.autoWidth === false ? length(merged.maxWidth) : undefined;
      const limit = length(max ? css(max) : merged.width ?? "100%");
      if (!limit) return undefined;
      imagePhone.width = max ? css(max) : "100%";
      imagePhone.maxWidth = css(limit);
    } else return undefined;
  }
  const alt = typeof values.altText === "string" ? values.altText : "";
  const asset: Record<string, Json> = { src: src.url };
  for (const side of ["width", "height"] as const) if (typeof src[side] === "number" && src[side] > 0) asset[side] = src[side];
  // In an email, legacy's maximum is the image's own on phones too, where a stacked column is wider than on desktop: the
  // new email's caps an image at the width it's drawn at on desktop, so a maximum past that (legacy's place leaves the
  // block's padding in) is the image's on phones, in a row of columns that stack (a row's only column is no wider there).
  const slot =
    contentSlotWidth({ bodyValues: place.body, rowValues: place.row, rowCells: place.cells, columnIndex: place.index, columnValues: place.column, containerPadding: values.containerPadding ?? "10px" }) -
    borders[0] -
    borders[1];
  const share = typeof size.width === "string" && size.width.endsWith("%") ? (slot * parseFloat(size.width)) / 100 : typeof size.width === "number" ? size.width : slot;
  const stacks = place.cells.length > 1 && !(place.row.noStackMobile || place.row._override?.mobile?.noStackMobile);
  if (place.mode === "email" && stacks && typeof size.maxWidth === "number" && size.maxWidth > share + 0.5) imagePhone.maxWidth = size.maxWidth;
  const sized = { style: { width: size.width, maxWidth: size.maxWidth }, ...(Object.keys(imagePhone).length ? { mobile: imagePhone } : {}) };
  // Legacy gives an image its alternate text as its title too (a tooltip).
  const props = { src: asset, alt, ...(alt ? { title: alt } : {}) };
  const drawn: TreeNode = { type: "Image", props, ...sized, style: { ...sized.style, ...imageBox(values) } };
  return {
    type: "Column",
    style: { ...(some(padding) ? { padding } : {}), alignItems: ALIGN[values.textAlign ?? "center"] },
    ...(Object.keys(columnPhone).length ? { mobile: columnPhone } : {}),
    children: [place.mode === "email" ? { ...drawn, textAs: imageText(src, alt) } : drawn],
  };
}

/**
 * An email image as legacy's plain text reads it: legacy writes a second image for classic Outlook (in a conditional
 * comment, which the plain text reads too) where it knows the image's height, so its alternate text is there twice.
 */
function imageText(src: Values, alt: string): TreeNode {
  const escape = (text: string) => text.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const img = `<img alt="${escape(alt)}">`;
  return { type: "Raw", props: { html: img.repeat(outlookCopy(src) ? 2 : 1) } };
}

/** Whether an email image is drawn shorter than a line of 16px text (its height known from its own size). */
function shorterThanALine(src: Values, maxWidth: Json, room: number): boolean {
  if (!(typeof src.width === "number" && src.width > 0 && typeof src.height === "number" && src.height > 0)) return false;
  const width = Math.min(typeof maxWidth === "number" ? maxWidth : room, room);
  return (width * src.height) / src.width < 24;
}
