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
    ? `import React from "react"; import { renderToString } from "react-dom/server"; import * as E from "@unlayer/react-elements";`
    : `const React = require("react"); const { renderToString } = require("react-dom/server"); const E = require("@unlayer/react-elements");`);
  return `${load}
const h = React.createElement;
const email = h(E.Email, null, h(E.Row, null, h(E.Column, null, h(E.Paragraph, null, "Hi there"))));
const html = E.renderToHtml(email);
// In an app's own render: the design worked out in a component, then a hook.
const Page = () => { const rows = React.useMemo(() => E.renderToJson(email).body.rows.length, []); const [open] = React.useState(false); return h("pre", null, rows + " rows, open=" + open); };
console.log(JSON.stringify({ react: React.version, html: html.includes("Hi there"), page: renderToString(h(Page)), channel: typeof globalThis.MessageChannel }));
`;
};

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
          expect(out).toMatchObject({ html: true, page: "<pre>1 rows, open=false</pre>" });
          // The stand-in is gone again, and the real one is back.
          expect(out.channel).toBe(noChannel ? "undefined" : "function");
        } finally {
          fs.rmSync(dir, { recursive: true, force: true });
        }
      }, 30_000);
    }
  }
});
