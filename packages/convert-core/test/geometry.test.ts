import { describe, expect, it } from "vitest";
import { StyledDocument, styledWords } from "../src/cascade";
import { compareLayout, placements, placementOf } from "../src/geometry";
import { checkFails, compareText } from "../src/verify";

const page = (body: string) => `<html><body style="margin:0">${body}</body></html>`;
/** Where each word's line lines up: its box and alignment. */
function boxes(html: string) {
  const doc = new StyledDocument(html);
  const map = placements(doc);
  return styledWords(doc).map((w) => {
    const p = placementOf(map, w.at!)!;
    return `${w.word}@${Math.round(p.x)}+${Math.round(p.width)}:${p.align}`;
  });
}
const moved = (a: string, b: string) => compareText(page(a), page(b)).layout;

describe("where text sits across the page", () => {
  it("puts table cells side by side, sharing what widths leave, and centers a table by align (CSS overrides only the sides it sets)", () => {
    expect(boxes(page('<table width="600" cellspacing="0" align="center" style="margin-right:auto"><tr><td width="200">Left</td><td>Right</td></tr></table>'))).toEqual(["Left@50+200:left", "Right@250+400:left"]);
  });

  it("reads Elements' columns: cells straight in a display:table box, sized by their width", () => {
    const row = '<div style="max-width:600px;margin:0 auto"><div style="display:table;width:100%"><div style="display:table-cell;width:200px">One</div><div style="display:table-cell;width:400px">Two</div></div></div>';
    expect(boxes(page(row))).toEqual(["One@50+200:left", "Two@250+400:left"]);
  });

  it("lines up a button that shrinks to its text by its line's alignment, not its own", () => {
    expect(boxes(page('<div style="text-align:center"><a style="display:inline-block;text-align:left;max-width:100%">Go</a></div>'))[0]).toMatch(/:center$/);
  });

  it("places a block by its auto margins: one side auto puts it on the other", () => {
    expect(boxes(page('<div style="width:200px;margin-left:auto;margin-right:0">Right</div>'))).toEqual(["Right@500+200:left"]);
  });
});

describe("cells without a width, beside others", () => {
  const receipt = '<table width="600" style="font:14px Arial"><tr><td>Order</td><td>#A-1001, placed January 4, 2026, paid with Visa ending 4242</td></tr></table>';
  it("are as wide as their content makes them, as the browser's automatic table layout does", () => {
    // Chromium puts the value's column at 54px: its words start where the label's short column ends.
    const [label, value] = boxes(page(receipt));
    expect(Number(/\+(\d+)/.exec(label)![1])).toBeLessThan(70);
    expect(Number(/@(\d+)/.exec(value)![1])).toBeLessThan(70);
  });

  it("show a label beside its value given half the row as moved, and content-sized columns as in place", () => {
    const cells = (a: number, b: number) =>
      `<div style="display:table;width:600px;font:14px Arial"><div style="display:table-cell;width:${a}px">Order</div><div style="display:table-cell;width:${b}px">#A-1001, placed January 4, 2026, paid with Visa ending 4242</div></div>`;
    expect(moved(receipt, cells(300, 300)).length).toBeGreaterThan(0);
    expect(moved(receipt, cells(51, 549))).toEqual([]);
  });

  it("hold an image without a px width at any size: text beside it whose place depends on the image's own size fails", () => {
    const original = '<table width="600"><tr><td><img src="https://example.com/a.png" alt=""></td><td>Beside the image</td></tr></table>';
    const migrated = '<div style="display:table;width:600px"><div style="display:table-cell;width:300px"><img src="https://example.com/a.png" alt=""></div><div style="display:table-cell;width:300px">Beside the image</div></div>';
    expect(checkFails(compareText(page(original), page(migrated)))).toBe(true);
  });

  it("pass text whose place doesn't depend on an image's own size (a long line beside a fixed-width image)", () => {
    const stars = '<img src="https://example.com/star.gif" style="display:inline-block">'.repeat(5);
    const text = "Your reviews will be posted on Amazon using your public name, check your public name before you post";
    const original = `<table width="600" style="font:14px Arial"><tr><td><img src="https://example.com/book.jpg" width="274"></td><td>${stars}<p>${text}</p></td></tr></table>`;
    const migrated = `<div style="display:table;width:600px;font:14px Arial"><div style="display:table-cell;width:274px"><img src="https://example.com/book.jpg" width="274"></div><div style="display:table-cell;width:326px">${stars}<p>${text}</p></div></div>`;
    expect(checkFails(compareText(page(original), page(migrated)))).toBe(false);
  });

  it("leave where their words sit unverified where their content can't be measured (a flex box)", () => {
    const original = '<table width="600"><tr><td><div style="display:flex"><span>One</span><span>Two</span></div></td><td>Beside the box</td></tr></table>';
    const migrated = '<div style="display:table;width:600px"><div style="display:table-cell;width:300px"><div style="display:flex"><span>One</span><span>Two</span></div></div><div style="display:table-cell;width:300px">Beside the box</div></div>';
    expect(compareText(page(original), page(migrated)).unverified).toContainEqual(expect.objectContaining({ what: "where it sits", side: "original" }));
  });
});

describe("layout inputs", () => {
  it("spaces a row's cells by border-spacing, the cellspacing attribute or the browser's 2px, unless borders collapse", () => {
    const row = (attrs: string, css = "") => boxes(page(`<table width="600" ${attrs} style="${css}"><tr><td width="200">Left</td><td>Right</td></tr></table>`));
    expect(row('cellspacing="0"')).toEqual(["Left@0+200:left", "Right@200+400:left"]);
    expect(row("")).toEqual(["Left@2+200:left", "Right@204+394:left"]);
    expect(row('cellspacing="20"')).toEqual(["Left@20+200:left", "Right@240+340:left"]);
    expect(row('cellspacing="20"', "border-spacing:50px")).toEqual(["Left@50+200:left", "Right@300+250:left"]);
    expect(row('cellspacing="20"', "border-collapse:collapse")).toEqual(["Left@0+200:left", "Right@200+400:left"]);
  });

  it("adds padding and borders outside a width set on the content box, but a table's or one set to border-box", () => {
    const centered = (css: string) => boxes(page(`<div style="width:300px;margin:0 auto;${css}">Centered box</div>`));
    // 700px across: 300px plus 200px of padding, centered.
    expect(centered("padding:0 100px")).toEqual(["Centered@200+300:left", "box@200+300:left"]);
    expect(centered("padding:0 100px;box-sizing:border-box")).toEqual(["Centered@300+100:left", "box@300+100:left"]);
  });

  it("reads the logical sides: an inline start is the left, the right right to left", () => {
    expect(boxes(page('<p style="padding-inline-start:200px;margin:0">Indented</p>'))).toEqual(["Indented@200+500:left"]);
    expect(boxes(page('<div dir="rtl"><p style="margin-inline-start:200px;margin-block:0">Indented</p></div>'))).toEqual(["Indented@0+500:right"]);
    // Set beside a physical side to another value: which wins isn't told.
    expect(compareText(page('<p style="padding-left:10px;padding-inline-start:200px">Indented</p>'), page('<p style="padding-left:200px">Indented</p>')).unverified).toContainEqual(expect.objectContaining({ what: "where it sits" }));
  });

  it("shares a fixed table layout's width equally, whatever the cells hold; a later row set otherwise is unknown", () => {
    const fixed = (rows: string) => page(`<table width="600" cellspacing="0" style="table-layout:fixed">${rows}</table>`);
    expect(boxes(fixed('<tr><td>Short</td><td>A much longer cell of text that auto layout would widen</td></tr>'))[0]).toBe("Short@0+300:left");
    const map = placements(new StyledDocument(fixed('<tr><td width="100">A</td><td>B</td></tr><tr><td width="500">Later</td><td>Row</td></tr>')));
    expect([...map].filter(([, p]) => p.unknown).map(([e]) => (e as { tagName: string }).tagName)).toContain("td");
  });

  it("puts a flex row's gap between its items, and reads place-content as justify-content", () => {
    expect(boxes(page('<div style="display:flex;gap:100px;width:600px"><div style="width:200px">One</div><div style="width:200px">Two</div></div>'))).toEqual(["One@0+200:left", "Two@300+200:left"]);
    expect(boxes(page('<div style="display:flex;place-content:center;width:600px"><div style="width:200px">One</div></div>'))).toEqual(["One@200+200:left"]);
  });
});

describe("compareLayout", () => {
  const columns = '<table width="600" cellspacing="0"><tr><td width="300">Left side</td><td width="300">Right side</td></tr></table>';
  it("finds columns stacked into one: the second column's words moved", () => {
    expect(moved(columns, '<table width="600" cellspacing="0"><tr><td>Left side</td></tr><tr><td>Right side</td></tr></table>')).toEqual([{ items: ["Right", "side"], by: -300 }]);
  });

  it("finds a block moved to the other side, and centered text that stays centered in a narrower box passes", () => {
    expect(moved('<div style="width:200px;margin-left:auto">Total</div><p>Body</p>', '<div style="width:200px;margin:0 auto">Total</div><p>Body</p>')).toEqual([{ items: ["Total"], by: -250 }]);
    expect(moved('<p style="text-align:center">Hello</p>', '<div style="width:300px;margin:0 auto"><p style="text-align:center">Hello</p></div>')).toEqual([]);
  });

  it("allows the whole email to sit elsewhere (a body margin against a centered email)", () => {
    expect(moved(`<div style="padding-left:8px">${columns}</div>`, `<div style="padding-left:50px">${columns}</div>`)).toEqual([]);
  });
});
