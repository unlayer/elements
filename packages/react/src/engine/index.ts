/**
 * The engine's entry points: a template's content collected (its Rows, Columns and blocks recorded, see
 * utils/record.tsx, as a tree of its records, markup and text), synchronously or waiting for what's async in it;
 * markup rendered (Elements' own components: the root's HTML); one component called with hooks (a template wrapper).
 * See ARCHITECTURE.md.
 */
import type React from "react";
import { asHost, callWithHooks, SUSPEND, type HookState } from "./dispatcher";
import { childFrame, nameOf, omits, positionOf, RenderError, rootFrame, threw, type OnError } from "./errors";
import { flatten, type Flat, type Part } from "./output";
import { checkReact } from "./self-test";
import { pushTreeContext, ROOT_TREE, type TreeContext } from "./tree-id";
import { caller, positioned, thrownBy, walkNode, type Collector, type Task, type Wait, type Walker } from "./walk";

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
 * A root of Elements' own (Email, Page, Document, Body: `bare`, they call no hooks) as renderStatic renders it, but
 * the HTML in its `<div>` given as it is (`inner`): what renderStatic would write, without writing it out again. Where
 * it isn't one, or doesn't render a `<div>` of HTML in the end, `html` is renderStatic's.
 */
export function renderRoot(node: React.ReactElement, options: { bare?: (type: unknown) => boolean; passes?: (error: unknown) => boolean } = {}): { html: string; inner?: string } {
  const bare = options.bare;
  if (typeof node.type !== "function" || !bare?.(node.type)) return { html: renderStatic(node, options) };
  checkReact();
  own++;
  try {
    return asHost(() => {
      let frame = rootFrame("");
      let element: any = node;
      // Email > Body > its <div>: each called as renderStatic calls them, where it would.
      for (;;) {
        const type = element.type;
        const name = nameOf(type);
        frame = childFrame(frame, name);
        let result: any;
        try {
          result = type(element.props);
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
 * One of Elements' own components (a Row, a block: they call no hooks), given its props, as renderStatic renders it:
 * called, and the HTML it returns (in a `<div dangerouslySetInnerHTML>`) in its `<div>`; anything else it returns
 * walked. What it throws is a RenderError naming it, as renderStatic's.
 */
export function renderOwn(type: (props: any) => unknown, props: Record<string, unknown>, options: { bare?: (type: unknown) => boolean; passes?: (error: unknown) => boolean } = {}): string {
  let result: any;
  try {
    result = type(props);
  } catch (error) {
    if (error instanceof RenderError || options.passes?.(error)) throw error;
    const name = nameOf(type);
    throw new RenderError(threw(error), name, positionOf(childFrame(rootFrame(""), name)), error);
  }
  const html = result?.type === "div" && Object.keys(result.props).length === 1 ? result.props.dangerouslySetInnerHTML : undefined;
  if (html && typeof html === "object" && "__html" in html) return `<div>${html.__html == null ? "" : "" + html.__html}</div>`;
  return renderStatic(result, options);
}

/**
 * A template wrapper (`<Welcome />`, which returns the root) called with hooks: what it returns (an async one's
 * promise as it is), and where what it returns is in the tree. `state` (hookState(), at the wrapper's place and inside
 * the providers around it) is kept when it's called again after `use()` suspended it, which throws the promise.
 */
export function callComponent(fn: (props: any, second?: unknown) => unknown, props: Record<string, unknown>, second: unknown, state: HookState): { value: unknown; tree: TreeContext } {
  checkReact();
  for (let renders = 0; ; ) {
    state.localId = 0;
    state.thenableIndex = 0;
    state.hookIndex = 0;
    state.rerender = false;
    let value: unknown;
    try {
      value = callWithHooks(state, () => fn(props, second));
    } catch (thrown) {
      if (thrown === SUSPEND) {
        state.hooks = undefined;
        throw state.suspendedOn;
      }
      throw positioned(walker({}), thrown, state.name, rootFrame(state.name));
    }
    if (state.rerender && ++renders <= 25) continue;
    return { value, tree: state.localId > 0 ? pushTreeContext(state.tree, 1, 0) : state.tree };
  }
}

export { hookState, readContext, contextOf, type ContextStack, type HookState } from "./dispatcher";
export { renderClass } from "./walk";
export { ROOT_TREE } from "./tree-id";
