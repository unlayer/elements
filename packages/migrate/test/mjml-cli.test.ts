/**
 * `npx @unlayer/migrate <dir> --from mjml`, end to end: what it writes (and doesn't), the same rules for files already
 * at a destination as a React Email run, the report, --strict with blocks kept as MJML's HTML, and the exit codes.
 */
import { afterEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { main, type Io } from "../src/cli";

const WELCOME = `<mjml>
  <mj-head>
    <mj-preview>Welcome aboard</mj-preview>
    <mj-include path="./partials/base.mjml" />
  </mj-head>
  <mj-body background-color="#f4f4f4">
    <mj-section background-color="#ffffff" padding="20px">
      <mj-column>
        <mj-text font-size="20px">Welcome, {{name}}!</mj-text>
        <mj-button href="https://example.com/start">Get started</mj-button>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`;

const BASE = `<mj-attributes><mj-text color="#333333" /></mj-attributes>`;

const HERO = `<mjml>
  <mj-body>
    <mj-hero background-url="https://example.com/hero.jpg" background-height="300px" height="300px" mode="fixed-height">
      <mj-text>Over the image</mj-text>
    </mj-hero>
    <mj-section><mj-column><mj-text>Below</mj-text></mj-column></mj-section>
  </mj-body>
</mjml>
`;

const dirs: string[] = [];
afterEach(() => {
  for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

/** A git repository with `files` committed. */
function project(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(import.meta.dirname, ".tmp-"));
  dirs.push(dir);
  for (const [file, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), text);
  }
  commit(dir);
  return dir;
}

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

async function run(dir: string, ...argv: string[]) {
  const out = io(dir);
  const code = await main(argv, out);
  return { code, out: out.out, err: out.err };
}

const read = (dir: string, file: string) => fs.readFileSync(path.join(dir, file), "utf8");

describe("--from mjml", () => {
  it("checks without writing by default, and says what --write does; partials are skipped", async () => {
    const dir = project({ "emails/welcome.mjml": WELCOME, "emails/partials/base.mjml": BASE });
    const { code, out, err } = await run(dir, "emails", "--from", "mjml");
    expect(code, out + err).toBe(0);
    expect(out).toContain("✓ emails/welcome.mjml: 100% editable");
    expect(out).toContain("- emails/partials/base.mjml: skipped: not an MJML document (no <mjml> root)");
    expect(out).toContain("1 template: 1 migrated and checked. 1 other file skipped (see above). Nothing written: pass --write or --out <dir> to write the migrated templates.");
    expect(fs.readdirSync(path.join(dir, "emails")).sort()).toEqual(["partials", "welcome.mjml"]);
  });

  it("writes <name>.tsx beside each template with --write, leaving the .mjml as it is", async () => {
    const dir = project({ "emails/welcome.mjml": WELCOME, "emails/partials/base.mjml": BASE });
    const { code, out, err } = await run(dir, "emails", "--from", "mjml", "--write");
    expect(code, out + err).toBe(0);
    expect(out).toContain("✓ emails/welcome.mjml: 100% editable → emails/welcome.tsx");
    expect(read(dir, "emails/welcome.mjml")).toBe(WELCOME);
    const tsx = read(dir, "emails/welcome.tsx");
    expect(tsx).toMatch(/^\/\*\* @jsxRuntime automatic \*\/\n\/\/ Migrated from MJML by @unlayer\/migrate: welcome\.mjml\n\/\/ @unlayer\/migrate hash [0-9a-f]{16}/);
    expect(tsx).toContain("export default function Welcome()");
    expect(tsx).toContain('previewText="Welcome aboard"');
    expect(tsx).toContain("Welcome, {{name}}!");
    expect(tsx).toContain('href="https://example.com/start"');
    // The include's attributes were applied.
    expect(tsx).toContain('color="#333333"');
  });

  it("doesn't replace a file already at a destination unless asked, and keeps one git can't restore", async () => {
    const dir = project({ "emails/welcome.mjml": WELCOME, "emails/partials/base.mjml": BASE, "emails/welcome.tsx": "// mine\n" });
    const refused = await run(dir, "emails", "--from", "mjml", "--write");
    expect(refused.code).toBe(1);
    expect(refused.err).toContain("Output already exists: emails/welcome.tsx (not written by @unlayer/migrate). Choose an empty folder, or pass --overwrite to replace it.");
    expect(read(dir, "emails/welcome.tsx")).toBe("// mine\n");
    // Committed: git can give it back, so --overwrite replaces it.
    const replaced = await run(dir, "emails", "--from", "mjml", "--write", "--overwrite");
    expect(replaced.code, replaced.out + replaced.err).toBe(0);
    expect(read(dir, "emails/welcome.tsx")).toContain("Migrated from MJML");
    // Edited since (and not committed): kept, unless --allow-dirty.
    fs.appendFileSync(path.join(dir, "emails/welcome.tsx"), "// edited\n");
    const kept = await run(dir, "emails", "--from", "mjml", "--write", "--overwrite");
    expect(kept.code).toBe(1);
    expect(kept.err).toContain("--overwrite would replace emails/welcome.tsx (edited since a run wrote it, changed since the last commit), which git can't restore.");
    expect(read(dir, "emails/welcome.tsx")).toContain("// edited");
    const forced = await run(dir, "emails", "--from", "mjml", "--write", "--overwrite", "--allow-dirty");
    expect(forced.code).toBe(0);
    expect(read(dir, "emails/welcome.tsx")).not.toContain("// edited");
  });

  it("writes to --out with the folder layout, the design JSON with --design, and a report", async () => {
    const dir = project({ "emails/welcome.mjml": WELCOME, "emails/partials/base.mjml": BASE, "emails/promo/hero.mjml": HERO });
    const { code, out, err } = await run(dir, "emails", "--from", "mjml", "--out", "migrated", "--design", "--report", "report.json");
    expect(code, out + err).toBe(0);
    expect(fs.existsSync(path.join(dir, "migrated/welcome.tsx"))).toBe(true);
    expect(fs.existsSync(path.join(dir, "migrated/promo/hero.tsx"))).toBe(true);
    expect(fs.existsSync(path.join(dir, "emails/welcome.tsx"))).toBe(false);
    const design = JSON.parse(read(dir, "migrated/welcome.design.json"));
    expect(design.body.values.preheaderText).toBe("Welcome aboard");
    expect(typeof design.schemaVersion).toBe("number");
    expect(JSON.stringify(design)).toContain("Get started");
    // The block kept as MJML's HTML is counted beside the check, not hidden in it.
    expect(out).toMatch(/✓ emails\/promo\/hero\.mjml: \d+% editable, 1 block kept as HTML \(mj-hero\)/);
    expect(out).toContain("1 block kept as HTML (not editable as blocks).");
    const report = JSON.parse(read(dir, "report.json"));
    const hero = report.find((r: { file: string }) => r.file === "emails/promo/hero.mjml");
    expect(hero).toMatchObject({ status: "migrated", fallbacks: 1, kept: [{ reason: "mj-hero: content over a background image", detail: "mj-hero" }], output: "migrated/promo/hero.tsx", design: "migrated/promo/hero.design.json" });
    // Run again: the outputs are an earlier run's, replaced only with --overwrite.
    const again = await run(dir, "emails", "--from", "mjml", "--out", "migrated");
    expect(again.code).toBe(1);
    expect(again.err).toContain("(written by an earlier run)");
    expect((await run(dir, "emails", "--from", "mjml", "--out", "migrated", "--overwrite")).code).toBe(0);
  });

  it("shows a right-to-left template's columns where MJML does, on desktop and on phones", async () => {
    const columns = '<mj-column><mj-text align="right">ראשון</mj-text></mj-column><mj-column><mj-text align="right">שני</mj-text></mj-column>';
    const dir = project({
      // MJML's sections show their columns left to right whatever <mjml dir> says.
      "emails/page.mjml": `<mjml dir="rtl"><mj-body><mj-section>${columns}</mj-section></mj-body></mjml>`,
      // Right to left where a section says so.
      "emails/sections.mjml": `<mjml dir="rtl"><mj-body><mj-section direction="rtl">${columns}</mj-section></mj-body></mjml>`,
    });
    const { code, out, err } = await run(dir, "emails", "--from", "mjml", "--out", "migrated", "--design");
    expect(code, out + err).toBe(0);
    expect(out).toMatch(/^✓ emails\/page\.mjml: .*mjml dir rtl not kept/m);
    expect(out).toMatch(/^✓ emails\/sections\.mjml: /m);
    expect(out).not.toContain("moved");
    expect(JSON.parse(read(dir, "migrated/page.design.json")).body.values.textDirection).toBeUndefined();
    expect(JSON.parse(read(dir, "migrated/sections.design.json")).body.values.textDirection).toBe("rtl");
  });

  it("fails a template with a block kept as MJML's HTML with --strict, writing it only with --force", async () => {
    const dir = project({ "emails/hero.mjml": HERO });
    const strict = await run(dir, "emails", "--from", "mjml", "--strict", "--out", "migrated");
    expect(strict.code).toBe(2);
    expect(strict.out).toContain("✗ emails/hero.mjml: check failed with --strict: 1 block kept as HTML");
    expect(fs.existsSync(path.join(dir, "migrated"))).toBe(false);
    const forced = await run(dir, "emails", "--from", "mjml", "--strict", "--force", "--out", "migrated");
    expect(forced.code).toBe(2);
    expect(fs.existsSync(path.join(dir, "migrated/hero.tsx"))).toBe(true);
  });

  it("makes mj-social an editable Social block, listing the differences it declares; --strict fails them", async () => {
    const social = WELCOME.replace("</mj-column>", '<mj-social><mj-social-element name="facebook" href="https://example.com/acme" /><mj-social-element name="instagram" href="https://instagram.com/acme" /></mj-social></mj-column>');
    const dir = project({ "emails/welcome.mjml": social, "emails/partials/base.mjml": BASE });
    const { code, out, err } = await run(dir, "emails", "--from", "mjml", "--out", "migrated", "--report", "report.json");
    expect(code, out + err).toBe(0);
    expect(out).toMatch(/✓ emails\/welcome\.mjml: 100% editable, .*social icon alt text is “<network> icon”/);
    expect(read(dir, "migrated/welcome.tsx")).toContain("<Social");
    const [result] = JSON.parse(read(dir, "report.json")).filter((r: { file: string }) => r.file === "emails/welcome.mjml");
    expect(result.kept).toEqual([]);
    expect(result.differences).toEqual(
      expect.arrayContaining([
        { reason: "social icon alt text is “<network> icon” (the editor's Social block writes it this way)", count: 2, examples: ['alt "" → "Facebook icon"', 'alt "" → "Instagram icon"'] },
        expect.objectContaining({ reason: expect.stringContaining("MJML's own social icon"), count: 2 }),
      ]),
    );
    const strict = await run(dir, "emails", "--from", "mjml", "--strict");
    expect(strict.code).toBe(2);
    expect(strict.out).toMatch(/✗ emails\/welcome\.mjml: check failed with --strict: .*social icon alt text/);
  });

  it("fails an MJML 3 template, naming mjml-migrate, and exits with 2", async () => {
    const dir = project({ "emails/old.mjml": "<mjml><mj-body><mj-container><mj-section><mj-column><mj-text>Old</mj-text></mj-column></mj-section></mj-container></mj-body></mjml>", "emails/welcome.mjml": WELCOME, "emails/partials/base.mjml": BASE });
    const { code, out } = await run(dir, "emails", "--from", "mjml");
    expect(code).toBe(2);
    expect(out).toContain("✗ emails/old.mjml: it's MJML 3 (it wraps its content in <mj-container>), which MJML 5 doesn't read: upgrade it first with npx mjml-migrate <input> <output>, then migrate the output");
    expect(out).toContain("✓ emails/welcome.mjml");
  });

  it("refuses an include outside the folder given, and fails the template, whose check can't see what's missing", async () => {
    const dir = project({ "secret.mjml": "<mj-text>Outside the folder</mj-text>", "emails/welcome.mjml": WELCOME.replace("</mj-column>", '<mj-include path="../secret.mjml" /></mj-column>'), "emails/partials/base.mjml": BASE });
    const { code, out, err } = await run(dir, "emails", "--from", "mjml", "--out", "migrated", "--report", "report.md");
    // The reference is compiled from the same document, without the include: the check alone would pass.
    expect(code, out + err).toBe(2);
    expect(out).toContain("✗ emails/welcome.mjml: written, but it failed the check: couldn't read mj-include ../secret.mjml (outside emails, not read), so its content isn't all there");
    // What the converter couldn't read isn't a converter bug.
    expect(out).not.toContain("converter bug");
    expect(read(dir, "migrated/welcome.tsx")).not.toContain("Outside the folder");
    expect(read(dir, "report.md")).toMatch(/^# MJML → Unlayer Elements migration/);
    expect(read(dir, "report.md")).toContain("- mj-include left out: `../secret.mjml (outside emails, not read)`");
    expect(read(dir, "report.md")).toContain("**Not read, so not in the migrated template:** `mj-include ../secret.mjml (outside emails, not read)`");
  });

  it("writes a file name with a line break in it into the header's comment on one line, as text", async () => {
    const name = 'welcome\nglobalThis.__unlayerMigrateProbe=1,("x")';
    const dir = project({ [`emails/${name}.mjml`]: WELCOME, "emails/partials/base.mjml": BASE });
    const { code, out, err } = await run(dir, "emails", "--from", "mjml", "--out", "migrated");
    expect(code, out + err).toBe(0);
    expect((globalThis as Record<string, unknown>).__unlayerMigrateProbe).toBeUndefined();
    const written = fs.readdirSync(path.join(dir, "migrated")).find((f) => f.endsWith(".tsx"))!;
    const header = read(dir, `migrated/${written}`).split("\n").slice(0, 3);
    expect(header[1]).toBe('// Migrated from MJML by @unlayer/migrate: welcome globalThis.__unlayerMigrateProbe=1,("x").mjml');
    expect(header[2]).not.toContain("__unlayerMigrateProbe");
  });

  it("says when there's nothing to migrate, and points a React Email run at --from mjml", async () => {
    const dir = project({ "emails/partials/base.mjml": BASE });
    fs.mkdirSync(path.join(dir, "empty"));
    const none = await run(dir, "empty", "--from", "mjml");
    expect(none.code).toBe(1);
    expect(none.err).toContain("No MJML templates found (.mjml files).");
    const partials = await run(dir, "emails", "--from", "mjml");
    expect(partials.code).toBe(1);
    expect(partials.err).toContain("No template was checked");
    const reactEmail = await run(dir, "emails");
    expect(reactEmail.code).toBe(1);
    expect(reactEmail.err).toContain("There are MJML templates (.mjml): migrate them with --from mjml.");
  });
});
