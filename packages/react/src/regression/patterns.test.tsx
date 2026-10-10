/**
 * The ways a template is put together that broke before, each rendered to HTML
 * and to a design and compared with a reviewed snapshot: any change fails until
 * the snapshot is updated (`vitest -u`) and reviewed.
 */
import { describe, expect, it, vi } from "vitest";
import React, { forwardRef, memo, useState } from "react";
import { renderToHtml } from "../utils/render-to-html";
import { renderToJson } from "../utils/render-to-json";
import { Email, Page, Document, Row, Column, Paragraph, Heading, Button, Image, Html } from "../index";
import { lines } from "./lines";

const block = (text: string) => <Row><Column><Paragraph>{text}</Paragraph></Column></Row>;
const Header = () => block("From a component");
const Pair = () => [<React.Fragment key="a">{block("From an array")}</React.Fragment>, block("Second of the array")];
const Nothing = () => null;
const MemoRow = memo(() => block("From memo"));
const RefRow = forwardRef<HTMLDivElement>((_, __) => block("From forwardRef"));
const WithHooks = () => {
  const [text] = useState("From a component with hooks");
  return block(text);
};
const reused = <Header />;
const RawFooter = () => <div dangerouslySetInnerHTML={{ __html: "<p>Raw footer</p>" }} />;
const Template = ({ name }: { name: string }) => (
  <Email previewText={`Hi ${name}`}>
    {block(`Hi ${name}`)}
  </Email>
);

const PATTERNS: Record<string, () => React.ReactElement> = {
  "fragments-and-components": () => (
    <Email>
      <>{block("From a Fragment")}</>
      <Header />
      <Pair />
      <Nothing />
      {false}
      {null}
      <MemoRow />
      <RefRow />
      <WithHooks />
    </Email>
  ),
  "reused-element": () => <Email>{reused}{reused}</Email>,
  "html-from-a-component": () => <Page><RawFooter />{block("After the footer")}</Page>,
  "text-straight-in-rows-and-columns": () => <Email><Row>Row text<Column>Column text<Paragraph>In a paragraph</Paragraph></Column></Row></Email>,
  "right-to-left": () => <Email textDirection="rtl" lang="ar"><Row><Column><Heading>مرحبا</Heading><Paragraph>نص</Paragraph><Button href="https://example.com">زر</Button></Column></Row></Email>,
  "hidden-on-a-device": () => (
    <Email>
      <Row><Column><Paragraph hideOnDesktop>Phones only</Paragraph><Paragraph hideOnMobile>Desktop only</Paragraph></Column></Row>
      <Row hideOnMobile><Column><Image src="https://example.com/a.png" width="200px" alt="Desktop image" /></Column></Row>
    </Email>
  ),
  "html-block": () => <Email><Row><Column><Html html="<table><tr><td>Kept as HTML</td></tr></table>" /></Column></Row></Email>,
  "template-component": () => <Template name="Ada" />,
  "web-page": () => <Page>{block("A web page")}</Page>,
  "print-document": () => <Document>{block("A document")}</Document>,
};

describe.each(Object.keys(PATTERNS))("%s", (name) => {
  it("renders the reviewed HTML and design", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      await expect(lines(renderToHtml(PATTERNS[name]()))).toMatchFileSnapshot(`__snapshots__/patterns/${name}.html`);
      await expect(`${JSON.stringify(renderToJson(PATTERNS[name]()), null, 1)}\n`).toMatchFileSnapshot(`__snapshots__/patterns/${name}.json`);
    } finally {
      warn.mockRestore();
    }
  });
});
