// @vitest-environment node
/**
 * The walker against react-dom/server: the same tree, through `renderToStaticMarkup` and through the engine, must give
 * the same markup, `useId()`s included (in the installed React's format). Hand-written trees for what templates do,
 * then random ones (`WALKER_FUZZ_SEEDS=5000` for a longer run; CI's weekly canary runs it on React's canary).
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import React, { Component, createContext, forwardRef, Fragment, memo, Suspense, useContext, useId, useMemo, useReducer, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { renderStatic } from "./index";

const SEEDS = Number(process.env.WALKER_FUZZ_SEEDS ?? 300);
const Theme = createContext("light");
const Lang = createContext("en");
const provide = (context: React.Context<string>, value: string, children: React.ReactNode) => React.createElement(context.Provider, { value }, children);

function Ids({ n = 1, children }: { n?: number; children?: React.ReactNode }) {
  const ids = Array.from({ length: n }, () => useId());
  return <span data-ids={ids.join(" ")}>{children}</span>;
}
const Themed = () => <i>{`${useContext(Theme)}/${useContext(Lang)}`}</i>;
const Memo = memo(({ children }: { children?: React.ReactNode }) => <b data-id={useId()}>{children}</b>);
const Ref = forwardRef<HTMLElement, { children?: React.ReactNode }>(({ children }, _ref) => <em id={useId()}>{children}</em>);
class Classy extends Component<{ children?: React.ReactNode }> {
  static contextType = Theme;
  render() {
    return <u title={String(this.context)}>{this.props.children}</u>;
  }
}
function Stateful({ children }: { children?: React.ReactNode }) {
  const [count, setCount] = useState(0);
  const [reduced] = useReducer((s: number, a: number) => s + a, 2);
  const ref = useRef("ref");
  const memo = useMemo(() => count * 10, [count]);
  if (count < 2) setCount(count + 1);
  return <p data-state={`${count} ${reduced} ${ref.current} ${memo}`}>{children}</p>;
}

/** react-dom's markup, but for React 19's image preloads (hoisted resource hints), which the walker doesn't write. */
const reactDom = (node: React.ReactElement) => renderToStaticMarkup(node).replace(/<link rel="preload" as="image"[^>]*\/>/g, "");
const same = (node: React.ReactElement) => expect(renderStatic(node)).toBe(reactDom(node));

// React's development warnings for these trees (an attribute it doesn't know, a list without keys), and the walker's.
beforeAll(() => void vi.spyOn(console, "error").mockImplementation(() => {}));
afterAll(() => vi.restoreAllMocks());

describe("the walker against react-dom/server", () => {
  it("writes the same markup: attributes, styles, escaping, void and preformatted elements", () => {
    same(
      <div className="a&b" style={{ marginTop: 0, padding: 8, lineHeight: 1.5, WebkitLineClamp: 2, "--brand": " red " } as React.CSSProperties} data-x={true} aria-hidden={false} hidden tabIndex={0} htmlFor="x">
        {"<script> & \"quotes\" 'single'"}
        <img src="https://example.com/a.png?a=1&b=2" alt="A > B" width={200} />
        <br />
        <input type="checkbox" defaultChecked value="v" readOnly />
        <textarea defaultValue={"\nline"} />
        <pre>{"\nkept"}</pre>
        <a href="javascript:alert(1)">x</a>
        <table cellPadding={0}><tbody><tr><td colSpan={2} valign="top">{1}{2}{"three"}</td></tr></tbody></table>
        <div dangerouslySetInnerHTML={{ __html: "<b>raw</b>" }} />
        <svg viewBox="0 0 10 10" strokeWidth={2}><path d="M0 0" fillOpacity={0.5} /></svg>
        <my-element class="c" some-attr="v" />
        {null}{false}{undefined}{0}{""}
      </div>
    );
  });

  it("gives the same useId()s: arrays, Fragments, forks, memo, forwardRef, context and classes", () => {
    same(
      <>
        <Ids n={2} />
        {[<Ids key="a" />, <Ids key="b" n={3}><Ids /></Ids>, [<Ids key="c" />, <Memo key="d"><Ids /></Memo>]]}
        <Ref><Ids /></Ref>
        {provide(Theme, "dark", <Classy><Ids /><Themed /></Classy>)}
        <Stateful><Ids /></Stateful>
        <Suspense fallback={<i>loading</i>}><Ids /></Suspense>
      </>
    );
  });

  it("renders a Suspense fallback for what suspends, as react-dom's synchronous render does", () => {
    const never = new Promise<never>(() => {});
    const Later = () => {
      throw never;
    };
    same(<div><Suspense fallback={<i>loading</i>}><Ids /><Later /></Suspense><Ids /></div>);
  });

  it(`writes the same for ${SEEDS} random trees`, () => {
    const different: number[] = [];
    let bytes = 0;
    for (let seed = 1; seed <= SEEDS; seed++) {
      const tree = randomTree(seed);
      const html = reactDom(tree);
      bytes += html.length;
      if (renderStatic(tree) !== html) different.push(seed);
    }
    expect(different.slice(0, 10)).toEqual([]);
    // (Trees of some size: not mostly empty ones.)
    expect(bytes / SEEDS).toBeGreaterThan(200);
  });
});

/** A seeded random number generator (mulberry32). */
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

const TAGS = ["div", "span", "p", "b", "a", "td", "li", "section"] as const;
const WORDS = ["Hi", "a & b", "<x>", "\"q\"", "7", "", " "];

/** A random tree of what templates use: markup, text, arrays, Fragments, components with ids, context, memo, forwardRef. */
function randomTree(seed: number): React.ReactElement {
  const r = random(seed);
  let keys = 0;
  const node = (depth: number): React.ReactNode => {
    const roll = r.next();
    if (depth > 5 || roll < 0.15) return r.pick(WORDS);
    if (roll < 0.26) return r.pick([null, false, 0, 42]);
    const children = () => Array.from({ length: 1 + Math.floor(r.next() * 3) }, () => <Fragment key={keys++}>{node(depth + 1)}</Fragment>);
    if (roll < 0.4) {
      const tag = r.pick(TAGS);
      const props: Record<string, unknown> = { className: r.next() < 0.3 ? `c${seed}` : undefined, style: r.next() < 0.3 ? { color: "red", paddingTop: Math.floor(r.next() * 9) } : undefined };
      if (tag === "a") props.href = "https://example.com/?a=1&b=2";
      return React.createElement(tag, props, ...children());
    }
    if (roll < 0.5) return children();
    if (roll < 0.58) return <>{children()}</>;
    if (roll < 0.72) return <Ids n={1 + Math.floor(r.next() * 2)}>{children()}</Ids>;
    if (roll < 0.78) return <Memo>{children()}</Memo>;
    if (roll < 0.82) return <Ref>{children()}</Ref>;
    if (roll < 0.88) return provide(r.next() < 0.5 ? Theme : Lang, `v${Math.floor(r.next() * 9)}`, [<Themed key="t" />, ...children()]);
    if (roll < 0.92) return <Classy>{children()}</Classy>;
    if (roll < 0.96) return <Stateful>{children()}</Stateful>;
    return <Suspense fallback={<i>…</i>}>{children()}</Suspense>;
  };
  return <div>{node(0)}</div>;
}
