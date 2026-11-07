/**
 * Templates with components of the user's own, and Elements called from an app that renders on the client (a live
 * preview): each component keeps its own hooks and ids, and the app's hooks keep working after Elements' render.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import React, { act, useId, useMemo, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Email, Html, Text, outline, render, type RenderResult } from "../primitives/index";
import { toDesign } from "../builder/index";

// Renders run inside act(), as React's testing setup expects.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;
let host: HTMLElement | undefined;
afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = host = undefined;
});

describe("components of a template, rendered once", () => {
  it("give useId() values that don't repeat the template's", async () => {
    function Badge() {
      const id = useId();
      return <Html><span id={id}>badge</span></Html>;
    }
    function Welcome() {
      const id = useId();
      return (
        <Email>
          <Html><span id={id}>welcome</span></Html>
          <Badge />
        </Email>
      );
    }
    const ids = [...(await render(<Welcome />)).html.matchAll(/<span id="([^"]+)">/g)].map((m) => m[1]);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });

  it("show state a component sets while rendering, once, and take no id from a block after it", async () => {
    function Counter({ label }: { label: string }) {
      const [n, setN] = useState(0);
      if (n < 2) setN(n + 1);
      return <Text>{`${label} n=${n}`}</Text>;
    }
    const email = (
      <Email>
        <Counter label="first" />
        <Text id="after">after</Text>
        <Counter label="last" />
      </Email>
    );
    // React runs those renders again: what they wrote the first time isn't written twice.
    expect((await render(email)).text).toBe("first n=2\n\nafter\n\nlast n=2");
    expect(outline(email).match(/n=\d/g)).toEqual(["n=2", "n=2"]);
    expect(JSON.stringify(toDesign(email).design).match(/n=\d/g)).toEqual(["n=2", "n=2"]);
  });
});

describe("an app that renders on the client (a live preview)", () => {
  it("works out the template's design, layout and HTML while it renders, and uses hooks after", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      let rendered: Promise<RenderResult> | undefined;
      const template = <Email><Text>Previewed</Text></Email>;
      function Preview({ zoom }: { zoom: number }) {
        const { design } = useMemo(() => toDesign(template), []);
        const laidOut = useMemo(() => outline(template), []);
        rendered = useMemo(() => render(template), []);
        const [label] = useState("rows");
        return <p>{`${design.body.rows.length} ${label}, ${laidOut.includes("Previewed")}, zoom=${zoom}`}</p>;
      }
      host = document.createElement("div");
      document.body.appendChild(host);
      root = createRoot(host);
      act(() => root!.render(<Preview zoom={1} />));
      expect(host.textContent).toBe("1 rows, true, zoom=1");
      // Rendered again with new props, the hooks keep their state.
      act(() => root!.render(<Preview zoom={2} />));
      expect(host.textContent).toBe("1 rows, true, zoom=2");
      expect((await rendered!).text).toBe("Previewed");
      expect(errors).not.toHaveBeenCalled();
    } finally {
      errors.mockRestore();
    }
  });
});
