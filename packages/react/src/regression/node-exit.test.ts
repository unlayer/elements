// @vitest-environment node
import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

/**
 * The built package in a Node script of its own: it must exit when it's done, on React 18 and 19, imported as a
 * module and required. React 19's browser server build opens a MessageChannel when it loads, which kept Node
 * running forever. Each script also renders Elements inside an app's own server render (renderToJson in a
 * component, then a hook): in react-dom/server's renderToString, Elements loads another module of react-dom's then
 * (see src/utils/server-renderer.ts), which must not keep Node running either.
 */
const root = path.resolve(import.meta.dirname, "../..");
// esbuild through tsup, which depends on it (a clean install links no esbuild binary into this package).
const esbuild = createRequire(createRequire(path.join(root, "package.json")).resolve("tsup/package.json"))("esbuild") as typeof import("esbuild");
const dist = path.join(root, "dist");
const reacts = {
  "React 18": [path.join(root, "node_modules/react"), path.join(root, "node_modules/react-dom")],
  // React 19, from the migration CLI's tests (aliases there).
  "React 19": [path.join(root, "../migrate/node_modules/react19"), path.join(root, "../migrate/node_modules/react-dom19")],
};

const script = (format: "module" | "commonjs", noChannel = false, react19 = false) => {
  // No MessageChannel, and on React 19 no TextEncoder (Jest 30's jsdom environment): React 19's browser build throws
  // when it loads. (On React 18, react-dom/server is the browser build there, which needs a TextEncoder itself.)
  const before = noChannel ? `delete globalThis.MessageChannel;${react19 ? " delete globalThis.TextEncoder;" : ""}\n` : "";
  const load = before + (format === "module"
    ? `import * as E from "@unlayer/react-elements"; import React from "react"; import { renderToString } from "react-dom/server";`
    : `const E = require("@unlayer/react-elements"); const React = require("react"); const { renderToString } = require("react-dom/server");`);
  return `${load}
const h = React.createElement;
const email = h(E.Email, null, h(E.Row, null, h(E.Column, null, h(E.Paragraph, null, "Hi there"))));
const html = E.renderToHtml(email);
// In an app's own render: the design worked out in a component, then a hook.
const Page = () => { const rows = React.useMemo(() => E.renderToJson(email).body.rows.length, []); const [open] = React.useState(false); return h("pre", null, rows + " rows, open=" + open); };
// In react-dom/server's renderToString, Elements loads another module of react-dom's: Node still exits.
console.log(JSON.stringify({ react: React.version, html: html.includes("Hi there"), page: renderToString(h(Page)) }));
`;
};

/** A project in a temporary folder with the built package and `react`/`react-dom` copied in (links would resolve back into the workspace). */
function project(react: string, reactDom: string, type: "module" | "commonjs"): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "elements-exit-"));
  const modules = path.join(dir, "node_modules");
  fs.cpSync(fs.realpathSync(react), path.join(modules, "react"), { recursive: true });
  fs.cpSync(fs.realpathSync(reactDom), path.join(modules, "react-dom"), { recursive: true });
  const elements = path.join(modules, "@unlayer/react-elements");
  fs.mkdirSync(elements, { recursive: true });
  fs.cpSync(dist, path.join(elements, "dist"), { recursive: true });
  fs.copyFileSync(path.join(root, "package.json"), path.join(elements, "package.json"));
  for (const dependency of ["exporters", "types"]) fs.symlinkSync(fs.realpathSync(path.join(root, "node_modules/@unlayer", dependency)), path.join(modules, "@unlayer", dependency), "dir");
  fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ type }));
  return dir;
}

describe("importing the built package", () => {
  // Next.js 14's server layer can't render when a module loads, an edge runtime has no MessageChannel, and Jest's
  // jsdom no TextEncoder: importing Elements renders nothing, and loads no react-dom module but react-dom/server
  // (react-dom's browser build needs both when it loads), as 0.1.22.
  for (const [name, [react, reactDom]] of Object.entries(reacts)) {
    it(`renders nothing and loads only react-dom/server (${name})`, () => {
      expect(fs.existsSync(path.join(dist, "index.cjs")), "build the package first (pnpm build)").toBe(true);
      const dir = project(react, reactDom, "commonjs");
      try {
        fs.writeFileSync(
          path.join(dir, "import.js"),
          `const React = require("react");
const server = require("react-dom/server");
let calls = 0;
for (const name of ["renderToStaticMarkup", "renderToString"]) { const real = server[name]; server[name] = (...args) => (calls++, real(...args)); }
const E = require("@unlayer/react-elements");
const atImport = calls;
const reactDom = [...new Set(Object.keys(require.cache).filter((file) => /react-dom[\\/]/.test(file)).map((file) => file.split(/react-dom[\\/]/).pop()).filter((file) => file.startsWith("server")))];
const h = React.createElement;
const html = E.renderToHtml(h(E.Email, null, h(E.Row, null, h(E.Column, null, h(E.Paragraph, null, "Hi there")))));
console.log(JSON.stringify({ atImport, reactDom, rendered: calls > 0 && html.includes("Hi there") }));
`
        );
        const run = spawnSync(process.execPath, ["import.js"], { cwd: dir, encoding: "utf8", timeout: 20_000 });
        expect(run.status, run.stderr).toBe(0);
        expect(JSON.parse(run.stdout.trim().split("\n").pop()!)).toEqual({ atImport: 0, reactDom: ["server.node.js"], rendered: true });
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }, 30_000);
  }
});

describe("a browser bundle that renders with react-dom/server", () => {
  // There react-dom/server is react-dom's browser build, and Elements has no other: called in a component that render
  // renders, it can't render, and says so (rendering would break the page's hooks).
  for (const [name, [react, reactDom]] of Object.entries(reacts)) {
    it(`gets a clear error where Elements is called in its render, and the page's hooks keep working (${name})`, () => {
      expect(fs.existsSync(path.join(dist, "index.js")), "build the package first (pnpm build)").toBe(true);
      const dir = project(react, reactDom, "module");
      try {
        fs.writeFileSync(
          path.join(dir, "app.js"),
          `import * as E from "@unlayer/react-elements";
import React from "react";
import { renderToString } from "react-dom/server";
const h = React.createElement;
const email = h(E.Email, null, h(E.Row, null, h(E.Column, null, h(E.Paragraph, null, "Hi there"))));
const Page = () => {
  let design;
  try { design = E.renderToJson(email).body.rows.length + " rows"; } catch (error) { design = error.message; }
  const [open] = React.useState(false);
  return h("pre", null, design + ", open=" + open);
};
console.log(JSON.stringify({ html: E.renderToHtml(email).includes("Hi there"), page: renderToString(h(Page)) }));
// React 19's browser build, bundled for the app, keeps Node running (as without Elements): this is about the error.
process.exit(0);
`
        );
        esbuild.buildSync({ absWorkingDir: dir, entryPoints: ["app.js"], bundle: true, platform: "browser", format: "esm", outfile: "out.mjs", define: { "process.env.NODE_ENV": '"production"' }, logLevel: "error" });
        const run = spawnSync(process.execPath, ["out.mjs"], { cwd: dir, encoding: "utf8", timeout: 20_000 });
        expect(run.status, run.stderr).toBe(0);
        const out = JSON.parse(run.stdout.trim().split("\n").pop()!);
        expect(out.html).toBe(true);
        // (React writes the ' as &#x27;.)
        expect(out.page).toMatch(/can(&#x27;|')t run inside a react-dom\/server render it would render with.*, open=false/);
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }, 30_000);
  }
});

describe("a Node script that renders with the built package", () => {
  for (const [name, [react, reactDom]] of Object.entries(reacts)) {
    for (const [format, noChannel] of [["module", false], ["commonjs", false], ["commonjs", true], ["module", true]] as const) {
      it(`exits when it's done (${name}, ${format}${noChannel ? ", where there's no MessageChannel" : ""})`, () => {
        expect(fs.existsSync(path.join(dist, "index.js")), "build the package first (pnpm build)").toBe(true);
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), "elements-exit-"));
        try {
          const modules = path.join(dir, "node_modules");
          // Real copies: links would resolve React's own imports back into the workspace.
          fs.cpSync(fs.realpathSync(react), path.join(modules, "react"), { recursive: true });
          fs.cpSync(fs.realpathSync(reactDom), path.join(modules, "react-dom"), { recursive: true });
          const elements = path.join(modules, "@unlayer/react-elements");
          fs.mkdirSync(elements, { recursive: true });
          fs.cpSync(dist, path.join(elements, "dist"), { recursive: true });
          fs.copyFileSync(path.join(root, "package.json"), path.join(elements, "package.json"));
          for (const dependency of ["exporters", "types"]) fs.symlinkSync(fs.realpathSync(path.join(root, "node_modules/@unlayer", dependency)), path.join(modules, "@unlayer", dependency), "dir");
          fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ type: format }));
          fs.writeFileSync(path.join(dir, "render.js"), script(format, noChannel, name === "React 19"));
          const run = spawnSync(process.execPath, ["render.js"], { cwd: dir, encoding: "utf8", timeout: 20_000 });
          expect(run.error, "still running after 20s: something keeps Node alive").toBeUndefined();
          expect(run.status, run.stderr).toBe(0);
          const out = JSON.parse(run.stdout.trim().split("\n").pop()!);
          expect(out.react.split(".")[0]).toBe(name.split(" ")[1]);
          expect(out).toMatchObject({ html: true, page: "<pre>1 rows, open=false</pre>" });
        } finally {
          fs.rmSync(dir, { recursive: true, force: true });
        }
      }, 30_000);
    }
  }
});
