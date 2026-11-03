/**
 * What a reader gets from inputs the stories don't reach, through the new engine and as today's components render
 * them (legacyRenderToHtml, in the same build): the words shown, the plain text, where each link goes and how it
 * opens, the images and the places a link can go to (an anchor). The inputs are the final review's of the switch;
 * where the new engine can't draw one as legacy does, its block (or its template) keeps today's HTML, which these
 * check reads the same. Geometry (spacing, widths) is checked in Chromium by the upgrade sandbox's corpus, which holds
 * these inputs too.
 */
import { describe, expect, it, vi } from "vitest";
import React from "react";
import { Button, Column, Document, Email, Heading, Image, Page, Paragraph, Row, renderToHtml, renderToPlainText } from "../index";
import { legacyRenderToHtml, legacyRenderToPlainText } from "../utils/render-to-html";

type Root = typeof Email;
const ROOTS: Array<[string, Root]> = [
  ["Email", Email],
  ["Page", Page as unknown as Root],
  ["Document", Document as unknown as Root],
];
const svg = (w: number, h: number) => `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"/>`;
const cell = (Root: Root, block: React.ReactNode, props: Record<string, unknown> = {}) => (
  <Root {...props}>
    <Row>
      <Column>{block}</Column>
    </Row>
  </Root>
);

/** The inputs, each a template in a root. */
const INPUTS: Record<string, (Root: Root) => React.ReactElement> = {
  "named entities in a text's html": (Root) => cell(Root, <Paragraph html="&copy; 2024 Acme &mdash; all &euro;10 &rsquo;" />),
  "named entities in a heading's and a button's text": (Root) => cell(Root, [<Heading key="h" values={{ text: "&copy; x" } as never} />, <Button key="b" href="https://example.com" values={{ text: "&euro;5" } as never} />]),
  "an entity the browser reads without its semicolon": (Root) => cell(Root, <Paragraph html="&copy 2024 S&P 500" />),
  "a comment and a processing instruction": (Root) => cell(Root, [<Paragraph key="c" html="Hello <!-- note to self --> world" />, <Paragraph key="p" html="a<?php echo 1 ?>b" />]),
  "paragraphs with the browser's margins": (Root) => cell(Root, [<Paragraph key="a" html="<p>One</p><p>Two</p>" />, <Paragraph key="b" html={"<p>One</p>\n<p>Two</p>"} />]),
  "a link opening in its parent": (Root) => cell(Root, <Paragraph html='Open <a href="https://example.com" target="_parent">the parent</a>' />),
  "a link with its own rel": (Root) => cell(Root, <Paragraph html='Open <a href="https://example.com" rel="nofollow">this</a>' />),
  "a Liquid tag and a merge tag with a filter": (Root) => cell(Root, [<Paragraph key="l" html="{% if orders > 1 %}Thanks{% endif %}" />, <Paragraph key="m" html='Hi {{ name | default: "there" }}' />]),
  "a row's anchor": (Root) => (
    <Root>
      <Row>
        <Column>
          <Paragraph html='<a href="#details">Go to details</a>' />
        </Column>
      </Row>
      <Row anchor="details">
        <Column>
          <Paragraph>Details</Paragraph>
        </Column>
      </Row>
    </Root>
  ),
  "a content width in %": (Root) => cell(Root, <Paragraph>Fluid content</Paragraph>, { contentWidth: "100%" }),
  "a column's phone padding of 0": (Root) => (
    <Root>
      <Row>
        <Column padding="40px" mobile={{ padding: "0px" } as never}>
          <Paragraph>Mobile content</Paragraph>
        </Column>
      </Row>
    </Root>
  ),
  "a row's vertical alignment": (Root) => (
    <Root>
      <Row cells={[1, 1]} values={{ alignItems: "center" } as never}>
        <Column>
          <Paragraph>Short</Paragraph>
        </Column>
        <Column>
          <Paragraph html="Long<br>Long<br>Long" />
        </Column>
      </Row>
    </Root>
  ),
  "linked images": (Root) => cell(Root, [<Image key="a" src={svg(100, 50)} alt="a" action={{ url: "https://example.com" } as never} />, <Image key="b" src={svg(1000, 500)} alt="b" width={150} action={{ url: "https://example.com" } as never} />]),
  "sized images in stacked columns": (Root) => (
    <Root>
      <Row cells={[1, 1]}>
        <Column>
          <Image src={{ url: svg(600, 300), width: 600, height: 300 }} alt="a" />
        </Column>
        <Column>
          <Image src={{ url: svg(600, 300), width: 600, height: 300 }} alt="b" />
        </Column>
      </Row>
    </Root>
  ),
  "a button with a width": (Root) => cell(Root, [<Button key="a" href="https://example.com" width={300}>Go</Button>, <Button key="b" href="https://example.com" width="100%">All</Button>]),
  "a link style without an underline": (Root) => cell(Root, <Paragraph html='<a href="https://example.com">link</a> rest' linkStyle={{ inherit: false, linkColor: "#00ff00", linkUnderline: false } as never} />),
  "flat hide values": (Root) => cell(Root, [<Paragraph key="d" values={{ hideDesktop: true } as never}>Shown on desktop</Paragraph>, <Paragraph key="m" values={{ hideMobile: true } as never}>Shown on phones</Paragraph>]),
  "a paragraph's own direction": (Root) => cell(Root, <Paragraph textDirection="rtl">Hello (world)!</Paragraph>),
  "a page narrower than a phone": (Root) => cell(Root, <Paragraph>Narrow</Paragraph>, { contentWidth: "320px" }),
  "a preview text of 200 characters": (Root) => cell(Root, <Paragraph>Body</Paragraph>, { previewText: "A".repeat(200) }),
  "an underline around a strike": (Root) => cell(Root, <Paragraph html="<u><s>both</s></u>" />),
  "a heading holding a much larger run": (Root) => cell(Root, <Heading values={{ text: 'H <span style="font-size:60px">BIG</span>' } as never} />),
};

const dom = (html: string) => new DOMParser().parseFromString(html, "text/html");
/** The words a reader sees: the body's text, without styles, scripts and the inbox preview, blocks apart. */
const words = (html: string) => {
  const d = dom(html);
  d.querySelectorAll("style,script,title,[data-skip-in-text]").forEach((e) => e.remove());
  for (const block of d.querySelectorAll("p,div,td,th,h1,h2,h3,h4,h5,h6,li,table,tr,br,a")) {
    block.before(" ");
    block.after(" ");
  }
  return (d.body.textContent ?? "").replace(/[​͏‌]/g, "").replace(/\s+/g, " ").trim();
};
const preview = (html: string) => (dom(html).querySelector("[data-skip-in-text]")?.textContent ?? "").replace(/[^\w ]/g, "").trim();
/** Each link: where it goes and where it opens (none: in its own window). */
const links = (html: string) => [...dom(html).querySelectorAll("a[href]")].map((a) => `${a.getAttribute("href")} ${a.getAttribute("target") ?? ""}`).filter((l) => !l.startsWith("#") || true);
const images = (html: string) => [...dom(html).querySelectorAll("img")].map((i) => `${i.getAttribute("src")} ${i.getAttribute("alt")}`).filter((v, i, all) => all.indexOf(v) === i);
const anchors = (html: string) => [...dom(html).querySelectorAll("a[name], [id='details']")].map((a) => a.getAttribute("name") ?? a.id);

describe("what a reader gets from the final review's inputs, through the new engine and as today", () => {
  for (const [name, input] of Object.entries(INPUTS)) {
    it.each(ROOTS)(`${name} (%s)`, (_, Root) => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      try {
        const now = renderToHtml(input(Root));
        const today = legacyRenderToHtml(input(Root));
        expect(words(now)).toBe(words(today));
        expect(preview(now)).toBe(preview(today));
        expect(links(now)).toEqual(links(today));
        expect(images(now)).toEqual(images(today));
        expect(anchors(now)).toEqual(anchors(today));
        expect(renderToPlainText(input(Root))).toBe(legacyRenderToPlainText(input(Root)));
      } finally {
        warn.mockRestore();
      }
    });
  }
});
