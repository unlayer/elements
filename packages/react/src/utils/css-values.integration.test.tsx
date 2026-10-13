import React from "react";
import { describe, expect, it } from "vitest";
import { Button, Column, Email, Heading, Html, Paragraph, Row, renderToHtml, renderToJson } from "../index";

describe("CSS normalization preserves rendered content", () => {
  for (const [name, content] of [
    ["Heading", <Heading>rgb(1 2 3)</Heading>],
    ["Button", <Button>rgba(1, 2, 3, 1)</Button>],
    ["Html", <Html html="rgb(1, 2, 3)" />],
    ["Paragraph", <Paragraph>rgb(1, 2, 3)</Paragraph>],
  ] as const) {
    it(`keeps the literal text in ${name} HTML and design JSON`, () => {
      const element = <Email><Row><Column>{content}</Column></Row></Email>;
      const document = new DOMParser().parseFromString(renderToHtml(element), "text/html");
      document.querySelectorAll("style").forEach((style) => style.remove());
      expect(document.body.textContent?.trim()).toMatch(/^rgba?\(/);
      const values = renderToJson(element).body.rows[0].columns[0].contents[0].values as Record<string, unknown>;
      expect(values[name === "Html" ? "html" : "text"]).toMatch(/^rgba?\(/);
    });
  }

  it("still normalizes a real color while preserving the text", () => {
    const element = <Email><Row><Column><Paragraph color="rgb(1, 2, 3)">rgb(1, 2, 3)</Paragraph></Column></Row></Email>;
    const values = renderToJson(element).body.rows[0].columns[0].contents[0].values as Record<string, unknown>;
    expect(values.color).toBe("#010203");
    expect(values.text).toBe("rgb(1, 2, 3)");
  });
});
