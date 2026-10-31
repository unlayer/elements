/**
 * The first async render of a process, in a spec of its own: vitest gives each file its own modules, so the render
 * here is the first, which finds React's suspension before it reaches the template (see engine/react-dom.ts's
 * streamSuspension), a render and a macrotask of its own.
 */
import React from "react";
import { describe, expect, it } from "vitest";
import { Column, Email, Heading, Paragraph, Row } from "../index";
import { renderToHtml } from "./index";

const use = (React as unknown as { use?: (usable: PromiseLike<unknown>) => unknown }).use;

describe("the first async render of a process", () => {
  // React 18 has no use(): a component that throws a promise is its own (react-dom's render ends the process alike).
  it.skipIf(!use)("handles a promise given as a prop at once: one that fails before the template is reached fails the render, not the process", async () => {
    // A rejection nothing handled yet when the template's component came to `use()` it, a few milliseconds after the
    // render started: Node.js ended the process (and every render in it), where react-dom's own render handles it.
    const unhandled: unknown[] = [];
    const listen = (reason: unknown) => void unhandled.push(reason);
    process.on("unhandledRejection", listen);
    try {
      const orders = Promise.reject(new Error("orders API down"));
      const Orders = ({ orders }: { orders: Promise<string> }) => <Paragraph>{String(use!(orders))}</Paragraph>;
      const email = (
        <Email>
          <Row>
            <Column>
              <Heading>Orders</Heading>
              <React.Suspense fallback={null}>
                <Orders orders={orders} />
              </React.Suspense>
            </Column>
          </Row>
        </Email>
      );
      const failed = await renderToHtml(email).catch((error: unknown) => error);
      await new Promise((done) => setTimeout(done, 20));
      expect(unhandled).toEqual([]);
      expect(failed).toMatchObject({ cause: new Error("orders API down") });
    } finally {
      process.off("unhandledRejection", listen);
    }
  });
});
