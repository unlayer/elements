// @vitest-environment node
/**
 * Elements' React isn't the one react-dom renders with (see react-copy.ts), as in a Next.js App Router route handler
 * or Server Component. Elements renders templates itself (src/engine), never with react-dom, so it renders them as
 * anywhere else; and a collecting walk records Rows, Columns and blocks by their markers, another copy's of Elements
 * (with another React) too. (0.3.0's react-dom renders couldn't tell, and needed a "blind" mode for it.)
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("react-dom/server", async () => (await import("./react-copy")).reactCopy()("react-dom/server"));

import React from "react";
import * as server from "react-dom/server";
import { Button, Column, ColumnLayouts, Email, Paragraph, Row, renderToHtml as renderToHtmlSync, renderToJson as renderToJsonSync } from "../index";
import { renderToHtml, renderToJson, renderToPlainText } from "../async";
import { Head } from "../head";
import { Font } from "../font";
import { StripeReceipt } from "../examples/StripeReceipt.stories";

const tables = (html: string) => (html.match(/<table/g) ?? []).length;
const later = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// The email tests/nextjs-integration renders.
const Welcome = ({ name }: { name: string }) => (
  <Email>
    <Row><Column><Paragraph>{`Hello ${name}`}</Paragraph><Button href="https://example.com">Get started</Button></Column></Row>
    <Row layout={ColumnLayouts.TwoEqual}><Column><Paragraph>Left</Paragraph></Column><Column><Paragraph>Right</Paragraph></Column></Row>
  </Email>
);

let said: string[] = [];
beforeEach(() => {
  said = [];
  // React's development build says "Invalid hook call" for the check that finds this out (once per collection).
  vi.spyOn(console, "error").mockImplementation((message) => void (/Invalid hook call/.test(String(message)) || said.push(String(message))));
  vi.spyOn(console, "warn").mockImplementation((message) => void said.push(String(message)));
});
afterEach(() => vi.restoreAllMocks());
afterAll(async () => (await import("./react-copy")).removeReactCopy());

describe("another copy of React than react-dom's", () => {
  it("is what this file renders with", () => {
    expect(server.renderToStaticMarkup(<p>ok</p>)).toBe("<p>ok</p>");
    let thrown: unknown;
    const Hooks = () => {
      try {
        React.useId();
      } catch (error) {
        thrown = error;
      }
      return null;
    };
    server.renderToStaticMarkup(<Hooks />);
    expect(thrown).toBeDefined();
  });

  it("renders an email as the synchronous renderers do, from the async ones", async () => {
    for (const element of [<StripeReceipt key="stripe" />, <Welcome key="welcome" name="Ada" />]) {
      const html = renderToHtmlSync(element);
      const design = renderToJsonSync(element);
      expect(tables(html)).toBeGreaterThan(10);
      expect(design.body.rows.length).toBeGreaterThan(1);
      expect(await renderToHtml(element)).toBe(html);
      expect(await renderToJson(element)).toEqual(design);
    }
    expect(renderToJsonSync(<StripeReceipt />).body.rows).toHaveLength(12);
    expect((await renderToJson(<Welcome name="Ada" />)).body.rows.map((row) => row.columns.length)).toEqual([1, 2]);
    expect(await renderToPlainText(<Welcome name="Ada" />)).toContain("Hello Ada");
    expect(said).toEqual([]);
  });

  /** A template whose Rows come in late (an async component among them, and one in a Column), named `name`. */
  const late = (name: string, ms: number, log: string[] = []) => {
    const Rows = async () => {
      log.push(`start ${name}`);
      await later(ms);
      log.push(`end ${name}`);
      return resolved(name).props.children.slice(1);
    };
    const Block = async () => <Paragraph>{`Block ${name}${await later(ms / 2).then(() => "")}`}</Paragraph>;
    return (
      <Email>
        <Row><Column><Paragraph>{`Top ${name}`}</Paragraph><Block /></Column></Row>
        <Rows />
      </Email>
    );
  };
  /** The same template, its data there: what the synchronous renderers make of it. */
  const resolved = (name: string) => (
    <Email>
      <Row><Column><Paragraph>{`Top ${name}`}</Paragraph><Paragraph>{`Block ${name}`}</Paragraph></Column></Row>
      <Row><Column><Paragraph>{`First ${name}`}</Paragraph></Column></Row>
      <Row><Column><Paragraph>{`Second ${name}`}</Paragraph></Column></Row>
    </Email>
  );
  const texts = (design: { body: { rows: any[] } }) => design.body.rows.flatMap((row) => row.columns.flatMap((column: any) => column.contents.map((c: any) => c.values.text)));

  it("keeps each async render's rows its own when they render at once", async () => {
    const names = ["A", "B", "C", "D"];
    const log: string[] = [];
    // Started in order, finished in reverse: each one's components run with the others under way.
    const designs = await Promise.all(names.map((name, i) => renderToJson(late(name, 40 - i * 10, log))));
    const htmls = await Promise.all(names.map((name, i) => renderToHtml(late(name, 5 + i * 10))));
    expect(log).toEqual([...names.map((name) => `start ${name}`), ...names.map((name) => `end ${name}`).reverse()]);
    names.forEach((name, i) => {
      expect(texts(designs[i])).toEqual(["Top", "Block", "First", "Second"].map((text) => `${text} ${name}`));
      expect(designs[i]).toEqual(renderToJsonSync(resolved(name)));
      expect(htmls[i]).toBe(renderToHtmlSync(resolved(name)));
    });
    expect(said).toEqual([]);
  });
});

describe("Rows of another copy of Elements, with another React", () => {
  // The app's Elements, with another React than this file's: the Rows, Columns and blocks of this file's (another
  // copy of Elements) are recorded by their markers, as the app's own are.
  let app: typeof import("../index") & { async: typeof import("../async"); Head: typeof Head; Font: typeof Font };
  beforeAll(async () => {
    vi.resetModules();
    const copy = (await import("./react-copy")).reactCopy()("react");
    vi.doMock("react", () => ({ ...copy, default: copy }));
    app = { ...(await import("../index")), async: await import("../async"), Head: (await import("../head")).Head, Font: (await import("../font")).Font };
    vi.doUnmock("react");
  });
  it("are collected, as the app's own are", async () => {
    const Content = () => <Row><Column><Paragraph>Hello</Paragraph></Column></Row>;
    const own = <app.Email><app.Row><app.Column><app.Paragraph>Hello</app.Paragraph></app.Column></app.Row></app.Email>;
    // Among the root's children, and in a component of the template's.
    for (const element of [<app.Email key="plain">{Content()}</app.Email>, <app.Email key="component"><Content /></app.Email>]) {
      expect(app.renderToHtml(element)).toBe(app.renderToHtml(own));
      expect(app.renderToJson(element)).toEqual(app.renderToJson(own));
      expect(await app.async.renderToHtml(element)).toBe(app.renderToHtml(own));
      expect(await app.async.renderToJson(element)).toEqual(app.renderToJson(own));
    }
    expect(app.renderToJson(own).body.rows).toHaveLength(1);
  });

  it("leave alone a template with no Rows to collect", async () => {
    const url = "https://fonts.googleapis.com/css2?family=Inter";
    const blind = { Email, Head, Font, renderToHtml: renderToHtmlSync, renderToJson: renderToJsonSync, async: { renderToHtml, renderToJson } };
    // Both renders: the app's, and a blind one (this file's).
    for (const { Email, Head, Font, renderToHtml: html, renderToJson: json, async } of [app, blind]) {
      const templates = [
        <Email key="empty" />,
        <Email key="null">{null}</Email>,
        <Email key="text">Just text</Email>,
        <Email key="markup"><div>Markup</div></Email>,
        <Email key="head"><Head><title>Hi</title></Head><Font family="Inter" url={url} /></Email>,
      ];
      for (const element of templates) {
        expect(html(element)).toContain("<html");
        expect(json(element).body.rows).toEqual([]);
        expect(await async.renderToHtml(element)).toContain("<html");
        expect((await async.renderToJson(element)).body.rows).toEqual([]);
      }
    }
  });
});
