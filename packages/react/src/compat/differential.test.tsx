/**
 * What a reader gets from inputs the stories don't reach, through this build and as the last published release (0.2.1)
 * draws them: the words shown, the plain text, where each link goes and how it opens, the images and the places a link
 * can go to (an anchor). The inputs are the final review's of the switch; each is built twice, with each release's own
 * components, as a template has to be. Geometry (spacing, widths) isn't read here: only a browser can.
 */
import { describe, expect, it, vi } from "vitest";
import React from "react";
import * as current from "../index";
import * as published from "@unlayer/react-elements-previous";

type Release = typeof current;
const previous = published as unknown as Release;

type Root = Release["Email"];
const ROOTS = ["Email", "Page", "Document"] as const;
const svg = (w: number, h: number) => `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"/>`;

/** The inputs, each a template in a root, built with a release's components. */
const inputs = ({ Button, Column, Divider, Heading, Image, Paragraph, Row, Table }: Release): Record<string, (Root: Root) => React.ReactElement> => {
  const cell = (Root: Root, block: React.ReactNode, props: Record<string, unknown> = {}) => (
    <Root {...props}>
      <Row>
        <Column>{block}</Column>
      </Row>
    </Root>
  );
  return {
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
    "a button with no link": (Root) => cell(Root, <Button>Go</Button>),
    "a button whose label holds what no run does": (Root) => cell(Root, [<Button key="a" href="https://example.com" values={{ text: '<img src="https://example.com/a.png" alt="A"> Icon' } as never} />, <Button key="b" href="https://example.com" values={{ text: "<ul><li>One</li><li>Two</li></ul>" } as never} />, <Button key="c" href="https://example.com" values={{ text: "&copy 2024 caf&eacute;" } as never} />]),
    "a button's label in paragraphs": (Root) => cell(Root, <Button href="https://example.com" values={{ text: '<p style="margin:0">One</p><p style="margin:0">Two</p>' } as never} />),
    "a button's values that can't be read": (Root) => cell(Root, <Button href="https://example.com" values={{ fontSize: "large", lineHeight: "tall", letterSpacing: "wide", padding: "5%", borderRadius: "50%", fontWeight: "heavy", textAlign: "middle", containerPadding: "1em", size: { autoWidth: false, width: "10em" } } as never}>Go</Button>),
    "dividers of every length": (Root) => cell(Root, [<Divider key="a" />, <Divider key="b" width="60%" textAlign="left" />, <Divider key="c" width={300} />, <Divider key="d" values={{ width: { width: "50%", autoWidth: false }, border: { borderTopWidth: "thin" } } as never} />, <Paragraph key="e">After</Paragraph>]),
    "a table with a header, rows and a footer": (Root) => cell(Root, <Table values={{ table: { headers: [{ cells: [{ text: "H1" }, { text: "H2" }] }], rows: [{ cells: [{ text: "A1" }, { text: "A2" }] }, { cells: [{ text: "B1" }, { text: "" }] }], footers: [{ cells: [{ text: "F1" }, { text: "F2" }] }] }, enableFooter: true, stripedRows: true, stripedRowsBackgroundColor: "#eeeeee" } as never} />),
    "a table with neither": (Root) => cell(Root, <Table values={{ table: { headers: [{ cells: [{ text: "Not shown" }] }], rows: [{ cells: [{ text: "A1" }] }], footers: [{ cells: [{ text: "Not shown either" }] }] }, enableHeader: false, enableFooter: false } as never} />),
    "a table's cells with links, images and markup": (Root) => cell(Root, <Table values={{ table: { headers: [{ cells: [{ text: '<a href="https://example.com/h">Head</a>' }, { text: "<b>Bold</b>" }] }], rows: [{ cells: [{ text: 'See <a href="https://example.com/a" target="_self">a</a> &amp; <i>b</i>' }, { text: '<img src="https://example.com/a.png" alt="A"> <ul><li>One</li></ul>' }] }], footers: [] } } as never} />),
    "a table with no cells": (Root) => cell(Root, [<Table key="t" />, <Paragraph key="p">After</Paragraph>]),
    "a link style without an underline": (Root) => cell(Root, <Paragraph html='<a href="https://example.com">link</a> rest' linkStyle={{ inherit: false, linkColor: "#00ff00", linkUnderline: false } as never} />),
    "flat hide values": (Root) => cell(Root, [<Paragraph key="d" values={{ hideDesktop: true } as never}>Shown on desktop</Paragraph>, <Paragraph key="m" values={{ hideMobile: true } as never}>Shown on phones</Paragraph>]),
    "a paragraph's own direction": (Root) => cell(Root, <Paragraph textDirection="rtl">Hello (world)!</Paragraph>),
    "a page narrower than a phone": (Root) => cell(Root, <Paragraph>Narrow</Paragraph>, { contentWidth: "320px" }),
    "a preview text of 200 characters": (Root) => cell(Root, <Paragraph>Body</Paragraph>, { previewText: "A".repeat(200) }),
    "an underline around a strike": (Root) => cell(Root, <Paragraph html="<u><s>both</s></u>" />),
    "a heading holding a much larger run": (Root) => cell(Root, <Heading values={{ text: 'H <span style="font-size:60px">BIG</span>' } as never} />),
  };
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
const links = (html: string) => [...dom(html).querySelectorAll("a[href]")].map((a) => `${a.getAttribute("href")} ${a.getAttribute("target") ?? ""}`);
const images = (html: string) => [...dom(html).querySelectorAll("img")].map((i) => `${i.getAttribute("src")} ${i.getAttribute("alt")}`).filter((v, i, all) => all.indexOf(v) === i);
const anchors = (html: string) => [...dom(html).querySelectorAll("a[name], [id='details']")].map((a) => a.getAttribute("name") ?? a.id);

describe("what a reader gets from the final review's inputs, through this build and in 0.2.1", () => {
  const now = inputs(current);
  const before = inputs(previous);
  for (const name of Object.keys(now)) {
    it.each(ROOTS)(`${name} (%s)`, (root) => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      try {
        const template = now[name](current[root] as Root);
        const reference = before[name](previous[root] as Root);
        const [html, drawn] = [current.renderToHtml(template), previous.renderToHtml(reference)];
        expect(words(html)).toBe(words(drawn));
        expect(preview(html)).toBe(preview(drawn));
        expect(links(html)).toEqual(links(drawn));
        expect(images(html)).toEqual(images(drawn));
        expect(anchors(html)).toEqual(anchors(drawn));
        expect(current.renderToPlainText(template)).toBe(previous.renderToPlainText(reference));
      } finally {
        warn.mockRestore();
      }
    });
  }
});
