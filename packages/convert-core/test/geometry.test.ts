import { describe, expect, it } from "vitest";
import { StyledDocument, styledWords } from "../src/cascade";
import { compareLayout, placements, placementOf } from "../src/geometry";
import { compareText } from "../src/verify";

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
    expect(boxes(page('<table width="600" align="center" style="margin-right:auto"><tr><td width="200">Left</td><td>Right</td></tr></table>'))).toEqual(["Left@50+200:left", "Right@250+400:left"]);
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

describe("compareLayout", () => {
  const columns = '<table width="600"><tr><td width="300">Left side</td><td width="300">Right side</td></tr></table>';
  it("finds columns stacked into one: the second column's words moved", () => {
    expect(moved(columns, '<table width="600"><tr><td>Left side</td></tr><tr><td>Right side</td></tr></table>')).toEqual([{ items: ["Right", "side"], by: -300 }]);
  });

  it("finds a block moved to the other side, and centered text that stays centered in a narrower box passes", () => {
    expect(moved('<div style="width:200px;margin-left:auto">Total</div><p>Body</p>', '<div style="width:200px;margin:0 auto">Total</div><p>Body</p>')).toEqual([{ items: ["Total"], by: -250 }]);
    expect(moved('<p style="text-align:center">Hello</p>', '<div style="width:300px;margin:0 auto"><p style="text-align:center">Hello</p></div>')).toEqual([]);
  });

  it("allows the whole email to sit elsewhere (a body margin against a centered email)", () => {
    expect(moved(`<div style="padding-left:8px">${columns}</div>`, `<div style="padding-left:50px">${columns}</div>`)).toEqual([]);
  });
});
