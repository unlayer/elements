/**
 * A Layer: an Image with one child over it, the email way (anything else is reported before writing, see
 * `layerShape` in layout.tsx). The image is the cell's background, covering it (`background` and CSS for the clients
 * that take either, a VML rectangle for classic Outlook, which takes neither); the child is the cell's content, placed
 * by the cell's `valign` and `align`. The cell is the image's height at the Layer's width, or the Layer's height. A
 * background has no alternate text: the image's is an empty labelled image's, for screen readers, and the VML's.
 */
import { assetParts, type Asset } from "../../kinds";
import { h, NotOutlook, raw } from "../jsx";
import type { Component } from "./context";
import { boxWidth, layerShape, phoneWidth, VALIGN } from "./layout";
import { bgcolor, ownBorders, pictureCell, Table } from "./markup";
import { hiding } from "./styles";

const ALIGN: Record<string, string | undefined> = { start: "left", center: "center", end: "right", stretch: undefined };

export const Layer: Component = ({ node, style, mobile, fill, render }) => {
  const shape = layerShape(node);
  if ("problem" in shape) return raw("");
  const { base, over, height } = shape;
  const src = assetParts(base.props.src as Asset).src;
  const width = node.contentWidth ?? 0;
  const background = bgcolor(style.backgroundColor);
  const box = boxWidth(node, fill);
  const alt = (base.props.alt as string | undefined) || undefined;
  // An image hidden on phones leaves the Layer there as tall as what's over it (or its own height), as on a page.
  const phoneless = !!base.hidden?.mobile;
  const picture = pictureCell(src, { width, height, color: background, alt, repeat: "no-repeat", position: "center", size: "cover" });
  return (
    <Table id={node.id} phone={phoneWidth(mobile.maxWidth ?? mobile.width)} width={box.width} style={{ maxWidth: box.maxWidth, borderCollapse: ownBorders(style, mobile) }}>
      <tr>
        <td
          background={picture.background}
          bgcolor={background}
          height={height}
          valign={VALIGN[(style.alignItems as string) ?? "start"]}
          align={ALIGN[(style.justifyItems as string) ?? "stretch"]}
          phone={{
            border: mobile.border,
            backgroundColor: mobile.backgroundColor,
            backgroundImage: phoneless ? "none" : undefined,
            height: phoneless && style.height === undefined ? "auto" : undefined,
          }}
          style={{
            height,
            backgroundColor: style.backgroundColor,
            ...picture.style,
            border: style.border,
            borderRadius: style.borderRadius,
            // Its corners cut the child over the image too, as a page's do.
            overflow: style.borderRadius !== undefined ? "hidden" : undefined,
          }}
        >
          {picture.open}
          {alt && (
            <NotOutlook>
              <div class={hiding(base, "block").class} role="img" aria-label={alt} />
            </NotOutlook>
          )}
          {over && render(over, { fill: style.justifyItems === "stretch" })}
          {picture.close}
        </td>
      </tr>
    </Table>
  );
};
