/**
 * Golden Template Test
 *
 * A single realistic email template that exercises every component and
 * every pipeline. If anything regresses anywhere in the system, this breaks.
 */

import { describe, it, expect } from "vitest";
import React from "react";
import {
  renderToHtml,
  renderToPlainText,
  renderToHtmlParts,
  renderToJson,
  Email,
  Page,
  Row,
  Column,
  Button,
  Heading,
  Paragraph,
  Image,
  Divider,
  Social,
  Menu,
  Html,
  ColumnLayouts,
} from "./index";

// -- The golden template: a realistic marketing email --

const GoldenEmail = (
  <Email backgroundColor="#f4f4f5" contentWidth="600px" previewText="Spring sale — 30% off everything">
    {/* Header row: logo */}
    <Row backgroundColor="#ffffff">
      <Column padding="20px">
        <Image src="https://example.com/logo.png" alt="Acme Co" />
      </Column>
    </Row>

    {/* Navigation */}
    <Row backgroundColor="#1a1a2e">
      <Column>
        <Menu
          mode="email"
          values={{
            menu: {
              items: [
                { key: "1", text: "Shop", link: { name: "web", values: { href: "/shop" } } },
                { key: "2", text: "About", link: { name: "web", values: { href: "/about" } } },
                { key: "3", text: "Contact", link: { name: "web", values: { href: "/contact" } } },
              ],
            },
          }}
        />
      </Column>
    </Row>

    {/* Hero section */}
    <Row>
      <Column>
        <Image src="https://example.com/hero.jpg" alt="Spring Collection" />
        <Heading fontSize="28px" textAlign="center" color="#1a1a2e">
          Spring Sale — 30% Off
        </Heading>
        <Paragraph textAlign="center" color="#666666">
          Fresh styles for the new season. Limited time only.
        </Paragraph>
        <Button
          backgroundColor="#e63946"
          color="#ffffff"
          fontSize="16px"
          borderRadius="6px"
        >
          Shop Now
        </Button>
      </Column>
    </Row>

    <Row><Column><Divider borderTopColor="#eeeeee" /></Column></Row>

    {/* Two-column product grid */}
    <Row cells={[1, 1]}>
      <Column>
        <Image src="https://example.com/product-a.jpg" alt="Product A" />
        <Paragraph textAlign="center" fontSize="16px" color="#333333">
          Classic Tee — $29.99
        </Paragraph>
        <Button backgroundColor="#1a1a2e" color="#ffffff">Buy</Button>
      </Column>
      <Column>
        <Image src="https://example.com/product-b.jpg" alt="Product B" />
        <Paragraph textAlign="center" fontSize="16px" color="#333333">
          Slim Jeans — $49.99
        </Paragraph>
        <Button backgroundColor="#1a1a2e" color="#ffffff">Buy</Button>
      </Column>
    </Row>

    <Row><Column><Divider borderTopColor="#eeeeee" /></Column></Row>

    {/* Custom HTML block */}
    <Row>
      <Column>
        <Html html="<p style='text-align:center;color:#999;font-size:12px;'>Use code <strong>SPRING30</strong> at checkout</p>" />
      </Column>
    </Row>

    {/* Social icons */}
    <Row backgroundColor="#1a1a2e">
      <Column>
        <Social
          icons={[
            { name: "Facebook", url: "https://facebook.com/acme" },
            { name: "X", url: "https://x.com/acme" },
            { name: "Instagram", url: "https://instagram.com/acme" },
          ]}
        />
      </Column>
    </Row>

    {/* Footer */}
    <Row>
      <Column>
        <Paragraph textAlign="center" fontSize="11px" color="#999999">
          Acme Co, 123 Main St, Springfield. Unsubscribe.
        </Paragraph>
      </Column>
    </Row>
  </Email>
);

const GoldenPage = (
  <Page backgroundColor="#ffffff" contentWidth="960px">
    <Row layout={ColumnLayouts.ThreeEqual}>
      <Column>
        <Heading fontSize="18px">Feature One</Heading>
        <Paragraph>Blazing fast performance.</Paragraph>
      </Column>
      <Column>
        <Heading fontSize="18px">Feature Two</Heading>
        <Paragraph>Enterprise-grade security.</Paragraph>
      </Column>
      <Column>
        <Heading fontSize="18px">Feature Three</Heading>
        <Paragraph>24/7 customer support.</Paragraph>
      </Column>
    </Row>
  </Page>
);

// -- Tests --

describe("Golden Template: Marketing Email", () => {
  it("renderToHtml produces valid HTML with all content", () => {
    const html = renderToHtml(GoldenEmail);

    // Structure
    expect(html).toContain('table');
    expect(html).toContain('role="presentation"');

    // Text content from every component type
    expect(html).toContain("Spring Sale");
    expect(html).toContain("Shop Now");
    expect(html).toContain("Fresh styles");
    expect(html).toContain("Classic Tee");
    expect(html).toContain("Slim Jeans");
    expect(html).toContain("SPRING30");
    expect(html).toContain("Acme Co");
    expect(html).toContain("Unsubscribe");

    // Menu items
    expect(html).toContain("Shop");
    expect(html).toContain("About");
    expect(html).toContain("Contact");

    // Image sources
    expect(html).toContain("https://example.com/logo.png");
    expect(html).toContain("https://example.com/hero.jpg");
    expect(html).toContain("https://example.com/product-a.jpg");

    // Button colors
    expect(html).toContain("#e63946");

    // Social links
    expect(html).toContain("facebook.com/acme");
    expect(html).toContain("x.com/acme");
    expect(html).toContain("instagram.com/acme");

    // Email-specific: MSO conditionals
    expect(html).toContain("[if mso]");

    // No React artifacts
    expect(html).not.toContain("data-reactroot");
  });

  it("renderToHtmlParts produces head CSS and body HTML", () => {
    const { head, body } = renderToHtmlParts(GoldenEmail);

    // Head has styles
    expect(head).toContain("<style>");
    expect(head).toContain("</style>");

    // Body has content
    expect(body).toContain("Spring Sale");
    expect(body).toContain("Shop Now");

    // Can assemble a full document
    const doc = `<!DOCTYPE html><html><head><meta charset="utf-8">${head}</head><body>${body}</body></html>`;
    expect(doc).toContain("<!DOCTYPE html>");
    expect(doc).toContain("<head>");
    expect(doc).toContain("<body>");
    expect(doc).toContain("</html>");
  });

  it("renderToPlainText extracts readable text", () => {
    const text = renderToPlainText(GoldenEmail);

    expect(text).toContain("Shop Now");
    expect(text).toContain("Classic Tee");
    expect(text).toContain("SPRING30");
    expect(text).toContain("Unsubscribe");

    // No HTML tags
    expect(text).not.toContain("<table");
    expect(text).not.toContain("<div");
    expect(text).not.toContain("<td");
  });

  it("renderToJson produces valid DesignJSON", () => {
    const json = renderToJson(GoldenEmail);

    // Schema
    expect(json.schemaVersion).toBe(24);
    expect(json.body).toBeDefined();
    expect(json.body.rows.length).toBeGreaterThan(0);
    expect(json.counters).toBeDefined();

    // Count rows (header, nav, hero, divider, 2-col, divider, html, social, footer = 9)
    expect(json.body.rows.length).toBe(9);

    // 2-column row has 2 columns
    const twoColRow = json.body.rows[4]; // product grid row
    expect(twoColRow.columns.length).toBe(2);
    expect(twoColRow.cells).toEqual([1, 1]);

    // Counters track component usage
    expect(json.counters.u_row).toBe(9);
    expect(json.counters.u_column).toBeGreaterThanOrEqual(10); // 9 single + 2 in grid = 11

    // Content types are correct
    const heroCol = json.body.rows[2].columns[0];
    const contentTypes = heroCol.contents.map((c: any) => c.type);
    expect(contentTypes).toEqual(["image", "heading", "text", "button"]);
  });

  it("snapshot locks the full email HTML", () => {
    const html = renderToHtml(GoldenEmail);
    expect(html).toMatchSnapshot();
  });
});

describe("Golden Template: Web Page (3-column)", () => {
  it("renderToHtml produces flexbox layout with 3 columns", () => {
    const html = renderToHtml(GoldenPage);

    expect(html).toContain("Feature One");
    expect(html).toContain("Feature Two");
    expect(html).toContain("Feature Three");
    expect(html).toContain("flex");

    // 3 columns
    expect(html).toContain("u-col-33");

    // No email artifacts
    expect(html).not.toContain("[if mso]");
    expect(html).not.toContain("v:roundrect");
  });

  it("renderToJson produces correct 3-column structure", () => {
    const json = renderToJson(GoldenPage);

    expect(json.body.rows.length).toBe(1);
    const row = json.body.rows[0];
    expect(row.columns.length).toBe(3);
    expect(row.cells).toEqual([1, 1, 1]);

    // Each column has heading + paragraph
    for (const col of row.columns) {
      expect(col.contents.length).toBe(2);
      expect(col.contents[0].type).toBe("heading");
      expect(col.contents[1].type).toBe("text"); // Paragraph → "text"
    }
  });

  it("snapshot locks the full page HTML", () => {
    const html = renderToHtml(GoldenPage);
    expect(html).toMatchSnapshot();
  });
});
