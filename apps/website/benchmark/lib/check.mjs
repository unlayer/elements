// The shared quality bar. Every condition (Hyper Elements, React Email, hand-written HTML) is checked by
// this same script against out/email.html, in headless Chromium, at a desktop and a phone width.
//
//   node tools/check.mjs            prints PASS/FAIL per check, exits 1 on any failure
//   node tools/check.mjs --json     machine-readable, for the harness
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = dirname(fileURLToPath(import.meta.url));
const runDir = resolve(here, "..");
const spec = JSON.parse(await readFile(join(here, "spec.json"), "utf8"));
const assets = process.env.BENCH_ASSETS ?? "__ASSETS__";
const htmlPath = join(runDir, "out/email.html");
const json = process.argv.includes("--json");

const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok: !!ok, detail: ok ? "" : detail });

function finish() {
  const failed = results.filter((r) => !r.ok);
  if (json) {
    console.log(JSON.stringify({ pass: failed.length === 0, total: results.length, failed: failed.length, results }));
  } else {
    for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"} ${r.name}${r.ok ? "" : ` — ${r.detail}`}`);
    console.log(failed.length ? `\n${failed.length} of ${results.length} checks failed.` : `\nAll ${results.length} checks passed.`);
  }
  process.exit(failed.length ? 1 : 0);
}

if (!existsSync(htmlPath)) {
  check("output exists", false, "out/email.html was not found");
  finish();
}
const html = await readFile(htmlPath, "utf8");
check("output exists", html.trim().length > 0, "out/email.html is empty");

// Static: what email clients strip or can't lay out.
check("no scripts", !/<script\b/i.test(html), "the HTML contains a <script>");
check("no external stylesheets", !/<link\b[^>]*rel=["']?stylesheet/i.test(html), "the HTML links an external stylesheet");
check("table layout", /<table\b/i.test(html), "no <table> in the HTML: Outlook needs table layout");
const flex = html.match(/display\s*:\s*(inline-)?(flex|grid)\b/i);
check("no flex or grid", !flex, `uses "${flex?.[0]}", which Outlook and many clients ignore`);
const badHrefs = [...html.matchAll(/<a\b[^>]*href=["']([^"']*)["']/gi)].map((m) => m[1]).filter((h) => !/^(https?:|mailto:|tel:)/i.test(h));
check("absolute links", badHrefs.length === 0, `relative or empty hrefs: ${badHrefs.slice(0, 3).join(", ")}`);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 800, height: 1000 } });
await page.route("**/*", async (route) => {
  const url = new URL(route.request().url());
  if (url.host === "email.test") return route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: html });
  if (url.host === "assets.orbit.dev") {
    const file = join(assets, url.pathname.split("/").pop());
    if (existsSync(file)) return route.fulfill({ status: 200, contentType: "image/png", body: await readFile(file) });
    return route.fulfill({ status: 404, body: "" });
  }
  return route.abort();
});
await page.goto("http://email.test/", { waitUntil: "load" });

// In-page helpers, shared by every measurement below.
await page.addScriptTag({
  content: `
  window.__n = (s) => (s || "").replace(/[\\u00a0\\u2007\\u202f]/g, " ").replace(/[\\u2018\\u2019]/g, "'").replace(/[\\u201c\\u201d]/g, '"').replace(/\\s+/g, " ").trim();
  window.__find = (label) => {
    if (label.startsWith("img:")) return [...document.images].find((i) => i.getAttribute("src")?.endsWith("/" + label.slice(4))) || null;
    const want = __n(label);
    // Only what's rendered: a hidden preview text that happens to contain a label isn't the label.
    const shown = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && e.checkVisibility({ opacityProperty: true, visibilityProperty: true }); };
    const all = [...document.body.querySelectorAll("*")].filter((e) => shown(e) && __n(e.innerText).includes(want));
    return all.find((e) => ![...e.children].some((c) => __n(c.innerText).includes(want))) || null;
  };
  // Where the text itself is drawn, not its box: a right-aligned price fills its whole cell.
  window.__textRect = (e) => { const r = document.createRange(); r.selectNodeContents(e); const b = r.getBoundingClientRect(); return { top: b.top + scrollY, left: b.left, right: b.right, bottom: b.bottom + scrollY }; };
  window.__rect = (e) => { const r = e.getBoundingClientRect(); return { top: r.top + scrollY, left: r.left, right: r.right, bottom: r.bottom + scrollY, width: r.width, height: r.height }; };
  window.__fill = (e) => { for (let k = 0, x = e; k < 4 && x; k++, x = x.parentElement) { const c = getComputedStyle(x).backgroundColor; if (c && c !== "rgba(0, 0, 0, 0)" && c !== "transparent") return x; } return null; };
  window.__bg = (e) => { const x = __fill(e); return x ? getComputedStyle(x).backgroundColor : null; };
  `,
});

const rgb = (hex) => {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
};

// Content
const bodyText = await page.evaluate(() => __n(document.body.innerText));
const norm = (s) => s.replace(/[‘’]/g, "'").replace(/\s+/g, " ").trim();
const missing = spec.texts.filter((t) => !bodyText.includes(norm(t)));
check("required copy", missing.length === 0, `missing: ${missing.map((m) => JSON.stringify(m)).join(", ")}`);

// Preview text: in the document, but not shown.
const preview = await page.evaluate((p) => {
  const all = __n(document.body.textContent);
  if (!all.includes(__n(p))) return { present: false };
  const shown = __n(document.body.innerText).includes(__n(p));
  if (!shown) return { present: true, hidden: true };
  const e = __find(p);
  const r = e?.getBoundingClientRect();
  const s = e && getComputedStyle(e);
  return { present: true, hidden: !!e && (r.width * r.height <= 1 || s.opacity === "0" || parseFloat(s.fontSize) <= 1 || s.color === s.backgroundColor) };
}, spec.preview);
check("preview text", preview.present && preview.hidden, preview.present ? "the preview text is visible in the body" : "the preview text is missing");

// Buttons: right link, a filled background, button-sized, and the hover color where asked.
for (const b of spec.buttons) {
  const info = await page.evaluate((b) => {
    const a = [...document.querySelectorAll("a")].find((x) => __n(x.innerText) === __n(b.text));
    if (!a) return null;
    a.setAttribute("data-bench-btn", b.text);
    const f = __fill(a);
    const r = (f || a).getBoundingClientRect();
    return { href: a.getAttribute("href"), bg: __bg(a), h: r.height, w: r.width };
  }, b);
  if (!info) { check(`button "${b.text}"`, false, "no link with exactly this text"); continue; }
  const problems = [];
  if (info.href !== b.href) problems.push(`href is ${info.href}`);
  if (info.bg !== rgb(b.background)) problems.push(`background is ${info.bg ?? "none"}, not ${b.background}`);
  if (info.h < 32) problems.push(`only ${Math.round(info.h)}px tall: a button needs padding`);
  if (b.hover) {
    await page.hover(`a[data-bench-btn="${b.text}"]`);
    const hv = await page.evaluate((t) => __bg(document.querySelector(`a[data-bench-btn="${t}"]`)), b.text);
    if (hv !== rgb(b.hover)) problems.push(`hover background is ${hv}, not ${b.hover}`);
    await page.mouse.move(0, 0);
  }
  check(`button "${b.text}"`, problems.length === 0, problems.join("; "));
}

for (const l of spec.links) {
  const href = await page.evaluate((l) => [...document.querySelectorAll("a")].find((x) => __n(x.innerText) === __n(l.text))?.getAttribute("href") ?? null, l);
  check(`link "${l.text}"`, href === l.href, href === null ? "no link with exactly this text" : `href is ${href}`);
}

// Images: present, loaded, described, and sized to fit.
const imgs = await page.evaluate(() =>
  [...document.images].map((i) => ({ src: i.getAttribute("src") || "", alt: i.getAttribute("alt"), loaded: i.complete && i.naturalWidth > 0, w: i.getBoundingClientRect().width })),
);
for (const name of spec.images) {
  const found = imgs.filter((i) => i.src.endsWith("/" + name));
  const problems = [];
  if (!found.length) problems.push("not in the email");
  else {
    const i = found[0];
    if (!i.loaded) problems.push("did not load (check the URL)");
    if (!i.alt || !i.alt.trim()) problems.push("no alt text");
    if (i.w > 600.5) problems.push(`${Math.round(i.w)}px wide, wider than the 600px content`);
    if (name === "orbit-logo.png" && Math.abs(i.w - 126) > 4) problems.push(`shown ${Math.round(i.w)}px wide, not 126px`);
  }
  check(`image ${name}`, problems.length === 0, problems.join("; "));
}
const noAlt = imgs.filter((i) => i.alt === null);
check("every image has alt", noAlt.length === 0, `${noAlt.length} image(s) with no alt attribute`);

// Width: nothing in the content is wider than an email's 600px.
const widest = await page.evaluate(() => {
  let w = 0;
  for (const e of document.body.querySelectorAll("*")) {
    const hasText = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (hasText || e.tagName === "IMG") w = Math.max(w, e.getBoundingClientRect().width);
  }
  return Math.round(w);
});
check("600px content", widest <= 620, `content is ${widest}px wide at a desktop width`);

const placed = (groups) =>
  page.evaluate((groups) => groups.map((g) => g.map((l) => { const e = __find(l); return e ? __rect(e) : null; })), groups);

// Columns side by side on desktop.
const desk = await placed(spec.columns);
spec.columns.forEach((g, gi) => {
  const r = desk[gi];
  if (r.some((x) => !x)) return check(`columns side by side: ${g.join(" | ")}`, false, `not found: ${g.filter((_, i) => !r[i]).join(", ")}`);
  const ok = r.every((x, i) => i === 0 || (x.left >= r[i - 1].right - 2 && Math.abs(x.top - r[0].top) < 40));
  check(`columns side by side: ${g.join(" | ")}`, ok, "at 800px wide they are not in one row, left to right");
});
// Line items: name and price on one line.
const rows = spec.rows ? await page.evaluate((groups) => groups.map((g) => g.map((l) => { const e = __find(l); return e ? __textRect(e) : null; })), spec.rows) : [];
(spec.rows ?? []).forEach((g, gi) => {
  const [a, b] = rows[gi];
  check(`line item: ${g[0]}`, a && b && Math.abs(a.top - b.top) < 12 && b.left > a.right, "item and price are not on one line, price on the right");
});

// Phone
await page.setViewportSize({ width: 375, height: 800 });
await page.waitForTimeout(50);
const sw = await page.evaluate(() => document.documentElement.scrollWidth);
check("fits a phone", sw <= 376, `scrolls sideways at 375px (${sw}px wide)`);
const phone = await placed(spec.columns);
spec.columns.forEach((g, gi) => {
  const r = phone[gi];
  if (r.some((x) => !x)) return check(`columns stack on phones: ${g.join(" | ")}`, false, "not found");
  const ok = r.every((x, i) => i === 0 || x.top >= r[i - 1].bottom - 2);
  check(`columns stack on phones: ${g.join(" | ")}`, ok, "at 375px wide they are not stacked, top to bottom");
});

await browser.close();
finish();
