// Summarizes results/<stamp>.jsonl (or several) per kit: pass rate, and the median of each cost.
//   node lib/report.mjs results/a.jsonl [results/b.jsonl …]
import { readFile } from "node:fs/promises";

const rows = (await Promise.all(process.argv.slice(2).map((f) => readFile(f, "utf8"))))
  .flatMap((t) => t.split("\n").filter(Boolean).map((l) => JSON.parse(l)));
const median = (xs) => { const s = xs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b); if (!s.length) return NaN; const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const sum = (xs) => xs.reduce((a, b) => a + (b || 0), 0);
const total = (r) => r.inputTokens + r.cacheWriteTokens + r.cacheReadTokens + r.outputTokens;

const kits = [...new Set(rows.map((r) => r.kit))];
const table = kits.map((kit) => {
  const rs = rows.filter((r) => r.kit === kit);
  const ok = rs.filter((r) => r.pass);
  return {
    kit, runs: rs.length, passed: ok.length, passRate: ok.length / rs.length,
    firstCheckPass: rs.filter((r) => r.firstCheckPassed).length,
    medSeconds: median(rs.map((r) => r.wallMs / 1000)),
    medTurns: median(rs.map((r) => r.turns)),
    medCheckRuns: median(rs.map((r) => r.checkRuns)),
    medOutputTokens: median(rs.map((r) => r.outputTokens)),
    medTotalTokens: median(rs.map(total)),
    medCost: median(rs.map((r) => r.costUsd)),
    sumCost: sum(rs.map((r) => r.costUsd)),
    medSourceTokens: median(rs.map((r) => r.sourceTokens)),
  };
});
console.table(table.map((t) => ({ ...t, passRate: `${Math.round(t.passRate * 100)}%`, medSeconds: Math.round(t.medSeconds), medCost: t.medCost?.toFixed(3), sumCost: t.sumCost.toFixed(2) })));

// Per brief: median seconds per kit, to see where the difference comes from.
const briefs = [...new Set(rows.map((r) => r.brief))].sort();
console.log("\nMedian seconds (pass/runs) per brief:");
console.table(Object.fromEntries(briefs.map((b) => [b, Object.fromEntries(kits.map((k) => {
  const rs = rows.filter((r) => r.kit === k && r.brief === b);
  return [k, `${Math.round(median(rs.map((r) => r.wallMs / 1000)))}s (${rs.filter((r) => r.pass).length}/${rs.length})`];
}))])));

const fails = rows.filter((r) => !r.pass);
if (fails.length) {
  console.log("\nFailures:");
  for (const r of fails) console.log(`- ${r.kit} ${r.brief} #${r.rep}: ${r.failed.join(" | ").slice(0, 300)}`);
}
if (process.argv.includes("--json")) console.log(JSON.stringify(table));
