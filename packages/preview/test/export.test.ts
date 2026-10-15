import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { exportTemplates } from "../src/server/export";
import { fixtureCopy } from "./helpers";

let fixture: Awaited<ReturnType<typeof fixtureCopy>>;

beforeAll(async () => {
  fixture = await fixtureCopy("export");
});

afterAll(async () => {
  await fixture?.cleanup();
});

describe("export", () => {
  it("writes each template's HTML at its path, and copies static files", async () => {
    const outDir = path.join(fixture.root, "out");
    const result = await exportTemplates({ dir: fixture.emails, outDir });
    expect(result.failed).toBe(0);
    expect(result.templates.map((t) => t.template)).toEqual(["billing/receipt.jsx", "landing.tsx", "plain.js", "welcome.tsx"]);
    const html = await readFile(path.join(outDir, "billing", "receipt.html"), "utf8");
    expect(html).toMatch(/^<!DOCTYPE HTML PUBLIC/);
    expect(html).toContain("Total: $42.00");
    expect(existsSync(path.join(outDir, "welcome.html"))).toBe(true);
    expect(existsSync(path.join(outDir, "static", "logo.png"))).toBe(true);
  });

  it("writes plain text, design JSON, pretty HTML and custom extensions", async () => {
    const text = path.join(fixture.root, "out-text");
    await exportTemplates({ dir: fixture.emails, outDir: text, plainText: true });
    expect(await readFile(path.join(text, "welcome.txt"), "utf8")).toContain("WELCOME, ADA");

    const json = path.join(fixture.root, "out-json");
    await exportTemplates({ dir: fixture.emails, outDir: json, design: true, pretty: true, extension: "blade.php" });
    expect(JSON.parse(await readFile(path.join(json, "welcome.design.json"), "utf8")).body.rows).toHaveLength(1);
    const pretty = await readFile(path.join(json, "welcome.blade.php"), "utf8");
    expect(pretty).toContain("Welcome, Ada");
    expect(pretty.split("\n").length).toBeGreaterThan(20);
  });

  it("keeps going past a template that fails, and reports it", async () => {
    await writeFile(path.join(fixture.emails, "broken.tsx"), "export default function Broken() { return <Email>; }\n");
    const outDir = path.join(fixture.root, "out-broken");
    const result = await exportTemplates({ dir: fixture.emails, outDir });
    expect(result.failed).toBe(1);
    const broken = result.templates.find((t) => t.template === "broken.tsx");
    expect(broken?.error?.file).toBe("emails/broken.tsx");
    expect(existsSync(path.join(outDir, "welcome.html"))).toBe(true);
  });

  it("refuses to write into the templates folder", async () => {
    await expect(exportTemplates({ dir: fixture.emails, outDir: fixture.emails })).rejects.toThrow(/holds the templates/);
  });
});
