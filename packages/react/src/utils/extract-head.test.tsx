import React from "react";
import { describe, it, expect } from "vitest";
import { renderToHtmlParts, renderToHtml } from "./render-to-html";
import Email from "../components/Email";
import Page from "../components/Page";
import Row from "../components/Row";
import Column from "../components/Column";
import Button from "../components/Button";
import Heading from "../components/Heading";
import Paragraph from "../components/Paragraph";
import Divider from "../components/Divider";
import Document from "../components/Document";

describe("renderToHtmlParts", () => {
  it("returns head and body as separate strings", () => {
    const { head, body } = renderToHtmlParts(
      <Email>
        <Row>
          <Column>
            <Paragraph text="Hello" />
          </Column>
        </Row>
      </Email>
    );

    expect(typeof head).toBe("string");
    expect(typeof body).toBe("string");
    expect(body.length).toBeGreaterThan(0);
  });

  it("head contains <style> tag with CSS from body head", () => {
    const { head } = renderToHtmlParts(
      <Email backgroundColor="#ffffff" textColor="#333333">
        <Row>
          <Column>
            <Paragraph text="Hello" />
          </Column>
        </Row>
      </Email>
    );

    expect(head).toContain("<style>");
    expect(head).toContain("</style>");
  });

  it("head contains button hover CSS when Button is used", () => {
    const { head } = renderToHtmlParts(
      <Email>
        <Row>
          <Column>
            <Button
              text="Click Me"
              backgroundColor="#3b82f6"
              color="#ffffff"
            />
          </Column>
        </Row>
      </Email>
    );

    // Button head generates hover CSS
    expect(head).toContain("<style>");
    // The button head CSS should include hover-related styles
    expect(head.length).toBeGreaterThan(50);
  });

  it("renderToHtml wraps the same body markup in a full document", () => {
    const element = (
      <Email>
        <Row>
          <Column>
            <Heading text="Test" headingType="h1" />
          </Column>
        </Row>
      </Email>
    );

    const fullDocument = renderToHtml(element);
    const { body } = renderToHtmlParts(element);

    // parts.body is the embeddable fragment (wrapped in the Body renderer's
    // <div>); the full document contains the same markup inside its shell.
    const innerBody = body.replace(/^\s*<div[^>]*>/, "").replace(/<\/div>\s*$/, "");
    expect(fullDocument).toContain(innerBody);
    expect(fullDocument.startsWith("<!DOCTYPE HTML PUBLIC")).toBe(true);
    expect(fullDocument.trimEnd().endsWith("</html>")).toBe(true);
  });

  it("exposes granular css/js/tags alongside the assembled head", () => {
    const parts = renderToHtmlParts(
      <Email>
        <Row>
          <Column>
            <Heading text="Test" headingType="h1" />
          </Column>
        </Row>
      </Email>
    );
    // granular css is the raw stylesheet — no <style> wrapper
    expect(parts.css.length).toBeGreaterThan(0);
    expect(parts.css).not.toContain("<style>");
    expect(Array.isArray(parts.tags)).toBe(true);
    expect(typeof parts.js).toBe("string");
    // the assembled head is exactly the granular pieces composed
    const composed = [
      parts.css && `<style>${parts.css}</style>`,
      parts.js && `<script>${parts.js}</script>`,
      ...parts.tags,
    ]
      .filter(Boolean)
      .join("\n");
    expect(parts.head).toBe(composed);
  });

  it("parts stay embeddable fragments — no document shell leaks in", () => {
    const { head, body } = renderToHtmlParts(
      <Email>
        <Row>
          <Column>
            <Heading text="Test" headingType="h1" />
          </Column>
        </Row>
      </Email>
    );
    for (const chunk of [head, body]) {
      expect(chunk).not.toContain("<!DOCTYPE");
      expect(chunk).not.toContain("<!doctype");
      expect(chunk).not.toContain("<html");
      expect(chunk).not.toContain("</html>");
      expect(chunk).not.toContain("<head>");
    }
  });

  it("works with web mode (Page)", () => {
    const { head, body } = renderToHtmlParts(
      <Page>
        <Row>
          <Column>
            <Divider />
          </Column>
        </Row>
      </Page>
    );

    expect(typeof head).toBe("string");
    expect(body.length).toBeGreaterThan(0);
  });

  it("respects mode from config parameter", () => {
    const { head: emailHead } = renderToHtmlParts(
      <Email>
        <Row>
          <Column>
            <Button text="Test" />
          </Column>
        </Row>
      </Email>,
      { mode: "email" }
    );

    const { head: webHead } = renderToHtmlParts(
      <Page>
        <Row>
          <Column>
            <Button text="Test" />
          </Column>
        </Row>
      </Page>,
      { mode: "web" }
    );

    // Both should produce head content, but may differ
    expect(typeof emailHead).toBe("string");
    expect(typeof webHead).toBe("string");
  });

  it("handles tree with no head-generating components gracefully", () => {
    const { head, body } = renderToHtmlParts(
      <Email>
        <Row>
          <Column>
            <Divider />
          </Column>
        </Row>
      </Email>
    );

    // Divider has no head, but Body/Row/Column do
    expect(typeof head).toBe("string");
    expect(body.length).toBeGreaterThan(0);
  });
});

describe("the body's link style", () => {
  // Its head CSS is for the body's element (`#u_body_1 a`, the id its HTML has), as the editor's is for its body's
  // (`#u_body a`): the links in it take the color. (It was for `#u_content_body_1`, which nothing has.)
  it.each([["Email", Email], ["Page", Page], ["Document", Document]] as const)("%s: colors the links in the HTML", (_, Root) => {
    const html = renderToHtml(
      <Root linkStyle={{ linkColor: "#ff0000", linkUnderline: false }}>
        <Row>
          <Column>
            <Paragraph html={'Read <a href="https://example.com">the guide</a>'} />
          </Column>
        </Row>
      </Root>
    );
    const id = /<[a-z]+ [^>]*id="(u_body[^"]*)"/.exec(html)![1];
    expect(html).toMatch(new RegExp(`#${id} a \\{\\s*color: #ff0000;\\s*text-decoration: none;`));
    // As a browser shows it.
    const before = document.documentElement.innerHTML;
    try {
      document.documentElement.innerHTML = html.replace(/^<!doctype html>/i, "").replace(/<\/?html[^>]*>/g, "");
      const link = document.querySelector('a[href="https://example.com"]')!;
      expect(getComputedStyle(link).color).toBe("rgb(255, 0, 0)");
      expect(getComputedStyle(link).textDecoration).toBe("none");
    } finally {
      document.documentElement.innerHTML = before;
    }
  });
});

describe("the head, made in the same render as the HTML", () => {
  it("maps no Row, Column or block again: it takes the values their HTML mapped, and writes the same CSS", () => {
    const config = (Paragraph as unknown as Record<string, { propMapper: (props: object) => object }>).__unlayerItemConfig;
    const own = config.propMapper;
    let calls = 0;
    config.propMapper = (props) => (calls++, own(props));
    try {
      const template = (
        <Email>
          <Row padding="0 4px" mobile={{ padding: "2px" }}>
            <Column padding={8} mobile={{ padding: 3 }}>
              <Paragraph linkStyle={{ inherit: false, linkColor: "#ff0000" }} mobile={{ fontSize: "12px" }}>
                Hello
              </Paragraph>
            </Column>
          </Row>
        </Email>
      );
      const { css } = renderToHtmlParts(template);
      expect(calls).toBe(0);
      // (The CSS the head would write mapping them itself.)
      expect(css).toMatch(/#u_content_paragraph_1 a\b[^}]*color: #ff0000/);
      expect(css).toContain("#u_content_paragraph_1 .v-font-size { font-size: 12px !important; }");
      expect(css).toContain("#u_row_1.v-row-padding { padding: 2px !important; }");
      expect(css).toContain("#u_column_1 .v-col-padding { padding: 3px !important; }");
    } finally {
      config.propMapper = own;
    }
  });
});
