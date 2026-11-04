/**
 * A video block, in a Column with the block's padding: in a page's markup its player, as wide as its place, 16:9; in an
 * email's its thumbnail (or the CDN's placeholder), as wide as its place at most the width legacy works out, linked
 * only where it has a link of its own. A video that isn't a YouTube or Vimeo one the new Video reads is the same 16:9
 * box around what its exporter draws there: the placeholder, a player of that id, or nothing. It always draws: what
 * can't be read is said.
 */
import { videoParts, type Json } from "@unlayer-internal/elements-core";
import { contentSlotWidth } from "../../utils/image-sizing";
import type { TreeNode } from "../lower";
import { imagePadding } from "../quirks";
import { attribute, columnsStack, DEFAULT_CDN, deviceValues, drawnImageUrl, drawnLink, sides, some, type Values } from "../values";
import type { Lowering } from "./index";

const WATCH: Record<string, (id: string) => string> = { youtube: (id) => `https://www.youtube.com/watch?v=${id}`, vimeo: (id) => `https://vimeo.com/${id}` };
const EMBED: Record<string, string> = { youtube: "https://www.youtube.com/embed/", vimeo: "https://player.vimeo.com/video/" };

const FILLS = "position:absolute;top:0;left:0;width:100%;height:100%";

/** The 16:9 box a page's markup has, around what's in it. */
const ratioBox = (inner: string): TreeNode => ({ type: "Raw", props: { html: `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%">${inner}</div>`, text: "" } });

export const video: Lowering = (block, place): TreeNode => {
  const { values, phone } = deviceValues(block.values, ["containerPadding"], place.mode);
  const asEmail = (values.mode ?? place.mode) === "email";
  const video: Values = values.video && typeof values.video === "object" ? values.video : {};
  const cdn = place.config.cdnBaseUrl ?? DEFAULT_CDN;
  const placeholder = `${cdn}/video/placeholder.png`;
  const padding = sides(values.containerPadding ?? "10px");
  if (!padding) place.note(`A video's padding ${JSON.stringify(values.containerPadding)} can't be read: it's drawn without it.`);
  const phonePadding = phone.containerPadding === undefined ? undefined : sides(phone.containerPadding);
  if (phone.containerPadding !== undefined && !phonePadding) place.note(`A video's padding on phones ${JSON.stringify(phone.containerPadding)} can't be read: it's drawn without it.`);
  const style: Record<string, Json> = some(padding) ? { padding: padding! } : {};
  const mobile = phonePadding ? { mobile: { padding: phonePadding } } : {};
  const id = typeof video.videoId === "string" ? video.videoId : "";
  if (asEmail) {
    const room = contentSlotWidth({ bodyValues: place.body, rowValues: place.row, rowCells: place.cells, columnIndex: place.index, columnValues: place.column, containerPadding: imagePadding(values, place.source) });
    const given = video.thumbnail ? drawnImageUrl(video.thumbnail, place.keep, (message) => place.note(`A video's thumbnail ${message}`)) : undefined;
    const max = Math.round(room * 100) / 100;
    // Legacy's maximum is its own where its row stacks, a stacked column being wider than on desktop (see image.ts).
    const slot = contentSlotWidth({ bodyValues: place.body, rowValues: place.row, rowCells: place.cells, columnIndex: place.index, columnValues: place.column, containerPadding: values.containerPadding ?? "10px" });
    const stacks = place.mode === "email" && columnsStack(place);
    const image: TreeNode = { type: "Image", props: { src: given ?? place.keep(placeholder), alt: "Video", title: "Video" }, style: { width: "100%", maxWidth: max }, ...(stacks && max > slot + 0.5 ? { compat: { stackedMaxWidth: max } } : {}) };
    const link = values.href ?? (typeof video.url === "string" && video.url ? { url: video.url, target: "" } : undefined);
    const href = link ? drawnLink(link, place.keep, place.note) : undefined;
    const linked = href && (href.href as { href: string }).href ? { type: "Link", props: href as Record<string, Json>, children: [image] } : image;
    return { type: "Column", style: { ...style, alignItems: "center" }, ...mobile, children: [linked] };
  }
  const watch = /^[\w-]+$/.test(id) ? WATCH[video.type]?.(id) : undefined;
  let drawn: TreeNode;
  if (watch && videoParts(watch) && place.mode !== "email") {
    drawn = { type: "Video", props: { src: watch } };
  } else if (video.loading || !id) {
    place.note("A video has no video to play: it's drawn as the placeholder.", "info");
    drawn = ratioBox(`<img aria-label="video placeholder" src="${attribute(placeholder)}" style="${FILLS}">`);
  } else if (EMBED[video.type]) {
    // A player in an email (a block that says it's a page's), or of an id the new Video doesn't read.
    if (!watch || !videoParts(watch)) place.note(`A video's id ${JSON.stringify(id)} can't be read: its player is written as it is.`);
    drawn = ratioBox(`<iframe src="${attribute(EMBED[video.type] + id)}" allow="autoplay; encrypted-media" allowfullscreen style="${FILLS};border:0"></iframe>`);
  } else {
    place.note(`A video of type ${JSON.stringify(video.type)} has no player: its place is left empty.`);
    drawn = ratioBox("");
  }
  return { type: "Column", style, ...mobile, children: [drawn] };
};
