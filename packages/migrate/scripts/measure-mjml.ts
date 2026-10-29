/**
 * `pnpm --filter @unlayer/migrate measure:mjml [folder]`: runs the MJML converter and the migration check over every
 * `.mjml` file in a folder of samples (by default `import-samples/mjml` beside the repository, a local corpus that isn't
 * committed), as `npx @unlayer/migrate <folder> --from mjml` checks each one, and prints:
 *
 * - how many pass (✓: the same content), fail (✗: content differs) or can't be converted (error);
 * - how many blocks are kept as MJML's HTML, and how much is editable;
 * - how often each warning, kind of fallback and look difference comes up.
 *
 * `--verbose` lists each file's result. Nothing is written outside a temporary folder in this package.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { contentProblems, lookProblems, phoneWidths } from "../src/cli";
import { isMjmlDocument } from "../src/from-mjml";
import { convertMjml } from "../src/mjml";

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const verbose = args.includes("--verbose");
const given = args.find((a) => !a.startsWith("--"));

function samplesFolder(): string | undefined {
  if (given) return resolve(given);
  if (process.env.MJML_SAMPLES) return resolve(process.env.MJML_SAMPLES);
  for (let dir = here; dirname(dir) !== dir; dir = dirname(dir)) {
    const candidate = join(dir, "import-samples", "mjml");
    if (existsSync(candidate)) return candidate;
  }
  return undefined;
}

function mjmlFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name.startsWith("_")) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...mjmlFiles(path));
    else if (entry.name.endsWith(".mjml")) out.push(path);
  }
  return out.sort();
}

const folder = samplesFolder();
if (!folder || !statSync(folder, { throwIfNoEntry: false })?.isDirectory()) {
  console.error("No samples folder: pass one (measure:mjml <folder>), or set MJML_SAMPLES.");
  process.exit(1);
}

const scratch = join(here, "..", "test", ".tmp-measure");
mkdirSync(scratch, { recursive: true });
const io = { cwd: scratch, project: scratch };

const counts = { pass: 0, looks: 0, fail: 0, error: 0, partial: 0, mjml3: 0 };
let fallbacks = 0;
let blocks = 0;
let editableBlocks = 0;
const warnings = new Map<string, number>();
const kept = new Map<string, number>();
const looks = new Map<string, number>();
const failures = new Map<string, number>();
const add = (map: Map<string, number>, key: string, n = 1) => map.set(key, (map.get(key) ?? 0) + n);
const started = Date.now();

try {
  for (const file of mjmlFiles(folder)) {
    const name = relative(folder, file);
    const source = readFileSync(file, "utf8");
    if (/<mj-container\b/.test(source)) {
      counts.mjml3++;
      if (verbose) console.info(`- ${name}: MJML 3, refused`);
      continue;
    }
    if (!isMjmlDocument(source)) {
      counts.partial++;
      continue;
    }
    try {
      const result = await convertMjml(file, source, scratch, folder, io);
      const content = [...contentProblems(result.check), ...result.designWarnings.map((w) => `the editor wouldn't get: ${w}`)];
      const look = [...lookProblems(result.check), ...phoneWidths(result.referenceHtml)];
      const rows = (result.design.body as { rows: Array<{ columns: Array<{ contents: Array<{ type: string; values: { border?: { borderTopWidth?: string } } }> }> }> }).rows;
      const all = rows.flatMap((r) => r.columns.flatMap((c) => c.contents)).filter((b) => !(b.type === "divider" && /^0(px)?$/.test(String(b.values.border?.borderTopWidth ?? ""))));
      blocks += all.length;
      editableBlocks += all.filter((b) => b.type !== "html").length;
      fallbacks += result.conversion.fallbacks.length;
      for (const f of result.conversion.fallbacks) add(kept, f.reason);
      for (const w of result.conversion.warnings) add(warnings, w.reason);
      for (const l of look) add(looks, l.replace(/:.*$/s, ""));
      if (content.length) {
        counts.fail++;
        for (const c of content) add(failures, c.replace(/:.*$/s, ""));
      } else {
        counts.pass++;
        if (look.length) counts.looks++;
      }
      if (verbose) {
        const editable = all.length ? Math.round((all.filter((b) => b.type !== "html").length / all.length) * 100) : 100;
        const mark = content.length ? "✗" : "✓";
        console.info(`${mark} ${name}: ${editable}% editable, ${result.conversion.fallbacks.length} kept as HTML${content.length ? `\n    ${content.join("\n    ").slice(0, 600)}` : ""}${look.length ? `\n    looks: ${look.join("; ").slice(0, 300)}` : ""}`);
      }
    } catch (error) {
      counts.error++;
      add(failures, `error: ${(error as Error).message.split("\n")[0].slice(0, 100)}`);
      if (verbose) console.info(`! ${name}: ${(error as Error).message.split("\n")[0]}`);
    }
  }
} finally {
  rmSync(scratch, { recursive: true, force: true });
}

const templates = counts.pass + counts.fail + counts.error;
const histogram = (title: string, map: Map<string, number>) => {
  if (!map.size) return;
  console.info(`\n${title}:`);
  for (const [key, n] of [...map].sort((a, b) => b[1] - a[1])) console.info(`  ${String(n).padStart(4)}  ${key}`);
};
console.info(`\n${templates} templates in ${relative(process.cwd(), folder) || folder} (${counts.partial} partials and ${counts.mjml3} MJML 3 files not counted), ${Math.round((Date.now() - started) / 1000)}s`);
console.info(`  ✓ ${counts.pass} same content (${counts.looks} of them look different)`);
console.info(`  ✗ ${counts.fail} content differs`);
console.info(`  ! ${counts.error} couldn't be converted`);
console.info(`  ${fallbacks} blocks kept as MJML's HTML; ${blocks ? Math.round((editableBlocks / blocks) * 1000) / 10 : 100}% of ${blocks} blocks editable`);
histogram("Content differences (✗)", failures);
histogram("Kept as MJML's HTML", kept);
histogram("Warnings", warnings);
histogram("Looks different", looks);
