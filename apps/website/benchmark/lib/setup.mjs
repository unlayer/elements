// Installs Hyper Elements into node_modules under its published name, from a built checkout of the engine:
//   HYPER_ELEMENTS_PACKAGE=/path/to/checkout/packages/react node lib/setup.mjs
// Its dist/ is linked, and its agent guide copied with the package's new name. Once @hyper-elements/react
// is on npm, add it to package.json instead and skip this.
import { mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const bench = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = process.env.HYPER_ELEMENTS_PACKAGE && resolve(process.env.HYPER_ELEMENTS_PACKAGE);
if (!src) throw new Error("Set HYPER_ELEMENTS_PACKAGE to a built checkout's packages/react.");
const dest = join(bench, "node_modules/@hyper-elements/react");
await rm(dest, { recursive: true, force: true });
await mkdir(dest, { recursive: true });
await symlink(join(src, "dist"), join(dest, "dist"));
const { version } = JSON.parse(await readFile(join(src, "package.json"), "utf8"));
await writeFile(join(dest, "package.json"), JSON.stringify({
  name: "@hyper-elements/react", version,
  exports: { ".": { types: "./dist/primitives.d.ts", import: "./dist/primitives.js", require: "./dist/primitives.cjs" }, "./package.json": "./package.json" },
  peerDependencies: { react: ">=18", "react-dom": ">=18" },
}, null, 2));
for (const f of ["GUIDE.md", "REFERENCE.md"]) {
  const text = (await readFile(join(src, f), "utf8")).replaceAll("@unlayer/react-elements", "@hyper-elements/react").replace(/^<!-- Written from the component definitions.*\n/m, "");
  await writeFile(join(dest, f), text);
}
console.log(`@hyper-elements/react ${version} → ${dest}`);
