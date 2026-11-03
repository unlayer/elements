// What a reader sees: each rendered page loaded in headless Chromium at a width, measured, and compared.
// The measuring follows packages/react/scripts/storybook-compare.mjs (text boxes and styles, images,
// paint with the text made transparent, one pixel of give), at the word level so a page whose markup splits its
// text differently still lines up.
import { chromium } from "playwright";
import { align } from "./diff.mjs";

const VIEWPORT_HEIGHT = 900;

/** Every image is a local SVG: the size its URL names (placehold.co /WxH, ?w=&h=), else 1600x900, in a color from
 *  its URL, so the same URL draws the same on both sides and a different one doesn't. */
function placeholder(url) {
  let w = 1600;
  let h = 900;
  const size = /\/(\d{1,4})x(\d{1,4})(?:[/?.]|$)/.exec(url);
  if (size) [w, h] = [+size[1], +size[2]];
  else {
    const qw = /[?&]w=(\d+)/.exec(url);
    const qh = /[?&]h=(\d+)/.exec(url);
    if (qw) [w, h] = [+qw[1], qh ? +qh[1] : Math.round(+qw[1] * 0.5625)];
  }
  let hash = 0;
  for (const c of url) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  const fill = `hsl(${hash % 360},45%,${55 + (hash % 20)}%)`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${fill}"/><path d="M0 ${h} L${w} 0" stroke="#00000040" stroke-width="${Math.max(1, Math.round(Math.min(w, h) / 40))}"/></svg>`;
}

/** In the page: every visible word with its box and text style, the images, the links, the page's size. */
function collect() {
  const styles = new Map();
  const cs = (el) => {
    let s = styles.get(el);
    if (!s) styles.set(el, (s = getComputedStyle(el)));
    return s;
  };
  // Per element: null if it's not drawn (opacity 0 on it or an ancestor), else the boxes it's clipped to.
  const clipMemo = new Map();
  const clips = (el) => {
    // The root and body's overflow is the window's: it scrolls, it doesn't clip.
    if (!el || el === document.documentElement || el === document.body) return el && cs(el).opacity === "0" ? null : [];
    if (clipMemo.has(el)) return clipMemo.get(el);
    const parent = clips(el.parentElement);
    let result = parent;
    const s = cs(el);
    if (parent === null || s.opacity === "0") result = null;
    else if (s.overflowX !== "visible" || s.overflowY !== "visible") result = [...parent, el.getBoundingClientRect()];
    clipMemo.set(el, result);
    return result;
  };
  const shown = (rect, el) => {
    if (!(rect.width > 0 && rect.height > 0)) return false;
    const c = clips(el);
    if (c === null) return false;
    return c.every((r) => Math.min(rect.right, r.right) - Math.max(rect.left, r.left) > 0 && Math.min(rect.bottom, r.bottom) - Math.max(rect.top, r.top) > 0);
  };
  // Text decoration as drawn: an element's own lines and those it inherits from its block ancestors.
  const decoMemo = new Map();
  const deco = (el) => {
    if (!el || el === document.documentElement) return new Set();
    if (decoMemo.has(el)) return decoMemo.get(el);
    const s = cs(el);
    const atomic = /^inline-(block|table|flex|grid)$/.test(s.display) || s.float !== "none" || s.position === "absolute" || s.position === "fixed";
    const set = new Set(atomic ? [] : deco(el.parentElement));
    for (const line of s.textDecorationLine.split(" ")) if (line !== "none") set.add(line);
    decoMemo.set(el, set);
    return set;
  };
  const links = [];
  const linkIndex = new Map();
  const linkOf = (el) => {
    const a = el.closest("a[href]");
    if (!a) return -1;
    if (!linkIndex.has(a)) {
      linkIndex.set(a, links.length);
      links.push({ href: a.getAttribute("href"), target: a.getAttribute("target") ?? "", text: "" });
    }
    return linkIndex.get(a);
  };
  const r2 = (v) => Math.round(v * 100) / 100;
  // Words as drawn: a word split across elements (<b>Total:</b>$5) is one word, so markup that splits text
  // differently still lines up. Its style is each part's, joined with "|" where the parts differ.
  const words = [];
  let open = null; // the last word, while the text right after it could continue it
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const el = node.parentElement;
    if (!el || el.closest("style,script,title,head,noscript,template")) continue;
    const s = cs(el);
    if (s.visibility !== "visible") continue;
    const style = {
      fontFamily: s.fontFamily.replace(/["'\s]/g, "").toLowerCase(),
      fontSize: s.fontSize,
      fontWeight: s.fontWeight,
      fontStyle: s.fontStyle,
      color: s.color,
      letterSpacing: s.letterSpacing === "normal" ? "0px" : s.letterSpacing,
      textTransform: s.textTransform,
      textDecoration: [...deco(el)].sort().join(" ") || "none",
    };
    const re = /\S+/g;
    let m;
    let drawn = false;
    while ((m = re.exec(node.data))) {
      range.setStart(node, m.index);
      range.setEnd(node, m.index + m[0].length);
      const rect = range.getBoundingClientRect();
      if (!shown(rect, el)) {
        open = null;
        continue;
      }
      drawn = true;
      const link = linkOf(el);
      if (link >= 0 && links[link].text.length < 40) links[link].text += (links[link].text ? " " : "") + m[0];
      const box = [r2(rect.left + scrollX), r2(rect.top + scrollY), r2(rect.width), r2(rect.height)];
      // Continues the last word: nothing between them in the text, on the same line, touching.
      if (open && m.index === 0 && Math.abs(open.box[1] - box[1]) < 2 && Math.abs(open.box[0] + open.box[2] - box[0]) < 0.75) {
        open.t += m[0];
        const right = Math.max(open.box[0] + open.box[2], box[0] + box[2]);
        const bottom = Math.max(open.box[1] + open.box[3], box[1] + box[3]);
        open.box = [open.box[0], Math.min(open.box[1], box[1]), r2(right - open.box[0]), r2(bottom - Math.min(open.box[1], box[1]))];
        for (const k of Object.keys(style)) if (!open.style[k].split("|").includes(style[k])) open.style[k] += `|${style[k]}`;
      } else {
        open = { t: m[0], box, style: { ...style }, link };
        words.push(open);
      }
      if (m.index + m[0].length !== node.data.length) open = null;
    }
    if (!drawn && /\S/.test(node.data)) open = null;
    else if (/\s$/.test(node.data)) open = null;
  }
  // Images in order: <img>s, boxes painted with a background image, and embeds (a video's frame or player).
  const EMBEDS = { IFRAME: "src", VIDEO: "src", EMBED: "src", OBJECT: "data" };
  const images = [];
  for (const el of document.body.querySelectorAll("*")) {
    const tag = el.tagName;
    let kind = null;
    let src = null;
    if (tag === "IMG") [kind, src] = ["img", el.getAttribute("src")];
    else if (EMBEDS[tag]) [kind, src] = [tag.toLowerCase(), el.getAttribute(EMBEDS[tag]) ?? el.getAttribute("poster")];
    else {
      const bg = /^url\("?(.*?)"?\)$/.exec(cs(el).backgroundImage)?.[1];
      if (bg) [kind, src] = ["background", bg];
    }
    if (!kind) continue;
    const rect = el.getBoundingClientRect();
    if (!shown(rect, el) || cs(el).visibility !== "visible") continue;
    const link = linkOf(el);
    images.push({ src, kind, alt: kind === "img" ? el.getAttribute("alt") : null, box: [r2(rect.left + scrollX), r2(rect.top + scrollY), r2(rect.width), r2(rect.height)], link });
  }
  // Links drawn with nothing measured inside (a button's box): those count too.
  for (const a of document.querySelectorAll("a[href]")) {
    if (linkIndex.has(a)) continue;
    if ([...a.getClientRects()].some((r) => shown(r, a))) linkOf(a);
  }
  const visibleLinks = [...linkIndex.entries()].sort((x, y) => (x[0].compareDocumentPosition(y[0]) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1)).map(([, i]) => links[i]);
  const root = document.documentElement;
  return {
    words,
    images,
    links: visibleLinks,
    height: Math.max(root.scrollHeight, document.body.scrollHeight),
    scrollWidth: Math.max(root.scrollWidth, document.body.scrollWidth),
    clientWidth: root.clientWidth,
  };
}

const HIDE_TEXT = "*,*::before,*::after,*::marker{-webkit-text-fill-color:transparent!important;text-shadow:none!important;text-decoration-color:transparent!important;caret-color:transparent!important}";

/** In a blank page: pixels painted differently (no pixel within `give` of it on the other side has its color, per
 *  channel within 16), their count and where. With `compose`, also the side-by-side image: OLD | NEW | differences. */
async function pixels([sources, give, compose]) {
  const load = (src) => new Promise((resolve, reject) => Object.assign(new Image(), { onload() { resolve(this); }, onerror: reject, src }));
  const [ia, ib] = await Promise.all(sources.map(load));
  const data = (img) => {
    const canvas = Object.assign(document.createElement("canvas"), { width: img.width, height: img.height });
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(img, 0, 0);
    return context.getImageData(0, 0, img.width, img.height);
  };
  const a = data(ia);
  const b = data(ib);
  const width = Math.min(a.width, b.width);
  const height = Math.min(a.height, b.height);
  const mask = compose ? new Uint8Array(width * height) : null;
  let count = 0;
  const box = [Infinity, Infinity, -1, -1];
  const scan = (p, q) => {
    const same = (i, j) => Math.abs(p.data[i] - q.data[j]) <= 16 && Math.abs(p.data[i + 1] - q.data[j + 1]) <= 16 && Math.abs(p.data[i + 2] - q.data[j + 2]) <= 16;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * p.width + x) * 4;
        if (same(i, (y * q.width + x) * 4)) continue;
        let near = false;
        for (let dy = -give; dy <= give && !near; dy++) {
          for (let dx = -give; dx <= give && !near; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            near = nx >= 0 && ny >= 0 && nx < q.width && ny < q.height && same(i, (ny * q.width + nx) * 4);
          }
        }
        if (near) continue;
        count++;
        if (mask) mask[y * width + x] = 1;
        box[0] = Math.min(box[0], x);
        box[1] = Math.min(box[1], y);
        box[2] = Math.max(box[2], x);
        box[3] = Math.max(box[3], y);
      }
    }
  };
  scan(a, b);
  scan(b, a);
  if (!compose) return { count, box };
  const gap = 16;
  const label = 22;
  const canvas = Object.assign(document.createElement("canvas"), { width: a.width + b.width + width + gap * 2, height: Math.min(32000, Math.max(a.height, b.height) + label) });
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#555";
  ctx.fillRect(a.width, 0, gap, canvas.height);
  ctx.fillRect(a.width + gap + b.width, 0, gap, canvas.height);
  ctx.font = "bold 14px sans-serif";
  ctx.fillStyle = "#000";
  ctx.fillText("OLD", 6, 16);
  ctx.fillText("NEW", a.width + gap + 6, 16);
  ctx.fillText(`DIFFERENCES (${count} px, red)`, a.width + gap * 2 + b.width + 6, 16);
  ctx.drawImage(ia, 0, label);
  ctx.drawImage(ib, a.width + gap, label);
  // Differences: OLD faded, differing pixels red.
  const x0 = a.width + b.width + gap * 2;
  ctx.globalAlpha = 0.25;
  ctx.drawImage(ia, x0, label);
  ctx.globalAlpha = 1;
  const overlay = ctx.getImageData(x0, label, width, Math.min(height, canvas.height - label));
  for (let i = 0; i < overlay.width * overlay.height; i++) {
    if (!mask[i]) continue;
    overlay.data[i * 4] = 230;
    overlay.data[i * 4 + 1] = 0;
    overlay.data[i * 4 + 2] = 0;
    overlay.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(overlay, x0, label);
  return { count, box, png: canvas.toDataURL("image/png") };
}

const near = (a, b, tol) => a.every((v, i) => Math.abs(v - b[i]) <= tol);
const fmtBox = (b) => `(${b.map((v) => Math.round(v)).join(",")})`;
const quote = (s, n = 60) => JSON.stringify(s.length > n ? `${s.slice(0, n)}…` : s);

/** What differs between OLD's page and NEW's, as lines a reader of the report can act on. */
export function differences(a, b, tol) {
  const out = [];
  // 1. The visible text, word by word.
  const words = align(a.words, b.words, (w) => w.t);
  for (const h of words.hunks) {
    const before = a.words.slice(Math.max(0, h.a[0] - 4), h.a[0]).map((w) => w.t).join(" ");
    const removed = a.words.slice(h.a[0], h.a[1]).map((w) => w.t).join(" ");
    const added = b.words.slice(h.b[0], h.b[1]).map((w) => w.t).join(" ");
    const what = removed && added ? `${quote(removed)} became ${quote(added)}` : removed ? `${quote(removed)} is gone` : `${quote(added)} is new`;
    out.push({ kind: "text", line: `text: ${what}${before ? ` (after ${quote(before, 40)})` : " (at the start)"}` });
  }
  // 2. Each word's style, and where it is.
  const styleDiffs = new Map();
  const moved = [];
  for (const [i, j] of words.pairs) {
    const x = a.words[i];
    const y = b.words[j];
    for (const k of Object.keys(x.style)) {
      if (x.style[k] === y.style[k]) continue;
      const key = `${k}: ${x.style[k]} → ${y.style[k]}`;
      const entry = styleDiffs.get(key) ?? { count: 0, first: x.t };
      entry.count++;
      styleDiffs.set(key, entry);
    }
    if (!near(x.box, y.box, tol)) moved.push([x, y]);
  }
  for (const [key, { count, first }] of styleDiffs) out.push({ kind: "style", line: `style: ${key} on ${count} word(s), first ${quote(first, 30)}` });
  if (moved.length) {
    const worst = moved.reduce((w, m) => (Math.max(...m[0].box.map((v, i) => Math.abs(v - m[1].box[i]))) > Math.max(...w[0].box.map((v, i) => Math.abs(v - w[1].box[i]))) ? m : w));
    out.push({
      kind: "position",
      line: `position: ${moved.length} of ${words.pairs.length} word(s) moved or resized beyond ${tol}px; first ${quote(moved[0][0].t, 30)} ${fmtBox(moved[0][0].box)} → ${fmtBox(moved[0][1].box)}; most ${quote(worst[0].t, 30)} ${fmtBox(worst[0].box)} → ${fmtBox(worst[1].box)}`,
    });
  }
  // 3. Images: which, how big, where.
  const images = align(a.images, b.images, (im) => im.src);
  for (const h of images.hunks) {
    for (const im of a.images.slice(h.a[0], h.a[1])) out.push({ kind: "image", line: `image: ${im.kind} ${quote(im.src ?? "", 70)} ${fmtBox(im.box)} is gone` });
    for (const im of b.images.slice(h.b[0], h.b[1])) out.push({ kind: "image", line: `image: ${im.kind} ${quote(im.src ?? "", 70)} ${fmtBox(im.box)} is new` });
  }
  for (const [i, j] of images.pairs) {
    const x = a.images[i];
    const y = b.images[j];
    if (x.kind !== y.kind) out.push({ kind: "image", line: `image ${i + 1} ${quote(x.src ?? "", 50)}: drawn as ${x.kind} → ${y.kind}` });
    if (!near(x.box, y.box, tol)) out.push({ kind: "image", line: `image ${i + 1} ${quote(x.src ?? "", 50)}: ${fmtBox(x.box)} → ${fmtBox(y.box)}` });
    if (x.alt !== y.alt) out.push({ kind: "image", line: `image ${i + 1} alt: ${quote(String(x.alt))} → ${quote(String(y.alt))}` });
  }
  // 4. Links: where they go and how they open.
  const links = align(a.links, b.links, (l) => `${l.href} ${l.target}`);
  for (const h of links.hunks) {
    const show = (l) => `${quote(l.href ?? "", 70)}${l.target ? ` [${l.target}]` : ""} on ${quote(l.text || "(no text)", 25)}`;
    const was = a.links.slice(h.a[0], h.a[1]).map(show);
    const now = b.links.slice(h.b[0], h.b[1]).map(show);
    out.push({ kind: "link", line: `link: ${was.join(", ") || "(none)"} → ${now.join(", ") || "(none)"}` });
  }
  // 5. The page: its height, and any horizontal scroll.
  if (Math.abs(a.height - b.height) > tol) out.push({ kind: "page", line: `page height: ${a.height}px → ${b.height}px` });
  const hs = (p) => Math.max(0, p.scrollWidth - p.clientWidth);
  if (Math.abs(hs(a) - hs(b)) > tol) out.push({ kind: "page", line: `horizontal scroll: ${hs(a)}px → ${hs(b)}px (page ${a.scrollWidth}px → ${b.scrollWidth}px wide in a ${a.clientWidth}px window)` });
  return out;
}

/** A pool of pages in one browser; `compare` runs one template/mode at every width. */
export async function openBrowser({ jobs }) {
  const browser = await chromium.launch();
  const workers = [];
  for (let i = 0; i < jobs; i++) {
    const context = await browser.newContext({ viewport: { width: 800, height: VIEWPORT_HEIGHT }, deviceScaleFactor: 1, reducedMotion: "reduce", javaScriptEnabled: true });
    // No network: images are placeholders; a frame is blank; styles and scripts are empty; the rest fails.
    await context.route(/^https?:/, (route) => {
      const request = route.request();
      const type = request.resourceType();
      if (type === "image") return route.fulfill({ contentType: "image/svg+xml", body: placeholder(request.url()) });
      if (type === "document") return route.fulfill({ contentType: "text/html", body: "<!DOCTYPE html><title>blank</title>" });
      if (type === "stylesheet") return route.fulfill({ contentType: "text/css", body: "" });
      if (type === "script") return route.fulfill({ contentType: "application/javascript", body: "" });
      return route.abort();
    });
    const page = await context.newPage();
    const canvas = await context.newPage();
    await canvas.setContent("<!DOCTYPE html><title>pixels</title>");
    workers.push({ page, canvas, busy: false });
  }
  const queue = [];
  const acquire = () => {
    const free = workers.find((w) => !w.busy);
    if (free) {
      free.busy = true;
      return Promise.resolve(free);
    }
    return new Promise((resolve) => queue.push(resolve));
  };
  const release = (w) => {
    const next = queue.shift();
    if (next) next(w);
    else w.busy = false;
  };

  async function load(page, url) {
    await page.goto(url, { waitUntil: "load", timeout: 30_000 });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((img) => (img.complete ? null : new Promise((r) => ((img.onload = r), (img.onerror = r))))));
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    });
  }
  const shot = (page) => page.screenshot({ fullPage: true, animations: "disabled", caret: "hide", type: "png" }).then((b) => `data:image/png;base64,${b.toString("base64")}`);

  /** One template/mode, OLD's file against NEW's, at each width. Returns { [width]: { differences, paint, artifacts } }. */
  async function compare({ oldUrl, newUrl, widths, tol, paintTolerance, onDiff }) {
    const w = await acquire();
    try {
      const results = {};
      for (const width of widths) {
        await w.page.setViewportSize({ width, height: VIEWPORT_HEIGHT });
        await load(w.page, oldUrl);
        const a = await w.page.evaluate(collect);
        await w.page.addStyleTag({ content: HIDE_TEXT });
        const pa = await shot(w.page);
        await load(w.page, newUrl);
        const b = await w.page.evaluate(collect);
        await w.page.addStyleTag({ content: HIDE_TEXT });
        const pb = await shot(w.page);
        const paint = await w.canvas.evaluate(pixels, [[pa, pb], tol, false]);
        const found = differences(a, b, tol);
        if (paint.count > paintTolerance) found.push({ kind: "paint", line: `paint: ${paint.count} pixels painted differently, text left out (allowed ${paintTolerance}), within (${paint.box.join(",")})` });
        const result = { differences: found, paint: paint.count, words: [a.words.length, b.words.length], images: [a.images.length, b.images.length], links: [a.links.length, b.links.length], height: [a.height, b.height] };
        if (found.length && onDiff) {
          // The side-by-side, as the reader sees it (text drawn).
          await load(w.page, oldUrl);
          const sa = await shot(w.page);
          await load(w.page, newUrl);
          const sb = await shot(w.page);
          const composed = await w.canvas.evaluate(pixels, [[sa, sb], tol, true]);
          result.artifacts = await onDiff(width, Buffer.from(composed.png.split(",")[1], "base64"));
        }
        results[width] = result;
      }
      return results;
    } finally {
      release(w);
    }
  }
  return { compare, close: () => browser.close(), version: browser.version() };
}
