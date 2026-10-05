/**
 * Fidelity benchmark: convert every template in .corpus/ and measure.
 *
 *   pnpm --filter @unlayer/from-react-email bench [filter,filter…]
 *
 * For each template: original HTML (React Email render) vs converted HTML
 * (Elements renderToHtml), compared three ways:
 *   - text: words must be preserved without missing or extra words;
 *   - layout (Chromium, at 700px and 375px): where each word lands, and
 *     whether the reading order holds;
 *   - pixels: screenshots side by side, plus a pixel-diff score.
 * Images and fonts are fetched once and served from a local cache, so both
 * renders see the same assets. Results land in .bench-out/ (git-ignored):
 * results.json, results.md, and per template the outputs, the reports and
 * review.png (original | codemod | runtime).
 */

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import React from "react";
import { render } from "@react-email/components";
import { chromium, type BrowserContext, type Route } from "playwright";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { compareText, convertReactEmail, findTailwindConfig, verifyConversion } from "../src/index";
import { convertSource } from "../src/codemod";

const root = path.resolve(import.meta.dirname, "..");
const corpus = path.join(root, ".corpus");
const out = path.join(root, ".bench-out");
const filter = process.argv[2] === "--typecheck-only" ? undefined : process.argv[2];
const typecheckOnly = process.argv[2] === "--typecheck-only";
// 700, not 600: Elements stacks email columns below contentWidth + 20px, so a
// window as wide as the email (600 or 640) shows its mobile layout. 375
// compares the mobile layouts.
const WIDTHS = [700, 375];

interface Result {
  template: string;
  group: string;
  mode: "runtime" | "codemod";
  converted: boolean;
  error?: string;
  typechecks?: boolean;
  contentNodes?: number;
  nativeRatio?: number;
  fallbacks?: Array<{ reason: string; detail?: string }>;
  notes?: Array<{ reason: string; detail?: string }>;
  diff?: Record<number, number>;
  typeErrors?: number;
  /** renderToJson warnings on the migrated component (blocks the editor wouldn't get). */
  jsonWarnings?: number;
  originalTypeErrors?: number;
  /** Shift-tolerant diff: both screenshots shrunk 4×, looser threshold. */
  looks?: Record<number, number>;
  /** Words the original shows that the conversion doesn't. */
  missingText?: string[];
  /** Words added by the conversion, and their count. */
  addedText?: string[];
  addedWords?: number;
  /** Links, image sources and alt text the original has and the conversion doesn't. */
  missingAttributes?: string[];
  /** Codemod: problems with a boolean prop flipped. */
  variants?: Array<{ change: string; missing: string[]; added: string[]; missingAttributes: string[]; error?: string }>;
  layout?: Record<number, Layout>;
}

/** Word positions compared in Chromium (see `layoutScore`). */
interface Layout {
  words: number;
  /** Share of the original's words the conversion doesn't render visibly. */
  missing: number;
  /** Share of words more than 48px off sideways, after removing a uniform shift. */
  moved: number;
  /** Times the text runs back up the page where the original runs down (blocks put side by side). */
  jumps: number;
  /** The original is wider than the window (a fixed-width table): the conversion can't match it there. */
  overflows?: boolean;
}

async function main() {
  fs.mkdirSync(out, { recursive: true });
  if (typecheckOnly) {
    const results: Result[] = JSON.parse(fs.readFileSync(path.join(out, "results.json"), "utf8"));
    typecheck(results);
    fs.writeFileSync(path.join(out, "results.json"), JSON.stringify(results, null, 2));
    console.log(`type-checked ${results.length} results`);
    return;
  }
  const files = fs
    .readdirSync(corpus, { recursive: true })
    .map(String)
    .filter((f) => f.endsWith(".tsx") && (!filter || filter.split(",").some((part) => f.includes(part))))
    .sort();

  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.route("**/*", fromCache);
  const results: Result[] = [];
  // A filtered run replaces only its own templates' results.
  const resultsFile = path.join(out, "results.json");
  const previous: Result[] = filter && fs.existsSync(resultsFile) ? JSON.parse(fs.readFileSync(resultsFile, "utf8")) : [];
  const save = () => {
    const mine = new Set(results.map((r) => r.template));
    const all = [...previous.filter((r) => !mine.has(r.template)), ...results];
    all.sort((a, b) => a.template.localeCompare(b.template) || a.mode.localeCompare(b.mode));
    fs.writeFileSync(resultsFile, JSON.stringify(all, null, 2));
  };
  // Templates run a few at a time: most of the time goes to screenshots.
  const queue = [...files];
  const worker = async () => {
    for (let file = queue.shift(); file; file = queue.shift()) {
      results.push(...(await measure(context, file)));
      save();
    }
  };
  await Promise.all(Array.from({ length: Number(process.env.BENCH_CONCURRENCY ?? 4) }, worker));
  await browser.close();

  typecheck(results);
  save();
  fs.writeFileSync(path.join(out, "results.md"), summarize(results));
  console.log(`\n${summarize(results)}`);
  const failed = results.filter((r) => !r.converted || r.error || r.missingText?.length || r.addedWords || r.missingAttributes?.length || r.variants?.length || r.jsonWarnings);
  console.log(`${failed.length} conversions failed the content check.`);
  if (failed.length) process.exitCode = 2;
}

async function measure(context: BrowserContext, file: string): Promise<Result[]> {
  const group = file.split(path.sep)[0];
  const name = file.replace(/\.tsx$/, "").replace(/[\\/]/g, "__");
  const dir = path.join(out, name);
  fs.mkdirSync(dir, { recursive: true });
  let original: string;
  let Template: any;
  try {
    const mod = await import(path.join(corpus, file));
    Template = mod.default;
    original = await render(React.createElement(Template, Template.PreviewProps ?? {}));
    fs.writeFileSync(path.join(dir, "original.html"), original);
  } catch (error) {
    console.log(`skip ${file}: original doesn't render (${(error as Error).message})`);
    return [];
  }

  const results: Result[] = [];
  for (const mode of ["runtime", "codemod"] as const) {
    const result: Result = { template: name, group, mode, converted: false };
    try {
      const html = mode === "runtime" ? await runtime(Template, dir) : await codemod(path.join(corpus, file), dir, Template);
      if (html === undefined) continue;
      result.converted = true;
      Object.assign(result, JSON.parse(fs.readFileSync(path.join(dir, `${mode}.report.json`), "utf8")));
      const check = compareText(original, html);
      result.missingText = check.missing;
      result.addedText = check.added;
      result.addedWords = check.added.length;
      result.missingAttributes = check.missingAttributes;
      const scores = await compare(context, original, html, path.join(dir, mode));
      result.diff = scores.diff;
      result.looks = scores.looks;
      result.layout = scores.layout;
    } catch (error) {
      result.error = (error as Error).message.split("\n")[0];
    }
    results.push(result);
    const l = result.layout?.[700];
    const score = l ? `lost ${result.missingText?.length ?? 0}/${result.missingAttributes?.length ?? 0} extra ${result.addedWords ?? 0} jumps ${l.jumps} moved ${pct(l.moved)}` : "-";
    console.log(`${mode.padEnd(8)} ${name.padEnd(60)} ${result.converted ? "ok " : "ERR"} native ${pct(result.nativeRatio)} ${score} ${result.error ?? ""}`);
  }
  await reviewSheet(dir);
  return results;
}

// ============================================
// Assets: fetched once, then served from .bench-out/.net-cache
// ============================================

const cacheDir = path.join(out, ".net-cache");
const pending = new Map<string, Promise<{ status: number; contentType: string; body: Buffer }>>();

async function fromCache(route: Route): Promise<void> {
  const url = route.request().url();
  if (!/^https?:/.test(url)) return route.continue();
  let entry = pending.get(url);
  if (!entry) {
    entry = loadAsset(route, url);
    pending.set(url, entry);
  }
  const { status, contentType, body } = await entry;
  // Fonts are fetched cross-origin: allow it, as the font hosts do.
  await route.fulfill({ status, body, headers: { "content-type": contentType, "access-control-allow-origin": "*" } });
}

async function loadAsset(route: Route, url: string): Promise<{ status: number; contentType: string; body: Buffer }> {
  fs.mkdirSync(cacheDir, { recursive: true });
  const file = path.join(cacheDir, createHash("sha1").update(url).digest("hex"));
  if (fs.existsSync(`${file}.json`)) {
    const meta = JSON.parse(fs.readFileSync(`${file}.json`, "utf8"));
    return { ...meta, body: fs.readFileSync(file) };
  }
  let entry: { status: number; contentType: string; body: Buffer } = { status: 404, contentType: "text/plain", body: Buffer.alloc(0) };
  try {
    const response = await route.fetch({ timeout: 20000 });
    entry = { status: response.status(), contentType: response.headers()["content-type"] ?? "", body: await response.body() };
  } catch {
    // Unreachable: cached as a 404, so every render sees the same.
  }
  fs.writeFileSync(file, entry.body);
  fs.writeFileSync(`${file}.json`, JSON.stringify({ url, status: entry.status, contentType: entry.contentType }));
  return entry;
}

async function runtime(Template: any, dir: string): Promise<string> {
  // Sample values, not merge tags: the comparison is with the original as it renders them.
  const conversion = await convertReactEmail(Template, { mergeTags: false });
  const html = conversion.html();
  fs.writeFileSync(path.join(dir, "runtime.html"), html);
  fs.writeFileSync(path.join(dir, "runtime.tsx"), await conversion.tsx());
  fs.writeFileSync(path.join(dir, "runtime.design.json"), JSON.stringify(conversion.design(), null, 2));
  fs.writeFileSync(path.join(dir, "runtime.report.json"), JSON.stringify(summaryOf(conversion.report), null, 2));
  return html;
}

async function codemod(file: string, dir: string, Template: any): Promise<string | undefined> {
  // The config itself can be code (plugins, presets): take it from the module.
  const tailwindConfig = await findTailwindConfig(React.createElement(Template, Template.PreviewProps ?? {}));
  const result = await convertSource(fs.readFileSync(file, "utf8"), { fileName: path.basename(file), tailwindConfig });
  const target = path.join(dir, "codemod.tsx");
  fs.writeFileSync(target, result.code);
  fs.writeFileSync(path.join(dir, "codemod.report.json"), JSON.stringify(summaryOf(result.report), null, 2));
  // Render the migrated component with the original's sample props.
  const mod = await import(`${target}?t=${Date.now()}`);
  const { renderToHtml } = await import("@unlayer/react-elements");
  const Component = mod.default;
  const html = renderToHtml(Component(Component.PreviewProps ?? {}));
  // The editor path: renderToJson must see every row (it skips what it can't walk).
  const { renderToJson } = await import("@unlayer/react-elements");
  const warn = console.warn;
  const warnings: string[] = [];
  console.warn = (...args: unknown[]) => void warnings.push(args.map(String).join(" "));
  try {
    renderToJson(Component(Component.PreviewProps ?? {}));
  } finally {
    console.warn = warn;
  }
  const report = JSON.parse(fs.readFileSync(path.join(dir, "codemod.report.json"), "utf8"));
  report.jsonWarnings = warnings.filter((w) => w.includes("renderToJson")).length;
  // Branches the preview props don't take: each boolean prop flipped.
  report.variants = (await verifyConversion(Template, Component)).variants;
  fs.writeFileSync(path.join(dir, "codemod.report.json"), JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(dir, "codemod.html"), html);
  return html;
}

function summaryOf(report: any) {
  return {
    contentNodes: report.contentNodes,
    nativeRatio: report.nativeRatio,
    fallbacks: report.fallbacks,
    notes: report.notes,
  };
}

/**
 * Render both at each width, once assets have loaded. `layout`: word
 * positions (see `layoutScore`). `diff`: the share of pixels that differ.
 * `looks`: the same on 4×-shrunk images with a looser threshold.
 */
async function compare(
  context: BrowserContext,
  a: string,
  b: string,
  prefix: string
): Promise<{ diff: Record<number, number>; looks: Record<number, number>; layout: Record<number, Layout> }> {
  const scores: Record<number, number> = {};
  const looks: Record<number, number> = {};
  const layout: Record<number, Layout> = {};
  // Fonts: the conversion links Google Fonts stylesheets for the template's
  // <Font>s, which serve other files than the template's own (other versions,
  // and React Email's demo Inter 400 URL is a 404, so the original falls back
  // to Arial there). Layout is what's measured: the conversion is rendered
  // with the original's own @font-face and @import rules instead.
  const imports = [...a.matchAll(/@import\s+url\([^)]*\)[^;]*;/g)].map((m) => m[0]);
  const faces = [...imports, ...[...a.matchAll(/@font-face\s*\{[^}]*\}/g)].map((m) => m[0])].join("\n");
  if (faces) {
    b = b.replace(/<link href="https:\/\/fonts\.googleapis\.com\/[^"]*" rel="stylesheet"[^>]*>/g, "");
    b = b.replace(/<\/head>/i, `<style>${faces}</style></head>`);
  }
  for (const width of WIDTHS) {
    const shots: PNG[] = [];
    const words: Word[][] = [];
    let overflows = false;
    for (const html of [a, b]) {
      const page = await context.newPage();
      await page.setViewportSize({ width, height: 800 });
      await page.setContent(html, { waitUntil: "load", timeout: 30000 }).catch(() => undefined);
      await page.evaluate(SETTLED).catch(() => undefined);
      words.push(await page.evaluate(WORDS));
      if (html === a) overflows = Number(await page.evaluate("document.documentElement.scrollWidth")) > width + 4;
      shots.push(PNG.sync.read(await page.screenshot({ fullPage: true })));
      await page.close();
    }
    layout[width] = { ...layoutScore(words[0], words[1]), ...(overflows ? { overflows } : {}) };
    const [x, y] = shots.map((s) =>
      pad(s, Math.max(shots[0].width, shots[1].width), Math.max(shots[0].height, shots[1].height))
    );
    const diff = new PNG({ width: x.width, height: x.height });
    const changed = pixelmatch(x.data, y.data, diff.data, x.width, x.height, { threshold: 0.1 });
    scores[width] = changed / (x.width * x.height);
    const [sx, sy] = [shrink(x, 4), shrink(y, 4)];
    looks[width] = pixelmatch(sx.data, sy.data, undefined, sx.width, sx.height, { threshold: 0.2 }) / (sx.width * sx.height);
    fs.writeFileSync(`${prefix}.${width}.png`, PNG.sync.write(sideBySide(x, y, diff)));
    fs.writeFileSync(`${path.dirname(prefix)}/original.${width}.only.png`, PNG.sync.write(shots[0]));
    fs.writeFileSync(`${prefix}.${width}.only.png`, PNG.sync.write(shots[1]));
  }
  return { diff: scores, looks, layout };
}

/** Images decoded and web fonts loaded. */
const SETTLED = `(async () => {
  await document.fonts.ready;
  await Promise.all([...document.images].map((img) => img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; setTimeout(r, 5000); })));
})()`;

type Word = { w: string; x: number; y: number };

/** Every visible word with its position (strings: no bundler helpers reach the page). */
const WORDS = `(() => {
  const hidden = (el) => {
    for (; el && el !== document.body; el = el.parentElement) {
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0" || cs.maxHeight === "0px") return true;
    }
    return false;
  };
  const found = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent || "";
    if (!text.trim() || hidden(node.parentElement)) continue;
    const re = /\\S+/g;
    for (let m = re.exec(text); m; m = re.exec(text)) {
      const range = document.createRange();
      range.setStart(node, m.index);
      range.setEnd(node, m.index + m[0].length);
      const r = range.getBoundingClientRect();
      if (r.width < 1 || r.height < 4) continue;
      const w = m[0].toLowerCase().replace(/[^\\p{L}\\p{N}]/gu, "");
      if (w) found.push({ w, x: r.left, y: r.top + window.scrollY });
    }
  }
  return found;
})()`;

/**
 * Pixel diffs on mostly-white emails stay low even when columns collapse, so
 * layout is compared through words: each of the original's words is matched
 * to the same occurrence in the conversion.
 */
function layoutScore(original: Word[], converted: Word[]): Layout {
  const pool = new Map<string, Word[]>();
  for (const word of converted) pool.set(word.w, [...(pool.get(word.w) ?? []), word]);
  const pairs: Array<[Word, Word]> = [];
  for (const word of original) {
    const match = pool.get(word.w)?.shift();
    if (match) pairs.push([word, match]);
  }
  // The whole email shifted sideways (left-aligned vs centred) isn't a layout change.
  const dxs = pairs.map(([o, c]) => c.x - o.x).sort((p, q) => p - q);
  const offset = dxs[Math.floor(dxs.length / 2)] ?? 0;
  let jumps = 0;
  for (let i = 1; i < pairs.length; i++) {
    const [[o0, c0], [o1, c1]] = [pairs[i - 1], pairs[i]];
    if (o1.y - o0.y >= -2 && c1.y - c0.y < -20) jumps++;
  }
  return {
    words: original.length,
    missing: original.length ? 1 - pairs.length / original.length : 0,
    moved: pairs.length ? pairs.filter(([o, c]) => Math.abs(c.x - o.x - offset) > 48).length / pairs.length : 0,
    jumps,
  };
}

/** original | codemod | runtime at 700px, half size: one image to look at per template. */
async function reviewSheet(dir: string): Promise<void> {
  const panels = ["original", "codemod", "runtime"]
    .map((name) => path.join(dir, `${name}.700.only.png`))
    .filter((file) => fs.existsSync(file))
    .map((file) => shrink(PNG.sync.read(fs.readFileSync(file)), 2));
  if (panels.length) fs.writeFileSync(path.join(dir, "review.png"), PNG.sync.write(sideBySide(...panels)));
}

/** Box-filter downscale by `factor`. */
function shrink(png: PNG, factor: number): PNG {
  const width = Math.floor(png.width / factor);
  const height = Math.floor(png.height / factor);
  const out = new PNG({ width, height });
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      for (let c = 0; c < 4; c++) {
        let sum = 0;
        for (let dy = 0; dy < factor; dy++) {
          for (let dx = 0; dx < factor; dx++) sum += png.data[((y * factor + dy) * png.width + (x * factor + dx)) * 4 + c];
        }
        out.data[(y * width + x) * 4 + c] = sum / (factor * factor);
      }
    }
  }
  return out;
}

function pad(png: PNG, width: number, height: number): PNG {
  if (png.height === height && png.width === width) return png;
  const out = new PNG({ width, height, fill: true });
  out.data.fill(255);
  PNG.bitblt(png, out, 0, 0, png.width, png.height, 0, 0);
  return out;
}

function sideBySide(...images: PNG[]): PNG {
  const width = images.reduce((sum, img) => sum + img.width + 8, 0);
  const height = Math.max(...images.map((img) => img.height));
  const out = new PNG({ width, height });
  out.data.fill(200);
  let x = 0;
  for (const img of images) {
    PNG.bitblt(img, out, 0, 0, img.width, img.height, x, 0);
    x += img.width + 8;
  }
  return out;
}

/**
 * Type-check every emitted TSX file, and the originals with the same flags:
 * a converted file "type-checks" when it has no more errors than its
 * original (the codemod keeps the template's own code, errors included).
 */
function typecheck(results: Result[]) {
  const converted = results.filter((r) => r.converted).map((r) => path.join(out, r.template, `${r.mode}.tsx`));
  const originals = [...new Set(results.map((r) => r.template))].map((t) => originalFile(t)).filter((f): f is string => !!f);
  const errors = errorCounts([...converted, ...originals]);
  for (const result of results) {
    if (!result.converted) continue;
    const mine = errors.get(path.join(out, result.template, `${result.mode}.tsx`)) ?? 0;
    const theirs = errors.get(originalFile(result.template) ?? "") ?? 0;
    result.typechecks = mine <= theirs;
    result.typeErrors = mine;
    result.originalTypeErrors = theirs;
  }
}

function originalFile(template: string): string | undefined {
  const file = path.join(corpus, `${template.replace("__", path.sep)}.tsx`);
  return fs.existsSync(file) ? file : undefined;
}

function errorCounts(files: string[]): Map<string, number> {
  let output = "";
  try {
    execFileSync(
      path.join(root, "node_modules/.bin/tsc"),
      ["--noEmit", "--jsx", "react-jsx", "--moduleResolution", "bundler", "--module", "esnext", "--target", "es2022", "--strict", "--skipLibCheck", "--types", "react", ...files],
      { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }
    );
  } catch (error: any) {
    output = String(error.stdout ?? "");
  }
  const counts = new Map<string, number>();
  for (const line of output.split("\n")) {
    const match = /^(.+?)\(\d+,\d+\): error TS/.exec(line);
    if (match) {
      const file = path.resolve(root, match[1]);
      counts.set(file, (counts.get(file) ?? 0) + 1);
    }
  }
  return counts;
}

function pct(value: number | undefined): string {
  return value === undefined ? "  -  " : `${Math.round(value * 100)}%`.padStart(4);
}

function summarize(results: Result[]): string {
  const lines = [
    "| Template | Mode | Converts | Type-checks | Native | Words lost | Words added | Order breaks 700 / 375 | Words moved 700 / 375 | Looks 700 / 375 |",
    "|---|---|---|---|---|---|---|---|---|---|",
  ];
  const both = (r: Result, f: (w: number) => string) => (r.layout ? WIDTHS.map(f).join(" / ") : "-");
  for (const r of results) {
    lines.push(
      `| ${r.template} | ${r.mode} | ${r.converted ? "yes" : `no (${r.error ?? ""})`} | ${r.typechecks === undefined ? "-" : r.typechecks ? "yes" : "no"} | ${pct(r.nativeRatio)} | ${r.missingText?.length ?? "-"} | ${r.addedWords ?? "-"} | ${both(r, (w) => String(r.layout![w].jumps))} | ${both(r, (w) => (r.layout![w].overflows ? "(original overflows)" : pct(r.layout![w].moved).trim()))} | ${both(r, (w) => `${(r.looks![w] * 100).toFixed(1)}%`)} |`
    );
  }
  return lines.join("\n") + "\n";
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
