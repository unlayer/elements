/**
 * Elements' probes for a render inside another (another module of react-dom's, whether react-dom/server's is calling
 * a component, what `use()` throws), each found once in a process, here first
 * asked at the end of the call stack: in a spec of its own, so nothing has asked them yet (vitest gives each file its
 * own modules). See stack-limit-probes.test.tsx for react-dom's own.
 */
import React, { useMemo, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Column, Email, Paragraph, Row, renderToHtml, renderToPlainText } from "../index";
import { staticSuspension } from "../engine/react-dom";

/** `run` called as deep in the call stack as it runs: from the deepest frame where it returns, what it threw on the way left. */
function atStackEnd(run: () => unknown): void {
  const down = (): void => {
    try {
      down();
    } catch {
      run();
    }
  };
  try {
    down();
  } catch {
    // (Where it never ran whole: what's asked after says whether a probe kept an answer it found out of stack.)
  }
}

const inner = <Email><Row><Column><Paragraph>Your order shipped</Paragraph></Column></Row></Email>;

describe("the probes for a render inside another, first asked at the end of the call stack", () => {
  it("keep no answer for what `use()` throws found out of stack", () => {
    atStackEnd(() => staticSuspension());
    // (React 18 has no `use()`: there's nothing to find.)
    if (typeof (React as unknown as { use?: unknown }).use === "function") expect(staticSuspension()).toBeDefined();
  });

  it("keep no answer for another module of react-dom's found out of stack: a template's own render in its component renders after", () => {
    // A nested render that ran out of stack looking for another module kept none: every template's own render inside
    // its component, any tenant's, failed after it, till the process restarted.
    const Preview = () => <Paragraph>{`Preview: ${renderToPlainText(inner).trim()}`}</Paragraph>;
    const outer = <Email><Row><Column><Preview /></Column></Row></Email>;
    atStackEnd(() => renderToHtml(outer));
    expect(renderToHtml(outer)).toContain("Preview: Your order shipped");
  });

  it("keep no answer for whether an app's renderToString is calling a component, found out of stack: a template rendered there renders after", () => {
    // Kept, a "free" told out of stack had every template rendered in an app's renderToString render with the module
    // calling the app's component: that component's hooks after it broke.
    const Mail = () => {
      const html = useMemo(() => renderToHtml(inner), []);
      const [open] = useState(false);
      return <div data-open={String(open)} dangerouslySetInnerHTML={{ __html: html }} />;
    };
    atStackEnd(() => renderToString(<Mail />));
    expect(renderToString(<Mail />)).toMatch(/^<div data-open="false">.*Your order shipped/s);
  });
});
