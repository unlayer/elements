/**
 * What the render that collects a template (src/primitives/collect.tsx) shares with every copy of Elements a process
 * loads: the stack of collecting renders under way (which server-renderer.ts reads to choose a module of react-dom's;
 * an Elements 0.2 copy's collecting render pushes onto it too), each render's nonce, and how an async component is
 * told. A stack, not React context: Server Components have no context, and a collecting render can start inside
 * another.
 */

// Shared by every copy of Elements a process loads (a project's ESM and CommonJS builds, a tool's own).
const SHARED = Symbol.for("@hyper-elements/react/collecting");
const frames: Array<object | null> = ((globalThis as Record<symbol, unknown>)[SHARED] ??= []) as Array<object | null>;

/** The collecting render under way, if any (and not a render of Elements' own inside it). */
export function collecting(): object | undefined {
  return frames[frames.length - 1] ?? undefined;
}

/** Runs `run` with `frame` collecting (or, with `null`, nothing collecting). */
export function within<T>(frame: object | null, run: () => T): T {
  frames.push(frame);
  try {
    return run();
  } finally {
    frames.pop();
  }
}

// Shared by every copy of Elements a process loads, as the collecting stack is: no two renders get one nonce.
const RENDERS = Symbol.for("@hyper-elements/react/renders");

/**
 * A collection's nonce, so markup a template's data holds can't name it: letters, digits and "_", from the count of
 * the process's renders and its high-resolution clock (when it started, and the time since to a fraction of a
 * millisecond), which data written before the render can't know. Not random numbers: a framework that prerenders
 * pages takes `crypto.getRandomValues()` and `Math.random()` for a value that changes the page, and Next.js's Cache
 * Components (its new apps' default) fail the build on one, but the nonce never reaches the output. `performance` is
 * what Next.js leaves for timing, and every runtime Elements supports has it.
 */
export function nonce(): string {
  const shared = globalThis as Record<symbol, number>;
  const clock = globalThis.performance;
  return [(shared[RENDERS] = (shared[RENDERS] ?? 0) + 1), (clock?.timeOrigin ?? 0) * 1e3, (clock?.now() ?? 0) * 1e6].map((n) => Math.floor(n).toString(36)).join("_");
}

/** React's marks on a `memo` and a `forwardRef` component. */
const MEMO = Symbol.for("react.memo");
const FORWARD_REF = Symbol.for("react.forward_ref");

/** A component declared `async`: it can't render synchronously, so it isn't called at all. */
export function isAsyncComponent(type: any): boolean {
  while (type?.$$typeof === MEMO) type = type.type;
  return (type?.$$typeof === FORWARD_REF ? type.render : type)?.[Symbol.toStringTag] === "AsyncFunction";
}
