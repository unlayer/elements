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
 * running forever. Each script also renders Elements inside an app's own server render (renderToJson in a
 * component, then a hook), which must not keep Node running either.
 */
const root = path.resolve(import.meta.dirname, "../..");
// esbuild through tsup, which depends on it (a clean install links no esbuild binary into this package).
const esbuild = createRequire(createRequire(path.join(root, "package.json")).resolve("tsup/package.json"))("esbuild") as typeof import("esbuild");
const dist = path.join(root, "dist");
const versionOf = (dir: string): string => JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8")).version;
const is19 = (dir: string) => Number.parseInt(versionOf(dir)) >= 19;
// This package's React (18 here; CI runs the suite on others too), and React 19 from the migration CLI's tests (its
// aliases): two installs.
const own = [path.join(root, "node_modules/react"), path.join(root, "node_modules/react-dom")];
const other = [path.join(root, "../migrate/node_modules/react19"), path.join(root, "../migrate/node_modules/react-dom19")];
const reacts: Record<string, string[]> = { [`React ${versionOf(own[0])}`]: own, [`React ${versionOf(other[0])}, another install`]: other };

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
// Inside react-dom/server's renderToString: Node still exits.
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
  // (the exporters', for web pages; react-dom's browser build needs both when it loads), as 0.1.22. Rendering an
  // email calls none of react-dom's renderers: Elements renders templates itself.
  for (const [name, [react, reactDom]] of Object.entries(reacts)) {
    it(`renders nothing and loads only react-dom/server, and renders an email without it (${name})`, () => {
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
console.log(JSON.stringify({ atImport, reactDom, rendered: html.includes("Hi there"), reactDomRenders: calls }));
`
        );
        const run = spawnSync(process.execPath, ["import.js"], { cwd: dir, encoding: "utf8", timeout: 20_000 });
        expect(run.status, run.stderr).toBe(0);
        expect(JSON.parse(run.stdout.trim().split("\n").pop()!)).toEqual({ atImport: 0, reactDom: ["server.node.js"], rendered: true, reactDomRenders: 0 });
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
  const [react18, reactDom18] = own;
  const [react19, reactDom19] = other;
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
      expect(JSON.parse(body.stdout.trim().split("\n").pop()!)).toEqual({ react: versionOf(react18), page: "<pre>1 rows, open=false, true</pre>" });
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
        expect(JSON.parse(run.stdout.trim().split("\n").pop()!)).toEqual({ react: versionOf(react18), page: "<pre>1 rows, open=false, true</pre>" });
      }
    } finally {
      fs.rmSync(parent, { recursive: true, force: true });
      fs.rmSync(elsewhere, { recursive: true, force: true });
    }
  }, 60_000);
});

describe("a template with a list written without keys (`items.map(…)`)", () => {
  // React warns about an element of such a list in its development build: React 18 where the list is made (the
  // template's own code), React 19 where it's rendered. Elements renders the template, and says so as React 19 does,
  // once for each component a list is in, not on every render.
  for (const [name, [react, reactDom]] of Object.entries(reacts)) {
    it(`warns once per component, as React does (${name})`, () => {
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
console.error = (message) => { if (String(message).startsWith("[Unlayer]") && /unique "key"/.test(String(message))) warnings++; };
for (const template of templates) for (const render of [E.renderToHtml, E.renderToPlainText, E.renderToJson, E.renderToHtml]) render(template);
console.log(JSON.stringify({ warnings }));
`
        );
        const run = spawnSync(process.execPath, ["keys.js"], { cwd: dir, encoding: "utf8", timeout: 20_000 });
        expect(run.status, run.stderr).toBe(0);
        // Lists in a Column, the root and a Row: one each, however many renders, on React 19 (React 18 said it before);
        // none in React's production build.
        expect(JSON.parse(run.stdout.trim().split("\n").pop()!)).toEqual({ warnings: is19(react) && process.env.NODE_ENV !== "production" ? 3 : 0 });
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }, 30_000);
  }
});

describe("the built package's own requires", () => {
  // A bundler warns on a require of a path worked out when it runs (and the migration CLI can't follow one): the
  // build requires modules by name only. (The CommonJS build once wrote `import.meta.url` as `require('u' + 'rl')`.)
  const entries = ["index", "tailwind", "font", "code", "markdown", "async"].flatMap((entry) => [`${entry}.js`, `${entry}.cjs`]);
  it("name the modules they load", () => {
    for (const file of entries) {
      const code = fs.readFileSync(path.join(dist, file), "utf8");
      expect(code.match(/\brequire\((?!(?:"[^"]*"|'[^']*')\))[^)]*\)/g) ?? [], file).toEqual([]);
    }
  });

  // webpack 4 (Create React App 4, Storybook 6), which 0.1.22 built with, can't parse `import.meta`.
  it("use no syntax webpack 4 can't parse (import.meta)", () => {
    for (const file of entries) expect(fs.readFileSync(path.join(dist, file), "utf8"), file).not.toMatch(/import\.meta/);
  });
});

describe("the Tailwind entry (@unlayer/react-elements/tailwind), built", () => {
  // Tailwind is an optional peer dependency: the main entry never loads it, and the Tailwind entry loads it only when
  // it's asked to compile, both as a module and required.
  const [react, reactDom] = own;
  const template = `const h = React.createElement;
const email = (root, block) => h(E.Email, { className: root }, h(E.Row, null, h(E.Column, null, h(E.Paragraph, { className: block }, "Hi there"))));`;
  const scripts = {
    // No tailwindcss: Elements renders (a <Tailwind> with no classes to read too), and compiling says what to install.
    without: `const plain = E.renderToHtml(h(T.Tailwind, { config: {} }, email()));
const error = await T.loadTailwind().then(() => "compiled", (e) => e.message);
console.log(JSON.stringify({ plain: plain.includes("Hi there"), same: E.Tailwind === undefined, error }));`,
    with: `const tw = await T.loadTailwind();
const html = E.renderToHtml(h(T.Tailwind, { tw }, email("bg-gray-100", "text-red-500")));
const json = await T.renderToJson(h(T.Tailwind, { config: { theme: { extend: { colors: { brand: "#007291" } } } } }, email(undefined, "text-brand")));
console.log(JSON.stringify({ html: html.includes("#f3f4f6") && html.includes("#fb2c36"), json: json.body.rows[0].columns[0].contents[0].values.color }));`,
  };
  for (const format of ["module", "commonjs"] as const) {
    for (const installed of [false, true]) {
      it(`loads ${installed ? "Tailwind to compile" : "without tailwindcss installed"} (${format})`, () => {
        expect(fs.existsSync(path.join(dist, "tailwind.cjs")), "build the package first (pnpm build)").toBe(true);
        const dir = project(react, reactDom, format);
        try {
          if (installed) fs.symlinkSync(fs.realpathSync(path.join(root, "node_modules/tailwindcss")), path.join(dir, "node_modules/tailwindcss"), "dir");
          const load =
            format === "module"
              ? `import * as E from "@unlayer/react-elements"; import * as T from "@unlayer/react-elements/tailwind"; import React from "react";`
              : `const E = require("@unlayer/react-elements"); const T = require("@unlayer/react-elements/tailwind"); const React = require("react");`;
          const body = `${template}\n${installed ? scripts.with : scripts.without}`;
          fs.writeFileSync(path.join(dir, "tailwind.js"), format === "module" ? `${load}\n${body}` : `${load}\n(async () => {\n${body}\n})();`);
          const run = spawnSync(process.execPath, ["tailwind.js"], { cwd: dir, encoding: "utf8", timeout: 20_000 });
          expect(run.status, run.stderr).toBe(0);
          const out = JSON.parse(run.stdout.trim().split("\n").pop()!);
          if (installed) expect(out).toEqual({ html: true, json: "#007291" });
          else expect(out).toEqual({ plain: true, same: true, error: expect.stringMatching(/loadTailwind needs Tailwind CSS 4: install it/) });
        } finally {
          fs.rmSync(dir, { recursive: true, force: true });
        }
      }, 30_000);
    }
  }

  it("leaves Tailwind out of the main entry", () => {
    for (const file of ["index.js", "index.cjs"]) expect(fs.readFileSync(path.join(dist, file), "utf8"), file).not.toMatch(/tailwindcss/);
  });
});

describe("the async renderers (@unlayer/react-elements/async), built", () => {
  // Async templates and components (anywhere, on React 18 too), use() on React 19, and thrown promises (Suspense).
  const script = (react19: boolean) => `const E = require("@unlayer/react-elements"); const A = require("@unlayer/react-elements/async"); const React = require("react");
const h = React.createElement;
const later = (value) => new Promise((resolve) => setTimeout(() => resolve(value), 5));
const Name = async () => h("b", null, await later("Ada"));
let state = {};
const Thrown = () => { state.promise ??= later("thrown").then((v) => (state.value = v)); if (!state.value) throw state.promise; return h(E.Paragraph, null, state.value); };
const used = later("used");
const Used = () => h(E.Paragraph, null, React.use(used));
const Inner = async () => h("i", null, await later("deep"));
const Deep = () => h(Inner);
// An async component another component of yours renders, which no Elements component's children hold.
const InnerBlock = async () => h(E.Paragraph, null, await later("deep block"));
const DeepBlock = () => h(InnerBlock);
async function Template() {
  const title = await later("Order 7");
  return h(E.Email, null, h(E.Row, null, h(E.Column, null, h(E.Heading, null, title), h(E.Paragraph, null, "Hi ", h(Name), "!"), h(Thrown)${react19 ? ", h(Used), h(E.Paragraph, null, h(Deep))" : ""})));
}
const boom = new Error("down");
async function Broken() { await later(null); throw boom; }
(async () => {
  const design = await A.renderToJson(h(Template));
  const texts = design.body.rows[0].columns[0].contents.map((c) => c.values.text);
  const failure = await A.renderToHtml(h(E.Email, null, h(E.Row, null, h(E.Column, null, h(Broken))))).catch((e) => e);
  const deep = await A.renderToHtml(h(E.Email, null, h(E.Row, null, h(E.Column, null, h(DeepBlock))))).then((html) => (html.includes("deep block") ? "rendered" : html), (e) => e.message);
  console.log(JSON.stringify({ texts, cause: failure.cause === boom, message: failure.message, deep }));
})();`;
  for (const [name, [react, reactDom]] of Object.entries(reacts)) {
    it(`resolve async templates and components, and Suspense (${name})`, () => {
      expect(fs.existsSync(path.join(dist, "async.cjs")), "build the package first (pnpm build)").toBe(true);
      const react19 = is19(react);
      const dir = project(react, reactDom, "commonjs");
      try {
        fs.writeFileSync(path.join(dir, "async.js"), script(react19));
        const run = spawnSync(process.execPath, ["async.js"], { cwd: dir, encoding: "utf8", timeout: 20_000 });
        expect(run.status, run.stderr).toBe(0);
        const out = JSON.parse(run.stdout.trim().split("\n").pop()!);
        expect(out.texts).toEqual(["Order 7", "Hi <b>Ada</b>!", "thrown", ...(react19 ? ["used", "<i>deep</i>"] : [])]);
        expect(out).toMatchObject({ cause: true, message: "[Unlayer] down (in <Broken> at Row 1 › Column 1 › Broken)" });
        // An async component another component renders: rendered on React 18 too (Elements renders it, not react-dom).
        expect(out.deep).toBe("rendered");
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }, 30_000);
  }
});

describe("the Markdown, code and font entries, built", () => {
  // Their parser and highlighter are built in: a project installs nothing more, as a module or required, and the
  // main entry has neither.
  const [react, reactDom] = own;
  const body = `const h = React.createElement;
const email = h(E.Email, null, h(F.Font, { family: "Inter", url: "https://fonts.example.com/inter.css", default: true }), h(E.Row, null, h(E.Column, null,
  h(M.Markdown, null, "# Hi\\n\\nSome **bold** text.\\n\\n\\u0060\\u0060\\u0060js\\nconst a = 1;\\n\\u0060\\u0060\\u0060"),
  h(E.Paragraph, null, "Run ", h(C.CodeInline, null, "npm i")))));
const json = E.renderToJson(email);
const html = E.renderToHtml(email);
console.log(JSON.stringify({ blocks: json.body.rows[0].columns[0].contents.map((c) => c.type), font: json.body.values.fontFamily.label, keyword: html.includes(">const</span>"), link: html.includes("inter.css") }));`;
  for (const format of ["module", "commonjs"] as const) {
    it(`render, with nothing more installed (${format})`, () => {
      expect(fs.existsSync(path.join(dist, "markdown.cjs")), "build the package first (pnpm build)").toBe(true);
      const dir = project(react, reactDom, format);
      try {
        const load =
          format === "module"
            ? `import * as E from "@unlayer/react-elements"; import * as M from "@unlayer/react-elements/markdown"; import * as C from "@unlayer/react-elements/code"; import * as F from "@unlayer/react-elements/font"; import React from "react";`
            : `const E = require("@unlayer/react-elements"); const M = require("@unlayer/react-elements/markdown"); const C = require("@unlayer/react-elements/code"); const F = require("@unlayer/react-elements/font"); const React = require("react");`;
        fs.writeFileSync(path.join(dir, "content.js"), `${load}\n${body}`);
        const run = spawnSync(process.execPath, ["content.js"], { cwd: dir, encoding: "utf8", timeout: 20_000 });
        expect(run.status, run.stderr).toBe(0);
        expect(JSON.parse(run.stdout.trim().split("\n").pop()!)).toEqual({ blocks: ["heading", "text", "html", "text"], font: "Inter", keyword: true, link: true });
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }, 30_000);
  }

  it("leave the parser and the highlighter out of the main entry", () => {
    for (const file of ["index.js", "index.cjs"]) expect(fs.readFileSync(path.join(dist, file), "utf8"), file).not.toMatch(/marked|highlight\.js|hljs/i);
  });
});

describe("a bundle with React in it, which renders with react-dom/server", () => {
  // Called in a component that render renders (a browser bundle, a bundled server), Elements renders, as 0.1.22 did
  // (0.2 threw there, and React 19 kept Node running). An email that render renders itself renders too.
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
          fs.writeFileSync(path.join(dir, "render.js"), script(format, noChannel, is19(react)));
          const run = spawnSync(process.execPath, ["render.js"], { cwd: dir, encoding: "utf8", timeout: 20_000 });
          expect(run.error, "still running after 20s: something keeps Node alive").toBeUndefined();
          expect(run.status, run.stderr).toBe(0);
          const out = JSON.parse(run.stdout.trim().split("\n").pop()!);
          expect(out.react).toBe(versionOf(react));
          expect(out).toMatchObject({ html: true, page: "<pre>1 rows, open=false</pre>" });
        } finally {
          fs.rmSync(dir, { recursive: true, force: true });
        }
      }, 30_000);
    }
  }
});
