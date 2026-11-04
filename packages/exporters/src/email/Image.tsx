/**
 * An Image: its width attribute in px (Word's size for it), fluid elsewhere
 * (100% of its cell, its width at most), its height in proportion where the
 * file's size is known.
 */
import { assetParts, type Asset, type Json } from "@unlayer-internal/elements-core";
import { h, type Style } from "../jsx";
import type { Component } from "./context";
import { toNumber } from "./layout";
import { fillsOnPhones, hiding } from "./styles";

/** Where it sits in its cell on phones: its margins (the cell's `align` is for desktop). */
const PLACE: Record<string, Style> = { start: { marginLeft: 0, marginRight: "auto" }, center: { marginLeft: "auto", marginRight: "auto" }, end: { marginLeft: "auto", marginRight: 0 } };

export const Image: Component = ({ node, style, mobile, parent, fill, inline }) => {
  const { src, width: fileWidth, height: fileHeight } = assetParts(node.props.src as Asset);
  const width = node.width ?? undefined;
  const height = style.height !== undefined ? toNumber(style.height) : undefined;
  // A percentage of its cell on phones too, where it isn't the whole of a Row's cell; with a maximum, its width
  // as written and its size in px as the cap.
  const percent = !fill && typeof style.width === "string" && style.width.endsWith("%") ? style.width : undefined;
  const capped = percent !== undefined && style.maxWidth !== undefined;
  // The cap: its width, or the maximum as given where its width is that maximum rounded (a share of a column can be a
  // fraction of a pixel, which the cap keeps so the image is as wide as the share).
  const given = typeof style.maxWidth === "number" || /^\d*\.?\d+px$/.test(String(style.maxWidth)) ? toNumber(style.maxWidth as Json) : undefined;
  const cap = given !== undefined && width !== undefined && Math.round(given) === width ? given : width;
  // In a stack or a Row its cell hides it; in a link, its own style.
  const own = parent.type === "Link" ? hiding(node, "block") : { style: {} };
  const hidden = { ...own, class: [own.class, fillsOnPhones(node)] };
  return (
    <img
      id={node.id}
      class={hidden.class}
      // (With a maximum, a share of its cell is its own on phones. A width there replaces that share, or it would still be the share.)
      phone={[{ width: mobile.maxWidth !== undefined || capped ? mobile.width : undefined, maxWidth: mobile.maxWidth ?? mobile.width }, PLACE[mobile.alignSelf as string]]}
      src={src}
      alt={(node.props.alt as string) ?? ""}
      aria-label={node.compat?.ariaLabel as string | undefined}
      title={node.props.title as string | undefined}
      width={width}
      // Its height in proportion, for Word, when the file's size is known.
      height={height ?? (width !== undefined && fileWidth && fileHeight ? Math.round((fileHeight * width) / fileWidth) : undefined)}
      border="0"
      style={[
        // Among text it's in the line.
        { display: inline ? "inline-block" : "block", verticalAlign: style.verticalAlign, width: capped ? percent : width !== undefined ? "100%" : undefined, maxWidth: capped ? cap : (percent ?? width ?? "100%"), height: height ?? "auto", border: "0" },
        { border: style.border, borderRadius: style.borderRadius },
        PLACE[style.alignSelf as string],
        hidden.style,
      ]}
    />
  );
};
