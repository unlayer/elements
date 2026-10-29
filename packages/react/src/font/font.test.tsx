import React from "react";
import { describe, expect, it } from "vitest";
import { Column, Email, Heading, Page, Paragraph, Row, renderToHtml, renderToHtmlParts, renderToJson } from "../index";
import { Font } from "./index";

const SHEET = "https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap";
const content = (
  <Row>
    <Column>
      <Paragraph>Hello</Paragraph>
    </Column>
  </Row>
);

describe("Font", () => {
  it("loads a stylesheet in the head, out of Outlook's sight in an email, and is the template's font", () => {
    const email = (
      <Email>
        <Font family="Inter" url={SHEET} fallback="Arial, sans-serif" default />
        {content}
      </Email>
    );
    const html = renderToHtml(email);
    const head = html.slice(0, html.indexOf("</head>"));
    expect(head).toContain(`<!--[if !mso]><!--><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&amp;display=swap" rel="stylesheet" type="text/css"><!--<![endif]-->`);
    // On the content, as the root's own fontFamily is.
    expect(html.slice(html.indexOf("<body"))).toContain("font-family:'Inter', Arial, sans-serif;");
    expect(renderToJson(email).body.values.fontFamily).toEqual({ label: "Inter", value: "'Inter', Arial, sans-serif", url: SHEET });
  });

  it("declares a font file with @font-face, as written on a web page", () => {
    const page = (
      <Page>
        <Font family="Brand Sans" url="https://cdn.example.com/brand.woff2" weight={700} style="italic" />
        <Font family="Mono" url="https://cdn.example.com/mono" format="woff" />
        {content}
      </Page>
    );
    const { tags, head } = renderToHtmlParts(page);
    expect(tags).toEqual([
      "<style type=\"text/css\">@font-face { font-family: 'Brand Sans'; src: url('https://cdn.example.com/brand.woff2'); font-weight: 700; font-style: italic; }</style>",
      "<style type=\"text/css\">@font-face { font-family: 'Mono'; src: url('https://cdn.example.com/mono') format('woff'); font-weight: 400; font-style: normal; }</style>",
    ]);
    expect(head).toContain("@font-face { font-family: 'Brand Sans'");
    // Not `default`: the root's font is its own.
    expect(renderToJson(page).body.values.fontFamily.label).toBe("Arial");
  });

  it("gives way to the root's own fontFamily, and works from a component of yours", () => {
    const Fonts = () => <Font family="Inter" url={SHEET} default />;
    const email = (
      <Email fontFamily="Georgia, serif">
        <Fonts />
        {content}
      </Email>
    );
    expect(renderToJson(email).body.values.fontFamily).toEqual({ label: "Georgia, serif", value: "Georgia, serif" });
    expect(renderToHtml(email)).toContain("fonts.googleapis.com");
    const json = renderToJson(
      <Email>
        <Fonts />
        {content}
      </Email>
    );
    expect(json.body.values.fontFamily.label).toBe("Inter");
    // It adds no block to the design.
    expect(json.body.rows).toHaveLength(1);
  });

  it("puts its URL on the design's fonts of its family, as the editor keeps a web font, so the editor loads it too", () => {
    const FRAUNCES = "https://fonts.googleapis.com/css2?family=Fraunces:wght@500&display=swap";
    const json = renderToJson(
      <Email fontFamily="'Fraunces', serif">
        <Font family="Fraunces" url={FRAUNCES} fallback="Georgia, serif" />
        <Font family="Brand Sans" url="https://cdn.example.com/brand.woff2" />
        <Row>
          <Column>
            <Heading fontFamily="Fraunces, Georgia, 'Times New Roman', serif">Serif</Heading>
            <Paragraph fontFamily={{ label: "Fraunces", value: "fraunces, serif", url: "https://example.com/own.css" }}>Its own</Paragraph>
            <Paragraph fontFamily="Georgia, serif">Another family</Paragraph>
            <Paragraph fontFamily="'Brand Sans', sans-serif">A font file</Paragraph>
          </Column>
        </Row>
      </Email>
    );
    const [heading, own, georgia, file] = json.body.rows[0].columns[0].contents.map((content) => content.values.fontFamily);
    expect(json.body.values.fontFamily).toEqual({ label: "'Fraunces', serif", value: "'Fraunces', serif", url: FRAUNCES });
    expect(heading).toEqual({ label: "Fraunces, Georgia, 'Times New Roman', serif", value: "Fraunces, Georgia, 'Times New Roman', serif", url: FRAUNCES });
    // A URL of its own stays; another family, and a font file (an @font-face, which the editor has no place for), get none.
    expect(own.url).toBe("https://example.com/own.css");
    expect(georgia.url).toBeUndefined();
    expect(file.url).toBeUndefined();
  });

  it("can't end its tags or CSS with what a family or URL holds", () => {
    const { tags } = renderToHtmlParts(
      <Page>
        <Font family={"X'; } body { color: red"} url={"https://x.com/a.woff2') ; </style><script>"} format="woff2" />
        {content}
      </Page>
    );
    expect(tags[0]).toBe("<style type=\"text/css\">@font-face { font-family: 'X  body  color: red'; src: url('https://x.com/a.woff2%27%29%20;%20%3c/style%3e%3cscript%3e') format('woff2'); font-weight: 400; font-style: normal; }</style>");
  });

  it("reads a family as a browser reads it in a style attribute: no character reference or control character in it ends its declaration", () => {
    for (const family of ["X&#39;&#59; color: red", "X&apos;&semi; color: red", "X'\n; color: red", "X&#x27;\u0000&#x3b; color: red"]) {
      const html = renderToHtml(<Email><Font family={family} url="https://fonts.example.com/x.css" fallback={"Arial&#59; color: red"} default />{content}</Email>);
      const doc = new DOMParser().parseFromString(html, "text/html");
      expect([family, [...doc.querySelectorAll<HTMLElement>("[style]")].filter((el) => el.style.color === "red").length]).toEqual([family, 0]);
    }
  });

  it("loads nothing from a URL that runs code (`javascript:`, as React tells one), a stylesheet or a font file", () => {
    for (const url of ["javascript:alert(1)", " JavaScript:alert(1)", "java\tscript:alert(1)", "javascript:alert(1)//x.woff2"]) {
      for (const Root of [Email, Page]) {
        const { tags } = renderToHtmlParts(
          <Root>
            <Font family="Inter" url={url} />
            {content}
          </Root>
        );
        expect([url, tags.filter((tag) => /javascript/i.test(tag))]).toEqual([url, []]);
      }
    }
  });
});
