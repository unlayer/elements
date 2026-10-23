import React from "react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { Column, Email, Html, RenderError, Row, renderToHtml, renderToHtmlParts, renderToJson, renderToPlainText } from "../index";
import { Tailwind, loadTailwind, type TailwindHandle } from "../tailwind";
import * as asyncRenderers from "../async";
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
    // Old Internet Explorer's filters load images too, and so would CSS's `image()`.
    expect(sanitizeHtml('<p style="filter: progid:DXImageTransform.Microsoft.AlphaImageLoader(src=x.png)">a</p><p style="background: image(x.png)">b</p>')).toBe("<p>a</p><p>b</p>");
    // A numeric reference past Unicode's range reads as U+FFFD, as in a browser, instead of throwing.
    expect(blocks({ markdown: '<a href="&#99999999;x" style="color: &#x110000;">a</a>' })).toHaveLength(1);
  });

  it("takes off the indentation a template literal gives, and with `breaks` keeps line breaks", () => {
    expect(blocks({ children: "\n    Hello\n    world\n  " })).toEqual([["text", "Hello\nworld"]]);
    expect(blocks({ children: "Hello\nworld", breaks: true })).toEqual([["text", "Hello<br/>world"]]);
  });

  it("writes a table in a quote or a list as a top-level one's cells: its raw HTML, URLs, link attributes and styles as the props say", () => {
    const cells = '| a | b |\n|---|--:|\n| <img src="https://tracker.example/p.gif"> <b>raw</b> | [x](https://example.com/x) ![p](https://example.com/p.png) **bold** |';
    const nested = { quote: cells.replace(/^/gm, "> "), list: `- item\n\n${cells.replace(/^/gm, "  ")}` };
    for (const [where, markdown] of Object.entries(nested)) {
      const [[, html]] = blocks({ markdown, html: "escape", styles: { a: "color: #2563eb", strong: "color: #111111" }, linkAttributes: { target: "_self" } });
      const elements = parsed(html);
      expect([where, elements.map((e) => e.localName).filter((n) => /^(table|thead|tbody|tr|th|td)$/.test(n))]).toEqual([where, ["table", "thead", "tr", "th", "th", "tbody", "tr", "td", "td"]]);
      // Raw HTML shown as text, as in a top-level table's cells; the links and images Markdown makes, as the props say.
      expect([where, elements.filter((e) => e.localName === "b" || (e.localName === "img" && /tracker/.test(e.getAttribute("src")!)))]).toEqual([where, []]);
      expect(html).toContain("&lt;b&gt;raw&lt;/b&gt;");
      expect(html).toContain('<a href="https://example.com/x" target="_self" style="color: #2563eb">x</a>');
      expect(html).toContain('<strong style="color: #111111">bold</strong>');
      expect(html).toContain('<td align="right">');
      // Left out (`drop`), or kept as the sanitizer keeps it.
      expect(parsed(blocks({ markdown, html: "drop" })[0][1] as string).filter((e) => e.localName === "b" || /tracker/.test(e.getAttribute("src") ?? ""))).toEqual([]);
      expect(blocks({ markdown, html: "drop" })[0][1]).not.toContain("raw</b>");
      expect(blocks({ markdown })[0][1]).toContain("<b>raw</b>");
      // A URL policy that leaves every link and image out leaves out theirs too, in a table in a quote or a list as anywhere.
      const none = parsed(blocks({ markdown, html: "escape", url: () => undefined })[0][1] as string);
      expect([where, none.filter((e) => (e.localName === "a" && e.hasAttribute("href")) || e.localName === "img")]).toEqual([where, []]);
    }
  });
});

describe("Markdown from data: no more than its size calls for", () => {
  let error: MockInstance;
  beforeEach(() => {
    error = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => error.mockRestore());

  /** A table about `bytes` long: n columns, and n rows of one `|`, which marked fills out to the header's width (n² cells). */
  const padded = (bytes: number) => {
    const n = Math.floor(bytes / 6);
    return "|" + "a|".repeat(n) + "\n|" + "-|".repeat(n) + "\n" + "|\n".repeat(n);
  };

  it("fails on a table marked would fill out to more cells than the Markdown has characters (or 1,000), as a component of yours fails", async () => {
    for (const kb of [1, 5, 20, 100]) {
      const markdown = padded(kb * 1024);
      const start = performance.now();
      let thrown: unknown;
      try {
        renderToHtml(email({ markdown }));
      } catch (e) {
        thrown = e;
      }
      expect(thrown).toBeInstanceOf(RenderError);
      expect((thrown as RenderError).message).toMatch(/^\[Unlayer\] A table of \d+ columns and \d+ rows is \d+ cells, more than the Markdown can render: .* \(in <Markdown> at Row 1 › Column 1 › Markdown\)$/);
      // (Without reading the rows: well under a second however large, where filling it out took seconds and gigabytes.)
      expect(performance.now() - start).toBeLessThan(5000);
    }
    // With `onError: "omit"` it's left out of the HTML, the plain text and the design, listed, and the rest renders.
    const markdown = `# Before\n\n${padded(5 * 1024)}\nAfter`;
    const parts = renderToHtmlParts(email({ markdown }), { onError: "omit" });
    expect(parts.omitted.map((e) => [e.component, e.position])).toEqual([["Markdown", "Row 1 › Column 1 › Markdown"]]);
    expect(parts.body).not.toContain("u_content_table");
    expect(renderToJson(email({ markdown }), { onError: "omit" }).body.rows[0].columns[0].contents.map((c: any) => c.type)).toEqual(["heading", "text"]);
    expect(renderToPlainText(email({ markdown }), { onError: "omit" })).toMatch(/BEFORE[\s\S]*After/);
    expect(parts.body.length).toBeLessThan(100_000);
    expect(error.mock.calls.map((call) => String(call[0]))).toContain(`[Unlayer] Left out: ${parts.omitted[0].message.replace(/^\[Unlayer\] /, "")}`);
    // The async renderers alike.
    const async = await asyncRenderers.renderToHtmlParts(email({ markdown }), { onError: "omit" });
    expect([async.omitted.map((e) => e.position), async.body.includes("u_content_table")]).toEqual([["Row 1 › Column 1 › Markdown"], false]);
    await expect(asyncRenderers.renderToHtml(email({ markdown }))).rejects.toThrow(/A table of \d+ columns/);
  });

  it("renders a table whose cells are written out, however large, and one with short rows up to 1,000 cells", () => {
    const row = (n: number, text: string) => "|" + `${text}|`.repeat(n) + "\n";
    const large = row(30, "head") + row(30, "-") + row(30, "cell").repeat(200);
    expect(blocks({ markdown: large })[0][1]).toMatchObject({ rows: { length: 200 } });
    // 20 columns, 49 rows of one cell: 1,000 cells, the rest filled out.
    const sparse = row(20, "h") + row(20, "-") + "|x|\n".repeat(49);
    expect(blocks({ markdown: sparse })[0][1]).toMatchObject({ rows: { length: 49 } });
    expect(() => renderToHtml(email({ markdown: sparse + "|x|\n" }))).toThrow(/A table of 20 columns and 50 rows is 1020 cells/);
    // The cells are the Markdown's in all: tables that fit one by one don't together.
    const fit = row(20, "h") + row(20, "-") + "|x|\n".repeat(24);
    expect(blocks({ markdown: `${fit}\n${fit}` }).map(([type]) => type)).toEqual(["table", "table"]);
    expect(() => renderToHtml(email({ markdown: `${fit}\n${fit}\n${fit}` }))).toThrow(/A table of 20 columns and 24 rows is 500 cells/);
  });

  it("charges a table once where marked reads the quotes it's in again (with a line after them that continues them)", () => {
    const row = (n: number, text: string) => "|" + `${text}|`.repeat(n);
    const quoted = (prefix: string, lines: string[]) => lines.map((line) => prefix + line).join("\n");
    // 930 cells, all written out, three quotes deep: marked reads the quotes around it again for the line after them,
    // which charged it three times (2,790 cells, more than the Markdown's 2,153 characters).
    const table = [row(30, "h"), row(30, "-"), ...Array.from({ length: 30 }, () => row(30, "x"))];
    const html = renderToHtml(email({ markdown: `${quoted("> > > ", table)}\nand more` }));
    expect(new DOMParser().parseFromString(html, "text/html").querySelectorAll("blockquote td")).toHaveLength(900);
    // Each table is still charged: three of 500 cells with short rows, two quotes deep, fail on the third.
    const sparse = `${quoted("> > ", [row(20, "h"), row(20, "-"), ...Array.from({ length: 24 }, () => "|x|")])}\nlazy\n\n`;
    expect(() => renderToHtml(email({ markdown: sparse.repeat(2) }))).not.toThrow();
    expect(() => renderToHtml(email({ markdown: sparse.repeat(3) }))).toThrow(/A table of 20 columns and 24 rows is 500 cells/);
  });

  it("leaves out the list or quote a table that's too large is in, as it leaves out the table", () => {
    const markdown = `Before\n\n${padded(4096).replace(/^/gm, "> ")}\n\nAfter`;
    expect(() => renderToHtml(email({ markdown }))).toThrow(/A table of \d+ columns .* \(in <Markdown> at Row 1 › Column 1 › Markdown\)$/);
    const parts = renderToHtmlParts(email({ markdown }), { onError: "omit" });
    expect(parts.omitted).toHaveLength(1);
    expect(parts.body).not.toContain("<blockquote");
    expect(renderToJson(email({ markdown }), { onError: "omit" }).body.rows[0].columns[0].contents.map((c: any) => c.values.text)).toEqual(["Before", "After"]);
  });

  it("nests quotes and lists 32 deep: deeper, their markers are text, and the rest of the email renders", () => {
    for (const markdown of [">".repeat(2500) + " deep", "> - ".repeat(2000) + "deep", "> ".repeat(50000) + "deep", "- ".repeat(5000) + "deep"]) {
      const start = performance.now();
      const html = renderToHtml(
        <Email>
          <Row>
            <Column>
              <Markdown markdown={markdown} />
              <Html html="<p>The rest</p>" />
            </Column>
          </Row>
        </Email>
      );
      const body = new DOMParser().parseFromString(html, "text/html").body;
      let depth = 0;
      for (let e: Element | null = body.querySelector("blockquote, ul"); e; e = e.querySelector(":scope > blockquote, :scope > li > ul, :scope > ul, :scope > li > blockquote, :scope > p > blockquote")) depth++;
      expect(depth).toBeGreaterThan(0);
      expect(depth).toBeLessThanOrEqual(32);
      expect(body.textContent).toContain("deep");
      expect(body.textContent).toContain("The rest");
      expect(performance.now() - start).toBeLessThan(5000);
    }
    // Under the limit, as deep as written.
    expect(renderToHtml(email({ markdown: "> ".repeat(10) + "x" })).match(/<blockquote/g)).toHaveLength(10);
  });

  it("reads inline Markdown in time linear in its size, however its delimiters are left open or nested", () => {
    // Each 100 KB on one line, or on many: marked looks ahead from each opener to the line's end (or the paragraph's)
    // for what closes it, and from each place an email or a URL could start for one, so these took up to a minute
    // (`*a `), or overflowed the stack (emphasis nested deep). Past what an email's Markdown takes, the rest is text.
    const fill = (unit: string) => unit.repeat(Math.ceil(102400 / unit.length)).slice(0, 102400);
    const shapes: [string, string, boolean?][] = [];
    for (const unit of ["*a ", "*a **a ", "_a __a ", "**a *", "<a *", "~a ~~a ", "[a](", "![a](", "[a](b ", "[a](b (", "[a](<", "[`a](", "`a``b```c", "<a ", "[[[a]]](", "a*b", "http", "a_", "a <?a ", "a <!a "]) {
      shapes.push([unit, fill(unit)], [unit + "\\n", fill(unit + "\n").replace(/\n$/, ")")]);
    }
    shapes.push(
      ["*a nested", "*a ".repeat(17000) + "b" + " a*".repeat(17000)],
      ["~~a nested", "~~a ".repeat(12800) + "b" + " a~~".repeat(12800)],
      ["a URL trimmed", "http://a" + "&a;".repeat(34000)],
      ["an email's characters", "a.".repeat(51200) + "@"],
      ["spaces, with breaks", "a" + " ".repeat(102400) + "b", true]
    );
    for (const [shape, markdown, breaks] of shapes) {
      const start = performance.now();
      const html = renderToHtml(email({ markdown, html: "escape", breaks }));
      expect([shape, html.length > 100000, performance.now() - start < 3000]).toEqual([shape, true, true]);
    }
  }, 180_000);

  it("nests emphasis, strikethrough and links 32 deep: deeper, their delimiters are text", () => {
    const depth = (html: string) => {
      let deepest = 0;
      for (let e: Element | null = new DOMParser().parseFromString(html, "text/html").body.querySelector("em"), at = 1; e; e = e.querySelector(":scope > em"), at++) deepest = at;
      return deepest;
    };
    expect(depth(renderToHtml(email({ markdown: "*a ".repeat(32) + "b" + " a*".repeat(32) })))).toBe(32);
    const deeper = renderToHtml(email({ markdown: "*a ".repeat(40) + "b" + " a*".repeat(40) }));
    expect(depth(deeper)).toBe(32);
    expect(new DOMParser().parseFromString(deeper, "text/html").body.textContent).toContain("*a *a b a* a*");
  });

  it("renders the rest of a Markdown's inline syntax as text past the work it can take, leaving nothing out", () => {
    const markdown = "*a ".repeat(40000) + "\n\nAfter: **bold** and [a link](https://e.test).";
    const body = new DOMParser().parseFromString(renderToHtml(email({ markdown, html: "escape" })), "text/html").body;
    expect(body.textContent).toContain("After: **bold** and [a link](https://e.test).");
    expect(body.querySelector("strong")).toBeNull();
    // Under it, as written.
    expect(renderToHtml(email({ markdown: "*a ".repeat(400) + "\n\nAfter: **bold** and [a link](https://e.test)." }))).toContain("<strong>bold</strong>");
  });

  it("reads an email's emphasis, strikethrough and links as marked does, many and long ones too", () => {
    // What an email's Markdown has, many times over: each read as marked reads it.
    const markdown = Array.from({ length: 400 }, (_, i) => `Para ${i}: *em* and **strong** and ~~gone~~, a [link](https://e.test/${i}) and ![img](https://e.test/${i}.png), a * stray star, a [bracket] and an _under_score_word_. *${"Long emphasis that runs on. ".repeat(20).trim()}*`).join("\n\n");
    const html = renderToHtml(email({ markdown, html: "escape" }));
    expect(html.match(/<em>em<\/em>/g)).toHaveLength(400);
    expect(html.match(/<strong>strong<\/strong>/g)).toHaveLength(400);
    expect(html.match(/<del>gone<\/del>/g)).toHaveLength(400);
    expect(html.match(/href="https:\/\/e.test\/\d+"/g)).toHaveLength(400);
    expect(html.match(/<em>Long emphasis/g)).toHaveLength(400);
  });

  it("renders a very long Markdown: its lines and blocks aren't spread into one call, which would overflow the stack", () => {
    for (const markdown of ["a\n".repeat(130000), "a\n\n".repeat(130000)]) {
      const plain = renderToPlainText(email({ markdown }));
      expect(plain.match(/a/g)?.length).toBe(130000);
    }
  }, 60_000);
});

/** Random inputs the sanitizer is given (`SANITIZE_FUZZ_RUNS=300000` for a longer run, `SANITIZE_FUZZ_SEED` for others). */
const FUZZ_RUNS = Number(process.env.SANITIZE_FUZZ_RUNS ?? 2000);

/** The elements an HTML parser makes of HTML in a page's body. */
const parsed = (html: string) => [...new DOMParser().parseFromString(`<!doctype html><body>${html}`, "text/html").body.querySelectorAll("*")];

/** Whether a style (as the browser reads it: its escapes decoded, its spaces gone) could load or run something. */
const loads = (style: string) =>
  /expression|javascript:|behavior|-moz-binding|progid|url\(|image\(|image-set\(|\/\*/i.test(style.replace(/\\([\da-f]{1,6})\s?|\\(.)/gi, (_, hex, ch) => (hex ? String.fromCodePoint(Math.min(parseInt(hex, 16), 0x10ffff)) : ch)).replace(/\s/g, ""));

describe("sanitizeHtml", () => {
  it("leaves no tag that what's around a part it takes out joins into", () => {
    const markdown = "<div>\n<scr<script></script>ipt>alert(1)</script>\n</div>";
    // (`<scr<script>` is one tag to a browser, named `scr<script`: left out, as is the `</script>` after it.)
    expect(sanitizeHtml(markdown)).toBe("<div>\nipt>alert(1)\n</div>");
    const [[type, html]] = blocks({ markdown });
    expect([type, parsed(html).map((e) => e.localName)]).toEqual(["html", ["div"]]);
    expect(renderToHtml(email({ markdown }))).not.toMatch(/<script/i);
    expect(sanitizeHtml("<<script>script>alert(1)<</script>/script>")).toBe("&lt;/script>");
    expect(sanitizeHtml("<scr<style>x</style>ipt>a</script>")).toBe("xipt>a");
  });

  it("reads tags and attributes as a browser does, and writes back only those that display", () => {
    const cases: Array<[string, string]> = [
      ["<img/src=x/onerror=alert(1)>", '<img src="x/onerror=alert(1)">'],
      ['<a href="java&#x09;script:alert(1)">a</a><a href="&#x6A;avascript:x">b</a><a href=" &#106avascript:x">c</a><a href="javascript&colon;x">d</a>', "<a>a</a><a>b</a><a>c</a><a>d</a>"],
      ['<p style="background:url&lpar;x)">a</p><p style="b\\61 ckground: \\75 rl(x)">b</p><p style="width: expr/**/ession(1)">c</p><p style="color: red">d</p>', '<p>a</p><p>b</p><p>c</p><p style="color: red">d</p>'],
      ['<a href="https://example.com" href="javascript:x" onclick="x()" data-x="1" aria-label="Go" title=\'say "hi" `x`\'>a</a>', '<a href="https://example.com" aria-label="Go" title="say &quot;hi&quot; &#96;x&#96;">a</a>'],
      ["<custom-tag><o:p>Kept text</o:p></custom-tag><form action=x><input value=y><button>Go</button></form>", "Kept textGo"],
      ['<svg onload="alert(1)"/>after<svg><script>alert(1)</script></svg>end<math><mi>x</mi></math><template><img src=x></template><svg/onload=alert(1)>gone', "afterend"],
      ["<!doctype html><?xml version='1.0'?><![CDATA[x]]><!-- a --><!--> b<!---> c<!-- open", " b c"],
      ["a < b > c & d &copy; <b>e", "a &lt; b > c & d &copy; <b>e"],
      ['a <a href="x', "a "],
      ["<b>bold</b> <img src=x onerror=alert(1)", "<b>bold</b> "],
      ["<b\u0000>x</b>\u0000", "x</b>\ufffd"],
      ["<td nowrap background=cid:logo colspan=2><br/><hr noshade /></td>", '<td nowrap background="cid:logo" colspan="2"><br /><hr noshade /></td>'],
      ["<base href=//evil><meta http-equiv=refresh content=0><link rel=stylesheet href=x><embed src=x>text", "text"],
    ];
    for (const [html, kept] of cases) expect([html, sanitizeHtml(html)]).toEqual([html, kept]);
  });

  it("keeps no class whose arbitrary value could load or run something, whatever renders it later", () => {
    const cases: Array<[string, string]> = [
      ['<p class="note bg-[url(https://x.test/a.gif)] p-2">a</p>', '<p class="note p-2">a</p>'],
      ['<p class="[background:u&#114;l(x)] max-[480px]:[background:u\\72l(x)] [behavior:x] [--x:image-set(a.png_1x)]">a</p>', "<p>a</p>"],
      ['<p class="bg-&#91;url(x)] hover:bg-[u/**/rl(x)] [filter:progid:x] text-red-500">a</p>', '<p class="text-red-500">a</p>'],
      // What isn't one (a class of yours) and arbitrary values that load nothing stay as written.
      ['<p class="expression-box w-[calc(100%-2px)] bg-[#ff0000] font-[&#39;Open_Sans&#39;]">a</p>', '<p class="expression-box w-[calc(100%-2px)] bg-[#ff0000] font-[&#39;Open_Sans&#39;]">a</p>'],
    ];
    for (const [html, kept] of cases) expect([html, sanitizeHtml(html)]).toEqual([html, kept]);
    // The design, which any renderer may render again (in a <Tailwind>), holds none.
    expect(blocks({ markdown: '<div class="bg-[url(https://x.test/a.gif)] note">a</div>' })).toEqual([["html", '<div class="note">a</div>']]);
  });

  it("reads a long input in one pass, whatever it leaves open", () => {
    const start = performance.now();
    for (const open of ['<a x="', "<b ", "<!", "<", "<script>", "<x y=", "<!--"]) expect(sanitizeHtml(`<p>${open.repeat(40000)}text`).length).toBeLessThan(400000);
    expect(performance.now() - start).toBeLessThan(2000);
  });

  it("keeps only display tags and safe attributes, whatever hostile fragments it's given (fuzzed)", () => {
    // Every element and attribute a browser reads from its output is on the allowlists, no URL runs code, no style
    // loads or runs anything, and sanitizing its output again changes nothing.
    const fragments = [
      "<scr", "ipt>", "<script>", "</script>", "<!--", "-->", "--!>", "<svg/onload=alert(1)>", "<img src=x onerror=alert(1)>", "<img/src=", "/onerror=",
      "javascript:alert(1)", "&#x6A;avascript:", "java&#x09;script:", "&#106;", "&colon;", "&lpar;", "<iframe", "<iframe src=x>", "<style>", "</style>",
      "<math>", "<math><mi><mglyph>", "<svg><style>", "<template>", "<noscript>", "<textarea>", "</textarea>", "<title>", "<xmp>", "<plaintext>",
      "<base href=", "<meta http-equiv=refresh content=0;url=javascript:alert(1)>", "<form action=", "<object data=", "<embed src=", "<link rel=",
      "<a href=", '<a href="', "<a href=java&#x0A;script:x>", "<td background=javascript:x>", '<p style="', "background:url(", "\\75 rl(", "expression(",
      "/*", "*/", "-moz-binding:", "behavior:", "<details open ontoggle=alert(1)>", "<font color=red>", "<div>", "</div>", "<b>", "</", "<", "<!", "<?xml ",
      "<!doctype html>", "<![CDATA[", "]]>", '"', "'", "`", ">", "/", "=", " ", "\n", "\t", "\0", "&#0;", "text", "data:text/html,", "data:image/png;base64,AA", "cid:x",
      ' class="', " class=", "bg-[", "[background:", "&#91;", "]", "u&#114;l(", "u\\72l(", "u/**/rl(", "image(", "progid:", "&#32;", "p-2", "&lpar;",
      ' class="bg-[url(x)] p-2', " class='[background:u&#114;l(x)]", ' class="p-2&#32;bg-[u\\72l(x)]"', " class=bg-&#91;url(x)]", ' class="[filter:progid:x]',
    ];
    const kept = new Set("a abbr address article aside b bdi bdo big blockquote br caption center cite code col colgroup dd del details dfn div dl dt em figcaption figure font footer h1 h2 h3 h4 h5 h6 header hr i img ins kbd li main mark nav ol p pre q s samp section small span strike strong sub summary sup table tbody td tfoot th thead time tr tt u ul var wbr".split(" "));
    const attributes = new Set("abbr align alt axis background bgcolor border cellpadding cellspacing char charoff cite class clear color colspan compact datetime dir face frame headers height href hreflang hspace id lang name noshade nowrap open rel reversed role rowspan rules scope size span src start style summary target title type valign value vspace width".split(" "));
    // A URL's scheme as the browser resolves it (a relative one on the page's; one it can't parse goes nowhere), and CSS
    // as it reads it, its escapes decoded.
    const scheme = (url: string) => {
      try {
        const { protocol, href } = new URL(url, "https://example.com/");
        return protocol === "data:" ? (/^data:image\/(png|gif|jpe?g|webp)[;,]/i.test(href) ? "image" : "data") : protocol.slice(0, -1);
      } catch {
        return "none";
      }
    };
    const r = random(Number(process.env.SANITIZE_FUZZ_SEED ?? 20261018));
    const bad: string[] = [];
    for (let run = 0; run < FUZZ_RUNS && bad.length < 5; run++) {
      let input = "";
      for (let n = 1 + Math.floor(r() * 16); n > 0; n--) input += fragments[Math.floor(r() * fragments.length)];
      const out = sanitizeHtml(input);
      const wrong = (why: string) => bad.push(`${JSON.stringify(input)} → ${JSON.stringify(out)}: ${why}`);
      if (sanitizeHtml(out) !== out) wrong("not idempotent");
      for (const element of parsed(out)) {
        if (!kept.has(element.localName) || element.namespaceURI !== "http://www.w3.org/1999/xhtml") wrong(`<${element.localName}>`);
        for (const { name, value } of element.attributes) {
          if (!attributes.has(name) && !/^aria-[a-z]+$/.test(name)) wrong(`attribute ${name}`);
          if ((name === "href" || name === "cite") && !["https", "http", "mailto", "tel", "none"].includes(scheme(value))) wrong(`${name}=${value}`);
          if ((name === "src" || name === "background") && !["https", "http", "cid", "image", "none"].includes(scheme(value))) wrong(`${name}=${value}`);
          if (name === "style" && loads(value)) wrong(`style=${value}`);
          // (A class's arbitrary value, what Tailwind would inline: from its first bracket.)
          if (name === "class") for (const token of value.split(/[\t\n\f\r ]+/)) if (/[[(]/.test(token) && loads(token.slice(token.search(/[[(]/)))) wrong(`class ${token}`);
        }
      }
    }
    expect(bad).toEqual([]);
  }, FUZZ_RUNS * 5 + 30000);
});

describe("Markdown in a <Tailwind>", () => {
  let tw: TailwindHandle;
  beforeAll(async () => {
    tw = await loadTailwind();
  });
  /** The HTML of each block in the design. */
  const design = (content: React.ReactNode) =>
    renderToJson(
      <Tailwind tw={tw}>
        <Email>
          <Row>
            <Column>{content}</Column>
          </Row>
        </Email>
      </Tailwind>
    ).body.rows[0].columns[0].contents.map((c: any) => c.values.text ?? c.values.html);
  const styles = (html: string) => parsed(html).map((element) => element.getAttribute("style") ?? "");

  it("inlines no class into its HTML that could load or run something, as its sanitizer keeps no such style", () => {
    // Arbitrary values and properties, written plain or hidden from a check: an HTML reference (`&#114;`), a CSS escape
    // (`\\72`), a comment Tailwind takes out.
    const vectors = [
      "[background:url(https://x.test/a.gif)]",
      "bg-[url(https://x.test/a.gif)]",
      "bg-[u&#114;l(https://x.test/a.gif)]",
      "bg-[u&#x72;l(https://x.test/a.gif)]",
      "bg-[u\\72l(https://x.test/a.gif)]",
      "bg-[u\\rl(https://x.test/a.gif)]",
      "[background:URL(https://x.test/a.gif)]",
      "[background:u/**/rl(https://x.test/a.gif)]",
      "[list-style-image:url(https://x.test/a.gif)]",
      "[behavior:url(x.htc)]",
      "[-moz-binding:url(x.xml)]",
      "[background:expression(alert(1))]",
      "[filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(src=https://x.test/a.png)]",
      "[background:image(https://x.test/a.png)]",
    ];
    for (const vector of vectors) {
      // In a raw HTML block, and in a paragraph's HTML; the other classes inlined.
      for (const markdown of [`<div class="${vector} text-red-500">a</div>`, `Text <span class="${vector} text-red-500">a</span>`]) {
        const [html] = design(<Markdown markdown={markdown} />);
        expect([vector, styles(html)]).toEqual([vector, ["color: #fb2c36"]]);
      }
    }
    // The sanitizer left them out; what Tailwind inlines into sanitized HTML is checked again (as a block holding
    // Markdown's HTML is marked).
    expect(design(<Html html={'<div class="[background:url(https://x.test/a.gif)] text-red-500">a</div>'} {...({ _sanitized: true } as {})} />)).toEqual(['<div style="color: #fb2c36">a</div>']);
    expect(warn.mock.calls.map((call) => String(call[0]))).toContain(
      "[Unlayer] Html can't inline `[background:url(https://x.test/a.gif)]`'s `background` in its markup: it could load or run something, which Markdown's sanitized HTML doesn't allow."
    );
    // A phone, breakpoint or hover variant is in no style, inline or in the head.
    const variants = renderToHtml(<Tailwind tw={tw}><Email><Row><Column><Markdown markdown={'<div class="sm:bg-[url(https://x.test/a.gif)] max-sm:bg-[url(https://x.test/a.gif)] hover:bg-[url(https://x.test/a.gif)]">a</div>'} /></Column></Row></Email></Tailwind>);
    expect(variants).toContain(">a</div>");
    expect(variants).not.toContain("x.test");
  });

  it("renders Markdown from data in about the time its size calls for: elements nested deep in one with a class, many classes", () => {
    // Each about 300 KB. Nested 30,000 deep took seconds, growing with the square of the depth; 9,000 classes Tailwind
    // hadn't built, in one paragraph or one to a paragraph, took minutes (each read alone built its whole stylesheet
    // again), then hundreds of megabytes built at once: a render reads its first 2,000 (CLASSES), the others as written.
    const n = 9000;
    for (const [markdown, style, past] of [
      ['<div class="p-1">' + "<div>".repeat(30_000) + "x" + "</div>".repeat(30_000) + "</div>", "padding: 4px"],
      [Array.from({ length: n }, (_, i) => `<span class="p-[${i}px]">x</span>`).join(" "), "padding: 1999px", '<span class="p-[2000px]">'],
      [Array.from({ length: n }, (_, i) => `<span class="m-[${i}px]">x</span>`).join("\n\n"), "margin: 1999px", '<span class="m-[8999px]">'],
    ]) {
      const start = performance.now();
      const html = renderToHtml(<Tailwind tw={tw}><Email><Row><Column><Markdown markdown={markdown} /></Column></Row></Email></Tailwind>);
      expect(html).toContain(style);
      if (past) expect(html).toContain(past);
      expect(performance.now() - start).toBeLessThan(5000);
    }
  }, 120_000);

  it("inlines your own markup's classes as written: only Markdown's HTML is sanitized", () => {
    expect(design(<Html html={'<div class="bg-[url(https://x.test/a.gif)]">a</div>'} />)).toEqual(['<div style="background-image: url(https://x.test/a.gif)">a</div>']);
  });

  /** Classes whose variables use each other twice over, `n` deep, the last `x`, for `property`. */
  const chain = (n: number, property: string) => [...Array.from({ length: n }, (_, i) => `[--v${i}:var(--v${i + 1})_var(--v${i + 1})]`), `[--v${n}:x]`, `[${property}:var(--v0)]`].join(" ");

  it("renders a class string whose variables come to too much at once, leaving out (and saying) what can't be inlined", () => {
    const start = performance.now();
    const markdown = `Hello\n\n<p class="${chain(31, "font-family")} text-red-500">raw</p>\n`;
    expect(styles(design(<Markdown markdown={markdown} />)[1])).toEqual(["color: #fb2c36"]);
    expect(warn.mock.calls.map((call) => String(call[0]))).toContain("[Unlayer] Html ignores class `[font-family:var(--v0)]` in its markup: `font-family`'s variables come to more than 4096 characters.");
    expect(performance.now() - start).toBeLessThan(5000);
  }, 30000);

  it("inlines nothing that loads or runs anything, whatever classes its HTML is given (fuzzed)", () => {
    // An arbitrary value or property (`bg-[…]`, `[background:…]`) of random parts, some hiding a `url(` from a check
    // (an HTML reference, a CSS escape, a comment Tailwind takes out), its brackets, quotes and comments closed or not.
    const opens = ["bg-[", "[background:", "[background-image:", "[list-style-image:", "[behavior:", "[-moz-binding:", "[border-image:", "[color:"];
    const parts = ["url(", "URL(", "u&#114;l(", "u&#x72;l(", "u\\72l(", "u\\72_l(", "u\\rl(", "u/**/rl(", "image-set(", "expression(", "x&lpar;", "x&#40;", "javascript:", "https://x.test/a.gif", "x", "_", "&amp;", ",", ")", "(", "[", "]", "/*", "*/", "\\", "'", "&quot;"];
    const r = random(Number(process.env.SANITIZE_FUZZ_SEED ?? 20261018));
    const pick = (list: string[]) => list[Math.floor(r() * list.length)];
    const bad: string[] = [];
    let dropped = 0;
    for (let run = 0; run < FUZZ_RUNS / 10 && bad.length < 5; run++) {
      let value = "";
      for (let n = 1 + Math.floor(r() * 5); n > 0; n--) value += pick(parts);
      // Some with variables that use each other twice over (2^n characters, past what memory holds at 31 unchecked).
      const vars = r() < 0.3 ? chain(1 + Math.floor(r() * 31), pick(["font-family", "background", "letter-spacing"])) : "";
      const className = `${pick(opens)}${value}${r() < 0.5 ? ")" : ""}${r() < 0.8 ? "]" : ""} ${vars} text-red-500`;
      if (!sanitizeHtml(`<b class="${className}">`).includes(className)) dropped++;
      for (const html of design(<Markdown markdown={`<div class="${className}">a</div>\n\nText <span class="${className}">b</span>`} />)) {
        for (const style of styles(html)) if (loads(style)) bad.push(`${JSON.stringify(className)} → ${JSON.stringify(style)}`);
        // (What Tailwind can't read doesn't stop it reading the rest.)
        if (!html.includes("color: #fb2c36")) bad.push(`${JSON.stringify(className)} → ${JSON.stringify(html)}: no color`);
      }
    }
    expect(bad).toEqual([]);
    // (The inputs reach the checks: the sanitizer left many out, and Tailwind couldn't read others.)
    expect(dropped).toBeGreaterThan(FUZZ_RUNS / 100);
    expect(warn.mock.calls.filter((call) => String(call[0]).includes("isn't a class Tailwind can read here")).length).toBeGreaterThan(FUZZ_RUNS / 100);
  }, FUZZ_RUNS * 5 + 30000);
});

/** A seeded random number generator (mulberry32): the same inputs every run. */
function random(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
