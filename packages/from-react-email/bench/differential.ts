/**
 * Differential test of the migration check against Chromium. Pairs of
 * documents (an original and a migration) are made by mutating one side of a
 * base: the fixture templates' React Email renders and their migrations, and
 * small hand-written documents (differential/bases.ts). Chromium reads what a
 * reader sees on each side (differential/read.js) and decides whether they
 * differ within what the check promises (differential/oracle.ts); the check
 * (`compareText`) must fail every pair Chromium says differs. A pair it
 * passes is a false pass: the run fails, and the pair is written out to be
 * committed as a fixture (test/differential/), which the unit tests replay.
 * Pairs Chromium calls the same but the check fails are counted (false fails:
 * worth fixing, not a broken guarantee).
 *
 *   pnpm --filter @unlayer/from-react-email test:differential            # the fixed seeds CI runs
 *   pnpm --filter @unlayer/from-react-email test:differential --count 3000 --from 100000
 *
 * Fonts are the machine's: a difference within twice a tolerance is
 * "borderline" and not counted either way, so another machine's text widths
 * can't flip a verdict. Images are a 1×1 transparent PNG (their alt text
 * doesn't show as words); the network is off.
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import React from "react";
import { render } from "@react-email/components";
import { renderToHtml } from "@unlayer/react-elements";
import { chromium, type Page } from "playwright";
import { checkFails, compareText, convertReactEmail, convertSource, findTailwind, phoneDiffers } from "../src/index";
import { BASES } from "./differential/bases";
import { verdict, type Reading } from "./differential/oracle";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, ".bench-out/differential");
const READ = fs.readFileSync(path.join(import.meta.dirname, "differential/read.js"), "utf8");
const MUTATE = fs.readFileSync(path.join(import.meta.dirname, "differential/mutate.js"), "utf8");
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");

const arg = (name: string, fallback: number) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? Number(process.argv[i + 1]) : fallback;
};
const COUNT = arg("count", 400);
const FROM = arg("from", 1);

/** The documents mutated: hand-written ones, and each fixture's original with its migrations. */
async function bases(): Promise<Array<{ name: string; original: string; migrated: string }>> {
  const list = Object.entries(BASES).map(([name, html]) => ({ name, original: html, migrated: html }));
  const fixtures = path.join(root, "test/fixtures");
  const work = path.join(out, "fixtures");
  fs.mkdirSync(work, { recursive: true });
  for (const file of fs.readdirSync(fixtures).filter((f) => f.endsWith(".tsx")).sort()) {
    const full = path.join(fixtures, file);
    const { default: Template } = await import(pathToFileURL(full).href);
    const props = Template.PreviewProps ?? {};
    const original = await render(React.createElement(Template, props));
    const tailwind = await findTailwind(React.createElement(Template, props));
    const result = await convertSource(fs.readFileSync(full, "utf8"), { fileName: file, tailwindConfig: tailwind?.config, tailwind: tailwind?.component });
    const target = path.join(work, file);
    fs.writeFileSync(target, result.code);
    const { default: Migrated } = await import(pathToFileURL(target).href);
    list.push({ name: `${file} codemod`, original, migrated: renderToHtml(React.createElement(Migrated, props)) });
    list.push({ name: `${file} runtime`, original, migrated: (await convertReactEmail(Template, { mergeTags: false })).html() });
  }
  return list;
}

/** Each case: which base, which side is mutated, how many mutations. */
function plan(seed: number, count: number) {
  return { base: seed % count, side: (Math.floor(seed / count) % 2 === 0 ? "migrated" : "original") as "original" | "migrated", mutations: 1 + (seed % 3) };
}

async function main() {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ deviceScaleFactor: 1, colorScheme: "light", reducedMotion: "reduce" });
  await context.route("**/*", (route) => {
    const url = route.request().url();
    if (url.startsWith("data:")) return route.continue();
    if (route.request().resourceType() === "image") return route.fulfill({ status: 200, contentType: "image/png", body: PNG });
    return route.abort();
  });
  const pages = { mutate: await context.newPage(), desktop: await context.newPage(), phone: await context.newPage() };
  await pages.mutate.setViewportSize({ width: 700, height: 900 });
  await pages.desktop.setViewportSize({ width: 700, height: 900 });
  await pages.phone.setViewportSize({ width: 375, height: 800 });
  const read = async (page: Page, html: string): Promise<Reading> => {
    await page.setContent(html, { waitUntil: "load" });
    return (await page.evaluate(READ)) as Reading;
  };
  /** The document as the browser serializes it (both sides go through this, so only mutations differ). */
  const serialize = async (html: string) => {
    await pages.mutate.setContent(html, { waitUntil: "load" });
    return (await pages.mutate.evaluate(`(${MUTATE})({ seed: 1, count: 0 })`) as { html: string }).html;
  };
  const mutate = async (html: string, seed: number, count: number) => {
    await pages.mutate.setContent(html, { waitUntil: "load" });
    return (await pages.mutate.evaluate(`(${MUTATE})(${JSON.stringify({ seed, count })})`)) as { log: string[]; html: string };
  };
  const readings = new Map<string, { desktop: Reading; phone: Reading }>();
  const both = async (html: string) => {
    const cached = readings.get(html);
    if (cached) return cached;
    const reading = { desktop: await read(pages.desktop, html), phone: await read(pages.phone, html) };
    readings.set(html, reading);
    return reading;
  };

  // The oracle first: hand-labeled pairs it must read right, or every verdict below is suspect.
  const { SELF_TEST } = await import("./differential/self-test");
  const oracleErrors: string[] = [];
  for (const { name, a, b, differs } of SELF_TEST) {
    const [x, y] = [await both(await serialize(a)), await both(await serialize(b))];
    const v = verdict(x.desktop, y.desktop, x.phone, y.phone);
    if ((v.differs.length > 0) !== differs) oracleErrors.push(`${name}: expected ${differs ? "a difference" : "the same"}, read ${JSON.stringify(v)}`);
  }
  if (oracleErrors.length) {
    console.log(`The oracle misreads ${oracleErrors.length} labeled pair(s):\n${oracleErrors.join("\n")}`);
    await browser.close();
    process.exitCode = 1;
    return;
  }
  console.log(`oracle: ${SELF_TEST.length} labeled pairs read right`);

  // The committed fixtures (pairs found before): Chromium must still show each differently, and the check fail it.
  const fixtureFolder = path.join(root, "test/differential");
  const stale: string[] = [];
  for (const file of fs.readdirSync(fixtureFolder).filter((f) => f.endsWith(".json")).sort()) {
    const { original, migrated } = JSON.parse(fs.readFileSync(path.join(fixtureFolder, file), "utf8"));
    const [x, y] = [await both(await serialize(original)), await both(await serialize(migrated))];
    const v = verdict(x.desktop, y.desktop, x.phone, y.phone);
    if (!v.differs.length) stale.push(`${file}: Chromium shows both the same (${v.borderline.join("; ") || "no difference"})`);
    if (!checkFails(compareText(original, migrated))) stale.push(`${file}: the check passes it`);
  }
  if (stale.length) {
    console.log(`Fixtures that don't hold:\n${stale.join("\n")}`);
    await browser.close();
    process.exitCode = 1;
    return;
  }
  console.log(`fixtures: each of ${fs.readdirSync(fixtureFolder).filter((f) => f.endsWith(".json")).length} differs in Chromium and fails the check`);

  const list = await bases();
  // One page serializes: one base at a time.
  const normalized: typeof list = [];
  for (const b of list) normalized.push({ ...b, original: await serialize(b.original), migrated: await serialize(b.migrated) });
  const tally = { pairs: 0, differ: 0, same: 0, borderline: 0, falsePasses: 0, falseFails: 0, falseFailsConcrete: 0 };
  const falseFails = new Map<string, number>();
  // The bases themselves: the fixtures' migrations must pass as Chromium sees them, too.
  for (const base of normalized.filter((b) => b.original !== b.migrated)) {
    const [x, y] = [await both(base.original), await both(base.migrated)];
    const v = verdict(x.desktop, y.desktop, x.phone, y.phone);
    if (v.differs.length) console.log(`note: ${base.name} as migrated differs in Chromium: ${v.differs.slice(0, 3).join("; ")}`);
  }
  for (let seed = FROM; seed < FROM + COUNT; seed++) {
    const p = plan(seed, normalized.length);
    const base = normalized[p.base];
    const mutated = await mutate(p.side === "original" ? base.original : base.migrated, seed, p.mutations);
    const original = p.side === "original" ? mutated.html : base.original;
    const migrated = p.side === "migrated" ? mutated.html : base.migrated;
    const [x, y] = [await both(original), await both(migrated)];
    const v = verdict(x.desktop, y.desktop, x.phone, y.phone);
    const check = compareText(original, migrated);
    const fails = checkFails(check);
    tally.pairs++;
    if (v.differs.length) {
      tally.differ++;
      if (!fails) {
        tally.falsePasses++;
        const file = path.join(out, `false-pass-${seed}.json`);
        fs.writeFileSync(file, `${JSON.stringify({ seed, base: base.name, side: p.side, mutations: mutated.log, chromium: v.differs, original, migrated }, null, 2)}\n`);
        console.log(`✗ false pass, seed ${seed} (${base.name}, ${p.side}): ${v.differs.slice(0, 2).join("; ")}\n    ${mutated.log.join("\n    ")}\n    → ${path.relative(root, file)}`);
      }
    } else if (v.borderline.length) tally.borderline++;
    else {
      tally.same++;
      if (fails) {
        tally.falseFails++;
        const concrete = check.missing.length + check.added.length + check.styles.length + check.layout.length + check.missingAttributes.length + check.addedAttributes.length > 0 || phoneDiffers(check.phone);
        if (concrete) tally.falseFailsConcrete++;
        const cause = concrete
          ? `reads a difference: ${[...check.styles.map((s) => s.property), ...(check.layout.length ? ["layout"] : []), ...(check.missing.length || check.added.length ? ["words"] : []), ...(phoneDiffers(check.phone) ? ["phone"] : [])].join(", ")}`
          : `unverified: ${check.unverified.map((u) => u.what).join(", ")}`;
        falseFails.set(cause, (falseFails.get(cause) ?? 0) + 1);
        if (process.argv.includes("--verbose")) console.log(`  false fail, seed ${seed} (${base.name}): ${cause}\n    ${mutated.log.join("\n    ")}`);
      }
    }
  }
  await browser.close();
  console.log(`\n${tally.pairs} pairs (seeds ${FROM}–${FROM + COUNT - 1}): Chromium sees a difference in ${tally.differ}, the same in ${tally.same}, borderline in ${tally.borderline}.`);
  console.log(`False passes: ${tally.falsePasses}. False fails: ${tally.falseFails} (${tally.falseFailsConcrete} reading a difference that isn't there).`);
  for (const [cause, n] of [...falseFails].sort((a, b) => b[1] - a[1]).slice(0, 12)) console.log(`  ${n} × ${cause}`);
  if (tally.falsePasses) process.exitCode = 1;
  else console.log("\nDIFFERENTIAL_OK: the check fails every pair Chromium shows differently");
}

await main();
