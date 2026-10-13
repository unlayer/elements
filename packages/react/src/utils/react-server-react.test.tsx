/**
 * Where React is React Server Components' (Next.js's edge runtime route handlers and Server Components), react-dom
 * can't render at all ("Cannot read properties of undefined (reading 'H')"): Elements says to render in the
 * Node.js runtime. react-dom/server here fails as it does there.
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("react-dom/server", async (original) => {
  const real = await original<typeof import("react-dom/server")>();
  const fail = (): never => {
    throw new TypeError("Cannot read properties of undefined (reading 'H')");
  };
  return { ...real, renderToStaticMarkup: fail, renderToString: fail };
});

import React from "react";
import { Email, Row, Column, Paragraph, renderToHtml, renderToJson, renderToPlainText } from "../index";

describe("React Server Components' React, which react-dom can't render with", () => {
  it("says to render in the Node.js runtime, with react-dom's error as the cause", () => {
    const email = <Email><Row><Column><Paragraph>Hello</Paragraph></Column></Row></Email>;
    for (const render of [renderToJson, renderToHtml, renderToPlainText]) {
      let thrown: unknown;
      try {
        render(email);
      } catch (error) {
        thrown = error;
      }
      expect(String((thrown as Error)?.message)).toMatch(/react-dom can't render with this React.*render emails in the Node\.js runtime/);
      expect(String(((thrown as Error).cause as Error)?.message)).toContain("reading 'H'");
    }
    expect(React.isValidElement(email)).toBe(true);
  });
});
