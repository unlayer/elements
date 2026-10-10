/**
 * What the check must not pass: an original and a migration a reader sees
 * differently, where the check reads one side wrong or can't read it. Each
 * pair must fail, with a difference or as unverified.
 */
import { describe, expect, it } from "vitest";
import { checkFails, compareText } from "../src/verify";

const page = (body: string, head = "") => `<html><head>${head}</head><body style="margin:0">${body}</body></html>`;
const style = (css: string) => `<style>${css}</style>`;
/** A line that stays where it is, so a move isn't read as the whole email shifting. */
const anchor = '<p style="margin:0">Thanks for your order, here is your summary</p>';

describe("keywords that reset a property", () => {
  it("reads `initial` as the property's initial value, not the parent's", () => {
    const check = compareText(page('<div style="color:#ff0000"><p style="color:initial">Plain words</p></div>'), page('<p style="color:#ff0000">Plain words</p>'));
    expect(check.styles).toEqual([expect.objectContaining({ property: "color", original: "#000000", converted: "#ff0000" })]);
    // A box hidden around text that `visibility: initial` shows again.
    expect(compareText(page('<div style="visibility:hidden"><p style="visibility:initial">Shown text</p></div>'), page("<p></p>")).missing).toEqual(["Shown", "text"]);
    expect(checkFails(compareText(page('<h1><span style="font-weight:initial">Light</span></h1>'), page('<h1><span>Light</span></h1>')))).toBe(true);
  });

  it("reads `revert` as the browser's own style for the element", () => {
    const check = compareText(page('<h1 style="font-size:revert">Big title</h1>'), page('<h1 style="font-size:14px">Big title</h1>'));
    expect(check.styles).toEqual([expect.objectContaining({ property: "size", original: "32px", converted: "14px" })]);
  });
});

describe("rules the check can't evaluate", () => {
  it("doubt what they set when they may outrank the rule that wins", () => {
    const hidden = compareText(page('<div id="x" class="a"><span>Secret offer</span></div>', style(".a{display:block} #x:has(span){display:none}")), page("<div><span>Secret offer</span></div>"));
    expect(hidden.unverified).toContainEqual(expect.objectContaining({ what: "shown", side: "original", words: ["Secret", "offer"] }));
    const white = compareText(page('<p id="x" class="a">Faint words</p>', style(".a{color:#000} #x:is(p){color:#fff}")), page('<p style="color:#000">Faint words</p>'));
    expect(white.unverified).toEqual([expect.objectContaining({ what: "color", side: "original" })]);
  });

  it("still read a rule that applies for sure at its own weight", () => {
    // `.a` matches; the unreadable selector could only set the same color.
    const check = compareText(page('<p class="a">Same words</p>', style(".a, p:has(b){color:#123456}")), page('<p style="color:#123456">Same words</p>'));
    expect(checkFails(check)).toBe(false);
  });

  it("ignores `<!--` around a stylesheet's rules, as browsers do", () => {
    const check = compareText(page('<p class="old">Expired offer</p>', style("<!-- .old{display:none} -->")), page("<p>Expired offer</p>"));
    expect(check.added).toEqual(["Expired", "offer"]);
  });

  it("gives up on variables that refer to each other, quickly", () => {
    const started = Date.now();
    const check = compareText(page('<p style="--a:var(--a) var(--a) var(--a) var(--a);--b:var(--c) var(--c);--c:var(--b) var(--b);color:var(--a)">Loop</p>'), page("<p>Loop</p>"));
    expect(Date.now() - started).toBeLessThan(2000);
    expect(check.unverified).toEqual([expect.objectContaining({ what: "color", side: "original" })]);
  });
});

describe("underlines", () => {
  it("lets a later `text-decoration` win over an earlier `text-decoration-line`", () => {
    const check = compareText(page('<a href="https://example.com" style="text-decoration-line:none;text-decoration:underline">Read more</a>'), page('<a href="https://example.com" style="text-decoration:none">Read more</a>'));
    expect(check.styles).toEqual([expect.objectContaining({ property: "underline", original: "underlined", converted: "not underlined" })]);
  });
});

describe("phones", () => {
  it("reads a phone held upright, and a device width as the screen's", () => {
    const hides = compareText(page('<p class="m">Desktop only words</p>', style("@media (max-width:600px) and (orientation:portrait){.m{display:none !important}}")), page("<p>Desktop only words</p>"));
    expect(hides.phone.added).toEqual(["Desktop", "only", "words"]);
    const device = compareText(page('<p class="m">Desktop only words</p>', style("@media only screen and (max-device-width:480px){.m{display:none !important}}")), page("<p>Desktop only words</p>"));
    expect(device.phone.added).toEqual(["Desktop", "only", "words"]);
  });

  it("fails when whether a phone shows words can't be read on one side", () => {
    const check = compareText(page('<p class="m">Desktop only words</p>', style("@media (max-width:600px) and (hover:none){.m{display:none !important}}")), page("<p>Desktop only words</p>"));
    expect(check.unverified).toEqual([expect.objectContaining({ what: "shown on phones", side: "original", words: ["Desktop", "only", "words"] })]);
  });
});

describe("where text sits", () => {
  it("fails when only one side's place can be worked out", () => {
    const original = page(`${anchor}<table width="600"><tr><td style="width:30vw">Left words</td><td style="width:30vw">Right words</td></tr></table>`);
    const stacked = page(`${anchor}<p style="margin:0">Left words</p><p style="margin:0">Right words</p>`);
    expect(compareText(original, stacked).unverified).toEqual([expect.objectContaining({ what: "where it sits", side: "original" })]);
  });

  it("works out `calc()` widths", () => {
    const original = page(`${anchor}<div style="width:600px"><div style="display:inline-block;width:calc(50% - 4px)">Left column words</div><div style="display:inline-block;width:calc(50% - 4px)">Right column words</div></div>`);
    const stacked = page(`${anchor}<div style="width:600px"><div>Left column words</div><div>Right column words</div></div>`);
    expect(compareText(original, stacked).layout).toEqual([expect.objectContaining({ items: ["Right", "column", "words"] })]);
  });

  it("puts a box floated right on the right", () => {
    const original = page(`${anchor}<div style="width:600px"><div style="float:right;width:200px">Floated words</div></div>`);
    const left = page(`${anchor}<div style="width:600px"><div style="width:200px">Floated words</div></div>`);
    expect(compareText(original, left).layout).toEqual([expect.objectContaining({ items: ["Floated", "words"], by: -400 })]);
  });

  it("lets a CSS text-align override an align attribute's centering of blocks", () => {
    const original = page(`${anchor}<table width="600"><tr><td align="center" style="text-align:left"><div style="width:200px">Sized block</div></td></tr></table>`);
    const centered = page(`${anchor}<table width="600"><tr><td><div style="width:200px;margin:0 auto">Sized block</div></td></tr></table>`);
    const left = page(`${anchor}<table width="600"><tr><td><div style="width:200px">Sized block</div></td></tr></table>`);
    expect(compareText(original, centered).layout).toEqual([expect.objectContaining({ items: ["Sized", "block"] })]);
    expect(checkFails(compareText(original, left))).toBe(false);
  });
});

describe("faint text", () => {
  it("reads opacity into the text's color", () => {
    const check = compareText(page('<div style="opacity:0.3"><p>Muted footer words</p></div>'), page("<p>Muted footer words</p>"));
    expect(check.styles).toEqual([expect.objectContaining({ property: "color", words: ["Muted", "footer", "words"] })]);
    expect(checkFails(compareText(page('<p style="opacity:0.5">Same</p>'), page('<p style="color:rgba(0,0,0,0.5)">Same</p>')))).toBe(false);
  });
});

describe("the inbox preview", () => {
  it("isn't the same as text in the email", () => {
    const preview = '<div data-skip-in-text="true" style="display:none;max-height:0;overflow:hidden">Your order shipped</div>';
    const check = compareText(page(`${preview}<p>Thanks</p>`), page("<p>Your order shipped</p><p>Thanks</p>"));
    expect(check.styles).toEqual([expect.objectContaining({ property: "shown", original: "the inbox preview only", converted: "in the email" })]);
    expect(checkFails(compareText(page(`${preview}<p>Thanks</p>`), page(`${preview}<p>Thanks</p>`)))).toBe(false);
  });
});

describe("boxes sized to their content", () => {
  it("place their text at their start edge (`w-fit`, `w-max`), and read `ch` widths (`max-w-prose`)", () => {
    const badge = (width: string) => page(`${anchor}<div style="width:600px"><p style="width:${width};padding:0 8px;margin:0">NEW</p></div>`);
    const plain = page(`${anchor}<div style="width:600px"><p style="padding:0 8px;margin:0">NEW</p></div>`);
    for (const width of ["fit-content", "max-content", "min-content"]) expect(checkFails(compareText(badge(width), plain)), width).toBe(false);
    expect(checkFails(compareText(page(`${anchor}<p style="max-width:65ch;margin:0">Prose words</p>`), page(`${anchor}<p style="margin:0">Prose words</p>`)))).toBe(false);
    // Centered, its place depends on its content's width: unverified, not passed.
    const centered = page(`${anchor}<div style="width:600px"><p style="width:fit-content;margin:0 auto">NEW</p></div>`);
    expect(compareText(centered, plain).unverified).toEqual([expect.objectContaining({ what: "where it sits", side: "original" })]);
  });
});
