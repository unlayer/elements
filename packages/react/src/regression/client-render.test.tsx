/**
 * User components among an email's blocks, rendered on the client (a live
 * preview re-renders the email): each keeps its own hooks, as when React
 * renders it, whatever is added, removed or moved around it.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import React, { act, useId, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Column, Email, Html, Paragraph, Row, renderToHtml, renderToPlainText } from "../index";

// Renders run inside act(), as React's testing setup expects.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;
let host: HTMLElement | undefined;
afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = host = undefined;
});

/** Renders on the client and returns the text it shows each time `next` is called with new props. */
function mount<P extends object>(Template: (props: P) => React.ReactElement) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  return (props: P) => {
    act(() => root!.render(<Template {...props} />));
    const shown = host!.cloneNode(true) as HTMLElement;
    shown.querySelectorAll("style, title").forEach((node) => node.remove());
    return (shown.textContent ?? "").replace(/\s+/g, " ").trim();
  };
}

function Banner() {
  const [text] = useState("BANNER");
  return <Row><Column><Paragraph>{text}</Paragraph></Column></Row>;
}
function Footer() {
  const [text] = useState("FOOTER");
  return <Row><Column><Paragraph>{text}</Paragraph></Column></Row>;
}

describe("components among the email's rows, on the client", () => {
  it("one shown under a condition: each render shows what React shows, with no hook errors", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const show = mount(({ banner }: { banner: boolean }) => (
      <Email>{banner && <Banner />}<Row><Column><Paragraph>MAIN COPY</Paragraph></Column></Row><Footer /></Email>
    ));
    expect([show({ banner: false }), show({ banner: true }), show({ banner: false })]).toEqual(["MAIN COPY FOOTER", "BANNER MAIN COPY FOOTER", "MAIN COPY FOOTER"]);
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });

  it("a keyed list with state, reordered: each item keeps its own", () => {
    function Item({ name }: { name: string }) {
      const [label] = useState(() => name.toUpperCase());
      return <Row><Column><Paragraph>{label}</Paragraph></Column></Row>;
    }
    const show = mount(({ items }: { items: string[] }) => <Email>{items.map((name) => <Item key={name} name={name} />)}</Email>);
    expect(show({ items: ["apple", "banana"] })).toBe("APPLE BANANA");
    expect(show({ items: ["banana", "apple"] })).toBe("BANANA APPLE");
  });
});

describe("components among the email's rows, rendered once", () => {
  it("give useId() values that don't repeat the template's", () => {
    function Badge() {
      const id = useId();
      return <Row><Column><Html html={`<span id="${id}">badge</span>`} /></Column></Row>;
    }
    function Welcome() {
      const id = useId();
      return <Email><Row><Column><Html html={`<span id="${id}">welcome</span>`} /></Column></Row><Badge /></Email>;
    }
    const ids = [...renderToHtml(<Welcome />).matchAll(/<span id="([^"]+)">/g)].map((m) => m[1]);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });

  it("show state a component sets while rendering, among the rows and in a column", () => {
    function Counter({ label }: { label: string }) {
      const [n, setN] = useState(0);
      if (n < 2) setN(n + 1);
      return <Paragraph>{`${label} n=${n}`}</Paragraph>;
    }
    const AsRow = () => <Row><Column><Counter label="row" /></Column></Row>;
    function InColumn() {
      const [n, setN] = useState(0);
      if (n < 2) setN(n + 1);
      return <Paragraph>{`col n=${n}`}</Paragraph>;
    }
    const email = <Email><AsRow /><Row><Column><InColumn /><Paragraph>after</Paragraph></Column></Row></Email>;
    expect(renderToPlainText(email)).toContain("row n=2");
    expect(renderToPlainText(email)).toContain("col n=2");
    // The column's blocks keep their ids when React runs its render again.
    const ids = [...renderToHtml(email).matchAll(/id="(u_[a-z_]+_\d+)"/g)].map((m) => m[1]);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
