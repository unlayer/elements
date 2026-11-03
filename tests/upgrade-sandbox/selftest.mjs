#!/usr/bin/env node
// Proof the harness fails when it should. Copies NEW's package to a scratch .new/mutant (never packages/react),
// breaks it four ways in its dist/index.js, runs the whole corpus against it, and checks the report names exactly:
//   - demo-welcome, email: the word "signing" is gone from "Thanks for signing up." (text);
//   - demo-welcome, email: its button's link goes elsewhere and opens in the same tab (link);
//   - demo-password-reset, email: "This link expires in 60 minutes." turns from #a1a1aa to #b91c1c (text style);
//   - demo-password-reset, email: its button turns from #18181b to #1d4ed8 (paint only);
// at every width, and nothing else. Then removes the scratch copy. Its report is kept in .selftest/.
//
//   node selftest.mjs
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { SANDBOX, REPO, newPackage } from "./harness/packages.mjs";

const mutant = path.join(SANDBOX, ".new/mutant");
const fresh = newPackage({ worktree: REPO, log: console.log });
fs.rmSync(mutant, { recursive: true, force: true });
fs.cpSync(fresh.dir, mutant, { recursive: true });
const index = path.join(mutant, "dist/index.js");
const source = fs.readFileSync(index, "utf8");
const anchor = "const body = isUnlayerWrapper ? stripOuterDiv(rawBody) : rawBody;";
if (!source.includes(anchor)) throw new Error("selftest: can't find where renderToHtml makes the body in NEW's dist/index.js");
fs.writeFileSync(
  index,
  source.replace(
    anchor,
    `let body = isUnlayerWrapper ? stripOuterDiv(rawBody) : rawBody;
  if (body.includes("Thanks for signing up.")) body = body.replace('<a href="" target="_blank" class="v-button', '<a href="https://example.test/changed" target="_self" class="v-button');
  body = body.replace("Thanks for signing up.", "Thanks for up.");
  body = body.replace(/color: #a1a1aa;([^>]*>\\s*This link expires in 60 minutes)/, "color: #b91c1c;$1");
  if (body.includes("This link expires in 60 minutes")) body = body.replace("background-color: #18181b; border-radius: 8px", "background-color: #1d4ed8; border-radius: 8px");`
  )
);

const out = path.join(SANDBOX, ".selftest");
// Nothing declared expected: the planted differences must be reported as differences wherever they land.
const run = spawnSync(process.execPath, ["run.mjs", "--new-dir", mutant, "--out-dir", out, "--expected", "none", ...process.argv.slice(2)], { cwd: SANDBOX, stdio: "inherit" });
fs.rmSync(mutant, { recursive: true, force: true }); // the change is removed

const report = JSON.parse(fs.readFileSync(path.join(out, "report.json"), "utf8"));
const found = [];
for (const t of report.templates) {
  if (t.problems.length || t.json?.status === "diff") found.push(`${t.id}: ${[...t.problems, ...(t.json?.diffs ?? [])].join("; ")}`);
  for (const [mode, m] of Object.entries(t.modes)) {
    if (m.text?.status === "diff") found.push(`${t.id} ${mode} plain text: ${m.text.diffs.join("; ")}`);
    for (const [w, x] of Object.entries(m.widths)) for (const d of x.differences) found.push(`${t.id} ${mode} ${w}: ${d.line}`);
  }
}
console.log(`\nselftest: the report found ${found.length} difference line(s):`);
for (const f of found) console.log(`  ${f}`);
const widths = report.options.widths;
const expected = [
  ...widths.map((w) => (line) => line.startsWith(`demo-welcome email ${w}: text: "signing" is gone`)),
  ...widths.map((w) => (line) => line.startsWith(`demo-welcome email ${w}: link: "" [_blank] on "Go to Dashboard" → "https://example.test/changed" [_self] on "Go to Dashboard"`)),
  ...widths.map((w) => (line) => line.startsWith(`demo-password-reset email ${w}: style: color: rgb(161, 161, 170) → rgb(185, 28, 28) on 6 word(s), first "This"`)),
  ...widths.map((w) => (line) => line.startsWith(`demo-password-reset email ${w}: paint: `)),
];
const allowed = (line) =>
  expected.some((e) => e(line)) ||
  // Removing a word moves the words after it on its line (and maybe the line below).
  /^demo-welcome email \d+: (position|page height|paint)/.test(line);
const missing = expected.filter((e) => !found.some(e));
const unexpected = found.filter((line) => !allowed(line));
const ok = run.status === 1 && !missing.length && !unexpected.length;
console.log(`selftest: run.mjs exited ${run.status} (want 1); ${expected.length - missing.length}/${expected.length} expected differences found; ${unexpected.length} unexpected`);
for (const u of unexpected) console.log(`  unexpected: ${u}`);
console.log(ok ? "SELFTEST PASS: the harness reports exactly the planted differences" : "SELFTEST FAIL");
process.exit(ok ? 0 : 1);
