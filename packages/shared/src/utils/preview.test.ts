import { describe, it, expect } from "vitest";
import { generatePreviewHtml } from "./preview";

describe("generatePreviewHtml", () => {
  it("returns empty string for empty/whitespace input", () => {
    expect(generatePreviewHtml("")).toBe("");
    expect(generatePreviewHtml("   ")).toBe("");
  });

  it("generates hidden div with preview text", () => {
    const html = generatePreviewHtml("Hello World");
    expect(html).toContain("Hello World");
    expect(html).toContain('data-skip-in-text="true"');
    expect(html).toContain("display:none");
    expect(html).toContain("max-height:0px");
    expect(html).toContain("overflow:hidden");
  });

  it("truncates text longer than 150 characters", () => {
    const longText = "A".repeat(200);
    const html = generatePreviewHtml(longText);
    // Should contain exactly 150 'A's followed by padding
    expect(html).toContain("A".repeat(150));
    expect(html).not.toContain("A".repeat(151));
  });

  it("pads short text with invisible characters", () => {
    const html = generatePreviewHtml("Hi");
    // "Hi" is 2 chars, so 148 padding chars should be added
    // The padding chars are Unicode invisible chars
    expect(html.length).toBeGreaterThan("Hi".length + 100);
  });

  it("does not pad text that is exactly 150 characters", () => {
    const text = "A".repeat(150);
    const html = generatePreviewHtml(text);
    // Extract content between > and </div>
    const match = html.match(/>([^<]*)<\/div>/);
    expect(match).toBeTruthy();
    expect(match![1]).toBe(text);
  });

  it("wraps output in a div element", () => {
    const html = generatePreviewHtml("Test");
    expect(html).toMatch(/^<div[^>]*>.*<\/div>$/);
  });
});
