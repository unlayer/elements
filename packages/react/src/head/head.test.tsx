import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { Column, Document, Email, Page, Paragraph, Row, renderToHtml, renderToHtmlParts, renderToJson, renderToPlainText } from "../index";
import { renderToHtml as renderToHtmlAsync } from "../async";
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
    expect(html).toContain("<style>a > b { color: red } <\\/style><script>alert(1)</script></style>");
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
    const html = await renderToHtmlAsync(
      <Email>
        {tags}
        {content}
      </Email>
    );
    expect(html.slice(0, html.indexOf("</head>"))).toContain(written);
  });

  it("renders nothing outside a template's render", () => {
    expect(renderToHtml(<Email>{content}</Email>)).not.toContain("color-scheme");
    expect(renderToStaticMarkup(<Head><meta name="a" /></Head>)).toBe("");
  });
});
