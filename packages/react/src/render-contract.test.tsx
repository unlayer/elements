import { describe, it, expect } from "vitest";
import React from "react";
import { renderToHtml } from "./utils/render-to-html";
import Body from "./components/Body";
import Row from "./components/Row";
import { Column } from "./components/Column";
import Paragraph from "./components/Paragraph";
import Heading from "./components/Heading";

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
