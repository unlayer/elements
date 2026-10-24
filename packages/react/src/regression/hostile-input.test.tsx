/**
 * Values that often come from users (a name, a link, a language) can't add
 * markup: each is given markup that would add an element or an attribute, in
 * every mode, and the parsed output must have neither. Raw HTML is what the
 * Html block, the `text` prop of Heading and Button, Paragraph's `html` and a
 * Table's cells (`headers`, `data`: HTML, as the editor's table holds them) are
 * for, so they're written as given (pinned below); style props (colors, sizes,
 * a Menu's separator) are written as given too, as in 0.2.1, and come from the
 * template's author (only `style`, phone settings and Tailwind classes are
 * checked). Phone settings are written into the head's CSS, where a value could
 * end the `<style>` element or add rules, so they're tested too.
 */
import { beforeAll, describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToHtml, renderToPlainText } from "../utils/render-to-html";
import { renderToJson } from "../utils/render-to-json";
import { Email, Page, Document, Row, Column, Paragraph, Heading, Button, Image, Link, Menu, Social, Html, Divider, Table, Video } from "../index";
import { designToElements } from "../codegen";
import { evaluate } from "../codegen/test-harness";
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
  // A row's anchor, which the exporters write into an `<a name="…">` (0.2.1 did too).
  "Row anchor": (v) => <Row anchor={`top${v}`}><Column><Paragraph>Hello</Paragraph></Column></Row>,
  "Row anchor in values": (v) => <Row values={{ anchor: `top${v}` }}><Column><Paragraph>Hello</Paragraph></Column></Row>,
  // A video's link and thumbnail, which an email writes into an `href` and a `src` as they are (0.2.1 did too).
  "Video link": (v) => <Row><Column><Video video={{ url: `https://youtu.be/${v}`, type: "youtube", videoId: "abc", thumbnail: "https://img.youtube.com/vi/abc/0.jpg" }} /></Column></Row>,
  "Video thumbnail": (v) => <Row><Column><Video values={{ video: { url: "https://youtu.be/abc", type: "youtube", videoId: "abc", thumbnail: `https://example.com/${v}.jpg` } }} /></Column></Row>,
  // A video's id, which a page's and a document's player writes into its `src` as it is (0.2.1 did too).
  "Video id": (v) => <Row><Column><Video video={{ type: "youtube", videoId: `abc${v}`, thumbnail: "https://img.youtube.com/vi/abc/0.jpg" }} /></Column></Row>,
  "Vimeo id in values": (v) => <Row><Column><Video values={{ video: { type: "vimeo", videoId: `76979871${v}`, thumbnail: "" } }} /></Column></Row>,
  // A social icon's own image, which an email writes into its `src` as it is.
  "Social icon image": (v) => <Row><Column><Social values={{ icons: { iconType: "circle", icons: [{ name: "Custom", url: "https://example.com", imgUrl: `https://example.com/${v}.png` }] } } as never} /></Column></Row>,
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

describe("a design's values, as designToElements writes them", () => {
  // The code it writes renders a design's values through the same components: a row's anchor, a video's link and
  // thumbnail, an icon's own image (0.2.1 wrote them as given, and the codegen now takes them from a design).
  const designOf = (mode: string, payload: string, url = `https://youtu.be/${payload}`) => ({
    counters: {},
    schemaVersion: 16,
    body: {
      values: { displayMode: mode },
      rows: [
        {
          cells: [1],
          values: { anchor: `promo${payload}` },
          columns: [
            {
              values: {},
              contents: [
                { type: "video", values: { video: { url, videoId: "abc", type: "youtube", thumbnail: `https://img.example/${payload}.jpg` } } },
                { type: "video", values: { video: { videoId: `abc${payload}`, type: "youtube", thumbnail: "https://img.youtube.com/vi/abc/0.jpg" } } },
                { type: "social", values: { icons: { iconType: "circle", icons: [{ name: "Custom", url: "https://example.com", imgUrl: `https://example.com/${payload}.png` }] } } },
              ],
            },
          ],
        },
      ],
    },
  });

  it.each(Object.keys(ROOTS))("%s: can't add markup, or link to a URL that runs code", (mode) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      for (const payload of PAYLOADS) {
        const Template = evaluate(designToElements(designOf(mode, payload)).code);
        expect(injected(renderToHtml(<Template />)), payload).toEqual([]);
      }
      const Template = evaluate(designToElements(designOf(mode, "x", "&#106;avascript:alert(1)")).code);
      const links = Array.from(new DOMParser().parseFromString(renderToHtml(<Template />), "text/html").querySelectorAll("a[href]")).map((a) => a.getAttribute("href")!);
      expect(links.filter((href) => /^javascript:/i.test(href) && !href.startsWith("javascript:throw new Error('React has blocked"))).toEqual([]);
    } finally {
      warn.mockRestore();
    }
  });
});

describe("a video's id, which a page's and a document's player writes into its URL as it is", () => {
  const payload = 'abc" onload="alert(document.domain)';
  const encoded = "abc%22%20onload%3D%22alert%28document.domain%29";
  const PLAYERS = { youtube: "https://www.youtube.com/embed/", vimeo: "https://player.vimeo.com/video/" } as const;
  const block = (json: any) => json.body.rows[0].columns[0].contents[0].values.video;
  const designOf = (type: string, videoId: string) => ({
    counters: {},
    schemaVersion: 16,
    body: { values: { displayMode: "web" }, rows: [{ cells: [1], values: {}, columns: [{ values: {}, contents: [{ type: "video", values: { video: { type, videoId, thumbnail: "" } } }] }] }] },
  });

  it.each(Object.keys(PLAYERS) as Array<keyof typeof PLAYERS>)("%s: is percent-encoded where it holds what an id doesn't, in the HTML, the design and the code designToElements writes", (type) => {
    for (const element of [<Video video={{ type, videoId: payload, thumbnail: "" }} />, <Video values={{ video: { type, videoId: payload, thumbnail: "" } }} />]) {
      for (const Root of [Page, Document]) {
        const doc = new DOMParser().parseFromString(renderToHtml(<Root><Row><Column>{element}</Column></Row></Root>), "text/html");
        const iframe = doc.querySelector("iframe")!;
        expect(iframe.getAttribute("src")).toBe(PLAYERS[type] + encoded);
        expect(iframe.hasAttribute("onload")).toBe(false);
      }
      for (const Root of Object.values(ROOTS)) expect(block(renderToJson(<Root><Row><Column>{element}</Column></Row></Root>)).videoId).toBe(encoded);
    }
    const { code } = designToElements(designOf(type, payload));
    expect(code).toContain(encoded);
    expect(code).not.toContain("onload=");
    const Template = evaluate(code);
    expect(new DOMParser().parseFromString(renderToHtml(<Template />), "text/html").querySelector("iframe")!.getAttribute("src")).toBe(PLAYERS[type] + encoded);
  });

  it("stays as it is where it's one the editor writes (a Vimeo one with its hash too)", () => {
    for (const [type, videoId] of [["youtube", "dQw4w9WgXcQ"], ["youtube", "a.b_c%20-d"], ["vimeo", "76979871"], ["vimeo", "76979871/abcdef1234"]]) {
      const element = <Page><Row><Column><Video video={{ type, videoId, thumbnail: "" }} /></Column></Row></Page>;
      expect(block(renderToJson(element)).videoId).toBe(videoId);
      expect(renderToHtml(element)).toContain(`src="${PLAYERS[type as keyof typeof PLAYERS]}${videoId}"`);
      // (As its id, or in the `videoUrl` it's from.)
      expect(designToElements(designOf(type, videoId)).code).toMatch(new RegExp(`["/]${videoId.replace(/[.%/]/g, "\\$&")}"`));
    }
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
    "Video id": (v) => <Row><Column><Video video={{ type: "youtube", videoId: v as never, thumbnail: "" }} /></Column></Row>,
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

  it("a content prop given as null (nullable data) is no content, as in 0.2.1: not the block's placeholder, with <Tailwind> too", async () => {
    const blocks = (
      <Row>
        <Column>
          <Html html={null as never} />
          <Heading text={null as never} />
          <Button text={null as never} href="https://example.com" />
        </Column>
      </Row>
    );
    const placeholders = /Hello, world!|>\s*Heading\s*<|>\s*Button\s*<|HEADING/;
    for (const Root of Object.values(ROOTS)) {
      const template = <Root>{blocks}</Root>;
      const tw = await loadTailwind();
      for (const html of [renderToHtml(template), renderToHtml(<Tailwind tw={tw}>{template}</Tailwind>), renderToPlainText(template)]) expect(html).not.toMatch(placeholders);
      expect(renderToJson(template).body.rows[0].columns[0].contents.map((c: any) => c.values.html ?? c.values.text ?? null)).toEqual([null, null, null]);
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

describe("a link's `javascript:` URL, as data gives it", () => {
  const BLOCKED = "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')";
  // Each block's link as a template or a design gives it (a prop, the link's storage shape, `values`), with a URL as
  // React 19 tells a `javascript:` one (controls and spaces before it, tabs and line breaks in it, any case).
  const LINKS: Record<string, (url: string) => React.ReactElement> = {
    "Button href": (url) => <Button href={url}>Go</Button>,
    "Button href, same tab": (url) => <Button href={url} target="_self">Go</Button>,
    "Button link's storage shape": (url) => <Button href={{ name: "web", values: { href: url, target: "_self" } } as never}>Go</Button>,
    "Button values": (url) => <Button values={{ href: url } as never}>Go</Button>,
    "Button link's attrs": (url) => <Button href={{ name: "web", attrs: { href: url } } as never}>Go</Button>,
    "Image action": (url) => <Image src="https://example.com/a.png" width="100px" alt="x" action={url as never} />,
    "Menu item": (url) => <Menu items={[{ text: "Shop", href: url, target: "_self" }]} />,
    "Menu values": (url) => <Menu values={{ menu: { items: [{ key: "1", text: "Shop", link: { name: "web", values: { href: url, target: "_self" } } }] } } as never} />,
    "Menu values' attrs": (url) => <Menu values={{ menu: { items: [{ key: "1", text: "Shop", link: { name: "web", attrs: { href: url } } }] } } as never} />,
    "Menu values' render shape": (url) => <Menu values={{ menu: { items: [{ key: "1", text: "Shop", link: { url: "", customAttrs: { href: url } } }] } } as never} />,
    "Social icon": (url) => <Social icons={[{ name: "Facebook", url }]} />,
    "Video link": (url) => <Video video={{ url, type: "youtube", videoId: "abc", thumbnail: "https://img.youtube.com/vi/abc/0.jpg" }} />,
    "Video values": (url) => <Video values={{ video: { url, type: "youtube", videoId: "abc", thumbnail: "https://img.youtube.com/vi/abc/0.jpg" } }} />,
    "Link": (url) => <Link href={url}>Read</Link>,
    "Heading's inline link": (url) => <Heading>Read <a href={url}>this</a></Heading>,
    "Paragraph's inline link": (url) => <Paragraph>Read <a href={url}>this</a></Paragraph>,
  };
  // And written with character references, which the exporters write as they are, and a browser decodes: a numeric one, a
  // hex one, and named ones (`&colon;`, `&Tab;`, `&NewLine;`, in any case and without their `;`).
  const URLS = ["javascript:alert(1)", " \u0001JavaScript:alert(1)", "java\tscr\nipt:alert(1)", "&#106;avascript:alert(1)", "&#x6A;avascript:alert(1)", "javascript&colon;alert(1)", "java&Tab;script:alert(1)", "java&NewLine;script&COLON;alert(1)", "&#0000106avascript:alert(1)"];
  /** Each link's and image's URL in the HTML, as a browser reads it. */
  const urls = (html: string) => Array.from(new DOMParser().parseFromString(html, "text/html").querySelectorAll("a[href], img[src]")).map((e) => e.getAttribute(e.tagName === "A" ? "href" : "src")!);
  /** A URL that runs code: `javascript:` as a browser reads a URL (controls and spaces before, tabs and line breaks dropped). */
  const runs = (url: string) => /^javascript:/i.test(url.replace(/^[\u0000-\u0020]+/, "").replace(/[\t\n\r]/g, "")) && !url.startsWith(BLOCKED);

  it.each(Object.entries(ROOTS).flatMap(([mode, Root]) => Object.keys(LINKS).map((name) => [mode, name, Root] as const)))("%s: a %s runs nothing (0.2.1 wrote some as given)", (_, name, Root) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      for (const url of URLS) {
        const template = <Root><Row><Column>{LINKS[name](url)}</Column></Row></Root>;
        expect([url, urls(renderToHtml(template)).filter(runs)]).toEqual([url, []]);
        // In the design too: a link the editor opens and exports is the URL that throws.
        if (!/inline|^Link$/.test(name)) expect([url, JSON.stringify(renderToJson(template)).includes("React has blocked a javascript: URL")]).toEqual([url, true]);
      }
    } finally {
      warn.mockRestore();
    }
  });

  it("leaves a URL that isn't one as it is, its character references too", () => {
    for (const url of ["https://example.com/?a=1&b=2", "https://example.com/?a=1&amp;b=2&copy=3", "https://example.com/&#106;avascript", "mailto:a@b.test?subject=a&body=b"]) {
      const design = renderToJson(<Email><Row><Column><Button href={url}>Go</Button></Column></Row></Email>);
      expect(design.body.rows[0].columns[0].contents[0].values.href.values.href).toBe(url);
    }
  });

  it("is written as react-dom 19 writes it, a URL that throws, where a Button's link would run", () => {
    const html = renderToHtml(<Page><Row><Column><Button href="javascript:alert(1)" target="_self">Go</Button></Column></Row></Page>);
    expect(urls(html)).toEqual([BLOCKED]);
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
      expect(warn.mock.calls.map((call) => String(call[0]))).toContain("[Unlayer] Column ignores `background-image: url(javascript:alert(1))` from class `bg-[url(javascript:alert(1))]`: its URL isn't a web one (`http:` or `https:`), a relative one, an inline attachment's (`cid:`), or an image's data URL.");
      // A web URL, a relative one, an inline attachment's (an email's `cid:`) and an image's data URL, in base64 too, are
      // kept: a base64 one's `;` is in its URL, which CSS reads to its `)`.
      for (const url of ["https://example.com/a.png", "/images/a.png", "cid:logo", "data:image/png,x", "data:image/png;base64,iVBORw0KGgo+/A==", "'data:image/gif;base64,R0lGOD'"])
        expect(styles(render(`bg-[url(${url})]`)).some((style) => style.includes(`url(${url})`)), url).toBe(true);
      // But only a whole one: a `;` after it, an image of another kind, or a quote it doesn't close ends the declaration.
      for (const className of ["bg-[url(data:image/png;base64,AAAA);color:red]", "[background:url(data:image/png;base64,AAAA);color:red]", "bg-[url(data:image/svg+xml;base64,AAAA)]", "bg-[url('data:image/png;base64,AAAA)]", "bg-[url(data:image/png;charset=x;base64,AAAA)]"])
        expect([className, styles(render(className)).filter((style) => /url\(|color:red/.test(style))]).toEqual([className, []]);
    } finally {
      warn.mockRestore();
    }
  });

  // A template giving one class to the root, a Row and a Column (with a gutter), a Paragraph and markup in its children,
  // a Button, an Image and an Html block's markup: every place a class is read.
  const everywhere = (handle: TailwindHandle, className: string) => {
    const attribute = className.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return renderToHtml(
      <Tailwind tw={handle}>
        <Email className={className}>
          <Row className={`bg-white ${className}`}>
            <Column className={`bg-zinc-50 ${className}`}>
              <Paragraph className={className}>Hi <span className={className}>there</span></Paragraph>
              <Button href="https://example.com" className={className}>Go</Button>
              <Image src="https://example.com/a.png" alt="x" className={className} />
            </Column>
            <Column className="bg-zinc-50 ml-2">
              <Html html={`<p class="${attribute}">Hi</p>`} />
            </Column>
          </Row>
        </Email>
      </Tailwind>
    );
  };

  it("costs about ten times as much for ten times as long a class of any short shape, arbitrary variants and values too (random, seeded)", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    // A class: what starts it (a utility taking a value, an arbitrary property, value or variant: `[@media(…)]:`,
    // `max-[…]:`), a unit over and over, and what ends it.
    const heads = ["", "p-[", "m-[", "mr-[", "px-[", "w-[", "max-w-[", "leading-[", "text-[", "tracking-[", "rounded-[", "border-[", "bg-[url(", "[margin:", "[color:a", "[padding:calc(", "[font-family:", "[@media(", "[@media_screen_and_(", "[@media_(max-width:", "max-[", "min-[", "sm:p-[", "hover:bg-["];
    const pieces = ["0", "9", "1", ".", "1.5", "_", "__", "-", "+", "*", "(", ")", "px", "rem", "em", "%", "e", "<", ">", "=", ":", ",", "/", "!", "x", "a", "and", "calc(", "var(--x)", "'", '"', "\\", "[", "]", "!important", "\t"];
    const tails = ["", "]", "x]", "]!", "px]", "x)]", ")]", "]:p-1", "width)]:p-1", "px)]:p-1", ")]:p-1", "x]:p-1", "b]!", ")width)]:p-1"];
    let seed = 11;
    const random = (n: number) => ((seed = (Math.imul(seed, 1103515245) + 12345) >>> 0), Math.floor((seed / 2 ** 32) * n));
    const fill = (head: string, unit: string, tail: string, bytes: number) => head + unit.repeat(Math.ceil(bytes / unit.length)).slice(0, bytes) + tail;
    // And the shapes a regex read in time growing with their size squared, or worse: a number from where it could
    // start in a media query, an arbitrary value's number, the spaces before an `!important`.
    const shapes: string[][] = [["[@media(", "9", "width)]:p-1"], ["[@media_(max-width:", ".", ")]:p-1"], ["[color:a", "_", "b]!"], ["leading-[", "0", "x]"], ["w-[", "0", "x]"], ["m-[", "0", "x]"], ["mr-[", "0", "x]"], ["px-[", "0", "x]"], ["[margin:", "0", "x]"], ["[padding:calc(", "0", "x)]"]];
    for (let run = 0; run < 120; run++) {
      let unit = "";
      for (let i = 0, n = 1 + random(4); i < n; i++) unit += pieces[random(pieces.length)];
      shapes.push([heads[random(heads.length)], unit, tails[random(tails.length)]]);
    }
    const slow: string[] = [];
    try {
      for (const [run, [head, unit, tail]] of shapes.entries()) {
        // (A fresh handle for each: one compiles each new class with the ones it had, which grow.)
        const handle = await loadTailwind({ theme: { extend: { colors: { [`run${run}`]: "#000000" } } } });
        everywhere(handle, "p-2");
        const time = (bytes: number) => {
          const start = performance.now();
          everywhere(handle, fill(head, unit, tail, bytes));
          return performance.now() - start;
        };
        const small = Math.max(time(2048), 2);
        const large = time(20480);
        if (large > 20 * small && large > 100) slow.push(`${JSON.stringify([head, unit, tail])}: ${small.toFixed(1)} ms for 2 KB, ${large.toFixed(1)} ms for 20 KB`);
      }
    } finally {
      warn.mockRestore();
    }
    expect(slow).toEqual([]);
  }, 120_000);

  it("reads a media query of many parts, each with two widths, in time linear in their number (its regex was exponential in it)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const time = (parts: number) => {
        const start = performance.now();
        everywhere(tw, `[@media${"(width<1px_or_width>2px)and".repeat(parts)}x]:p-1`);
        everywhere(tw, `[@media${"(widthwidth)and".repeat(parts)}x]:p-1`);
        return performance.now() - start;
      };
      time(4);
      const [small, large] = [Math.max(time(12), 2), time(24)];
      expect(large > 20 * small && large > 100, `${small.toFixed(1)} ms for 12 parts, ${large.toFixed(1)} ms for 24`).toBe(false);
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

describe("a Table's cells", () => {
  // HTML, as the editor's table holds them: written as given, so data put in them is escaped first (see the README).
  it.each(Object.entries(ROOTS))("%s: are written as given, markup and all", (_, Root) => {
    const html = renderToHtml(<Root><Row><Column><Table headers={["<b>Plan</b>", "A &amp; B"]} data={[["<i>Pro</i>", "<x-pwn></x-pwn>"]]} /></Column></Row></Root>);
    expect([html.includes("<b>Plan</b>"), html.includes("A &amp; B"), html.includes("<i>Pro</i>"), injected(html)]).toEqual([true, true, true, ["element"]]);
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
