#!/usr/bin/env node
// Run with: node scripts/gallery-assets.mjs
//
// Draws the gallery's images. Each SVG under src/primitives/examples/gallery/assets is
// written as a PNG of the SVG's own size beside it, in Chromium, with the web fonts its
// text names (Geist Mono) loaded first. Emails get the PNGs: most mail clients don't
// show SVG images.

import { chromium } from "playwright";
import { readdirSync, readFileSync, statSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const ASSETS = join(dirname(fileURLToPath(import.meta.url)), "..", "src/primitives/examples/gallery/assets");
const FONTS = "https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&display=block";

const svgs = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? svgs(path) : name.endsWith(".svg") ? [path] : [];
});

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const path of svgs(ASSETS)) {
    await page.setContent(`<!doctype html><link rel="stylesheet" href="${FONTS}"><style>html,body{margin:0}svg{display:block}</style>${readFileSync(path, "utf8")}`, { waitUntil: "networkidle" });
    await page.evaluate(async () => {
      await Promise.all(["400 17px 'Geist Mono'", "500 17px 'Geist Mono'"].map((font) => document.fonts.load(font)));
      await document.fonts.ready;
    });
    const out = path.replace(/\.svg$/, ".png");
    await page.locator("svg").first().screenshot({ path: out });
    console.info(`drew ${out}`);
  }
} finally {
  await browser.close();
}
