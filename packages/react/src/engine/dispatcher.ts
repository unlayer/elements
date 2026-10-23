/**
 * Elements' hooks dispatcher: what React's hooks do while the walker (walk.ts) calls a component. React's hook
 * functions call the dispatcher in a slot of React's internals (see react-compat.ts). The walker puts this one there
 * synchronously around each component call, and the one that was there back after (in `finally`, never across an
 * await), so a render it runs inside (the app's react-dom render, Next.js's Server Components) keeps its own.
 *
 * Server semantics, as react-dom's static render has them: context from the walker's provider stack (else its
 * default, whatever renders around it or before it provided: see `defaultOf`), `useId` from the
 * tree position, initial state (a state set while rendering renders the component again, its last render counts),
 * effects never run, `use()` of a pending thenable suspends. A hook it doesn't know (a newer React's) throws a named
 * error, instead of React's "dispatcher.useX is not a function".
 */
import React from "react";
import { slotOf, type Slot } from "./react-compat";
import { makeId, type TreeContext } from "./tree-id";

// ── Context: a linked stack the walker passes down (immutable, so a resumed component keeps the one it had) ──

export interface ContextStack {
  context: object;
  value: unknown;
  next: ContextStack | null;
}

const CONTEXT = Symbol.for("react.context");
const CONSUMER = Symbol.for("react.consumer");

/** The context a `useContext` argument names: React 19's Consumer, React 18's development Consumer, or the context. */
export const contextOf = (usable: any): any => (usable?.$$typeof === CONSUMER || (usable?._context && usable.$$typeof === CONTEXT) ? usable._context : usable);

/** What a render reads for each context no provider in it gives, worked out at its first read (see `readContext`). */
export type Fallbacks = Map<object, unknown>;

/**
 * A context's value: the nearest provider's in the walk (or around the component that started it), else its fallback
 * (see `defaultOf`), worked out once per render (`fallbacks`, the top-level render's, which the renders it starts
 * share: see the engine's Walker), so a render that starts inside an app's render and goes on after it (an async one)
 * reads one value for it throughout.
 */
export function readContext(stack: ContextStack | null, usable: unknown, fallbacks?: Fallbacks): unknown {
  const context = contextOf(usable);
  // (Worked out where it's provided too, so it's seen while React's values still hold it: see `defaultOf`.)
  let fallback: unknown;
  if (!fallbacks || typeof context !== "object" || context === null) fallback = defaultOf(context);
  else if (fallbacks.has(context)) fallback = fallbacks.get(context);
  else fallbacks.set(context, (fallback = defaultOf(context)));
  for (let s = stack; s; s = s.next) if (s.context === context) return s.value;
  return fallback;
}

/** The default each context was last seen to have, outside React's renders (see `defaultOf`). */
const defaults = new WeakMap<object, unknown>();

/**
 * A context's default. React keeps it only in two values, which its renders set while they render and don't always
 * put back: `_currentValue` (react-dom's streaming render's, and its client's: after a stream, what the last part it
 * waited for was given) and `_currentValue2` (renderToString's and renderToStaticMarkup's, and other secondary
 * renderers': after one that failed or suspended inside a provider, what it was given there). Where they agree, that's
 * it (learned when no render of React's is running, where they'd hold its values: each time, so a value learned
 * wrong, both left the same by two renders, is learned right again); where they differ, one is what a render left:
 * the default learned, else `_currentValue2`, which react-dom's streaming render never sets. So inside an app's
 * renderToString, a context Elements hasn't learned yet reads that render's value. (React 18's `_defaultValue` is a
 * server context's, null for these.)
 */
function defaultOf(context: any): unknown {
  const value = context._currentValue;
  if (value === context._currentValue2) {
    if (typeof context === "object" && !hostRunning()) defaults.set(context, value);
    return value;
  }
  return defaults.has(context) ? defaults.get(context) : context._currentValue2;
}

// ── The component being called ──

export interface HookState {
  /** Its name, for messages. */
  name: string;
  tree: TreeContext;
  contexts: ContextStack | null;
  /** What its `useId()`s start with (the render's `idPrefix`). */
  idPrefix: string;
  /** What its render reads for contexts no provider gives (see `readContext`). */
  fallbacks?: Fallbacks;
  /** useId calls so far (React's localIdCounter): more than 0 gives its children a fork of the tree. */
  localId: number;
  /** Thenables `use()` was given, by call order, kept when it's called again (React's thenableState). */
  thenables: Tracked<unknown>[];
  thenableIndex: number;
  /** The thenable a `use()` suspended on. */
  suspendedOn?: PromiseLike<unknown>;
  /** Hook slots, kept across the renders a state set while rendering starts again. */
  hooks?: Record<string, any>[];
  hookIndex: number;
  /** It set its state while it rendered: the walker calls it again. */
  rerender: boolean;
}

export function hookState(name: string, tree: TreeContext, contexts: ContextStack | null, idPrefix = "", fallbacks?: Fallbacks): HookState {
  return { name, tree, contexts, idPrefix, fallbacks, localId: 0, thenables: [], thenableIndex: 0, hookIndex: 0, rerender: false };
}

/** Thrown by `use()` of a pending thenable (the walker reads `suspendedOn`). */
export const SUSPEND = { toString: () => "[Unlayer] suspended" };

let active: HookState | null = null;

function current(): HookState {
  if (!active) throw new Error("[Unlayer] Invalid hook call: hooks can only be called inside the body of a function component.");
  return active;
}

type Tracked<T> = PromiseLike<T> & { status?: "pending" | "fulfilled" | "rejected"; value?: T; reason?: unknown };

/** React's thenable protocol: `status`, then `value` or `reason`, set once it settles (React 19 reads them too). */
export function track<T>(thenable: Tracked<T>): void {
  if (thenable.status) return;
  thenable.status = "pending";
  thenable.then(
    (value) => {
      if (thenable.status === "pending") Object.assign(thenable, { status: "fulfilled", value });
    },
    (reason) => {
      if (thenable.status === "pending") Object.assign(thenable, { status: "rejected", reason });
    }
  );
}

const noop = () => {};

function useThenable<T>(state: HookState, given: Tracked<T>): T {
  const index = state.thenableIndex++;
  let thenable = given;
  const previous = state.thenables[index] as Tracked<T> | undefined;
  if (previous === undefined) state.thenables.push(thenable);
  else if (previous !== thenable) {
    // Called again, it made a new promise for the same `use()` (`use(fetchData())`): the first one's, as React does.
    thenable.then(noop, noop);
    thenable = previous;
  }
  track(thenable);
  if (thenable.status === "fulfilled") return thenable.value as T;
  if (thenable.status === "rejected") throw thenable.reason;
  state.suspendedOn = thenable;
  throw SUSPEND;
}

/** The component's next hook slot (React's work-in-progress hook list, as Fizz keeps it across render-phase updates). */
function slotFor(state: HookState): { fresh: boolean; hook: Record<string, any> } {
  const hooks = (state.hooks ??= []);
  const index = state.hookIndex++;
  if (index < hooks.length) return { fresh: false, hook: hooks[index] };
  const hook = {};
  hooks.push(hook);
  return { fresh: true, hook };
}

const basicStateReducer = (state: unknown, action: unknown) => (typeof action === "function" ? (action as (s: unknown) => unknown)(state) : action);

function useReducer(reducer: (state: unknown, action: unknown) => unknown, arg: unknown, init?: (arg: unknown) => unknown): [unknown, (action: unknown) => void] {
  const state = current();
  const { fresh, hook } = slotFor(state);
  if (fresh) {
    hook.state = init ? init(arg) : arg;
    hook.queue = [];
    // A set while it renders (its own render) is applied when it's called again; any other does nothing on a server.
    hook.dispatch = (action: unknown) => {
      if (active !== state) return;
      hook.queue.push(action);
      state.rerender = true;
    };
  } else if (hook.queue.length) {
    for (const action of hook.queue) hook.state = reducer(hook.state, action);
    hook.queue = [];
  }
  return [hook.state, hook.dispatch];
}

const sameDeps = (a: unknown[] | null | undefined, b: unknown[] | null | undefined) => !!a && !!b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));

function useMemo(make: () => unknown, deps?: unknown[] | null): unknown {
  const { fresh, hook } = slotFor(current());
  if (!fresh && deps != null && sameDeps(deps, hook.deps)) return hook.value;
  hook.value = make();
  hook.deps = deps;
  return hook.value;
}

/** A function a hook gives that can't run while rendering (React's server renderer throws the same). */
const notWhileRendering = (what: string) => () => {
  throw new Error(`[Unlayer] ${what} while rendering.`);
};
const NOT_PENDING = Object.freeze({ pending: false, data: null, method: null, action: null });
const MEMO_CACHE_SENTINEL = Symbol.for("react.memo_cache_sentinel");

/** A context's value for the component being called. */
function contextValue(context: unknown): unknown {
  const state = current();
  return readContext(state.contexts, context, state.fallbacks);
}

const HOOKS = {
  readContext: contextValue,
  useContext: contextValue,
  use(usable: any) {
    const state = current();
    if (usable !== null && typeof usable === "object") {
      if (typeof usable.then === "function") return useThenable(state, usable);
      if (usable.$$typeof === CONTEXT || usable.$$typeof === CONSUMER) return readContext(state.contexts, usable, state.fallbacks);
    }
    throw new Error("[Unlayer] An unsupported type was passed to use(): " + String(usable));
  },
  useState: (initial: unknown) => useReducer(basicStateReducer, initial, typeof initial === "function" ? (f) => (f as () => unknown)() : undefined),
  useReducer,
  useMemo,
  useCallback: (callback: unknown, deps?: unknown[] | null) => useMemo(() => callback, deps),
  useRef(value: unknown) {
    const { fresh, hook } = slotFor(current());
    if (fresh) hook.ref = { current: value };
    return hook.ref;
  },
  useId() {
    const state = current();
    return makeId(state.tree, state.localId++, state.idPrefix);
  },
  // Effects never run on a server.
  useEffect: noop,
  useLayoutEffect: noop,
  useInsertionEffect: noop,
  useImperativeHandle: noop,
  useDebugValue: noop,
  useEffectEvent: () => (current(), notWhileRendering("A function wrapped in useEffectEvent can't be called")),
  useDeferredValue: (value: unknown, initial?: unknown) => (current(), initial !== undefined ? initial : value),
  useTransition: () => (current(), [false, notWhileRendering("startTransition can't be called")]),
  useSyncExternalStore(_subscribe: unknown, _get: unknown, getServerSnapshot?: () => unknown) {
    current();
    if (getServerSnapshot === undefined) throw new Error("[Unlayer] Missing getServerSnapshot, which useSyncExternalStore needs on a server.");
    return getServerSnapshot();
  },
  useOptimistic: (passthrough: unknown) => (current(), [passthrough, notWhileRendering("Optimistic state can't be updated")]),
  useActionState: (_action: unknown, initial: unknown) => (current(), [initial, notWhileRendering("Form state can't be updated"), false]),
  useFormState: (_action: unknown, initial: unknown) => (current(), [initial, notWhileRendering("Form state can't be updated"), false]),
  // react-dom's useFormStatus: no form is submitting on a server.
  useHostTransitionStatus: () => (current(), NOT_PENDING),
  // The React Compiler's cache: a new one each render, as a server render has.
  useMemoCache: (size: number) => new Array(size).fill(MEMO_CACHE_SENTINEL),
  useCacheRefresh: () => notWhileRendering("The cache can't be refreshed"),
};

/** A hook this dispatcher doesn't have (a newer React's): a named error when it's called, instead of a crash. */
const unknownHooks = new Proxy(
  {},
  {
    get: (_, key) =>
      typeof key === "string" && /^use[A-Z]/.test(key)
        ? () => {
            throw new Error(`[Unlayer] <${active?.name ?? "component"}> calls ${key}, which Elements' renderer doesn't support (React ${React.version}).`);
          }
        : undefined,
  }
);

/** The dispatcher the walker installs: the hooks above, unknown ones through the Proxy (lookups of known ones stay fast). */
export const DISPATCHER: typeof HOOKS = Object.setPrototypeOf(HOOKS, unknownHooks);

let slot: Slot | null | undefined;
/** React's slot, or null where this React has none the table knows (the self-test says so). */
export const theSlot = (): Slot | null => (slot === undefined ? (slot = slotOf()) : slot);

/** The dispatcher of the render the walker runs inside (the app's react-dom render, Next.js's), or null. */
let host: unknown = null;

/**
 * Whether a dispatcher in React's slot is no running render's: none, or React's between its client renders (its
 * ContextOnlyDispatcher, which React 18 and 19 leave in the slot after the first one, and hold during effects), whose
 * hooks are one function that throws "Invalid hook call". Its identities are compared, nothing on it called. A running
 * render's hooks differ (the server's, the client's mount and update ones; React Server Components' share one function
 * for most, but not for useContext), so it's a host; and so is a shape this doesn't know, where defaults then aren't
 * learned (the safe side).
 */
export function isIdleDispatcher(d: any): boolean {
  if (d == null) return true;
  return typeof d.useState === "function" && d.useState === d.useEffect && d.useState === d.useContext && d.useState === d.useCallback;
}

/** Whether a render other than Elements' is running around this call (the app's react-dom render, Next.js's). */
function hostRunning(): boolean {
  const current = theSlot()?.get() ?? null;
  return !isIdleDispatcher(current === DISPATCHER ? host : current);
}

/**
 * Calls `fn` as the component `state` describes: this dispatcher in React's slot, and the one there before put back
 * after, synchronously. Hooks called after an await in `fn` (an async component's) find whatever's there then.
 */
export function callWithHooks<T>(state: HookState, fn: () => T): T {
  const s = theSlot();
  const outerState = active;
  const outerHost = host;
  active = state;
  const previous = s?.get();
  if (previous !== DISPATCHER) host = previous ?? null;
  s?.set(DISPATCHER);
  try {
    return fn();
  } finally {
    s?.set(previous);
    active = outerState;
    host = outerHost;
  }
}

/**
 * Runs `fn` (Elements' own markup, whose components call no hooks) with the dispatcher of the render the walker runs
 * inside back in the slot, as if that render ran it: react-dom puts its context back after a render of its own
 * started inside one of its renders (an exporter's) only when its own dispatcher was there.
 */
export function asHost<T>(fn: () => T): T {
  const s = theSlot();
  if (!s || s.get() !== DISPATCHER) return fn();
  s.set(host);
  try {
    return fn();
  } finally {
    s.set(DISPATCHER);
  }
}

/** Whether a React render is under way with this React (its hooks can be called): the app's, or the walker's. */
export const rendering = (): boolean => (theSlot()?.get() ?? null) !== null;
