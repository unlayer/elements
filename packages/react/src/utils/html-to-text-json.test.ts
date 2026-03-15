import { describe, it, expect } from "vitest";
import { htmlToTextJson, generateHtmlFromTextJson } from "@unlayer-internal/shared-elements";

describe("htmlToTextJson", () => {
  it("returns empty Lexical JSON for empty input", () => {
    const parsed = JSON.parse(htmlToTextJson(""));
    expect(parsed.root.children).toHaveLength(1);
    expect(parsed.root.children[0].type).toBe("extended-paragraph");
  });

  it("wraps HTML in passthrough JSON", () => {
    const json = htmlToTextJson("Hello <b>bold</b>");
    const parsed = JSON.parse(json);
    expect(parsed.__html).toBe("Hello <b>bold</b>");
  });

  it("wraps plain text in passthrough JSON", () => {
    const json = htmlToTextJson("Hello world");
    const parsed = JSON.parse(json);
    expect(parsed.__html).toBe("Hello world");
  });

  it("preserves links in passthrough", () => {
    const html = 'Click <a href="https://example.com">here</a>';
    const json = htmlToTextJson(html);
    const parsed = JSON.parse(json);
    expect(parsed.__html).toBe(html);
  });
});

describe("generateHtmlFromTextJson with HTML passthrough", () => {
  it("returns HTML directly from passthrough JSON", () => {
    const json = htmlToTextJson("Hello <b>bold</b> world");
    const html = generateHtmlFromTextJson(json);
    expect(html).toBe("Hello <b>bold</b> world");
  });

  it("preserves bold formatting", () => {
    const html = generateHtmlFromTextJson(htmlToTextJson("Hello <b>bold</b>"));
    expect(html).toContain("<b>");
    expect(html).toContain("bold");
  });

  it("preserves italic formatting", () => {
    const html = generateHtmlFromTextJson(htmlToTextJson("Hello <i>italic</i>"));
    expect(html).toContain("<i>");
    expect(html).toContain("italic");
  });

  it("preserves underline formatting", () => {
    const html = generateHtmlFromTextJson(htmlToTextJson("Hello <u>underlined</u>"));
    expect(html).toContain("<u>");
    expect(html).toContain("underlined");
  });

  it("preserves links", () => {
    const html = generateHtmlFromTextJson(
      htmlToTextJson('Click <a href="https://example.com">here</a>')
    );
    expect(html).toContain("https://example.com");
    expect(html).toContain("here");
  });

  it("preserves mixed formatting", () => {
    const html = generateHtmlFromTextJson(
      htmlToTextJson('Hello <b>bold</b> and <i>italic</i> and <a href="#">link</a>')
    );
    expect(html).toContain("<b>");
    expect(html).toContain("<i>");
    expect(html).toContain("href");
  });

  it("still handles regular Lexical JSON", () => {
    // textToTextJson produces real Lexical JSON (not passthrough)
    // generateHtmlFromTextJson should still handle it via the Lexical path
    const { textToTextJson } = require("@unlayer-internal/shared-elements");
    const json = textToTextJson("Regular text");
    const html = generateHtmlFromTextJson(json);
    expect(html).toContain("Regular text");
  });

  it("returns empty string for empty input", () => {
    expect(generateHtmlFromTextJson("")).toBe("");
  });
});
