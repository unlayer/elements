import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToHtml, renderToPlainText } from "./render-to-html";
import { renderToJson } from "./render-to-json";
import { Email, Page, Document, Row, Column, Heading, Button, Paragraph, Menu, Link } from "../index";

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
    expect(button.values.text).toBe(heading.values.text);
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
  // Said once per container in a process, not on every render.
  const warned: string[] = [];
  it.each([["email", Email], ["web", Page], ["document", Document]] as const)("shows as text, from a Fragment, a component or written there (%s)", (_, Root) => {
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
      expect(warned.filter((m) => m.includes("Put it in a <Paragraph>"))).toHaveLength(2);
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

