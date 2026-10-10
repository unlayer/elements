import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { convertSource, verifyConversion } from "../src/index";
import { inlineLocalJsx } from "../src/inline";

describe("JSX value capture", () => {
  it("keeps the subtotal captured before the total changes", async () => {
    const source = `import { Html, Body, Text } from "@react-email/components";
export default function Receipt({ tax }: { tax: number }) {
  let amount = 100;
  const subtotal = <Text>Subtotal: {amount}</Text>;
  amount += tax;
  return <Html><Body>{subtotal}<Text>Total: {amount}</Text></Body></Html>;
}
Receipt.PreviewProps = { tax: 10 };`;
    const dir = fs.mkdtempSync(path.join(import.meta.dirname, ".tmp-"));
    try {
      const file = path.join(dir, "receipt.tsx");
      fs.writeFileSync(file, source);
      const { default: Original } = await import(file);
      const converted = await convertSource(source, { fileName: file });
      const migrated = path.join(dir, "migrated.tsx");
      fs.writeFileSync(migrated, converted.code);
      const { default: Migrated } = await import(migrated);
      const check = await verifyConversion(Original, Migrated);
      expect(check.missing).toEqual([]);
      expect(check.added).toEqual([]);
      expect(check.convertedHtml).toContain("Subtotal: 100");
      expect(check.convertedHtml).toContain("Total: 110");
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it.each(["value = 2", "value += 2", "value ??= 2", "value++", "--value", "value.amount = 2", "value[0] = 2", "delete value.amount", "value.push(2)", "value.sort()", "({ value } = other)"])("does not move reads past %s", (change) => {
    const result = inlineLocalJsx(`function T() {
  let value = 1;
  const block = <Text>{value}</Text>;
  ${change};
  return <Body>{block}</Body>;
}`, "template.tsx");
    expect(result.inlined).toEqual([]);
  });

  it("still inlines unchanged constants and props", () => {
    const result = inlineLocalJsx(`function T({ name }) {
  const amount = 100;
  const block = <Text>{name}: {amount}</Text>;
  const unrelated = 1;
  return <Body>{block}</Body>;
}`, "template.tsx");
    expect(result.inlined).toEqual(["block"]);
    expect(result.source).toContain("<Body><Text>{name}: {amount}</Text></Body>");
  });
});
