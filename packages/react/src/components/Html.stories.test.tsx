import { describe, it, expect } from "vitest";
import * as stories from "./Html.stories";

// The <Html> component is a raw passthrough (no default sanitizer), so its story
// HTML must itself be valid and safe. Two things have bitten us:
//  - inline event handlers (onmouseover, …) — never run in a rendered email and
//    are an XSS pattern; bad examples to ship.
//  - a `url('…')` whose content has a raw `"` (e.g. an SVG data URI with
//    xmlns="…") sits inside a double-quoted style="…", so the first inner `"`
//    closes the attribute and the tail (`'); opacity: …">`) leaks as visible
//    text. URL-encode the data URI or avoid raw double quotes.
const htmlStories = Object.entries(stories).filter(
  ([, s]) => s && typeof s === "object" && (s as any).args && typeof (s as any).args.html === "string"
) as [string, { args: { html: string } }][];

describe("Html stories ship valid, safe HTML", () => {
  it("there are several html stories to check", () => {
    expect(htmlStories.length).toBeGreaterThan(3);
  });

  for (const [name, story] of htmlStories) {
    const html = story.args.html;

    it(`${name}: has no inline event handlers`, () => {
      expect(html).not.toMatch(/\son[a-z]+\s*=/i);
    });

    it(`${name}: has no url() containing a raw double quote (style break-out)`, () => {
      expect(html).not.toMatch(/url\(\s*'[^']*"[^']*'\s*\)/);
    });
  }
});
