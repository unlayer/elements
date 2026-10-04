/**
 * Aggregate .bench-out/results.json into the numbers for FIDELITY.md.
 *
 *   tsx bench/summary.ts [looksThreshold=0.03]
 */

import fs from "node:fs";
import path from "node:path";

const out = path.resolve(import.meta.dirname, "../.bench-out");
const results: any[] = JSON.parse(fs.readFileSync(path.join(out, "results.json"), "utf8"));
const threshold = Number(process.argv[2] ?? 0.03);

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : NaN;
};
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

function stats(rows: any[]) {
  const ok = rows.filter((r) => r.converted && r.layout);
  // On phones, originals wider than the window (fixed-width tables) aren't comparable.
  const fits = ok.filter((r) => !r.layout[375].overflows);
  const moved = (r: any, width: number) => r.layout[width].moved;
  return {
    templates: rows.length,
    converts: rows.filter((r) => r.converted).length,
    typechecks: rows.filter((r) => r.typechecks).length,
    lost: ok.filter((r) => r.missingText?.length || r.missingAttributes?.length).length,
    variants: ok.filter((r) => r.variants?.length).length,
    editor: ok.filter((r) => r.jsonWarnings).length,
    nativeAvg: avg(ok.map((r) => r.nativeRatio)),
    fullyNative: ok.filter((r) => r.nativeRatio === 1).length,
    moved700Median: median(ok.map((r) => moved(r, 700))),
    moved700Mean: avg(ok.map((r) => moved(r, 700))),
    moved700Over25: ok.filter((r) => moved(r, 700) > 0.25).length,
    fits: fits.length,
    moved375Median: median(fits.map((r) => moved(r, 375))),
    moved375Over25: fits.filter((r) => moved(r, 375) > 0.25).length,
    looks700Median: median(ok.map((r) => r.looks[700])),
    looksSame700: ok.filter((r) => r.looks[700] <= threshold).length,
  };
}

console.log(`# Benchmark summary (looks-the-same threshold ${pct(threshold)} at 700px)\n`);
console.log("| Mode | Group | Templates | Converts | Type-checks | Lost content | Flipped-prop problems | Editor skips | Native avg | Fully native | Words moved 700 (median / mean / >25%) | Words moved 375 (median / >25%, of originals that fit) | Looks the same @700 |");
console.log("|---|---|---|---|---|---|---|---|---|---|---|---|---|");
for (const mode of ["codemod", "runtime"]) {
  for (const group of ["all", "official", "community", "agent"]) {
    const rows = results.filter((r) => r.mode === mode && (group === "all" || r.group === group));
    if (!rows.length) continue;
    const s = stats(rows);
    console.log(
      `| ${mode} | ${group} | ${s.templates} | ${s.converts} | ${s.typechecks} | ${s.lost} | ${s.variants} | ${s.editor} | ${pct(s.nativeAvg)} | ${s.fullyNative} | ${pct(s.moved700Median)} / ${pct(s.moved700Mean)} / ${s.moved700Over25} | ${pct(s.moved375Median)} / ${s.moved375Over25} (of ${s.fits}) | ${s.looksSame700} |`
    );
  }
}

for (const mode of ["codemod", "runtime"]) {
  const rows = results.filter((r) => r.mode === mode);
  const causes = new Map<string, { blocks: number; templates: Set<string> }>();
  const add = (key: string, template: string) => {
    const entry = causes.get(key) ?? { blocks: 0, templates: new Set() };
    entry.blocks += 1;
    entry.templates.add(template);
    causes.set(key, entry);
  };
  for (const r of rows) {
    for (const f of r.fallbacks ?? []) add(`fallback: ${f.reason}${f.detail ? ` (${String(f.detail).split(/[\s:]/)[0]})` : ""}`, r.template);
    for (const n of r.notes ?? []) add(`note: ${n.reason}`, r.template);
  }
  console.log(`\n## ${mode}: causes ranked by templates affected\n`);
  for (const [key, v] of [...causes].sort((a, b) => b[1].templates.size - a[1].templates.size).slice(0, 18)) {
    console.log(`- ${key}: ${v.templates.size} templates, ${v.blocks} occurrences`);
  }
  const classes = new Map<string, number>();
  for (const r of rows) for (const n of r.notes ?? []) if (n.reason === "tailwind class not inlined") classes.set(n.detail, (classes.get(n.detail) ?? 0) + 1);
  if (classes.size) {
    console.log(`\nTailwind classes not inlined (top): ${[...classes].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([c, n]) => `${c} ×${n}`).join(", ")}`);
  }
  const errors = rows.filter((r) => !r.converted || r.error);
  if (errors.length) console.log(`\nErrors: ${errors.map((r) => `${r.template}: ${r.error}`).join("; ")}`);
}
