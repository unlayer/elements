/**
 * The server renderer Elements renders with: react-dom/server, as in 0.1.22, loaded the same way and doing nothing
 * when it loads.
 *
 * react-dom keeps a render's hook state in its module, so a render started inside another one with the same module
 * breaks the hooks the outer component calls after it (a page rendered with `renderToString` that computes
 * `useMemo(() => renderToJson(<T />))` and then calls `useState`). Apps mostly render with react-dom's streaming
 * renderers, another module than the one renderToString is in, so it's rare; where it happens, Elements renders
 * with a second module of react-dom's (React 19's Bun build, the browser one, or Node's when react-dom/server is the
 * browser one), loaded then, only where a synchronous `require` can load it with the same React (Node, Jest, a
 * CommonJS bundle); elsewhere (a bundled module, a browser) it says to render first.
 * Which module a render is under way with is told by React's hooks dispatcher (each module has its own), read in a
 * class component's render: that doesn't touch the hook state of a render it's in.
 */
import * as defaultBuild from "react-dom/server";

import React from "react";
import { collecting } from "./collect";

type Build = typeof defaultBuild;

// The builds rendering (an Elements render, or the app's render one is called in), innermost last, shared by every
// copy of Elements a process loads (they share react-dom).
const SHARED = Symbol.for("@unlayer/react-elements/render-builds");
const using = ((globalThis as Record<symbol, unknown>)[SHARED] ??= []) as Build[];

/** The same module (a bundler can wrap one in two objects). */
const same = (a: Build, b: Build) => a.renderToString === b.renderToString;

/** The hooks dispatcher of the React render under way (React sets it while a component renders), or null. */
function dispatcher(): unknown {
  // Each step can be missing (React Server Components' React has neither).
  const internals = React as unknown as Record<string, { H?: unknown; ReactCurrentDispatcher?: { current?: unknown } } | undefined>;
  return internals.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE?.H ?? internals.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?.ReactCurrentDispatcher?.current ?? null;
}

/** The dispatcher a build renders with, from a render of a class component (no hooks: safe inside its own render). */
const dispatchers = new Map<Build, unknown>();
function dispatcherOf(build: Build): unknown {
  if (!dispatchers.has(build)) {
    let seen: unknown = null;
    try {
      // (React Server Components' React has no Component: none of react-dom's renders is under way there.)
      class Probe extends React.Component {
        render() {
          seen = dispatcher();
          return null;
        }
      }
      build.renderToStaticMarkup(React.createElement(Probe));
    } catch {
      // It can't render here: no dispatcher.
    }
    dispatchers.set(build, seen);
  }
  return dispatchers.get(build);
}

declare const require: ((id: string) => unknown) | undefined;
/** Whether this is the CommonJS build (set when it's built; undefined in the sources). */
declare const __UNLAYER_CJS__: boolean | undefined;

/**
 * Another module of react-dom's than react-dom/server, loaded the first time one's needed, with a synchronous
 * `require`: the one CommonJS loads this module with (Jest's registry gives the test's React), then Node's for a
 * module (a module a bundler bundles has neither that gives its React). One that renders with this React (its
 * dispatcher is one this React sets, and not `outer`'s). React 19's Bun build first: its browser one opens a
 * MessageChannel when it loads, which keeps Node from exiting. Undefined where there's none.
 */
let second: Build | null | undefined;
function secondBuild(outer: unknown): Build | undefined {
  if (second === undefined) {
    second = null;
    const requirers = [
      () => ((typeof __UNLAYER_CJS__ === "boolean" ? __UNLAYER_CJS__ : true) && typeof require === "function" ? require : undefined),
      () => (globalThis as any).process?.getBuiltinModule?.("module")?.createRequire(import.meta.url),
    ];
    search: for (const id of ["react-dom/server.bun", "react-dom/server.browser", "react-dom/server.node"]) {
      for (const requirer of requirers) {
        try {
          const build = requirer()?.(id) as Build | undefined;
          if (build?.renderToStaticMarkup && !same(build, defaultBuild) && ![null, outer].includes(dispatcherOf(build))) {
            second = build;
            break search;
          }
        } catch {
          // Not there, or it can't load here: the next one.
        }
      }
    }
  }
  return second ?? undefined;
}

/** The build whose render is under way, of the ones Elements has: react-dom/server's, or the second one if loaded. */
const buildOf = (outer: unknown): Build | undefined => (outer === null ? undefined : [defaultBuild, second].find((b): b is Build => !!b && dispatcherOf(b) === outer));

/**
 * Runs one Elements render with a build that isn't rendering; every render it makes uses that one. Called from the
 * user's code in a render with a build it has (the app's renderToString, or a component an Elements render collects),
 * it takes another one, which mustn't be rendering either (a third level: it can't). Otherwise (no render under way,
 * the app's streaming render or a client one, or one of Elements' own renders, whose components call no hooks after)
 * it keeps the one it's in.
 */
export function withBuild<T>(render: () => T): T {
  const outer = dispatcher();
  let build = current();
  const theirs = using.length === 0 || collecting() !== undefined ? buildOf(outer) : undefined;
  if (theirs) {
    const free = (b: Build) => !same(b, theirs) && !using.some((u) => same(u, b));
    const other = free(defaultBuild) ? defaultBuild : secondBuild(outer);
    if (!other || !free(other)) {
      throw new Error(
        "[Unlayer] renderToHtml, renderToJson or renderToPlainText can't run inside a react-dom/server render it would render with: call it before rendering, and pass the result as a prop."
      );
    }
    using.push(theirs);
    build = other;
  }
  using.push(build);
  try {
    return render();
  } catch (error) {
    // React Server Components' React (Next.js's edge runtime), which react-dom can't render with at all.
    if (!rendersHere()) throw Object.assign(new Error("[Unlayer] react-dom can't render with this React (React Server Components', as in Next.js's edge runtime): render emails in the Node.js runtime."), { cause: error });
    throw error;
  } finally {
    using.length -= theirs ? 2 : 1;
  }
}

function rendersHere(): boolean {
  try {
    defaultBuild.renderToStaticMarkup(React.createElement("i"));
    return true;
  } catch {
    return false;
  }
}

function current(): Build {
  return using[using.length - 1] ?? defaultBuild;
}

export const renderToStaticMarkup: Build["renderToStaticMarkup"] = (element, options) => current().renderToStaticMarkup(element, options);
export const renderToString: Build["renderToString"] = (element, options) => current().renderToString(element, options);
