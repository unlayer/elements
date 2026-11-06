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
import { Email, Paragraph, outline, prepare, render, validate } from "../primitives/index";
import { toDesign } from "../builder/index";

describe("React Server Components' React, which react-dom can't render with", () => {
  it("says to render in the Node.js runtime, with react-dom's error as the cause", async () => {
    const email = (
      <Email>
        <Paragraph>Hello</Paragraph>
      </Email>
    );
    const thrown: unknown[] = [await render(email).catch((error: unknown) => error)];
    for (const run of [validate, outline, prepare, toDesign]) {
      try {
        run(email);
      } catch (error) {
        thrown.push(error);
      }
    }
    expect(thrown).toHaveLength(5);
    for (const error of thrown) {
      expect(String((error as Error)?.message)).toMatch(/react-dom can't render with this React.*render emails in the Node\.js runtime/);
      expect(String(((error as Error).cause as Error)?.message)).toContain("reading 'H'");
    }
    expect(React.isValidElement(email)).toBe(true);
  });
});
