/** Email markup: layout tables, and colors as Word reads them. */
import type { Json } from "@unlayer-internal/elements-core";
import { close, h, open, Outlook, type Child, type Html, type Style, type StyleValue } from "../jsx";

/** What every layout table has: no role for screen readers, no spacing, no border. */
export const TABLE = { role: "presentation", cellpadding: "0", cellspacing: "0", border: "0" };

type TableProps = { id?: string; role?: string; class?: string | Array<string | undefined>; phone?: StyleValue; width?: string | number; bgcolor?: string; style?: StyleValue; children?: Child };

/** A layout table (`role` presentation, unless it says otherwise); an author's `id` first. */
export function Table({ children, style, ...attributes }: TableProps) {
  return (
    <table id={attributes.id} {...TABLE} {...attributes} style={style}>
      {children}
    </table>
  );
}

/** A color Word reads as a `bgcolor` attribute (hex only). */
export const bgcolor = (value: Json | undefined) => (typeof value === "string" && /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(value) ? value : undefined);

/**
 * A picture as a cell's background: `background` and CSS for the clients that take either, a VML rectangle around the
 * cell's content for classic Outlook, which takes neither. Of a fixed height, or fitted to its content. A background
 * has no alternate text: the rectangle has `alt`.
 */
export function pictureCell(
  src: string,
  { width, height, color, alt, tile = false, repeat, position, size }: { width: number; height?: number; color?: string; alt?: string; tile?: boolean; repeat?: string; position?: string; size?: string }
): { background: string; style: Style; open: Html; close: Html } {
  return {
    background: src,
    style: { backgroundImage: `url("${src.replace(/"/g, "%22")}")`, backgroundSize: size, backgroundPosition: position, backgroundRepeat: repeat },
    open: (
      <Outlook>
        {open(h("v:rect", { "xmlns:v": "urn:schemas-microsoft-com:vml", fill: "true", stroke: "false", alt, style: { width, height } }))}
        {h("v:fill", { type: tile ? "tile" : "frame", src, color })}
        {open(h("v:textbox", { inset: "0,0,0,0", style: height === undefined ? { msoFitShapeToText: "true" } : undefined }))}
      </Outlook>
    ),
    close: (
      <Outlook>
        {close("v:textbox")}
        {close("v:rect")}
      </Outlook>
    ),
  };
}

/** A background picture of today's components (`compat.background`) on a cell of this width. */
export function compatPicture(compat: Record<string, Json> | undefined, width: number) {
  const picture = compat?.background as { url: string; repeat?: string; position?: string; tile?: boolean } | undefined;
  return picture && pictureCell(picture.url, { width, repeat: picture.repeat, position: picture.position, tile: picture.tile });
}
