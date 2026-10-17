/**
 * The walker: renders a React element tree as react-dom's static server render would, without react-dom. Function
 * components are called with Elements' hooks dispatcher (dispatcher.ts), class components constructed and rendered,
 * Context, Fragments, memo, forwardRef, lazy and Suspense handled here, host markup written by host.ts.
 *
 * One synchronous walk serves both renderers. Where a component suspends (an async component, `use()` of a pending
 * promise, a thrown promise, a lazy component, a promise as a child), the synchronous renderer throws (to the nearest
 * <Suspense>, whose fallback it renders, as react-dom does); the async one (`wait`: the async entry's, see
 * src/async/collect.ts) leaves a hole in the output, walks on (so siblings start their own work at once) and fills the
 * hole when the promise settles, with the tree position and context it had (output.ts puts it all in tree order).
 *
 * A collecting walk (the template's, see utils/record.tsx) asks its collector about each element first: Elements'
 * Rows, Columns and blocks are recorded instead of called, and what's inside them walked inside their records; its
 * output is the template's content as a tree (output.ts).
 */
import type React from "react";
import { callWithHooks, contextOf, hookState, readContext, SUSPEND, track, type ContextStack, type HookState } from "./dispatcher";
import { ASYNC_IN_SYNC, childFrame, nameOf, placeFrame, positionOf, RenderError, threw, type Frame } from "./errors";
import { escapeText, leadingNewline, openTag, propsBody, validateHost, VOID } from "./host";
import { REACT_18 } from "./react-compat";
import { checkKeys } from "./keys";
import { isWalkerNode, type BoundaryNode, type RecordNode } from "./records";
import type { BoundaryPart, ErrorPart, HostPart, Part, RecordPart } from "./output";
import { pushTreeContext, type TreeContext } from "./tree-id";

const ELEMENT = Symbol.for("react.element");
const TRANSITIONAL = Symbol.for("react.transitional.element");
const PORTAL = Symbol.for("react.portal");
const FRAGMENT = Symbol.for("react.fragment");
const SUSPENSE = Symbol.for("react.suspense");
const PROVIDER = Symbol.for("react.provider");
const CONTEXT = Symbol.for("react.context");
const CONSUMER = Symbol.for("react.consumer");
const FORWARD_REF = Symbol.for("react.forward_ref");
const MEMO = Symbol.for("react.memo");
const LAZY = Symbol.for("react.lazy");
const CLIENT_REF = Symbol.for("react.client.reference");
const ACTIVITY = Symbol.for("react.activity");
/** What renders its children as they are on a server. */
const PASSTHROUGH = new Set<unknown>([FRAGMENT, Symbol.for("react.strict_mode"), Symbol.for("react.profiler"), Symbol.for("react.suspense_list"), Symbol.for("react.view_transition"), Symbol.for("react.legacy_hidden"), Symbol.for("react.scope")]);

/** What a collecting walk walks for an element instead of calling it (its record), and the name it's at. */
export interface Recorded {
  name?: string;
  /** (`position`, where it is: `Row 3 › Column 1 › Button`, worked out when an error asks.) */
  record(position: () => string): React.ReactNode;
}
export type Collector = (element: React.ReactElement) => Recorded | undefined;

/** What waits for `thenable` (an async walk's hole), and `fill`s the walk's output where it is once it settles. */
export type Wait = (w: Walker, task: Task, out: Part[], thenable: PromiseLike<unknown>, fill: (task: Task, parts: Part[]) => void) => void;

export interface Walker {
  /** How it waits for what's async (the async renderers'); a synchronous walk throws to the nearest <Suspense>. */
  wait?: Wait;
  /** Pass on any RenderError (a render of Elements' own markup: its components' errors are placed already). */
  passAll?: boolean;
  /** Components called as they are, with whatever dispatcher is there (Elements' own, which call no hooks). */
  bare?: (type: unknown) => boolean;
  /** Errors passed on as they are (a <Tailwind>'s, which says what to do itself). */
  passes?: (error: unknown) => boolean;
  /** Components that are no place of their own in positions (an <UnlayerProvider>: its children are where it is). */
  frameless?: (type: unknown) => boolean;
  /** What the `useId()`s start with (the render's `idPrefix`). */
  idPrefix?: string;
  collector?: Collector;
  /** Boundaries leave out what fails (`onError: "omit"`); an async walk's always catch, flattening decides. */
  omit: boolean;
  /** The RenderErrors this walk made (one from a render inside a component is that component's error). */
  made: WeakSet<object>;
  /** RenderErrors for a template that isn't one: never left out. */
  fatal: WeakSet<object>;
}

export interface Task {
  tree: TreeContext;
  contexts: ContextStack | null;
  frame: Frame;
  /** A boundary's own component, whose return value its record keeps (`output`: see src/model/elements.ts's keptMarkup). */
  watch: { element: unknown; record: Record<string, any> } | null;
}

/**
 * Where the component the walker is calling is, for a walk that component starts (a root's content, rendered by
 * Body; a render the template's code starts): its providers are around that walk, as React's nested renders read the
 * values of the render they're in, and its place in the tree is where that walk's ids start, so they're the document's.
 */
let calling: { tree: TreeContext; contexts: ContextStack | null } | null = null;
export const caller = () => calling;

/** `fn`, called as a component at `task` (see `calling`). */
function asCaller<T>(task: Task, fn: () => T): T {
  const outer = calling;
  calling = { tree: task.tree, contexts: task.contexts };
  try {
    return fn();
  } finally {
    calling = outer;
  }
}

/** A suspension a synchronous walk can't wait for: to the nearest <Suspense>, or a RenderError that says so. */
export class SyncSuspend {
  constructor(
    readonly name: string,
    readonly frame: Frame
  ) {}
}

const isThenable = (value: unknown): value is PromiseLike<unknown> => typeof (value as { then?: unknown } | null)?.then === "function";
const isAsyncFunction = (fn: unknown) => (fn as { [Symbol.toStringTag]?: string } | null)?.[Symbol.toStringTag] === "AsyncFunction";
/** A promise nothing waits for: its rejection mustn't end the process. */
const settle = (thenable: PromiseLike<unknown>) => void thenable.then(undefined, () => {});

/** `error`, thrown in `name` at `frame`, as the RenderError that says so (one this walk made already stays as it is). */
export function positioned(w: Walker, error: unknown, name: string, frame: Frame): unknown {
  if (error instanceof SyncSuspend || (error instanceof RenderError && (w.passAll || w.made.has(error))) || w.passes?.(error)) return error;
  const made = new RenderError(threw(error), name, positionOf(frame), error);
  w.made.add(made);
  return made;
}

/** A RenderError for a template that isn't one (thrown, whatever `onError` says). */
function fatal(w: Walker, message: string, frame: Frame): RenderError {
  const made = new RenderError(message, frame.name || "template", positionOf(frame));
  w.made.add(made);
  w.fatal.add(made);
  return made;
}

/** What failed, as a RenderError: a suspension a synchronous walk couldn't wait for, too. */
export function asRenderError(w: Walker, error: unknown, frame: Frame): RenderError {
  if (error instanceof SyncSuspend) return new RenderError(ASYNC_IN_SYNC, error.name, positionOf(error.frame));
  return positioned(w, error, frame.name, frame) as RenderError;
}

/** What a walk throws: a RenderError, or an error passed on as it is. */
export const thrownBy = (w: Walker, error: unknown, frame: Frame): unknown => (w.passes?.(error) ? error : asRenderError(w, error, frame));

export const errorPart = (w: Walker, error: unknown, frame: Frame): ErrorPart => {
  const made = thrownBy(w, error, frame) as RenderError;
  return { t: "error", error: made, fatal: w.fatal.has(made) || !(made instanceof RenderError) };
};

// ── Nodes ──

export function walkNode(w: Walker, node: unknown, task: Task, out: Part[]): void {
  if (node === null || node === undefined || typeof node === "boolean") return;
  if (typeof node === "string") {
    if (node) out.push(escapeText(node));
    return;
  }
  if (typeof node === "number") return void out.push("" + node);
  if (typeof node === "bigint") {
    // react-dom 18 writes nothing for one.
    if (!REACT_18) out.push("" + node);
    return;
  }
  if (typeof node === "function" || typeof node === "symbol") return;
  if (Array.isArray(node)) return walkArray(w, node, task, out);
  const object = node as Record<string | symbol, any>;
  const tag = object.$$typeof;
  if (tag === ELEMENT || tag === TRANSITIONAL) return walkElement(w, object as unknown as React.ReactElement, task, out);
  if (isWalkerNode(object)) return "boundary" in object ? walkBoundary(w, object, task, out) : walkRecord(w, object, task, out);
  if (tag === PORTAL) throw fatal(w, "Portals aren't supported by server rendering (React's server renderer has none either)", task.frame);
  if (tag === LAZY) return walkLazy(w, object, task, out, (resolved, t, parts) => walkNode(w, resolved, t, parts));
  if (typeof object[Symbol.iterator] === "function") return walkArray(w, Array.from(object as Iterable<unknown>), task, out);
  if (!REACT_18) {
    // React 19 renders what a promise child resolves to, as `use()` would, and a context's value.
    if (isThenable(object)) return walkThenable(w, object, task, out);
    if (tag === CONTEXT) return walkNode(w, readContext(task.contexts, object), task, out);
  }
  const keys = Object.prototype.toString.call(object) === "[object Object]" ? `object with keys {${Object.keys(object).join(", ")}}` : Object.prototype.toString.call(object);
  throw fatal(w, `Objects are not valid as a React child (found: ${keys}). If you meant to render a collection of children, use an array instead`, task.frame);
}

function walkArray(w: Walker, list: unknown[], task: Task, out: Part[]): void {
  checkKeys(list, task.frame.name);
  const parent = task.tree;
  const total = list.length;
  try {
    for (let i = 0; i < total; i++) {
      task.tree = pushTreeContext(parent, total, i);
      walkNode(w, list[i], task, out);
    }
  } finally {
    task.tree = parent;
  }
}

function walkElement(w: Walker, element: React.ReactElement, task: Task, out: Part[]): void {
  const type = element.type as any;
  const props = element.props as Record<string, any>;
  if (typeof type === "string") return walkHost(w, type, props, task, out);
  const recorded = w.collector?.(element);
  if (recorded) return walkRecorded(w, recorded, task, out);
  if (typeof type === "function") {
    if (type.$$typeof === CLIENT_REF) throw clientReference(w, type, task);
    if (type.prototype?.isReactComponent) return walkClass(w, type, props, task, out);
    return walkFunction(w, type, type, props, undefined, task, out, watched(task, element));
  }
  if (PASSTHROUGH.has(type)) return walkNode(w, props.children, task, out);
  if (type === SUSPENSE) return walkSuspense(w, props, task, out);
  if (type === ACTIVITY) return props.mode === "hidden" ? undefined : walkNode(w, props.children, task, out);
  if (type !== null && typeof type === "object") {
    switch (type.$$typeof) {
      case FORWARD_REF: {
        // React 19 passes `ref` in props, React 18 beside them.
        let ref: unknown = null;
        let own = props;
        if (REACT_18) ref = (element as { ref?: unknown }).ref ?? null;
        else if ("ref" in props) ({ ref, ...own } = props);
        return walkFunction(w, type.render, type, own, ref, task, out, watched(task, element));
      }
      case MEMO: {
        const inner = type.type;
        const own = REACT_18 ? withDefaults(inner, props) : props;
        if (typeof inner === "function" && !inner.prototype?.isReactComponent) return walkFunction(w, inner, type, own, undefined, task, out, watched(task, element));
        return walkElement(w, { ...element, type: inner, props: own } as React.ReactElement, task, out);
      }
      case LAZY:
        return walkLazy(w, type, task, out, (resolved, t, parts) => walkElement(w, { ...element, type: resolved, props: withDefaults(resolved, props) } as React.ReactElement, t, parts));
      case PROVIDER:
        return withContext(w, type._context, props, task, out);
      case CONTEXT:
        // React 18: a Consumer (the context, or in development an object with `_context`). React 19: the provider.
        return REACT_18 ? walkNode(w, props.children(readContext(task.contexts, type)), task, out) : withContext(w, type, props, task, out);
      case CONSUMER:
        return walkNode(w, props.children(readContext(task.contexts, type._context)), task, out);
      case CLIENT_REF:
        throw clientReference(w, type, task);
    }
  }
  const missing = type === undefined || (typeof type === "object" && type !== null && Object.keys(type).length === 0);
  throw fatal(
    w,
    `Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: ${type === null ? "null" : typeof type}.${missing ? " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports." : ""}`,
    task.frame
  );
}

/** The record that keeps what `element` returns, when it's a boundary's own component. */
const watched = (task: Task, element: unknown) => (task.watch && task.watch.element === element ? task.watch.record : undefined);

const clientReference = (w: Walker, type: any, task: Task) =>
  fatal(w, `<${type.$$id ?? type.name ?? "component"}> is a Client Component ("use client"): it can't render in server code (a Server Component or route handler). Render it from a Client Component, or import it without "use client"`, task.frame);

function withDefaults(type: any, props: Record<string, unknown>): Record<string, unknown> {
  const defaults = type?.defaultProps;
  if (!defaults) return props;
  const out = { ...props };
  for (const key in defaults) if (out[key] === undefined) out[key] = defaults[key];
  return out;
}

function withContext(w: Walker, context: object, props: Record<string, any>, task: Task, out: Part[]): void {
  const outer = task.contexts;
  task.contexts = { context: contextOf(context), value: props.value, next: outer };
  try {
    walkNode(w, props.children, task, out);
  } finally {
    task.contexts = outer;
  }
}

/** What a collecting walk walks for an Elements component: its record, at the place its name takes. */
function walkRecorded(w: Walker, recorded: Recorded, task: Task, out: Part[]): void {
  const outer = task.frame;
  const frame = recorded.name ? childFrame(outer, recorded.name) : outer;
  let nodes: React.ReactNode;
  try {
    nodes = recorded.record(() => positionOf(frame));
  } catch (error) {
    throw positioned(w, error, frame.name, frame);
  }
  task.frame = frame;
  try {
    walkNode(w, nodes, task, out);
  } finally {
    task.frame = outer;
  }
}

/**
 * A record, what's inside it walked into it. Its children are where a list of three (its start, them, its end) had
 * them, as the walk wrote a record's two ends before: their tree positions, so their `useId()`s, are as they were.
 */
function walkRecord(w: Walker, node: RecordNode, task: Task, out: Part[]): void {
  const part: RecordPart = { t: "record", record: node.record, parts: [], quiet: node.quiet };
  out.push(part);
  if (node.children === undefined) return;
  const tree = task.tree;
  task.tree = pushTreeContext(tree, 3, 1);
  try {
    walkNode(w, node.children, task, part.parts);
  } finally {
    task.tree = tree;
  }
}

/** A part of the template left out when it fails (`onError: "omit"`): a component's, in its record. */
function walkBoundary(w: Walker, node: BoundaryNode, task: Task, out: Part[]): void {
  const part: BoundaryPart = { t: "boundary", parts: [] };
  out.push(part);
  let into = part.parts;
  if (node.boundary) {
    const record: RecordPart = { t: "record", record: node.boundary, parts: [] };
    part.parts.push(record);
    into = record.parts;
  }
  const watch = task.watch;
  task.watch = node.boundary ? { element: node.child, record: node.boundary as Record<string, any> } : null;
  try {
    walkNode(w, node.child, task, into);
  } catch (error) {
    if (!w.wait && !w.omit) throw error;
    part.parts.push(errorPart(w, error, task.frame));
  } finally {
    task.watch = watch;
  }
}

// ── Components ──

function walkFunction(w: Walker, fn: Function, named: unknown, props: Record<string, any>, secondArg: unknown, task: Task, out: Part[], keep?: Record<string, any>): void {
  const name = nameOf(named);
  const frame = w.frameless?.(named) ? task.frame : childFrame(task.frame, name);
  // Not called when nothing can wait for it (and the promise it gives back could reject unhandled).
  if (!w.wait && isAsyncFunction(fn)) throw new SyncSuspend(name, frame);
  const state = hookState(name, task.tree, task.contexts, w.idPrefix);
  if (!w.bare?.(named)) return callAndWalk(w, state, fn, props, secondArg, frame, task, out, keep);
  let result: unknown;
  try {
    result = asCaller(task, () => fn(props, secondArg));
  } catch (error) {
    throw positioned(w, error, name, frame);
  }
  walkResult(w, state, result, frame, task, out);
}

function callAndWalk(w: Walker, state: HookState, fn: Function, props: Record<string, any>, secondArg: unknown, frame: Frame, task: Task, out: Part[], keep?: Record<string, any>): void {
  let result: unknown;
  try {
    result = asCaller(task, () => call(state, fn, props, secondArg));
  } catch (thrown) {
    const thenable = thrown === SUSPEND ? state.suspendedOn! : isThenable(thrown) ? thrown : undefined;
    if (!thenable) throw positioned(w, thrown, state.name, frame);
    // `use()` of a pending promise, or a thrown one (React 18's Suspense): called again once it settles, with fresh
    // hooks and the results `use()` had, as React does.
    if (!w.wait) {
      settle(thenable);
      throw new SyncSuspend(state.name, frame);
    }
    return w.wait(w, task, out, thenable, (t, parts) => {
      state.hooks = undefined;
      callAndWalk(w, state, fn, props, secondArg, frame, t, parts, keep);
    });
  }
  if (isThenable(result)) {
    // An async component: what its promise resolves to (it isn't called again).
    if (!w.wait) {
      settle(result);
      throw new SyncSuspend(state.name, frame);
    }
    const promise = result as PromiseLike<unknown> & { status?: string; value?: unknown; reason?: unknown };
    return w.wait(w, task, out, promise, (t, parts) => {
      if (promise.status === "rejected") throw positioned(w, promise.reason, state.name, frame);
      if (keep) keep.output = { value: promise.value };
      walkResult(w, state, promise.value, frame, t, parts);
    });
  }
  if (keep) keep.output = { value: result };
  walkResult(w, state, result, frame, task, out);
}

/** A component's own call, with hooks: again while it sets its state as it renders (its last render counts). */
function call(state: HookState, fn: Function, props: Record<string, any>, secondArg: unknown): unknown {
  for (let renders = 0; ; ) {
    state.localId = 0;
    state.thenableIndex = 0;
    state.hookIndex = 0;
    state.rerender = false;
    const result = callWithHooks(state, () => fn(props, secondArg));
    if (!state.rerender) return result;
    if (++renders > 25) throw new Error("Too many re-renders: a component sets its state every time it renders.");
  }
}

function walkResult(w: Walker, state: HookState, result: unknown, frame: Frame, task: Task, out: Part[]): void {
  const tree = task.tree;
  const outer = task.frame;
  // A component that called useId gives its children a fork of the tree, as React does.
  if (state.localId > 0) task.tree = pushTreeContext(tree, 1, 0);
  task.frame = frame;
  try {
    walkNode(w, result, task, out);
  } finally {
    task.tree = tree;
    task.frame = outer;
  }
}

function walkClass(w: Walker, Ctor: any, given: Record<string, any>, task: Task, out: Part[]): void {
  const frame = childFrame(task.frame, nameOf(Ctor));
  let result: unknown;
  try {
    result = asCaller(task, () => renderClass(Ctor, given, task.contexts));
  } catch (error) {
    throw positioned(w, error, frame.name, frame);
  }
  const outer = task.frame;
  task.frame = frame;
  try {
    walkNode(w, result, task, out);
  } finally {
    task.frame = outer;
  }
}

/** A class component constructed and rendered as a server renders one (its state from getDerivedStateFromProps, or componentWillMount). */
export function renderClass(Ctor: any, given: Record<string, any>, contexts: ContextStack | null): unknown {
  const props = withDefaults(Ctor, given) as Record<string, any>;
  const context = Ctor.contextType ? readContext(contexts, Ctor.contextType) : {};
  const queue: unknown[] = [];
  const updater = {
    isMounted: () => false,
    enqueueSetState: (_: unknown, partial: unknown) => void queue.push(partial),
    enqueueReplaceState: (_: unknown, state: unknown) => void ((queue.length = 0), queue.push(state)),
    enqueueForceUpdate: () => {},
  };
  const instance = new Ctor(props, context, updater);
  Object.assign(instance, { props, context, updater });
  if (instance.state === undefined) instance.state = null;
  if (typeof Ctor.getDerivedStateFromProps === "function") {
    const partial = Ctor.getDerivedStateFromProps(props, instance.state);
    if (partial != null) instance.state = { ...instance.state, ...partial };
  } else {
    const willMount = instance.UNSAFE_componentWillMount ?? instance.componentWillMount;
    if (typeof willMount === "function") {
      willMount.call(instance);
      for (const partial of queue) {
        const next = typeof partial === "function" ? partial.call(instance, instance.state, props, context) : partial;
        if (next != null) instance.state = { ...instance.state, ...next };
      }
    }
  }
  return instance.render();
}

function walkSuspense(w: Walker, props: Record<string, any>, task: Task, out: Part[]): void {
  // The async renderer waits for what's in it.
  if (w.wait) return walkNode(w, props.children, task, out);
  const inside: Part[] = [];
  try {
    walkNode(w, props.children, task, inside);
  } catch (error) {
    if (!(error instanceof SyncSuspend)) throw error;
    // What suspended can't be waited for: the fallback, as react-dom's synchronous render writes it.
    return walkNode(w, props.fallback, task, out);
  }
  for (const part of inside) out.push(part);
}

// ── What waits ──

type Thenable = PromiseLike<unknown> & { status?: "pending" | "fulfilled" | "rejected"; value?: unknown; reason?: unknown };

function walkThenable(w: Walker, thenable: Thenable, task: Task, out: Part[]): void {
  track(thenable);
  if (thenable.status === "fulfilled") return walkNode(w, thenable.value, task, out);
  if (thenable.status === "rejected") throw positioned(w, thenable.reason, task.frame.name, task.frame);
  if (!w.wait) {
    settle(thenable);
    throw new SyncSuspend(task.frame.name, task.frame);
  }
  w.wait(w, task, out, thenable, (t, parts) => walkThenable(w, thenable, t, parts));
}

function walkLazy(w: Walker, lazy: Record<string, any>, task: Task, out: Part[], walk: (resolved: any, task: Task, parts: Part[]) => void): void {
  let resolved: unknown;
  try {
    resolved = lazy._init(lazy._payload);
  } catch (thrown) {
    if (!isThenable(thrown)) throw positioned(w, thrown, "lazy", placeFrame(task.frame, "lazy"));
    if (!w.wait) {
      settle(thrown);
      throw new SyncSuspend("lazy", placeFrame(task.frame, "lazy"));
    }
    return w.wait(w, task, out, thrown, (t, parts) => walkLazy(w, lazy, t, parts, walk));
  }
  walk(resolved, task, out);
}

// ── Markup ──

function walkHost(w: Walker, type: string, props: Record<string, any>, task: Task, out: Part[]): void {
  try {
    validateHost(type, props);
  } catch (error) {
    throw positioned(w, error, type, placeFrame(task.frame, type));
  }
  const open = openTag(type, props);
  const close = VOID.has(type) ? "" : `</${type}>`;
  // A collecting walk's markup is content (output.ts): its records are in it, where they are.
  let into = out;
  if (w.collector) {
    const part: HostPart = { t: "host", tag: type, open, close, parts: [] };
    out.push(part);
    into = part.parts;
  } else out.push(open);
  if (!close) return;
  const body = propsBody(type, props);
  if (body !== undefined) into.push(body);
  else {
    const lead = leadingNewline(type, props.children);
    if (lead) into.push(lead);
    walkNode(w, props.children, task, into);
  }
  if (!w.collector) out.push(close);
}
