// @vitest-environment node

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("the package's docs", () => {
  it("link only to files the package has (the changelog, the README and the guides)", () => {
    const files = ["CHANGELOG.md", "README.md", ...readdirSync(join(root, "docs")).filter((name) => name.endsWith(".md")).map((name) => `docs/${name}`)];
    const missing: string[] = [];
    for (const file of files) {
      // A link's target where it's a path of the package's (not a URL or an anchor), outside code (`[a](…`).
      const text = readFileSync(join(root, file), "utf8").replace(/```[\s\S]*?```|`[^`\n]*`/g, "");
      for (const [, target] of text.matchAll(/\]\((?!https?:|mailto:|#)([^)\s]+)\)/g)) {
        const path = target.split("#")[0];
        if (path && !existsSync(join(root, dirname(file), path))) missing.push(`${file} → ${target}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
