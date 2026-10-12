/**
 * Template components (`<Welcome />`, `memo`, `forwardRef`) unwrapped down to
 * their root element. `renderToJson` walks the element tree and `renderToHtml`
 * reads the root's settings (fonts, language, direction, phone styles) from it,
 * so a wrapper is called first to reach <Email>/<Page>/<Document>/<Body>.
 */

import React from "react";
import { renderToStaticMarkup } from "./server-renderer";
import { UNLAYER_RENDER_KEY } from "./create-component";

/** The root components a design starts from. */
export const ROOT_NAMES = new Set(["Body", "Email", "Page", "Document"]);
const CONTAINER_NAMES = new Set([...ROOT_NAMES, "Row", "Column"]);
export const MEMO = Symbol.for("react.memo");
export const FORWARD_REF = Symbol.for("react.forward_ref");
/** A context's provider: `<Ctx.Provider>` in React 18, `<Ctx>` (and `<Ctx.Provider>`, the same) in React 19. */
const PROVIDER = Symbol.for("react.provider");
const CONTEXT = Symbol.for("react.context");

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

/** Whether a component type is an Elements component (a root, a container or a content block). */
export function isElementsType(type: any): boolean {
  return !!type?.[UNLAYER_RENDER_KEY] || CONTAINER_NAMES.has(type?.displayName);
}

/** Whether the element is an Elements component (a root, a container or a content block). */
function isElementsComponent(element: React.ReactElement): boolean {
  return isElementsType(element.type);
}

/** Thrown for a template that is async or suspends: renderToHtml renders synchronously. */
const ASYNC_TEMPLATE =
  "async and suspending templates aren't supported: load the data first and pass it as props";

export const isThenable = (value: unknown): boolean => typeof (value as { then?: unknown } | null)?.then === "function";

/** A promise a component gave back, which Elements doesn't wait for: its rejection mustn't end the process. */
const settle = (value: unknown): void => {
  if (isThenable(value)) (value as PromiseLike<unknown>).then(undefined, () => {});
};

/** A component declared `async`: it can't render synchronously, so it isn't called at all. */
export function isAsyncComponent(type: any): boolean {
  while (type?.$$typeof === MEMO) type = type.type;
  return (type?.$$typeof === FORWARD_REF ? type.render : type)?.[Symbol.toStringTag] === "AsyncFunction";
}

/**
 * Call a template component in a throwaway render of its own. Its hooks run
 * there, never on the component that is rendering when renderToHtml is called
 * (a live preview in `useMemo`), whose hooks they would otherwise corrupt.
 * Components called in renders of their own each need their own `prefix`, or
 * their `useId()` values repeat in the document.
 */
export function callIsolated(call: () => unknown, prefix?: string, providers: React.ReactElement[] = []): unknown {
  let result: unknown;
  let error: unknown;
  let ran = false;
  let threw = false;
  const Probe = () => {
    ran = true;
    try {
      result = call();
    } catch (cause) {
      threw = true;
      error = cause;
    }
    return null;
  };
  // Inside the context providers around it, so a template that reads their context gets their values.
  const probe = providers.reduceRight<React.ReactElement>((inside, provider) => React.cloneElement(provider, undefined, inside), React.createElement(Probe));
  renderToStaticMarkup(probe, prefix ? { identifierPrefix: prefix } : undefined);
  settle(error);
  settle(result);
  if (threw) throw isThenable(error) ? new Error(ASYNC_TEMPLATE) : error;
  if (!ran) throw new Error("the template wasn't rendered");
  if (isThenable(result)) throw new Error(ASYNC_TEMPLATE);
  return result;
}

/**
 * Call wrapper components (plain functions, `memo`, `forwardRef`, nested in any
 * order) until a root element comes out, each in a render of its own (so its
 * hooks work). Returns the element it stops at, which isn't a root when a
 * wrapper can't be called (a class) or doesn't return an element (null, an
 * array). Throws what a wrapper throws, and for an async template.
 */
export function unwrapRoot(element: React.ReactElement): React.ReactElement {
  let current = element;
  // Context providers around the root (`<Theme.Provider value="dark"><Email>…`): the root's content goes in them.
  const providers: React.ReactElement[] = [];
  for (let depth = 0; depth < 20; depth++) {
    if (ROOT_NAMES.has(getDisplayName(current) ?? "")) break;
    const type = current.type as any;
    const props = current.props as Record<string, unknown>;
    if (type?.$$typeof === MEMO) {
      current = React.createElement(type.type, props);
      continue;
    }
    if ((type?.$$typeof === PROVIDER || type?.$$typeof === CONTEXT) && "value" in props) {
      const inside = React.Children.toArray(props.children as React.ReactNode);
      if (inside.length !== 1 || !React.isValidElement(inside[0])) break;
      providers.push(current);
      current = inside[0];
      continue;
    }
    // A Fragment, StrictMode or Profiler around the template (`<><Welcome /></>`): what's in it, when that's one
    // element. They add nothing to a server render.
    if (type === React.Fragment || type === React.StrictMode || type === React.Profiler) {
      const inside = React.Children.toArray(props.children as React.ReactNode);
      if (inside.length !== 1 || !React.isValidElement(inside[0])) break;
      current = inside[0];
      continue;
    }
    let produced: unknown;
    // Each wrapper renders on its own: one inside another gets its own `useId()` prefix (the first keeps React's).
    const prefix = depth ? `w${depth}-` : undefined;
    if (type?.$$typeof === FORWARD_REF) produced = callIsolated(() => type.render({ ...props }, null), prefix, providers);
    else if (typeof type === "function" && !type.prototype?.isReactComponent) produced = callIsolated(() => type({ ...props }), prefix, providers);
    else break;
    if (!React.isValidElement(produced)) break;
    current = produced;
  }
  if (!providers.length || !ROOT_NAMES.has(getDisplayName(current) ?? "")) return current;
  const children = providers.reduceRight<React.ReactNode>((inside, provider) => React.cloneElement(provider, undefined, inside), (current.props as { children?: React.ReactNode }).children);
  return React.cloneElement(current, undefined, children);
}

/** The advice both render functions give when a wrapper can't be unwrapped. */
export const UNWRAP_ADVICE = "Pass the root element (<Email>…</Email>), or a function component that returns one.";

/**
 * For renderToHtml: the root a template component unwraps to. An element that
 * is already an Elements component (or plain HTML) is returned as it is. When
 * a wrapper can't be unwrapped it's rendered through React as before, with a
 * warning: its root's settings aren't read.
 */
export function htmlRoot(element: React.ReactElement, api: string): React.ReactElement {
  if (typeof element.type === "string" || isElementsComponent(element)) return element;
  let reason = "it doesn't return a root element";
  try {
    const root = unwrapRoot(element);
    if (ROOT_NAMES.has(getDisplayName(root) ?? "")) return root;
    if ((root.type as any)?.prototype?.isReactComponent) reason = `<${componentName(root)}> is a class component, which isn't called to find it`;
  } catch (cause) {
    // An async template can't be rendered through React either: say why.
    if (cause instanceof Error && cause.message === ASYNC_TEMPLATE) throw new Error(`[Unlayer] ${api}: ${ASYNC_TEMPLATE}.`);
    reason = cause instanceof Error ? cause.message : String(cause);
  }
  console.warn(`[Unlayer] ${api}: couldn't unwrap <${componentName(element) || "wrapper"}> (${reason}): its root's fonts, lang, dir and phone styles are ignored. ${UNWRAP_ADVICE}`);
  return element;
}
