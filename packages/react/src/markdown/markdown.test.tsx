import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { Column, Email, Row, renderToHtml, renderToJson, renderToPlainText } from "../index";
import { Markdown, safeUrl, sanitizeHtml, type MarkdownProps } from "./index";

let warn: MockInstance;
beforeEach(() => {
  warn = vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => warn.mockRestore());

const email = (props: MarkdownProps) => (
  <Email>
    <Row>
      <Column>
        <Markdown {...props} />
      </Column>
    </Row>
  </Email>
);
/** The design's blocks: their type and the value each is about. */
const blocks = (props: MarkdownProps) =>
  renderToJson(email(props)).body.rows[0].columns[0].contents.map((c: any) => [c.type, c.values.text ?? c.values.html ?? c.values.table ?? c.values.src?.url ?? null]);

const RELEASE = `
  # Release *notes*

  **Faster exports**, and \`renderToJson()\` keeps your [links](https://example.com/docs "Docs").

  - Smaller
  - [x] Faster
    1. Nested

  > Worth it.

  ---

  | Plan | Price |
  | :--- | ----: |
  | Pro | **$10** |

  \`\`\`ts
  const plan = "pro";
  \`\`\`

  ![Chart](https://example.com/chart.png)
`;

describe("Markdown", () => {
  it("becomes Elements blocks the design can edit one by one", () => {
    const design = blocks({ children: RELEASE });
    expect(design.map(([type]) => type)).toEqual(["heading", "text", "text", "text", "divider", "table", "html", "image"]);
    expect(design[0][1]).toBe("Release <em>notes</em>");
    expect(design[1][1]).toMatch(
      /^<strong>Faster exports<\/strong>, and <code style="font-family: ui-monospace,[^"]*">renderToJson\(\)<\/code> keeps your <a href="https:\/\/example.com\/docs" title="Docs" target="_blank" rel="noopener">links<\/a>\.$/
    );
    expect(design[2][1]).toBe(
      '<ul style="margin: 0; padding: 0 0 0 24px"><li style="margin: 0 0 4px">Smaller</li><li style="margin: 0 0 4px">&#9745; Faster<br/><ol style="margin: 0; padding: 0 0 0 24px"><li style="margin: 0 0 4px">Nested</li></ol></li></ul>'
    );
    expect(design[3][1]).toBe('<blockquote style="margin: 0; padding: 0 0 0 12px; border-left: 3px solid #d5d9e0; color: #5b6472"><p style="margin: 0 0 8px">Worth it.</p></blockquote>');
    expect(design[5][1]).toMatchObject({ headers: [{ cells: [{ text: "Plan" }, { text: "Price" }] }], rows: [{ cells: [{ text: "Pro" }, { text: "<strong>$10</strong>" }] }] });
    expect(design[6][1]).toContain('<span style="color: #b0326f">const</span>');
    expect(design[7][1]).toBe("https://example.com/chart.png");
    const heading = renderToJson(email({ children: RELEASE })).body.rows[0].columns[0].contents[0].values;
    expect(heading).toMatchObject({ headingType: "h1", fontSize: "28px", fontWeight: 700 });
  });

  it("renders email HTML with inline styles and no classes of its own, and plain text", () => {
    const html = renderToHtml(email({ children: RELEASE }));
    expect(html).not.toMatch(/class="(language-|hljs)/);
    expect(html).toContain("<em>notes</em>");
    const text = renderToPlainText(email({ children: RELEASE }));
    for (const line of ["RELEASE NOTES", "links (https://example.com/docs)", "- Smaller", "Worth it.", 'const plan = "pro";', "[Chart]"]) expect(text).toContain(line);
  });

  it("takes props for each kind of block, inline styles for its markup, and attributes for links and images", () => {
    const props: MarkdownProps = {
      markdown: "## Hi\n\nA [link](https://example.com) and ![dot](https://example.com/dot.png).\n\n![Logo](https://example.com/logo.png)\n\n---",
      blocks: { heading: { color: "#111111" }, h2: { fontSize: "30px" }, paragraph: { fontSize: "16px" }, image: { width: 120 }, divider: { width: "50%" } },
      styles: { a: "color: #2563eb", img: "width: 16px" },
      linkAttributes: (href) => ({ target: "_self", "data-href": href, onclick: "x()" }),
      imageAttributes: { width: "16" },
    };
    const [heading, paragraph, image, divider] = renderToJson(email(props)).body.rows[0].columns[0].contents;
    expect(heading.values).toMatchObject({ color: "#111111", fontSize: "30px", headingType: "h2" });
    expect(paragraph.values.fontSize).toBe("16px");
    expect(paragraph.values.text).toBe(
      'A <a href="https://example.com" target="_self" data-href="https://example.com" style="color: #2563eb">link</a> and <img src="https://example.com/dot.png" alt="dot" width="16" style="width: 16px" />.'
    );
    expect(image.values.src).toMatchObject({ url: "https://example.com/logo.png", autoWidth: false });
    expect(divider.values.width).toBe("50%");
  });

  it("leaves out links and images that could run code, and rewrites the rest as asked", () => {
    const design = blocks({
      markdown: "[a](javascript:alert(1)) [b](&#106;avascript:x) [c](https://example.com) ![d](data:text/html,x) ![e](data:image/png;base64,AA)",
      url: (url, kind) => (kind === "link" ? `${url}?utm=mail` : url),
    });
    expect(design[0][1]).toBe('a b <a href="https://example.com?utm=mail" target="_blank" rel="noopener">c</a>  <img src="data:image/png;base64,AA" alt="e" style="max-width: 100%; height: auto; border: 0" />');
    expect(safeUrl("java\nscript:x", "link")).toBeUndefined();
    expect(safeUrl("{{unsubscribe_url}}", "link")).toBe("{{unsubscribe_url}}");
    expect(safeUrl("cid:logo", "image")).toBe("cid:logo");
  });

  it("keeps raw HTML without scripts, handlers, frames or forms; or shows it as text; or leaves it out", () => {
    const markdown = '<div onclick="x()" class="note">Hi <script>alert(1)</script><a href="javascript:x" title="t">j</a><iframe src="https://x"></iframe><img src=x onerror=alert(1)></div>';
    expect(blocks({ markdown })).toEqual([["html", '<div class="note">Hi <a title="t">j</a><img src="x"></div>']]);
    expect(blocks({ markdown: "<b>x</b>", html: "escape" })).toEqual([["text", "&lt;b&gt;x&lt;/b&gt;"]]);
    expect(blocks({ markdown: "<div>x</div>\n\nText", html: "drop" })).toEqual([["text", "Text"]]);
    expect(sanitizeHtml('<p style="background: url(javascript:x)">a < b</p><!--[if mso]><x><![endif]-->')).toBe("<p>a &lt; b</p>");
    // A numeric reference past Unicode's range reads as U+FFFD, as in a browser, instead of throwing.
    expect(blocks({ markdown: '<a href="&#99999999;x" style="color: &#x110000;">a</a>' })).toHaveLength(1);
  });

  it("takes off the indentation a template literal gives, and with `breaks` keeps line breaks", () => {
    expect(blocks({ children: "\n    Hello\n    world\n  " })).toEqual([["text", "Hello\nworld"]]);
    expect(blocks({ children: "Hello\nworld", breaks: true })).toEqual([["text", "Hello<br/>world"]]);
  });
});
