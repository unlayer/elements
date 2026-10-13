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
function project(react: string, reactDom: string, type: "module" | "commonjs", dir = fs.mkdtempSync(path.join(os.tmpdir(), "elements-exit-"))): string {
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

describe("an app that's a module, started from another folder than its own", () => {
  // The second react-dom module was looked for from the folder Node was started in: from a folder whose React is 19,
  // a React 18 app loaded React 19's browser build (rejected, but its MessageChannel kept Node running), and from one
  // with no React, none was found (a design worked out in `useMemo`, then a hook, failed). 0.1.22 did neither.
  const [react18, reactDom18] = reacts["React 18"];
  const [react19, reactDom19] = reacts["React 19"];
  const page = `import React from "react";
import { renderToString } from "react-dom/server";
import * as E from "@unlayer/react-elements";
const h = React.createElement;
const email = h(E.Email, null, h(E.Row, null, h(E.Column, null, h(E.Paragraph, null, "Hi there"))));
const Page = () => { const rows = React.useMemo(() => E.renderToJson(email).body.rows.length, []); const [open] = React.useState(false); return h("pre", { dangerouslySetInnerHTML: { __html: rows + " rows, open=" + open + ", " + E.renderToHtml(email).includes("Hi there") } }); };
console.log(JSON.stringify({ react: React.version, page: renderToString(h(Page)) }));
`;
  it("exits, and renders with hooks after, from a folder whose React is another", () => {
    expect(fs.existsSync(path.join(dist, "index.js")), "build the package first (pnpm build)").toBe(true);
    const parent = fs.mkdtempSync(path.join(os.tmpdir(), "elements-exit-"));
    const elsewhere = fs.mkdtempSync(path.join(os.tmpdir(), "elements-exit-"));
    try {
      fs.cpSync(fs.realpathSync(react19), path.join(parent, "node_modules/react"), { recursive: true });
      fs.cpSync(fs.realpathSync(reactDom19), path.join(parent, "node_modules/react-dom"), { recursive: true });
      const app = project(react18, reactDom18, "module", path.join(parent, "app"));
      fs.writeFileSync(path.join(app, "page.js"), page);
      // The email in the page's body (no hook after it): it rendered, and then Node kept running.
      fs.writeFileSync(path.join(app, "body.js"), page.replace(/const Page = .*\n/, 'const Page = () => h("pre", { dangerouslySetInnerHTML: { __html: "1 rows, open=false, " + E.renderToHtml(email).includes("Hi there") } });\n'));
      const body = spawnSync(process.execPath, [path.join(app, "body.js")], { cwd: parent, encoding: "utf8", timeout: 20_000 });
      expect(body.error, "still running after 20s: something keeps Node alive").toBeUndefined();
      expect(JSON.parse(body.stdout.trim().split("\n").pop()!)).toEqual({ react: "18.3.1", page: "<pre>1 rows, open=false, true</pre>" });
      for (const cwd of [parent, elsewhere]) {
        const run = spawnSync(process.execPath, [path.join(app, "page.js")], { cwd, encoding: "utf8", timeout: 20_000 });
        expect(run.error, `still running after 20s, started from ${cwd === parent ? "the folder above" : "another folder"}`).toBeUndefined();
        expect(run.status, run.stderr).toBe(0);
        expect(JSON.parse(run.stdout.trim().split("\n").pop()!)).toEqual({ react: "18.3.1", page: "<pre>1 rows, open=false, true</pre>" });
      }
    } finally {
      fs.rmSync(parent, { recursive: true, force: true });
      fs.rmSync(elsewhere, { recursive: true, force: true });
    }
  }, 60_000);
});

describe("a template with a list written without keys (`items.map(…)`)", () => {
  // React 19 warns about an element of such a list wherever it's rendered, on every render. 0.1.22 never rendered the
  // template's lists, so it said nothing: the collecting render places copies of them, with the keys a list gives.
  for (const [name, [react, reactDom]] of Object.entries(reacts)) {
    it(`renders without React's key warning, as 0.1.22 did (${name})`, () => {
      expect(fs.existsSync(path.join(dist, "index.cjs")), "build the package first (pnpm build)").toBe(true);
      const dir = project(react, reactDom, "commonjs");
      try {
        fs.writeFileSync(
          path.join(dir, "keys.js"),
          `const React = require("react");
const E = require("@unlayer/react-elements");
const h = React.createElement;
const items = ["Shoes", "Hat"];
const Item = ({ t }) => h(E.Paragraph, null, t);
const templates = [
  h(E.Email, null, h(E.Row, null, h(E.Column, null, items.map((t) => h(E.Paragraph, null, t))))),
  h(E.Email, null, h(E.Row, null, h(E.Column, null, items.map((t) => h(Item, { t }))))),
  h(E.Email, null, h(E.Row, null, h(E.Column, null, items.map((t) => h("p", null, t)), h(E.Paragraph, null, "After")))),
  h(E.Email, null, items.map((t) => h(E.Row, null, h(E.Column, null, h(E.Paragraph, null, t))))),
  h(E.Email, null, h(E.Row, null, items.map((t) => h(E.Column, null, h(E.Paragraph, null, t))))),
];
// React 18 warns once, where the list is made (the template's own code, as with 0.1.22): only renders are counted.
let warnings = 0;
console.error = (message) => { if (/unique "key"/.test(String(message))) warnings++; };
for (const template of templates) for (const render of [E.renderToHtml, E.renderToPlainText, E.renderToJson, E.renderToHtml]) render(template);
console.log(JSON.stringify({ warnings }));
`
        );
        const run = spawnSync(process.execPath, ["keys.js"], { cwd: dir, encoding: "utf8", timeout: 20_000 });
        expect(run.status, run.stderr).toBe(0);
        expect(JSON.parse(run.stdout.trim().split("\n").pop()!)).toEqual({ warnings: 0 });
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }, 30_000);
  }
});

describe("the built package's own requires", () => {
  // A bundler warns on a require of a path worked out when it runs (and the migration CLI can't follow one): the
  // build requires modules by name only. (The CommonJS build once wrote `import.meta.url` as `require('u' + 'rl')`.)
  it("name the modules they load", () => {
    for (const file of ["index.js", "index.cjs"]) {
      const code = fs.readFileSync(path.join(dist, file), "utf8");
      expect(code.match(/\brequire\((?!(?:"[^"]*"|'[^']*')\))[^)]*\)/g) ?? [], file).toEqual([]);
    }
  });

  // webpack 4 (Create React App 4, Storybook 6), which 0.1.22 built with, can't parse `import.meta`.
  it("use no syntax webpack 4 can't parse (import.meta)", () => {
    for (const file of ["index.js", "index.cjs"]) expect(fs.readFileSync(path.join(dist, file), "utf8"), file).not.toMatch(/import\.meta/);
  });
});

describe("a bundle with React in it, which renders with react-dom/server", () => {
  // There Elements has no other module of react-dom's that renders with that React (a browser bundle, a bundled
  // server): called in a component that render renders, it renders with the module it's in, as 0.1.22 did (it threw,
  // and React 19 kept Node running). An email that render renders itself renders too.
  for (const [name, [react, reactDom]] of Object.entries(reacts)) {
    for (const platform of ["browser", "node"] as const) {
      it(`renders an email it renders, and Elements called in its components (${name}, ${platform} bundle)`, () => {
        expect(fs.existsSync(path.join(dist, "index.js")), "build the package first (pnpm build)").toBe(true);
        const dir = project(react, reactDom, "module");
        try {
          fs.writeFileSync(
            path.join(dir, "app.js"),
            `import * as E from "@unlayer/react-elements";
import React from "react";
import { renderToString, renderToStaticMarkup } from "react-dom/server";
const h = React.createElement;
const email = h(E.Email, null, h(E.Row, null, h(E.Column, null, h(E.Paragraph, null, "Hi there"))));
// The email rendered with react-dom/server itself (an iframe preview, a bundled server's SSR): its body renders, as in
// 0.1.22 (Body renders it with the module it's in).
const direct = renderToStaticMarkup(email).includes("Hi there");
// Elements called in components the app's render renders (a preview, a design worked out there).
const Preview = () => h("iframe", { srcDoc: E.renderToHtml(email) });
const Rows = () => h("pre", null, E.renderToJson(email).body.rows.length + " rows");
const page = renderToString(h("main", null, h(Preview), h(Rows)));
console.log(JSON.stringify({ html: E.renderToHtml(email).includes("Hi there"), direct, preview: page.includes("Hi there"), rows: page.includes("1 rows") }));
${platform === "browser" ? "// React 19's browser build, bundled for the app, keeps Node running (as without Elements).\nprocess.exit(0);\n" : ""}`
          );
          // A Node bundle is CommonJS (an ES module bundle can't require Node's own modules, which react-dom's Node build
          // does), with one React: the project's, also for the packages linked in from the workspace.
          const out = platform === "node" ? "out.cjs" : "out.mjs";
          const alias = platform === "node" ? { react: path.join(dir, "node_modules/react"), "react-dom": path.join(dir, "node_modules/react-dom") } : {};
          esbuild.buildSync({ absWorkingDir: dir, entryPoints: ["app.js"], bundle: true, platform, format: platform === "node" ? "cjs" : "esm", outfile: out, alias, define: { "process.env.NODE_ENV": '"production"' }, logLevel: "error" });
          const run = spawnSync(process.execPath, [out], { cwd: dir, encoding: "utf8", timeout: 20_000 });
          expect(run.error, "still running after 20s: something keeps Node alive").toBeUndefined();
          expect(run.status, run.stderr).toBe(0);
          expect(JSON.parse(run.stdout.trim().split("\n").pop()!)).toEqual({ html: true, direct: true, preview: true, rows: true });
        } finally {
          fs.rmSync(dir, { recursive: true, force: true });
        }
      }, 30_000);
    }
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
