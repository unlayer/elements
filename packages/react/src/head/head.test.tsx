import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM, VirtualConsole } from "jsdom";
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { Column, Document, Email, Page, Paragraph, RenderError, Row, renderToHtml, renderToHtmlParts, renderToJson, renderToPlainText } from "../index";
import * as asyncRenderers from "../async";
import { Head } from "./index";

let warn: MockInstance;
beforeEach(() => {
  warn = vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => warn.mockRestore());

const content = (
  <Row>
    <Column>
      <Paragraph>Hello</Paragraph>
    </Column>
  </Row>
);
const tags = (
  <Head>
    <meta name="color-scheme" content="light dark" />
    <link rel="preconnect" href="https://fonts.gstatic.com" />
    <style>{`@media (prefers-color-scheme: dark) { .x > a { color: #fff !important; } }`}</style>
    <title>Hi &amp; bye</title>
  </Head>
);
/** Random head contents the fuzz renders (`HEAD_FUZZ_RUNS=5000` for a longer run, `HEAD_FUZZ_SEED` for others). */
const HEAD_FUZZ_RUNS = Number(process.env.HEAD_FUZZ_RUNS ?? 150);

/** A window where scripts run, whose document a parse writes into (one: a window of jsdom's each would add up). */
let scripted: Window | undefined;

/**
 * What `read` reads of HTML as a browser parses it: where scripts don't run, and where they do (a <noscript>'s content
 * is then text, to its end tag). (Markup put in a document runs no script.)
 */
function parse<T>(html: string, read: (document: Document) => T): T[] {
  scripted ??= new JSDOM("", { runScripts: "dangerously", virtualConsole: new VirtualConsole() }).window as unknown as Window;
  scripted.document.documentElement.innerHTML = html;
  return [read(new DOMParser().parseFromString(html, "text/html")), read(scripted.document)];
}

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

const written = [
  '<meta name="color-scheme" content="light dark"/>',
  '<link rel="preconnect" href="https://fonts.gstatic.com"/>',
  "<style>@media (prefers-color-scheme: dark) { .x > a { color: #fff !important; } }</style>",
  "<title>Hi &amp; bye</title>",
].join("");

describe("Head", () => {
  it("puts its tags in the document's head, before Elements' styles, in every mode", () => {
    for (const Root of [Email, Page, Document]) {
      const html = renderToHtml(
        <Root>
          {tags}
          {content}
        </Root>
      );
      const head = html.slice(0, html.indexOf("</head>"));
      expect(head).toContain(written);
      expect(head.indexOf(written)).toBeLessThan(head.indexOf('<style type="text/css">'));
      // Nothing in the body.
      expect(html.slice(html.indexOf("</head>"))).not.toContain("color-scheme");
    }
    expect(warn).not.toHaveBeenCalled();
  });

  it("is in the head part, from a component of yours too, and left out of the text", () => {
    const Meta = () => (
      <Head>
        <meta name="x-apple-disable-message-reformatting" />
      </Head>
    );
    const email = (
      <Email>
        <Meta />
        {content}
      </Email>
    );
    const parts = renderToHtmlParts(email);
    expect(parts.tags).toContain('<meta name="x-apple-disable-message-reformatting"/>');
    expect(parts.head).toContain('<meta name="x-apple-disable-message-reformatting"/>');
    expect(parts.body).not.toContain("x-apple");
    expect(renderToPlainText(email)).toBe("Hello");
  });

  it("keeps a style's CSS as written, and can't end it early", () => {
    const html = renderToHtml(
      <Page>
        <Head>
          <style>{"a > b { color: red } </style><script>alert(1)</script>"}</style>
        </Head>
        {content}
      </Page>
    );
    expect(html).toContain("<style>a > b { color: red } </\\73 tyle><script>alert(1)</script></style>");
  });

  it("writes a style's CSS, a script's text and a title as written wherever they are in it: in a component of yours too, in every React", () => {
    const Brand = () => <style>{"body{font-family:'Inter',sans-serif} .a > .b{color:red}"}</style>;
    const Css = ({ css }: { css: string }) => css;
    const name = "Ada";
    const data = { "@type": "Organization", name: "A & B </script>" };
    const parts = renderToHtmlParts(
      <Page>
        <Head>
          <Brand />
          <style>
            {".x > a { color: red } "}
            <Css css={"p::after { content: '>' }"} />
          </style>
          <script type="application/ld+json">{JSON.stringify(data)}</script>
          <title>Hi {name} & bye</title>
        </Head>
        {content}
      </Page>
    );
    expect(parts.tags).toEqual([
      [
        "<style>body{font-family:'Inter',sans-serif} .a > .b{color:red}</style>",
        "<style>.x > a { color: red } p::after { content: '>' }</style>",
        '<script type="application/ld+json">{"@type":"Organization","name":"A & B </\\u0073cript>"}</script>',
        "<title>Hi Ada &amp; bye</title>",
      ].join(""),
    ]);
  });

  it("can't end a style's or a script's text early, whatever writes it: a component of yours, a list, text in parts, markup, what it's in", () => {
    // A tenant's brand color from the database, a product name in JSON-LD: data a component of yours writes.
    const brand = "red}</style><script>alert(document.cookie)</script><style>";
    const BrandCss = ({ color }: { color: string }) => `.brand{color:${color}}`;
    const JsonLd = ({ data }: { data: object }) => JSON.stringify(data);
    const Css = ({ css }: { css: string }) => css;
    const img = "<img src=x onerror=alert(1)>";
    const cases: Array<[React.ReactNode, string]> = [
      [<style><BrandCss color={brand} /></style>, "<style>.brand{color:red}</\\73 tyle><script>alert(document.cookie)</script><\\73 tyle>}</style>"],
      [<script type="application/ld+json" data-own="yes"><JsonLd data={{ name: "</script><script>alert(1)</script>" }} /></script>, '<script type="application/ld+json" data-own="yes">{"name":"</\\u0073cript><\\u0073cript>alert(1)</\\u0073cript>"}</script>'],
      [<style>{"a{} </sty"}{"le><script>alert(1)</script>"}</style>, "<style>a{} </\\73 tyle><script>alert(1)</script></style>"],
      [<style>{[<Css key="a" css="a{} </st" />, "yle>", <Css key="b" css={img} />]}</style>, `<style>a{} </\\73 tyle>${img}</style>`],
      [<style>{"a{}"}<style>{"b{}"}</style>{img}</style>, `<style>a{}<\\73 tyle>b{}</\\73 tyle>${img}</style>`],
      // Where a style isn't raw text (an <svg>'s, a <math>'s): its text escaped as any.
      [<svg><style>{img}</style></svg>, "<svg><style>&lt;img src=x onerror=alert(1)&gt;</style></svg>"],
      [React.createElement("SVG", null, <style>{img}</style>), "<SVG><style>&lt;img src=x onerror=alert(1)&gt;</style></SVG>"],
      [<math><mi><style>{img}</style></mi></math>, "<math><mi><style>&lt;img src=x onerror=alert(1)&gt;</style></mi></math>"],
      // In what runs to its own end tag (a <noscript> where scripts run, a <title>), its end tag too.
      [<noscript><style>{`</noscript>${img}`}</style></noscript>, `<noscript><style></\\6e oscript>${img}</style></noscript>`],
      [<noscript><script data-own="yes"><Css css={`</NOSCRIPT>${img}`} /></script></noscript>, `<noscript><script data-own="yes"></\\u004eOSCRIPT>${img}</script></noscript>`],
      [<title><style>{`</title>${img}`}</style></title>, `<title><style></\\74 itle>${img}</style></title>`],
    ];
    for (const [tag, written] of cases) {
      const page = <Page><Head>{tag}</Head>{content}</Page>;
      expect(renderToHtmlParts(page).tags.join("")).toBe(written);
      // Parsed, it has no script but the template's, and no element its text would make.
      expect(parse(renderToHtml(page), (document) => document.querySelectorAll("script:not([data-own]), img, [onerror], [onload]").length), written).toEqual([0, 0]);
    }
  });

  it("can't end a style's or a script's text early, or start an element, whatever hostile text it's given (fuzzed)", () => {
    // Random head content (styles, scripts, titles, noscripts, svg, math and other elements whose text runs to their
    // end tag, in each other), its text hostile fragments, written as text, by components, in lists and in parts.
    // Parsed as a browser parses it (where scripts run, and where they don't), it has the template's elements and no
    // other, and each piece of text is in the element it was written in, as the same content with harmless text has.
    const fragments = [
      "</style>", "</STYLE ", "</style/", "<style>", "</script>", "<script>", "<SCRIPT>", "</sCrIpT >", "</sty", "le>", "</scr", "ipt>", "<scr", "<!--", "-->",
      "</noscript>", "</title>", "</iframe>", "</xmp>", "</noembed>", "</noframes>", "</textarea>", "</svg>", "</math>", "</foreignObject>", "<math><mi>",
      "<svg onload=alert(1)>", "<img src=x onerror=alert(1)>", "<![CDATA[", "]]>", "&lt;", "&amp;", "\\", "'", '"', "{", "}", "</", "<", ">", "/", " ", "x",
    ];
    const tags = ["style", "style", "script", "script", "title", "noscript", "svg", "math", "mi", "foreignObject", "desc", "b", "iframe", "xmp", "noembed", "noframes", "STYLE", "SVG"];
    type Spec = { tag: string; id: number; type?: string; children: Spec[] } | { text: number; how: "string" | "component" | "list" | "parts" };
    const Text = ({ text }: { text: string }) => text;
    const node = (spec: Spec, texts: string[], key?: number): React.ReactNode => {
      if ("text" in spec) {
        const text = texts[spec.text];
        const half = Math.floor(text.length / 2);
        if (spec.how === "string") return text;
        if (spec.how === "component") return <Text key={key} text={text} />;
        if (spec.how === "parts") return <React.Fragment key={key}>{text.slice(0, half)}{text.slice(half)}</React.Fragment>;
        return <React.Fragment key={key}>{[text.slice(0, half), <Text key="b" text={text.slice(half)} />]}</React.Fragment>;
      }
      return React.createElement(spec.tag, { key, "data-t": spec.id, type: spec.tag === "script" ? spec.type : undefined }, ...spec.children.map((child, i) => node(child, texts, i)));
    };
    /** Where each piece of text is (the template's element it's in, by its `data-t`), and the elements there are. */
    const layout = (document: Document) => {
      const where: string[] = [];
      const texts = document.createTreeWalker(document, 4 /* NodeFilter.SHOW_TEXT */);
      for (let text = texts.nextNode(); text; text = texts.nextNode())
        for (const [mark] of (text as Text).data.matchAll(/([QZ])\d+\1/g)) where.push(`${mark} in ${text.parentElement?.closest("[data-t]")?.getAttribute("data-t") ?? text.parentElement?.localName}`);
      const elements = [...document.querySelectorAll("*")].map((element) => element.getAttribute("data-t") ?? element.localName);
      return { where: where.sort(), elements: elements.sort() };
    };
    // (The two parsers differ where they should: a <noscript>'s content is text where scripts run.)
    expect(parse("<head><noscript><style></noscript><img></style>", (document) => document.querySelectorAll("img").length)).toEqual([0, 1]);
    const r = random(Number(process.env.HEAD_FUZZ_SEED ?? 20261022));
    const pick = <T,>(list: readonly T[]) => list[Math.floor(r() * list.length)];
    const bad: string[] = [];
    for (let run = 0; run < HEAD_FUZZ_RUNS && bad.length < 3; run++) {
      let ids = 0;
      let count = 0;
      const spec = (depth: number): Spec =>
        depth > 0 && (depth > 3 || r() < 0.4)
          ? { text: count++, how: pick(["string", "component", "list", "parts"] as const) }
          : { tag: pick(tags), id: ids++, type: r() < 0.3 ? pick(["application/ld+json", "text/plain"]) : undefined, children: Array.from({ length: 1 + Math.floor(r() * 3) }, () => spec(depth + 1)) };
      const specs = Array.from({ length: 1 + Math.floor(r() * 3) }, () => spec(0));
      const hostile = Array.from({ length: count }, (_, i) => {
        let text = "";
        for (let n = 1 + Math.floor(r() * 6); n > 0; n--) text += pick(fragments);
        return `Q${i}Q${text}Z${i}Z`;
      });
      const harmless = hostile.map((_, i) => `Q${i}QxZ${i}Z`);
      const html = (texts: string[]) => renderToHtml(<Page><Head>{specs.map((s, i) => node(s, texts, i))}</Head>{content}</Page>);
      const [expected, got] = [harmless, hostile].map((texts) => parse(html(texts), layout));
      if (JSON.stringify(got) !== JSON.stringify(expected)) bad.push(`${JSON.stringify(renderToHtmlParts(<Page><Head>{specs.map((s, i) => node(s, hostile, i))}</Head></Page>).tags)}`);
    }
    expect(bad).toEqual([]);
  }, HEAD_FUZZ_RUNS * 300 + 30000);

  it("says the design can't hold it, once per render", () => {
    const email = (
      <Email>
        {tags}
        <Head>
          <meta name="robots" content="noindex" />
        </Head>
        {content}
      </Email>
    );
    const design = renderToJson(email);
    expect(design.body.rows).toHaveLength(1);
    expect(warn.mock.calls.map((call) => String(call[0]))).toEqual(["[Unlayer] <Head>'s tags are kept in HTML but not in the design for the visual editor."]);
  });

  it("works with the async renderers", async () => {
    const html = await asyncRenderers.renderToHtml(
      <Email>
        {tags}
        {content}
      </Email>
    );
    expect(html.slice(0, html.indexOf("</head>"))).toContain(written);
  });

  it("renders its components as the template's: the async renderers wait for them, siblings at once, in tree order", async () => {
    const started: string[] = [];
    const Meta = async ({ name, ms }: { name: string; ms: number }) => {
      started.push(name);
      await new Promise((resolve) => setTimeout(resolve, ms));
      return <meta name={name} />;
    };
    const Theme = React.createContext("light");
    const Scheme = () => <meta name="color-scheme" content={React.useContext(Theme)} />;
    const email = (
      <Email>
        <Theme.Provider value="dark">
          <Head>
            <Meta name="first" ms={30} />
            <Meta name="second" ms={5} />
            <Scheme />
          </Head>
        </Theme.Provider>
        {content}
      </Email>
    );
    for (const render of [asyncRenderers.renderToHtml, async (e: React.ReactElement) => (await asyncRenderers.renderToHtmlParts(e)).head]) {
      started.length = 0;
      const head = await render(email);
      expect(head).toContain('<meta name="first"/><meta name="second"/><meta name="color-scheme" content="dark"/>');
      // Both had started before either was done.
      expect(started).toEqual(["first", "second"]);
    }
    // The synchronous ones say what to do, naming it and where it is.
    const sync = [() => renderToHtml(email), () => renderToHtmlParts(email), () => renderToPlainText(email), () => renderToJson(email)];
    for (const render of sync) expect(render).toThrow('async or suspends, and this renderer is synchronous: render with "@unlayer/react-elements/async", or load its data first and pass it as props (in <Meta> at Head › Meta)');
  });

  it("is in the error policy: a component in it that fails fails the render, or is left out of the head and listed", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const Broken = (): React.ReactElement => {
      throw new Error("no tag");
    };
    const email = (
      <Email>
        <Head>
          <meta name="kept" />
          <Broken />
        </Head>
        {content}
      </Email>
    );
    for (const render of [() => renderToHtml(email), () => renderToHtmlParts(email)]) {
      expect(render).toThrow(RenderError);
      expect(render).toThrow("[Unlayer] no tag (in <Broken> at Head › Broken)");
    }
    await expect(asyncRenderers.renderToHtml(email)).rejects.toMatchObject({ component: "Broken", position: "Head › Broken", cause: new Error("no tag") });
    const given: RenderError[] = [];
    for (const parts of [renderToHtmlParts(email, { onError: "omit" }), await asyncRenderers.renderToHtmlParts(email, { onError: "omit" }), renderToHtmlParts(email, { onError: (e) => void given.push(e) })]) {
      expect(parts.tags).toEqual(['<meta name="kept"/>']);
      expect(parts.omitted.map((e) => [e.component, e.position])).toEqual([["Broken", "Head › Broken"]]);
    }
    expect(given.map((e) => e.message)).toEqual(["[Unlayer] no tag (in <Broken> at Head › Broken)"]);
    expect(error.mock.calls.map((call) => String(call[0]))).toEqual(["[Unlayer] Left out: no tag (in <Broken> at Head › Broken)", "[Unlayer] Left out: no tag (in <Broken> at Head › Broken)"]);
    error.mockRestore();
  });

  it("renders nothing outside a template's render", () => {
    expect(renderToHtml(<Email>{content}</Email>)).not.toContain("color-scheme");
    expect(renderToStaticMarkup(<Head><meta name="a" /></Head>)).toBe("");
  });
});
