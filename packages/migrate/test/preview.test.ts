import { it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import * as lib from "@unlayer/from-react-email";
import { main, type Io } from "../src/cli";

it.each(["tsx", "jsx"])("migrates a lone array preview with numeric text in %s", async (extension) => {
  const dir = fs.mkdtempSync(path.join(import.meta.dirname, ".tmp-"));
  const sink = { cwd: dir, out: "", stdout: (text: string) => void (sink.out += text), stderr: (text: string) => void (sink.out += text) } satisfies Io & { out: string };
  try {
    const annotation = extension === "tsx" ? ": {count: number}" : "";
    for (const count of [42, 0]) {
      const file = `preview-${count}.${extension}`;
      const source = `import { Html, Body, Preview, Text } from "@react-email/components";
export default function T({count}${annotation}) { return <Html><Preview>{[String(count)]}</Preview><Body><Text>Receipt</Text></Body></Html>; }
T.PreviewProps = {count:${count}};`;
      fs.writeFileSync(path.join(dir, file), source);
      expect(await main([file, "--out", "converted", "--design"], sink, lib), sink.out).toBe(0);
      expect(await main(["compare", file, `converted/${file}`], sink, lib), sink.out).toBe(0);
      expect(fs.readFileSync(path.join(dir, "converted", file), "utf8")).toContain("plainText");
      expect(fs.readFileSync(path.join(dir, file), "utf8")).toBe(source);
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
