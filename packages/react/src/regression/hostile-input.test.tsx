/**
 * Values that often come from users (a name, a link, a language) can't add
 * markup: each is given markup that would add an element or an attribute, in
 * every mode, and the parsed output must have neither. Raw HTML is what the
 * Html block and the `text` prop of Heading and Button are for, so they aren't
 * tested; design props (colors, sizes) come from the template's author. Phone
 * settings are written into the head's CSS, where a value could end the
 * `<style>` element or add rules, so they're tested too.
 */
import { beforeAll, describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToHtml } from "../utils/render-to-html";
import { renderToJson } from "../utils/render-to-json";
import { Email, Page, Document, Row, Column, Paragraph, Heading, Button, Image, Menu, Social, Html, Divider } from "../index";
import { Tailwind, loadTailwind, type TailwindHandle } from "../tailwind";

const PAYLOADS = [
  '"><x-pwn></x-pwn>', "'><x-pwn></x-pwn>", '" x-pwn="1', "' x-pwn='1", "</p></div></td></tr></table><x-pwn></x-pwn>",
  // A template tag's quote ends an attribute as well as any (Menu text is in an aria-label too), with or without `=`.
  '{{ " }} x-pwn=1 y', '{{ x" x-pwn }}', '{{ "x" x-pwn }}', '<%a%>" x-pwn="1',
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
  // A link's target, written into its `target="…"` as it is.
  "Button target": (v) => <Row><Column><Button href="https://example.com" target={v}>Go</Button></Column></Row>,
  "Menu item target": (v) => <Row><Column><Menu items={[{ text: "Home", href: "https://example.com", target: v }]} /></Column></Row>,
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
      for (const payload of PAYLOADS) expect(injected(renderToHtml(<Root>{CASES[name](payload)}</Root>)), payload).toEqual([]);
    } finally {
      warn.mockRestore();
    }
  });

  // Only an email renders its preview text.
  it.each(Object.keys(ROOT_PROPS).filter((name) => name !== "previewText" || Root === Email))("the root's %s can't add markup", (name) => {
    for (const payload of PAYLOADS) {
      const html = renderToHtml(React.createElement(Root, ROOT_PROPS[name](payload) as never, content(payload)));
      expect(injected(html), payload).toEqual([]);
    }
  });

  it("the title option can't add markup", () => {
    for (const payload of PAYLOADS) expect(injected(renderToHtml(<Root>{content(payload)}</Root>, { title: payload, lang: payload })), payload).toEqual([]);
  });
});

describe("values that aren't strings, as data gives them (an array from a JSON body, an object with toString, a number)", () => {
  const SHAPES: Record<string, (v: string) => unknown> = { array: (v) => [v], "object with toString": (v) => ({ toString: () => v }) };
  const NOT_TEXT: Record<string, (v: unknown) => React.ReactElement> = {
    "Button target": (v) => <Row><Column><Button href="https://example.com" target={v as never}>Go</Button></Column></Row>,
    "Menu item target": (v) => <Row><Column><Menu items={[{ text: "Home", href: "https://example.com", target: v as never }]} /></Column></Row>,
    "Menu item text": (v) => <Row><Column><Menu items={[{ text: v as never, href: "https://example.com" }]} /></Column></Row>,
    "Button link": (v) => <Row><Column><Button href={v as never}>Go</Button></Column></Row>,
    "Image link": (v) => <Row><Column><Image src="https://example.com/a.png" width="100px" alt="x" href={v as never} /></Column></Row>,
    "Menu link": (v) => <Row><Column><Menu items={[{ text: "Home", href: v as never }]} /></Column></Row>,
    "Social link": (v) => <Row><Column><Social icons={[{ name: "Twitter", url: v as never }]} /></Column></Row>,
    "Social name": (v) => <Row><Column><Social icons={[{ name: v as never, url: "https://twitter.com/x" }]} /></Column></Row>,
  };
  const cases = Object.entries(ROOTS).flatMap(([mode, Root]) => Object.keys(NOT_TEXT).map((name) => [mode, name, Root] as const));

  it.each(cases)("%s: a %s can't add markup", (_, name, Root) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    // (A page's or a document's Menu renders its text as React does: an object that isn't an element fails, as there.)
    const html = (element: React.ReactElement) => {
      try {
        return renderToHtml(element);
      } catch (error) {
        if (Root !== Email && name === "Menu item text" && /Objects are not valid as a React child/.test(String(error))) return "";
        throw error;
      }
    };
    try {
      for (const [shape, make] of Object.entries(SHAPES)) {
        for (const payload of PAYLOADS) expect(injected(html(<Root>{NOT_TEXT[name](make(payload))}</Root>)), `${shape} ${payload}`).toEqual([]);
      }
      // A number holds no markup: it renders.
      expect(renderToHtml(<Root>{NOT_TEXT[name](5)}</Root>)).toContain("<");
    } finally {
      warn.mockRestore();
    }
  });

  it("a link's target that isn't a string is a new tab (`_blank`), in the HTML and the design, and a Button's is said", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      for (const target of [["_self"], { toString: () => "_self" }, 5]) {
        const targets = (html: string) => Array.from(new DOMParser().parseFromString(html, "text/html").querySelectorAll("a")).map((a) => a.getAttribute("target"));
        expect(targets(renderToHtml(<Email><Row><Column><Button href="https://example.com" target={target as never}>Go</Button></Column></Row></Email>)), String(target)).toEqual(["_blank"]);
        expect(targets(renderToHtml(<Email><Row><Column><Menu items={[{ text: "Home", href: "https://example.com", target: target as never }]} /></Column></Row></Email>)), String(target)).toEqual(["_blank"]);
        const design = renderToJson(<Email><Row><Column><Button href="https://example.com" target={target as never}>Go</Button></Column></Row></Email>);
        expect(design.body.rows[0].columns[0].contents[0].values.href).toEqual({ name: "web", values: { href: "https://example.com", target: "_blank" } });
      }
      expect(warn).toHaveBeenCalledWith("[Unlayer] Button's target isn't text, so the link opens in a new tab (_blank).");
    } finally {
      warn.mockRestore();
    }
  });
});

describe("a Tailwind class from data", () => {
  // Arbitrary values whose quotes or brackets would end the `style="…"` the exporters write a prop into, or start a tag
  // (Tailwind reads `_` as a space: a class has none).
  const CLASSES = (property: string) => [`[${property}:'"><x-pwn></x-pwn>']`, `[${property}:'"_x-pwn="1']`, `[${property}:\\22><x-pwn></x-pwn>]`, `[${property}:'\\3c_x-pwn_\\3e']`, `[${property}:'<x-pwn></x-pwn>']`];
  const BLOCKS: Record<string, (className: string) => React.ReactElement> = {
    Paragraph: (className) => <Paragraph className={className}>Hi</Paragraph>,
    Heading: (className) => <Heading className={className}>Hi</Heading>,
    Button: (className) => <Button href="https://example.com" className={className}>Go</Button>,
    Menu: (className) => <Menu className={className} items={[{ text: "Home", href: "https://example.com" }]} />,
    Divider: (className) => <Divider className={className} />,
    Image: (className) => <Image className={className} src="https://example.com/a.png" alt="x" />,
    markup: (className) => <Html html={`<p class="${className.replace(/"/g, "&quot;")}">Hi</p>`} />,
  };
  const PROPERTIES = ["color", "background-color", "font-size", "font-family", "padding", "border-color", "width", "text-transform"];
  let tw: TailwindHandle;
  beforeAll(async () => {
    tw = await loadTailwind();
  });

  it.each(Object.entries(ROOTS))("%s: can't add markup through a prop, an inline style, or the text styles a container passes on", (_, Root) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      for (const property of PROPERTIES) {
        for (const className of CLASSES(property)) {
          for (const [name, block] of Object.entries(BLOCKS)) {
            const html = renderToHtml(
              <Tailwind tw={tw}>
                <Root className={className}>
                  <Row className={className}>
                    <Column className={className}>{block(className)}</Column>
                  </Row>
                </Root>
              </Tailwind>
            );
            expect(injected(html), `${name} ${className}`).toEqual([]);
          }
        }
      }
      // Said, as each class no prop can take.
      expect(warn.mock.calls.map((call) => String(call[0]))).toContainEqual(expect.stringMatching(/^\[Unlayer\] Paragraph ignores `color: '"><x-pwn><\/x-pwn>'` from class `\[color:'"><x-pwn><\/x-pwn>'\]`: it could end the HTML attribute it's written in, start a tag, or end its CSS\.$/));
    } finally {
      warn.mockRestore();
    }
  });

  it("writes no `url()` whose URL isn't a web one or relative (`javascript:`), however it's written, and says so", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    // As the browser reads a style: its references and CSS escapes decoded, its spaces gone.
    const read = (style: string) => style.replace(/&#(\d+);?/g, (_, n) => String.fromCodePoint(Number(n))).replace(/\\([\da-f]{1,6})\s?|\\(.)/gi, (_, hex, ch) => (hex ? String.fromCodePoint(parseInt(hex, 16)) : ch)).replace(/\s/g, "");
    const styles = (html: string) => Array.from(new DOMParser().parseFromString(html, "text/html").querySelectorAll("[style]")).map((e) => read(e.getAttribute("style")!));
    const render = (className: string) =>
      renderToHtml(
        <Tailwind tw={tw}>
          <Email className={className}>
            <Row className={className}>
              <Column className={className}>
                <Paragraph className={className}>Hi</Paragraph>
              </Column>
            </Row>
          </Email>
        </Tailwind>
      );
    try {
      for (const className of ["bg-[url(javascript:alert(1))]", "bg-[url('javascript:alert(1)')]", 'bg-[url("JavaScript:alert(1)")]', "bg-[url(j\\61vascript:alert(1))]", "bg-[u\\72l(javascript:alert(1))]", "[background:url(vbscript:msgbox(1))]", "[background-image:url(data:text/html,x)]", "[list-style-image:url(javascript:alert(1))]"]) {
        expect([className, styles(render(className)).filter((style) => /url\(["']?(?!https?:|\/)/i.test(style))]).toEqual([className, []]);
      }
      expect(warn.mock.calls.map((call) => String(call[0]))).toContain("[Unlayer] Column ignores `background-image: url(javascript:alert(1))` from class `bg-[url(javascript:alert(1))]`: its URL isn't a web one (`http:` or `https:`), a relative one, or an image's data URL.");
      // A web URL, a relative one and an image's data URL are kept.
      for (const url of ["https://example.com/a.png", "/images/a.png", "data:image/png,x"]) expect(styles(render(`bg-[url(${url})]`)).some((style) => style.includes(`url(${url})`)), url).toBe(true);
    } finally {
      warn.mockRestore();
    }
  });

  it("keeps a font family's names in double quotes (`font-[\"Open_Sans\"]`), in single ones", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const design = renderToJson(<Tailwind tw={tw}><Email><Row><Column><Paragraph className={'font-["Open_Sans"] [color:#123456]'}>Hi</Paragraph></Column></Row></Email></Tailwind>);
      expect(design.body.rows[0].columns[0].contents[0].values).toMatchObject({ fontFamily: { value: "'Open Sans'" }, color: "#123456" });
    } finally {
      warn.mockRestore();
    }
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
    // The block's id selects it there: one given in values is kept to what an id can hold.
    "block id given in values": (v) => <Row><Column><Paragraph mobile={{ fontSize: "12px" }} values={{ _meta: { htmlID: `u_content_text_1${v}` } } as never}>Hi</Paragraph></Column></Row>,
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
    const block = (htmlID: string) => <Row><Column><Paragraph mobile={{ fontSize: "12px" }} values={{ _meta: { htmlID } } as never}>Hi</Paragraph></Column></Row>;
    const column = (htmlID: string) => <Row><Column mobile={{ padding: "4px" }} values={{ _meta: { htmlID } } as never}><Paragraph>Hi</Paragraph></Column></Row>;
    // A leading digit is escaped as CSS.escape does (`#\31 st`), which browsers read and jsdom's selectors don't.
    expect(renderToHtml(<Email>{block("1st")}</Email>)).toContain("#\\31 st .v-font-size { font-size: 12px !important; }");
    for (const [htmlID, element] of [["u_content_tí.tulo", block], ["col:2#a", column]] as const) {
      const html = renderToHtml(<Email>{element(htmlID)}</Email>);
      expect(html).toContain(`id="${htmlID}"`);
      const css = (html.match(/<style[^>]*>[\s\S]*?<\/style>/g) || []).join("");
      const selector = css.match(/(#[^{}]+?) \{ (?:font-size: 12px|padding: 4px) !important/)?.[1];
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
    expect(html).toMatch(/font-size:\s*20px !important/);
  });

  it("can't leave a bracket open with one of another kind (`16px (]`), which swallows the rules after it", () => {
    const html = renderToHtml(<Email><Row><Column><Paragraph mobile={{ fontSize: "16px (]" } as any}>Hi</Paragraph><Paragraph mobile={{ fontSize: "20px" }}>There</Paragraph></Column></Row></Email>);
    expect(html).not.toContain("16px (]");
    expect(html).toMatch(/font-size:\s*20px !important/);
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
