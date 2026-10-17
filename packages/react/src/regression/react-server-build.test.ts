// @vitest-environment node
/**
 * The built package with React's react-server build, as Next.js's Server Components and route handlers give it (its
 * `react-server` export condition): a template's hooks that build has (useId, useMemo, use) work, one it hasn't
 * (useState) fails with a RenderError that says so, and React's dispatcher slot is as it was after. Each ESM entry
 * loads there too: that build has no createContext or useContext, and a module importing one by name fails to link
 * (in Node, and in webpack, which fails the build: Next.js 15's default bundler). React 18 has no react-server build.
 */
import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import React from "react";

const root = path.resolve(import.meta.dirname, "../..");
const dist = path.join(root, "dist");
const reactDir = fs.realpathSync(path.join(root, "node_modules/react"));

// `react` (and its JSX runtime) as the react-server build, wherever it's required: what the export condition does.
const server = `const server = { react: ${JSON.stringify(path.join(reactDir, "react.react-server.js"))}, "react/jsx-runtime": ${JSON.stringify(path.join(reactDir, "jsx-runtime.react-server.js"))} };`;
const required = `${server}
const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) { return server[request] ?? resolveFilename.call(this, request, ...rest); };`;
const script = `const Module = require("module");
${required}
const React = require("react");
const E = require("@unlayer/react-elements");
const h = React.createElement;
const slot = React.__SERVER_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
const before = slot.H;
const Greeting = () => h(E.Paragraph, null, "Hello " + React.useMemo(() => "Ada", []) + " " + React.useId());
const Counter = () => { const [n] = React.useState(1); return h(E.Paragraph, null, String(n)); };
const email = (block) => h(E.Email, null, h(E.Row, null, h(E.Column, null, h(block))));
const html = E.renderToHtml(email(Greeting));
let failure;
try { E.renderToHtml(email(Counter)); } catch (error) { failure = error; }
console.log(JSON.stringify({ react: React.version, hasUseState: typeof React.useState, greeting: /Hello Ada /.test(html), error: failure && { name: failure.name, message: failure.message, cause: String(failure.cause) }, restored: slot.H === before }));
`;

// The same for ESM (a resolve hook for `import "react"`, and `require` as above for the CommonJS modules it loads),
// each entry imported.
const hooks = `import { pathToFileURL } from "node:url";
${server}
export async function resolve(specifier, context, next) {
  return server[specifier] ? { url: pathToFileURL(server[specifier]).href, shortCircuit: true } : next(specifier, context);
}
`;
const entries = ["", "/async", "/tailwind", "/font", "/head", "/code", "/markdown", "/codegen"];
const esm = `import Module, { register } from "node:module";
${required}
register("./hooks.mjs", import.meta.url);
const loaded = [];
for (const entry of ${JSON.stringify(entries)}) {
  try { await import("@unlayer/react-elements" + entry); loaded.push(entry || "."); } catch (error) { loaded.push((entry || ".") + ": " + error.message); }
}
const React = await import("react");
const out = { hasCreateContext: typeof React.createContext, loaded };
if (loaded[0] === ".") {
  const E = await import("@unlayer/react-elements");
  const h = React.createElement;
  const html = E.renderToHtml(h(E.UnlayerProvider, { config: { textDirection: "rtl" } }, h(E.Email, null, h(E.Row, null, h(E.Column, null, h(E.Paragraph, null, "Hello Ada"))))));
  Object.assign(out, { greeting: /Hello Ada/.test(html), provider: /<html[^>]* dir="rtl"/.test(html) });
}
console.log(JSON.stringify(out));
`;

// A folder with React, react-dom and the built package in its node_modules, and the script; what it printed last.
function runWithPackage(file: string, source: string, extra: Record<string, string> = {}) {
  expect(fs.existsSync(path.join(dist, "index.cjs")), "build the package first (pnpm build)").toBe(true);
  // Its real path: macOS's tmpdir is a symlink, and ESM would load `react` twice, by that path and by the real one.
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "elements-react-server-")));
  try {
    const modules = path.join(dir, "node_modules");
    fs.cpSync(reactDir, path.join(modules, "react"), { recursive: true });
    fs.cpSync(fs.realpathSync(path.join(root, "node_modules/react-dom")), path.join(modules, "react-dom"), { recursive: true });
    const elements = path.join(modules, "@unlayer/react-elements");
    fs.mkdirSync(elements, { recursive: true });
    fs.cpSync(dist, path.join(elements, "dist"), { recursive: true });
    fs.copyFileSync(path.join(root, "package.json"), path.join(elements, "package.json"));
    for (const dependency of ["exporters", "types"]) fs.symlinkSync(fs.realpathSync(path.join(root, "node_modules/@unlayer", dependency)), path.join(modules, "@unlayer", dependency), "dir");
    fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ type: "commonjs" }));
    // The script's React is the copy's: `react` resolved from there.
    const copied = (text: string) => text.replaceAll(JSON.stringify(reactDir).slice(1, -1), path.join(modules, "react"));
    for (const [name, text] of Object.entries({ ...extra, [file]: source })) fs.writeFileSync(path.join(dir, name), copied(text));
    const run = spawnSync(process.execPath, [file], { cwd: dir, encoding: "utf8", timeout: 20_000 });
    expect(run.status, run.stderr).toBe(0);
    return JSON.parse(run.stdout.trim().split("\n").pop()!);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe.runIf(Number.parseInt(React.version) >= 19)("React's react-server build", () => {
  it("renders a template's hooks it has, and names the one it hasn't", () => {
    const out = runWithPackage("server.js", script);
    expect(out).toMatchObject({ hasUseState: "undefined", greeting: true, restored: true });
    expect(out.error).toMatchObject({ name: "RenderError", cause: expect.stringMatching(/useState/) });
    expect(out.error.message).toBe(
      "[Unlayer] it calls useState, which React Server Components' React doesn't have (Next.js route handlers and Server Components render with it; it has use, useId, useMemo and useCallback): render this template from a Client Component or plain Node.js code, or keep useState out of it (in <Counter> at Row 1 › Column 1 › Counter)"
    );
  }, 30_000);

  it("loads each ESM entry, which imports nothing by name that it lacks, and renders", () => {
    const out = runWithPackage("server.mjs", esm, { "hooks.mjs": hooks });
    expect(out).toEqual({ hasCreateContext: "undefined", loaded: entries.map((entry) => entry || "."), greeting: true, provider: true });
  }, 30_000);
});
