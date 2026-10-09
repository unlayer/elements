/**
 * One render never leaks into the next: data read by a component, an element
 * kept between renders, and the order renders run in don't carry over, and the
 * same input always gives the same output.
 */
import { describe, expect, it } from "vitest";
import React, { memo, useState } from "react";
import { renderToHtml, renderToHtmlParts, renderToPlainText } from "../utils/render-to-html";
import { renderToJson } from "../utils/render-to-json";
import { Email, Row, Column, Paragraph } from "../index";

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
