import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

describe("published migration library", () => {
  it("packs self-contained declarations and the same API for ESM and CommonJS consumers: convertReactEmail and migrateElements", () => {
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
      expect(declarations).toContain("elements.d.ts");
      for (const extension of ["mts", "cts"]) {
        fs.writeFileSync(path.join(consumer, `index.${extension}`), `import { convertReactEmail, NewComponentsError, type RuntimeOptions, type Conversion, type ConversionReport, type EditorFont } from "@unlayer/migrate/react-email";
import { migrateElements, type MigrateElementsOptions, type MigrateElementsResult } from "@unlayer/migrate/elements";
type PublicTypes = [RuntimeOptions, Conversion, ConversionReport, EditorFont, MigrateElementsOptions, MigrateElementsResult];
const types: PublicTypes | undefined = undefined;
async function check(Template: () => null) {
  const conversion = await convertReactEmail(Template);
  const code: string = conversion.code;
  const html: string = await conversion.html();
  const design: Record<string, unknown> = conversion.design();
  const missing: string[] | undefined = conversion.report.missingText;
  const intermediate: string = new NewComponentsError("why", "source").intermediate;
  const notes: string[] = (await migrateElements("source")).report;
  console.log(types, code, html, design, missing, intermediate, notes);
}
void check;
`);
        const checked = spawnSync(process.execPath, [path.join(packageRoot, "node_modules/typescript/bin/tsc"), "--strict", "--noEmit", "--skipLibCheck", "false", "--target", "ES2022", "--module", "NodeNext", "--moduleResolution", "NodeNext", `index.${extension}`], { cwd: consumer, encoding: "utf8" });
        expect(checked.status, checked.stderr + checked.stdout).toBe(0);
      }
      for (const extension of ["mjs", "cjs"]) {
        const imports = extension === "mjs"
          ? 'import * as api from "@unlayer/migrate/react-email";\nimport * as elements from "@unlayer/migrate/elements";\nimport React from "react";\nimport { Html, Body, Text, Button } from "@react-email/components";'
          : 'const api = require("@unlayer/migrate/react-email");\nconst elements = require("@unlayer/migrate/elements");\nconst React = require("react");\nconst { Html, Body, Text, Button } = require("@react-email/components");';
        fs.writeFileSync(path.join(consumer, `runtime.${extension}`), `${imports}
async function main() {
  const h = React.createElement;
  const Template = () => h(Html, null, h(Body, null, h(Text, null, "Hello")));
  const conversion = await api.convertReactEmail(Template);
  // A link the new components don't write: a typed error, with the template as it was written first.
  const Refused = () => h(Html, null, h(Body, null, h(Button, { href: "javascript:void(0)" }, "Go")));
  const error = await api.convertReactEmail(Refused).catch((e) => e);
  const migrated = await elements.migrateElements('import { Email, Row, Column, Paragraph } from "@unlayer/react-elements";\\nexport const T = () => <Email><Row><Column><Paragraph>Hi</Paragraph></Column></Row></Email>;');
  console.log(JSON.stringify({
    exports: Object.keys(api).sort(),
    elements: Object.keys(elements).sort(),
    missing: conversion.report.missingText,
    html: (await conversion.html()).includes("Hello"),
    code: conversion.code.includes('from "@unlayer/react-elements";'),
    design: conversion.design().body.rows.length > 0,
    refused: error instanceof api.NewComponentsError && error.intermediate.includes("javascript:void(0)"),
    migrated: migrated.code.includes("<Section>"),
  }));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
`);
        const ran = spawnSync(process.execPath, [`runtime.${extension}`], { cwd: consumer, encoding: "utf8" });
        expect(ran.status, ran.stderr + ran.stdout).toBe(0);
        expect(JSON.parse(ran.stdout)).toEqual({
          exports: ["NewComponentsError", "convertReactEmail"],
          elements: ["migrateElements"],
          missing: [],
          html: true,
          code: true,
          design: true,
          refused: true,
          migrated: true,
        });
      }
    } finally {
      fs.rmSync(consumer, { recursive: true, force: true });
    }
  });
});

it.each(["module", "commonjs"])("runs the installed CLI with its React 19 dependencies against a React 18 %s project", (type) => {
  const root = path.resolve(import.meta.dirname, "..");
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "unlayer-migrate-react-versions-"));
  const tool = path.join(directory, "tool");
  const project = path.join(directory, "project");
  try {
    fs.mkdirSync(tool, { recursive: true });
    fs.mkdirSync(project, { recursive: true });
    const packed = spawnSync("pnpm", ["pack", "--pack-destination", tool], { cwd: root, encoding: "utf8" });
    expect(packed.status, packed.stderr + packed.stdout).toBe(0);
    const target = path.join(tool, "node_modules/@unlayer/migrate");
    fs.mkdirSync(target, { recursive: true });
    const tarball = fs.readdirSync(tool).find((name) => name.endsWith(".tgz"))!;
    const unpacked = spawnSync("tar", ["-xzf", path.join(tool, tarball), "--strip-components=1", "-C", target], { encoding: "utf8" });
    expect(unpacked.status, unpacked.stderr).toBe(0);
    for (const [name, installed] of [["react", "react19"], ["react-dom", "react-dom19"]]) {
      // Copy real packages: symlinks would resolve React DOM's imports back into the workspace.
      fs.cpSync(fs.realpathSync(path.join(root, "node_modules", installed)), path.join(tool, "node_modules", name), { recursive: true });
      fs.cpSync(fs.realpathSync(path.join(root, "node_modules", name)), path.join(project, "node_modules", name), { recursive: true });
    }
    for (const name of ["@react-email/components", "@unlayer/react-elements", "typescript", "prettier", "tsx"]) {
      const link = path.join(tool, "node_modules", name);
      fs.mkdirSync(path.dirname(link), { recursive: true });
      fs.symlinkSync(path.join(root, "node_modules", name), link, "dir");
    }
    const email = path.join(project, "node_modules/@react-email/components");
    fs.mkdirSync(path.dirname(email), { recursive: true });
    fs.symlinkSync(path.join(root, "node_modules/@react-email/components"), email, "dir");
    fs.writeFileSync(path.join(project, "package.json"), JSON.stringify({ type }));
    expect(JSON.parse(fs.readFileSync(path.join(tool, "node_modules/react/package.json"), "utf8")).version).toBe("19.1.0");
    expect(JSON.parse(fs.readFileSync(path.join(project, "node_modules/react/package.json"), "utf8")).version).toBe("18.3.1");
    fs.writeFileSync(path.join(project, "template.jsx"), `import {Html, Body, Text} from "@react-email/components";
export default function T({name = "Alex"}) { return <Html><Body><Text>Hello <b>{name}</b></Text></Body></Html>; }`);
    const run = (args: string[]) => spawnSync(process.execPath, [path.join(target, "dist/bin.js"), ...args], { cwd: project, encoding: "utf8" });
    const migrated = run(["template.jsx", "--out", "converted", "--design"]);
    expect(migrated.status, migrated.stderr + migrated.stdout).toBe(0);
    const written = fs.readFileSync(path.join(project, "converted/template.jsx"), "utf8");
    expect(written).toContain("@unlayer/react-elements");
    expect(written).toContain("{name}");
    expect(written).not.toContain("htmlText");
    const compared = run(["compare", "template.jsx", "converted/template.jsx"]);
    expect(compared.status, compared.stderr + compared.stdout).toBe(0);
    expect(fs.readdirSync(project).filter((name) => name.includes("unlayer-migrate"))).toEqual([]);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

it("stops the installed CLI when the project's Elements is older than it supports", () => {
  const root = path.resolve(import.meta.dirname, "..");
  const range = `^${JSON.parse(fs.readFileSync(path.join(root, "../react/package.json"), "utf8")).version}`;
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "unlayer-migrate-old-elements-"));
  const tool = path.join(directory, "tool");
  const project = path.join(directory, "project");
  try {
    fs.mkdirSync(tool, { recursive: true });
    const packed = spawnSync("pnpm", ["pack", "--pack-destination", tool], { cwd: root, encoding: "utf8" });
    expect(packed.status, packed.stderr + packed.stdout).toBe(0);
    const target = path.join(tool, "node_modules/@unlayer/migrate");
    fs.mkdirSync(target, { recursive: true });
    const tarball = fs.readdirSync(tool).find((name) => name.endsWith(".tgz"))!;
    expect(spawnSync("tar", ["-xzf", path.join(tool, tarball), "--strip-components=1", "-C", target]).status).toBe(0);
    expect(JSON.parse(fs.readFileSync(path.join(target, "package.json"), "utf8")).peerDependencies["@unlayer/react-elements"]).toBe(range);
    for (const name of ["react", "react-dom", "@react-email/components", "@unlayer/react-elements", "typescript", "prettier", "tsx"]) {
      const link = path.join(tool, "node_modules", name);
      fs.mkdirSync(path.dirname(link), { recursive: true });
      fs.symlinkSync(path.join(root, "node_modules", name), link, "dir");
    }
    // The project installed an Elements release from before this one.
    const old = path.join(project, "node_modules/@unlayer/react-elements");
    fs.mkdirSync(old, { recursive: true });
    fs.writeFileSync(path.join(old, "package.json"), JSON.stringify({ name: "@unlayer/react-elements", version: "0.1.22", exports: { "./package.json": "./package.json" } }));
    fs.writeFileSync(path.join(project, "package.json"), "{}");
    fs.writeFileSync(path.join(project, "welcome.tsx"), `import { Html, Body, Text } from "@react-email/components";\nexport default function T() { return <Html><Body><Text>Hi</Text></Body></Html>; }\n`);
    const run = spawnSync(process.execPath, [path.join(target, "dist/bin.js"), "welcome.tsx", "--out", "converted"], { cwd: project, encoding: "utf8" });
    expect(run.status, run.stderr + run.stdout).toBe(1);
    expect(run.stderr).toContain(`needs @unlayer/react-elements ${range}, but this project has 0.1.22`);
    expect(fs.existsSync(path.join(project, "converted"))).toBe(false);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
