/** A Video: its player, as wide as its place (its width and maximum where it has them), 16:9. */
import { videoParts } from "@unlayer-internal/elements-core";
import { h } from "../jsx";
import type { Component } from "./context";

export const Video: Component = ({ node, style, placement, classes }) => (
  <div
    id={node.id}
    class={classes()}
    style={[placement, { width: style.width, maxWidth: style.maxWidth }]}
  >
    <div style={{ position: "relative", height: "0", paddingBottom: "56.25%", overflow: "hidden" }}>
      <iframe
        src={videoParts(String(node.props.src))?.embed}
        title={String(node.props.title)}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowfullscreen=""
        loading="lazy"
        style={{ position: "absolute", top: "0", left: "0", width: "100%", height: "100%", border: "0" }}
      />
    </div>
  </div>
);
