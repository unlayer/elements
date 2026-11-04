/**
 * A Layer: an Image with one child over it, the email way (anything else is reported before writing, see
 * `layerShape` in layout.tsx). The image is the cell's background, covering it (`background` and CSS for the clients
 * that take either, a VML rectangle for classic Outlook, which takes neither); the child is the cell's content, placed
 * by the cell's `valign` and `align`. The cell is the image's height at the Layer's width, or the Layer's height. A
 * background has no alternate text: the image's is an empty labelled image's, for screen readers, and the VML's.
 */
import { assetParts, type Asset } from "@unlayer-internal/elements-core";
import { close, h, NotOutlook, open, Outlook, raw } from "../jsx";
import type { Component } from "./context";
import { boxWidth, layerShape, phoneWidth, VALIGN } from "./layout";
import { bgcolor, Table } from "./markup";
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
  const vml = (
    <Outlook>
      {open(h("v:rect", { "xmlns:v": "urn:schemas-microsoft-com:vml", fill: "true", stroke: "false", alt, style: { width, height } }))}
      {h("v:fill", { type: "frame", src, color: background })}
      {open(h("v:textbox", { inset: "0,0,0,0" }))}
    </Outlook>
  );
  return (
    <Table id={node.id} phone={phoneWidth(mobile.maxWidth ?? mobile.width)} width={box.width} style={{ maxWidth: box.maxWidth }}>
      <tr>
        <td
          background={src}
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
            backgroundImage: `url("${src.replace(/"/g, "%22")}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            border: style.border,
            borderRadius: style.borderRadius,
            // Its corners cut the child over the image too, as a page's do.
            overflow: style.borderRadius !== undefined ? "hidden" : undefined,
          }}
        >
          {vml}
          {alt && (
            <NotOutlook>
              <div class={hiding(base, "block").class} role="img" aria-label={alt} />
            </NotOutlook>
          )}
          {over && render(over, { fill: style.justifyItems === "stretch" })}
          <Outlook>
            {close("v:textbox")}
            {close("v:rect")}
          </Outlook>
        </td>
      </tr>
    </Table>
  );
};
