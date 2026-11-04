/**
 * Values that often come from users (a name, a link, a language) can't add
 * markup: each is given markup that would add an element or an attribute, in
 * every mode, and the parsed output must have neither. Raw HTML is what the
 * Html block and the `text` prop of Heading and Button are for, so they aren't
 * tested; design props (colors, sizes) come from the template's author. Phone
 * settings are written into the head's CSS, where a value could end the
 * `<style>` element or add rules, so they're tested too.
 */
import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToHtml } from "../utils/render-to-html";
import { renderToJson } from "../utils/render-to-json";
import { renderToHtmlParts, renderToPlainText } from "../utils/render-to-html";
import * as current from "../index";
import * as previous from "@unlayer/react-elements-previous";
import { Email, Page, Document, Row, Column, Paragraph, Heading, Button, Image, Menu, Social, Html, Table, Video, Divider, registerTool } from "../index";

const PAYLOADS = [
  '"><x-pwn></x-pwn>', "'><x-pwn></x-pwn>", '" x-pwn="1', "' x-pwn='1", "</p></div></td></tr></table><x-pwn></x-pwn>",
  // A template tag's quote ends an attribute as well as any (Menu text is in an aria-label too), with or without `=`.
  '{{ " }} x-pwn=1 y', '{{ x" x-pwn }}', '{{ "x" x-pwn }}', '<%a%>" x-pwn="1',
  // What looks like the mark of a tag kept elsewhere (KEPT_ELSEWHERE, in every template below), which would bring it out here.
  "\uFDD00\uFDD1", "\uFDD01\uFDD1", "a\uFDD00\uFDD1b\uFDD01\uFDD1c",
  // A noncharacter's entity, which keeps text's markup escaped as any is: it's HTML where it's read as written, never where it's text.
  "&#xFDD0;<x-pwn></x-pwn>",
  // An email service's tag holding markup, or a quote that would end an attribute: kept, it would be written as it is.
  "<%a><x-pwn></x-pwn>%>", "{{ <x-pwn></x-pwn> }}", "{% <x-pwn></x-pwn> %}", "{% if a <x-pwn></x-pwn> %}", `{% assign x = '" x-pwn="1' %}`, `{{ " x-pwn="1 }}`, `<%a" x-pwn="1%>`,
];

/** Elements or attributes named x-pwn: what a payload adds if it gets out. */
function injected(html: string): string[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const out: string[] = [];
  for (const el of Array.from(doc.querySelectorAll("*"))) {
    if (el.tagName.toLowerCase() === "x-pwn") out.push("element");
    for (const attr of Array.from(el.attributes)) if (attr.name === "x-pwn") out.push(`attribute on <${el.tagName.toLowerCase()}>`);
  }
  return out;
}

/** A block whose email service's tags are kept and inert where they are: one holds markup (in an attribute), one a quote (in text). */
const KEPT_ELSEWHERE = <Row><Column><Paragraph html={`<span title="<%a><x-pwn></x-pwn>%>">Kept</span> {% assign x = '" x-pwn="1' %}`} /></Column></Row>;

const content = (v: string) => <Row><Column><Paragraph>Hello</Paragraph></Column></Row>;
const CASES: Record<string, (v: string) => React.ReactElement> = {
  // An id or class name given in `values` (an escape hatch), on the block and its wrapper.
  blockHtmlId: (v) => <Row><Column><Paragraph values={{ _meta: { htmlID: `u_content_text_1${v}`, htmlClassNames: `u_content_text${v}` } } as never}>Hello</Paragraph></Column></Row>,
  // The same with a phone setting: the head's CSS selects the block by its id.
  blockHtmlIdPhone: (v) => <Row><Column><Paragraph mobile={{ fontSize: "12px" }} values={{ _meta: { htmlID: `u_content_text_1${v}` } } as never}>Hello</Paragraph></Column></Row>,
  columnHtmlId: (v) => <Row><Column values={{ _meta: { htmlID: `u_column_1${v}`, htmlClassNames: `u_column${v}` } } as never}><Paragraph>Hello</Paragraph></Column></Row>,
  rowHtmlId: (v) => <Row values={{ _meta: { htmlID: `u_row_1${v}`, htmlClassNames: `u_row${v}` } } as never}><Column><Paragraph>Hello</Paragraph></Column></Row>,
  "Paragraph text": (v) => <Row><Column><Paragraph>{v}</Paragraph></Column></Row>,
  "Heading text": (v) => <Row><Column><Heading>{v}</Heading></Column></Row>,
  "Button text": (v) => <Row><Column><Button href="https://example.com">{v}</Button></Column></Row>,
  "Button link": (v) => <Row><Column><Button href={`https://example.com/${v}`}>Go</Button></Column></Row>,
  // A URL that isn't a string: an array, as a JSON body or `?url[]=` gives it.
  "Button link as an array": (v) => <Row><Column><Button href={[`https://example.com/${v}`] as never}>Go</Button></Column></Row>,
  "Image link as an array": (v) => <Row><Column><Image src="https://example.com/a.png" width="100px" alt="x" href={[`https://example.com/${v}`] as never} /></Column></Row>,
  "Menu link as an array": (v) => <Row><Column><Menu items={[{ text: "Home", href: [`https://example.com/${v}`] as never }]} /></Column></Row>,
  "Image source": (v) => <Row><Column><Image src={`https://example.com/${v}.png`} width="100px" alt="x" /></Column></Row>,
  "Image text": (v) => <Row><Column><Image src="https://example.com/a.png" width="100px" alt={v} /></Column></Row>,
  "Image link": (v) => <Row><Column><Image src="https://example.com/a.png" width="100px" alt="x" href={`https://example.com/${v}`} /></Column></Row>,
  "Menu item": (v) => <Row><Column><Menu items={[{ text: v, href: `https://example.com/${v}` }]} /></Column></Row>,
  "Menu item with no link": (v) => <Row><Column><Menu items={[{ text: v }]} /></Column></Row>,
  "Menu item, one under another": (v) => <Row><Column><Menu layout="vertical" items={[{ text: v, href: "https://example.com" }]} /></Column></Row>,
  "Menu separator": (v) => <Row><Column><Menu separator={v} items={[{ text: "A", href: "https://example.com" }, { text: "B", href: "https://example.com" }]} /></Column></Row>,
  "Social image": (v) => <Row><Column><Social values={{ icons: { icons: [{ name: "Twitter", url: "https://twitter.com/x", imgUrl: `https://example.com/${v}.png` }] } } as never} /></Column></Row>,
  "Video thumbnail": (v) => <Row><Column><Video values={{ video: { thumbnail: `https://example.com/${v}.png`, url: "https://example.com/v" } } as never} /></Column></Row>,
  "Video link": (v) => <Row><Column><Video values={{ video: { thumbnail: "https://example.com/t.png", url: `https://example.com/${v}` } } as never} /></Column></Row>,
  "Button attribute": (v) => <Row><Column><Button href={{ url: "https://example.com", customAttrs: { "data-x": v } } as never}>Go</Button></Column></Row>,
  "Social link": (v) => <Row><Column><Social icons={[{ name: "Twitter", url: `https://twitter.com/${v}` }]} /></Column></Row>,
  "Social name": (v) => <Row><Column><Social icons={[{ name: v, url: "https://twitter.com/x" }]} /></Column></Row>,
  "text in a Column": (v) => <Row><Column>{v}</Column></Row>,
  "text in a Fragment": (v) => <Row><Column><>{v}</></Column></Row>,
};
const ROOT_PROPS: Record<string, (v: string) => Record<string, unknown>> = {
  previewText: (v) => ({ previewText: v }),
  textDirection: (v) => ({ textDirection: v }),
  lang: (v) => ({ lang: v }),
  "font URL": (v) => ({ fonts: [{ url: `https://example.com/${v}.css` }] }),
};
const ROOTS = { email: Email, web: Page, document: Document } as const;

describe.each(Object.entries(ROOTS))("%s", (_, Root) => {
  const quiet = () => vi.spyOn(console, "warn").mockImplementation(() => {});

  it.each(Object.keys(CASES))("%s can't add markup", (name) => {
    const warn = quiet();
    try {
      for (const payload of PAYLOADS) expect(injected(renderToHtml(<Root>{KEPT_ELSEWHERE}{CASES[name](payload)}</Root>)), payload).toEqual([]);
    } finally {
      warn.mockRestore();
    }
  });

  // Only an email renders its preview text.
  it.each(Object.keys(ROOT_PROPS).filter((name) => name !== "previewText" || Root === Email))("the root's %s can't add markup", (name) => {
    for (const payload of PAYLOADS) {
      const html = renderToHtml(React.createElement(Root, ROOT_PROPS[name](payload) as never, KEPT_ELSEWHERE, content(payload)));
      expect(injected(html), payload).toEqual([]);
    }
  });

  it("the title option can't add markup", () => {
    for (const payload of PAYLOADS) expect(injected(renderToHtml(<Root>{KEPT_ELSEWHERE}{content(payload)}</Root>, { title: payload, lang: payload })), payload).toEqual([]);
  });
});

describe("an email service's tag, against 0.2.1", () => {
  const MARKUP = ["<%a><img src=x>%>", "{{ <img src=x> }}", "{% <img src=x> %}", "{% if a <b %}", "<%/a%><!-- x -->"];
  /** Each tool's values that take text, not HTML, in the place a tag is written: a text's words, or an attribute. */
  const TOOLS: Record<string, { block: (L: any, v: string) => React.ReactElement; read: (document: Document) => string | null | undefined }> = {
    "Menu item": { block: (L, v) => <L.Menu items={[{ text: v, href: "https://example.com" }]} />, read: (d) => d.querySelector('a[href="https://example.com"]')?.textContent?.trim() },
    "Menu item with no link": { block: (L, v) => <L.Menu items={[{ text: v }]} />, read: (d) => d.querySelector("[aria-label^='Menu item']")?.getAttribute("aria-label")?.replace("Menu item - ", "") },
    "Menu item's label": { block: (L, v) => <L.Menu items={[{ text: v, href: "https://example.com" }]} />, read: (d) => d.querySelector("a[aria-label]")?.getAttribute("aria-label")?.replace("Menu item - ", "") },
    "Image text": { block: (L, v) => <L.Image src="https://example.com/a.png" alt={v} />, read: (d) => d.querySelector("img")?.getAttribute("alt") },
    "Image URL": { block: (L, v) => <L.Image src={`https://example.com/${v}.png`} alt="a" />, read: (d) => d.querySelector("img")?.getAttribute("src") },
    "Social name": { block: (L, v) => <L.Social icons={[{ name: v, url: "https://example.com" }]} />, read: (d) => d.querySelector("img")?.getAttribute("alt") },
  };
  const ALL = { Email: "email", Page: "web", Document: "document" } as const;
  const parse = (html: string) => new DOMParser().parseFromString(html, "text/html");
  const render = (L: any, root: string, block: React.ReactElement) => L.renderToHtml(React.createElement(L[root], null, <L.Row><L.Column>{block}</L.Column></L.Row>));
  const added = (document: Document) => Array.from(document.querySelectorAll("body img[src=x], body b"));

  describe.each(Object.keys(ALL))("%s", (root) => {
    const quiet = () => vi.spyOn(console, "warn").mockImplementation(() => {});
    it.each(Object.keys(TOOLS))("%s: a tag holding markup is text, read as 0.2.1 reads it", (name) => {
      const { block, read } = TOOLS[name];
      const warn = quiet();
      try {
        for (const tag of MARKUP) {
          const [now, then] = [parse(render(current, root, block(current, tag))), parse(render(previous, root, block(previous, tag)))];
          expect(added(now), tag).toEqual([]);
          expect(added(then), tag).toEqual([]);
          expect(read(now), tag).toBe(read(then));
        }
      } finally {
        warn.mockRestore();
      }
    });
  });

  // Where 0.2.1 keeps one for its service to fill in, it stays; where 0.2.1 escapes it, it's escaped. In a browser they read the same.
  it("stays where 0.2.1 keeps it, in an email's markup", () => {
    const tags = ["<%name%>", "{% if orders > 1 %}", "{% if orders < 1 %}", "{{ name | default: 'you' }}"];
    const places = (v: string) => (
      <Email>
        <Row>
          <Column>
            <Menu separator={v} items={[{ text: v, href: "https://example.com" }, { text: "B", href: "https://example.com" }]} />
            <Social values={{ icons: { icons: [{ name: "Twitter", url: "https://example.com", imgUrl: `https://example.com/${v}.png` }] } } as never} />
            <Video values={{ video: { thumbnail: `https://example.com/${v}.png`, url: `https://example.com/${v}` } } as never} />
            <Button href={{ url: "https://example.com", customAttrs: { "data-x": v } } as never}>Go</Button>
          </Column>
        </Row>
      </Email>
    );
    for (const tag of tags) {
      const html = renderToHtml(places(tag));
      expect(html, tag).toContain(`Menu item - ${tag}"`);
      expect(html, tag).toContain(`>${tag}</`);
      expect(html.split(`src="https://example.com/${tag}.png"`), tag).toHaveLength(3);
      expect(html, tag).toContain(`href="https://example.com/${tag}"`);
      expect(html, tag).toContain(`data-x="${tag}"`);
    }
  });

  it("with a double quote stays in its attribute, encoded", () => {
    const tag = `{% assign x = '" x-pwn="1' %}`;
    const encoded = "{% assign x = '&quot; x-pwn=&quot;1' %}";
    const html = renderToHtml(<Email><Row><Column><Button href={{ url: "https://example.com", customAttrs: { "data-x": tag } } as never}>Go</Button><Menu items={[{ text: tag, href: "https://example.com" }]} /><Social values={{ icons: { icons: [{ name: "T", url: "https://example.com", imgUrl: `https://example.com/${tag}.png` }] } } as never} /></Column></Row></Email>);
    expect(injected(html)).toEqual([]);
    expect(html).toContain(`data-x="${encoded}"`);
    expect(html).toContain(`Menu item - ${encoded}"`);
    expect(html).toContain(`src="https://example.com/${encoded}.png"`);
  });

  it("is escaped where 0.2.1 escapes it: an image's text and URL, a social icon's name, a page's and a printed document's links", () => {
    const tag = "<%name%>";
    const escaped = "&lt;%name%&gt;";
    for (const root of Object.keys(ALL)) {
      const image = render(current, root, <Image src={`https://example.com/${tag}.png`} alt={tag} />);
      expect(image).toContain(`src="https://example.com/${escaped}.png"`);
      expect(image).toContain(`alt="${escaped}"`);
      expect(render(current, root, <Social icons={[{ name: tag, url: "https://example.com" }]} />)).toContain(`alt="${escaped} icon"`);
    }
    for (const root of ["Page", "Document"]) {
      expect(render(current, root, <Menu items={[{ text: "A", href: `https://example.com/${tag}` }]} />)).toContain(`href="https://example.com/${escaped}"`);
      expect(render(current, root, <Social icons={[{ name: "Twitter", url: `https://example.com/${tag}` }]} />)).toContain(`href="https://example.com/${escaped}"`);
    }
  });

  it("stays as it's written in what's HTML, as 0.2.1's: a text's, a heading's, a button's label, a cell", () => {
    const tag = "{% if orders > 1 %}Thanks{% endif %} <%a><b>x</b>%>";
    for (const root of Object.keys(ALL)) {
      for (const block of [<Paragraph html={tag} />, <Heading text={tag} />, <Button href="https://example.com" text={tag} />, <Table values={{ table: { headers: [], footers: [], rows: [{ cells: [{ text: tag }] }] } } as never} />]) {
        const html = render(current, root, block);
        expect(html).toContain("{% if orders > 1 %}Thanks{% endif %}");
        expect(html).toContain("<%a><b>x</b>%>");
      }
    }
  });
});

describe("what looks like a mark of a kept tag", () => {
  // Every way a template's string reaches the writers. Each is given both marks, so that one that gets through brings out
  // a tag above, in text or in an attribute; with them it must draw what it draws without them.
  const tool = (v: string) => {
    const Tool = registerTool({ name: "marks_tool", renderer: { exporters: { web: () => `<i class="tool">Tool ${v}</i>`, email: () => `<i class="tool">Tool ${v}</i>` }, head: { css: () => `.tool { color: red; } /* ${v} */`, js: () => `var tool = "${v}";`, tags: () => [`<meta name="tool" content="${v}">`] } } });
    return <Tool />;
  };
  const Mine = ({ v }: { v: string }) => <div className={v}>Mine {v}</div>;
  const inColumn = (node: React.ReactNode) => <Row><Column>{node}</Column></Row>;
  // (A mark's characters written as JSON escapes, which only become them once it's read.)
  const textJson = (v: string) => JSON.stringify({ root: { type: "root", children: [{ type: "paragraph", children: [{ type: "text", text: `Words ${v}` }] }] } }).replace(/\uFDD0/g, "\\uFDD0").replace(/\uFDD1/g, "\\uFDD1");
  type Entry = { body?: (v: string) => React.ReactNode; root?: (v: string) => Record<string, unknown>; options?: (v: string) => Record<string, unknown> };
  const ENTRIES: Record<string, Entry> = {
    "a Paragraph's children": { body: (v) => inColumn(<Paragraph>{`Words ${v}`}</Paragraph>) },
    "a Paragraph's html": { body: (v) => inColumn(<Paragraph html={`Words ${v}`} />) },
    "HTML no run holds": { body: (v) => inColumn(<Paragraph html={`<ul><li>Words ${v}</li></ul>`} />) },
    "a Paragraph's textJson": { body: (v) => inColumn(<Paragraph values={{ textJson: textJson(v) } as never} />) },
    "a Paragraph's textJson holding HTML": { body: (v) => inColumn(<Paragraph values={{ textJson: `{"__html":"<ul><li>Words ${v.replace(/\uFDD0/g, "\\uFDD0").replace(/\uFDD1/g, "\\uFDD1")}</li></ul>"}` } as never} />) },
    "a Heading's text": { body: (v) => inColumn(<Heading text={`Words ${v}`} />) },
    "a Button's text": { body: (v) => inColumn(<Button href="https://example.com" text={`Words ${v}`} />) },
    "a Button's HTML no run holds": { body: (v) => inColumn(<Button href="https://example.com" text={`<ul><li>Words ${v}</li></ul>`} />) },
    "a Button's textJson": { body: (v) => inColumn(<Button href="https://example.com" values={{ textJson: textJson(v) } as never} />) },
    "a Button's link and attributes": { body: (v) => inColumn(<Button href={{ url: `https://example.com/${v}`, target: `_${v}`, class: `c${v}`, customAttrs: { "data-x": `x${v}` } } as never}>Go</Button>) },
    "an Image's URL, text and link": { body: (v) => inColumn(<Image src={`https://example.com/${v}.png`} alt={`Alt ${v}`} action={{ url: `https://example.com/${v}` } as never} />) },
    "a Menu's items, separator": { body: (v) => inColumn(<Menu separator={`|${v}`} items={[{ text: `Words ${v}`, href: `https://example.com/${v}` }, { text: `More ${v}` }]} />) },
    "a Social's icons": { body: (v) => inColumn(<Social icons={[{ name: `Twitter${v}`, url: `https://example.com/${v}` }]} />) },
    "a Video's thumbnail and link": { body: (v) => inColumn(<Video values={{ video: { thumbnail: `https://example.com/${v}.png`, url: `https://example.com/${v}` } } as never} />) },
    "a Table's cells": { body: (v) => inColumn(<Table values={{ table: { headers: [], footers: [], rows: [{ cells: [{ text: `Words ${v}` }, { textJson: textJson(v) }, { text: `<ul><li>${v}</li></ul>` }] }] } } as never} />) },
    "a Divider's values": { body: (v) => inColumn(<Divider values={{ containerPadding: `1em${v}` } as never} />) },
    "an id and class names": { body: (v) => <Row values={{ _meta: { htmlID: `r${v}`, htmlClassNames: `r${v}` } } as never}><Column values={{ _meta: { htmlID: `c${v}`, htmlClassNames: `c${v}` } } as never}><Paragraph values={{ _meta: { htmlID: `p${v}` } } as never}>Hi</Paragraph></Column></Row> },
    "a value that isn't read": { body: (v) => <Row values={{ somethingNew: v, backgroundColor: `hsl(1, 2%, 3%)${v}` } as never}><Column values={{ padding: `1em${v}`, [`key${v}`]: v } as never}><Paragraph>Hi</Paragraph></Column></Row> },
    "an Html block": { body: (v) => inColumn(<Html html={`<b>Words ${v}</b>`} />) },
    "a custom tool's output and head": { body: (v) => inColumn(tool(v)) },
    "a user's own markup": { body: (v) => inColumn(<Mine v={v} />) },
    "markup among the rows": { body: (v) => <><div className={v}>Among {v}</div>{inColumn(<Paragraph>Hi</Paragraph>)}</> },
    "text in a Row and a Column": { body: (v) => <Row>{`Row ${v}`}<Column>{`Column ${v}`}<Paragraph>Hi</Paragraph></Column></Row> },
    "a Row's className and style": { body: (v) => <Row className={`mine${v}`} style={{ fontFamily: `Font${v}` }}><Column><Paragraph>Hi</Paragraph></Column></Row> },
    "the root's values": { body: () => inColumn(<Paragraph>Hi</Paragraph>), root: (v) => ({ className: `c${v}`, style: { fontFamily: `Font${v}` }, previewText: `Preview ${v} <%name%>`, lang: `en${v}`, fonts: [{ url: `https://example.com/${v}.css` }], values: { preheaderText: `Preview ${v}` } }) },
    "the title and lang": { body: () => inColumn(<Paragraph>Hi</Paragraph>), options: (v) => ({ title: `Title ${v}`, lang: `en${v}` }) },
    "a sanitizer's output": { body: () => inColumn(<><Paragraph html="One" /><Paragraph html="<ul><li>Two</li></ul>" /><Button href="https://example.com" text="Three" /></>), options: (v) => ({ toSafeHtml: (html: string) => `${html} ${v}` }) },
    "the config": { body: () => inColumn(<><Social /><Video values={{ video: { thumbnail: "" } } as never} /><Table values={{ table: { headers: [], footers: [], rows: [{ cells: [{ text: "A" }] }] }, mergeTagGroup: "g", mergeTagRule: "r" } as never} /></>), options: (v) => ({ cdnBaseUrl: `https://cdn.example/${v}`, mergeTagState: { mergeTagGroup: "g", mergeTags: { g: { rules: { r: { before: `<!-- ${v} -->`, after: `<!-- ${v} -->` } } } } } }) },
  };
  const BOTH = "\uFDD00\uFDD1\uFDD01\uFDD1";
  const WITHOUT = "01";
  const quiet = () => [vi.spyOn(console, "warn").mockImplementation(() => {}), vi.spyOn(console, "error").mockImplementation(() => {})];

  describe.each(Object.entries(ROOTS))("%s", (_, Root) => {
    const template = (entry: Entry, v: string) => React.createElement(Root, entry.root?.(v) as never, KEPT_ELSEWHERE, entry.body?.(v));
    it.each(Object.keys(ENTRIES))("in %s draws what it draws without it", (name) => {
      const entry = ENTRIES[name];
      const spies = quiet();
      try {
        const options = (v: string) => entry.options?.(v) as never;
        const html = renderToHtml(template(entry, BOTH), options(BOTH));
        expect(injected(html)).toEqual([]);
        expect(html).not.toMatch(/[\uFDD0\uFDD1]/);
        expect(html).toBe(renderToHtml(template(entry, WITHOUT), options(WITHOUT)));
        const parts = renderToHtmlParts(template(entry, BOTH), options(BOTH));
        expect(injected(`${parts.head}${parts.body}`)).toEqual([]);
        expect(`${parts.head}${parts.body}`).not.toMatch(/[\uFDD0\uFDD1]/);
        expect(renderToPlainText(template(entry, BOTH), options(BOTH))).toBe(renderToPlainText(template(entry, WITHOUT), options(WITHOUT)));
      } finally {
        spies.forEach((spy) => spy.mockRestore());
      }
    });

    // Entities, a JSON escape: text that only becomes one once it's decoded. (Numbers past Unicode's first plane wrap
    // around in what reads the plain text.)
    it.each(["&#xFDD0;0&#xFDD1;&#xFDD0;1&#xFDD1;", "&#64976;0&#64977;&#64976;1&#64977;", "&#x1FDD0;0&#x1FDD1;&#x1FDD0;1&#x1FDD1;", "&amp;#xFDD0;0&amp;#xFDD1;&amp;#xFDD0;1&amp;#xFDD1;"])("in an entity (%s) stays no mark", (encoded) => {
      for (const body of [<Paragraph html={`Words ${encoded}`} />, <Heading text={`Words ${encoded}`} />, <Button href="https://example.com" text={`Words ${encoded}`} />, <Html html={`Words ${encoded}`} />, <Table values={{ table: { headers: [], footers: [], rows: [{ cells: [{ text: `Words ${encoded}` }] }] } } as never} />]) {
        const template = <Root>{KEPT_ELSEWHERE}{inColumn(body)}</Root>;
        expect(injected(renderToHtml(template))).toEqual([]);
        // The kept tag, once where it's kept (its attribute's isn't read in plain text).
        expect(renderToPlainText(template).match(/x-pwn/g)).toHaveLength(1);
      }
    });
  });

  it("leaves another private-use character as it is: an icon font's are text", () => {
    const html = renderToHtml(<Email>{KEPT_ELSEWHERE}<Row><Column><Paragraph>{"Icon \uE000 \uE0000\uE001"}</Paragraph><Image src={"https://example.com/\uE0000\uE001.png"} alt={"\uE0000\uE001"} /></Column></Row></Email>);
    expect(html).toContain("Icon \uE000 \uE0000\uE001");
    expect(html).toContain('src="https://example.com/\uE0000\uE001.png"');
    expect(injected(html)).toEqual([]);
  });

  it.each(["<%a%>javascript:alert(1)", "java<%a%>script:alert(1)", "{{a}}javascript:alert(1)", "{% if a %}{% endif %}java{{a}}script:alert(1)", "{{ a & b }}javascript:alert(1)"])("a link that's a script once its service has filled it in with nothing (%s) is a link to nothing, and says so", (url) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const html = renderToHtml(<Email><Row><Column><Button href={url}>Go</Button><Menu items={[{ text: "A", href: url }]} /><Social icons={[{ name: "Twitter", url }]} /></Column></Row></Email>);
      expect(html).not.toContain("script:alert");
      // (Each message once in a process, as what's kept is written the same. It reads as the template wrote it.)
      if (url.startsWith("<%a%>")) expect(warn.mock.calls.flat().join("\n")).toContain(JSON.stringify(url));
    } finally {
      warn.mockRestore();
    }
  });

  it("a Row's className holding the character that finds where its markup ends keeps its markup whole", () => {
    const html = renderToHtml(<Email><Row className={'a\uFDD2b" x-pwn="1'}><Column><Paragraph>Hi</Paragraph></Column></Row></Email>);
    expect(injected(html)).toEqual([]);
    expect(html).toContain('<div class="ab&quot; x-pwn=&quot;1">');
  });
});

describe("HTML a sanitizer returned", () => {
  // As DOMPurify on jsdom writes it: a "<" in an attribute stays as it is. Inert as given; nothing Elements does
  // afterwards (taking out its own render markers) may move where an attribute ends.
  const SANITIZED = '<p>Nice post!</p><img alt="<unlayer-mark" src="x"><img title="x src=//invalid.example/q onerror=alert(1) z=" src="y">';
  it.each(Object.entries(ROOTS))("%s: stays inert", (_, Root) => {
    const html = renderToHtml(<Root><Row><Column><Html values={{ html: SANITIZED } as never} /></Column></Row></Root>, { toSafeHtml: (value: string) => value } as never);
    const doc = new DOMParser().parseFromString(html, "text/html");
    const handlers = Array.from(doc.querySelectorAll("*")).flatMap((el) => Array.from(el.attributes).filter((attr) => /^on/i.test(attr.name)).map((attr) => `${el.tagName} ${attr.name}`));
    expect(handlers).toEqual([]);
    expect(html).toContain('alt="<unlayer-mark"');
  });
});

describe("phone settings, written into the head's CSS", () => {
  const CSS_PAYLOADS = ["16px</style><x-pwn></x-pwn><style>", "16px;</style><x-pwn></x-pwn>", "16px} x-pwn { color: red", "16px !important; x-pwn: 1"];
  const PHONE: Record<string, (v: string) => React.ReactElement> = {
    "Paragraph font size": (v) => <Row><Column><Paragraph mobile={{ fontSize: v } as any}>Hi</Paragraph></Column></Row>,
    "Paragraph line height": (v) => <Row><Column><Paragraph mobile={{ lineHeight: v } as any}>Hi</Paragraph></Column></Row>,
    "Heading alignment": (v) => <Row><Column><Heading mobile={{ textAlign: v } as any}>Hi</Heading></Column></Row>,
    "Button padding": (v) => <Row><Column><Button href="https://example.com" mobile={{ padding: v } as any}>Go</Button></Column></Row>,
    "Row padding": (v) => <Row mobile={{ padding: v } as any}><Column><Paragraph>Hi</Paragraph></Column></Row>,
    "Column padding": (v) => <Row><Column mobile={{ padding: v } as any}><Paragraph>Hi</Paragraph></Column></Row>,
    "Column border": (v) => <Row><Column mobile={{ border: { borderTopWidth: "2px", borderTopStyle: "solid", borderTopColor: v } } as any}><Paragraph>Hi</Paragraph></Column></Row>,
    // The block's id selects it there (markup no run holds, whose rules go by its id): one given in values is kept to what an id can hold.
    "block id given in values": (v) => <Row><Column><Paragraph html="<ul><li>Hi</li></ul>" mobile={{ fontSize: "12px" }} values={{ _meta: { htmlID: `u_content_text_1${v}` } } as never} /></Column></Row>,
  };
  it.each(Object.entries(ROOTS).flatMap(([mode, Root]) => Object.keys(PHONE).map((name) => [mode, name, Root] as const)))("%s: the %s can't end the style element or add rules", (_, name, Root) => {
    for (const payload of CSS_PAYLOADS) {
      const html = renderToHtml(<Root>{PHONE[name](payload)}</Root>);
      expect(injected(html), payload).toEqual([]);
      // The id given in values stays in its attribute (as 0.1.22 wrote it), where it adds no rule: the head's CSS is checked.
      const css = name === "block id given in values" ? (html.match(/<style[^>]*>[\s\S]*?<\/style>/g) || []).join("") : html;
      expect(css, payload).not.toMatch(/x-pwn\s*[{:]/);
    }
  });

  it("select the block by the id its HTML has, also when the id given in values has a selector's characters", () => {
    // The id is written as 0.1.22 wrote it, and the head's CSS escapes it: its selector finds the block in a browser.
    // (Markup no run holds: a block drawn in the new components has no id to select it by.)
    const block = (htmlID: string) => <Row><Column><Paragraph html="<ul><li>Hi</li></ul>" mobile={{ fontSize: "12px" }} values={{ _meta: { htmlID } } as never} /></Column></Row>;
    const column = (htmlID: string) => <Row><Column mobile={{ padding: "4px" }} values={{ _meta: { htmlID } } as never}><Paragraph>Hi</Paragraph></Column></Row>;
    // A leading digit is escaped as CSS.escape does (`#\31 st`), which browsers read and jsdom's selectors don't.
    expect(renderToHtml(<Email>{block("1st")}</Email>)).toContain("#\\31 st .v-font-size { font-size: 12px !important; }");
    for (const [htmlID, element] of [["u_content_tí.tulo", block], ["col:2#a", column]] as const) {
      const html = renderToHtml(<Email>{element(htmlID)}</Email>);
      expect(html).toContain(`id="${htmlID}"`);
      const css = (html.match(/<style[^>]*>[\s\S]*?<\/style>/g) || []).join("");
      const selector = css.match(/([#.][^{}]+?) \{ (?:font-size: 12px|padding: 4px) !important/)?.[1];
      expect(selector).toBeDefined();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const found = doc.querySelector(selector!);
      expect(found).not.toBeNull();
      expect(doc.getElementById(htmlID)!.contains(found)).toBe(true);
    }
  });

  it("can't open a comment that hides the phone rules after it", () => {
    const html = renderToHtml(<Email><Row><Column><Paragraph mobile={{ fontSize: "16px /*" } as any}>Hi</Paragraph><Paragraph mobile={{ fontSize: "20px" }}>There</Paragraph></Column></Row></Email>);
    expect(html).not.toContain("/*");
    expect(html).toMatch(/font-size:\s*20px\s*!important/);
  });

  it("can't leave a bracket open with one of another kind (`16px (]`), which swallows the rules after it", () => {
    const html = renderToHtml(<Email><Row><Column><Paragraph mobile={{ fontSize: "16px (]" } as any}>Hi</Paragraph><Paragraph mobile={{ fontSize: "20px" }}>There</Paragraph></Column></Row></Email>);
    expect(html).not.toContain("16px (]");
    expect(html).toMatch(/font-size:\s*20px\s*!important/);
  });

  it("aren't kept in the design either, where the editor writes them into its export's <style> as they are", () => {
    const values = ["16px</style><x-pwn></x-pwn><style>", "16px;} x-pwn { color: red", "16px /*", "16px (]"];
    for (const value of values) {
      const design = JSON.stringify(renderToJson(<Email><Row><Column><Paragraph mobile={{ fontSize: value, lineHeight: "20px" } as any}>Hi</Paragraph></Column></Row></Email>));
      expect(design).not.toContain(value.slice(4, 12));
      expect(design).toContain('"lineHeight":"20px"');
    }
  });
});
