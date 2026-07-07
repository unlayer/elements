/**
 * Injection/escaping contract tests.
 *
 * Plain-text API surfaces (children, the flat `text` prop, shorthand item
 * arrays, previewText, string href/url values) must be HTML-escaped in the
 * output; the documented raw-HTML surfaces (<Html>, the `html` prop, the
 * `values` escape hatch) must stay raw.
 */
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToHtml } from "./utils/render-to-html";
import Email from "./components/Email";
import Row from "./components/Row";
import Column from "./components/Column";
import Button from "./components/Button";
import Heading from "./components/Heading";
import Paragraph from "./components/Paragraph";
import Menu from "./components/Menu";
import Table from "./components/Table";
import Social from "./components/Social";
import Html from "./components/Html";

const inEmail = (...children: React.ReactNode[]) =>
  renderToHtml(
    <Email>
      <Row>
        <Column>{children}</Column>
      </Row>
    </Email>
  );

const HOSTILE_TEXT = 'Save <50% & more!"><img src=x onerror=alert(1)>';

describe("escaping: plain-text surfaces", () => {
  it("previewText is escaped", () => {
    const html = renderToHtml(
      <Email previewText={HOSTILE_TEXT}>
        <Row>
          <Column>
            <Paragraph>hi</Paragraph>
          </Column>
        </Row>
      </Email>
    );
    expect(html).not.toContain("<img src=x onerror");
    expect(html).toContain("Save &lt;50% &amp; more!");
  });

  it("Heading children are escaped", () => {
    const html = inEmail(<Heading>{`Tom & Jerry <script>alert(1)</script>`}</Heading>);
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("Tom &amp; Jerry &lt;script&gt;");
  });

  it("Button children and flat text prop are escaped", () => {
    const fromChildren = inEmail(<Button>{`a < b & "c"`}</Button>);
    expect(fromChildren).toContain("a &lt; b &amp; &quot;c&quot;");

    const fromTextProp = inEmail(<Button text={"<b>bold?</b>"} href="https://x.com" />);
    expect(fromTextProp).not.toContain("<b>bold?</b>");
    expect(fromTextProp).toContain("&lt;b&gt;bold?&lt;/b&gt;");
  });

  it("Paragraph children are escaped (Lexical path)", () => {
    const html = inEmail(<Paragraph>{`<script>alert(1)</script>`}</Paragraph>);
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("Menu shorthand item text is escaped", () => {
    const html = inEmail(
      <Menu items={[{ text: "<script>x</script>", href: "https://a.com" }]} />
    );
    expect(html).not.toContain("<script>x</script>");
    expect(html).toContain("&lt;script&gt;x&lt;/script&gt;");
  });

  it("Table shorthand headers and data cells are escaped", () => {
    const html = inEmail(
      <Table headers={["Name <th>"]} data={[["<script>cell</script>"]]} />
    );
    expect(html).not.toContain("<script>cell</script>");
    expect(html).toContain("&lt;script&gt;cell&lt;/script&gt;");
    expect(html).toContain("Name &lt;th&gt;");
  });

  it("string children of Row and Column are escaped", () => {
    const html = renderToHtml(
      <Email>
        <Row>
          {"<b onclick=x>row-raw</b>" as unknown as React.ReactElement}
          <Column>{"<b onclick=x>col-raw</b>"}</Column>
        </Row>
      </Email>
    );
    expect(html).not.toContain("<b onclick=x>");
    expect(html).toContain("&lt;b onclick=x&gt;row-raw&lt;/b&gt;");
    expect(html).toContain("&lt;b onclick=x&gt;col-raw&lt;/b&gt;");
  });
});

describe("escaping: URLs", () => {
  it("Button href cannot break out of the attribute", () => {
    const html = inEmail(
      <Button href={'https://x.com" onmouseover="alert(1)'}>Click</Button>
    );
    expect(html).not.toMatch(/onmouseover="alert\(1\)"/);
    expect(html).toContain("https://x.com&quot;");
  });

  it("javascript: URLs are blocked", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const html = inEmail(<Button href={"javascript:alert(1)"}>Click</Button>);
    expect(html).not.toContain("javascript:alert(1)");
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("unsafe"));
    warn.mockRestore();
  });

  it("Menu item href cannot break out of the attribute", () => {
    const html = inEmail(
      <Menu items={[{ text: "Home", href: 'https://x.com" onmouseover="alert(1)' }]} />
    );
    expect(html).not.toMatch(/onmouseover="alert\(1\)"/);
  });

  it("Social icon url cannot break out of the attribute", () => {
    const html = inEmail(
      <Social icons={[{ name: "Facebook", url: 'https://x.com" onmouseover="alert(1)' }]} />
    );
    expect(html).not.toMatch(/onmouseover="alert\(1\)"/);
  });

  it("ordinary URLs with query params still work", () => {
    const html = inEmail(<Button href="https://x.com/?a=1&b=2">Go</Button>);
    // & in an attribute is correctly HTML-encoded and decodes back to the same URL
    expect(html).toContain("https://x.com/?a=1&amp;b=2");
  });
});

describe("escaping: raw-HTML surfaces stay raw", () => {
  it("<Html> string children render verbatim", () => {
    const html = inEmail(<Html>{"<em>raw html</em>"}</Html>);
    expect(html).toContain("<em>raw html</em>");
  });

  it("the html prop renders rich text (Paragraph)", () => {
    const html = inEmail(<Paragraph html={'Hello <b>bold</b>'} />);
    expect(html).toContain("<b>bold</b>");
  });

  it("the values escape hatch stays raw (Button values.text)", () => {
    const html = inEmail(<Button values={{ text: "<b>rich</b>" }} href="https://x.com" />);
    expect(html).toContain("<b>rich</b>");
  });
});
