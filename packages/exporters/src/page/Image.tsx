/** An Image: a block, no wider than its parent; its width attribute in px where it's known. */
import { assetParts, type Asset } from "@unlayer-internal/elements-core";
import { h } from "../jsx";
import type { Component } from "./context";

export const Image: Component = ({ node, style, parent, placement, classes }) => {
  // Under the children of a Layer with a height, it covers the Layer, cut at its sides or its top and bottom.
  const covers = parent.type === "Layer" && parent.style.height !== undefined && parent.children.find((c) => typeof c !== "string") === node;
  return (
  <img
    id={node.id}
    class={classes()}
    src={assetParts(node.props.src as Asset).src}
    alt={(node.props.alt as string) ?? ""}
    aria-label={node.compat?.ariaLabel as string | undefined}
    title={node.props.title as string | undefined}
    // A percentage is a share of its parent, not a size of its own.
    width={typeof style.width !== "string" && node.width !== null ? node.width : undefined}
    style={[
      placement,
      {
        display: "block",
        maxWidth: style.maxWidth ?? "100%",
        width: parent.type === "Row" ? undefined : style.width,
        height: style.height ?? "auto",
        alignSelf: style.alignSelf,
        verticalAlign: style.verticalAlign,
        border: style.border,
        borderRadius: style.borderRadius,
      },
      covers && { width: "100%", height: "100%", maxWidth: "none", objectFit: "cover" },
    ]}
  />
  );
};
