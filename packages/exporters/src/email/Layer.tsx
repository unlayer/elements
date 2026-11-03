/**
 * A Layer: an Image with one child over it, the email way (anything else is reported before writing, see
 * `layerShape`). The image is the cell's background, covering it (`background` and CSS for the clients that take
 * either, a VML rectangle for classic Outlook, which takes neither); the child is the cell's content, placed by the
 * cell's `valign` and `align`. The cell is the image's height at the Layer's width, or the Layer's height. A
 * background has no alternate text: the image's is an empty labelled image's, for screen readers, and the VML's.
 */
import { assetParts, type Asset, type ResolvedNode } from "@unlayer-internal/elements-core";
import { close, h, NotOutlook, open, Outlook, raw } from "../jsx";
import { isNode, shown, type Component } from "./context";
import { boxWidth, phoneWidth, VALIGN } from "./layout";
import { bgcolor, Table } from "./markup";
import { hiding } from "./styles";

const ALIGN: Record<string, string | undefined> = { start: "left", center: "center", end: "right", stretch: undefined };

/** What an email draws of a Layer: its Image, the child over it and its height; or why it can't. */
export function layerShape(node: ResolvedNode): { base: ResolvedNode; over?: ResolvedNode; height: number } | { problem: string; path: string } {
  const children = node.children.filter(isNode).filter(shown);
  const [base, over] = children;
  if (!base || base.type !== "Image" || children.length > 2) {
    return { problem: `In an email, a Layer is an Image with one child over it (drawn as the image's background); this one has ${children.length > 2 ? `${children.length} children` : base ? `a ${base.type} under` : "no children"}`, path: node.path };
  }
  if (base.width === null || node.contentWidth === null || Math.abs(base.width - node.contentWidth) > 1) {
    return { problem: "In an email, a Layer's Image is as wide as the Layer (it's drawn as its background): give it width 100%", path: `${base.path}.style.width` };
  }
  if (typeof node.style.height === "number") return { base, over, height: node.style.height };
  const { width, height } = assetParts(base.props.src as Asset);
  if (!width || !height) {
    return { problem: "In an email, a Layer is as tall as its Image, which needs its file's width and height (src={{ src, width, height }}); or give the Layer a height", path: `${base.path}.props.src` };
  }
  return { base, over, height: Math.round((base.width * height) / width) };
}

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
