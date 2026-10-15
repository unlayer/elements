/**
 * The committed MJML templates (test/fixtures/mjml, see its NOTICE): each converts, its Elements code renders, and the
 * check against the HTML MJML compiles the original to finds the same words, links and images, with every block
 * reaching the editor. What's kept as MJML's HTML is what the converter can't map.
 */
import fs from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { contentProblems } from "../../src/cli";
import { isMjmlDocument } from "../../src/from-mjml";
import { convertMjml } from "../../src/mjml";

const ROOT = path.join(import.meta.dirname, "../fixtures/mjml");
const templates = fs
  .readdirSync(ROOT, { recursive: true, encoding: "utf8" })
  .filter((file) => file.endsWith(".mjml") && isMjmlDocument(fs.readFileSync(path.join(ROOT, file), "utf8")))
  .sort();

// Where the generated code is loaded from while it's checked (removed after).
const scratch = fs.mkdtempSync(path.join(import.meta.dirname, "../.tmp-mjml-fixtures-"));
afterAll(() => fs.rmSync(scratch, { recursive: true, force: true }));
const io = { cwd: scratch, project: scratch };

/** What each fixture keeps as MJML's HTML (the rest is editable blocks). */
const KEPT: Record<string, string[]> = {
  "colorlib/01.mjml": ["mj-hero"],
  "mrml/mj-carousel.mjml": ["mj-carousel"],
  "mrml/mj-hero.mjml": ["mj-hero"],
  "mrml/mj-raw-conditional-comment.mjml": ["mj-raw"],
  "mrml/mj-navbar.mjml": ["mj-navbar"],
  "mrml/mj-social.mjml": ["mj-social"],
};

describe("committed MJML templates", () => {
  it("are all here", () => {
    expect(templates.length).toBeGreaterThanOrEqual(18);
  });

  for (const name of templates) {
    it(`${name}: same content, every block reaches the editor`, async () => {
      const file = path.join(ROOT, name);
      const result = await convertMjml(file, fs.readFileSync(file, "utf8"), scratch, ROOT, io);
      expect(contentProblems(result.check), name).toEqual([]);
      expect(result.designWarnings, name).toEqual([]);
      expect(result.conversion.fallbacks.map((f) => f.tag), name).toEqual(KEPT[name] ?? []);
      // Elements code: the components, under the header a later run recognizes.
      expect(result.code).toMatch(/^\/\*\* @jsxRuntime automatic \*\/\n\/\/ Migrated from MJML by @unlayer\/migrate: /);
      expect(result.code).toContain('from "@unlayer/react-elements"');
    });
  }
});
