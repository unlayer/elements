import { describe, it, expect } from "vitest";
import React from "react";
import { renderToHtml } from "./render-to-html";
import Body from "../components/Body";
import Row from "../components/Row";
import Column from "../components/Column";
import Paragraph from "../components/Paragraph";
import Button from "../components/Button";
import Heading from "../components/Heading";
import Image from "../components/Image";
import Email from "../components/Email";
import { ColumnLayouts } from "../layouts/ColumnLayouts";

describe("renderToHtml", () => {
  it("generates unique element ids across the whole tree (no duplicates)", () => {
    const html = renderToHtml(
      <Email contentWidth="600px">
        <Row layout={ColumnLayouts.OneColumn}>
          <Column>
            <Heading>A</Heading>
            <Image src="https://x/1.png" />
          </Column>
        </Row>
        <Row layout={ColumnLayouts.OneColumn}>
          <Column>
            <Heading>B</Heading>
            <Image src="https://x/2.png" />
          </Column>
        </Row>
      </Email>
    );
    const ids = [...html.matchAll(/id="(u_[a-z0-9_]+)"/gi)].map((m) => m[1]);
    expect(ids.length).toBeGreaterThan(6);
    expect(new Set(ids).size).toBe(ids.length); // every id is unique
  });

  it("renders a simple element to HTML string", () => {
    const html = renderToHtml(<Button>Click me</Button>);
    expect(typeof html).toBe("string");
    expect(html).toContain("Click me");
  });

  it("returns clean HTML without React hydration markers", () => {
    const html = renderToHtml(<Button>Test</Button>);
    expect(html).not.toContain("data-reactroot");
    expect(html).not.toContain("<!-- -->");
  });

  it("accepts config overrides", () => {
    const html = renderToHtml(<Button>Test</Button>, { mode: "email" });
    expect(typeof html).toBe("string");
    expect(html).toContain("Test");
  });

  it("renders a full Body/Row/Column tree", () => {
    const html = renderToHtml(
      <Body>
        <Row>
          <Column>
            <Paragraph>Hello World</Paragraph>
          </Column>
        </Row>
      </Body>
    );
    expect(html).toContain("Hello World");
  });

  it("works without config parameter", () => {
    const html = renderToHtml(<Paragraph>No config</Paragraph>);
    expect(html).toContain("No config");
  });

  it("throws with helpful message on render failure", () => {
    // A component that throws during render
    const Broken = () => { throw new Error("boom"); };
    expect(() => renderToHtml(<Broken />)).toThrow("[Unlayer] renderToHtml failed: boom");
  });

  it("includes tip in error message", () => {
    const Broken = () => { throw new Error("test"); };
    try {
      renderToHtml(<Broken />);
    } catch (e: any) {
      expect(e.message).toContain("Body > Row > Column > Item");
    }
  });

  it("renders bare Paragraph without Body/Row/Column wrapper", () => {
    const html = renderToHtml(<Paragraph>Bare paragraph</Paragraph>);
    expect(html).toContain("Bare paragraph");
    expect(typeof html).toBe("string");
  });

  it("renders bare Heading without wrapper", () => {
    const html = renderToHtml(<Heading>Bare heading</Heading>);
    expect(html).toContain("Bare heading");
    expect(html).toContain("<h1");
  });

  it("renders bare Image without wrapper", () => {
    const html = renderToHtml(<Image src="https://example.com/img.png" alt="Test" />);
    expect(html).toContain("https://example.com/img.png");
    expect(html).toContain("<img");
  });
});

describe("renderToHtml: full document shell", () => {
  const emailTree = (
    <Email>
      <Row>
        <Column>
          <Paragraph>Hello</Paragraph>
        </Column>
      </Row>
    </Email>
  );

  it("email mode returns a complete XHTML document with MSO support", () => {
    const html = renderToHtml(emailTree);
    expect(html.startsWith('<!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN"')).toBe(true);
    expect(html.trimEnd().endsWith("</html>")).toBe(true);
    expect(html).toContain('xmlns:v="urn:schemas-microsoft-com:vml"');
    expect(html).toContain("<!--[if gte mso 9]>");
    expect(html).toContain('<meta name="x-apple-disable-message-reformatting">');
    expect(html).toContain('<style type="text/css">');
    // Exactly one <body> — the email body exporter's own tag, not doubled by the shell
    expect(html.match(/<body[\s>]/g)).toHaveLength(1);
    // The Body renderer's <div> wrapper must not leak into the document
    expect(html).not.toMatch(/<\/head>\s*<div>/);
  });

  it("web mode returns an HTML5 document with the shell's <body>", () => {
    const html = renderToHtml(
      <Body mode="web">
        <Row>
          <Column>
            <Paragraph>Hello</Paragraph>
          </Column>
        </Row>
      </Body>
    );
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html.trimEnd().endsWith("</html>")).toBe(true);
    expect(html).toContain('<meta charset="utf-8">');
    expect(html.match(/<body[\s>]/g)).toHaveLength(1);
  });

  it("renders the title escaped", () => {
    const html = renderToHtml(emailTree, { title: 'Hi <"world"> & co' });
    expect(html).toContain("<title>Hi &lt;&quot;world&quot;&gt; &amp; co</title>");
  });

  it("renders font links (email wraps them in a !mso conditional)", () => {
    const html = renderToHtml(emailTree, {
      fonts: [{ url: "https://fonts.googleapis.com/css2?family=Inter" }],
    });
    expect(html).toContain(
      '<link href="https://fonts.googleapis.com/css2?family=Inter" rel="stylesheet" type="text/css">'
    );
    expect(html).toContain("<!--[if !mso]><!--><link");
  });

  it("applies textDirection as the html dir attribute", () => {
    const html = renderToHtml(emailTree, { textDirection: "rtl" });
    expect(html).toContain('<html dir="rtl" xmlns=');
  });

  it("every <p> in the document carries the inline margin reset", () => {
    const html = renderToHtml(emailTree);
    const pTags = html.match(/<p[^>]*>/g) ?? [];
    expect(pTags.length).toBeGreaterThan(0);
    for (const tag of pTags) {
      expect(tag).toContain("margin: 0px; margin-block-start: 0px; margin-block-end: 0px;");
    }
  });

  it("document mode returns a print-ready XHTML document", async () => {
    const { default: Document } = await import("../components/Document");
    const html = renderToHtml(
      <Document>
        <Row>
          <Column>
            <Paragraph>Hello</Paragraph>
          </Column>
        </Row>
      </Document>
    );
    expect(html.startsWith('<!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN"')).toBe(true);
    expect(html.trimEnd().endsWith("</html>")).toBe(true);
    expect(html).toContain('<html xmlns="http://www.w3.org/1999/xhtml">');
    // Document mode carries no VML/MSO email plumbing
    expect(html).not.toContain("xmlns:v=");
    expect(html).not.toContain("<!--[if gte mso 9]>");
    // Exactly one <body> — the document body exporter's own tag
    expect(html.match(/<body[\s>]/g)).toHaveLength(1);
    expect(html).not.toMatch(/<\/head>\s*<div>/);
  });

  it("renders an empty tree to a valid document without crashing", () => {
    const html = renderToHtml(<Email />);
    expect(html.startsWith("<!DOCTYPE HTML PUBLIC")).toBe(true);
    expect(html.trimEnd().endsWith("</html>")).toBe(true);
    expect(html.match(/<body[\s>]/g)).toHaveLength(1);
  });

  it("keeps a bare item root's own wrapper div (only Unlayer wrappers get stripped)", () => {
    const html = renderToHtml(<Button className="cta-wrapper">Click</Button>);
    // The Button's host <div class="cta-wrapper"> is the element's own
    // markup, not a Body wrapper — it must survive into the document.
    expect(html).toContain('class="cta-wrapper"');
  });

  it("strips the Body renderer's wrapper even when the root has className/style", () => {
    const html = renderToHtml(
      <Email className="my-email" style={{ outline: "1px solid red" }}>
        <Row>
          <Column>
            <Paragraph>Hello</Paragraph>
          </Column>
        </Row>
      </Email>
    );
    expect(html.startsWith("<!DOCTYPE HTML PUBLIC")).toBe(true);
    expect(html.match(/<body[\s>]/g)).toHaveLength(1);
    expect(html).not.toMatch(/<\/head>\s*<div/);
  });
});

describe("display mode resolution for wrapper components", () => {
  const rows = (
    <Row>
      <Column>
        <Button href="https://example.com">Click</Button>
      </Column>
    </Row>
  );

  it("Email extracts head CSS in email mode (same as Body mode='email')", async () => {
    const { renderToHtmlParts } = await import("./render-to-html");
    const viaEmail = renderToHtmlParts(<Email>{rows}</Email>);
    const viaBody = renderToHtmlParts(<Body mode="email">{rows}</Body>);
    expect(viaEmail.head).toBe(viaBody.head);
  });

  it("Page extracts head CSS in web mode (same as Body mode='web')", async () => {
    const { renderToHtmlParts } = await import("./render-to-html");
    const { default: Page } = await import("../components/Page");
    const viaPage = renderToHtmlParts(<Page>{rows}</Page>);
    const viaBody = renderToHtmlParts(<Body mode="web">{rows}</Body>);
    expect(viaPage.head).toBe(viaBody.head);
  });

  it("Document extracts head CSS in document mode (same as Body mode='document')", async () => {
    const { renderToHtmlParts } = await import("./render-to-html");
    const { default: Document } = await import("../components/Document");
    const viaDocument = renderToHtmlParts(<Document>{rows}</Document>);
    const viaBody = renderToHtmlParts(<Body mode="document">{rows}</Body>);
    expect(viaDocument.head).toBe(viaBody.head);
  });
});

describe("renderToPlainText: unaffected by the document shell", () => {
  it("emits only the content text — no doctype, CSS, or meta noise", async () => {
    const { renderToPlainText } = await import("./render-to-html");
    const text = renderToPlainText(
      <Email>
        <Row>
          <Column>
            <Paragraph>First paragraph</Paragraph>
            <Paragraph>Second paragraph</Paragraph>
          </Column>
        </Row>
      </Email>
    );
    expect(text).toContain("First paragraph");
    expect(text).toContain("Second paragraph");
    expect(text).not.toContain("DOCTYPE");
    expect(text).not.toContain("margin");
    expect(text).not.toContain("{");
  });
});
