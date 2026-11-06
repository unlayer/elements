/** Group D's one shared helper: a picture drawn in code as an SVG, so it needs no network. */
export const drawing = (width: number, height: number, body: string) => ({
  src: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`)}`,
  width,
  height,
});
