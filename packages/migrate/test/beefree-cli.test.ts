/**
 * `npx @unlayer/migrate <dir> --from beefree`, end to end, on the committed Beefree templates (test/fixtures/beefree):
 * checked against Beefree's HTML export where it's beside the JSON, unverified where it isn't (a third state, which
 * --strict fails), what's written and where, and the exit codes.
 */
import { afterEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { main, type Io } from "../src/cli";

const FIXTURES = path.join(import.meta.dirname, "fixtures/beefree");
/** Checked against its export (signup-email.html beside it), with the same content. */
const CHECKED = "toptile-legacy/signup-email";
/** No export beside it. */
const UNVERIFIED = "templatical/example-1";

const dirs: string[] = [];
afterEach(() => {
  for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

/** A git repository with the fixtures named (`<name>.json`, and `<name>.html` where there is one) and `files`, committed. */
function project(templates: string[], files: Record<string, string> = {}): string {
  const dir = fs.mkdtempSync(path.join(import.meta.dirname, ".tmp-"));
  dirs.push(dir);
  for (const name of templates) {
    for (const extension of [".json", ".html"]) {
      const from = path.join(FIXTURES, `${name}${extension}`);
      if (!fs.existsSync(from)) continue;
      fs.mkdirSync(path.join(dir, "templates", path.dirname(name)), { recursive: true });
      fs.copyFileSync(from, path.join(dir, "templates", `${name}${extension}`));
    }
  }
  for (const [file, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), text);
  }
  const git = (...args: string[]) => execFileSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.com", "-c", "commit.gpgsign=false", ...args], { cwd: dir, stdio: "ignore" });
  git("init", "-q");
  git("add", "-A");
  git("commit", "-q", "-m", "templates");
  return dir;
}

async function run(dir: string, ...argv: string[]) {
  const sink: Io & { out: string; err: string } = { cwd: dir, out: "", err: "", stdout: (t) => void (sink.out += t), stderr: (t) => void (sink.err += t) };
  const code = await main(argv, sink);
  return { code, out: sink.out, err: sink.err };
}

describe("--from beefree", () => {
  it("checks a template against Beefree's export beside it, and says one without it is unverified", async () => {
    const dir = project([CHECKED, UNVERIFIED], { "templates/package.json": '{ "name": "emails" }' });
    const { code, out, err } = await run(dir, "templates", "--from", "beefree");
    expect(code, out + err).toBe(0);
    expect(out).toMatch(/^✓ templates\/toptile-legacy\/signup-email\.json: 100% editable/m);
    expect(out).toContain("? templates/templatical/example-1.json: unverified (no exported HTML: put Beefree's HTML export of it beside it as example-1.html to check it), 100% editable");
    expect(out).toMatch(/- templates\/package\.json: skipped: not a Beefree template: /);
    expect(out).toContain("2 templates: 1 migrated and checked (1 looks different: see above), 1 unverified (nothing to check against: see above). 1 other file skipped (see above). Nothing written");
    expect(fs.readdirSync(path.join(dir, "templates/templatical"))).toEqual(["example-1.json"]);
  });

  it("fails an unverified template with --strict, and writes it only with --force", async () => {
    const dir = project([UNVERIFIED]);
    const strict = await run(dir, "templates", "--from", "beefree", "--strict", "--out", "migrated");
    expect(strict.code).toBe(2);
    expect(strict.out).toMatch(/✗ templates\/templatical\/example-1\.json: check failed with --strict: .*unverified \(no exported HTML/);
    expect(fs.existsSync(path.join(dir, "migrated"))).toBe(false);
    const forced = await run(dir, "templates", "--from", "beefree", "--strict", "--force", "--out", "migrated");
    expect(forced.code).toBe(2);
    expect(fs.existsSync(path.join(dir, "migrated/templatical/example-1.tsx"))).toBe(true);
  });

  it("writes <name>.tsx beside the JSON with --write, leaving the JSON, and doesn't replace someone's file", async () => {
    const dir = project([CHECKED]);
    const json = fs.readFileSync(path.join(dir, "templates", `${CHECKED}.json`), "utf8");
    const written = await run(dir, "templates", "--from", "beefree", "--write");
    expect(written.code, written.out + written.err).toBe(0);
    const tsx = fs.readFileSync(path.join(dir, "templates", `${CHECKED}.tsx`), "utf8");
    expect(tsx).toMatch(/^\/\*\* @jsxRuntime automatic \*\/\n\/\/ Migrated from Beefree by @unlayer\/migrate: signup-email\.json\n\/\/ @unlayer\/migrate hash /);
    expect(tsx).toContain("export default function SignupEmail()");
    expect(fs.readFileSync(path.join(dir, "templates", `${CHECKED}.json`), "utf8")).toBe(json);
    // A run again: the file is an earlier run's, replaced only with --overwrite.
    const again = await run(dir, "templates", "--from", "beefree", "--write");
    expect(again.code).toBe(1);
    expect(again.err).toContain("(written by an earlier run)");
  });

  it("writes to --out with design JSON and a report that lists unverified templates and blocks kept as HTML", async () => {
    const dir = project([UNVERIFIED, "playground/the-ultimate-guide-to-a-stress-free-thanksgiving"]);
    const { code, out, err } = await run(dir, "templates", "--from", "beefree", "--out", "migrated", "--design", "--report", "report.json");
    expect(code, out + err).toBe(0);
    expect(out).toMatch(/✓ templates\/playground\/the-ultimate-guide-to-a-stress-free-thanksgiving\.json: \d+% editable, 1 block kept as HTML \(icons\)/);
    const design = JSON.parse(fs.readFileSync(path.join(dir, "migrated/templatical/example-1.design.json"), "utf8"));
    expect(Array.isArray(design.body.rows)).toBe(true);
    const report = JSON.parse(fs.readFileSync(path.join(dir, "report.json"), "utf8"));
    expect(report.find((r: { file: string }) => r.file === "templates/templatical/example-1.json")).toMatchObject({ status: "unverified", unchecked: expect.stringContaining("no exported HTML"), output: "migrated/templatical/example-1.tsx" });
    expect(report.find((r: { file: string }) => r.file.endsWith("thanksgiving.json"))).toMatchObject({ status: "migrated", fallbacks: 1, kept: [{ detail: "icons" }] });
  });

  it("fails a template of a version it doesn't read, and exits with 2; nothing to migrate exits with 1", async () => {
    const dir = project([], { "templates/future.json": JSON.stringify({ page: { template: { version: "9.9.9" }, body: {}, rows: [] } }), "other/notes.json": "{}" });
    const future = await run(dir, "templates", "--from", "beefree");
    expect(future.code).toBe(2);
    expect(future.out).toContain('✗ templates/future.json: Unknown Beefree template version "9.9.9"');
    const none = await run(dir, "other", "--from", "beefree");
    expect(none.code).toBe(1);
    expect(none.err).toContain("No template was checked: no JSON file here is a Beefree template.");
  });

  it("expects the differences the conversion declares (social icons' alt text, a hamburger menu), listing each one; --strict fails them", async () => {
    const dir = project(["playground/kids-fall-collection"]);
    const { code, out, err } = await run(dir, "templates", "--from", "beefree", "--report", "report.json");
    expect(code, out + err).toBe(0);
    expect(out).toMatch(/^✓ templates\/playground\/kids-fall-collection\.json: /m);
    const [result] = JSON.parse(fs.readFileSync(path.join(dir, "report.json"), "utf8"));
    expect(result.differences).toEqual(
      expect.arrayContaining([
        { reason: "social icon alt text is “<network> icon” (the editor's Social block writes it this way)", count: 4, examples: ['alt "Facebook" → "Facebook icon"', 'alt "Twitter" → "Twitter icon"', 'alt "Linkedin" → "LinkedIn icon"', 'alt "Instagram" → "Instagram icon"'] },
        { reason: "menu toggle glyph left out (Unlayer menus have no hamburger button on phones)", count: 2, examples: ['"☰"', '"✕"'] },
        { reason: "menu links shown on phones, where Beefree folds them into a hamburger button (Unlayer menus have none)", count: 1, examples: [".menu-links"] },
      ]),
    );
    const strict = await run(dir, "templates", "--from", "beefree", "--strict");
    expect(strict.code).toBe(2);
    expect(strict.out).toMatch(/✗ templates\/playground\/kids-fall-collection\.json: check failed with --strict: .*social icon alt text is “<network> icon”/);
  });

  it("still fails content a declaration doesn't name: another alt text on a social icon", async () => {
    const dir = project(["playground/kids-fall-collection"]);
    const exported = path.join(dir, "templates/playground/kids-fall-collection.html");
    // The export says "Facebook page" where the declaration expects Beefree's "Facebook".
    fs.writeFileSync(exported, fs.readFileSync(exported, "utf8").replace('alt="Facebook"', 'alt="Facebook page"'));
    const { code, out } = await run(dir, "templates", "--from", "beefree");
    expect(code).toBe(2);
    expect(out).toMatch(/✗ templates\/playground\/kids-fall-collection\.json: check failed: lost links\/images: "alt Facebook page"/);
  });
});
