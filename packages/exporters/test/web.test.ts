import { JSDOM } from "jsdom";
import { ElementsError } from "@unlayer-internal/elements-core";
import { renderTemplate } from "../src";

const page = (children: unknown[], extra: Record<string, unknown> = {}) => ({ version: 1, root: { type: "Page", props: { width: 600 }, children, ...extra } });
const web = (input: unknown, options: Record<string, unknown> = {}) => renderTemplate(input, options);

describe("web HTML", () => {
  it("writes a whole document: shell, title, language, the window's background", () => {
    const { html, head, body, bodyStyle } = web(page([{ type: "Text", children: ["Hi"] }], { props: { width: 600, title: "A & B", lang: "ar", dir: "rtl", description: 'Say "hi"' }, style: { backgroundColor: "#eee" } }));
    expect(html.startsWith('<!DOCTYPE html><html lang="ar" dir="rtl"><head>')).toBe(true);
    expect(head).toContain("<title>A &amp; B</title>");
    expect(head).toContain('<meta name="description" content="Say &quot;hi&quot;">');
    expect(bodyStyle).toBe("margin:0;background-color:#eee");
    expect(html).toContain(`<body style="${bodyStyle}">${body}</body>`);
    expect(head).not.toContain("<style>");
  });

  it("writes one element per node, its styles inline, no wrappers", () => {
    const { body } = web(
      page([
        { type: "Heading", props: { level: 2 }, children: ["Welcome"] },
        { type: "Paragraph", style: { fontSize: 14, padding: [0, 8] }, children: ["Hello"] },
        { type: "Button", props: { href: "https://example.com" }, children: ["Go"] },
      ])
    );
    expect(body).toBe(
      '<main style="max-width:600px;margin:0 auto;display:flex;flex-direction:column;color:#000;font-family:Arial, Helvetica, sans-serif;font-size:16px;font-weight:400;font-style:normal;line-height:1.5;letter-spacing:0;text-align:left;text-transform:none">' +
        '<h2 style="margin:0;font-size:24px;font-weight:700;line-height:1.25">Welcome</h2>' +
        '<p style="margin:0;font-size:14px;box-sizing:border-box;padding:0 8px">Hello</p>' +
        '<a href="https://example.com" style="align-self:flex-start;display:inline-block;text-decoration:none;color:#fff;font-size:14px;line-height:1.2;text-align:center;box-sizing:border-box;padding:10px 20px;background-color:#0879a1;border-radius:4px">Go</a>' +
        "</main>"
    );
  });

  it("writes a heading's size and weight even where they're inherited, as the browser has its own", () => {
    const { body } = web(page([{ type: "Heading", props: { level: 5 }, style: { fontWeight: 400 }, children: ["x"] }]));
    expect(body).toContain('<h5 style="margin:0;font-size:16px;font-weight:400;line-height:1.25">');
  });

  it("lays out a Row with flex: widths as bases, shares of what's left, and stacks it on phones", () => {
    const { body, head } = web(
      page([
        {
          type: "Row",
          id: "cols",
          style: { gap: 20, alignItems: "center" },
          children: [{ type: "Column", style: { width: "40%" } }, { type: "Column", style: { flex: 2 } }, { type: "Image", props: { src: "https://example.com/a.png" }, style: { flex: "none" } }],
        },
      ])
    );
    // An author's id goes into the HTML as it is; the stacking rule is a class named after the rule.
    expect(body).toMatch(/<div id="cols" class="e[0-9a-z]{5}" style="display:flex;gap:20px;align-items:center">/);
    expect(body).toContain('<div style="flex:0 1 40%;min-width:0;display:flex;flex-direction:column"></div>');
    expect(body).toContain('<div style="flex:2 1 0%;min-width:0;display:flex;flex-direction:column"></div>');
    expect(body).toContain('style="flex:0 0 auto;min-width:0;align-self:center;display:block;max-width:100%;height:auto"');
    const stack = /class="(e[0-9a-z]{5})"/.exec(body)![1];
    expect(head).toContain(`@media (max-width: 480px){.${stack}{flex-direction:column!important;align-items:stretch!important}.${stack}>*{`);
    expect(web(page([{ type: "Row", props: { stackOnMobile: false } }])).head).not.toContain("<style>");
  });

  it("keeps a Section's content at the content width, however wide the window", () => {
    const { body } = web(page([{ type: "Section", style: { backgroundColor: "#111", padding: [24, 16] }, children: [{ type: "Text", children: ["a"] }] }, { type: "Text", children: ["b"] }]));
    expect(body).toContain(
      '<section style="display:flex;flex-direction:column;padding:24px max(16px, calc((100% - 600px) / 2 + 16px)) 24px max(16px, calc((100% - 600px) / 2 + 16px));background-color:#111">'
    );
    // Without side padding, every length inside calc() and max() still has its unit.
    expect(web(page([{ type: "Section", children: [] }])).body).toContain("padding:0 max(0px, calc((100% - 600px) / 2 + 0px)) 0 max(0px, calc((100% - 600px) / 2 + 0px))");
    // What isn't in a Section stays at the content width, in its own run.
    expect(body).toContain('<div style="width:100%;max-width:600px;margin:0 auto;display:flex;flex-direction:column"><div>b</div></div>');
  });

  it("places content with its own size by the stack's align, else its text alignment", () => {
    const at = (style: Record<string, unknown>) =>
      web(page([{ type: "Column", style, children: [{ type: "Button", props: { href: "#" }, children: ["Go"] }] }])).body.match(/align-self:([a-z-]+)/)?.[1];
    expect(at({})).toBe("flex-start");
    expect(at({ textAlign: "center" })).toBe("center");
    expect(at({ alignItems: "end", textAlign: "center" })).toBe("flex-end");
    expect(at({ alignItems: "stretch" })).toBeUndefined();
  });

  it("writes phone styles, hiding and hover in the stylesheet, under short classes named after their rules", () => {
    const { head, body } = web(
      page([
        { type: "Paragraph", mobile: { fontSize: 14, padding: 4 }, children: ["a"] },
        { type: "Text", hidden: { mobile: true }, children: ["desktop only"] },
        { type: "Text", hidden: { desktop: true }, children: ["phone only"] },
        { type: "Button", props: { href: "#" }, hover: { backgroundColor: "#000", color: "#fff" }, children: ["Go"] },
        { type: "Text", children: ["plain"] },
        { type: "Text", hidden: { mobile: true }, children: ["also desktop only"] },
      ])
    );
    const classes = [...body.matchAll(/class="([^"]+)"/g)].map((m) => m[1]);
    expect(classes).toHaveLength(5);
    const [phone, hidePhone, hideDesktop, hover, hidePhoneAgain] = classes;
    for (const name of classes) expect(name).toMatch(/^e[0-9a-z]{5}$/);
    // The same rule is one class, written once.
    expect(hidePhoneAgain).toBe(hidePhone);
    expect(head).toContain(`.${hover}:hover{background-color:#000!important;color:#fff!important}`);
    expect(head).toContain(`@media (min-width: 481px){.${hideDesktop}{display:none!important}}`);
    expect(head).toContain(`@media (max-width: 480px){.${phone}{font-size:14px!important;padding:4px!important}.${hidePhone}{display:none!important}}`);
    expect(head.match(/display:none/g)).toHaveLength(2);
    expect(body).toContain("<div>plain</div>");
    expect(body).not.toMatch(/ id="/);
    // A prefix of the embedder's own.
    expect(web(page([{ type: "Text", hidden: { mobile: true }, children: ["x"] }]), { classPrefix: "acme-" }).body).toMatch(/class="acme-[0-9a-z]{5}"/);
    expect(() => web(page([]), { classPrefix: "1x" })).toThrow(/class prefix/);
  });

  it("writes links, images, dividers, line breaks and merge tags", () => {
    const { body } = web(
      page([
        {
          type: "Paragraph",
          children: [
            "Hi ",
            { type: "MergeTag", props: { name: "first_name" } },
            { type: "LineBreak" },
            { type: "Link", props: { href: { href: "https://example.com", target: "_blank" } }, children: ["docs"] },
          ],
        },
        { type: "Link", props: { href: "https://example.com" }, children: [{ type: "Image", props: { src: { src: "https://example.com/a.png", width: 120 }, alt: "A" } }] },
        { type: "Divider", style: { width: "50%", padding: [8, 0] } },
      ])
    );
    expect(body).toContain("Hi {{first_name}}<br>");
    expect(body).toContain('<a href="https://example.com" target="_blank" rel="noopener noreferrer" style="color:#00e;text-decoration:underline">docs</a>');
    expect(body).toContain('<img src="https://example.com/a.png" alt="A" width="120" style="display:block;max-width:100%;height:auto">');
    expect(body).toContain('<div style="box-sizing:border-box;padding:8px 0"><hr style="margin:0;border:0;border-top:1px solid #bbb;width:50%"></div>');
    expect(web(page([{ type: "Text", children: [{ type: "MergeTag", props: { name: "name" } }] }]), { mergeTag: (name: string) => `*|${name.toUpperCase()}|*` }).body).toContain(
      "*|NAME|*"
    );
  });

  it("writes the root's web fonts as @font-face rules, a face each, its format from its file where not given", () => {
    const { head, body } = web(
      page([{ type: "Text", style: { fontFamily: "'Brand Sans', Arial, sans-serif" }, children: ["x"] }], {
        props: {
          width: 600,
          fonts: [
            { family: "Brand Sans", src: "https://fonts.example.com/brand-400.woff2", weight: 400 },
            { family: "Brand Sans", src: "https://fonts.example.com/brand-700.woff2", weight: "bold" },
            { family: "Brand Sans", src: "https://fonts.example.com/brand-italic.ttf", style: "italic" },
            { family: "Variable", src: "https://fonts.example.com/variable", format: "woff2", weight: "100 900" },
          ],
        },
      })
    );
    expect(head).toContain(
      '<style>@font-face{font-family:"Brand Sans";src:url("https://fonts.example.com/brand-400.woff2") format("woff2");font-weight:400;font-display:swap}' +
        '@font-face{font-family:"Brand Sans";src:url("https://fonts.example.com/brand-700.woff2") format("woff2");font-weight:700;font-display:swap}' +
        '@font-face{font-family:"Brand Sans";src:url("https://fonts.example.com/brand-italic.ttf") format("truetype");font-style:italic;font-display:swap}' +
        '@font-face{font-family:"Variable";src:url("https://fonts.example.com/variable") format("woff2");font-weight:100 900;font-display:swap}'
    );
    expect(body).toContain("font-family:&#39;Brand Sans&#39;, Arial, sans-serif");
  });

  it("takes a web font in the root's fonts, not in fontFamily", () => {
    expect(() => web(page([{ type: "Text", style: { fontFamily: { name: "Brand", src: "https://fonts.example.com/b.woff2" } }, children: ["x"] }]))).toThrow(/declared once, in the root's fonts/);
    expect(() => web(page([], { props: { width: 600, fonts: [{ family: "A, B", src: "https://x.test/a.woff2" }] } }))).toThrow(/family is one font's name/);
    expect(() => web(page([], { props: { width: 600, fonts: [{ family: "A", src: "javascript:alert(1)" }] } }))).toThrow(/src is the font file's/);
    expect(() => web(page([], { props: { width: 600, fonts: [{ family: "A", src: "https://x.test/a.woff2", weight: 950.5 }] } }))).toThrow(/weight is 1 to 1000/);
  });

  it("adds no markup from what users write", () => {
    const evil = `"><script>alert(1)</script><img src=x onerror=alert(1)>'`;
    const { html } = web(
      page(
        [
          { type: "Text", children: [evil] },
          { type: "Link", props: { href: `https://example.com/?q=${evil}` }, children: [evil] },
          { type: "Image", props: { src: `https://example.com/${evil}.png`, alt: evil } },
          { type: "Text", children: [{ type: "MergeTag", props: { name: evil } }] },
          { type: "Text", style: { fontFamily: "X, Arial" }, children: ["x"] },
        ],
        { props: { width: 600, title: evil, description: evil, lang: "en", fonts: [{ family: "X", src: `https://example.com/"); } body { color: red } </style><script>x</script>` }] } }
      )
    );
    // Parsed, it holds only the markup the exporter writes, and the values as text.
    const dom = new JSDOM(html).window.document;
    expect(dom.querySelectorAll("script")).toHaveLength(0);
    expect(dom.querySelectorAll("style")).toHaveLength(1);
    expect(dom.querySelectorAll("img")).toHaveLength(1);
    const handlers = [...dom.querySelectorAll("*")].flatMap((element) => [...element.attributes].filter((a) => a.name.startsWith("on")).map((a) => a.name));
    expect(handlers).toEqual([]);
    expect(dom.title).toBe(evil);
    expect(dom.querySelector("img")!.getAttribute("alt")).toBe(evil);
    expect(dom.querySelector("a")!.getAttribute("href")).toBe(`https://example.com/?q=${evil}`);
    expect(dom.querySelector("a")!.textContent).toBe(evil);
    expect(dom.body.textContent).toContain(`{{${evil}}}`);
    // The font's URL stays inside its string: the stylesheet is just the @font-face rule.
    const rules = [...(dom.querySelector("style")!.sheet as CSSStyleSheet).cssRules].map((rule) => rule.cssText);
    expect(rules).toHaveLength(1);
    expect(rules[0]).toMatch(/^@font-face/);
  });

  it("throws on errors", () => {
    expect(() => web(page([{ type: "Text", style: { margin: 1 } }]))).toThrow(ElementsError);
  });

  it("writes lists as ul and ol, their markers in their indent, the gap above each item but the first", () => {
    const { body } = web(
      page([
        { type: "List", children: [{ type: "ListItem", children: ["a"] }, { type: "ListItem", children: ["b"] }] },
        { type: "List", props: { type: "number", start: 5 }, style: { gap: 6, indent: 30, padding: 4 }, children: [{ type: "ListItem", children: ["c"] }, { type: "ListItem", children: ["d"] }] },
      ])
    );
    expect(body).toContain('<ul style="margin:0;padding:0 0 0 24px;list-style-type:disc;box-sizing:border-box"><li style="margin:0">a</li><li style="margin:0">b</li></ul>');
    expect(body).toContain('<ol start="5" style="margin:0;padding:4px 4px 4px 34px;list-style-type:decimal;box-sizing:border-box"><li style="margin:0">c</li><li style="margin:0;margin-top:6px">d</li></ol>');
  });

  it("writes tables with fixed columns, no spacing, header rows in thead", () => {
    const { body } = web(
      page([
        {
          type: "Table",
          style: { cellPadding: 8, border: "1px solid #cccccc" },
          children: [
            { type: "TableRow", props: { header: true }, children: [{ type: "TableCell", style: { width: 100 }, children: ["A"] }, { type: "TableCell", children: ["B"] }] },
            { type: "TableRow", children: [{ type: "TableCell", props: { colSpan: 2 }, children: ["C"] }] },
          ],
        },
      ])
    );
    expect(body).toContain('<table style="border-collapse:separate;border-spacing:0;table-layout:fixed;box-sizing:border-box;border:1px solid #ccc;width:100%"><colgroup><col style="width:16.72%"><col style="width:83.28%"></colgroup>');
    expect(body).toContain('<thead><tr style="font-weight:700"><th scope="col" style="box-sizing:border-box;padding:8px;vertical-align:top;font-weight:700;text-align:left">A</th>');
    expect(body).toContain('<tbody><tr><td colspan="2" style="box-sizing:border-box;padding:8px;vertical-align:top">C</td></tr></tbody></table>');
  });

  it("writes the plain-text version from the template", () => {
    const { text } = web(
      page([
        { type: "Heading", children: ["Welcome"] },
        { type: "Heading", props: { level: 3 }, children: ["Smaller"] },
        { type: "Paragraph", children: ["Hi  ", { type: "MergeTag", props: { name: "name" } }, ",", { type: "LineBreak" }, "read ", { type: "Link", props: { href: "https://example.com/docs" }, children: ["the docs"] }, "."] },
        { type: "Row", children: [{ type: "Column", children: [{ type: "Image", props: { src: "https://example.com/a.png", alt: "Photo" } }] }, { type: "Column", children: [{ type: "Text", children: ["Beside"] }] }] },
        { type: "Divider" },
        { type: "Button", props: { href: "https://example.com" }, children: ["Get started"] },
        { type: "Link", props: { href: "https://example.com" }, children: ["https://example.com"] },
        { type: "Text", hidden: { mobile: true, desktop: true }, children: ["never shown"] },
      ])
    );
    expect(text).toBe("WELCOME\n\nSmaller\n\nHi {{name}},\nread the docs (https://example.com/docs).\n\n[Photo]\n\nBeside\n\n---\n\nGet started (https://example.com)\n\nhttps://example.com");
  });

  it("is the same every time for the same document", () => {
    const document = page([{ type: "Row", children: [{ type: "Column", hidden: { mobile: true } }] }]);
    expect(web(document).html).toBe(web(document).html);
  });
});
