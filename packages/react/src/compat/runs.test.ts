import { describe, expect, it } from "vitest";
import { parseRuns } from "./runs";

const BR = { type: "LineBreak" };

describe("parseRuns()", () => {
  it("reads paragraphs with no margins (legacy's own) as lines one under another, a paragraph of a line break an empty line, an empty one nothing", () => {
    const p = (inner: string) => `<p style="margin: 0px; margin-block-start: 0px; margin-block-end: 0px;">${inner}</p>`;
    expect(parseRuns(p("A") + p("B"))).toEqual({ children: ["A", BR, "B"], left: [] });
    expect(parseRuns(p("A") + p("<br>") + p("B")).children).toEqual(["A", BR, BR, "B"]);
    expect(parseRuns(p("A<br>") + p("") + p("B")).children).toEqual(["A", BR, "B"]);
    expect(parseRuns("<div>A</div><div><br></div>")).toEqual({ children: ["A", BR, BR], left: [] });
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
    expect(parseRuns("&copy; 2024 Acme &mdash; &euro;10 &rsquo;&COPY;")).toEqual({ children: ["© 2024 Acme — €10 ’©"], left: [] });
    // An & that starts no entity is one.
    expect(parseRuns("Tom & Jerry")).toEqual({ children: ["Tom & Jerry"], left: [] });
  });

  it("fails closed on what the browser reads otherwise than it would: comments, entities it doesn't know, paragraphs with margins, space between paragraphs, other targets", () => {
    const left = (html: string) => parseRuns(html).left;
    expect(left("Hello <!-- note --> world")).toContain("a comment or a processing instruction");
    expect(left("a<?php echo 1 ?>b")).toContain("a comment or a processing instruction");
    expect(left("&hearts; &Copy;")).toEqual(["the entity &hearts;", "the entity &Copy;"]);
    expect(left("&copy 2024")).toEqual(["an entity without its semicolon"]);
    expect(left("&#169 2024")).toEqual(["an entity without its semicolon"]);
    // An & followed by a name the browser doesn't read without its semicolon is text.
    expect(parseRuns("S&P 500, AT&T")).toEqual({ children: ["S&P 500, AT&T"], left: [] });
    // Numbers the browser reads as Windows-1252 (128 to 159), none, or a surrogate.
    expect(left("&#150; &#0; &#xD800;")).toHaveLength(3);
    expect(left("<p>One</p><p>Two</p>")).toEqual(["a <p> with the browser's margins", "a <p> with the browser's margins"]);
    expect(left('<p style="margin-top: 0">One</p>')).toEqual(["a <p> with the browser's margins"]);
    expect(left('<p style="margin: 0">One</p>\n<p style="margin: 0">Two</p>')).toEqual(["white space between paragraphs"]);
    expect(left('<a href="https://example.com" target="_parent">Open</a>')).toEqual(['a link opening in "_parent"']);
    expect(left('<a href="https://example.com" rel="nofollow">Open</a>')).toHaveLength(1);
    expect(left('<a href="https://example.com/?a=1&b=2">Open</a>')).toEqual([]);
    expect(left('<a href="https://example.com/?a=1&copy=2">Open</a>')).toEqual(["an entity without its semicolon"]);
  });

  it("keeps a span inside one that sets the same property: an underline around a strike draws both", () => {
    expect(parseRuns("<u><s>both</s></u>").children).toEqual([{ type: "Span", style: { textDecoration: "underline" }, children: [{ type: "Span", style: { textDecoration: "line-through" }, children: ["both"] }] }]);
    expect(parseRuns("<b><i>x</i></b>").children).toEqual([{ type: "Span", style: { fontWeight: 700, fontStyle: "italic" }, children: ["x"] }]);
  });

  it("says what no run holds: markup, a paragraph's own style, a style no run takes, a link with no href", () => {
    expect(parseRuns("<img src=x>").left).toEqual(["<img>"]);
    expect(parseRuns('<p style="text-align: center; margin: 0">A</p>').left).toEqual(["<p> with its own attributes"]);
    expect(parseRuns('<span style="border: 1px solid">A</span>').left).toEqual(["border: 1px solid"]);
    expect(parseRuns("<a>A</a>").left).toHaveLength(1);
    expect(parseRuns('<a href="x">A</a>', { links: false }).left).toEqual(["<a>"]);
    expect(parseRuns('<p style="margin: 0px">A</p>').left).toEqual([]);
    // An attribute with no value is one (a hidden span keeps its legacy HTML).
    expect(parseRuns("<span hidden>never shown</span>").left).toEqual(["<span>"]);
  });

  it("reads, for the builder, what the adapter writes in text: a run's font, superscript and subscript, a link's title and label, a last line break", () => {
    const html = '<sup>2</sup><sub><span style="color:#ff0000">2</span></sub><span style="font-family:\'Courier New\', monospace">c</span><a href="https://x.test" title="T" aria-label="L">x</a>a<br><br>';
    expect(parseRuns(html, { builder: true })).toEqual({
      children: [
        { type: "Span", style: { verticalAlign: "super" }, children: ["2"] },
        { type: "Span", style: { verticalAlign: "sub", color: "#ff0000" }, children: ["2"] },
        { type: "Span", style: { fontFamily: '"Courier New", monospace' }, children: ["c"] },
        { type: "Link", props: { href: "https://x.test", title: "T", "aria-label": "L" }, children: ["x"] },
        "a",
        { type: "LineBreak" },
        { type: "LineBreak" },
      ],
      left: [],
    });
    // Without the option, as legacy is read: each fails closed, and the last line break is the browser's to drop.
    expect(parseRuns(html).left).toEqual(["<sup>", "<sub>", "font-family: 'Courier New', monospace", "a link with no href, or with attributes a Link doesn't take"]);
    expect(parseRuns("a<br><br>").children).toEqual(["a", { type: "LineBreak" }]);
  });

  it("drops, for the builder, a link's rel of noopener and noreferrer only (in any order or case), and fails closed on any other", () => {
    const link = (rel: string, options = { builder: true }) => parseRuns(`<a href="https://x.test" target="_blank" rel="${rel}">x</a>`, options);
    for (const rel of ["noopener", "noreferrer", "noopener noreferrer", " NoReferrer\t noopener "]) {
      expect(link(rel)).toEqual({ children: [{ type: "Link", props: { href: { href: "https://x.test", target: "_blank" } }, children: ["x"] }], left: [] });
    }
    for (const rel of ["nofollow", "noopener nofollow", "sponsored", "ugc", "", "noopener,noreferrer"]) expect(link(rel).left).toEqual(["a link with no href, or with attributes a Link doesn't take"]);
    // Without the option, as legacy is read, any rel fails closed.
    expect(link("noopener", { builder: false }).left).toEqual(["a link with no href, or with attributes a Link doesn't take"]);
  });
});
