// @vitest-environment node

/**
 * /builder (toDesign() and fromDesign()) imports nothing of Elements 0.2's components: not src/index.ts,
 * src/components, src/compat, their render and renderToJson in src/utils, nor the shared package. Each file it
 * imports, and each file those import (type imports too: a module deleted breaks them as well), is the builder's, the
 * new components', or one of the three their collecting render is made of; each package, React or the new engine.
 */
import { existsSync, readFileSync, statSync } from "fs";
import { dirname, join, relative, resolve, sep } from "path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const SRC = resolve(__dirname, "..");
/** The files outside src/builder and src/primitives /builder may import: the render that collects a template. */
const COLLECTING = ["utils/collect.ts", "utils/server-renderer.ts", "utils/render-scope.ts"];
/** The packages /builder may import. */
const PACKAGES = ["react", "react-dom/server", "@unlayer-internal/elements-core", "@unlayer-internal/elements-exporters"];

const name = (file: string) => relative(SRC, file).split(sep).join("/");

function resolveImport(from: string, specifier: string): string {
  const base = resolve(dirname(from), specifier);
  const file = ["", ".ts", ".tsx", "/index.ts", "/index.tsx"].map((end) => base + end).find((path) => existsSync(path) && statSync(path).isFile());
  if (!file) throw new Error(`${name(from)} imports ${specifier}, which isn't a file`);
  return file;
}

/** Each file `entry` imports, and each those import, with the file that imports it first; each package, with a file that imports it. */
function importsOf(entry: string): { files: Map<string, string | null>; packages: Map<string, string> } {
  const files = new Map<string, string | null>();
  const packages = new Map<string, string>();
  const visit = (file: string, from: string | null) => {
    if (files.has(file)) return;
    files.set(file, from);
    for (const { fileName } of ts.preProcessFile(readFileSync(file, "utf8"), true, true).importedFiles) {
      if (fileName.startsWith(".")) visit(resolveImport(file, fileName), file);
      else if (!packages.has(fileName)) packages.set(fileName, file);
    }
  };
  visit(entry, null);
  return { files, packages };
}

describe("/builder's imports", () => {
  const { files, packages } = importsOf(join(SRC, "builder/index.ts"));
  /** How a file is reached from /builder's entry. */
  const chain = (file: string) => {
    const out: string[] = [];
    for (let at: string | null | undefined = file; at; at = files.get(at)) out.unshift(name(at));
    return out.join(" → ");
  };

  it("are the builder's, the new components' and their collecting render's files", () => {
    const others = [...files.keys()].filter((file) => !/^(builder|primitives)\//.test(name(file)) && !COLLECTING.includes(name(file)));
    expect(others.map(chain)).toEqual([]);
  });

  it("import React and the new engine's packages only", () => {
    const others = [...packages].filter(([specifier]) => !PACKAGES.includes(specifier));
    expect(others.map(([specifier, file]) => `${chain(file)} → ${specifier}`)).toEqual([]);
  });

  it("are read from the entry through both halves", () => {
    expect([...files.keys()].map(name)).toEqual(expect.arrayContaining(["builder/design.ts", "builder/raise.ts", "builder/read.ts", "builder/read-values.ts", "primitives/collect.tsx", ...COLLECTING]));
  });
});
