/**
 * The docs an author or an agent reads first: GUIDE.md (the guide), REFERENCE.md and the agent skill
 * at the repository's root (skills/hyper-elements/SKILL.md, the guide) are what the definitions write
 * (UPDATE_REFERENCE=1 rewrites them), each has every component the entry exports, and the README's template, which
 * the guide shows too, is readme-example.tsx, which renders with no errors or warnings.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as entry from "./index";
import Receipt from "./readme-example";
import LaunchCard from "./social-card-example";
import { primitivesGuide, primitivesReference, primitivesSkill } from "./reference";

const root = join(__dirname, "../..");
const read = (file: string) => readFileSync(join(root, file), "utf8");
/** The skill `npx skills add hyper-elements/hyper-elements` installs, at the repository's root. */
const SKILL = "../../skills/hyper-elements/SKILL.md";

const example = () => read("src/primitives/readme-example.tsx").replace('from "./index";', 'from "@unlayer/react-elements";');
const card = () => read("src/primitives/social-card-example.tsx").replace('from "./index";', 'from "@unlayer/react-elements";');
const components = Object.entries(entry).filter(([name, value]) => typeof value === "function" && (value as { displayName?: string }).displayName === name);

describe("GUIDE.md, REFERENCE.md and the skill", () => {
  it.each([
    ["GUIDE.md", () => primitivesGuide(example(), card())],
    ["REFERENCE.md", () => primitivesReference()],
    [SKILL, () => primitivesSkill(example(), card())],
  ])("%s is what the component definitions write", (file, write) => {
    const written = write();
    if (process.env.UPDATE_REFERENCE) writeFileSync(join(root, file), written);
    expect(read(file)).toBe(written);
  });

  it("each has every component the entry exports", () => {
    expect(components.length).toBeGreaterThan(30);
    const guide = read("GUIDE.md");
    const reference = read("REFERENCE.md");
    const skill = read(SKILL);
    for (const [name] of [...components, ["Document.Page"]]) {
      expect(guide, name).toContain(`- **${name}**: `);
      expect(reference, name).toContain(`### ${name}\n`);
      expect(skill, name).toContain(`- **${name}**: `);
    }
  });

  it("the skill is the guide, under the frontmatter a skill needs", () => {
    const skill = read(SKILL);
    const frontmatter = /^---\nname: hyper-elements\ndescription: ([^\n]+)\n---\n/.exec(skill);
    expect(frontmatter).not.toBeNull();
    // A plain YAML value: no ": " or " #" in it, which would end it early.
    expect(frontmatter![1]).not.toMatch(/: | #/);
    expect(frontmatter![1]).toMatch(/emails.*pages.*documents.*PDFs.*images/);
    const guide = read("GUIDE.md");
    expect(skill.endsWith(guide.slice(guide.indexOf("## How a template is written")))).toBe(true);
    expect(skill).toContain("## Templates from Elements 0.2");
    expect(skill).toContain("npx @unlayer/migrate src/emails --from elements");
  });

  it("says what a list prop's items are, and the mistakes agents made on their first try", () => {
    const guide = read("GUIDE.md");
    expect(guide).toContain("items* (a list of items, each { text, href })");
    expect(guide).toContain("icons* (a list of icons, each { name, href })");
    expect(guide).toMatch(/## Common mistakes\n[\s\S]*A `Menu`'s items are `\{ text, href \}`[\s\S]*## A whole template/);
  });

  it("keeps the guide short enough to read whole before writing a template", () => {
    expect(read("GUIDE.md").length).toBeLessThan(21_500);
    expect(read(SKILL).length).toBeLessThan(23_500);
  });
});

describe("the README's template", () => {
  it("is readme-example.tsx, as an author imports it", () => {
    expect(read("README.md")).toContain(example().trim());
    expect(read("GUIDE.md")).toContain(example().trim());
    expect(read(SKILL)).toContain(example().trim());
  });

  it("renders with no errors or warnings (notes about Outlook are fine)", async () => {
    const { html, text, diagnostics } = await entry.render(<Receipt />);
    expect(diagnostics.filter((d) => d.severity !== "info")).toEqual([]);
    expect(html).toContain("View your order");
    expect(text).toContain("Order #10482 ships tomorrow.");
  });
});

describe("the guide's social card", () => {
  it("is social-card-example.tsx, as an author imports it", () => {
    expect(read("GUIDE.md")).toMatch(/## Social cards\n[\s\S]*## Components/);
    expect(read("GUIDE.md")).toContain(card().trim());
    expect(read(SKILL)).toContain(card().trim());
  });

  it("is a Canvas with no errors or warnings", () => {
    const { root, diagnostics } = entry.prepare(<LaunchCard />);
    expect(root?.type).toBe("Canvas");
    expect(diagnostics).toEqual([]);
  });
});
