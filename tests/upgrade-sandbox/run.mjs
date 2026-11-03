#!/usr/bin/env node
// Elements upgrade sandbox: if a project using today's components upgrades @unlayer/react-elements from the
// published 0.2.1 (OLD) to this repository's build (NEW), what changes for a reader of its emails and pages?
//
//   node run.mjs [--pack] [--only <substring>] [--modes email,web,document] [--widths 375,600,800]
//                [--tolerance 1] [--paint-tolerance 8] [--jobs N] [--new-dir <dir>] [--worktree <path>]
//
//   --pack             NEW is the real `pnpm pack` tarball of packages/react, npm-installed as `new-elements`
//                      (default: a copy of packages/react's package.json and dist in .new/fast)
//   --worktree <path>  the checkout whose packages/react is NEW (default: the one this sandbox is in); build its
//                      packages first (`pnpm build` at its root)
//   --new-dir <dir>    NEW is this directory (a package.json and dist), e.g. a scratch copy to break on purpose
//   --only <text>      only templates whose id contains <text>
//   --modes            modes to compare (a template is rendered in the modes it's meant for, within these)
//   --widths           window widths in px (375 is the phone)
//   --tolerance        px a word, an image or the page may move or resize (default 1)
//   --paint-tolerance  pixels outside text that may be painted differently (default 8)
//   --jobs             pages compared in parallel (default: half the CPUs, 2 to 8)
//   --out-dir <dir>    where report.md, report.json and out/ go (default: here)
//   --expected <file>  differences declared on purpose (default: expected.json here; `none` declares nothing)
//
// Writes report.md and report.json here, and for each difference out/<template>/ with OLD's and NEW's HTML and a
// side-by-side screenshot per width. Exits 1 if anything differs beyond tolerance that isn't declared expected, 2 if
// the harness fails.
//
// expected.json declares differences a release means to make, keyed by template, mode and width, each with a reason:
//   { "reasons": { "<name>": "<why>" }, "expected": { "<template>": { "<mode>": { "<width>": "<name or why>" } } } }
// A difference at a declared template, mode and width is reported as "expected (reason)" and still listed in
// report.md; one the run compared that no longer differs is flagged stale, to be removed from the file.
// The corpus is in corpus/ (refresh it from the repository with `node corpus/sync.mjs`).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import { SANDBOX, REPO, oldPackage, newPackage, bundle } from "./harness/packages.mjs";
import { openBrowser } from "./harness/browser.mjs";
import { jsonDiff, textDiff } from "./harness/diff.mjs";
import { writeReports } from "./harness/report.mjs";

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.includes("-h")) {
  const lines = fs.readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(1);
  console.log(lines.slice(0, lines.findIndex((l) => !l.startsWith("//"))).map((l) => l.replace(/^\/\/ ?/, "")).join("\n"));
  process.exit(0);
}
const opt = (name, fallback) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : fallback);
const list = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);
const options = {
  pack: argv.includes("--pack"),
  newDir: opt("--new-dir"),
  only: opt("--only", ""),
  modes: list(opt("--modes", "email,web,document")),
  widths: list(opt("--widths", "375,600,800")).map(Number),
  tolerance: Number(opt("--tolerance", 1)),
  paintTolerance: Number(opt("--paint-tolerance", 8)),
  jobs: Number(opt("--jobs", Math.max(2, Math.min(8, Math.floor(os.cpus().length / 2))))),
  worktree: path.resolve(opt("--worktree", REPO)),
  outDir: path.resolve(opt("--out-dir", SANDBOX)),
  expected: opt("--expected", path.join(SANDBOX, "expected.json")),
};

const started = Date.now();
const phases = {};
const phase = async (name, fn) => {
  const t = Date.now();
  process.stdout.write(`${name}…\n`);
  try {
    return await fn();
  } finally {
    phases[name] = Date.now() - t;
  }
};
const log = (s) => console.log(s);

try {
  const { OLD, NEW } = await phase("prepare packages", async () => {
    const OLD = oldPackage();
    const NEW = newPackage({ worktree: options.worktree, pack: options.pack, dir: options.newDir, log });
    log(`  OLD ${OLD.name}@${OLD.version} (${OLD.how}), dist/index.js ${OLD.indexSha}`);
    log(`  NEW ${NEW.name}@${NEW.version} (${NEW.how}), dist/index.js ${NEW.indexSha}`);
    return { OLD, NEW };
  });
  const bundles = await phase("bundle", () => Promise.all([bundle("old", OLD), bundle("new", NEW)]));
  await phase("render", () =>
    Promise.all(
      [
        ["old", OLD, bundles[0]],
        ["new", NEW, bundles[1]],
      ].map(([side, pkg, js]) => run(process.execPath, [js, "--side", side, "--out", path.join(SANDBOX, ".work", side), "--only", options.only, "--modes", options.modes.join(",")], { NODE_ENV: "production", SANDBOX_PKG_JSON: pkg.packageJson }))
    )
  );
  const manifests = Object.fromEntries(["old", "new"].map((side) => [side, JSON.parse(fs.readFileSync(path.join(SANDBOX, ".work", side, "manifest.json"), "utf8"))]));

  fs.mkdirSync(options.outDir, { recursive: true });
  fs.rmSync(path.join(options.outDir, "out"), { recursive: true, force: true });
  const outDir = (id) => {
    const dir = path.join(options.outDir, "out", id);
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  };
  const work = (side, id, file) => path.join(SANDBOX, ".work", side, id, file);
  const read = (file) => (fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null);

  // Static: errors, the design JSON, the plain text, the HTML's bytes.
  const byId = (side) => new Map(manifests[side].templates.map((t) => [t.id, t]));
  const olds = byId("old");
  const news = byId("new");
  const ids = [...new Set([...olds.keys(), ...news.keys()])];
  const templates = [];
  const comparisons = []; // browser work
  for (const id of ids) {
    const a = olds.get(id);
    const b = news.get(id);
    const t = { id, source: (a ?? b).source, module: (a ?? b).module, wrapped: (a ?? b).wrapped, problems: [], json: null, modes: {} };
    templates.push(t);
    if (!a || !b) {
      t.problems.push(`only ${a ? "OLD" : "NEW"} has this template`);
      continue;
    }
    if (a.error || b.error) {
      if (a.error !== b.error) t.problems.push(`making the element: ${a.error ?? "ok"} → ${b.error ?? "ok"}`);
      else t.note = `both sides fail to make the element: ${a.error}`;
      continue;
    }
    if (String(a.modes) !== String(b.modes)) t.problems.push(`meant for ${a.modes} → ${b.modes}`);
    // renderToJson: should be identical.
    if (a.json?.error || b.json?.error) {
      t.json = a.json?.error === b.json?.error ? { status: "same error", error: a.json.error } : { status: "diff", diffs: [`renderToJson: ${a.json?.error ?? "ok"} → ${b.json?.error ?? "ok"}`] };
    } else {
      const ja = JSON.parse(read(work("old", id, "design.json")));
      const jb = JSON.parse(read(work("new", id, "design.json")));
      const diffs = jsonDiff(ja, jb);
      t.json = diffs.length ? { status: "diff", diffs } : { status: "pass" };
      if (diffs.length) {
        fs.copyFileSync(work("old", id, "design.json"), path.join(outDir(id), "old.design.json"));
        fs.copyFileSync(work("new", id, "design.json"), path.join(outDir(id), "new.design.json"));
      }
    }
    for (const mode of [...new Set([...(a.modes ?? []), ...(b.modes ?? [])])].filter((m) => options.modes.includes(m))) {
      const ra = a.renders[mode];
      const rb = b.renders[mode];
      const m = (t.modes[mode] = { problems: [], text: null, html: null, widths: {} });
      if (!ra || !rb) {
        m.problems.push(`only ${ra ? "OLD" : "NEW"} renders ${mode}`);
        continue;
      }
      if (String(ra.warnings ?? "") !== String(rb.warnings ?? "")) m.warnings = { old: ra.warnings ?? [], new: rb.warnings ?? [] };
      // renderToPlainText: exactly.
      if (ra.textError || rb.textError) {
        m.text = ra.textError === rb.textError ? { status: "same error", error: ra.textError } : { status: "diff", diffs: [`renderToPlainText: ${ra.textError ?? "ok"} → ${rb.textError ?? "ok"}`] };
      } else {
        const ta = read(work("old", id, `${mode}.txt`));
        const tb = read(work("new", id, `${mode}.txt`));
        m.text = ta === tb ? { status: "pass" } : { status: "diff", diffs: textDiff(ta, tb) };
        if (ta !== tb) {
          fs.writeFileSync(path.join(outDir(id), `old.${mode}.txt`), ta);
          fs.writeFileSync(path.join(outDir(id), `new.${mode}.txt`), tb);
        }
      }
      // renderToHtml: bytes (information only), then what Chromium draws.
      if (ra.htmlError || rb.htmlError) {
        m.html = ra.htmlError === rb.htmlError ? { status: "same error", error: ra.htmlError } : { status: "diff", diffs: [`renderToHtml: ${ra.htmlError ?? "ok"} → ${rb.htmlError ?? "ok"}`] };
        continue;
      }
      const ha = fs.readFileSync(work("old", id, `${mode}.html`));
      const hb = fs.readFileSync(work("new", id, `${mode}.html`));
      m.html = { status: ha.equals(hb) ? "identical" : "changed", bytes: [ha.length, hb.length] };
      comparisons.push({ t, mode, m });
    }
  }

  // In Chromium, every width.
  const browser = await phase(`compare in Chromium (${comparisons.length} template/modes × ${options.widths.length} widths, ${options.jobs} at a time)`, async () => {
    const browser = await openBrowser({ jobs: options.jobs });
    let done = 0;
    const tick = setInterval(() => process.stdout.write(`  ${done}/${comparisons.length}\r`), 2000);
    try {
      await Promise.all(
        comparisons.map(async ({ t, mode, m }) => {
          const oldHtml = work("old", t.id, `${mode}.html`);
          const newHtml = work("new", t.id, `${mode}.html`);
          try {
            const results = await browser.compare({
              oldUrl: pathToFileURL(oldHtml).href,
              newUrl: pathToFileURL(newHtml).href,
              widths: options.widths,
              tol: options.tolerance,
              paintTolerance: options.paintTolerance,
              onDiff: async (width, png) => {
                const dir = outDir(t.id);
                fs.copyFileSync(oldHtml, path.join(dir, `old.${mode}.html`));
                fs.copyFileSync(newHtml, path.join(dir, `new.${mode}.html`));
                fs.writeFileSync(path.join(dir, `${mode}-${width}.png`), png);
                return [`out/${t.id}/old.${mode}.html`, `out/${t.id}/new.${mode}.html`, `out/${t.id}/${mode}-${width}.png`];
              },
            });
            for (const [width, r] of Object.entries(results)) m.widths[width] = { status: r.differences.length ? "diff" : "pass", ...r };
          } catch (e) {
            m.problems.push(`Chromium: ${String(e.message ?? e).split("\n")[0]}`);
          }
          done++;
        })
      );
    } finally {
      clearInterval(tick);
    }
    const version = browser.version;
    await browser.close();
    return { version };
  });

  // Text and JSON differences also leave both HTML files to look at.
  for (const t of templates) {
    for (const [mode, m] of Object.entries(t.modes)) {
      if (m.text?.status === "diff" || t.json?.status === "diff") {
        const dir = outDir(t.id);
        for (const side of ["old", "new"]) if (fs.existsSync(work(side, t.id, `${mode}.html`))) fs.copyFileSync(work(side, t.id, `${mode}.html`), path.join(dir, `${side}.${mode}.html`));
      }
    }
  }

  const expectations = applyExpected(templates, options);

  const durationMs = Date.now() - started;
  const skipped = [...JSON.parse(fs.readFileSync(path.join(SANDBOX, "corpus/skipped.json"), "utf8")).map((s) => ({ id: s.module, reason: s.reason })), ...manifests.old.skipped];
  const summary = writeReports({
    sandbox: options.outDir,
    options,
    OLD,
    NEW,
    chromium: browser.version,
    templates,
    skipped,
    moduleErrors: { old: manifests.old.moduleErrors, new: manifests.new.moduleErrors },
    phases,
    durationMs,
    expectations,
  });
  console.log(`\n${summary.line}`);
  console.log(`report: ${path.join(options.outDir, "report.md")}`);
  console.log(`took ${(durationMs / 1000).toFixed(1)} s (${Object.entries(phases).map(([k, v]) => `${k.split(" (")[0]} ${(v / 1000).toFixed(1)} s`).join(", ")})`);
  process.exit(summary.differing ? 1 : 0);
} catch (e) {
  console.error(`HARNESS FAILED: ${e.stack ?? e}`);
  console.error(`took ${((Date.now() - started) / 1000).toFixed(1)} s`);
  process.exit(2);
}

/**
 * Marks each difference declared in options.expected as "expected" (with its reason), and returns the declared
 * template/mode/widths this run compared that no longer differ (stale). Declarations the run didn't compare (other
 * --only, --modes or --widths) are neither.
 */
function applyExpected(templates, options) {
  const file = options.expected;
  if (!file || file === "none") return { file: null, matched: [], stale: [] };
  if (!fs.existsSync(file)) throw new Error(`--expected ${file}: no such file`);
  const { reasons = {}, expected = {} } = JSON.parse(fs.readFileSync(file, "utf8"));
  const matched = [];
  const stale = [];
  for (const [id, modes] of Object.entries(expected)) {
    for (const [mode, widths] of Object.entries(modes)) {
      for (const [width, given] of Object.entries(widths)) {
        const reason = reasons[given] ?? given;
        const x = templates.find((t) => t.id === id)?.modes[mode]?.widths[width];
        if (!x) continue;
        if (x.status === "diff") {
          x.status = "expected";
          x.reason = reason;
          matched.push({ id, mode, width: Number(width), reason });
        } else stale.push({ id, mode, width: Number(width), reason });
      }
    }
  }
  return { file, matched, stale };
}

function run(cmd, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: SANDBOX, env: { ...process.env, ...env }, stdio: ["ignore", "inherit", "inherit"] });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${path.basename(args[0])} ${args[2]} exited ${code}`))));
  });
}
