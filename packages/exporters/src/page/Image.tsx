/** An Image: a block, no wider than its parent; its width attribute in px where it's known. */
import { assetParts, type Asset } from "@unlayer-internal/elements-core";
import { h } from "../jsx";
import type { Writer } from "./context";
import { classesFor } from "./styles";

export const writeImage: Writer = (node, parent, context, placement) => {
  const classes = classesFor(node, context);
  const { src } = assetParts(node.props.src as Asset);
  const { style } = node;
  // A percentage is a share of its parent, not a size of its own.
  const width = typeof style.width !== "string" && node.width !== null ? node.width : undefined;
  return (
    <img
      id={node.id}
      class={classes}
      src={src}
      alt={(node.props.alt as string) ?? ""}
      width={width}
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
};
