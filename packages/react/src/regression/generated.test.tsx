/**
 * Templates put together at random from the ways users combine things
 * (conditions, Fragments, components with hooks, memo/forwardRef, arrays,
 * components that render nothing, Rows with a layout), rendered with this
 * build and with the last published Elements (`@unlayer/react-elements-previous`).
 *
 * Each template knows what React shows for it: the text of every block a
 * condition doesn't leave out, in order. Where the previous release showed
 * that and this build doesn't, it's a regression: the test fails, printing the
 * seed and the template. Where neither shows it, it's a bug both have (counted,
 * not failed). Hand-written patterns cover what's known; this finds the shapes
 * no one wrote down.
 *
 *   GENERATED_SEEDS=5000 pnpm vitest run src/regression/generated.test.tsx
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import React, { forwardRef, memo, useMemo, useState } from "react";
import * as current from "../index";
import * as previous from "@unlayer/react-elements-previous";

type Lib = typeof current;
const releases: Record<"current" | "previous", Lib> = { current, previous: previous as unknown as Lib };

// ── The templates ───────────────────────────────────────────────────────────

type Block = { kind: "paragraph" | "heading" | "button" | "html"; word: string } | { kind: "divider" };
/** What a component does with what it holds. */
type Wrapper = "plain" | "state" | "memoized" | "memo" | "forwardRef";
type Item<T> =
  | { kind: "is"; value: T }
  | { kind: "when"; show: boolean; value: T }
  | { kind: "fragment"; values: Array<Item<T>> }
  | { kind: "component"; wrapper: Wrapper; values: Array<Item<T>> }
  | { kind: "array"; values: Array<Item<T>> }
  | { kind: "nothing" };
type Column = { blocks: Array<Item<Block>> };
type Row = { columns: Array<Item<Column>>; layout: boolean };
type Template = { root: "Email" | "Page" | "Document"; rows: Array<Item<Row>>; wrap: "none" | "component" | "memo" | "fragment" };

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
  return { next, pick: <T,>(list: readonly T[]) => list[Math.floor(next() * list.length)], chance: (p: number) => next() < p };
}

function generate(seed: number): Template {
  const r = random(seed);
  let words = 0;
  const word = () => `w${++words}`;
  const WRAPPERS: Wrapper[] = ["plain", "state", "memoized", "memo", "forwardRef"];
  const item = <T,>(make: () => T, depth: number, allowNothing: boolean): Item<T> => {
    const roll = r.next();
    if (depth > 2 || roll < 0.45) return { kind: "is", value: make() };
    if (roll < 0.6) return { kind: "when", show: r.chance(0.5), value: make() };
    if (roll < 0.72) return { kind: "fragment", values: list(make, depth + 1, 1 + Math.floor(r.next() * 2), allowNothing) };
    if (roll < 0.88) return { kind: "component", wrapper: r.pick(WRAPPERS), values: list(make, depth + 1, 1 + Math.floor(r.next() * 2), allowNothing) };
    if (roll < 0.95) return { kind: "array", values: list(make, depth + 1, 1 + Math.floor(r.next() * 2), allowNothing) };
    return allowNothing ? { kind: "nothing" } : { kind: "is", value: make() };
  };
  const list = <T,>(make: () => T, depth: number, n: number, allowNothing: boolean) => Array.from({ length: n }, () => item(make, depth, allowNothing));
  const block = (): Block => {
    const kind = r.pick(["paragraph", "paragraph", "heading", "button", "html", "divider"] as const);
    return kind === "divider" ? { kind } : { kind, word: word() };
  };
  const column = (): Column => ({ blocks: list(block, 0, 1 + Math.floor(r.next() * 3), true) });
  const row = (): Row => {
    // A layout counts the Columns as written (a condition's place included), as users write them.
    const layout = r.chance(0.4);
    const columns = Array.from({ length: 1 + Math.floor(r.next() * 3) }, () =>
      layout ? (r.chance(0.3) ? ({ kind: "when", show: r.chance(0.5), value: column() } as Item<Column>) : ({ kind: "is", value: column() } as Item<Column>)) : item(column, 1, false)
    );
    return { columns, layout };
  };
  return {
    root: r.pick(["Email", "Email", "Page", "Document"] as const),
    rows: list(row, 0, 1 + Math.floor(r.next() * 3), true),
    wrap: r.pick(["none", "none", "component", "memo", "fragment"] as const),
  };
}

/** The words React shows for an item, in order. */
function shown<T>(item: Item<T>, words: (value: T) => string[]): string[] {
  switch (item.kind) {
    case "is":
      return words(item.value);
    case "when":
      return item.show ? words(item.value) : [];
    case "nothing":
      return [];
    default:
      return item.values.flatMap((v) => shown(v, words));
  }
}
const blockWords = (b: Block) => ("word" in b ? [b.word] : []);
const columnWords = (c: Column) => c.blocks.flatMap((b) => shown(b, blockWords));
const rowWords = (row: Row) => row.columns.flatMap((c) => shown(c, columnWords));
const expected = (t: Template) => t.rows.flatMap((row) => shown(row, rowWords));

/** The template as React elements, with one release's components. */
function build(t: Template, L: Lib): React.ReactElement {
  let componentIds = 0;
  const wrap = <T,>(wrapper: Wrapper, render: () => React.ReactNode): React.ReactElement => {
    const id = ++componentIds;
    let Component: React.ComponentType<{ tag: number }>;
    if (wrapper === "state") Component = ({ tag }) => {
      const [value] = useState(tag);
      return <>{value === tag ? render() : null}</>;
    };
    else if (wrapper === "memoized") Component = () => <>{useMemo(render, [])}</>;
    else if (wrapper === "memo") Component = memo(() => <>{render()}</>);
    else if (wrapper === "forwardRef") Component = forwardRef<HTMLDivElement, { tag: number }>(() => <>{render()}</>) as unknown as React.ComponentType<{ tag: number }>;
    else Component = () => <>{render()}</>;
    return <Component key={`c${id}`} tag={id} />;
  };
  const render = <T,>(item: Item<T>, value: (v: T, key: string) => React.ReactElement, key: string): React.ReactNode => {
    switch (item.kind) {
      case "is":
        return value(item.value, key);
      case "when":
        return item.show && value(item.value, key);
      case "nothing":
        return null;
      case "fragment":
        return <React.Fragment key={key}>{item.values.map((v, i) => render(v, value, `${key}.${i}`))}</React.Fragment>;
      case "array":
        return item.values.map((v, i) => render(v, value, `${key}.${i}`));
      case "component":
        return wrap(item.wrapper, () => item.values.map((v, i) => render(v, value, `${key}.${i}`)));
    }
  };
  const block = (b: Block, key: string): React.ReactElement => {
    switch (b.kind) {
      case "paragraph":
        return <L.Paragraph key={key}>{b.word}</L.Paragraph>;
      case "heading":
        return <L.Heading key={key}>{b.word}</L.Heading>;
      case "button":
        return <L.Button key={key} href="https://example.com/go">{b.word}</L.Button>;
      case "html":
        return <L.Html key={key} html={`<p>${b.word}</p>`} />;
      case "divider":
        return <L.Divider key={key} />;
    }
  };
  const column = (c: Column, key: string) => <L.Column key={key}>{c.blocks.map((b, i) => render(b, block, `${key}.${i}`))}</L.Column>;
  const LAYOUTS = [L.ColumnLayouts.OneColumn, L.ColumnLayouts.TwoEqual, L.ColumnLayouts.ThreeEqual];
  const row = (rw: Row, key: string) => (
    <L.Row key={key} {...(rw.layout ? { layout: LAYOUTS[rw.columns.length - 1] } : {})}>
      {rw.columns.map((c, i) => render(c, column, `${key}.${i}`))}
    </L.Row>
  );
  const Root = L[t.root];
  const email = <Root>{t.rows.map((rw, i) => render(rw, row, `r${i}`))}</Root>;
  if (t.wrap === "component") {
    const Template = () => email;
    return <Template />;
  }
  if (t.wrap === "memo") {
    const Template = memo(() => email);
    return <Template />;
  }
  return t.wrap === "fragment" ? <>{email}</> : email;
}

// ── What each release shows ─────────────────────────────────────────────────

const WORD = /^w\d+$/i;
const words = (text: string) => text.split(/[^A-Za-z0-9]+/).filter((w) => WORD.test(w)).map((w) => w.toLowerCase());

/** The words of the HTML's body, as a reader sees them. */
function htmlWords(html: string): string[] {
  return words(html.replace(/<head[\s\S]*?<\/head>/gi, "").replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]+>/g, " "));
}

/** The words of the design's blocks, row by row, column by column. */
function designWords(design: any): string[] {
  const out: string[] = [];
  for (const row of design?.body?.rows ?? []) for (const column of row.columns ?? []) for (const block of column.contents ?? []) out.push(...words(JSON.stringify(block.values ?? {})));
  return out;
}

type Output = { html?: string[]; text?: string[]; design?: string[] };
function outputs(t: Template, L: Lib): Output {
  const attempt = <T,>(f: () => T): T | undefined => {
    try {
      return f();
    } catch {
      return undefined;
    }
  };
  return {
    html: attempt(() => htmlWords(L.renderToHtml(build(t, L)))),
    text: attempt(() => words(L.renderToPlainText(build(t, L)))),
    design: attempt(() => designWords(L.renderToJson(build(t, L)))),
  };
}

const SEEDS = Number(process.env.GENERATED_SEEDS ?? 600);

beforeAll(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterAll(() => vi.restoreAllMocks());

describe("generated templates", () => {
  it(`show what the previous release showed, in ${SEEDS} templates`, () => {
    const regressions: string[] = [];
    const both = { html: 0, text: 0, design: 0 };
    for (let seed = 1; seed <= SEEDS; seed++) {
      const template = generate(seed);
      const want = expected(template).join(" ");
      const now = outputs(template, releases.current);
      const before = outputs(template, releases.previous);
      for (const part of ["html", "text", "design"] as const) {
        const got = now[part]?.join(" ");
        if (got === want) continue;
        if (before[part]?.join(" ") === want) {
          regressions.push(`seed ${seed}, ${part}: expected "${want}", got ${got === undefined ? "an error" : `"${got}"`}\n  ${JSON.stringify(template)}`);
        } else both[part]++;
      }
    }
    if (both.html || both.text || both.design) console.info(`Bugs both releases have (not regressions): ${JSON.stringify(both)} of ${SEEDS} templates`);
    expect(regressions, regressions.slice(0, 5).join("\n")).toEqual([]);
  }, Math.max(10_000, SEEDS * 10));
});
