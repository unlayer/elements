/** What the Html, Image, Layer, List, Menu, Page and Paragraph stories share: a quiet mono caption, and pictures drawn in code. */

/** Quiet notes on what a story demonstrates are set in this, as the gallery's labels are. */
export const MONO = "'Geist Mono', SFMono-Regular, Menlo, Consolas, monospace";
export const MONO_FONT = { family: "Geist Mono", src: "https://fonts.gstatic.com/s/geistmono/v6/or3nQ6H-1_WfwkMZI_qYFrcdmhHkjko.woff2", format: "woff2", weight: "100 900" } as const;

/** A caption's look, in the color it sits on: small and mono, never the content. */
export const caption = (color: string) => ({ fontFamily: MONO, fontSize: 11, lineHeight: 1.5, color }) as const;

/** An SVG as an image's `src`, with the size of its file: no network, and nothing to host. */
export const drawing = (width: number, height: number, shapes: string, viewBox = `0 0 ${width} ${height}`) => ({
  src: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}" preserveAspectRatio="xMidYMid slice">${shapes}</svg>`)}`,
  width,
  height,
});
