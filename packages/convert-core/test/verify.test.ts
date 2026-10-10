import { describe, expect, it } from "vitest";
import { compareText, hiddenClasses, hideClasses, htmlAttributes, htmlWords } from "../src/verify";

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

describe("hidden elements", () => {
  it("aren't read, nested tags and all: a block Elements hides on desktop is a hidden table", () => {
    const hidden = '<table style="display: none;mso-hide: all"><tr><td><table><tr><td>Inner</td></tr></table><p>Phone version</p></td></tr></table>';
    expect(compareText("<p>Everywhere</p>", `<p>Everywhere</p>${hidden}`)).toMatchObject({ missing: [], added: [] });
    expect(compareText('<div style="display:none"><div>One</div>Two</div><p>Shown</p>', "<p>Shown</p>")).toMatchObject({ missing: [], added: [] });
  });

  it("still reads the preview text, and reads an element that's never closed as a browser does", () => {
    expect(compareText('<div style="display:none" data-skip-in-text="true">Preview</div><p>Hi</p>', "<p>Hi</p>").missing).toEqual(["Preview"]);
    // A browser closes the hidden div at the end: what's in it stays hidden, and what follows its parent shows.
    expect(compareText('<div style="display:none">Hidden', "").missing).toEqual([]);
    expect(compareText('<table><tr><td><div style="display:none">Hidden</td><td>Shown</td></tr></table>', "").missing).toEqual(["Shown"]);
  });
});

describe("elements a stylesheet class hides", () => {
  const sheet = (css: string, body: string) => `<html><head><style>${css}</style></head><body>${body}</body></html>`;

  it("aren't read, unless the rule is in a media query or their own style shows them", () => {
    const html = sheet(".hide{display:none} @media (prefers-color-scheme: dark){.dark{display:block}} .shown{display:none}", '<p>Visible</p><p class="note hide">Internal note</p><p class="dark">Dark</p><p class="shown" style="display:block">Inline wins</p>');
    expect(htmlWords(html)).toEqual(["Visible", "Dark", "Inline", "wins"]);
    expect(compareText(html, "<p>Visible</p><p>Dark</p><p>Inline wins</p>")).toMatchObject({ missing: [], added: [] });
  });

  it("are hidden by an !important rule over their own style, images included", () => {
    const html = sheet(".dark-img{display:none !important}", '<img class="dark-img" src="/dark.png" alt="Dark logo" style="display:block"><img src="/light.png" alt="Light logo">');
    expect(htmlAttributes(html)).toEqual(["src /light.png", "alt Light logo"]);
    expect([...hiddenClasses(html)]).toEqual([["dark-img", { important: true }]]);
    expect(hideClasses('<img class="dark-img" style="display:block">', hiddenClasses(html))).toBe('<img class="dark-img" style="display:block;display:none">');
  });
});

