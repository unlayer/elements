// A project with Tailwind CSS 3 and prettier 2 of its own (see package.json), with the packed Elements installed in it
// (`npm install --no-save <tarball>`). Tailwind and prettier are optional peer dependencies of any version, so the
// install keeps the project's own: an 0.3.0 build's (">=4.0.0", ">=3.0.0") failed it with npm's ERESOLVE. Elements
// renders, and what needs Tailwind CSS 4 or prettier 3 says to upgrade, as a module and required.
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";

// Nothing here waits on the network: a render that hangs fails the check rather than the job's timeout.
const timer = setTimeout(() => {
  console.error("✗ still running after 60s");
  process.exit(1);
}, 60_000);

const require = createRequire(import.meta.url);
const versionOf = (name) => JSON.parse(fs.readFileSync(new URL(`./node_modules/${name}/package.json`, import.meta.url), "utf8")).version;
// The project's own, not another copy installed for Elements.
assert.equal(versionOf("tailwindcss"), "3.4.17");
assert.equal(versionOf("prettier"), "2.8.8");
for (const name of ["tailwindcss", "prettier"]) assert.equal(fs.existsSync(new URL(`./node_modules/@unlayer/react-elements/node_modules/${name}`, import.meta.url)), false, `a ${name} of Elements' own`);

const tailwind = "[Unlayer] loadTailwind needs Tailwind CSS 4, and the tailwindcss installed is Tailwind CSS 3 or older (a PostCSS plugin): upgrade it with `npm install tailwindcss@4` (it's an optional peer dependency of @unlayer/react-elements).";
const prettier = "[Unlayer] `pretty` needs prettier 3, and prettier 2.8.8 is installed: upgrade it with `npm install prettier@3` (an optional peer dependency of @unlayer/react-elements).";

const React = require("react");
const h = React.createElement;
const builds = {
  module: { E: await import("@unlayer/react-elements"), T: await import("@unlayer/react-elements/tailwind"), A: await import("@unlayer/react-elements/async") },
  commonjs: { E: require("@unlayer/react-elements"), T: require("@unlayer/react-elements/tailwind"), A: require("@unlayer/react-elements/async") },
};
for (const [format, { E, T, A }] of Object.entries(builds)) {
  const email = h(E.Email, null, h(E.Row, null, h(E.Column, null, h(E.Paragraph, { className: "text-red-500" }, "Hi there"))));
  assert.ok(E.renderToHtml(email).includes("Hi there"), `${format}: an email renders`);
  assert.ok((await A.renderToHtml(email)).includes("Hi there"), `${format}: an email renders with the async renderers`);
  await assert.rejects(T.loadTailwind(), { message: tailwind }, `${format}: loadTailwind`);
  await assert.rejects(T.renderToHtml(h(T.Tailwind, { config: {} }, email)), { message: tailwind }, `${format}: <Tailwind config>`);
  await assert.rejects(A.pretty("<p>Hi there</p>"), { message: prettier }, `${format}: pretty`);
  await assert.rejects(A.renderToHtml(email, { pretty: true }), { message: prettier }, `${format}: renderToHtml's pretty`);
  console.info(`✓ ${format}: installs with Tailwind CSS 3 and prettier 2, renders, and says to upgrade them`);
}
clearTimeout(timer);
