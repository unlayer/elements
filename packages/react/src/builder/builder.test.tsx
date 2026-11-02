import { describe, expect, it } from "vitest";
import { renderToHtml } from "../index";
import { Button, Canvas, Column, Email, Grid, Heading, Image, Layer, Page, Paragraph, Row, Section, Text } from "../primitives";
import * as stripe from "../primitives/codemod/StripeReceipt";
import * as airbnb from "../primitives/codemod/AirbnbConfirmation";
import * as brew from "../primitives/codemod/MorningBrewDigest";
import { raise } from "./raise";
import { toDesign } from "./index";

describe("toDesign", () => {
  for (const [name, template] of [["StripeReceipt", <stripe.StripeReceipt />], ["AirbnbConfirmation", <airbnb.AirbnbConfirmation />], ["MorningBrewDigest", <brew.MorningBrewDigest />]] as const) {
    it(`writes ${name} as the builder's design, every block a tool`, () => {
      const { element, report } = raise(template);
      expect(report).toEqual([]);
      expect(renderToHtml(element!)).toContain("<!DOCTYPE");
      const { design } = toDesign(template);
      const types = design.body.rows.flatMap((row: { columns: Array<{ contents: Array<{ type: string }> }> }) => row.columns.flatMap((column) => column.contents.map((content) => content.type)));
      expect(types.length).toBeGreaterThan(3);
      expect(types).not.toContain("html");
    });
  }

  it("makes what no tool shows an HTML block of the new engine's markup, and lists it", () => {
    const { design, report } = toDesign(
      <Email width={600}>
        <Heading>Summer sale</Heading>
        <Layer style={{ height: 200, alignItems: "center" }}>
          <Image src={{ src: "https://example.com/hero.png", width: 1200, height: 400 }} alt="Sea" style={{ width: "100%" }} />
          <Text>Up to 40% off</Text>
        </Layer>
      </Email>
    );
    const contents = design.body.rows.flatMap((row: { columns: Array<{ contents: Array<{ type: string; values: Record<string, unknown> }> }> }) => row.columns.flatMap((column) => column.contents));
    expect(contents.map((content) => content.type)).toEqual(["heading", "html"]);
    expect(String(contents[1].values.html)).toContain('background="https://example.com/hero.png"');
    expect(report).toEqual(["root.children[1]: a Layer isn't a tool of the builder's: it's an HTML block of its own markup in the builder (it can be moved, not edited)"]);
  });

  it("makes a Grid's rows the builder's rows, its cells their columns", () => {
    const { design } = toDesign(
      <Page width={600}>
        <Grid columns={3} style={{ gap: 20 }}>
          {["a", "b", "c", "d"].map((word) => (
            <Text key={word}>{word}</Text>
          ))}
        </Grid>
      </Page>
    );
    expect(design.body.rows.map((row: { cells: number[] }) => row.cells.length)).toEqual([3, 3]);
  });

  it("writes a Button's hover colors and border to the builder's button, and a Row hidden on phones in a Section stays hidden", () => {
    const { design } = toDesign(
      <Email>
        <Section style={{ backgroundColor: "#eeeeee" }}>
          <Row hidden={{ mobile: true }}>
            <Column>
              <Button href="https://example.com" hover={{ color: "#ffffff", backgroundColor: "#000000" }} style={{ border: { top: "2px solid #ff0000", right: "2px solid #ff0000", bottom: "2px solid #ff0000", left: "2px solid #ff0000" } }}>
                Go
              </Button>
            </Column>
          </Row>
        </Section>
      </Email>
    );
    const row = design.body.rows[0];
    const button = row.columns[0].contents[0].values;
    expect(button.buttonColors).toMatchObject({ hoverColor: "#ffffff", hoverBackgroundColor: "#000000" });
    expect(button.border).toMatchObject({ borderTopWidth: "2px", borderTopStyle: "solid", borderTopColor: "#ff0000", borderLeftWidth: "2px" });
    expect(row.values._override?.mobile?.hideMobile).toBe(true);
  });

  it("keeps each node in the values the builder keeps (not beside them), and lists what has no editor in the builder yet", () => {
    const { design, report } = toDesign(
      <Email>
        <Heading style={{ borderRadius: 8 }}>Hi</Heading>
        <Image src={{ src: "https://example.com/a.png", width: 600, height: 300 }} alt="" style={{ borderRadius: 16 }} />
      </Email>
    );
    expect(design.body.values._elements.node.type).toBe("Email");
    const [heading, image] = design.body.rows[0].columns[0].contents;
    expect(heading.values._elements).toMatchObject({ v: 1, node: { type: "Heading", style: { borderRadius: 8 }, children: ["Hi"] }, w: { text: "Hi", headingType: "h1" } });
    expect(image.values._elements.node.style).toEqual({ borderRadius: 16 });
    expect(Object.keys(design.body.rows[0]).sort()).toEqual(["cells", "columns", "values"]);
    expect(report).toEqual([
      "root.children[0]: kept in the design, with no editor in the builder yet: style.borderRadius",
      "root.children[1]: kept in the design, with no editor in the builder yet: style.borderRadius",
    ]);
  });

  it("takes an Email, a Page or a Document, which the builder edits", () => {
    expect(() =>
      toDesign(
        <Canvas width={600} height={315}>
          <Text>Hi</Text>
        </Canvas>
      )
    ).toThrow("the builder edits an Email, a Page or a Document, not a Canvas");
  });
});
