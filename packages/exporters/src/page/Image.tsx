/** An Image: a block, no wider than its parent; its width attribute in px where it's known. */
import { assetParts, type Asset } from "@unlayer-internal/elements-core";
import { h } from "../jsx";
import type { Component } from "./context";

export const Image: Component = ({ node, style, parent, placement, classes }) => (
  <img
    id={node.id}
    class={classes()}
    src={assetParts(node.props.src as Asset).src}
    alt={(node.props.alt as string) ?? ""}
    // A percentage is a share of its parent, not a size of its own.
    width={typeof style.width !== "string" && node.width !== null ? node.width : undefined}
    style={[
      placement,
      {
        display: "block",
        maxWidth: style.maxWidth ?? "100%",
        width: parent.type === "Row" ? undefined : style.width,
        height: style.height ?? "auto",
        border: style.border,
        borderRadius: style.borderRadius,
      },
    ]}
  />
);
