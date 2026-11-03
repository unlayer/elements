#!/usr/bin/env node
// Copies the corpus of today's-component templates into this sandbox, rewritten to import the package under test.
//
//   node corpus/sync.mjs [--worktree <path>] [--seeds 40]
//
// Sources (read only), in this repository (or the checkout --worktree names):
//   - the demo app's templates                 packages/demo/src/templates/*.tsx
//   - every component story module            packages/react/src/components/*.stories.tsx
//   - every example story module              packages/react/src/examples/*.stories.tsx
//   - the Spotify story                       packages/react/src/SpotifyWelcome.stories.tsx
//   - templates generated at random (seeded)  corpus/generator.mjs, seeds 1..N
//   - the final review's inputs, each root     corpus/review.mjs
//
// Every relative import of the package's own modules (`../index`, `./Row`, `../layouts/ColumnLayouts`, ...) is
// rewritten to `@unlayer/react-elements`, which each build aliases to OLD or NEW. A module importing something the
// published package doesn't export can't be made standalone: it's skipped and listed in corpus/skipped.json.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { template } from "./generator.mjs";
import { INPUTS, ROOTS } from "./review.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SANDBOX = path.dirname(HERE);
const args = process.argv.slice(2);
const opt = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
// The sandbox is tests/upgrade-sandbox in the repository.
const WORKTREE = path.resolve(opt("--worktree", path.resolve(SANDBOX, "../..")));
const SEEDS = Number(opt("--seeds", 40));
const PKG = "@unlayer/react-elements";

// What the published package (OLD, 0.2.1) exports as values: a template may import only these.
const dts = fs.readFileSync(path.join(SANDBOX, "node_modules/old-elements/dist/index.d.ts"), "utf8");
const exportLine = [...dts.matchAll(/^export \{([^}]*)\};$/gm)].pop()[1];
const VALUE_EXPORTS = new Set(exportLine.split(",").map((s) => s.trim()).filter((s) => s && !s.startsWith("type ")));

for (const dir of ["demo", "stories", "generated", "review"]) fs.rmSync(path.join(HERE, dir), { recursive: true, force: true });
const skipped = [];
const modules = []; // { key, source, file }

/** Rewrites one file's imports; returns the new source, or { skip: reason }. */
function rewrite(src, file, outFile) {
  const problems = [];
  const captureRel = path.relative(path.dirname(outFile), path.join(SANDBOX, "harness/capture")).replace(/^(?!\.)/, "./");
  const out = src.replace(/^import\s+(type\s+)?([\s\S]*?)\s+from\s+["']([^"']+)["'];?[ \t]*$/gm, (whole, typeOnly, clause, spec) => {
    if (spec === "react" || spec.startsWith("react/") || spec === "react-dom" || spec.startsWith("react-dom/")) return whole;
    if (spec === PKG) return whole;
    if (spec.startsWith("@storybook/")) {
      if (typeOnly) return whole; // erased by esbuild
      problems.push(`imports values from ${spec}`);
      return whole;
    }
    if (!spec.startsWith(".")) {
      problems.push(`imports ${spec}, which isn't the package`);
      return whole;
    }
    // A relative import inside the demo app's templates folder stays (NewsletterWebArchive → NewsletterDigest).
    if (file.includes("/packages/demo/")) return whole;
    if (typeOnly) return `import type ${clause} from "${PKG}";`;
    const names = []; // [imported, local]
    let rest = clause.trim();
    const def = /^([A-Za-z_$][\w$]*)\s*(,|$)/.exec(rest);
    if (def) {
      // `import Row from "./Row"`: the module's default is the component the file is named after.
      const base = path.basename(spec);
      names.push([base === "index" ? def[1] : base, def[1]]);
      rest = rest.slice(def[0].length).trim();
    }
    if (rest.startsWith("*")) {
      problems.push(`imports ${spec} as a namespace`);
      return whole;
    }
    const named = /^\{([\s\S]*)\}$/.exec(rest);
    if (named) {
      for (const part of named[1].split(",").map((s) => s.trim()).filter(Boolean)) {
        if (part.startsWith("type ")) continue;
        const [imported, local = imported] = part.split(/\s+as\s+/).map((s) => s.trim());
        names.push([imported, local]);
      }
    }
    const lines = [];
    const values = [];
    for (const [imported, local] of names) {
      if (imported === "renderToHtmlParts") {
        // A story that renders its design through renderToHtmlParts: the harness's wrapper records the design.
        lines.push(`import { renderToHtmlParts as ${local} } from "${captureRel}";`);
        continue;
      }
      if (!VALUE_EXPORTS.has(imported)) problems.push(`imports ${imported} from ${spec}, which ${PKG}@0.2.1 doesn't export`);
      values.push(imported === local ? imported : `${imported} as ${local}`);
    }
    if (values.length) lines.unshift(`import { ${values.join(", ")} } from "${PKG}";`);
    return lines.join("\n") || `// (type-only import of ${spec} removed)`;
  });
  return problems.length ? { skip: problems.join("; ") } : out;
}

function copy(file, outFile, key, source) {
  const result = rewrite(fs.readFileSync(file, "utf8"), file, outFile);
  if (typeof result !== "string") {
    skipped.push({ module: key, reason: result.skip });
    return false;
  }
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, `// Copied from ${path.relative(WORKTREE, file)} by corpus/sync.mjs, imports rewritten to ${PKG}.\n${result}`);
  modules.push({ key, source, file: "./" + path.relative(HERE, outFile).replace(/\.tsx?$/, "") });
  return true;
}

// 1. The demo app's templates, and an index of them without its `?raw` source imports.
const demoDir = path.join(WORKTREE, "packages/demo/src/templates");
const demoIndex = fs.readFileSync(path.join(demoDir, "index.ts"), "utf8");
const demoEntries = [...demoIndex.matchAll(/\{\s*id:\s*"([^"]+)"[\s\S]*?component:\s*(\w+)[\s\S]*?\}/g)].map((m) => ({ id: m[1], component: m[2], mode: /mode:\s*"(\w+)"/.exec(m[0])?.[1] }));
const demoImports = Object.fromEntries([...demoIndex.matchAll(/^import (\w+) from "\.\/(\w+)";$/gm)].map((m) => [m[1], m[2]]));
for (const f of fs.readdirSync(demoDir).filter((f) => f.endsWith(".tsx"))) {
  const result = rewrite(fs.readFileSync(path.join(demoDir, f), "utf8"), path.join(demoDir, f), path.join(HERE, "demo", f));
  if (typeof result !== "string") skipped.push({ module: `demo/${f}`, reason: result.skip });
  fs.mkdirSync(path.join(HERE, "demo"), { recursive: true });
  fs.writeFileSync(path.join(HERE, "demo", f), `// Copied from packages/demo/src/templates/${f} by corpus/sync.mjs.\n${typeof result === "string" ? result : ""}`);
}
fs.writeFileSync(
  path.join(HERE, "demo/index.ts"),
  `// The demo app's template list (packages/demo/src/templates/index.ts) without its ?raw source imports. Written by corpus/sync.mjs.\n` +
    [...new Set(demoEntries.map((e) => e.component))].map((c) => `import ${c} from "./${demoImports[c]}";`).join("\n") +
    `\n\nexport const templates = [\n${demoEntries.map((e) => `  { id: ${JSON.stringify(e.id)}, component: ${e.component}, mode: ${JSON.stringify(e.mode ?? null)} },`).join("\n")}\n];\n`
);
modules.push({ key: "demo", source: "demo", file: "./demo/index" });

// 2. Every story module.
const reactSrc = path.join(WORKTREE, "packages/react/src");
for (const sub of ["components", "examples"]) {
  for (const f of fs.readdirSync(path.join(reactSrc, sub)).filter((f) => f.endsWith(".stories.tsx")).sort()) {
    copy(path.join(reactSrc, sub, f), path.join(HERE, "stories", sub, f), `${sub}/${f.replace(".stories.tsx", "")}`, sub);
  }
}
copy(path.join(reactSrc, "SpotifyWelcome.stories.tsx"), path.join(HERE, "stories/SpotifyWelcome.stories.tsx"), "root/SpotifyWelcome", "examples");

// 3. Templates generated at random, seeds 1..N.
for (let seed = 1; seed <= SEEDS; seed++) {
  const name = `seed-${String(seed).padStart(3, "0")}`;
  fs.mkdirSync(path.join(HERE, "generated"), { recursive: true });
  fs.writeFileSync(path.join(HERE, "generated", `${name}.tsx`), template(seed));
  modules.push({ key: `generated/${name}`, source: "generated", file: `./generated/${name}` });
}

// 4. The final review's inputs (corpus/review.mjs), each in each root.
fs.mkdirSync(path.join(HERE, "review"), { recursive: true });
for (const [name, input] of Object.entries(INPUTS)) {
  for (const root of ROOTS) {
    const file = `${name}-${root.toLowerCase()}`;
    fs.writeFileSync(
      path.join(HERE, "review", `${file}.tsx`),
      `// Written from corpus/review.mjs by corpus/sync.mjs. Do not edit.\nimport { ${root}, Row, Column, Heading, Paragraph, Button, Image } from "${PKG}";\nexport const T = () => (\n  ${input(root)}\n);\n`
    );
    modules.push({ key: `review/${file}`, source: "review", file: `./review/${file}` });
  }
}

fs.writeFileSync(
  path.join(HERE, "index.ts"),
  `// Every corpus module, loaded one at a time so one that fails to load fails alone. Written by corpus/sync.mjs.\n` +
    `export const modules: Array<{ key: string; source: string; load: () => Promise<any> }> = [\n` +
    modules.map((m) => `  { key: ${JSON.stringify(m.key)}, source: ${JSON.stringify(m.source)}, load: () => import(${JSON.stringify(m.file)}) },`).join("\n") +
    `\n];\n`
);
fs.writeFileSync(path.join(HERE, "skipped.json"), JSON.stringify(skipped, null, 1) + "\n");
console.log(`corpus: ${modules.length} modules (${modules.filter((m) => m.source === "demo").length} demo index, ${modules.filter((m) => m.source === "components").length} component story modules, ${modules.filter((m) => m.source === "examples").length} example story modules, ${SEEDS} generated); ${skipped.length} skipped`);
for (const s of skipped) console.log(`  skipped ${s.module}: ${s.reason}`);
