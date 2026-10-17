/**
 * The engine's entry points: a template's content collected (its Rows, Columns and blocks recorded, see
 * utils/record.tsx, as a tree of its records, markup and text), synchronously or waiting for what's async in it;
 * markup rendered (Elements' own components: the root's HTML); one component called with hooks (a template wrapper).
 * See ARCHITECTURE.md.
 */
import type React from "react";
import { asHost, callWithHooks, SUSPEND, type HookState } from "./dispatcher";
import { childFrame, nameOf, omits, positionOf, RenderError, rootFrame, threw, type OnError } from "./errors";
import { flatten, PENDING, type Flat, type Part } from "./output";
import { checkReact } from "./self-test";
import { pushTreeContext, ROOT_TREE, type TreeContext } from "./tree-id";
import { caller, positioned, thrownBy, walkNode, type Collector, type Task, type Walker } from "./walk";

export { RenderError, type OnError } from "./errors";
export { htmlOf, type Flat, type Item, type Markup, type Cut, type RecordItem } from "./output";
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
}

type WalkerOptions = Pick<CollectOptions, "onError" | "collector" | "passes" | "frameless">;

const walker = (async: boolean, options: Partial<WalkerOptions>): Walker => ({
  async,
  collector: options.collector,
  passes: options.passes,
  frameless: options.frameless,
  omit: omits(options.onError),
  made: new WeakSet(),
  fatal: new WeakSet(),
  done: false,
  settled: () => {},
});

/** Where a walk starts: where the component that started it is, if the walker is calling one (see `caller`). */
const task = (root: string, tree?: TreeContext): Task => ({ tree: tree ?? caller()?.tree ?? ROOT_TREE, contexts: caller()?.contexts ?? null, frame: rootFrame(root), watch: null });

/** `node` collected synchronously: what's async in it fails (or is left out, as `onError` says). */
export function collect(node: React.ReactNode, options: CollectOptions): Flat {
  checkReact();
  const w = walker(false, options);
  const t = task(options.root, options.tree);
  const out: Part[] = [];
  try {
    walkNode(w, node, t, out);
  } catch (error) {
    throw thrownBy(w, error, t.frame);
  }
  return flatten(out, w.omit) as Flat;
}

/** `node` collected once everything async in it has settled (siblings at once, the output in tree order). */
export function collectAsync(node: React.ReactNode, options: CollectOptions): Promise<Flat> {
  checkReact();
  const w = walker(true, options);
  const t = task(options.root, options.tree);
  const out: Part[] = [];
  try {
    walkNode(w, node, t, out);
  } catch (error) {
    out.push({ t: "error", error: thrownBy(w, error, t.frame) as RenderError, fatal: true });
  }
  return new Promise((resolve, reject) => {
    // Whenever a hole settles: done once everything before the first error (or everything) has.
    w.settled = () => {
      if (w.done) return;
      try {
        const flat = flatten(out, w.omit);
        if (flat === PENDING) return;
        w.done = true;
        resolve(flat);
      } catch (error) {
        w.done = true;
        reject(error as RenderError);
      }
    };
    w.settled();
  });
}

let own = 0;
/** Whether Elements' own markup is rendering (see renderStatic): a root reads no context of the render around it. */
export const ownMarkup = (): boolean => own > 0;

/**
 * Markup of Elements' own (a root's, a row's) as react-dom's static render writes it: `bare` components (Elements',
 * which call no hooks) are called with the dispatcher of the render around it in the slot, as that render would call
 * them (see asHost); others with hooks. A RenderError in it passes as it is.
 */
export function renderStatic(node: React.ReactNode, options: { bare?: (type: unknown) => boolean; passes?: (error: unknown) => boolean } = {}): string {
  checkReact();
  const w: Walker = { ...walker(false, options), passAll: true, bare: options.bare };
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
      throw positioned(walker(false, {}), thrown, state.name, rootFrame(state.name));
    }
    if (state.rerender && ++renders <= 25) continue;
    return { value, tree: state.localId > 0 ? pushTreeContext(state.tree, 1, 0) : state.tree };
  }
}

export { hookState, readContext, contextOf, type ContextStack, type HookState } from "./dispatcher";
export { renderClass } from "./walk";
export { ROOT_TREE } from "./tree-id";
