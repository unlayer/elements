import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

describe("standalone CLI consumers", () => {
  it.each(["commonjs", "module"])(
    "migrates and compares a %s project outside the workspace",
    (type) => {
      const root = path.resolve(import.meta.dirname, "..");
      const dir = fs.mkdtempSync(
        path.join(os.tmpdir(), "unlayer-cli-consumer-"),
      );
      try {
        fs.writeFileSync(
          path.join(dir, "package.json"),
          JSON.stringify({ type }),
        );
        for (const name of ["react", "react-dom", "@react-email/components"]) {
          const link = path.join(dir, "node_modules", name);
          fs.mkdirSync(path.dirname(link), { recursive: true });
          fs.symlinkSync(path.join(root, "node_modules", name), link, "dir");
        }
        fs.mkdirSync(path.join(dir, "emails"));
        fs.mkdirSync(path.join(dir, "shared"));
        fs.writeFileSync(
          path.join(dir, "tsconfig.json"),
          JSON.stringify({
            compilerOptions: {
              jsx: "preserve",
              module: "ESNext",
              moduleResolution: "bundler",
              paths: { "@shared/*": ["./shared/*"] },
            },
          }),
        );
        fs.writeFileSync(
          path.join(dir, "shared/cta.tsx"),
          `import { Button } from "@react-email/components";
export function CTA({ href = "https://example.com/pay" }: { href?: string }) { return <Button href={href}>Pay invoice</Button>; }`,
        );
        fs.writeFileSync(
          path.join(dir, "shared/note.ts"),
          'export const note = "Ready to pay";',
        );
        const lazy =
          type === "commonjs"
            ? 'const note = () => require("@shared/note").note;'
            : 'const note = () => "Ready to pay";';
        const source = `import { Html, Body, Text } from "@react-email/components";
import { CTA } from "@shared/cta";
${lazy}
export default function T({ href }: { href?: string }) { return <Html><Body><Text>Total: 10 &euro; {note()}</Text><CTA href={href}/></Body></Html>; }
T.PreviewProps = { href: undefined };`;
        fs.writeFileSync(path.join(dir, "emails/t.tsx"), source);
        const run = (args: string[]) =>
          spawnSync(
            process.execPath,
            [path.join(root, "dist/bin.js"), ...args],
            { cwd: dir, encoding: "utf8" },
          );
        const migrated = run(["emails", "--out", "migrated", "--design"]);
        expect(migrated.status, migrated.stderr + migrated.stdout).toBe(0);
        expect(fs.readFileSync(path.join(dir, "emails/t.tsx"), "utf8")).toBe(
          source,
        );
        expect(
          fs.readFileSync(path.join(dir, "migrated/t.design.json"), "utf8"),
        ).toContain("10 €");
        const compared = run(["compare", "emails/t.tsx", "migrated/t.tsx"]);
        expect(compared.status, compared.stderr + compared.stdout).toBe(0);
        expect(fs.readdirSync(path.join(dir, "emails"))).toEqual(["t.tsx"]);
        expect(fs.readdirSync(path.join(dir, "migrated"))).toEqual([
          "t.design.json",
          "t.tsx",
        ]);
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    },
  );
});
