/**
 * One render never leaks into the next: data read by a component, an element
 * kept between renders, and the order renders run in don't carry over, and the
 * same input always gives the same output.
 *
 *   ISOLATION_RUNS=2000 ISOLATION_SEED=7 pnpm vitest run src/regression/render-isolation.test.tsx
 */
import { describe, expect, it, vi } from "vitest";
import React, { memo, Suspense, useId, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { renderToHtml, renderToHtmlParts, renderToPlainText } from "../utils/render-to-html";
import { renderRowToJson, renderToJson } from "../utils/render-to-json";
import { Email, Page, Row, Column, Paragraph, Html, UnlayerProvider, registerTool } from "../index";
import * as asyncRenderers from "../async";

let user = "Alice";
const Greeting = () => <Row><Column><Paragraph>Hi {user}</Paragraph></Column></Row>;
const MemoGreeting = memo(Greeting);
const HookGreeting = () => {
  const [prefix] = useState("Hello");
  return <Row><Column><Paragraph>{prefix} {user}</Paragraph></Column></Row>;
};
const kept = { plain: <Greeting />, memo: <MemoGreeting />, hooks: <HookGreeting />, fragment: <><Greeting /></> };

describe.each(Object.keys(kept) as Array<keyof typeof kept>)("an element kept between renders (%s)", (kind) => {
  const email = () => <Email>{kept[kind]}</Email>;
  it("shows the data of each render", () => {
    for (const name of ["Alice", "Bob", "Carol"]) {
      user = name;
      const outputs = [renderToHtml(email()), renderToHtmlParts(email()).body, renderToPlainText(email()), JSON.stringify(renderToJson(email()))];
      for (const output of outputs) {
        expect(output).toContain(name);
        for (const other of ["Alice", "Bob", "Carol"].filter((n) => n !== name)) expect(output).not.toContain(other);
      }
    }
  });
});

describe("renders", () => {
  const first = () => <Email previewText="First"><Row><Column><Paragraph>First email</Paragraph></Column></Row></Email>;
  const second = () => <Email><Row><Column><Paragraph textAlign="center">Second email</Paragraph><Paragraph>And more</Paragraph></Column></Row></Email>;

  it("give the same output for the same input, every time", () => {
    user = "Alice";
    for (const make of [first, second, () => <Email>{kept.plain}{kept.hooks}</Email>]) {
      expect(renderToHtml(make())).toBe(renderToHtml(make()));
      expect(JSON.stringify(renderToJson(make()))).toBe(JSON.stringify(renderToJson(make())));
    }
  });

  it("don't depend on what was rendered before, in any order", () => {
    const alone = { first: renderToHtml(first()), second: renderToHtml(second()), design: JSON.stringify(renderToJson(second())) };
    renderToJson(first());
    expect(renderToHtml(second())).toBe(alone.second);
    renderToHtml(second());
    expect(renderToHtml(first())).toBe(alone.first);
    renderToHtmlParts(first());
    expect(JSON.stringify(renderToJson(second()))).toBe(alone.design);
  });
});

describe("useId() in components", () => {
  // A component that links to its own anchor, as a table of contents or a form label does.
  const Section = ({ to }: { to: string }) => {
    const id = useId();
    return <Html html={`<a id="${id}" href="${to}">${to}</a>`} />;
  };
  const SectionRow = ({ to }: { to: string }) => {
    const id = useId();
    return <Row><Column><Html html={`<a id="${id}" href="${to}">${to}</a>`} /></Column></Row>;
  };
  const email = () => (
    <Email>
      <Row><Column><Section to="/one" /><Section to="/two" /></Column></Row>
      <SectionRow to="/three" />
      <SectionRow to="/four" />
    </Email>
  );
  const ids = (html: string) => [...html.matchAll(/<a id="([^"]+)"/g)].map((m) => m[1]);

  it("gives each component its own ids", () => {
    for (const html of [renderToHtml(email()), renderToHtmlParts(email()).body, renderToStaticMarkup(email()), JSON.stringify(renderToJson(email()))]) {
      const found = ids(html.replace(/\\"/g, '"'));
      expect(found).toHaveLength(4);
      expect(new Set(found).size).toBe(4);
    }
  });

  it("gives an element placed twice its own ids in each place", () => {
    const section = <SectionRow to="/again" />;
    const html = renderToHtml(<Email>{section}{section}<Row><Column><Section to="/one" /></Column></Row></Email>);
    const found = ids(html);
    expect(found).toHaveLength(3);
    expect(new Set(found).size).toBe(3);
  });

  it("gives the same ids on every render", () => {
    expect(renderToHtml(email())).toBe(renderToHtml(email()));
    expect(renderToStaticMarkup(email())).toBe(renderToStaticMarkup(email()));
    expect(ids(renderToHtml(email()))).toEqual(ids(renderToStaticMarkup(email())));
    // A row on its own too.
    const row = <Row><Column><Section to="/one" /><Section to="/two" /></Column></Row>;
    expect(JSON.stringify(renderRowToJson(row))).toBe(JSON.stringify(renderRowToJson(row)));
  });

  it("gives template components inside each other their own ids", () => {
    const Inner = ({ outer }: { outer: string }) => {
      const id = useId();
      return <Email><Row><Column><Html html={`<a id="${outer}" href="/outer">outer</a><a id="${id}" href="/inner">inner</a>`} /></Column></Row></Email>;
    };
    const Outer = () => <Inner outer={useId()} />;
    const found = ids(renderToHtml(<Outer />));
    expect(found).toHaveLength(2);
    expect(new Set(found).size).toBe(2);
  });
});

describe("an email rendered inside a component", () => {
  const Count = ({ n }: { n: number }) => {
    const [value] = useState(n);
    return <Paragraph>{`Count ${value}`}</Paragraph>;
  };
  // Renders another email (a signature), with Elements or with react-dom itself.
  const Signature = () => <Html html={renderToHtmlParts(<Email><Row><Column><Paragraph>Signed</Paragraph><Count n={9} /></Column></Row></Email>).body} />;
  const Bold = () => <Html html={renderToStaticMarkup(<b>Bold bit</b>)} />;
  const SignedBy = () => {
    const [who] = useState("Ada");
    return <Html html={renderToHtmlParts(<Email><Row><Column><Paragraph>{`Signed ${who}`}</Paragraph></Column></Row></Email>).body} />;
  };

  it("renders a component that runs a render of react-dom's own before its hooks (as email libraries do)", () => {
    const Late = () => {
      const bold = renderToStaticMarkup(<b>bold</b>);
      const [text] = useState("Still here");
      return <Paragraph>{`${text} ${bold.length}`}</Paragraph>;
    };
    const email = <Email><Row><Column><Paragraph>First</Paragraph><Late /></Column></Row></Email>;
    expect(renderToHtml(email)).toContain("Still here 11");
    expect(JSON.stringify(renderToJson(email))).toContain("Still here 11");
  });

  it("leaves the components after it in the column, and their hooks, as they were", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const email = <Email><Row><Column><Count n={1} /><Signature /><Count n={2} /><SignedBy /><Bold /><Count n={3} /></Column><Column><Count n={4} /></Column></Row></Email>;
      const html = renderToHtml(email);
      for (const text of ["Count 1", "Count 2", "Count 3", "Count 4", "Count 9", "Signed Ada", "Bold bit"]) expect(html.split(text).length - 1, text).toBe(1);
      const design = JSON.stringify(renderToJson(email));
      for (const text of ["Count 1", "Count 2", "Count 3", "Count 4", "Signed Ada"]) expect(design, text).toContain(text);
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
  it("reads no random numbers and not the date", () => {
    const sources: Array<[object, string]> = [[globalThis.crypto, "getRandomValues"], [globalThis.crypto, "randomUUID"], [Math, "random"], [Date, "now"]];
    const spies = sources.filter(([owner, name]) => typeof (owner as Record<string, unknown>)?.[name] === "function").map(([owner, name]) => vi.spyOn(owner as any, name as any));
    expect(spies).toHaveLength(4);
    try {
      const email = () => (
        <Email previewText="Hi">
          {kept.hooks}
          <Row><Column><Paragraph>Text</Paragraph><Html html="<p>Kept</p>" /></Column></Row>
        </Email>
      );
      renderToHtml(email());
      renderToHtmlParts(email());
      renderToPlainText(email());
      renderToJson(email());
      renderRowToJson(<Row><Column><Paragraph>Row</Paragraph></Column></Row>);
      for (const spy of spies) expect(spy).not.toHaveBeenCalled();
    } finally {
      for (const spy of spies) spy.mockRestore();
    }
  });

  // Its nonce comes from the clock and a count of renders: where the clock stands still (fake timers) or there's
  // none, an email renders as it does with one, and so does an email rendered inside a component of it.
  it("renders the same where the clock stands still or there's none", () => {
    const Inner = () => {
      const inner = renderToHtml(<Email><Row><Column><Paragraph>Inner email</Paragraph></Column></Row></Email>);
      return <Html html={inner.includes("Inner email") ? "<p>Inner ok</p>" : "<p>Inner missing</p>"} />;
    };
    const email = () => <Email><Row><Column><Paragraph>Outer</Paragraph><Inner /></Column></Row></Email>;
    const outputs = () => [renderToHtml(email()), JSON.stringify(renderToJson(email())), renderToPlainText(email())];
    const expected = outputs();
    expect(expected[0]).toContain("Inner ok");
    const now = vi.spyOn(performance, "now").mockReturnValue(1000);
    try {
      expect(outputs()).toEqual(expected);
    } finally {
      now.mockRestore();
    }
    const clock = Object.getOwnPropertyDescriptor(globalThis, "performance")!;
    delete (globalThis as { performance?: unknown }).performance;
    try {
      expect(globalThis.performance).toBeUndefined();
      expect(outputs()).toEqual(expected);
    } finally {
      Object.defineProperty(globalThis, "performance", clock);
    }
  });
});

// ── What rendered before ────────────────────────────────────────────────────

/** The text of a component's `useId()` (`uid1 :R5:`), where it shows in the HTML, the plain text and the design. */
const Uid = ({ n }: { n: number }) => <Paragraph>{`uid${n} ${useId()}`}</Paragraph>;
const uids = (output: string) => [...output.matchAll(/uid\d [^<"\\\n]+/g)].map((m) => m[0]);

describe("a root kept between renders, with useId() in its content", () => {
  // A template wrapper that calls useId() moves the ids of the content after it, as React's do. The ids it moved were
  // kept by the root's content, so the root rendered again on its own, or by a wrapper that calls none, had them.
  const content = <Row><Column><Uid n={1} /></Column></Row>;
  const root = <Email>{content}</Email>;
  const Forked = () => (useId(), root);
  const Plain = () => root;

  it("gives the ids of its own render, whatever wrapper returned it before", () => {
    const outputs = () => [renderToHtml(root), renderToHtml(<Plain />), renderToHtmlParts(root).body, renderToPlainText(<Plain />), JSON.stringify(renderToJson(root)), JSON.stringify(renderToJson(<Plain />))];
    const before = outputs();
    const forked = [renderToHtml(<Forked />), JSON.stringify(renderToJson(<Forked />))];
    // (The wrapper's useId() moves the content's.)
    expect(uids(forked[0])).not.toEqual(uids(before[0]));
    expect(uids(forked[1])).toEqual(uids(forked[0]));
    expect(outputs()).toEqual(before);
    expect(new Set(outputs().map((output) => uids(output).join()))).toEqual(new Set([uids(before[0]).join()]));
  });
});

describe("a template whose root's settings can't be read (a <Suspense> around it)", () => {
  it("says so on every render of it, not only the first", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const element = <Suspense><Email><Row><Column><Paragraph>Hi</Paragraph></Column></Row></Email></Suspense>;
      const said = () => warn.mock.calls.filter((call) => String(call[0]).includes("couldn't unwrap")).length;
      const html = renderToHtml(element);
      expect(said()).toBe(1);
      expect(renderToHtml(element)).toBe(html);
      expect(said()).toBe(2);
      renderToHtmlParts(element);
      renderToPlainText(element);
      expect(said()).toBe(4);
    } finally {
      warn.mockRestore();
    }
  });
});

describe("a root kept between renders, under an <UnlayerProvider config> in one of them", () => {
  it("has that config in that render only", () => {
    const root = <Email><Row><Column><Uid n={1} /></Column></Row></Email>;
    const Provided = () => <UnlayerProvider config={{ textDirection: "rtl", idPrefix: "p-" }}>{root}</UnlayerProvider>;
    const outputs = () => [renderToHtml(root), JSON.stringify(renderToJson(root))];
    const before = outputs();
    const provided = [renderToHtml(<Provided />), JSON.stringify(renderToJson(<Provided />))];
    expect(provided[0]).toContain('dir="rtl"');
    expect(uids(provided[0])[0]).toContain("p-");
    expect(provided[1]).toContain('"textDirection":"rtl"');
    expect(outputs()).toEqual(before);
    expect(before[0]).not.toContain('dir="rtl"');
  });
});

/** A seeded random number generator (mulberry32): the same templates and order every run. */
function random(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return { next, pick: <T,>(list: readonly T[]) => list[Math.floor(next() * list.length)] };
}

describe("templates that share elements kept between renders, at random", () => {
  // The kept elements renders shared what they found in (a root and its content, an <UnlayerProvider> around it), in
  // templates with and without wrappers that call useId(), a custom tool with a head, a block whose exporter fails, and
  // each renderer's options. Each template's output, and what each render says, is the one its first render gave,
  // whatever rendered before it; and two async renders at once give what each gives alone.
  const Badge = registerTool({
    name: "isolation_badge",
    values: { label: "" },
    renderer: {
      exporters: { email: (values) => `<b>badge ${values.label}</b>`, web: (values) => `<i>badge ${values.label}</i>` },
      head: { css: (values) => `.${values._meta?.htmlID} { color: #c00; }` },
    },
  });
  const Broken = registerTool({ name: "isolation_broken", renderer: { exporters: { web: () => { throw new Error("broken exporter"); } } } });
  const contents = [
    <Row><Column><Uid n={1} /><Badge label="a" /></Column></Row>,
    [<Row key="1"><Column><Paragraph>Two rows</Paragraph></Column></Row>, <Row key="2"><Column><Uid n={2} /></Column></Row>],
    <><Row><Column><Badge label="c" /><Uid n={3} /></Column></Row><Row><Column><Uid n={4} /></Column></Row></>,
    <Row><Column><Paragraph>Before</Paragraph><Broken /><Uid n={5} /></Column></Row>,
  ];
  const roots = contents.flatMap((content) => [<Email>{content}</Email>, <Page>{content}</Page>, <Email textDirection="rtl" config={{ idPrefix: "r-" }}>{content}</Email>]);
  const kept = [
    ...roots,
    ...roots.slice(0, 6).map((root) => <UnlayerProvider config={{ textDirection: "rtl", idPrefix: "p-" }}>{root}</UnlayerProvider>),
    <Suspense>{roots[0]}</Suspense>,
  ];
  const Forked = ({ of }: { of: React.ReactElement }) => (useId(), of);
  const Plain = ({ of }: { of: React.ReactElement }) => of;
  const Twice = ({ of }: { of: React.ReactElement }) => (useId(), useId(), <Plain of={of} />);
  const MemoForked = memo(Forked);
  const wrappers = [Forked, Plain, Twice, MemoForked] as React.ComponentType<{ of: React.ReactElement }>[];
  const options = [{}, { idPrefix: "o-" }, { textDirection: "rtl" }, { onError: "omit" }] as const;
  type Template = { element: React.ReactElement; options: (typeof options)[number] };

  const parts = (p: { omitted: Array<{ message: string; component: string; position: string }> }) => JSON.stringify({ ...p, omitted: p.omitted.map((e) => [e.message, e.component, e.position]) });
  const renderers: Record<string, (t: Template) => unknown> = {
    html: (t) => renderToHtml(t.element, t.options),
    parts: (t) => parts(renderToHtmlParts(t.element, t.options)),
    text: (t) => renderToPlainText(t.element, t.options),
    json: (t) => JSON.stringify(renderToJson(t.element, t.options as object)),
    "async html": (t) => asyncRenderers.renderToHtml(t.element, t.options),
    "async parts": async (t) => parts(await asyncRenderers.renderToHtmlParts(t.element, t.options)),
    "async text": (t) => asyncRenderers.renderToPlainText(t.element, t.options),
    "async json": async (t) => JSON.stringify(await asyncRenderers.renderToJson(t.element, t.options as object)),
  };
  const RUNS = Number(process.env.ISOLATION_RUNS ?? 120);
  const SEED = Number(process.env.ISOLATION_SEED ?? 20261018);

  it(`each give their own output after any other (${RUNS} pairs, seed ${SEED})`, async () => {
    const r = random(SEED);
    const templates: Template[] = Array.from({ length: 24 }, () => {
      let element = r.pick(kept);
      for (let n = Math.floor(r.next() * 3); n > 0; n--) element = React.createElement(r.pick(wrappers), { of: element });
      return { element, options: r.pick(options) };
    });
    const said: string[] = [];
    const spies = (["warn", "error"] as const).map((level) => vi.spyOn(console, level).mockImplementation((...args) => void said.push(`${level}: ${String(args[0])}`)));
    /** What a render gives: its output or its error, and what it said. */
    const observe = async (name: string, t: Template) => {
      const from = said.length;
      let out: unknown;
      try {
        out = await renderers[name](t);
      } catch (error) {
        out = `threw ${(error as Error).message}`;
      }
      return JSON.stringify({ out, said: said.slice(from) });
    };
    const first = new Map<string, string>();
    const check = async (name: string, i: number, after: string) => {
      const got = await observe(name, templates[i]);
      const key = `${name} ${i}`;
      if (!first.has(key)) first.set(key, got);
      expect(got, `${key}, after ${after} (seed ${SEED})`).toBe(first.get(key));
    };
    try {
      for (let run = 0; run < RUNS; run++) {
        const [a, b] = [Math.floor(r.next() * templates.length), Math.floor(r.next() * templates.length)];
        for (const name of Object.keys(renderers)) {
          await check(name, b, "nothing");
          await check(name, a, `${name} ${b}`);
          await check(name, b, `${name} ${a}`);
          await check(name, a, `${name} ${b}`);
        }
        // Two async renders at once: what each gives alone.
        for (const name of Object.keys(renderers).filter((n) => n.startsWith("async"))) {
          const outputs = await Promise.all([a, b].map(async (i) => {
            try {
              return await renderers[name](templates[i]);
            } catch (error) {
              return `threw ${(error as Error).message}`;
            }
          }));
          [a, b].forEach((i, k) => expect(JSON.stringify(JSON.parse(first.get(`${name} ${i}`)!).out), `${name} ${i} with ${a === i ? b : a} at once (seed ${SEED})`).toBe(JSON.stringify(outputs[k])));
        }
      }
    } finally {
      for (const spy of spies) spy.mockRestore();
    }
  }, Math.max(20_000, RUNS * 100));
});
