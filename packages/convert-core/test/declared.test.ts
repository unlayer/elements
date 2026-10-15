import { describe, expect, it } from "vitest";
import { applyDeclared, describeDeclared, type DeclaredDifference } from "../src/declared";
import { compareText } from "../src/verify";

const ICON = "https://cdn.example.com/icons/facebook.png";
const ALT: DeclaredDifference = { kind: "alt", src: ICON, from: "Facebook", to: "Facebook icon", reason: "social icon alt text is the editor's" };
const GLYPH: DeclaredDifference = { kind: "text", text: "☰", parentClass: "menu-open", reason: "the menu toggle's glyph is left out" };

const page = (body: string) => `<!doctype html><html><head><title>t</title></head><body>${body}</body></html>`;
const icon = (alt: string, src = ICON) => `<p>Follow us</p><a href="https://facebook.com/acme"><img src="${src}" alt="${alt}" width="32"></a>`;

describe("declared differences", () => {
  it("make the original show what the migration is expected to: the check passes, and each change is reported", () => {
    const original = page(icon("Facebook"));
    const migrated = page(icon("Facebook icon"));
    expect(compareText(original, migrated).missingAttributes.length).toBeGreaterThan(0);
    const expected = applyDeclared(original, [ALT]);
    const check = compareText(expected.html, migrated);
    expect([check.missing, check.added, check.missingAttributes, check.addedAttributes]).toEqual([[], [], [], []]);
    expect(expected.applied.map(describeDeclared)).toEqual([{ reason: "social icon alt text is the editor's", detail: 'alt "Facebook" → "Facebook icon"' }]);
  });

  it("change only what they name: another alt change, another image, or other text still fails as content", () => {
    // The alt text the migration writes isn't the declared one.
    const wrongAlt = compareText(applyDeclared(page(icon("Facebook")), [ALT]).html, page(icon("Facebook logo")));
    expect(wrongAlt.missingAttributes).toContain("alt Facebook icon");
    expect(wrongAlt.addedAttributes).toContain("alt Facebook logo");
    // The original's alt isn't the one declared: nothing changes, and the difference stays.
    const otherFrom = applyDeclared(page(icon("FB")), [ALT]);
    expect(otherFrom.applied).toEqual([]);
    expect(compareText(otherFrom.html, page(icon("Facebook icon"))).missingAttributes).toContain("alt FB");
    // Another image with the same alt text isn't touched.
    const otherImage = applyDeclared(page(icon("Facebook", "https://cdn.example.com/photo.png")), [ALT]);
    expect(otherImage.applied).toEqual([]);
    // A glyph outside the element it's declared in is content.
    const loose = applyDeclared(page('<p>Menu ☰</p><span class="menu-open">☰</span>'), [GLYPH]);
    expect(loose.applied).toEqual([{ declaration: GLYPH, count: 1 }]);
    expect(compareText(loose.html, page("<p>Menu</p>")).missing).toEqual(["☰"]);
  });

  it("leave out a declared glyph, and keep the rest of the document byte for byte", () => {
    const original = page('<div><label><span class="menu-open">&#9776;</span><span class="menu-close" style="display:none">✕</span></label><a href="/a">Shop</a></div>');
    const { html, applied } = applyDeclared(original, [GLYPH]);
    expect(html).toBe(original.replace("&#9776;", ""));
    expect(applied).toHaveLength(1);
    expect(compareText(html, page('<div><a href="/a">Shop</a></div>')).missing).toEqual([]);
  });

  it("swap a declared image source, and add an alt text the original's image lacks", () => {
    const swapped = applyDeclared(page('<img src="/mjml/facebook.png">'), [
      { kind: "src", from: "/mjml/facebook.png", to: "/unlayer/facebook.png", reason: "r" },
      { kind: "alt", src: "/mjml/facebook.png", from: "", to: "Facebook icon", reason: "r" },
    ]);
    expect(swapped.html).toBe(page('<img alt="Facebook icon" src="/unlayer/facebook.png">'));
    expect(swapped.applied.map((a) => a.count)).toEqual([1, 1]);
  });

  it("show elements of a declared class the original hides at some widths (a menu folded into a hamburger)", () => {
    const css = "<style>@media (max-width: 720px) { .menu-checkbox ~ .menu-links { display: none !important } }</style>";
    const original = `<!doctype html><html><head>${css}</head><body><input type="checkbox" class="menu-checkbox"><div class="menu-links"><a href="/a">Shop</a></div></body></html>`;
    const migrated = page('<div><a href="/a">Shop</a></div>');
    expect(compareText(original, migrated).phone.added).toEqual(["Shop"]);
    const { html, applied } = applyDeclared(original, [{ kind: "shown", className: "menu-links", reason: "r" }]);
    expect(html).toContain('<div style="display:block !important" class="menu-links">');
    expect(applied).toHaveLength(1);
    expect(compareText(html, migrated).phone.added).toEqual([]);
  });

  it("hide elements of a declared class (a hamburger button and its icon)", () => {
    const original = page('<label class="menu-trigger"><span class="open" style="background-image:url(/burger.svg);width:18px;height:18px;display:block"></span></label><a href="/a">Shop</a>');
    const migrated = page('<a href="/a">Shop</a>');
    expect(compareText(original, migrated).missingAttributes.length).toBeGreaterThan(0);
    const { html, applied } = applyDeclared(original, [{ kind: "hidden", className: "menu-trigger", reason: "r" }]);
    expect(html).toContain('<label style="display:none !important" class="menu-trigger">');
    expect(applied).toHaveLength(1);
    expect(compareText(html, migrated).missingAttributes).toEqual([]);
  });

  it("change nothing when nothing is declared", () => {
    const original = page(icon("Facebook"));
    expect(applyDeclared(original, [])).toEqual({ html: original, applied: [] });
  });
});
