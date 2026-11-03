// report.json and report.md.
import fs from "node:fs";
import path from "node:path";

const FIRST = 5;

export function writeReports({ sandbox, options, OLD, NEW, chromium, templates, skipped, moduleErrors, phases, durationMs, expectations = { file: null, matched: [], stale: [] } }) {
  const widths = options.widths;
  // One row per template and mode; a template that never got to a mode is one row of its own.
  const rows = [];
  for (const t of templates) {
    const modes = Object.entries(t.modes);
    if (!modes.length) rows.push({ t, mode: null, m: null });
    for (const [mode, m] of modes) rows.push({ t, mode, m });
  }
  const rowDiffers = ({ t, m }) =>
    t.problems.length > 0 || t.json?.status === "diff" || (m && (m.problems.length > 0 || m.text?.status === "diff" || m.html?.status === "diff" || Object.values(m.widths).some((w) => w.status === "diff")));
  const differing = rows.filter(rowDiffers);

  const count = (pred) => rows.filter(pred).length;
  const totals = {
    rows: rows.length,
    differing: differing.length,
    json: tally(templates.map((t) => t.json?.status ?? "n/a")),
    text: tally(rows.map((r) => r.m?.text?.status ?? "n/a")),
    htmlBytes: tally(rows.map((r) => r.m?.html?.status ?? "n/a")),
    widths: Object.fromEntries(widths.map((w) => [w, tally(rows.map((r) => r.m?.widths[w]?.status ?? "n/a"))])),
  };
  const bySource = {};
  for (const t of templates) {
    const s = (bySource[t.source] ??= { templates: 0, email: 0, web: 0, document: 0 });
    s.templates++;
    for (const mode of Object.keys(t.modes)) s[mode]++;
  }

  const report = {
    question: "If a project using today's components upgrades @unlayer/react-elements from 0.2.1 to this build, what changes for a reader?",
    date: new Date().toISOString(),
    durationMs,
    phases,
    old: OLD,
    new: NEW,
    chromium,
    options,
    result: differing.length ? "differences" : "no differences",
    totals,
    expected: expectations,
    corpus: bySource,
    skipped,
    moduleErrors,
    templates,
  };
  fs.writeFileSync(path.join(sandbox, "report.json"), JSON.stringify(report, null, 1));

  const cell = (s, n) => (s === "diff" ? `**DIFF${n ? ` (${n})` : ""}**` : s === "expected" ? `expected${n ? ` (${n})` : ""}` : s === "n/a" || s == null ? "—" : s);
  const md = [];
  const { matched, stale } = expectations;
  const declared = matched.length ? `; ${matched.length} expected difference${matched.length === 1 ? "" : "s"} (declared in ${path.basename(expectations.file)})` : "";
  const staleNote = stale.length ? `; ${stale.length} stale expectation${stale.length === 1 ? "" : "s"} (no longer differ${stale.length === 1 ? "s" : ""}: remove from ${path.basename(expectations.file)})` : "";
  const line =
    (differing.length
      ? `${differing.length} of ${rows.length} template/modes differ beyond tolerance`
      : matched.length
        ? `No unexpected differences: ${rows.length} template/modes draw the same in Chromium at ${widths.join(", ")} px, with the same plain text and JSON, except where declared`
        : `No differences: ${rows.length} template/modes draw the same in Chromium at ${widths.join(", ")} px, with the same plain text and JSON`) +
    declared +
    staleNote;
  md.push(`# Elements upgrade check: ${OLD.version} → ${NEW.version}`, "");
  md.push(`**${line}.**`, "");
  md.push("| | |", "|---|---|");
  md.push(`| OLD | \`${OLD.name}@${OLD.version}\` (${OLD.how}); dist/index.js sha256 \`${OLD.indexSha}\` |`);
  md.push(`| NEW | \`${NEW.name}@${NEW.version}\` (${NEW.how}); dist/index.js sha256 \`${NEW.indexSha}\`${NEW.indexSha === OLD.indexSha ? " (identical to OLD's)" : ""} |`);
  md.push(`| Chromium | ${chromium}; widths ${widths.join(", ")} px (375 is the phone); network blocked, images local placeholders |`);
  md.push(`| Tolerance | ${options.tolerance} px for boxes and page height; ${options.paintTolerance} pixels painted differently outside text |`);
  md.push(`| Filters | modes ${options.modes.join(", ")}${options.only ? `; only ids containing \`${options.only}\`` : ""} |`);
  md.push(`| Expected | ${expectations.file ? `\`${path.basename(expectations.file)}\`: ${matched.length} matched, ${stale.length} stale` : "none declared"} |`);
  md.push(`| Run | ${report.date}; ${(durationMs / 1000).toFixed(1)} s (${Object.entries(phases).map(([k, v]) => `${k.split(" (")[0]} ${(v / 1000).toFixed(1)} s`).join(", ")}) |`, "");

  md.push("## Corpus", "", "| Source | Templates | email | web | document |", "|---|---:|---:|---:|---:|");
  for (const [source, s] of Object.entries(bySource)) md.push(`| ${source} | ${s.templates} | ${s.email} | ${s.web} | ${s.document} |`);
  md.push(`| **total** | **${templates.length}** | ${sum(bySource, "email")} | ${sum(bySource, "web")} | ${sum(bySource, "document")} |`, "");

  md.push("## Totals", "", "| Check | pass | diff | other |", "|---|---:|---:|---|");
  const totalRow = (name, t) => md.push(`| ${name} | ${t.pass ?? 0} | ${t.diff ?? 0} | ${Object.entries(t).filter(([k]) => k !== "pass" && k !== "diff").map(([k, v]) => `${k} ${v}`).join(", ")} |`);
  totalRow("renderToJson (per template)", totals.json);
  totalRow("renderToPlainText, exact", totals.text);
  for (const w of widths) totalRow(`Chromium at ${w} px`, totals.widths[w]);
  md.push(`| HTML bytes (information only) | identical ${totals.htmlBytes.identical ?? 0} | changed ${totals.htmlBytes.changed ?? 0} | ${Object.entries(totals.htmlBytes).filter(([k]) => !["identical", "changed"].includes(k)).map(([k, v]) => `${k} ${v}`).join(", ")} |`, "");

  md.push("## Per template", "", `| Template | Mode | JSON | Text | HTML bytes | ${widths.map((w) => `${w}`).join(" | ")} |`, `|---|---|---|---|---|${widths.map(() => "---").join("|")}|`);
  for (const r of rows) {
    const { t, mode, m } = r;
    const html = m?.html ? (m.html.status === "identical" || m.html.status === "changed" ? `${m.html.status}` : cell(m.html.status)) : "—";
    const w = widths.map((w) => {
      const x = m?.widths[w];
      return x ? cell(x.status, x.differences.length) : "—";
    });
    const problems = t.problems.length || m?.problems.length ? " **(see below)**" : "";
    md.push(`| \`${t.id}\`${problems} | ${mode ?? "—"} | ${cell(t.json?.status, t.json?.diffs?.length)} | ${cell(m?.text?.status, m?.text?.diffs?.length)} | ${html} | ${w.join(" | ")} |`);
  }
  md.push("");

  md.push("## Differences", "");
  if (!differing.length) md.push("None.", "");
  const jsonShown = new Set();
  for (const { t, mode, m } of differing) {
    md.push(`### \`${t.id}\`${mode ? ` · ${mode}` : ""}`, "");
    md.push(`From \`${t.module}\`${t.wrapped ? `, wrapped in ${t.wrapped}` : ""}.`, "");
    for (const p of t.problems) md.push(`- ${p}`);
    if (t.json?.status === "diff" && !jsonShown.has(t.id)) {
      jsonShown.add(t.id);
      md.push(`- **renderToJson** (${t.json.diffs.length}${t.json.diffs.length >= 50 ? "+" : ""} differences): ${t.json.diffs.slice(0, FIRST).map((d) => `\`${d}\``).join("; ")}`);
    }
    if (m) {
      for (const p of m.problems) md.push(`- ${p}`);
      if (m.text?.status === "diff") md.push(`- **renderToPlainText**: ${m.text.diffs.slice(0, FIRST).map((d) => `\`${d}\``).join("; ")} (out/${t.id}/old.${mode}.txt, new.${mode}.txt)`);
      if (m.html?.status === "diff") md.push(`- **renderToHtml**: ${m.html.diffs.join("; ")}`);
      for (const w of widths) {
        const x = m.widths[w];
        if (!x || x.status !== "diff") continue;
        md.push(`- **${w} px** (${x.differences.length} difference${x.differences.length === 1 ? "" : "s"}; [side by side](out/${t.id}/${mode}-${w}.png), [OLD](out/${t.id}/old.${mode}.html), [NEW](out/${t.id}/new.${mode}.html)):`);
        for (const d of x.differences.slice(0, FIRST)) md.push(`  - ${d.line}`);
        if (x.differences.length > FIRST) md.push(`  - … and ${x.differences.length - FIRST} more (report.json)`);
      }
    }
    md.push("");
  }

  md.push("## Expected differences", "");
  if (!matched.length) md.push(expectations.file ? "None matched." : "None declared.", "");
  for (const t of templates) {
    for (const [mode, m] of Object.entries(t.modes)) {
      for (const w of widths) {
        const x = m.widths[w];
        if (!x || x.status !== "expected") continue;
        md.push(`- \`${t.id}\` · ${mode} · **${w} px**: expected (${x.reason})`);
        md.push(`  - ${x.differences.length} difference${x.differences.length === 1 ? "" : "s"}; [side by side](out/${t.id}/${mode}-${w}.png), [OLD](out/${t.id}/old.${mode}.html), [NEW](out/${t.id}/new.${mode}.html)`);
        for (const d of x.differences.slice(0, FIRST)) md.push(`  - ${d.line}`);
        if (x.differences.length > FIRST) md.push(`  - … and ${x.differences.length - FIRST} more (report.json)`);
      }
    }
  }
  if (matched.length) md.push("");
  if (stale.length) {
    md.push("## Stale expectations", "", `Declared in \`${path.basename(expectations.file)}\` but no longer different; remove them:`, "");
    for (const s of stale) md.push(`- \`${s.id}\` · ${s.mode} · ${s.width} px (${s.reason})`);
    md.push("");
  }

  md.push("## Skipped", "");
  if (!skipped.length) md.push("Nothing: every story and template was made standalone.", "");
  for (const s of skipped) md.push(`- \`${s.id}\`: ${s.reason}`);
  if (skipped.length) md.push("");
  const loadErrors = [...moduleErrors.old.map((e) => ({ ...e, side: "OLD" })), ...moduleErrors.new.map((e) => ({ ...e, side: "NEW" }))];
  if (loadErrors.length) {
    md.push("## Modules that failed to load", "");
    for (const e of loadErrors) md.push(`- ${e.side} \`${e.module}\`: ${e.error}`);
    md.push("");
  }

  const notes = [];
  for (const t of templates) {
    if (t.note) notes.push(`\`${t.id}\`: ${t.note}`);
    if (t.json?.status === "same error") notes.push(`\`${t.id}\`: renderToJson fails the same on both sides: ${t.json.error}`);
    for (const [mode, m] of Object.entries(t.modes)) {
      if (m.text?.status === "same error") notes.push(`\`${t.id}\` ${mode}: renderToPlainText fails the same on both sides: ${m.text.error}`);
      if (m.html?.status === "same error") notes.push(`\`${t.id}\` ${mode}: renderToHtml fails the same on both sides: ${m.html.error}`);
      if (m.warnings) notes.push(`\`${t.id}\` ${mode}: warnings changed: ${JSON.stringify(m.warnings.old)} → ${JSON.stringify(m.warnings.new)}`);
    }
  }
  if (notes.length) {
    md.push("## Notes (not counted as differences)", "");
    for (const n of notes) md.push(`- ${n}`);
    md.push("");
  }
  fs.writeFileSync(path.join(sandbox, "report.md"), md.join("\n"));
  return { line, differing: differing.length, expected: matched.length, stale: stale.length };
}

function tally(values) {
  const out = {};
  for (const v of values) out[v] = (out[v] ?? 0) + 1;
  return out;
}
const sum = (o, k) => Object.values(o).reduce((n, s) => n + s[k], 0);
