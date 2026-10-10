import { afterEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { convertReactEmail, convertSource, verifyConversion } from "../src/index";

const directories: string[] = [];
afterEach(() => {
  for (const directory of directories.splice(0)) fs.rmSync(directory, { recursive: true, force: true });
});
const imports = 'import { Html, Body, Text, Section, Row, Column, Tailwind } from "@react-email/components";';
async function convertBoth(source: string, fileName = "template.tsx") {
  const directory = fs.mkdtempSync(path.join(import.meta.dirname, ".tmp-review-fix-"));
  directories.push(directory);
  const original = path.join(directory, "original.tsx");
  fs.writeFileSync(original, source);
  const { default: Original } = await import(original);
  const conversion = await convertSource(source, { fileName });
  const migrated = path.join(directory, /\.(jsx?|mjs|cjs)$/.test(fileName) ? "migrated.jsx" : "migrated.tsx");
  fs.writeFileSync(migrated, conversion.code);
  const { default: Migrated } = await import(migrated);
  const check = await verifyConversion(Original, Migrated);
  const runtime = await convertReactEmail(Original, { mergeTags: false });
  expect(check.missing).toEqual([]);
  expect(check.missingAttributes).toEqual([]);
  expect(check.designWarnings).toEqual([]);
  expect(runtime.report.missingText).toEqual([]);
  return { conversion, runtime, check };
}

describe("migration fidelity", () => {
  it.each([
    '<Text style={{ display: "none" }}>Expired discount 50%</Text>',
    '<Section style={{ display: "none" }}><Text>Expired discount 50%</Text></Section>',
    '<Row><Column style={{ display: "none" }}><Text>Expired discount 50%</Text></Column><Column><Text>Visible neighbour</Text></Column></Row>',
  ])("keeps hidden blocks and containers as HTML: %s", async (hidden) => {
    const result = await convertBoth(`${imports} export default function T() { return <Html><Body>${hidden}<Text>Current receipt</Text></Body></Html>; }`);
    expect(result.check.added).toEqual([]);
    expect(result.runtime.report.fallbacks).not.toEqual([]);
    expect(result.conversion.report.fallbacks).not.toEqual([]);
    for (const html of [result.check.convertedHtml, result.runtime.html()]) {
      expect(html).toMatch(/style="[^"]*display:\s*none/);
      expect(html).toContain("Current receipt");
    }
  });

  it("keeps Tailwind hidden content hidden and reports its HTML fallback", async () => {
    const result = await convertBoth(`${imports} export default function T() { return <Tailwind><Html><Body><Text className="hidden">Expired discount 50%</Text><Text>Current receipt</Text></Body></Html></Tailwind>; }`);
    expect(result.check.added).toEqual([]);
    expect(result.conversion.report.fallbacks.some((f) => f.reason === "hidden element")).toBe(true);
    expect(result.runtime.report.fallbacks.some((f) => f.reason === "hidden element")).toBe(true);
  });

  it("preserves dynamic document direction and language in both conversion paths", async () => {
    const result = await convertBoth(`${imports}
      export default function T({ direction = "rtl", language = "ar" }) { return <Html dir={direction} lang={language}><Body><Text>مرحبا</Text></Body></Html>; }
      T.PreviewProps = { direction: "rtl", language: "ar" };`);
    for (const html of [result.check.convertedHtml, result.runtime.html()]) expect(html).toMatch(/<html[^>]*dir="rtl"[^>]*lang="ar"/);
    expect(result.check.design.body).toMatchObject({ values: { textDirection: "rtl" } });
    expect(result.runtime.design().body.values.textDirection).toBe("rtl");
    expect(result.runtime.design().body.values).not.toHaveProperty("lang");
    expect(result.conversion.code).toContain("textDirection={direction}");
    expect(result.conversion.code).toContain("lang={language}");
  });

  it.each(["template.js", "template.jsx"])("generates executable JavaScript helpers for %s", async (fileName) => {
    const result = await convertBoth(`${imports}
      export default function T({ name = "Alex", url = "https://example.com" }) { return <Html><Body><Text>Hello <b>{name}</b> <a href={url}>Profile</a></Text></Body></Html>; }`, fileName);
    expect(result.check.added).toEqual([]);
    expect(result.conversion.code).toContain("function escapeHtml(text)");
    expect(result.conversion.code).toContain("function htmlText(value)");
    expect(result.conversion.code).not.toContain(" as Parameters");
  });
});
