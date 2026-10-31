/**
 * Elements' probes of react-dom (whether it renders here, whether there's one copy of React), each found once in a
 * process, here first asked at the end of the call stack: in a spec of its own, so nothing has asked them yet (vitest
 * gives each file its own modules).
 */
import React from "react";
import { describe, expect, it } from "vitest";
import { Column, Email, Paragraph, Row, renderToHtml } from "../index";
import * as asyncRenderers from "../async";
import { oneReact, reactDomRenders } from "../engine/react-dom";

/** `probe` called as deep in the call stack as it runs: from the deepest frame where it returns. */
function atStackEnd(probe: () => unknown): void {
  const down = (): void => {
    try {
      down();
    } catch {
      probe();
    }
  };
  down();
}

describe("react-dom's probes, first asked at the end of the call stack", () => {
  it("keep no answer of a probe that ran out of stack: later renders, any tenant's, render as in any process", async () => {
    // A probe that ran out of stack (a render deep in a server's middleware) kept `false`: every render after it, of
    // every tenant, said react-dom can't render here (React Server Components' React), or that a part that failed
    // was another copy of React's, till the process restarted.
    atStackEnd(() => reactDomRenders());
    atStackEnd(() => oneReact());
    expect(reactDomRenders()).toBe(true);
    expect(oneReact()).toBe(true);
    const Fails = () => {
      throw new Error("a section failed");
    };
    expect(() => renderToHtml(<Email><Row><Column><Fails /></Column></Row></Email>)).toThrow("[Unlayer] a section failed (in <Fails>");
    expect(await asyncRenderers.renderToHtml(<Email><Row><Column><Paragraph>Another tenant</Paragraph></Column></Row></Email>)).toContain("Another tenant");
  });
});
