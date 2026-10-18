// @vitest-environment node
/**
 * The walker against react-dom/server: the same tree, through `renderToStaticMarkup` and through the engine, must give
 * the same markup, `useId()`s included (in the installed React's format). Hand-written trees for what templates do,
 * every element and kind of attribute React writes its own way, then random ones, alone and where templates have
 * markup (`WALKER_FUZZ_SEEDS=5000` for a longer run, `TEMPLATE_SEEDS` for the templates'; CI's weekly canary runs it on
 * React's canary). Where the walker means to differ (React 19's hoisting, its document singletons, forms' actions), the
 * differences are listed, each with why.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import React, { Component, createContext, forwardRef, Fragment, memo, Suspense, useContext, useId, useMemo, useReducer, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { renderStatic } from "./index";
import { cssNames } from "./attributes";
import { REACT_18 } from "./react-compat";
import { Column, Page, Row, renderToHtmlParts, renderToJson } from "../index";
import * as asyncRenderers from "../async";

const SEEDS = Number(process.env.WALKER_FUZZ_SEEDS ?? 300);
const TEMPLATE_SEEDS = Number(process.env.TEMPLATE_SEEDS ?? 40);
/** createElement, for props no element's types take (a number as a title, a function as a value). */
const h = React.createElement as (type: any, props?: any, ...children: any[]) => React.ReactElement;
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

  it("keeps a bounded number of style names worked out (a style's keys can come from data), and writes the rest the same", () => {
    const style = Object.fromEntries(Array.from({ length: 3000 }, (_, i) => [`dataProp${i}`, i % 2 ? 1 : "a"])) as React.CSSProperties;
    for (let round = 0; round < 2; round++) expect(renderStatic(<div style={style} />)).toBe(renderToStaticMarkup(<div style={style} />));
    expect(cssNames.size).toBeLessThanOrEqual(1000);
  });

  it("writes each attribute, style and child as react-dom does, on every kind of element", () => {
    const tags = [
      "div", "a", "img", "span", "td", "tr", "table", "input", "textarea", "pre", "listing", "svg", "path", "foreignObject", "math", "mi", "my-el", "font-face", "button", "form",
      "select", "option", "optgroup", "object", "menuitem", "meta", "link", "noscript", "picture", "iframe", "hr", "br", "base", "wbr", "html", "head", "body",
      "DIV", "IMG", "SELECT", "Title",
    ];
    const names = [
      "data-x", "aria-hidden", "title", "class", "className", "href", "src", "onClick", "onmouseover", "tabIndex", "htmlFor", "hidden", "download", "is", "rowSpan", "cols", "start",
      "contentEditable", "spellCheck", "allowFullScreen", "inert", "credentialless", "checked", "selected", "multiple", "autoFocus", "readOnly", "itemScope", "action", "formAction",
      "xlinkHref", "strokeWidth", "transformOrigin", "maskType", "crossOrigin", "httpEquiv", "x y", "defaultValue", "defaultChecked", "value", "capture", "cellPadding", "valign",
      "suppressHydrationWarning", "suppressContentEditableWarning", "innerHTML", "focusable", "xmlLang", "panose-1", "name", "type", "id", "encType", "method", "target", "formEncType",
      "formMethod", "formTarget", "data", "label", "rel", "media", "nonce", "precedence", "async", "charSet", "content", "itemProp", "srcSet", "for", "viewBox", "ref", "children",
    ];
    const values = [null, undefined, "", 0, 1, 2.5, NaN, true, false, " 5 ", "javascript:alert(1)", "<&\"'>", "\nline", { a: 1 }, [1, 2], () => 1, Symbol.for("x"), BigInt(7)];
    const styles = [
      { lineHeight: 1, width: 1, scale: 2, WebkitLineClamp: 2, msFlex: 1, MozBoxFlex: 2, OFlex: 1 },
      { "--x": " a<b ", "--y": 0, marginTop: 0, padding: "  1px  ", opacity: 0.5, zIndex: 3, flexGrow: 2 },
      { msTransform: "x", fontWeight: 700, aspectRatio: 1.5, cssFloat: "left", width: NaN, height: Infinity, margin: null, border: false, color: "" },
    ];
    const children = ["<&\"'>", 0, true, ["a", 1, null, ["b"]], "\nnl", ["\nnl"], BigInt(7), h("b", null, "x"), [h("i", { key: 1 }, "x"), "t"], () => 1];
    const html = [{ __html: "<b>\nx</b>" }, { __html: "\nx" }, { __html: ["\nx"] }, { __html: null }, { __html: 0 }, {}, "x"];
    const different: string[] = [];
    let checked = 0;
    const check = (node: React.ReactElement, label: string) => {
      checked++;
      const [walker, dom] = [attempt(() => renderStatic(wrapped(node))), attempt(() => reactDom(wrapped(node)))];
      if (walker !== dom) different.push(`${label}: ${walker} ≠ ${dom}`);
    };
    for (const tag of tags) {
      for (const name of names) {
        for (const value of values) {
          // (React 19 writes a form's action function as a script, which the walker doesn't: see "differs … only where it means to".)
          if (typeof value === "function" && /action/i.test(name)) continue;
          // (A ref is an object, a function or nothing.)
          if (name === "ref" && !(value == null || typeof value === "function")) continue;
          const props = { [name]: value };
          check(h(tag, props), `<${tag} ${name}=${show(value)}>`);
          if (name !== "children") check(h(tag, props, "t"), `<${tag} ${name}=${show(value)}>t`);
        }
      }
      for (const style of styles) check(h(tag, { style }), `<${tag} style=${JSON.stringify(style)}>`);
      for (const child of children) check(h(tag, null, child), `<${tag}>${show(child)}`);
      for (const __html of html) {
        check(h(tag, { dangerouslySetInnerHTML: __html }), `<${tag} dangerouslySetInnerHTML=${JSON.stringify(__html)}>`);
        check(h(tag, { dangerouslySetInnerHTML: __html }, "t"), `<${tag} dangerouslySetInnerHTML=${JSON.stringify(__html)}>t`);
      }
    }
    expect(different.slice(0, 20)).toEqual([]);
    expect(checked).toBeGreaterThan(100000);
  });

  it("writes form controls as react-dom does: a select's value marking its options, a textarea's value as its text, an input's checked and value last", () => {
    const Option = ({ value, children }: { value?: unknown; children?: React.ReactNode }) => h("option", { value }, children);
    const options = [h("option", { key: 1, value: "a" }, "A"), h("option", { key: 2, value: "b" }, "B"), h("option", { key: 3 }, "c"), h("option", { key: 4, value: 1 }, "One")];
    const trees = [
      h("select", { defaultValue: "b" }, options),
      h("select", { value: "b", onChange() {} }, options),
      h("select", { value: "a", defaultValue: "b", onChange() {} }, options),
      h("select", { value: null, defaultValue: "c" }, options),
      h("select", { defaultValue: 1 }, options),
      h("select", { multiple: true, defaultValue: ["a", "c", 1] }, options),
      h("select", { multiple: true, defaultValue: [] }, options),
      h("select", { defaultValue: { toString: () => "b" } }, options),
      h("select", { defaultValue: "b" }, h("optgroup", { label: "g" }, options)),
      h("select", { defaultValue: "b" }, h(Fragment, null, h(Option, { value: "a" }, "A")), h(Option, { value: "b" }, "B")),
      h("select", { defaultValue: "b" }, h("div", null, h("option", { value: "b" }, "B"))),
      h("select", { defaultValue: "b" }, h("table", null, h("tbody", null, h("tr", null, h("td", null, h("option", { value: "b" }, "B")))))),
      h("select", { defaultValue: "b" }, h("td", null, h("option", { value: "b" }, "B"))),
      h("select", { defaultValue: "b" }, h("svg", null, h("foreignObject", null, h("option", { value: "b" }, "B")))),
      h("select", { defaultValue: "b" }, h("noscript", null, h("option", { value: "b" }, "B")), h("picture", null, h("option", { value: "b" }, "B"))),
      h("select", { defaultValue: "a" }, h("option", { value: "a" }, "A"), h("select", { defaultValue: "x" }, h("option", { value: "x" }, "X"), h("option", { value: "a" }, "A"))),
      h("select", { defaultValue: "ab12" }, h("option", null, "a", ["b", [1]], 2), h("option", null, "a", h("b", null, "b")), h("option", null, true, "ab12")),
      h("select", { defaultValue: "x" }, h("option", { value: "a", selected: true }, "A"), h("option", { dangerouslySetInnerHTML: { __html: "x" } })),
      h("select", null, h("option", { value: "a", selected: "no" }, "A"), h("option", { selected: 0 }, "B"), h("option", { selected: () => 1 }, "C")),
      h("SELECT", { defaultValue: "a" }, h("option", { value: "a" }, "A")),
      h("option", { value: "a", selected: true }, "A"),
      h("textarea", { value: "a<b", onChange() {} }),
      h("textarea", { defaultValue: "\nx" }),
      h("textarea", { defaultValue: ["\nx"] }),
      h("textarea", { defaultValue: 5, value: null }),
      h("textarea", { defaultValue: () => 1 }),
      h("textarea", null, "\nchild"),
      h("textarea", null, ["x"]),
      h("textarea", null, [null]),
      h("textarea", null, h("b")),
      h("textarea", { defaultValue: "d" }, "c"),
      h("textarea", null, "a", "b"),
      h("textarea", { dangerouslySetInnerHTML: { __html: "x" } }),
      h("input", { name: "n", type: "submit", formAction: "/x", id: "i", formTarget: "t", formMethod: "post", formEncType: "e", value: "v", checked: true, onChange() {} }),
      h("input", { defaultValue: "d", defaultChecked: true, type: "checkbox", value: "v", checked: false, onChange() {} }),
      h("input", { value: false, checked: "yes", onChange() {} }),
      h("input", { value: () => 1, defaultValue: "d", checked: () => 1, defaultChecked: true }),
      h("button", { name: "n", type: "submit", id: "i", formTarget: "t", formAction: "javascript:x" }, "b"),
      h("form", { target: "_blank", method: "post", id: "f", encType: "x", action: "/a" }, "f"),
      h("object", { data: "javascript:x", type: "t" }),
      h("object", { data: "" }, "x"),
      h("menuitem", { label: "x" }),
      h("menuitem", null, "x"),
    ];
    const different = trees.map((tree) => [attempt(() => renderStatic(tree)), attempt(() => reactDom(tree))]).filter(([walker, dom]) => walker !== dom);
    expect(different).toEqual([]);
  });

  it("differs from react-dom only where it means to: React 19's hoisting, its document singletons and forms' actions", () => {
    // Each tree, what the walker writes on React 19, and why react-dom 19 writes otherwise (React 18 writes what the
    // walker writes: the walker gives what it gives there).
    const action = () => {};
    const intended: Array<[React.ReactElement, string, string]> = [
      [h("div", null, h("title", null, "T")), "<div><title>T</title></div>", "it moves a <title> to the start of the markup: Elements' markup is a part of a document (<Head> puts tags in the head)"],
      [h("div", null, h("meta", { name: "x", content: "y" })), '<div><meta name="x" content="y"/></div>', "it moves a <meta> to the start"],
      [h("div", null, h("link", { rel: "icon", href: "x.ico" })), '<div><link rel="icon" href="x.ico"/></div>', "it moves a <link> to the start"],
      [h("div", null, h("script", { async: true, src: "x.js" })), '<div><script async="" src="x.js"></script></div>', "it moves an async <script> to the start"],
      [h("div", null, h("img", { src: "x.png" })), '<div><img src="x.png"/></div>', "it adds a <link rel=\"preload\"> for an image, which an email has no use for"],
      [h("html", null, h("body", null, "x")), "<html><body>x</body></html>", "it adds a <head> to an <html> at the top, and moves what it hoists there"],
      [h("form", { action }, h("button", { formAction: action }, "x")), "<form><button>x</button></form>", "it writes a function as an action as a script that runs it, which an email can't"],
    ];
    // In every React: what fails in a <Suspense> fails the render (or is left out with `onError`), where react-dom renders
    // its fallback (for the browser to render it again): nothing is left out without a word (ARCHITECTURE.md, Errors).
    const Fails = (): React.ReactElement => {
      throw new Error("fails");
    };
    const suspense = h(Suspense, { fallback: h("i", null, "…") }, h(Fails));
    expect([attempt(() => renderStatic(suspense)), renderToStaticMarkup(suspense)]).toEqual(["throws", "<i>…</i>"]);
    for (const [tree, walker, why] of intended) {
      const dom = renderToStaticMarkup(tree);
      if (REACT_18) expect([why, renderStatic(tree)]).toEqual([why, dom]);
      else {
        expect([why, renderStatic(tree)]).toEqual([why, walker]);
        expect([why, dom]).not.toEqual([why, walker]);
      }
    }
  });

  it("gives the same useId()s with a prefix, as React's identifierPrefix", () => {
    const different: number[] = [];
    for (let seed = 1; seed <= 100; seed++) {
      const tree = randomTree(seed);
      const html = renderToStaticMarkup(tree, { identifierPrefix: "em-" }).replace(/<link rel="preload" as="image"[^>]*\/>/g, "");
      if (renderStatic(tree, { idPrefix: "em-" }) !== html) different.push(seed);
    }
    expect(different.slice(0, 10)).toEqual([]);
  });

  it(`writes the same for ${SEEDS} random trees`, () => {
    const different: number[] = [];
    let bytes = 0;
    for (let seed = 1; seed <= SEEDS; seed++) {
      const tree = randomTree(seed);
      const html = attempt(() => reactDom(tree));
      bytes += html.length;
      if (attempt(() => renderStatic(tree)) !== html) different.push(seed);
    }
    expect(different.slice(0, 10)).toEqual([]);
    // (Trees of some size: not mostly empty ones.)
    expect(bytes / SEEDS).toBeGreaterThan(200);
  });

  it(`writes the same markup where templates have it, for ${TEMPLATE_SEEDS} random trees: a template with no root, a Page's, a component's in a Column, the async renderers'`, async () => {
    const different: string[] = [];
    const Holder = ({ children }: { children?: React.ReactNode }) => h("div", null, children);
    for (let seed = 1; seed <= TEMPLATE_SEEDS; seed++) {
      // (No useId()s: a template's start where its root's content does, not at the top.)
      const tree = randomMarkup(seed);
      const markup = attempt(() => reactDom(tree));
      // (Markup a component of yours renders in a Column is an Html block's; markup written in one isn't kept.)
      const inDiv = attempt(() => reactDom(h("div", null, tree)));
      const contexts: Array<[string, string, () => string | Promise<string>]> = [
        ["no root", markup, () => renderToHtmlParts(h(Fragment, null, tree)).body],
        ["no root, async", markup, async () => (await asyncRenderers.renderToHtmlParts(h(Fragment, null, tree))).body],
        ["a Page's", markup, () => between(renderToHtmlParts(h(Page, null, h("hr", { id: "start" }), tree, h("hr", { id: "end" }))).body)],
        ["a component's in a Column", inDiv, () => renderToJson(h(Page, null, h(Row, null, h(Column, null, h(Holder, null, tree))))).body.rows[0].columns[0].contents[0].values.html],
      ];
      for (const [where, expected, render] of contexts) {
        let got: string;
        try {
          got = await render();
        } catch {
          got = "throws";
        }
        if (got !== expected) different.push(`seed ${seed}, ${where}: ${got} ≠ ${expected}`);
      }
    }
    expect(different.slice(0, 10)).toEqual([]);
  });
});

/** What a render gives, or "throws". */
function attempt(render: () => string): string {
  try {
    return render();
  } catch {
    return "throws";
  }
}

/** A value, shown in a label. */
const show = (value: unknown) => (typeof value === "function" ? "fn" : typeof value === "symbol" || typeof value === "bigint" ? String(value) : React.isValidElement(value) ? "<element>" : JSON.stringify(value));

/** The markup between a Page's `<hr id="start"/>` and `<hr id="end"/>`. */
const between = (body: string) => body.slice(body.indexOf('<hr id="start"/>') + 16, body.indexOf('<hr id="end"/>'));

/**
 * An element where React 19 writes it in place: a <meta> or <link> in a <noscript> (React 19 hoists them elsewhere: see
 * "differs … only where it means to"), anything else in a <div> (not the document's own <html>, <head> or <body>).
 */
const wrapped = (node: React.ReactElement) => h(/^(meta|link)$/.test(String(node.type)) ? "noscript" : "div", null, node);

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
    if (roll < 0.95) return <Stateful>{children()}</Stateful>;
    // (Markup React rejects fails the render, also in a <Suspense>: see "differs … only where it means to".)
    if (roll < 0.97) return markup(r, depth + 1, () => <Fragment key={keys++}>{node(depth + 2)}</Fragment>, true);
    return <Suspense fallback={<i>…</i>}>{children()}</Suspense>;
  };
  return <div>{node(0)}</div>;
}

const VALUES = ["a", "b", "c", 1, "1", "", "A", null, undefined, true, ["a", "c"], [1], []];
const TEXTS = ["A", "a", "b", "B", 1, ["a", ["b"]], null, true, "", "\nx", "a > b {c: 'd'}", "</style><style", "</script><script", "x & <y>"];
const Option = ({ value, children }: { value?: unknown; children?: React.ReactNode }) => h("option", { value }, children);
const Pass = ({ children }: { children?: React.ReactNode }) => children;

/** A random tree of markup only (no useId()s), of every element React writes its own way. */
function randomMarkup(seed: number): React.ReactElement {
  const r = random(seed);
  let keys = 0;
  const node = (depth: number): React.ReactNode => (depth > 4 || r.next() < 0.2 ? r.pick(TEXTS) : markup(r, depth, () => <Fragment key={keys++}>{node(depth + 1)}</Fragment>));
  return <div>{node(0)}</div>;
}

/**
 * One of the elements React writes its own way, with random props, holding `child()`ren: form controls (a select's
 * options inside optgroups, Fragments, components, tables, foreign content), resources (where React 19 writes them in
 * place), custom elements, preformatted text, and markup around them. `valid`: none React
 * rejects (a textarea's value and children, `dangerouslySetInnerHTML` and children).
 */
function markup(r: ReturnType<typeof random>, depth: number, child: () => React.ReactNode, valid = false): React.ReactNode {
  const some = (n = 3) => Array.from({ length: 1 + Math.floor(r.next() * n) }, child);
  const maybe = (props: Record<string, unknown>) => Object.fromEntries(Object.entries(props).filter(() => r.next() < 0.5));
  const text = () => r.pick(TEXTS);
  const option = (): React.ReactNode => {
    const roll = r.next();
    const props = { key: `o${r.next()}`, ...maybe({ value: r.pick(VALUES), selected: r.pick([true, false, "x", 0]), label: "l" }) };
    if (roll < 0.55) return h("option", props, text());
    if (roll < 0.65) return h("optgroup", { key: `g${r.next()}`, label: "g" }, option(), option());
    if (roll < 0.72) return h(Fragment, { key: `f${r.next()}` }, option());
    if (roll < 0.8) return h(Option, { key: `c${r.next()}`, value: r.pick(VALUES) }, text());
    if (roll < 0.86) return h(r.pick(["div", "noscript", "picture", "td", "svg"]), { key: `w${r.next()}` }, option());
    if (roll < 0.9) return h("table", { key: `t${r.next()}` }, h("tbody", null, h("tr", null, h("td", null, option()))));
    if (roll < 0.94) return h("select", { key: `s${r.next()}`, defaultValue: r.pick(VALUES) }, option(), option());
    return h("option", { ...props, dangerouslySetInnerHTML: { __html: "<b>x</b>" } });
  };
  const hoistable = { itemProp: "x" };
  switch (Math.floor(r.next() * 24)) {
    case 0:
    case 1:
      return h("select", maybe({ value: r.pick(VALUES), defaultValue: r.pick(VALUES), multiple: r.pick([true, false]), onChange: () => {}, name: "s" }), option(), option(), option());
    case 2:
      return h("textarea", maybe({ value: r.pick(VALUES), defaultValue: r.pick(VALUES), rows: 2, name: "t", onChange: () => {} }), !valid && r.next() < 0.2 ? text() : undefined);
    case 3:
      return h("input", maybe({ name: "n", type: r.pick(["text", "checkbox", "submit"]), value: r.pick(VALUES), defaultValue: "d", checked: r.pick([true, false]), defaultChecked: true, id: "i", formAction: "/x", formTarget: "t", formMethod: "post", formEncType: "e", onChange: () => {} }));
    case 4:
      return h("button", maybe({ name: "n", type: "submit", formAction: "javascript:x", formTarget: "t", id: "b" }), some());
    case 5:
      return h("form", maybe({ action: "/a", target: "_blank", method: "post", encType: "x", id: "f", name: "f" }), some());
    case 9:
      return h("div", null, h("meta", { ...hoistable, content: text() }), h("link", { ...hoistable, rel: "icon", href: "x" }), h("link", { rel: "icon" }));
    case 10:
      return h("object", maybe({ data: r.pick(["x.swf", "", "javascript:x", true]), type: "t" }), some(1));
    case 11:
      return h("menuitem", maybe({ label: "x", disabled: true }));
    case 12: {
      const html = r.next() < 0.3;
      return h(r.pick(["pre", "listing"]), html ? { dangerouslySetInnerHTML: { __html: r.pick(["\nx", "x", ["\nx"]]) } } : null, (valid && html) || r.next() < 0.3 ? undefined : r.pick(["\nx", ["\nx"], text()]));
    }
    case 13:
      return h("my-el", maybe({ className: "c", obj: { a: 1 }, num: 2, t: true, f: false, onClick: () => {}, onclick: "x()", style: { color: "red" }, htmlFor: "x", list: [1, 2] }), some());
    case 14:
      return h("div", maybe({ is: "x-y", className: "c", for: "f", tabIndex: 1, t: true }), some());
    case 15:
      return h("svg", maybe({ viewBox: "0 0 1 1", xlinkHref: "x", strokeWidth: 2, className: "c" }), h("path", maybe({ d: "M0", fillOpacity: 0.5 })), h("foreignObject", null, some(2)));
    case 16:
      return h("math", null, h("mi", maybe({ mathVariant: "normal", className: "c" }), text()));
    case 17: {
      const html = r.next() < 0.5;
      return h("div", html ? { dangerouslySetInnerHTML: { __html: "<b>\nx</b>" } } : maybe({ suppressHydrationWarning: true, suppressContentEditableWarning: true, contentEditable: true, innerHTML: "x" }), (valid && html) || r.next() < 0.5 ? undefined : some());
    }
    case 18:
      return h("table", null, h("tbody", null, h("tr", null, h("td", maybe({ colSpan: 2, rowSpan: "x", valign: "top" }), some()))));
    case 19:
      return h(r.pick(["DIV", "SELECT", "Span"]), maybe({ className: "c", defaultValue: "a" }), r.pick([some(), option()]));
    case 20:
      return h(Pass, null, some());
    case 21:
      return h(r.pick(["img", "br", "hr", "wbr", "col"]), maybe({ src: "data:image/png;base64,x", loading: "lazy", alt: text(), width: 2, className: "c" }));
    default:
      return h(r.pick(["div", "span", "p", "b", "a", "td", "section", "font", "center", "html", "head", "body"]), maybe({ className: "c", style: { paddingTop: 2, "--x": "y" }, href: "https://x.com/?a=1&b=2", title: text() }), some());
  }
}
