/**
 * How a lazy template's root is found (see capture.ts's captureLazyRoot): rendered by react-dom inside this context's
 * provider, a root (Email, Page, Document, Body) gives its own element to the provider's function and renders nothing.
 * React's public API has no way to the component a `React.lazy` loads but rendering it. The context is one for every
 * copy of Elements in the process (by Symbol.for), so a copy's lazy template is found by another's renderer.
 */
import React from "react";

export interface RootReport {
  element: React.ReactElement;
}

const KEY = Symbol.for("@unlayer/react-elements/root-capture");

// React Server Components' React has no createContext: there's nothing to capture there (react-dom can't render).
const { createContext, useContext } = React as Partial<Pick<typeof React, "createContext" | "useContext">>;

export const ROOT_CAPTURE = {
  context(): React.Context<((report: RootReport) => void) | null> | null {
    const global = globalThis as Record<symbol, React.Context<((report: RootReport) => void) | null> | undefined>;
    if (!global[KEY] && typeof createContext === "function") global[KEY] = createContext<((report: RootReport) => void) | null>(null);
    return global[KEY] ?? null;
  },
};

/**
 * In a root React renders (not one Elements' own markup calls, `own`): whether it's being captured, in which case it
 * gives its element (`type` with `props`) and renders nothing. Called on every render of a root React renders, so its
 * hooks are the same each time.
 */
export function reportedRoot(type: React.ElementType, props: object, own: boolean): boolean {
  if (own || typeof useContext !== "function") return false;
  const context = ROOT_CAPTURE.context();
  if (!context) return false;
  let report: ((r: RootReport) => void) | null = null;
  try {
    report = useContext(context);
  } catch {
    // Called outside a render (a root called as a function): nothing captures it.
    return false;
  }
  if (!report) return false;
  report({ element: React.createElement(type, props) });
  return true;
}

const COLLECTS = Symbol.for("@unlayer/react-elements/collects");

/**
 * What a lazy component renders is rendered by react-dom where it is (React's public API has no way to the component
 * it loads but rendering it), inside this context's provider: Elements' Rows, Columns, blocks, <Tailwind>s and
 * <Head>/<Font> entries React renders there give their element to the provider's function, which collects it as the
 * template's (records it), and render what that gives. One context for every copy of Elements in the process.
 */
export const COLLECTING = {
  context(): React.Context<((element: React.ReactElement) => React.ReactNode) | null> | null {
    const global = globalThis as Record<symbol, React.Context<((element: React.ReactElement) => React.ReactNode) | null> | undefined>;
    if (!global[COLLECTS] && typeof createContext === "function") global[COLLECTS] = createContext<((element: React.ReactElement) => React.ReactNode) | null>(null);
    return global[COLLECTS] ?? null;
  },
};

export const NOT_COLLECTED: unique symbol = Symbol("not collected");

/**
 * In one of Elements' components React renders (not one Elements' own markup calls with its `_config`, `own`: its HTML
 * is that markup's): where a collecting render renders it (in what a lazy component rendered), what that collects it
 * as; otherwise NOT_COLLECTED. Called on every render of it that React renders, so its hooks are the same each time.
 */
export function collectedHere(type: React.ElementType, props: object, own = false): React.ReactNode | typeof NOT_COLLECTED {
  if (own || typeof useContext !== "function") return NOT_COLLECTED;
  const context = COLLECTING.context();
  if (!context) return NOT_COLLECTED;
  let collect: ((element: React.ReactElement) => React.ReactNode) | null = null;
  try {
    collect = useContext(context);
  } catch {
    // Called outside a render (as a function): nothing collects it.
    return NOT_COLLECTED;
  }
  return collect ? collect(React.createElement(type, props)) : NOT_COLLECTED;
}
