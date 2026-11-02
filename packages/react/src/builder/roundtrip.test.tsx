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
import { Button, Column, Document, Email, Grid, Heading, Image, Layer, Link, MergeTag, PageBreak, PageFooter, PageHeader, PageNumber, Paragraph, Row, Section, Span, Table, TableCell, TableRow, Text, validate } from "../primitives";
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

  it("writes no code from a design's data: a prop's name that isn't one is left out and said; a component's throws", () => {
    const design = designOf(sample);
    const [heading, paragraph] = blocks(design);
    heading.values._elements.node.props = { ...heading.values._elements.node.props, "x={globalThis.pwn()} y": 1 };
    const { code, report } = fromDesign(design, { name: "T(){globalThis.pwn()}; function Back" });
    expect(code).not.toContain("pwn");
    expect(report).toEqual(
      expect.arrayContaining([
        'root.children[0].children[0]: a prop named "x={globalThis.pwn()} y" isn\'t one JSX can write: it\'s left out of the code',
        'the component\'s name "T(){globalThis.pwn()}; function Back" isn\'t one JavaScript can write: it\'s named Template',
      ])
    );
    paragraph.values._elements.node.type = "Paragraph onClick={globalThis.pwn()}";
    expect(() => fromDesign(design)).toThrow("is a component of the template's own");
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
    // A page break where a page starts or ends (before the second page, after it before the loose text), and the
    // template's own.
    expect(blocks(design as unknown as Design).map((content) => content.type)).toEqual(["heading", "text", "page_break", "text", "page_break", "text", "page_break", "text"]);
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

  it("writes page numbers in a block it draws itself (a boxed Column in a footer) as the builder's tokens", () => {
    const template = (
      <Document>
        <Text>Body</Text>
        <PageFooter>
          <Column style={{ border: "1px solid #e5e7eb", padding: 8 }}>
            <Text>
              Page <PageNumber /> of <PageNumber total />
            </Text>
          </Column>
        </PageFooter>
      </Document>
    );
    const { design, report } = toDesign(template);
    const footer = (design.body as unknown as { footers: Design["body"]["rows"] }).footers.flatMap((row) => row.columns.flatMap((column) => column.contents));
    expect(footer.map((content) => content.type)).toEqual(["html"]);
    expect(String(footer[0].values.html)).toContain("Page {{page_number}} of {{page_count}}");
    expect(report).toContain("root.children[1].children[0]: the builder has no page numbers yet: they're written as {{page_number}} and {{page_count}}");
    // The block keeps its node, so its page numbers come back as they were.
    expect(tree(fromDesign(JSON.parse(JSON.stringify(design))).element)).toEqual(tree(template));
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

  describe("what the builder changes where the template has no node of its own", () => {
    it("takes a row of blocks' padding, hiding and column background as a Row and Column holding them", () => {
      const design = designOf(<Email>{[<Text key="a">A</Text>]}</Email>);
      const [row] = design.body.rows;
      row.values.padding = "30px 0px 20px 0px";
      row.values.hideDesktop = true;
      row.columns[0].values.backgroundColor = "#ffeeee";
      expect(tree(fromDesign(design).element).children).toEqual([
        { type: "Row", style: { padding: { top: 30, right: 0, bottom: 20, left: 0 } }, hidden: { desktop: true }, children: [{ type: "Column", style: { backgroundColor: "#ffeeee" }, children: [{ type: "Text", children: ["A"] }] }] },
      ]);
    });

    it("takes a column the builder changed around a Row's block as a Column, and a Grid row changed as a Row of its own", () => {
      const design = designOf(
        <Email>
          <Row>
            <Text>A</Text>
            <Text>B</Text>
          </Row>
          <Grid columns={2}>
            <Text>a</Text>
            <Text>b</Text>
            <Text>c</Text>
          </Grid>
        </Email>
      );
      design.body.rows[0].columns[0].values.backgroundColor = "#ff0000";
      design.body.rows[2].cells = [2, 1];
      const back = fromDesign(design);
      const [row, grid, gridRow] = tree(back.element).children as Node[];
      expect(row.children![0]).toEqual({ type: "Column", style: { backgroundColor: "#ff0000" }, children: [{ type: "Text", children: ["A"] }] });
      expect([grid.type, grid.children!.length]).toEqual(["Grid", 2]);
      expect([gridRow.type, (gridRow.children as Node[]).map((child) => child.style?.width)]).toEqual(["Row", ["66.67%", "33.33%"]]);
      expect(back.report).toEqual(["rows[2]: a row of a Grid changed in the builder: it's a Row of its own", "rows[2]: its columns' widths changed in the builder: each takes its share of the row"]);
    });

    it("hides the row the builder hid, not its Section; a row the builder recolored is a Section of its own", () => {
      const template = (
        <Email>
          <Section style={{ backgroundColor: "#eeeeee" }}>
            <Text>Intro</Text>
            <Row>
              <Column>
                <Text>A</Text>
              </Column>
            </Row>
            <Row>
              <Column>
                <Text>B</Text>
              </Column>
            </Row>
          </Section>
        </Email>
      );
      const design = designOf(template);
      design.body.rows[1].values._override = { mobile: { hideMobile: true } };
      design.body.rows[2].values.backgroundColor = "#ff0000";
      const back = fromDesign(design);
      const sections = tree(back.element).children as Node[];
      expect(sections.map((section) => [section.style?.backgroundColor, section.hidden, (section.children as Node[]).map((child) => [child.type, child.hidden])])).toEqual([
        ["#eeeeee", undefined, [["Text", undefined], ["Row", { mobile: true }]]],
        ["#ff0000", undefined, [["Row", undefined]]],
      ]);
      expect(back.report).toEqual(["rows[2]: its background changed in the builder: a band across the width is a Section's in Elements, so this row is a Section of its own"]);
    });

    it("puts a row added in the builder between rows of a Section in it, and one added at the end of a page on that page", () => {
      const email = designOf(
        <Email>
          <Section>
            <Text>a</Text>
            <Row>
              <Column>
                <Text>b</Text>
              </Column>
            </Row>
          </Section>
        </Email>
      );
      const made = { cells: [1], columns: [{ values: {}, contents: [{ type: "text", values: { text: "<p>new</p>" } }] }], values: {} };
      email.body.rows.splice(1, 0, made);
      expect((tree(fromDesign(email).element).children as Node[]).map((child) => [child.type, (child.children as Node[]).length])).toEqual([["Section", 3]]);
      // Before the page break that ends the first page, and after it (where the second starts).
      for (const at of [1, 2]) {
        const doc = designOf(invoice);
        doc.body.rows.splice(at, 0, made);
        const children = tree(fromDesign(doc).element).children as Node[];
        expect(children.map((child) => child.type)).toEqual(["PageHeader", "DocumentPage", "DocumentPage", "Text", "PageBreak", "Text", "PageFooter"]);
        expect((children[at].children as Node[]).map((child) => child.type)).toEqual(at === 1 ? ["Heading", "Paragraph", "Row"] : ["Row", "Text"]);
      }
    });
  });

  describe("what the builder can't hold", () => {
    it("brings back a column hidden on desktop, which the builder has no column for", () => {
      const template = (
        <Email>
          <Row>
            <Column>
              <Text>desk</Text>
            </Column>
            <Column hidden={{ desktop: true }}>
              <Text>phone only</Text>
            </Column>
          </Row>
        </Email>
      );
      const { design, report } = toDesign(template);
      expect(report).toEqual(["root.children[0]: a Column hidden on desktop has no column of its own in the builder: kept in the design, not shown there"]);
      expect(tree(fromDesign(design).element)).toEqual(tree(template));
    });

    it("writes a merge tag's name into the builder's text escaped, and brings it back as it was", () => {
      const name = 'x"><img src=x onerror=alert(1)>';
      const template = (
        <Email>
          <Text>
            Hi <MergeTag name={name} />
          </Text>
        </Email>
      );
      const [text] = blocks(designOf(template));
      expect(text.values.text).not.toContain("<img");
      expect(text.values.text).toContain("{{x&quot;&gt;&lt;img src=x onerror=alert(1)&gt;}}");
      expect(tree(fromDesign(toDesign(template).design).element)).toEqual(tree(template));
    });

    it("writes a Button's merge tags to the builder, and says what a text edit leaves out", () => {
      const template = (
        <Email>
          <Button href="https://example.com">
            Hi <MergeTag name="first_name" />
          </Button>
          <Paragraph>
            Read{" "}
            <Link href="https://x.test" hover={{ color: "#ff0000" }}>
              more
            </Link>
          </Paragraph>
        </Email>
      );
      const design = designOf(template);
      const [button, paragraph] = blocks(design);
      expect(button.values.text).toBe("Hi {{first_name}}");
      paragraph.values.text = '<p>Read <a href="https://x.test">more</a> now<img src="x.png"></p>';
      expect(fromDesign(design).report).toEqual([
        "rows[0].columns[0].contents[1]: its text was edited in the builder: what its HTML can't hold (a link's hover or title, a run's own size) is left out",
        "rows[0].columns[0].contents[1]: its text has markup a text block doesn't hold, left out: <img>",
      ]);
    });

    it("takes an image link: the builder's as a Link around the Image, the template's as the builder's", () => {
      const linked = (
        <Email>
          <Link href="https://shop.test">
            <Image src={{ src: "https://example.com/a.png", width: 600, height: 300 }} alt="Shop" />
          </Link>
        </Email>
      );
      const design = designOf(linked);
      expect(blocks(design)[0].values.action).toEqual({ name: "web", values: { href: "https://shop.test", target: "_blank" } });
      expect(tree(fromDesign(design).element)).toEqual(tree(linked));
      const plain = designOf(<Email>{[<Image key="i" src={{ src: "https://example.com/a.png", width: 600, height: 300 }} alt="" />]}</Email>);
      blocks(plain)[0].values.action = { name: "web", values: { href: "https://new.test", target: "_blank" } };
      expect((tree(fromDesign(plain).element).children![0] as Node).type).toBe("Link");
    });
  });

  describe("a template that's valid when it comes back", () => {
    it("reads no template node in a later format than its own (made from the builder's values instead), and says so", () => {
      const later = JSON.parse(JSON.stringify(toDesign(sample).design), (key, value) => (key === "_elements" ? { ...value, v: 2 } : value));
      const back = fromDesign(later);
      expect(back.report[0]).toMatch(/^body and \d+ more: written by a later version of Elements \(its format 2, this one reads 1\): made from the builder's values, as what's made in the builder is$/);
      // The Heading's background and corners, which the builder has no editor for, were only in its node.
      const find = (node: Node): Node | undefined => (node.type === "Heading" ? node : node.children?.map((child) => (typeof child === "string" ? undefined : find(child))).find(Boolean));
      const heading = find(tree(back.element));
      expect(heading?.children).toEqual(["Title"]);
      expect(heading?.style?.backgroundColor).toBeUndefined();
      expect(validate(back.element).diagnostics.filter((d) => d.severity === "error")).toEqual([]);
      // One block of a later version's, in a design of this one's: that block, said.
      const one = designOf(sample);
      const [first] = blocks(one);
      first.values._elements = { ...first.values._elements, v: 2 };
      expect(fromDesign(one).report).toEqual([
        "body.rows[0].columns[0].contents[0]: written by a later version of Elements (its format 2, this one reads 1): made from the builder's values, as what's made in the builder is",
      ]);
    });

    it("takes a design made in the builder, without the template's nodes, as a valid Email", () => {
      const design = JSON.parse(JSON.stringify(toDesign(sample).design), (key, value) => (key === "_elements" ? undefined : value));
      expect(validate(fromDesign(design).element).diagnostics.filter((d) => d.severity === "error")).toEqual([]);
    });

    it("drops a builder value the builder removed, and makes a Button with an empty link a link to #", () => {
      const design = designOf(sample);
      delete blocks(design)[0].values.linkStyle;
      blocks(design)[0].values.displayCondition = { type: "x" };
      const button = blocks(design)[3];
      button.values.href = { name: "web", values: { href: "", target: "_blank" } };
      const back = fromDesign(design);
      expect(validate(back.element).diagnostics.filter((d) => d.severity === "error")).toEqual([]);
      expect(back.report).toContain('rows[1].columns[1].contents[0]: its link is empty in the builder: it\'s "#" until one is set');
    });

    it("numbers a duplicated block's id with the first number no other block has", () => {
      const design = designOf(
        <Email>
          <Text id="a">x</Text>
          <Text id="a-2">y</Text>
        </Email>
      );
      const column = design.body.rows[0].columns[0];
      column.contents.push(JSON.parse(JSON.stringify(column.contents[0])));
      expect((tree(fromDesign(design).element).children as Node[]).map((child) => child.id)).toEqual(["a", "a-2", "a-3"]);
    });
  });

  describe("what the targeted check found in the fixes", () => {
    it("takes a row's background the builder cleared, in a Section", () => {
      const design = designOf(
        <Email>
          <Section style={{ backgroundColor: "#eeeeee" }}>
            <Text>a</Text>
            <Row>
              <Column>
                <Text>b</Text>
              </Column>
            </Row>
          </Section>
        </Email>
      );
      for (const cleared of [undefined, ""]) {
        const edited = JSON.parse(JSON.stringify(design));
        if (cleared === undefined) delete edited.body.rows[1].values.backgroundColor;
        else edited.body.rows[1].values.backgroundColor = cleared;
        const back = fromDesign(edited);
        expect(validate(back.element).diagnostics.filter((d) => d.severity === "error")).toEqual([]);
        expect((tree(back.element).children as Node[]).map((section) => section.style?.backgroundColor)).toEqual(["#eeeeee", undefined]);
      }
    });

    it("keeps a page break whose row the builder changed", () => {
      const design = designOf(
        <Document>
          <Text>A</Text>
          <PageBreak />
          <Text>B</Text>
        </Document>
      );
      design.body.rows[1].values.padding = "10px 0px 0px 0px";
      expect((tree(fromDesign(design).element).children as Node[]).map((child) => child.type)).toEqual(["Text", "PageBreak", "Text"]);
    });
  });

  describe("more of what the builder does", () => {
    it("gives a header row's background to a Column (a header holds no Section), and keeps an empty Section", () => {
      const design = designOf(
        <Document>
          <PageHeader>
            <Text>h</Text>
          </PageHeader>
          <Text>body</Text>
        </Document>
      );
      (design.body as unknown as { headers: Design["body"]["rows"] }).headers[0].values.backgroundColor = "#ff0000";
      expect((tree(fromDesign(design).element).children![0] as Node).children).toEqual([{ type: "Column", style: { backgroundColor: "#ff0000" }, children: [{ type: "Text", children: ["h"] }] }]);
      const spacer = <Email>{[<Section key="s" style={{ backgroundColor: "#f00", padding: 40 }} />]}</Email>;
      expect(tree(fromDesign(toDesign(spacer).design).element)).toEqual(tree(spacer));
    });

    it("takes a document made in the builder as a Document, and leaves out a page break in an Email", () => {
      const document = JSON.parse(JSON.stringify(toDesign(invoice).design), (key, value) => (key === "_elements" ? undefined : value));
      const back = fromDesign(document);
      expect(tree(back.element).type).toBe("Document");
      expect(validate(back.element).diagnostics.filter((d) => d.severity === "error")).toEqual([]);
      const email = designOf(<Email>{[<Text key="a">A</Text>]}</Email>);
      email.body.rows[0].columns[0].contents.push({ type: "page_break", values: {} });
      expect(fromDesign(email).report).toEqual(["rows[0].columns[0].contents[1]: a page break is a Document's: left out"]);
    });

    it("says what it keeps for the builder that Elements doesn't draw, and a paragraph's own alignment", () => {
      const design = designOf(sample);
      design.body.rows[0].values.backgroundImage = { url: "https://example.com/bg.png", fullWidth: true, repeat: "no-repeat", size: "cover", position: "center" };
      blocks(design)[1].values.text = '<p style="text-align: center;">Hello</p>';
      expect(fromDesign(design).report).toEqual([
        "rows[0].columns[0].contents[1]: its text was edited in the builder: what its HTML can't hold (a link's hover or title, a run's own size) is left out",
        "rows[0].columns[0].contents[1]: its text has markup a text block doesn't hold, left out: a paragraph's own alignment",
        "rows[0]: its backgroundImage changed in the builder: kept for the builder, which Elements doesn't draw",
      ]);
    });

    it("prints text with spaces at its ends so they stay", () => {
      const spaced = <Email>{[<Text key="a">{" sep "}</Text>]}</Email>;
      const { code } = fromDesign(toDesign(spaced).design);
      expect(code).toContain('<Text>{" sep "}</Text>');
    });
  });

  describe("Documents and HTML blocks the builder takes", () => {
    it("writes a Document's or a narrow column's HTML block, and brings it back", () => {
      const table = (
        <Table>
          <TableRow>
            <TableCell>a</TableCell>
          </TableRow>
        </Table>
      );
      const document = <Document>{table}</Document>;
      const narrow = (
        <Email>
          <Row>
            {[0, 1, 2, 3].map((i) => (
              <Column key={i}>{table}</Column>
            ))}
          </Row>
        </Email>
      );
      for (const template of [document, narrow]) expect(tree(fromDesign(toDesign(template).design).element)).toEqual(tree(template));
    });

    it("writes one page break before a page that follows the template's own, and keeps a blank page", () => {
      const template = (
        <Document>
          <Text>A</Text>
          <PageBreak />
          <Document.Page>
            <Text>B</Text>
          </Document.Page>
          <Document.Page style={{ backgroundColor: "#ff0000" }} />
        </Document>
      );
      const design = designOf(template);
      expect(blocks(design).map((content) => content.type)).toEqual(["text", "page_break", "text", "page_break"]);
      expect(tree(fromDesign(design).element)).toEqual(tree(template));
    });
  });
});
