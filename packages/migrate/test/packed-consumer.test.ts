import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import * as converter from "@unlayer/from-react-email";

describe("published migration library", () => {
  it("packs self-contained declarations and the same API for ESM and CommonJS consumers", () => {
    const packageRoot = path.resolve(import.meta.dirname, "..");
    // Outside the workspace so private packages cannot accidentally resolve.
    const consumer = fs.mkdtempSync(path.join(os.tmpdir(), "unlayer-migrate-consumer-"));
    try {
      const packed = spawnSync("pnpm", ["pack", "--pack-destination", consumer], { cwd: packageRoot, encoding: "utf8" });
      expect(packed.status, packed.stderr + packed.stdout).toBe(0);
      const target = path.join(consumer, "node_modules/@unlayer/migrate");
      fs.mkdirSync(target, { recursive: true });
      const tarball = fs.readdirSync(consumer).find((name) => name.endsWith(".tgz"))!;
      const unpacked = spawnSync("tar", ["-xzf", path.join(consumer, tarball), "--strip-components=1", "-C", target], { encoding: "utf8" });
      expect(unpacked.status, unpacked.stderr).toBe(0);
      for (const name of ["react", "react-dom", "@types/react", "@types/react-dom", "@types/node", "@react-email/components", "@unlayer/react-elements", "typescript", "prettier"]) {
        const link = path.join(consumer, "node_modules", name);
        fs.mkdirSync(path.dirname(link), { recursive: true });
        fs.symlinkSync(path.join(packageRoot, "node_modules", name), link, "dir");
      }
      fs.writeFileSync(path.join(consumer, "package.json"), '{"type":"module"}');
      const declarations = fs.readdirSync(path.join(target, "dist"), { recursive: true })
        .map(String).filter((name) => /\.d\.(ts|mts|cts)$/.test(name));
      expect(declarations).toContain("react-email.d.ts");
      expect(declarations).toContain("react-email.d.cts");
      for (const name of declarations) {
        expect(fs.readFileSync(path.join(target, "dist", name), "utf8"), name)
          .not.toMatch(/@unlayer\/(from-react-email|convert-core)/);
      }
      for (const extension of ["mts", "cts"]) {
        fs.writeFileSync(path.join(consumer, `index.${extension}`), `import {
  convertSource, compareText,
  type RuntimeOptions, type Conversion, type Verification, type TextProp,
  type TextCheck, type CodemodOptions, type CodemodResult, type ModuleLoader,
} from "@unlayer/migrate/react-email";
type PublicTypes = [RuntimeOptions, Conversion, Verification, TextProp, TextCheck, CodemodOptions, CodemodResult, ModuleLoader];
const types: PublicTypes | undefined = undefined;
const missing: string[] = compareText("<p>Hello</p>", "").missing;
async function check() {
  const result = await convertSource("source");
  const nativeRatio: number = result.report.nativeRatio;
  const node: Conversion["tree"] = { type: "Paragraph", children: ["Hello"] };
  console.log(types, missing, nativeRatio, node);
}
void check;
`);
        const checked = spawnSync(process.execPath, [path.join(packageRoot, "node_modules/typescript/bin/tsc"), "--strict", "--noEmit", "--skipLibCheck", "false", "--target", "ES2022", "--module", "NodeNext", "--moduleResolution", "NodeNext", `index.${extension}`], { cwd: consumer, encoding: "utf8" });
        expect(checked.status, checked.stderr + checked.stdout).toBe(0);
      }
      for (const extension of ["mjs", "cjs"]) {
        const imports = extension === "mjs"
          ? 'import * as api from "@unlayer/migrate/react-email";\nimport React from "react";\nimport { Html, Body, Text } from "@react-email/components";'
          : 'const api = require("@unlayer/migrate/react-email");\nconst React = require("react");\nconst { Html, Body, Text } = require("@react-email/components");';
        fs.writeFileSync(path.join(consumer, `runtime.${extension}`), `${imports}
async function main() {
  const Template = () => React.createElement(Html, null, React.createElement(Body, null, React.createElement(Text, null, "Hello")));
  const conversion = await api.convertReactEmail(Template);
  const source = 'import { Html, Body, Text } from "@react-email/components"; export default function Template() { return <Html><Body><Text>Hello</Text></Body></Html>; }';
  const result = await api.convertSource(source);
  console.log(JSON.stringify({
    exports: Object.keys(api).sort(),
    missing: conversion.report.missingText,
    nativeRatio: result.report.nativeRatio,
    check: api.compareText("<p>Hello</p>", conversion.html()).missing,
  }));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
`);
        const ran = spawnSync(process.execPath, [`runtime.${extension}`], { cwd: consumer, encoding: "utf8" });
        expect(ran.status, ran.stderr + ran.stdout).toBe(0);
        expect(JSON.parse(ran.stdout)).toEqual({
          exports: Object.keys(converter).sort(),
          missing: [],
          nativeRatio: 1,
          check: [],
        });
      }
    } finally {
      fs.rmSync(consumer, { recursive: true, force: true });
    }
  });
});
