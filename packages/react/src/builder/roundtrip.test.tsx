/**
 * A template to the builder and back (toDesign, then fromDesign): as it went where the builder changed nothing, what
 * the builder has no editor for kept, the builder's changes taken, and what's made in the builder made from its values.
 */
import type { Node } from "@unlayer-internal/elements-core";
import React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import * as primitives from "../primitives";
import { Button, Column, Document, Email, Grid, Heading, Image, Layer, Link, PageBreak, PageFooter, PageHeader, PageNumber, Paragraph, Row, Section, Span, Text } from "../primitives";
import * as airbnb from "../primitives/codemod/AirbnbConfirmation";
import { collectTemplate } from "../primitives/collect";
import * as luma from "../primitives/codemod/LumaEventInvite";
import * as mercury from "../primitives/codemod/MercuryReceipt";
import * as brew from "../primitives/codemod/MorningBrewDigest";
import * as nike from "../primitives/codemod/NikeDrop";
import * as notion from "../primitives/codemod/NotionWelcome";
import * as digest from "../primitives/codemod/ProductDigest";
import * as spotify from "../primitives/codemod/SpotifyWelcome";
import * as stripe from "../primitives/codemod/StripeReceipt";
import * as warby from "../primitives/codemod/WarbyOrderShipped";
import { fromDesign, toDesign } from "./index";

type Values = Record<string, any>;
type Design = { body: { rows: Array<{ cells: number[]; values: Values; columns: Array<{ values: Values; contents: Array<{ type: string; values: Values }> }> }>; values: Values } };

/** The template's tree, as the engine reads it. */
const tree = (element: React.ReactElement): Node => collectTemplate(element).document!.root;
const designOf = (element: React.ReactElement) => JSON.parse(JSON.stringify(toDesign(element).design)) as Design;
const blocks = (design: Design) => design.body.rows.flatMap((row) => row.columns.flatMap((column) => column.contents));

const sample = (
  <Email previewText="Hi" style={{ backgroundColor: "#f5f5f5" }}>
    <Section style={{ backgroundColor: "#eeeeee", padding: 20, gap: 10 }}>
      <Heading id="title" style={{ backgroundColor: "#fde68a", borderRadius: 8 }}>
        Title
      </Heading>
      <Paragraph>
        Hello{" "}
        <Link href="https://x.test" hover={{ color: "#0000ff" }}>
          link
        </Link>
        <Span style={{ fontWeight: 700 }}> bold</Span>
      </Paragraph>
      <Row style={{ gap: 20 }}>
        <Column style={{ backgroundColor: "#ffffff", padding: 8 }}>
          <Text>A</Text>
        </Column>
        <Column>
          <Button href="https://b.test" hover={{ backgroundColor: "#333333" }}>
            Go
          </Button>
        </Column>
      </Row>
    </Section>
    <Image src={{ src: "https://example.com/a.png", width: 600, height: 300 }} alt="x" style={{ borderRadius: 16 }} />
    <Layer style={{ height: 200 }}>
      <Image src={{ src: "https://example.com/b.png", width: 600, height: 300 }} alt="" />
      <Heading>Over</Heading>
    </Layer>
  </Email>
);

describe("fromDesign(toDesign())", () => {
  const examples = [
    stripe.StripeReceipt,
    spotify.SpotifyPremiumWelcome,
    airbnb.AirbnbConfirmation,
    mercury.MercuryReceipt,
    luma.LumaEventInvite,
    warby.WarbyOrderShipped,
    notion.NotionWelcome,
    nike.NikeDrop,
    brew.MorningBrewDigest,
    digest.ProductDigest,
  ];
  for (const Example of examples) {
    it(`brings ${Example.name} back as it went`, () => {
      const back = fromDesign(toDesign(<Example />).design);
      expect(back.report).toEqual([]);
      expect(tree(back.element)).toEqual(tree(<Example />));
    });
  }

  it("brings back what the builder has no editor for, a Layer as itself, and a Grid and a box in a column as themselves", () => {
    const nested = (
      <Email>
        <Grid columns={2} style={{ gap: 12 }}>
          <Text>a</Text>
          <Text>b</Text>
          <Text>c</Text>
        </Grid>
        <Row>
          <Column>
            <Column style={{ gap: 4 }}>
              <Text>inner</Text>
              <Text>box</Text>
            </Column>
            <Text>after</Text>
          </Column>
        </Row>
      </Email>
    );
    for (const template of [sample, nested]) expect(tree(fromDesign(toDesign(template).design).element)).toEqual(tree(template));
    expect(toDesign(sample).report).toEqual([
      "root.children[0].children[0]: kept in the design, with no editor in the builder yet: style.backgroundColor, style.borderRadius",
      "root.children[1]: kept in the design, with no editor in the builder yet: style.borderRadius",
      "root.children[2]: a Layer isn't a tool of the builder's: it's an HTML block of its own markup in the builder (it can be moved, not edited)",
    ]);
  });

  // The link's hover isn't in the HTML: text read again where it wasn't changed would lose it.
  it("reads text the builder rewrote (a paragraph around it, <strong> for bold) as the same text", () => {
    const design = designOf(sample);
    const [heading, paragraph] = blocks(design);
    heading.values.text = '<p style="line-height: 140%;">Title</p>';
    paragraph.values.text = '<p style="line-height: 140%;">Hello <a href="https://x.test" target="_blank" rel="noopener">link</a><strong> bold</strong></p>';
    expect(tree(fromDesign(design).element)).toEqual(tree(sample));
  });

  it("takes the builder's changes over the template's, and keeps the rest of each node", () => {
    const design = designOf(sample);
    const [heading, , , button] = blocks(design);
    heading.values.text = "<p>New <strong>title</strong></p>";
    heading.values.color = "#ff0000";
    heading.values.containerPadding = "26px 20px 0px 20px"; // 6px more above
    button.values.buttonColors = { ...button.values.buttonColors, hoverBackgroundColor: "#000000" };
    const back = fromDesign(design);
    const section = tree(back.element).children![0] as Node;
    expect(section.children![0]).toEqual({
      type: "Heading",
      id: "title",
      style: { backgroundColor: "#fde68a", borderRadius: 8, color: "#ff0000", padding: { top: 6, right: 0, bottom: 0, left: 0 } },
      children: ["New ", { type: "Span", style: { fontWeight: 700 }, children: ["title"] }],
    });
    const row = section.children![2] as Node;
    expect(((row.children![1] as Node).children![0] as Node).hover).toEqual({ backgroundColor: "#000000" });
    expect(back.report).toEqual([]);
  });

  it("takes rows and blocks moved, deleted and duplicated in the builder", () => {
    const design = designOf(sample);
    // The rows: the Section's blocks, the Section's Row, the Image and the Layer. The last moved up between the
    // Section's two, the Image deleted, the heading duplicated.
    const [blocksRow, rowRow, last] = design.body.rows;
    design.body.rows = [blocksRow, last, rowRow];
    last.columns[0].contents.splice(0, 1);
    const column = blocksRow.columns[0];
    column.contents.splice(1, 0, JSON.parse(JSON.stringify(column.contents[0])));
    const back = fromDesign(design);
    const root = tree(back.element);
    expect(root.children!.map((child) => (child as Node).type)).toEqual(["Section", "Layer", "Section"]);
    const top = root.children![0] as Node;
    expect(top.children!.map((child) => [(child as Node).type, (child as Node).id])).toEqual([
      ["Heading", "title"],
      ["Heading", "title-2"],
      ["Paragraph", undefined],
    ]);
    expect(((root.children![2] as Node).children![0] as Node).type).toBe("Row");
    expect(back.report).toEqual(["rows[2]: rows of a Section were moved apart in the builder: each part is a Section of its own"]);
  });

  it("makes blocks made in the builder from their values, and says what Elements has no component for", () => {
    const design = designOf(<Email>{[<Text key="a">Before</Text>]}</Email>);
    const column = design.body.rows[0].columns[0];
    column.contents.push(
      { type: "heading", values: { headingType: "h2", text: "<p>Made <em>here</em></p>", fontSize: "28px", color: "#111111", containerPadding: "10px" } },
      { type: "form", values: { fields: [] } }
    );
    const back = fromDesign(design);
    expect(tree(back.element).children).toEqual([
      { type: "Text", children: ["Before"] },
      {
        type: "Heading",
        props: { level: 2 },
        style: { fontSize: 28, color: "#111111", padding: { top: 10, right: 10, bottom: 10, left: 10 } },
        children: ["Made ", { type: "Span", style: { fontStyle: "italic" }, children: ["here"] }],
      },
    ]);
    expect(back.report).toEqual(["rows[0].columns[0].contents[2]: a form block of the builder's has no component in Elements yet: left out"]);
  });

  it("keeps the builder's own data on a block (a display condition), and writes it back", () => {
    const design = designOf(sample);
    blocks(design)[0].values.displayCondition = { type: "segment", label: "VIP", before: "{% if vip %}", after: "{% endif %}" };
    const back = fromDesign(design);
    const heading = (tree(back.element).children![0] as Node).children![0] as Node;
    expect(heading.compat).toEqual({ builder: { displayCondition: { type: "segment", label: "VIP", before: "{% if vip %}", after: "{% endif %}" } } });
    expect(blocks(designOf(back.element))[0].values.displayCondition).toEqual({ type: "segment", label: "VIP", before: "{% if vip %}", after: "{% endif %}" });
  });

  it("writes code that makes the same template", () => {
    for (const template of [sample, <brew.MorningBrewDigest key="brew" />]) {
      const { code } = fromDesign(toDesign(template).design, { name: "Back" });
      const js = ts.transpileModule(code, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
      const module = { exports: {} as { default: () => React.ReactElement } };
      const modules: Record<string, unknown> = { "@unlayer/react-elements/primitives": primitives, "react/jsx-runtime": jsxRuntime };
      new Function("require", "module", "exports", js)((name: string) => modules[name], module, module.exports);
      expect(tree(module.exports.default())).toEqual(tree(template));
    }
  });

  const invoice = (
    <Document size="A5" orientation="landscape" margin={40}>
      <PageHeader>
        <Text>Acme Inc.</Text>
      </PageHeader>
      <Document.Page>
        <Heading>Invoice</Heading>
        <Paragraph>
          Page <PageNumber /> of <PageNumber total />
        </Paragraph>
      </Document.Page>
      <Document.Page style={{ backgroundColor: "#fafafa" }}>
        <Text>Terms</Text>
      </Document.Page>
      <Text>Notes</Text>
      <PageBreak />
      <Text>Appendix</Text>
      <PageFooter>
        <Text>Thank you</Text>
      </PageFooter>
    </Document>
  );

  it("brings a Document back as it went: its pages, page breaks, header, footer and page numbers", () => {
    const { design, report } = toDesign(invoice);
    const values = design.body.values;
    expect([values.documentSize, values.documentOrientation, values.documentMargin]).toEqual(["A5", "landscape", "40px"]);
    expect(design.schemaVersion).toBeGreaterThanOrEqual(28);
    const body = design.body as unknown as Design["body"] & { headers: Design["body"]["rows"]; footers: Design["body"]["rows"] };
    expect([body.headers.length, body.footers.length]).toEqual([1, 1]);
    expect(body.headers[0].values._meta).toEqual({ htmlID: "u_header_1", htmlClassNames: "u_header" });
    // A page break before the second page (only where it starts), and the template's own.
    expect(blocks(design as unknown as Design).map((content) => content.type)).toEqual(["heading", "text", "page_break", "text", "text", "page_break", "text"]);
    expect(String(blocks(design as unknown as Design)[1].values.text)).toBe("Page {{page_number}} of {{page_count}}");
    expect(report).toEqual([
      "root.children[1].children[1]: the builder has no page numbers yet: they're written as {{page_number}} and {{page_count}}",
      "root.children[2]: kept in the design, with no editor in the builder yet: style.backgroundColor",
    ]);
    const back = fromDesign(design);
    expect(back.report).toEqual([]);
    const expected = tree(invoice);
    // The header first and the footer last, as the builder holds them.
    expect(tree(back.element)).toEqual({ ...expected, children: [expected.children![0], ...expected.children!.slice(1, -1), expected.children![expected.children!.length - 1]] });
  });

  it("takes a Document's page settings from the builder, and a page break added in a page splits it", () => {
    const design = designOf(invoice);
    design.body.values.documentSize = "Letter";
    design.body.values.documentMargin = "auto";
    // A page break added after the first page's heading.
    design.body.rows[0].columns[0].contents.splice(1, 0, { type: "page_break", values: { color: "#6b7280", containerPadding: "10px" } });
    const back = fromDesign(design);
    const root = tree(back.element);
    expect(root.props).toEqual({ size: "Letter", orientation: "landscape", margin: { top: 96, right: 96, bottom: 96, left: 96 } });
    expect(root.children!.map((child) => (child as Node).type)).toEqual(["PageHeader", "DocumentPage", "PageBreak", "DocumentPage", "DocumentPage", "Text", "PageBreak", "Text", "PageFooter"]);
    expect(back.report).toEqual(["rows[0]: a page break inside a DocumentPage: it ends it there, and what follows is one of its own"]);
  });

  it("makes a page number token outside a Document the merge tag it looks like", () => {
    const design = designOf(<Email>{[<Text key="a">Hi</Text>]}</Email>);
    blocks(design)[0].values.text = "<p>Page {{page_number}}</p>";
    expect(tree(fromDesign(design).element).children).toEqual([{ type: "Text", children: ["Page ", { type: "MergeTag", props: { name: "page_number" } }] }]);
  });
});
