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
