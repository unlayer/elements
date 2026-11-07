// @vitest-environment node

/**
 * Verifies the package's entries work in a plain Node.js environment (no
 * jsdom, no browser APIs). Catches module-level calls to client-only APIs
 * that would break Next.js Server Components or SSR runtimes.
 */

import { describe, it, expect } from "vitest";
import React from "react";
import { mkdirSync, mkdtempSync, readFileSync, symlinkSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";
import ts from "typescript";

describe("Node environment (no jsdom)", () => {
  it("imports the main entry and /builder without a browser", async () => {
    const main = await import("./primitives/index");
    const builder = await import("./builder/index");
    for (const name of ["Email", "Page", "Document", "Row", "Column", "Text", "Button", "render", "validate", "outline", "prepare", "component"] as const) expect(main[name], name).toBeTypeOf("function");
    expect(builder.toDesign).toBeTypeOf("function");
    expect(builder.fromDesign).toBeTypeOf("function");
    expect(typeof document).toBe("undefined");
  });

  it("render() produces HTML and plain text", async () => {
    const { render, Email, Text } = await import("./primitives/index");
    const { html, text } = await render(React.createElement(Email, null, React.createElement(Text, null, "Hello from Node")));
    expect(html).toMatch(/^<!DOCTYPE html/i);
    expect(html).toContain("Hello from Node");
    expect(text).toBe("Hello from Node");
  });

  it("toDesign() produces the builder's design, and fromDesign() reads it back", async () => {
    const { Email, Button } = await import("./primitives/index");
    const { toDesign, fromDesign } = await import("./builder/index");
    const { design } = toDesign(React.createElement(Email, null, React.createElement(Button, { href: "https://example.com" }, "Click")));
    expect(design.body.rows).toHaveLength(1);
    expect(design.body.rows[0].columns[0].contents).toHaveLength(1);
    expect(fromDesign(design).code).toContain("Click");
  });
});

describe("each entry's types, for every moduleResolution", () => {
  it("resolves the main entry, /builder, /pdf and /image to their declarations, under node (node10) too", () => {
    // A project's node_modules with this package in it, as an install has it.
    const dir = resolve(__dirname, "..");
    const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
    const project = mkdtempSync(join(tmpdir(), "elements-types-"));
    const installed = join(project, "node_modules", "@hyper-elements", "react");
    mkdirSync(join(project, "node_modules", "@hyper-elements"), { recursive: true });
    symlinkSync(dir, installed, "dir");
    // The declarations each entry names, which a build writes: there for the resolver whether built or not.
    const entries = Object.entries(pkg.exports as Record<string, { types?: string }>).filter(([, entry]) => typeof entry === "object" && entry.types);
    expect(entries.map(([subpath]) => subpath)).toEqual([".", "./builder", "./pdf", "./image"]);
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
      const name = `@hyper-elements/react${subpath.slice(1)}`;
      for (const [setting, options] of settings) {
        const resolved = ts.resolveModuleName(name, join(project, "index.ts"), options, host).resolvedModule?.resolvedFileName;
        found[`${setting} ${name}`] = resolved ? inPackage(resolved) : "(not found)";
        want[`${setting} ${name}`] = join(dir, entry.types!);
      }
    }
    expect(found).toEqual(want);
  });
});
