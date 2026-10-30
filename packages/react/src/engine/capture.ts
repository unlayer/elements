/**
 * A template's wrappers (`<Welcome />`, which returns the root) called with hooks, before its root's settings are read
 * (see utils/unwrap-root.ts): each in a render of react-dom's of its own (`Capture`), inside the providers around it
 * and where the wrappers before it left the tree, so its hooks, its contexts and its `useId()`s are React's; what it
 * returned kept, the render's output thrown away. A wrapper that suspends (`use()` of a pending promise) is rendered
 * again by react-dom's streaming render, which waits for it and calls it again as React does (`Streamed`, a promise the
 * async renderers wait for; the synchronous ones say the template is async). A lazy template (`React.lazy`) is
 * rendered the same way, its root found where it renders (see utils/root-capture.ts): React's public API has no other
 * way to the component it loads.
 */
import React, { cloneElement, createElement } from "react";
import { nameOf, RenderError, rootFrame, threw } from "./errors";
import { asUserCall, isThenable, refuseNested, renderFailure, staticMarkup, streamedMarkup, streamSuspension, suspends } from "./react-dom";
import { ROOT_CAPTURE, Stamp, type RootReport } from "./root-capture";
import { sharedNow, sharing } from "./shared";

type Tracked = PromiseLike<unknown> & { status?: "pending" | "fulfilled" | "rejected"; value?: unknown; reason?: unknown };

/** React's thenable protocol: `status`, then `value` or `reason`, set once it settles. */
export function track(thenable: Tracked): void {
  if (thenable.status) return;
  thenable.status = "pending";
  thenable.then(
    (value) => {
      if (thenable.status === "pending") Object.assign(thenable, { status: "fulfilled", value });
    },
    (reason) => {
      if (thenable.status === "pending") Object.assign(thenable, { status: "rejected", reason });
    }
  );
}

/** A `useId()` of Elements' React: none where react-dom renders with another copy (the template's hooks say so, if it has any). */
function probeId(): string {
  try {
    return React.useId();
  } catch {
    return "";
  }
}

/**
 * The props Elements' own components here are rendered with: React's development build calls a component once more,
 * with no props and hooks off, to say where a warning came from, and that call must do nothing (it throws at once).
 */
const OWN = { own: true } as const;
function own(props: unknown): void {
  if ((props as { own?: boolean } | undefined)?.own !== true) throw new Error("[Unlayer] not rendered by Elements");
}

/** A component that calls useId(), so what's in it is where a template wrapper that called it left the tree. */
const Fork = (props: { own: true; children?: React.ReactNode }) => (own(props), probeId(), props.children ?? null);
export const forked = (forks: number, node: React.ReactNode): React.ReactNode => {
  for (let i = 0; i < forks; i++) node = createElement(Fork, OWN, node);
  return node;
};

/** `inside`, in `providers` (elements whose children it takes the place of), outermost first. */
const within = (providers: readonly React.ReactElement[], inside: React.ReactNode): React.ReactNode =>
  providers.reduceRight<React.ReactNode>((node, provider) => cloneElement(provider, undefined, node), inside);

/**
 * The id a component gets where `forks` wrappers that called useId() left the tree. Kept for the first 1,000 kinds
 * (a template's forks and `idPrefix`: a prefix per message would keep one each), then worked out each time.
 */
const baselines = new Map<string, string>();
/** How many baselines are kept (for the tests). */
export const keptBaselines = (): number => baselines.size;
function baselineId(forks: number, idPrefix = ""): string {
  const key = `${forks}:${idPrefix}`;
  let id = baselines.get(key);
  if (id === undefined) {
    let seen = "";
    const IdProbe = (props: { own: true }) => (own(props), (seen = probeId()), null);
    try {
      staticMarkup(forked(forks, createElement(IdProbe, OWN)), idPrefix);
    } catch {
      // (Where Elements' React isn't react-dom's, no id: what's in a wrapper is where it is.)
    }
    id = seen;
    if (baselines.size < 1000) baselines.set(key, id);
  }
  return id;
}

/**
 * A promise of what a wrapper that suspended returns, once react-dom's streaming render has waited for it (see above).
 * It starts that render when it's first waited for: the synchronous renderers, which say the template is async, never
 * start it.
 */
const STREAMED = Symbol("@unlayer/react-elements/streamed");
export interface Streamed<T> extends PromiseLike<T> {
  [STREAMED]: true;
}
function streamed<T>(run: () => Promise<T>): Streamed<T> {
  let started: Promise<T> | undefined;
  return { [STREAMED]: true, then: (ok, fail) => (started ??= run()).then(ok, fail) };
}
export const isStreamed = (value: unknown): value is Streamed<unknown> => !!(value as Record<symbol, unknown> | null)?.[STREAMED];

/** What a wrapper's call threw, as its render fails with it (a promise it throws again once it has rejected: what it rejected with). */
function failed(error: unknown, name: string): unknown {
  if (isThenable(error)) {
    track(error);
    const t = error as Tracked;
    if (t.status !== "rejected") return error;
    error = t.reason;
  }
  if (error instanceof RenderError || suspends(error) || suspends(error, true)) return error;
  // (What react-dom can't render here, said by name: see react-dom.ts.)
  return renderFailure(error, name) ?? new RenderError(threw(error), name, "", error);
}

/**
 * A template wrapper called with hooks (see above): what it returns, and whether it called useId() (what's in it then
 * starts at a fork of the tree). A promise it throws (React 18's Suspense) is thrown as it is, for its caller to call
 * it again once it settles; `use()` of a pending one throws a promise of what it returns once react-dom has waited.
 */
export function callCaptured(fn: (props: any, second?: unknown) => unknown, props: Record<string, unknown>, second: unknown, name: string, providers: readonly React.ReactElement[], forks: number, idPrefix?: string, stream = false): { value: unknown; forked: boolean } {
  refuseNested("This render");
  // (What the render's components share: in the streaming render, the wrapper's call is outside the one it's in now.)
  const shared = sharedNow();
  const got: { value?: unknown; thrown?: { error: unknown }; id: string } = { id: "" };
  const IdProbe = (p: { own: true }) => (own(p), (got.id = probeId()), null);
  const Capture = (stream: boolean) => {
    const Captured = (p: { own: true }) => {
      own(p);
      try {
        // (A render it starts would start react-dom's static renderer inside its own: said by name, see react-dom.ts.)
        got.value = stream ? sharing(shared, () => fn(props, second)) : asUserCall(rootFrame(name), () => fn(props, second));
      } catch (error) {
        // (In the streaming render, a suspension is React's to wait for; a promise it throws again once it has
        // rejected, what it rejected with.)
        if (stream && isThenable(error)) {
          track(error);
          if ((error as Tracked).status !== "rejected") throw error;
        } else if (stream && suspends(error, true)) throw error;
        got.thrown = { error };
        return null;
      }
      return createElement(IdProbe, OWN);
    };
    Captured.displayName = name;
    return forked(forks, within(providers, createElement(Captured, OWN)));
  };
  const result = () => ({ value: got.value, forked: got.id !== "" && got.id !== baselineId(forks, idPrefix) });
  if (!stream) {
    try {
      staticMarkup(Capture(false), idPrefix);
    } catch (error) {
      got.thrown ??= { error };
    }
  }
  if (stream || got.thrown) {
    if (got.thrown) {
      const error = failed(got.thrown.error, name);
      if (isThenable(error) || !suspends(error)) throw error;
    }
    // `use()` of a pending promise (or an async render's): rendered by react-dom's streaming render, which waits for it.
    throw streamed(async () => {
      await streamSuspension();
      Object.assign(got, { thrown: undefined, id: "" });
      try {
        await streamedMarkup(Capture(true), idPrefix, (html) => html);
      } catch (error) {
        throw failed(error, name);
      }
      if (got.thrown) throw failed(got.thrown.error, name);
      return result();
    });
  }
  return result();
}

/** A template wrapper that's a class (react-intl's <IntlProvider>), constructed and rendered by react-dom inside `providers`: what its render returns. */
export function callClassCaptured(Ctor: any, props: Record<string, unknown>, providers: readonly React.ReactElement[], forks: number, idPrefix?: string): unknown {
  refuseNested("This render");
  let value: unknown;
  let thrown: { error: unknown } | undefined;
  const name = nameOf(Ctor);
  const captured = (call: () => unknown) => {
    try {
      value = asUserCall(rootFrame(name), call);
    } catch (error) {
      thrown = { error };
    }
    return null;
  };
  class Capture extends Ctor {
    constructor(...args: unknown[]) {
      super(...args);
      // (A render given as a class field, `render = () => …`, is the instance's own, which hides this class's.)
      const self = this as unknown as { render: () => unknown };
      if (Object.prototype.hasOwnProperty.call(self, "render") && typeof self.render === "function") {
        const own = self.render;
        self.render = () => captured(() => own.call(self));
      }
    }
    render() {
      return captured(() => super.render());
    }
  }
  (Capture as unknown as { displayName: string }).displayName = name;
  try {
    staticMarkup(forked(forks, within(providers, createElement(Capture as unknown as React.ComponentType<any>, props))), idPrefix);
  } catch (error) {
    thrown ??= { error };
  }
  if (thrown) {
    const error = failed(thrown.error, name);
    if (isThenable(error)) throw error;
    throw error;
  }
  return value;
}

/**
 * A lazy template (`React.lazy`), rendered where it is (inside `providers`) until the root it renders reports itself
 * (see utils/root-capture.ts): that root's element, or undefined where it renders none (what it renders is then the
 * template's content). One that hasn't loaded throws a promise of the same once react-dom's streaming render has
 * loaded it; one that fails to load fails with its error.
 */
export function captureLazyRoot(lazy: React.ReactElement, providers: readonly React.ReactElement[], forks: number, idPrefix?: string): React.ReactElement | undefined {
  refuseNested("This render");
  const context = ROOT_CAPTURE.context();
  if (!context) return undefined;
  const got: { report?: RootReport; waiting: boolean } = { waiting: false };
  const Pending = (p: { own: true }) => (own(p), (got.waiting = true), null);
  // (Its value this render's only: see root-capture.ts's Stamped.)
  const capture = (inside: React.ReactNode) => {
    const holder = { value: (r: RootReport) => void (got.report ??= r), start: undefined as unknown };
    return forked(forks, within(providers, createElement(context.Provider, { value: holder }, createElement(Stamp, { holder }, inside))));
  };
  try {
    staticMarkup(capture(createElement(React.Suspense, { fallback: createElement(Pending, OWN) }, lazy)), idPrefix);
  } catch (error) {
    throw failed(error, "lazy");
  }
  if (!got.waiting) return got.report?.element;
  throw streamed(async () => {
    delete got.report;
    try {
      await streamedMarkup(capture(lazy), idPrefix, (html) => html);
    } catch (error) {
      throw failed(error, "lazy");
    }
    return (got.report as RootReport | undefined)?.element;
  });
}
