/// <reference path="../types/react-dom-server-browser.d.ts" />
/**
 * The server renderer Elements renders with. react-dom keeps a render's hook state in its module, so a render
 * started inside another one with the same module breaks the hooks the outer component calls after it (a page
 * that renders on the server with `useMemo(() => renderToJson(<T />))` and then `useState`). Elements renders
 * with react-dom's browser build: another module than the app's own server render (Node's build, the edge's, or
 * the streaming APIs'), wherever that runs. A render called from a component Elements is rendering (renderToJson
 * inside a template's component) uses the other build; one more inside that can't render, and says so.
 */
import * as browserBuild from "react-dom/server.browser";
import * as defaultBuild from "react-dom/server";

// Shared by every copy of Elements a process loads, as the collector is.
const SHARED = Symbol.for("@unlayer/react-elements/nested-renders");
const nesting = ((globalThis as Record<symbol, unknown>)[SHARED] ??= { depth: 0 }) as { depth: number };

const build = () => (nesting.depth ? defaultBuild : browserBuild);

export const renderToStaticMarkup: typeof defaultBuild.renderToStaticMarkup = (element, options) => build().renderToStaticMarkup(element, options);
export const renderToString: typeof defaultBuild.renderToString = (element, options) => build().renderToString(element, options);

/** A render called from a component Elements is rendering: with the other build (one level only). */
export function nestedRender<T>(render: () => T): T {
  if (nesting.depth) {
    throw new Error(
      "[Unlayer] renderToHtml or renderToJson was called in a component rendered by one called in a component rendered by another: React can't render that many at once. Call it before rendering, and pass the result as a prop."
    );
  }
  nesting.depth++;
  try {
    return render();
  } finally {
    nesting.depth--;
  }
}
