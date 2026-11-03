import { describe, expect, it } from "vitest";
import { parseRuns } from "./runs";

const BR = { type: "LineBreak" };

describe("parseRuns()", () => {
  it("reads paragraphs as lines one under another, a paragraph of a line break an empty line, an empty one nothing", () => {
    expect(parseRuns("<p>A</p><p>B</p>").children).toEqual(["A", BR, "B"]);
    expect(parseRuns("<p>A</p><p><br></p><p>B</p>").children).toEqual(["A", BR, BR, "B"]);
    expect(parseRuns("<p>A<br></p><p></p><p>B</p>").children).toEqual(["A", BR, "B"]);
    expect(parseRuns("<p>A</p><p><br></p>").children).toEqual(["A", BR, BR]);
  });

  it("reads bold as the browser draws it, bolder than the text around it; italics, underlines, strikes and spans", () => {
    expect(parseRuns("a <b>b</b>").children).toEqual(["a ", { type: "Span", style: { fontWeight: 700 }, children: ["b"] }]);
    expect(parseRuns("<strong>b</strong>", { weight: 700 }).children).toEqual([{ type: "Span", style: { fontWeight: 900 }, children: ["b"] }]);
    expect(parseRuns('<i>i</i><u>u</u><s>s</s><span style="color: #f00; font-size: 12px">x</span>').children).toEqual([
      { type: "Span", style: { fontStyle: "italic" }, children: ["i"] },
      { type: "Span", style: { textDecoration: "underline" }, children: ["u"] },
      { type: "Span", style: { textDecoration: "line-through" }, children: ["s"] },
      { type: "Span", style: { color: "#f00", fontSize: 12 }, children: ["x"] },
    ]);
  });

  it("reads links with their target and style", () => {
    expect(parseRuns('<a href="https://example.com" target="_blank" style="color: #0a0">go</a>').children).toEqual([
      { type: "Link", props: { href: { href: "https://example.com", target: "_blank" } }, style: { color: "#0a0" }, children: ["go"] },
    ]);
  });

  it("decodes entities, keeping a non-breaking space and white space as written", () => {
    expect(parseRuns("A &amp; B&nbsp;C\nD &#169;").children).toEqual(["A & B C\nD ©"]);
  });

  it("says what no run holds: markup, a paragraph's own style, a style no run takes, a link with no href", () => {
    expect(parseRuns("<img src=x>").left).toEqual(["<img>"]);
    expect(parseRuns('<p style="text-align: center">A</p>').left).toHaveLength(1);
    expect(parseRuns('<span style="border: 1px solid">A</span>').left).toEqual(["border: 1px solid"]);
    expect(parseRuns("<a>A</a>").left).toHaveLength(1);
    expect(parseRuns('<a href="x">A</a>', { links: false }).left).toEqual(["<a>"]);
    expect(parseRuns('<p style="margin: 0px">A</p>').left).toEqual([]);
  });
});
