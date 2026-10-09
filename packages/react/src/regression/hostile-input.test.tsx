/**
 * Values that often come from users (a name, a link, a language) can't add
 * markup: each is given markup that would add an element or an attribute, in
 * every mode, and the parsed output must have neither. Raw HTML is what the
 * Html block and the `text` prop of Heading and Button are for, so they aren't
 * tested; design props (colors, sizes) come from the template's author.
 */
import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToHtml } from "../utils/render-to-html";
import { Email, Page, Document, Row, Column, Paragraph, Heading, Button, Image, Menu, Social } from "../index";

const PAYLOADS = ['"><x-pwn></x-pwn>', "'><x-pwn></x-pwn>", '" x-pwn="1', "' x-pwn='1", "</p></div></td></tr></table><x-pwn></x-pwn>"];

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
  "Paragraph text": (v) => <Row><Column><Paragraph>{v}</Paragraph></Column></Row>,
  "Heading text": (v) => <Row><Column><Heading>{v}</Heading></Column></Row>,
  "Button text": (v) => <Row><Column><Button href="https://example.com">{v}</Button></Column></Row>,
  "Button link": (v) => <Row><Column><Button href={`https://example.com/${v}`}>Go</Button></Column></Row>,
  "Image source": (v) => <Row><Column><Image src={`https://example.com/${v}.png`} width="100px" alt="x" /></Column></Row>,
  "Image text": (v) => <Row><Column><Image src="https://example.com/a.png" width="100px" alt={v} /></Column></Row>,
  "Image link": (v) => <Row><Column><Image src="https://example.com/a.png" width="100px" alt="x" href={`https://example.com/${v}`} /></Column></Row>,
  "Menu item": (v) => <Row><Column><Menu items={[{ text: v, href: `https://example.com/${v}` }]} /></Column></Row>,
  "Social link": (v) => <Row><Column><Social icons={[{ name: "Twitter", url: `https://twitter.com/${v}` }]} /></Column></Row>,
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

  it.each(Object.keys(ROOT_PROPS))("the root's %s can't add markup", (name) => {
    for (const payload of PAYLOADS) {
      const html = renderToHtml(React.createElement(Root, ROOT_PROPS[name](payload) as never, content(payload)));
      expect(injected(html), payload).toEqual([]);
    }
  });

  it("the title option can't add markup", () => {
    for (const payload of PAYLOADS) expect(injected(renderToHtml(<Root>{content(payload)}</Root>, { title: payload, lang: payload })), payload).toEqual([]);
  });
});
