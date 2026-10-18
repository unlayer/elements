import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
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
