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

/** Random inputs the sanitizer is given (`SANITIZE_FUZZ_RUNS=300000` for a longer run, `SANITIZE_FUZZ_SEED` for others). */
const FUZZ_RUNS = Number(process.env.SANITIZE_FUZZ_RUNS ?? 2000);

/** The elements an HTML parser makes of HTML in a page's body. */
const parsed = (html: string) => [...new DOMParser().parseFromString(`<!doctype html><body>${html}`, "text/html").body.querySelectorAll("*")];

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
    const css = (style: string) => style.replace(/\\([\da-f]{1,6})\s?|\\(.)/gi, (_, hex, ch) => (hex ? String.fromCodePoint(Math.min(parseInt(hex, 16), 0x10ffff)) : ch)).replace(/\s/g, "");
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
          if (name === "style" && /expression|javascript:|behavior|-moz-binding|url\(|image-set\(|\/\*/i.test(css(value))) wrong(`style=${value}`);
        }
      }
    }
    expect(bad).toEqual([]);
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
