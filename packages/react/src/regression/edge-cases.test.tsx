/**
 * Edges where Elements meets React's own rules: odd children, React's hooks and wrappers, and Elements' renders
 * called inside an app's server render. Elements collects a template with one React render (src/primitives/collect.tsx),
 * which is strict, and keeps a render's state in its module (src/utils/server-renderer.ts): these are where that
 * shows. Each template renders, lays out and goes to the builder with the words React shows for it.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import React, { Component, createContext, forwardRef, memo, useContext, useDeferredValue, useLayoutEffect, useMemo, useState, useSyncExternalStore, useTransition } from "react";
import { renderToString } from "react-dom/server";
import { Column, Email, Paragraph, Row, Text, outline, render } from "../primitives/index";
import { toDesign } from "../builder/index";

const Ctx = createContext("default");

/** The words in a design's texts. */
const designWords = (design: unknown): string[] => {
  const out: string[] = [];
  const visit = (value: unknown, key?: string) => {
    if (typeof value === "string" && key === "text") out.push(...value.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean));
    else if (Array.isArray(value)) value.forEach((v) => visit(v));
    else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) visit(v, k);
  };
  visit(design);
  return out;
};

const CASES: Record<string, { template: () => React.ReactElement; words: string[] }> = {
  "an Email in a Fragment": { template: () => <><Email><Paragraph>In a fragment</Paragraph></Email></>, words: ["In", "a", "fragment"] },
  "numbers and strings among a text's children": { template: () => <Email><Text>{42}{" loose "}{"end"}</Text></Email>, words: ["42", "loose", "end"] },
  "a Set of blocks": { template: () => <Email>{new Set([<Paragraph key="1">First item</Paragraph>, <Paragraph key="2">Second item</Paragraph>]) as never}</Email>, words: ["First", "item", "Second", "item"] },
  "nested arrays of Rows": {
    template: () => <Email>{[[<Row key="1"><Column><Paragraph>Deep one</Paragraph></Column></Row>], [<Row key="2"><Column><Paragraph>Deep two</Paragraph></Column></Row>]]}</Email>,
    words: ["Deep", "one", "Deep", "two"],
  },
  "a component returning a string in a text": {
    template: () => {
      const S = () => "plain string" as never;
      return <Email><Text>Kept <S /></Text></Email>;
    },
    words: ["Kept", "plain", "string"],
  },
  "a component returning undefined": {
    template: () => {
      const U = () => undefined as never;
      return <Email><Paragraph>Kept text</Paragraph><U /></Email>;
    },
    words: ["Kept", "text"],
  },
  useLayoutEffect: {
    template: () => {
      const C = () => {
        useLayoutEffect(() => {});
        return <Paragraph>Layout effect</Paragraph>;
      };
      return <Email><C /></Email>;
    },
    words: ["Layout", "effect"],
  },
  useSyncExternalStore: {
    template: () => {
      const C = () => <Paragraph>{useSyncExternalStore(() => () => {}, () => "store", () => "server store")}</Paragraph>;
      return <Email><C /></Email>;
    },
    // A server render reads the server's snapshot.
    words: ["server", "store"],
  },
  "useTransition and useDeferredValue": {
    template: () => {
      const C = () => {
        const [pending] = useTransition();
        return <Paragraph>{`${pending} ${useDeferredValue("deferred")}`}</Paragraph>;
      };
      return <Email><C /></Email>;
    },
    words: ["false", "deferred"],
  },
  "a class component returning a Row": {
    template: () => {
      class R extends Component {
        render() {
          return <Row><Column><Paragraph>From a class</Paragraph></Column></Row>;
        }
      }
      return <Email><R /></Email>;
    },
    words: ["From", "a", "class"],
  },
  "memo of a component": {
    template: () => {
      const P = memo(Paragraph);
      return <Email><P>Memo block</P></Email>;
    },
    words: ["Memo", "block"],
  },
  "a forwardRef wrapper of a component": {
    template: () => {
      const P = forwardRef((props: { children: string }, _ref) => <Paragraph>{props.children}</Paragraph>);
      return <Email><P>Ref block</P></Email>;
    },
    words: ["Ref", "block"],
  },
  "a higher-order component around a Row": {
    template: () => {
      const R = (props: { children: React.ReactNode }) => <Row {...props} />;
      return <Email><R><Column><Paragraph>Wrapped row</Paragraph></Column></R></Email>;
    },
    words: ["Wrapped", "row"],
  },
  "context read under a Provider inside the root": {
    template: () => {
      const C = () => <Paragraph>{useContext(Ctx)}</Paragraph>;
      return <Email><Ctx.Provider value="provided"><C /></Ctx.Provider></Email>;
    },
    words: ["provided"],
  },
};

type Words = string[] | Promise<string[]>;
const API: Record<string, (element: React.ReactElement) => Words> = {
  "render()": (element) => render(element).then(({ text }) => text.split(/\s+/).filter(Boolean)),
  "outline()": (element) => outline(element).split("\n").flatMap((line) => [...line.matchAll(/"([^"]*)"/g)].flatMap((m) => m[1].split(/\s+/).filter(Boolean))),
  "toDesign()": (element) => designWords(toDesign(element).design),
};

/** Where the render is called: directly, or from a page an app renders on the server, using hooks after. */
const PLACES: Record<string, (run: () => Words) => Words> = {
  directly: (run) => run(),
  "in an app's server render": (run) => {
    let out: Words = [];
    function Page() {
      out = useMemo(run, []);
      const [after] = useState("ok");
      return <pre>{after}</pre>;
    }
    expect(renderToString(<Page />)).toBe("<pre>ok</pre>");
    return out;
  },
};

// React's warnings about odd children: keep the test output quiet.
beforeAll(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterAll(() => vi.restoreAllMocks());

describe.each(Object.entries(CASES))("%s", (_, { template, words }) => {
  for (const [api, run] of Object.entries(API)) {
    for (const [place, at] of Object.entries(PLACES)) {
      it(`${api}, ${place}: shows the words React shows`, async () => {
        expect(await at(() => run(template()))).toEqual(words);
      });
    }
  }
});
