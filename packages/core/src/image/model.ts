/**
 * A Canvas as an image any engine can draw: what the writer decides (its size and box, and each block as a box, a
 * block of text, an image or a drawing, with its styles), as plain data. No engine is named here: an engine is an
 * adapter that draws this (Satori's and resvg's is `satori.ts`, the only file that imports one), so the writer
 * doesn't change when the engine does.
 *
 * Styles are CSS's names and values for flexbox boxes and text (`display: "flex"`, `padding: "10px 20px"`,
 * `fontSize: "16px"`), lengths in px. A font family is one given (its file in `fonts`).
 */

export type Style = Record<string, string | number | undefined>;

/** A run of text inside a block of text: words, a styled run, an image in the line. */
export type Run = string | { kind: "span"; style: Style; runs: Run[] } | Picture;

export interface Picture {
  kind: "image";
  /** The image's file, as a data URI (nothing is fetched). */
  src: string;
  alt: string;
  style: Style;
}

export interface Shape {
  kind: "rect" | "circle" | "ellipse" | "line" | "polygon" | "path";
  /** Its geometry and paint (`x`, `cx`, `points`, `d`, `fill`, `stroke`, …), in its drawing's units. */
  attributes: Record<string, unknown>;
}

/** A block in the Canvas. */
export type Block =
  | { kind: "box"; style: Style; children: Block[] }
  | { kind: "text"; style: Style; runs: Run[] }
  | Picture
  | { kind: "drawing"; width: number; height: number; viewBox: string; shapes: Shape[] };

export interface Font {
  /** The family as the template names it. */
  family: string;
  data: ArrayBuffer;
  weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  style: "normal" | "italic";
}

export interface DrawnCanvas {
  /** Its size in px. */
  width: number;
  height: number;
  /** Its own box (its padding, background, text, gap). */
  style: Style;
  children: Block[];
  /** The font files the styles' families are drawn with. */
  fonts: Font[];
}

/** An engine that writes the image file: SVG, or PNG at `scale` pixels per px. */
export type Engine = (canvas: DrawnCanvas, output: { format: "png" | "svg"; scale: number }) => Promise<Uint8Array>;
