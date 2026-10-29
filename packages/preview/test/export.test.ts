import { existsSync } from "node:fs";
import { readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { UsageError } from "../src/server/errors";
import { exportTemplates } from "../src/server/export";
import { cli, fixtureCopy } from "./helpers";

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

  it("fails a template that doesn't finish rendering, and exports the others", async () => {
    const stuck = path.join(fixture.emails, "stuck.tsx");
    await writeFile(stuck, 'import { Email } from "@unlayer/react-elements";\nasync function Never() { await new Promise(() => {}); return null; }\nexport default function Stuck() { return <Email><Never /></Email>; }\n');
    try {
      const outDir = path.join(fixture.root, "out-stuck");
      const { code, stdout, stderr } = await cli(["export", "--dir", fixture.emails, "--outDir", outDir, "--render-timeout", "3"]);
      expect(code).toBe(1);
      expect(stderr).toMatch(/✗ stuck\.tsx: The template didn't finish rendering in 3 seconds/);
      expect(stdout).toMatch(/✓ welcome\.tsx/);
      expect(existsSync(path.join(outDir, "welcome.html"))).toBe(true);
    } finally {
      await rm(stuck);
    }
  });

  it("refuses to write into the templates folder", async () => {
    await expect(exportTemplates({ dir: fixture.emails, outDir: fixture.emails })).rejects.toThrow(/holds the templates/);
  });

  it("stops before writing anything when two templates would write the same file", async () => {
    const twin = path.join(fixture.emails, "welcome.jsx");
    await writeFile(twin, 'import { Email } from "@unlayer/react-elements";\nexport default function Welcome() { return <Email />; }\n');
    try {
      const outDir = path.join(fixture.root, "out-twins");
      await expect(exportTemplates({ dir: fixture.emails, outDir })).rejects.toThrow(UsageError);
      await expect(exportTemplates({ dir: fixture.emails, outDir })).rejects.toThrow(/welcome\.jsx and welcome\.tsx would both write .*welcome\.html/);
      expect(existsSync(outDir)).toBe(false);
      const { code, stderr } = await cli(["export", "--dir", fixture.emails, "--outDir", outDir]);
      expect(code).toBe(2);
      expect(stderr).toMatch(/welcome\.jsx and welcome\.tsx/);
    } finally {
      await rm(twin);
    }
  });

  it("reports a template whose plain text can't be made, and writes no empty file for it", async () => {
    // The loader as it is, but with plain text that can't be made.
    vi.resetModules();
    vi.doMock("../src/server/loader", async (importOriginal) => {
      const loader = await importOriginal<typeof import("../src/server/loader")>();
      return {
        ...loader,
        createLoader: async (options: Parameters<typeof loader.createLoader>[0]) => {
          const real = await loader.createLoader(options);
          return { ...real, render: async (file: string) => ({ ...(await real.render(file)), text: "", textError: "No plain text for this one" }) };
        },
      };
    });
    try {
      const { exportTemplates: exportWithoutText } = await import("../src/server/export");
      const outDir = path.join(fixture.root, "out-no-text");
      const result = await exportWithoutText({ dir: fixture.emails, outDir, plainText: true });
      expect(result.failed).toBe(result.templates.length);
      expect(result.templates.find((t) => t.template === "welcome.tsx")?.error?.message).toMatch(/No plain text for this one/);
      expect(existsSync(path.join(outDir, "welcome.txt"))).toBe(false);
      // The HTML doesn't need the plain text.
      const html = await exportWithoutText({ dir: fixture.emails, outDir: path.join(fixture.root, "out-html-no-text") });
      expect(html.templates.find((t) => t.template === "welcome.tsx")?.error).toBeUndefined();
    } finally {
      vi.doUnmock("../src/server/loader");
      vi.resetModules();
    }
  });
});
