/**
 * An Image: its width attribute in px (Word's size for it), fluid elsewhere
 * (100% of its cell, its width at most), its height in proportion where the
 * file's size is known.
 */
import { assetParts, type Asset } from "@unlayer-internal/elements-core";
import { h } from "../jsx";
import type { Component } from "./context";
import { toNumber } from "./layout";
import { hiding } from "./styles";

export const Image: Component = ({ node, style, mobile, parent, fill }) => {
  const { src, width: fileWidth, height: fileHeight } = assetParts(node.props.src as Asset);
  const width = node.width ?? undefined;
  const height = style.height !== undefined ? toNumber(style.height) : undefined;
  // A percentage of its cell on phones too, where it isn't the whole of a Row's cell.
  const percent = !fill && typeof style.width === "string" && style.width.endsWith("%") && style.maxWidth === undefined ? style.width : undefined;
  // In a stack or a Row its cell hides it; in a link, its own style.
  const hidden = parent.type === "Link" ? hiding(node, "block") : { style: {} };
  return (
    <img
      id={node.id}
      class={hidden.class}
      phone={{ maxWidth: mobile.maxWidth ?? mobile.width }}
      src={src}
      alt={(node.props.alt as string) ?? ""}
      width={width}
      // Its height in proportion, for Word, when the file's size is known.
      height={height ?? (width !== undefined && fileWidth && fileHeight ? Math.round((fileHeight * width) / fileWidth) : undefined)}
      border="0"
      style={[
        { display: "block", width: width !== undefined ? "100%" : undefined, maxWidth: percent ?? width ?? "100%", height: height ?? "auto", border: "0" },
        { border: style.border, borderRadius: style.borderRadius },
        hidden.style,
      ]}
    />
  );
};
