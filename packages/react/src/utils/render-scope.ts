/**
 * One render's scope (the render that collects a template for render(), validate(), outline(), prepare() and
 * toDesign()): it runs with a module of react-dom's that isn't rendering, apart from any template being collected
 * around it.
 */
import { within } from "./collect";
import { withBuild } from "./server-renderer";

/**
 * Runs one render, apart from a template being collected: called inside a component of one, it renders what it's
 * given.
 */
export function withRenderScope<T>(render: () => T): T {
  // Called in a render (a component of the user's own calling toDesign() in its useMemo, while the app renders it),
  // it renders with a server build that isn't rendering (see server-renderer.ts). The build is chosen first: whether a
  // template is being collected tells who calls it.
  return withBuild(() => within(null, render));
}
