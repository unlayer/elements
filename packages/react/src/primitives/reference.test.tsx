/**
 * The docs an author or an agent reads first: PRIMITIVES.md is what the definitions write (UPDATE_REFERENCE=1
 * rewrites it), it has a section for every component the entry exports, and the README's template is
 * readme-example.tsx, which renders with no errors or warnings.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as entry from "./index";
import Receipt from "./readme-example";
import { primitivesReference } from "./reference";

const root = join(__dirname, "../..");
const read = (file: string) => readFileSync(join(root, file), "utf8");

describe("PRIMITIVES.md", () => {
  it("is the reference the component definitions write", () => {
    const written = primitivesReference();
    if (process.env.UPDATE_REFERENCE) writeFileSync(join(root, "PRIMITIVES.md"), written);
    expect(read("PRIMITIVES.md")).toBe(written);
  });

  it("has a section for every component the entry exports", () => {
    const reference = read("PRIMITIVES.md");
    const components = Object.entries(entry).filter(([name, value]) => typeof value === "function" && (value as { displayName?: string }).displayName === name);
    expect(components.length).toBeGreaterThan(30);
    for (const [name] of components) expect(reference, name).toContain(`### ${name}\n`);
    expect(reference).toContain("### Document.Page\n");
  });
});

describe("the README's template", () => {
  it("is readme-example.tsx, as an author imports it", () => {
    const example = read("src/primitives/readme-example.tsx").replace('from "./index";', 'from "@unlayer/react-elements/primitives";');
    expect(read("README.md")).toContain(example.trim());
  });

  it("renders with no errors or warnings (notes about Outlook are fine)", async () => {
    const { html, text, diagnostics } = await entry.render(<Receipt />);
    expect(diagnostics.filter((d) => d.severity !== "info")).toEqual([]);
    expect(html).toContain("View your order");
    expect(text).toContain("Order #10482 ships tomorrow.");
  });
});
