/**
 * One render never leaks into the next: data read by a component, an element kept between renders, and the order
 * renders run in don't carry over, and the same input always gives the same output. render(), validate(),
 * outline() and toDesign() collect a template with one React render each (src/primitives/collect.tsx), in a scope
 * of their own (src/utils/render-scope.ts).
 */
import { describe, expect, it, vi } from "vitest";
import React, { memo, useId, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Email, Html, Page, Paragraph, outline, prepare, render, validate } from "../primitives/index";
import { toDesign } from "../builder/index";

let user = "Alice";
const Greeting = () => <Paragraph>Hi {user}</Paragraph>;
const MemoGreeting = memo(Greeting);
const HookGreeting = () => {
  const [prefix] = useState("Hello");
  return <Paragraph>{prefix} {user}</Paragraph>;
};
const kept = { plain: <Greeting />, memo: <MemoGreeting />, hooks: <HookGreeting />, fragment: <><Greeting /></> };

/** Everything a template becomes: its HTML, plain text, layout and design. */
const outputs = async (template: () => React.ReactElement) => {
  const { html, text } = await render(template());
  return [html, text, outline(template()), JSON.stringify(toDesign(template()).design)];
};

describe.each(Object.keys(kept) as Array<keyof typeof kept>)("an element kept between renders (%s)", (kind) => {
  it("shows the data of each render", async () => {
    for (const name of ["Alice", "Bob", "Carol"]) {
      user = name;
      for (const output of await outputs(() => <Email>{kept[kind]}</Email>)) {
        expect(output).toContain(name);
        for (const other of ["Alice", "Bob", "Carol"].filter((n) => n !== name)) expect(output).not.toContain(other);
      }
    }
  });
});

describe("renders", () => {
  const first = () => <Email previewText="First"><Paragraph>First email</Paragraph></Email>;
  const second = () => <Page><Paragraph style={{ textAlign: "center" }}>Second page</Paragraph><Paragraph>And more</Paragraph></Page>;

  it("give the same output for the same input, every time", async () => {
    user = "Alice";
    for (const make of [first, second, () => <Email>{kept.plain}{kept.hooks}</Email>]) expect(await outputs(make)).toEqual(await outputs(make));
  });

  it("don't depend on what was rendered before, in any order", async () => {
    const alone = { first: await outputs(first), second: await outputs(second) };
    toDesign(first());
    expect(await outputs(second)).toEqual(alone.second);
    await render(second());
    validate(second());
    expect(await outputs(first)).toEqual(alone.first);
    outline(first());
    expect(await outputs(second)).toEqual(alone.second);
  });
});

describe("useId() in components", () => {
  // A component that links to its own anchor, as a table of contents or a form label does.
  const Anchor = ({ to }: { to: string }) => {
    const id = useId();
    return (
      <Html>
        <a id={id} href={to}>
          {to}
        </a>
      </Html>
    );
  };
  const email = () => (
    <Email>
      <Anchor to="/one" />
      <Anchor to="/two" />
      <Anchor to="/three" />
    </Email>
  );
  const ids = (html: string) => [...html.replace(/\\"/g, '"').matchAll(/<a id="([^"]+)"/g)].map((m) => m[1]);

  it("gives each component its own ids", async () => {
    for (const html of [(await render(email())).html, JSON.stringify(toDesign(email()).design)]) {
      const found = ids(html);
      expect(found).toHaveLength(3);
      expect(new Set(found).size).toBe(3);
    }
  });

  it("gives an element placed twice its own ids in each place", async () => {
    const anchor = <Anchor to="/again" />;
    const found = ids((await render(<Email>{anchor}{anchor}<Anchor to="/one" /></Email>)).html);
    expect(found).toHaveLength(3);
    expect(new Set(found).size).toBe(3);
  });

  it("gives the same ids on every render", async () => {
    expect(ids((await render(email())).html)).toEqual(ids((await render(email())).html));
    expect(JSON.stringify(toDesign(email()).design)).toBe(JSON.stringify(toDesign(email()).design));
  });

  it("gives template components inside each other their own ids", async () => {
    const Inner = ({ outer }: { outer: string }) => {
      const id = useId();
      return (
        <Email>
          <Html>
            <a id={outer} href="/outer">outer</a>
            <a id={id} href="/inner">inner</a>
          </Html>
        </Email>
      );
    };
    const Outer = () => <Inner outer={useId()} />;
    const found = ids((await render(<Outer />)).html);
    expect(found).toHaveLength(2);
    expect(new Set(found).size).toBe(2);
  });
});

describe("a component that renders while the template is collected", () => {
  const Count = ({ n }: { n: number }) => {
    const [value] = useState(n);
    return <Paragraph>{`Count ${value}`}</Paragraph>;
  };

  it("renders when it runs a render of react-dom's own before its hooks (as email libraries do)", async () => {
    const Late = () => {
      const bold = renderToStaticMarkup(<b>bold</b>);
      const [text] = useState("Still here");
      return <Paragraph>{`${text} ${bold.length}`}</Paragraph>;
    };
    const email = () => <Email><Paragraph>First</Paragraph><Late /><Count n={2} /></Email>;
    expect((await render(email())).text).toBe("First\n\nStill here 11\n\nCount 2");
    expect(JSON.stringify(toDesign(email()).design)).toContain("Still here 11");
  });

  it("leaves the components after it, and their hooks, as they were", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const Bold = () => <Html html={renderToStaticMarkup(<b>Bold bit</b>)} />;
      const email = <Email><Count n={1} /><Bold /><Count n={2} /><Bold /><Count n={3} /></Email>;
      const { html, text } = await render(email);
      for (const words of ["Count 1", "Count 2", "Count 3"]) expect(text.split(words).length - 1, words).toBe(1);
      expect(html.split("Bold bit").length - 1).toBe(2);
      expect(error).not.toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });
});

describe("a render", () => {
  // A prerendered page that reads one of these changes with each build: Next.js's Cache Components (its new apps'
  // default since 16) fail the build on one. 0.2.0 asked crypto.getRandomValues() for each render's nonce, so no
  // email could be rendered in a page Next.js prerenders.
  it("reads no random numbers and not the date", async () => {
    const sources: Array<[object, string]> = [[globalThis.crypto, "getRandomValues"], [globalThis.crypto, "randomUUID"], [Math, "random"], [Date, "now"]];
    const spies = sources.filter(([owner, name]) => typeof (owner as Record<string, unknown>)?.[name] === "function").map(([owner, name]) => vi.spyOn(owner as any, name as any));
    expect(spies).toHaveLength(4);
    try {
      const email = () => (
        <Email previewText="Hi">
          {kept.hooks}
          <Paragraph>Text</Paragraph>
          <Html html="<p>Kept</p>" />
        </Email>
      );
      await render(email());
      validate(email());
      outline(email());
      prepare(email());
      toDesign(email());
      for (const spy of spies) expect(spy).not.toHaveBeenCalled();
    } finally {
      for (const spy of spies) spy.mockRestore();
    }
  });

  // Its nonce comes from the clock and a count of renders: where the clock stands still (fake timers) or there's
  // none, a template renders as it does with one, and so does a template worked out inside a component of it.
  it("renders the same where the clock stands still or there's none", async () => {
    const Inner = () => {
      const inner = outline(<Email><Paragraph>Inner email</Paragraph></Email>);
      return <Paragraph>{inner.includes("Inner email") ? "Inner ok" : "Inner missing"}</Paragraph>;
    };
    const email = () => <Email><Paragraph>Outer</Paragraph><Inner /></Email>;
    const expected = await outputs(email);
    expect(expected[1]).toContain("Inner ok");
    const now = vi.spyOn(performance, "now").mockReturnValue(1000);
    try {
      expect(await outputs(email)).toEqual(expected);
    } finally {
      now.mockRestore();
    }
    const clock = Object.getOwnPropertyDescriptor(globalThis, "performance")!;
    delete (globalThis as { performance?: unknown }).performance;
    try {
      expect(globalThis.performance).toBeUndefined();
      expect(await outputs(email)).toEqual(expected);
    } finally {
      Object.defineProperty(globalThis, "performance", clock);
    }
  });
});
