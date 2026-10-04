import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

describe("published converter", () => {
  it("packs self-contained declarations that a consumer can typecheck", () => {
    const packageRoot = path.resolve(import.meta.dirname, "..");
    // Outside the workspace so private packages cannot accidentally resolve.
    const consumer = fs.mkdtempSync(path.join(os.tmpdir(), "unlayer-converter-consumer-"));
    try {
      const packed = spawnSync("pnpm", ["pack", "--pack-destination", consumer], { cwd: packageRoot, encoding: "utf8" });
      expect(packed.status, packed.stderr + packed.stdout).toBe(0);
      const target = path.join(consumer, "node_modules/@unlayer/from-react-email");
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
      fs.writeFileSync(path.join(consumer, "index.ts"), `import { convertSource, compareText, type Conversion } from "@unlayer/from-react-email";
const missing: string[] = compareText("<p>Hello</p>", "").missing;
const result = await convertSource("source");
const nativeRatio: number = result.report.nativeRatio;
const node: Conversion["tree"] = { type: "Paragraph", children: ["Hello"] };
console.log(missing, nativeRatio, node);
`);
      const checked = spawnSync(process.execPath, [path.join(packageRoot, "node_modules/typescript/bin/tsc"), "--strict", "--noEmit", "--skipLibCheck", "false", "--target", "ES2022", "--module", "NodeNext", "--moduleResolution", "NodeNext", "index.ts"], { cwd: consumer, encoding: "utf8" });
      expect(checked.status, checked.stderr + checked.stdout).toBe(0);
      for (const extension of ["ts", "cts"]) {
        expect(fs.readFileSync(path.join(target, `dist/index.d.${extension}`), "utf8")).not.toContain("@unlayer/convert-core");
      }
    } finally {
      fs.rmSync(consumer, { recursive: true, force: true });
    }
  });
});
