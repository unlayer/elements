import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * The built package in a Node script of its own: it must exit when it's done, on React 18 and 19, imported as a
 * module and required. React 19's browser server build opens a MessageChannel when it loads, which kept Node
 * running forever (see src/utils/message-channel-unref.cjs). Each script also renders Elements inside an app's own
 * server render (renderToJson in a component, then a hook), which is why Elements loads that build.
 */
const root = path.resolve(import.meta.dirname, "../..");
const dist = path.join(root, "dist");
const reacts = {
  "React 18": [path.join(root, "node_modules/react"), path.join(root, "node_modules/react-dom")],
  // React 19, from the migration CLI's tests (aliases there).
  "React 19": [path.join(root, "../migrate/node_modules/react19"), path.join(root, "../migrate/node_modules/react-dom19")],
};

const script = (format: "module" | "commonjs", noChannel = false) => {
  // No MessageChannel at all (Jest's jsdom environment): React 19's browser build would throw when it loads.
  const before = noChannel ? "delete globalThis.MessageChannel;\n" : "";
  const load = before + (format === "module"
    ? `import * as E from "@unlayer/react-elements"; import React from "react"; import { renderToString } from "react-dom/server"; import { renderToString as renderWithBrowserBuild } from "react-dom/server.browser";`
    : `const E = require("@unlayer/react-elements"); const React = require("react"); const { renderToString } = require("react-dom/server"); const { renderToString: renderWithBrowserBuild } = require("react-dom/server.browser");`);
  // (Elements first: an app's own import of React 19's browser build, before it, keeps Node running as it would without Elements.)
  return `${load}
const h = React.createElement;
const email = h(E.Email, null, h(E.Row, null, h(E.Column, null, h(E.Paragraph, null, "Hi there"))));
const html = E.renderToHtml(email);
// In an app's own render: the design worked out in a component, then a hook.
const Page = () => { const rows = React.useMemo(() => E.renderToJson(email).body.rows.length, []); const [open] = React.useState(false); return h("pre", null, rows + " rows, open=" + open); };
// The app's render with react-dom's browser build too, the one Elements renders with when nothing else is.
console.log(JSON.stringify({ react: React.version, html: html.includes("Hi there"), page: renderToString(h(Page)), pageWithBrowserBuild: renderWithBrowserBuild(h(Page)), channel: typeof globalThis.MessageChannel }));
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

describe("a browser bundle that renders with react-dom/server", () => {
  // There react-dom/server is react-dom's browser build, the one Elements renders with: one module. Called in a
  // component that render renders, Elements can't render with another, and says so (it broke the page's hooks).
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
`
        );
        const bundled = spawnSync(path.join(root, "node_modules/.bin/esbuild"), ["app.js", "--bundle", "--platform=browser", "--format=esm", "--outfile=out.mjs", "--define:process.env.NODE_ENV=\"production\"", "--log-level=error"], { cwd: dir, encoding: "utf8" });
        expect(bundled.status, bundled.stderr).toBe(0);
        const run = spawnSync(process.execPath, ["out.mjs"], { cwd: dir, encoding: "utf8", timeout: 20_000 });
        expect(run.status, run.stderr).toBe(0);
        const out = JSON.parse(run.stdout.trim().split("\n").pop()!);
        expect(out.html).toBe(true);
        // (React writes the ' as &#x27;.)
        expect(out.page).toMatch(/can(&#x27;|')t render inside its own render.*, open=false/);
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }, 30_000);
  }
});

describe("a Node script that renders with the built package", () => {
  for (const [name, [react, reactDom]] of Object.entries(reacts)) {
    for (const [format, noChannel] of [["module", false], ["commonjs", false], ["commonjs", true]] as const) {
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
          fs.writeFileSync(path.join(dir, "render.js"), script(format, noChannel));
          const run = spawnSync(process.execPath, ["render.js"], { cwd: dir, encoding: "utf8", timeout: 20_000 });
          expect(run.error, "still running after 20s: something keeps Node alive").toBeUndefined();
          expect(run.status, run.stderr).toBe(0);
          const out = JSON.parse(run.stdout.trim().split("\n").pop()!);
          expect(out.react.split(".")[0]).toBe(name.split(" ")[1]);
          expect(out).toMatchObject({ html: true, page: "<pre>1 rows, open=false</pre>", pageWithBrowserBuild: "<pre>1 rows, open=false</pre>" });
          // The stand-in is gone again, and the real one is back.
          expect(out.channel).toBe(noChannel ? "undefined" : "function");
        } finally {
          fs.rmSync(dir, { recursive: true, force: true });
        }
      }, 30_000);
    }
  }
});
