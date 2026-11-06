/** toDesign(): a template as the builder's design JSON, every block a tool where one shows it, and what it can't hold said. */
import { describe, expect, it } from "vitest";
import { Button, Canvas, Column, component, Document, Email, Grid, Heading, Html, Image, Layer, Link, List, ListItem, Page, PageBreak, PageFooter, PageHeader, PageNumber, Paragraph, prop, Rect, Row, Span, Section, Svg, Table, TableCell, TableRow, Text } from "../primitives";
import { airbnb, stripe } from "../primitives/testing/codemod-examples";
import { collectTemplate } from "../primitives/collect";
import { withParagraphMargin } from "./text";
import { fromDesign, toDesign } from "./index";
import { invoice } from "./testing/templates";

type Values = Record<string, any>;
const blocks = (design: any): Array<{ type: string; values: Values }> => design.body.rows.flatMap((row: any) => row.columns.flatMap((column: any) => column.contents));

describe("toDesign", () => {
  for (const [name, template] of [["StripeReceipt", <stripe.StripeReceipt key="s" />], ["AirbnbConfirmation", <airbnb.AirbnbConfirmation key="a" />]] as const) {
    it(`writes ${name} as the builder's design, every block a tool`, () => {
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
    expect(report).toEqual([expect.stringContaining("the builder has no page numbers yet")]);
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

  it("says a painted box in a Section loses the space at its sides, and moves it into an unpainted box's column", () => {
    const template = (style: Record<string, string | number>) => (
      <Email width={480}>
        <Section style={{ padding: [0, 24] }}>
          <Text>above</Text>
          <Column style={style}>
            <Text>x</Text>
          </Column>
        </Section>
      </Email>
    );
    const painted = toDesign(template({ backgroundColor: "#eeeeee", padding: 20 }));
    expect(painted.report).toEqual(["root.children[0].children[1]: the builder's row can't keep a painted box in from its sides: the 24px around it is left out, so it's as wide as the row"]);
    expect(painted.design.body.rows[1].columns[0].values.padding).toBe("20px");
    const plain = toDesign(template({ height: 80, padding: 20 }));
    expect(plain.report).toEqual([]);
    expect(plain.design.body.rows[1].columns[0].values.padding).toBe("20px 44px");
  });

  it("gives each font the root has its stylesheet, as the builder loads one, and reads it back as that font", () => {
    const face = { family: "Geist", src: "https://fonts.example/geist.woff2", format: "woff2", weight: "100 900" } as const;
    const { design } = toDesign(
      <Email fonts={[face]} style={{ fontFamily: "Geist, Arial, sans-serif" }}>
        <Paragraph>Words</Paragraph>
        <Paragraph style={{ fontFamily: "Georgia, serif" }}>More</Paragraph>
      </Email>
    );
    const body = design.body.values.fontFamily as { label: string; url?: string };
    expect(body.label).toBe("Geist");
    expect(decodeURIComponent(body.url ?? "")).toBe("data:text/css;charset=utf-8,@font-face{font-family:'Geist';src:url(https://fonts.example/geist.woff2) format('woff2');font-weight:100 900;font-style:normal}");
    expect(JSON.stringify(blocks(design)[1].values.fontFamily)).not.toContain("url");
    const back = fromDesign(design);
    expect(back.report.join("\n")).not.toContain("web fonts");
    expect(back.code).toContain("geist.woff2");
    // One the template doesn't have is still said to be left out.
    const other = JSON.parse(JSON.stringify(design));
    other.body.values.fontFamily = { label: "Lora", value: "Lora, serif", url: "https://fonts.example/lora.css" };
    expect(fromDesign(other).report.join("\n")).toContain("Lora: web fonts the builder loads from a stylesheet");
  });

  it("says what a Document's HTML blocks lose, which the builder's document mode doesn't draw", () => {
    const missing = "the builder's document mode keeps it but doesn't draw or export it, so what's in it isn't in the builder's PDF";
    const table = <Table><TableRow><TableCell>Words</TableCell></TableRow></Table>;
    expect(toDesign(<Document>{table}</Document>).report.join("\n")).toContain(missing);
    expect(toDesign(<Document><Html html="<p>Words</p>" /></Document>).report.join("\n")).toContain(missing);
    expect(toDesign(<Email>{table}</Email>).report.join("\n")).toContain("it can be moved, not edited");
    expect(toDesign(<Email><Html html="<p>Words</p>" /></Email>).report).toEqual([]);
  });

  it("says where the builder can't draw a Row's border as it's written: on its columns, which fill the row and move with alignItems", () => {
    const row = (style: Record<string, unknown>) => (
      <Row style={{ border: { top: "1px solid #000000" }, ...style }}>
        <Column><Text>a</Text></Column>
        <Column><Text>b</Text></Column>
      </Row>
    );
    expect(toDesign(<Email>{row({})}</Email>).report).toEqual([]);
    expect(toDesign(<Email><Section style={{ padding: [0, 48] }}>{row({})}</Section></Email>).report).toEqual(["root.children[0].children[0]: the builder draws a Row's border on its columns, which fill the row: the 48px around the Row goes inside the line, so the line is as wide as the row"]);
    expect(toDesign(<Email>{row({ alignItems: "end" })}</Email>).report).toEqual(["root.children[0]: the builder draws a Row's border on its columns, which alignItems moves: each part of the line is at its column's height"]);
    expect(toDesign(<Email>{row({ alignItems: "stretch" })}</Email>).report).toEqual([]);
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

describe("a custom component that's a band of its own", () => {
  it("goes to the builder as an HTML block, where it's placed as it was", () => {
    const Hero = component({ type: "acme.Hero", label: "Hero", placement: "section", props: { title: prop.text({ label: "Title", required: true }) }, render: ({ title }) => <Section><Heading>{title}</Heading></Section> });
    const { design, report } = toDesign(<Email><Hero title="Launch" /></Email>);
    expect(JSON.stringify(design)).toContain("Launch");
    expect(report.join("\n")).toContain("HTML block");
  });
});

describe("what the builder can't hold", () => {
  const said = (element: React.ReactElement) => toDesign(element).report.join("\n");

  it("keeps an Image in a run of text, as an HTML block of its own", () => {
    const { design, report } = toDesign(<Email><Text>Rated <Image src={{ src: "https://x.test/s.png", width: 80, height: 16 }} alt="five stars" /> by customers</Text></Email>);
    expect(report.join("\n")).toContain("an Image in a run of text");
    expect(JSON.stringify(design)).toContain("five stars");
  });

  it("says what it leaves out of text", () => {
    expect(said(<Email><List><ListItem style={{ color: "#654321" }}>a</ListItem></List></Email>)).toContain("list item");
    expect(said(<Email><Text>a <Span mobile={{ fontSize: 20 }}>b</Span></Text></Email>)).toContain("phone styles");
    expect(said(<Email><Text><Link href="#" attrs={{ "data-x": "1" }}>b</Link></Text></Email>)).toContain("other attributes");
    expect(said(<Email><Text><Link id="x" href="#">b</Link></Text></Email>)).toContain("id on part of its text");
  });

  it("says a Row's and a Section's border on phones, and a plain Column's phone values, are left out", () => {
    expect(said(<Email><Row mobile={{ border: "1px solid #000" }}><Column><Text>a</Text></Column></Row></Email>)).toContain("no border on phones");
    expect(said(<Email><Section mobile={{ border: "1px solid #000" }}><Text>a</Text></Section></Email>)).toContain("no border on phones");
    expect(said(<Email><Column><Column mobile={{ padding: 4 }}><Text>a</Text></Column></Column></Email>)).toContain("no phone values");
  });

  it("takes what it can: a header's background, a Column's corners and the ids of rows and columns", () => {
    const back = (element: React.ReactElement, displayMode: "email" | "document" = "email") => JSON.stringify(collectTemplate(fromDesign(JSON.parse(JSON.stringify(toDesign(element).design)), { displayMode }).element).document!.root);
    expect(back(<Document><PageHeader style={{ backgroundColor: "#123456" }}><Text>H</Text></PageHeader><Text>x</Text></Document>, "document")).toContain("#123456");
    expect(back(<Email><Column style={{ backgroundColor: "#eeeeee", borderRadius: { topLeft: 1, topRight: 2, bottomRight: 3, bottomLeft: 4 } }}><Text>a</Text></Column></Email>)).toContain('"topLeft":1');
    expect(back(<Email><Row id="plans"><Column id="left"><Text>a</Text></Column><Column><Text>b</Text></Column></Row></Email>)).toContain('"id":"left"');
    expect(back(<Email><Section id="pricing"><Text>a</Text></Section></Email>)).toContain('"id":"pricing"');
  });
});

describe("a design read back", () => {
  const read = (type: string, values: Record<string, unknown>, columnValues: Record<string, unknown> = {}) => {
    const { element, report } = fromDesign({ body: { values: {}, rows: [{ cells: [1], values: {}, columns: [{ values: columnValues, contents: [{ type, values }] }] }] } }, { displayMode: "email" });
    return { tree: JSON.stringify(collectTemplate(element).document!.root), report };
  };

  it("keeps a video's own picture", () => {
    expect(read("video", { video: { type: "vimeo", videoId: "12345", thumbnail: "https://i.vimeocdn.com/custom.jpg" } }).tree).toContain("custom.jpg");
  });

  it("keeps a social icon with no link, as Elements 0.2's components do", () => {
    expect(read("social", { icons: { iconType: "circle", icons: [{ name: "X", url: "" }, { name: "GitHub", url: "https://x.test" }] } }).tree).toContain('"name":"X"');
  });

  it("reads a button's corners, and says where it can't", () => {
    expect(read("button", { text: "Go", borderRadius: "21px 22px 23px 24px" }).tree).toContain('"topLeft":21');
    const percent = read("button", { text: "Go", borderRadius: "50%" });
    expect(percent.report.join("\n")).toContain("isn't one Elements draws");
  });

  it("reads a column's corners, its height, and what's hidden on phones", () => {
    expect(read("text", { text: "a" }, { backgroundColor: "#eeeeee", borderRadius: "1px 2px 3px 4px" }).tree).toContain('"bottomLeft":4');
    expect(read("text", { text: "a" }, { height: "120px" }).tree).toContain('"height":120');
    expect(read("text", { text: "a" }, { minWidth: "120px" }).tree).toContain('"minWidth":120');
    expect(read("text", { text: "a" }, { maxWidth: "200px", _override: { mobile: { maxWidth: "120px" } } }).tree).toContain('"mobile":{"maxWidth":120');
  });
});

describe("a page number", () => {
  it("says the editor's PDF prints its token, as the builder has no page numbers yet", () => {
    const { report } = toDesign(<Document><PageFooter><Text>Page <PageNumber /></Text></PageFooter><Text>x</Text></Document>);
    expect(report.join("\n")).toContain("the builder has no page numbers yet");
    expect(toDesign(<Document><Text>x</Text></Document>).report.join("\n")).not.toContain("page numbers");
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

  it("says a paragraph's margins going to the builder, whose stylesheet takes them away, and none coming from it", () => {
    const written = (html: string) => blocks(toDesign(<Email><Html html={html} /></Email>).design).find((block) => block.type === "html")!.values.html;
    expect(written('<p>a</p><p class="x">b</p>')).toContain('<p style=margin-top:1em;margin-bottom:1em>a</p><p style=margin-top:1em;margin-bottom:1em class="x">b</p>');
    expect(written('<p style="color:red">a</p>')).toContain('<p style="margin-top:1em;margin-bottom:1em;color:red">a</p>');
    expect(written('<p style="margin:5px">a</p><pre>b</pre><picture></picture>')).toContain('<p style="margin:5px">a</p><pre>b</pre><picture></picture>');
    const read = (html: string) => JSON.stringify(collectTemplate(fromDesign({ body: { rows: [{ cells: [1], columns: [{ contents: [{ type: "html", values: { html } }], values: {} }], values: {} }], values: {} } }, { displayMode: "email" }).element).document!.root);
    expect(read("<p>a</p><p/>")).toContain("<p style=margin:0>a</p><p style=margin:0 />");
    expect(read("<p style=\"margin-top:4px\">a</p>")).toContain('<p style=\\"margin:0;margin-top:4px\\">a</p>');
    expect(read("<p style=color:red>a</p>")).toContain("<p style=color:red>a</p>");
  });

  it("changes only a tag that is a paragraph, and adds nothing that ends a value", () => {
    // Text in an attribute, a comment, a script, or after a tag that never closes stays as it is.
    for (const html of [
      '<img src="x" title="<p onerror=alert(1)>">',
      "<img src='x' title='<p onerror=alert(1)>'>",
      "<img alt=<p/onerror=alert(1)>",
      '<img title="<p onerror=alert(1)>',
      "<!-- <p onerror=alert(1)> --><script>var p = '<p>';</script><style>p{}</style><textarea><p></textarea>",
    ]) {
      expect(withParagraphMargin(html, "margin:0")).toBe(html);
    }
    // A paragraph after them is still one.
    expect(withParagraphMargin('<img title="<p>"><!-- <p> --><p>x</p>', "margin:0")).toBe('<img title="<p>"><!-- <p> --><p style=margin:0>x</p>');
  });

  it("gives its margins before a design's markup is sanitized, so what's sanitized is what's drawn", () => {
    const markup = '<img src="x" title="<p onerror=alert(1)>"><p>a</p>';
    // An HTML block, and text kept as its markup (a paragraph with a class of its own).
    for (const block of [{ type: "html", values: { html: markup } }, { type: "text", values: { text: `<p class="c">b</p>${markup}` } }]) {
      const given: string[] = [];
      const toSafeHtml = (html: string) => (given.push(html), html.replace(/onerror=[^\s>]*/g, ""));
      const design = { body: { rows: [{ cells: [1], columns: [{ contents: [block], values: {} }], values: {} }], values: {} } };
      const root = JSON.stringify(collectTemplate(fromDesign(design, { displayMode: "email", toSafeHtml }).element).document!.root);
      expect(given.some((html) => html.includes("<p style=margin:0>a</p>"))).toBe(true);
      expect(root).toContain("<p style=margin:0>a</p>");
      expect(root).not.toContain("onerror");
    }
  });

  it("keeps markup that only starts and ends like that wrapper", () => {
    const markup = '<div style="line-height:1.5">a</div><div>b</div>';
    const design = { body: { rows: [{ cells: [1], columns: [{ contents: [{ type: "html", values: { html: markup } }], values: {} }], values: {} }], values: {} } };
    const back = collectTemplate(fromDesign(design, { displayMode: "email" }).element).document!.root;
    expect(JSON.stringify(back)).toContain(JSON.stringify(markup).slice(1, -1));
  });
});
