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
    expect(out.out).toContain("imported by");
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
    expect(await main(["config.tsx", "--write"], config, lib)).toBe(0);
    expect(config.out).toContain("skipped");
    const out = io(dir);
    expect(await main(["unsupported.tsx", "--write"], out, lib)).toBe(2);
    expect(out.out).toContain("unsupported React template wrapper");
    expect(out.out).not.toContain("skipped");
  });
});


describe("extra text", () => {
  const extra = good.replace('</Body>', '<Text>{import.meta.url.includes(".unlayer-migrate-") ? "Unexpected" : null}</Text></Body>');

  it.each(["md", "json"])("fails without writing the template and includes added words in the %s report", async (extension) => {
    const dir = project({ "welcome.tsx": extra });
    const out = io(dir);
    expect(await main(["welcome.tsx", "--out", "converted", "--design", "--report", `report.${extension}`], out, lib), out.out + out.err).toBe(2);
    expect(out.out).toContain('extra text: "Unexpected"');
    expect(fs.existsSync(path.join(dir, "converted/welcome.tsx"))).toBe(false);
    expect(fs.existsSync(path.join(dir, "converted/welcome.design.json"))).toBe(false);
    expect(fs.readFileSync(path.join(dir, "welcome.tsx"), "utf8")).toBe(extra);
    const report = fs.readFileSync(path.join(dir, `report.${extension}`), "utf8");
    if (extension === "json") expect(JSON.parse(report)[0]).toMatchObject({status:"check-failed",addedText:["Unexpected"],missingText:[]});
    else expect(report).toContain('**Extra text:** "Unexpected"');
  });

  it("fails when only a flipped boolean prop adds text", async () => {
    const source = extra.replace('import.meta.url.includes', 'trial && import.meta.url.includes').replace('function T()', 'function T({trial})') + '\nT.PreviewProps = {trial:false};';
    const dir = project({ "welcome.tsx": source });
    const out = io(dir);
    expect(await main(["welcome.tsx", "--out", "converted", "--report", "report.json"], out, lib), out.out + out.err).toBe(2);
    expect(out.out).toContain('with trial: true: extra text: "Unexpected"');
    const report = JSON.parse(fs.readFileSync(path.join(dir, "report.json"), "utf8"));
    expect(report[0]).toMatchObject({status:"check-failed",addedText:[],variants:[{change:"trial: true",added:["Unexpected"],missing:[]}]});
    expect(fs.existsSync(path.join(dir, "converted/welcome.tsx"))).toBe(false);
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
      expect(out.out).toMatch(/- emails\/send-welcome\.ts: skipped \(not loaded: its default export is async/);
      expect(out.out).toMatch(/- emails\/mailer\.mjs: skipped \(not loaded: its default export doesn't return JSX/);
      expect(out.out).toMatch(/- emails\/registry\.tsx: skipped \(not loaded: its default export isn't a component/);
      expect(fs.readdirSync(marks)).toEqual([]);
    }
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
    expect(out.out).toMatch(/2 templates: .*2 failed|2 migrated/);
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

  it("fail a template that calls process.exit, and the run ends when a template leaves a timer (built CLI)", async () => {
    const dir = project({
      "package.json": '{"name":"exit-fixture","private":true,"type":"module"}',
      "emails/exits.tsx": `import { Html, Body, Text } from "@react-email/components";
process.exit(0);
export default function Exits() { return <Html><Body><Text>Exits</Text></Body></Html>; }`,
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
    expect(result.stdout).toMatch(/emails\/timer\.tsx: 100% editable/);
    expect(result.stdout).toContain("1 migrated and checked, 1 failed");
  }, 90_000);
});
