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
    // `:is()` is read: as specific as its argument (an id here), so the white wins.
    const white = compareText(page('<p id="x" class="a">Faint words</p>', style(".a.b{color:#000} p:is(#x){color:#fff}").replace('class="a"', 'class="a b"')), page('<p style="color:#000">Faint words</p>'));
    // (White on the white page: words the migration shows that the original's reader can't make out.)
    expect(white.styles).toEqual([
      expect.objectContaining({ property: "shown", original: "invisible (#ffffff on #ffffff)", converted: "shown" }),
      expect.objectContaining({ property: "color", original: "#ffffff", converted: "#000000" }),
    ]);
    // `:has()` isn't: it counts as specific as its argument, so the rule it may apply is in doubt.
    const has = compareText(page('<p id="x" class="a b">Faint words</p>', style(".a.b{color:#000} p:has(#y, .c){color:#fff}")), page('<p style="color:#000">Faint words</p>'));
    expect(has.unverified).toEqual([expect.objectContaining({ what: "color", side: "original" })]);
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

describe("pairs a reader sees differently, from a whole-PR review", () => {
  const top = '<p style="margin:0">Thanks for your order, here is your summary</p>';
  const phone = style("@media only screen and (max-width:600px){.mob{display:block!important;max-height:none!important}}");
  const pairs: Array<[string, string, string]> = [
    ["a strikethrough lost", page("<p>Was <s>$99</s> now $49</p>"), page("<p>Was <span>$99</span> now $49</p>")],
    ["a line-through lost", page('<p>Was <span style="text-decoration:line-through">$99</span> now $49</p>'), page("<p>Was <span>$99</span> now $49</p>")],
    ["another font family", page('<p style="font-family:Georgia,serif">Hello world</p>'), page('<p style="font-family:Arial">Hello world</p>')],
    ["two colors it can't read, written differently", page('<p style="color:oklch(0.6 0.2 25)">Red words</p>'), page('<p style="color:oklch(0.6 0.2 250)">Red words</p>')],
    ["a box hidden by width 0", page('<div style="width:0;overflow:hidden">Hidden words</div>'), page("<div>Hidden words</div>")],
    ["a box hidden by max-width 0", page('<div style="max-width:0;overflow:hidden">Hidden words</div>'), page("<div>Hidden words</div>")],
    ["a span's max-height doesn't hide it", page('<p>Call <span style="max-height:0;overflow:hidden">555-0100</span> now</p>'), page("<p>Call now</p>")],
    ["a cell's height doesn't hide it", page('<table><tr><td style="height:0;overflow:hidden">Order total $40</td></tr></table>'), page("<table><tr><td></td></tr></table>")],
    ["a line break removed", page("<p>123 Main St<br>Springfield</p>"), page("<p>123 Main St Springfield</p>")],
    ["two images swapped", page(`${top}<img src="a.png" alt="A"><img src="b.png" alt="B">`), page(`${top}<img src="b.png" alt="B"><img src="a.png" alt="A">`)],
    ["a link added to words", page('<p><a href="https://x.com/u">Unsubscribe</a> Terms</p>'), page('<p><a href="https://x.com/u">Unsubscribe</a> <a href="https://x.com/u" style="color:#000;text-decoration:none">Terms</a></p>')],
    ["an image only phones show, lost", page(`${top}<img class="mob" src="hero-mobile.png" alt="" style="display:none">`, phone), page(top)],
    ["a link only phones show, changed", page(`${top}<div class="mob" style="display:none"><a href="tel:+15551234">Call us</a></div>`, phone), page(`${top}<div class="mob" style="display:none"><a href="tel:+15559999">Call us</a></div>`, phone)],
    ["a linked image whose hiding it can't read", page(`${top}<div class="promo"><a href="https://x.com/p"><img src="promo.png" alt=""></a></div>`, style("@supports (display:grid){.promo{display:none!important}}")), page(`${top}<div><a href="https://x.com/p"><img src="promo.png" alt=""></a></div>`)],
    ["a background image changed", page(`${top}<table><tr><td style="background-image:url(https://x.com/hero.jpg);background-color:#000"><p style="color:#fff">Big sale</p></td></tr></table>`), page(`${top}<table><tr><td style="background-image:url(https://x.com/other.jpg);background-color:#000"><p style="color:#fff">Big sale</p></td></tr></table>`)],
    ["a highlight lost", page("<p>This is <mark>important</mark> info</p>"), page("<p>This is <span>important</span> info</p>")],
    ["a check mark made a cross", page("<p>Free shipping ✓</p>"), page("<p>Free shipping ✗</p>")],
    ["a rating changed", page("<p>Rating ★★★★★</p>"), page("<p>Rating ★☆☆☆☆</p>")],
    ["an emoji dropped", page("<h1>🎉 Welcome</h1>"), page("<h1>Welcome</h1>")],
    ["an ampersand dropped", page("<p>Q &amp; A</p>"), page("<p>Q A</p>")],
    ["the preview text shown in the email", page('<div style="display:none;max-height:0;overflow:hidden" data-skip-in-text="true">Your order shipped</div><p>Hello</p>'), page('<div data-skip-in-text="true">Your order shipped</div><p>Hello</p>')],
    ["an underline that doesn't reach into an inline-block", page('<a href="https://x.com" style="text-decoration:underline"><span style="display:inline-block">Click me</span></a>'), page('<a href="https://x.com" style="text-decoration:underline"><span>Click me</span></a>')],
    ["a styled number after a currency sign", page('<p>Now only $<span style="font-size:48px;font-weight:bold;color:#e11d48">49</span></p>'), page("<p>Now only $<span>49</span></p>")],
    ["a bold word in brackets", page("<p>Name (<b>required</b>)</p>"), page("<p>Name (required)</p>")],
    ["a class with a non-ASCII name", page('<p class="sólo-móvil">Oferta secreta</p><p>Hola</p>', style(".sólo-móvil{display:none}")), page('<p class="sólo-móvil">Oferta secreta</p><p>Hola</p>')],
  ];
  it.each(pairs)("%s fails the check", (_, original, migrated) => {
    expect(checkFails(compareText(original, migrated))).toBe(true);
  });

  it("reads what it read wrong as the same: a font shorthand's .875em, and an escape past the last code point", () => {
    expect(checkFails(compareText(page('<p style="font:.875em Arial">Small text</p>'), page('<p style="font-size:14px;font-family:Arial">Small text</p>')))).toBe(false);
    expect(() => compareText(page('<p class="a">Hi</p>', style(".a\\110000 {color:red}")), page("<p>Hi</p>"))).not.toThrow();
  });
});

describe("screens wider than the desktop width read", () => {
  // Tailwind's `md:` as React Email writes it: a rule for screens at least 48rem (768px) wide.
  const md = style("@media (min-width:48rem){.md_block{display:block!important}.md_text-24px{font-size:24px!important}}");

  it("fail a word only wider screens show, or a size they change, that the migration lost", () => {
    const tip = compareText(page('<p>Your plan renews soon</p><p class="md_block" style="display:none">Tip: upgrade</p>', md), page("<p>Your plan renews soon</p>"));
    expect(checkFails(tip)).toBe(true);
    // At 700px "Tip: upgrade" is hidden on both sides; at 768px the original shows it.
    expect(tip.styles).toEqual([expect.objectContaining({ property: "shown", original: "shown", converted: "hidden", words: ["Tip", "upgrade"], width: 768 })]);
    const size = compareText(page('<p class="md_text-24px" style="font-size:14px">Your plan renews soon</p>', md), page('<p style="font-size:14px">Your plan renews soon</p>'));
    expect(size.styles).toEqual([expect.objectContaining({ property: "size", original: "24px", converted: "14px", width: 768 })]);
    expect(checkFails(size)).toBe(true);
  });

  it("pass the same rule on both sides, and list nothing twice", () => {
    const same = page('<p class="md_text-24px" style="font-size:14px">Your plan renews soon</p>', md);
    expect(checkFails(compareText(same, same))).toBe(false);
    // A difference the desktop width shows too is listed once, without a width.
    const color = compareText(page('<p style="color:#e11d48">Hello world</p>', md), page('<p style="color:#000000">Hello world</p>', md));
    expect(color.styles).toEqual([{ property: "color", original: "#e11d48", converted: "#000000", words: ["Hello", "world"] }]);
  });
});


describe("styles the check doesn't model", () => {
  // Each changes how words show (or which part of them): lost in the migration, the check fails; kept, it passes.
  const cases: Array<[string, string, string?]> = [
    ["gradient text", '<h1 style="background:linear-gradient(#f00,#00f);-webkit-background-clip:text;background-clip:text;color:transparent">Big sale</h1>'],
    ["a text fill color", '<p style="-webkit-text-fill-color:#ff0000">Big sale</p>'],
    ["lines kept as written", '<p style="white-space:pre-line">Big sale</p>'],
    ["lines that don't wrap", '<p style="white-space:nowrap">Big sale</p>'],
    ["text cut off at a width", '<p style="overflow:hidden;white-space:nowrap;text-overflow:ellipsis;width:40px">Big sale</p>'],
    ["lines cut off at a height", '<div style="max-height:20px;overflow:hidden"><p>Big sale</p></div>'],
    ["a line clamp", '<p style="display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden">Big sale</p>'],
    ["a grid", '<div style="display:grid;grid-template-columns:1fr 1fr"><p>Big</p><p>sale</p></div>'],
    ["a reversed row", '<div style="display:flex;flex-direction:row-reverse"><p>Big</p><p>sale</p></div>'],
    ["an item moved in its row", '<div style="display:flex"><p style="order:2">Big</p><p>sale</p></div>'],
    ["a box moved from where it sits", '<p style="position:relative;left:300px">Big sale</p>'],
    ["a box taken out of the flow", '<p style="position:absolute;top:0;right:0">Big sale</p>'],
    ["an indent", '<p style="text-indent:200px">Big sale</p>'],
    ["text in columns", '<div style="column-count:2"><p>Big sale</p></div>'],
    ["a transform", '<p style="transform:rotate(180deg)">Big sale</p>'],
    ["a filter", '<p style="filter:invert(1)">Big sale</p>'],
    ["small capitals", '<p style="font-variant:small-caps">Big sale</p>'],
    ["an inset shadow (a fill behind the text)", '<p style="box-shadow:inset 0 0 0 100px #000;color:#fff">Big sale</p>'],
    ["a text shadow", '<p style="text-shadow:0 0 2px #f00">Big sale</p>'],
    ["letter spacing", '<p style="letter-spacing:0.5em">Big sale</p>'],
    ["right to left text", '<p dir="rtl">Big sale</p>'],
    ["superscript", "<p>Big <sup>sale</sup></p>"],
    ["a list's numbers", "<ol><li>Big sale</li></ol>"],
    ["quotes drawn around it", "<p><q>Big sale</q></p>"],
    ["content drawn before it", '<p class="star">Big sale</p>', ".star::before{content:'★ '}"],
    ["content drawn with the old one-colon spelling", '<p class="star">Big sale</p>', ".star:after{content:' →'}"],
  ];
  // Layouts the check doesn't place: kept as they are, where words sit still can't be told (it depends on heights
  // and content sizes the check doesn't read), so they fail either way.
  const unplaced = new Set(["a line clamp", "a grid", "a box taken out of the flow", "text in columns"]);
  for (const [name, html, css] of cases) {
    it(`fail on ${name} the migration doesn't have, and ${unplaced.has(name) ? "on where it sits kept" : "pass it kept"}`, () => {
      const head = css ? style(css) : "";
      const lost = compareText(page(html, head), page("<p>Big sale</p>"));
      expect(checkFails(lost)).toBe(true);
      // Text drawn before or after it is read as words: lost ones are lost words.
      if (/^content drawn/.test(name)) expect(lost.missing).toEqual([name.includes("one-colon") ? "→" : "★"]);
      else expect(lost.unverified).toContainEqual(expect.objectContaining({ what: unplaced.has(name) ? expect.stringMatching(/^(look|where it sits)$/) : "look", side: "original" }));
      const kept = compareText(page(html, head), page(html, head));
      if (unplaced.has(name)) expect(kept.unverified).toEqual([expect.objectContaining({ what: "where it sits" })]);
      else expect(checkFails(kept)).toBe(false);
    });
  }

  it("fail on a style the migration adds", () => {
    const added = compareText(page("<p>Big sale</p>"), page('<p style="white-space:pre">Big sale</p>'));
    expect(added.unverified).toEqual([expect.objectContaining({ what: "look", side: "migrated", cause: expect.stringContaining("white-space: pre") })]);
  });

  it("read sizes as HTML's presentational attributes set them", () => {
    const font = compareText(page('<p><font size="5" face="Georgia">Big sale</font></p>'), page('<p style="font-size:24px;font-family:Georgia">Big sale</p>'));
    expect(checkFails(font)).toBe(false);
    const smaller = compareText(page('<p><font size="1">Big sale</font></p>'), page('<p style="font-size:16px">Big sale</p>'));
    expect(smaller.styles).toEqual([expect.objectContaining({ property: "size", original: "10px", converted: "16px" })]);
    expect(checkFails(compareText(page('<table><tr><td nowrap>Big sale</td></tr></table>'), page("<p>Big sale</p>")))).toBe(true);
  });

  it("pass what can't change the words: borders, corners, outer shadows, heights, Outlook's own, a relative box left in place", () => {
    const decorated = '<div style="border:1px solid #ddd;border-radius:8px;box-shadow:0 1px 2px #0003;min-height:40px;mso-line-height-rule:exactly;-webkit-font-smoothing:antialiased;cursor:pointer;position:relative;word-break:break-word"><p>Big sale</p></div>';
    expect(checkFails(compareText(page(decorated), page("<p>Big sale</p>")))).toBe(false);
    // Overflow that clips nothing: no height, lines that wrap.
    expect(checkFails(compareText(page('<div style="overflow:hidden"><p>Big sale</p></div>'), page("<p>Big sale</p>")))).toBe(false);
    // Digits set tabular: the same glyphs, a little wider or narrower.
    expect(checkFails(compareText(page('<p style="font-variant-numeric:tabular-nums">Total $14.99</p>'), page("<p>Total $14.99</p>")))).toBe(false);
    // Letter spacing the same in other units.
    expect(checkFails(compareText(page('<p style="font-size:20px;letter-spacing:0.1em">Big sale</p>'), page('<p style="font-size:20px;letter-spacing:2px">Big sale</p>')))).toBe(false);
    // A list without markers, and content that draws nothing.
    expect(checkFails(compareText(page('<ul style="list-style:none;padding:0"><li class="c">Big sale</li></ul>', style(".c::before{content:''}")), page("<p>Big sale</p>")))).toBe(false);
  });

  it("ignore a print stylesheet", () => {
    const print = '<style media="print">.p{display:none}</style>';
    expect(checkFails(compareText(page('<p class="p">Big sale</p>', print), page("<p>Big sale</p>")))).toBe(false);
  });
});

describe("right to left", () => {
  it("places a row's cells from the right", () => {
    const cells = (dir: string) => page(`<table dir="${dir}" width="600" style="width:600px"><tr><td width="300" style="width:300px">First column</td><td width="300" style="width:300px">Second column</td></tr></table>`);
    // The same columns, right to left: the first one sits on the right.
    const swapped = '<table width="600" style="width:600px"><tr><td width="300" style="width:300px">First column</td><td width="300" style="width:300px">Second column</td></tr></table>';
    const check = compareText(cells("rtl"), page(`<div dir="rtl">${swapped}</div>`));
    expect(check.layout).toEqual([]);
    expect(compareText(cells("rtl"), page(swapped.replace("<table", '<table dir="ltr"').replace("<tr>", '<tr dir="rtl">'))).layout.length).toBeGreaterThan(0);
  });

  it("places side-by-side boxes from the right", () => {
    // Text aligned left on both sides: only the order of the boxes differs.
    const columns = (dir: string) => page(`<div dir="${dir}" style="width:600px;text-align:left">${anchor}<div style="display:inline-block;width:300px;text-align:left">First column</div><div style="display:inline-block;width:300px;text-align:left">Second column</div></div>`);
    const flipped = compareText(columns("rtl"), columns("ltr"));
    expect(flipped.layout).toEqual([expect.objectContaining({ items: ["First", "column"] }), expect.objectContaining({ items: ["Second", "column"] })]);
  });
});

describe("in doubt on both sides", () => {
  // The same rule kept on both sides is the same markup; another condition on each side isn't.
  const supports = (condition: string, body: string) => page(body, style(`@supports (${condition}) { .offer { display: none } }`));

  it("fails when whether words show depends on another condition on each side", () => {
    const body = '<p class="offer">Big offer</p>';
    const check = compareText(supports("display: grid", body), supports("display: unsupported", body));
    expect(checkFails(check)).toBe(true);
    expect(check.unverified).toContainEqual(expect.objectContaining({ what: "shown", words: ["Big", "offer"] }));
    // The same rule on both sides: whether they show is the same (where they sit, unknown on both, still fails).
    expect(compareText(supports("display: grid", body), supports("display: grid", body)).unverified.filter((u) => u.what === "shown")).toEqual([]);
  });

  it("fails when whether a link or image shows depends on another condition on each side", () => {
    const body = '<p>Read <a class="offer" href="https://example.com/sale"><img src="https://example.com/a.png" alt=""></a></p>';
    const check = compareText(supports("display: grid", body), supports("display: unsupported", body));
    expect(checkFails(check)).toBe(true);
    expect(checkFails(compareText(supports("display: grid", body), supports("display: grid", body)))).toBe(false);
  });

  it("fails when whether a phone shows words depends on another condition on each side", () => {
    const phone = (condition: string) =>
      page('<p class="offer">Big offer</p>', style(`@media (max-width: 600px) { @supports (${condition}) { .offer { display: none } } }`));
    const check = compareText(phone("display: grid"), phone("display: unsupported"));
    expect(checkFails(check)).toBe(true);
    expect(checkFails(compareText(phone("display: grid"), phone("display: grid")))).toBe(false);
  });

  it("fails where a word sits when neither side can be placed", () => {
    // A flex box's content can't be measured: the column beside it can't be placed, on either side.
    const columns = (first: string, second: string) =>
      page(`${anchor}<table width="600" style="width:600px"><tr><td><div style="display:flex">${first}</div></td><td><div style="display:flex">${second}</div></td></tr></table>`);
    const check = compareText(columns("Left words", "Right words"), columns("Left words", "Right words"));
    expect(check.unverified).toContainEqual(expect.objectContaining({ what: "where it sits" }));
  });
});

describe("layouts where words sit", () => {
  // Each pair moves words a reader sees by more than the check allows: it must fail, as a move or as unverified.
  // (A line that stays where it is on both sides, so a move isn't read as the whole email shifting.)
  const fails = (original: string, migrated: string, head = "") => checkFails(compareText(page(anchor + original, head), page(anchor + migrated, head)));
  const plain = '<div style="width:600px"><p style="margin:0">Your order shipped</p></div>';

  it("a column flex box's items aligned (not stretched), and an item's own alignment there", () => {
    expect(fails('<div style="width:600px;display:flex;flex-direction:column;align-items:center"><p style="margin:0">Your order shipped</p></div>', plain)).toBe(true);
    expect(fails('<div style="width:600px;display:flex;flex-direction:column;align-items:flex-start"><p style="margin:0;text-align:center">Your order shipped</p></div>', '<div style="width:600px"><p style="margin:0;text-align:center">Your order shipped</p></div>')).toBe(true);
    // Stretched (the default), its items are as wide as it: that's block flow, which the check places.
    expect(fails('<div style="width:600px;display:flex;flex-direction:column"><p style="margin:0">Your order shipped</p></div>', plain)).toBe(false);
  });

  it("logical sides: a start padding or margin, auto inline margins, a relative box moved by inset-inline", () => {
    expect(fails('<div style="width:600px"><p style="margin:0;padding-inline-start:200px">Your order shipped</p></div>', plain)).toBe(true);
    expect(fails('<div style="width:600px"><p style="margin:0;margin-inline-start:200px">Your order shipped</p></div>', plain)).toBe(true);
    expect(fails('<div style="width:600px"><p style="margin:0;margin-inline:auto;width:150px;text-align:center">Your order shipped</p></div>', '<div style="width:600px"><p style="margin:0;width:150px;text-align:center">Your order shipped</p></div>')).toBe(true);
    expect(fails('<div style="width:600px"><p style="margin:0;position:relative;inset-inline-start:300px">Your order shipped</p></div>', plain)).toBe(true);
  });

  it("a flex row's gap, place-content, and padding outside a content-box width", () => {
    const row = (css: string) => `<div style="display:flex;width:600px;${css}"><div style="width:150px">First item</div><div style="width:150px">Second item</div></div>`;
    expect(fails(row("gap:300px"), row(""))).toBe(true);
    expect(fails(row("place-content:end"), row(""))).toBe(true);
    const boxed = (css: string) => `<div style="width:300px;margin:0 auto;${css}">Centered words</div>`;
    expect(fails(boxed("padding:0 150px"), boxed("padding:0 150px;box-sizing:border-box"))).toBe(true);
  });

  it("places boxes that shrink to their content one after the other: stacked, the second moves back to the start", () => {
    const button = (text: string) => `<a href="https://example.com/${text}" style="display:inline-block;padding:10px 20px">${text} now</a>`;
    const check = compareText(page(anchor + `<div style="width:600px">${button("Shop all our new arrivals")}${button("Browse")}</div>`), page(anchor + `<div style="width:600px"><div>${button("Shop all our new arrivals")}</div><div>${button("Browse")}</div></div>`));
    expect(check.layout).toEqual([expect.objectContaining({ items: ["Browse", "now"] })]);
    expect(check.layout[0].by).toBeLessThan(-200);
  });

  it("layouts the check doesn't place, the same CSS on both sides: a grid, columns, a box out of the flow, wrapping flex items", () => {
    const kept = [
      '<div style="display:grid;grid-template-columns:1fr 1fr"><p>Left words</p><p>Right words</p></div>',
      '<div style="column-count:2"><p>Left words</p><p>Right words</p></div>',
      '<div style="position:absolute;left:300px"><p>Left words</p></div>',
      '<div style="display:flex;flex-wrap:wrap;width:600px"><div style="width:400px">Left words</div><div style="width:400px">Right words</div></div>',
    ];
    for (const html of kept) expect(compareText(page(html), page(html)).unverified, html).toContainEqual(expect.objectContaining({ what: "where it sits" }));
  });

  it("CSS that changes how words show: a last line's alignment, a list's numbers, an underline drawn transparent", () => {
    expect(fails('<p style="text-align-last:center">Your order shipped</p>', "<p>Your order shipped</p>")).toBe(true);
    expect(fails('<ol style="counter-reset:list-item 41"><li>Your order shipped</li></ol>', "<ol><li>Your order shipped</li></ol>")).toBe(true);
    expect(fails('<p style="text-decoration:underline;text-decoration-color:transparent">Your order shipped</p>', '<p style="text-decoration:underline">Your order shipped</p>')).toBe(true);
  });
});

describe("the font shorthand", () => {
  it("reads its family: one the migration doesn't keep differs", () => {
    const check = compareText(page('<p style="font:14px/20px Georgia, serif">Your order shipped</p>'), page('<p style="font-size:14px;font-family:Arial, sans-serif">Your order shipped</p>'));
    expect(check.styles).toContainEqual(expect.objectContaining({ property: "font", original: "georgia", converted: "arial" }));
    expect(checkFails(compareText(page('<p style="font:italic bold 14px Georgia">Your order shipped</p>'), page('<p style="font-style:italic;font-weight:bold;font-size:14px;font-family:Georgia">Your order shipped</p>')))).toBe(false);
  });
});

describe("what shows, read as the browser does", () => {
  it("applies a media query whose conditions are joined by `or` when one of them holds", () => {
    const hidden = page('<p class="x">Hidden on phones</p>', style("@media (min-width: 1000px) or (max-width: 600px) { .x { display: none } }"));
    const check = compareText(hidden, page("<p>Hidden on phones</p>"));
    expect(check.phone.added).toEqual(["Hidden", "on", "phones"]);
  });

  it("hides a box scaled to nothing (`transform: scale(0)`, `scaleY(0)`, `scale: 0`)", () => {
    for (const css of ["transform: scale(0)", "transform: translateX(4px) scaleY(0)", "scale: 0"]) {
      const check = compareText(page('<p class="x">Hidden on phones</p>', style(`@media (max-width: 600px) { .x { ${css} } }`)), page("<p>Hidden on phones</p>"));
      expect(check.phone.added, css).toEqual(["Hidden", "on", "phones"]);
    }
    // Scaled, not to nothing: shown.
    expect(compareText(page('<p style="transform: scale(0.5)">Shown</p>'), page("<p>Shown</p>")).added).toEqual([]);
  });

  it("shows a closed <details>'s summary alone, and all of an open one", () => {
    const closed = compareText(page("<details><summary>More</summary><p>Folded text</p>Loose words</details>"), page("<p>More</p><p>Folded text</p><p>Loose words</p>"));
    expect(closed.added).toEqual(["Folded", "text", "Loose", "words"]);
    expect(checkFails(compareText(page("<details open><summary>More</summary><p>Folded text</p></details>"), page("<p>More</p><p>Folded text</p>")))).toBe(false);
  });
});
