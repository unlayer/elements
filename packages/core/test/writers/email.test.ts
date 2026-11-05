import { JSDOM } from "jsdom";
import { renderTemplate } from "../../src/writers";

const email = (children: unknown[], extra: Record<string, unknown> = {}) => ({ root: { type: "Email", props: { width: 600 }, children, ...extra } });
const render = (input: unknown, options: Record<string, unknown> = {}) => renderTemplate(input, options);

/** Classic Outlook's table of the content's width, around each run of content. */
const OUTLOOK_WIDTH = (width = 600) => `<!--[if mso]><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="${width}" align="center"><tr><td><![endif]-->`;
const OUTLOOK_WIDTH_END = "<!--[if mso]></td></tr></table><![endif]-->";

/** What's inside Outlook's conditional comments, and the HTML everyone else reads. */
const outlookOnly = (html: string) => [...html.matchAll(/<!--\[if mso\]>([\s\S]*?)<!\[endif\]-->/g)].map((m) => m[1]).join("");
const notOutlook = (html: string) => html.replace(/<!--\[if mso\]>[\s\S]*?<!\[endif\]-->/g, "");

describe("email HTML", () => {
  it("writes the shell: Outlook's settings, the preview text, the language and background kept where Gmail drops them", () => {
    const { html, head, body, bodyStyle } = render(
      email([{ type: "Text", children: ["Hi"] }], { props: { width: 600, title: "A & B", lang: "ar", dir: "rtl", previewText: "Your <order>" }, style: { backgroundColor: "#eeeeee" } })
    );
    expect(html.startsWith('<!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html lang="ar" dir="rtl" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head>')).toBe(true);
    expect(head).toContain("<o:PixelsPerInch>96</o:PixelsPerInch>");
    expect(head).toContain('<meta name="x-apple-disable-message-reformatting">');
    expect(head).toContain('<!--[if !mso]><!--><meta http-equiv="X-UA-Compatible" content="IE=edge"><!--<![endif]-->');
    expect(head).toContain("table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse}");
    expect(head).toContain("<title>A &amp; B</title>");
    expect(bodyStyle).toBe("margin:0;padding:0;-webkit-text-size-adjust:100%;background-color:#eee");
    expect(body.startsWith('<div style="display:none;max-height:0;overflow:hidden;mso-hide:all" aria-hidden="true" data-skip-in-text="true">Your &lt;order&gt;&#847;')).toBe(true);
    expect(body).toContain('<div role="article" aria-roledescription="email" aria-label="A &amp; B" lang="ar" dir="rtl" style="background-color:#eee;overflow-wrap:break-word;word-break:break-word">');
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
      `<td align="center">${OUTLOOK_WIDTH()}<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px">` +
        '<tr><td style="padding-bottom:16px"><h2 style="margin:0;color:#000;font-family:Arial, Helvetica, sans-serif;font-size:24px;font-weight:700;line-height:30px;mso-line-height-rule:exactly;text-align:left">Welcome</h2></td></tr>' +
        '<tr><td><p style="margin:0;color:#000;font-family:Arial, Helvetica, sans-serif;font-size:14px;line-height:21px;mso-line-height-rule:exactly;text-align:left">Hello</p></td></tr></table>' +
        `${OUTLOOK_WIDTH_END}</td>`
    );
  });

  it("puts a box (padding, background, border, a width) on a table around its content, as Word has none on divs and paragraphs", () => {
    const { body, diagnostics } = render(email([{ type: "Paragraph", style: { padding: [8, 12], backgroundColor: "#ffeecc", maxWidth: 300, borderRadius: 6 }, children: ["Boxed"] }]));
    expect(body).toContain(
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:300px;border-collapse:separate"><tr><td bgcolor="#ffeecc" style="padding:8px 12px;background-color:#fec;border-radius:6px"><p style="margin:0;'
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
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" align="center"><tr><td>' +
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td width="240" valign="middle" style="width:240px">' +
        '</td><td width="20" style="width:20px"></td><td width="240" valign="middle" style="width:240px">' +
        '</td><td width="20" style="width:20px"></td><td width="80" valign="middle" style="width:80px">' +
        "</td></tr></table></td></tr></table>"
    );
    const others = notOutlook(body);
    expect(others.match(/<div style="display:inline-block;vertical-align:middle;width:100%;max-width:(\d+)px;font-size:16px">/g)).toHaveLength(3);
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
    const { body, head } = render(email([{ type: "Row", props: { stackOnMobile: false }, style: { gap: 10 }, children: [{ type: "Column", children: [] }, { type: "Column", children: [] }] }]));
    // Each cell its width; on phones its share of the width as flexbox gives it, the gap its padding (half on each
    // side of it), and the gap's cell hidden.
    const [, first, gap, second] = /<tr><td width="295" valign="top" class="(e[0-9a-z]{5})" style="width:295px">.*?<td class="(e[0-9a-z]{5})" width="10" style="width:10px"><\/td><td width="295" valign="top" class="(e[0-9a-z]{5})" style="width:295px">/.exec(body)!;
    expect(head).toContain(`.${first}{width:50%!important;padding-right:5px!important;box-sizing:border-box!important}`);
    expect(head).toContain(`.${second}{width:50%!important;padding-left:5px!important;box-sizing:border-box!important}`);
    expect(head).toContain(`.${gap}{display:none!important}`);
    expect(outlookOnly(body)).toBe('<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" align="center"><tr><td></td></tr></table>');
  });

  it("writes a button as a table: its colors on the cell, its padding on the link and as Outlook's cell padding", () => {
    const { body, head } = render(
      email([
        { type: "Button", props: { href: "https://example.com" }, hover: { backgroundColor: "#000000", color: "#ffffff" }, children: ["Go"] },
        { type: "Button", props: { href: "https://example.com" }, style: { width: 200 }, children: ["Wide"] },
      ])
    );
    expect(body).toMatch(
      /<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate"><tr><td align="center" bgcolor="#0879a1" class="(e[0-9a-z]{5})" style="background-color:#0879a1;border-radius:4px;mso-padding-alt:10px 20px"><a href="https:\/\/example.com" class="(e[0-9a-z]{5})" style="display:inline-block;padding:10px 20px;color:#fff;font-family:Arial, Helvetica, sans-serif;font-size:14px;line-height:16.8px;mso-line-height-rule:exactly;text-align:center;text-decoration:none;border-radius:4px">Go<\/a><\/td><\/tr><\/table>/
    );
    // Hover changes the background where it's set (the cell) and the text's color where it's set (the link).
    const [, cell, link] = /<td align="center" bgcolor="#0879a1" class="(e[0-9a-z]{5})"[^>]*><a href="https:\/\/example.com" class="(e[0-9a-z]{5})"/.exec(body)!;
    expect(head).toContain(`.${cell}:hover{background-color:#000!important}`);
    expect(head).toContain(`.${link}:hover{color:#fff!important}`);
    // A button with a width fills it: a 200px table (Word's width), its link a block.
    expect(body).toContain('<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:200px;border-collapse:separate"><tr><td align="center"');
    expect(body).toContain('style="display:block;padding:10px 20px;');
    expect(body).not.toContain("v:roundrect");
  });

  it("writes images with px width attributes, fluid elsewhere, and warns where Outlook can't know the width", () => {
    const { body, diagnostics } = render(
      email([
        { type: "Image", props: { src: { src: "https://example.com/a.png", width: 1200, height: 600 }, alt: "Hero" } },
        { type: "Image", props: { src: "https://example.com/b.png" }, style: { width: "50%" } },
        { type: "Image", props: { src: "https://example.com/c.png" } },
        { type: "Image", props: { src: "https://example.com/d.png" }, style: { width: "24%", maxWidth: 124.8 } },
        { type: "Image", props: { src: "https://example.com/e.png" }, style: { width: "24%", maxWidth: 400 } },
      ])
    );
    expect(body).toContain('<img src="https://example.com/a.png" alt="Hero" width="600" height="300" border="0" style="display:block;width:100%;max-width:600px;height:auto;border:0">');
    expect(body).toContain('<img src="https://example.com/b.png" alt="" width="300" border="0" style="display:block;width:100%;max-width:50%;height:auto;border:0">');
    expect(body).toContain('<img src="https://example.com/c.png" alt="" border="0" style="display:block;max-width:100%;height:auto;border:0">');
    // A percentage with a maximum stays a percentage on phones (24% of a phone's column), the maximum in px: as given
    // where it's the image's width (to the fraction of a pixel), else the width it's drawn at.
    expect(body).toContain('<img src="https://example.com/d.png" alt="" width="125" border="0" style="display:block;width:24%;max-width:124.8px;height:auto;border:0">');
    expect(body).toContain('<img src="https://example.com/e.png" alt="" width="144" border="0" style="display:block;width:24%;max-width:144px;height:auto;border:0">');
    expect(diagnostics.filter((d) => d.code === "email/image-width").map((d) => d.path)).toEqual(["root.children[2].props.src"]);
  });

  it("centers content with its own size by the stack's align, else its text alignment", () => {
    const at = (style: Record<string, unknown>) =>
      render(email([{ type: "Column", style, children: [{ type: "Button", props: { href: "#" }, children: ["Go"] }] }])).body.match(/<tr><td( align="[a-z]+")?><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate"><tr><td align="center" bgcolor/)?.[1];
    expect(at({})).toBeUndefined();
    expect(at({ textAlign: "center" })).toBe(' align="center"');
    expect(at({ alignItems: "end", textAlign: "center" })).toBe(' align="right"');
  });

  it("writes a Section as a full-width band, its content at the content width, gaps outside its background", () => {
    const { body } = render(
      email([{ type: "Section", style: { backgroundColor: "#111111", padding: [24, 16] }, children: [{ type: "Text", children: ["a"] }] }, { type: "Text", children: ["b"] }], { style: { gap: 10 } })
    );
    expect(body).toContain(
      `<tr><td align="center" bgcolor="#111111" style="padding-top:24px;padding-bottom:24px;background-color:#111">${OUTLOOK_WIDTH()}<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px"><tr><td style="padding:0 16px 0 16px">`
    );
    expect(body).toContain('</td></tr><tr><td style="font-size:0;line-height:10px;mso-line-height-rule:exactly">&nbsp;</td></tr><tr><td align="center">');
  });

  it("writes a divider as a bordered table Word can't make taller", () => {
    const { body } = render(email([{ type: "Divider", style: { width: "50%" } }], { style: { textAlign: "center" } }));
    expect(body).toContain(
      '<td align="center"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="50%" style="border-collapse:separate"><tr><td style="border-top:1px solid #bbb;font-size:0;line-height:0;mso-line-height-rule:exactly">&nbsp;</td></tr></table></td>'
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

  it("writes a run's own phone text styles inside text, its line height from the text's, and leaves the text's to the text", () => {
    const { head, body } = render(
      email([
        {
          type: "Text",
          mobile: { fontSize: 14, lineHeight: 2 },
          children: [
            { type: "Span", mobile: { fontSize: 30 }, children: ["big"] },
            " ",
            { type: "Link", props: { href: "https://example.com" }, mobile: { fontSize: 18 }, children: ["link"] },
            " ",
            { type: "Span", style: { fontWeight: 700 }, children: ["bold"] },
            { type: "Span", style: { verticalAlign: "super" }, mobile: { fontSize: 10 }, children: ["TM"] },
          ],
        },
      ])
    );
    const text = /<div class="(e[0-9a-z]{5})" style="[^"]*"><span class="e[0-9a-z]{5}">big/.exec(body)![1];
    expect(head).toContain(`.${text}{font-size:14px!important;line-height:28px!important}`);
    // A run's line height on phones is its size times the text's phone line height, as on desktop.
    const big = /<span class="(e[0-9a-z]{5})">big<\/span>/.exec(body)![1];
    expect(head).toContain(`.${big}{font-size:30px!important;line-height:60px!important}`);
    const link = /<a class="(e[0-9a-z]{5})" href="https:\/\/example\.com"[^>]*>link<\/a>/.exec(body)![1];
    expect(head).toContain(`.${link}{font-size:18px!important;line-height:36px!important}`);
    // The Text's own phone styles reach "bold" through CSS: no class of its own.
    expect(body).toMatch(/<span style="font-weight:700">bold<\/span>/);
    // Raised, it keeps no line height on phones either, so its line doesn't grow.
    const tm = /<sup class="(e[0-9a-z]{5})" style="line-height:0">TM<\/sup>/.exec(body)![1];
    expect(head).toContain(`.${tm}{font-size:10px!important}`);
  });

  describe("gaps only between what shows, on desktop and on phones", () => {
    const column = (hidden?: Record<string, boolean>) => ({ type: "Column", hidden, children: [{ type: "Text", children: ["x"] }] });
    const row = (children: unknown[], style: Record<string, unknown> = { gap: 20 }, props: Record<string, unknown> = {}) => render(email([{ type: "Row", style, props, children }]));
    /** What classic Outlook reads: its conditional comments in, what's kept from it out. */
    const outlookView = (html: string) => html.replace(/<!--\[if !mso\]><!-->[\s\S]*?<!--<!\[endif\]-->/g, "").replace(/<!--\[if mso\]>|<!\[endif\]-->/g, "");
    /** The spacers other clients show on desktop (a spacer only phones show is display:none). */
    const shownSpacers = (html: string) => notOutlook(html).match(/<div( class="[^"]*")? style="display:inline-block;width:20px"><\/div>/g) ?? [];

    it("leaves a child hidden on desktop out of Outlook's gaps, first or in the middle, in a stacking Row and one kept side by side", () => {
      for (const children of [[column({ desktop: true }), column(), column()], [column(), column({ desktop: true }), column()]]) {
        const stacking = row(children).body;
        expect(outlookOnly(stacking).match(/<td width="20"/g)).toHaveLength(1);
        expect(shownSpacers(stacking)).toHaveLength(1);
        const sideBySide = row(children, { gap: 20 }, { stackOnMobile: false }).body;
        expect(outlookView(sideBySide).match(/<td[^>]* width="20"/g)).toHaveLength(1);
      }
    });

    it("puts the phone gap between stacked children, with a spacer only phones show where the desktop has no gap", () => {
      // No gap anywhere: no spacer (an empty inline-block).
      expect(notOutlook(row([column(), column()], { gap: 0 }).body)).not.toMatch(/<div[^>]*style="display:inline-block[^"]*"><\/div>/);
      const { head, body } = render(email([{ type: "Row", style: { gap: 0 }, mobile: { gap: 12 }, children: [column(), column()] }]));
      expect(outlookOnly(body)).not.toMatch(/<td width="0"/);
      const [, shows, tall] = /<div class="(e[0-9a-z]{5}) (e[0-9a-z]{5})" style="display:inline-block;display:none"><\/div>/.exec(notOutlook(body))!;
      expect(head).toContain(`.${shows}{display:inline-block!important}`);
      expect(head).toContain(`.${tall}{height:12px!important}`);
    });

    it("gives a Row kept side by side its phone gap on phones", () => {
      const { head, body } = render(email([{ type: "Row", style: { gap: 20 }, mobile: { gap: 4 }, props: { stackOnMobile: false }, children: [column(), column()] }]));
      // The cells' padding on phones (the gap's own cell is hidden there).
      const [first, second] = [...body.matchAll(/<td width="290" valign="top" class="(e[0-9a-z]{5})"/g)].map((m) => m[1]);
      expect(head).toContain(`.${first}{width:50%!important;padding-right:2px!important;box-sizing:border-box!important}`);
      expect(head).toContain(`.${second}{width:50%!important;padding-left:2px!important;box-sizing:border-box!important}`);
    });

    it("leaves no gap under the last child shown on desktop, and gives phones theirs where they show what's under it", () => {
      const { head, body } = render(
        email(
          [
            { type: "Text", children: ["A"] },
            { type: "Text", children: ["B"] },
            { type: "Text", hidden: { desktop: true }, children: ["C"] },
          ],
          { style: { gap: 16 }, mobile: { gap: 6 } }
        )
      );
      // A has a gap under it on desktop, and the phone gap on phones.
      const underA = /<td class="(e[0-9a-z]{5})" style="padding-bottom:16px"><div[^>]*>A<\/div>/.exec(body)![1];
      expect(head).toContain(`.${underA}{padding-bottom:6px!important}`);
      // B is the last child desktop shows; phones show C under it.
      const underB = /<td class="(e[0-9a-z]{5})"><div[^>]*>B<\/div>/.exec(body)![1];
      expect(head).toContain(`.${underB}{padding-bottom:6px!important}`);
    });

    it("leaves no gap under the last item phones show, in its marker's cell as in its own", () => {
      const { head, body } = render(email([{ type: "List", style: { gap: 4 }, children: [{ type: "ListItem", children: ["x"] }, { type: "ListItem", hidden: { mobile: true }, children: ["y"] }] }]));
      const [, marker, item] = /<td aria-hidden="true"[^>]*class="(e[0-9a-z]{5})"[^>]*>•<\/td><td valign="top" class="(e[0-9a-z]{5})" style="padding-bottom:4px"><div[^>]*>x<\/div>/.exec(body)!;
      expect(marker).toBe(item);
      expect(head).toContain(`.${item}{padding-bottom:0!important}`);
    });

    it("puts the root's gap beside a Section only where both show, the phone gap on phones", () => {
      const section = (hidden?: Record<string, boolean>) => ({ type: "Section", hidden, children: [{ type: "Text", children: ["band"] }] });
      const gapRow = /<tr( class="e[0-9a-z]{5}")?( style="display:none")?><td( class="e[0-9a-z]{5}")? style="font-size:0;line-height:30px;mso-line-height-rule:exactly">&nbsp;<\/td><\/tr>/g;
      // A, a Section only phones show, B: one gap between A and B on desktop, in Outlook too.
      const hiddenBand = render(email([{ type: "Text", children: ["A"] }, section({ desktop: true }), { type: "Text", children: ["B"] }], { style: { gap: 30 } })).body;
      const rows = [...hiddenBand.matchAll(gapRow)];
      expect(rows.filter((m) => !m[2])).toHaveLength(1);
      expect(outlookView(hiddenBand).match(gapRow)).toHaveLength(1);
      // The phone gap beside a Section.
      const { head, body } = render(email([section(), { type: "Text", children: ["A"] }], { style: { gap: 30 }, mobile: { gap: 8 } }));
      const cell = /<tr><td class="(e[0-9a-z]{5})" style="font-size:0;line-height:30px/.exec(body)![1];
      expect(head).toContain(`.${cell}{line-height:8px!important}`);
    });
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

  it("writes the options' merge-tag syntax as it is (ERB, Liquid filters), the name in it escaped; the default as text", () => {
    const tags = email([{ type: "Paragraph", children: [{ type: "MergeTag", props: { name: "first_name" } }, " ", { type: "MergeTag", props: { name: "a<b" } }] }]);
    expect(render(tags, { mergeTag: (name: string) => `<%= ${name} %>` }).body).toContain("<%= first_name %> <%= a&lt;b %>");
    expect(render(tags, { mergeTag: (name: string) => `{{ ${name} | default: "you & yours" }}` }).body).toContain('{{ first_name | default: "you & yours" }}');
    expect(render(tags).body).toContain("{{first_name}} {{a&lt;b}}");
    // A name in an attribute's value stays inside it.
    const quoted = email([{ type: "Paragraph", children: [{ type: "MergeTag", props: { name: 'a" onmouseover="x' } }] }]);
    expect(render(quoted, { mergeTag: (name: string) => `<span data-name="${name}">tag</span>` }).body).toContain('<span data-name="a&quot; onmouseover=&quot;x">tag</span>');
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

  it("numbers a list by the items shown, on desktop and on phones apart, hides a nested List where it's hidden, and keeps an empty item's id", () => {
    const { head, body } = render(
      email([
        {
          type: "List",
          props: { type: "number" },
          children: [
            { type: "ListItem", hidden: { desktop: true }, children: ["a"] },
            { type: "ListItem", children: ["b"] },
            { type: "ListItem", hidden: { mobile: true }, children: ["c"] },
            { type: "ListItem", children: ["d"] },
          ],
        },
        { type: "List", children: [{ type: "ListItem", children: ["outer", { type: "List", hidden: { mobile: true }, children: [{ type: "ListItem", children: ["inner"] }] }] }, { type: "ListItem", id: "empty", children: [] }] },
      ])
    );
    const cells = [...body.matchAll(/<td aria-hidden="true"[^>]*>(.*?)<\/td>/g)].map((m) => m[1]);
    const markers = cells.map((cell) => cell.replace(/<!--\[if !mso\]><!-->|<!--<!\[endif\]-->/g, ""));
    // Classic Outlook reads desktop's number alone.
    expect(cells[1].replace(/<!--\[if !mso\]>[\s\S]*?<!\[endif\]-->/g, "")).toMatch(/^<span class="e[0-9a-z]{5}">1\.<\/span>$/);
    // Phones show a, b, d; desktop b, c, d. b is the first on desktop and the second on phones.
    const [, desktopOnly, phoneOnly] = /^<span class="(e[0-9a-z]{5})">1\.<\/span><span class="(e[0-9a-z]{5})" style="display:none">2\.<\/span>$/.exec(markers[1])!;
    expect(head).toContain(`.${desktopOnly}{display:none!important}`);
    expect(head).toContain(`.${phoneOnly}{display:inline!important}`);
    expect([markers[0], markers[2], markers[3]]).toEqual(["1.", "2.", "3."]);
    // An item only phones show, after one only desktop shows: its number is phones' (b 1., a 2.), not desktop's (3.).
    const reordered = render(
      email([
        {
          type: "List",
          props: { type: "number" },
          children: [
            { type: "ListItem", children: ["b"] },
            { type: "ListItem", hidden: { mobile: true }, children: ["c"] },
            { type: "ListItem", hidden: { desktop: true }, children: ["a"] },
            { type: "ListItem", children: ["d"] },
          ],
        },
      ])
    ).body;
    expect([...reordered.matchAll(/<td aria-hidden="true"[^>]*>(\d+\.)<\/td>/g)].map((m) => m[1])).toEqual(["1.", "2.", "2.", "3."]);
    // The nested List hidden on phones, and the empty item's id.
    const nested = /<div class="(e[0-9a-z]{5})"><table role="list"/.exec(body)![1];
    expect(head).toContain(`.${nested}{display:none!important}`);
    expect(body).toContain('<div id="empty"></div>');
    // One hidden on desktop is out of Outlook's view too, and shown on phones.
    const desktopHidden = render(email([{ type: "List", children: [{ type: "ListItem", children: ["outer", { type: "List", hidden: { desktop: true }, children: [{ type: "ListItem", children: ["inner"] }] }] }] }]));
    const shows = /<!--\[if !mso\]><!--><div class="(e[0-9a-z]{5})" style="display:none"><table role="list"/.exec(desktopHidden.body)![1];
    expect(desktopHidden.head).toContain(`.${shows}{display:block!important}`);
  });

  it("keeps an item's id and its nested List's apart when the item starts with the List", () => {
    const { body } = render(email([{ type: "List", children: [{ type: "ListItem", id: "item", children: [{ type: "List", id: "inner", children: [{ type: "ListItem", children: ["x"] }] }] }] }]));
    const dom = new JSDOM(body).window.document;
    expect(dom.getElementById("item")!.querySelector("#inner")).not.toBeNull();
    expect(body.match(/<[a-z]+[^>]*\sid="[^"]*"[^>]*\sid="/g)).toBeNull();
    // Text, a nested List, then text: the id once, on the first part.
    const mixed = render(email([{ type: "List", children: [{ type: "ListItem", id: "item", children: ["a", { type: "List", children: [{ type: "ListItem", children: ["x"] }] }, "b"] }] }])).body;
    expect(mixed.match(/id="item"/g)).toHaveLength(1);
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
    expect(body).toContain('<table cellpadding="0" cellspacing="0" border="0" width="100%" style="table-layout:fixed;border-collapse:separate"><colgroup><col width="360" style="width:60%"><col width="240" style="width:40%"></colgroup><thead><tr>');
    expect(body).toContain('<th scope="col" width="360" valign="top" style="color:#000;font-family:Arial, Helvetica, sans-serif;font-size:16px;font-weight:700;');
    expect(body).toContain("width:60%;box-sizing:border-box;padding:8px 12px;border-bottom:1px solid #eee\">Item</th>");
    expect(body).toContain('</thead><tbody><tr bgcolor="#fafafa" style="background-color:#fafafa"><td width="360" valign="top" style="color:#000;');
    // The last row has no line below it.
    expect(body).toContain("text-align:right;width:40%;box-sizing:border-box;padding:8px 12px\">$12</td>");
    expect(text).toBe("Item | Price\nNotebook | $12");
  });

  it("keeps a column's share of the table beside one of its own px, the column with no width taking what's left", () => {
    const { body } = render(email([{ type: "Table", children: [{ type: "TableRow", children: [{ type: "TableCell", style: { width: "40%" }, children: ["Share"] }, { type: "TableCell", children: ["Free"] }, { type: "TableCell", style: { width: 120 }, children: ["Px"] }] }] }]));
    expect(body).toMatch(/<col width="\d+" style="width:40%"><col width="\d+" style="width:auto"><col width="120" style="width:120px">/);
    expect(body).toMatch(/style="[^"]*width:40%[^"]*">Share</);
    expect(body).toMatch(/style="[^"]*width:auto[^"]*">Free</);
    expect(body).toMatch(/style="[^"]*width:120px[^"]*">Px</);
  });

  it("writes a table whose cells share their borders, a row's height and footer rows in tfoot", () => {
    const { body } = render(
      email([
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
    expect(body).toContain('style="table-layout:fixed;border-collapse:collapse"');
    expect(body).toContain('<tbody><tr height="40" style="height:40px">');
    expect(body).toMatch(/<\/tbody><tfoot><tr><td[^>]*>[^<]*C<\/td><\/tr><\/tfoot><\/table>/);
  });

  it("writes a Button's place of its own (on phones by its margins), its link's other attributes and a link to nothing", () => {
    const { head, body } = render(
      email([
        { type: "Button", props: { href: { href: "", target: "_blank" }, attrs: { class: "cta", "data-x": "1" } }, style: { alignSelf: "end" }, mobile: { alignSelf: "start" }, children: ["Go"] },
      ])
    );
    expect(body).toContain('<td align="right"');
    const anchor = /<a [^>]*>/.exec(body)![0];
    expect(anchor).toContain('href=""');
    expect(anchor).toContain('class="cta"');
    expect(anchor).toContain('data-x="1"');
    expect(body).toMatch(/>Go<\/a>/);
    expect(head).toContain("margin-left:0!important;margin-right:auto!important");
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

  it("writes a horizontal Menu as one line of plain text, its separators between its links; a vertical one a link to a line", () => {
    const items = [{ text: "Docs", href: "https://example.com/docs" }, { text: "Blog", href: "https://example.com/blog" }];
    expect(render(email([{ type: "Menu", props: { items, separator: "|" } }])).text).toBe("Docs (https://example.com/docs) | Blog (https://example.com/blog)");
    expect(render(email([{ type: "Menu", props: { items, layout: "vertical" } }])).text).toBe("Docs (https://example.com/docs)\n\nBlog (https://example.com/blog)");
  });

  it("wraps a long horizontal Menu's links where they don't fit, and notes where classic Outlook can't", () => {
    const items = (count: number) => Array.from({ length: count }, (_, index) => ({ text: `Section ${index + 1}`, href: `https://example.com/${index}` }));
    const menu = (count: number) => render(email([{ type: "Menu", props: { items: items(count), separator: "|" } }]));
    // Each link and separator an inline-block, onto another line where it doesn't fit; Outlook gets a table row.
    const { body } = menu(4);
    expect(notOutlook(body).match(/<div (class="[^"]+" )?style="display:inline-block;vertical-align:top;font-size:14px">/g)).toHaveLength(7);
    // Outlook's row as wide as the links (centered by its cell), not spread across the email; each link's box too.
    expect(outlookOnly(body)).toContain('<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td valign="top">');
    expect(outlookOnly(body).match(/<td valign="top">/g)).toHaveLength(7);
    expect(body).toContain('<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:5px 15px">');
    expect(menu(4).diagnostics).toEqual([]);
    expect(menu(12).diagnostics.map((d) => [d.code, d.severity, d.path])).toEqual([["email/outlook-degraded", "info", "root.children[0]"]]);
    // A vertical one's links are in a Column, where a flex would be ignored: none is given.
    expect(render(email([{ type: "Menu", props: { items: items(2), layout: "vertical" } }])).diagnostics).toEqual([]);
  });

  it("asks no width of a Link or a line of Text, as wide as its text (a Menu's), and still of a Button", () => {
    const menu = { type: "Menu", props: { items: [{ text: "A", href: "https://a.com" }, { text: "B", href: "https://b.com" }], separator: "|" } };
    expect(render(email([menu])).diagnostics.filter((d) => d.code === "email/width")).toEqual([]);
    const button = { type: "Row", children: [{ type: "Button", props: { href: "#" }, style: { flex: "none" }, children: ["x"] }] };
    expect(render(email([button])).diagnostics.filter((d) => d.code === "email/width")).toHaveLength(1);
  });

  it("writes a Video as its thumbnail linked to it, a YouTube video's own by default; a Vimeo video without one as a link, with a warning", () => {
    const youtube = render(email([{ type: "Video", props: { src: "https://youtu.be/dQw4w9WgXcQ", title: "Our <launch>" } }]));
    expect(youtube.body).toContain(
      '<a href="https://youtu.be/dQw4w9WgXcQ" title="Our &lt;launch&gt;"><img src="https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg" alt="Our &lt;launch&gt;" width="600" border="0" style="display:block;width:100%;max-width:600px;height:auto;border:0"></a>'
    );
    expect(youtube.text).toBe("Our <launch> (https://youtu.be/dQw4w9WgXcQ)");
    const own = render(email([{ type: "Video", props: { src: "https://vimeo.com/76979871", thumbnail: "https://example.com/t.png" } }]));
    expect(own.body).toContain('<img src="https://example.com/t.png" alt="Video"');
    expect(own.diagnostics.filter((d) => d.code === "email/video-thumbnail")).toEqual([]);
    const vimeo = render(email([{ type: "Video", props: { src: "https://vimeo.com/76979871" } }]));
    expect(vimeo.body).toContain('<a href="https://vimeo.com/76979871">Video</a>');
    expect(vimeo.diagnostics.map((d) => [d.code, d.path])).toContainEqual(["email/video-thumbnail", "root.children[0].props.thumbnail"]);
    // In a Grid, at its place in the template, not in the Rows the Grid lays it out in.
    const text = { type: "Text", children: ["a"] };
    const grid = render(email([text, { type: "Grid", children: [text, { type: "Video", props: { src: "https://vimeo.com/76979871" } }] }]));
    expect(grid.diagnostics.map((d) => [d.code, d.path])).toContainEqual(["email/video-thumbnail", "root.children[1].children[1].props.thumbnail"]);
  });

  describe("a Layer", () => {
    const photo = { src: "https://example.com/hero.jpg", width: 1200, height: 600 };
    const layer = (children: unknown[], style: Record<string, unknown> = {}) => email([{ type: "Layer", id: "hero", style, children }]);
    const image = (style: Record<string, unknown> = { width: "100%" }, src: unknown = photo) => ({ type: "Image", props: { src, alt: "Sea" }, style });
    const over = { type: "Column", children: [{ type: "Text", children: ["Summer sale"] }] };

    it("draws its Image as the cell's background, as tall as the image at the Layer's width, for every client and Outlook", () => {
      const { body, diagnostics } = render(layer([image(), over], { alignItems: "center", justifyItems: "center" }));
      expect(body).toContain('<td background="https://example.com/hero.jpg" height="300" valign="middle" align="center" style="height:300px;background-image:url(&quot;https://example.com/hero.jpg&quot;);background-size:cover;background-position:center;background-repeat:no-repeat">');
      // Outlook takes neither: a VML rectangle the image fills, with the words in its text box.
      expect(outlookOnly(body)).toContain('<v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" alt="Sea" style="width:600px;height:300px"><v:fill type="frame" src="https://example.com/hero.jpg"></v:fill><v:textbox inset="0,0,0,0">');
      expect(outlookOnly(body)).toContain("</v:textbox></v:rect>");
      expect(body).toContain("Summer sale");
      expect(body).not.toContain("<img");
      // Without a height it keeps the desktop one on phones, which a page doesn't: noted.
      expect(diagnostics.map((d) => [d.code, d.severity, d.path])).toEqual([["email/layer-phone", "info", "root.children[0].style.height"]]);
      expect(render(layer([image(), over], { height: 240 })).body).toContain('height="240"');
    });

    it("reads its Image's alternate text out, and leaves the image out on phones where it's hidden there", () => {
      const { html, body } = render(layer([image(), over]));
      // A background has no alt: an empty labelled image for screen readers, and the VML's alt for Outlook.
      expect(notOutlook(body)).toContain('<div role="img" aria-label="Sea"></div>');
      expect(outlookOnly(body)).toContain('<v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" alt="Sea"');
      expect(html).not.toContain("background-image:none");
      const hidden = render(layer([{ ...image(), hidden: { mobile: true } }, over]));
      const dom = new JSDOM(hidden.html).window.document;
      const cell = dom.querySelector("td[background]")!;
      const rules = dom.querySelector("style")!.textContent!;
      // On phones, no image and no image's height: as tall as the words over it, as on a page.
      for (const name of cell.className.split(" ")) expect(rules).toContain(`.${name}{`);
      expect(rules).toMatch(new RegExp(`\\.(${cell.className.split(" ").join("|")})\\{[^}]*background-image:none!important[^}]*height:auto!important`));
      expect(dom.querySelector('div[role="img"]')!.className).not.toBe("");
      // Its height on phones is a page's: nothing to note.
      expect(hidden.diagnostics).toEqual([]);
    });

    it("says what an email can't draw: not an Image under one child, an Image narrower than the Layer, a height it can't work out", () => {
      const problems = (children: unknown[], style?: Record<string, unknown>) =>
        (() => {
          try {
            render(layer(children, style));
            return [];
          } catch (error) {
            return (error as { diagnostics: Array<{ code: string; path: string; message: string }> }).diagnostics.filter((d) => d.code === "email/layer").map((d) => [d.path, d.message]);
          }
        })();
      expect(problems([image(), over, over])).toEqual([["root.children[0]", "In an email, a Layer is an Image with one child over it (drawn as the image's background); this one has 3 children"]]);
      expect(problems([over, image()])).toEqual([["root.children[0]", "In an email, a Layer is an Image with one child over it (drawn as the image's background); this one has a Column under"]]);
      expect(problems([image({ width: 200 }), over])).toEqual([["root.children[0].children[0].style.width", "In an email, a Layer's Image is as wide as the Layer (it's drawn as its background): give it width 100%"]]);
      expect(problems([image({ width: "100%" }, "https://example.com/hero.jpg"), over])).toEqual([
        ["root.children[0].children[0].props.src", "In an email, a Layer is as tall as its Image, which needs its file's width and height (src={{ src, width, height }}); or give the Layer a height"],
      ]);
      expect(problems([image({ width: "100%" }, "https://example.com/hero.jpg"), over], { height: 200 })).toEqual([]);
    });
  });

  it("leaves an Svg out of an email, with an error: Gmail and Outlook don't show inline SVG", () => {
    expect(() => render(email([{ type: "Svg", props: { width: 40, height: 40 }, children: [{ type: "Circle", props: { cx: 20, cy: 20, r: 10 } }] }]))).toThrow("A Svg can't be rendered to email: Gmail and classic Outlook don't show inline SVG; use an Image of it (a PNG) instead");
  });

  it("warns before Gmail clips a message, counting its size in UTF-8 without TextEncoder (Jest's jsdom has none)", () => {
    const many = Array.from({ length: 600 }, (_, i) => ({ type: "Paragraph", children: [`Paragraph ${i} with some words in it to take up room.`] }));
    // Two-byte letters: under the limit counted as characters, over it in bytes.
    const wide = [{ type: "Paragraph", children: ["é".repeat(60_000)] }];
    const encoder = globalThis.TextEncoder;
    try {
      delete (globalThis as { TextEncoder?: unknown }).TextEncoder;
      expect(render(email(many)).diagnostics.map((d) => d.code)).toContain("email/size");
      expect(render(email(many.slice(0, 10))).diagnostics.map((d) => d.code)).not.toContain("email/size");
      expect(render(email(wide)).diagnostics.map((d) => d.code)).toContain("email/size");
    } finally {
      globalThis.TextEncoder = encoder;
    }
  });

  it("writes the plain-text version, without the preview text", () => {
    const { text } = render(email([{ type: "Heading", children: ["Hi"] }, { type: "Button", props: { href: "https://example.com" }, children: ["Go"] }], { props: { width: 600, previewText: "Preview" } }));
    expect(text).toBe("HI\n\nGo (https://example.com)");
  });

  it("is the same every time for the same template", () => {
    const template = email([{ type: "Row", children: [{ type: "Column", hidden: { mobile: true } }, { type: "Column" }] }]);
    expect(render(template).html).toBe(render(template).html);
  });

  it("hides on phones at the width it's told, where its phone styles start at its own", () => {
    const hidden = email([{ type: "Text", hidden: { mobile: true }, mobile: { fontSize: 20 }, children: ["Words"] }]);
    const told = render(hidden, { hideBelow: 480 }).head;
    expect(told).toMatch(/@media \(max-width: 620px\)\{\.e\w+\{font-size:20px!important[^}]*\}\}@media \(max-width: 480px\)\{\.e\w+\{display:none!important\}\}/);
    expect(render(hidden).head).toMatch(/@media \(max-width: 620px\)\{\.e\w+\{display:none!important\}\}/);
    const onDesktop = render(email([{ type: "Text", hidden: { desktop: true }, children: ["Words"] }]), { hideBelow: 480 }).head;
    expect(onDesktop).toMatch(/@media \(max-width: 480px\)\{\.e\w+\{display:table-row!important\}\}/);
  });

  it("gives an Image a share of its cell on phones where it has a maximum", () => {
    const { head } = render(email([{ type: "Image", props: { src: "https://example.com/a.png" }, style: { width: "40%", maxWidth: 100 }, mobile: { width: "80%", maxWidth: "80%" } }]));
    expect(head).toContain("width:80%!important;max-width:80%!important");
  });

  it("hides a Section at the width it's told, not its own", () => {
    const words = { type: "Column", children: [{ type: "Text", children: ["Hi"] }] };
    const { head, body } = render(email([{ type: "Section", hidden: { mobile: true }, children: [words] }, { type: "Section", hidden: { desktop: true }, children: [words] }]), { hideBelow: 480 });
    expect(head).toMatch(/@media \(max-width: 480px\)\{\.\w+\{display:none!important\}\.\w+\{display:table-row!important\}\}/);
    expect(body).toContain("<!--[if !mso]><!--><tr");
  });

  describe("an Html block", () => {
    const block = (html: string, extra: Record<string, unknown> = {}) => ({ type: "Html", props: { html }, ...extra });

    it("writes its markup as it is, in its place in the stack, in the text around it, as on a page", () => {
      const { body, text } = render(email([block('<a href="https://example.com">Buy <b>now</b></a>'), { type: "Text", children: ["Hi"] }, block("<hr>", { props: { html: "<hr>", text: "Our own words" } })]));
      expect(notOutlook(body)).toMatch(/<tr><td><div style="[^"]*font-size:16px[^"]*"><a href="https:\/\/example\.com">Buy <b>now<\/b><\/a><\/div><\/td><\/tr>/);
      expect(notOutlook(body)).toMatch(/<tr><td><div style="color:#000;[^"]*"><hr><\/div><\/td><\/tr>/);
      expect(text).toBe("Buy now\n\nHi\n\nOur own words");
    });

    it("is in the template's text size in a stacking Row's cell, whose own is 0", () => {
      const { body } = render(email([{ type: "Row", children: [{ type: "Column", children: [block("<a>One</a> <a>Two</a>")] }] }], { style: { fontSize: 14 } }));
      expect(body).toMatch(/<div style="[^"]*;font-size:14px"><a>One<\/a> <a>Two<\/a><\/div>/);
    });

    it("keeps its id, and is hidden where it's hidden", () => {
      const { body } = render(email([block("<p>Sale</p>", { id: "sale", hidden: { mobile: true } })]));
      expect(body).toMatch(/<tr class="[^"]+"><td><div id="sale" style="[^"]*font-size:16px[^"]*"><p>Sale<\/p><\/div><\/td><\/tr>/);
    });
  });

  describe("a Row whose children wrap as words do", () => {
    const words = (style: Record<string, unknown> = {}) => render(email([{ type: "Row", props: { stackOnMobile: false }, style: { flexWrap: "words", justifyContent: "center", lineHeight: "normal", ...style }, children: [{ type: "Text", style: { flex: "none" }, children: ["One"] }, { type: "Text", style: { flex: "none" }, children: ["Two"] }] }])).body;

    it("has a real space between them, of the text's font and size, in every client but Outlook's table", () => {
      const body = words({ letterSpacing: 2 });
      expect(notOutlook(body)).toMatch(/<\/div> <div[^>]*display:inline-block/);
      expect(body).toMatch(/<td align="center" style="font-family:Arial, Helvetica, sans-serif;font-size:16px;letter-spacing:2px;text-align:center">/);
      expect(outlookOnly(body)).not.toContain(" </td>");
    });

    it("leaves a wrapping Row's children touching, in a cell of no text", () => {
      const body = render(email([{ type: "Row", props: { stackOnMobile: false }, style: { flexWrap: "wrap" }, children: [{ type: "Text", style: { flex: "none" }, children: ["One"] }, { type: "Text", style: { flex: "none" }, children: ["Two"] }] }])).body;
      expect(body).toContain("font-size:0");
      expect(notOutlook(body)).not.toMatch(/<\/div> <div/);
    });
  });

  it("writes no line height where it's the font's own, and says nothing to Outlook about one", () => {
    const { body } = render(email([{ type: "Text", style: { lineHeight: "normal", fontSize: 14 }, mobile: { fontSize: 20 }, children: ["Words"] }]));
    expect(body).toContain('style="color:#000;font-family:Arial, Helvetica, sans-serif;font-size:14px;text-align:left"');
    const { head } = render(email([{ type: "Text", style: { lineHeight: "normal", fontSize: 14 }, mobile: { fontSize: 20 }, children: ["Words"] }]));
    expect(head).toContain("font-size:20px!important");
    expect(head).not.toContain("line-height");
  });

  it("starts what's in a box of its own height at its top, as on a page", () => {
    const { body } = render(email([{ type: "Column", style: { height: 40, padding: 1 }, children: [{ type: "Text", children: ["Words"] }] }]));
    expect(body).toMatch(/<td height="40" valign="top"/);
    expect(render(email([{ type: "Column", style: { padding: 1 }, children: [{ type: "Text", children: ["Words"] }] }])).body).not.toContain('valign="top"');
  });

  it("sets an Image in text in the line, by where it says; alone, as a block", () => {
    const image = { type: "Image", props: { src: "https://example.com/a.png" }, style: { width: 100, verticalAlign: "middle" } };
    expect(render(email([{ type: "Text", children: [image] }])).body).toMatch(/<img[^>]*style="display:inline-block;vertical-align:middle/);
    expect(render(email([{ ...image, style: { width: 100 } }])).body).toMatch(/<img[^>]*style="display:block;width/);
  });

  it("places an Image on phones by its margins, and gives a share of its cell on phones where it has a maximum", () => {
    const { head } = render(email([{ type: "Image", props: { src: "https://example.com/a.png" }, style: { width: "40%", maxWidth: 100 }, mobile: { alignSelf: "end", width: "80%", maxWidth: "80%" } }]));
    expect(head).toContain("width:80%!important;max-width:80%!important;margin-left:auto!important;margin-right:0!important");
  });

  it("hides on phones at the width it's told, where its phone styles start at its own", () => {
    const hidden = email([{ type: "Text", hidden: { mobile: true }, mobile: { fontSize: 20 }, children: ["Words"] }]);
    const told = render(hidden, { hideBelow: 480 }).head;
    expect(told).toMatch(/@media \(max-width: 620px\)\{\.e\w+\{font-size:20px!important[^}]*\}\}@media \(max-width: 480px\)\{\.e\w+\{display:none!important\}\}/);
    expect(render(hidden).head).toMatch(/@media \(max-width: 620px\)\{\.e\w+\{display:none!important\}\}/);
    const onDesktop = render(email([{ type: "Text", hidden: { desktop: true }, children: ["Words"] }]), { hideBelow: 480 }).head;
    expect(onDesktop).toMatch(/@media \(max-width: 480px\)\{\.e\w+\{display:table-row!important\}\}/);
  });

  it("writes a Row's direction on its cell, and a Link's other attributes", () => {
    const { body } = render(email([{ type: "Row", props: { stackOnMobile: false, dir: "ltr" }, style: { flexWrap: "wrap" }, children: [{ type: "Link", props: { href: { href: "" }, attrs: { target: "_top" } }, children: [{ type: "Image", props: { src: "https://example.com/a.png" }, style: { width: 10 } }] }] }]));
    expect(body).toContain('dir="ltr"');
    expect(body).toMatch(/<a href="" target="_top"/);
  });
});
