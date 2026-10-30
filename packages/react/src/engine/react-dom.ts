/**
 * The renderer Elements renders templates with: react-dom/server, through its public API only (as React Email does).
 * The synchronous renderers use its static render (`renderToStaticMarkup`), the async ones its streaming render, waited
 * for whole. A template renders in a `<noscript>`, where React 19 hoists nothing to a document's head and preloads no
 * image (its resource hints aren't an email's), and the `<noscript>` is taken off again.
 *
 * What react-dom can't do is said by name, never with React's own error (ARCHITECTURE.md, "What it can't render"):
 * React Server Components' React, a second copy of React, and a render started inside a component Elements is
 * rendering.
 */
import React, { createElement } from "react";
import * as Server from "react-dom/server";
import { positionOf, RenderError, type Frame } from "./errors";

// ── Rendering ──

/** react-dom's static markup of `node`, in a `<noscript>` (see above), without it. */
export function staticMarkup(node: React.ReactNode, idPrefix?: string): string {
  const html = Server.renderToStaticMarkup(createElement("noscript", null, node), idPrefix ? { identifierPrefix: idPrefix } : undefined);
  return html.slice("<noscript>".length, html.length - "</noscript>".length);
}

/** Node's writable stream, as much of it as react-dom's pipeable stream writes to: the chunks joined. */
function sink(done: (html: string) => void) {
  let html = "";
  const decoder = new TextDecoder();
  const self = {
    write(chunk: unknown) {
      html += typeof chunk === "string" ? chunk : decoder.decode(chunk as Uint8Array, { stream: true });
      return true;
    },
    end() {
      done(html + decoder.decode());
    },
    on: () => self,
    once: () => self,
    emit: () => true,
    removeListener: () => self,
    flush() {},
    destroy() {},
  };
  return self;
}

/**
 * react-dom's streaming render of `node` once everything in it is ready, in a `<noscript>`, without it and without the
 * stream's own comments (where its Suspense boundaries are, between texts): Node's pipeable stream where react-dom has
 * it, a web stream elsewhere. `onError` is told what React handles itself (a part in a Suspense that failed).
 */
export function streamedMarkup(node: React.ReactNode, idPrefix: string | undefined, raw: (html: string) => string, onError?: (error: unknown) => void, control: { abort?: (reason: unknown) => void } = {}): Promise<string> {
  const element = createElement("noscript", null, node);
  const S = Server as unknown as Record<string, any>;
  const report = (error: unknown) => void onError?.(error);
  const bare = (html: string) => raw(html.slice("<noscript>".length, html.length - "</noscript>".length));
  if (typeof S.renderToPipeableStream === "function") {
    return new Promise((resolve, reject) => {
      let failed = false;
      const stream = S.renderToPipeableStream(element, {
        identifierPrefix: idPrefix,
        onAllReady() {
          if (!failed) stream.pipe(sink((html) => resolve(bare(html))));
        },
        onShellError(error: unknown) {
          failed = true;
          reject(error);
        },
        onError: report,
      });
      control.abort = (reason) => stream.abort(reason);
    });
  }
  return (async () => {
    const aborts = new AbortController();
    control.abort = (reason) => aborts.abort(reason);
    const stream = await S.renderToReadableStream(element, { identifierPrefix: idPrefix, onError: report, signal: aborts.signal });
    await stream.allReady;
    return bare(await new Response(stream).text());
  })();
}

// ── What suspends ──

/**
 * React 19's `use()` of a promise that isn't settled throws one object, its "SuspenseException" (an implementation
 * detail React asks code that catches errors to throw again), the same each time, but one per renderer: the static
 * renderer's and the streaming one's are two. React exports neither, so each is found once, by identity, as a
 * component that `use()`s a pending promise in that renderer catches it (`suspenseOf`), never by its message. React 18
 * has no `use()`: a component suspends by throwing a promise.
 */
const PROBED = { sync: false, stream: false };
const SUSPENSE: { sync?: unknown; stream?: unknown } = {};

function prober(into: "sync" | "stream", thenable: PromiseLike<unknown>) {
  const use = (React as unknown as { use?: (usable: unknown) => unknown }).use;
  return function UseProbe(props: { own?: boolean }) {
    // (React's development build calls a component again, with no props, to say where a warning came from.)
    if (props?.own !== true) throw new Error("[Unlayer] not rendered by Elements");
    try {
      use!(thenable);
    } catch (error) {
      SUSPENSE[into] ??= error;
      throw error;
    }
    return null;
  };
}

/** The static renderer's suspension (see above), found the first time it's asked for. */
export function staticSuspension(): unknown {
  if (!PROBED.sync) {
    PROBED.sync = true;
    if (typeof (React as unknown as { use?: unknown }).use === "function") {
      try {
        Server.renderToStaticMarkup(createElement(React.Suspense, { fallback: null }, createElement(prober("sync", { then: () => undefined } as unknown as PromiseLike<unknown>), { own: true })));
      } catch {
        // It suspended where nothing could wait: what it threw is kept all the same.
      }
    }
  }
  return SUSPENSE.sync;
}

/** The streaming renderer's suspension (see above), found before the first async render. */
export async function streamSuspension(): Promise<unknown> {
  if (!PROBED.stream) {
    PROBED.stream = true;
    if (typeof (React as unknown as { use?: unknown }).use === "function") {
      try {
        await streamedMarkup(createElement(React.Suspense, { fallback: null }, createElement(prober("stream", Promise.resolve()), { own: true })), undefined, (html) => html);
      } catch {
        // As above.
      }
    }
  }
  return SUSPENSE.stream;
}

export const isThenable = (value: unknown): value is PromiseLike<unknown> => typeof (value as { then?: unknown } | null)?.then === "function";

/**
 * Whether react-dom's static render failed because something suspended where no Suspense was around it: React throws
 * an Error of its own for that, which only its message tells (its static renderer has no `onError`, and the
 * suspension it caught is its own). Read only where nothing of the collector's saw what suspended: what React
 * resolves itself, a lazy component's.
 */
export const suspendedInReact = (error: unknown): boolean => error instanceof Error && /suspended while responding to synchronous input/.test(error.message);

/** Whether a component threw to suspend, in the static renderer (`stream`: the streaming one). */
export const suspends = (thrown: unknown, stream = false): boolean => isThenable(thrown) || (thrown != null && thrown === (stream ? SUSPENSE.stream : staticSuspension()));

// ── What it can't render, said by name ──

/** React Server Components' React (its react-server build) has no useState: react-dom can't render with it. */
export const isServerReact = (): boolean => typeof (React as unknown as { useState?: unknown }).useState !== "function";

export const SERVER_REACT =
  'Elements renders templates with react-dom/server, as React Email does, and react-dom can\'t render with React Server Components\' React (the "react-server" build, which Next.js\'s App Router gives route handlers and Server Components on the edge runtime): render it in the Node.js runtime (Next.js: `export const runtime = "nodejs"`, the default), or in a Client Component';

export const REACT_COPIES =
  "react-dom/server renders with another copy of React than the one Elements imports, so the template's hooks can't run: install one copy of react and react-dom (`npm ls react` lists them), or alias `react` to one path in your bundler";

export const nestedRender = (api: string) =>
  `${api} can't start while a component of a template that Elements is rendering synchronously is called: react-dom/server, which renders templates, can't start a render inside its own. Render it before (and pass what it gives as a prop) or after, or start an async render there ("@unlayer/react-elements/async"), which renders once that call is over`;

/**
 * Whether the hooks of the React Elements imports run in react-dom's renders (one copy of React), found once, where a
 * render failed: a component that calls one, rendered by react-dom.
 */
let one: boolean | undefined;
export function oneReact(): boolean {
  if (one === undefined) {
    try {
      Server.renderToStaticMarkup(createElement(function HookProbe() {
        React.useId();
        return null;
      }));
      one = true;
    } catch {
      one = false;
    }
  }
  return one;
}

/** Whether react-dom renders here at all: markup with no component (with React Server Components' React, it can't). */
let renders: boolean | undefined;
export function reactDomRenders(): boolean {
  if (renders === undefined) {
    try {
      Server.renderToStaticMarkup(createElement("i"));
      renders = true;
    } catch {
      renders = false;
    }
  }
  return renders;
}

/** What a render that react-dom failed to start or finish (not a part of the template) fails with: said by name where it's one of the above. */
export function renderFailure(error: unknown, name: string): RenderError | undefined {
  if (isServerReact() || !reactDomRenders()) return new RenderError(SERVER_REACT, name, "", error);
  if (!oneReact()) return new RenderError(REACT_COPIES, name, "", error);
  return undefined;
}

/**
 * The components of the user's own being called by a synchronous render of Elements now, by every copy of Elements in
 * the process (a global, by Symbol.for): a render started there would start a render of react-dom's static renderer
 * inside its own, which breaks the hooks of the component that started it (and react-dom's render it's in).
 */
const CALLING = Symbol.for("@unlayer/react-elements/calling");
type Calling = { frame: { name: string; label: string; parent: unknown } | null };
const calling = ((globalThis as Record<symbol, Calling | undefined>)[CALLING] ??= { frame: null }) as Calling;

/** `fn`, a component of the user's own (at `frame`) that a synchronous render calls (see `calling`). */
export function asUserCall<T>(frame: Frame, fn: () => T): T {
  const outer = calling.frame;
  calling.frame = frame;
  try {
    return fn();
  } finally {
    calling.frame = outer;
  }
}

/** `fn`, Elements' own code, where a render of its own can start (a root's content, inside a component Elements calls). */
export function asOwnCall<T>(fn: () => T): T {
  const outer = calling.frame;
  calling.frame = null;
  try {
    return fn();
  } finally {
    calling.frame = outer;
  }
}

/** The errors `refuseNested` made: the render they're in fails with them as they are (never left out). */
const refusals = new WeakSet<object>();
export const isRefusal = (error: unknown): boolean => typeof error === "object" && error !== null && refusals.has(error);

/** Throws, named after the component calling it, where a render (`api`) starts inside a component a synchronous render of Elements is calling. */
export function refuseNested(api: string): void {
  const frame = calling.frame as Frame | null;
  if (!frame) return;
  const error = new RenderError(nestedRender(api), frame.name, positionOf(frame));
  refusals.add(error);
  throw error;
}
