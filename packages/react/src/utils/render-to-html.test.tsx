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
