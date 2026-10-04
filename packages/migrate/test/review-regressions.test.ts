import { afterEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import * as lib from "@unlayer/from-react-email";
import { main, type Io } from "../src/cli";

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
  return dir;
}

function io(cwd: string): Io & { out: string; err: string } {
  const sink = { cwd, out: "", err: "", stdout: (t: string) => void (sink.out += t), stderr: (t: string) => void (sink.err += t) };
  return sink;
}

describe("destination safety", () => {
  it("rejects outputs that would overwrite another source before executing templates", async () => {
    const dir = project({ "emails/a.tsx": neverLoad, "emails/target/a.tsx": neverLoad });
    for (const flags of [[], ["--force"]]) {
      const out = io(dir);
      expect(await main(["emails", "--out", "emails/target", ...flags], out, lib)).toBe(1);
      expect(out.err).toContain("source input");
      expect(out.out).toBe("");
      expect(fs.readFileSync(path.join(dir, "emails/target/a.tsx"), "utf8")).toBe(neverLoad);
    }
  });

  it("requires --write to replace the input itself", async () => {
    const dir = project({ "emails/a.tsx": neverLoad });
    const out = io(dir);
    expect(await main(["emails", "--out", "emails"], out, lib)).toBe(1);
    expect(out.err).toContain("source input");
    expect(fs.readFileSync(path.join(dir, "emails/a.tsx"), "utf8")).toBe(neverLoad);
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

  it("does not truncate an outside file hard-linked to an existing output", async () => {
    const dir = project({ "emails/a.tsx": good, "outside/keep.tsx": "OUTSIDE" });
    fs.mkdirSync(path.join(dir, "migrated"));
    fs.linkSync(path.join(dir, "outside/keep.tsx"), path.join(dir, "migrated/a.tsx"));
    const out = io(dir);
    expect(await main(["emails", "--out", "migrated"], out, lib), out.out + out.err).toBe(0);
    expect(fs.readFileSync(path.join(dir, "outside/keep.tsx"), "utf8")).toBe("OUTSIDE");
    expect(fs.readFileSync(path.join(dir, "migrated/a.tsx"), "utf8")).toContain("@unlayer/react-elements");
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
    expect(fs.readFileSync(path.join(dir, "emails/a.tsx"), "utf8")).toBe(source);
  });

  it("rejects a change that only occurs in the destination directory and cleans its probe", async () => {
    const source = `import { Html, Body, Text } from "@react-email/components";
export default function T() {
  const text = import.meta.url.includes("/migrated/") ? "Lost" : "Keep the original";
  return <Html><Body><Text>{text}</Text></Body></Html>;
}`;
    const dir = project({ "emails/a.tsx": source });
    const out = io(dir);
    expect(await main(["emails", "--out", "migrated", "--design"], out, lib)).toBe(2);
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
