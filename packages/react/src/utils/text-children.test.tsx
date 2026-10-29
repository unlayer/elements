import { describe, it, expect, vi } from "vitest";
import { ButtonExporters } from "@unlayer/exporters";
import React from "react";
import { renderToHtml, renderToPlainText } from "./render-to-html";
import { renderToJson } from "./render-to-json";
import { Email, Page, Document, Row, Column, Heading, Button, Paragraph, Menu, Link } from "../index";
import { growth } from "../test-timing";

// A value such as a user's name, with markup in it.
const name = '<img src=x onerror="alert(1)"> & Co';

describe("text children of Heading and Button", () => {
  it.each([["email", Email], ["web", Page]] as const)("show markup as typed, as Paragraph's do (%s)", (_, Root) => {
    const html = renderToHtml(
      <Root>
        <Row><Column>
          <Heading>Hi {name}</Heading>
          <Button href="https://example.com">{name}</Button>
          <Paragraph>{name}</Paragraph>
        </Column></Row>
      </Root>
    );
    expect(html).not.toContain("<img src=x");
    expect(html.match(/&lt;img src=x onerror=/g)).toHaveLength(3);
    expect(html).toContain("&amp; Co");
  });

  it("keep markup given through the text prop", () => {
    const html = renderToHtml(
      <Email><Row><Column>
        <Heading text="Hi <strong>there</strong>" />
        <Button href="https://example.com" text="Buy <strong>now</strong>" />
      </Column></Row></Email>
    );
    expect(html).toContain("Hi <strong>there</strong>");
    expect(html).toContain("Buy <strong>now</strong>");
  });

  it("store escaped text in the design, which the editor shows as typed", () => {
    const design = renderToJson(<Email><Row><Column><Heading>{name}</Heading><Button href="#">{name}</Button></Column></Row></Email>);
    const [heading, button] = design.body.rows[0].columns[0].contents as Array<{ values: { text: string } }>;
    expect(heading.values.text).toBe("&lt;img src=x onerror=\"alert(1)\"&gt; &amp; Co");
    // A Button's `<` and `>` as numeric references: the editor's exporters unescape its text before they write it (where
    // it has no textJson), which would make `&lt;img…&gt;` a tag in their HTML; they leave these as they are.
    expect(button.values.text).toBe("&#60;img src=x onerror=\"alert(1)\"&#62; &amp; Co");
    for (const mode of ["web", "email", "document"] as const) {
      const exported = (ButtonExporters[mode] as (...args: unknown[]) => string)({ ...button.values, _meta: { htmlID: "b", htmlClassNames: "b" } }, 0, 0, [1], {}, {}, undefined, { exporterConfig: {} });
      expect([mode, /<img/i.test(exported)]).toEqual([mode, false]);
    }
    // A `"` in an inline tag's attribute too (`&quot;`, which unescaping would make one that ends the value).
    const designed = (child: React.ReactNode) => renderToJson(<Email><Row><Column><Button href="#">{child}</Button></Column></Row></Email>).body.rows[0].columns[0].contents[0].values as Record<string, unknown>;
    for (const values of [designed(<span title={'x" data-injected="1'}>Go</span>), designed(<span style={{ fontFamily: '"Inter", sans-serif' }}>Go</span>)]) {
      for (const mode of ["web", "email"] as const) {
        const exported = (ButtonExporters[mode] as (...args: unknown[]) => string)({ ...values, _meta: { htmlID: "b", htmlClassNames: "b" } }, 0, 0, [1], {}, {}, undefined, { exporterConfig: {} });
        const doc = new DOMParser().parseFromString(exported, "text/html");
        expect([mode, !!doc.querySelector("[data-injected]"), [...doc.querySelectorAll("span")].some((el) => el.title === 'x" data-injected="1' || /"Inter"/.test(el.style.fontFamily))]).toEqual([mode, false, true]);
      }
    }
  });
});

describe("rich text children of Paragraph, Heading and Button", () => {
  const Locale = React.createContext("en");
  // As react-intl's <FormattedMessage> or react-i18next's <Trans>: a component that reads context and returns text.
  const Message = ({ id }: { id: string }) => <>{React.useContext(Locale) === "es" ? `Hola ${id}` : `Hello ${id}`}</>;
  const Name = () => <strong>Ada &amp; co</strong>;
  const content = (
    <>
      <Paragraph>
        Hello <strong>world</strong>, read{" "}
        <a href="https://example.com/a?b=1&c=2" target="_blank" rel="noopener" title={'Say "hi"'} style={{ color: "#2563eb" }} onClick={() => {}}>
          this <em>now</em>
        </a>
        .<br />
        Next <span style={{ fontWeight: 700 }}>line</span> with <u>u</u>, <s>s</s>, <i>i</i>, <b>b</b>, <code>c</code>, x<sup>2</sup>, H<sub>2</sub>O, <small>small</small>, <mark>mark</mark>
        {[" and ", <Name key="n" />]}
      </Paragraph>
      <Heading>
        <Message id="Ada" /> <a href="javascript:alert(1)">x</a> <a href={"java\nscript:alert(1)"}>y</a> <span style={{ background: "url(javascript:alert(1))" }}>z</span>
      </Heading>
      <Button href="https://example.com">
        Buy <em>now</em> {"<%first_name%>"}
      </Button>
      <Paragraph>
        Not a block: <div>inside a div</div>
        <table><tbody><tr><td>a cell</td></tr></tbody></table>
        <img src="https://example.com/x.png" alt="x" />
      </Paragraph>
    </>
  );
  const email = (
    <Locale.Provider value="es">
      <Email>
        <Row>
          <Column>{content}</Column>
        </Row>
      </Email>
    </Locale.Provider>
  );
  const RICH =
    'Hello <strong>world</strong>, read <a href="https://example.com/a?b=1&amp;c=2" target="_blank" rel="noopener" title="Say &quot;hi&quot;" style="color:#2563eb">this <em>now</em></a>.<br/>Next <span style="font-weight:700">line</span> with <u>u</u>, <s>s</s>, <i>i</i>, <b>b</b>, <code>c</code>, x<sup>2</sup>, H<sub>2</sub>O, <small>small</small>, <mark>mark</mark> and <strong>Ada &amp; co</strong>';

  it("keep their inline formatting in the design, components (with their context) rendered", () => {
    const [paragraph, heading, button, blocks] = renderToJson(email).body.rows[0].columns[0].contents as Array<{ values: { text: string } }>;
    expect(paragraph.values.text).toBe(RICH);
    // What could run code goes: javascript: URLs (also split by a line break) and CSS that loads one; handlers aren't written.
    expect(heading.values.text).toBe("Hola Ada <a>x</a> <a>y</a> <span>z</span>");
    expect(button.values.text).toBe("Buy <em>now</em> <%first_name%>");
    // No block gets into text: only the text of a div, a table or an image stays.
    expect(blocks.values.text).toBe("Not a block: inside a diva cell");
  });

  it("render the same HTML, and plain text with links as text (url)", () => {
    const html = renderToHtml(email);
    // (In an email the editor's text block gives sub- and superscripts `line-height: 0` inline, as it exports them.)
    expect(html).toContain(RICH.replace(/<(sub|sup)>/g, '<$1 style="line-height: 0;">'));
    expect(html).toContain("Hola Ada <a>x</a>");
    expect(html).not.toMatch(/javascript:|onclick|<div>inside|<img src="https:\/\/example.com\/x.png"/i);
    const text = renderToPlainText(email);
    expect(text).toContain("Hello world, read this now (https://example.com/a?b=1&c=2).\nNext line with u, s, i, b, c, x2, H2O, small, mark and Ada & co");
  });

  it("take a <Link>: its target and rel kept, in the HTML and the design", () => {
    const linked = (
      <Email><Row><Column>
        <Paragraph>Read <Link href="https://example.com/docs">the docs</Link> or <Link href="https://example.com/faq" target="_self" title="FAQ">the FAQ</Link>.</Paragraph>
      </Column></Row></Email>
    );
    const written = 'Read <a href="https://example.com/docs" target="_blank" rel="noopener">the docs</a> or <a href="https://example.com/faq" target="_self" title="FAQ">the FAQ</a>.';
    expect(renderToHtml(linked)).toContain(written);
    expect(renderToJson(linked).body.rows[0].columns[0].contents[0].values.text).toBe(written);
    expect(renderToPlainText(linked)).toBe("Read the docs (https://example.com/docs) or the FAQ (https://example.com/faq).");
  });

  it("keep a class (a <Link>'s className, a span's), for a stylesheet of yours, in the HTML and the design", () => {
    const sale = '<a href="/sale" target="_blank" rel="noopener" style="color:#e11d48" class="mobile-link &quot;x&quot;">the offer</a>';
    const classed = (
      <Email><Row><Column>
        <Paragraph>Read <Link href="/sale" style={{ color: "#e11d48" }} className={'mobile-link "x"'}>the offer</Link> <span className="note">now</span></Paragraph>
        <Heading>Hi <Link href="/sale" className="mobile-link">there</Link></Heading>
        <Button href="/buy">Buy <span className="mobile-label">now</span></Button>
        <Link href="/sale" className="mobile-link">the offer</Link>
      </Column></Row></Email>
    );
    const texts = [
      `Read ${sale} <span class="note">now</span>`,
      'Hi <a href="/sale" target="_blank" rel="noopener" class="mobile-link">there</a>',
      'Buy <span class="mobile-label">now</span>',
    ];
    const html = renderToHtml(classed);
    for (const text of texts) expect(html).toContain(text);
    const [paragraph, heading, button, solo] = renderToJson(classed).body.rows[0].columns[0].contents as Array<{ type: string; values: { text: string } }>;
    expect([paragraph, heading, button].map((c) => c.values.text)).toEqual(texts);
    // A <Link> on its own is still a Paragraph holding it, its class kept, not an HTML block.
    expect(solo.type).toBe("text");
    expect(solo.values.text).toBe('<a href="/sale" target="_blank" rel="noopener" class="mobile-link">the offer</a>');
    // The plain text's `skip` finds it by its class.
    expect(renderToPlainText(classed, { skip: [".note", ".mobile-label"] })).not.toMatch(/\bnow\b/);
  });

  it("say which component in them can't render (async or suspending), naming it; left out, keep the rest", () => {
    const Later = async () => "never";
    const email = <Email><Row><Column><Paragraph>Hi <Later /> <b>there</b></Paragraph></Column></Row></Email>;
    expect(() => renderToJson(email)).toThrow(/^\[Unlayer\] it is async or suspends.* \(in <Later> at Row 1 › Column 1 › Paragraph › Later\)$/);
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const json = renderToJson(email, { onError: "omit" });
      expect(json.body.rows[0].columns[0].contents[0].values.text).toBe("Hi  <b>there</b>");
      expect(error.mock.calls.map((c) => String(c[0]))).toEqual([expect.stringMatching(/^\[Unlayer\] Left out: it is async or suspends.*<Later>/)]);
    } finally {
      error.mockRestore();
    }
  });

  it("clean a component's HTML in a <Link> on its own in a Column as a Paragraph's, and keep a linked image, cleaned too", () => {
    // A <Link> alone is a Paragraph holding it; where cleaning took a tag out, its markup was kept as it was, as an HTML
    // block, a component's own HTML in it too (which can be any HTML).
    const Raw = ({ html }: { html: string }) => <span dangerouslySetInnerHTML={{ __html: html }} />;
    for (const Root of [Email, Page]) {
      // Also a Link through a component of yours (a design system's), memo or forwardRef.
      const Memo = React.memo(Link);
      const Forwarded = React.forwardRef<HTMLAnchorElement, { children: React.ReactNode }>(({ children }, _ref) => <Link href="https://example.com">{children}</Link>);
      const Cta = ({ children }: { children: React.ReactNode }) => <Link href="https://example.com">{children}</Link>;
      for (const [raw, made] of ['<b onclick="x()">bold</b>', '<a href="javascript:x()">x</a>'].flatMap((raw) => [
        [raw, (children: React.ReactNode) => <Link href="https://example.com">{children}</Link>],
        [raw, (children: React.ReactNode) => <Memo href="https://example.com">{children}</Memo>],
        [raw, (children: React.ReactNode) => <Forwarded>{children}</Forwarded>],
        [raw, (children: React.ReactNode) => <Cta>{children}</Cta>],
        // Returned in a Fragment, an array, StrictMode or a context's provider, which render no markup of their own.
        [raw, (children: React.ReactNode) => { const Wrapped = () => <><Link href="https://example.com">{children}</Link></>; return <Wrapped />; }],
        [raw, (children: React.ReactNode) => { const Listed = () => [<Link key="l" href="https://example.com">{children}</Link>]; return <Listed />; }],
        [raw, (children: React.ReactNode) => { const Strict = () => <React.StrictMode><Link href="https://example.com">{children}</Link></React.StrictMode>; return <Strict />; }],
        [raw, (children: React.ReactNode) => { const Theme = React.createContext("x"); const Provided = () => <Theme.Provider value="y"><Link href="https://example.com">{children}</Link></Theme.Provider>; return <Provided />; }],
      ] as const)) {
        const link = made(<>Shop <Raw html={raw} /></>);
        const alone = <Root><Row><Column>{link}</Column></Row></Root>;
        const held = <Root><Row><Column><Paragraph>{link}</Paragraph></Column></Row></Root>;
        const [block] = renderToJson(alone).body.rows[0].columns[0].contents as Array<{ type: string; values: { text: string } }>;
        expect(block.type).toBe("text");
        expect(block.values.text).toBe((renderToJson(held).body.rows[0].columns[0].contents[0] as { values: { text: string } }).values.text);
        expect(renderToHtml(alone)).not.toMatch(/onclick="|javascript:x/);
      }
      // A logo's link: its image kept, as it is; one a component writes, cleaned (its handler left out).
      const logo = (image: React.ReactNode) => renderToJson(<Root><Row><Column><Link href="https://example.com">{image}</Link></Column></Row></Root>).body.rows[0].columns[0].contents[0] as { type: string; values: { html: string } };
      expect(logo(<img src="https://example.com/logo.png" alt="Logo" width={120} />)).toMatchObject({ type: "html", values: { html: '<a href="https://example.com" target="_blank" rel="noopener"><img src="https://example.com/logo.png" alt="Logo" width="120"/></a>' } });
      expect(logo(<Raw html={'<img src="https://example.com/logo.png" onerror="x()">'} />).values.html).toBe('<a href="https://example.com" target="_blank" rel="noopener"><span><img src="https://example.com/logo.png"/></span></a>');
    }
  });

  it("leave out a URL that runs code however its characters are written: references, control characters, in markup given as HTML", () => {
    const hostile = [
      '<a href="&#106;avascript:alert(1)">a</a>',
      '<a href="javascript&colon;alert(1)">b</a>',
      '<a href="javascript&#58;alert(1)">c</a>',
      '<a href="&#x6A;avascript&#x3A;alert(1)">d</a>',
      '<a href="java&Tab;script:alert(1)">e</a>',
      '<a href="&#0000106avascript&#58alert(1)">f</a>',
      '<a href=" &#x0A;vbscript&colon;msgbox(1)">g</a>',
      '<a href="&#100;ata:text/html,x">h</a>',
      '<span style="width: expression&lpar;alert(1))">i</span>',
    ].join(" ");
    const template = (
      <Email>
        <Row>
          <Column>
            {/* Markup a component of yours writes as HTML (dangerouslySetInnerHTML), and a URL given as a string, which React escapes. */}
            <Paragraph>
              Hi <span dangerouslySetInnerHTML={{ __html: hostile }} /> <a href={"&#106;avascript:x"}>kept</a>
            </Paragraph>
          </Column>
        </Row>
      </Email>
    );
    const html = renderToHtml(template);
    const text = (renderToJson(template).body.rows[0].columns[0].contents[0].values as { text: string }).text;
    for (const markup of [html, text]) {
      const doc = new DOMParser().parseFromString(markup, "text/html");
      const urls = [...doc.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")!.replace(/[\u0000- ]/g, ""));
      // The one a string gave stays text, as the browser reads it (`&#106;avascript:x`, a relative URL).
      expect(urls).toEqual(["&#106;avascript:x"]);
      expect([...doc.querySelectorAll("[style]")].map((e) => e.getAttribute("style")).filter((s) => /expression/i.test(s!))).toEqual([]);
      expect(doc.body.textContent).toMatch(/a b c d e f g h i/);
    }
    expect(text).toContain('<span><a>a</a> <a>b</a> <a>c</a> <a>d</a> <a>e</a> <a>f</a> <a>g</a> <a>h</a> <span>i</span></span> <a href="&amp;#106;avascript:x">kept</a>');
  });

  it("give only rich text's own elements and attributes for any markup a component writes (random, seeded)", () => {
    const Markup = ({ html }: { html: string }) => <span dangerouslySetInnerHTML={{ __html: html }} />;
    const pieces = ["<", ">", "</", "/", "<b>", "</b>", "<i>", "<div>", "</div>", "<img", "<svg", "<a", "<span", " ", "=", '"', "'", "x", "on", "load", "error", "src", "href", "title", "style", "&lt;", "&gt;", "&quot;", "<%", "%>", "<!--", "-->", "\n"];
    const allowed = new Set(["strong", "b", "em", "i", "u", "s", "a", "br", "span", "code", "sup", "sub", "small", "mark"]);
    let seed = 11;
    const random = (n: number) => ((seed = (Math.imul(seed, 1103515245) + 12345) >>> 0), Math.floor((seed / 2 ** 32) * n));
    const bad: string[] = [];
    for (let run = 0; run < 400; run++) {
      let markup = "";
      for (let i = 0, n = 2 + random(14); i < n; i++) markup += pieces[random(pieces.length)];
      const template = <Email><Row><Column><Paragraph>Hi <Markup html={markup} /> there</Paragraph></Column></Row></Email>;
      const text = String(renderToJson(template).body.rows[0].columns[0].contents[0].values.text);
      const doc = new DOMParser().parseFromString(`<div>${text}</div>`, "text/html");
      for (const el of doc.body.firstElementChild!.querySelectorAll("*")) {
        const odd = !allowed.has(el.tagName.toLowerCase()) || [...el.attributes].some((a) => !/^(style|title|class|href|target|rel)$/.test(a.name));
        if (odd) bad.push(JSON.stringify(markup));
      }
    }
    expect(bad).toEqual([]);
  });

  it("keep a kept attribute whole when its value holds a `<` or `>` beside quote references, so their quotes stay its own", () => {
    const Markup = ({ html }: { html: string }) => <span dangerouslySetInnerHTML={{ __html: html }} />;
    const values = ['&quot; onmouseover=x a=<', "&quot; onclick=x b=>", "a &lt; b &quot; onfocus=x <"];
    for (const value of values) {
      for (const Root of [Email, Page]) {
        const markup = `<span title="${value}">hi</span> <a href="https://example.com" title="${value}">x</a>`;
        const template = (
          <Root><Row><Column>
            <Paragraph>Review: <Markup html={markup} /></Paragraph>
            <Heading>Review: <Markup html={markup} /></Heading>
            <Button href="https://example.com">Go <Markup html={markup} /></Button>
          </Column></Row></Root>
        );
        const texts = renderToJson(template).body.rows[0].columns[0].contents.map((c: any) => String(c.values.text));
        for (const html of [renderToHtml(template), ...texts]) {
          const doc = new DOMParser().parseFromString(html, "text/html");
          expect([...doc.querySelectorAll("*")].flatMap((e) => [...e.attributes].map((a) => a.name)).filter((name) => /^on/i.test(name))).toEqual([]);
        }
      }
    }
  });

  it("leave out a comment, one left open too, so it can't hide the rest of the email", () => {
    const Markup = ({ html }: { html: string }) => <span dangerouslySetInnerHTML={{ __html: html }} />;
    for (const markup of ["Nice <!-- hidden", "Nice <!-- note --> shoes", "Nice <!--> shoes", "Nice <!x> shoes", "Nice <?x> shoes", "Nice <![CDATA[ x ]]> shoes"]) {
      for (const Root of [Email, Page]) {
        const template = (
          <Root><Row><Column>
            <Paragraph>Review: <Markup html={markup} /></Paragraph>
            <Paragraph>Total: $98</Paragraph>
          </Column></Row></Root>
        );
        const html = renderToHtml(template);
        const doc = new DOMParser().parseFromString(html, "text/html");
        expect(doc.body.textContent).toContain("Total: $98");
        const text = String(renderToJson(template).body.rows[0].columns[0].contents[0].values.text);
        expect(text).not.toMatch(/<!|<\?/);
      }
    }
  });

  it("leave out a tag that never ends (before a <style> or <script> left open, whose markup goes to the end), so its attributes aren't a tag's in the email", () => {
    const Markup = ({ html }: { html: string }) => <span dangerouslySetInnerHTML={{ __html: html }} />;
    const hostile = ["Nice <img src=x onerror=alert(1) <style>", "Nice <img src=x onerror=alert(1) <script>", "Nice <a href=x onmouseover=alert(1) <style>x", "Nice <img src=x onerror=alert(1)"];
    for (const markup of hostile) {
      for (const Root of [Email, Page]) {
        const template = (
          <Root><Row><Column>
            <Paragraph>Review: <Markup html={markup} /></Paragraph>
            <Heading>Review: <Markup html={markup} /></Heading>
            <Button href="https://example.com">Go <Markup html={markup} /></Button>
          </Column></Row></Root>
        );
        const texts = renderToJson(template).body.rows[0].columns[0].contents.map((c: any) => String(c.values.text));
        for (const html of [renderToHtml(template), ...texts]) {
          const doc = new DOMParser().parseFromString(html, "text/html");
          expect([...doc.querySelectorAll("*")].flatMap((e) => [...e.attributes].map((a) => a.name)).filter((name) => /^on/i.test(name))).toEqual([]);
        }
        expect(texts[0]).toMatch(/^Review: <span>Nice ?$/);
      }
    }
  });

  it("leave out a <script>'s or <style>'s text in them, which React 19 writes as it is (markup in it isn't theirs), on React 18 and 19", () => {
    const evil = "<a href='https://evil.test'>click</a> <b>bold</b>";
    const content = (Block: typeof Paragraph | typeof Heading) => (
      <Block>
        Hi <style>{evil}</style> <script>{evil}</script> there
      </Block>
    );
    for (const Root of [Email, Page, Document]) {
      const template = (
        <Root>
          <Row>
            <Column>
              {content(Paragraph)}
              {content(Heading)}
              <Button href="https://e.test">
                Go <style>{evil}</style>
              </Button>
            </Column>
          </Row>
        </Root>
      );
      const html = renderToHtml(template);
      const texts = renderToJson(template).body.rows[0].columns[0].contents.map((c: any) => String(c.values.text ?? JSON.stringify(c.values.textJson)));
      for (const markup of [html, ...texts]) {
        expect(markup).not.toMatch(/evil\.test|<b>bold|>click<|&lt;a href/);
      }
      expect(texts[1]).toMatch(/^Hi\s+there$/);
    }
  });

  it("cost about ten times as much for ten times as much markup of any short shape (random, seeded): a component's own HTML in them, a lone link", async () => {
    // Markup a component of yours writes as it is (`dangerouslySetInnerHTML`), as it reaches the text a block keeps: a
    // <style> or <script> left open at its end takes the end tags after it out with it, so the `<`s before it have no
    // `>` after them (the tags' regex read to the end from each of them: 100 KB took 4 to 16 s).
    const pieces = ["<", ">", "</", "<style", "<script", "</style>", "</script >", "<a", "<b", "<br", "<x-y:z", "span", " ", "\t", "\n", "=", '"', "'", "x", "-", ":", "href", "style", "class", "javascript:", "&lt;%", "%&gt;", "<%", "%>", "&amp;", "/", "<!--", "-->"];
    const ends = ["", "<a ", "<style>", "<span ", "<b>", "<script", "x"];
    let seed = 5;
    const random = (n: number) => ((seed = (Math.imul(seed, 1103515245) + 12345) >>> 0), Math.floor((seed / 2 ** 32) * n));
    const fill = (head: string, unit: string, tail: string, bytes: number) => head + unit.repeat(Math.ceil(bytes / unit.length)).slice(0, bytes) + tail;
    const Markup = ({ html }: { html: string }) => <span dangerouslySetInnerHTML={{ __html: html }} />;
    const time = (html: string) => {
      const start = performance.now();
      renderToJson(
        <Email><Row><Column>
          <Paragraph>Hi <Markup html={html} /></Paragraph>
          <Heading>Hi <Markup html={html} /></Heading>
          <Button href="https://example.com">Go <Markup html={html} /></Button>
          <Link href="https://example.com"><Markup html={html} /></Link>
        </Column></Row></Email>
      );
      return performance.now() - start;
    };
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const slow: string[] = [];
    try {
      for (let run = 0; run < 100; run++) {
        let unit = "";
        for (let i = 0, n = 1 + random(4); i < n; i++) unit += pieces[random(pieces.length)];
        const [head, tail] = [ends[random(ends.length)], ends[random(ends.length)]];
        // (The seeded shapes stay the same: timing one again draws nothing.)
        const { small, large, next, grows } = await growth((bytes) => time(fill(head, unit, tail, bytes)), [10240, 102400], { ratio: 20, floor: 100, next: 1024000 });
        if (grows) slow.push(`${JSON.stringify([head, unit, tail])}: ${small.toFixed(1)} ms for 10 KB, ${large.toFixed(1)} ms for 100 KB${next === undefined ? "" : `, ${next.toFixed(0)} ms for 1 MB`}`);
      }
    } finally {
      warn.mockRestore();
    }
    expect(slow).toEqual([]);
  }, 120_000);

  it("fail the render for an object or a date among them, as React's render does, not leave it out (the README's errors)", () => {
    const order = { createdAt: new Date(0), total: { amount: 49, currency: "USD" } } as any;
    const blocks = [
      <Paragraph key="p">Ordered on {order.createdAt}.</Paragraph>,
      <Heading key="h">Total {order.total}</Heading>,
      <Button key="b" href="https://example.com">Pay {order.total}</Button>,
      <Paragraph key="m">Ordered on <strong>{order.createdAt}</strong></Paragraph>,
    ];
    for (const block of blocks) {
      const template = <Email><Row><Column>{block}</Column></Row></Email>;
      for (const render of [renderToHtml, renderToJson, renderToPlainText] as Array<(t: React.ReactElement) => unknown>) expect(() => render(template)).toThrow(/Objects are not valid as a React child/);
    }
    // A Set is a collection, as React renders one, and null, booleans and undefined show nothing, as before.
    expect(renderToHtml(<Email><Row><Column><Heading>A{new Set(["b", "c"]) as any}{null}{false}{undefined}</Heading></Column></Row></Email>)).toContain("Abc");
  });

  it("leave text given as strings exactly as before", () => {
    const strings = <Email><Row><Column><Paragraph>Hi {name}</Paragraph><Heading>{"A <b>b</b>"}</Heading><Button href="#">{["Go", " now"]}</Button></Column></Row></Email>;
    const [paragraph, heading, button] = renderToJson(strings).body.rows[0].columns[0].contents as Array<{ values: { text: string } }>;
    // (A Paragraph's string is text: escaped in the design's HTML, as in the email's, so the editor shows it as typed.)
    expect(paragraph.values.text).toBe(`Hi &lt;img src=x onerror="alert(1)"&gt; &amp; Co`);
    expect(heading.values.text).toBe("A &lt;b&gt;b&lt;/b&gt;");
    expect(button.values.text).toBe("Go now");
  });
});

describe("an email service's <%name%> tag in text", () => {
  it.each([["email", Email], ["web", Page]] as const)("stays as written in Heading and Button text and Menu items, for it to fill in, as in 0.1.22 (%s)", (mode, Root) => {
    const html = renderToHtml(
      <Root><Row><Column>
        <Heading>{"Hi <%first_name%>"}</Heading>
        <Button href="https://example.com">{"Open <%first_name%>'s plan"}</Button>
        <Menu items={[{ text: "<%company%> home", href: "https://example.com" }]} />
      </Column></Row></Root>
    );
    expect(html).toContain("Hi <%first_name%>");
    expect(html).toContain("<%first_name%>");
    // Menu text: the email exporter writes it as it is (0.1.22 too); the web and document ones escape it.
    if (mode === "email") expect(html).toContain("<%company%>");
    // Markup around it is still escaped.
    expect(renderToHtml(<Root><Row><Column><Heading>{"<%name%><b>bold</b>"}</Heading></Column></Row></Root>)).toContain("<%name%>&lt;b&gt;bold&lt;/b&gt;");
  });
});

describe("an email service's tag with quotes in a link's URL", () => {
  // A link's URL is an attribute, double-quoted: its single quotes are written as written, as a Button's are.
  it.each([["email", Email], ["web", Page]] as const)("keeps a Liquid default's single quotes in a Link's, a Link in a Paragraph's and an inline <a>'s href, in the HTML and the design (%s)", (_, Root) => {
    const href = "{{ email | default: 'none' }}";
    for (const block of [<Link key="l" href={href}>Email us</Link>, <Paragraph key="p">Write <Link href={href}>here</Link></Paragraph>, <Paragraph key="a">Write <a href={href}>here</a></Paragraph>]) {
      const template = <Root><Row><Column>{block}</Column></Row></Root>;
      expect(renderToHtml(template)).toContain(`href="${href}"`);
      expect(String(renderToJson(template).body.rows[0].columns[0].contents[0].values.text)).toContain(`href="${href}"`);
    }
  });
});

describe("an email service's tag with quotes in rich text", () => {
  // React writes a `'` in text as `&#x27;` and a `"` as `&quot;`, which a Liquid tag can't read; text given as a string
  // keeps them, as 0.2.1 kept them in a Heading's and a Button's.
  it.each([["email", Email, "'"], ["web", Page, "'"], ["email", Email, '"'], ["web", Page, '"']] as const)("keeps its quotes in a Paragraph, a Heading and a Button with inline markup, in the HTML and the design (%s, %s)", (_, Root, quote) => {
    const tag = `{{ first_name | default: ${quote}friend${quote} }}`;
    const template = (
      <Root><Row><Column>
        <Paragraph>Hi {tag}, <strong>thanks</strong> <a href="https://example.com" title={`it's "it"`}>x</a></Paragraph>
        <Heading>Hi {tag}<br />more</Heading>
        <Button href="https://example.com">Go {tag} <strong>now</strong></Button>
      </Column></Row></Root>
    );
    const html = renderToHtml(template);
    expect(html.split(tag)).toHaveLength(4);
    const texts = renderToJson(template).body.rows[0].columns[0].contents.map((c: any) => String(c.values.text));
    for (const text of texts) expect(text).toContain(tag);
    // A tag's attributes keep their `"` as React wrote them, which would end them; a `'` can't, so it's as written.
    expect(texts[0]).toContain(`title="it's &quot;it&quot;"`);
  });
});

describe("an email service's tag in the plain text", () => {
  it("keeps a heading's tags as written in its capitals, every common service's (0.2.1 put them in capitals too)", () => {
    const tags = ["{{ first_name | default: \"there\" }}", "{% if vip %}", "{{{raw}}}", "%recipient.first_name%", "%%=v(@name)=%%", "${first_name}", "{$first_name}", "<%name%>"];
    const text = renderToPlainText(<Email><Row><Column><Heading>{`Welcome, ${tags.join(" ")}!`}</Heading></Column></Row></Email>);
    expect(text).toContain(`WELCOME, ${tags.join(" ")}!`);
  });

  it("stays, in a Paragraph with inline markup as in one of text (as 0.2.1 kept it), a Heading and a Button; so do other services' tags", () => {
    const tags = "<%first_name%> {{last_name}} *|FNAME|* %%Company%%";
    const template = (
      <Email>
        <Row>
          <Column>
            <Paragraph>
              Hi {tags}, <b>bold</b> and <a href="https://example.com">a link</a>
            </Paragraph>
            <Paragraph>Hi {tags}</Paragraph>
            <Heading>{`Hello ${tags}`}</Heading>
            <Button href="https://example.com">{`Go ${tags}`}</Button>
          </Column>
        </Row>
      </Email>
    );
    const text = renderToPlainText(template);
    expect(text).toContain(`Hi ${tags}, bold and a link (https://example.com)`);
    expect(text).toContain(`Hi ${tags}\n`);
    // A heading's capitals leave its tags as written: a service reads `{{ last_name }}`, not `{{ LAST_NAME }}`.
    expect(text).toContain("HELLO <%first_name%> {{last_name}} *|FNAME|* %%Company%%");
    expect(text).toContain(`Go ${tags} (https://example.com)`);
  });

  it("doesn't change how the HTML escapes what's around it", () => {
    const template = (
      <Email>
        <Row>
          <Column>
            <Paragraph>
              {"<%name%><img src=x onerror=alert(1)> <% x %><svg onload=alert(2)>"} <b>b</b>
            </Paragraph>
          </Column>
        </Row>
      </Email>
    );
    const html = renderToHtml(template);
    expect(html).toContain("<%name%>&lt;img src=x onerror=alert(1)&gt; &lt;% x %&gt;&lt;svg onload=alert(2)&gt; <b>b</b>");
    expect(new DOMParser().parseFromString(html, "text/html").querySelectorAll("img, svg")).toHaveLength(0);
    expect(renderToPlainText(template)).toContain("<%name%><img src=x onerror=alert(1)> <% x %><svg onload=alert(2)> b");
  });
});

describe("Menu item text in an email", () => {
  // The email exporter writes it as HTML, as 0.1.22 wrote it as given: an entity and a single quote (a template's
  // string) stay as written; markup is escaped, and a double quote, also in a template tag: it's in an aria-label too.
  it("keeps entity references and single quotes, and escapes markup", () => {
    const html = renderToHtml(
      <Email><Row><Column>
        <Menu items={[
          { text: "Shop &rarr;", href: "https://a.example" },
          { text: "Privacy&nbsp;Policy &#169; &#xA9;", href: "https://b.example" },
          { text: "{{ name | default: 'you' }}", href: "https://c.example" },
          { text: 'Tom & Jerry <b>"bold"</b> &bogus', href: "https://d.example" },
        ]} />
      </Column></Row></Email>
    );
    expect(html).toContain("Shop &rarr;");
    expect(html).toContain("Privacy&nbsp;Policy &#169; &#xA9;");
    expect(html).toContain("{{ name | default: 'you' }}");
    // A template tag's double quote ends the aria-label as well as any (`{{ " }} onmouseover=…` adds a handler).
    const liquid = renderToHtml(<Email><Row><Column><Menu items={[{ text: '{{ " }} onmouseover=alert(1) x', href: "https://e.example" }, { text: '{{ x" hidden }}', href: "https://f.example" }]} /></Column></Row></Email>);
    const links = Array.from(new DOMParser().parseFromString(liquid, "text/html").querySelectorAll("a"));
    expect(links.map((a) => a.getAttributeNames().sort())).toEqual(links.map(() => ["aria-label", "class", "href", "style", "target"]));
    expect(liquid).toContain("{{ &quot; }} onmouseover=alert(1) x");
    expect(html).toContain("Tom &amp; Jerry &lt;b&gt;&quot;bold&quot;&lt;/b&gt; &amp;bogus");
    expect(html).not.toContain("<b>");
  });
});

describe("an email service's <%name%> tag in the preview text", () => {
  it("stays as written, for it to fill in, as in 0.1.22; markup around it is still escaped", () => {
    const html = renderToHtml(<Email previewText="Your <%subject%> receipt <b>now</b> & more"><Row><Column><Paragraph>Hi</Paragraph></Column></Row></Email>);
    expect(html).toContain("Your <%subject%> receipt &lt;b&gt;now&lt;/b&gt; &amp; more");
  });
});

describe("link URLs", () => {
  it.each([["email", Email], ["web", Page]] as const)("can't end their href attribute (%s)", (_, Root) => {
    const html = renderToHtml(
      <Root><Row><Column>
        <Button href={'https://example.com/?a=1&b=2"><img src=x onerror="alert(1)">'}>Go</Button>
        <Button href="https://example.com/plain?a=1&b=2">Plain</Button>
      </Column></Row></Root>
    );
    expect(html).not.toContain("<img src=x");
    expect(html).toContain('https://example.com/?a=1&b=2%22%3E%3Cimg');
    // An ordinary URL is written as before.
    expect(html).toContain('href="https://example.com/plain?a=1&b=2"');
  });

  it.each([["email", Email], ["web", Page]] as const)("keep an email service's <%name%> placeholder as written, for it to fill in (%s)", (_, Root) => {
    const unsubscribe = "<%asm_group_unsubscribe_raw_url%>";
    const email = <Root><Row><Column><Button href={unsubscribe}>Unsubscribe</Button><Button href={`${unsubscribe}"><img src=x onerror="alert(1)">`}>Go</Button></Column></Row></Root>;
    const html = renderToHtml(email);
    expect(html).toContain(`href="${unsubscribe}"`);
    // Anything else around it is still encoded.
    expect(html).not.toContain("<img src=x");
    expect(html).toContain(`${unsubscribe}%22%3E%3Cimg`);
    expect(JSON.stringify(renderToJson(email))).toContain(unsubscribe);
  });

  it("leave plain labels as they were", () => {
    const html = renderToHtml(<Email><Row><Column><Button href="#">Click me</Button><Heading>Welcome</Heading></Column></Row></Email>);
    expect(html).toMatch(/>Click me</);
    expect(html).toMatch(/>\s*Welcome\s*</);
  });
});

describe("line breaks in Heading and Button text", () => {
  it.each([["email", Email], ["web", Page], ["document", Document]] as const)("stay breaks, written in a string or as a JSX <br /> (%s)", (_, Root) => {
    const html = renderToHtml(
      <Root><Row><Column>
        <Heading>{"The Last Light<br/>on the Dolomites"}</Heading>
        <Heading>Work together,<br />in real time</Heading>
        <Button href="https://example.com/shop">{"Shop<br>now"}</Button>
        <Heading>{'Hi<br/><img src=x onerror="alert(1)">'}</Heading>
      </Column></Row></Root>
    );
    const doc = new DOMParser().parseFromString(html, "text/html");
    const [first, second, last] = Array.from(doc.querySelectorAll("h1"));
    expect([first, second, last].map((h) => h.querySelectorAll("br").length)).toEqual([1, 1, 1]);
    expect(first.textContent).toBe("The Last Lighton the Dolomites");
    expect(doc.querySelector("a[href='https://example.com/shop'] br")).not.toBeNull();
    // Only the break: other markup still shows as typed.
    expect(doc.querySelectorAll("img[src='x']")).toHaveLength(0);
    expect(last.textContent).toBe('Hi<img src=x onerror="alert(1)">');
  });
});

describe("text placed straight in a Row or Column", () => {
  const Name = () => name;
  it.each([["email", Email], ["web", Page], ["document", Document]] as const)("shows as text, from a Fragment, a component or written there (%s)", (_, Root) => {
    // Said once in each render for each container (it was once in a process, without the prefix).
    const warned: string[] = [];
    const warn = vi.spyOn(console, "warn").mockImplementation((message) => void warned.push(String(message)));
    try {
      const html = renderToHtml(
        <Root>
          <Row>{name}<Column><>{name}</></Column></Row>
          <Row><Column><Name /></Column></Row>
          <Row><Column>{name}{7}</Column></Row>
        </Root>
      );
      expect(html).not.toContain("<img src=x");
      expect(html.match(/&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt; &amp; Co/g)).toHaveLength(4);
      expect(html).toContain("&amp; Co7");
      expect(warned.filter((m) => m.includes("Put it in a <Paragraph>")).map((m) => m.slice(0, 30))).toEqual(["[Unlayer] Row: text placed str", "[Unlayer] Column: text placed "]);
    } finally {
      warn.mockRestore();
    }
  });

  it("keeps an email service's <%name%> tag as written, as other text does", () => {
    const html = renderToHtml(<Email><Row><Column>{"Hi <%first_name%> <b>"}</Column></Row></Email>);
    expect(html).toContain("Hi <%first_name%> &lt;b&gt;");
  });

  it("doesn't warn about whitespace between blocks", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      renderToHtml(<Email><Row>{" "}<Column>{" "}<Paragraph>Hi</Paragraph>{"\n"}</Column></Row></Email>);
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });
});

describe("text blocks in a right-to-left document", () => {
  it.each([["email", Email], ["web", Page], ["document", Document]] as const)("start on the right unless they're aligned; left-to-right ones are unchanged (%s)", (_, Root) => {
    const blocks = (dir?: string) => (
      <Root textDirection={dir}>
        <Row><Column><Heading>مرحبا</Heading><Paragraph>نص</Paragraph><Paragraph textAlign="center">وسط</Paragraph><Button href="#">زر</Button></Column></Row>
      </Root>
    );
    const rtl = renderToHtml(blocks("rtl"));
    expect(rtl.match(/text-align: ?right/g)?.length).toBeGreaterThanOrEqual(2);
    expect(rtl).toMatch(/text-align: ?center[^>]*>\s*(<p[^>]*>)?وسط/);
    const [heading, paragraph, centered, button] = renderToJson(blocks("rtl")).body.rows[0].columns[0].contents as Array<{ values: { textAlign: string } }>;
    expect([heading, paragraph, centered, button].map((c) => c.values.textAlign)).toEqual(["right", "right", "center", "center"]);
    // Through the renderer's option too.
    expect(renderToHtml(blocks(), { textDirection: "rtl" })).toMatch(/text-align: ?right/);
    expect(renderToHtml(blocks())).not.toMatch(/text-align: ?right/);
    expect(renderToJson(blocks()).body.rows[0].columns[0].contents.map((c: any) => c.values.textAlign)).toEqual(["left", "left", "center", "center"]);
  });
});

describe("the text direction", () => {
  it.each([["email", Email], ["web", Page], ["document", Document]] as const)("is only ever ltr, rtl or auto in the markup (%s)", (_, Root) => {
    const html = renderToHtml(<Root textDirection={'rtl"><img src=x onerror="alert(1)">'}><Row><Column><Paragraph>x</Paragraph></Column></Row></Root>);
    expect(html).not.toContain("<img src=x");
    const rtl = (dir: string) => renderToHtml(<Root textDirection={dir}><Row><Column><Paragraph>x</Paragraph></Column></Row></Root>);
    expect(rtl("RTL")).toContain('<html dir="rtl"');
    expect(rtl("RTL")).toBe(rtl("rtl"));
  });
});

describe("ids and class names given in values._meta", () => {
  // As 0.1.22 wrote them, but for what could end the attribute. A block's class names aren't in its HTML (as in 0.1.22).
  it("keep letters of any script, dots, colons and slashes", () => {
    for (const Root of [Email, Page]) {
      const html = renderToHtml(
        <Root>
          <Row values={{ _meta: { htmlID: "סיכום.r", htmlClassNames: "sm:hidden promo" } } as never}>
            <Column values={{ _meta: { htmlID: "c:1", htmlClassNames: "col/left x" } } as never}>
              <Paragraph values={{ _meta: { htmlID: "section.2" } } as never}>A</Paragraph>
              <Paragraph values={{ _meta: { htmlID: 'x" onclick="alert(1)' } } as never}>B</Paragraph>
            </Column>
          </Row>
          <Row values={{ _meta: { htmlClassNames: "a<b>\"c" } } as never}><Column><Paragraph>C</Paragraph></Column></Row>
        </Root>
      );
      expect(html).toContain('id="סיכום.r"');
      expect(html).toContain("sm:hidden promo");
      expect(html).toContain('id="c:1"');
      expect(html).toContain("col/left x");
      expect(html).toContain('id="section.2"');
      expect(html).not.toContain('onclick="alert(1)');
      expect(html).not.toContain("a<b>");
      expect(html).toContain("abc");
    }
    // Class names on lines of their own, or apart by a tab, stay apart (as 0.1.22 wrote them).
    const classes = renderToHtml(<Email><Row values={{ _meta: { htmlClassNames: "hero\ndark\tpromo\r\nwide" } } as never}><Column><Paragraph>A</Paragraph></Column></Row></Email>);
    const row = new DOMParser().parseFromString(classes, "text/html").querySelector(".hero")!;
    expect(["dark", "promo", "wide"].every((name) => row.classList.contains(name))).toBe(true);
  });
});

