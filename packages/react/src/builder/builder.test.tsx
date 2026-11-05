/** toDesign(): a template as the builder's design JSON, every block a tool where one shows it, and what it can't hold said. */
import { describe, expect, it } from "vitest";
import { Button, Canvas, Column, component, Document, Email, Grid, Heading, Html, Image, Layer, Link, Page, PageBreak, Paragraph, prop, Rect, Row, Section, Svg, Table, TableCell, TableRow, Text } from "../primitives";
import { airbnb, stripe } from "../primitives/testing/codemod-examples";
import { renderToHtml } from "../index";
import { collectTemplate } from "../primitives/collect";
import { fromDesign, toDesign } from "./index";
import { raise } from "./raise";
import { invoice } from "./testing/templates";

type Values = Record<string, any>;
const blocks = (design: any): Array<{ type: string; values: Values }> => design.body.rows.flatMap((row: any) => row.columns.flatMap((column: any) => column.contents));

describe("toDesign", () => {
  for (const [name, template] of [["StripeReceipt", <stripe.StripeReceipt key="s" />], ["AirbnbConfirmation", <airbnb.AirbnbConfirmation key="a" />]] as const) {
    it(`writes ${name} as the builder's design, today's components drawing it, every block a tool`, () => {
      const { element } = raise(template);
      expect(renderToHtml(element!)).toContain("<!DOCTYPE");
      const types = blocks(toDesign(template).design).map((content) => content.type);
      expect(types.length).toBeGreaterThan(3);
      expect(types).not.toContain("html");
    });
  }

  it("writes what no tool shows as an HTML block of the new engine's markup, and says so", () => {
    const Card = component({ type: "acme.Card", label: "Card", props: { title: prop.text({ label: "Title", required: true }) }, render: ({ title }) => <Text>{title}</Text> });
    const { design, report } = toDesign(
      <Page width={600}>
        <Heading>Summer sale</Heading>
        <Layer style={{ height: 200, alignItems: "center" }}>
          <Image src={{ src: "https://example.com/hero.png", width: 1200, height: 400 }} alt="Sea" style={{ width: "100%" }} />
          <Text>Up to 40% off</Text>
        </Layer>
        <Svg width={20} height={20}>
          <Rect width={20} height={20} />
        </Svg>
        <Table>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </Table>
        <Row>
          <Column>
            <Column style={{ backgroundColor: "#eeeeee" }}>
              <Text>A box in a column</Text>
            </Column>
          </Column>
        </Row>
        <Card title="Mine" />
      </Page>
    );
    const contents = blocks(design);
    expect(contents.map((content) => content.type)).toEqual(["heading", "html", "html", "html", "html", "html"]);
    expect(String(contents[1].values.html)).toContain("https://example.com/hero.png");
    expect(String(contents[2].values.html)).toContain("<svg");
    expect(String(contents[5].values.html)).toContain("Mine");
    expect(report.filter((line) => line.includes("it's an HTML block")).map((line) => line.split(":")[0])).toEqual(["root.children[1]", "root.children[2]", "root.children[3]", "root.children[4].children[0].children[0]", "root.children[5]"]);
  });

  it("writes an Html block as the builder's own HTML block, its plain text hidden", () => {
    const [html] = blocks(toDesign(<Email><Html html="<b>Sale</b>" text="Sale now" /></Email>).design);
    expect(html).toMatchObject({ type: "html", values: { html: '<div style="line-height:1.5"><b>Sale</b></div>', text: "Sale now", containerPadding: "0px" } });
  });

  it("writes a Grid's rows as the builder's rows, its cells as their columns", () => {
    const { design } = toDesign(
      <Page width={600}>
        <Grid columns={3} style={{ gap: 20 }}>
          {["a", "b", "c", "d"].map((word) => (
            <Text key={word}>{word}</Text>
          ))}
        </Grid>
      </Page>
    );
    // Each cell its width and its share of the gap: 600px less two 20px gaps, in three.
    expect(design.body.rows.map((row) => row.cells)).toEqual([
      [197, 207, 196],
      [197, 207, 196],
    ]);
    expect(design.body.rows[1].columns.map((column) => column.contents.length)).toEqual([1, 0, 0]);
  });

  it("writes a Document's page settings, its header and footer, and a page break where each page ends", () => {
    const { design, report } = toDesign(invoice);
    const body = design.body as any;
    expect([body.values.documentSize, body.values.documentOrientation, body.values.documentMargin]).toEqual(["A5", "landscape", "40px"]);
    expect(design.schemaVersion).toBeGreaterThanOrEqual(28);
    expect([body.headers.length, body.footers.length]).toEqual([1, 1]);
    expect(body.headers[0].values._meta).toEqual({ htmlID: "u_header_1", htmlClassNames: "u_header" });
    expect(blocks(design).map((content) => content.type)).toEqual(["heading", "text", "page_break", "text", "page_break", "text", "page_break", "text"]);
    expect(blocks(design)[1].values.text).toBe("Page {{page_number}} of {{page_count}}");
    expect(report).toEqual([]);
    // A margin that differs from side to side: the widest, the sides hidden.
    const sides = toDesign(<Document margin={[10, 20, 30, 40]}><Text>A</Text><PageBreak /><Text>B</Text></Document>).design.body.values;
    expect([sides.documentMargin, sides.margin]).toEqual(["40px", "10px 20px 30px 40px"]);
  });

  it("writes a link's target only where the template gives one: a Button's, a link in text, an image's", () => {
    const { design } = toDesign(
      <Email>
        <Paragraph>
          <Link href={{ href: "https://x.test/a", target: "_blank" }}>a</Link> <Link href="https://x.test/b">b</Link>
        </Paragraph>
        <Link href={{ href: "https://x.test/image", target: "_blank" }}>
          <Image src={{ src: "https://example.com/a.png", width: 600, height: 300 }} alt="" />
        </Link>
      </Email>
    );
    const [text, image] = blocks(design).map((content) => content.values);
    expect(text.text).toBe('<a href="https://x.test/a" target="_blank">a</a> <a href="https://x.test/b">b</a>');
    expect(image.action).toEqual({ name: "web", values: { href: "https://x.test/image", target: "_blank" } });
    expect(JSON.stringify(design)).not.toContain("[object Object]");
  });

  it("writes a template's ids as the builder's, and no background where the template has none", () => {
    const { design } = toDesign(
      <Email>
        <Section id="band" style={{ backgroundColor: "#eeeeee" }}>
          <Paragraph id="intro">Hi</Paragraph>
        </Section>
      </Email>
    );
    expect(blocks(design)[0].values._meta).toEqual({ htmlID: "intro", htmlClassNames: "u_content_text" });
    expect(design.body.values.backgroundColor).toBe("");
  });

  it("says what has no place in the builder's design", () => {
    expect(
      toDesign(
        <Email>
          <Paragraph>
            <Link href="https://x.test" hover={{ color: "#ff0000" }}>
              a
            </Link>
          </Paragraph>
          <Image src="https://example.com/no-size.png" alt="" />
        </Email>
      ).report
    ).toEqual(["root.children[0]: the builder's text holds no a link's hover: left out", "root.children[1]: an image without its size (its src's width and height) takes its own size, and in the builder its column's width"]);
  });

  it("takes an Email, a Page or a Document, which the builder edits", () => {
    expect(() =>
      toDesign(
        <Canvas width={600} height={315}>
          <Text>Hi</Text>
        </Canvas>
      )
    ).toThrow("the builder edits an Email, a Page or a Document, not a Canvas");
    expect(() => toDesign(<Email><Row>{"text in a row" as never}</Row></Email>)).toThrow("This template can't go to the builder");
  });

  it("writes a Section of several Rows as rows in its band, its border the part around each", () => {
    const { design } = toDesign(
      <Email>
        <Section style={{ backgroundColor: "#eeeeee", border: "2px solid #000000", padding: 10 }} hidden={{ mobile: true }}>
          <Text>One</Text>
          <Row>
            <Column>
              <Text>Two</Text>
            </Column>
          </Row>
          <PageFooterless />
        </Section>
      </Email>
    );
    const rows = design.body.rows.map((row) => row.values);
    expect(rows.map((row) => row.backgroundColor)).toEqual(["#eeeeee", "#eeeeee", "#eeeeee"]);
    expect(rows.map((row) => Object.keys(row.sectionBorder ?? {}).filter((key) => key.endsWith("Width")).map((key) => key.slice(6, -5)).sort())).toEqual([["Left", "Right", "Top"], ["Left", "Right"], ["Bottom", "Left", "Right"]]);
    expect(rows.map((row) => row._override?.mobile?.hideMobile)).toEqual([true, true, true]);
  });
});

/** Another run of blocks after a Row. */
function PageFooterless() {
  return <Text>Three</Text>;
}

describe("a link's window", () => {
  it("stays where a template gives no target, where the builder's default is a new one, and comes back with none", () => {
    const { design } = toDesign(<Email><Button href="https://example.com">Go</Button></Email>);
    expect(JSON.stringify(design)).toContain('"href":{"name":"web","values":{"href":"https://example.com","target":"_self"}}');
    expect(fromDesign(design, { displayMode: "email" }).code).toMatch(/href="https:\/\/example\.com"/);
  });
});

describe("a line height", () => {
  const field = (element: React.ReactElement) => blocks(toDesign(<Email>{element}</Email>).design)[0].values as { lineHeight: string; _override?: { mobile?: { lineHeight?: string } } };

  it("is a whole percentage in the builder's field, rounded up, as Chromium draws only a percentage's whole part", () => {
    expect(field(<Text style={{ fontSize: 13, lineHeight: "24px" }}>x</Text>).lineHeight).toBe("185%");
    expect(field(<Text style={{ fontSize: 14, lineHeight: 1.625 }}>x</Text>).lineHeight).toBe("163%");
    expect(field(<Text style={{ fontSize: 16, lineHeight: "24px" }}>x</Text>).lineHeight).toBe("150%");
  });

  it("is one on phones too", () => {
    expect(field(<Text mobile={{ lineHeight: 1.625 }}>x</Text>)._override?.mobile?.lineHeight).toBe("163%");
  });
});

describe("an Html block", () => {
  it("takes the text styles around it to the builder, whose HTML block has none", () => {
    const { design } = toDesign(<Email><Column style={{ textAlign: "center", color: "#123456", fontSize: 18 }}><Html html="<b>x</b>" /></Column></Email>);
    const html = blocks(design).find((block) => block.type === "html")!.values.html;
    expect(html).toContain("text-align:center");
    expect(html).toContain("color:#123456");
    expect(html).toContain("font-size:18px");
    expect(html).toContain("<b>x</b>");
  });

  it("says the default line height, which the builder's body doesn't give, and comes back without it", () => {
    const { design } = toDesign(<Email><Html html="<b>x</b>" /></Email>);
    expect(blocks(design).find((block) => block.type === "html")!.values.html).toBe('<div style="line-height:1.5"><b>x</b></div>');
    const back = collectTemplate(fromDesign(design, { displayMode: "email" }).element).document!.root;
    expect(JSON.stringify(back)).toContain('"html":"<b>x</b>"');
  });

  it("keeps markup that only starts and ends like that wrapper", () => {
    const markup = '<div style="line-height:1.5">a</div><div>b</div>';
    const design = { body: { rows: [{ cells: [1], columns: [{ contents: [{ type: "html", values: { html: markup } }], values: {} }], values: {} }], values: {} } };
    const back = collectTemplate(fromDesign(design, { displayMode: "email" }).element).document!.root;
    expect(JSON.stringify(back)).toContain(JSON.stringify(markup).slice(1, -1));
  });
});
