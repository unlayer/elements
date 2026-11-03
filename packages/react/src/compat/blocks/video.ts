/**
 * A video block, in a Column with the block's padding: on a page (or in a printed document) its player, as wide as
 * its place, 16:9, as legacy's; in an email its thumbnail as legacy writes it, as wide as its place at most the width
 * legacy works out (an image with no link: legacy's isn't one). A video that isn't YouTube's or Vimeo's, or one with a
 * link of its own, keeps its legacy HTML.
 */
import type { Json } from "@unlayer-internal/elements-core";
import { contentSlotWidth } from "../../utils/image-sizing";
import type { DesignBlock, Place, TreeNode } from "../lower";
import { imagePadding } from "../quirks";
import { sides, some, type Values } from "../values";

const URLS: Record<string, (id: string) => string> = {
  youtube: (id) => `https://www.youtube.com/watch?v=${id}`,
  vimeo: (id) => `https://vimeo.com/${id}`,
};

export function video(block: DesignBlock, place: Place): TreeNode | undefined {
  const { values } = block;
  if (values.mode !== undefined && values.mode !== place.mode) return undefined;
  const video: Values = values.video ?? {};
  const padding = sides(values.containerPadding ?? "10px");
  const url = typeof video.videoId === "string" && /^[\w-]+$/.test(video.videoId) ? URLS[video.type]?.(video.videoId) : undefined;
  if (!url || !padding || values.href !== undefined || (values.textAlign !== undefined && values.textAlign !== "center")) return undefined;
  const style: Record<string, Json> = some(padding) ? { padding } : {};
  if (place.mode !== "email") return { type: "Column", style, children: [{ type: "Video", props: { src: url } }] };
  if (typeof video.thumbnail !== "string" || !video.thumbnail) return undefined;
  const room = contentSlotWidth({ bodyValues: place.body, rowValues: place.row, rowCells: place.cells, columnIndex: place.index, columnValues: place.column, containerPadding: imagePadding(values, place.source) });
  return {
    type: "Column",
    style: { ...style, alignItems: "center" },
    children: [{ type: "Image", props: { src: video.thumbnail, alt: "Video", title: "Video" }, style: { width: "100%", maxWidth: Math.round(room * 100) / 100 } }],
  };
}
