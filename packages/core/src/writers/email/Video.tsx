/**
 * A Video: in an email, which can't play one, its thumbnail linked to it, as wide as its place (a YouTube video's own
 * thumbnail where it has none); its title is the image's alternate text. Without a thumbnail, a link with its title.
 */
import { assetParts, videoParts, type Asset } from "../../kinds";
import { h } from "../jsx";
import type { Component } from "./context";
import { fluidImage } from "./layout";

export const Video: Component = ({ node, style, mobile, fill }) => {
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
  const fluid = fluidImage(node, style, mobile, fill);
  return (
    <a id={node.id} href={url} title={title}>
      <img phone={fluid.phone} src={thumbnail} alt={title} width={node.width ?? undefined} border="0" style={{ display: "block", ...fluid.style, height: "auto", border: "0" }} />
    </a>
  );
};
