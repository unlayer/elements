import { describe, it, expect } from "vitest";
import React from "react";
import { renderToHtml } from "./utils/render-to-html";
import Body from "./components/Body";
import Row from "./components/Row";
import { Column } from "./components/Column";
import Paragraph from "./components/Paragraph";
import Heading from "./components/Heading";
import Image from "./components/Image";
import Divider from "./components/Divider";
import Video from "./components/Video";
import Email from "./components/Email";
import Page from "./components/Page";
import Document from "./components/Document";
import { renderToJson } from "./utils/render-to-json";
import { exporters as EXPORTERS, TextExporters } from "@unlayer/exporters";
import { generateHtmlFromTextJson } from "@unlayer-internal/shared-elements";

/**
 * Output-contract tests.
 *
 * The snapshot tests lock the exact rendered HTML; these assert higher-level
 * invariants of that HTML that must hold for correct (especially cross-client
 * email) rendering. They make a regression in widths/defaults fail with a clear
 * message instead of a noisy snapshot diff, and they document the contract.
 *
 * The default values asserted here (contentWidth 500px, content padding 10px,
 * text color #000000) are the `@unlayer/exporters` schema defaults. If the
 * pinned exporters version changes them, update these expectations.
 */

const uniq = (html: string, re: RegExp): string[] =>
  [...new Set([...html.matchAll(re)].map((m) => m[1]))];

const MSO = /width="(\d+)"[^>]*align="center"/g; // Outlook content-table width
const GRID_ROW = /\.u-row \{ width: (\d+)px/g; // responsive grid CSS desktop width

const twoCol = (cw?: string) => (
  <Body {...(cw ? { contentWidth: cw } : {})} mode="email">
    <Row cells={[1, 1]}>
      <Column>
        <Heading level="h2">Left</Heading>
        <Paragraph mode="email">Left copy</Paragraph>
      </Column>
      <Column>
        <Heading level="h2">Right</Heading>
        <Paragraph mode="email">Right copy</Paragraph>
      </Column>
    </Row>
  </Body>
);

describe("Email widths agree across clients", () => {
  // The body contentWidth feeds three places that must stay in lock-step: the
  // Outlook (MSO) content table, the modern-client container max-width, and the
  // responsive grid CSS. If they disagree, Outlook renders a different width.
  it.each(["500px", "600px", "700px", "800px"])(
    "contentWidth %s drives Outlook table, container, and grid identically",
    (cw) => {
      const px = parseInt(cw, 10).toString();
      const html = renderToHtml(twoCol(cw), { mode: "email" });
      expect(uniq(html, MSO)).toEqual([px]); // Outlook (<table width=...>)
      expect(uniq(html, GRID_ROW)).toEqual([px]); // responsive grid CSS
      expect(html).toContain(`max-width: ${px}px`); // modern-client container
    }
  );
});

describe("Body carries its default values", () => {
  // The body must carry its full default values before rendering, so every
  // width-consuming exporter resolves the same number. With contentWidth unset
  // it resolves to the 500px default — not the exporter's internal 600 fallback.
  it("unset contentWidth resolves to the 500px default everywhere (not 600)", () => {
    const html = renderToHtml(twoCol(), { mode: "email" });
    expect(uniq(html, MSO)).toEqual(["500"]);
    expect(uniq(html, GRID_ROW)).toEqual(["500"]);
    expect(html).toContain("max-width: 500px");
    expect(html).not.toContain('width="600"');
  });

  // The textColor default (#000000) must be carried onto the <body> element.
  // Match the <body> tag specifically (not item-level colors).
  it("the <body> element carries the textColor default (#000000)", () => {
    const html = renderToHtml(twoCol(), { mode: "email" });
    expect(html).toMatch(/class="clean-body u_body" style="[^"]*color: #000000/);
  });

  // A content block with no containerPadding gets the 10px content default.
  it("a content block with no containerPadding defaults to 10px", () => {
    const html = renderToHtml(
      <Body mode="email">
        <Row>
          <Column>
            <Paragraph mode="email">x</Paragraph>
          </Column>
        </Row>
      </Body>,
      { mode: "email" }
    );
    expect(html).toContain("padding:10px"); // email content wrapper (no spaces)
  });
});

/**
 * Editor parity: what renderToHtml writes for a block is what the editor exports for the design renderToJson writes,
 * its content type's exporter on its values, in its column, row and body. (Ids aside: the HTML numbers a Paragraph
 * `u_content_paragraph_N`, the design `u_content_text_N`.)
 */
describe("a block's HTML is the editor's export of its design", () => {
  const TYPES: Record<string, keyof typeof EXPORTERS> = { text: "Text", heading: "Heading", image: "Image", divider: "Divider", video: "Video", html: "Html" };
  const LEXICAL = JSON.stringify({ root: { type: "root", children: [
    { type: "paragraph", children: [{ type: "text", text: "Bold", format: 1 }, { type: "text", text: " and " }, { type: "link", url: "https://example.com", children: [{ type: "text", text: "a link" }] }] },
    { type: "paragraph", children: [{ type: "text", text: "A second paragraph" }] },
  ] } });
  const tree = (Root: React.FC<any>) => (
    <Root contentWidth="600px">
      <Row>
        <Column>
          <Paragraph fontSize="16px">Plain &amp; text with "quotes" &lt;tags&gt;</Paragraph>
          <Paragraph html={'Per <span style="font-size: 40px">$20</span>, H<sub>2</sub>O, x<sup>2</sup>, <code>code</code>'} lineHeight="1.6" />
          <Paragraph values={{ textJson: LEXICAL }} lineHeight="24px" />
          <Heading>A heading</Heading>
          <Image src="https://example.com/a.png" alt="Responsive" />
          <Image src="https://example.com/b.png" alt="Half" width="50%" />
          <Image src="https://example.com/c.png" alt="Pinned" width={290} />
          <Divider />
          <Video videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />
        </Column>
      </Row>
      <Row cells={[1, 2]} padding="0px 20px">
        <Column padding="8px">
          <Paragraph text="In a narrow column" />
          <Image src="https://example.com/d.png" alt="Narrow" />
        </Column>
        <Column>
          <Image src="https://example.com/e.png" alt="Wide" width="100%" />
        </Column>
      </Row>
    </Root>
  );

  it.each([["email", Email], ["web", Page], ["document", Document]] as const)("%s", (mode, Root) => {
    const html = renderToHtml(tree(Root));
    const design = renderToJson(tree(Root)) as any;
    const body = design.body.values;
    let blocks = 0;
    for (const row of design.body.rows) {
      row.columns.forEach((column: any, columnIndex: number) => {
        for (const content of column.contents) {
          const meta = { exporterConfig: { generateHtmlFromTextJson }, columnIndex, columnValues: column.values, rowCells: row.cells, rowValues: row.values, bodyValues: body };
          // (A block with no document exporter exports as on the web, in the editor too.)
          const exporter = (EXPORTERS[TYPES[content.type]] as any)[mode] ?? (EXPORTERS[TYPES[content.type]] as any).web;
          const exported = String(exporter(content.values, 0, columnIndex, row.cells, body, row.values, undefined, meta));
          expect(html, `${content.type} ${content.values._meta.htmlID}`).toContain(exported.trim());
          blocks++;
        }
      });
    }
    expect(blocks).toBe(12);
  });

  it("a Paragraph's HTML is the text block's exporter on its design's text (no <p>, its line height as given)", () => {
    for (const mode of ["email", "web", "document"] as const) {
      const Root = { email: Email, web: Page, document: Document }[mode];
      const one = (
        <Root>
          <Row>
            <Column>
              <Paragraph>Hello</Paragraph>
            </Column>
          </Row>
        </Root>
      );
      const values = (renderToJson(one) as any).body.rows[0].columns[0].contents[0].values;
      expect(values.text).toBe("Hello");
      expect(renderToHtml(one)).toContain(String(TextExporters[mode]!(values, 0, 0, [], {}, {}, undefined, { exporterConfig: {} } as any)).trim());
    }
  });
});
