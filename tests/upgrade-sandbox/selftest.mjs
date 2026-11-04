#!/usr/bin/env node
// Proof the harness fails when it should. Copies NEW's package to a scratch .new/mutant (never packages/react),
// breaks it four ways in what its renderToHtml() returns, runs the whole corpus against it, and checks the report
// names exactly:
//   - demo-welcome, email: the word "signing" is gone from "Thanks for signing up." (text);
//   - demo-welcome, email: its button's link goes elsewhere and opens in the same tab (the link, and its words);
//   - demo-password-reset, email: "This link expires in 60 minutes." turns from #a1a1aa to #b91c1c (text style);
//   - demo-password-reset, email: its button turns from #18181b to #1d4ed8 (paint only);
// at every width, and nothing else but the differences expected.json declares, where it declares them and of the
// kinds their reasons accept (those are allowed, never needed). Then removes the scratch copy. Its report is kept in .selftest/.
//
//   node selftest.mjs
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { SANDBOX, REPO, newPackage } from "./harness/packages.mjs";
import { accepts, readExpected } from "./harness/expected.mjs";

const mutant = path.join(SANDBOX, ".new/mutant");
const fresh = newPackage({ worktree: REPO, log: console.log });
fs.rmSync(mutant, { recursive: true, force: true });
fs.cpSync(fresh.dir, mutant, { recursive: true });
// The package's own module becomes index.real.js; dist/index.js passes on everything it exports but renderToHtml(),
// which it breaks after the fact, so the planted changes land whichever writer drew the HTML.
const index = path.join(mutant, "dist/index.js");
fs.renameSync(index, path.join(mutant, "dist/index.real.js"));
fs.writeFileSync(
  index,
  `export * from "./index.real.js";
import { renderToHtml as real } from "./index.real.js";
export function renderToHtml(...args) {
  let html = real(...args);
  if (html.includes("Thanks for signing up.")) html = html.replace('<a href="" target="_blank" class="v-button', '<a href="https://example.test/changed" target="_self" class="v-button');
  html = html.replace("Thanks for signing up.", "Thanks for up.");
  html = html.replace(/(color: ?)#a1a1aa(;[^>]*>\\s*This link expires in 60 minutes)/, "$1#b91c1c$2");
  if (html.includes("This link expires in 60 minutes")) html = html.replace("background-color: #18181b; border-radius: 8px", "background-color: #1d4ed8; border-radius: 8px");
  return html;
}
`
);

const out = path.join(SANDBOX, ".selftest");
// Nothing declared expected: the planted differences must be reported as differences wherever they land.
const run = spawnSync(process.execPath, ["run.mjs", "--new-dir", mutant, "--out-dir", out, "--expected", "none", ...process.argv.slice(2)], { cwd: SANDBOX, stdio: "inherit" });
fs.rmSync(mutant, { recursive: true, force: true }); // the change is removed

const report = JSON.parse(fs.readFileSync(path.join(out, "report.json"), "utf8"));
// The differences a release means to make (expected.json): at the template, mode and width declared, of the kinds its
// reason accepts.
const declared = readExpected(path.join(SANDBOX, "expected.json"));
const allowedHere = new Set();
const found = [];
for (const t of report.templates) {
  if (t.problems.length || t.json?.status === "diff") found.push(`${t.id}: ${[...t.problems, ...(t.json?.diffs ?? [])].join("; ")}`);
  for (const [mode, m] of Object.entries(t.modes)) {
    if (m.text?.status === "diff") found.push(`${t.id} ${mode} plain text: ${m.text.diffs.join("; ")}`);
    for (const [w, x] of Object.entries(m.widths)) {
      const reason = declared.find((e) => e.id === t.id && e.mode === mode && e.width === Number(w))?.reason;
      for (const d of x.differences) {
        found.push(`${t.id} ${mode} ${w}: ${d.line}`);
        if (reason && accepts(reason, d)) allowedHere.add(`${t.id} ${mode} ${w}: ${d.line}`);
      }
    }
  }
}
console.log(`\nselftest: the report found ${found.length} difference line(s):`);
for (const f of found) console.log(`  ${f}`);
const widths = report.options.widths;
const expected = [
  ...widths.map((w) => (line) => line.startsWith(`demo-welcome email ${w}: text: "signing" is gone`)),
  ...widths.map((w) => (line) => line.startsWith(`demo-welcome email ${w}: link: "" [_blank] on "Go to Dashboard" → "https://example.test/changed" [_self] on "Go to Dashboard"`)),
  ...widths.map((w) => (line) => line.startsWith(`demo-welcome email ${w}: link: 3 word(s) go to "https://example.test/changed" [_self] in place of "" [_blank], first "Go"`)),
  ...widths.map((w) => (line) => line.startsWith(`demo-password-reset email ${w}: style: color: rgb(161, 161, 170) → rgb(185, 28, 28) on 6 word(s), first "This"`)),
  ...widths.map((w) => (line) => line.startsWith(`demo-password-reset email ${w}: paint: `)),
];
const allowed = (line) =>
  expected.some((e) => e(line)) ||
  // Removing a word moves the words after it on its line (and maybe the line below).
  /^demo-welcome email \d+: (position|page height|paint)/.test(line) ||
  allowedHere.has(line);
const missing = expected.filter((e) => !found.some(e));
const unexpected = found.filter((line) => !allowed(line));
const ok = run.status === 1 && !missing.length && !unexpected.length;
console.log(`selftest: run.mjs exited ${run.status} (want 1); ${expected.length - missing.length}/${expected.length} expected differences found; ${unexpected.length} unexpected`);
for (const u of unexpected) console.log(`  unexpected: ${u}`);
console.log(ok ? "SELFTEST PASS: the harness reports exactly the planted differences" : "SELFTEST FAIL");
process.exit(ok ? 0 : 1);
