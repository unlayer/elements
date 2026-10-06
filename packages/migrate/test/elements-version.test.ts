import { afterEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { elementsMismatch } from "../src/cli";

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

  it("warns, without stopping, on a newer line than it supports", () => {
    expect(elementsMismatch(project("0.3.0"), "^0.2.0")).toEqual({ warning: expect.stringContaining("this project has 0.3.0") });
    expect(elementsMismatch(project("2.0.0"), "^1.2.0").error).toBeUndefined();
  });

  it("skips the check for a workspace link (development)", () => {
    expect(elementsMismatch(project("0.1.22"), "workspace:^")).toEqual({});
  });
});
