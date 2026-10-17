/**
 * Template components (`<Welcome />`, `memo`, `forwardRef`) unwrapped down to
 * their root element. `renderToJson` walks the element tree and `renderToHtml`
 * reads the root's settings (fonts, language, direction, phone styles) from it,
 * so a wrapper is called first to reach <Email>/<Page>/<Document>/<Body>.
 *
 * Each wrapper is called once, with hooks (the engine's dispatcher), at its place in the tree and inside the context
 * providers around it, as React would call it; the content then starts where the wrappers left the tree, so its
 * `useId()`s and theirs are one document's.
 */

import React from "react";
import type { UnlayerConfig } from "@unlayer-internal/shared-elements";
import { UNLAYER_RENDER_KEY } from "./create-component";
import { RECORDS } from "./collect";
import { TAILWIND } from "./tailwind";
import { callClass, callComponent, contextOf, hookState, ROOT_TREE, RenderError, type ContextStack, type TreeContext } from "../engine";
import { nameOf, threw } from "../engine/errors";
import { isRoot } from "./root-type";

const CONTAINER_NAMES = new Set(["Row", "Column"]);
export const MEMO = Symbol.for("react.memo");
export const FORWARD_REF = Symbol.for("react.forward_ref");
/** A context's provider: `<Ctx.Provider>` in React 18, `<Ctx>` (and `<Ctx.Provider>`, the same) in React 19. */
const PROVIDER = Symbol.for("react.provider");
const CONTEXT = Symbol.for("react.context");

/** On <UnlayerProvider> (see context/UnlayerProvider.tsx). */
const UNLAYER_PROVIDER = Symbol.for("@unlayer/react-elements/provider");
export const isUnlayerProvider = (type: unknown): boolean => !!(type as Record<symbol, unknown> | null)?.[UNLAYER_PROVIDER];

/**
 * The config of the <UnlayerProvider>s around a root, by the root `unwrapRoot` gave back: the render functions read
 * it as React would give it to the root (with no context: React Server Components have none).
 */
const PROVIDED = new WeakMap<object, Partial<UnlayerConfig>>();

/** The config of the <UnlayerProvider>s `unwrapRoot` found around `root` (the inner one's keys over the outer's). */
export const providedConfig = (root: React.ReactElement): Partial<UnlayerConfig> | undefined => PROVIDED.get(root);

/** Where a root's content starts in the tree, by the content (the root's children), as its wrappers left it. */
const CONTENT_TREE = new WeakMap<object, TreeContext>();
export const contentTree = (children: unknown): TreeContext | undefined => (children !== null && typeof children === "object" ? CONTENT_TREE.get(children) : undefined);

/**
 * The Elements component an element is, by the `displayName` Elements gives
 * each of its own: a user function that happens to be named `Email` or `Row`
 * (a template, a wrapper) isn't one, and is called like any component.
 */
export function getDisplayName(element: React.ReactElement): string | undefined {
  return (element.type as any)?.displayName;
}

/** A component's name, for messages. */
export function componentName(element: React.ReactElement): string | undefined {
  const type = element.type as any;
  return type?.displayName || type?.name;
}

/** Whether a component type is an Elements component (a root, of any copy: see root-type.ts; a container or a content block). */
export function isElementsType(type: any): boolean {
  return !!type?.[UNLAYER_RENDER_KEY] || isRoot(type) || CONTAINER_NAMES.has(type?.displayName);
}

/** Thrown for a template that is async or suspends: renderToHtml renders synchronously. */
const ASYNC_TEMPLATE =
  'async and suspending templates need "@unlayer/react-elements/async"\'s renderers, or their data loaded first and passed as props';

export const isThenable = (value: unknown): value is PromiseLike<unknown> => typeof (value as { then?: unknown } | null)?.then === "function";

/** The provider an element is (`<Ctx value>`, `<Ctx.Provider value>`): its context and value. */
function providerOf(element: unknown): { context: object; value: unknown } | undefined {
  if (!React.isValidElement(element)) return undefined;
  const type = element.type as any;
  const props = element.props as { value?: unknown };
  if (type?.$$typeof === PROVIDER) return { context: type._context, value: props.value };
  if (type?.$$typeof === CONTEXT && "value" in props && type.Provider === type) return { context: contextOf(type), value: props.value };
  return undefined;
}

export type Steps = Generator<PromiseLike<unknown>, React.ReactElement, unknown>;

/**
 * `call()` (a wrapper's: see the engine's callComponent) again each time it suspends, once what it suspended on
 * settles (`use()` of a pending promise, or a thrown one: React 18's Suspense), as React calls it again: what it
 * returns. What it waits for is yielded: the async renderers wait for it, the synchronous ones throw.
 */
function* waiting<T>(call: () => T): Generator<PromiseLike<unknown>, T, unknown> {
  for (;;) {
    try {
      return call();
    } catch (thrown) {
      if (!isThenable(thrown)) throw thrown;
      try {
        yield thrown;
      } catch {
        // It rejected: called again, the wrapper fails with it (`use()` throws it, and a promise thrown again is its
        // rejection: see the engine's `failure`).
      }
    }
  }
}

/**
 * Wrappers called (plain functions, `memo`, `forwardRef`, nested in any order) until a root element comes out. It
 * stops at an element that isn't a root when a wrapper doesn't return an element (null, an array), saying why in
 * `why.unread`. What a wrapper waits for (an async one's promise, `use()`, a thrown promise) is yielded: the
 * async renderers wait for it, the synchronous ones throw.
 */
function* steps(element: React.ReactElement, why: { unread?: string }, idPrefix?: string): Steps {
  let current = element;
  // Context providers around the root (`<Theme.Provider value="dark"><Email>…`): the root's content goes in them.
  const providers: React.ReactElement[] = [];
  let contexts: ContextStack | null = null;
  let tree = ROOT_TREE;
  // The config of the <UnlayerProvider>s among them, the inner one's keys over the outer's (see providedConfig).
  let provided: Record<string, unknown> | undefined;
  /** `fn` called as the component `name` (hooks, context), its promises yielded. */
  function* called(fn: (props: any, second?: unknown) => unknown, props: Record<string, unknown>, second: unknown, name: string): Generator<PromiseLike<unknown>, unknown, unknown> {
    // (Its `useId()`s' prefix: the render's, else the <UnlayerProvider>s' around it.)
    const prefix = idPrefix ?? provided?.idPrefix;
    const state = hookState(name, tree, contexts, typeof prefix === "string" ? prefix : "");
    const out = yield* waiting(() => callComponent(fn, props, second, state));
    tree = out.tree;
    if (!isThenable(out.value)) return out.value;
    try {
      return yield out.value;
    } catch (error) {
      throw new RenderError(threw(error), name, "", error);
    }
  }
  for (let depth = 0; ; depth++) {
    if (isRoot(current.type)) break;
    // A Row or block: what it renders is Elements' own, never a root.
    if (elementsOwn(current)) break;
    if (depth === 20) {
      why.unread = "it wraps more than 20 components";
      break;
    }
    const type = current.type as any;
    const props = current.props as Record<string, unknown>;
    if (type?.$$typeof === MEMO) {
      current = React.createElement(type.type, props);
      continue;
    }
    const inside = () => {
      const list = React.Children.toArray(props.children as React.ReactNode);
      return list.length === 1 && React.isValidElement(list[0]) ? list[0] : undefined;
    };
    // An <UnlayerProvider>: its config is the root's (read here, as React Server Components have no context), and it
    // stays around the root's content, as a context provider does, for `useUnlayerConfig()` there and in wrappers.
    if (type?.[UNLAYER_PROVIDER]) {
      const only = inside();
      if (!only) break;
      for (const [key, value] of Object.entries((props.config ?? {}) as Record<string, unknown>)) if (value !== undefined) (provided ??= {})[key] = value;
      const given = providerOf(yield* called(type, props, undefined, "UnlayerProvider"));
      if (given) contexts = { ...given, context: contextOf(given.context), next: contexts };
      providers.push(current);
      current = only;
      continue;
    }
    // A context provider, or a <Tailwind>, around it: the root's content goes in it (a <Tailwind>'s classes are the
    // root's, see Body).
    const provider = providerOf(current);
    if (provider || type?.[TAILWIND]) {
      const only = inside();
      if (!only) break;
      if (provider) contexts = { context: contextOf(provider.context), value: provider.value, next: contexts };
      providers.push(current);
      current = only;
      continue;
    }
    // A Fragment, StrictMode or Profiler around the template (`<><Welcome /></>`): what's in it, when that's one
    // element. They add nothing to a server render.
    if (type === React.Fragment || type === React.StrictMode || type === React.Profiler) {
      const only = inside();
      if (!only) break;
      current = only;
      continue;
    }
    let produced: unknown;
    if (type?.$$typeof === FORWARD_REF) produced = yield* called(type.render, { ...props }, null, nameOf(type));
    else if (typeof type === "function" && !type.prototype?.isReactComponent) produced = yield* called(type, { ...props }, undefined, nameOf(type));
    else if (type?.prototype?.isReactComponent) {
      // A class (react-intl's <IntlProvider>): constructed and rendered, inside the providers around it.
      const around = contexts;
      produced = yield* waiting(() => callClass(type, props, around));
    } else break;
    if (!React.isValidElement(produced)) {
      if (holdsRoot(produced as React.ReactNode)) why.unread = "it doesn't return a root element";
      break;
    }
    current = produced;
  }
  if (!isRoot(current.type)) return current;
  const own = (current.props as { children?: React.ReactNode }).children;
  const children = providers.reduceRight<React.ReactNode>((inside, provider) => React.cloneElement(provider, undefined, inside), own);
  const root = providers.length ? React.cloneElement(current, undefined, children) : current;
  if (provided) PROVIDED.set(root, provided as Partial<UnlayerConfig>);
  const content = (root.props as { children?: React.ReactNode }).children;
  if (content !== null && typeof content === "object" && tree !== ROOT_TREE) CONTENT_TREE.set(content, tree);
  return root;
}

/** The root a template unwraps to (see steps); one that waits for something fails, with what to do. */
export function unwrapRoot(element: React.ReactElement, why: { unread?: string } = {}, idPrefix?: string): React.ReactElement {
  const run = steps(element, why, idPrefix);
  const step = run.next();
  if (step.done) return step.value;
  step.value.then(undefined, () => {});
  throw new Error(ASYNC_TEMPLATE);
}

/** The steps to the root a template unwraps to (see steps), which the async renderers take, waiting where they wait. */
export const unwrapSteps = (element: React.ReactElement, idPrefix?: string): Steps => steps(element, {}, idPrefix);

/** Elements' own Row, Column or block (not a component of the user's own named like one, which is called). */
const elementsOwn = (element: React.ReactElement): boolean => {
  const type = element.type as any;
  return !!(type?.[UNLAYER_RENDER_KEY] || type?.[RECORDS]);
};

/** Whether a root element is somewhere in `node` (markup, Fragments, arrays, providers), whose settings would go unread. */
function holdsRoot(node: React.ReactNode): boolean {
  if (Array.isArray(node)) return node.some(holdsRoot);
  if (!React.isValidElement(node)) return false;
  return isRoot(node.type) || (!elementsOwn(node) && holdsRoot((node.props as { children?: React.ReactNode }).children));
}

/** The advice both render functions give when a wrapper can't be unwrapped. */
export const UNWRAP_ADVICE = "Pass the root element (<Email>…</Email>), or a function component that returns one.";

/**
 * For renderToHtml: the root a template component unwraps to. An element that
 * is already an Elements component (or plain HTML) is returned as it is. When
 * a wrapper can't be unwrapped it's rendered as it is, with a warning: its root's
 * settings aren't read. A wrapper that throws fails the render (a RenderError naming it).
 */
export function htmlRoot(element: React.ReactElement, api: string, idPrefix?: string): React.ReactElement {
  if (typeof element.type === "string" || isElementsType(element.type)) return element;
  const why: { unread?: string } = {};
  let root: React.ReactElement;
  try {
    root = unwrapRoot(element, why, idPrefix);
  } catch (cause) {
    // An async template can't be rendered synchronously: say why.
    if (cause instanceof Error && cause.message === ASYNC_TEMPLATE) throw new Error(`[Unlayer] ${api}: ${ASYNC_TEMPLATE}.`);
    throw cause;
  }
  if (isRoot(root.type)) return root;
  // A template of Rows, or nothing: there's no root whose settings go unread.
  if (!why.unread && !holdsRoot(root)) return element;
  console.warn(`[Unlayer] ${api}: couldn't unwrap <${componentName(element) || "wrapper"}> (${why.unread ?? "its root is inside other markup"}): its root's fonts, lang, dir and phone styles are ignored. ${UNWRAP_ADVICE}`);
  return element;
}
