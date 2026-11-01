#!/usr/bin/env node
// Run with: node scripts/storybook-compare.mjs   (requires `pnpm build-storybook` first)
// Against a running Storybook instead: STORYBOOK_URL=http://localhost:6006 node scripts/storybook-compare.mjs
//
// The new engine draws what main draws. Each "Primitives/Compare with main" story puts one of main's
// designs, rendered by today's components, next to the same design written with the new components.
// This loads each one in headless Chromium at the desktop and phone widths, with main's quirks drawn
// (where main draws something other than what its template asks, the story's `nextAsMain`), and checks
// that every run of text and every image sits in the same place, at the same size and in the same style
// on both sides, within a pixel.
//
// Both sides are measured in one browser on one machine, so their fonts are the same: unlike the
// visual-drift gate, geometry is safe to compare here. Every image is served one square placeholder, so
// nothing depends on the network (square, as main's social icons are drawn whatever the file).

import { chromium } from "playwright";
import { spawn } from "child_process";
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const PKG_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const STATIC_DIR = join(PKG_DIR, "storybook-static");
const PORT = 6008;
const BASE = process.env.STORYBOOK_URL ?? `http://127.0.0.1:${PORT}`;
const PREFIX = "primitives-compare-with-main--";
const WIDTHS = ["desktop", "phone"];
const TOLERANCE = 1;
const PLACEHOLDER = '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000"><rect width="1000" height="1000" fill="#999"/></svg>';
// Line height shows in where the lines sit (their boxes), not as a style: "normal" and 1.2 draw the same.
const TEXT_STYLES = ["fontFamily", "fontSize", "fontWeight", "fontStyle", "color", "letterSpacing", "textDecorationLine", "textTransform"];

let server;
let index;
if (process.env.STORYBOOK_URL) {
  index = await (await fetch(`${BASE}/index.json`)).json();
} else {
  if (!existsSync(join(STATIC_DIR, "index.json"))) {
    console.error("COMPARE_FAIL: storybook-static/index.json not found — run `pnpm build-storybook` first");
    process.exit(1);
  }
  index = JSON.parse(readFileSync(join(STATIC_DIR, "index.json"), "utf8"));
  server = spawn(process.execPath, [join(PKG_DIR, "node_modules", "http-server", "bin", "http-server"), STATIC_DIR, "-p", String(PORT), "--silent"], { stdio: "ignore" });
}

const ids = Object.values(index.entries ?? {})
  .filter((entry) => entry.type === "story" && entry.id.startsWith(PREFIX))
  .map((entry) => entry.id)
  .sort();
if (ids.length === 0) {
  console.error(`COMPARE_FAIL: no ${PREFIX}* stories in the Storybook index`);
  server?.kill();
  process.exit(1);
}

async function ready() {
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(`${BASE}/iframe.html`)).ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error("Storybook isn't answering");
}

/** Each frame's runs of text (by their words, in order) and images: where they are, how big, and the text's style. */
function measure(styles) {
  return [...document.querySelectorAll("#storybook-root iframe")].map((frame) => {
    const doc = frame.contentDocument;
    const box = (rect) => [rect.x, rect.y, rect.width, rect.height].map(Math.round);
    const texts = {};
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const words = node.textContent.replace(/\s+/g, " ").trim();
      if (!words) continue;
      const range = doc.createRange();
      range.selectNodeContents(node);
      const rect = range.getBoundingClientRect();
      if (!rect.width) continue;
      const computed = doc.defaultView.getComputedStyle(node.parentElement);
      (texts[words] ??= []).push({ box: box(rect), style: styles.map((p) => `${p}:${computed[p]}`).join(";") });
    }
    const images = [...doc.images].filter((img) => img.getBoundingClientRect().width).map((img) => box(img.getBoundingClientRect()));
    return { texts, images };
  });
}

const near = (a, b) => a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) <= TOLERANCE);

/** What differs between main's frame and the new engine's. */
function differences([main, next]) {
  const out = [];
  for (const words of new Set([...Object.keys(main.texts), ...Object.keys(next.texts)])) {
    const a = main.texts[words] ?? [];
    const b = next.texts[words] ?? [];
    const label = JSON.stringify(words.length > 50 ? `${words.slice(0, 50)}…` : words);
    if (a.length !== b.length) {
      out.push(`${label}: ${a.length} time(s) in main, ${b.length} in the new engine`);
      continue;
    }
    a.forEach((run, i) => {
      if (!near(run.box, b[i].box)) out.push(`${label}: at ${run.box} in main, ${b[i].box} in the new engine`);
      if (run.style !== b[i].style) {
        const theirs = new Set(b[i].style.split(";"));
        out.push(`${label}: ${run.style.split(";").filter((s) => !theirs.has(s)).join(", ")} in main; ${b[i].style.split(";").filter((s) => !run.style.includes(s)).join(", ")} in the new engine`);
      }
    });
  }
  if (main.images.length !== next.images.length) out.push(`${main.images.length} images in main, ${next.images.length} in the new engine`);
  else main.images.forEach((box, i) => near(box, next.images[i]) || out.push(`image ${i + 1}: at ${box} in main, ${next.images[i]} in the new engine`));
  return out;
}

const browser = await chromium.launch();
let failures = 0;
try {
  await ready();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.route("**/*", (route) =>
    route.request().resourceType() === "image" ? route.fulfill({ contentType: "image/svg+xml", body: PLACEHOLDER }) : route.continue()
  );
  for (const id of ids) {
    for (const width of WIDTHS) {
      await page.goto(`${BASE}/iframe.html?viewMode=story&id=${id}&args=width:${width};quirks:!true`, { waitUntil: "load" });
      await page.waitForFunction(
        () => {
          const frames = [...document.querySelectorAll("#storybook-root iframe")];
          return (
            frames.length === 2 &&
            frames.every((f) => f.contentDocument?.readyState === "complete" && f.contentDocument.body?.childElementCount > 0 && [...f.contentDocument.images].every((img) => img.complete))
          );
        },
        null,
        { timeout: 15_000 }
      );
      await page.evaluate(() => Promise.all([...document.querySelectorAll("#storybook-root iframe")].map((f) => f.contentDocument.fonts.ready)));
      const found = differences(await page.evaluate(measure, TEXT_STYLES));
      const story = `${id.slice(PREFIX.length)}@${width}`;
      if (found.length) {
        failures++;
        console.error(`COMPARE_DIFF [${story}]`);
        for (const line of found.slice(0, 12)) console.error(`  ${line}`);
        if (found.length > 12) console.error(`  … and ${found.length - 12} more`);
      } else console.log(`  ok ${story}`);
    }
  }
} finally {
  await browser.close();
  server?.kill();
}

if (failures) {
  console.error(`COMPARE_FAIL: ${failures} of ${ids.length * WIDTHS.length} comparisons differ from main`);
  process.exit(1);
}
console.log(`COMPARE_OK: ${ids.length} designs x ${WIDTHS.length} widths draw what main draws`);
