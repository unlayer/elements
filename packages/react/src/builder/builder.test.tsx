import { describe, expect, it } from "vitest";
import { renderToHtml } from "../index";
import { Column, Document, Email, Grid, Heading, Image, Layer, Page, Paragraph, Section, Text } from "../primitives";
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

  it("takes an Email or a Page, which the builder edits", () => {
    expect(() =>
      toDesign(
        <Document>
          <Text>Hi</Text>
        </Document>
      )
    ).toThrow("the builder edits an Email or a Page, not a Document");
  });
});
