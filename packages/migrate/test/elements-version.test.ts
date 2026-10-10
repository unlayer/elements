import { afterEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { elementsMismatch, supportedElements } from "../src/cli";

const directories: string[] = [];
afterEach(() => {
  for (const directory of directories.splice(0)) fs.rmSync(directory, { recursive: true, force: true });
});

/** A project with an installed @unlayer/react-elements of `version`. */
function project(version: string): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "unlayer-migrate-elements-"));
  directories.push(root);
  const elements = path.join(root, "node_modules/@unlayer/react-elements");
  fs.mkdirSync(elements, { recursive: true });
  fs.writeFileSync(path.join(elements, "package.json"), JSON.stringify({ name: "@unlayer/react-elements", version, exports: { "./package.json": "./package.json" } }));
  fs.writeFileSync(path.join(root, "package.json"), "{}");
  return root;
}

describe("the Elements version migrations render with", () => {
  it("stops on a version older than the supported range, with the install command", () => {
    const { error } = elementsMismatch(project("0.1.22"), "^0.2.0");
    expect(error).toContain("this project has 0.1.22");
    expect(error).toContain('npm install @unlayer/react-elements@"^0.2.0"');
  });

  it("accepts a version in the range", () => {
    expect(elementsMismatch(project("0.2.3"), "^0.2.0")).toEqual({});
    expect(elementsMismatch(project("1.4.0"), "^1.2.0")).toEqual({});
  });

  it("stops on a newer line than it supports too, with the install command", () => {
    for (const [version, range] of [["0.3.0", "^0.2.0"], ["1.0.0", "^0.2.0"], ["2.0.0", "^1.2.0"], ["0.0.4", "^0.0.3"]]) {
      const { error } = elementsMismatch(project(version), range);
      expect(error, version).toContain(`this project has ${version}`);
      expect(error, version).toContain(`npm install @unlayer/react-elements@"${range}"`);
    }
  });

  it("stops on a prerelease, unless the range is a prerelease of the same version", () => {
    for (const version of ["0.2.0-beta.1", "0.2.5-beta.1"]) {
      expect(elementsMismatch(project(version), "^0.2.0").error, version).toContain(`this project has ${version}`);
    }
    expect(elementsMismatch(project("0.2.0-beta.1"), "^0.2.0-beta.0")).toEqual({});
    expect(elementsMismatch(project("0.2.0-beta.10"), "^0.2.0-beta.2")).toEqual({});
    expect(elementsMismatch(project("0.2.4"), "^0.2.0-beta.0")).toEqual({});
    expect(elementsMismatch(project("0.2.0-alpha.3"), "^0.2.0-beta.0").error).toContain("0.2.0-alpha.3");
    expect(elementsMismatch(project("0.2.1-beta.1"), "^0.2.0-beta.0").error).toContain("0.2.1-beta.1");
  });

  it("skips the check for a workspace link (development)", () => {
    expect(elementsMismatch(project("0.1.22"), "workspace:^")).toEqual({});
  });

  it("checks where the templates are: an app in a monorepo has its own", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "unlayer-migrate-monorepo-"));
    directories.push(root);
    const app = path.join(root, "apps/web");
    const elements = path.join(app, "node_modules/@unlayer/react-elements");
    fs.mkdirSync(elements, { recursive: true });
    fs.mkdirSync(path.join(app, "emails"));
    fs.writeFileSync(path.join(elements, "package.json"), JSON.stringify({ name: "@unlayer/react-elements", version: "0.1.22", exports: { "./package.json": "./package.json" } }));
    fs.writeFileSync(path.join(root, "package.json"), "{}");
    let err = "";
    const io = { cwd: root, stderr: (text: string) => void (err += text) };
    expect(supportedElements(io, [path.join(app, "emails/welcome.tsx"), path.join(app, "emails/receipt.tsx")], "^0.2.0")).toBe(false);
    expect(err).toContain("this project has 0.1.22");
    // Said once, for the two templates in one folder.
    expect(err.trim().split("\n")).toHaveLength(1);
  });
});
