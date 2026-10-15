import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildPreview, startStaticServer } from "../src/server/build";
import { exportTemplates } from "../src/server/export";
import { loadVitePlugins } from "../src/server/loader";
import { fixtureCopy } from "./helpers";

let fixture: Awaited<ReturnType<typeof fixtureCopy>>;
const UI = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "dist", "ui");

beforeAll(async () => {
  fixture = await fixtureCopy("build");
});

afterAll(async () => {
  await fixture?.cleanup();
});

describe("static build", () => {
  it.skipIf(!existsSync(path.join(UI, "index.html")))("writes the app and every template's render and checks, with relative paths", async () => {
    const outDir = path.join(fixture.root, "preview-build");
    const result = await buildPreview({ dir: fixture.emails, outDir, uiDir: UI, projectId: 167 });
    expect(result).toMatchObject({ templates: 4, failed: [] });

    const index = await readFile(path.join(outDir, "index.html"), "utf8");
    expect(index).toContain("window.__ELEMENTS_PREVIEW_STATIC__ = true");
    expect(index).not.toMatch(/(src|href)="\/assets\//);

    const meta = JSON.parse(await readFile(path.join(outDir, "api", "meta.json"), "utf8"));
    expect(meta).toMatchObject({ static: true, dir: "emails", projectId: 167 });
    expect(meta.root).toBeUndefined();

    const welcome = JSON.parse(await readFile(path.join(outDir, "api", "render", "welcome.tsx.json"), "utf8"));
    expect(welcome).toMatchObject({ ok: true, mode: "email", previewProps: { name: "Ada", company: "Acme" } });
    expect(welcome.html).toContain('src="./static/logo.png"');
    expect(welcome.source).toContain("export default function Welcome");

    const receiptCompat = JSON.parse(await readFile(path.join(outDir, "api", "compat", "billing", "receipt.jsx.json"), "utf8"));
    const flex = receiptCompat.issues.find((i: any) => i.feature === "display:flex");
    expect(flex).toMatchObject({ source: "template" });
    expect(flex.sourceLines.length).toBeGreaterThan(0);
    const landingCompat = JSON.parse(await readFile(path.join(outDir, "api", "compat", "landing.tsx.json"), "utf8"));
    expect(landingCompat.applicable).toBe(false);

    const links = JSON.parse(await readFile(path.join(outDir, "api", "links", "welcome.tsx.json"), "utf8"));
    expect(links).toMatchObject({ applicable: true, network: false });
    expect(existsSync(path.join(outDir, "static", "logo.png"))).toBe(true);

    // `start` serves it on localhost, and nothing outside it.
    const server = await startStaticServer({ outDir, port: 0 });
    try {
      expect((await fetch(`${server.url}/api/templates.json`)).status).toBe(200);
      expect((await fetch(`${server.url}/`)).headers.get("content-type")).toMatch(/text\/html/);
      expect((await fetch(`${server.url}/..%2F..%2Fpackage.json`)).status).toBe(404);
      const foreign = await new Promise<number>((resolve, reject) => {
        const req = http.request(`${server.url}/`, { headers: { host: "attacker.example" } }, (res) => resolve(res.statusCode ?? 0));
        req.on("error", reject);
        req.end();
      });
      expect(foreign).toBe(403);
    } finally {
      await server.close();
    }
  });

  it("refuses to start without a build", async () => {
    await expect(startStaticServer({ outDir: path.join(fixture.root, "nothing-here"), port: 0 })).rejects.toThrow(/no preview build/);
  });
});

describe("Vite plugins", () => {
  it("loads plugins from a module and uses them to load templates", async () => {
    const pluginsFile = path.join(fixture.root, "preview-plugins.mjs");
    // A plugin that serves a virtual module, which a template imports.
    await writeFile(
      pluginsFile,
      `export default () => [{ name: "greeting", resolveId: (id) => (id === "virtual:greeting" ? "\\0greeting" : undefined), load: (id) => (id === "\\0greeting" ? 'export default "Hello from a plugin"' : undefined) }];\n`
    );
    await writeFile(
      path.join(fixture.emails, "plugin.tsx"),
      'import greeting from "virtual:greeting";\nimport { Email, Row, Column, Paragraph } from "@unlayer/react-elements";\nexport default function Plugin() { return <Email><Row><Column><Paragraph>{greeting}</Paragraph></Column></Row></Email>; }\n'
    );
    const plugins = await loadVitePlugins(pluginsFile);
    expect(plugins).toHaveLength(1);
    const outDir = path.join(fixture.root, "out-plugins");
    const result = await exportTemplates({ dir: fixture.emails, outDir, plugins, plainText: true });
    expect(result.templates.find((t) => t.template === "plugin.tsx")?.error).toBeUndefined();
    expect(await readFile(path.join(outDir, "plugin.txt"), "utf8")).toContain("Hello from a plugin");
  });

  it("says what a plugins module must export", async () => {
    const bad = path.join(fixture.root, "bad-plugins.mjs");
    await writeFile(bad, "export default 42;\n");
    await expect(loadVitePlugins(bad)).rejects.toThrow(/must export an array of Vite plugins/);
  });
});
