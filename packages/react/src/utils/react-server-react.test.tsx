/**
 * Where React is React Server Components' (Next.js's edge runtime route handlers and Server Components), react-dom
 * can't render at all ("Cannot read properties of undefined (reading 'H')"). Elements renders templates itself
 * (src/engine), so an email renders there: react-dom/server here fails as it does there. (A web page's or document's
 * Divider, Html, Menu and Social exporters still render with react-dom/server.)
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("react-dom/server", async (original) => {
  const real = await original<typeof import("react-dom/server")>();
  const fail = (): never => {
    throw new TypeError("Cannot read properties of undefined (reading 'H')");
  };
  return { ...real, renderToStaticMarkup: fail, renderToString: fail };
});

import React, { useId, useMemo } from "react";
import { Email, Row, Column, Paragraph, Button, renderToHtml, renderToJson, renderToPlainText } from "../index";

describe("React Server Components' React, which react-dom can't render with", () => {
  it("renders an email, hooks and all, without react-dom", () => {
    const Greeting = () => <Paragraph>{`Hello ${useMemo(() => "Ada", [])} ${useId()}`}</Paragraph>;
    const email = <Email><Row><Column><Greeting /><Button href="https://example.com">Go</Button></Column></Row></Email>;
    expect(renderToHtml(email)).toMatch(/Hello Ada (:R\w+:|«R\w+»|_R_\w+_)/);
    expect(renderToPlainText(email)).toContain("Hello Ada");
    expect(renderToJson(email).body.rows).toHaveLength(1);
    expect(React.isValidElement(email)).toBe(true);
  });
});
