/**
 * An Image: its width attribute in px (Word's size for it), fluid elsewhere
 * (100% of its cell, its width at most), its height in proportion where the
 * file's size is known.
 */
import { assetParts, type Asset } from "../../kinds";
import { h, type Style } from "../jsx";
import type { Component } from "./context";
import { fluidImage, PLACE, toNumber } from "./layout";
import { hiding } from "./styles";

export const Image: Component = ({ node, style, mobile, parent, fill, inline }) => {
  const { src, width: fileWidth, height: fileHeight } = assetParts(node.props.src as Asset);
  const width = node.width ?? undefined;
  const height = style.height !== undefined ? toNumber(style.height) : undefined;
  const fluid = fluidImage(node, style, mobile, fill);
  // In a stack or a Row its cell hides it; in a link, its own style.
  const hidden: { class?: string; style: Style } = parent.type === "Link" ? hiding(node, "block") : { style: {} };
  return (
    <img
      id={node.id}
      class={hidden.class}
      phone={fluid.phone}
      src={src}
      alt={(node.props.alt as string) ?? ""}
      title={node.props.title as string | undefined}
      width={width}
      // Its height in proportion, for Word, when the file's size is known.
      height={height ?? (width !== undefined && fileWidth && fileHeight ? Math.round((fileHeight * width) / fileWidth) : undefined)}
      border="0"
      style={[
        // Among text it's in the line.
        { display: inline ? "inline-block" : "block", verticalAlign: style.verticalAlign, ...fluid.style, height: height ?? "auto", border: "0" },
        { border: style.border, borderRadius: style.borderRadius },
        PLACE[style.alignSelf as string],
        hidden.style,
      ]}
    />
  );
};
