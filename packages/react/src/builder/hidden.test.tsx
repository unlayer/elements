/**
 * Hidden properties: what a tool has no field for, kept in its values under its Elements name (manifest.ts). The keys
 * toDesign() writes are the builder's own or the manifest's, every manifest entry is written by some template, a value
 * is in one place only, and the hazards of a design the builder edits keep them right.
 */
import type { Node } from "@unlayer-internal/elements-core";
import React from "react";
import { describe, expect, it } from "vitest";
import { Button, Column, Document, Email, Heading, Html, Image, Menu, Page, Paragraph, Row, Section, Text, Video } from "../primitives";
import { collectTemplate } from "../primitives/collect";
import { fromDesign, toDesign } from "./index";
import { BUILDER_KEYS, BUILDER_PHONE_KEYS, HIDDEN } from "./manifest";

type Values = Record<string, any>;
type Item = { tool: string; values: Values };

const tree = (element: React.ReactElement): Node => collectTemplate(element).document!.root;
const designOf = (element: React.ReactElement) => JSON.parse(JSON.stringify(toDesign(element).design));
const back = (design: unknown, displayMode?: "email" | "web" | "document") => tree(fromDesign(design, { displayMode }).element);

/** Every item of a design, by its tool (the body, rows, columns and blocks). */
function items(design: any): Item[] {
  const out: Item[] = [{ tool: "body", values: design.body.values }];
  for (const rows of [design.body.rows, design.body.headers ?? [], design.body.footers ?? []]) {
    for (const row of rows) {
      out.push({ tool: "row", values: row.values });
      for (const column of row.columns) {
        out.push({ tool: "column", values: column.values });
        for (const content of column.contents) out.push({ tool: content.type, values: content.values });
      }
    }
  }
  return out;
}

/** Every style and prop a tool has no field for, set. */
const everyHidden = [
  <Email key="email" title="Welcome" lang="en" fonts={[{ family: "Inter", src: "https://fonts.test/inter.woff2", format: "woff2", weight: 400 }]}>
    <Section style={{ backgroundColor: "#eeeeee", border: "1px solid #cccccc" }}>
      <Paragraph style={{ fontStyle: "italic", textTransform: "uppercase", textDecoration: "underline", backgroundColor: "#ffffff", border: "1px solid #000000", borderRadius: 4, width: 300, maxWidth: 400, padding: 8 }} mobile={{ maxWidth: 200 }}>
        Boxed
      </Paragraph>
      <Heading style={{ fontStyle: "italic", textTransform: "lowercase", textDecoration: "line-through", backgroundColor: "#ffffff", border: "1px solid #000000", borderRadius: 4, width: 300, maxWidth: 400, padding: 8 }}>Heading</Heading>
      <Button href="https://x.test" title="Go there" aria-label="Go to x" style={{ textAlign: "left", width: 300, fontStyle: "italic", textTransform: "uppercase", textDecoration: "underline", maxWidth: 400 }}>
        Go
      </Button>
      <Image src={{ src: "https://x.test/a.png", width: 600, height: 300 }} alt="" title="A picture" style={{ maxWidth: 400, height: 150, border: "1px solid #000000", borderRadius: 8 }} />
      <Menu items={[{ text: "A", href: "https://a.test" }]} style={{ lineHeight: 2, textTransform: "uppercase" }} />
      <Video src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" thumbnail="https://x.test/thumb.png" title="Launch" style={{ width: 500, maxWidth: 400 }} />
      <Html html="<b>Sale</b>" text="Sale" />
    </Section>
    <Row style={{ borderRadius: 8, width: 500, minWidth: 300, maxWidth: 560, height: 200, overflow: "hidden", justifyContent: "center", flexWrap: "wrap" }}>
      <Column style={{ justifyContent: "end", minWidth: 100, maxWidth: 400, height: 100, overflow: "hidden" }} hidden={{ desktop: true }}>
        <Text>A</Text>
      </Column>
      <Column hidden={{ mobile: true }}>
        <Text>B</Text>
      </Column>
    </Row>
  </Email>,
  <Page key="page" description="A page">
    <Text>Page</Text>
  </Page>,
  <Document key="document" margin={[10, 20, 30, 40]}>
    <Text>Document</Text>
  </Document>,
];

describe("hidden properties", () => {
  const written = everyHidden.flatMap((template) => items(toDesign(template).design));

  it("are only what the manifest lists: toDesign() writes the builder's own keys and the manifest's, nothing else", () => {
    const unknown = written.flatMap(({ tool, values }) => {
      const hidden = new Set((HIDDEN[tool] ?? []).map((entry) => entry.key));
      const keys = Object.keys(values).filter((key) => !BUILDER_KEYS[tool]?.includes(key) && !hidden.has(key)).map((key) => `${tool}.${key}`);
      const phone = Object.keys(values._override?.mobile ?? {}).filter((key) => !BUILDER_PHONE_KEYS[tool]?.includes(key) && !hidden.has(key)).map((key) => `${tool}._override.mobile.${key}`);
      return [...keys, ...phone];
    });
    expect(unknown).toEqual([]);
  });

  it("are each written by some template (the manifest lists nothing toDesign() doesn't write)", () => {
    const seen = new Set(written.flatMap(({ tool, values }) => [...Object.keys(values), ...Object.keys(values._override?.desktop ?? {}), ...Object.keys(values._override?.mobile ?? {})].map((key) => `${tool}.${key}`)));
    const unwritten = Object.entries(HIDDEN).flatMap(([tool, entries]) => entries.filter((entry) => !seen.has(`${tool}.${entry.key}`)).map((entry) => `${tool}.${entry.key}`));
    expect(unwritten).toEqual([]);
  });

  it("are prefixed exactly where the tool uses the name for something else, and say why", () => {
    for (const [tool, entries] of Object.entries(HIDDEN)) {
      for (const entry of entries) {
        const name = entry.path.slice(entry.path.indexOf(".") + 1);
        if (entry.prefixed) {
          expect([tool, entry.key, BUILDER_KEYS[tool].includes(name), entry.key !== name]).toEqual([tool, entry.key, true, true]);
        } else {
          expect([tool, entry.key, entry.key === name || entry.path.startsWith("hidden."), BUILDER_KEYS[tool].includes(entry.key) && !entry.path.startsWith("hidden.")]).toEqual([tool, entry.key, true, false]);
        }
      }
    }
    expect(HIDDEN.button.find((entry) => entry.prefixed)).toMatchObject({ path: "style.textAlign", key: "innerTextAlign" });
  });

  it("are written as the builder's editors write values: lengths and sides in px, borders side by side", () => {
    const paragraph = written.find((item) => item.tool === "text" && item.values.text === "Boxed")!.values;
    expect(paragraph).toMatchObject({
      fontStyle: "italic",
      textTransform: "uppercase",
      textDecoration: "underline",
      backgroundColor: "#ffffff",
      border: { borderTopWidth: "1px", borderTopStyle: "solid", borderTopColor: "#000000", borderLeftWidth: "1px" },
      borderRadius: "4px",
      width: "300px",
      maxWidth: "400px",
      padding: "8px",
    });
    expect(paragraph._override.mobile).toEqual({ maxWidth: "200px" });
    const button = written.find((item) => item.tool === "button")!.values;
    expect(button).toMatchObject({ innerTextAlign: "left", textAlign: "left", title: "Go there", "aria-label": "Go to x", size: { autoWidth: false, width: "300px" } });
    expect(written.find((item) => item.tool === "body")!.values).toMatchObject({ title: "Welcome", lang: "en", fonts: [{ family: "Inter", src: "https://fonts.test/inter.woff2", format: "woff2", weight: 400 }] });
  });

  it("come back as the template's styles and props", () => {
    for (const [i, template] of everyHidden.entries()) {
      const mode = (["email", "web", "document"] as const)[i];
      const round = back(designOf(template), mode);
      const twice = back(designOf(fromDesign(designOf(template), { displayMode: mode }).element), mode);
      expect(twice).toEqual(round);
    }
    const [email] = everyHidden;
    const round = back(designOf(email));
    expect(round.props).toMatchObject({ title: "Welcome", lang: "en" });
    const json = JSON.stringify(round);
    for (const value of ['"textTransform":"lowercase"', '"textDecoration":"line-through"', '"title":"A picture"', '"thumbnail":"https://x.test/thumb.png"', '"justifyContent":"end"', '"flexWrap":"wrap"', '"overflow":"hidden"', '"minWidth":100']) expect(json).toContain(value);
    expect(back(designOf(everyHidden[1]), "web").props).toEqual({ description: "A page" });
    expect(back(designOf(everyHidden[2]), "document").props).toEqual({ margin: { top: 10, right: 20, bottom: 30, left: 40 } });
  });

  it("are in one place: a value written to a field (a Section's space in its rows' padding, a block's place in its spacing) isn't hidden too", () => {
    const design = designOf(
      <Email>
        <Section style={{ backgroundColor: "#eeeeee", padding: 20, gap: 10, color: "#333333", textAlign: "center" }}>
          <Paragraph style={{ padding: 4 }}>A</Paragraph>
          <Button href="https://x.test" style={{ padding: 12, width: 200 }}>
            B
          </Button>
        </Section>
      </Email>
    );
    const all = items(design);
    const row = all.find((item) => item.tool === "row")!.values;
    const [paragraph, button] = all.filter((item) => item.tool === "text" || item.tool === "button").map((item) => item.values);
    // The Section's padding and gap are its blocks' spacing; its text style, theirs.
    expect([row.padding, row.backgroundColor, paragraph.containerPadding, button.containerPadding]).toEqual(["0px", "#eeeeee", "24px 24px 4px", "10px 20px 20px"]);
    expect([paragraph.color, paragraph.textAlign, button.textAlign]).toEqual(["#333333", "center", "center"]);
    // The Section's own values aren't hidden on its row, nor the blocks' padding beside their spacing.
    for (const key of ["gap", "color", "textAlign", "border"]) expect([key, row[key]]).toEqual([key, undefined]);
    expect(Object.keys(paragraph)).not.toContain("padding");
    expect(button.padding).toBe("12px");
    expect(button.size).toEqual({ autoWidth: false, width: "200px" });
  });

  describe("in a design the builder edits", () => {
    const heading = (
      <Email>
        <Heading style={{ backgroundColor: "#fde68a", borderRadius: 8, fontStyle: "italic" }}>Title</Heading>
      </Email>
    );
    const block = (design: any) => design.body.rows[0].columns[0].contents[0];

    it("keep them where a field is edited on a tool that carries them", () => {
      const design = designOf(heading);
      block(design).values.color = "#ff0000";
      block(design).values.text = "New title";
      expect(back(design).children).toEqual([{ type: "Heading", style: { color: "#ff0000", fontStyle: "italic", backgroundColor: "#fde68a", borderRadius: 8 }, children: ["New title"] }]);
    });

    it("keep them on each copy of a duplicated row", () => {
      const design = designOf(heading);
      design.body.rows.push(JSON.parse(JSON.stringify(design.body.rows[0])));
      const [first, second] = back(design).children as Node[];
      expect(second).toEqual(first);
      expect(first.style).toMatchObject({ backgroundColor: "#fde68a", borderRadius: 8 });
    });

    it("go with a block copied into another design", () => {
      const from = designOf(heading);
      const into = designOf(
        <Email>
          <Text>Other</Text>
        </Email>
      );
      into.body.rows[0].columns[0].contents.push(block(from));
      expect(back(into).children).toEqual([
        { type: "Paragraph", children: ["Other"] },
        { type: "Heading", style: { fontStyle: "italic", backgroundColor: "#fde68a", borderRadius: 8 }, children: ["Title"] },
      ]);
    });

    it("are gone where the builder deleted them", () => {
      const design = designOf(heading);
      delete block(design).values.backgroundColor;
      delete block(design).values.fontStyle;
      expect(back(design).children).toEqual([{ type: "Heading", style: { borderRadius: 8 }, children: ["Title"] }]);
    });

    it("leave out one that can't be read, and say so", () => {
      const design = designOf(heading);
      block(design).values.borderRadius = "round";
      block(design).values.backgroundColor = { not: "a color" };
      const result = fromDesign(design);
      expect(tree(result.element).children).toEqual([{ type: "Heading", style: { fontStyle: "italic" }, children: ["Title"] }]);
      expect(result.report).toEqual([expect.stringMatching(/^rows\[0\]\.columns\[0\]\.contents\[0\]: its backgroundColor can't be read/), expect.stringMatching(/^rows\[0\]\.columns\[0\]\.contents\[0\]: its borderRadius can't be read/)]);
    });
  });
});
