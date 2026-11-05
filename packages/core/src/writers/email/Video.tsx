/**
 * A Video: in an email, which can't play one, its thumbnail linked to it, as wide as its place (a YouTube video's own
 * thumbnail where it has none); its title is the image's alternate text. Without a thumbnail, a link with its title.
 */
import { assetParts, videoParts, type Asset } from "../../kinds";
import { h } from "../jsx";
import type { Component } from "./context";

export const Video: Component = ({ node }) => {
  const url = String(node.props.src);
  const title = String(node.props.title);
  const thumbnail = node.props.thumbnail !== undefined ? assetParts(node.props.thumbnail as Asset).src : videoParts(url)?.thumbnail;
  if (!thumbnail) {
    return (
      <a id={node.id} href={url}>
        {title}
      </a>
    );
  }
  const width = node.width ?? undefined;
  return (
    <a id={node.id} href={url} title={title}>
      <img src={thumbnail} alt={title} width={width} border="0" style={{ display: "block", width: width !== undefined ? "100%" : undefined, maxWidth: width ?? "100%", height: "auto", border: "0" }} />
    </a>
  );
};
