import { describe, expect, it } from "vitest";
import { compareText } from "../src/verify";

describe("link and image occurrences", () => {
  it("detects reordered values even when the conversion adds words", () => {
    const check = compareText('<p>Subtotal $10</p><p>Total $12</p>', '<p>Subtotal $12</p><p>Total $10</p><p>Thanks</p>');
    expect(check.missing.length).toBeGreaterThan(0);
  });

  it("allows additional words when the original order is preserved", () => {
    const check = compareText('<p>Subtotal $10</p><p>Total $12</p>', '<p>Subtotal $10</p><p>Thanks</p><p>Total $12</p>');
    expect(check.missing).toEqual([]);
    expect(check.added).toEqual(["Thanks"]);
  });
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

describe("strict content check", () => {
  it("compares letter case as written", () => {
    expect(compareText("<p>Use coupon SAVE10</p>", "<p>Use coupon save10</p>").missing).toEqual(["SAVE10"]);
  });

  it("keeps a lone minus sign, however it's written", () => {
    expect(compareText("<p>Balance &minus; 100 USD</p>", "<p>Balance 100 USD</p>").missing).toEqual(["−"]);
    expect(compareText("<p>Balance &minus; 100 USD</p>", "<p>Balance - 100 USD</p>").missing).toEqual([]);
  });

  it("finds links and images only the conversion has, but not a repeated one", () => {
    const original = '<a href="https://example.com/a">Go</a>';
    expect(compareText(original, `${original}<img src="https://example.com/x.png" alt="">`).addedAttributes).toEqual(["src https://example.com/x.png"]);
    expect(compareText(original, `${original}<a href="https://example.com/a">Go</a>`).addedAttributes).toEqual([]);
  });

  it("ignores zero-width characters", () => {
    expect(compareText("<p>Hello‌ world</p>", "<p>Hello world</p>").missing).toEqual([]);
  });
});
