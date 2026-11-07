import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Rebuild the README chart from the same recorded runs as the website benchmark.
// Run from any directory: node scripts/generate-readme-benchmark.mjs
const source = new URL("../apps/website/benchmark/results/2026-11-06-sonnet.jsonl", import.meta.url);
const destination = new URL("../assets/hyper-elements-agent-benchmark.svg", import.meta.url);
const runs = readFileSync(source, "utf8").trim().split("\n").map((line) => JSON.parse(line));
const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
const groups = [
  ["he", "Hyper Elements"],
  ["html", "Hand-written HTML"],
  ["react-email", "React Email"],
].map(([kit, label]) => {
  const records = runs.filter((run) => run.kit === kit);
  if (records.length !== 16 || records.some((run) => !run.pass)) {
    throw new Error(`Review the chart's methodology labels for changed ${kit} results.`);
  }
  return {
    kit, label,
    seconds: median(records.map((run) => run.wallMs)) / 1000,
    tokens: median(records.map((run) => run.outputTokens)),
    firstPasses: records.filter((run) => run.firstCheckPassed).length,
  };
});

const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const text = (x, y, value, size = 24, fill = "#f0f3f6", extra = "") =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" ${extra}>${escape(value)}</text>`;
const metrics = [
  { title: "Time to a passing email", hint: "Median · lower is better", field: "seconds", max: 80,
    callout: `${(groups[2].seconds / groups[0].seconds).toFixed(1)}× faster`, basis: "than React Email",
    format: (value) => `${Math.round(value)} s`, end: "80 s" },
  { title: "Output tokens", hint: "Median · lower is better", field: "tokens", max: 6000,
    callout: `${(groups[2].tokens / groups[0].tokens).toFixed(1)}× fewer`, basis: "than React Email",
    format: (value) => Math.round(value).toLocaleString("en-US"), end: "6,000" },
  { title: "First-check passes", hint: "Out of 16 runs · higher is better", field: "firstPasses", max: 16,
    callout: `${groups[0].firstPasses} of 16`, basis: "Hyper Elements runs passed first time",
    format: (value) => `${value} / 16`, end: "16" },
];
const cards = metrics.map((metric, index) => {
  const x = 56 + index * 504;
  const left = x + 28;
  const right = x + 452;
  const rows = groups.map((group, row) => {
    const y = 427 + row * 100;
    const color = group.kit === "he" ? "#ef4638" : "#758091";
    const value = Math.round(group[metric.field]);
    const width = 424 * value / metric.max;
    return [
      text(left, y, group.label, 23, group.kit === "he" ? "#ffffff" : "#bec6d1", `font-weight="${group.kit === "he" ? 600 : 400}"`),
      text(right, y, metric.format(value), 23, "#f0f3f6", 'text-anchor="end" font-weight="600"'),
      `<rect x="${left}" y="${y + 19}" width="424" height="18" rx="5" fill="#222a35"/>`,
      `<rect x="${left}" y="${y + 19}" width="${width.toFixed(2)}" height="18" rx="5" fill="${color}"/>`,
    ].join("\n");
  }).join("\n");
  return [
    `<rect x="${x}" y="202" width="480" height="550" rx="20" fill="#141b24" stroke="#303945"/>`,
    text(left, 246, metric.title, 26, "#f0f3f6", 'font-weight="600"'),
    text(left, 279, metric.hint, 21, "#a6b0bf"),
    text(left, 342, metric.callout, 48, "#ff776a", 'font-weight="700" letter-spacing="-1.5"'),
    text(left, 374, metric.basis, 21, "#a6b0bf"),
    rows,
    `<path d="M${left} 692H${right}" stroke="#3d4755"/>`,
    text(left, 720, "0", 18, "#8d99aa"),
    text(right, 720, metric.end, 18, "#8d99aa", 'text-anchor="end"'),
  ].join("\n");
}).join("\n");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" role="img" aria-labelledby="title description">
<title id="title">Hyper Elements agent benchmark</title>
<desc id="description">Five email briefs, 16 runs per approach. Median time to a passing email: Hyper Elements 35 seconds, hand-written HTML 65 seconds, React Email 76 seconds. Median output tokens: 2,346, 5,676, and 5,745 respectively. First-check passes: 11 of 16, 4 of 16, and 5 of 16. All 48 runs eventually passed. Measured with Claude Code and Claude Sonnet 5 on November 6, 2026.</desc>
<rect width="1600" height="900" rx="24" fill="#0d1117"/>
<g font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif">
${text(56, 65, "AGENT BENCHMARK", 20, "#ff776a", 'font-weight="600" letter-spacing="3"')}
${text(56, 127, "Faster to a passing email.", 50, "#f0f3f6", 'font-weight="700" letter-spacing="-1"')}
${text(56, 167, "Same five briefs. Same checks. 16 runs per approach.", 25, "#a6b0bf")}
${cards}
<path d="M56 789H1544" stroke="#303945"/>
${text(56, 827, "Claude Code · Claude Sonnet 5 · Hyper Elements 0.3 (pre-release) · November 6, 2026", 21, "#a6b0bf")}
${text(56, 862, "Desktop and mobile checks in Chromium. All 48 runs eventually passed. Output tokens exclude input and cached context.", 20, "#8d99aa")}
</g>
</svg>
`;
writeFileSync(destination, svg);
console.log(`Wrote ${fileURLToPath(destination)}`);
console.log(JSON.stringify(groups, null, 2));
