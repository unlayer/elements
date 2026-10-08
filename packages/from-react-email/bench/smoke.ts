/**
 * Fidelity smoke test, for CI: the templates in test/fixtures converted both
 * ways (codemod and runtime) and rendered next to their originals in Chromium,
 * at desktop and phone widths. It fails when a conversion loses or adds
 * content, or when a word renders at another size or lands somewhere else.
 *
 *   pnpm --filter @unlayer/from-react-email test:fidelity
 *
 * The network is off: images show at their given size, fonts are the
 * system's, the same on both sides. The full benchmark (run.ts) measures the
 * corpus; this keeps a small, committed set honest on every change.
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import React from "react";
import { render } from "@react-email/components";
import { renderToHtml } from "@unlayer/react-elements";
import { chromium, type BrowserContext } from "playwright";
import { compareText, convertReactEmail, convertSource, findTailwind } from "../src/index";
import { layoutScore, resizedWords, SETTLED, WORDS, type Word } from "./layout";

const root = path.resolve(import.meta.dirname, "..");
const fixtures = path.join(root, "test/fixtures");
const work = path.join(root, ".bench-out/smoke");

// Words moved per fixture, mode and width, as last accepted: a change may not
// make any of them worse. Phones aren't all exact yet (Elements stacks some
// columns its own way); desktop is. The tolerance absorbs font rendering
// differences between machines (macOS here, Linux in CI).
// Regenerate after an intended change: UPDATE_FIDELITY_BASELINE=1.
const baselineFile = path.join(root, "bench/smoke-baseline.json");
const TOLERANCE: Record<number, number> = { 700: 0.02, 375: 0.05 };
const update = process.env.UPDATE_FIDELITY_BASELINE === "1";

async function words(context: BrowserContext, html: string, width: number): Promise<Word[]> {
  const page = await context.newPage();
  await page.setViewportSize({ width, height: 800 });
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(SETTLED);
  const found = (await page.evaluate(WORDS)) as Word[];
  await page.close();
  return found;
}

async function codemodHtml(file: string, Template: any, props: Record<string, unknown>): Promise<string> {
  const tailwind = await findTailwind(React.createElement(Template, props));
  const result = await convertSource(fs.readFileSync(file, "utf8"), { fileName: path.basename(file), tailwindConfig: tailwind?.config, tailwind: tailwind?.component });
  const target = path.join(work, path.basename(file));
  fs.writeFileSync(target, result.code);
  const { default: Migrated } = await import(pathToFileURL(target).href);
  return renderToHtml(React.createElement(Migrated, props));
}

async function main() {
  fs.mkdirSync(work, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.route("**/*", (route) => (route.request().url().startsWith("data:") ? route.continue() : route.abort()));
  const problems: string[] = [];
  const baseline: Record<string, Record<number, number>> = fs.existsSync(baselineFile) ? JSON.parse(fs.readFileSync(baselineFile, "utf8")) : {};
  const measured: Record<string, Record<number, number>> = {};
  for (const name of fs.readdirSync(fixtures).filter((f) => f.endsWith(".tsx")).sort()) {
    const file = path.join(fixtures, name);
    const { default: Template } = await import(pathToFileURL(file).href);
    const props = Template.PreviewProps ?? {};
    const original = await render(React.createElement(Template, props));
    const converted = {
      codemod: await codemodHtml(file, Template, props),
      runtime: (await convertReactEmail(Template, { mergeTags: false })).html(),
    };
    for (const [mode, html] of Object.entries(converted)) {
      const label = `${name} (${mode})`;
      const check = compareText(original, html);
      for (const [kind, list] of [["lost words", check.missing], ["extra words", check.added], ["lost links/images", check.missingAttributes], ["extra links/images", check.addedAttributes]] as const) {
        if (list.length) problems.push(`${label}: ${kind}: ${list.slice(0, 5).join(", ")}`);
      }
      const line: string[] = [];
      for (const width of [700, 375]) {
        const [a, b] = [await words(context, original, width), await words(context, html, width)];
        const score = layoutScore(a, b);
        const resized = resizedWords(a, b);
        const moved = Math.round(score.moved * 1000) / 1000;
        (measured[label] ??= {})[width] = moved;
        const accepted = baseline[label]?.[width];
        line.push(`${width}px moved ${(moved * 100).toFixed(1)}%`);
        if (score.missing > 0) problems.push(`${label} at ${width}px: ${(score.missing * 100).toFixed(1)}% of words not shown`);
        if (accepted === undefined && !update) problems.push(`${label} at ${width}px: no baseline (run with UPDATE_FIDELITY_BASELINE=1)`);
        else if (!update && moved > accepted + TOLERANCE[width]) problems.push(`${label} at ${width}px: ${(moved * 100).toFixed(1)}% of words moved, was ${(accepted * 100).toFixed(1)}%`);
        if (score.jumps) problems.push(`${label} at ${width}px: reading order breaks ${score.jumps} time(s)`);
        if (width === 700 && resized.length) problems.push(`${label} at ${width}px: words at another size: ${resized.slice(0, 5).join(", ")}`);
      }
      console.log(`${problems.some((p) => p.startsWith(label)) ? "✗" : "✓"} ${label}: ${line.join(", ")}`);
    }
  }
  await browser.close();
  if (update) {
    fs.writeFileSync(baselineFile, `${JSON.stringify(measured, null, 2)}\n`);
    console.log(`\nBaseline written: ${path.relative(root, baselineFile)}`);
  }
  if (problems.length) {
    console.log(`\n${problems.join("\n")}`);
    process.exitCode = 1;
  } else {
    console.log("\nFIDELITY_OK: every fixture keeps its content and text sizes, and no layout got worse");
  }
}

await main();
