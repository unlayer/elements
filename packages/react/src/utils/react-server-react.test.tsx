/**
 * Where React is React Server Components' (Next.js's App Router route handlers and Server Components on the edge
 * runtime), react-dom can't render at all ("Cannot read properties of undefined (reading 'H')"). Elements renders
 * templates with react-dom/server, as React Email does, so it can't render an email there either: every renderer says
 * so by name, and what to do, never with react-dom's own error.
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("react-dom/server", async (original) => {
  const real = await original<typeof import("react-dom/server")>();
  const fail = (): never => {
    throw new TypeError("Cannot read properties of undefined (reading 'H')");
  };
  return { ...real, renderToStaticMarkup: fail, renderToString: fail, renderToPipeableStream: fail, renderToReadableStream: fail };
});

import React, { useId, useMemo } from "react";
import { Email, Row, Column, Paragraph, Button, RenderError, renderToHtml, renderToJson, renderToPlainText } from "../index";
import * as asyncRenderers from "../async";

describe("React Server Components' React, which react-dom can't render with", () => {
  it("fails each render with a RenderError that says Elements renders with react-dom, and where to render instead", async () => {
    const Greeting = () => <Paragraph>{`Hello ${useMemo(() => "Ada", [])} ${useId()}`}</Paragraph>;
    const Welcome = () => <Email><Row><Column><Greeting /><Button href="https://example.com">Go</Button></Column></Row></Email>;
    const email = <Email><Row><Column><Greeting /><Button href="https://example.com">Go</Button></Column></Row></Email>;
    const said = /react-dom\/server, as React Email does, and react-dom can't render with React Server Components' React .*render it in the Node\.js runtime/;
    for (const template of [email, <Welcome key="w" />]) {
      for (const render of [renderToHtml, renderToPlainText, renderToJson]) {
        let thrown: unknown;
        try {
          render(template);
        } catch (error) {
          thrown = error;
        }
        expect(thrown).toBeInstanceOf(RenderError);
        expect((thrown as Error).message).toMatch(said);
        expect((thrown as Error).message).not.toContain("reading 'H'");
        expect((thrown as { cause?: Error }).cause?.message).toBe("Cannot read properties of undefined (reading 'H')");
      }
      await expect(asyncRenderers.renderToHtml(template)).rejects.toThrow(said);
    }
    expect(React.isValidElement(email)).toBe(true);
  });
});
