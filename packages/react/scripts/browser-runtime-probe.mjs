#!/usr/bin/env node
// Browser import/runtime gate for @unlayer/react-elements.
//
// The normal browser E2E generates HTML in Node and only loads that HTML into
// Chromium. This probe instead bundles the shipped package entry and executes
// renderToHtml() inside Chromium, where Node's global `process` does not exist.
// It catches dependencies that accidentally evaluate process.env at import or
// render time, which otherwise presents to consumers as a blank browser page.

import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";
import { build } from "tsup";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const outDir = mkdtempSync(join(tmpdir(), "unlayer-browser-runtime-"));
const bundlePath = join(outDir, "browser-runtime-entry.js");

let browser;

try {
  await build({
    entry: {
      "browser-runtime-entry": join(scriptsDir, "browser-runtime-entry.mjs"),
    },
    bundle: true,
    clean: true,
    define: {
      // Browser bundlers replace React's standard NODE_ENV branch. Deliberately
      // do not define any other process.env key: those must be browser-safe.
      "process.env.NODE_ENV": JSON.stringify("production"),
    },
    dts: false,
    external: [],
    format: ["iife"],
    globalName: "UnlayerElementsBrowserRuntimeProbe",
    minify: false,
    noExternal: [/.*/],
    outDir,
    outExtension: () => ({ js: ".js" }),
    platform: "browser",
    replaceNodeEnv: false,
    silent: true,
    sourcemap: false,
    splitting: false,
    target: "chrome100",
    treeshake: true,
  });

  browser = await chromium.launch();

  // Negative control: prove this is a process-free browser and that the probe
  // would detect the original exporters failure.
  const negativePage = await browser.newPage();
  const negativeErrors = [];
  negativePage.on("pageerror", (error) => negativeErrors.push(String(error)));
  await negativePage.setContent("<!doctype html><html><body></body></html>");

  const processTypeBeforeBundle = await negativePage.evaluate(
    () => typeof globalThis.process,
  );
  if (processTypeBeforeBundle !== "undefined") {
    throw new Error(
      `Negative control has a process global (${processTypeBeforeBundle})`,
    );
  }

  await negativePage.addScriptTag({
    content: "globalThis.__negativeControl = process.env.IS_OFFLINE;",
  });
  await negativePage.waitForTimeout(0);
  await negativePage.close();

  if (!negativeErrors.some((error) => /process is not defined/.test(error))) {
    throw new Error(
      "Negative control did not reproduce an unguarded process.env failure",
    );
  }

  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(String(error)));
  await page.setContent("<!doctype html><html><body></body></html>");
  await page.addScriptTag({ path: bundlePath });
  await page.waitForTimeout(0);

  const result = await page.evaluate(() => ({
    processType: typeof globalThis.process,
    probe: globalThis.__UNLAYER_ELEMENTS_BROWSER_RUNTIME_PROBE__ ?? null,
  }));

  if (pageErrors.length > 0) {
    throw new Error(`Browser bundle threw: ${pageErrors.join(" | ")}`);
  }
  if (result.processType !== "undefined") {
    throw new Error(`Browser bundle introduced a process global`);
  }
  if (!result.probe) {
    throw new Error("Browser bundle did not complete the runtime probe");
  }
  if (result.probe.processType !== "undefined") {
    throw new Error("renderToHtml() ran with an unexpected process global");
  }
  if (
    typeof result.probe.html !== "string" ||
    !result.probe.html.includes("Browser runtime probe content")
  ) {
    throw new Error("renderToHtml() did not produce the expected browser HTML");
  }

  console.info(
    "BROWSER_RUNTIME_OK: package imports and renderToHtml() runs in Chromium without a process global",
  );
} catch (error) {
  console.error(
    `BROWSER_RUNTIME_FAIL: ${error?.stack || error?.message || String(error)}`,
  );
  process.exitCode = 1;
} finally {
  await browser?.close();
  rmSync(outDir, { force: true, recursive: true });
}
