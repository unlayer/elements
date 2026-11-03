// OLD and NEW: where each side's package is, and the bundle that renders the corpus with it.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const SANDBOX = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
/** The repository the sandbox is in (tests/upgrade-sandbox): its packages/react is NEW unless told otherwise. */
export const REPO = path.resolve(SANDBOX, "../..");
const NODE_BIN = path.dirname(process.execPath);
const env = { ...process.env, PATH: `${NODE_BIN}:${process.env.PATH ?? "/usr/bin:/bin"}` };

/** OLD: the published 0.2.1, installed as the npm alias `old-elements`. */
export function oldPackage() {
  const dir = path.join(SANDBOX, "node_modules/old-elements");
  if (!fs.existsSync(path.join(dir, "package.json"))) throw new Error("OLD isn't installed: run `npm install` in the sandbox");
  return describe(dir, "npm:@unlayer/react-elements@0.2.1");
}

/**
 * NEW: this repository's built package (or another checkout's: `worktree`).
 *  - fast (default): packages/react's package.json and dist copied to .new/fast. Its dependencies resolve from the
 *    sandbox's node_modules, the tree OLD was installed into, as they would in a project that upgrades.
 *  - pack: `pnpm pack` in packages/react into .new/pack, then npm-installed as `new-elements` from that tarball.
 *  - dir: a directory holding a package.json and dist (a scratch copy, say), used as is.
 */
export function newPackage({ worktree, pack, dir, log }) {
  const source = path.join(worktree, "packages/react");
  if (dir) {
    const abs = path.resolve(dir);
    checkDependencies(abs, worktree, log);
    return describe(abs, `directory ${path.relative(SANDBOX, abs) || abs}`);
  }
  if (!fs.existsSync(path.join(source, "dist/index.js"))) throw new Error(`NEW isn't built: ${source}/dist/index.js is missing (run \`pnpm build\` at the repository's root)`);
  // Which commit, and when its dist was built (the checkout moves; the dist isn't always rebuilt with it).
  let head = "?";
  try {
    head = execFileSync("git", ["-C", worktree, "log", "-1", "--format=%h %s"], { encoding: "utf8" }).trim();
  } catch {}
  const built = fs.statSync(path.join(source, "dist/index.js")).mtime.toISOString();
  const from = `HEAD ${head}; dist built ${built}`;
  if (!pack) {
    const target = path.join(SANDBOX, ".new/fast");
    fs.rmSync(target, { recursive: true, force: true });
    fs.mkdirSync(target, { recursive: true });
    fs.copyFileSync(path.join(source, "package.json"), path.join(target, "package.json"));
    fs.cpSync(path.join(source, "dist"), path.join(target, "dist"), { recursive: true });
    checkDependencies(target, worktree, log);
    return describe(target, `fast copy of packages/react; ${from}`);
  }
  // --pack: the real tarball, named by its hash so npm never reuses a stale one.
  const incoming = path.join(SANDBOX, ".new/pack/incoming");
  fs.rmSync(incoming, { recursive: true, force: true });
  fs.mkdirSync(incoming, { recursive: true });
  log(`  pnpm pack in ${source}`);
  execFileSync("pnpm", ["pack", "--pack-destination", incoming], { cwd: source, env, stdio: ["ignore", "pipe", "pipe"] });
  const [tgz] = fs.readdirSync(incoming).filter((f) => f.endsWith(".tgz"));
  if (!tgz) throw new Error("pnpm pack wrote no tarball");
  const hash = crypto.createHash("sha256").update(fs.readFileSync(path.join(incoming, tgz))).digest("hex").slice(0, 12);
  const tarball = path.join(SANDBOX, ".new/pack", `${tgz.replace(/\.tgz$/, "")}-${hash}.tgz`);
  fs.renameSync(path.join(incoming, tgz), tarball);
  fs.rmSync(incoming, { recursive: true, force: true });
  const spec = `file:${path.relative(SANDBOX, tarball)}`;
  const installed = path.join(SANDBOX, "node_modules/new-elements");
  // Installed without saving (package.json stays as committed); .new/pack/installed says which tarball it was.
  const marker = path.join(SANDBOX, ".new/pack/installed");
  const current = fs.existsSync(marker) ? fs.readFileSync(marker, "utf8") : null;
  if (current !== spec || !fs.existsSync(path.join(installed, "package.json"))) {
    log(`  npm install new-elements@${spec}`);
    execFileSync("npm", ["install", "--no-save", "--no-audit", "--no-fund", `new-elements@${spec}`], { cwd: SANDBOX, env, stdio: ["ignore", "pipe", "pipe"] });
    fs.writeFileSync(marker, spec);
  }
  return describe(installed, `pnpm pack tarball ${path.relative(SANDBOX, tarball)}; ${from}`);
}

function describe(dir, how) {
  const pkg = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
  const exp = pkg.exports?.["."];
  const entry = path.join(dir, (typeof exp === "string" ? exp : exp?.import ?? exp?.default) ?? pkg.module ?? pkg.main);
  return { dir, entry, how, name: pkg.name, version: pkg.version, packageJson: path.join(dir, "package.json"), indexSha: sha(entry) };
}

const sha = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex").slice(0, 12);

/** A copied package resolves its dependencies from the sandbox's node_modules: say when those aren't what it asks for. */
function checkDependencies(dir, worktree, log) {
  const pkg = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
  let catalog = {};
  try {
    const yaml = fs.readFileSync(path.join(worktree, "pnpm-workspace.yaml"), "utf8");
    const block = /^catalog:\s*\n((?:[ \t]+.*\n?)*)/m.exec(yaml)?.[1] ?? "";
    catalog = Object.fromEntries([...block.matchAll(/^\s+["']?([^"':]+)["']?\s*:\s*["']?([^"'\s]+)["']?/gm)].map((m) => [m[1], m[2]]));
  } catch {}
  for (const [name, raw] of Object.entries(pkg.dependencies ?? {})) {
    const wanted = raw === "catalog:" ? catalog[name] : raw;
    let have;
    try {
      have = JSON.parse(fs.readFileSync(path.join(SANDBOX, "node_modules", name, "package.json"), "utf8")).version;
    } catch {}
    if (!have) throw new Error(`NEW depends on ${name}@${wanted ?? raw}, which isn't installed in the sandbox: use --pack, or npm install it`);
    if (wanted && /^\d+\.\d+\.\d+/.test(wanted) && wanted !== have) log(`  WARNING: NEW asks for ${name}@${wanted}; the sandbox has ${have} (use --pack for NEW's own resolution)`);
  }
}

/** One bundle per side: the corpus and the renderer, @unlayer/react-elements aliased to that side's package. */
export async function bundle(side, pkg) {
  const esbuild = await import("esbuild");
  const outdir = path.join(SANDBOX, ".build", side);
  fs.rmSync(outdir, { recursive: true, force: true });
  await esbuild.build({
    absWorkingDir: SANDBOX,
    entryPoints: { render: path.join(SANDBOX, "harness/render.tsx") },
    outdir,
    bundle: true,
    splitting: true,
    format: "esm",
    platform: "node",
    target: "node20",
    jsx: "automatic",
    alias: { "@unlayer/react-elements": pkg.entry },
    // One React for both sides and for the package: the sandbox's, at runtime.
    external: ["react", "react-dom"],
    banner: { js: "import { createRequire as __sandboxRequire } from 'module'; const require = __sandboxRequire(import.meta.url);" },
    logLevel: "error",
  });
  return path.join(outdir, "render.js");
}
