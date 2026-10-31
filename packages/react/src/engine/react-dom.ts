/**
 * The renderer Elements renders templates with: react-dom/server, through its public API only (as React Email does).
 * The synchronous renderers use its static render (`renderToStaticMarkup`), the async ones its streaming render, waited
 * for whole. A template renders in a `<noscript>`, where React 19 hoists nothing to a document's head and preloads no
 * image (its resource hints aren't an email's), and the `<noscript>` is taken off again.
 *
 * What react-dom can't do is said by name, never with React's own error (ARCHITECTURE.md, "What it can't render"):
 * React Server Components' React, a second copy of React, and a render started inside a component that react-dom's
 * static renderer is rendering (one of a template Elements is rendering, or of an app's own `renderToString`).
 */
import React, { createElement } from "react";
import * as Server from "react-dom/server";
import { positionOf, RenderError, type Frame } from "./errors";
import { perReact } from "./per-react";
import { REACT_18 } from "./react-compat";

/** A module of react-dom's server renderers: react-dom/server's, or another (see withFreeBuild). */
type Build = typeof Server;

// ── Rendering ──

/**
 * What's inside the `<noscript>` a template renders in (see above). Only what's in it: React 19 writes the resource
 * hints a component asks for (`ReactDOM.preload`, `preconnect`, `preinit`, …) before it, which an email has no use for.
 */
function inWrapper(html: string): string {
  const start = html.indexOf("<noscript>");
  const end = html.lastIndexOf("</noscript>");
  return start < 0 || end < start ? html : html.slice(start + "<noscript>".length, end);
}

/**
 * react-dom's static markup of `node`, in a `<noscript>` (see above), without it. Where it fails, `failed.at` is where
 * React was rendering (a lazy component's place: see ownStatic), this render's own.
 */
export function staticMarkup(node: React.ReactNode, idPrefix?: string, failed?: { at?: Frame }): string {
  const build = current();
  return inWrapper(ownStatic(() => build.renderToStaticMarkup(createElement("noscript", null, node), idPrefix ? { identifierPrefix: idPrefix } : undefined), build, failed));
}

/**
 * React 18.2's and 18.3's Node stream write their whole 2,048-byte buffer where a character didn't fit at its end, the
 * bytes after the last they filled as zeros (NULs in the text: raw `renderToPipeableStream` writes them too). It
 * writes the character in the next chunk, so a chunk that size ends at its last byte that isn't one of those, at most
 * 3 (a character is 4 bytes at most). React 19 writes only the bytes it filled.
 */
const VIEW = 2048;
const FILLS_VIEW = Number.parseInt(React.version) < 19;
const filled = (bytes: Uint8Array) => {
  let end = bytes.length;
  if (FILLS_VIEW && end === VIEW) while (end > VIEW - 3 && bytes[end - 1] === 0) end--;
  return end === bytes.length ? bytes : bytes.subarray(0, end);
};

/** Node's writable stream, as much of it as react-dom's pipeable stream writes to: the chunks joined. */
function sink(done: (html: string) => void) {
  let html = "";
  const decoder = new TextDecoder();
  const self = {
    write(chunk: unknown) {
      html += typeof chunk === "string" ? chunk : decoder.decode(filled(chunk as Uint8Array), { stream: true });
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
 * it, a web stream elsewhere. `onError` is told what React handles itself (a part in a Suspense that failed). No chunk
 * size: React 19 otherwise writes a long stream's <Suspense> as its fallback, its content after the rest in a hidden
 * <div> and scripts that move it (an email can run none).
 */
export function streamedMarkup(node: React.ReactNode, idPrefix: string | undefined, raw: (html: string) => string, onError?: (error: unknown, info?: unknown) => void, control: { abort?: (reason: unknown) => void } = {}): Promise<string> {
  // (Where react-dom can't render (React Server Components' React on the edge runtime), its stream throws where nothing
  // catches it, and never settles: the render fails as the synchronous ones do, by name, before it starts (see
  // renderFailure). Asked of react-dom itself: Next.js's Server Components on the Node.js runtime have a React with no
  // useState too, where react-dom renders.)
  if (!reactDomRenders()) return Promise.reject(new TypeError("react-dom can't render with this React"));
  const element = createElement("noscript", null, node);
  const S = Server as unknown as Record<string, any>;
  const report = (error: unknown, info?: unknown) => void onError?.(error, info);
  const bare = (html: string) => raw(inWrapper(html));
  return streamed(S, element, idPrefix, report, control).then(
    (html) => settleStream(S).then(() => bare(html)),
    (error) =>
      settleStream(S).then(() => {
        throw error;
      }),
  );
}

/**
 * Where a render stopped (it failed: see the engine's collectAsync), react-dom's streaming module settled as it is
 * after one that's done (see settleStream): a batch whose renders all fail, one after another, keeps no memory.
 */
export const streamStopped = (): Promise<void> => settleStream(Server as unknown as Record<string, any>);

/** One macrotask later (setImmediate where there is one: Node.js, Bun; a timer elsewhere). */
const nextTask = (fn: () => void): void => void (typeof setImmediate === "function" ? setImmediate(fn) : setTimeout(fn, 0));

/**
 * A render of nothing with react-dom's streaming module, done, one macrotask after it's done. React can leave a
 * template's providers pushed in the module that rendered it (a part that waited, failed or was abandoned), where every
 * react-dom stream and an app's client render read a context's value: a render of nothing pops them (see settle). And
 * React 19's stream holds each request till a macrotask it scheduled runs, which a loop that only awaits renders never
 * reaches (its memory then grows render by render): this resolves after it.
 */
function settleStream(S: Record<string, any>): Promise<void> {
  return new Promise<void>((done) => {
    const finish = () => nextTask(done);
    try {
      if (typeof S.renderToPipeableStream === "function") S.renderToPipeableStream(createElement("i"), { onAllReady: finish, onShellError: finish, onError() {} });
      else S.renderToReadableStream(createElement("i"), { onError() {} }).then((stream: { allReady: Promise<void> }) => stream.allReady).then(finish, finish);
    } catch {
      finish();
    }
  });
}

/** react-dom's streaming render of `element`, its whole output once everything in it is ready. */
function streamed(S: Record<string, any>, element: React.ReactElement, idPrefix: string | undefined, report: (error: unknown, info?: unknown) => void, control: { abort?: (reason: unknown) => void }): Promise<string> {
  if (typeof S.renderToPipeableStream === "function") {
    return new Promise((resolve, reject) => {
      let failed = false;
      let piped = false;
      const stream = S.renderToPipeableStream(element, {
        identifierPrefix: idPrefix,
        progressiveChunkSize: Infinity,
        onAllReady() {
          if (failed || piped) return;
          piped = true;
          stream.pipe(sink(resolve));
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
    const stream = await S.renderToReadableStream(element, { identifierPrefix: idPrefix, progressiveChunkSize: Infinity, onError: report, signal: aborts.signal });
    await stream.allReady;
    return new Response(stream).text();
  })();
}

// ── What suspends ──

/**
 * React 19's `use()` of a promise that isn't settled throws one object, its "SuspenseException" (an implementation
 * detail React asks code that catches errors to throw again), the same each time, but one per renderer: the static
 * renderer's and the streaming one's are two (and each module of react-dom's static renderer has its own). React
 * exports neither, so each is found once, by identity, as a component that `use()`s a pending promise in that renderer
 * catches it, never by its message. React 18 has no `use()`: a component suspends by throwing a promise.
 */
const PROBED: { stream?: Promise<void> } = {};
const SUSPENSE: { sync: Map<Build, unknown>; stream?: unknown } = { sync: new Map() };

function prober(found: (error: unknown) => void, thenable: PromiseLike<unknown>) {
  const use = (React as unknown as { use?: (usable: unknown) => unknown }).use;
  return function UseProbe(props: { own?: boolean }) {
    // (React's development build calls a component again, with no props, to say where a warning came from.)
    if (props?.own !== true) throw new Error("[Unlayer] not rendered by Elements");
    try {
      use!(thenable);
    } catch (error) {
      found(error);
      throw error;
    }
    return null;
  };
}

/** The static renderer's suspension (see above) for the module rendering now, found the first time it's asked for. */
export function staticSuspension(): unknown {
  const build = current();
  if (!SUSPENSE.sync.has(build)) {
    SUSPENSE.sync.set(build, undefined);
    if (typeof (React as unknown as { use?: unknown }).use === "function") {
      try {
        const probe = prober((error) => SUSPENSE.sync.get(build) ?? SUSPENSE.sync.set(build, error), { then: () => undefined } as unknown as PromiseLike<unknown>);
        ownStatic(() => build.renderToStaticMarkup(createElement(React.Suspense, { fallback: null }, createElement(probe, { own: true }))));
      } catch (error) {
        // Out of stack before it suspended, it found nothing: nothing's kept, and it's found where it's next asked
        // for (see roomy). Otherwise it suspended where nothing could wait: what it threw is kept all the same.
        if (outOfStack(error) && SUSPENSE.sync.get(build) === undefined) {
          SUSPENSE.sync.delete(build);
          throw error;
        }
      }
      if (SUSPENSE.sync.get(build) === undefined && !roomy()) {
        SUSPENSE.sync.delete(build);
        throw outOfRoom();
      }
    }
  }
  return SUSPENSE.sync.get(build);
}

/** The streaming renderer's suspension (see above), found before the first async render. */
export async function streamSuspension(): Promise<unknown> {
  // (Asked by renders at once, found once: each waits for it.)
  if (!PROBED.stream) PROBED.stream = probeStream();
  try {
    await PROBED.stream;
  } catch (error) {
    PROBED.stream = undefined;
    throw error;
  }
  return SUSPENSE.stream;
}

/**
 * The streaming renderer's suspension, found as soon as its render reaches the probe (React 19 starts it in a
 * microtask), not once that render is done (a macrotask later): the template's first render goes on at once, so a
 * promise one of its components reads is handled by React before what fails it can (a file read that fails at once).
 * Otherwise Node.js ended the process on its rejection, which nothing handled yet, in the process's first render.
 */
async function probeStream(): Promise<void> {
  if (typeof (React as unknown as { use?: unknown }).use !== "function") return;
  let reached!: () => void;
  const found = new Promise<void>((resolve) => (reached = resolve));
  const done = streamedMarkup(createElement(React.Suspense, { fallback: null }, createElement(prober((error) => (SUSPENSE.stream ??= error, reached()), Promise.resolve()), { own: true })), undefined, (html) => html);
  done.catch(() => {});
  try {
    await Promise.race([found, done]);
  } catch (error) {
    // As above.
    if (outOfStack(error) && SUSPENSE.stream === undefined) throw error;
  }
}

export const isThenable = (value: unknown): value is PromiseLike<unknown> => typeof (value as { then?: unknown } | null)?.then === "function";

/**
 * Whether react-dom's static render failed because something suspended where no Suspense was around it: React throws
 * an Error of its own for that, which only its message tells (its static renderer has no `onError`, and the
 * suspension it caught is its own; its browser build's production error is only its number, #426). Read only where
 * nothing of the collector's saw what suspended: what React resolves itself, a lazy component's.
 */
export const suspendedInReact = (error: unknown): boolean => error instanceof Error && /suspended while responding to synchronous input|Minified React error #426\b/.test(error.message);

/** Whether a component threw to suspend, in the static renderer (`stream`: the streaming one). */
export const suspends = (thrown: unknown, stream = false): boolean => isThenable(thrown) || (thrown != null && thrown === (stream ? SUSPENSE.stream : staticSuspension()));

// ── What it can't render, said by name ──

/** React Server Components' React (its react-server build) has no useState: react-dom can't render with it. */
export const isServerReact = (): boolean => typeof (React as unknown as { useState?: unknown }).useState !== "function";

export const SERVER_REACT =
  'Elements renders templates with react-dom/server, as React Email does, and react-dom can\'t render with React Server Components\' React (the "react-server" build, which Next.js\'s App Router gives route handlers and Server Components on the edge runtime): render it in the Node.js runtime (Next.js: `export const runtime = "nodejs"`, the default), or in a Client Component';

export const REACT_COPIES =
  "react-dom/server renders with another copy of React than the one Elements imports, so the template's hooks can't run: install one copy of react and react-dom (`npm ls react` lists them), or alias `react` to one path in your bundler";

/** What an async component React.lazy loads fails with on React 18, which renders it itself and has no async components. */
export const LAZY_ASYNC_18 =
  'React 18 renders what React.lazy loads itself, and has no async components, so an async template or component loaded lazily can\'t render: load it yourself (`const { default: Receipt } = await import("./Receipt")`) and render `<Receipt />`, or render with React 19';

/** Whether `error` is React 18's for an async component it rendered itself (one a lazy component loads: see LAZY_ASYNC_18). */
export const lazyAsyncIn18 = (error: unknown): boolean => REACT_18 && error instanceof Error && /^Objects are not valid as a React child \(found: \[object Promise\]\)/.test(error.message);

export const TEMPLATE_REACT =
  "the template was made with another copy of React than the one Elements renders with (its elements, or the hooks its components call), so React can't render it: install one copy of react and react-dom (`npm ls react` lists them), or alias `react` to one path in your bundler";

/** React's hooks, as its dispatcher names them (react's and react-dom's). */
const HOOKS = new Set("use useActionState useCallback useContext useDebugValue useDeferredValue useEffect useEffectEvent useFormState useFormStatus useId useImperativeHandle useInsertionEffect useLayoutEffect useMemo useOptimistic useReducer useRef useState useSyncExternalStore useTransition".split(" "));
/** A TypeError reading a property of null, by engine: V8's, JavaScriptCore's, SpiderMonkey's; the property it read. */
const OF_NULL = [/^Cannot read properties of null \(reading '([\w$]+)'\)$/, /^null is not an object \(evaluating '[\w$.]*\.([\w$]+)'\)$/, /^can't access property "([\w$]+)", [\w$.]+ is null$/];

/**
 * Whether what a component threw, as it was called (`called`: synchronously, in its call, not a promise's rejection),
 * says the hooks it called are another copy of React's: one of React's hooks read off a dispatcher that's null (that
 * copy renders nothing), as React's hooks fail there. Anything else (`settings.theme.useDarkLogo` of undefined, a hook
 * after an `await`) is the component's own error.
 */
export const otherReactsHook = (error: unknown, called: boolean): boolean => {
  if (!called || !(error instanceof TypeError)) return false;
  for (const pattern of OF_NULL) {
    const hook = pattern.exec(error.message)?.[1];
    if (hook) return HOOKS.has(hook);
  }
  return false;
};

export const nestedRender = (api: string) =>
  `${api} can't start while a component of a template that Elements is rendering synchronously is called: react-dom/server, which renders templates, can't start a render inside its own. Render it before (and pass what it gives as a prop) or after, or start an async render there ("@unlayer/react-elements/async"), which renders once that call is over`;

export const insideStaticRender = (api: string) =>
  `${api} can't start inside a component that react-dom/server's renderToString or renderToStaticMarkup is rendering, where Elements has no other module of react-dom's to render with (a bundle, a browser): react-dom/server's static renderer, which renders templates, can't start a render inside its own (it would break the hooks of the component that started it). Work it out before that render (and pass what it gives as a prop), or render the page with react-dom's stream (renderToPipeableStream or renderToReadableStream)`;

/** Whether `build` renders a component that calls a hook with the React Elements imports (one copy of React). */
function hooksRunIn(build: Build): boolean {
  const error = console.error;
  // (React's development build says "Invalid hook call" where they don't, before it throws.)
  console.error = () => {};
  try {
    build.renderToStaticMarkup(
      createElement(function HookProbe(props: { own?: boolean }) {
        if (props?.own === true) React.useId();
        return null;
      }, { own: true }),
    );
    return true;
  } catch (thrown) {
    if (outOfStack(thrown)) throw thrown;
    return false;
  } finally {
    console.error = error;
  }
}

/**
 * Whether what was thrown says the call stack ran out: a RangeError, or a regular expression V8 compiled there (it
 * compiles one when it's first run, and out of stack that's a SyntaxError, `Invalid regular expression: /…/: Stack
 * overflow`).
 */
export const outOfStack = (error: unknown): boolean => error instanceof RangeError || (error instanceof SyntaxError && /: Stack overflow$/.test(error.message));

/**
 * Whether the call stack has room left where it's asked (2,000 calls): a probe that failed, or found nothing, with
 * less says nothing of the build, whatever it threw (near the stack's end, a failure comes out of React's error
 * handling, a regular expression V8 compiles, a module's code, as any error). What it found isn't kept then, and the
 * render it's for fails (outOfRoom): acted on even once, a "no" told there broke the component of an app's own render
 * that Elements rendered inside. What a probe found where it rendered whole is kept wherever it ran.
 */
export function roomy(): boolean {
  // (`+ 1`: not a tail call, which a runtime that has them (JavaScriptCore's) would run in no stack at all.)
  const down = (n: number): number => (n === 0 ? 0 : down(n - 1) + 1);
  try {
    return down(2000) === 2000;
  } catch {
    return false;
  }
}

/** A probe's failure where the call stack had no room left (see roomy): the render it's for fails, out of stack. */
export const outOfRoom = (): RangeError => new RangeError("Maximum call stack size exceeded");

/**
 * A probe's answer for `build`, found once (see below); where it ran out of stack (see outOfStack: a render that called
 * it deep in a call stack), it says nothing of the build, and isn't kept: `true` for now, found again where it's next
 * needed. Kept, a `false` from a render near the stack's end failed every render after it, a tenant's for another's.
 */
function probed(found: Map<Build, boolean>, build: Build, probe: () => boolean): boolean {
  if (found.has(build)) return found.get(build)!;
  try {
    const answer = probe();
    // (A "no" where the stack had no room: see roomy.)
    if (!answer && !roomy()) return true;
    found.set(build, answer);
    return answer;
  } catch (error) {
    if (outOfStack(error)) return true;
    throw error;
  }
}

/**
 * Whether the hooks of the React Elements imports run in react-dom's renders (one copy of React), found once, where a
 * render failed: a component that calls one, rendered by react-dom.
 */
const one = new Map<Build, boolean>();
export function oneReact(): boolean {
  const build = current();
  return probed(one, build, () => ownStatic(() => hooksRunIn(build)));
}

/** Whether react-dom renders here at all: markup with no component (with React Server Components' React, it can't). */
const renders = new Map<Build, boolean>();
export function reactDomRenders(): boolean {
  const build = current();
  return probed(renders, build, () => {
    try {
      ownStatic(() => build.renderToStaticMarkup(createElement("i")));
      return true;
    } catch (error) {
      if (outOfStack(error)) throw error;
      return false;
    }
  });
}

/** What a render that react-dom failed to start or finish (not a part of the template) fails with: said by name where it's one of the above. */
export function renderFailure(error: unknown, name: string): RenderError | undefined {
  if (isServerReact() || !reactDomRenders()) return new RenderError(SERVER_REACT, name, "", error);
  if (!oneReact()) return new RenderError(REACT_COPIES, name, "", error);
  return undefined;
}

/**
 * The components of the user's own being called by a synchronous render of Elements now, by every copy of Elements in
 * the process on this React (see per-react.ts): a render started there would start a render of react-dom's static
 * renderer inside its own, which breaks the hooks of the component that started it (and react-dom's render it's in). A
 * copy on another React renders with its own react-dom, so its renders, and the modules they render with, are its own.
 */
const CALLING = Symbol.for("@unlayer/react-elements/calling");
/**
 * `static`: how many of react-dom's static renders Elements is running now, by every copy (see ownStatic); `builds`:
 * the modules of react-dom's that Elements' renders under way render with, outermost first (see withFreeBuild and
 * renderNested); `busy`: the modules an app's render was found rendering with where the outermost of them started
 * (see withFreeBuild), which no render inside it renders with, nor asks anything.
 */
type Calling = { frame: { name: string; label: string; parent: unknown } | null; static?: number; builds?: Build[]; busy?: Build[] };
const calling = perReact<Calling>(CALLING, createElement, () => ({ frame: null }));

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

/**
 * `fn`, a static render of react-dom's that Elements runs (see `calling`), the component being called as it was after
 * it. Where it fails, where React was rendering (a lazy component's place) is given to its caller (`failed`): it's that
 * render's, never kept for another.
 */
function ownStatic<T>(fn: () => T, build?: Build, failed?: { at?: Frame }): T {
  const frame = calling.frame;
  calling.static = (calling.static ?? 0) + 1;
  try {
    return fn();
  } catch (error) {
    if (failed && calling.frame !== frame && calling.frame) failed.at = calling.frame as Frame;
    throw error;
  } finally {
    calling.static--;
    calling.frame = frame;
    // (Each of Elements' own renders that isn't inside another, whatever started it: a template wrapper's call, a lazy
    // template's root, the template's render, a sync or an async render. See settle.)
    if (build && !calling.static) settle(build);
  }
}

/** Where what React renders next in a synchronous render is (a lazy component's place): said if it starts a render. */
export function enterFrame(frame: Frame): void {
  calling.frame = frame;
}

/** The module Elements' renders render with now: react-dom/server's, or another one (see withFreeBuild). */
const current = (): Build => calling.builds?.[calling.builds.length - 1] ?? Server;

/** The same module (a bundler can wrap one in two objects). */
const same = (a: Build, b: Build) => a.renderToStaticMarkup === b.renderToStaticMarkup;

/**
 * What's known of a module of react-dom's static renderer: whether this React's hooks run in its renders (`ownHooks`),
 * and the function its `useTransition` gives (`start`: one per module, so a hook that gives it reached that module).
 */
interface Known {
  ownHooks?: boolean;
  start?: unknown;
}
const known = new Map<Build, Known>();
const knownOf = (build: Build): Known => known.get(build) ?? (known.set(build, {}), known.get(build)!);

/** `fn`, with React's development warnings kept off (a hook called where it can't be, below). */
function quietly<T>(fn: () => T): T {
  const error = console.error;
  console.error = () => {};
  try {
    return fn();
  } finally {
    console.error = error;
  }
}

/**
 * What a hook meets, called in a class component (which keeps no hook state) that `build` renders: `useTransition`,
 * which keeps none either and changes nothing in react-dom's server renderers. Where this React's hooks run in that
 * module's renders, it fails ("Invalid hook call") while that renderer calls no function component, and gives that
 * module's `start` where it calls one: its render changes no hook state of a render it's inside. Where they don't (two
 * copies of React), it fails with no renderer of this React's under way (a TypeError: no dispatcher), and otherwise
 * meets that renderer.
 */
function probe(build: Build): { threw?: unknown; start?: unknown } {
  const seen: { threw?: unknown; start?: unknown } = {};
  // (React Server Components' React has no Component: none of react-dom's renders is under way there.)
  if (typeof React.Component !== "function") return { threw: new TypeError("no Component") };
  class InsideProbe extends React.Component<{ own: true }> {
    render() {
      // (React's development build constructs a component again, with no props, to say where a warning came from.)
      if (this.props?.own !== true) return null;
      try {
        seen.start = (React as unknown as { useTransition: () => [boolean, unknown] }).useTransition()[1];
      } catch (error) {
        seen.threw = error;
      }
      return null;
    }
  }
  try {
    quietly(() => build.renderToStaticMarkup(createElement(InsideProbe, { own: true })));
  } catch (error) {
    // (Where react-dom can't render, the render says why itself.)
    seen.threw ??= error;
  }
  // (Out of stack, it says nothing of the build: see probed.)
  if (outOfStack(seen.threw)) throw seen.threw;
  return seen;
}

/** `build`'s `start` (see probe), from a component it renders, while its renderer calls none: whether this React's hooks run there. */
function calibrate(build: Build, k: Known): void {
  try {
    quietly(() =>
      build.renderToStaticMarkup(
        createElement(function Calibrate(props: { own?: boolean }) {
          if (props?.own === true) k.start = (React as unknown as { useTransition: () => [boolean, unknown] }).useTransition()[1];
          return null;
        }, { own: true }),
      ),
    );
  } catch (error) {
    // Out of stack, it says nothing of the build: nothing's kept (see probed). Otherwise this React's hooks don't run
    // there (or another renderer of it is between components).
    if (outOfStack(error)) {
      k.start = undefined;
      throw error;
    }
  }
  // (A "no" where the stack had no room says nothing: see roomy.)
  if (k.start === undefined && !roomy()) throw outOfRoom();
  k.ownHooks = k.start !== undefined;
}

/**
 * Whether `build`'s static renderer is calling a function component now ("busy": an app's `renderToString` with it),
 * isn't ("free"), or can't be told ("unknown": a hook met a renderer calling a component, before `build`'s `start` was
 * known). Its module keeps the hook state of the component it's calling, so a render started there with it (a page's
 * `useMemo(() => renderToJson(email))`) would leave that component's hooks broken (React's own `Cannot set properties
 * of null`). Where this React's hooks never run in its renders (two copies of React), it's "free": nothing can be told,
 * and Elements renders with it as before.
 */
function stateOf(build: Build): "free" | "busy" | "unknown" {
  const k = knownOf(build);
  if (k.ownHooks === false) return "free";
  const seen = probe(build);
  if ("threw" in seen) {
    // (Where the stack had no room, what it threw says nothing: see roomy.)
    if (!roomy()) throw outOfRoom();
    if (seen.threw instanceof TypeError) k.ownHooks = false;
    else if (k.start === undefined) calibrate(build, k);
    return "free";
  }
  if (k.start === undefined) return "unknown";
  return seen.start === k.start ? "busy" : "free";
}

declare const module: { require(id: string): unknown } | undefined;
/** Whether this is the CommonJS build (set when it's built; undefined in the sources). */
declare const __UNLAYER_CJS__: boolean | undefined;

/**
 * The other modules of react-dom's static renderer than react-dom/server's, found the first time one's needed, as 0.2.1
 * found one: with a synchronous `require`, the one CommonJS loads this module with (Jest's registry gives the test's
 * React), then Node's for a module (from this module's file, the app's script, then the folder Node started in, where
 * `react` is this React: a bundled module, a browser or an edge runtime has none). React 19's Bun build first: its
 * browser one opens a MessageChannel when it loads, which keeps Node from exiting. Which is free (and runs this React's
 * hooks) is told where a render starts, not here (see withFreeBuild). Empty where there's none.
 */
let others: Build[] | undefined;
function otherBuilds(): Build[] {
  if (others === undefined) {
    const found = searchOthers();
    // (None found where the stack had no room says nothing: it's looked for again where it's next needed, see roomy.)
    if (!found.length && !roomy()) throw outOfRoom();
    others = found;
  }
  return others;
}

/** The search otherBuilds makes (see there): each module it loads, whatever it's doing (see withFreeBuild). */
function searchOthers(): Build[] {
  const node = (globalThis as { process?: any }).process;
  const requirers = [
    // (`module`'s, read so that a bundler doesn't take it for a require of a path worked out when it runs.)
    () => {
      const own = (typeof __UNLAYER_CJS__ === "boolean" ? __UNLAYER_CJS__ : true) && typeof module === "object" ? Reflect.get(module ?? {}, "require") : undefined;
      return typeof own === "function" ? (id: string) => own.call(module, id) : undefined;
    },
    // (This module's URL as a stack names it: webpack 4 can't parse the syntax for it.)
    ...[/file:\/\/\S+?(?=:\d+:\d+)/.exec(String(new Error().stack))?.[0], node?.argv?.[1], `${node?.cwd?.()}/`].map((from) => () => {
      const required = node?.getBuiltinModule?.("module")?.createRequire(from);
      return (required?.("react") as typeof React | undefined)?.createElement === React.createElement ? (required as (id: string) => unknown) : undefined;
    }),
  ];
  const ids = ["react-dom/server.bun", ...(Number.parseInt(React.version) >= 19 ? [] : ["react-dom/server.browser"]), "react-dom/server.node"];
  const found: Build[] = [];
  for (const id of ids) {
    for (const requirer of requirers) {
      try {
        const build = requirer()?.(id) as Build | undefined;
        if (build?.renderToStaticMarkup && !same(build, Server) && !found.some((one) => same(one, build))) found.push(build);
      } catch (error) {
        // (Out of stack: see otherBuilds.) Otherwise it's not there, or it can't load here: the next one.
        if (outOfStack(error)) throw error;
      }
    }
  }
  return found;
}

/**
 * Runs `render`, one of the synchronous render functions (`api`), with a module of react-dom's static renderer that
 * isn't calling a component, and every static render it makes with that one. Started inside a component a render of
 * Elements' calls, it fails (refuseNested); inside one of Elements' own renders, it keeps the module that one renders
 * with (its components call no hooks after). Otherwise, where react-dom/server's is calling a component, or may be (an
 * app's `renderToString`), it renders with another module (see otherBuilds), as 0.2.1 did. Where there's none free,
 * it fails with a RenderError that says so where react-dom/server's is calling one (the app's render goes on as it
 * was), and renders with it where that can't be told, as 0.2.1 did (the component that started it can't call a hook
 * after it).
 */
export function withFreeBuild<T>(api: string, render: () => T): T {
  if (calling.frame) return renderNested(api, render);
  if ((calling.static ?? 0) > 0) return render();
  let build: Build = Server;
  // What's rendering, asked here only, where no render of Elements' is under way: a module an app's render is calling a
  // component with is the one whose hooks run now, and asked, it puts back what it was doing. (One asked under another
  // module's render lost its providers for good: see renderNested.)
  const busy: Build[] = [];
  const state = stateOf(Server);
  if (state !== "free") busy.push(Server);
  // Each other module too, where one may be needed or may be rendering (a renderer may be calling a component: the app's
  // page may render with one), which no render inside it may render with. (Asked here, a module is asked safely.)
  if (state !== "free" || mayRender()) {
    let free: Build | undefined;
    for (const other of otherBuilds()) {
      if (stateOf(other) !== "free") busy.push(other);
      else if (!free && knownOf(other).ownHooks) free = other;
    }
    if (state !== "free") {
      if (free) build = free;
      else if (state === "busy") {
        const error = new RenderError(insideStaticRender(api), "template", "");
        refusals.add(error);
        throw error;
      }
    }
  }
  const outer = { builds: calling.builds, busy: calling.busy };
  calling.builds = [...(outer.builds ?? []), build];
  calling.busy = busy;
  try {
    return render();
  } finally {
    calling.builds = outer.builds;
    calling.busy = outer.busy;
  }
}

/** A context of Elements' own, provided nowhere: read to tell whether a renderer is calling a component (mayRender). */
let NOWHERE: React.Context<undefined> | undefined;

/**
 * Whether a renderer of this React may be calling a component now (an app's page, a stream's): `useContext` works only
 * there, and keeps no hook state in a server's render. (React 18's development build says "Invalid hook call" where it
 * doesn't, before it throws: kept off.) Where there's a DOM, it may, untold: a client's development build counts the
 * hooks a component calls, and said their order changed on its next render. (A browser has no other module to ask.)
 */
function mayRender(): boolean {
  if ((globalThis as { document?: unknown }).document != null) return true;
  // (React Server Components' React has neither: none of react-dom's renders is under way there.)
  const { createContext, useContext } = React as Partial<typeof React>;
  if (typeof createContext !== "function" || typeof useContext !== "function") return false;
  NOWHERE ??= createContext<undefined>(undefined);
  try {
    quietly(() => useContext(NOWHERE!));
    return true;
  } catch {
    return false;
  }
}

/**
 * `render` started inside a component of the user's that a synchronous render of Elements is calling (a template that
 * works out its preview text with `renderToPlainText`): rendered as a render of its own, with a module of react-dom's
 * static renderer that isn't the one calling that component (react-dom/server's or another, see otherBuilds) and isn't
 * calling one itself, the render around it as it was after (0.2.1 rendered it; that module puts back the hooks and
 * the context values it changed). Where there's none (a bundle, a browser, an edge runtime, or a render already two
 * deep), it fails, named after the component (refuseNested).
 */
function renderNested<T>(api: string, render: () => T): T {
  // A module no render under way renders with, and that no app's render was found rendering with (see withFreeBuild):
  // free. None is asked anything here, under another module's render, where one asked lost the providers of a render
  // under way with it for good, every later render reading them (another tenant's, an app's page).
  const taken = [current(), ...(calling.builds ?? []), ...(calling.busy ?? [])];
  const free = (build: Build) => !taken.some((one) => same(one, build));
  let other = free(Server) ? Server : undefined;
  for (const build of other ? [] : otherBuilds()) {
    if (!free(build)) continue;
    // (One not asked yet is asked here, where no render has it: it's free, and asking it puts nothing out.)
    if (knownOf(build).ownHooks === undefined) stateOf(build);
    if (knownOf(build).ownHooks) {
      other = build;
      break;
    }
  }
  if (!other) refuseNested(api);
  const outer = { frame: calling.frame, static: calling.static, builds: calling.builds };
  calling.frame = null;
  calling.static = 0;
  calling.builds = [...(outer.builds ?? []), other!];
  try {
    return render();
  } finally {
    calling.frame = outer.frame;
    calling.static = outer.static;
    calling.builds = outer.builds;
  }
}

/**
 * React can leave a template's providers pushed in the module that rendered it (a <Suspense> whose fallback rendered,
 * a part that suspended and was left out), and every module of react-dom's server renderers reads a context's value
 * from the one place: until that module renders again, the next render of any (Elements', the app's) reads the
 * template's value. A render of nothing on it pops them (its render starts from no provider).
 */
function settle(build: Build): void {
  try {
    build.renderToStaticMarkup(createElement("i"));
  } catch {
    // (Where react-dom can't render, nothing was left.)
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
