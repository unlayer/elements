// Makes a fresh run directory: runs/<kit>__<brief>__<rep>/, the kit's files plus the brief and the checker.
import { cp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const bench = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// The images the briefs use are the site's own (public/img), served to the checker as assets.orbit.dev.
export const ASSETS = join(bench, "..", "public", "img");

export async function makeRun(kit, briefId, rep, root = join(bench, "runs")) {
  const brief = JSON.parse(await readFile(join(bench, "briefs", `${briefId}.json`), "utf8"));
  const dir = join(root, `${kit}__${briefId}__${rep}`);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  await cp(join(bench, "kits", kit), dir, { recursive: true });
  await mkdir(join(dir, "tools"), { recursive: true });
  // Hyper Elements' agent guide, from the installed package, as its docs tell users to set it up.
  if (kit === "he") {
    await mkdir(join(dir, "docs"), { recursive: true });
    for (const f of ["GUIDE.md", "REFERENCE.md"]) await cp(join(bench, "node_modules/@hyper-elements/react", f), join(dir, "docs", f));
  }
  await mkdir(join(dir, "out"), { recursive: true });
  const checker = (await readFile(join(bench, "lib", "check.mjs"), "utf8")).replace('"__ASSETS__"', JSON.stringify(ASSETS));
  await writeFile(join(dir, "tools", "check.mjs"), checker);
  await writeFile(join(dir, "tools", "spec.json"), JSON.stringify(brief.spec, null, 2));
  await writeFile(join(dir, "BRIEF.md"), `# ${brief.title}\n\n${brief.brief}\n`);
  await writeFile(join(dir, "package.json"), JSON.stringify({ name: "email", private: true }, null, 2) + "\n");
  await symlink(join(bench, "node_modules"), join(dir, "node_modules"));
  return dir;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [kit, brief, rep = "0", root] = process.argv.slice(2);
  console.log(await makeRun(kit, brief, rep, root && resolve(root)));
}
