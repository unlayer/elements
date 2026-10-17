/**
 * The engine's entry points: a template's content collected (its Rows, Columns and blocks recorded, see
 * utils/record.tsx, as a tree of its records, markup and text), synchronously or waiting for what's async in it;
 * markup rendered (Elements' own components: the root's HTML); one component called with hooks (a template wrapper).
 * See ARCHITECTURE.md.
 */
import React, { cloneElement } from "react";
import { asHost, type ContextStack, type HookState } from "./dispatcher";
import { childFrame, nameOf, omits, positionOf, RenderError, rootFrame, threw, type OnError } from "./errors";
import { flatten, type Flat, type Part } from "./output";
import { checkReact } from "./self-test";
import { pushTreeContext, ROOT_TREE, type TreeContext } from "./tree-id";
import { call, caller, failure, positioned, renderClass, suspension, thrownBy, walkNode, type Collector, type Task, type Wait, type Walker } from "./walk";

export { RenderError, type OnError } from "./errors";
export { flatten, htmlOf, PENDING, type Flat, type Item, type Markup, type Cut, type Part, type RecordItem } from "./output";
export { errorPart, type Task, type Wait } from "./walk";
export { track } from "./dispatcher";
export type { TreeContext } from "./tree-id";
export type { Collector, Recorded } from "./walk";

export interface CollectOptions {
  collector: Collector;
  onError?: OnError;
  /** The root's name (Email, Page, …): where positions start. */
  root: string;
  /** Where the content is in the tree (after the template wrappers called to reach the root: see call()). */
  tree?: TreeContext;
  /** Errors passed on as they are. */
  passes?: (error: unknown) => boolean;
  /** Components that are no place of their own in positions. */
  frameless?: (type: unknown) => boolean;
  /** What the `useId()`s start with (React's `identifierPrefix`). */
  idPrefix?: string;
}

type WalkerOptions = Pick<CollectOptions, "onError" | "collector" | "passes" | "frameless" | "idPrefix">;

const walker = (options: Partial<WalkerOptions>, wait?: Wait): Walker => ({
  wait,
  collector: options.collector,
  passes: options.passes,
  frameless: options.frameless,
  idPrefix: options.idPrefix,
  omit: omits(options.onError),
  suspense: 0,
  made: new WeakSet(),
  fatal: new WeakSet(),
});

/** Where a walk starts: where the component that started it is, if the walker is calling one (see `caller`). */
const task = (root: string, tree?: TreeContext): Task => ({ tree: tree ?? caller()?.tree ?? ROOT_TREE, contexts: caller()?.contexts ?? null, frame: rootFrame(root), watch: null });

/** `node` collected synchronously: what's async in it fails (or is left out, as `onError` says). */
export function collect(node: React.ReactNode, options: CollectOptions): Flat {
  checkReact();
  const w = walker(options);
  const t = task(options.root, options.tree);
  const out: Part[] = [];
  try {
    walkNode(w, node, t, out);
  } catch (error) {
    throw thrownBy(w, error, t.frame);
  }
  return flatten(out, w.omit) as Flat;
}

/**
 * `node` walked to collect it, waiting where `wait` says (the async renderers' holes: see src/async/collect.ts), its
 * output as it is then (holes in it), and whether failed parts are left out: flattened once its holes settle.
 */
export function walkAsync(node: React.ReactNode, options: CollectOptions, wait: Wait): { parts: Part[]; omit: boolean } {
  checkReact();
  const w = walker(options, wait);
  const t = task(options.root, options.tree);
  const out: Part[] = [];
  try {
    walkNode(w, node, t, out);
  } catch (error) {
    out.push({ t: "error", error: thrownBy(w, error, t.frame) as RenderError, fatal: true });
  }
  return { parts: out, omit: w.omit };
}

let own = 0;
/** Whether Elements' own markup is rendering (see renderStatic): a root reads no context of the render around it. */
export const ownMarkup = (): boolean => own > 0;

/**
 * Markup of Elements' own (a root's, a row's) as react-dom's static render writes it: `bare` components (Elements',
 * which call no hooks) are called with the dispatcher of the render around it in the slot, as that render would call
 * them (see asHost); others with hooks. A RenderError in it passes as it is.
 */
export function renderStatic(node: React.ReactNode, options: { bare?: (type: unknown) => boolean; passes?: (error: unknown) => boolean; idPrefix?: string } = {}): string {
  checkReact();
  const w: Walker = { ...walker(options), passAll: true, bare: options.bare };
  const out: Part[] = [];
  own++;
  try {
    asHost(() => walkNode(w, node, task(""), out));
  } finally {
    own--;
  }
  return out.join("");
}

/**
 * An element of one of Elements' own components (`bare`: a root, a Row, a block, which call no hooks), with `given`
 * props, as renderStatic renders it, but the HTML it renders in its `<div dangerouslySetInnerHTML>` given as it is
 * (`inner`): what renderStatic would write, without writing it out again; a root's Body called in turn, as
 * renderStatic calls it. Where it isn't one, or doesn't render such a `<div>` in the end, `html` is renderStatic's.
 */
export function renderOwn(node: React.ReactElement, given: Record<string, unknown>, options: { bare?: (type: unknown) => boolean; passes?: (error: unknown) => boolean } = {}): { html: string; inner?: string } {
  const bare = options.bare;
  const type = node.type;
  if (typeof type !== "function" || !bare?.(type)) return { html: renderStatic(cloneElement(node, given), options) };
  const props = { ...(node.props as object), ...given };
  checkReact();
  own++;
  try {
    return asHost(() => {
      let frame = rootFrame("");
      let element: any = { type, props };
      for (;;) {
        const name = nameOf(element.type);
        frame = childFrame(frame, name);
        let result: any;
        try {
          result = element.type(element.props);
        } catch (error) {
          if (error instanceof RenderError || options.passes?.(error)) throw error;
          throw new RenderError(threw(error), name, positionOf(frame), error);
        }
        const html = result?.type === "div" && Object.keys(result.props).length === 1 ? result.props.dangerouslySetInnerHTML : undefined;
        if (html && typeof html === "object" && "__html" in html) return { html: "", inner: html.__html == null ? "" : "" + html.__html };
        if (typeof result?.type !== "function" || !bare(result.type)) return { html: renderStatic(result, options) };
        element = result;
      }
    });
  } finally {
    own--;
  }
}

/**
 * A template wrapper (`<Welcome />`, which returns the root) called with hooks: what it returns (an async one's
 * promise as it is), and where what it returns is in the tree. What it suspends on (`use()` of a pending promise, or a
 * thrown one: React 18's Suspense) is thrown as it is, for its caller to call it again once it settles (see
 * utils/unwrap-root.ts): `state` (hookState(), at the wrapper's place and inside the providers around it) is kept.
 */
export function callComponent(fn: (props: any, second?: unknown) => unknown, props: Record<string, unknown>, second: unknown, state: HookState): { value: unknown; tree: TreeContext } {
  checkReact();
  let value: unknown;
  try {
    value = call(state, fn, props, second);
  } catch (thrown) {
    const thenable = suspension(thrown, state);
    if (thenable) {
      state.hooks = undefined;
      throw thenable;
    }
    throw positioned(walker({}), failure(thrown), state.name, rootFrame(state.name));
  }
  return { value, tree: state.localId > 0 ? pushTreeContext(state.tree, 1, 0) : state.tree };
}

/** A template wrapper that's a class (react-intl's <IntlProvider>), constructed and rendered inside `contexts`: as callComponent. */
export function callClass(Ctor: any, props: Record<string, unknown>, contexts: ContextStack | null): unknown {
  checkReact();
  try {
    return renderClass(Ctor, props, contexts);
  } catch (thrown) {
    const thenable = suspension(thrown);
    if (thenable) throw thenable;
    const name = nameOf(Ctor);
    throw positioned(walker({}), failure(thrown), name, rootFrame(name));
  }
}

export { hookState, readContext, contextOf, type ContextStack, type HookState } from "./dispatcher";
export { ROOT_TREE } from "./tree-id";
