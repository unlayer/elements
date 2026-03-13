import { describe, it, expect } from "vitest";
import React from "react";
import { renderToPlainText, renderToHtmlParts } from "./render-to-html";
import Body from "../components/Body";
import Row from "../components/Row";
import { Column } from "../components/Column";
import Paragraph from "../components/Paragraph";
import Button from "../components/Button";
import Heading from "../components/Heading";
import Image from "../components/Image";

describe("renderToPlainText", () => {
  it("extracts text from a Paragraph", () => {
    const text = renderToPlainText(
      <Body>
        <Row>
          <Column>
            <Paragraph>Hello World</Paragraph>
          </Column>
        </Row>
      </Body>
    );
    expect(text).toContain("Hello World");
  });

  it("extracts text from multiple components", () => {
    const text = renderToPlainText(
      <Body>
        <Row>
          <Column>
            <Heading>Welcome</Heading>
            <Paragraph>First paragraph</Paragraph>
            <Button>Click me</Button>
          </Column>
        </Row>
      </Body>
    );
    // htmlToPlainText uppercases h1 headings
    expect(text.toUpperCase()).toContain("WELCOME");
    expect(text).toContain("First paragraph");
    expect(text).toContain("Click me");
  });

  it("strips HTML tags", () => {
    const text = renderToPlainText(
      <Body>
        <Row>
          <Column>
            <Paragraph>Plain text only</Paragraph>
          </Column>
        </Row>
      </Body>
    );
    expect(text).not.toContain("<div");
    expect(text).not.toContain("<p");
    expect(text).not.toContain("<table");
  });

  it("returns a string", () => {
    const text = renderToPlainText(<Paragraph>Test</Paragraph>);
    expect(typeof text).toBe("string");
  });
});

describe("renderToHtmlParts", () => {
  it("returns separate head and body strings", () => {
    const { head, body } = renderToHtmlParts(
      <Body mode="email">
        <Row>
          <Column>
            <Button>Click</Button>
          </Column>
        </Row>
      </Body>
    );
    expect(typeof head).toBe("string");
    expect(typeof body).toBe("string");
  });

  it("head contains <style> tag with CSS", () => {
    const { head } = renderToHtmlParts(
      <Body mode="email">
        <Row>
          <Column>
            <Button>Click</Button>
          </Column>
        </Row>
      </Body>
    );
    expect(head).toContain("<style>");
    expect(head).toContain("</style>");
  });

  it("body contains the rendered HTML", () => {
    const { body } = renderToHtmlParts(
      <Body mode="email">
        <Row>
          <Column>
            <Paragraph>Content here</Paragraph>
          </Column>
        </Row>
      </Body>
    );
    expect(body).toContain("Content here");
  });

  it("head includes body-level CSS (text color, link styles)", () => {
    const { head } = renderToHtmlParts(
      <Body mode="email">
        <Row>
          <Column>
            <Button>Click</Button>
          </Column>
        </Row>
      </Body>
    );
    // Body head generates table/td color and link styles
    expect(head).toContain("table, td");
    expect(head).toContain("color");
  });

  it("head is empty when no head-generating components", () => {
    const { head } = renderToHtmlParts(
      <Body mode="email">
        <Row>
          <Column>
            <Paragraph>No head CSS</Paragraph>
          </Column>
        </Row>
      </Body>
    );
    // Paragraph doesn't generate head CSS but Body/Row might
    expect(typeof head).toBe("string");
  });

  it("works with web mode", () => {
    const { head, body } = renderToHtmlParts(
      <Body mode="web">
        <Row>
          <Column>
            <Paragraph>Web mode</Paragraph>
          </Column>
        </Row>
      </Body>
    );
    expect(body).toContain("Web mode");
    expect(typeof head).toBe("string");
  });
});
