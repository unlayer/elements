/**
 * An Image: its width attribute in px (Word's size for it), fluid elsewhere
 * (100% of its cell, its width at most), its height in proportion where the
 * file's size is known.
 */
import { assetParts, type Asset } from "@unlayer-internal/elements-core";
import { h } from "../jsx";
import type { Writer } from "./context";
import { toNumber } from "./layout";
import { names } from "./markup";
import { hiding, phoneClass } from "./styles";

export const writeImage: Writer = (node, place, context) => {
  const { src, width: fileWidth, height: fileHeight } = assetParts(node.props.src as Asset);
  const { style } = node;
  const width = node.width ?? undefined;
  if (width === undefined) {
    context.d.warning(
      "email/image-width",
      "This Image has no width: Outlook shows it at the size of its file, however wide that is. Give it a width, or the file's width in src",
      `${node.path}.props.src`,
      node.id
    );
  }
  // A percentage of its cell on phones too, where it isn't the whole of a Row's cell.
  const percent = !place.fill && typeof style.width === "string" && style.width.endsWith("%") && style.maxWidth === undefined ? style.width : undefined;
  const height = style.height !== undefined ? toNumber(style.height) : undefined;
  const mobileWidth = node.mobile?.maxWidth ?? node.mobile?.width;
  // In a stack or a Row its cell hides it; in a link, its own style.
  const hidden = place.parent.type === "Link" ? hiding(node, context, "block") : { style: {} };
  const className = names(hidden.className, phoneClass(context, { maxWidth: mobileWidth }));
  if (style.borderRadius !== undefined) {
    context.d.add("email/outlook-degraded", "info", "borderRadius on this Image shows square corners in classic Outlook", `${node.path}.style.borderRadius`, node.id);
  }
  // Its height in proportion, for Word, when the file's size is known.
  const scaled = height ?? (width !== undefined && fileWidth && fileHeight ? Math.round((fileHeight * width) / fileWidth) : undefined);

  return (
    <img
      id={node.id}
      class={className}
      src={src}
      alt={(node.props.alt as string) ?? ""}
      width={width}
      height={scaled}
      border="0"
      style={[
        { display: "block", width: width !== undefined ? "100%" : undefined, maxWidth: percent ?? width ?? "100%", height: height ?? "auto", border: "0" },
        { border: style.border, borderRadius: style.borderRadius },
        hidden.style,
      ]}
    />
  );
};
