// Renders emails/email.tsx with React Email to out/email.html.
import { build } from "esbuild";
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const run = resolve(dirname(fileURLToPath(import.meta.url)), "..");
await mkdir(join(run, ".cache"), { recursive: true });
await mkdir(join(run, "out"), { recursive: true });
const entry = join(run, ".cache/entry.tsx");
await writeFile(entry, `import Template from "../emails/email";\nimport { render } from "@react-email/render";\nexport default () => render(<Template />);\n`);
const out = join(run, ".cache/bundle.cjs");
try {
  await build({ entryPoints: [entry], outfile: out, bundle: true, platform: "node", format: "cjs", jsx: "automatic", logLevel: "silent", packages: "external" });
} catch (e) {
  console.error(e.errors?.map((x) => `${x.location?.file ?? ""}:${x.location?.line ?? ""} ${x.text}`).join("\n") ?? e.message);
  process.exit(1);
}
try {
  const html = await createRequire(import.meta.url)(out).default();
  await writeFile(join(run, "out/email.html"), html);
  console.log(`Rendered out/email.html (${html.length} bytes).`);
} catch (e) {
  console.error(e.stack ?? e.message);
  process.exit(1);
}
