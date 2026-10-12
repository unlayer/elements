/**
 * Elements' renders inside another React render: an app page that renders on the server and works out its
 * design or HTML while it renders (`useMemo(() => renderToJson(<T />))`), and a template's component that does.
 * React keeps a render's hook state in its module, so a render started inside another one with the same module
 * broke the hooks the outer component called after it (see server-renderer.ts).
 */
import { describe, it, expect, vi } from "vitest";
import React, { useMemo, useState } from "react";
import { renderToString } from "react-dom/server";
/// <reference path="../types/react-dom-server-browser.d.ts" />
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

describe("a page that renders with react-dom's browser build (react-dom/server.browser, as Elements' own render)", () => {
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

  it("can't nest one more: that component is left out, named, and the rest renders", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      function Deepest() {
        renderToJson(<Template />);
        return <div>never shown</div>;
      }
      function Deeper() {
        const html = renderToHtml(<Email><Row><Column><Deepest /></Column></Row></Email>);
        return <div dangerouslySetInnerHTML={{ __html: html.includes("never shown") ? "shown" : "left out" }} />;
      }
      const html = renderToHtml(<Email><Row><Column><Paragraph>Outer</Paragraph><Deeper /></Column></Row></Email>);
      expect(html).toContain("Outer");
      expect(html).toContain("left out");
      // Named (the render that explains why calls it once more on its own, where it renders).
      expect(error.mock.calls.some((call) => String(call[0]).includes("<Deepest>"))).toBe(true);
    } finally {
      error.mockRestore();
    }
  });
});
