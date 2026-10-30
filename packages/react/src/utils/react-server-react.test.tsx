/**
 * Where React is React Server Components' (Next.js's App Router route handlers and Server Components on the edge
 * runtime), react-dom can't render at all ("Cannot read properties of undefined (reading 'H')"). Elements renders
 * templates with react-dom/server, as React Email does, so it can't render an email there either: every renderer says
 * so by name, and what to do, never with react-dom's own error.
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("react-dom/server", async (original) => {
  const real = await original<typeof import("react-dom/server")>();
  const error = () => new TypeError("Cannot read properties of undefined (reading 'H')");
  const fail = (): never => {
    throw error();
  };
  // (Its streams start and throw later, in the work they scheduled, where nothing catches it, and never settle.)
  const later = () => {
    setTimeout(() => {
      throw error();
    });
    return { pipe() {}, abort() {} };
  };
  return { ...real, renderToStaticMarkup: fail, renderToString: fail, renderToPipeableStream: later, renderToReadableStream: () => (later(), new Promise(() => {})) };
});

import React, { useId, useMemo } from "react";
import { Email, Row, Column, Paragraph, Button, RenderError, renderToHtml, renderToJson, renderToPlainText } from "../index";
import * as asyncRenderers from "../async";
import * as tailwind from "../tailwind";

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

  it("fails each async render (and the Tailwind entry's) the same way, with nothing thrown where it can't be caught", async () => {
    const said = /react-dom\/server, as React Email does, and react-dom can't render with React Server Components' React .*render it in the Node\.js runtime/;
    const email = <Email><Row><Column><Paragraph>Hello</Paragraph></Column></Row></Email>;
    const renders = [
      asyncRenderers.renderToHtml(email),
      asyncRenderers.renderToPlainText(email),
      asyncRenderers.renderToJson(email),
      asyncRenderers.renderToHtmlParts(email),
      tailwind.renderToHtml(<tailwind.Tailwind config={{}}>{email}</tailwind.Tailwind>),
    ];
    for (const render of renders) await expect(render).rejects.toMatchObject({ name: "RenderError", message: expect.stringMatching(said) });
    // (What a stream would throw in the work it scheduled comes after its render starts.)
    await new Promise((done) => setTimeout(done, 20));
  });
});
