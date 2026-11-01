import { JSDOM } from "jsdom";
import { renderTemplate } from "../src";

const email = (children: unknown[], extra: Record<string, unknown> = {}) => ({ root: { type: "Email", props: { width: 600 }, children, ...extra } });
const render = (input: unknown, options: Record<string, unknown> = {}) => renderTemplate(input, options);

/** What's inside Outlook's conditional comments, and the HTML everyone else reads. */
const outlookOnly = (html: string) => [...html.matchAll(/<!--\[if mso\]>([\s\S]*?)<!\[endif\]-->/g)].map((m) => m[1]).join("");
const notOutlook = (html: string) => html.replace(/<!--\[if mso\]>[\s\S]*?<!\[endif\]-->/g, "");

describe("email HTML", () => {
  it("writes the shell: Outlook's settings, the preview text, the language and background kept where Gmail drops them", () => {
    const { html, head, body, bodyStyle } = render(
      email([{ type: "Text", children: ["Hi"] }], { props: { width: 600, title: "A & B", lang: "ar", dir: "rtl", previewText: "Your <order>" }, style: { backgroundColor: "#eeeeee" } })
    );
    expect(html.startsWith('<!DOCTYPE html><html lang="ar" dir="rtl" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office"><head>')).toBe(true);
    expect(head).toContain("<o:PixelsPerInch>96</o:PixelsPerInch>");
    expect(head).toContain('<meta name="x-apple-disable-message-reformatting">');
    expect(head).toContain("<title>A &amp; B</title>");
    expect(bodyStyle).toBe("margin:0;padding:0;background-color:#eee");
    expect(body.startsWith('<div style="display:none;max-height:0;overflow:hidden;mso-hide:all" aria-hidden="true">Your &lt;order&gt;&#847;')).toBe(true);
    expect(body).toContain('<div role="article" aria-roledescription="email" aria-label="A &amp; B" lang="ar" dir="rtl" style="background-color:#eee">');
    expect(body).toContain('<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#eeeeee" style="background-color:#eee">');
  });

  it("stacks content at the content width, a row each, the gap as padding, text styles on the text", () => {
    const { body } = render(
      email(
        [
          { type: "Heading", props: { level: 2 }, children: ["Welcome"] },
          { type: "Paragraph", style: { fontSize: 14 }, children: ["Hello"] },
        ],
        { style: { gap: 16 } }
      )
    );
    expect(body).toContain(
      '<td align="center"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px">' +
        '<tr><td style="padding-bottom:16px"><h2 style="margin:0;color:#000;font-family:Arial, Helvetica, sans-serif;font-size:24px;font-weight:700;line-height:30px;mso-line-height-rule:exactly;text-align:left">Welcome</h2></td></tr>' +
        '<tr><td><p style="margin:0;color:#000;font-family:Arial, Helvetica, sans-serif;font-size:14px;line-height:21px;mso-line-height-rule:exactly;text-align:left">Hello</p></td></tr></table></td>'
    );
  });

  it("puts a box (padding, background, border, a width) on a table around its content, as Word has none on divs and paragraphs", () => {
    const { body, diagnostics } = render(email([{ type: "Paragraph", style: { padding: [8, 12], backgroundColor: "#ffeecc", maxWidth: 300, borderRadius: 6 }, children: ["Boxed"] }]));
    expect(body).toContain(
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:300px"><tr><td bgcolor="#ffeecc" style="padding:8px 12px;background-color:#fec;border-radius:6px"><p style="margin:0;'
    );
    expect(diagnostics.map((d) => d.code)).toEqual(["email/outlook-degraded"]);
  });

  it("lays out a Row as fluid hybrid: Outlook's table in conditional comments, inline-blocks of the resolver's widths for the rest", () => {
    const { body, head } = render(
      email([
        {
          type: "Row",
          id: "cols",
          style: { gap: 20, alignItems: "center" },
          children: [
            { type: "Column", style: { width: "40%" }, children: [{ type: "Text", children: ["a"] }] },
            { type: "Column", style: { flex: 2 }, children: [{ type: "Text", children: ["b"] }] },
            { type: "Image", props: { src: { src: "https://example.com/a.png", width: 80 } }, style: { flex: "none" } },
          ],
        },
      ])
    );
    // 600 less two 20px gaps: 240 for 40%, then 80 for the image, 240 left for the flex child.
    expect(outlookOnly(body)).toBe(
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td width="240" valign="middle" style="width:240px">' +
        '</td><td width="20" style="width:20px"></td><td width="240" valign="middle" style="width:240px">' +
        '</td><td width="20" style="width:20px"></td><td width="80" valign="middle" style="width:80px">' +
        "</td></tr></table>"
    );
    const others = notOutlook(body);
    expect(others.match(/<div style="display:inline-block;vertical-align:middle;width:100%;max-width:(\d+)px">/g)).toHaveLength(3);
    expect(others).toContain("max-width:240px");
    expect(others).toContain("max-width:80px");
    // Spacers between them, only outside Outlook, as tall as the gap on phones.
    const spacer = /<!--\[if !mso\]><!--><div class="(e[0-9a-z]{5})" style="display:inline-block;width:20px"><\/div><!--<!\[endif\]-->/.exec(body);
    expect(spacer).not.toBeNull();
    expect(head).toContain(`.${spacer![1]}{height:20px!important}`);
    // On phones every child takes the whole width.
    const stack = /<td class="(e[0-9a-z]{5})" style="font-size:0">/.exec(body)![1];
    expect(head).toContain(`.${stack}>div{width:100%!important;max-width:100%!important}`);
    expect(body).toContain('<table id="cols" role="presentation"');
  });

  it("keeps a Row that doesn't stack on phones as a table row", () => {
    const { body } = render(email([{ type: "Row", props: { stackOnMobile: false }, style: { gap: 10 }, children: [{ type: "Column", children: [] }, { type: "Column", children: [] }] }]));
    expect(body).toContain('<tr><td width="295" valign="top" style="width:295px">');
    expect(body).toContain('<td width="10" style="width:10px"></td><td width="295" valign="top" style="width:295px">');
    expect(body).not.toContain("[if mso]");
  });

  it("writes a button as a table: its colors on the cell, its padding on the link and as Outlook's cell padding", () => {
    const { body, head } = render(
      email([
        { type: "Button", props: { href: "https://example.com" }, hover: { backgroundColor: "#000000", color: "#ffffff" }, children: ["Go"] },
        { type: "Button", props: { href: "https://example.com" }, style: { width: 200 }, children: ["Wide"] },
      ])
    );
    expect(body).toMatch(
      /<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" bgcolor="#0879a1" class="(e[0-9a-z]{5})" style="background-color:#0879a1;border-radius:4px;mso-padding-alt:10px 20px"><a href="https:\/\/example.com" class="(e[0-9a-z]{5})" style="display:inline-block;padding:10px 20px;color:#fff;font-family:Arial, Helvetica, sans-serif;font-size:14px;line-height:16.8px;mso-line-height-rule:exactly;text-align:center;text-decoration:none;border-radius:4px">Go<\/a><\/td><\/tr><\/table>/
    );
    // Hover changes the background where it's set (the cell) and the text's color where it's set (the link).
    const [, cell, link] = /<td align="center" bgcolor="#0879a1" class="(e[0-9a-z]{5})"[^>]*><a href="https:\/\/example.com" class="(e[0-9a-z]{5})"/.exec(body)!;
    expect(head).toContain(`.${cell}:hover{background-color:#000!important}`);
    expect(head).toContain(`.${link}:hover{color:#fff!important}`);
    // A button with a width fills it: a 200px table (Word's width), its link a block.
    expect(body).toContain('<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:200px"><tr><td align="center"');
    expect(body).toContain('style="display:block;padding:10px 20px;');
    expect(body).not.toContain("v:roundrect");
  });

  it("writes images with px width attributes, fluid elsewhere, and warns where Outlook can't know the width", () => {
    const { body, diagnostics } = render(
      email([
        { type: "Image", props: { src: { src: "https://example.com/a.png", width: 1200, height: 600 }, alt: "Hero" } },
        { type: "Image", props: { src: "https://example.com/b.png" }, style: { width: "50%" } },
        { type: "Image", props: { src: "https://example.com/c.png" } },
      ])
    );
    expect(body).toContain('<img src="https://example.com/a.png" alt="Hero" width="600" height="300" border="0" style="display:block;width:100%;max-width:600px;height:auto;border:0">');
    expect(body).toContain('<img src="https://example.com/b.png" alt="" width="300" border="0" style="display:block;width:100%;max-width:50%;height:auto;border:0">');
    expect(body).toContain('<img src="https://example.com/c.png" alt="" border="0" style="display:block;max-width:100%;height:auto;border:0">');
    expect(diagnostics.filter((d) => d.code === "email/image-width").map((d) => d.path)).toEqual(["root.children[2].props.src"]);
  });

  it("centers content with its own size by the stack's align, else its text alignment", () => {
    const at = (style: Record<string, unknown>) =>
      render(email([{ type: "Column", style, children: [{ type: "Button", props: { href: "#" }, children: ["Go"] }] }])).body.match(/<tr><td( align="[a-z]+")?><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" bgcolor/)?.[1];
    expect(at({})).toBeUndefined();
    expect(at({ textAlign: "center" })).toBe(' align="center"');
    expect(at({ alignItems: "end", textAlign: "center" })).toBe(' align="right"');
  });

  it("writes a Section as a full-width band, its content at the content width, gaps outside its background", () => {
    const { body } = render(
      email([{ type: "Section", style: { backgroundColor: "#111111", padding: [24, 16] }, children: [{ type: "Text", children: ["a"] }] }, { type: "Text", children: ["b"] }], { style: { gap: 10 } })
    );
    expect(body).toContain(
      '<tr><td align="center" bgcolor="#111111" style="padding-top:24px;padding-bottom:24px;background-color:#111"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px"><tr><td style="padding:0 16px 0 16px">'
    );
    expect(body).toContain('</td></tr><tr><td style="font-size:0;line-height:10px;mso-line-height-rule:exactly">&nbsp;</td></tr><tr><td align="center">');
  });

  it("writes a divider as a bordered table Word can't make taller", () => {
    const { body } = render(email([{ type: "Divider", style: { width: "50%" } }], { style: { textAlign: "center" } }));
    expect(body).toContain(
      '<td align="center"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="50%"><tr><td style="border-top:1px solid #bbb;font-size:0;line-height:0;mso-line-height-rule:exactly">&nbsp;</td></tr></table></td>'
    );
  });

  it("writes an author's id once, on the outermost element, and no rules nothing uses", () => {
    const { body, head } = render(
      email([
        { type: "Divider", id: "line", mobile: { padding: 4 } },
        { type: "Row", style: { gap: 20 }, children: [{ type: "Column", children: [] }] },
      ])
    );
    expect(body.match(/id="line"/g)).toHaveLength(1);
    // A Row with one child has no spacer, so no spacer's phone height.
    expect(head).not.toContain("height:20px");
  });

  it("never nests conditional comments: what Outlook skips holds none of Outlook's own markup", () => {
    // A Column only phones show, holding a stacking Row (Outlook's ghost table in conditional comments of its own).
    const column = { type: "Column", children: [{ type: "Text", children: ["x"] }] };
    const { body } = render(email([{ type: "Column", hidden: { desktop: true }, children: [{ type: "Row", style: { gap: 10 }, children: [column, column] }] }, { type: "Text", children: ["after"] }]));
    let depth = 0;
    for (const [mark] of body.matchAll(/<!--\[if mso\]>|<!--\[if !mso\]><!-->|<!--<!\[endif\]-->|<!\[endif\]-->/g)) {
      depth += mark.includes("[if") ? 1 : -1;
      expect(depth).toBeLessThanOrEqual(1);
    }
    expect(depth).toBe(0);
    // Classic Outlook (which ends what it skips at the first <![endif]>) reads none of the Column.
    const outlook = body.replace(/<!--\[if !mso\]>[\s\S]*?<!\[endif\]-->/g, "").replace(/<!--\[if mso\]>|<!\[endif\]-->/g, "");
    expect(outlook).not.toContain(">x<");
    // Other clients read all of it, the Row's spacer included, and none of Outlook's table.
    const others = notOutlook(body);
    expect(others.match(/>x<\/div>/g)).toHaveLength(2);
    expect(others).toMatch(/<div class="[^"]*" style="display:inline-block;width:10px"><\/div>/);
    expect(others).not.toMatch(/<td width="\d+" valign/);
  });

  it("writes phone styles to the text they reach, as px line heights, and hides on phones or desktop", () => {
    const { head, body } = render(
      email([
        { type: "Column", mobile: { fontSize: 14 }, children: [{ type: "Text", children: ["inherits"] }, { type: "Text", style: { fontSize: 20 }, children: ["keeps its own"] }] },
        { type: "Text", hidden: { mobile: true }, children: ["desktop only"] },
        { type: "Text", hidden: { desktop: true }, children: ["phone only"] },
        { type: "Text", hidden: { mobile: true, desktop: true }, children: ["never"] },
      ])
    );
    const inherits = /<div class="(e[0-9a-z]{5})" style="[^"]*">inherits<\/div>/.exec(body)![1];
    expect(head).toContain(`.${inherits}{font-size:14px!important;line-height:21px!important}`);
    expect(body).toMatch(/<div style="[^"]*font-size:20px[^"]*">keeps its own<\/div>/);
    const hidePhone = /<tr class="(e[0-9a-z]{5})"><td><div[^>]*>desktop only/.exec(body)![1];
    expect(head).toContain(`.${hidePhone}{display:none!important}`);
    // What only phones show isn't Outlook's at all.
    const showPhone = /<!--\[if !mso\]><!--><tr class="(e[0-9a-z]{5})" style="display:none"><td><div[^>]*>phone only<\/div><\/td><\/tr><!--<!\[endif\]-->/.exec(body)![1];
    expect(head).toContain(`.${showPhone}{display:table-row!important}`);
    expect(head).toContain("@media (max-width: 620px){");
    expect(body).not.toContain("never");
  });

  it("writes links, line breaks and merge tags in text, and links around images", () => {
    const { body } = render(
      email([
        {
          type: "Paragraph",
          children: ["Hi ", { type: "MergeTag", props: { name: "first_name" } }, { type: "LineBreak" }, { type: "Link", props: { href: { href: "https://example.com", target: "_blank" } }, children: ["docs"] }],
        },
        { type: "Link", props: { href: "https://example.com" }, children: [{ type: "Image", props: { src: { src: "https://example.com/a.png", width: 120 }, alt: "A" } }] },
      ]),
      { mergeTag: (name: string) => `*|${name.toUpperCase()}|*` }
    );
    expect(body).toContain('Hi *|FIRST_NAME|*<br><a href="https://example.com" target="_blank" rel="noopener noreferrer" style="color:#00e;text-decoration:underline">docs</a>');
    expect(body).toContain('<a href="https://example.com" style="text-decoration:none"><img src="https://example.com/a.png" alt="A" width="120" border="0"');
  });

  it("raises and lowers text as <sup> and <sub>, without pushing its line apart", () => {
    const { body } = render(email([{ type: "Paragraph", children: ["Brand", { type: "Span", style: { verticalAlign: "super" }, children: ["®"] }, " H", { type: "Span", style: { verticalAlign: "sub" }, children: ["2"] }, "O"] }]));
    expect(body).toContain('>Brand<sup style="line-height:0">®</sup> H<sub style="line-height:0">2</sub>O</p>');
  });

  it("writes a link's, a button's and an image's title and aria-label", () => {
    const { body } = render(
      email([
        { type: "Paragraph", children: [{ type: "Link", props: { href: "https://example.com", title: "Docs", "aria-label": "Read the docs" }, children: ["here"] }] },
        { type: "Button", props: { href: "https://example.com", "aria-label": "Start your trial" }, children: ["Start"] },
        { type: "Image", props: { src: { src: "https://example.com/a.png", width: 100 }, alt: "Logo", title: "Acme" } },
      ])
    );
    expect(body).toContain('<a href="https://example.com" title="Docs" aria-label="Read the docs" style=');
    expect(body).toContain('<a href="https://example.com" aria-label="Start your trial" style=');
    expect(body).toContain('alt="Logo" title="Acme" width="100"');
  });

  it("writes a block's own direction, and starts its text on that side", () => {
    const { body } = render(
      email([
        { type: "Paragraph", props: { dir: "rtl" }, children: ["مرحبا"] },
        { type: "Paragraph", props: { dir: "rtl" }, style: { textAlign: "center" }, children: ["وسط"] },
      ])
    );
    expect(body).toMatch(/<p dir="rtl" style="[^"]*text-align:right">مرحبا<\/p>/);
    expect(body).toMatch(/<p dir="rtl" style="[^"]*text-align:center">وسط<\/p>/);
    // A right-to-left email starts its text on the right.
    expect(render(email([{ type: "Text", children: ["x"] }], { props: { width: 600, dir: "rtl" } })).body).toMatch(/<div style="[^"]*text-align:right">x<\/div>/);
  });

  it("writes indented HTML for reading, the same document as the compact one", async () => {
    const { JSDOM } = await import("jsdom");
    const template = email([{ type: "Paragraph", children: ["A ", { type: "Span", style: { verticalAlign: "super" }, children: ["1"] }] }, { type: "Row", style: { gap: 20 }, children: [{ type: "Column", children: [{ type: "Text", children: ["a"] }] }, { type: "Column" }] }]);
    const compact = render(template).html;
    const pretty = render(template, { pretty: true }).html;
    expect(pretty).not.toBe(compact);
    expect(pretty.split("\n").length).toBeGreaterThan(20);
    // Only white space between tags differs.
    const normal = (html: string) => {
      const dom = new JSDOM(html).window.document;
      const walker = dom.createTreeWalker(dom, 4 /* text */);
      const blank: Node[] = [];
      while (walker.nextNode()) if (!walker.currentNode.textContent!.trim()) blank.push(walker.currentNode);
      for (const node of blank) node.parentNode!.removeChild(node);
      return dom.documentElement.outerHTML;
    };
    expect(normal(pretty)).toBe(normal(compact));
  });

  it("writes web fonts where classic Outlook doesn't read them, and says where they load", () => {
    const { head, diagnostics } = render(
      email([{ type: "Text", style: { fontFamily: "'Brand Sans', Arial, sans-serif" }, children: ["x"] }], {
        props: { width: 600, fonts: [{ family: "Brand Sans", src: "https://fonts.example.com/brand.woff2", weight: 400 }, { family: "Brand Sans", src: "https://fonts.example.com/brand-700.woff2", weight: 700 }] },
      })
    );
    expect(head).toContain(
      '<!--[if !mso]><!--><style>@font-face{font-family:"Brand Sans";src:url("https://fonts.example.com/brand.woff2") format("woff2");font-weight:400}@font-face{font-family:"Brand Sans";src:url("https://fonts.example.com/brand-700.woff2") format("woff2");font-weight:700}</style><!--<![endif]-->'
    );
    // One note, from what fonts declares for email.
    expect(diagnostics.map((d) => [d.code, d.path])).toEqual([["email/degraded", "root.props.fonts"]]);
  });

  it("warns where a font stack ends on a web font, leaving the client to choose", () => {
    const { diagnostics } = render(
      email([{ type: "Text", style: { fontFamily: "'Brand Sans'" }, children: ["x"] }, { type: "Text", style: { fontFamily: "Georgia" }, children: ["y"] }], {
        props: { width: 600, fonts: [{ family: "Brand Sans", src: "https://fonts.example.com/brand.woff2" }] },
      })
    );
    expect(diagnostics.filter((d) => d.code === "email/font-fallback").map((d) => d.path)).toEqual(["root.children[0].style.fontFamily"]);
  });

  it("adds no markup from what users write, and none inside Outlook's comments", () => {
    const evil = `"><script>alert(1)</script><img src=x onerror=alert(1)><!--[if mso]>x<![endif]-->'`;
    const { html } = render(
      email(
        [
          { type: "Text", children: [evil] },
          { type: "Row", children: [{ type: "Column", children: [{ type: "Link", props: { href: `https://example.com/?q=${evil}` }, children: [evil] }] }, { type: "Column", children: [] }] },
          { type: "Image", props: { src: `https://example.com/${evil}.png`, alt: evil } },
          { type: "Text", children: [{ type: "MergeTag", props: { name: evil } }] },
          { type: "Text", style: { fontFamily: "X, Arial" }, children: ["x"] },
          { type: "List", children: [{ type: "ListItem", children: [evil] }] },
          { type: "Table", children: [{ type: "TableRow", props: { header: true }, children: [{ type: "TableCell", children: [evil] }] }] },
        ],
        { props: { width: 600, title: evil, previewText: evil, lang: "en", fonts: [{ family: "X", src: `https://example.com/"); } body { color: red } </style><script>x</script>` }] } }
      )
    );
    const dom = new JSDOM(html).window.document;
    expect(dom.querySelectorAll("script")).toHaveLength(0);
    expect(dom.querySelectorAll("img")).toHaveLength(1);
    const handlers = [...dom.querySelectorAll("*")].flatMap((element) => [...element.attributes].filter((a) => a.name.startsWith("on")).map((a) => a.name));
    expect(handlers).toEqual([]);
    expect(dom.title).toBe(evil);
    expect(dom.querySelector("img")!.getAttribute("alt")).toBe(evil);
    expect(dom.querySelector("a")!.textContent).toBe(evil);
    expect(dom.querySelector("[role=listitem] div")!.textContent).toBe(evil);
    expect(dom.querySelector("th")!.textContent).toBe(evil);
    // Outlook parses what's in its comments as markup: only the exporter's own tables go there.
    const comments: string[] = [];
    const walker = dom.createTreeWalker(dom, 128 /* NodeFilter.SHOW_COMMENT */);
    while (walker.nextNode()) comments.push(walker.currentNode.textContent ?? "");
    expect(comments.length).toBeGreaterThan(0);
    for (const comment of comments) expect(comment).not.toMatch(/script|alert|example\.com/);
  });

  it("writes a list as a table: a row per item, its marker right-aligned in a cell of the indent's width", () => {
    const { body, text } = render(
      email([
        {
          type: "List",
          props: { type: "number", start: 3 },
          style: { gap: 4 },
          children: [
            { type: "ListItem", id: "first", children: ["One ", { type: "Span", style: { fontWeight: 700 }, children: ["bold"] }] },
            { type: "ListItem", children: ["Two", { type: "List", children: [{ type: "ListItem", children: ["Nested"] }] }] },
          ],
        },
      ])
    );
    expect(body).toContain('<table role="list" cellpadding="0" cellspacing="0" border="0" width="100%"><tr role="listitem"><td aria-hidden="true" width="24" valign="top" style="color:#000;');
    expect(body).toContain('text-align:right;width:24px;box-sizing:border-box;padding-right:8px;padding-bottom:4px">3.</td><td valign="top" style="padding-bottom:4px"><div id="first" style="');
    expect(body).toContain('>One <span style="font-weight:700">bold</span></div>');
    // The second item: its marker, its text, then its nested list (bullets), with no gap below the last item.
    expect(body).toMatch(/>4\.<\/td><td valign="top"><div style="[^"]*">Two<\/div><table role="list"[^>]*><tr role="listitem"><td[^>]*>•<\/td>/);
    expect(text).toBe("3. One bold\n4. Two\n  - Nested");
  });

  it("writes a data table: columns in a colgroup, cells with px widths for Word and shares elsewhere, a header row as th", () => {
    const { body, text } = render(
      email([
        {
          type: "Table",
          style: { cellPadding: [8, 12], rowBorder: "1px solid #eeeeee" },
          children: [
            { type: "TableRow", props: { header: true }, children: [{ type: "TableCell", style: { width: "60%" }, children: ["Item"] }, { type: "TableCell", style: { textAlign: "right" }, children: ["Price"] }] },
            { type: "TableRow", style: { backgroundColor: "#fafafa" }, children: [{ type: "TableCell", children: ["Notebook"] }, { type: "TableCell", style: { textAlign: "right" }, children: ["$12"] }] },
          ],
        },
      ])
    );
    expect(body).toContain('<table cellpadding="0" cellspacing="0" border="0" width="100%" style="table-layout:fixed"><colgroup><col width="360" style="width:60%"><col width="240" style="width:40%"></colgroup><thead><tr>');
    expect(body).toContain('<th scope="col" width="360" valign="top" style="color:#000;font-family:Arial, Helvetica, sans-serif;font-size:16px;font-weight:700;');
    expect(body).toContain("width:60%;box-sizing:border-box;padding:8px 12px;border-bottom:1px solid #eee\">Item</th>");
    expect(body).toContain('</thead><tbody><tr bgcolor="#fafafa" style="background-color:#fafafa"><td width="360" valign="top" style="color:#000;');
    // The last row has no line below it.
    expect(body).toContain("text-align:right;width:40%;box-sizing:border-box;padding:8px 12px\">$12</td>");
    expect(text).toBe("Item | Price\nNotebook | $12");
  });

  it("lists what email can't do as asked", () => {
    const { diagnostics } = render(
      email([
        { type: "Row", style: { flexWrap: "wrap", justifyContent: "space-between" }, children: [{ type: "Button", props: { href: "#" }, style: { flex: "none" }, children: ["x"] }] },
        { type: "Column", style: { justifyContent: "center" }, children: [] },
      ])
    );
    expect(diagnostics.map((d) => [d.code, d.severity])).toEqual([
      // What styles and props declare first, then what the email's structure shows.
      ["email/unsupported", "warning"],
      ["email/unsupported", "warning"],
      ["email/degraded", "info"],
      ["email/width", "warning"],
    ]);
  });

  it("warns before Gmail clips a message", () => {
    const many = Array.from({ length: 600 }, (_, i) => ({ type: "Paragraph", children: [`Paragraph ${i} with some words in it to take up room.`] }));
    expect(render(email(many)).diagnostics.map((d) => d.code)).toContain("email/size");
    expect(render(email(many.slice(0, 10))).diagnostics.map((d) => d.code)).not.toContain("email/size");
  });

  it("writes the plain-text version, without the preview text", () => {
    const { text } = render(email([{ type: "Heading", children: ["Hi"] }, { type: "Button", props: { href: "https://example.com" }, children: ["Go"] }], { props: { width: 600, previewText: "Preview" } }));
    expect(text).toBe("HI\n\nGo (https://example.com)");
  });

  it("is the same every time for the same template", () => {
    const template = email([{ type: "Row", children: [{ type: "Column", hidden: { mobile: true } }, { type: "Column" }] }]);
    expect(render(template).html).toBe(render(template).html);
  });
});
