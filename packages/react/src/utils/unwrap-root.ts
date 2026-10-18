/**
 * Template components (`<Welcome />`, `memo`, `forwardRef`) unwrapped down to
 * their root element. `renderToJson` walks the element tree and `renderToHtml`
 * reads the root's settings (fonts, language, direction, phone styles) from it,
 * so a wrapper is called first to reach <Email>/<Page>/<Document>/<Body>.
 *
 * Each wrapper is called once, with hooks (the engine's dispatcher), at its place in the tree and inside the context
 * providers around it, as React would call it; the content then starts where the wrappers left the tree, so its
 * `useId()`s and theirs are one document's.
 *
 * What unwrapping finds (`Unwrapped`) is that render's: kept in its scope (see render-scope.ts), and known by the
 * elements it gave, never kept by the template's own elements, which another render (or one at once) may unwrap
 * otherwise.
 */

import React from "react";
import type { UnlayerConfig } from "@unlayer-internal/shared-elements";
import { UNLAYER_RENDER_KEY } from "./create-component";
import { RECORDS } from "./collect";
import { TAILWIND } from "./tailwind";
import { callClass, callComponent, contextOf, hookState, ROOT_TREE, RenderError, type ContextStack, type TreeContext } from "../engine";
import { nameOf, threw } from "../engine/errors";
import { isRoot } from "./root-type";
import { guest, keepUnwrapped, unwrapped } from "./render-scope";

const CONTAINER_NAMES = new Set(["Row", "Column"]);
export const MEMO = Symbol.for("react.memo");
export const FORWARD_REF = Symbol.for("react.forward_ref");
const LAZY = Symbol.for("react.lazy");
/** A context's provider: `<Ctx.Provider>` in React 18, `<Ctx>` (and `<Ctx.Provider>`, the same) in React 19. */
const PROVIDER = Symbol.for("react.provider");
const CONTEXT = Symbol.for("react.context");

/** On <UnlayerProvider> (see context/UnlayerProvider.tsx). */
const UNLAYER_PROVIDER = Symbol.for("@unlayer/react-elements/provider");
export const isUnlayerProvider = (type: unknown): boolean => !!(type as Record<symbol, unknown> | null)?.[UNLAYER_PROVIDER];

/**
 * The config of the <UnlayerProvider>s this render's unwrapping found around `root`, the root it gave (or what a
 * template with no root rendered): the render functions read it as React would give it to the root (with no context:
 * React Server Components have none).
 */
export function providedConfig(root: React.ReactElement): Partial<UnlayerConfig> | undefined {
  const found = unwrapped();
  return found && root === (found.rendered ?? found.root) ? found.provided : undefined;
}

/** Where a root's content (`children`) starts in the tree in this render, as its wrappers left it. */
export function contentTree(children: unknown): TreeContext | undefined {
  const found = unwrapped();
  return found?.tree && children === (found.root.props as { children?: unknown }).children ? found.tree : undefined;
}

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
export const ASYNC_TEMPLATE =
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

/** What unwrapping a template found, for the render that unwrapped it (see above). */
export interface Unwrapped {
  /** Where its wrappers stopped: its root (the providers around it moved inside it), or an element that isn't one. */
  root: React.ReactElement;
  /** Why its root's settings go unread. */
  unread?: string;
  /**
   * With no root, what the template rendered, made again without calling its wrappers (see `replayed`): what the
   * render renders as a root's content (see utils/root-content.ts), and the async renderers, which waited for it, give
   * the synchronous render, which doesn't unwrap it again (its content is collected once).
   */
  rendered?: React.ReactElement;
  /** The config of the <UnlayerProvider>s around it, the inner one's keys over the outer's (see providedConfig). */
  provided?: Partial<UnlayerConfig>;
  /** Where its root's content starts in the tree, where its wrappers moved it (see contentTree). */
  tree?: TreeContext;
}

export type Steps = Generator<PromiseLike<unknown>, Unwrapped, unknown>;

/** A wrapper as it rendered (`output`), not called again: with its props and names, its `useId()` moving the ids after it. */
function replayed(type: any, props: object, forked: boolean, output: React.ReactNode): React.ReactElement {
  const Replayed = () => (forked && React.useId(), output);
  Object.defineProperty(Replayed, "name", { value: typeof type === "function" ? type.name : nameOf(type) });
  Object.assign(Replayed, { displayName: type.displayName });
  return React.createElement(Replayed, props);
}

/**
 * `call()` (a wrapper's: see the engine's callComponent) again each time it suspends, once what it suspended on
 * settles (`use()` of a pending promise, or a thrown one: React 18's Suspense), as React calls it again: what it
 * returns. What it waits for is yielded: the async renderers wait for it, the synchronous ones throw. It runs outside
 * the render's scope, as the content's components do: a render it starts is its own.
 */
function* waiting<T>(call: () => T): Generator<PromiseLike<unknown>, T, unknown> {
  for (;;) {
    try {
      return guest(call);
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
 * `unread`, and what the template rendered in `rendered`. What a wrapper waits for (an async one's promise, `use()`, a
 * thrown promise) is yielded: the async renderers wait for it, the synchronous ones throw.
 */
function* steps(element: React.ReactElement, idPrefix?: string): Steps {
  let current = element;
  let unread: string | undefined;
  // With no root, how what the template rendered is made again (`rendered`): each step's element, around what's
  // inside it; and what the last wrapper returned, where it isn't an element.
  const again: Array<(inside: React.ReactNode) => React.ReactElement> = [];
  let returned: { value: unknown } | undefined;
  const holding = (at: React.ReactElement) => (inside: React.ReactNode) => React.cloneElement(at, undefined, inside);
  // Context providers around the root (`<Theme.Provider value="dark"><Email>…`): the root's content goes in them.
  const providers: React.ReactElement[] = [];
  let contexts: ContextStack | null = null;
  let tree = ROOT_TREE;
  // The config of the <UnlayerProvider>s among them, the inner one's keys over the outer's (see providedConfig).
  let provided: Partial<UnlayerConfig> | undefined;
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
      unread = "it wraps more than 20 components";
      break;
    }
    const type = current.type as any;
    const props = current.props as Record<string, unknown>;
    if (type?.$$typeof === MEMO) {
      current = React.createElement(type.type, props);
      continue;
    }
    // A lazy template (`React.lazy(() => import("./Welcome"))`): the component it loads, waited for as a wrapper that
    // suspends is (the synchronous renderers say it's async till it has loaded); one that fails to load, named.
    if (type?.$$typeof === LAZY) {
      try {
        current = React.createElement((yield* waiting(() => type._init(type._payload))) as React.ElementType, props);
      } catch (error) {
        throw new RenderError(threw(error), "lazy", "", error);
      }
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
      for (const [key, value] of Object.entries((props.config ?? {}) as Record<string, unknown>)) if (value !== undefined) ((provided ??= {}) as Record<string, unknown>)[key] = value;
      const given = providerOf(yield* called(type, props, undefined, "UnlayerProvider"));
      if (given) contexts = { ...given, context: contextOf(given.context), next: contexts };
      providers.push(current);
      again.push(holding(current));
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
      again.push(holding(current));
      current = only;
      continue;
    }
    // A Fragment, StrictMode or Profiler around the template (`<><Welcome /></>`): what's in it, when that's one
    // element. They add nothing to a server render.
    if (type === React.Fragment || type === React.StrictMode || type === React.Profiler) {
      const only = inside();
      if (!only) break;
      again.push(holding(current));
      current = only;
      continue;
    }
    const at = tree;
    let produced: unknown;
    if (type?.$$typeof === FORWARD_REF) produced = yield* called(type.render, { ...props }, null, nameOf(type));
    else if (typeof type === "function" && !type.prototype?.isReactComponent) produced = yield* called(type, { ...props }, undefined, nameOf(type));
    else if (type?.prototype?.isReactComponent) {
      // A class (react-intl's <IntlProvider>): constructed and rendered, inside the providers around it.
      const around = contexts;
      produced = yield* waiting(() => callClass(type, props, around));
    } else break;
    again.push((inside) => replayed(type, props, tree !== at, inside));
    if (!React.isValidElement(produced)) {
      if (holdsRoot(produced as React.ReactNode)) unread = "it doesn't return a root element";
      returned = { value: produced };
      break;
    }
    current = produced;
  }
  if (!isRoot(current.type)) {
    const rendered = again.reduceRight<React.ReactNode>((inside, wrap) => wrap(inside), (returned ? returned.value : current) as React.ReactNode) as React.ReactElement;
    return { root: current, unread, rendered, provided };
  }
  const own = (current.props as { children?: React.ReactNode }).children;
  const children = providers.reduceRight<React.ReactNode>((inside, provider) => React.cloneElement(provider, undefined, inside), own);
  return { root: providers.length ? React.cloneElement(current, undefined, children) : current, provided, tree: tree !== ROOT_TREE ? tree : undefined };
}

/**
 * What a template unwraps to in this render (see steps), kept in its scope; one that waits for something fails, with
 * what to do. What it unwrapped to already (the async renderers' synchronous render, after they waited for it) is as
 * it was.
 */
export function unwrapRoot(element: React.ReactElement, idPrefix?: string): Unwrapped {
  const found = unwrapped();
  if (found && (element === found.root || element === found.rendered)) return found;
  const step = steps(element, idPrefix).next();
  if (step.done) return keepUnwrapped(step.value);
  step.value.then(undefined, () => {});
  throw new Error(ASYNC_TEMPLATE);
}

/** The steps to what a template unwraps to, which the async renderers take, waiting where they wait. */
export { steps as unwrapSteps };

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
 * is already an Elements component (or plain HTML), or what this render's
 * template rendered, is returned as it is. A template with no root gives what it
 * rendered (see `Unwrapped`), its wrappers not called again; with a warning where
 * a root in it can't be reached: its settings aren't read. A wrapper that throws
 * fails the render (a RenderError naming it).
 */
export function htmlRoot(element: React.ReactElement, api: string, idPrefix?: string): React.ReactElement {
  if (typeof element.type === "string" || isElementsType(element.type) || element === unwrapped()?.rendered) return element;
  let found: Unwrapped;
  try {
    found = unwrapRoot(element, idPrefix);
  } catch (cause) {
    // An async template can't be rendered synchronously: say why.
    if (cause instanceof Error && cause.message === ASYNC_TEMPLATE) throw new Error(`[Unlayer] ${api}: ${ASYNC_TEMPLATE}.`);
    throw cause;
  }
  const { root, unread } = found;
  if (isRoot(root.type)) return root;
  // A template of Rows, or nothing: there's no root whose settings go unread.
  if (unread || holdsRoot(root)) console.warn(`[Unlayer] ${api}: couldn't unwrap <${componentName(element) || "wrapper"}> (${unread ?? "its root is inside other markup"}): its root's fonts, lang, dir and phone styles are ignored. ${UNWRAP_ADVICE}`);
  return found.rendered ?? element;
}
