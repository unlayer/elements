// @vitest-environment node

/**
 * Verifies the package works in a plain Node.js environment (no jsdom,
 * no browser APIs). Catches module-level calls to client-only APIs like
 * createContext that would break Next.js Server Components or SSR runtimes.
 */

import { describe, it, expect } from "vitest";
import React from "react";
import { mkdirSync, mkdtempSync, readFileSync, symlinkSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";
import ts from "typescript";

describe("Node environment (no jsdom)", () => {
  it("imports without calling createContext at module level", async () => {
    const mod = await import("./index");

    expect(mod.Button).toBeDefined();
    expect(mod.Body).toBeDefined();
    expect(mod.Row).toBeDefined();
    expect(mod.Column).toBeDefined();
    expect(mod.renderToHtml).toBeDefined();
    expect(mod.UnlayerProvider).toBeDefined();
  });

  it("renderToHtml produces HTML", async () => {
    const { renderToHtml, Body, Row, Column, Paragraph } = await import("./index");

    const html = renderToHtml(
      React.createElement(Body, null,
        React.createElement(Row, null,
          React.createElement(Column, null,
            React.createElement(Paragraph, { mode: "web" }, "Hello from Node")
          )
        )
      ),
      { mode: "web" }
    );

    expect(html).toContain("Hello from Node");
    expect(typeof html).toBe("string");
  });

  it("renderToJson produces DesignJSON", async () => {
    const { renderToJson, Body, Row, Column, Button } = await import("./index");

    const json = renderToJson(
      React.createElement(Body, null,
        React.createElement(Row, null,
          React.createElement(Column, null,
            React.createElement(Button, { mode: "web" }, "Click")
          )
        )
      )
    );

    expect(json).toHaveProperty("body");
    expect(json).toHaveProperty("body.rows");
    expect(json.body.rows).toHaveLength(1);
    expect(json.body.rows[0].columns[0].contents).toHaveLength(1);
  });

  it("renderToPlainText produces text", async () => {
    const { renderToPlainText, Body, Row, Column, Paragraph } = await import("./index");

    const text = renderToPlainText(
      React.createElement(Body, null,
        React.createElement(Row, null,
          React.createElement(Column, null,
            React.createElement(Paragraph, { mode: "web" }, "Plain text test")
          )
        )
      )
    );

    expect(typeof text).toBe("string");
  });
});

describe("each entry's types, for every moduleResolution", () => {
  it("resolves the main entry, /legacy and /builder to their declarations, under node (node10) too", () => {
    // A project's node_modules with this package in it, as an install has it.
    const dir = resolve(__dirname, "..");
    const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
    const project = mkdtempSync(join(tmpdir(), "elements-types-"));
    const installed = join(project, "node_modules", "@unlayer", "react-elements");
    mkdirSync(join(project, "node_modules", "@unlayer"), { recursive: true });
    symlinkSync(dir, installed, "dir");
    // The declarations each entry names, which a build writes: there for the resolver whether built or not.
    const entries = Object.entries(pkg.exports as Record<string, { types?: string }>).filter(([, entry]) => typeof entry === "object" && entry.types);
    expect(entries.map(([subpath]) => subpath)).toEqual([".", "./legacy", "./builder"]);
    const declared = new Set(entries.map(([, entry]) => join(dir, entry.types!)));
    const inPackage = (file: string) => (file.startsWith(installed) ? join(dir, file.slice(installed.length)) : file);
    const host: ts.ModuleResolutionHost = { ...ts.sys, fileExists: (file) => declared.has(inPackage(file)) || ts.sys.fileExists(file) };
    const settings: Array<[string, ts.CompilerOptions]> = [
      ["node10", { moduleResolution: ts.ModuleResolutionKind.Node10, module: ts.ModuleKind.CommonJS }],
      ["node16", { moduleResolution: ts.ModuleResolutionKind.Node16, module: ts.ModuleKind.Node16 }],
      ["bundler", { moduleResolution: ts.ModuleResolutionKind.Bundler, module: ts.ModuleKind.ESNext }],
    ];
    const found: Record<string, string> = {};
    const want: Record<string, string> = {};
    for (const [subpath, entry] of entries) {
      const name = `@unlayer/react-elements${subpath.slice(1)}`;
      for (const [setting, options] of settings) {
        const resolved = ts.resolveModuleName(name, join(project, "index.ts"), options, host).resolvedModule?.resolvedFileName;
        found[`${setting} ${name}`] = resolved ? inPackage(resolved) : "(not found)";
        want[`${setting} ${name}`] = join(dir, entry.types!);
      }
    }
    expect(found).toEqual(want);
  });
});
