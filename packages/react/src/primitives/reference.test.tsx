/**
 * The docs an author or an agent reads first: PRIMITIVES.md (the guide) and PRIMITIVES-REFERENCE.md are what the
 * definitions write (UPDATE_REFERENCE=1 rewrites them), each has every component the entry exports, and the
 * README's template, which the guide shows too, is readme-example.tsx, which renders with no errors or warnings.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as entry from "./index";
import Receipt from "./readme-example";
import { primitivesGuide, primitivesReference } from "./reference";

const root = join(__dirname, "../..");
const read = (file: string) => readFileSync(join(root, file), "utf8");

const example = () => read("src/primitives/readme-example.tsx").replace('from "./index";', 'from "@unlayer/react-elements/primitives";');
const components = Object.entries(entry).filter(([name, value]) => typeof value === "function" && (value as { displayName?: string }).displayName === name);

describe("PRIMITIVES.md and PRIMITIVES-REFERENCE.md", () => {
  it.each([
    ["PRIMITIVES.md", () => primitivesGuide(example())],
    ["PRIMITIVES-REFERENCE.md", () => primitivesReference()],
  ])("%s is what the component definitions write", (file, write) => {
    const written = write();
    if (process.env.UPDATE_REFERENCE) writeFileSync(join(root, file), written);
    expect(read(file)).toBe(written);
  });

  it("each has every component the entry exports", () => {
    expect(components.length).toBeGreaterThan(30);
    const guide = read("PRIMITIVES.md");
    const reference = read("PRIMITIVES-REFERENCE.md");
    for (const [name] of [...components, ["Document.Page"]]) {
      expect(guide, name).toContain(`- **${name}**: `);
      expect(reference, name).toContain(`### ${name}\n`);
    }
  });

  it("says what a list prop's items are, and the mistakes agents made on their first try", () => {
    const guide = read("PRIMITIVES.md");
    expect(guide).toContain("items* (a list of items, each { text, href })");
    expect(guide).toContain("icons* (a list of icons, each { name, href })");
    expect(guide).toMatch(/## Common mistakes\n[\s\S]*A `Menu`'s items are `\{ text, href \}`[\s\S]*## A whole template/);
  });

  it("keeps the guide short enough to read whole before writing a template", () => {
    expect(read("PRIMITIVES.md").length).toBeLessThan(20_000);
  });
});

describe("the README's template", () => {
  it("is readme-example.tsx, as an author imports it", () => {
    expect(read("README.md")).toContain(example().trim());
    expect(read("PRIMITIVES.md")).toContain(example().trim());
  });

  it("renders with no errors or warnings (notes about Outlook are fine)", async () => {
    const { html, text, diagnostics } = await entry.render(<Receipt />);
    expect(diagnostics.filter((d) => d.severity !== "info")).toEqual([]);
    expect(html).toContain("View your order");
    expect(text).toContain("Order #10482 ships tomorrow.");
  });
});
