// @vitest-environment node
import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

/**
 * The built package in a Node script of its own: it must exit when it's done, on React 18 and 19, imported as a
 * module and required. React 19's browser server build opens a MessageChannel when it loads, which kept Node
 * running forever. Each script also works out a design inside an app's own server render (toDesign() in a
 * component, then a hook): in react-dom/server's renderToString, Elements loads another module of react-dom's then
 * (see src/utils/server-renderer.ts), which must not keep Node running either.
 */
const root = path.resolve(import.meta.dirname, "../..");
// esbuild through tsup, which depends on it (a clean install links no esbuild binary into this package).
const esbuild = createRequire(createRequire(path.join(root, "package.json")).resolve("tsup/package.json"))("esbuild") as typeof import("esbuild");
const dist = path.join(root, "dist");
const reacts = {
  "React 18": [path.join(root, "node_modules/react"), path.join(root, "node_modules/react-dom")],
  // React 19 (aliases in devDependencies).
  "React 19": [path.join(root, "node_modules/react19"), path.join(root, "node_modules/react-dom19")],
};
const built = () => ["primitives.js", "primitives.cjs", "builder.js", "builder.cjs"].every((file) => fs.existsSync(path.join(dist, file)));

/** A template, its HTML (render() is a promise) and its design worked out in an app's own render, then a hook. */
const RENDER = `const h = React.createElement;
const email = h(E.Email, null, h(E.Text, null, "Hi there"));
// In an app's own render: the design worked out in a component, then a hook.
const Page = () => { const rows = React.useMemo(() => B.toDesign(email).design.body.rows.length, []); const [open] = React.useState(false); return h("pre", null, rows + " rows, open=" + open); };`;

const script = (format: "module" | "commonjs", noChannel = false, react19 = false) => {
  // No MessageChannel, and on React 19 no TextEncoder (Jest 30's jsdom environment): React 19's browser build throws
  // when it loads. (On React 18, react-dom/server is the browser build there, which needs a TextEncoder itself.)
  const before = noChannel ? `delete globalThis.MessageChannel;${react19 ? " delete globalThis.TextEncoder;" : ""}\n` : "";
  const load =
    before +
    (format === "module"
      ? `import * as E from "@unlayer/react-elements"; import * as B from "@unlayer/react-elements/builder"; import React from "react"; import { renderToString } from "react-dom/server";`
      : `const E = require("@unlayer/react-elements"); const B = require("@unlayer/react-elements/builder"); const React = require("react"); const { renderToString } = require("react-dom/server");`);
  return `${load}
${RENDER}
// In react-dom/server's renderToString, Elements loads another module of react-dom's: Node still exits.
E.render(email).then(({ html }) => console.log(JSON.stringify({ react: React.version, html: html.includes("Hi there"), page: renderToString(h(Page)) })));
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
  fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ type }));
  return dir;
}

describe("importing the built package", () => {
  // Next.js 14's server layer can't render when a module loads, an edge runtime has no MessageChannel, and Jest's
  // jsdom no TextEncoder: importing Elements renders nothing, and loads no react-dom module but react-dom/server
  // (react-dom's browser build needs both when it loads).
  for (const [name, [react, reactDom]] of Object.entries(reacts)) {
    it(`renders nothing and loads only react-dom/server (${name})`, () => {
      expect(built(), "build the package first (pnpm build)").toBe(true);
      const dir = project(react, reactDom, "commonjs");
      try {
        fs.writeFileSync(
          path.join(dir, "import.js"),
          `const React = require("react");
const server = require("react-dom/server");
let calls = 0;
for (const name of ["renderToStaticMarkup", "renderToString"]) { const real = server[name]; server[name] = (...args) => (calls++, real(...args)); }
const E = require("@unlayer/react-elements");
const B = require("@unlayer/react-elements/builder");
const atImport = calls;
const reactDom = [...new Set(Object.keys(require.cache).filter((file) => /react-dom[\\/]/.test(file)).map((file) => file.split(/react-dom[\\/]/).pop()).filter((file) => file.startsWith("server")))];
const h = React.createElement;
const email = h(E.Email, null, h(E.Text, null, "Hi there"));
const rows = B.toDesign(email).design.body.rows.length;
E.render(email).then(({ html }) => console.log(JSON.stringify({ atImport, reactDom, rendered: calls > 0 && html.includes("Hi there") && rows === 1 })));
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
  // with no React, none was found (a design worked out in `useMemo`, then a hook, failed).
  const [react18, reactDom18] = reacts["React 18"];
  const [react19, reactDom19] = reacts["React 19"];
  const page = `import React from "react";
import { renderToString } from "react-dom/server";
import * as E from "@unlayer/react-elements";
import * as B from "@unlayer/react-elements/builder";
${RENDER}
const { html } = await E.render(email);
console.log(JSON.stringify({ react: React.version, page: renderToString(h(Page)) + ", " + html.includes("Hi there") }));
`;
  it("exits, and renders with hooks after, from a folder whose React is another", () => {
    expect(built(), "build the package first (pnpm build)").toBe(true);
    const parent = fs.mkdtempSync(path.join(os.tmpdir(), "elements-exit-"));
    const elsewhere = fs.mkdtempSync(path.join(os.tmpdir(), "elements-exit-"));
    try {
      fs.cpSync(fs.realpathSync(react19), path.join(parent, "node_modules/react"), { recursive: true });
      fs.cpSync(fs.realpathSync(reactDom19), path.join(parent, "node_modules/react-dom"), { recursive: true });
      const app = project(react18, reactDom18, "module", path.join(parent, "app"));
      fs.writeFileSync(path.join(app, "page.js"), page);
      // The email rendered on its own (no hook after it): it rendered, and then Node kept running.
      fs.writeFileSync(path.join(app, "body.js"), page.replace(/renderToString\(h\(Page\)\)/, '"<pre>1 rows, open=false</pre>"'));
      const body = spawnSync(process.execPath, [path.join(app, "body.js")], { cwd: parent, encoding: "utf8", timeout: 20_000 });
      expect(body.error, "still running after 20s: something keeps Node alive").toBeUndefined();
      expect(JSON.parse(body.stdout.trim().split("\n").pop()!)).toEqual({ react: "18.3.1", page: "<pre>1 rows, open=false</pre>, true" });
      // Run as its folder (its package's `main`), through a link to it elsewhere, imported by a script elsewhere, and
      // from `node -e`: Node's script isn't the app's, but Elements is where it is.
      fs.writeFileSync(path.join(app, "package.json"), JSON.stringify({ type: "module", main: "page.js" }));
      fs.symlinkSync(path.join(app, "page.js"), path.join(elsewhere, "link.js"));
      fs.writeFileSync(path.join(elsewhere, "launch.mjs"), `await import(${JSON.stringify(pathToFileURL(path.join(app, "page.js")).href)});`);
      const runs: [string, string[]][] = [
        ...[parent, elsewhere].map((cwd): [string, string[]] => [cwd, [path.join(app, "page.js")]]),
        [elsewhere, [app]],
        [elsewhere, [path.join(elsewhere, "link.js")]],
        [elsewhere, [path.join(elsewhere, "launch.mjs")]],
        [elsewhere, ["--input-type=module", "-e", `await import(${JSON.stringify(pathToFileURL(path.join(app, "page.js")).href)});`]],
      ];
      for (const [cwd, args] of runs) {
        const run = spawnSync(process.execPath, args, { cwd, encoding: "utf8", timeout: 20_000 });
        expect(run.error, `still running after 20s: node ${args.join(" ")}`).toBeUndefined();
        expect(run.status, `node ${args.join(" ")}: ${run.stderr}`).toBe(0);
        expect(JSON.parse(run.stdout.trim().split("\n").pop()!)).toEqual({ react: "18.3.1", page: "<pre>1 rows, open=false</pre>, true" });
      }
    } finally {
      fs.rmSync(parent, { recursive: true, force: true });
      fs.rmSync(elsewhere, { recursive: true, force: true });
    }
  }, 60_000);
});

describe("the built package's own requires", () => {
  const bundles = ["primitives.js", "primitives.cjs", "builder.js", "builder.cjs"];
  // A bundler warns on a require of a path worked out when it runs (and the migration CLI can't follow one): the
  // build requires modules by name only. (The CommonJS build once wrote `import.meta.url` as `require('u' + 'rl')`.)
  it("name the modules they load", () => {
    for (const file of bundles) {
      const code = fs.readFileSync(path.join(dist, file), "utf8");
      expect(code.match(/\brequire\((?!(?:"[^"]*"|'[^']*')\))[^)]*\)/g) ?? [], file).toEqual([]);
    }
  });

  // webpack 4 (Create React App 4, Storybook 6) can't parse `import.meta`.
  it("use no syntax webpack 4 can't parse (import.meta)", () => {
    for (const file of bundles) expect(fs.readFileSync(path.join(dist, file), "utf8"), file).not.toMatch(/import\.meta/);
  });
});

describe("a bundle with React in it, which renders with react-dom/server", () => {
  // There Elements has no other module of react-dom's that renders with that React (a browser bundle, a bundled
  // server): called in a component that render renders, it renders with the module it's in.
  for (const [name, [react, reactDom]] of Object.entries(reacts)) {
    for (const platform of ["browser", "node"] as const) {
      it(`renders an email, and works out its design in the app's components (${name}, ${platform} bundle)`, () => {
        expect(built(), "build the package first (pnpm build)").toBe(true);
        const dir = project(react, reactDom, "module");
        try {
          fs.writeFileSync(
            path.join(dir, "app.js"),
            `import * as E from "@unlayer/react-elements";
import * as B from "@unlayer/react-elements/builder";
import React from "react";
import { renderToString } from "react-dom/server";
const h = React.createElement;
const email = h(E.Email, null, h(E.Text, null, "Hi there"));
// Elements called in components the app's render renders (a preview's layout, a design worked out there).
const Preview = () => h("pre", null, E.outline(email));
const Rows = () => h("pre", null, B.toDesign(email).design.body.rows.length + " rows");
const page = renderToString(h("main", null, h(Preview), h(Rows)));
E.render(email).then(({ html }) => {
  console.log(JSON.stringify({ html: html.includes("Hi there"), preview: page.includes("Hi there"), rows: page.includes("1 rows") }));
${platform === "browser" ? "  // React 19's browser build, bundled for the app, keeps Node running (as without Elements).\n  process.exit(0);\n" : ""}});
`
          );
          // A Node bundle is CommonJS (an ES module bundle can't require Node's own modules, which react-dom's Node build
          // does), with one React: the project's, also for the packages linked in from the workspace.
          const out = platform === "node" ? "out.cjs" : "out.mjs";
          const alias = platform === "node" ? { react: path.join(dir, "node_modules/react"), "react-dom": path.join(dir, "node_modules/react-dom") } : {};
          esbuild.buildSync({ absWorkingDir: dir, entryPoints: ["app.js"], bundle: true, platform, format: platform === "node" ? "cjs" : "esm", outfile: out, alias, define: { "process.env.NODE_ENV": '"production"' }, logLevel: "error" });
          const run = spawnSync(process.execPath, [out], { cwd: dir, encoding: "utf8", timeout: 20_000 });
          expect(run.error, "still running after 20s: something keeps Node alive").toBeUndefined();
          expect(run.status, run.stderr).toBe(0);
          expect(JSON.parse(run.stdout.trim().split("\n").pop()!)).toEqual({ html: true, preview: true, rows: true });
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
        expect(built(), "build the package first (pnpm build)").toBe(true);
        const dir = project(react, reactDom, format);
        try {
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
