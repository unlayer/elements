/// <reference path="../types/react-dom-server-browser.d.ts" />
/**
 * The server renderer Elements renders with. react-dom keeps a render's hook state in its module, so a render
 * started inside another one with the same module breaks the hooks the outer component calls after it (a page
 * that renders with `useMemo(() => renderToJson(<T />))` and then `useState`). Elements has two of react-dom's
 * builds, its browser one and the default one (Node's on Node). Each of its renders (renderToHtml, renderToJson,
 * renderToPlainText) uses one that isn't rendering: not one an Elements render it's called in uses (a template's
 * component calling renderToJson), nor the one whose render it's called in (the app's), which React's hooks
 * dispatcher tells (each build has its own). Where none is (a browser bundle, where they're one module, inside the
 * app's react-dom/server render), it can't render, and says so.
 *
 * React 19's browser build opens a MessageChannel when it loads, which would keep Node from exiting: the files
 * around its import make the ports it opens not do that (see message-channel-unref.cjs). They stay files of their
 * own in the package, imported in this order: code bundled into this module would run after its imports.
 */
import "./message-channel-unref.cjs";
import * as browserBuild from "react-dom/server.browser";
import "./message-channel-restore.cjs";
import * as defaultBuild from "react-dom/server";

import React from "react";
import { collecting } from "./collect";

type Build = typeof defaultBuild;
const builds: Build[] = [browserBuild, defaultBuild];

// The builds of the Elements renders under way, innermost last, shared by every copy of Elements a process loads
// (they share react-dom).
const SHARED = Symbol.for("@unlayer/react-elements/render-builds");
const using = ((globalThis as Record<symbol, unknown>)[SHARED] ??= []) as Build[];

/** The same module (a bundler can wrap one in two objects, as for `react-dom/server` and its browser build in a browser bundle). */
const same = (a: Build, b: Build) => a.renderToString === b.renderToString;

/** The hooks dispatcher of the React render under way (React sets it while a component renders), or null. */
function dispatcher(): unknown {
  const internals = React as unknown as Record<string, { H?: unknown; ReactCurrentDispatcher?: { current?: unknown } } | undefined>;
  return internals.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE?.H ?? internals.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?.ReactCurrentDispatcher?.current ?? null;
}

/** Each build's dispatcher, from a render of its own while none is under way (it would be that one's). */
const dispatchers = new Map<Build, unknown>();
function learn(): void {
  if (dispatcher() !== null) return;
  for (const build of builds) {
    if (dispatchers.has(build)) continue;
    let seen: unknown = null;
    build.renderToStaticMarkup(React.createElement(() => ((seen = dispatcher()), null)));
    dispatchers.set(build, seen);
  }
}
learn();

/**
 * Runs one Elements render with a build that isn't rendering; every render it makes uses that one. Called from the
 * user's code in a render with a build it knows (the app's render, or a component Elements collects), it takes the
 * other one, which mustn't be one an Elements render it's called in uses (a third level: it can't). Otherwise (no
 * render under way, or one of Elements' own renders, whose components call no hooks after) it keeps the one it's in.
 */
export function withBuild<T>(render: () => T): T {
  learn();
  const outer = dispatcher();
  let build: Build | undefined = using[using.length - 1] ?? browserBuild;
  const theirs = outer === null ? undefined : builds.find((b) => dispatchers.get(b) === outer);
  if (theirs && (using.length === 0 || collecting() !== undefined)) {
    build = builds.find((b) => !same(b, theirs));
    if (!build || using.some((b) => same(b, build!))) {
      throw new Error(
        "[Unlayer] renderToHtml, renderToJson or renderToPlainText was called while React renders with each server renderer Elements can use (in a component rendered by one called in a component rendered by another, or, in a browser bundle, in a component react-dom/server renders): React can't render inside its own render. Call it before rendering, and pass the result as a prop."
      );
    }
  }
  using.push(build);
  try {
    return render();
  } finally {
    using.pop();
  }
}

const current = (): Build => using[using.length - 1] ?? browserBuild;

export const renderToStaticMarkup: Build["renderToStaticMarkup"] = (element, options) => current().renderToStaticMarkup(element, options);
export const renderToString: Build["renderToString"] = (element, options) => current().renderToString(element, options);
