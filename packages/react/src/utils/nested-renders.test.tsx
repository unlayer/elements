/**
 * Elements' renders inside another React render: an app page that renders on the server and works out its
 * design or HTML while it renders (`useMemo(() => renderToJson(<T />))`), and a template's component that does.
 * React keeps a render's hook state in its module, so a render started inside another one with the same module
 * broke the hooks the outer component called after it (see server-renderer.ts).
 */
import { describe, it, expect, vi } from "vitest";
import React, { useMemo, useState } from "react";
import { renderToString } from "react-dom/server";
// @ts-ignore react-dom/server.browser has no types of its own (the same API as react-dom/server).
import { renderToString as renderToStringWithBrowserBuild } from "react-dom/server.browser";
import { renderToHtml } from "./render-to-html";
import { renderToJson } from "./render-to-json";
import { Email, Row, Column, Paragraph } from "../index";

const Template = () => <Email><Row><Column><Paragraph>Hello from the template</Paragraph></Column></Row></Email>;

describe("a page that renders on the server", () => {
  it("can work out the template's design while it renders, and use hooks after (as 0.1.22 could)", () => {
    function EditorPage() {
      const design = useMemo(() => renderToJson(<Template />), []);
      const [open] = useState(false);
      return <pre>{`${design.body.rows.length} rows, open=${open}`}</pre>;
    }
    expect(renderToString(<EditorPage />)).toBe("<pre>1 rows, open=false</pre>");
  });

  it("can work out its HTML too", () => {
    function PreviewPage() {
      const html = useMemo(() => renderToHtml(<Template />), []);
      const [zoom] = useState(1);
      return <pre>{`${html.includes("Hello from the template")}, zoom=${zoom}`}</pre>;
    }
    expect(renderToString(<PreviewPage />)).toBe("<pre>true, zoom=1</pre>");
  });
});

describe("a page that renders with react-dom's browser build (react-dom/server.browser)", () => {
  it("can work out the template's design and HTML while it renders, and use hooks after (as 0.1.22 could)", () => {
    function EditorPage() {
      const design = useMemo(() => renderToJson(<Template />), []);
      const html = useMemo(() => renderToHtml(<Template />), []);
      const [open] = useState(false);
      return <pre>{`${design.body.rows.length} rows, ${html.includes("Hello from the template")}, open=${open}`}</pre>;
    }
    expect(renderToStringWithBrowserBuild(<EditorPage />)).toBe("<pre>1 rows, true, open=false</pre>");
  });
});

describe("a template's component", () => {
  it("can work out another template's design while Elements renders it", () => {
    function RowCount() {
      const design = useMemo(() => renderToJson(<Template />), []);
      const [label] = useState("rows");
      return <div dangerouslySetInnerHTML={{ __html: `${design.body.rows.length} ${label}` }} />;
    }
    const html = renderToHtml(<Email><Row><Column><Paragraph>Before</Paragraph><RowCount /></Column></Row></Email>);
    expect(html).toContain("Before");
    expect(html).toContain("1 rows");
  });

  it("can nest one more, in the module it's in, as 0.1.22 did: a component calling a hook after the call is left out, named", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      function Deepest() {
        const design = renderToJson(<Template />);
        return <div dangerouslySetInnerHTML={{ __html: `deepest ${design.body.rows.length} rows` }} />;
      }
      function DeepestWithHook() {
        renderToJson(<Template />);
        const [label] = useState("never shown");
        return <div dangerouslySetInnerHTML={{ __html: label }} />;
      }
      function Deeper() {
        const html = renderToHtml(<Email><Row><Column><Deepest /><DeepestWithHook /></Column></Row></Email>);
        return <div dangerouslySetInnerHTML={{ __html: `${html.includes("deepest 1 rows") ? "deepest shown" : "deepest left out"}, ${html.includes("never shown") ? "hook shown" : "hook left out"}` }} />;
      }
      const html = renderToHtml(<Email><Row><Column><Paragraph>Outer</Paragraph><Deeper /></Column></Row></Email>);
      expect(html).toContain("Outer");
      expect(html).toContain("deepest shown, hook left out");
      // Named (the render that explains why calls it once more on its own, where it renders).
      expect(error.mock.calls.some((call) => String(call[0]).includes("<DeepestWithHook>"))).toBe(true);
    } finally {
      error.mockRestore();
    }
  });
});

describe("a page that renders on the server, with a template whose component works out another design", () => {
  // Three renders: the page's (react-dom/server), Elements' (another module of react-dom's), and the component's call
  // (none is left that isn't rendering: Elements' module, as 0.1.22 rendered). The page's hooks keep working; the
  // component renders, unless it calls a hook after the call (it's left out, named).
  it("keeps the page's hooks, and renders that component unless it calls a hook after", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      function Count() {
        const design = renderToJson(<Template />);
        return <div dangerouslySetInnerHTML={{ __html: `${design.body.rows.length} rows` }} />;
      }
      function CountWithHook() {
        const design = renderToJson(<Template />);
        const [label] = useState("labelled rows");
        return <div dangerouslySetInnerHTML={{ __html: `${design.body.rows.length} ${label}` }} />;
      }
      function PreviewPage() {
        const html = useMemo(() => renderToHtml(<Email><Row><Column><Paragraph>Outer</Paragraph><Count /><CountWithHook /></Column></Row></Email>), []);
        const [zoom] = useState(1);
        return <pre>{`${html.includes("Outer")}, ${html.includes("1 rows")}, ${html.includes("labelled")}, zoom=${zoom}`}</pre>;
      }
      expect(renderToString(<PreviewPage />)).toBe("<pre>true, true, false, zoom=1</pre>");
      expect(error.mock.calls.some((call) => String(call[0]).includes("<CountWithHook>"))).toBe(true);
    } finally {
      error.mockRestore();
    }
  });
});

describe("an error of the template's own", () => {
  it("is the error it throws (react-dom can render here)", () => {
    expect(() => renderToJson(<Row />)).toThrow(/Root element must be/);
  });
});

describe("a component that isn't one (undefined: a broken or circular import)", () => {
  // React says so and the render fails, as an email missing a block shouldn't be sent: the plain text too (it was
  // empty, without an error).
  it("fails renderToHtml, renderToJson and renderToPlainText", async () => {
    const { renderToPlainText } = await import("./render-to-html");
    const Missing = undefined as unknown as React.ComponentType;
    const email = <Email><Row><Column><Paragraph>Hi</Paragraph><Missing /></Column></Row></Email>;
    for (const render of [renderToHtml, renderToJson, renderToPlainText]) expect(() => render(email)).toThrow(/Element type is invalid/);
  });
});

describe("a Row whose Columns don't fit its layout", () => {
  // As in 0.1.22: the body says so (console.error) and renders without its rows; renderToHtml and renderToPlainText
  // don't throw (a mailer that never expected them to would fail).
  it("renders without its rows, in the HTML and the plain text alike", async () => {
    const { renderToPlainText } = await import("./render-to-html");
    const { ColumnLayouts } = await import("../index");
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const email = <Email><Row><Column><Paragraph>Kept?</Paragraph></Column></Row><Row layout={ColumnLayouts.TwoEqual}><Column><Paragraph>One</Paragraph></Column></Row></Email>;
      expect(renderToHtml(email)).toMatch(/^<!DOCTYPE/);
      expect(renderToPlainText(email)).toBe("");
      expect(error.mock.calls.some((call) => String(call[0]).includes("Body: Failed to render children"))).toBe(true);
    } finally {
      error.mockRestore();
    }
  });
});

describe("an app's own react-dom/server render of an email, with a Context Provider around it", () => {
  // The web exporters of these blocks render with react-dom/server themselves: rendered with another module, the
  // app's render couldn't restore its context ("Tried to pop a Context at the root of the app").
  it("renders, as in 0.1.22", async () => {
    const { Page, Divider, Html, Menu, Social } = await import("../index");
    const Theme = React.createContext("light");
    const html = renderToString(
      <Theme.Provider value="dark">
        <Page><Row><Column>
          <Paragraph>Hello</Paragraph>
          <Divider />
          <Html html="<b>kept</b>" />
          <Menu items={[{ text: "Home", href: "https://example.com" }]} />
          <Social icons={{ iconType: "circle", icons: [{ name: "Facebook", url: "https://facebook.com" }] } as never} />
        </Column></Row></Page>
      </Theme.Provider>
    );
    expect(html).toContain("Hello");
    expect(html).toContain("<b>kept</b>");
    expect(html).toContain("Home");
  });
});

describe("markup beside or around a Row's Columns", () => {
  // The Row says markup isn't a Column, and renders its Columns with their widths: each takes its place among the
  // Columns (they took one among all the children, so the ones after markup got no cell: `width="NaN"`). An Outlook
  // comment a component renders in a Row (an MSO table opened for Outlook) keeps the Columns after it, as in 0.1.22.
  it("keeps the Columns, with their widths, in the HTML and the design alike", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const Mso = () => <div dangerouslySetInnerHTML={{ __html: "<!--[if mso]><table><tr><td><![endif]-->" }} />;
      const Wrapped = () => <div><Column><Paragraph>A</Paragraph></Column><Column><Paragraph>B</Paragraph></Column></div>;
      for (const row of [
        <Row><Mso /><Column><Paragraph>A</Paragraph></Column><Column><Paragraph>B</Paragraph></Column></Row>,
        <Row><div><Column><Paragraph>A</Paragraph></Column><Column><Paragraph>B</Paragraph></Column></div></Row>,
        <Row><Wrapped /></Row>,
      ]) {
        const email = <Email>{row}</Email>;
        const html = renderToHtml(email);
        expect(html).not.toContain("NaN");
        expect(html).toMatch(/>\s*A\s*</);
        expect(html).toMatch(/>\s*B\s*</);
        const design = renderToJson(email);
        expect([design.body.rows[0].cells, design.body.rows[0].columns.length]).toEqual([[1, 1], 2]);
      }
      expect(warn.mock.calls.some((call) => String(call[0]).includes("is not a valid Row child"))).toBe(true);
    } finally {
      warn.mockRestore();
    }
  });
});

