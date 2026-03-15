// @vitest-environment node

/**
 * Verifies the package works in a plain Node.js environment (no jsdom,
 * no browser APIs). Catches module-level calls to client-only APIs like
 * createContext that would break Next.js Server Components or SSR runtimes.
 */

import { describe, it, expect } from "vitest";
import React from "react";

describe("Node environment (no jsdom)", () => {
  it("imports without calling createContext at module level", async () => {
    const mod = await import("./index");

    expect(mod.Button).toBeDefined();
    expect(mod.Body).toBeDefined();
    expect(mod.Row).toBeDefined();
    expect(mod.Column).toBeDefined();
    expect(mod.renderToHtml).toBeDefined();
    expect(mod.UnlayerProvider).toBeDefined();
  });

  it("renderToHtml produces HTML", async () => {
    const { renderToHtml, Body, Row, Column, Paragraph } = await import("./index");

    const html = renderToHtml(
      React.createElement(Body, null,
        React.createElement(Row, null,
          React.createElement(Column, null,
            React.createElement(Paragraph, { mode: "web" }, "Hello from Node")
          )
        )
      ),
      { mode: "web" }
    );

    expect(html).toContain("Hello from Node");
    expect(typeof html).toBe("string");
  });

  it("renderToJson produces DesignJSON", async () => {
    const { renderToJson, Body, Row, Column, Button } = await import("./index");

    const json = renderToJson(
      React.createElement(Body, null,
        React.createElement(Row, null,
          React.createElement(Column, null,
            React.createElement(Button, { mode: "web" }, "Click")
          )
        )
      )
    );

    expect(json).toHaveProperty("body");
    expect(json).toHaveProperty("body.rows");
    expect(json.body.rows).toHaveLength(1);
    expect(json.body.rows[0].columns[0].contents).toHaveLength(1);
  });

  it("renderToPlainText produces text", async () => {
    const { renderToPlainText, Body, Row, Column, Paragraph } = await import("./index");

    const text = renderToPlainText(
      React.createElement(Body, null,
        React.createElement(Row, null,
          React.createElement(Column, null,
            React.createElement(Paragraph, { mode: "web" }, "Plain text test")
          )
        )
      )
    );

    expect(typeof text).toBe("string");
  });
});
