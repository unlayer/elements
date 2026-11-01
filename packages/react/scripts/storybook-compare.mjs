#!/usr/bin/env node
// Run with: node scripts/storybook-compare.mjs   (requires `pnpm build-storybook` first)
// Against a running Storybook instead: STORYBOOK_URL=http://localhost:6006 node scripts/storybook-compare.mjs
// One design: COMPARE_ONLY=stripe-receipt
//
// The new engine draws what main draws. Each "Primitives/Compare with main" story puts one of main's
// designs, rendered by today's components, next to the same design written with the new components.
// This loads each one in headless Chromium at the desktop and phone widths, with main's quirks drawn
// (where main draws something other than what its template asks, the story's `nextAsMain`), and checks
// that every run of text and every image sits in the same place, at the same size and in the same style
// on both sides, within a pixel, and each image is the same file.
//
// Then what's painted besides text (backgrounds, borders, dividers, buttons' shapes, images' boxes, background images
// drawn as the placeholder):
// each frame's screenshot with its text made transparent, pixel by pixel, a pixel counting as
// different only where no pixel within one of it on the other side has its color.
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
// main's designs next to the same written with the new components, and next to the codemod's migration of them; and
// templates drawn as a Page next to the same drawn as an Email; and main's templates lowered into the new engine.
const PREFIXES = ["primitives-compare-with-main--", "primitives-codemod-of-main--", "primitives-email-and-page--", "primitives-main-through-the-new-engine--"];
const WIDTHS = ["desktop", "phone"];
const TOLERANCE = 1;
// Pixels that may differ, text left out: the antialiased edges of a rounded corner drawn half a pixel apart. (A
// hairline 20px long that's missing is 40.)
const PAINT_TOLERANCE = Number(process.env.COMPARE_PAINT_TOLERANCE ?? 8);
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
  .filter((entry) => entry.type === "story" && PREFIXES.some((prefix) => entry.id.startsWith(prefix)) && entry.id.includes(process.env.COMPARE_ONLY ?? ""))
  .map((entry) => entry.id)
  .sort();
if (ids.length === 0) {
  console.error(`COMPARE_FAIL: no ${PREFIXES.join("* or ")}* stories in the Storybook index`);
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
      // The words' box: spaces before and after them (non-breaking ones too) aren't drawn.
      const range = doc.createRange();
      range.setStart(node, node.textContent.length - node.textContent.trimStart().length);
      range.setEnd(node, node.textContent.trimEnd().length);
      const rect = range.getBoundingClientRect();
      if (!rect.width) continue;
      const computed = doc.defaultView.getComputedStyle(node.parentElement);
      (texts[words] ??= []).push({ box: box(rect), style: styles.map((p) => `${p}:${computed[p]}`).join(";") });
    }
    // Images in the order they're in: <img>s, and boxes with a background image (an email's Layer draws its image so).
    const images = [...doc.body.querySelectorAll("*")].flatMap((element) => {
      const rect = element.getBoundingClientRect();
      if (!rect.width) return [];
      if (element.tagName === "IMG") return [{ box: box(rect), src: element.getAttribute("src") }];
      const url = /^url\("?(.*?)"?\)$/.exec(doc.defaultView.getComputedStyle(element).backgroundImage)?.[1];
      return url ? [{ box: box(rect), src: url }] : [];
    });
    return { texts, images };
  });
}

/** Pixels painted differently: their number and where (text left out; one pixel of give, as for the boxes). */
async function paintDifferences(page, allowance) {
  const frames = page.locator("#storybook-root iframe");
  // Text made transparent, and every image the placeholder (an inline one too): their boxes are compared above.
  for (const index of [0, 1]) {
    await frames.nth(index).evaluate(async (frame, placeholder) => {
      const style = frame.contentDocument.createElement("style");
      style.textContent = "*{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important;text-decoration-color:transparent!important}";
      frame.contentDocument.head.append(style);
      // Each image keeps its box (one without a height would take the square placeholder's).
      const images = [...frame.contentDocument.images].map((img) => [img, img.getBoundingClientRect()]);
      for (const [img, rect] of images) {
        img.style.setProperty("width", `${rect.width}px`, "important");
        img.style.setProperty("height", `${rect.height}px`, "important");
      }
      await Promise.all(images.map(([img]) => ((img.src = placeholder), img.decode().catch(() => {}))));
      for (const element of frame.contentDocument.body.querySelectorAll("*")) {
        if (frame.contentWindow.getComputedStyle(element).backgroundImage.startsWith("url(")) element.style.setProperty("background-image", `url("${placeholder}")`, "important");
      }
      await Object.assign(new Image(), { src: placeholder }).decode().catch(() => {});
    }, `data:image/svg+xml,${encodeURIComponent(PLACEHOLDER)}`);
  }
  const shots = await Promise.all([0, 1].map(async (index) => `data:image/png;base64,${(await frames.nth(index).screenshot()).toString("base64")}`));
  return page.evaluate(async ([sources, allowance]) => {
    const load = (src) => new Promise((resolve, reject) => Object.assign(new Image(), { onload() { resolve(this); }, onerror: reject, src }));
    const pixels = (img) => {
      const canvas = Object.assign(document.createElement("canvas"), { width: img.width, height: img.height });
      const context = canvas.getContext("2d");
      context.drawImage(img, 0, 0);
      return context.getImageData(0, 0, img.width, img.height);
    };
    const [a, b] = (await Promise.all(sources.map(load))).map(pixels);
    const width = Math.min(a.width, b.width);
    const height = Math.min(a.height, b.height);
    let count = 0;
    const box = [Infinity, Infinity, -1, -1];
    const scan = (p, q) => {
      const same = (i, j) => Math.abs(p.data[i] - q.data[j]) <= 16 && Math.abs(p.data[i + 1] - q.data[j + 1]) <= 16 && Math.abs(p.data[i + 2] - q.data[j + 2]) <= 16;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * p.width + x) * 4;
          if (same(i, (y * q.width + x) * 4)) continue;
          let near = false;
          for (let dy = -allowance.y; dy <= allowance.y && !near; dy++) {
            for (let dx = -allowance.x; dx <= allowance.x && !near; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              near = nx >= 0 && ny >= 0 && nx < q.width && ny < q.height && same(i, (ny * q.width + nx) * 4);
            }
          }
          if (near) continue;
          count++;
          box[0] = Math.min(box[0], x);
          box[1] = Math.min(box[1], y);
          box[2] = Math.max(box[2], x);
          box[3] = Math.max(box[3], y);
        }
      }
    };
    scan(a, b);
    scan(b, a);
    return { count, box, heights: [a.height, b.height] };
  }, [shots, allowance]);
}

/** Boxes [x, y, width, height] within a pixel, and within a design's allowance across (x) and up and down (y). */
const near = (a, b, allowance = { x: TOLERANCE, y: TOLERANCE }) =>
  a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) <= (i === 0 ? allowance.x : i === 1 ? allowance.y : TOLERANCE));

/** What differs between main's frame and the new engine's. */
function differences([main, next], allowance) {
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
      if (!near(run.box, b[i].box, allowance)) out.push(`${label}: at ${run.box} in main, ${b[i].box} in the new engine`);
      if (run.style !== b[i].style) {
        const theirs = new Set(b[i].style.split(";"));
        out.push(`${label}: ${run.style.split(";").filter((s) => !theirs.has(s)).join(", ")} in main; ${b[i].style.split(";").filter((s) => !run.style.includes(s)).join(", ")} in the new engine`);
      }
    });
  }
  if (main.images.length !== next.images.length) out.push(`${main.images.length} images in main, ${next.images.length} in the new engine`);
  else
    main.images.forEach((image, i) => {
      if (!near(image.box, next.images[i].box, allowance)) out.push(`image ${i + 1}: at ${image.box} in main, ${next.images[i].box} in the new engine`);
      if (image.src !== next.images[i].src) out.push(`image ${i + 1}: ${image.src.slice(0, 80)} in main, ${next.images[i].src.slice(0, 80)} in the new engine`);
    });
  return out;
}

const browser = await chromium.launch();
let failures = 0;
try {
  await ready();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  // Images are the placeholder; a page that isn't Storybook's (a video's player) is blank.
  await page.route("**/*", (route) => {
    const request = route.request();
    if (request.resourceType() === "image") return route.fulfill({ contentType: "image/svg+xml", body: PLACEHOLDER });
    if (request.resourceType() === "document" && !request.url().startsWith(BASE)) return route.fulfill({ contentType: "text/html", body: "<!DOCTYPE html><title>blank</title>" });
    return route.continue();
  });
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
      // A design may allow its content to sit a few px from main's, across or up and down, where main's position depends on
      // the font (its story says why: data-allowance-x, data-allowance-y).
      const declared = await page.evaluate(() => {
        const at = document.querySelector("[data-allowance-x], [data-allowance-y]");
        return { x: Number(at?.getAttribute("data-allowance-x") ?? 0), y: Number(at?.getAttribute("data-allowance-y") ?? 0) };
      });
      const allowance = { x: Math.max(TOLERANCE, declared.x), y: Math.max(TOLERANCE, declared.y) };
      const found = differences(await page.evaluate(measure, TEXT_STYLES), allowance);
      const paint = await paintDifferences(page, allowance);
      if (Math.abs(paint.heights[0] - paint.heights[1]) > allowance.y) found.push(`main is ${paint.heights[0]}px tall, the new engine ${paint.heights[1]}px`);
      if (paint.count > PAINT_TOLERANCE) found.push(`${paint.count} pixels painted differently (text left out), within ${paint.box.join(",")}`);
      if (process.env.COMPARE_VERBOSE) console.log(`    ${id}@${width}: ${paint.count} pixels differ`);
      const story = `${id.replace(/^primitives-/, "")}@${width}`;
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
