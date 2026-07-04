#!/usr/bin/env node
// Run with: node scripts/storybook-visual.mjs   (requires `pnpm build-storybook` first)
// Regenerate the baseline with: UPDATE_VISUAL_BASELINE=1 node scripts/storybook-visual.mjs
//
// Storybook visual-drift gate.
//
// The smoke test proves every story paints without errors; this gate proves
// no story silently CHANGED. It loads every story from the static Storybook
// build in headless Chromium at desktop and mobile widths, fingerprints the
// computed styles of the rendered markup, and diffs against the committed
// baseline. A PR that alters any story's rendered styling fails with the
// exact story ids and property-level diffs — so "did anything change
// visually?" is answered by CI instead of by paging through 98 stories.
//
// Fingerprints use computed styles only — no pixel screenshots and no
// element geometry, both of which depend on platform font rasterization
// and would make a macOS-generated baseline fail on Linux CI. Style
// fingerprints are specification-derived and transfer exactly. The
// trade-off: pure rasterization differences (font hinting, image decoding)
// are invisible to this gate — those are what the trusted browser matrix
// is for; this catches the CSS/markup drift class, which is what code
// changes actually produce.

import { chromium } from "playwright";
import { spawn } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
const PKG_DIR = join(SCRIPTS_DIR, "..");
const STATIC_DIR = join(PKG_DIR, "storybook-static");
const BASELINE_PATH = join(SCRIPTS_DIR, "storybook-visual-baseline.json");
const UPDATE_BASELINE = process.env.UPDATE_VISUAL_BASELINE === "1";
const PORT = 6007;
const VIEWPORTS = { desktop: { width: 1280, height: 900 }, mobile: { width: 400, height: 900 } };

// Computed-style subset captured per element: spec-derived values that are
// identical across platforms. No geometry — font metrics differ per OS.
const STYLE_PROPS = [
  "display", "position", "flexWrap", "flexDirection", "flexBasis",
  "color", "backgroundColor", "backgroundImage",
  "fontSize", "fontWeight", "fontStyle", "fontFamily", "lineHeight",
  "textAlign", "textDecorationLine", "letterSpacing", "direction",
  "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
  "marginTop", "marginBottom",
  "borderTopWidth", "borderTopStyle", "borderTopColor",
  "borderLeftWidth", "borderLeftStyle", "borderLeftColor",
  "borderRadius", "maxWidth", "verticalAlign", "overflowWrap",
];

if (!existsSync(join(STATIC_DIR, "index.json"))) {
  console.error("VISUAL_FAIL: storybook-static/index.json not found — run `pnpm build-storybook` first");
  process.exit(1);
}

const index = JSON.parse(readFileSync(join(STATIC_DIR, "index.json"), "utf8"));
const storyIds = Object.values(index.entries ?? index.stories ?? {})
  .filter((e) => e.type === "story" || e.type === undefined)
  .map((e) => e.id)
  .sort();

if (storyIds.length === 0) {
  console.error("VISUAL_FAIL: no stories found in the Storybook index");
  process.exit(1);
}

// Serve the static build (iframe.html needs http, not file://)
const server = spawn(
  process.execPath,
  [join(PKG_DIR, "node_modules", "http-server", "bin", "http-server"), STATIC_DIR, "-p", String(PORT), "--silent"],
  { stdio: "ignore" }
);
const serverReady = async () => {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/iframe.html`);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("static server did not start");
};

/**
 * Fingerprint the story markup: one compact line per meaningful element
 * (semantic tags and Unlayer-classed wrappers; layout plumbing like
 * tbody/tr is skipped). Identical lines are run-length collapsed so email
 * table repetition doesn't bloat the baseline.
 */
async function fingerprint(page) {
  return page.evaluate((props) => {
    const MEANINGFUL = new Set(["P", "H1", "H2", "H3", "H4", "H5", "H6", "A", "IMG", "BUTTON", "UL", "OL", "LI", "TD", "SPAN", "STRONG", "EM"]);
    const root = document.querySelector("#storybook-root");
    if (!root) return null;
    const lines = [];
    for (const el of root.querySelectorAll("*")) {
      const hasUnlayerClass = [...el.classList].some((c) => c.startsWith("u-") || c.startsWith("u_") || c.startsWith("v-"));
      if (!MEANINGFUL.has(el.tagName) && !hasUnlayerClass) continue;
      const cs = getComputedStyle(el);
      const normalize = (p, v) => {
        if (p !== "fontFamily") return v;
        // Font-family computed values carry two OS-dependent spellings:
        // the UA default serif name (macOS "Times", Linux "Times New
        // Roman") and BlinkMacSystemFont (canonicalized to system-ui on
        // macOS, kept literal on Linux). Explicit families otherwise
        // compute identically.
        const unquoted = v
          .replace(/"/g, "")
          .replace(/BlinkMacSystemFont/g, "system-ui");
        return unquoted === "Times" || unquoted === "Times New Roman"
          ? "ua-default-serif"
          : unquoted;
      };
      const styles = props
        .map((p) => `${p}:${normalize(p, cs[p])}`)
        .filter((s) => !s.endsWith(":none") && !s.endsWith(":normal") && !s.endsWith(":auto") && !s.endsWith(":0px") && !s.endsWith(":rgba(0, 0, 0, 0)"))
        .join(";");
      const classes = [...el.classList].filter((c) => c.startsWith("u") || c.startsWith("v-")).sort().join(".");
      lines.push(`${el.tagName.toLowerCase()}${classes ? "." + classes : ""}|${styles}`);
    }
    // Run-length collapse
    const collapsed = [];
    for (const line of lines) {
      const last = collapsed[collapsed.length - 1];
      if (last && last.line === line) last.n++;
      else collapsed.push({ line, n: 1 });
    }
    return collapsed.map(({ line, n }) => (n > 1 ? `${n}x ${line}` : line));
  }, STYLE_PROPS);
}

// The baseline stores each unique fingerprint line once (dict) and each
// story render as index references — email markup repeats the same lines
// heavily, so this keeps the committed file ~7x smaller while a style
// change still shows up in git diff as a readable dictionary line.
function encodeBaseline(stories) {
  const dict = [];
  const indexOf = new Map();
  const encoded = {};
  for (const [key, lines] of Object.entries(stories)) {
    encoded[key] = lines.map((line) => {
      if (!indexOf.has(line)) {
        indexOf.set(line, dict.length);
        dict.push(line);
      }
      return indexOf.get(line);
    });
  }
  return { dict, stories: encoded };
}

function decodeBaseline({ dict, stories }) {
  const decoded = {};
  for (const [key, refs] of Object.entries(stories)) {
    decoded[key] = refs.map((i) => dict[i]);
  }
  return decoded;
}

function diffLines(before = [], after = []) {
  const out = [];
  const max = Math.max(before.length, after.length);
  for (let i = 0; i < max && out.length < 6; i++) {
    if (before[i] !== after[i]) {
      out.push(`  line ${i}: ${JSON.stringify(before[i] ?? "(missing)")} -> ${JSON.stringify(after[i] ?? "(missing)")}`);
    }
  }
  return out;
}

const browser = await chromium.launch();
let failedStories = [];
try {
  await serverReady();
  const page = await browser.newPage();
  const current = {};

  for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
    await page.setViewportSize(viewport);
    for (const id of storyIds) {
      await page.goto(`http://127.0.0.1:${PORT}/iframe.html?viewMode=story&id=${id}`, { waitUntil: "load" });
      await page.waitForSelector("#storybook-root", { state: "attached", timeout: 10_000 });
      const fp = await fingerprint(page);
      current[`${id}@${viewportName}`] = fp ?? ["(no root)"];
    }
  }

  if (UPDATE_BASELINE || !existsSync(BASELINE_PATH)) {
    if (!UPDATE_BASELINE && process.env.CI) {
      console.error("VISUAL_FAIL: baseline missing in CI — commit scripts/storybook-visual-baseline.json (generate with UPDATE_VISUAL_BASELINE=1)");
      process.exit(1);
    }
    writeFileSync(BASELINE_PATH, JSON.stringify(encodeBaseline(current), null, 1) + "\n");
    console.log(`VISUAL_OK: baseline ${UPDATE_BASELINE ? "regenerated" : "created"} for ${storyIds.length} stories x ${Object.keys(VIEWPORTS).length} viewports`);
  } else {
    const baseline = decodeBaseline(JSON.parse(readFileSync(BASELINE_PATH, "utf8")));
    const keys = new Set([...Object.keys(baseline), ...Object.keys(current)]);
    for (const key of keys) {
      const b = baseline[key];
      const c = current[key];
      if (JSON.stringify(b) === JSON.stringify(c)) continue;
      failedStories.push(key);
      console.error(`VISUAL_DIFF [${key}]${!b ? " (new story — update the baseline)" : !c ? " (story removed)" : ""}`);
      if (b && c) for (const d of diffLines(b, c)) console.error(d);
    }
    if (failedStories.length) {
      console.error(`VISUAL_FAIL: ${failedStories.length} of ${keys.size} story renders changed.`);
      console.error("If intentional, regenerate with: UPDATE_VISUAL_BASELINE=1 pnpm test:visual");
    } else {
      console.log(`VISUAL_OK: ${storyIds.length} stories x ${Object.keys(VIEWPORTS).length} viewports match the baseline`);
    }
  }
} finally {
  await browser.close();
  server.kill();
}

if (failedStories.length) process.exit(1);
