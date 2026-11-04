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
  renderToHtmlParts,
  renderToPlainText,
  renderToJson,
  Email,
  Page,
  Document,
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

/** What a reader gets from the markup: its words, links and images, in order. */
function drawn(html: string) {
  const page = new DOMParser().parseFromString(html, "text/html");
  const all = <E extends Element>(selector: string) => Array.from(page.querySelectorAll<E>(selector));
  return {
    page,
    words: page.body.textContent!.replace(/\s+/g, " "),
    links: all("a").map((a) => a.getAttribute("href")),
    images: all("img").map((img) => [img.getAttribute("src"), img.getAttribute("alt")]),
    all,
  };
}

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
    const { words, links, images, all } = drawn(html);

    // Structure
    expect(all('table[role="presentation"]').length).toBeGreaterThan(0);

    // Text content from every component type, in the order of the template
    const order = [
      "Shop",
      "About",
      "Contact",
      "Spring Sale — 30% Off",
      "Fresh styles for the new season.",
      "Shop Now",
      "Classic Tee — $29.99",
      "Slim Jeans — $49.99",
      "Use code SPRING30 at checkout",
      "Acme Co, 123 Main St",
      "Unsubscribe.",
    ];
    const places = order.map((text) => words.indexOf(text));
    expect(places).not.toContain(-1);
    expect(places).toEqual([...places].sort((a, b) => a - b));

    // Images, each with its alternate text
    expect(images).toEqual(
      expect.arrayContaining([
        ["https://example.com/logo.png", "Acme Co"],
        ["https://example.com/hero.jpg", "Spring Collection"],
        ["https://example.com/product-a.jpg", "Product A"],
        ["https://example.com/product-b.jpg", "Product B"],
      ])
    );

    // Menu items and social links
    expect(links).toEqual(
      expect.arrayContaining([
        "/shop",
        "/about",
        "/contact",
        "https://facebook.com/acme",
        "https://x.com/acme",
        "https://instagram.com/acme",
      ])
    );

    // Colors: the template's background, the rows' and each Button's, on cells for Outlook
    expect(all('[bgcolor="#f4f4f5"]').length).toBeGreaterThan(0);
    const link = (href: string) => all(`a[href="${href}"]`)[0]!;
    expect(link("/contact").closest('[bgcolor="#1a1a2e"]')).not.toBeNull();
    expect(link("https://x.com/acme").closest('[bgcolor="#1a1a2e"]')).not.toBeNull();
    expect(all('td[bgcolor="#e63946"] a')[0]?.textContent).toBe("Shop Now");
    expect(all("a").filter((a) => a.textContent === "Buy").map((a) => a.closest("td")!.getAttribute("bgcolor"))).toEqual(["#1a1a2e", "#1a1a2e"]);

    // The inbox's preview line is there, hidden
    const preview = all<HTMLElement>('[data-skip-in-text="true"]');
    expect(preview[0]?.textContent).toContain("Spring sale — 30% off everything");
    expect(preview[0]?.style.display).toBe("none");

    // Email-specific: MSO conditionals, at the template's content width
    expect(html).toMatch(/\[if mso\].*<td width="600" valign="top"/);
    expect(html).toContain("max-width:600px");

    // No React artifacts
    expect(html).not.toContain("data-reactroot");
  });

  it("draws the product row's two columns side by side, each half of the content width", () => {
    const { all } = drawn(renderToHtml(GoldenEmail));
    const column = (word: string) => all<HTMLElement>("p").find((p) => p.textContent!.includes(word))!.closest<HTMLElement>('div[style*="inline-block"]')!;
    expect(column("Classic Tee").style.maxWidth).toBe("300px");
    expect(column("Slim Jeans").style.maxWidth).toBe("300px");
    expect(column("Classic Tee")).not.toBe(column("Slim Jeans"));
    expect(column("Classic Tee").querySelector("img")?.getAttribute("alt")).toBe("Product A");
    expect(column("Slim Jeans").querySelector("img")?.getAttribute("alt")).toBe("Product B");
  });

  it("renderToHtmlParts produces head CSS and body HTML", () => {
    const { head, body } = renderToHtmlParts(GoldenEmail);

    // Head has styles, and none of the content
    expect(head).toMatch(/^<style>[\s\S]*@media[\s\S]*<\/style>$/);
    expect(head).not.toContain("Spring Sale");

    // Body has content, and none of the styles
    expect(body).toContain("Spring Sale");
    expect(body).toContain("Shop Now");
    expect(body).not.toContain("<style>");
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
    expect(json.schemaVersion).toBe(27);
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
    expect(json.counters.u_column).toBe(10); // 8 single + 2 in grid

    // Content types are correct
    const heroCol = json.body.rows[2].columns[0];
    const contentTypes = heroCol.contents.map((c: any) => c.type);
    expect(contentTypes).toEqual(["image", "heading", "text", "button"]);
  });

});

describe("Golden Template: Web Page (3-column)", () => {
  it("renderToHtml produces flexbox layout with 3 columns", () => {
    const html = renderToHtml(GoldenPage);
    const { all, page } = drawn(html);

    // 3 columns, each a third of the content width, with its heading and words
    const columns = all<HTMLElement>("h1").map((heading) => heading.parentElement!);
    expect(columns.map((column) => column.style.flex)).toEqual(["0 1 33.3333%", "0 1 33.3333%", "0 1 33.3333%"]);
    expect(columns.map((column) => column.textContent)).toEqual([
      "Feature OneBlazing fast performance.",
      "Feature TwoEnterprise-grade security.",
      "Feature Three24/7 customer support.",
    ]);
    expect(html).toContain("max-width:960px");

    // The page's own background, on its <body>
    expect(page.body.style.backgroundColor).toBe("rgb(255, 255, 255)");

    // No email artifacts
    expect(html).not.toContain("[if mso]");
    expect(all('table[role="presentation"]')).toHaveLength(0);
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

});

describe("Golden Template: Print Document", () => {
  const GoldenDocument = (
    <Document>
      <Row>
        <Column>
          <Heading headingType="h1">Quarterly Report</Heading>
          <Paragraph>Revenue grew 14% quarter over quarter.</Paragraph>
          <Divider />
          <Paragraph>Operating costs remained flat.</Paragraph>
        </Column>
      </Row>
    </Document>
  );

  it("renderToHtml produces a print-ready document with all content", () => {
    const html = renderToHtml(GoldenDocument, { title: "Q3 Report" });
    const { all, page } = drawn(html);
    expect(page.title).toBe("Q3 Report");
    expect(all("h1")[0]?.textContent).toBe("Quarterly Report");
    expect(all("p").map((p) => p.textContent)).toEqual(["Revenue grew 14% quarter over quarter.", "Operating costs remained flat."]);
    expect(all('[aria-label="divider"]')).toHaveLength(1);
    // Backgrounds print, or a PDF loses them
    expect(html).toContain("print-color-adjust: exact");
  });
});
