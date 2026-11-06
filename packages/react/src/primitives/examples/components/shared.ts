/** What the component stories share: a few colors, a font, and pictures drawn in the page (no network). */
export const INK = "#1F2933";
export const MUTED = "#616E7C";
export const BRAND = "#0F766E";
export const WASH = "#F5F7FA";
export const WHITE = "#FFFFFF";
export const FONT = "Arial, Helvetica, sans-serif";
export const LINE = "1px solid #E4E7EB";

/** A flat color as a picture, drawn in the page (no network). */
export const picture = (color: string, width = 400, height = 240) => ({
  src: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="${color}"/></svg>`)}`,
  width,
  height,
});

/** Hills under a sun as a picture, drawn in the page (no network). */
export const landscape = (width = 900, height = 540) => ({
  src: `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 900 540" preserveAspectRatio="none"><rect width="900" height="540" fill="#355B48"/><circle cx="710" cy="120" r="145" fill="#F3C880"/><path d="M0 420 Q210 140 420 330 T900 300 V540 H0Z" fill="#709681"/><path d="M0 490 Q350 290 620 430 T900 400 V540 H0Z" fill="#20372A"/></svg>`
  )}`,
  width,
  height,
});
