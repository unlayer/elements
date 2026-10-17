import { describe, it, expect } from "vitest";
import {
  textToTextJson,
  htmlToTextJson,
  generateHtmlFromTextJson,
  textJsonToText,
  EMPTY_TEXT_JSON,
} from "./lexical-helpers";

// The inline margin reset every exported <p> must carry, matching the
// editor's exported paragraphs (email clients strip head resets).
const P_MARGIN_RESET =
  "margin: 0px; margin-block-start: 0px; margin-block-end: 0px;";

describe("generateHtmlFromTextJson", () => {
  it("renders a plain paragraph with the inline margin reset", () => {
    const html = generateHtmlFromTextJson(textToTextJson("Hello world"));
    expect(html).toBe(`<p style="${P_MARGIN_RESET}">Hello world</p>`);
  });

  it("renders an empty paragraph as <br> with the margin reset", () => {
    const html = generateHtmlFromTextJson(EMPTY_TEXT_JSON);
    expect(html).toBe(`<p style="${P_MARGIN_RESET}"><br></p>`);
  });

  it("resets margins on every paragraph of multi-paragraph text", () => {
    const json = JSON.stringify({
      root: {
        children: [
          {
            children: [
              { text: "First", type: "extended-text", format: 0 },
            ],
            type: "extended-paragraph",
          },
          {
            children: [
              { text: "Second", type: "extended-text", format: 0 },
            ],
            type: "extended-paragraph",
          },
        ],
        type: "root",
      },
    });
    const html = generateHtmlFromTextJson(json);
    expect(html.match(/<p /g)).toHaveLength(2);
    expect(html.match(new RegExp(P_MARGIN_RESET, "g"))).toHaveLength(2);
  });

  it("keeps custom paragraph styles ahead of the margin reset", () => {
    const json = JSON.stringify({
      root: {
        children: [
          {
            children: [{ text: "Styled", type: "text", format: 0 }],
            type: "extended-paragraph",
            style: "background-color: red;",
          },
        ],
        type: "root",
      },
    });
    expect(generateHtmlFromTextJson(json)).toBe(
      `<p style="background-color: red; ${P_MARGIN_RESET}">Styled</p>`
    );
  });

  it("applies dir, indent and string-format alignment like the editor", () => {
    const json = JSON.stringify({
      root: {
        children: [
          {
            children: [{ text: "Hi", type: "text", format: 0 }],
            type: "extended-paragraph",
            direction: "rtl",
            indent: 2,
            format: "center",
          },
        ],
        type: "root",
      },
    });
    expect(generateHtmlFromTextJson(json)).toBe(
      `<p dir="rtl" style="margin: 0px; margin-block-start: 0px; ` +
        `margin-block-end: 0px; padding-inline-start: 80px; text-align: center;">Hi</p>`
    );
  });

  it("maps legacy numeric paragraph format to text-align", () => {
    const json = JSON.stringify({
      root: {
        children: [
          {
            children: [{ text: "Hi", type: "text", format: 0 }],
            type: "paragraph",
            format: 3,
          },
        ],
        type: "root",
      },
    });
    expect(generateHtmlFromTextJson(json)).toContain("text-align: right;");
  });

  it("exports inline-tool paragraphs as <span> without block styling", () => {
    const json = JSON.stringify({
      root: {
        children: [
          {
            children: [{ text: "Heading text", type: "text", format: 0 }],
            type: "extended-paragraph",
            isInlineTool: true,
          },
        ],
        type: "root",
      },
    });
    expect(generateHtmlFromTextJson(json)).toBe("<span>Heading text</span>");
  });

  it("preserves inline formatting inside the paragraph", () => {
    const json = JSON.stringify({
      root: {
        children: [
          {
            children: [{ text: "bold", type: "extended-text", format: 1 }],
            type: "extended-paragraph",
          },
        ],
        type: "root",
      },
    });
    expect(generateHtmlFromTextJson(json)).toBe(
      `<p style="${P_MARGIN_RESET}"><strong>bold</strong></p>`
    );
  });

  it("leaves the htmlToTextJson raw passthrough untouched", () => {
    const html = "<p>user supplied</p>";
    expect(generateHtmlFromTextJson(htmlToTextJson(html))).toBe(html);
  });

  it("drops non-whitelisted paragraph direction values (attribute injection guard)", () => {
    const json = JSON.stringify({
      root: {
        children: [
          {
            children: [{ text: "Hi", type: "text", format: 0 }],
            type: "extended-paragraph",
            direction: '" onmouseover="alert(1)',
          },
        ],
        type: "root",
      },
    });
    const html = generateHtmlFromTextJson(json);
    expect(html).not.toContain("onmouseover");
    expect(html).toBe(`<p style="${P_MARGIN_RESET}">Hi</p>`);
  });

  it("whitelists heading dir and tag (attribute/tag injection guard)", () => {
    const mk = (heading: Record<string, unknown>) =>
      JSON.stringify({
        root: {
          children: [
            { children: [{ text: "Hi", type: "text", format: 0 }], type: "heading", ...heading },
          ],
          type: "root",
        },
      });

    expect(generateHtmlFromTextJson(mk({ tag: "h2", direction: "rtl" }))).toBe(
      '<h2 dir="rtl">Hi</h2>'
    );
    expect(generateHtmlFromTextJson(mk({ tag: "h2", direction: 'x" onload="1' }))).toBe(
      "<h2>Hi</h2>"
    );
    expect(generateHtmlFromTextJson(mk({ tag: 'h1 onclick="alert(1)"' }))).toBe(
      "<h1>Hi</h1>"
    );
  });
});

describe("textJsonToText", () => {
  it("writes plain text as the text block holds it: escaped, in no paragraph, its quotes kept", () => {
    expect(textJsonToText(textToTextJson('Fish & "chips" <b>'))).toBe('Fish &amp; "chips" &lt;b&gt;');
    expect(textJsonToText(EMPTY_TEXT_JSON)).toBe("");
  });

  it("keeps HTML given as it is", () => {
    expect(textJsonToText(htmlToTextJson('H<sub>2</sub>O <span style="font-size: 40px">$20</span>'))).toBe('H<sub>2</sub>O <span style="font-size: 40px">$20</span>');
  });

  it("writes formatting, links and several paragraphs as their HTML (generateHtmlFromTextJson's)", () => {
    const rich = JSON.stringify({ root: { type: "root", children: [{ type: "paragraph", children: [{ type: "text", text: "Bold", format: 1 }] }] } });
    const two = JSON.stringify({ root: { type: "root", children: [{ type: "paragraph", children: [{ type: "text", text: "One" }] }, { type: "paragraph", children: [{ type: "text", text: "Two" }] }] } });
    const aligned = JSON.stringify({ root: { type: "root", children: [{ type: "paragraph", format: "center", children: [{ type: "text", text: "Mid" }] }] } });
    for (const json of [rich, two, aligned]) expect(textJsonToText(json)).toBe(generateHtmlFromTextJson(json));
    expect(textJsonToText(rich)).toBe(`<p style="${P_MARGIN_RESET}"><strong>Bold</strong></p>`);
  });

  it("is empty for JSON it can't read", () => {
    expect(textJsonToText("{")).toBe("");
    expect(textJsonToText("{}")).toBe("");
  });
});
