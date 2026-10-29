/**
 * Measure the Beefree converter over a folder of Beefree templates (`*.json`, with Beefree's HTML export beside each
 * where there is one: `<name>.html`, or `exports/<name>.html`):
 *
 *   pnpm exec tsx scripts/measure-beefree.ts [folder] [--json <file>] [--html <dir>] [--verbose]
 *
 * Each template is converted, written as Elements code (`designToElements`), compiled and rendered with the built
 * `@unlayer/react-elements`, and, where it has an export, checked against it with the content check `migrate` uses,
 * after the differences the conversion declares (a social icon's alt text, a hamburger menu) are made in the export.
 * Without a folder it measures the committed fixtures (test/fixtures/beefree). `--html` writes each rendered template
 * there (`<name>.unlayer.html`); `--json` writes the per-template results.
 */
import fs from "node:fs";
import path from "node:path";
import { applyDeclared, compareText, type TextCheck } from "@unlayer/convert-core";
import { beefreeDeclared } from "../src/beefree";
import { beefreeToDesign, BeefreeFormatError } from "../src/from-beefree";
import { failureCauses, lostContent, render, roundTripDifferences } from "../test/from-beefree/harness";

interface Result {
  file: string;
  status: "converted" | "not-a-template" | "error";
  error?: string;
  version?: string;
  blocks?: number;
  htmlBlocks?: number;
  fallbacks?: number;
  editable?: number;
  warnings?: string[];
  warningReasons?: string[];
  codegenWarnings?: string[];
  roundTrip?: string[];
  /** Declared differences the check expected (each kind, and how many places). */
  declared?: string[];
  check?: "pass" | "fail" | "unverified";
  lost?: { missing: string[]; added: string[]; missingAttributes: string[]; addedAttributes: string[]; phoneMissing: string[]; phoneAdded: string[] };
  looks?: number;
  causes?: string[];
  lookDetails?: string[];
}

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  if (i < 0) return undefined;
  const [, value] = args.splice(i, 2);
  return value;
};
const jsonOut = flag("--json");
const htmlOut = flag("--html");
const verbose = args.includes("--verbose");
const root = path.resolve(args.filter((arg) => !arg.startsWith("--"))[0] ?? path.join(import.meta.dirname, "../test/fixtures/beefree"));

function templates(dir: string): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return entry.name.startsWith("_") ? [] : templates(full);
      return entry.name.endsWith(".json") ? [full] : [];
    })
    .sort();
}

function exportOf(file: string): string | undefined {
  const base = path.basename(file, ".json");
  for (const candidate of [path.join(path.dirname(file), `${base}.html`), path.join(path.dirname(file), "exports", `${base}.html`)]) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return undefined;
}

/** Blocks the editor edits as what they are (not HTML), invisible dividers (space) aside, as migrate counts them. */
function blockCounts(design: Record<string, any>): { blocks: number; html: number } {
  const blocks = (design.body?.rows ?? []).flatMap((row: any) => (row.columns ?? []).flatMap((column: any) => column.contents ?? []));
  const counted = blocks.filter((block: any) => !(block.type === "divider" && /^0(px)?$/.test(String(block.values?.border?.borderTopWidth ?? "").trim())));
  return { blocks: counted.length, html: counted.filter((block: any) => block.type === "html").length };
}

const results: Result[] = [];
for (const file of templates(root)) {
  const rel = path.relative(root, file);
  const result: Result = { file: rel, status: "converted" };
  results.push(result);
  let converted;
  try {
    converted = beefreeToDesign(fs.readFileSync(file));
  } catch (error) {
    const message = (error as Error).message;
    result.status = error instanceof BeefreeFormatError && /^Not a (full )?Beefree template/.test(message) ? "not-a-template" : "error";
    result.error = message;
    continue;
  }
  const { design, warnings, fallbacks, version } = converted;
  Object.assign(result, { version, warnings: warnings.map((w) => w.message), warningReasons: warnings.map((w) => w.reason), fallbacks: fallbacks.length });
  const counts = blockCounts(design);
  Object.assign(result, { blocks: counts.blocks, htmlBlocks: counts.html, editable: counts.blocks ? (counts.blocks - counts.html) / counts.blocks : 1 });
  let rendered;
  try {
    rendered = render(design, "Template");
  } catch (error) {
    result.status = "error";
    result.error = `doesn't render: ${(error as Error).message}`;
    continue;
  }
  result.codegenWarnings = rendered.codegenWarnings;
  result.roundTrip = roundTripDifferences(design, rendered.back);
  if (htmlOut) {
    fs.mkdirSync(htmlOut, { recursive: true });
    fs.writeFileSync(path.join(htmlOut, `${rel.replace(/[\\/]/g, "__").replace(/\.json$/, "")}.unlayer.html`), rendered.html);
  }
  const original = exportOf(file);
  if (!original) {
    result.check = "unverified";
    continue;
  }
  const expected = applyDeclared(fs.readFileSync(original, "utf8"), beefreeDeclared(fs.readFileSync(file), design));
  result.declared = expected.applied.map((a) => `${a.declaration.kind} ×${a.count}: ${a.declaration.reason}`);
  const check = compareText(expected.html, rendered.html);
  result.check = lostContent(check) ? "fail" : "pass";
  result.lost = { missing: check.missing, added: check.added, missingAttributes: check.missingAttributes, addedAttributes: check.addedAttributes, phoneMissing: check.phone.missing, phoneAdded: check.phone.added };
  result.looks = check.styles.length + check.layout.length + check.unverified.length;
  if (result.check === "fail") result.causes = failureCauses(check, design);
  result.lookDetails = [
    ...check.styles.map((d: any) => `${d.property}: ${d.original} → ${d.converted}${d.page ? " (page)" : ` on ${JSON.stringify((d.words ?? []).slice(0, 6).join(" "))}`}`),
    ...check.layout.map((d: any) => `layout: ${JSON.stringify(d).slice(0, 200)}`),
    ...check.unverified.map((d: any) => `unverified: ${d.what} (${d.cause}) on ${JSON.stringify((d.words ?? []).slice(0, 6).join(" "))}`),
  ];
}

// Summary.
const converted = results.filter((r) => r.status === "converted");
const count = (list: Result[], test: (r: Result) => boolean) => list.filter(test).length;
const blocks = converted.reduce((n, r) => n + (r.blocks ?? 0), 0);
const htmlBlocks = converted.reduce((n, r) => n + (r.htmlBlocks ?? 0), 0);
const histogram = new Map<string, number>();
for (const r of converted) for (const reason of r.warningReasons ?? []) histogram.set(reason, (histogram.get(reason) ?? 0) + 1);
const codegenHistogram = new Map<string, number>();
for (const r of converted) for (const w of r.codegenWarnings ?? []) {
  const key = w.replace(/^(The body|Row \d+(, column \d+(, block \d+)?)?): /, "").replace(/`[^`]*`/g, "`…`").replace(/"[^"]*"/g, '"…"').replace(/\d+(\.\d+)?/g, "N");
  codegenHistogram.set(key, (codegenHistogram.get(key) ?? 0) + 1);
}

for (const r of results) {
  if (r.status !== "converted") {
    console.info(`${r.status === "error" ? "✗ ERROR" : "- skipped"} ${r.file}: ${r.error}`);
    continue;
  }
  const mark = r.check === "pass" ? "✓" : r.check === "fail" ? "✗" : "·";
  console.info(`${mark} ${r.file} (v${r.version}): ${Math.round((r.editable ?? 1) * 100)}% editable, ${r.fallbacks} fallback(s), ${r.warnings?.length} warning(s), ${r.roundTrip?.length} round-trip difference(s)${r.check === "unverified" ? ", no export to check" : r.looks ? `, ${r.looks} look difference(s)` : ""}`);
  if (r.causes?.length) console.info(`    why: ${r.causes.join("; ")}`);
  if (verbose && r.declared?.length) console.info(`    declared: ${r.declared.join("; ")}`);
  if (r.check === "fail" && r.lost && verbose) {
    const parts = Object.entries(r.lost).filter(([, list]) => list.length).map(([kind, list]) => `${kind}: ${list.slice(0, 8).map((w) => JSON.stringify(w)).join(", ")}${list.length > 8 ? ` (+${list.length - 8})` : ""}`);
    console.info(`    lost content: ${parts.join("; ")}`);
  }
  if (verbose) {
    for (const w of r.warnings ?? []) console.info(`    warning: ${w}`);
    for (const d of r.roundTrip ?? []) console.info(`    round trip: ${d}`);
    for (const d of r.lookDetails ?? []) console.info(`    looks: ${d}`);
    for (const w of r.codegenWarnings ?? []) console.info(`    codegen: ${w}`);
  }
}

console.info("\n== Summary ==");
console.info(`templates: ${results.length} files, ${converted.length} converted, ${count(results, (r) => r.status === "error")} errors, ${count(results, (r) => r.status === "not-a-template")} not templates (rows, configs, Simple Schema)`);
console.info(`check: ${count(converted, (r) => r.check === "pass")} ✓, ${count(converted, (r) => r.check === "fail")} ✗, ${count(converted, (r) => r.check === "unverified")} unverified (no export)`);
const failed = converted.filter((r) => r.check === "fail");
console.info(`  ✗ explained only by social icon alt text ("Facebook" → "Facebook icon") and menu hamburgers: ${count(failed, (r) => !r.causes?.some((c) => c.startsWith("other")))} (social alt text in ${count(failed, (r) => !!r.causes?.includes("social alt text"))}, menu hamburger in ${count(failed, (r) => !!r.causes?.includes("menu hamburger"))}); other content differences in ${count(failed, (r) => !!r.causes?.some((c) => c.startsWith("other")))}`);
console.info(`declared differences expected: in ${count(converted, (r) => !!r.declared?.length)} templates (${converted.reduce((n, r) => n + (r.declared?.length ?? 0), 0)} declarations applied)`);
console.info(`blocks: ${blocks}, kept as HTML: ${htmlBlocks} (fallbacks: ${converted.reduce((n, r) => n + (r.fallbacks ?? 0), 0)}), editable: ${blocks ? ((100 * (blocks - htmlBlocks)) / blocks).toFixed(1) : "100"}%`);
console.info(`round trip (design → code → renderToJson): ${count(converted, (r) => !r.roundTrip?.length)} of ${converted.length} templates exact, ${converted.reduce((n, r) => n + (r.roundTrip?.length ?? 0), 0)} differences`);
console.info(`codegen warnings: ${converted.reduce((n, r) => n + (r.codegenWarnings?.length ?? 0), 0)}`);
console.info("warnings by reason:");
for (const [reason, n] of [...histogram].sort((a, b) => b[1] - a[1])) console.info(`  ${String(n).padStart(5)}  ${reason}`);
if (codegenHistogram.size) {
  console.info("codegen warnings:");
  for (const [reason, n] of [...codegenHistogram].sort((a, b) => b[1] - a[1]).slice(0, 15)) console.info(`  ${String(n).padStart(5)}  ${reason}`);
}
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(results, null, 2));
