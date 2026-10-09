/**
 * One render never leaks into the next: data read by a component, an element
 * kept between renders, and the order renders run in don't carry over, and the
 * same input always gives the same output.
 */
import { describe, expect, it } from "vitest";
import React, { memo, useId, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { renderToHtml, renderToHtmlParts, renderToPlainText } from "../utils/render-to-html";
import { renderToJson } from "../utils/render-to-json";
import { Email, Row, Column, Paragraph, Html } from "../index";

let user = "Alice";
const Greeting = () => <Row><Column><Paragraph>Hi {user}</Paragraph></Column></Row>;
const MemoGreeting = memo(Greeting);
const HookGreeting = () => {
  const [prefix] = useState("Hello");
  return <Row><Column><Paragraph>{prefix} {user}</Paragraph></Column></Row>;
};
const kept = { plain: <Greeting />, memo: <MemoGreeting />, hooks: <HookGreeting />, fragment: <><Greeting /></> };

describe.each(Object.keys(kept) as Array<keyof typeof kept>)("an element kept between renders (%s)", (kind) => {
  const email = () => <Email>{kept[kind]}</Email>;
  it("shows the data of each render", () => {
    for (const name of ["Alice", "Bob", "Carol"]) {
      user = name;
      const outputs = [renderToHtml(email()), renderToHtmlParts(email()).body, renderToPlainText(email()), JSON.stringify(renderToJson(email()))];
      for (const output of outputs) {
        expect(output).toContain(name);
        for (const other of ["Alice", "Bob", "Carol"].filter((n) => n !== name)) expect(output).not.toContain(other);
      }
    }
  });
});

describe("renders", () => {
  const first = () => <Email previewText="First"><Row><Column><Paragraph>First email</Paragraph></Column></Row></Email>;
  const second = () => <Email><Row><Column><Paragraph textAlign="center">Second email</Paragraph><Paragraph>And more</Paragraph></Column></Row></Email>;

  it("give the same output for the same input, every time", () => {
    user = "Alice";
    for (const make of [first, second, () => <Email>{kept.plain}{kept.hooks}</Email>]) {
      expect(renderToHtml(make())).toBe(renderToHtml(make()));
      expect(JSON.stringify(renderToJson(make()))).toBe(JSON.stringify(renderToJson(make())));
    }
  });

  it("don't depend on what was rendered before, in any order", () => {
    const alone = { first: renderToHtml(first()), second: renderToHtml(second()), design: JSON.stringify(renderToJson(second())) };
    renderToJson(first());
    expect(renderToHtml(second())).toBe(alone.second);
    renderToHtml(second());
    expect(renderToHtml(first())).toBe(alone.first);
    renderToHtmlParts(first());
    expect(JSON.stringify(renderToJson(second()))).toBe(alone.design);
  });
});

describe("useId() in components", () => {
  // A component that links to its own anchor, as a table of contents or a form label does.
  const Section = ({ to }: { to: string }) => {
    const id = useId();
    return <Html html={`<a id="${id}" href="${to}">${to}</a>`} />;
  };
  const SectionRow = ({ to }: { to: string }) => {
    const id = useId();
    return <Row><Column><Html html={`<a id="${id}" href="${to}">${to}</a>`} /></Column></Row>;
  };
  const email = () => (
    <Email>
      <Row><Column><Section to="/one" /><Section to="/two" /></Column></Row>
      <SectionRow to="/three" />
      <SectionRow to="/four" />
    </Email>
  );
  const ids = (html: string) => [...html.matchAll(/<a id="([^"]+)"/g)].map((m) => m[1]);

  it("gives each component its own ids", () => {
    for (const html of [renderToHtml(email()), renderToHtmlParts(email()).body, renderToStaticMarkup(email()), JSON.stringify(renderToJson(email()))]) {
      const found = ids(html.replace(/\\"/g, '"'));
      expect(found).toHaveLength(4);
      expect(new Set(found).size).toBe(4);
    }
  });

  it("gives the same ids on every render", () => {
    expect(renderToHtml(email())).toBe(renderToHtml(email()));
    expect(renderToStaticMarkup(email())).toBe(renderToStaticMarkup(email()));
    expect(ids(renderToHtml(email()))).toEqual(ids(renderToStaticMarkup(email())));
  });
});
