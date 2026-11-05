import { describe, it, expect } from "vitest";
import React from "react";
import { renderToHtml } from "./utils/render-to-html";
import Body from "./components/Body";
import Row from "./components/Row";
import { Column } from "./components/Column";
import Paragraph from "./components/Paragraph";
import Heading from "./components/Heading";
import Html from "./components/Html";

/**
 * Output-contract tests: higher-level invariants of the rendered HTML that must
 * hold for correct (especially cross-client email) rendering. They make a
 * regression in widths/defaults fail with a clear message, and they document the
 * contract.
 *
 * The default values asserted here (contentWidth 500px, content padding 10px,
 * text color #000000) are the defaults in builder/tool-defaults.
 */

const uniq = (html: string, re: RegExp): string[] =>
  [...new Set([...html.matchAll(re)].map((m) => m[1]!))];

const all = (html: string, re: RegExp): number[] => [...html.matchAll(re)].map((m) => Number(m[1]));

const CONTENT = /<table[^>]*style="max-width:(\d+)px"/g; // modern-client content table
const OUTLOOK_COLUMN = /<td width="(\d+)" valign="top" style="width:\1px">/g; // Outlook's cells, in its conditional comments
const COLUMN = /<div style="display:inline-block[^"]*;max-width:(\d+)px/g; // modern-client column
const STACKS_AT = /@media \(max-width: (\d+)px\)\{\.\w+>div\{width:100%!important/g; // where the columns stack

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
  // The body contentWidth feeds places that must stay in lock-step: Outlook's
  // column cells, the modern-client container and columns, and where those
  // columns stack. If they disagree, Outlook renders a different width.
  it.each([500, 600, 700, 800])(
    "contentWidth %ipx drives Outlook's cells, the container, its columns and where they stack identically",
    (px) => {
      const html = renderToHtml(twoCol(`${px}px`), { mode: "email" });
      expect(all(html, OUTLOOK_COLUMN)).toEqual([px / 2, px / 2]);
      expect(uniq(html, CONTENT)).toEqual([String(px)]);
      expect(all(html, COLUMN)).toEqual([px / 2, px / 2]);
      // Both columns no longer fit once the window can't hold the content width
      // and a 10px margin on each side.
      expect(uniq(html, STACKS_AT)).toEqual([String(px + 20)]);
    }
  );
});

describe("Body carries its default values", () => {
  // The body must carry its full default values before rendering, so everything
  // that takes a width resolves the same number. With contentWidth unset it
  // resolves to the 500px default — not a 600 fallback.
  it("unset contentWidth resolves to the 500px default everywhere (not 600)", () => {
    const html = renderToHtml(twoCol(), { mode: "email" });
    expect(all(html, OUTLOOK_COLUMN)).toEqual([250, 250]);
    expect(uniq(html, CONTENT)).toEqual(["500"]);
    expect(all(html, COLUMN)).toEqual([250, 250]);
    expect(uniq(html, STACKS_AT)).toEqual(["520"]);
  });

  // The textColor default (#000000) must reach what says no color of its own: an
  // email has no element around it all that every client reads, so a user's markup
  // gets it from a rule on its cells.
  it("the textColor default (#000000) reaches a user's markup in an email, and a textColor replaces it", () => {
    const markup = (props: { textColor?: string }) =>
      renderToHtml(
        <Body mode="email" {...props}>
          <Row>
            <Column>
              <Html html="<p>own</p>" />
            </Column>
          </Row>
        </Body>
      );
    expect(markup({})).toContain("table, td { color: #000000; }");
    expect(markup({ textColor: "#123456" })).toContain("table, td { color: #123456; }");
  });

  it("the textColor default (#000000) is on a page's root, and a textColor replaces it", () => {
    const root = (props: { textColor?: string }) =>
      /<main style="[^"]*;color:(#\w+)/.exec(
        renderToHtml(
          <Body mode="web" {...props}>
            <Row>
              <Column>
                <Paragraph>x</Paragraph>
              </Column>
            </Row>
          </Body>
        )
      )?.[1];
    expect(root({})).toBe("#000");
    expect(root({ textColor: "#123456" })).toBe("#123456");
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
    expect(html).toMatch(/<td style="padding:10px"><p/);
  });
});
