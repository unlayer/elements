import { describe, it, expect } from "vitest";
import { htmlToPlainText } from "./html-to-text";

describe("htmlToPlainText", () => {
  it("returns empty string for empty input", () => {
    expect(htmlToPlainText("")).toBe("");
    expect(htmlToPlainText(undefined as any)).toBe("");
  });

  it("returns plain text unchanged", () => {
    expect(htmlToPlainText("Hello World")).toBe("Hello World");
  });

  // Headings
  it("converts h1/h2 to uppercase", () => {
    expect(htmlToPlainText("<h1>Welcome</h1>")).toBe("WELCOME");
    expect(htmlToPlainText("<h2>Features</h2>")).toBe("FEATURES");
  });

  it("converts h3-h6 as-is (not uppercased)", () => {
    expect(htmlToPlainText("<h3>Details</h3>")).toBe("Details");
    expect(htmlToPlainText("<h6>Fine Print</h6>")).toBe("Fine Print");
  });

  // Links
  it("converts links to text (url) format", () => {
    const html = '<a href="https://example.com">Click here</a>';
    expect(htmlToPlainText(html)).toBe("Click here (https://example.com)");
  });

  it("avoids duplicate URL when link text equals href", () => {
    const html = '<a href="https://example.com">https://example.com</a>';
    expect(htmlToPlainText(html)).toBe("https://example.com");
  });

  // Line breaks
  it("converts <br> to newlines", () => {
    expect(htmlToPlainText("Line 1<br>Line 2")).toBe("Line 1\nLine 2");
    expect(htmlToPlainText("Line 1<br/>Line 2")).toBe("Line 1\nLine 2");
    expect(htmlToPlainText("Line 1<br />Line 2")).toBe("Line 1\nLine 2");
  });

  // Block elements
  it("converts closing block tags to newlines", () => {
    expect(htmlToPlainText("<p>Paragraph 1</p><p>Paragraph 2</p>")).toBe("Paragraph 1\nParagraph 2");
  });

  // Lists
  it("converts list items to dashes", () => {
    const html = "<ul><li>First</li><li>Second</li><li>Third</li></ul>";
    expect(htmlToPlainText(html)).toBe("- First\n- Second\n- Third");
  });

  // Horizontal rules
  it("converts <hr> to dashes", () => {
    expect(htmlToPlainText("Above<hr>Below")).toBe("Above\n---\nBelow");
  });

  // Images
  it("converts images with alt text to [alt]", () => {
    expect(htmlToPlainText('<img alt="Logo" src="logo.png">')).toBe("[Logo]");
  });

  it("removes images without alt text", () => {
    expect(htmlToPlainText('<img src="logo.png">')).toBe("");
  });

  // Entities
  it("decodes named HTML entities", () => {
    expect(htmlToPlainText("&amp; &lt; &gt; &quot;")).toBe('& < > "');
    expect(htmlToPlainText("&nbsp;")).toBe("");
    expect(htmlToPlainText("&copy; 2026")).toBe("\u00A9 2026");
  });

  it("decodes numeric HTML entities", () => {
    expect(htmlToPlainText("&#169;")).toBe("\u00A9"); // ©
    expect(htmlToPlainText("&#x00A9;")).toBe("\u00A9"); // ©
  });

  // Skip elements
  it("skips elements with data-skip-in-text attribute", () => {
    const html = '<div data-skip-in-text="true">hidden preview</div><p>Visible content</p>';
    expect(htmlToPlainText(html)).toBe("Visible content");
  });

  // Style/script/head removal
  it("removes style, script, and head blocks", () => {
    const html = "<style>.foo { color: red; }</style><script>alert(1)</script><p>Content</p>";
    expect(htmlToPlainText(html)).toBe("Content");
  });

  // Whitespace collapsing
  it("collapses multiple blank lines to max 2", () => {
    const html = "<p>One</p><p></p><p></p><p></p><p>Two</p>";
    const text = htmlToPlainText(html);
    expect(text).not.toContain("\n\n\n");
  });

  it("trims leading and trailing whitespace", () => {
    const html = "  <p>Hello</p>  ";
    expect(htmlToPlainText(html)).toBe("Hello");
  });

  // Complex example
  it("handles a realistic email fragment", () => {
    const html = `
      <div data-skip-in-text="true">Preview text here</div>
      <h1>Order Confirmed</h1>
      <p>Thank you for your purchase.</p>
      <a href="https://store.com/track">Track your order</a>
      <hr>
      <p>Store Inc &copy; 2026</p>
    `;
    const text = htmlToPlainText(html);
    expect(text).toContain("ORDER CONFIRMED");
    expect(text).toContain("Thank you for your purchase.");
    expect(text).toContain("Track your order (https://store.com/track)");
    expect(text).toContain("---");
    expect(text).toContain("\u00A9 2026");
    expect(text).not.toContain("Preview text here");
  });
});
