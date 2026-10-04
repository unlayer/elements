import { describe, expect, it } from "vitest";
import { compareText } from "../src/verify";

describe("link and image occurrences", () => {
  it("detects a lost occurrence of a repeated URL", () => {
    const original = '<a href="/pay">Pay</a><a href="/pay">Help</a>';
    expect(compareText(original, '<a href="">Pay</a><a href="/pay">Help</a>').missingAttributes).toContain("href /pay");
  });

  it("keeps destinations associated with their link labels", () => {
    const check = compareText('<a href="/pay">Pay</a><a href="/help">Help</a>', '<a href="/help">Pay</a><a href="/pay">Help</a>');
    expect(check.missing).toEqual([]);
    expect(check.missingAttributes.length).toBeGreaterThan(0);
  });

  it("keeps image sources associated with their alt text", () => {
    const check = compareText('<img src="/a.png" alt="A"><img src="/b.png" alt="B">', '<img src="/b.png" alt="A"><img src="/a.png" alt="B">');
    expect(check.missingAttributes.length).toBeGreaterThan(0);
  });

  it("ignores MSO-only duplicate links and normalizes inline text", () => {
    const check = compareText('<a href="/pay">Pay now</a>', '<!--[if mso]><a href="/pay">Pay now</a><![endif]--><a href="/pay"><span>Pay</span> now</a>');
    expect(check.missingAttributes).toEqual([]);
  });
});
