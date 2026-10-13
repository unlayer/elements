import { describe, expect, it } from "vitest";
import { compareStyles, StyledDocument, styledWords } from "../src/cascade";
import { compareText, htmlWords } from "../src/verify";

const doc = (css: string, body: string) => `<html><head><style>${css}</style></head><body>${body}</body></html>`;
/** The style of the first word. */
const style = (html: string) => styledWords(html)[0].style;

describe("the cascade", () => {
  it("lets a style attribute beat a rule, !important beat both, and a later declaration beat an earlier one", () => {
    expect(style(doc(".a{color:red}", '<p class="a" style="color:blue">x</p>')).color).toEqual([0, 0, 255, 1]);
    expect(style(doc(".a{color:red !important}", '<p class="a" style="color:blue">x</p>')).color).toEqual([255, 0, 0, 1]);
    expect(style(doc("", '<p style="color:red;color:blue">x</p>')).color).toEqual([0, 0, 255, 1]);
    expect(style(doc(".a{color:red} .a{color:blue}", '<p class="a">x</p>')).color).toEqual([0, 0, 255, 1]);
  });

  it("applies rules by specificity, not by the order of the class attribute", () => {
    expect(style(doc(".muted{color:gray} .alert{color:red}", '<p class="alert muted">x</p>')).color).toEqual([255, 0, 0, 1]);
    expect(style(doc("p.a{color:red} .a{color:blue}", '<p class="a">x</p>')).color).toEqual([255, 0, 0, 1]);
    expect(style(doc("#x{color:red} .a.b{color:blue}", '<p id="x" class="a b">x</p>')).color).toEqual([255, 0, 0, 1]);
  });

  it("reads descendant, child and sibling selectors, attributes and escaped class names", () => {
    expect(style(doc(".card p{color:red}", '<div class="card"><div><p>x</p></div></div>')).color).toEqual([255, 0, 0, 1]);
    expect(style(doc(".card > p{color:red}", '<div class="card"><div><p>x</p></div></div>')).color).toEqual([0, 0, 0, 1]);
    expect(style(doc("h1 + p{color:red}", "<h1>T</h1><p>x</p>")).size).toBe(32);
    expect(styledWords(doc("h1 + p{color:red}", "<h1>T</h1><p>x</p>"))[1].style.color).toEqual([255, 0, 0, 1]);
    expect(style(doc('a[href^="https"]{color:red}', '<a href="https://x.com">x</a>')).color).toEqual([255, 0, 0, 1]);
    expect(style(doc(".sm\\:text-red{color:red}", '<p class="sm:text-red">x</p>')).color).toEqual([255, 0, 0, 1]);
  });

  it("applies media queries that hold at desktop width, never dark mode or phones, and :hover never", () => {
    expect(style(doc("@media (min-width: 600px){p{color:red}}", "<p>x</p>")).color).toEqual([255, 0, 0, 1]);
    expect(style(doc("@media (max-width: 480px){p{color:red}}", "<p>x</p>")).color).toEqual([0, 0, 0, 1]);
    expect(style(doc("@media (prefers-color-scheme: dark){p{color:red}}", "<p>x</p>")).color).toEqual([0, 0, 0, 1]);
    expect(style(doc("p:hover{color:red}", "<p>x</p>")).color).toEqual([0, 0, 0, 1]);
  });

  it("leaves a property unknown when a rule it can't place could set it, and says which rule", () => {
    expect(style(doc("@media (orientation: landscape){p{color:red}}", "<p>x</p>")).color).toBeUndefined();
    expect(style(doc("p:has(b){color:red}", "<p>x</p>")).color).toBeUndefined();
    expect(style(doc("p:has(b){color:red}", "<p>x</p>")).causes?.color).toContain("p:has(b)");
    expect(style(doc("p{color:color-mix(in srgb, red 40%, blue)}", "<p>x</p>")).color).toBeUndefined();
    // A value the property can't take is dropped, as the browser drops it: an earlier one applies.
    expect(style(doc("p{color:calc(1)}", "<p>x</p>")).color).toEqual([0, 0, 0, 1]);
    expect(style(doc("p{color:#ff0000; color:not-a-color}", "<p>x</p>")).color).toEqual([255, 0, 0, 1]);
    // A rule it can't place that would set the same value changes nothing.
    expect(style(doc("p{color:#333} p:has(b){color:#333}", "<p>x</p>")).color).toEqual([51, 51, 51, 1]);
    // A selector this can't fully read still can't reach elements its known parts rule out.
    expect(style(doc(".other:nth-child(1){color:red}", "<p>x</p>")).color).toEqual([0, 0, 0, 1]);
    // An inline style that wins anyway stays known.
    expect(style(doc("@media (orientation: landscape){p{color:red}}", '<p style="color:blue !important">x</p>')).color).toEqual([0, 0, 255, 1]);
  });

  it("reads what React Email writes: Tailwind's sm: as @media nested in the rule (range syntax), at the width read", () => {
    const css = ".sm_block{@media (width>=40rem){display:block!important}}.sm_hidden{@media (width>=40rem){display:none!important}}.sm_text-white{@media (width>=40rem){color:rgb(255,255,255)!important}}";
    const html = doc(css, '<p class="sm_block" style="display:none">Desktop only</p><p class="sm_hidden">Phone only</p><p class="sm_text-white" style="color:rgb(0,0,0)">Swap</p>');
    expect(htmlWords(html)).toEqual(["Desktop", "only", "Swap"]);
    expect(styledWords(html)[2].style.color).toEqual([255, 255, 255, 1]);
    expect(new StyledDocument(html, { width: 375 }).words().map((w) => w.word)).toEqual(["Phone", "only", "Swap"]);
  });

  it("drops a rule whose selector the browser can't read (React writes `.footer > p` in a <style> as `.footer &gt; p`)", () => {
    expect(style(doc(".footer &gt; p{font-weight:bold}", '<div class="footer"><p>x</p></div>')).bold).toBe(false);
  });

  it("reads :not(), :nth-child() and the other structural pseudo-classes", () => {
    const html = doc("p:not(.muted){color:red} li:nth-child(2n){font-style:italic} li:last-of-type{text-transform:uppercase}", '<p class="muted">a</p><p>b</p><ul><li>c</li><li>d</li><li>e</li></ul>');
    const words = styledWords(html);
    expect(words.map((w) => w.style.color?.[0])).toEqual([0, 255, 0, 0, 0]);
    expect(words.map((w) => w.style.italic)).toEqual([false, false, false, true, false]);
    expect(words[4].style.transform).toBe("uppercase");
  });

  it("hides only the text a font size of 0 sets, not a child with a size of its own", () => {
    expect(htmlWords(doc("", '<div style="font-size:0">gap<span style="font-size:14px">Shown</span></div>'))).toEqual(["Shown"]);
  });

  it("ignores Outlook-only markup", () => {
    expect(htmlWords('<!--[if mso]><table><tr><td>Outlook only</td></tr></table><![endif]--><p>Everyone</p>')).toEqual(["Everyone"]);
    expect(htmlWords("<v:roundrect><v:textbox>Button</v:textbox></v:roundrect><p>Everyone</p>")).toEqual(["Everyone"]);
  });
});

describe("text styles", () => {
  it("inherit size, weight, italics, letter case and color, and resolve em, rem and % against the parent", () => {
    const words = styledWords(doc("", '<div style="font-size:20px;font-style:italic;text-transform:uppercase;color:#e11d48"><div style="font-size:2em"><h1>Big</h1></div><span style="font-size:50%">half</span></div>'));
    expect(words[0].style).toMatchObject({ size: 80, bold: true, italic: true, transform: "uppercase", color: [225, 29, 72, 1] });
    expect(words[1].style.size).toBe(10);
    expect(style(doc("", '<p style="font-size:1.5rem">x</p>')).size).toBe(24);
  });

  it("gives headings, bold, italic and underlined tags the browser's defaults, which a body weight doesn't undo", () => {
    expect(style(doc("", '<body style="font-weight:400"><h1>T</h1></body>'))).toMatchObject({ size: 32, bold: true });
    expect(style(doc("", "<p><b>x</b></p>")).bold).toBe(true);
    expect(style(doc("", "<p><em>x</em></p>")).italic).toBe(true);
    expect(style(doc("", "<p><u>x</u></p>")).underline).toBe(true);
    expect(style(doc("", '<h2 style="font-weight:400">x</h2>')).bold).toBe(false);
  });

  it("underlines a link unless its own style says not to, and reads its target (_self when it sets none)", () => {
    expect(style(doc("", '<a href="https://x.com">x</a>'))).toMatchObject({ underline: true, color: [0, 0, 238, 1], target: "_self" });
    expect(style(doc("", '<a href="https://x.com" target="_blank" style="text-decoration:none;color:#111111">x</a>'))).toMatchObject({ underline: false, target: "_blank" });
    expect(style(doc("", "<p>x</p>")).target).toBeUndefined();
  });

  it("composites the backgrounds behind text, from bgcolor too, and leaves it unknown over an image", () => {
    expect(style(doc("", '<div style="background-color:#000000"><div style="background:rgba(255,255,255,0.5)"><p>x</p></div></div>')).background?.map(Math.round)).toEqual([128, 128, 128, 1]);
    expect(style(doc("", '<table bgcolor="#fff4c8"><tr><td>x</td></tr></table>')).background).toEqual([255, 244, 200, 1]);
    expect(style(doc("", '<div style="background:url(a.png) #ff0000"><p>x</p></div>')).background).toBeUndefined();
  });

  it("reads a gradient of written-out opaque colors as its first stop; one from variables or translucent stops is unknown", () => {
    expect(style(doc("", '<div style="background:linear-gradient(135deg,#1e3a8a,#312e81)"><p>x</p></div>')).background).toEqual([30, 58, 138, 1]);
    expect(style(doc("", '<div style="background-image:linear-gradient(to right, rgb(79,70,229), rgb(147,51,234))"><p>x</p></div>')).background).toEqual([79, 70, 229, 1]);
    // Variables that aren't set: the declaration is invalid, so it draws nothing (what React Email's Tailwind gradients do).
    expect(style(doc("", '<div style="background-image:linear-gradient(var(--tw-gradient-from) var(--tw-gradient-from-position), var(--tw-gradient-to))"><p>x</p></div>')).background).toEqual([255, 255, 255, 1]);
    // Set ones are read.
    expect(style(doc("", '<div style="--from:#1e3a8a;background-image:linear-gradient(var(--from), #312e81)"><p>x</p></div>')).background).toEqual([30, 58, 138, 1]);
    expect(style(doc("", '<div style="background:linear-gradient(rgba(0,0,0,0.5),transparent)"><p>x</p></div>')).background).toBeUndefined();
  });

  it("puts the text on <html>'s background, and gives it <html>'s color", () => {
    expect(style('<html style="background-color:#111111;color:#eeeeee"><body><p>x</p></body></html>')).toMatchObject({ background: [17, 17, 17, 1], color: [238, 238, 238, 1] });
  });

  it("leaves monospace text's size unknown unless set (browsers show it at 13px)", () => {
    expect(style(doc("", "<p><code>x</code></p>")).size).toBeUndefined();
    expect(style(doc("", '<p><code style="font-size:14px">x</code></p>')).size).toBe(14);
  });
});

describe("hidden text", () => {
  it("isn't read: display:none, the hidden attribute, a box that clips to nothing, visibility:hidden, opacity 0", () => {
    expect(htmlWords(doc("", '<p>A</p><p hidden>B</p><div style="max-height:0;overflow:hidden">C</div><div style="height:0px;overflow:hidden">D</div><p style="opacity:0">E</p><p style="visibility:hidden">F</p>'))).toEqual(["A"]);
  });

  it("isn't read when only screen readers get it: sr-only (clipped to nothing) or placed far off the page", () => {
    const srOnly = "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0, 0, 0, 0);white-space:nowrap;border-width:0";
    expect(htmlWords(doc(".sr-only{" + srOnly + "}", `<p>A</p><span class="sr-only">B</span><span style="position:absolute;left:-9999px">C</span><span style="position:absolute;clip-path:inset(50%)">D</span><span style="position:relative;left:-9999px">E</span>`))).toEqual(["A", "E"]);
  });

  it("isn't read when a rule hides it: a class, compound selectors, a class on a parent, at desktop width", () => {
    expect(htmlWords(doc(".footer .legacy{display:none} p.old{display:none} #promo{display:none} .v{visibility:hidden}", '<div class="footer"><p class="legacy">A</p></div><p class="old">B</p><p id="promo">C</p><p class="v">D</p><p>E</p>'))).toEqual(["E"]);
    expect(htmlWords(doc("@media (min-width: 481px){.hide-desktop{display:none !important}}", '<p class="hide-desktop">A</p><p>B</p>'))).toEqual(["B"]);
    expect(htmlWords(doc("@media (max-width: 480px){.hide-mobile{display:none !important}}", '<p class="hide-mobile">A</p><p>B</p>'))).toEqual(["A", "B"]);
  });

  it("is read again where it's shown: a visible child of a visibility:hidden parent, or the parent's own display set", () => {
    expect(htmlWords(doc("", '<div style="visibility:hidden">A <span style="visibility:visible">B</span></div>'))).toEqual(["B"]);
    expect(htmlWords(doc(".hide{display:none}", '<p class="hide" style="display:block">A</p>'))).toEqual(["A"]);
    expect(htmlWords('<p hidden style="display:block">A</p>')).toEqual(["A"]);
  });
});

describe("compareStyles", () => {
  it("finds a word shown in another style, grouped by change, and nothing when only unknown properties differ", () => {
    const original = doc("", '<p style="color:#e11d48;font-style:italic">Hello world</p><p>Same</p>');
    const converted = doc("", '<p style="color:#000000">Hello world</p><p>Same</p>');
    const check = compareStyles(original, converted);
    expect(check.differences).toEqual([
      { property: "italic", original: "italic", converted: "not italic", words: ["Hello", "world"] },
      { property: "color", original: "#e11d48", converted: "#000000", words: ["Hello", "world"] },
    ]);
    expect(check.compared).toBe(3);
    expect(compareStyles(doc("p:has(b){color:red}", "<p>Hi</p>"), doc("", '<p style="color:red">Hi</p>')).differences).toEqual([]);
  });

  it("allows a pixel of size and a little color rounding", () => {
    expect(compareStyles(doc("", '<p style="font-size:14px;color:rgb(16,59,5)">x</p>'), doc("", '<p style="font-size:14.5px;color:#103b06">x</p>')).differences).toEqual([]);
  });

  it("doesn't compare the preview text's styles (inboxes list it, but it isn't shown)", () => {
    const preview = (style: string) => `<div data-skip-in-text="true" style="display:none;${style}">Welcome</div><p>Hi</p>`;
    expect(compareStyles(preview("font-size:1px;color:#ffffff"), preview("")).differences).toEqual([]);
  });

  it("reports a background lost behind text, and a link that opens elsewhere", () => {
    const panel = (bg: string) => `<table><tr><td style="background-color:${bg}"><p>Panel copy</p></td></tr></table><a href="https://x.com">Learn</a>`;
    const changed = compareStyles(panel("#fff4c8"), panel("#ffffff").replace('href="https://x.com"', 'href="https://x.com" target="_blank"'));
    expect(changed.differences.map((d) => `${d.property}: ${d.original} → ${d.converted}`)).toEqual(["background: #fff4c8 → #ffffff", "target: _self → _blank"]);
  });

  it("reports light text whose gradient or image behind it was lost, and nothing when it's kept or filled with the gradient's color", () => {
    const card = (bg: string) => `<table><tr><td style="${bg}"><p style="color:#ffffff">Welcome aboard</p></td></tr></table>`;
    const changes = (original: string, converted: string) => compareStyles(card(original), card(converted)).differences.map((d) => `${d.property}: ${d.original} → ${d.converted}`);
    expect(changes("background:linear-gradient(135deg,#1e3a8a,#312e81)", "")).toEqual(["background: #1e3a8a → #ffffff"]);
    expect(changes("background:linear-gradient(135deg,#1e3a8a,#312e81)", "background-color:#1e3a8a")).toEqual([]);
    expect(changes("background:#0b1020 url(https://x.com/night.jpg)", "")).toEqual(["background: an image on #0b1020 → #ffffff"]);
    // No color under the image: white text on it is lost on white.
    expect(changes("background-image:url(https://x.com/night.jpg)", "")).toEqual(["background: an image → #ffffff"]);
    expect(changes("background:#0b1020 url(https://x.com/night.jpg)", "background:#0b1020 url(https://x.com/night.jpg)")).toEqual([]);
    // Without the image, on the color under it: as the original shows where images don't load.
    expect(changes("background:#0b1020 url(https://x.com/night.jpg)", "background-color:#0b1020")).toEqual([]);
    // A box with its own color in front of the image covers it: nothing to lose.
    const covered = (inner: string) => `<div style="background:url(https://x.com/a.jpg)"><div style="background-color:${inner}"><p>Covered</p></div></div>`;
    expect(compareStyles(covered("#eeeeee"), `<div style="background-color:#eeeeee"><p>Covered</p></div>`).differences).toEqual([]);
  });

  it("accepts on a gradient that fades any color it shows behind the text, and nothing else", () => {
    const glow = (bg: string) => `<div style="background-color:#111111"><div style="${bg}"><p style="color:#ffffff">Glow</p></div></div>`;
    const fades = "background-image:radial-gradient(circle at bottom right, rgb(251,122,0) 0%, transparent 60%)";
    expect(compareStyles(glow(fades), glow("")).differences).toEqual([]);
    expect(compareStyles(glow(fades), `<p style="color:#ffffff">Glow</p>`).differences.map((d) => d.property)).toEqual(["background"]);
  });

  it("says what it couldn't verify, on which side and why, and nothing when both sides are unknown the same way", () => {
    const original = doc("p:has(b){color:red}", "<p>Hello there</p>");
    const check = compareStyles(original, doc("", "<p>Hello there</p>"));
    expect(check.unverified).toEqual([{ what: "color", side: "original", cause: expect.stringContaining("p:has(b)"), words: ["Hello", "there"] }]);
    // The migration writing a value the check can't read.
    expect(compareStyles(doc("", "<p>Hi</p>"), doc("", '<p style="color:color-mix(in srgb, red 40%, blue)">Hi</p>')).unverified).toEqual([{ what: "color", side: "migrated", cause: "color: color-mix(in srgb, red 40%, blue)", words: ["Hi"] }]);
    // Markup kept as it was: unknown on both sides, nothing to report.
    expect(compareStyles(original, original).unverified).toEqual([]);
    // Whether it's shown, when a rule it can't place may hide it.
    expect(compareStyles(doc("p:has(b){display:none}", "<p>Hi</p>"), doc("", "<p>Hi</p>")).unverified.map((u) => u.what)).toEqual(["shown"]);
  });

  it("reads an unset variable as the browser does: the declaration is dropped", () => {
    expect(compareStyles(doc("p{color:var(--x)}", '<div style="color:#333333"><p>Hi</p></div>'), doc("", '<p style="color:#333333">Hi</p>')).differences).toEqual([]);
  });

  it("is part of the content check, only when the words are the same", () => {
    expect(compareText('<p style="text-transform:uppercase">Track it</p>', "<p>Track it</p>").styles).toEqual([{ property: "transform", original: "uppercase", converted: "none", words: ["Track", "it"] }]);
    expect(compareText("<p>Track it</p>", "<p>Track</p>").styles).toEqual([]);
  });

  it("compares what phones show too: content a phone rule shows, lost in the migration", () => {
    const original = doc("@media (max-width: 480px){.only-phone{display:block !important}}", '<p>Both</p><p class="only-phone" style="display:none">Phone</p>');
    const check = compareText(original, doc("", "<p>Both</p>"));
    expect([check.missing, check.phone]).toEqual([[], { missing: ["Phone"], added: [] }]);
    expect(compareText(original, original).phone).toEqual({ missing: [], added: [] });
  });
});
