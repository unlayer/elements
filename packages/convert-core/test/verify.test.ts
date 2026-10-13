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

  it("reads an image or a link hidden with visibility as not shown (visible inside it undoes it)", () => {
    const logo = '<img src="https://example.com/logo.png" alt="Logo">';
    // Hidden in the original, shown in the migration: an image added.
    const shown = compareText(`<p>Hi</p><img style="visibility:hidden" src="https://example.com/logo.png" alt="Logo">`, `<p>Hi</p>${logo}`);
    expect(shown.addedAttributes).toEqual(["src https://example.com/logo.png", "alt Logo"]);
    // Inherited from a box around it, and a background image too.
    expect(compareText(`<p>Hi</p><div style="visibility:hidden">${logo}<div style="background-image:url(https://example.com/bg.png)">x</div></div>`, "<p>Hi</p>").missingAttributes).toEqual([]);
    // Undone inside: the image shows.
    expect(compareText(`<p>Hi</p><div style="visibility:hidden"><img style="visibility:visible" src="https://example.com/logo.png" alt="Logo"></div>`, `<p>Hi</p>${logo}`).addedAttributes).toEqual([]);
    // A link with nothing that shows can't be seen; one whose text shows can.
    expect(compareText('<p>Hi</p><a style="visibility:hidden" href="/pay">Pay</a>', "<p>Hi</p>").missingAttributes).toEqual([]);
    expect(compareText('<p>Hi</p><a style="visibility:hidden" href="/pay"><span style="visibility:visible">Pay</span></a>', '<p>Hi</p><a href="/pay">Pay</a>').addedAttributes).toEqual([]);
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


describe("content the check reads beyond desktop text", () => {
  const page = (body: string, head = "") => `<html><head>${head}</head><body style="margin:0">${body}</body></html>`;

  it("reads text moved far off the page by a transform as hidden, as text-indent: -9999px", () => {
    for (const css of ["transform:translateX(-9999px)", "transform:translate(-5000px, 0)", "transform:translate3d(0,-2000px,0)", "translate:-9999px"]) {
      const check = compareText(page(`<p>Hi</p><p style="${css}">Secret coupon</p>`), page("<p>Hi</p><p>Secret coupon</p>"));
      expect(check.added, css).toEqual(["Secret", "coupon"]);
    }
    // A small shift moves it, and doesn't hide it.
    expect(compareText(page('<p style="transform:translateX(-4px)">Hi</p>'), page("<p>Hi</p>")).added).toEqual([]);
  });

  it("reads text ::before and ::after draw as words, on an empty element too", () => {
    const css = '<style>.badge::before{content:"NEW"} .q::after{content:" by \\41 da"} .clear::after{content:"";display:table}</style>';
    const original = page('<p>Hello</p><span class="badge"></span><p class="q">Quote</p><div class="clear"></div>', css);
    expect(htmlWords(original)).toEqual(["Hello", "NEW", "Quote", "by", "Ada"]);
    expect(compareText(original, page("<p>Hello</p><p>Quote</p>")).missing).toEqual(["NEW", "by", "Ada"]);
    // A rule that hides what it draws draws nothing; React's escaped quotes (`content: &quot;x&quot;`) aren't a string.
    expect(htmlWords(page('<span class="b"></span>', '<style>.b::before{content:"NEW";display:none}</style>'))).toEqual([]);
    expect(htmlWords(page('<span class="b"></span>', "<style>.b::before{content:&quot;NEW&quot;}</style>"))).toEqual([]);
  });

  it("compares what dark mode shows, where either side has a rule for it", () => {
    const head = "<style>.dark{display:none} @media (prefers-color-scheme: dark) { .light{display:none !important} .dark{display:block !important} }</style>";
    const original = page('<p class="light">Good morning</p><p class="dark">Good night</p><img class="dark" src="https://example.com/dark.png" alt="Logo">', head);
    const check = compareText(original, page("<p>Good morning</p>"));
    expect([check.missing, check.added]).toEqual([[], []]);
    expect(check.styles).toEqual([
      { property: "shown", original: "shown", converted: "hidden", words: ["night"], dark: true },
      { property: "shown", original: "hidden", converted: "shown", words: ["morning"], dark: true },
    ]);
    expect(check.missingAttributes).toEqual(["src https://example.com/dark.png (in dark mode)", "alt Logo (in dark mode)"]);
    // Kept on both sides: the same.
    expect(compareText(original, original).styles).toEqual([]);
  });

  it("compares styles on phones, where the same words show", () => {
    const head = "<style>@media (max-width: 480px) { .big { color: #ff0000 !important } }</style>";
    const check = compareText(page('<p class="big">Huge on phones</p>', head), page("<p>Huge on phones</p>"));
    expect(check.styles).toEqual([expect.objectContaining({ property: "color", original: "#ff0000", converted: "#000000", phone: true })]);
  });
});

describe("links and images where only a phone, a wider screen or dark mode shows them", () => {
  const page = (body: string, head = "") => `<html><head>${head}</head><body style="margin:0">${body}</body></html>`;
  // Shown only where the condition holds, on both sides: the same words, links and images, so only where each one is tells.
  const only = (condition: string) => `<style>.only{display:none} @media ${condition} { .only{display:block !important} }</style>`;
  const links = (call: string, text: string) => `<p>Hello</p><div class="only"><a href="${call}">Call</a> <a href="${text}">Text</a></div>`;
  const images = (first: [string, string], second: [string, string]) =>
    `<p>Hello</p><div class="only"><img src="https://example.com/${first[0]}" alt="${first[1]}"><img src="https://example.com/${second[0]}" alt="${second[1]}"></div>`;
  const conditions: Array<[string, string, (check: ReturnType<typeof compareText>) => string[]]> = [
    ["on phones", "(max-width: 480px)", (check) => [...(check.phone.missingAttributes ?? []), ...(check.phone.addedAttributes ?? [])]],
    ["on wider screens", "(min-width: 1200px)", (check) => [...check.missingAttributes, ...check.addedAttributes]],
    ["in dark mode", "(prefers-color-scheme: dark)", (check) => [...check.missingAttributes, ...check.addedAttributes]],
  ];

  for (const [where, condition, listed] of conditions) {
    it(`fails two links swapped ${where}`, () => {
      const original = page(links("tel:+15550100", "sms:+15550199"), only(condition));
      expect(listed(compareText(original, original))).toEqual([]);
      const check = compareText(original, page(links("sms:+15550199", "tel:+15550100"), only(condition)));
      expect([check.missing, check.added, check.phone.missing, check.phone.added]).toEqual([[], [], [], []]);
      expect(listed(check)).toEqual(expect.arrayContaining([expect.stringContaining("href tel:+15550100 (Call"), expect.stringContaining("href sms:+15550199 (Text")]));
    });

    it(`fails two images swapped ${where}: under each other's text, or in another order`, () => {
      const original = page(images(["front.png", "Front"], ["back.png", "Back"]), only(condition));
      expect(listed(compareText(original, original))).toEqual([]);
      const underOther = compareText(original, page(images(["back.png", "Front"], ["front.png", "Back"]), only(condition)));
      expect(listed(underOther)).toEqual(expect.arrayContaining([expect.stringContaining("src https://example.com/front.png (Front")]));
      const reordered = compareText(original, page(images(["back.png", "Back"], ["front.png", "Front"]), only(condition)));
      expect(listed(reordered)).toEqual(expect.arrayContaining([expect.stringMatching(/^src https:\/\/example\.com\/(front|back)\.png \(out of order/)]));
    });
  }

  it("lists a link once: one desktop lists isn't listed again for phones", () => {
    const check = compareText(page('<a href="https://a.example">Shop</a>'), page('<a href="https://b.example">Shop</a>'));
    expect(check.missingAttributes).toEqual(["href https://a.example"]);
    expect(check.phone.missingAttributes).toBeUndefined();
  });
});

describe("words in another order where only a phone, a wider screen or dark mode shows them", () => {
  const page = (body: string, head = "") => `<html><head>${head}</head><body style="margin:0">${body}</body></html>`;
  // Shown only where the condition holds, on both sides: the same words, so only their order tells.
  const only = (condition: string) => `<style>.only{display:none} @media ${condition} { .only{display:block !important} }</style>`;
  const words = (text: string) => `<p>Hello</p><p class="only">${text}</p>`;
  const cases: Array<[string, string, (check: ReturnType<typeof compareText>) => string[]]> = [
    ["on phones", "(max-width: 480px)", (check) => [...check.phone.missing, ...check.phone.added]],
    ["on wider screens", "(min-width: 1200px)", (check) => check.styles.filter((s) => s.property === "shown").flatMap((s) => s.words)],
    ["in dark mode", "(prefers-color-scheme: dark)", (check) => check.styles.filter((s) => s.property === "shown").flatMap((s) => s.words)],
  ];
  for (const [where, condition, listed] of cases) {
    it(`fail the check ${where}`, () => {
      const original = page(words("Pay 10 today"), only(condition));
      expect(listed(compareText(original, original))).toEqual([]);
      const check = compareText(original, page(words("Pay today 10"), only(condition)));
      expect([check.missing, check.added]).toEqual([[], []]);
      expect(listed(check).length).toBeGreaterThan(0);
    });
  }
});

describe("inline SVG icons", () => {
  const page = (body: string) => `<html><head></head><body style="margin:0">${body}</body></html>`;
  // A download arrow drawn from scratch: a tray, an arrow head and its shaft.
  const icon = (attributes: string, shapes: string) => `<svg ${attributes}>${shapes}</svg>`;
  const arrow = icon(
    'xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"',
    '<path d="M3 13v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3"></path><polyline points="6 8 10 12 14 8"></polyline><line x1="10" y1="2" x2="10" y2="12"></line>'
  );
  const button = (svg: string) => page(`<p>Your report is ready.</p><a href="https://example.com/report" style="display:inline-block">${svg}Download</a>`);

  it("lists an icon whose shapes lost what draws them as lost, like an image", () => {
    const stripped = '<svg style="width:20px;height:20px"><path></path><polyline></polyline><line></line></svg>';
    const check = compareText(button(arrow), button(stripped));
    expect([check.missing, check.added]).toEqual([[], []]);
    expect(check.missingAttributes).toEqual([expect.stringMatching(/^svg path, polyline, line in viewBox 0 0 20 20 \(drawing [0-9a-f]{8}\)$/)]);
    // Lost entirely, too.
    expect(compareText(button(arrow), button("")).missingAttributes).toHaveLength(1);
  });

  it("lists an icon drawn differently as lost and added", () => {
    const other = arrow.replace('points="6 8 10 12 14 8"', 'points="6 12 10 8 14 12"');
    const check = compareText(button(arrow), button(other));
    expect(check.missingAttributes).toHaveLength(1);
    expect(check.addedAttributes).toHaveLength(1);
  });

  it("reads the same drawing written another way as the same: attribute order and case, number formatting, a size", () => {
    const rewritten = icon(
      'stroke-width="2.0" STROKE="currentcolor" fill="none" viewBox="0,0,20,20" style="width:1rem;height:1rem" class="icon"',
      '<path d="M3,13 v3 a1,1 0 0,0 1,1 h12 a1 1 0 0 0 1-1 v-3"/><polyline points="6,8 10,12 14,8"/><line x2="10" y2="12" x1="10" y1="2" />'
    );
    const check = compareText(button(arrow), button(rewritten));
    expect([check.missingAttributes, check.addedAttributes]).toEqual([[], []]);
  });

  it("doesn't count an SVG that draws nothing, or one hidden", () => {
    // A sprite of definitions, a spacer: nothing drawn, so nothing to lose.
    const sprite = '<svg width="0" height="0"><defs><symbol id="i"><path d="M0 0h4"></path></symbol></defs></svg>';
    expect(compareText(page(`<p>Hi</p>${sprite}`), page("<p>Hi</p>")).missingAttributes).toEqual([]);
    expect(compareText(page(`<p>Hi</p><div style="display:none">${arrow}</div>`), page("<p>Hi</p>")).missingAttributes).toEqual([]);
    // A <use> draws what it refers to: the definition lost is the drawing lost.
    const used = '<svg viewBox="0 0 4 4"><use href="#dot"></use></svg>';
    const defined = '<svg width="0" height="0" style="position:absolute"><defs><circle id="dot" cx="2" cy="2" r="2"></circle></defs></svg>';
    const check = compareText(page(`<p>Hi</p>${defined}${used}`), page(`<p>Hi</p>${used}`));
    expect(check.missingAttributes).toHaveLength(1);
    expect(check.addedAttributes).toHaveLength(1);
  });
});
