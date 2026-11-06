// A second score, after the runs: each finished email as classic Outlook for Windows lays it out,
// using the email renderer's rules (unlayer/email-renderer: conditional comments resolved as mso 16,
// then Word's rules applied in Chromium). The agents never saw this check; it measures what the
// browser checks can't: whether the email they handed in holds up in the client that breaks most.
//
//   node lib/outlook.mjs results/<stamp>.jsonl      writes results/<stamp>.outlook.jsonl
//   node lib/outlook.mjs --dir <run dir>            prints one email's result
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { ASSETS } from "./make-run.mjs";

const bench = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const renderer = process.env.EMAIL_RENDERER ?? join(process.env.HOME, "Projects/playground/outlook-playground/renderer");
const { resolveConditionalComments } = await import(pathToFileURL(join(renderer, "src/conditional.mjs")));
const { fontFaceCss, serveFonts } = await import(pathToFileURL(join(renderer, "src/fonts.mjs")));
const RULES = await readFile(join(renderer, "src/rules.js"), "utf8");

const rgb = (hex) => { const h = hex.replace("#", ""); return `rgb(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)})`; };
const HELPERS = `
  window.__n = (s) => (s || "").replace(/[\\u00a0\\u2007\\u202f]/g, " ").replace(/[\\u2018\\u2019]/g, "'").replace(/\\s+/g, " ").trim();
  window.__shown = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && e.checkVisibility({ opacityProperty: true, visibilityProperty: true }); };
  window.__find = (label) => {
    if (label.startsWith("img:")) return [...document.images].find((i) => __shown(i) && i.getAttribute("src")?.endsWith("/" + label.slice(4))) || null;
    const want = __n(label);
    const all = [...document.body.querySelectorAll("*")].filter((e) => __shown(e) && __n(e.innerText).includes(want));
    return all.find((e) => ![...e.children].some((c) => __shown(c) && __n(c.innerText).includes(want))) || null;
  };
  window.__textRect = (e) => { const r = document.createRange(); r.selectNodeContents(e); const b = r.getBoundingClientRect(); return { top: b.top + scrollY, left: b.left, right: b.right, bottom: b.bottom + scrollY }; };
  window.__rect = (e) => { const r = e.getBoundingClientRect(); return { top: r.top + scrollY, left: r.left, right: r.right, bottom: r.bottom + scrollY, width: r.width, height: r.height }; };
  window.__fill = (e) => { for (let k = 0, x = e; k < 5 && x; k++, x = x.parentElement) { const c = getComputedStyle(x).backgroundColor; if (c && c !== "rgba(0, 0, 0, 0)" && c !== "transparent") return x; } return null; };
`;

let browser;
export async function scoreOutlook(dir) {
  const spec = JSON.parse(await readFile(join(dir, "tools/spec.json"), "utf8"));
  const file = join(dir, "out/email.html");
  if (!existsSync(file)) return { pass: false, results: [{ name: "output exists", ok: false, detail: "no out/email.html" }] };
  let html = resolveConditionalComments(await readFile(file, "utf8")).replace(/<xml[\s>][\s\S]*?<\/xml>/gi, "");
  const head = `<style>${fontFaceCss}</style>`;
  html = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => m + head) : head + html;

  browser ??= await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 800, height: 1000 } });
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.host === "email.test") return route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: html });
    if (url.host === "assets.orbit.dev") {
      const f = join(ASSETS, basename(url.pathname));
      return existsSync(f) ? route.fulfill({ status: 200, contentType: "image/png", body: await readFile(f) }) : route.fulfill({ status: 404 });
    }
    return route.abort();
  });
  await serveFonts(page);
  await page.goto("http://email.test/", { waitUntil: "load" });
  await page.evaluate(async () => { await document.fonts.ready; });
  const ruleError = await page.evaluate(async (rules) => {
    try { (0, eval)(rules); window.OUTLOOK_RULES.apply([], []); return null; } catch (e) { return String(e?.message ?? e); }
  }, RULES);
  await page.addScriptTag({ content: HELPERS });

  const results = [];
  const check = (name, ok, detail) => results.push({ name, ok: !!ok, detail: ok ? "" : detail });
  if (ruleError) check("Outlook rules applied", false, ruleError);

  const text = await page.evaluate(() => __n(document.body.innerText));
  const missing = spec.texts.filter((t) => !text.includes(t.replace(/[‘’]/g, "'").replace(/\s+/g, " ").trim()));
  check("copy shows", missing.length === 0, `missing: ${missing.join(", ")}`);

  const width = await page.evaluate(() => {
    let w = 0;
    for (const e of document.body.querySelectorAll("*")) {
      if (!__shown(e)) continue;
      const t = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (t || e.tagName === "IMG") w = Math.max(w, e.getBoundingClientRect().width);
    }
    return { widest: Math.round(w), scroll: document.documentElement.scrollWidth };
  });
  check("600px content", width.widest <= 620 && width.scroll <= 800, `content ${width.widest}px wide, page ${width.scroll}px`);

  for (const b of spec.buttons) {
    const info = await page.evaluate((t) => {
      const e = __find(t);
      if (!e) return null;
      const f = __fill(e);
      const r = (f ?? e).getBoundingClientRect();
      const label = e.getBoundingClientRect();
      return { bg: f ? getComputedStyle(f).backgroundColor : null, h: r.height, w: r.width, clipped: label.width > r.width + 1 || f?.scrollWidth > f?.clientWidth + 1 };
    }, b.text);
    if (!info) { check(`button "${b.text}"`, false, "not shown"); continue; }
    const p = [];
    if (info.bg !== rgb(b.background)) p.push(`background ${info.bg ?? "none"}`);
    // No height check: the renderer doesn't model mso-padding-alt, which Outlook uses for a cell's padding,
    // and no capture covers it, so a button's height in it isn't evidence either way.
    if (info.clipped) p.push("label cut off");
    check(`button "${b.text}"`, p.length === 0, p.join("; "));
  }

  const imgs = await page.evaluate(() => [...document.images].filter(__shown).map((i) => ({ src: i.getAttribute("src") || "", w: i.getBoundingClientRect().width })));
  for (const name of spec.images) {
    const i = imgs.find((x) => x.src.endsWith("/" + name));
    const p = [];
    if (!i) p.push("not shown");
    else {
      if (i.w > 600.5) p.push(`${Math.round(i.w)}px wide`);
      if (name === "orbit-logo.png" && Math.abs(i.w - 126) > 4) p.push(`shown ${Math.round(i.w)}px wide, not 126px`);
    }
    check(`image ${name}`, p.length === 0, p.join("; "));
  }

  const placed = (groups) => page.evaluate((g) => g.map((x) => x.map((l) => { const e = __find(l); return e ? __rect(e) : null; })), groups);
  const cols = await placed(spec.columns);
  spec.columns.forEach((g, gi) => {
    const r = cols[gi];
    const ok = r.every(Boolean) && r.every((x, i) => i === 0 || (x.left >= r[i - 1].right - 2 && Math.abs(x.top - r[0].top) < 40));
    check(`columns side by side: ${g.join(" | ")}`, ok, r.every(Boolean) ? "not in one row" : "not found");
  });
  const rows = spec.rows ? await page.evaluate((groups) => groups.map((g) => g.map((l) => { const e = __find(l); return e ? __textRect(e) : null; })), spec.rows) : [];
  (spec.rows ?? []).forEach((g, gi) => {
    const [a, b] = rows[gi];
    check(`line item: ${g[0]}`, a && b && Math.abs(a.top - b.top) < 12 && b.left > a.right, "not on one line");
  });

  await page.close();
  return { pass: results.every((r) => r.ok), results };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf("--dir");
  if (i > -1) {
    const r = await scoreOutlook(resolve(process.argv[i + 1]));
    for (const x of r.results) console.log(`${x.ok ? "PASS" : "FAIL"} ${x.name}${x.ok ? "" : ` — ${x.detail}`}`);
  } else {
    const file = resolve(process.argv[2]);
    const rows = (await readFile(file, "utf8")).split("\n").filter(Boolean).map((l) => JSON.parse(l));
    const out = [];
    for (const row of rows) {
      const dir = join(bench, "runs", row.stamp, `${row.kit}__${row.brief}__${row.rep}`);
      const r = await scoreOutlook(dir);
      out.push({ ...row, outlookPass: r.pass, outlookFailed: r.results.filter((x) => !x.ok).map((x) => `${x.name}: ${x.detail}`) });
      console.log(`${r.pass ? "PASS" : "FAIL"} ${row.kit} ${row.brief} #${row.rep}${r.pass ? "" : "  " + out.at(-1).outlookFailed.join(" / ").slice(0, 200)}`);
    }
    await writeFile(file.replace(/\.jsonl$/, ".outlook.jsonl"), out.map((r) => JSON.stringify(r)).join("\n") + "\n");
  }
  await browser?.close();
}
