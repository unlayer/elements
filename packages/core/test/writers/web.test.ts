import { JSDOM } from "jsdom";
import { ElementsError } from "../../src";
import { renderTemplate, validateTemplate } from "../../src/writers";

const page = (children: unknown[], extra: Record<string, unknown> = {}) => ({ root: { type: "Page", props: { width: 600 }, children, ...extra } });
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
      '<main style="max-width:600px;margin:0 auto;display:flex;flex-direction:column;overflow-wrap:break-word;color:#000;font-family:Arial, Helvetica, sans-serif;font-size:16px;font-weight:400;font-style:normal;line-height:1.5;letter-spacing:0;text-align:left;text-transform:none">' +
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
    // The options' syntax as it is, the name in it escaped; the default as text.
    const tags = page([{ type: "Text", children: [{ type: "MergeTag", props: { name: "first_name" } }, " ", { type: "MergeTag", props: { name: "a<b" } }] }]);
    expect(web(tags, { mergeTag: (name: string) => `<%= ${name} %>` }).body).toContain("<%= first_name %> <%= a&lt;b %>");
    expect(web(tags).body).toContain("{{first_name}} {{a&lt;b}}");
    const quoted = page([{ type: "Text", children: [{ type: "MergeTag", props: { name: 'a" onmouseover="x' } }] }]);
    expect(web(quoted, { mergeTag: (name: string) => `<span data-name="${name}">tag</span>` }).body).toContain('<span data-name="a&quot; onmouseover=&quot;x">tag</span>');
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

  it("puts a list's gap above an item only where an item before it shows, the phone gap on phones", () => {
    const { head, body } = web(page([{ type: "List", style: { gap: 12 }, children: [{ type: "ListItem", hidden: { desktop: true }, children: ["one"] }, { type: "ListItem", children: ["two"] }] }]));
    // Desktop doesn't show "one", so "two" is first there; phones show both.
    const two = /<li class="(e[0-9a-z]{5})" style="margin:0">two<\/li>/.exec(body)![1];
    expect(head).toContain(`@media (max-width: 480px){.${two}{margin-top:12px!important}}`);
    // The List's phone gap.
    const phone = web(page([{ type: "List", style: { gap: 12 }, mobile: { gap: 4 }, children: [{ type: "ListItem", children: ["a"] }, { type: "ListItem", children: ["b"] }] }]));
    const b = /<li class="(e[0-9a-z]{5})" style="margin:0;margin-top:12px">b<\/li>/.exec(phone.body)![1];
    expect(phone.head).toContain(`.${b}{margin-top:4px!important}`);
    // No gap at all: no class.
    expect(web(page([{ type: "List", children: [{ type: "ListItem", hidden: { mobile: true }, children: ["a"] }, { type: "ListItem", children: ["b"] }] }])).body).toContain('<li style="margin:0">b</li>');
  });

  it("hides a run of the root's content where all of it hides, so its gap beside a Section goes too, and gives the root its phone gap", () => {
    const section = { type: "Section", children: [{ type: "Text", children: ["band"] }] };
    const { head, body } = web(page([{ type: "Text", children: ["A"] }, section, { type: "Text", hidden: { desktop: true }, children: ["phones only"] }, section], { style: { gap: 16 }, mobile: { gap: 4 } }));
    const run = /<div class="(e[0-9a-z]{5}) (e[0-9a-z]{5})" style="width:100%;[^"]*"><div class="e[0-9a-z]{5}"[^>]*>phones only/.exec(body)!;
    // Desktop doesn't show the run: it's hidden there, and the flex gap beside it with it.
    expect(head).toMatch(new RegExp(`@media \\(min-width: 481px\\)\\{[^}]*\\.${run[1]}\\{display:none!important\\}`));
    expect(head).toContain(`.${run[2]}{gap:4px!important}`);
    expect(body).toMatch(/<main class="(e[0-9a-z]{5})"/);
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
    expect(body).toContain('<table style="border-collapse:separate;border-spacing:0;table-layout:fixed;box-sizing:border-box;border:1px solid #ccc;width:100%"><colgroup><col style="width:100px"><col style="width:auto"></colgroup>');
    expect(body).toContain('<thead><tr style="font-weight:700"><th scope="col" style="box-sizing:border-box;padding:8px;vertical-align:top;font-weight:700;text-align:left">A</th>');
    expect(body).toContain('<tbody><tr><td colspan="2" style="box-sizing:border-box;padding:8px;vertical-align:top">C</td></tr></tbody></table>');
  });

  it("leaves a table cell hidden everywhere out of the plain text", () => {
    const { text } = web(page([{ type: "Table", children: [{ type: "TableRow", children: [{ type: "TableCell", children: ["seen"] }, { type: "TableCell", hidden: { desktop: true, mobile: true }, children: ["unseen"] }] }] }]));
    expect(text).toContain("seen");
    expect(text).not.toContain("unseen");
  });

  it("keeps a column's share of the table beside one of its own px, the column with no width taking what's left", () => {
    const { body } = web(page([{ type: "Table", children: [{ type: "TableRow", children: [{ type: "TableCell", style: { width: "40%" }, children: ["Share"] }, { type: "TableCell", children: ["Free"] }, { type: "TableCell", style: { width: 120 }, children: ["Px"] }] }] }]));
    expect(body).toContain('<colgroup><col style="width:40%"><col style="width:auto"><col style="width:120px"></colgroup>');
  });

  it("writes a table whose cells share their borders, a row's height and footer rows in tfoot", () => {
    const { body } = web(
      page([
        {
          type: "Table",
          style: { borderCollapse: "collapse" },
          children: [
            { type: "TableRow", style: { height: 40 }, children: [{ type: "TableCell", children: ["A"] }] },
            { type: "TableRow", children: [{ type: "TableCell", children: ["B"] }] },
            { type: "TableRow", props: { footer: true }, children: [{ type: "TableCell", children: ["C"] }] },
          ],
        },
      ])
    );
    expect(body).toContain('style="border-collapse:collapse;');
    expect(body).toContain('<tbody><tr style="height:40px">');
    expect(body).toMatch(/<\/tbody><tfoot><tr><td[^>]*>C<\/td><\/tr><\/tfoot><\/table>/);
  });

  it("writes a Button's width with its padding on top where it says, a place of its own (on phones too), its link's other attributes and a link to nothing", () => {
    const { head, body } = web(
      page([
        { type: "Button", props: { href: { href: "", target: "_blank" }, attrs: { class: "cta", "data-x": "1", target: "_top" } }, style: { width: 300, boxSizing: "content-box", alignSelf: "end" }, mobile: { alignSelf: "start", fontSize: 20 }, children: ["Go"] },
      ])
    );
    const anchor = /<a [^>]*>/.exec(body)![0];
    expect(anchor).toContain('href=""');
    expect(anchor).toMatch(/class="e[0-9a-z]{5} cta"/);
    expect(anchor).toContain('data-x="1"');
    expect(anchor).toContain('target="_top"');
    // Past its place's end where it's wider, whatever its place (browsers without `safe` read the one before).
    expect(anchor).toContain("align-self:flex-end;align-self:safe flex-end");
    expect(anchor).toMatch(/box-sizing:content-box/);
    expect(anchor).not.toMatch(/box-sizing:border-box/);
    expect(body).toContain(">Go</a>");
    expect(head).toContain("align-self:flex-start!important");
  });

  it("raises and lowers text, writes titles, labels and a block's own direction", () => {
    const { body } = web(
      page([
        { type: "Paragraph", props: { dir: "rtl" }, children: ["E=mc", { type: "Span", style: { verticalAlign: "super" }, children: ["2"] }] },
        { type: "Button", props: { href: "https://example.com", title: "Go", "aria-label": "Go to the shop" }, children: ["Go"] },
      ])
    );
    expect(body).toContain('<p dir="rtl" style="margin:0;text-align:right">E=mc<sup style="line-height:0">2</sup></p>');
    expect(body).toContain('<a href="https://example.com" title="Go" aria-label="Go to the shop" style=');
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

  it("writes a Layer as a grid of one cell, its children over each other, its Image covering it where it has a height", () => {
    const children = [
      { type: "Image", props: { src: { src: "https://example.com/hero.jpg", width: 1200, height: 600 }, alt: "Sea" } },
      { type: "Column", children: [{ type: "Text", children: ["Summer sale"] }] },
      { type: "Button", props: { href: "https://example.com" }, children: ["Shop"] },
    ];
    const { body } = web(page([{ type: "Layer", style: { height: 300, alignItems: "end", justifyItems: "center", borderRadius: 8 }, children }]));
    expect(body).toContain('style="display:grid;grid-template:minmax(0, 1fr) / minmax(0, 1fr);align-items:end;justify-items:center;overflow:hidden;height:300px;border-radius:8px"');
    expect(body).toMatch(/<img src="https:\/\/example.com\/hero.jpg" alt="Sea" width="600" style="grid-area:1 \/ 1;min-width:0;display:block;[^"]*;width:100%;height:100%;max-width:none;object-fit:cover">/);
    // What fills the width fills it; what has its own size sits where justifyItems says.
    expect(body).toContain('<div style="grid-area:1 / 1;min-width:0;justify-self:stretch;');
    expect(body).toMatch(/<a [^>]*style="grid-area:1 \/ 1;min-width:0;(?!justify-self)/);
  });

  it("writes an Svg as inline SVG, its shapes as SVG's, transparent paint as none, its title read out", () => {
    const { body, text } = web(
      page([
        {
          type: "Svg",
          props: { width: 120, height: 60, title: "Logo" },
          children: [
            { type: "Rect", props: { width: 120, height: 60, rx: 8 }, style: { fill: "#6366f1" } },
            { type: "Circle", props: { cx: 30, cy: 30, r: 20 }, style: { fill: "transparent", stroke: "#ffffff", strokeWidth: 4, opacity: 0.5 } },
            { type: "Path", props: { d: "M60 10 L100 10 L80 50 Z" } },
          ],
        },
      ])
    );
    expect(body).toContain(
      '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60" viewBox="0 0 120 60" role="img" aria-label="Logo" style="align-self:flex-start;display:block;flex:none">' +
        '<rect x="0" y="0" width="120" height="60" rx="8" fill="#6366f1"></rect>' +
        '<circle cx="30" cy="30" r="20" fill="none" stroke="#ffffff" stroke-width="4" opacity="0.5"></circle>' +
        '<path d="M60 10 L100 10 L80 50 Z" fill="#000000"></path></svg>'
    );
    expect(text).toBe("[Logo]");
  });

  it("writes a Canvas as a box of its size, its content laid out in it, what's past it cut", () => {
    const { body } = web({ root: { type: "Canvas", props: { width: 600, height: 315 }, style: { padding: 40, backgroundColor: "#0f172a" }, children: [{ type: "Text", children: ["Launch week"] }] } });
    expect(body).toMatch(/^<main style="width:600px;height:315px;overflow:hidden;[^"]*padding:40px;background-color:#0f172a/);
    expect(body).toContain(">Launch week<");
  });

  describe("a Document, as print HTML", () => {
    const text = (...children: unknown[]) => ({ type: "Text", children });
    const doc = (children: unknown[], props: Record<string, unknown> = {}) => ({ root: { type: "Document", props, children } });

    it("writes each page as a box of the paper's size, its margins as padding, with CSS's @page", () => {
      const { head, body } = web(doc([text("One"), { type: "PageBreak" }, text("Two")], { size: "Letter", orientation: "landscape", margin: [36, 48] }));
      expect(head).toContain("@page{size:Letter landscape;margin:0}");
      const pages = body.match(/<section class="elements-page" style="[^"]*"/g)!;
      expect(pages).toHaveLength(2);
      expect(pages[0]).toContain("width:1056px;height:816px;margin:0 auto;padding:36px 48px 36px 48px");
      // A break after each page but the last.
      expect(pages[0]).toContain("break-after:page");
      expect(pages[1]).not.toContain("break-after");
    });

    it("puts its header and footer on every page, numbered, and its pages' content between them", () => {
      const { body, text: plain } = web(
        doc([
          { type: "PageHeader", children: [text("Acme")] },
          text("Cover"),
          { type: "PageBreak" },
          { type: "PageBreak" },
          { type: "DocumentPage", id: "appendix", style: { backgroundColor: "#f5f5f5" }, children: [text("Appendix")] },
          text("Back"),
          { type: "PageFooter", children: [text("Page ", { type: "PageNumber" }, " of ", { type: "PageNumber", props: { total: true } })] },
        ])
      );
      // Three pages: the cover, the given one, what follows it (an empty run between two breaks is no page).
      const pages = body.split("<section ").slice(1);
      expect(pages).toHaveLength(3);
      expect(pages.map((page) => [page.includes(">Acme<"), /Page 1 of 3|Page 2 of 3|Page 3 of 3/.exec(page)?.[0]])).toEqual([
        [true, "Page 1 of 3"],
        [true, "Page 2 of 3"],
        [true, "Page 3 of 3"],
      ]);
      expect(pages[1]).toMatch(/^id="appendix" class="elements-page" style="[^"]*background-color:#f5f5f5/);
      // The header comes before the content, the footer after it.
      expect(pages[0].indexOf(">Acme<")).toBeLessThan(pages[0].indexOf(">Cover<"));
      expect(pages[0].indexOf(">Cover<")).toBeLessThan(pages[0].indexOf("Page 1 of 3"));
      // Plain text: the pages' content, once (the header and footer are on every page).
      expect(plain).toBe("Cover\n\nAppendix\n\nBack");
    });

    it("says where a document's own components can't go", () => {
      const errors = (input: unknown) => {
        try {
          web(input);
          return [];
        } catch (error) {
          return (error as ElementsError).diagnostics.filter((d) => d.severity === "error").map((d) => [d.code, d.path]);
        }
      };
      expect(errors(page([text("p. ", { type: "PageNumber" })]))).toEqual([["document/page-number", "root.children[0].children[1]"]]);
      expect(errors(doc([{ type: "Column", children: [{ type: "PageBreak" }] }]))[0][1]).toBe("root.children[0].children[0]");
      expect(errors(doc([{ type: "DocumentPage", children: [{ type: "PageHeader", children: [] }] }]))[0][1]).toBe("root.children[0].children[0]");
    });

    it("says where a Menu looks too long for one line, which its PDF can't wrap (print HTML wraps it)", () => {
      const items = (count: number) => Array.from({ length: count }, (_, index) => ({ text: `Section ${index + 1}`, href: `https://example.com/${index}` }));
      const said = (count: number) => validateTemplate(doc([text("a"), { type: "Menu", props: { items: items(count), separator: "|" } }])).diagnostics.filter((d) => d.code === "pdf/unsupported").map((d) => d.path);
      expect(said(4)).toEqual([]);
      expect(said(12)).toEqual(["root.children[1]"]);
      expect(web(doc([{ type: "Menu", props: { items: items(12) } }])).body).toContain("flex-wrap:wrap");
    });
  });

  it("writes a Video as its player, 16:9, as wide as its place", () => {
    const { body } = web(page([{ type: "Video", props: { src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10", title: "Launch" }, style: { maxWidth: 400 } }]));
    expect(body).toContain(
      '<div style="align-self:flex-start;width:100%;max-width:400px"><div style="position:relative;height:0;padding-bottom:56.25%;overflow:hidden"><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="Launch" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen="" loading="lazy" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0"></iframe></div></div>'
    );
    expect(web(page([{ type: "Video", props: { src: "https://player.vimeo.com/video/76979871" } }])).body).toContain('src="https://player.vimeo.com/video/76979871"');
  });

  it("writes an Html block's markup as it is, in a div only where it needs one: an id, classes, a place in a Row", () => {
    const html = (extra: Record<string, unknown> = {}) => ({ type: "Html", props: { html: "<p>Sale</p>" }, ...extra });
    const { body } = web(page([html(), html({ id: "again", hidden: { mobile: true } }), { type: "Row", children: [html()] }]));
    expect(body).toMatch(/<main[^>]*><p>Sale<\/p><div id="again" class="[^"]+"><p>Sale<\/p><\/div>/);
    expect(body).toMatch(/<div style="[^"]*flex[^"]*"><p>Sale<\/p><\/div>/);
  });

  it("writes an Html block's markup as it is, and its text (or its markup's words) in the plain text", () => {
    const { body, text } = web(page([{ type: "Html", props: { html: "<p>Sale <b>now</b></p>" } }, { type: "Html", id: "own", props: { html: "<hr>", text: "Our own words" } }]));
    expect(body).toContain('<p>Sale <b>now</b></p><div id="own"><hr></div>');
    expect(text).toBe("Sale now\n\nOur own words");
  });

  it("writes a Row's direction and a line height of the font's own", () => {
    const { body } = web(page([
      { type: "Row", props: { dir: "ltr" }, children: [{ type: "Text", children: ["A"] }] },
      { type: "Text", style: { lineHeight: "normal" }, children: ["B"] },
    ]));
    expect(body).toMatch(/<div class="\w+" dir="ltr" style="display:flex/);
    expect(body).toContain("line-height:normal");
  });

  it("leaves out a text's color where it's the same as what's around it", () => {
    const words = (color: string) => web(page([{ type: "Text", style: { color }, children: ["A"] }], { style: { color: "#000000" } } as never)).body;
    expect(words("#000000")).toContain("<div>A</div>");
    expect(words("#ff0000")).toContain('<div style="color:#f00">A</div>');
  });

  it("places an Image on phones", () => {
    const { head } = web(page([{ type: "Image", props: { src: "https://example.com/a.png" }, style: { width: 100 }, mobile: { alignSelf: "end" } }]));
    expect(head).toContain("align-self:flex-end!important");
  });
});
