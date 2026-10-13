import { afterEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import Module, { createRequire } from "node:module";
import * as lib from "@unlayer/from-react-email";
import { main, withContentHash, type Io } from "../src/cli";
import { resolutionOrder } from "../src/resolution";

const dirs: string[] = [];
afterEach(() => {
  for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

const good = `import { Html, Body, Text } from "@react-email/components";
export default function T() { return <Html><Body><Text>Keep the original</Text></Body></Html>; }`;
const neverLoad = `import { Html } from "@react-email/components"; throw new Error("must not load");`;

function project(files: Record<string, string>, external = false): string {
  const dir = fs.mkdtempSync(path.join(external ? tmpdir() : import.meta.dirname, ".tmp-unlayer-"));
  dirs.push(dir);
  for (const [file, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), text);
  }
  // A project under git, its files committed: --write replaces only what git can restore.
  commit(dir);
  return dir;
}

/** Commits everything in `dir` (a git repository of its own). */
function commit(dir: string): void {
  const git = (...args: string[]) => execFileSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.com", "-c", "commit.gpgsign=false", ...args], { cwd: dir, stdio: "ignore" });
  if (!fs.existsSync(path.join(dir, ".git"))) git("init", "-q");
  git("add", "-A");
  git("commit", "-q", "--allow-empty", "-m", "templates");
}

function io(cwd: string): Io & { out: string; err: string } {
  const sink = { cwd, out: "", err: "", stdout: (t: string) => void (sink.out += t), stderr: (t: string) => void (sink.err += t) };
  return sink;
}

describe("destination safety", () => {
  it("rejects outputs that would overwrite another source before executing templates", async () => {
    const dir = project({ "emails/a.tsx": neverLoad, "emails/target/a.tsx": neverLoad });
    for (const flags of [[], ["--force"], ["--overwrite"]]) {
      const out = io(dir);
      expect(await main(["emails", "--out", "emails/target", ...flags], out, lib)).toBe(1);
      expect(out.err).toContain("source input");
      expect(out.out).toBe("");
      expect(fs.readFileSync(path.join(dir, "emails/target/a.tsx"), "utf8")).toBe(neverLoad);
    }
  });

  it("reserves report destinations against inputs and generated designs", async () => {
    const dir = project({ "emails/a.tsx": neverLoad });
    for (const report of ["emails/a.tsx", "migrated/a.design.json"]) {
      const out = io(dir);
      expect(await main(["emails", "--out", "migrated", "--design", "--report", report], out, lib)).toBe(1);
      expect(out.out).toBe("");
      expect(fs.existsSync(path.join(dir, "migrated"))).toBe(false);
    }
  });

  it("rejects a symlink output file without touching its outside target", async () => {
    const dir = project({ "emails/a.tsx": neverLoad, "outside/keep.tsx": "OUTSIDE" });
    fs.mkdirSync(path.join(dir, "migrated"));
    fs.symlinkSync("../outside/keep.tsx", path.join(dir, "migrated/a.tsx"));
    const out = io(dir);
    expect(await main(["emails", "--out", "migrated"], out, lib)).toBe(1);
    expect(out.err).toContain("symlink");
    expect(out.out).toBe("");
    expect(fs.readFileSync(path.join(dir, "outside/keep.tsx"), "utf8")).toBe("OUTSIDE");
  });

  it("rejects a parent symlink that escapes the output root", async () => {
    const dir = project({ "emails/nested/a.tsx": neverLoad, "outside/keep.txt": "OUTSIDE" });
    fs.mkdirSync(path.join(dir, "migrated"));
    fs.symlinkSync("../outside", path.join(dir, "migrated/nested"));
    const out = io(dir);
    expect(await main(["emails", "--out", "migrated"], out, lib)).toBe(1);
    expect(out.err).toContain("output folder");
    expect(fs.existsSync(path.join(dir, "outside/a.tsx"))).toBe(false);
  });

  it("rejects symlinked design and report files before loading templates", async () => {
    const dir = project({ "emails/a.tsx": neverLoad, "outside/keep.txt": "OUTSIDE" });
    fs.mkdirSync(path.join(dir, "migrated"));
    for (const file of ["migrated/a.design.json", "report.md"]) {
      fs.symlinkSync(path.join(dir, "outside/keep.txt"), path.join(dir, file));
      const out = io(dir);
      const flags = file.endsWith(".json") ? ["--design"] : ["--report", file];
      expect(await main(["emails", "--out", "migrated", ...flags], out, lib)).toBe(1);
      expect(out.err).toContain("symlink");
      expect(out.out).toBe("");
      fs.unlinkSync(path.join(dir, file));
    }
    expect(fs.readFileSync(path.join(dir, "outside/keep.txt"), "utf8")).toBe("OUTSIDE");
  });

  it("says a file in the output folder is an earlier run's, where it is, when it won't replace it", async () => {
    const dir = project({ "emails/welcome.tsx": good });
    expect(await main(["emails", "--out", "migrated", "--design"], io(dir), lib)).toBe(0);
    const again = io(dir);
    expect(await main(["emails", "--out", "migrated", "--design"], again, lib), again.out + again.err).toBe(1);
    expect(again.err).toBe("Output already exists: migrated/welcome.tsx (written by an earlier run). Choose an empty folder, or pass --overwrite to replace it.\n");
    fs.appendFileSync(path.join(dir, "migrated/welcome.tsx"), "export const mine = 1;\n");
    const edited = io(dir);
    expect(await main(["emails", "--out", "migrated", "--design"], edited, lib)).toBe(1);
    expect(edited.err).toContain("Output already exists: migrated/welcome.tsx (written by an earlier run, and edited since).");
    // Written by 0.1.0, with no hash line: an earlier version's, not an earlier run's.
    const written = fs.readFileSync(path.join(dir, "migrated/welcome.tsx"), "utf8");
    fs.writeFileSync(path.join(dir, "migrated/welcome.tsx"), written.replace(/^\/\/ @unlayer\/migrate hash [^\n]*\n/m, ""));
    const older = io(dir);
    expect(await main(["emails", "--out", "migrated", "--design"], older, lib)).toBe(1);
    expect(older.err).toBe("Output already exists: migrated/welcome.tsx (written by an earlier version of @unlayer/migrate, which didn't record whether it's edited since). Choose an empty folder, or pass --overwrite to replace it.\n");
    // A design can't be told from one made in the editor.
    fs.rmSync(path.join(dir, "migrated/welcome.tsx"));
    const design = io(dir);
    expect(await main(["emails", "--out", "migrated", "--design"], design, lib)).toBe(1);
    expect(design.err).toContain("Output already exists: migrated/welcome.design.json (a design, written by an earlier run or the editor).");
    expect(again.err + edited.err + design.err).not.toContain("didn't produce");
  });

  it("refuses to replace a file in the output folder that this run didn't produce, unless --overwrite", async () => {
    const dir = project({ "emails/welcome.tsx": good, "existing/welcome.tsx": "MINE", "existing/welcome.design.json": "MINE TOO" });
    for (const keep of ["welcome.tsx", "welcome.design.json"]) {
      const out = io(dir);
      expect(await main(["emails", "--out", "existing", "--design"], out, lib), out.out + out.err).toBe(1);
      expect(out.err).toContain(`Output already exists: existing/${keep} (not written by @unlayer/migrate). Choose an empty folder, or pass --overwrite to replace it.`);
      expect(out.out).toBe("");
      expect(fs.readFileSync(path.join(dir, "existing/welcome.design.json"), "utf8")).toBe("MINE TOO");
      // Then only the design JSON is someone's: still refused.
      fs.rmSync(path.join(dir, "existing/welcome.tsx"), { force: true });
    }
    // Next to a template with --write, too.
    fs.writeFileSync(path.join(dir, "emails/welcome.design.json"), "MINE");
    const write = io(dir);
    expect(await main(["emails", "--write", "--design"], write, lib)).toBe(1);
    expect(write.err).toContain("Output already exists: emails/welcome.design.json");
    expect(fs.readFileSync(path.join(dir, "emails/welcome.tsx"), "utf8")).toBe(good);
    // --force is for templates that fail the check: it doesn't replace other files.
    const forced = io(dir);
    expect(await main(["emails", "--out", "existing", "--design", "--force"], forced, lib)).toBe(1);
    expect(fs.readFileSync(path.join(dir, "existing/welcome.design.json"), "utf8")).toBe("MINE TOO");
    const overwritten = io(dir);
    expect(await main(["emails", "--out", "existing", "--design", "--overwrite"], overwritten, lib), overwritten.out + overwritten.err).toBe(0);
    expect(fs.readFileSync(path.join(dir, "existing/welcome.design.json"), "utf8")).toContain('"body"');
  });

  it("with --strict and --overwrite, writes neither a template that fails the check nor its design: an earlier design stays", async () => {
    const failing = `import { Html, Body, Text } from "@react-email/components";
export default function T() {
  const text = import.meta.url.includes(".unlayer-migrate-") ? "Changed" : "Keep this content";
  return <Html><Body><Text>{text}</Text></Body></Html>;
}`;
    const dir = project({ "emails/t.tsx": failing, "emails/t.design.json": "EARLIER RUN" });
    const out = io(dir);
    expect(await main(["emails", "--write", "--design", "--overwrite", "--strict"], out, lib), out.out + out.err).toBe(2);
    expect(out.out).toContain("lost text");
    expect(fs.readFileSync(path.join(dir, "emails/t.tsx"), "utf8")).toBe(failing);
    expect(fs.readFileSync(path.join(dir, "emails/t.design.json"), "utf8")).toBe("EARLIER RUN");
  });

  it("does not truncate an outside file hard-linked to an existing output", async () => {
    // The linked file is one an earlier run wrote (its header): --overwrite replaces it.
    const dir = project({ "emails/a.tsx": good, "outside/keep.tsx": withContentHash("/** @jsxRuntime automatic */\n// Migrated from React Email by @unlayer/migrate\nOUTSIDE") });
    fs.mkdirSync(path.join(dir, "migrated"));
    fs.linkSync(path.join(dir, "outside/keep.tsx"), path.join(dir, "migrated/a.tsx"));
    const out = io(dir);
    // Replacing a file that's already there needs --overwrite.
    expect(await main(["emails", "--out", "migrated", "--overwrite"], out, lib), out.out + out.err).toBe(0);
    expect(fs.readFileSync(path.join(dir, "outside/keep.tsx"), "utf8")).toContain("OUTSIDE");
    expect(fs.readFileSync(path.join(dir, "migrated/a.tsx"), "utf8")).toContain("@unlayer/react-elements");
  });
});

describe("a Node.js older than the CLI needs (built CLI)", () => {
  const bin = path.resolve(import.meta.dirname, "../dist/bin.js");
  // The version the check reads, as an older Node.js reports it.
  const reporting = (version: string) => ["--import", `data:text/javascript,Object.defineProperty(process.versions,"node",{value:"${version}"})`];
  const run = (node: string, args: string[], cwd: string) => promisify(execFile)(node, args, { cwd, timeout: 60_000 }).catch((error) => error);

  it("stops with exit 1, saying which version it needs, before loading anything", async () => {
    const dir = project({ "emails/welcome.tsx": good });
    for (const version of ["18.20.4", "20.5.1"]) {
      const result = await run(process.execPath, [...reporting(version), bin, "emails"], dir);
      expect(result.code, result.stdout + result.stderr).toBe(1);
      expect(result.stderr).toBe(`@unlayer/migrate needs Node.js 20.6 or later (you have ${version}).\n`);
      expect(result.stdout).toBe("");
    }
    const supported = await run(process.execPath, [...reporting("20.6.0"), bin, "--help"], dir);
    expect(supported.stdout).toContain("Migrate React Email templates to Unlayer Elements.");
  }, 90_000);

  it("says which version it is on any Node.js", async () => {
    const { version } = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, "../package.json"), "utf8"));
    for (const node of ["18.20.4", "20.6.0"]) {
      for (const flag of ["--version", "-v"]) {
        const result = await run(process.execPath, [...reporting(node), bin, flag], process.cwd());
        expect(result.code ?? 0, `${node} ${flag}: ${result.stderr}`).toBe(0);
        expect([result.stdout, result.stderr]).toEqual([`${version}\n`, ""]);
      }
    }
    // Anything else on an older one still stops at the check.
    const other = await run(process.execPath, [...reporting("18.20.4"), bin, "emails", "--version"], process.cwd());
    expect(other.stderr).toBe("@unlayer/migrate needs Node.js 20.6 or later (you have 18.20.4).\n");
  }, 90_000);

  // On Node 18 itself when it's installed (with nvm): nothing it lacks loads before the check.
  const home = process.env.HOME ?? "";
  const installed = fs.existsSync(path.join(home, ".nvm/versions/node")) ? fs.readdirSync(path.join(home, ".nvm/versions/node")).filter((v) => /^v(1[0-9]|20\.[0-5])\./.test(v)) : [];
  it.skipIf(!installed.length)("stops the same way on an older Node.js itself", async () => {
    const dir = project({ "emails/welcome.tsx": good });
    for (const version of installed) {
      const result = await run(path.join(home, ".nvm/versions/node", version, "bin/node"), [bin, "emails"], dir);
      expect(result.code, result.stdout + result.stderr).toBe(1);
      expect(result.stderr).toBe(`@unlayer/migrate needs Node.js 20.6 or later (you have ${version.slice(1)}).\n`);
      const asked = await run(path.join(home, ".nvm/versions/node", version, "bin/node"), [bin, "--version"], dir);
      expect([asked.stdout, asked.stderr]).toEqual([`${JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, "../package.json"), "utf8")).version}\n`, ""]);
    }
  }, 90_000);
});

describe("files the run can't read (built CLI)", () => {
  const bin = path.resolve(import.meta.dirname, "../dist/bin.js");
  function linked(files: Record<string, string>): string {
    const dir = project({ "package.json": '{"name":"unreadable-fixture","private":true,"type":"module"}', ...files }, true);
    const modules = path.join(dir, "node_modules");
    fs.mkdirSync(modules);
    for (const name of ["react", "react-dom", "@react-email"]) fs.symlinkSync(path.resolve(import.meta.dirname, "../node_modules", name), path.join(modules, name));
    return dir;
  }
  const run = (args: string[], cwd: string) => promisify(execFile)(process.execPath, [bin, ...args], { cwd, timeout: 60_000 }).catch((error) => error);

  it("fail a link to a file that's gone, and still migrate the rest", async () => {
    const dir = linked({ "emails/welcome.tsx": good });
    fs.symlinkSync(path.join(dir, "emails/missing.tsx"), path.join(dir, "emails/old.tsx"));
    const result = await run(["emails", "--out", "migrated"], dir);
    expect(result.code, result.stdout + result.stderr).toBe(2);
    expect(result.stdout).toMatch(/emails\/old\.tsx: couldn't read it: it links to a file that doesn't exist/);
    expect(result.stdout).toContain("2 templates: 1 migrated and checked, 1 failed. 1 written.");
    expect(fs.existsSync(path.join(dir, "migrated/welcome.tsx"))).toBe(true);
  }, 90_000);

  it("fail a run that has only a link to a file that's gone", async () => {
    const dir = linked({});
    fs.mkdirSync(path.join(dir, "emails"));
    fs.symlinkSync(path.join(dir, "emails/missing.tsx"), path.join(dir, "emails/old.tsx"));
    const result = await run(["emails"], dir);
    expect(result.code, result.stdout + result.stderr).toBe(2);
    expect(result.stdout).toContain("couldn't read it");
  }, 90_000);

  it("stop with a non-zero exit when the run can't go on (a folder it can't list), never a silent pass", async () => {
    const dir = linked({ "emails/welcome.tsx": good, "emails/locked/a.tsx": good });
    fs.chmodSync(path.join(dir, "emails/locked"), 0o000);
    try {
      const result = await run(["emails"], dir);
      expect(result.code, result.stdout + result.stderr).toBe(2);
      expect(result.stderr).toMatch(/✗ the run stopped: .*EACCES/);
    } finally {
      fs.chmodSync(path.join(dir, "emails/locked"), 0o755);
    }
  }, 90_000);
});

describe("encoding", () => {
  it("fails a template that isn't UTF-8 without writing it", async () => {
    const latin1 = Buffer.from(good.replace("Keep the original", "Café menu"), "latin1");
    const dir = project({});
    fs.mkdirSync(path.join(dir, "emails"));
    fs.writeFileSync(path.join(dir, "emails/menu.tsx"), latin1);
    commit(dir);
    for (const flags of [["--write"], ["--out", "migrated"]]) {
      const out = io(dir);
      expect(await main(["emails", ...flags], out, lib), out.out + out.err).toBe(2);
      expect(out.out).toContain("✗ emails/menu.tsx: it isn't saved as UTF-8");
      expect(fs.readFileSync(path.join(dir, "emails/menu.tsx")).equals(latin1)).toBe(true);
      expect(fs.existsSync(path.join(dir, "migrated"))).toBe(false);
    }
  });

  it("keeps CRLF line endings", async () => {
    const dir = project({ "emails/welcome.tsx": good.replace(/\n/g, "\r\n") });
    const out = io(dir);
    expect(await main(["emails", "--out", "migrated"], out, lib), out.out + out.err).toBe(0);
    const written = fs.readFileSync(path.join(dir, "migrated/welcome.tsx"), "utf8");
    expect(written).toContain("\r\n");
    expect(written).not.toMatch(/[^\r]\n/);
    const write = io(dir);
    expect(await main(["emails", "--write"], write, lib), write.out + write.err).toBe(0);
    expect(fs.readFileSync(path.join(dir, "emails/welcome.tsx"), "utf8")).not.toMatch(/[^\r]\n/);
  });
});

describe("the temporary copy a check loads", () => {
  it.each(["SIGINT", "SIGTERM"] as const)("is removed when the run gets %s (built CLI)", async (signal) => {
    const dir = project({ "package.json": '{"name":"signal-fixture","private":true,"type":"module"}' }, true);
    const loaded = path.join(dir, "probe-loaded");
    fs.mkdirSync(path.join(dir, "emails"));
    // The copy waits once loaded, so the run is interrupted while it's there.
    fs.writeFileSync(path.join(dir, "emails/slow.tsx"), `import { Html, Body, Text } from "@react-email/components";
import { writeFileSync } from "node:fs";
if (import.meta.url.includes(".unlayer-migrate-")) { writeFileSync(${JSON.stringify(loaded)}, "loaded"); await new Promise((done) => setTimeout(done, 60_000)); }
export default function Slow() { return <Html><Body><Text>Slow</Text></Body></Html>; }`);
    fs.mkdirSync(path.join(dir, "node_modules"));
    for (const name of ["react", "react-dom", "@react-email"]) {
      fs.symlinkSync(path.resolve(import.meta.dirname, "../node_modules", name), path.join(dir, "node_modules", name));
    }
    const child = spawn(process.execPath, [path.resolve(import.meta.dirname, "../dist/bin.js"), "emails"], { cwd: dir });
    const exited = new Promise<unknown>((done) => child.on("exit", (code, received) => done(received ?? code)));
    for (let waited = 0; !fs.existsSync(loaded) && waited < 30_000; waited += 50) await new Promise((done) => setTimeout(done, 50));
    expect(fs.readdirSync(path.join(dir, "emails")).filter((name) => name.includes(".unlayer-migrate-"))).toHaveLength(1);
    child.kill(signal);
    expect(await exited).toBe(signal);
    expect(fs.readdirSync(path.join(dir, "emails"))).toEqual(["slow.tsx"]);
  }, 60_000);

  it("listens for Ctrl-C for the whole run, between writes too, so a signal waiting to be handled isn't lost", async () => {
    const samples: boolean[] = [];
    const shared = globalThis as { __stopListenerSamples?: boolean[]; __stopListenerTimer?: ReturnType<typeof setInterval> };
    shared.__stopListenerSamples = samples;
    // A template that, once loaded, samples the run's own SIGINT listener every millisecond until the test ends.
    const sampler = `import { Html, Body, Text } from "@react-email/components";
const shared = globalThis as { __stopListenerSamples?: boolean[]; __stopListenerTimer?: ReturnType<typeof setInterval> };
shared.__stopListenerTimer ??= setInterval(() => shared.__stopListenerSamples?.push(process.listeners("SIGINT").some((l) => l.name === "interrupted")), 1);
export default function Sampler() { return <Html><Body><Text>Sampler</Text></Body></Html>; }`;
    const files: Record<string, string> = { "emails/a-sampler.tsx": sampler };
    for (let i = 1; i <= 6; i++) files[`emails/w${i}.tsx`] = good.replace("Keep the original", `Keep the original ${i}`);
    const dir = project(files);
    try {
      const out = io(dir);
      expect(await main(["emails", "--out", "out"], out, lib), out.out + out.err).toBe(0);
      expect(samples.length).toBeGreaterThan(0);
      expect(samples.filter((listening) => !listening)).toEqual([]);
    } finally {
      clearInterval(shared.__stopListenerTimer);
      delete shared.__stopListenerTimer;
      delete shared.__stopListenerSamples;
    }
  });

  it("stops the run on Ctrl-C while templates load: nothing is written, even with --allow-dirty (built CLI)", async () => {
    const dir = project({ "package.json": '{"name":"slow-load-fixture","private":true,"type":"module"}' }, true);
    const started = path.join(dir, "load-started");
    fs.mkdirSync(path.join(dir, "emails"));
    // One template takes a while to load; the other loads meanwhile.
    const slow = `import { Html, Body, Text } from "@react-email/components";
import { writeFileSync } from "node:fs";
writeFileSync(${JSON.stringify(started)}, "started");
await new Promise((done) => setTimeout(done, 3000));
export default function Slow() { return <Html><Body><Text>Slow one</Text></Body></Html>; }`;
    fs.writeFileSync(path.join(dir, "emails/slow.tsx"), slow);
    fs.writeFileSync(path.join(dir, "emails/welcome.tsx"), good);
    fs.mkdirSync(path.join(dir, "node_modules"));
    for (const name of ["react", "react-dom", "@react-email"]) {
      fs.symlinkSync(path.resolve(import.meta.dirname, "../node_modules", name), path.join(dir, "node_modules", name));
    }
    const child = spawn(process.execPath, [path.resolve(import.meta.dirname, "../dist/bin.js"), "emails", "--write", "--allow-dirty"], { cwd: dir });
    const exited = new Promise<unknown>((done) => child.on("exit", (code, received) => done(received ?? code)));
    for (let waited = 0; !fs.existsSync(started) && waited < 30_000; waited += 20) await new Promise((done) => setTimeout(done, 20));
    await new Promise((done) => setTimeout(done, 500));
    child.kill("SIGINT");
    expect(await exited).toBe("SIGINT");
    expect(fs.readFileSync(path.join(dir, "emails/slow.tsx"), "utf8")).toBe(slow);
    expect(fs.readFileSync(path.join(dir, "emails/welcome.tsx"), "utf8")).toBe(good);
  }, 60_000);

  it.skipIf(process.getuid?.() === 0)("fails the template with a reason when its folder is read-only", async () => {
    const dir = project({ "emails/welcome.tsx": good });
    fs.chmodSync(path.join(dir, "emails"), 0o555);
    try {
      const out = io(dir);
      expect(await main(["emails"], out, lib), out.out + out.err).toBe(2);
      expect(out.out).toContain("✗ emails/welcome.tsx: can't write a temporary copy next to it to check it (read-only folder)");
      expect(fs.readdirSync(path.join(dir, "emails"))).toEqual(["welcome.tsx"]);
    } finally {
      fs.chmodSync(path.join(dir, "emails"), 0o755);
    }
  });
});

describe("relocated verification", () => {
  it("preserves static and dynamic new URL resources, relative imports, and design image URLs", async () => {
    const source = `import { Html, Body, Text, Img } from "@react-email/components";
import { readFileSync } from "node:fs";
import { suffix } from "../lib/suffix";
export default function T({ asset }: { asset: string }) {
  const a = readFileSync(new URL("./logo.txt", import.meta.url), "utf8");
  const b = readFileSync(new URL(asset, import.meta.url), "utf8");
  return <Html><Body><Text>{a} {b} {suffix}</Text><Img src="https://example.com/logo.png" alt="Logo"/></Body></Html>;
}
T.PreviewProps = { asset: "./logo.txt" };`;
    const dir = project({ "emails/a.tsx": source, "emails/logo.txt": "Asset", "lib/suffix.ts": 'export const suffix = "kept";' });
    const out = io(dir);
    expect(await main(["emails", "--out", "migrated/deep", "--design"], out, lib), out.out + out.err).toBe(0);
    const compare = io(dir);
    expect(await main(["compare", "emails/a.tsx", "migrated/deep/a.tsx"], compare, lib), compare.out + compare.err).toBe(0);
    expect(fs.readFileSync(path.join(dir, "migrated/deep/a.tsx"), "utf8")).not.toContain(dir);
    expect(fs.readFileSync(path.join(dir, "migrated/deep/a.design.json"), "utf8")).toContain("https://example.com/logo.png");
    expect(fs.readFileSync(path.join(dir, "emails/a.tsx"), "utf8")).toBe(source);
  });

  it("finds a change that only occurs in the destination directory (flagged; not written with --strict) and cleans its probe", async () => {
    const source = `import { Html, Body, Text } from "@react-email/components";
export default function T() {
  const text = import.meta.url.includes("/migrated/") ? "Lost" : "Keep the original";
  return <Html><Body><Text>{text}</Text></Body></Html>;
}`;
    const flaggedDir = project({ "emails/a.tsx": source });
    const flagged = io(flaggedDir);
    expect(await main(["emails", "--out", "migrated"], flagged, lib)).toBe(2);
    expect(flagged.out).toContain("written, but its content differs");
    const dir = project({ "emails/a.tsx": source });
    const out = io(dir);
    expect(await main(["emails", "--out", "migrated", "--design", "--strict"], out, lib)).toBe(2);
    expect(out.out).toContain("check failed");
    expect(fs.existsSync(path.join(dir, "migrated"))).toBe(false);
    expect(fs.readFileSync(path.join(dir, "emails/a.tsx"), "utf8")).toBe(source);
    expect(fs.readdirSync(path.join(dir, "emails")).filter((name) => name.includes("unlayer-migrate"))).toEqual([]);
  });

  it("keeps sample image URLs in HTML fallbacks in --design", async () => {
    const source = `import { Html, Body, Text, Img } from "@react-email/components";
export default function T({ avatar, name }: { avatar: string; name: string }) {
  return <Html><Body><Text>Hello {name}</Text><Img src={avatar} alt="Avatar"/></Body></Html>;
}
T.PreviewProps = { avatar: "https://example.com/avatar.png", name: "Alex" };`;
    const dir = project({ "emails/a.tsx": source });
    const out = io(dir);
    expect(await main(["emails", "--out", "migrated", "--design"], out, lib), out.out + out.err).toBe(0);
    const design = fs.readFileSync(path.join(dir, "migrated/a.design.json"), "utf8");
    expect(design).toContain("https://example.com/avatar.png");
    expect(design).not.toContain("{{avatar}}");
    expect(design).toContain("{{name}}");
  });
});

describe("shared source files", () => {
  const footer = `import { Section, Text } from "@react-email/components";
export default function Footer() { return <Section style={{ maxWidth: "400px", color: "#ffffff" }}><Text>Footer copy</Text></Section>; }`;
  const welcome = `import { Html, Body, Container, Text } from "@react-email/components";
import Footer from "./components";
export default function Welcome() { return <Html><Body style={{ backgroundColor: "#101010" }}><Container style={{ maxWidth: "400px" }}><Text>Hello</Text><Footer/></Container></Body></Html>; }`;

  it.each(["relative", "alias"])("preserves imported components resolved by %s paths", async (kind) => {
    const dir = project({
      "tsconfig.json": JSON.stringify({ compilerOptions: { baseUrl: ".", paths: { "@shared/*": ["emails/components/*"] } } }),
      "emails/components/footer.tsx": footer,
      "emails/components/index.ts": 'export { default } from "./footer";',
      "emails/welcome.tsx": kind === "relative" ? welcome : welcome.replace('"./components"', '"@shared/footer"'),
    });
    const out = io(dir);
    expect(await main(["emails", "--write", "--design"], out, lib), out.out + out.err).toBe(0);
    expect(fs.readFileSync(path.join(dir, "emails/components/footer.tsx"), "utf8")).toBe(footer);
    expect(out.out).toMatch(/- emails\/components\/footer\.tsx: skipped: not an email template/);
    const migrated = fs.readFileSync(path.join(dir, "emails/welcome.tsx"), "utf8");
    expect(migrated).toContain("@unlayer/react-elements");
    expect(migrated).toContain('contentWidth="400px"');
    const { default: Welcome } = await import(path.join(dir, "emails/welcome.tsx"));
    const { renderToHtml } = await import("@unlayer/react-elements");
    expect(renderToHtml(Welcome({}))).toMatch(/color:\s*#ffffff/);
    expect(fs.existsSync(path.join(dir, "emails/components/footer.design.json"))).toBe(false);
  });

  it("leaves the shared component usable by a template that fails conversion", async () => {
    const failed = `import { Html, Body } from "@react-email/components";
import Footer from "./components/footer";
export default function Failed() { const settings = {}; return <Html><Body {...settings}><Footer/></Body></Html>; }`;
    const dir = project({ "emails/components/footer.tsx": footer, "emails/welcome.tsx": welcome.replace('"./components"', '"./components/footer"'), "emails/failed.tsx": failed });
    const out = io(dir);
    expect(await main(["emails", "--write"], out, lib)).toBe(2);
    expect(fs.readFileSync(path.join(dir, "emails/components/footer.tsx"), "utf8")).toBe(footer);
    expect(fs.readFileSync(path.join(dir, "emails/failed.tsx"), "utf8")).toBe(failed);
    expect(fs.readFileSync(path.join(dir, "emails/welcome.tsx"), "utf8")).toContain("@unlayer/react-elements");
    const { default: Failed } = await import(path.join(dir, "emails/failed.tsx"));
    const { render } = await import("@react-email/components");
    const { default: React } = await import("react");
    expect(await render(React.createElement(Failed))).toContain("Footer copy");
  });

  it.each([
    ["a #imports path, with no tsconfig", "#emails/base", {}],
    ["a package's exports, with moduleResolution node", "@acme/emails/base", { "tsconfig.json": JSON.stringify({ compilerOptions: { moduleResolution: "node", jsx: "react-jsx" } }) }],
  ])("keeps a shared template that a failing one imports through %s", async (_kind, specifier, extra) => {
    const base = `import { Html, Body, Text } from "@react-email/components";
export default function Base({ title = "Base" }: { title?: string }) { return <Html><Body><Text>{title}</Text></Body></Html>; }`;
    const promo = `import { Html, Body } from "@react-email/components";
import Base from "${specifier}";
export default function Promo() { const settings = {}; return <Html><Body {...settings}><Base title="Promo" /></Body></Html>; }`;
    // Outside this package, whose tsconfig would apply.
    const dir = fs.realpathSync(project({
      "package.json": JSON.stringify({ name: "imports-fixture", private: true, imports: { "#emails/*": "./emails/*.tsx" } }),
      "emails/base.tsx": base,
      "emails/promo.tsx": promo,
      "packages/emails/package.json": JSON.stringify({ name: "@acme/emails", exports: { "./base": "./src/base.tsx" } }),
      "packages/emails/src/base.tsx": base,
      ...extra,
    }, true));
    fs.mkdirSync(path.join(dir, "node_modules/@acme"), { recursive: true });
    for (const name of ["react", "react-dom", "@react-email"]) {
      fs.symlinkSync(path.resolve(import.meta.dirname, "../node_modules", name), path.join(dir, "node_modules", name));
    }
    fs.symlinkSync(path.join(dir, "packages/emails"), path.join(dir, "node_modules/@acme/emails"), "dir");
    const imported = specifier.startsWith("#") ? "emails/base.tsx" : "packages/emails/src/base.tsx";
    const out = io(dir);
    expect(await main(["emails", "packages", "--write"], out, lib)).toBe(2);
    expect(out.out).toContain(`- ${imported}: skipped: left as it is for emails/promo.tsx`);
    expect(fs.readFileSync(path.join(dir, imported), "utf8")).toBe(base);
    expect(fs.readFileSync(path.join(dir, "emails/promo.tsx"), "utf8")).toBe(promo);
  });

  it.each([
    ["wraps it", { "components/ui.tsx": `import { Html, Body, Text } from "@react-email/components";
export function Shell({ children }: { children?: React.ReactNode }) { return <Html><Body>{children}</Body></Html>; }
export function Copy({ children }: { children?: React.ReactNode }) { return <Text style={{ color: "#333333" }}>{children}</Text>; }` }],
    ["passes it on", { "components/ui.ts": 'export { Html as Shell, Text as Copy } from "@react-email/components";\n' }],
    ["passes on a file that does", { "components/ui.ts": 'export * from "./primitives";\n', "components/primitives.tsx": `import { Html, Text } from "@react-email/components";
export { Html as Shell, Text as Copy };` }],
  ])("finds a template that uses React Email only through a component file that %s", async (_kind, components) => {
    const welcome = `import { Shell, Copy } from "../components/ui";
export default function Welcome() { return <Shell><Copy>Welcome aboard</Copy></Shell>; }`;
    const helper = `import { format } from "../components/format";
export default function label(name: string) { return format(name); }`;
    const dir = project({ "emails/welcome.tsx": welcome, "emails/label.ts": helper, "components/format.ts": "export const format = (s: string) => s.trim();\n", ...components });
    const out = io(dir);
    expect(await main(["emails", "--write"], out, lib), out.out + out.err).toBe(0);
    // Found and checked: how much is editable depends on what the converter recognizes.
    expect(out.out).toMatch(/✓ emails\/welcome\.tsx: \d+% editable/);
    expect(fs.readFileSync(path.join(dir, "emails/welcome.tsx"), "utf8")).toContain("@unlayer/react-elements");
    // A file that isn't a template, or that doesn't reach React Email, is left out.
    expect(out.out).not.toContain("label.ts");
    expect(fs.readFileSync(path.join(dir, "emails/label.ts"), "utf8")).toBe(helper);
  });

  it("writes separate copies with --out without changing shared sources", async () => {
    const dir = project({ "emails/components/footer.tsx": footer, "emails/welcome.tsx": welcome.replace('"./components"', '"./components/footer"') });
    const out = io(dir);
    expect(await main(["emails", "--out", "converted"], out, lib), out.out + out.err).toBe(0);
    expect(fs.readFileSync(path.join(dir, "emails/components/footer.tsx"), "utf8")).toBe(footer);
    expect(fs.readFileSync(path.join(dir, "converted/components/footer.tsx"), "utf8")).toContain("@unlayer/react-elements");
    expect(fs.readFileSync(path.join(dir, "converted/welcome.tsx"), "utf8")).toContain('color="#ffffff"');
  });

  it.each(["--write", "--out"])("finishes all checks before %s writes", async (mode) => {
    const dir = project({ "emails/a.tsx": good, "emails/b.tsx": good });
    let checks = 0;
    const checking = { ...lib, verifyConversion: async (...args: Parameters<typeof lib.verifyConversion>) => {
      checks++;
      expect(fs.readFileSync(path.join(dir, "emails/a.tsx"), "utf8")).toBe(good);
      expect(fs.existsSync(path.join(dir, "converted/a.tsx"))).toBe(false);
      return lib.verifyConversion(...args);
    } };
    const out = io(dir);
    expect(await main(["emails", mode, ...(mode === "--out" ? ["converted"] : [])], out, checking), out.out + out.err).toBe(0);
    expect(checks).toBe(2);
  });
});

describe("bundled CLI in a CommonJS project", () => {
  it("loads TSX templates and aliased helpers with automatic JSX, then compares the written output", async () => {
    const dir = project({
      "package.json": '{"name":"migration-fixture","private":true}',
      "tsconfig.json": JSON.stringify({ compilerOptions: { baseUrl: ".", paths: { "@lib/*": ["lib/*"] } } }),
      "lib/label.tsx": 'import { Text } from "@react-email/components"; export function Label({name}: {name:string}) { return <Text>Hello {name}</Text>; }',
      "emails/a.tsx": `import { Html, Body } from "@react-email/components";
import { Label } from "@lib/label";
export default function T({name}: {name:string}) { return <Html><Body><Label name={name}/></Body></Html>; }
T.PreviewProps = {name:"Jordan"};`,
    }, true);
    // A consumer hasn't installed Elements yet: the CLI must supply its copy.
    const modules = path.join(dir, "node_modules");
    fs.mkdirSync(modules);
    for (const name of ["react", "react-dom", "@react-email"]) {
      fs.symlinkSync(path.resolve(import.meta.dirname, "../node_modules", name), path.join(modules, name));
    }
    const run = promisify(execFile);
    const bin = path.resolve(import.meta.dirname, "../dist/bin.js");
    const migrate = await run(process.execPath, [bin, "emails", "--out", "migrated", "--design"], { cwd: dir });
    expect(migrate.stdout).toContain("1 migrated and checked");
    const compare = await run(process.execPath, [bin, "compare", "emails/a.tsx", "migrated/a.tsx"], { cwd: dir });
    expect(compare.stdout).toContain("same words, links and images");
  });
});


describe("a monorepo", () => {
  const layout = `import { Html, Body, Container } from "@react-email/components";
export default function Layout({ children }: { children?: React.ReactNode }) { return <Html><Body><Container>{children}</Container></Body></Html>; }`;
  /**
   * The root has a fake Elements that says when it's loaded; the app has the real
   * one, and a workspace package with a TSX layout (outside the app) is linked.
   */
  function monorepo(): string {
    const root = fs.realpathSync(project({
      "package.json": JSON.stringify({ name: "mono", private: true, workspaces: ["apps/*", "packages/*"] }),
      "node_modules/@unlayer/react-elements/package.json": JSON.stringify({ name: "@unlayer/react-elements", version: "0.2.0", type: "module", exports: { ".": "./index.js", "./package.json": "./package.json" } }),
      "node_modules/@unlayer/react-elements/index.js": 'process.stderr.write("fake Elements from the root was loaded\\n");\nexport const renderToHtml = () => "";\nexport const renderToJson = () => ({});\n',
      "packages/email-ui/package.json": JSON.stringify({ name: "@acme/email-ui", private: true, main: "Layout.tsx" }),
      "packages/email-ui/Layout.tsx": layout,
      "apps/web/package.json": JSON.stringify({ name: "web", private: true }),
      "apps/web/emails/welcome.tsx": `import { Html, Body, Text } from "@react-email/components";
export default function Welcome() { return <Html><Body><Text>Welcome aboard</Text></Body></Html>; }`,
      "apps/web/emails/framed.tsx": `import { Text } from "@react-email/components";
import Layout from "@acme/email-ui";
export default function Framed() { return <Layout><Text>Inside the shared layout</Text></Layout>; }`,
    }, true));
    const modules = path.resolve(import.meta.dirname, "../node_modules");
    for (const name of ["react", "react-dom", "@react-email"]) fs.symlinkSync(path.join(modules, name), path.join(root, "node_modules", name));
    fs.mkdirSync(path.join(root, "node_modules/@acme"));
    fs.symlinkSync(path.join(root, "packages/email-ui"), path.join(root, "node_modules/@acme/email-ui"), "dir");
    fs.mkdirSync(path.join(root, "apps/web/node_modules/@unlayer"), { recursive: true });
    fs.symlinkSync(fs.realpathSync(path.join(modules, "@unlayer/react-elements")), path.join(root, "apps/web/node_modules/@unlayer/react-elements"), "dir");
    return root;
  }
  const run = (args: string[], cwd: string) =>
    promisify(execFile)(process.execPath, [path.resolve(import.meta.dirname, "../dist/bin.js"), ...args], { cwd, timeout: 60_000 }).catch((error) => error);

  it("migrates an app's templates with the app's Elements when run from the root (built CLI)", async () => {
    const root = monorepo();
    const result = await run(["apps/web/emails", "--out", "apps/web/migrated"], root);
    expect(result.stderr).not.toContain("fake Elements");
    expect(result.stdout, result.stdout + result.stderr).toContain("2 templates: 2 migrated and checked. 2 written.");
    const compare = await run(["compare", "apps/web/emails/welcome.tsx", "apps/web/migrated/welcome.tsx"], root);
    expect(compare.stderr).not.toContain("fake Elements");
    expect(compare.stdout, compare.stdout + compare.stderr).toContain("same words, links and images");
  }, 90_000);

  it("loads a workspace package's TSX with the JSX runtime when run from the app (built CLI)", async () => {
    const root = monorepo();
    const result = await run(["emails"], path.join(root, "apps/web"));
    expect(result.stdout, result.stdout + result.stderr).toMatch(/✓ emails\/framed\.tsx: 100% editable/);
    expect(result.stdout).toContain("2 templates: 2 migrated and checked.");
  }, 90_000);

  it("stops before checking templates whose Elements isn't the one the run loads (built CLI)", async () => {
    const root = monorepo();
    // From the root's folder of apps, the run loads the root's Elements; the app has its own.
    const result = await run(["apps", "--write"], root);
    expect(result.code, result.stdout + result.stderr).toBe(1);
    expect(result.stderr).toContain("apps/web/emails has its own @unlayer/react-elements");
    expect(result.stderr).toContain("npx @unlayer/migrate apps/web/emails");
    expect(result.stdout).toBe("");
    expect(fs.readFileSync(path.join(root, "apps/web/emails/welcome.tsx"), "utf8")).not.toContain("@unlayer/react-elements");
  }, 90_000);

  it("says when the original is what doesn't render, not the migrated template", async () => {
    // Fine as converted; the original throws (as a workspace file loaded without the JSX runtime would).
    const source = `import { Html, Body, Text } from "@react-email/components";
export default function T() {
  if (!import.meta.url.includes(".unlayer-migrate-")) throw new Error("React is not defined");
  return <Html><Body><Text>Hello</Text></Body></Html>;
}`;
    const dir = project({ "emails/t.tsx": source, "migrated/t.tsx": `import { Email, Row, Column, Paragraph } from "@unlayer/react-elements";
export default function T() { return <Email><Row><Column><Paragraph>Hello</Paragraph></Column></Row></Email>; }` });
    const out = io(dir);
    expect(await main(["emails"], out, lib)).toBe(2);
    expect(out.out).toMatch(/✗ emails\/t\.tsx: the original template doesn't render: React is not defined in emails\/t\.tsx, which was loaded without the project's JSX settings/);
    const compare = io(dir);
    expect(await main(["compare", "emails/t.tsx", "migrated/t.tsx"], compare, lib)).toBe(2);
    expect(compare.err).toContain("The original template doesn't render: React is not defined");
  });

  it("keeps one React, the project's, for every module; React Email and Elements come from the module's own folder", () => {
    for (const name of ["react", "react/jsx-runtime", "react-dom/server"]) {
      expect(resolutionOrder(name, false), name).toEqual(["project", "importer", "self"]);
    }
    for (const name of ["@unlayer/react-elements", "@react-email/components", "react-email"]) {
      expect(resolutionOrder(name, false), name).toEqual(["importer", "project", "self"]);
      // The converter renders with the project's.
      expect(resolutionOrder(name, true), name).toEqual(["project", "importer", "self"]);
    }
    expect(resolutionOrder("lodash", false)).toBeUndefined();
  });
});

describe("the CommonJS resolution a run sets up while templates load", () => {
  it("is taken out when the run ends, whatever loaded since: a require afterwards resolves once, as usual", async () => {
    const dir = project({ "emails/a.tsx": good, "emails/b.tsx": good.replace("Keep the original", "Hold the original") });
    for (const out of ["first", "second"]) expect(await main(["emails", "--out", out], io(dir), lib)).toBe(0);
    // Counts the resolutions that reach the resolver Node has now, those a wrapper below makes on its own too (one
    // the runs left in place would resolve again from its project). Left in place: it only counts.
    type Resolve = (...args: unknown[]) => string;
    const api = Module as unknown as { _resolveFilename: Resolve };
    const current = api._resolveFilename;
    let counting = false;
    let calls = 0;
    api._resolveFilename = function (this: unknown, ...args: unknown[]) {
      if (counting) calls++;
      return current.apply(this, args);
    };
    counting = true;
    createRequire(path.join(dir, "noop.js")).resolve("react");
    counting = false;
    expect(calls).toBe(1);
  });
});

describe("wrapped templates", () => {
  it.each([
    ['import { memo } from "react";', 'memo(Welcome)'],
    ['import { forwardRef } from "react";', 'forwardRef(Welcome)'],
    ['import { memo as remember, forwardRef as reference } from "react";', 'remember(reference(Welcome))'],
    ['import * as React from "react";', 'React.memo(React.forwardRef(Welcome))'],
  ])("migrates and compares %s %s with inner preview props", async (imports, wrapper) => {
    const source = `${imports}
import { Html, Body, Text } from "@react-email/components";
function Welcome({name}, ref) { return <Html><Body><Text>Hello {name}</Text></Body></Html>; }
Welcome.PreviewProps = {name:"Guest"};
export default ${wrapper};`;
    const dir = project({ "welcome.tsx": source });
    const out = io(dir);
    expect(await main(["welcome.tsx", "--out", "converted"], out, lib), out.out + out.err).toBe(0);
    expect(out.out).toContain("1 migrated and checked");
    const written = fs.readFileSync(path.join(dir, "converted/welcome.tsx"), "utf8");
    expect(written).toContain("@unlayer/react-elements");
    const comparison = io(dir);
    expect(await main(["compare", "welcome.tsx", "converted/welcome.tsx"], comparison, lib), comparison.out + comparison.err).toBe(0);
    // Check the wrapper as React renders it, as well as the unwrapped check.
    const { default: Wrapped } = await import(path.join(dir, "converted/welcome.tsx"));
    const { default: React } = await import("react");
    const { render } = await import("@react-email/components");
    expect(await render(React.createElement(Wrapped, {name:"Guest"}))).toContain("Hello Guest");
  });

  it("prefers outer preview props, including for compare", async () => {
    const source = `import { memo, forwardRef } from "react";
import { Html, Body, Text } from "@react-email/components";
function Welcome({name}, ref) { if (name !== "Outer") throw new Error("wrong preview props"); return <Html><Body><Text>Hello {name}</Text></Body></Html>; }
Welcome.PreviewProps = {name:"Inner"};
const Wrapped = memo(forwardRef(Welcome));
Wrapped.PreviewProps = {name:"Outer"};
export default Wrapped;`;
    const dir = project({ "welcome.tsx": source });
    const out = io(dir);
    expect(await main(["welcome.tsx", "--out", "converted"], out, lib), out.out + out.err).toBe(0);
    expect(await main(["compare", "welcome.tsx", "converted/welcome.tsx"], out, lib), out.out + out.err).toBe(0);
  });

  it("skips config objects but fails unsupported React exports", async () => {
    const dir = project({
      "config.tsx": 'import { Html } from "@react-email/components"; export default {color:"white"};',
      "unsupported.tsx": 'import { Html } from "@react-email/components"; export default {$$typeof:Symbol.for("react.lazy"),_payload:{}};',
    });
    const config = io(dir);
    expect(await main(["config.tsx", "--write"], config, lib)).toBe(1);
    expect(config.out).toContain("skipped");
    const out = io(dir);
    expect(await main(["unsupported.tsx", "--write"], out, lib)).toBe(2);
    expect(out.out).toContain("unsupported React template wrapper");
    expect(out.out).not.toContain("skipped");
  });
});


describe("extra text", () => {
  const extra = good.replace('</Body>', '<Text>{import.meta.url.includes(".unlayer-migrate-") ? "Unexpected" : null}</Text></Body>');

  it.each(["md", "json"])("with --strict, fails without writing the template and includes added words in the %s report", async (extension) => {
    const dir = project({ "welcome.tsx": extra });
    const out = io(dir);
    expect(await main(["welcome.tsx", "--out", "converted", "--design", "--strict", "--report", `report.${extension}`], out, lib), out.out + out.err).toBe(2);
    expect(out.out).toContain('extra text: "Unexpected"');
    expect(fs.existsSync(path.join(dir, "converted/welcome.tsx"))).toBe(false);
    expect(fs.existsSync(path.join(dir, "converted/welcome.design.json"))).toBe(false);
    expect(fs.readFileSync(path.join(dir, "welcome.tsx"), "utf8")).toBe(extra);
    const report = fs.readFileSync(path.join(dir, `report.${extension}`), "utf8");
    if (extension === "json") expect(JSON.parse(report)[0]).toMatchObject({status:"check-failed",addedText:["Unexpected"],missingText:[]});
    else expect(report).toContain('**Extra text:** "Unexpected"');
  });

  it("flags a template when only a flipped boolean prop adds text (written, exit 2)", async () => {
    const source = extra.replace('import.meta.url.includes', 'trial && import.meta.url.includes').replace('function T()', 'function T({trial})') + '\nT.PreviewProps = {trial:false};';
    const dir = project({ "welcome.tsx": source });
    const out = io(dir);
    expect(await main(["welcome.tsx", "--out", "converted", "--report", "report.json"], out, lib), out.out + out.err).toBe(2);
    expect(out.out).toContain('with trial: true: extra text: "Unexpected"');
    const report = JSON.parse(fs.readFileSync(path.join(dir, "report.json"), "utf8"));
    expect(report[0]).toMatchObject({status:"check-failed",addedText:[],variants:[{change:"trial: true",added:["Unexpected"],missing:[]}]});
    expect(fs.existsSync(path.join(dir, "converted/welcome.tsx"))).toBe(true);
  });

  it("compare fails a template that writes a nested text prop into HTML as is", async () => {
    const original = `import { Html, Body, Text } from "@react-email/components";
export default function T({ user }: { user: { city: string } }) { return <Html><Body><Text>From {user.city}</Text></Body></Html>; }
T.PreviewProps = { user: { city: "Paris" } };`;
    const migrated = `import { Email, Row, Column, Html } from "@unlayer/react-elements";
export default function T({ user }: { user: { city: string } }) { return <Email><Row><Column><Html html={\`<p>From \${user.city}</p>\`} /></Column></Row></Email>; }`;
    const dir = project({ "original.tsx": original, "converted.tsx": migrated });
    const out = io(dir);
    expect(await main(["compare", "original.tsx", "converted.tsx"], out, lib), out.out + out.err).toBe(2);
    expect(out.out).toContain("with text props with markup:");
  });

  it("compare lists extra words in the sample and flipped props", async () => {
    const original = good.replace('function T()', 'function T({trial})') + '\nT.PreviewProps = {trial:false};';
    const migrated = `import { Email, Row, Column, Paragraph } from "@unlayer/react-elements";
export default function T({trial}) { return <Email><Row><Column><Paragraph>Keep the original Unexpected{trial ? " Variant" : ""}</Paragraph></Column></Row></Email>; }`;
    const dir = project({ "original.tsx": original, "converted.tsx": migrated });
    const out = io(dir);
    expect(await main(["compare", "original.tsx", "converted.tsx"], out, lib), out.out + out.err).toBe(2);
    expect(out.out).toContain('extra text: "Unexpected"');
    expect(out.out).toContain('with trial: true: extra text: "Unexpected", "Variant"');
  });
});

describe("files that aren't templates", () => {
  const welcome = `import { Html, Body, Text } from "@react-email/components";
export default function Welcome() { return <Html><Body><Text>Welcome aboard</Text></Body></Html>; }`;

  it("are never loaded, even in a dry run: a helper that sends an email isn't called", async () => {
    // Each helper leaves a mark when it's loaded or called.
    const marks = fs.mkdtempSync(path.join(tmpdir(), "unlayer-marks-"));
    dirs.push(marks);
    const called = (name: string) => `writeFileSync(${JSON.stringify(path.join(marks, name))}, "called")`;
    const dir = project({
      "emails/welcome.tsx": welcome,
      "emails/send-welcome.ts": `import { render } from "@react-email/components";
import { writeFileSync } from "node:fs";
import Welcome from "./welcome";
${called("loaded-send")};
export default async function sendWelcome(to: string) { ${called("called-send")}; return render(Welcome()); }`,
      "emails/mailer.mjs": `import { render } from "@react-email/components";
import { writeFileSync } from "node:fs";
${called("loaded-mailer")};
export default function mailer(options) { ${called("called-mailer")}; return null; }`,
      "emails/registry.tsx": `import { render } from "@react-email/components";
export default { welcome: "welcome" };`,
    });
    for (const flags of [[], ["--write"]]) {
      const out = io(dir);
      expect(await main(["emails", ...flags], out, lib), out.out + out.err).toBe(0);
      expect(out.out).toMatch(/- emails\/send-welcome\.ts: skipped: not loaded: its default export is async/);
      expect(out.out).toMatch(/- emails\/mailer\.mjs: skipped: not loaded: its default export doesn't return JSX/);
      expect(out.out).toMatch(/- emails\/registry\.tsx: skipped: not loaded: its default export isn't a component/);
      expect(fs.readdirSync(marks)).toEqual([]);
    }
  });

  it("don't load a default-exported class that isn't a React component, even with render()", async () => {
    const marks = fs.mkdtempSync(path.join(tmpdir(), "unlayer-marks-"));
    dirs.push(marks);
    const mark = (name: string) => `writeFileSync(${JSON.stringify(path.join(marks, name))}, "called")`;
    const dir = project({
      "emails/mailer.tsx": `import { render } from "@react-email/components";
import { writeFileSync } from "node:fs";
${mark("loaded")};
class Mailer { render() { ${mark("rendered")}; return render(null as any); } }
export default Mailer;`,
      "emails/component.tsx": `import { Component } from "react";
import { Html, Body, Text } from "@react-email/components";
export default class Welcome extends Component { render() { return <Html><Body><Text>Welcome aboard</Text></Body></Html>; } }`,
      "emails/pure.tsx": `import * as React from "react";
import { Html, Body, Text } from "@react-email/components";
export default class Receipt extends React.PureComponent { render() { return <Html><Body><Text>Your receipt</Text></Body></Html>; } }`,
      "emails/local.tsx": `import { Html, Body, Text } from "@react-email/components";
class Component { render() { return null; } }
export default class Note extends Component { render() { return <Html><Body><Text>Note</Text></Body></Html>; } }`,
    });
    const out = io(dir);
    await main(["emails"], out, lib);
    expect(out.out).toMatch(/- emails\/mailer\.tsx: skipped: not loaded: its default export is a class that doesn't extend React's Component/);
    // An email (it renders <Html>) the check can't load fails rather than being skipped as a helper.
    expect(out.out).toMatch(/✗ emails\/local\.tsx: its default export is a class that doesn't extend React's Component directly/);
    expect(fs.readdirSync(marks)).toEqual([]);
    // React's own classes are loaded (what follows may still fail for them).
    expect(out.out).not.toMatch(/emails\/(component|pure)\.tsx: skipped/);
  });

  it("fail a template whose default export is wrapped in a call the check can't unwrap; helpers stay skipped", async () => {
    const dir = project({
      "lib/wrap.ts": "export const withTracking = (component: any) => component;\nexport const withRetry = (send: any) => send;\n",
      "emails/welcome.tsx": `import { Html, Body, Text } from "@react-email/components";
import { withTracking } from "../lib/wrap";
function Welcome() { return <Html><Body><Text>Welcome aboard</Text></Body></Html>; }
export default withTracking(Welcome);`,
      "emails/send.ts": `import { render } from "@react-email/components";
import { withRetry } from "../lib/wrap";
async function send(to: string) { return render(null as any); }
export default withRetry(send);`,
      "emails/receipt.tsx": `import * as Email from "@react-email/components";
const withLocale = (locale: string) => (component: any) => component;
function Receipt() { return <Email.Html><Email.Body><Email.Text>Your receipt</Email.Text></Email.Body></Email.Html>; }
export default withLocale("en")(Receipt);`,
    });
    const out = io(dir);
    expect(await main(["emails"], out, lib), out.out + out.err).toBe(2);
    expect(out.out).toContain("✗ emails/welcome.tsx: its default export is wrapped in withTracking(…), which the check can't unwrap: export the component itself");
    expect(out.out).toContain('✗ emails/receipt.tsx: its default export is wrapped in withLocale("en")(…)');
    expect(out.out).toMatch(/- emails\/send\.ts: skipped: not loaded/);
    expect(out.out).toContain("2 templates: 0 migrated and checked, 2 failed. 1 other file skipped (see above).");
  });

  it("never pass a run that checked nothing: a wrapped template whose <Html> is in a layout fails, one that returns a JSX value is loaded (and refused, saying why)", async () => {
    const dir = project({
      "emails/layout.tsx": `import { Html, Body } from "@react-email/components";\nexport function Layout({ children }: { children?: React.ReactNode }) { return <Html><Body>{children}</Body></Html>; }`,
      "emails/tracked.tsx": `import { Text } from "@react-email/components";\nimport { Layout } from "./layout";\nconst withTracking = <T,>(c: T) => c;\nfunction Welcome() { return <Layout><Text>Welcome aboard</Text></Layout>; }\nexport default withTracking(Welcome);`,
      "emails/variable.tsx": `import { Html, Body, Text } from "@react-email/components";\nexport default function Receipt() { const email = <Html><Body><Text>Thanks for your order</Text></Body></Html>; return email; }`,
    });
    const out = io(dir);
    expect(await main(["emails"], out, lib), out.out + out.err).toBe(2);
    expect(out.out).toMatch(/✗ emails\/tracked\.tsx: its default export is wrapped in withTracking/);
    expect(out.out).toMatch(/✗ emails\/variable\.tsx: couldn't convert it: A template return must be JSX: return the JSX itself \(not a variable holding it\)/);
  });

  it("still loads templates that return JSX through a condition, or that have PreviewProps", async () => {
    const dir = project({
      "emails/conditional.tsx": `import * as React from "react";
import { Html, Body, Text } from "@react-email/components";
const Inner = ({ name }: { name?: string }) => (name ? <Html><Body><Text>Hi {name}</Text></Body></Html> : null);
export default React.memo(Inner);`,
      "emails/previewed.tsx": `import { Html, Body, Text } from "@react-email/components";
const shell = (text: string) => <Html><Body><Text>{text}</Text></Body></Html>;
function Previewed({ text }: { text: string }) { const content = shell(text); return content; }
Previewed.PreviewProps = { text: "Previewed copy" };
export { Previewed as default };`,
    });
    const out = io(dir);
    await main(["emails"], out, lib);
    // Loaded: what follows (rendering, converting) may still fail for these shapes.
    expect(out.out).not.toContain("skipped");
    expect(out.out).toContain("✗ emails/conditional.tsx: the migrated template doesn't render: the template renders nothing with these props");
    // `export { X as default }` is read; a return of a variable holding the JSX fails, saying so (never a pass).
    expect(out.out).toContain("✗ emails/previewed.tsx: couldn't convert it: A template return must be JSX");
  });

  it("don't keep templates in place with --write: an index that imports them and exports them again", async () => {
    const dir = project({
      "emails/welcome.tsx": welcome,
      "emails/index.ts": `import Welcome from "./welcome";\nexport { Welcome };\n`,
    });
    const dry = io(dir);
    expect(await main(["emails"], dry, lib)).toBe(0);
    expect(dry.out).toContain("1 migrated and checked");
    const out = io(dir);
    expect(await main(["emails", "--write"], out, lib), out.out + out.err).toBe(0);
    expect(out.out).toContain("1 written");
    expect(fs.readFileSync(path.join(dir, "emails/welcome.tsx"), "utf8")).toContain("@unlayer/react-elements");
  });

  it("don't keep templates in place with --write: a Next.js route that sends one", async () => {
    const dir = project({
      "src/emails/welcome.tsx": welcome,
      "src/app/api/send/route.tsx": `import Welcome from "../../../emails/welcome";
const resend = { emails: { send: async (message: unknown) => message } };
export async function POST() { await resend.emails.send({ from: "a@example.com", to: "b@example.com", subject: "Hi", react: <Welcome /> }); return new Response("ok"); }`,
    });
    const out = io(dir);
    expect(await main(["src", "--write"], out, lib), out.out + out.err).toBe(0);
    expect(out.out).toContain("1 written");
    expect(fs.readFileSync(path.join(dir, "src/emails/welcome.tsx"), "utf8")).toContain("@unlayer/react-elements");
  });

  it("fail a template that calls process.exit, and the run ends when a template leaves a timer (built CLI)", async () => {
    const dir = project({
      "package.json": '{"name":"exit-fixture","private":true,"type":"module"}',
      "emails/exits.tsx": `import { Html, Body, Text } from "@react-email/components";
process.exit(0);
export default function Exits() { return <Html><Body><Text>Exits</Text></Body></Html>; }`,
      "emails/named-exit.tsx": `import { Html, Body, Text } from "@react-email/components";
import { exit } from "node:process";
if (!process.env.MAILER_KEY_THAT_IS_NOT_SET) exit();
export default function NamedExit() { return <Html><Body><Text>Named exit</Text></Body></Html>; }`,
      "emails/timer.tsx": `import { Html, Body, Text } from "@react-email/components";
setInterval(() => {}, 1000);
export default function Timer() { return <Html><Body><Text>Timer</Text></Body></Html>; }`,
    }, true);
    const modules = path.join(dir, "node_modules");
    fs.mkdirSync(modules);
    for (const name of ["react", "react-dom", "@react-email"]) {
      fs.symlinkSync(path.resolve(import.meta.dirname, "../node_modules", name), path.join(modules, name));
    }
    const bin = path.resolve(import.meta.dirname, "../dist/bin.js");
    const result = await promisify(execFile)(process.execPath, [bin, "emails"], { cwd: dir, timeout: 60_000 }).catch((error) => error);
    expect(result.code, result.stdout + result.stderr).toBe(2);
    expect(result.stdout).toMatch(/emails\/exits\.tsx: couldn't load it: a template called process\.exit\(0\)/);
    expect(result.stdout).toMatch(/emails\/named-exit\.tsx: couldn't load it: a template called process\.exit\(\)/);
    expect(result.stdout).toMatch(/emails\/timer\.tsx: 100% editable/);
    expect(result.stdout).toContain("1 migrated and checked, 2 failed");
  }, 90_000);

  it("finish the run and fail it when a template throws later, from a timer or a promise (built CLI)", async () => {
    const dir = project({
      "package.json": '{"name":"late-fixture","private":true,"type":"module"}',
      "emails/timer.tsx": `import { Html, Body, Text } from "@react-email/components";
setTimeout(() => process.exit(0), 0);
export default function Timer() { return <Html><Body><Text>Timer</Text></Body></Html>; }`,
      "emails/promise.tsx": `import { Html, Body, Text } from "@react-email/components";
Promise.resolve().then(() => { throw new Error("thrown later"); });
export default function Later() { return <Html><Body><Text>Later</Text></Body></Html>; }`,
    }, true);
    const modules = path.join(dir, "node_modules");
    fs.mkdirSync(modules);
    for (const name of ["react", "react-dom", "@react-email"]) {
      fs.symlinkSync(path.resolve(import.meta.dirname, "../node_modules", name), path.join(modules, name));
    }
    const bin = path.resolve(import.meta.dirname, "../dist/bin.js");
    const result = await promisify(execFile)(process.execPath, [bin, "emails"], { cwd: dir, timeout: 60_000 }).catch((error) => error);
    expect(result.code, result.stdout + result.stderr).toBe(2);
    expect(result.stdout).toContain("2 templates: 2 migrated and checked.");
    expect(result.stderr).toContain("a template's code threw outside a render: a template called process.exit(0)");
    expect(result.stderr).toContain("a template's code threw outside a render: thrown later");
  }, 90_000);
});

describe("compare and the whole check", () => {
  it("names an original it can't load, outside the project, and says where to run it", async () => {
    const dir = project({ "emails/welcome.tsx": good });
    expect(await main(["emails", "--out", "migrated"], io(dir), lib)).toBe(0);
    // A copy of the original outside the project, whose imports aren't installed where it is.
    const elsewhere = fs.mkdtempSync(path.join(tmpdir(), "unlayer-elsewhere-"));
    dirs.push(elsewhere);
    fs.writeFileSync(path.join(elsewhere, "welcome.tsx"), good.replace("@react-email/components", "react-email"));
    const out = io(dir);
    expect(await main(["compare", path.join(elsewhere, "welcome.tsx"), "migrated/welcome.tsx"], out, lib), out.out + out.err).toBe(2);
    expect(out.err).toContain(`Couldn't load the original template, ${path.relative(dir, path.join(elsewhere, "welcome.tsx"))}: Cannot find`);
    expect(out.err).toContain("'react-email'");
    expect(out.err).toContain("put it in the project that has its dependencies (or install them there), then run compare from that project.");
  });

  it("lists a hand migration that moves text across the page, as a run would (and fails it with --strict)", async () => {
    const original = `import { Html, Body, Section, Row, Column, Text } from "@react-email/components";
export default function T() { return <Html><Body><Section style={{ width: "600px" }}><Row><Column><Text>Thanks for your order, here is the summary</Text><Text style={{ textAlign: "right" }}>Total due: 40 dollars</Text></Column></Row></Section></Body></Html>; }`;
    const migrated = `import { Email, Row, Column, Paragraph } from "@unlayer/react-elements";
export default function T() { return <Email backgroundColor="#ffffff" contentWidth="600px"><Row><Column><Paragraph>Thanks for your order, here is the summary</Paragraph><Paragraph textAlign="left">Total due: 40 dollars</Paragraph></Column></Row></Email>; }`;
    const dir = project({ "emails/t.tsx": original, "hand.tsx": migrated });
    const out = io(dir);
    expect(await main(["compare", "emails/t.tsx", "hand.tsx"], out, lib), out.out + out.err).toBe(0);
    expect(out.out).toMatch(/It looks different:\n {2}- moved: "Total", "due", "40", "dollars" \d+px to the left/);
    const strict = io(dir);
    expect(await main(["compare", "emails/t.tsx", "hand.tsx", "--strict"], strict, lib), strict.out + strict.err).toBe(2);
  });

  it("fails a hand migration that hides a linked image on phones, naming it", async () => {
    const original = `import { Html, Body, Section, Text, Link, Img } from "@react-email/components";
export default function T() { return <Html><Body><Section><Text>Thanks for your order, here is the summary</Text><Link href="https://example.com/app"><Img src="https://example.com/badge.png" alt="" width="120" height="40" /></Link></Section></Body></Html>; }`;
    const migrated = `import { Email, Row, Column, Paragraph, Image } from "@unlayer/react-elements";
export default function T() { return <Email><Row><Column><Paragraph>Thanks for your order, here is the summary</Paragraph><Image src="https://example.com/badge.png" alt="" width="120px" href="https://example.com/app" hideOnMobile /></Column></Row></Email>; }`;
    const dir = project({ "emails/t.tsx": original, "hand.tsx": migrated });
    const out = io(dir);
    expect(await main(["compare", "emails/t.tsx", "hand.tsx"], out, lib), out.out + out.err).toBe(2);
    expect(out.out).toContain("on phones, lost links/images:");
    expect(out.out).toContain("https://example.com/badge.png");
  });
});

describe("templates reached through the project's own modules", () => {
  const template = (text: string) => `import { Html, Body, Text } from "@react-email/components";
import { BRAND } from "../lib/brand";
export default function T() { return <Html><Body><Text>${text} from {BRAND}</Text></Body></Html>; }`;

  it("migrates templates a registry or a mailer outside the folder imports without rendering them", async () => {
    const dir = project({
      "emails/welcome.tsx": template("Welcome"),
      "emails/reset.tsx": template("Reset your password"),
      "lib/brand.ts": `import Welcome from "../emails/welcome";\nimport Reset from "../emails/reset";\nimport { send } from "./mailer";\nexport const BRAND = "Acme";\nexport const templates = { welcome: Welcome, reset: Reset, send };`,
      "lib/mailer.tsx": `import { render } from "@react-email/components";\nimport Reset from "../emails/reset";\nexport async function send() { return render(<Reset />); }`,
    });
    for (const flags of [[], ["--write"]]) {
      const out = io(dir);
      expect(await main(["emails", ...flags], out, lib), out.out + out.err).toBe(0);
      expect(out.out).toContain("2 templates: 2 migrated and checked");
    }
  });

  it("leaves a layout alone however a component file outside the folder picks it, and fails what it can't tell", async () => {
    const base = `import * as React from "react";
import { Html, Body } from "@react-email/components";
export default function Base({ content }: { content?: React.ReactNode }) { return <Html><Body>{content}</Body></Html>; }`;
    const shells = {
      condition: `import Base from "../emails/layouts/base";\nconst Minimal = Base;\nexport function Shell({ content, slim = false }: { content?: React.ReactNode; slim?: boolean }) { const Layout = slim ? Minimal : Base; return <Layout content={content} />; }`,
      call: `import Base from "../emails/layouts/base";\nexport function Shell({ content }: { content?: React.ReactNode }) { return Base({ content }); }`,
      object: `import Base from "../emails/layouts/base";\nconst layouts = { base: Base };\nexport function Shell({ content }: { content?: React.ReactNode }) { const L = layouts.base; return <L content={content} />; }`,
    };
    const promo = `import { Text } from "@react-email/components";\nimport { Shell } from "../src/shell";\nexport default function Promo() { return <Shell content={<Text>Big sale today</Text>} />; }\nPromo.PreviewProps = {};`;
    for (const [shape, shell] of Object.entries(shells)) {
      const dir = project({ "emails/layouts/base.tsx": base, "src/shell.tsx": shell, "emails/promo.tsx": promo });
      const out = io(dir);
      await main(["emails", "--write"], out, lib);
      expect(out.out, shape).toMatch(/- emails\/layouts\/base\.tsx: skipped: a shared piece/);
      expect(fs.readFileSync(path.join(dir, "emails/layouts/base.tsx"), "utf8"), shape).toBe(base);
    }
    // Untyped: an email of its own or a piece the shell renders can't be told. It fails, unchanged.
    const untyped = `import { Html, Body } from "@react-email/components";\nexport default function Base({ content }) { return <Html><Body>{content}</Body></Html>; }`;
    const dir = project({ "emails/layouts/base.jsx": untyped, "src/shell.tsx": shells.condition.replace("../emails/layouts/base", "../emails/layouts/base.jsx"), "emails/promo.tsx": promo });
    const out = io(dir);
    expect(await main(["emails", "--write"], out, lib), out.out + out.err).toBe(2);
    expect(out.out).toMatch(/✗ emails\/layouts\/base\.jsx: imported through src\/shell\.tsx \(outside the folder\)/);
    expect(fs.readFileSync(path.join(dir, "emails/layouts/base.jsx"), "utf8")).toBe(untyped);
  });

  it("migrates a template that a mailer outside the folder renders to send, when the templates import the mailer's constants", async () => {
    const dir = project({
      "emails/welcome.tsx": `import { Html, Body, Text } from "@react-email/components";\nimport { BRAND } from "../lib/email";\nexport default function Welcome() { return <Html><Body><Text>Welcome to {BRAND}</Text></Body></Html>; }`,
      "emails/reset.tsx": `import { Html, Body, Text } from "@react-email/components";\nexport default function Reset({ name }: { name: string }) { return <Html><Body><Text>Reset it, {name}</Text></Body></Html>; }\nReset.PreviewProps = { name: "Ada" };`,
      "lib/email.tsx": `import { render } from "@react-email/components";\nimport Reset from "../emails/reset";\nexport const BRAND = "Acme";\nexport async function sendReset() { return render(<Reset name="Ada" />); }`,
    });
    const out = io(dir);
    expect(await main(["emails", "--write"], out, lib), out.out + out.err).toBe(0);
    expect(out.out).toContain("2 templates: 2 migrated and checked");
  });

  it("doesn't take a helper that wraps an async send function for a template", async () => {
    const dir = project({
      "emails/welcome.tsx": `import { Html, Body, Text } from "@react-email/components";\nexport default function Welcome() { return <Html><Body><Text>Welcome aboard</Text></Body></Html>; }`,
      "emails/send.tsx": `import { render } from "@react-email/components";\nimport Welcome from "./welcome";\nconst withLogging = <T,>(f: T) => f;\nexport default withLogging(async function sendWelcome() { return render(<Welcome />); });`,
    });
    const out = io(dir);
    expect(await main(["emails"], out, lib), out.out + out.err).toBe(0);
    expect(out.out).toMatch(/✓ emails\/welcome\.tsx/);
    expect(out.out).toMatch(/- emails\/send\.tsx: skipped: not loaded: its default export wraps an async function in withLogging/);
  });
});

describe("a run that checks nothing", () => {
  it("fails a template it can't load (async, or a class not from React) instead of skipping it", async () => {
    const dir = project({
      "emails/async.tsx": `import { Html, Body, Text } from "@react-email/components";\nexport default async function Welcome() { return <Html><Body><Text>Hi</Text></Body></Html>; }\nWelcome.PreviewProps = {};`,
    });
    const out = io(dir);
    expect(await main(["emails"], out, lib), out.out + out.err).toBe(2);
    expect(out.out).toMatch(/✗ emails\/async\.tsx: .*async, which Elements can't render/);
  });

  it("doesn't end with 0 when it found React Email files but no email among them (only shared components)", async () => {
    const dir = project({ "emails/footer.tsx": `import { Section, Text } from "@react-email/components";\nexport default function Footer() { return <Section><Text>Sent by Acme</Text></Section>; }` });
    const out = io(dir);
    expect(await main(["emails"], out, lib), out.out + out.err).toBe(1);
    expect(out.err).toContain("No email template was checked");
  });
});

describe("files the run didn't write", () => {
  const template = `import { Html, Body, Text } from "@react-email/components";
export default function Welcome() { return <Html><Body><Text>Hello there</Text></Body></Html>; }`;

  it("aren't replaced by --report, even on a dry run, unless it's a report a run wrote (or --overwrite)", async () => {
    const dir = project({ "emails/welcome.tsx": template, "notes.md": "# My notes\n\nKeep these.\n" });
    const out = io(dir);
    expect(await main(["emails", "--report", "notes.md"], out, lib), out.out + out.err).toBe(1);
    expect(out.err).toContain("Output already exists: notes.md");
    expect(fs.readFileSync(path.join(dir, "notes.md"), "utf8")).toBe("# My notes\n\nKeep these.\n");
    // A report a run wrote is replaced; so is anything with --overwrite.
    expect(await main(["emails", "--report", "report.md"], io(dir), lib)).toBe(0);
    expect(await main(["emails", "--report", "report.md"], io(dir), lib)).toBe(0);
    expect(await main(["emails", "--report", "notes.md", "--overwrite"], io(dir), lib)).toBe(0);
    expect(fs.readFileSync(path.join(dir, "notes.md"), "utf8")).toMatch(/^# React Email → Unlayer Elements migration/);
  });

  it("aren't replaced by --out with --overwrite when a run didn't write them and git can't restore them", async () => {
    const dir = project({ "emails/welcome.tsx": template, "welcome.tsx": "export const mine = 1;\n" });
    fs.writeFileSync(path.join(dir, "welcome.tsx"), "export const mine = 2; // edited, not committed\n");
    const out = io(dir);
    expect(await main(["emails", "--out", ".", "--overwrite"], out, lib), out.out + out.err).toBe(1);
    expect(out.err).toContain("--overwrite would replace welcome.tsx");
    expect(fs.readFileSync(path.join(dir, "welcome.tsx"), "utf8")).toContain("edited, not committed");
    expect(await main(["emails", "--out", ".", "--overwrite", "--allow-dirty"], io(dir), lib)).toBe(0);
    expect(fs.readFileSync(path.join(dir, "welcome.tsx"), "utf8")).toContain("@unlayer/react-elements");
    // What a run wrote before is replaced, committed or not.
    expect(await main(["emails", "--out", "migrated", "--design"], io(dir), lib)).toBe(0);
    expect(await main(["emails", "--out", "migrated", "--design", "--overwrite"], io(dir), lib)).toBe(0);
  });

  it("aren't replaced by --out with --overwrite when edited while the run loads the templates, after it decided it could replace them", async () => {
    // The template edits the output an earlier run wrote when it's loaded to be checked.
    const editsOutput = `import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { Html, Body, Text } from "@react-email/components";
const output = fileURLToPath(new URL("../migrated/welcome.tsx", import.meta.url));
const mark = ["// edited", "during the run"].join(" ");
if (fs.existsSync(output) && !fs.readFileSync(output, "utf8").includes(mark)) fs.appendFileSync(output, \`\${mark}\\n\`);
export default function Welcome() { return <Html><Body><Text>Hello there</Text></Body></Html>; }
`;
    const dir = project({ "emails/welcome.tsx": editsOutput });
    expect(await main(["emails", "--out", "migrated"], io(dir), lib)).toBe(0);
    const out = io(dir);
    expect(await main(["emails", "--out", "migrated", "--overwrite"], out, lib), out.out + out.err).toBe(2);
    expect(out.out).toContain("✗ emails/welcome.tsx: couldn't write output: welcome.tsx changed during the run: not replaced (the edit is kept), run again");
    expect(fs.readFileSync(path.join(dir, "migrated/welcome.tsx"), "utf8")).toContain("// edited during the run");
  });

  it("aren't replaced by --out with --overwrite once a template a run wrote is edited (its hash), unless git can restore it or --allow-dirty", async () => {
    const dir = project({ "emails/welcome.tsx": template });
    expect(await main(["emails", "--out", "migrated"], io(dir), lib)).toBe(0);
    const output = path.join(dir, "migrated/welcome.tsx");
    const written = fs.readFileSync(output, "utf8");
    expect(written).toMatch(/^\/\*\* @jsxRuntime automatic \*\/\n\/\/ Migrated from React Email by @unlayer\/migrate[^\n]*\n\/\/ @unlayer\/migrate hash [0-9a-f]{16}: /);
    // As written, or with only what an editor changes on save (line endings, trailing whitespace): replaced.
    fs.writeFileSync(output, `${written.replace(/\n/g, "  \r\n")}\r\n`);
    expect(await main(["emails", "--out", "migrated", "--overwrite"], io(dir), lib)).toBe(0);
    expect(fs.readFileSync(output, "utf8")).toBe(written);
    // Edited since, and git can't restore it (not committed): kept, naming it.
    fs.appendFileSync(output, "export const mine = 1;\n");
    const edited = io(dir);
    expect(await main(["emails", "--out", "migrated", "--overwrite"], edited, lib), edited.out + edited.err).toBe(1);
    expect(edited.err).toContain("--overwrite would replace migrated/welcome.tsx (edited since a run wrote it, not committed)");
    expect(fs.readFileSync(output, "utf8")).toContain("export const mine = 1;");
    // Written by 0.1.0, without a hash: whether it's edited can't be told, so it's kept the same way.
    fs.writeFileSync(output, written.replace(/^\/\/ @unlayer\/migrate hash [^\n]*\n/m, ""));
    const unhashed = io(dir);
    expect(await main(["emails", "--out", "migrated", "--overwrite"], unhashed, lib), unhashed.out + unhashed.err).toBe(1);
    expect(unhashed.err).toContain("--overwrite would replace migrated/welcome.tsx (written by an earlier version, which didn't record whether it's edited since, not committed)");
    // An edit git can restore is replaced; so is one with --allow-dirty.
    fs.writeFileSync(output, `${written}export const mine = 2;\n`);
    commit(dir);
    expect(await main(["emails", "--out", "migrated", "--overwrite"], io(dir), lib)).toBe(0);
    expect(fs.readFileSync(output, "utf8")).toBe(written);
    fs.appendFileSync(output, "export const mine = 3;\n");
    expect(await main(["emails", "--out", "migrated", "--overwrite", "--allow-dirty"], io(dir), lib)).toBe(0);
    expect(fs.readFileSync(output, "utf8")).toBe(written);
  });
});

describe("a symbolic link to a folder, in a folder", () => {
  it("isn't followed, and is listed (the templates there aren't left out without a word); one to a file is migrated", async () => {
    const template = `import { Html, Body, Text } from "@react-email/components";
export default function T() { return <Html><Body><Text>Hello there</Text></Body></Html>; }`;
    const dir = project({ "shared/welcome.tsx": template, "emails/real.tsx": template });
    fs.symlinkSync(path.join(dir, "shared"), path.join(dir, "emails/linked"));
    fs.symlinkSync(path.join(dir, "shared/welcome.tsx"), path.join(dir, "emails/welcome.tsx"));
    const out = io(dir);
    expect(await main(["emails"], out, lib), out.out + out.err).toBe(0);
    expect(out.out).toMatch(/- emails\/linked: skipped: a symbolic link to a folder, not followed/);
    expect(out.out).toMatch(/✓ emails\/welcome\.tsx/);
    expect(out.out).toMatch(/✓ emails\/real\.tsx/);
  });
});

describe("a phone width other than Elements'", () => {
  const template = (width: string) => `import { Html, Head, Body, Container, Text, Button } from "@react-email/components";
export default function T() {
  return <Html><Head><style>{\`@media only screen and (max-width: ${width}) { .desktop-only { display: none !important; } .mobile-only { display: block !important; } }\`}</style></Head>
    <Body style={{ backgroundColor: "#ffffff" }}><Container>
      <Text>Hi Alex,</Text>
      <Text className="desktop-only">Manage your subscription from the dashboard.</Text>
      <Text className="mobile-only" style={{ display: "none" }}>Tap below to manage it in the app.</Text>
      <Button href="https://example.com/manage" style={{ backgroundColor: "#111827", color: "#ffffff", padding: "12px 20px" }}>Manage</Button>
    </Container></Body></Html>;
}`;
  const tailwind = `import { Html, Head, Body, Container, Text, Tailwind } from "@react-email/components";
export default function T() {
  return <Tailwind><Html><Head /><Body className="bg-white"><Container>
    <Text className="text-base">Hi Alex,</Text>
    <Text className="text-sm max-sm:hidden">Manage your subscription from the dashboard.</Text>
    <Text className="text-sm hidden max-sm:block">Tap below to manage it in the app.</Text>
  </Container></Body></Html></Tailwind>;
}`;
  it.each([
    ["600px", template("600px"), /phone styles apply up to 600px, Elements' up to 480px: between 481px and 600px the migration shows the desktop version, with what shows only on desktop/],
    ["414px", template("414px"), /phone styles apply up to 414px, Elements' up to 480px: between 415px and 480px the migration shows the phone version, with what shows only on phones/],
    ["Tailwind's max-sm:", tailwind, /phone styles apply up to 6\d\dpx, Elements' up to 480px/],
  ])("is listed as looking different: %s", async (_, source, said) => {
    const dir = project({ "emails/t.tsx": source });
    const out = io(dir);
    expect(await main(["emails", "--out", "migrated"], out, lib), out.out + out.err).toBe(0);
    expect(out.out).toMatch(said);
  });
});

describe("words CSS adds or hides", () => {
  it.each([
    ["a label drawn before the text", `<Tailwind><Html><Head /><Body className="bg-white"><Container><Text className="text-sm before:content-['Sale:'] before:mr-1 before:font-bold">Everything 20% off this weekend</Text></Container></Body></Html></Tailwind>`],
    ["text cut to an ellipsis", `<Html><Head /><Body style={{ backgroundColor: "#ffffff" }}><Container style={{ width: "600px" }}><Text>Your order</Text><Text style={{ width: "220px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "14px" }}>Organic cotton crew neck sweater in heather grey, size medium, gift wrapped</Text></Container></Body></Html>`],
  ])("are content: %s fails the template, saying words are involved (it's written)", async (_, markup) => {
    const source = `import { Html, Head, Body, Container, Text, Tailwind } from "@react-email/components";
export default function T() { return ${markup}; }`;
    const dir = project({ "emails/t.tsx": source });
    const out = io(dir);
    expect(await main(["emails", "--out", "migrated"], out, lib), out.out + out.err).toBe(2);
    expect(out.out).toMatch(/✗ emails\/t\.tsx: written, but it failed the check: .*words CSS adds or hides, which the check doesn't read/);
    expect(fs.existsSync(path.join(dir, "migrated/t.tsx"))).toBe(true);
  });
});

describe("content shown or hidden by props", () => {
  // The preview props show it; other props hide it. The migration can't keep the condition, so it shows it to everyone.
  const template = (name: string, section: string, props: string) => `import { Html, Head, Body, Container, Section, Text, Link, Tailwind } from "@react-email/components";
const cn = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(" ");
// clsx's object form (\`{ hidden: isGift }\`).
const cx = (...inputs: Array<string | Record<string, unknown> | undefined>) => inputs.flatMap((i) => (typeof i === "string" ? [i] : i ? Object.keys(i).filter((k) => i[k]) : [])).join(" ");
const hiddenStyle = { display: "none" };
function upsellStyle(hide?: boolean) {
  return hide ? { display: "none" } : { padding: "8px" };
}
export default function ${name}({ name, isGift, hideUpsell = false, plan }: { name: string; isGift?: boolean; hideUpsell?: boolean; plan?: string }) {
  return <Html><Head /><Tailwind><Body className="bg-white font-sans"><Container>
    <Text>Hi {name}, your order has shipped.</Text>
    ${section}
      <Text>Your receipt total is $84.00.</Text>
      <Link href="https://acme.com/receipt">View receipt</Link>
    </Section>${section.startsWith("{") ? ")}" : ""}
  </Container></Body></Tailwind></Html>;
}
${name}.PreviewProps = ${props};`;
  it.each([
    ["a class list", `<Section className={cn("p-4", isGift && "hidden")}>`],
    ["a style", `<Section style={{ display: hideUpsell ? "none" : "block" }}>`],
    ["a list item's style", `{[{ name: "total", hidden: isGift }].map((item) => <Section key={item.name} style={{ display: item.hidden ? "none" : "block" }}>`],
    ["a style constant picked by a prop", `<Section style={isGift ? hiddenStyle : undefined}>`],
    ["a class list's object (clsx)", `<Section className={cx("p-4", { hidden: isGift })}>`],
    ["a style a function of the file gives", `<Section style={upsellStyle(hideUpsell)}>`],
  ])("in %s, fails the template (its content differs), and writes it", async (_, section) => {
    const dir = project({ "emails/shipped.tsx": template("Shipped", section, `{ name: "Ada" }`) });
    const out = io(dir);
    expect(await main(["emails", "--out", "migrated"], out, lib), out.out + out.err).toBe(2);
    expect(out.out).toMatch(/✗ emails\/shipped\.tsx: written, but its content differs: shown whatever the props, where the original shows or hides it by them: line \d+/);
    expect(fs.existsSync(path.join(dir, "migrated/shipped.tsx"))).toBe(true);
  });

  it("in a style imported from another file, fails the template", async () => {
    const dir = project({
      "emails/theme.ts": `export const text = { fontSize: "14px" };\nexport const offscreen = { display: "none" };\n`,
      "emails/shipped.tsx": template("Shipped", `<Section style={isGift ? offscreen : text}>`, `{ name: "Ada" }`).replace('const cn =', 'import { offscreen, text } from "./theme";\nconst cn ='),
    });
    const out = io(dir);
    expect(await main(["emails", "--out", "migrated"], out, lib), out.out + out.err).toBe(2);
    expect(out.out).toMatch(/✗ emails\/shipped\.tsx: written, but its content differs: shown whatever the props, where the original shows or hides it by them: line \d+: style=\{isGift \? offscreen : text\}/);
  });

  it.each([
    ["dark mode", `<Section className={plan === "free" ? "p-4 dark:hidden" : "p-4"}>`, "dark:hidden"],
    ["wider screens", `<Section className={plan === "app" ? "sm:hidden" : undefined}>`, "sm:hidden"],
  ])("in a Tailwind class that hides in %s, in a class list the preview props don't pick, fails the template", async (_, section, cls) => {
    const dir = project({ "emails/shipped.tsx": template("Shipped", section, `{ name: "Ada", plan: "pro" }`) });
    const out = io(dir);
    expect(await main(["emails", "--out", "migrated"], out, lib), out.out + out.err).toBe(2);
    expect(out.out).toContain(`${cls}, which the migration doesn't keep`);
  });

  it("passes a class chosen by a comparison: the migration keeps the condition (an element for each class list)", async () => {
    const dir = project({ "emails/shipped.tsx": template("Shipped", `<Section className={plan === "pro" ? "hidden" : "block"}>`, `{ name: "Ada" }`) });
    const out = io(dir);
    expect(await main(["emails", "--out", "migrated"], out, lib), out.out + out.err).toBe(0);
    expect(fs.readFileSync(path.join(dir, "migrated/shipped.tsx"), "utf8")).toContain('plan === "pro"');
  });
});

describe("templates a run mustn't skip (it would end with 0, having checked nothing)", () => {
  it("migrates a template another one only takes its PreviewProps from", async () => {
    const digest = `import { Html, Body, Text } from "@react-email/components";
import Welcome from "./welcome";
export default function Digest() { return <Html><Body><Text>Your digest</Text></Body></Html>; }
Digest.PreviewProps = { ...Welcome.PreviewProps };`;
    const welcome = `${good}\nT.PreviewProps = { name: "Ana" };`;
    const dir = project({ "emails/welcome.tsx": welcome, "emails/digest.tsx": digest });
    // In place (a dry run says what --write does): a template another one renders is left as it is; one it
    // only takes sample data from is migrated.
    const out = io(dir);
    expect(await main(["emails"], out, lib), out.out + out.err).toBe(0);
    expect(out.out).toMatch(/✓ emails\/welcome\.tsx/);
    expect(out.out).toMatch(/✓ emails\/digest\.tsx/);
  });

  it("loads a template that returns its email through a function of its own (`shell(<Text />)`), failing it with what to do, and leaves a renderer's helper", async () => {
    const shell = `import * as React from "react";
import { Html, Body, Text } from "@react-email/components";
const shell = (content: React.ReactNode) => <Html><Body>{content}</Body></Html>;
export default function Wrapped() { return shell(<Text>Wrapped in a shell</Text>); }`;
    const helper = `import { render } from "@react-email/components";
import Wrapped from "./wrapped";
export default function html() { return render(<Wrapped />); }`;
    const dir = project({ "emails/wrapped.tsx": shell, "emails/send.tsx": helper });
    const out = io(dir);
    // Not skipped as a helper (a run that ends with 0, having checked nothing): it fails, saying what to change.
    expect(await main(["emails", "--out", "migrated"], out, lib), out.out + out.err).toBe(2);
    expect(out.out).toMatch(/✗ emails\/wrapped\.tsx: couldn't convert it: A template return must be JSX: it returns what shell\(…\) builds/);
    expect(out.out).toMatch(/- emails\/send\.tsx: skipped/);
  });

  const welcome = `import { Html, Body, Text } from "@react-email/components";
export default function Welcome({ name }: { name: string }) { return <Html><Body><Text>Hello {name}, glad you are here.</Text></Body></Html>; }
Welcome.PreviewProps = { name: "Ada" };`;
  const migrated = (uses: string) => `import { Email, Row, Column, Paragraph } from "@unlayer/react-elements";
import type { ComponentProps } from "react";
import Welcome from "./welcome";
${uses}
export default function Reminder({ name }: Props) { return <Email><Row><Column><Paragraph>{name}, here's your code.</Paragraph></Column></Row></Email>; }`;

  it("checks a template another file names only in a type (`ComponentProps<typeof Welcome>`)", async () => {
    const dir = project({ "emails/welcome.tsx": welcome, "emails/reminder.tsx": migrated(`type Props = Pick<ComponentProps<typeof Welcome>, "name">;`) });
    const out = io(dir);
    expect(await main(["emails"], out, lib), out.out + out.err).toBe(0);
    expect(out.out).toMatch(/✓ emails\/welcome\.tsx/);
  });

  it("doesn't end with 0 when the only template is left as it is for a file that imports it, beside one already migrated", async () => {
    // The migrated template reads the React Email one as a value: it stays as it is, unchecked.
    const dir = project({ "emails/welcome.tsx": welcome, "emails/reminder.tsx": migrated(`type Props = { name: string };\nexport const from = Welcome.name;`) });
    const out = io(dir);
    expect(await main(["emails"], out, lib), out.out + out.err).toBe(1);
    expect(out.out).toMatch(/- emails\/welcome\.tsx: skipped: left as it is for emails\/reminder\.tsx/);
    expect(out.err).toMatch(/Templates left as they are weren't checked/);
  });

  it.each([
    [
      "picks its email with a condition (`locale === \"es\" ? Spanish(props) : English(props)`)",
      `import { Html, Body, Text } from "@react-email/components";
const English = (p: { name: string }) => <Html><Body><Text>Hello {p.name}</Text></Body></Html>;
const Spanish = (p: { name: string }) => <Html><Body><Text>Hola {p.name}</Text></Body></Html>;
export default function Welcome(props: { name: string; locale: string }) { return props.locale === "es" ? Spanish(props) : English(props); }`,
    ],
    [
      "returns what a function of its own builds (`return renderBody(p)`)",
      `import { Html, Body, Text } from "@react-email/components";
function renderBody(p: { name: string }) { return <Html><Body><Text>Thanks {p.name}</Text></Body></Html>; }
export default function Thanks(p: { name: string }) { return renderBody(p); }`,
    ],
  ])("doesn't skip a template that %s: it's loaded, and fails saying what to change", async (_, source) => {
    const dir = project({ "emails/t.tsx": source, "emails/real.tsx": `import { Html, Body, Text } from "@react-email/components";
export default function Real() { return <Html><Body><Text>Real one</Text></Body></Html>; }` });
    const out = io(dir);
    expect(await main(["emails"], out, lib), out.out + out.err).toBe(2);
    expect(out.out).toMatch(/✗ emails\/t\.tsx/);
  });

  it("fails a template that doesn't parse, saying where (it isn't skipped as a helper)", async () => {
    const dir = project({
      "emails/broken.tsx": `import { Html, Body, Text } from "@react-email/components";
export default function Broken() { return <Html><Body><Text>Hi</Text></Body></Html>;`,
      "emails/real.tsx": `import { Html, Body, Text } from "@react-email/components";
export default function Real() { return <Html><Body><Text>Real one</Text></Body></Html>; }`,
    });
    const out = io(dir);
    expect(await main(["emails"], out, lib), out.out + out.err).toBe(2);
    expect(out.out).toMatch(/✗ emails\/broken\.tsx: .*it doesn't parse \(line \d+/);
  });

  it("never loads a sender helper, whose call would send the email (a dry run calls the templates it loads)", async () => {
    const dir = project({});
    const marker = path.join(dir, "sent.txt");
    const sender = (call: string, setup: string) => `import fs from "node:fs";
import { Text } from "@react-email/components";
${setup}
export default function sendReceipt() { return ${call}; }`;
    const send = `(options: { react: unknown }) => { fs.appendFileSync(${JSON.stringify(marker)}, "sent\\n"); return Promise.resolve(options); }`;
    fs.mkdirSync(path.join(dir, "emails"), { recursive: true });
    fs.writeFileSync(path.join(dir, "emails/resend.tsx"), sender(`resend.emails.send({ to: "a@example.com", react: <Text>Receipt</Text> })`, `const resend = { emails: { send: ${send} } };`));
    fs.writeFileSync(path.join(dir, "emails/local.tsx"), sender(`sendEmail({ react: <Text>Receipt</Text> })`, `const sendEmail = ${send};`));
    const out = io(dir);
    await main(["emails"], out, lib);
    expect(fs.existsSync(marker), out.out + out.err).toBe(false);
    expect(out.out).toMatch(/- emails\/resend\.tsx: skipped/);
    expect(out.out).toMatch(/- emails\/local\.tsx: skipped/);
  });

  it("migrates a React Email template that imports an Elements type without `type`", async () => {
    const typed = `import { Html, Body, Text } from "@react-email/components";
import { ButtonProps } from "@unlayer/react-elements";
export default function T({ label = "Go" }: { label?: ButtonProps["children"] & string }) { return <Html><Body><Text>{label} there</Text></Body></Html>; }
T.PreviewProps = { label: "Go" };`;
    const dir = project({ "emails/typed.tsx": typed });
    const out = io(dir);
    expect(await main(["emails", "--out", "migrated"], out, lib), out.out + out.err).toBe(0);
    expect(out.out).toMatch(/✓ emails\/typed\.tsx/);
  });
});

describe("content the check reads beyond desktop text (compare)", () => {
  const elements = (body: string) => `import { Column, Email, Image, Paragraph, Row } from "@unlayer/react-elements";
export default function T() { return <Email backgroundColor="#ffffff"><Row><Column>${body}</Column></Row></Email>; }
`;
  const p = (text: string) => `<Paragraph color="#000000" fontSize="14px" lineHeight="24px" containerPadding="0px 0px 16px 0px">${text}</Paragraph>`;
  const original = (head: string, body: string) => `import { Html, Head, Body, Text, Img } from "@react-email/components";
export default function T() { return <Html><Head>${head ? `<style dangerouslySetInnerHTML={{ __html: ${JSON.stringify(head)} }} />` : ""}</Head><Body>${body}</Body></Html>; }
`;
  it("fails a list's numbering, dark-mode content or text hidden off the page the migration lost; lists phone styles as looks", async () => {
    const dir = project({
      "emails/steps.tsx": original("", `<Text>Next steps</Text><ol start={3}><li>Verify email</li></ol>`),
      "migrated/steps.tsx": elements(`${p("Next steps")}<Paragraph fontSize="16px" color="#000000" html="<ol><li>Verify email</li></ol>" containerPadding="0px 0px 16px 0px" />`),
      "emails/dark.tsx": original(".night{display:none} @media (prefers-color-scheme: dark) { .day{display:none !important} .night{display:block !important} }", `<Text className="day">Good morning</Text><Text className="night">Good night</Text>`),
      "migrated/dark.tsx": elements(p("Good morning")),
      "emails/away.tsx": original("", `<Text>Hi</Text><Text style={{ transform: "translateX(-9999px)" }}>Secret coupon</Text>`),
      "migrated/away.tsx": elements(`${p("Hi")}${p("Secret coupon")}`),
      "emails/phone.tsx": original("@media (max-width: 480px) { .big { color: #ff0000 !important } }", `<Text className="big">Red on phones</Text>`),
      "migrated/phone.tsx": elements(p("Red on phones")),
    });
    const compare = async (name: string) => {
      const out = io(dir);
      return { code: await main(["compare", `emails/${name}.tsx`, `migrated/${name}.tsx`], out, lib), out: out.out + out.err };
    };
    const steps = await compare("steps");
    expect(steps.code, steps.out).toBe(2);
    expect(steps.out).toMatch(/words CSS adds or hides.*list item: decimal from 3/);
    const dark = await compare("dark");
    expect(dark.code, dark.out).toBe(2);
    expect(dark.out).toContain('text no longer shown in dark mode: "night"');
    const away = await compare("away");
    expect(away.code, away.out).toBe(2);
    expect(away.out).toContain('extra text: "Secret", "coupon"');
    const phone = await compare("phone");
    expect(phone.code, phone.out).toBe(0);
    expect(phone.out).toMatch(/It looks different:\n {2}- shown in another style: color #ff0000 → #000000 on "Red", "on", "phones" on phones/);
  });
});

describe("files a run reads that aren't email templates of their own, or whose React Email it can't follow", () => {
  const welcome = `import { Html, Body, Text } from "@react-email/components";
export default function Welcome() { return <Html><Body><Text>Welcome aboard</Text></Body></Html>; }
Welcome.PreviewProps = {};
`;
  it("doesn't rewrite an app page that renders an email inside its own markup (--write)", async () => {
    const page = `import Welcome from "./welcome";
export default function PreviewPage() { return <main className="preview"><h1>Email preview</h1><Welcome /></main>; }
`;
    const dir = project({ "emails/welcome.tsx": welcome, "emails/preview-page.tsx": page });
    const out = io(dir);
    // Nothing to migrate that wouldn't change the page: the run says so (1).
    expect(await main(["emails", "--write"], out, lib), out.out + out.err).toBe(1);
    expect(fs.readFileSync(path.join(dir, "emails/preview-page.tsx"), "utf8")).toBe(page);
    expect(fs.readFileSync(path.join(dir, "emails/welcome.tsx"), "utf8")).toBe(welcome);
    expect(out.out).toMatch(/emails\/preview-page\.tsx: skipped: it renders an email inside other markup/);
  });

  it("doesn't end with 0 when a template is left unchecked for a preview that renders it, even as another is migrated (`migrate .`)", async () => {
    const receipt = `import { Html, Body, Text } from "@react-email/components";
export default function Receipt() { return <Html><Body><Text>Your receipt</Text></Body></Html>; }
Receipt.PreviewProps = {};
`;
    const preview = `import Welcome from "../emails/welcome";
export default function Preview() { return <main className="frame"><Welcome /></main>; }
`;
    const dir = project({ "emails/welcome.tsx": welcome, "emails/receipt.tsx": receipt, "previews/welcome.tsx": preview });
    const out = io(dir);
    expect(await main([".", "--write"], out, lib), out.out + out.err).toBe(1);
    expect(out.out).toMatch(/✓ emails\/receipt\.tsx/);
    expect(out.out).toMatch(/- emails\/welcome\.tsx: skipped: left as it is for previews\/welcome\.tsx, which renders it and isn't migrated here/);
    expect(out.err).toMatch(/Templates left as they are weren't checked/);
    expect(fs.readFileSync(path.join(dir, "emails/welcome.tsx"), "utf8")).toBe(welcome);
    expect(fs.readFileSync(path.join(dir, "previews/welcome.tsx"), "utf8")).toBe(preview);
  });

  it.each([
    ["a Next.js app router page whose root is the template", "src/app/emails/welcome/page.tsx", "../../../emails/welcome", "<Welcome />", {}],
    ["a Next.js app router page around it", "src/app/preview/page.tsx", "../../emails/welcome", '<main className="frame"><Welcome /></main>', {}],
    ["a Next.js pages router page", "src/pages/preview.tsx", "../emails/welcome", "<Welcome />", { "next.config.js": "module.exports = {};\n" }],
    ["a Remix route", "app/routes/preview.tsx", "../../src/emails/welcome", "<Welcome />", {}],
  ])("leaves %s as it is, and migrates the template it renders (`migrate .`)", async (_kind, file, specifier, jsx, extra) => {
    const page = `import Welcome from "${specifier}";
// Shows the welcome email in the app.
export default function Page() { return ${jsx}; }
`;
    const dir = project({ "src/emails/welcome.tsx": welcome, [file]: page, ...extra });
    const out = io(dir);
    expect(await main([".", "--write"], out, lib), out.out + out.err).toBe(0);
    expect(out.out).toMatch(/✓ src\/emails\/welcome\.tsx/);
    // It's named as a file that now renders the migrated template.
    expect(out.out).toContain(`Still using a migrated template`);
    expect(out.out).toContain(`  ${file} → src/emails/welcome.tsx`);
    // The page isn't rewritten as an email (its copy of the template's markup would go stale): it renders the migrated one.
    expect(fs.readFileSync(path.join(dir, file), "utf8")).toBe(page);
    expect(fs.readFileSync(path.join(dir, "src/emails/welcome.tsx"), "utf8")).toContain("@unlayer/react-elements");
  });

  it("lists a template that requires React Email (not left out without a word)", async () => {
    const required = `const { Html, Body, Text } = require("@react-email/components");
export default function Welcome() { return <Html><Body><Text>Welcome aboard</Text></Body></Html>; }
Welcome.PreviewProps = {};
`;
    const dir = project({ "emails/welcome.tsx": required });
    const out = io(dir);
    expect(await main(["emails", "--out", "migrated"], out, lib), out.out + out.err).toBe(2);
    expect(out.out).toMatch(/✗ emails\/welcome\.tsx: couldn't load it/);
  });

  it("lists a file with no default export as skipped, saying why, whether it imports React Email or the project's file that does", async () => {
    const named = (from: string, name: string) => `import { Html, Body, Text } from "${from}";\nexport const ${name} = ({ count }: { count: number }) => <Html><Body><Text>{count} sent</Text></Body></Html>;\n${name}.PreviewProps = { count: 3 };\n`;
    const dir = project({
      "components/ui.ts": `export * from "@react-email/components";\n`,
      "emails/welcome.tsx": `import { Html, Body, Text } from "../components/ui";\nexport default function Welcome() { return <Html><Body><Text>Welcome aboard</Text></Body></Html>; }\n`,
      "emails/bulk.tsx": named("../components/ui", "BulkEmail"),
      "emails/direct.tsx": named("@react-email/components", "DirectEmail"),
    });
    const skipped = (file: string) => new RegExp(`- emails/${file}: skipped: no default-exported component \\(a shared component or helper file\\)`);
    for (const flags of [[], ["--out", "migrated"]]) {
      const out = io(dir);
      expect(await main(["emails", ...flags], out, lib), out.out + out.err).toBe(0);
      expect(out.out).toMatch(skipped("bulk.tsx"));
      expect(out.out).toMatch(skipped("direct.tsx"));
    }
    // On its own, it's listed the same way, and the run says it checked nothing.
    for (const file of ["bulk.tsx", "direct.tsx"]) {
      const out = io(dir);
      expect(await main([`emails/${file}`], out, lib), out.out + out.err).toBe(1);
      expect(out.out).toMatch(skipped(file));
      expect(out.err).toContain("No email template was checked");
    }
  });

  it("lists a template whose React Email comes from a package the run doesn't follow, and fails the run", async () => {
    const dir = project({
      "node_modules/@acme/emails/package.json": JSON.stringify({ name: "@acme/emails", main: "index.js" }),
      "node_modules/@acme/emails/index.js": `export { Html, Body, Text } from "@react-email/components";\n`,
      "emails/welcome.tsx": welcome,
      "emails/notice.tsx": `import { Html, Body, Text } from "@acme/emails";
export default function Notice() { return <Html><Body><Text>Heads up</Text></Body></Html>; }
Notice.PreviewProps = {};
`,
    });
    const out = io(dir);
    expect(await main(["emails", "--out", "migrated"], out, lib), out.out + out.err).toBe(2);
    expect(out.out).toMatch(/emails\/notice\.tsx: .*it has PreviewProps, as a React Email template does, but the run can't find its React Email/);
  });

  it("asks for --allow-dirty to replace a design next to a template (--write --overwrite) that git can't restore", async () => {
    const dir = project({ "emails/welcome.tsx": welcome, "emails/welcome.design.json": "{\"body\":{\"rows\":[]},\"counters\":{}}\n" });
    // Edited in the editor since: not committed.
    fs.writeFileSync(path.join(dir, "emails/welcome.design.json"), "{\"body\":{\"rows\":[\"edited\"]},\"counters\":{}}\n");
    const out = io(dir);
    expect(await main(["emails", "--write", "--design", "--overwrite"], out, lib), out.out + out.err).toBe(2);
    expect(out.out).toContain("--overwrite would replace emails/welcome.design.json (");
    expect(fs.readFileSync(path.join(dir, "emails/welcome.design.json"), "utf8")).toContain("edited");
    expect(fs.readFileSync(path.join(dir, "emails/welcome.tsx"), "utf8")).toBe(welcome);
    expect(await main(["emails", "--write", "--design", "--overwrite", "--allow-dirty"], io(dir), lib)).toBe(0);
    expect(fs.readFileSync(path.join(dir, "emails/welcome.design.json"), "utf8")).not.toContain("edited");
  });

  it("doesn't replace a design in the --out folder that a run didn't write as it is (made or edited in the editor) when git can't restore it", async () => {
    const dir = project({ "emails/welcome.tsx": welcome });
    // A run wrote the template and its design; then the design was made again in the editor, saved over it, not committed.
    expect(await main(["emails", "--out", "migrated", "--design"], io(dir), lib)).toBe(0);
    const written = fs.readFileSync(path.join(dir, "migrated/welcome.design.json"), "utf8");
    const mine = `${JSON.stringify({ counters: { u_row: 1 }, body: { id: "mine", rows: [{ id: "edited-in-the-editor" }] }, schemaVersion: 16 })}\n`;
    fs.writeFileSync(path.join(dir, "migrated/welcome.design.json"), mine);
    fs.writeFileSync(path.join(dir, "migrated/welcome.tsx"), withContentHash("/** @jsxRuntime automatic */\n// Migrated from React Email by @unlayer/migrate (codemod mode).\nexport const earlier = 1;\n"));
    const out = io(dir);
    expect(await main(["emails", "--out", "migrated", "--design", "--overwrite"], out, lib), out.out + out.err).toBe(2);
    expect(out.out).toMatch(/--overwrite would replace migrated\/welcome\.design\.json \(not (committed|in a git repository)\), a design that isn't the one this run writes/);
    expect(fs.readFileSync(path.join(dir, "migrated/welcome.design.json"), "utf8")).toBe(mine);
    // The template with it isn't written either: the two stay a pair.
    expect(fs.readFileSync(path.join(dir, "migrated/welcome.tsx"), "utf8")).toContain("export const earlier = 1;");
    // Committed, git can restore it: replaced.
    commit(dir);
    expect(await main(["emails", "--out", "migrated", "--design", "--overwrite"], io(dir), lib)).toBe(0);
    expect(fs.readFileSync(path.join(dir, "migrated/welcome.design.json"), "utf8")).toBe(written);
    // The same design a run writes again isn't someone's work: replaced, committed or not.
    fs.writeFileSync(path.join(dir, "migrated/welcome.design.json"), written);
    fs.writeFileSync(path.join(dir, "migrated/welcome.tsx"), withContentHash("/** @jsxRuntime automatic */\n// Migrated from React Email by @unlayer/migrate (codemod mode).\nexport const earlier = 2;\n"));
    expect(await main(["emails", "--out", "migrated", "--design", "--overwrite"], io(dir), lib)).toBe(0);
    expect(fs.readFileSync(path.join(dir, "migrated/welcome.tsx"), "utf8")).toContain("@unlayer/react-elements");
    // Not one a run wrote at all, with no template next to it: kept the same way.
    fs.rmSync(path.join(dir, "migrated"), { recursive: true });
    fs.mkdirSync(path.join(dir, "migrated"));
    // (Another one than the design committed above: git can't restore it.)
    const theirs = mine.replace("edited-in-the-editor", "made-in-the-editor");
    fs.writeFileSync(path.join(dir, "migrated/welcome.design.json"), theirs);
    const again = io(dir);
    expect(await main(["emails", "--out", "migrated", "--design", "--overwrite"], again, lib), again.out + again.err).toBe(2);
    expect(fs.readFileSync(path.join(dir, "migrated/welcome.design.json"), "utf8")).toBe(theirs);
    expect(fs.existsSync(path.join(dir, "migrated/welcome.tsx"))).toBe(false);
    expect(await main(["emails", "--out", "migrated", "--design", "--overwrite", "--allow-dirty"], io(dir), lib)).toBe(0);
    expect(fs.readFileSync(path.join(dir, "migrated/welcome.design.json"), "utf8")).toBe(written);
  });
});

describe("a design file that can't be written", () => {
  // The template puts a file where its design goes when it's loaded to be checked: after the run reserved that path.
  const makesDesign = `import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { Html, Body, Text } from "@react-email/components";
fs.writeFileSync(fileURLToPath(import.meta.url).replace(/\\.tsx$/, ".design.json"), "MINE");
export default function Welcome() { return <Html><Body><Text>Keep the template</Text></Body></Html>; }
`;
  it("leaves the template as it was with --write", async () => {
    const dir = project({ "emails/welcome.tsx": makesDesign });
    const out = io(dir);
    expect(await main(["emails", "--write", "--design"], out, lib), out.out + out.err).not.toBe(0);
    expect(out.out).toMatch(/couldn't write output: .*appeared during the run/);
    expect(fs.readFileSync(path.join(dir, "emails/welcome.tsx"), "utf8")).toBe(makesDesign);
    expect(fs.readFileSync(path.join(dir, "emails/welcome.design.json"), "utf8")).toBe("MINE");
  });
});

describe("--write never replaces an edit made during the run", () => {
  // The template edits its own file when it's loaded to be checked: after the run read it to convert it.
  const editsItself = `import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { Html, Body, Text } from "@react-email/components";
const self = fileURLToPath(import.meta.url);
const mark = ["// edited", "during the run"].join(" ");
if (!fs.readFileSync(self, "utf8").includes(mark)) fs.appendFileSync(self, \`\\n\${mark}\\n\`);
export default function Welcome() { return <Html><Body><Text>Keep the edit</Text></Body></Html>; }
`;
  for (const flags of [[], ["--allow-dirty"]]) {
    it(`keeps the edit and fails the template${flags.length ? " (with --allow-dirty too)" : ""}`, async () => {
      const dir = project({ "emails/welcome.tsx": editsItself });
      const out = io(dir);
      expect(await main(["emails", "--write", ...flags], out, lib), out.out + out.err).toBe(2);
      expect(out.out).toMatch(flags.length ? /it changed while the run converted it: not replaced/ : /it changed during the run, and git couldn't restore it \(changed since the last commit\): not replaced/);
      const now = fs.readFileSync(path.join(dir, "emails/welcome.tsx"), "utf8");
      expect(now).toContain("// edited during the run");
      expect(now).toContain("@react-email/components");
    });
  }
});

describe("--write only replaces what git can restore", () => {
  it("refuses templates git was told not to look at (skip-worktree, assume-unchanged), changed or not", async () => {
    const dir = project({ "emails/welcome.tsx": good, "emails/other.tsx": good.replace("Keep the original", "Other") });
    execFileSync("git", ["update-index", "--skip-worktree", "emails/welcome.tsx"], { cwd: dir });
    execFileSync("git", ["update-index", "--assume-unchanged", "emails/other.tsx"], { cwd: dir });
    const edited = good.replace("Keep the original", "Keep the edited original");
    fs.writeFileSync(path.join(dir, "emails/welcome.tsx"), edited);
    const out = io(dir);
    expect(await main(["emails", "--write"], out, lib), out.out + out.err).toBe(1);
    expect(out.err).toContain("emails/welcome.tsx (marked in git so its changes don't show (skip-worktree or assume-unchanged))");
    expect(out.err).toContain("emails/other.tsx (marked in git so its changes don't show");
    expect(fs.readFileSync(path.join(dir, "emails/welcome.tsx"), "utf8")).toBe(edited);
  });

  it("refuses templates with uncommitted changes, untracked ones and ones outside a repository, before running anything", async () => {
    const dir = project({ "emails/welcome.tsx": good, "emails/other.tsx": neverLoad.replace("must not load", "other") });
    fs.writeFileSync(path.join(dir, "emails/welcome.tsx"), good.replace("Keep the original", "Keep the edited original"));
    fs.writeFileSync(path.join(dir, "emails/new.tsx"), neverLoad);
    const out = io(dir);
    expect(await main(["emails", "--write"], out, lib), out.out + out.err).toBe(1);
    expect(out.err).toContain("emails/welcome.tsx (changed since the last commit)");
    expect(out.err).toContain("emails/new.tsx (not committed)");
    expect(out.err).not.toContain("emails/other.tsx");
    expect(out.out).toBe("");
    expect(fs.readFileSync(path.join(dir, "emails/new.tsx"), "utf8")).toBe(neverLoad);
    // Outside a repository: nothing git could restore.
    const loose = fs.mkdtempSync(path.join(tmpdir(), "unlayer-loose-"));
    dirs.push(loose);
    fs.mkdirSync(path.join(loose, "emails"));
    fs.writeFileSync(path.join(loose, "emails/welcome.tsx"), good);
    const outside = io(loose);
    expect(await main(["emails", "--write"], outside, lib)).toBe(1);
    expect(outside.err).toContain("emails/welcome.tsx (not in a git repository)");
    expect(fs.readFileSync(path.join(loose, "emails/welcome.tsx"), "utf8")).toBe(good);
  });

  it("replaces committed templates, which git can then restore; --allow-dirty and --out don't need git", async () => {
    const dir = project({ "emails/welcome.tsx": good });
    expect(await main(["emails", "--write"], io(dir), lib)).toBe(0);
    expect(fs.readFileSync(path.join(dir, "emails/welcome.tsx"), "utf8")).toContain("@unlayer/react-elements");
    execFileSync("git", ["checkout", "--", "emails/welcome.tsx"], { cwd: dir });
    expect(fs.readFileSync(path.join(dir, "emails/welcome.tsx"), "utf8")).toBe(good);
    fs.writeFileSync(path.join(dir, "emails/welcome.tsx"), good.replace("Keep the original", "Keep the edited original"));
    expect(await main(["emails", "--write", "--allow-dirty"], io(dir), lib)).toBe(0);
    const replaced = fs.readFileSync(path.join(dir, "emails/welcome.tsx"), "utf8");
    expect(replaced).toContain("@unlayer/react-elements");
    expect(replaced).toContain("Keep the edited original");
    const loose = fs.mkdtempSync(path.join(tmpdir(), "unlayer-loose-"));
    dirs.push(loose);
    fs.writeFileSync(path.join(loose, "welcome.tsx"), good);
    expect(await main(["welcome.tsx", "--out", "migrated"], io(loose), lib)).toBe(0);
    expect(fs.readFileSync(path.join(loose, "welcome.tsx"), "utf8")).toBe(good);
  });
});

describe("--write keeps", () => {
  it("each template's permissions", async () => {
    const dir = project({ "emails/welcome.tsx": good });
    fs.chmodSync(path.join(dir, "emails/welcome.tsx"), 0o664);
    const out = io(dir);
    expect(await main(["emails", "--write", "--allow-dirty"], out, lib), out.out + out.err).toBe(0);
    expect(fs.statSync(path.join(dir, "emails/welcome.tsx")).mode & 0o777).toBe(0o664);
  });
});

describe("--out", () => {
  it("checks a template with the project's import aliases in an output folder outside the project", async () => {
    const dir = project({
      "app/tsconfig.json": JSON.stringify({ compilerOptions: { baseUrl: ".", paths: { "@/*": ["./*"] } } }),
      "app/lib/brand.ts": `export const BRAND = "Acme";\n`,
      "app/emails/welcome.tsx": `import { Html, Body, Text } from "@react-email/components";\nimport { BRAND } from "@/lib/brand";\nexport default function Welcome() { return <Html><Body><Text>Welcome to {BRAND}</Text></Body></Html>; }`,
    });
    const out = io(path.join(dir, "app"));
    expect(await main(["emails", "--out", "../migrated"], out, lib), out.out + out.err).toBe(0);
    expect(fs.readFileSync(path.join(dir, "migrated/welcome.tsx"), "utf8")).toContain("@unlayer/react-elements");
  });
});

describe("what --write leaves for the templates that use it", () => {
  const wrap = "export const withTracking = (component: any) => component;\n";
  const read = (dir: string, file: string) => fs.readFileSync(path.join(dir, file), "utf8");

  it("leaves a template a failing one renders through a file of named components", async () => {
    const base = `import * as React from "react";
import { Html, Body, Heading } from "@react-email/components";
export default function Base({ heading = "Notice", content }: { heading?: string; content?: React.ReactNode }) { return <Html><Body><Heading>{heading}</Heading>{content}</Body></Html>; }`;
    const dir = project({
      "lib/wrap.ts": wrap,
      "emails/components/base.tsx": base,
      "emails/components/shells.tsx": `import { Text } from "@react-email/components";\nimport Base from "./base";\nexport function Notice({ text }: { text: string }) { return <Base heading="Notice" content={<Text>{text}</Text>} />; }`,
      "emails/welcome.tsx": `import { Notice } from "./components/shells";\nexport default function Welcome() { return <Notice text="Welcome aboard" />; }\nWelcome.PreviewProps = {};`,
      "emails/alert.tsx": `import { Notice } from "./components/shells";\nimport { withTracking } from "../lib/wrap";\nfunction Alert() { return <Notice text="Your account needs attention" />; }\nexport default withTracking(Alert);`,
    });
    const out = io(dir);
    expect(await main(["emails", "--write"], out, lib), out.out + out.err).toBe(2);
    expect(out.out).toMatch(/✗ emails\/alert\.tsx/);
    expect(out.out).toMatch(/- emails\/components\/base\.tsx: skipped: left as it is for emails\/alert\.tsx/);
    expect(read(dir, "emails/components/base.tsx")).toBe(base);
    expect(read(dir, "emails/welcome.tsx")).toContain("@unlayer/react-elements");
  });

  it("leaves a template a failing one takes by another name than default (export { Promo })", async () => {
    const promo = `import { Html, Body, Text } from "@react-email/components";\nfunction Promo({ code = "SAVE10" }: { code?: string }) { return <Html><Body><Text>Use {code} today</Text></Body></Html>; }\nPromo.PreviewProps = {};\nexport { Promo };\nexport default Promo;`;
    const dir = project({
      "lib/wrap.ts": wrap,
      "emails/promo.tsx": promo,
      "emails/weekly.tsx": `import { Promo } from "./promo";\nimport { withTracking } from "../lib/wrap";\nfunction Weekly() { return <Promo code="WEEK" />; }\nexport default withTracking(Weekly);`,
    });
    const out = io(dir);
    expect(await main(["emails", "--write"], out, lib), out.out + out.err).toBe(2);
    expect(read(dir, "emails/promo.tsx")).toBe(promo);
  });

  it("migrates a template another imports only a value from, in one run", async () => {
    const dir = project({
      "emails/welcome.tsx": `import { Html, Body, Text } from "@react-email/components";\nexport const brand = "Acme";\nexport default function Welcome() { return <Html><Body><Text>Welcome to {brand}</Text></Body></Html>; }\nWelcome.PreviewProps = {};`,
      "emails/reset.tsx": `import { Html, Body, Text } from "@react-email/components";\nimport { brand } from "./welcome";\nexport default function Reset() { return <Html><Body><Text>Reset your {brand} password</Text></Body></Html>; }\nReset.PreviewProps = {};`,
    });
    for (const flags of [[], ["--write"]]) {
      const out = io(dir);
      expect(await main(["emails", ...flags], out, lib), out.out + out.err).toBe(0);
      expect(out.out).toContain("2 templates: 2 migrated and checked");
    }
    const { default: Reset } = await import(path.join(dir, "emails/reset.tsx"));
    const { renderToHtml } = await import("@unlayer/react-elements");
    expect(renderToHtml(Reset({}))).toContain("Reset your Acme password");
  });

  it("migrates templates a mailer outside the folder sends, when one takes only a constant from it", async () => {
    const dir = project({
      "lib/email.tsx": `import { render } from "@react-email/components";\nimport Invite from "../emails/invite";\nimport Reset from "../emails/reset";\nexport const BRAND = "Acme";\nexport const sendInvite = () => render(<Invite />);\nexport const sendReset = () => render(<Reset name="Ada" />);`,
      "emails/welcome.tsx": `import { Html, Body, Text } from "@react-email/components";\nimport { BRAND } from "../lib/email";\nexport default function Welcome() { return <Html><Body><Text>Welcome to {BRAND}</Text></Body></Html>; }\nWelcome.PreviewProps = {};`,
      "emails/invite.tsx": `import * as React from "react";\nimport { Html, Body, Text } from "@react-email/components";\nexport default function Invite({ note }: { note?: React.ReactNode }) { return <Html><Body><Text>You're invited</Text>{note}</Body></Html>; }\nInvite.PreviewProps = {};`,
      "emails/reset.tsx": `import * as React from "react";\nimport { Html, Body, Text } from "@react-email/components";\ninterface ResetProps { name: string }\nconst Reset: React.FC<ResetProps> = ({ name }) => <Html><Body><Text>Reset it, {name}</Text></Body></Html>;\nexport default Reset;`,
    });
    const out = io(dir);
    expect(await main(["emails", "--write"], out, lib), out.out + out.err).toBe(0);
    expect(out.out).toContain("3 templates: 3 migrated and checked");
  });

  it("migrates a template once the one that renders it is written, in the same run, and a dry run says so", async () => {
    const welcome = `import { Html, Body, Text } from "@react-email/components";\nexport default function Welcome({ name = "Ada", pro = false }: { name?: string; pro?: boolean }) { return <Html><Body><Text>Welcome {name}</Text>{pro ? <Text>Thanks for going Pro</Text> : null}</Body></Html>; }\nWelcome.PreviewProps = { name: "Ada" };`;
    const dir = project({
      "emails/welcome.tsx": welcome,
      "emails/welcome-pro.tsx": `import Welcome from "./welcome";\nexport default function WelcomePro({ name = "Ada" }: { name?: string }) { return <Welcome name={name} pro />; }\nWelcomePro.PreviewProps = { name: "Ada" };`,
    });
    const dry = io(dir);
    expect(await main(["emails"], dry, lib), dry.out + dry.err).toBe(0);
    expect(dry.out).toContain("2 templates: 2 migrated and checked");
    const out = io(dir);
    expect(await main(["emails", "--write"], out, lib), out.out + out.err).toBe(0);
    expect(out.out).toContain("2 templates: 2 migrated and checked");
    expect(read(dir, "emails/welcome.tsx")).toContain("@unlayer/react-elements");
    expect(read(dir, "emails/welcome-pro.tsx")).not.toContain('from "./welcome"');
  });

  it("doesn't leave an import an inlined component brought for a default the template replaces", async () => {
    const dir = project({
      "lib/brand.ts": `export const brand = { primary: "#4f46e5" };\n`,
      "components/cta.tsx": `import { Button } from "@react-email/components";\nimport { brand } from "../lib/brand";\nexport function CTA({ href, color = brand.primary, label }: { href: string; color?: string; label: string }) { return <Button href={href} style={{ backgroundColor: color }}>{label}</Button>; }`,
      "emails/welcome.tsx": `import { Html, Body } from "@react-email/components";\nimport { CTA } from "../components/cta";\nexport default function Welcome() { return <Html><Body><CTA href="https://example.com" color="#000000" label="Start" /></Body></Html>; }`,
    });
    const out = io(dir);
    expect(await main(["emails", "--out", "migrated"], out, lib), out.out + out.err).toBe(0);
    const migrated = read(dir, "migrated/welcome.tsx");
    expect(migrated).not.toMatch(/\bbrand\b/);
    expect(migrated).toContain('backgroundColor="#000000"');
  });

  it("lists the files it left that still use a template it replaced", async () => {
    const dir = project({
      "emails/welcome.tsx": good,
      "emails/send.tsx": `import { render } from "@react-email/components";\nimport Welcome from "./welcome";\nexport async function sendWelcome() { return render(<Welcome />); }`,
    });
    const out = io(dir);
    expect(await main(["emails", "--write"], out, lib), out.out + out.err).toBe(0);
    expect(out.out).toMatch(/Still using a migrated template[^\n]*\n  emails\/send\.tsx → emails\/welcome\.tsx/);
  });

  it("lists the project's files that use a template it replaced, outside the folder given too (`migrate emails --write`)", async () => {
    const welcome = `import { Html, Body, Text } from "@react-email/components";\nexport function Welcome() { return <Html><Body><Text>Welcome aboard</Text></Body></Html>; }\nexport default Welcome;\n`;
    const dir = project({
      "package.json": JSON.stringify({ name: "app", private: true, type: "module" }),
      "tsconfig.json": JSON.stringify({ compilerOptions: { jsx: "react-jsx", baseUrl: ".", paths: { "@/*": ["./*"] } } }),
      "emails/welcome.tsx": welcome,
      // A route that renders it with React Email (through an alias), and one that sends it with a sender's `react:`.
      "app/api/send/route.ts": `import { render } from "@react-email/components";\nimport * as React from "react";\nimport WelcomeEmail from "@/emails/welcome";\nexport async function GET() { return new Response(await render(React.createElement(WelcomeEmail))); }\n`,
      "lib/send.tsx": `import { Welcome } from "../emails/welcome";\nexport const send = (resend: any) => resend.emails.send({ react: <Welcome /> });\n`,
      // Through an index that passes it on, and with require.
      "lib/emails.ts": `export { default as WelcomeEmail } from "../emails/welcome";\n`,
      "lib/mailer.ts": `import { WelcomeEmail } from "./emails";\nexport const mail = () => WelcomeEmail({});\n`,
      "scripts/preview.cjs": `const welcome = require("../emails/welcome");\nmodule.exports = welcome;\n`,
      "emails/welcome.test.tsx": `import Welcome from "./welcome";\nexport const rendered = <Welcome />;\n`,
      // Not users: only its sample data or its type, build output and packages.
      "lib/sample.ts": `import Welcome from "../emails/welcome";\nexport const sample = Welcome.PreviewProps;\n`,
      "lib/types.ts": `import type Welcome from "../emails/welcome";\nexport type Props = Parameters<typeof Welcome>[0];\n`,
      ".next/server/route.js": `import Welcome from "../../emails/welcome";\nexport default Welcome;\nWelcome();\n`,
      "dist/route.js": `import Welcome from "../emails/welcome";\nWelcome();\n`,
    });
    const out = io(dir);
    expect(await main(["emails", "--write"], out, lib), out.out + out.err).toBe(0);
    const listed = /Still using a migrated template: render it with renderToHtml\(\) from @unlayer\/react-elements[^\n]*\n((?:  [^\n]*\n)*)/.exec(out.out)?.[1];
    expect(listed, out.out).toBe(
      ["app/api/send/route.ts", "emails/welcome.test.tsx", "lib/mailer.ts", "lib/send.tsx", "scripts/preview.cjs"].map((file) => `  ${file} → emails/welcome.tsx\n`).join("")
    );
    // Run from the folder itself, the same files (named from there).
    const again = project({ "package.json": JSON.stringify({ name: "app", private: true, type: "module" }), "emails/welcome.tsx": welcome, "lib/send.tsx": `import { Welcome } from "../emails/welcome";\nexport const send = () => <Welcome />;\n` });
    const inside = io(path.join(again, "emails"));
    expect(await main([".", "--write"], inside, lib), inside.out + inside.err).toBe(0);
    expect(inside.out).toContain("\n  ../lib/send.tsx → welcome.tsx\n");
  });

  it("refuses --write when a template imports a module by a computed path", async () => {
    const welcome = `import { Html, Body, Text } from "@react-email/components";\nconst theme = (name: string) => require(\`./themes/\${name}\`);\nexport default function Welcome() { return <Html><Body><Text>Welcome {String(Boolean(theme))}</Text></Body></Html>; }`;
    const dir = project({ "emails/welcome.tsx": welcome });
    const out = io(dir);
    expect(await main(["emails", "--write"], out, lib), out.out + out.err).toBe(2);
    expect(out.err).toContain("emails/welcome.tsx");
    expect(read(dir, "emails/welcome.tsx")).toBe(welcome);
  });
});


describe("installing Elements, which the migrated templates import", () => {
  /** A project outside the workspace (no Elements there), with these files. */
  function outside(files: Record<string, string>): string {
    const app = fs.mkdtempSync(path.join(tmpdir(), "unlayer-install-"));
    dirs.push(app);
    for (const [file, text] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(path.join(app, file)), { recursive: true });
      fs.writeFileSync(path.join(app, file), text);
    }
    return app;
  }

  it("is said after a run writes where the import doesn't resolve, with the project's package manager", async () => {
    const dir = project({ "emails/welcome.tsx": good });
    // In the workspace, it resolves: nothing to install.
    const inside = io(dir);
    expect(await main(["emails", "--out", "migrated"], inside, lib), inside.out + inside.err).toBe(0);
    expect(inside.out).not.toContain("Install Elements");
    for (const [lockfile, command] of [["pnpm-lock.yaml", "pnpm add"], ["yarn.lock", "yarn add"], ["bun.lock", "bun add"], ["package-lock.json", "npm install"], [undefined, "npm install"]] as const) {
      const app = outside({ "package.json": "{}", ...(lockfile ? { [lockfile]: "" } : {}) });
      const out = io(dir);
      expect(await main(["emails", "--out", path.join(app, "emails")], out, lib), out.out + out.err).toBe(0);
      expect(out.out, command).toContain(`\nInstall Elements in ${path.relative(dir, app)}: ${command} "@unlayer/react-elements@^0.2.0"\n`);
      // A dry run writes nothing: nothing to install yet.
      const dry = io(app);
      fs.mkdirSync(path.join(app, "drafts"));
      fs.writeFileSync(path.join(app, "drafts/welcome.tsx"), good);
      expect(await main([path.join(dir, "emails")], dry, lib)).toBe(0);
      expect(dry.out).not.toContain("Install Elements");
    }
  });

  it("stops the run before anything is written where the migrated templates would get an Elements older than they need", async () => {
    const dir = project({ "emails/welcome.tsx": good });
    const app = outside({
      "package.json": "{}",
      "yarn.lock": "",
      "node_modules/@unlayer/react-elements/package.json": JSON.stringify({ name: "@unlayer/react-elements", version: "0.1.22", exports: { "./package.json": "./package.json" } }),
    });
    const out = io(dir);
    expect(await main(["emails", "--out", path.join(app, "emails")], out, lib), out.out + out.err).toBe(1);
    expect(out.err).toContain("needs @unlayer/react-elements ^0.2.0, but this project has 0.1.22");
    expect(out.err).toContain('yarn add "@unlayer/react-elements@^0.2.0"');
    expect(fs.existsSync(path.join(app, "emails"))).toBe(false);
  });
});

describe("what the run says about a template", () => {
  it("says which text a style leaves unreadable, and doesn't call it a converter bug", async () => {
    // A color a section picks from a prop for its text, which the migration lists as a lost style: the text is black
    // on the dark page.
    const dark = `import { Body, Container, Html, Section, Text } from "@react-email/components";
const TONE: Record<string, string> = { good: "#a8ff53", bad: "#ff5353" };
export default function Dark({ tone = "good" }: { tone?: string }) {
  const accent = TONE[tone] ?? TONE.good;
  return <Html><Body style={{ backgroundColor: "#15171a" }}><Container><Section style={{ color: accent }}><Text>Watch update</Text></Section><Text style={{ color: "#d7d9dd" }}>Body copy</Text></Container></Body></Html>;
}
Dark.PreviewProps = { tone: "good" };`;
    const dir = project({ "emails/dark.tsx": dark });
    const out = io(dir);
    expect(await main(["emails", "--out", "migrated", "--report", "report.md"], out, lib), out.out + out.err).toBe(2);
    expect(out.out).toContain('✗ emails/dark.tsx: written, but it failed the check: text no longer visible: "Watch update" is #000000 on #15171a → migrated/dark.tsx\n');
    expect(out.out).toContain("\n1 template: 0 migrated and checked, 1 failed the check. 1 written.");
    expect(out.out).not.toMatch(/shown shown|another place|converter bug/);
    const report = fs.readFileSync(path.join(dir, "report.md"), "utf8");
    expect(report).toContain('**Shown elsewhere, or not at all:**\n- text no longer visible: "Watch update" is #000000 on #15171a\n');
    expect(report).not.toContain("shown shown");
  });

  it("says what it couldn't verify on the words it's about, or on none, and doesn't call it a converter bug", async () => {
    const unread = `import { Body, Html, Text } from "@react-email/components";
export default function T() { return <Html><Body><Text style={{ font: "inherit" }}>Hello there</Text></Body></Html>; }`;
    const lost = `import { Body, Html, Text } from "@react-email/components";
export default function T() {
  const text = import.meta.url.includes(".unlayer-migrate-") ? "Changed" : "Keep this content";
  return <Html><Body><Text>{text}</Text></Body></Html>;
}`;
    const dir = project({ "emails/unread.tsx": unread, "emails/lost.tsx": lost });
    const out = io(dir);
    expect(await main(["emails"], out, lib), out.out + out.err).toBe(2);
    expect(out.out).toContain('✗ emails/unread.tsx: check failed: couldn\'t verify: whether "Hello", "there" show (font: inherit)');
    // Only the template that lost words is a converter bug.
    expect(out.out).toContain("\n2 templates: 0 migrated and checked, 2 failed the check (1 with content that differs: a converter bug, please report it).");
    // Head content in the email's body carries no words: what couldn't be verified is said on none.
    const migrated = `import { Column, Email, Paragraph, Row } from "@unlayer/react-elements";
export default function T() { return <Email backgroundColor="#ffffff"><meta name="color-scheme" content="light only" /><Row><Column><Paragraph color="#000000" fontSize="14px" lineHeight="24px" containerPadding="0px 0px 16px 0px">Hello there</Paragraph></Column></Row></Email>; }
`;
    const plain = `import { Body, Html, Text } from "@react-email/components";
export default function T() { return <Html><Body><Text>Hello there</Text></Body></Html>; }`;
    const compareDir = project({ "emails/plain.tsx": plain, "migrated/plain.tsx": migrated });
    const compared = io(compareDir);
    expect(await main(["compare", "emails/plain.tsx", "migrated/plain.tsx"], compared, lib), compared.out + compared.err).toBe(2);
    expect(compared.out).toContain("  - couldn't verify: whether it shows (the migrated template writes head content inside the email's body, a second document's `<meta name=\"color-scheme\" content=\"light only\">`: email clients");
    expect(compared.out).not.toMatch(/ of {2}\(|shown of/);
  });

  it("says why it couldn't convert a template once", async () => {
    const dir = project({
      "components/shell.tsx": `import type { ReactNode } from "react";
import { Html, Body, Container, Tailwind } from "@react-email/components";
export function Shell({ children, note }: { children: ReactNode; note?: string }) {
  return <Html><Tailwind><Body className="bg-slate-50"><Container className="p-4">{children}{note}</Container></Body></Tailwind></Html>;
}
`,
      "emails/notice.tsx": `import { Text } from "@react-email/components";
import { Shell } from "../components/shell";
function Inner({ name, ...rest }: { name: string; note?: string }) {
  return <Shell {...rest}><Text>Hi {name}</Text></Shell>;
}
export default function Notice() { return <Inner name="Ada" note="Bye" />; }
`,
      "emails/styled.tsx": `import { Body, Head, Html, Text } from "@react-email/components";
export default function Styled({ accent = "#e11d48" }: { accent?: string }) {
  return <Html><Head><style>{\`p { color: \${accent} }\`}</style></Head><Body><Text>Hi</Text></Body></Html>;
}`,
    });
    const out = io(dir);
    expect(await main(["emails"], out, lib), out.out + out.err).toBe(2);
    expect(out.out).toContain("✗ emails/notice.tsx: couldn't convert it: <Inner> is kept as React (it couldn't be inlined");
    expect(out.out).toContain("✗ emails/styled.tsx: can't convert a <style> whose CSS comes from code: write the CSS out in the template\n");
    expect(out.out).not.toMatch(/couldn't convert it: Can't|Can't convert this template/);
  });

  it("says why it skips a file without parentheses in parentheses", async () => {
    const dir = project({
      "emails/welcome.tsx": good,
      "emails/helpers.tsx": `import { Text } from "@react-email/components";\nexport function Note() { return <Text>Note</Text>; }\n`,
    });
    const out = io(dir);
    expect(await main(["emails"], out, lib), out.out + out.err).toBe(0);
    expect(out.out).toContain("- emails/helpers.tsx: skipped: no default-exported component (a shared component or helper file)\n");
    expect(out.out).not.toMatch(/\([^()]*\([^()]*\)[^()]*\)/);
  });

  it("lists the files --overwrite won't replace one per line, and asks to commit them", async () => {
    const names = Array.from({ length: 12 }, (_, i) => `welcome-${String(i + 1).padStart(2, "0")}`);
    const dir = project(Object.fromEntries(names.flatMap((name) => [[`emails/${name}.tsx`, good], [`${name}.tsx`, "export const mine = 1;\n"]])));
    for (const name of names) fs.writeFileSync(path.join(dir, `${name}.tsx`), "export const mine = 2; // edited, not committed\n");
    const out = io(dir);
    expect(await main(["emails", "--out", ".", "--overwrite"], out, lib), out.out + out.err).toBe(1);
    expect(out.err).toBe(
      "--overwrite would replace 12 files git can't restore:\n" +
        names.slice(0, 10).map((name) => `  ${name}.tsx (changed since the last commit)\n`).join("") +
        "  and 2 more\nCommit them, choose a folder of its own for --out, or pass --allow-dirty.\n"
    );
    for (const name of names) expect(fs.readFileSync(path.join(dir, `${name}.tsx`), "utf8")).toContain("edited, not committed");
  });
});

describe("a second --write", () => {
  it("is done where a template it wrote keeps a block as HTML that imports React Email, even uncommitted", async () => {
    // A call's value beside markup in text keeps its block as React Email's markup (it's read once, as React reads it).
    const help = `import { Html, Body, Text } from "@react-email/components";
function greeting() { return "Need help?"; }
export default function Help({ locale = "en" }: { locale?: string }) {
  return <Html><Body><Text>{greeting() || <b>Hi</b>} Write to support ({locale}).</Text></Body></Html>;
}
Help.PreviewProps = { locale: "en" };`;
    const dir = project({ "emails/help.tsx": help });
    const first = io(dir);
    expect(await main(["emails", "--write"], first, lib), first.out + first.err).toBe(0);
    const written = fs.readFileSync(path.join(dir, "emails/help.tsx"), "utf8");
    expect(written).toMatch(/^\/\*\* @jsxRuntime automatic \*\/\n\/\/ Migrated from React Email by @unlayer\/migrate[^\n]*\n\/\/ @unlayer\/migrate hash /);
    expect(written).toMatch(/from "@react-email\/components"/);
    expect(written).toMatch(/from "@unlayer\/react-elements"/);
    // Not committed: git can't restore it, but nothing replaces it.
    for (const flags of [["--write"], []]) {
      const again = io(dir);
      expect(await main(["emails", ...flags], again, lib), again.out + again.err).toBe(0);
      expect(again.out).toContain("1 template already migrated (importing @unlayer/react-elements): nothing to do.");
      expect(again.err).toBe("");
    }
    expect(fs.readFileSync(path.join(dir, "emails/help.tsx"), "utf8")).toBe(written);
  });

  it("still checks a template of the project's own that imports both React Email and Elements, without a run's header", async () => {
    const mixed = `import { Html, Body, Text } from "@react-email/components";
import { Divider } from "@unlayer/react-elements";
export default function T() { return <Html><Body><Text>Hello there</Text></Body></Html>; }
export const divider = Divider;`;
    const dir = project({ "emails/mixed.tsx": mixed });
    fs.appendFileSync(path.join(dir, "emails/mixed.tsx"), "// edited, not committed\n");
    const out = io(dir);
    expect(await main(["emails", "--write"], out, lib), out.out + out.err).toBe(1);
    expect(out.err).toContain("--write replaces templates in place, and git couldn't restore these:\n  emails/mixed.tsx (changed since the last commit)");
  });
});

describe("a Tailwind config the templates share", () => {
  it("is skipped as a file that isn't a template, not left as it is for them: a dry run and --write end with exit 0", async () => {
    const config = `import type { TailwindConfig } from "@react-email/components";
export default { theme: { extend: { colors: { brand: "#2250f4" } } } } satisfies TailwindConfig;
`;
    const template = (name: string) => `import { Html, Body, Tailwind, Text } from "@react-email/components";
import tailwindConfig from "./tailwind.config";
export default function ${name}() { return <Html><Tailwind config={tailwindConfig}><Body><Text className="text-brand">Hello from ${name}</Text></Body></Tailwind></Html>; }
${name}.tailwindConfig = tailwindConfig;
`;
    const dir = project({ "emails/tailwind.config.ts": config, "emails/welcome.tsx": template("Welcome"), "emails/reset.tsx": template("Reset") });
    const skipped = "- emails/tailwind.config.ts: skipped: not loaded: its default export isn't a component (a helper, or a file that passes one on)\n";
    const dry = io(dir);
    expect(await main(["emails"], dry, lib), dry.out + dry.err).toBe(0);
    expect(dry.out).toContain(skipped);
    expect(dry.out).toContain("2 templates: 2 migrated and checked");
    expect(dry.err).toBe("");
    const write = io(dir);
    expect(await main(["emails", "--write"], write, lib), write.out + write.err).toBe(0);
    expect(write.out).toContain(skipped);
    expect(write.err).toBe("");
    expect(fs.readFileSync(path.join(dir, "emails/tailwind.config.ts"), "utf8")).toBe(config);
    expect(fs.readFileSync(path.join(dir, "emails/welcome.tsx"), "utf8")).toContain("@unlayer/react-elements");
  });
});

describe("words in what the run says", () => {
  it("are written as the templates write them, not as the check reads them", async () => {
    const original = `import { Html, Body, Text } from "@react-email/components";
export default function T() { return <Html><Body><Text>Order A-10293 for (sarah@example.com) shipped.</Text></Body></Html>; }
`;
    const migrated = `import { Column, Email, Paragraph, Row } from "@unlayer/react-elements";
export default function T() { return <Email backgroundColor="#ffffff"><Row><Column><Paragraph color="#000000" fontSize="14px" lineHeight="24px" containerPadding="0px 0px 16px 0px">Order shipped, ref “B‑7”, from the U.S.</Paragraph></Column></Row></Email>; }
`;
    const dir = project({ "emails/order.tsx": original, "migrated/order.tsx": migrated });
    const out = io(dir);
    expect(await main(["compare", "emails/order.tsx", "migrated/order.tsx"], out, lib), out.out + out.err).toBe(2);
    expect(out.out).toContain('lost text: "A-10293", "for", "sarah@example.com"');
    expect(out.out).toContain('extra text: "ref", "B‑7", "from", "the", "U.S."');
    expect(out.out).not.toMatch(/−|sarahexamplecom/);
  });

  it("are quoted without the characters that can't be seen in them", async () => {
    // Zero-width joiners and spaces a code block puts between its tokens, a byte order mark, a soft hyphen.
    const original = `import { Html, Body, Text } from "@react-email/components";
export default function T() { return <Html><Body><Text>{"Run \u200d\u200bclient.\u2060connect() on \ufeffstart\u00adup."}</Text></Body></Html>; }
`;
    const migrated = `import { Column, Email, Paragraph, Row } from "@unlayer/react-elements";
export default function T() { return <Email backgroundColor="#ffffff"><Row><Column><Paragraph color="#000000" fontSize="14px" lineHeight="24px" containerPadding="0px 0px 16px 0px">Run it</Paragraph></Column></Row></Email>; }
`;
    const dir = project({ "emails/code.tsx": original, "migrated/code.tsx": migrated });
    const out = io(dir);
    expect(await main(["compare", "emails/code.tsx", "migrated/code.tsx"], out, lib), out.out + out.err).toBe(2);
    expect(out.out).toContain('lost text: "client.connect()", "on", "startup"');
    expect(out.out).not.toMatch(/\p{Cf}/u);
  });
});
