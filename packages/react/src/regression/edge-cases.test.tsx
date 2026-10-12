/**
 * Edges where Elements meets React's own rules, rendered with this build and with the last published Elements
 * (`@unlayer/react-elements-previous`): markup React rejects, pieces rendered on their own, odd children, React's
 * hooks and wrappers, and Elements' renders called inside another render (an app's server render, a component
 * Elements renders, the browser). 0.2.0 renders templates with React, which is stricter than 0.1.22's walk of the
 * tree and keeps a render's state in its module: these are where that shows. Wherever the previous release
 * rendered, this build must too (no throw), and show every word it showed (it may show more: what React shows).
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import React, { Component, Fragment, createContext, forwardRef, memo, useContext, useDeferredValue, useLayoutEffect, useMemo, useState, useSyncExternalStore, useTransition, act } from "react";
import { renderToString } from "react-dom/server";
import { createRoot } from "react-dom/client";
import * as current from "../index";
import * as previous from "@unlayer/react-elements-previous";

type Lib = typeof current;
const releases = { current, previous: previous as unknown as Lib };
const Ctx = createContext("default");

/** The words a reader sees. */
const words = (html: string) =>
  html
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .split(/\s+/)
    .filter(Boolean);

/** The text a design's blocks hold. */
const designWords = (design: unknown): string[] => {
  const out: string[] = [];
  const visit = (value: unknown, key?: string) => {
    if (typeof value === "string" && (key === "text" || key === "html")) out.push(...words(value));
    else if (Array.isArray(value)) value.forEach((v) => visit(v));
    else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) visit(v, k);
  };
  visit(design);
  return out;
};

/** Every word of `before` is in `now`, as many times (it may hold more). */
function contains(now: string[], before: string[]): string[] {
  const left = new Map<string, number>();
  for (const w of now) left.set(w, (left.get(w) ?? 0) + 1);
  return before.filter((w) => {
    const n = left.get(w) ?? 0;
    left.set(w, n - 1);
    return n <= 0;
  });
}

const CASES: Record<string, (L: Lib) => React.ReactElement> = {
  "markup React rejects among the rows (a string style)": (L) => <L.Email>{React.createElement("div", { style: "color:red" } as never, "Loose")}<L.Row><L.Column><L.Paragraph>Kept text</L.Paragraph></L.Column></L.Row></L.Email>,
  "markup React rejects in a component in a Column": (L) => {
    const Bad = () => React.createElement("span", { style: "color:red" } as never, "bad");
    return <L.Email><L.Row><L.Column><L.Paragraph>Kept text</L.Paragraph><Bad /></L.Column></L.Row></L.Email>;
  },
  "dangerouslySetInnerHTML given as a string": (L) => <L.Email><L.Row><L.Column><L.Paragraph>Kept text</L.Paragraph>{React.createElement("div", { dangerouslySetInnerHTML: "<b>x</b>" } as never)}</L.Column></L.Row></L.Email>,
  "children and dangerouslySetInnerHTML both": (L) => <L.Email><L.Row><L.Column><L.Paragraph>Kept text</L.Paragraph>{React.createElement("div", { dangerouslySetInnerHTML: { __html: "x" } } as never, "y")}</L.Column></L.Row></L.Email>,
  "a void element with children": (L) => <L.Email><L.Row><L.Column><L.Paragraph>Kept text</L.Paragraph>{React.createElement("br", null, "child")}</L.Column></L.Row></L.Email>,
  "a Row on its own": (L) => <L.Row><L.Column><L.Paragraph>Alone row</L.Paragraph></L.Column></L.Row>,
  "a Row on its own with a layout": (L) => <L.Row layout={L.ColumnLayouts.TwoEqual}><L.Column><L.Paragraph>Left side</L.Paragraph></L.Column><L.Column><L.Paragraph>Right side</L.Paragraph></L.Column></L.Row>,
  "a Row on its own, a Column under a condition": (L) => <L.Row layout={L.ColumnLayouts.TwoEqual}>{false && <L.Column><L.Paragraph>Hidden</L.Paragraph></L.Column>}<L.Column><L.Paragraph>Shown column</L.Paragraph></L.Column></L.Row>,
  "a Column on its own": (L) => <L.Column><L.Paragraph>Alone column</L.Paragraph></L.Column>,
  "a block on its own": (L) => <L.Paragraph>Alone block</L.Paragraph>,
  "a Row in a Fragment as the root": (L) => <><L.Row><L.Column><L.Paragraph>Fragment row</L.Paragraph></L.Column></L.Row></>,
  "Email in a Fragment": (L) => <><L.Email><L.Row><L.Column><L.Paragraph>In a fragment</L.Paragraph></L.Column></L.Row></L.Email></>,
  "numbers and loose text in a Column": (L) => <L.Email><L.Row><L.Column>{42}{" loose "}<L.Paragraph>Kept text</L.Paragraph></L.Column></L.Row></L.Email>,
  "a Set of blocks": (L) => <L.Email><L.Row><L.Column>{new Set([<L.Paragraph key="1">First item</L.Paragraph>, <L.Paragraph key="2">Second item</L.Paragraph>]) as never}</L.Column></L.Row></L.Email>,
  "nested arrays of Rows": (L) => <L.Email>{[[<L.Row key="1"><L.Column><L.Paragraph>Deep one</L.Paragraph></L.Column></L.Row>], [<L.Row key="2"><L.Column><L.Paragraph>Deep two</L.Paragraph></L.Column></L.Row>]]}</L.Email>,
  "a component returning a string in a Column": (L) => {
    const S = () => "plain string" as never;
    return <L.Email><L.Row><L.Column><L.Paragraph>Kept text</L.Paragraph><S /></L.Column></L.Row></L.Email>;
  },
  "a component returning a number among the rows": (L) => {
    const N = () => 7 as never;
    return <L.Email><N /><L.Row><L.Column><L.Paragraph>Kept text</L.Paragraph></L.Column></L.Row></L.Email>;
  },
  "a component returning undefined": (L) => {
    const U = () => undefined as never;
    return <L.Email><L.Row><L.Column><L.Paragraph>Kept text</L.Paragraph><U /></L.Column></L.Row></L.Email>;
  },
  "a Row inside a Column": (L) => <L.Email><L.Row><L.Column><L.Paragraph>Outer text</L.Paragraph><L.Row><L.Column><L.Paragraph>Inner text</L.Paragraph></L.Column></L.Row></L.Column></L.Row></L.Email>,
  "a block straight in Email": (L) => <L.Email><L.Paragraph>No row</L.Paragraph><L.Row><L.Column><L.Paragraph>Kept text</L.Paragraph></L.Column></L.Row></L.Email>,
  "useLayoutEffect": (L) => {
    const C = () => {
      useLayoutEffect(() => {});
      return <L.Paragraph>Layout effect</L.Paragraph>;
    };
    return <L.Email><L.Row><L.Column><C /></L.Column></L.Row></L.Email>;
  },
  "useSyncExternalStore": (L) => {
    const C = () => <L.Paragraph>{useSyncExternalStore(() => () => {}, () => "store", () => "server store")}</L.Paragraph>;
    return <L.Email><L.Row><L.Column><C /></L.Column></L.Row></L.Email>;
  },
  "useTransition and useDeferredValue": (L) => {
    const C = () => {
      const [pending] = useTransition();
      return <L.Paragraph>{`${pending} ${useDeferredValue("deferred")}`}</L.Paragraph>;
    };
    return <L.Email><L.Row><L.Column><C /></L.Column></L.Row></L.Email>;
  },
  "a class component returning a Row": (L) => {
    class R extends Component {
      render() {
        return <L.Row><L.Column><L.Paragraph>From a class</L.Paragraph></L.Column></L.Row>;
      }
    }
    return <L.Email><R /></L.Email>;
  },
  "memo of an Elements block": (L) => {
    const P = memo(L.Paragraph);
    return <L.Email><L.Row><L.Column><P>Memo block</P></L.Column></L.Row></L.Email>;
  },
  "a forwardRef wrapper of a block": (L) => {
    const P = forwardRef((props: { children: string }, _ref) => <L.Paragraph>{props.children}</L.Paragraph>);
    return <L.Email><L.Row><L.Column><P>Ref block</P></L.Column></L.Row></L.Email>;
  },
  "a higher-order component around a Row": (L) => {
    const R = (props: { children: React.ReactNode }) => <L.Row {...props} />;
    return <L.Email><R><L.Column><L.Paragraph>Wrapped row</L.Paragraph></L.Column></R></L.Email>;
  },
  "context read under a Provider inside the root": (L) => {
    const C = () => <L.Paragraph>{useContext(Ctx)}</L.Paragraph>;
    return <L.Email><Ctx.Provider value="provided"><L.Row><L.Column><C /></L.Column></L.Row></Ctx.Provider></L.Email>;
  },
  "renderToPlainText inside a component, then hooks": (L) => {
    const C = () => {
      const inner = useMemo(() => L.renderToPlainText(<L.Email><L.Row><L.Column><L.Paragraph>inner text</L.Paragraph></L.Column></L.Row></L.Email>), []);
      const [after] = useState("after");
      return <L.Paragraph>{`${inner.trim()} ${after}`}</L.Paragraph>;
    };
    return <L.Email><L.Row><L.Column><C /></L.Column></L.Row></L.Email>;
  },
  "renderToHtml inside a component, then hooks": (L) => {
    const C = () => {
      const inner = useMemo(() => L.renderToHtml(<L.Email><L.Row><L.Column><L.Paragraph>inner text</L.Paragraph></L.Column></L.Row></L.Email>), []);
      const [after] = useState("after");
      return <L.Paragraph>{`${inner.includes("inner text")} ${after}`}</L.Paragraph>;
    };
    return <L.Email><L.Row><L.Column><C /></L.Column></L.Row></L.Email>;
  },
};

type Api = "html" | "plain" | "json";
const API: Record<Api, (L: Lib, element: React.ReactElement) => string[]> = {
  html: (L, element) => words(L.renderToHtml(element)),
  plain: (L, element) => L.renderToPlainText(element).split(/\s+/).filter(Boolean),
  json: (L, element) => designWords(L.renderToJson(element)),
};

/** Where the render is called: directly, or from a page an app renders on the server, using hooks after. */
const PLACES: Record<string, (run: () => string[]) => string[]> = {
  directly: (run) => run(),
  "in an app's server render": (run) => {
    let out: string[] = [];
    function Page() {
      out = useMemo(run, []);
      const [after] = useState("ok");
      return <pre>{after}</pre>;
    }
    expect(renderToString(<Page />)).toBe("<pre>ok</pre>");
    return out;
  },
};

const attempt = (run: () => string[]): { words?: string[]; error?: unknown } => {
  try {
    return { words: run() };
  } catch (error) {
    return { error };
  }
};

// Components left out, markup React rejects: keep the test output quiet.
beforeAll(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterAll(() => vi.restoreAllMocks());

describe.each(Object.entries(CASES))("%s", (_, build) => {
  for (const api of Object.keys(API) as Api[]) {
    for (const [place, within] of Object.entries(PLACES)) {
      it(`${api}, ${place}: renders where the previous release did, with every word it showed`, () => {
        const before = attempt(() => within(() => API[api](releases.previous, build(releases.previous))));
        if (before.error) return; // the previous release didn't render it: nothing to keep
        const now = attempt(() => within(() => API[api](releases.current, build(releases.current))));
        expect(now.error).toBeUndefined();
        expect(contains(now.words!, before.words!)).toEqual([]);
      });
    }
  }
});

describe("in the browser (a live preview)", () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  it("renders the email, and works out its design and HTML while rendering, as the previous release did", async () => {
    const shown: Record<string, string[]> = {};
    for (const [name, L] of Object.entries(releases)) {
      const Template = () => <L.Email><L.Row><L.Column><L.Paragraph>Client hello</L.Paragraph><L.Button href="https://example.com">Open it</L.Button></L.Column></L.Row></L.Email>;
      function Preview() {
        const design = useMemo(() => L.renderToJson(<Template />), []);
        const html = useMemo(() => L.renderToHtml(<Template />), []);
        const [rows] = useState(design.body.rows.length);
        return <div><pre>{`${rows} rows ${html.includes("Client hello")}`}</pre><Template /></div>;
      }
      const container = document.createElement("div");
      const root = createRoot(container);
      await act(async () => root.render(<Preview />));
      await act(async () => root.render(<Preview />)); // a re-render
      shown[name] = words(container.innerHTML);
      root.unmount();
    }
    expect(shown.current).toEqual(shown.previous);
    expect(shown.current.join(" ")).toContain("1 rows true Client hello Open it");
  });
});
