/**
 * How a lazy template's root is found (see capture.ts's captureLazyRoot): rendered by react-dom inside this context's
 * provider, a root (Email, Page, Document, Body) gives its own element to the provider's function and renders nothing.
 * React's public API has no way to the component a `React.lazy` loads but rendering it. The context is one for every
 * copy of Elements in the process (by Symbol.for), so a copy's lazy template is found by another's renderer.
 */
import React from "react";
import { perReact } from "./per-react";

export interface RootReport {
  element: React.ReactElement;
  /** The <Tailwind>s around it where it rendered, outermost first (see aroundCapture). */
  scopes?: React.ReactElement[];
}

const KEY = Symbol.for("@unlayer/react-elements/root-capture");

// React Server Components' React has no createContext: there's nothing to capture there (react-dom can't render).
const { createContext, useContext, useTransition } = React as Partial<Pick<typeof React, "createContext" | "useContext" | "useTransition">>;

/**
 * One of Elements' contexts for every copy of Elements in the process that uses this React (by Symbol.for, then by this
 * React's createContext: a copy on another React, or another major, has its own), each given a value only in the render
 * of react-dom's module that rendered its provider (see stamped).
 */
function shared<T>(key: symbol): React.Context<Stamped<T> | null> | null {
  if (typeof createContext !== "function") return null;
  return perReact(key, createContext, () => createContext<Stamped<T> | null>(null));
}

/**
 * A value of one of Elements' contexts, with the module of react-dom's that renders its provider (`start`, its
 * useTransition's function, one per module: see react-dom.ts's probe). A render React leaves that value in while it waits
 * (every module of react-dom's, and React's client, reads a context's value from one place) isn't that render: another
 * module's, or the client's, reads it as no value.
 */
export interface Stamped<T> {
  value: T;
  start?: unknown;
}

/** The module of react-dom's rendering now (its useTransition's function), in a component it renders. */
const moduleStart = (): unknown => (typeof useTransition === "function" ? useTransition()[1] : undefined);

/** Stamps `holder` with the module rendering it, around `children` (a component of its own: nothing else moves). */
export function Stamp({ holder, children }: { holder: { start?: unknown }; children?: React.ReactNode }): React.ReactNode {
  if (holder) holder.start = moduleStart();
  return children;
}

/** `context`'s value where it's this render's (see Stamped), in a component React renders; null otherwise. */
function ownValue<T>(context: React.Context<Stamped<T> | null>): T | null {
  if (typeof useContext !== "function") return null;
  let stamped: Stamped<T> | null = null;
  try {
    stamped = useContext(context);
  } catch {
    // Called outside a render (as a function): no value.
    return null;
  }
  if (!stamped) return null;
  return stamped.start !== undefined && moduleStart() === stamped.start ? stamped.value : null;
}

export const ROOT_CAPTURE = {
  context: () => shared<(report: RootReport) => void>(KEY),
};

/**
 * In a root React renders (not one Elements' own markup calls, `own`): whether it's being captured, in which case it
 * gives its element (`type` with `props`) and renders nothing. Called on every render of a root React renders, so its
 * hooks are the same each time.
 */
export function reportedRoot(type: React.ElementType, props: object, own: boolean): boolean {
  if (own) return false;
  const context = ROOT_CAPTURE.context();
  if (!context) return false;
  const report = ownValue(context);
  if (!report) return false;
  report({ element: React.createElement(type, props) });
  return true;
}

/**
 * In a <Tailwind> React renders where a root is being captured (a lazy template's module: see capture.ts's
 * captureLazyRoot), `children` with what the root reports passed on with this scope around it (`type` with `props`),
 * so the root's classes are read in it as they are where it isn't lazy. Elsewhere, `children`.
 */
export function aroundCapture(type: React.ElementType, props: object, children: React.ReactNode): React.ReactNode {
  const context = ROOT_CAPTURE.context();
  if (!context) return children;
  const report = ownValue(context);
  if (!report) return children;
  const scope = React.createElement(type, props);
  const holder = { value: (r: RootReport) => report({ element: r.element, scopes: [scope, ...(r.scopes ?? [])] }), start: undefined as unknown };
  return React.createElement(context.Provider, { value: holder }, React.createElement(Stamp, { holder }, children));
}

const COLLECTS = Symbol.for("@unlayer/react-elements/collects");

/**
 * What a lazy component renders is rendered by react-dom where it is (React's public API has no way to the component
 * it loads but rendering it), inside this context's provider: Elements' Rows, Columns, blocks, <Tailwind>s and
 * <Head>/<Font> entries React renders there give their element to the provider's function, which collects it as the
 * template's (records it), and render what that gives.
 */
export const COLLECTING = {
  context: () => shared<(element: React.ReactElement) => React.ReactNode>(COLLECTS),
};

export const NOT_COLLECTED: unique symbol = Symbol("not collected");

/**
 * On Elements' components that give themselves to the collection where React renders them in what a lazy component
 * renders (a <Link>, Markdown, a CodeBlock: they call collectedHere), and that the collection then calls itself, given
 * `_own` so they don't again: it calls them with the render's own work (see the engine's `sharing`), so Markdown's and
 * code's budgets are the render's wherever React renders them.
 */
export const ROUTED = Symbol.for("@unlayer/react-elements/routed");

/**
 * In one of Elements' components React renders (not one Elements' own markup calls with its `_config`, `own`: its HTML
 * is that markup's): where a collecting render renders it (in what a lazy component rendered), what that collects it
 * as; otherwise NOT_COLLECTED. Called on every render of it that React renders, so its hooks are the same each time.
 */
export function collectedHere(type: React.ElementType, props: object, own = false): React.ReactNode | typeof NOT_COLLECTED {
  if (own) return NOT_COLLECTED;
  const context = COLLECTING.context();
  const collect = context ? ownValue(context) : null;
  return collect ? collect(React.createElement(type, props)) : NOT_COLLECTED;
}
