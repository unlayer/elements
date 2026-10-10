import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { convertSource, htmlWords, verifyConversion } from "../src/index";

describe("dynamic preview text", () => {
  it.each(["tsx", "jsx"])("keeps absent and mixed text empty as React does in %s", async (extension) => {
    const dir = fs.mkdtempSync(path.join(import.meta.dirname, ".tmp-"));
    try {
      for (const [name, preview, props] of [
        ["absent", "{preview}", {}],
        ["array", "{[String(count)]}", { count: 42 }],
        ["array-zero", "{[String(count)]}", { count: 0 }],
        ["mixed", 'Hi {name}{vip && " (VIP)"}', { name: "Guest", vip: false }],
        ["zero", "Count {count}", { count: 0 }],
        ["scalars", "Count {count} {empty} {hidden} {visible}", { count: 0, empty: null, hidden: false, visible: true }],
      ] as const) {
        const annotation = extension === "tsx" ? ": {preview?: string; name?: string; vip?: boolean; count?: number; empty?: null; hidden?: boolean; visible?: boolean}" : "";
        const source = `import { Html, Body, Preview, Text } from "@react-email/components";
const plainText = () => "Receipt attached";
export default function T({ preview, name, vip, count, empty, hidden, visible }${annotation}) {
  return <Html><Preview>${preview}</Preview><Body><Text>{plainText()}</Text></Body></Html>;
}
T.PreviewProps = ${JSON.stringify(props)};`;
        const originalFile = path.join(dir, `${name}.${extension}`);
        fs.writeFileSync(originalFile, source);
        const { default: Original } = await import(originalFile);
        const converted = await convertSource(source, { fileName: originalFile });
        const migratedFile = path.join(dir, `${name}.converted.${extension}`);
        fs.writeFileSync(migratedFile, converted.code);
        const { default: Migrated } = await import(migratedFile);
        const check = await verifyConversion(Original, Migrated);
        if (name === "absent" || name === "zero" || name === "array" || name === "array-zero") {
          expect(check.missing).toEqual([]);
          expect(check.added).toEqual([]);
          expect(check.variants).toEqual([]);
        }
        // React Email joins preview arrays, including boolean values. The
        // converted preview follows React's empty rendering of booleans.
        if (name === "mixed") expect(check.missing).toEqual(["Guestfalse"]);
        expect(check.convertedHtml).not.toMatch(/undefined|null|>true|>false/);
        if (name === "absent") expect(converted.code).toContain("previewText={_plainText(preview)}");
        if (name === "array") expect(check.convertedHtml).toContain("42");
        if (name === "array-zero") expect(htmlWords(check.convertedHtml)).toContain("0");
        if (name === "mixed") expect(check.convertedHtml).toContain("Hi Guest");
        if (name === "scalars" || name === "zero") expect(check.convertedHtml).toContain("Count 0");
        if (extension === "jsx") expect(converted.code).not.toContain("value: unknown");
      }
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
