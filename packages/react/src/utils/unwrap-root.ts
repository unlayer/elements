/**
 * Template components (`<Welcome />`, `memo`, `forwardRef`) unwrapped down to
 * their root element. `renderToJson` walks the element tree and `renderToHtml`
 * reads the root's settings (fonts, language, direction, phone styles) from it,
 * so a wrapper is called first to reach <Email>/<Page>/<Document>/<Body>.
 */

import React from "react";
import { renderToStaticMarkup } from "./server-renderer";
import { UNLAYER_RENDER_KEY } from "./create-component";
import { FORWARD_REF, MEMO, RECORDS, ROOT } from "./collect";

/** The root components a design starts from. */
export const ROOT_NAMES = new Set(["Body", "Email", "Page", "Document"]);
const CONTAINER_NAMES = new Set([...ROOT_NAMES, "Row", "Column"]);
/** A context's provider: `<Ctx.Provider>` in React 18, `<Ctx>` (and `<Ctx.Provider>`, the same) in React 19. */
const PROVIDER = Symbol.for("react.provider");
const CONTEXT = Symbol.for("react.context");
const LAZY = Symbol.for("react.lazy");

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

/** Whether an element is a root of Elements' own: this copy's, or the same package's in another build. A name doesn't make one. */
export const isOwnRoot = (element: React.ReactElement): boolean => !!(element.type as any)?.[ROOT];

/** Whether a component type is an Elements component (a root, a container or a content block). */
export function isElementsType(type: any): boolean {
  return !!type?.[UNLAYER_RENDER_KEY] || CONTAINER_NAMES.has(type?.displayName);
}

/** Thrown for a template that is async or suspends: renderToHtml renders synchronously. */
const ASYNC_TEMPLATE =
  "async and suspending templates aren't supported: load the data first and pass it as props";

export const isThenable = (value: unknown): boolean => typeof (value as { then?: unknown } | null)?.then === "function";

/** A promise a component gave back, which Elements doesn't wait for: its rejection mustn't end the process. */
const settle = (value: unknown): void => {
  if (isThenable(value)) (value as PromiseLike<unknown>).then(undefined, () => {});
};

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
  let calling = false;
  const Probe = () => {
    // React's development build calls a component again from inside its render, with hooks off, to say where a warning
    // came from (an undefined component, a list without keys): that call fails where the render didn't. A render React
    // starts again (the template set its state while it rendered) counts, as its last one does in React.
    if (calling) return null;
    ran = calling = true;
    threw = false;
    try {
      result = call();
    } catch (cause) {
      threw = true;
      error = cause;
    } finally {
      calling = false;
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
 * What `unwrapRoot` tells of where it stopped: why a root's settings can't be read, whether it passed a context provider,
 * the name like a root's that it first passed (a component of the user's, whose output that name says), and whether it
 * came to the Body of a copy older than 0.3.
 */
export interface Unread {
  unread?: string;
  inProvider?: boolean;
  named?: string;
  older?: boolean;
}

/**
 * Whether a function named Body gave what a Body of a copy older than 0.3 gives: its whole render as one element's HTML, of
 * the body it says it is. (Those have no mark of their own, and a user's own can have the name, or HTML of its own.)
 */
function olderBody(name: string | undefined, produced: unknown): boolean {
  if (name !== "Body" || !React.isValidElement(produced) || produced.type !== "div") return false;
  const props = produced.props as { dangerouslySetInnerHTML?: { __html?: unknown } };
  return "className" in props && "style" in props && /^\s*<(?:body|div)\b[^>]*\bu_body\b/.test(String(props.dangerouslySetInnerHTML?.__html));
}

/** What a class component's `render` gives, called by React in a render of its own (its state and context work there). */
function renderedByClass(type: React.ComponentClass<any>, props: Record<string, unknown>, prefix: string | undefined, providers: React.ReactElement[]): unknown {
  let result: unknown;
  let ran = false;
  class Capture extends type {
    render() {
      result = super.render();
      ran = true;
      return null;
    }
  }
  const probe = providers.reduceRight<React.ReactElement>((inside, provider) => React.cloneElement(provider, undefined, inside), React.createElement(Capture, props));
  renderToStaticMarkup(probe, prefix ? { identifierPrefix: prefix } : undefined);
  if (!ran) throw new Error("the template wasn't rendered");
  return result;
}

/**
 * Call wrapper components (plain functions, `memo`, `forwardRef`, nested in any
 * order, and with `classes`, class components) until a root element comes out, each
 * in a render of its own (so its hooks work). Returns the element it stops at, which
 * isn't a root when a wrapper can't be called (a class, without `classes`) or doesn't
 * return an element (null, an array). Throws what a wrapper throws, and for an async
 * template. With `classes`, as renderToHtml reads it, only Elements' own root is one (see
 * `isOwnRoot`); else, as the design is read, what's named like one is too.
 */
export function unwrapRoot(element: React.ReactElement, why: Unread = {}, classes = false): React.ReactElement {
  const isRoot = classes ? isOwnRoot : (e: React.ReactElement) => ROOT_NAMES.has(getDisplayName(e) ?? "");
  let current = element;
  // Context providers around the root (`<Theme.Provider value="dark"><Email>…`): the root's content goes in them.
  const providers: React.ReactElement[] = [];
  for (let depth = 0; ; depth++) {
    if (isRoot(current)) break;
    // A Row or block: what it renders is Elements' own, never a root.
    if (elementsOwn(current)) break;
    if (depth === 20) {
      why.unread = "it wraps more than 20 components";
      break;
    }
    const type = current.type as any;
    const props = current.props as Record<string, unknown>;
    const name = getDisplayName(current);
    if (name && ROOT_NAMES.has(name)) why.named ??= name;
    if (type?.$$typeof === MEMO) {
      current = React.createElement(type.type, props);
      continue;
    }
    if ((type?.$$typeof === PROVIDER || type?.$$typeof === CONTEXT) && "value" in props) {
      const inside = React.Children.toArray(props.children as React.ReactNode);
      if (inside.length !== 1 || !React.isValidElement(inside[0])) break;
      providers.push(current);
      why.inProvider = true;
      current = inside[0];
      continue;
    }
    // A Fragment, StrictMode, Profiler or Suspense around the template (`<><Welcome /></>`): what's in it, when that's
    // one element. They add nothing to a render that doesn't wait.
    if (type === React.Fragment || type === React.StrictMode || type === React.Profiler || (classes && type === React.Suspense)) {
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
    else if (classes && type?.prototype?.isReactComponent) produced = renderedByClass(type, props, prefix, providers);
    else {
      if (type?.prototype?.isReactComponent) why.unread = `<${componentName(current)}> is a class component, which isn't called to find it`;
      break;
    }
    if (classes && olderBody(name, produced)) {
      why.older = true;
      break;
    }
    if (!React.isValidElement(produced)) {
      if (holdsRoot(produced as React.ReactNode)) why.unread = "it doesn't return a root element";
      break;
    }
    current = produced;
  }
  if (!providers.length || !isRoot(current)) return current;
  const children = providers.reduceRight<React.ReactNode>((inside, provider) => React.cloneElement(provider, undefined, inside), (current.props as { children?: React.ReactNode }).children);
  return React.cloneElement(current, undefined, children);
}

/** Elements' own Row, Column or block (not a component of the user's own named like one, which is called). */
export const elementsOwn = (element: React.ReactElement): boolean => {
  const type = element.type as any;
  return !!(type?.[UNLAYER_RENDER_KEY] || type?.[RECORDS]);
};

/** Whether a root element is somewhere in `node` (markup, Fragments, arrays, providers), whose settings would go unread. */
function holdsRoot(node: React.ReactNode): boolean {
  if (Array.isArray(node)) return node.some(holdsRoot);
  if (!React.isValidElement(node)) return false;
  return isOwnRoot(node) || (!elementsOwn(node) && holdsRoot((node.props as { children?: React.ReactNode }).children));
}

/** The advice both render functions give when a wrapper can't be unwrapped. */
export const UNWRAP_ADVICE = "Pass the root element (<Email>…</Email>), or a function component that returns one.";
/** Where a user's own markup goes in a template. */
export const MARKUP_ADVICE = 'Put your markup in an <Html> block in one: <Email><Row><Column><Html html="…" /></Column></Row></Email>.';

/**
 * What a template's element comes to for renderToHtml: a root, or a Row, Column or block on its own, its wrappers
 * called; a component or a list that holds neither (nothing, Rows in a list or a provider) as it is. Throws, saying why,
 * where a root can't be reached: every setting of a root is read from it, and there's nothing else to render with. A root
 * of a copy older than 0.3 can't be read by this one. `why` says what it passed on its way.
 */
export function htmlRoot(element: React.ReactElement, api: string, why: Unread = {}): React.ReactElement {
  if (!React.isValidElement(element)) throw new Error(`[Unlayer] ${api}: a template is a React element (<Email>…</Email>), not ${element === null ? "null" : typeof element}.`);
  if (typeof element.type === "string" || isOwnRoot(element) || elementsOwn(element)) return element;
  let root: React.ReactElement;
  try {
    root = unwrapRoot(element, why, true);
  } catch (cause) {
    // An async template can't be rendered either: say why.
    if (cause instanceof Error && cause.message === ASYNC_TEMPLATE) throw new Error(`[Unlayer] ${api}: ${ASYNC_TEMPLATE}.`);
    throw cause;
  }
  if (why.older) throw new Error(`[Unlayer] ${api}: this <${why.named}> is from another copy of @unlayer/react-elements, older than 0.3, which this one can't read. Install one version of it (\`npm ls @unlayer/react-elements\` shows a duplicate install).`);
  if (isOwnRoot(root)) return root;
  if ((root.type as any)?.$$typeof === LAZY) throw new Error(`[Unlayer] ${api}: ${ASYNC_TEMPLATE}.`);
  // A template of Rows, or nothing: there's no root whose settings go unread.
  if (why.unread || holdsRoot(root)) throw new Error(`[Unlayer] ${api}: couldn't read <${componentName(element) || "wrapper"}> as a template (${why.unread ?? "its root is inside other markup"}). ${UNWRAP_ADVICE}${typeof root.type === "string" ? ` ${MARKUP_ADVICE}` : ""}`);
  // (A Row in a provider stays in it: what's in it may read its context.)
  return why.inProvider ? element : root;
}
