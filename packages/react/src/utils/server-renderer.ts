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

declare const module: { require(id: string): unknown } | undefined;
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
      // (`module`'s, read so that a bundler doesn't take it for a require of a path worked out when it runs.)
      () => {
        const own = (typeof __UNLAYER_CJS__ === "boolean" ? __UNLAYER_CJS__ : true) && typeof module === "object" ? Reflect.get(module ?? {}, "require") : undefined;
        return typeof own === "function" ? (id: string) => own.call(module, id) : undefined;
      },
      () => (globalThis as any).process?.getBuiltinModule?.("module")?.createRequire(import.meta.url),
    ];
    // React 19's browser build opens a MessageChannel when it loads, which keeps Node running: its Bun build instead.
    const ids = ["react-dom/server.bun", ...(Number.parseInt(React.version) >= 19 ? [] : ["react-dom/server.browser"]), "react-dom/server.node"];
    search: for (const id of ids) {
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
export function withBuild<T>(render: () => T, own = false): T {
  const outer = own ? null : dispatcher();
  let build = current();
  // Elements' own component (Body, rendered by the app's react-dom/server), which calls no hooks after: the module
  // it's in, as in 0.1.22 (a browser bundle has no other).
  const theirs = !own && (using.length === 0 || collecting() !== undefined) ? buildOf(outer) : undefined;
  const busy: Build[] = [];
  if (theirs) {
    const free = (b: Build) => !same(b, theirs) && !using.some((u) => same(u, b));
    const other = free(defaultBuild) ? defaultBuild : secondBuild(outer);
    // Where none renders with this React (a bundle, Next.js's own react-dom, a test runner's module registry): the
    // module it's in, as 0.1.22 rendered there. The component calling it then can't call a hook after the call
    // (React throws, as it did with 0.1.22's renderToHtml).
    if (other && free(other)) {
      busy.push(theirs);
      build = other;
    } else build = theirs;
  }
  using.push(...busy, build);
  try {
    return render();
  } catch (error) {
    // React Server Components' React (Next.js's edge runtime), which react-dom can't render with at all. (Not checked
    // in a render of the same module, whose hooks a check would disturb.)
    if (build !== theirs && !rendersHere(build)) throw Object.assign(new Error("[Unlayer] react-dom can't render with this React (React Server Components', as in Next.js's edge runtime): render emails in the Node.js runtime."), { cause: error });
    throw error;
  } finally {
    using.length -= busy.length + 1;
  }
}

/** Whether `build` can render a component here (one that isn't rendering, so its render disturbs none). */
function rendersHere(build: Build): boolean {
  try {
    build.renderToStaticMarkup(React.createElement(() => null));
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
