/**
 * The collecting render: react-dom/server renders the template (react-dom.ts), and this module prepares the element
 * tree it renders. Each element the template gives (the root's content, and what each of the
 * user's components returns) is prepared before React renders it:
 *
 * - Elements' Rows, Columns, blocks, <Tailwind> scopes and <Head>/<Font> entries are asked of the collector
 *   (utils/record.tsx) and replaced by a marker element (`<unlayer-mark>`, numbered, with the render's nonce) around
 *   what's inside them; boundaries (a component of the template's own in a list) are markers too.
 * - A function component is rendered by `Call`, a component at its place in the tree that calls it (so its hooks are
 *   React's own, its `useId()`s React's), catches what it throws (a marker standing for the error, named and placed),
 *   and prepares what it returns.
 * - A class component is a subclass whose render does the same.
 *
 * The HTML React writes is parsed back into the content's parts (parse.ts), flattened in tree order (output.ts).
 * Nothing here reads or writes React's internals; what's read of React's elements is their public shape (`type`,
 * `props`, `key`, the `$$typeof` of a memo, forwardRef, context, lazy or Suspense, a memo's `type`, a forwardRef's
 * `render`, and React 18's element `ref`).
 */
import React from "react";
import { ASYNC_IN_SYNC, childFrame, nameOf, placeFrame, positionOf, RenderError, threw, type Frame } from "./errors";
import { isWalkerNode, recordNode, type BoundaryNode, type RecordNode } from "./records";
import { isCustom, validateHost } from "./host";
import { unrun } from "./attributes";
import { REACT_18 } from "./react-compat";
import { sharing, type Shared } from "./shared";
import { checkKeys } from "./keys";
import { asOwnCall, asUserCall, enterFrame, isRefusal, isServerReact, isThenable, oneReact, otherReactsHook, REACT_COPIES, staticMarkup, streamedMarkup, suspendedInReact, suspends, TEMPLATE_REACT } from "./react-dom";
import { COLLECTING, ROUTED, Stamp } from "./root-capture";
import { parse, placeholderOf } from "./parse";
import { flatten, htmlOf, PENDING, type Item, type Part } from "./output";
import { handled, track } from "./capture";
import { isLinkType } from "../components/Link";

export const MARK = "unlayer-mark";

const PORTAL = Symbol.for("react.portal");
const FRAGMENT = Symbol.for("react.fragment");
const SUSPENSE = Symbol.for("react.suspense");
const PROVIDER = Symbol.for("react.provider");
const CONTEXT = Symbol.for("react.context");
const CONSUMER = Symbol.for("react.consumer");
const FORWARD_REF = Symbol.for("react.forward_ref");
const MEMO = Symbol.for("react.memo");
const LAZY = Symbol.for("react.lazy");
const CLIENT_REF = Symbol.for("react.client.reference");
const ACTIVITY = Symbol.for("react.activity");
/** What another major of React marks its elements with (React 18's `react.element`, 19's `react.transitional.element`). */
const OTHER_ELEMENT = Symbol.for(REACT_18 ? "react.transitional.element" : "react.element");
const PASSTHROUGH = new Set<unknown>([FRAGMENT, Symbol.for("react.strict_mode"), Symbol.for("react.profiler"), Symbol.for("react.suspense_list"), Symbol.for("react.view_transition"), Symbol.for("react.legacy_hidden"), Symbol.for("react.scope")]);

/** Whether an element type renders its children on a server (template wrappers: see utils/unwrap-root.ts). */
export const passesThrough = (type: unknown, props: { mode?: unknown }): boolean => PASSTHROUGH.has(type) || type === SUSPENSE || (type === ACTIVITY && props.mode !== "hidden");

/** What a collecting render walks for an element instead of calling it (its record), and the name it's at. */
export interface Recorded {
  name?: string;
  record(position: () => string): React.ReactNode;
}
export type Collector = (element: React.ReactElement) => Recorded | undefined;

/** What each marker stands for, by its number, and the part of the tree it's in (its `scope`: see Collection's scopes). */
export type Mark = (
  | { k: "r"; record: object; quiet?: boolean }
  | { k: "b"; record: object | null }
  | { k: "f"; error: unknown; fatal: boolean }
  /** A boundary's Suspense fallback: what's in it suspended (or failed, React silent) in a synchronous render. */
  | { k: "s"; boundary: number }
  /** A <Suspense> of the template's own: its fallback, where React rendered it (see parse.ts's fallbackFailed). */
  | { k: "fb"; frame: Frame }
  /**
   * What a <Head>'s <style>, <script> or <title> holds on React 19, which renders no component or markup in one: rendered
   * here, where it is, for the element's HTML given whole (`raw`'s `from`): its text read as written (`unescape`),
   * and what's in it whose content runs to its end tag (`ends`). See prepHost.
   */
  | { k: "t"; unescape: boolean; ends: readonly string[] }
) & { scope?: number };

export interface Collection {
  nonce: string;
  collector?: Collector;
  passes?: (error: unknown) => boolean;
  frameless?: (type: unknown) => boolean;
  /** Elements' own components (a root met in the content), which can start a render of their own (see react-dom.ts's `calling`). */
  own?: (type: unknown) => boolean;
  omit: boolean;
  /** An async render's: React waits for what suspends (async components are called once, their promises kept). */
  async: boolean;
  marks: Mark[];
  made: WeakSet<object>;
  fatal: WeakSet<object>;
  /** Components that suspended, in the order React called them, with the boundary they're in and whether a Suspense of the template's was around them. */
  suspended: Array<{ name: string; frame: Frame; boundary: number; inSuspense: boolean; suspenseAt?: number }>;
  /**
   * The lazy components it renders (see prepLazy): where each is, said where one suspends in a synchronous render;
   * `done`, what it renders rendered with no error (it suspended, or rendered: see LazyDone).
   */
  lazies: Array<{ frame: Frame; boundary: number; suspenseAt?: number; done?: boolean }>;
  /** In an async render, what React handled itself (in a <Suspense>, that it rendered the fallback of), in order. */
  reactErrors: Array<{ error: unknown; name?: string }>;
  /** An async component's promise, by its props (React calls Call again once it settles). */
  pending: WeakMap<object, Tracked>;
  /** What the render's components share, while each is called. */
  shared: Shared;
  /**
   * An async render's places in tree order (see Order), how many each has given what's in it, those waiting, and the
   * errors found, which `changed` is told of: a render that fails fails with the first error in tree order without
   * waiting for what comes after it (collectAsync).
   */
  counts: WeakMap<Order, number>;
  waiting: Set<Order>;
  errors: Array<{ at: Order; error: unknown }>;
  changed?: () => void;
  /**
   * The markers react-dom rendered (by `Marker`, see below), and those the parse read: only one of these is a marker,
   * read once (parse.ts). HTML given whole, kept out of react-dom's output (`raw`: an element's, or `markup`, what a
   * lazy component rendered), and those the parse swapped back.
   */
  rendered: Set<number>;
  read: Set<number>;
  /**
   * HTML given whole (`text`: a <style>'s or <script>'s, its whole text), the part of the tree it's in, those rendered;
   * `from`: what a marker of a <Head>'s text holds instead (see prepHost), read into `texts` by the parse.
   */
  raw: Array<{ html: string; text?: boolean; scope: number; from?: number }>;
  texts: Map<number, Part[]>;
  rawRendered: Set<number>;
  rawRead: Set<number>;
  /**
   * The parts of the tree React leaves out where it renders a <Suspense>'s fallback (of the template's, or a boundary's
   * own), or where it doesn't (`fallback`: the fallback's own), each with the one it's in (-1: none) and the fallback's
   * marker. Where that marker is in what React wrote (or, for a fallback's own, isn't), nothing in the part is: a
   * marker or placeholder of one there isn't React's (parse.ts's `kept`).
   */
  scopes: Array<{ parent: number; marker: number; fallback?: boolean }>;
  /** What failed in a <style>'s or <script>'s text (no marker there), by the boundary it's in; the boundaries' parts. */
  rawErrors: Array<{ error: unknown; fatal: boolean; boundary: number }>;
  boundaryParts: Map<number, Part[]>;
}

interface Ctx {
  frame: Frame;
  /** The Suspenses of the template's own around this place; the innermost's fallback marker. */
  suspense: number;
  suspenseAt?: number;
  /** The boundary marker this place is in (-1: none). */
  boundary: number;
  /** A boundary's own element, whose return value its record keeps (src/model/elements.ts's keptMarkup). */
  watch: { element: unknown; record: Record<string, any> } | null;
  /** In a <style>'s or <script>'s text (whole, never read for markers: none is put there); in a <Head>'s tags. */
  raw?: boolean;
  head?: boolean;
  /** In a <Head>, under an <svg> or <math>: a <style>'s or <script>'s text is escaped as any text there (host.ts). */
  foreign?: boolean;
  /** In a <Head>, the elements around it whose content runs to their end tag (host.ts's headFormat). */
  ends?: readonly string[];
  /** The part of the tree React leaves out where it renders a fallback that this place is in (Collection's scopes). */
  scope?: number;
  /** In an async render, the place in tree order of the component this place is what it returned (see Order). */
  order?: Order;
  /** In a <Head>'s text (see headText): nothing in it is recorded. */
  text?: boolean;
  /**
   * The components of the template's own (their boundaries' records) whose markup this place's is, up to the nearest
   * Row, Column or block: where a <Link> renders, each is said to hold one (`link`), so its markup is cleaned as a
   * Link's (src/model/elements.ts), however many components of the user's own are between them.
   */
  links?: ReadonlyArray<Record<string, any>>;
}

type Tracked = PromiseLike<unknown> & { status?: "pending" | "fulfilled" | "rejected"; value?: unknown; reason?: unknown };

/**
 * A place in an async render's tree order: the places of the components (and failed markup) it's in, outermost first,
 * each numbered among those its component returned, as they were prepared (the tree's order, however late React calls
 * them: what an async component returns is before what's after it). Compared item by item, a place before what's in it.
 */
export type Order = readonly number[];
const TOP: Order = [];
/** Whether `a` is before `b` in tree order. */
export function before(a: Order, b: Order): boolean {
  for (let i = 0; i < a.length && i < b.length; i++) if (a[i] !== b[i]) return a[i] < b[i];
  return a.length < b.length;
}

/**
 * The renders' numbers, for every copy of Elements in the process (by Symbol.for): each render's markers carry its own
 * (its `nonce`), so a render started inside another (a root's content) has markers of its own. A count, not a random
 * number: a render's output depends only on its arguments (ARCHITECTURE.md, invariant 8), and the markers never reach
 * it. Text React writes can't be a marker (it's escaped), and HTML given whole (`dangerouslySetInnerHTML`) is taken
 * whole, between the render's own comments, whatever it holds.
 */
// (Not 0.2's `…/renders`, where it keeps a number: another copy's slot is only taken where it's this shape.)
const COUNT = Symbol.for("@unlayer/react-elements/render-count");
const renders: { n: number } = (() => {
  const global = globalThis as Record<symbol, unknown>;
  const found = global[COUNT] as { n?: unknown } | undefined;
  if (typeof found === "object" && found !== null && typeof found.n === "number") return found as { n: number };
  const own = { n: 0 };
  if (found === undefined) global[COUNT] = own;
  return own;
})();

export function newCollection(options: { collector?: Collector; passes?: (error: unknown) => boolean; frameless?: (type: unknown) => boolean; own?: (type: unknown) => boolean; omit: boolean; async?: boolean; shared: Shared }): Collection {
  renders.n = ((Number.isSafeInteger(renders.n) ? renders.n : 0) + 1) % Number.MAX_SAFE_INTEGER;
  return {
    nonce: `r${renders.n.toString(36)}`,
    collector: options.collector,
    passes: options.passes,
    frameless: options.frameless,
    own: options.own,
    omit: options.omit,
    async: !!options.async,
    marks: [],
    made: new WeakSet(),
    fatal: new WeakSet(),
    suspended: [],
    lazies: [],
    reactErrors: [],
    pending: new WeakMap(),
    shared: options.shared,
    counts: new WeakMap(),
    waiting: new Set(),
    errors: [],
    rendered: new Set(),
    read: new Set(),
    raw: [],
    texts: new Map(),
    rawRendered: new Set(),
    rawRead: new Set(),
    scopes: [],
    rawErrors: [],
    boundaryParts: new Map(),
  };
}

export const rootCtx = (frame: Frame): Ctx => ({ frame, suspense: 0, boundary: -1, watch: null });

/**
 * `element` given HTML whole (`props` with it), kept by the collection: react-dom writes a placeholder in its place (a
 * comment, which the parse swaps back: parse.ts), said rendered as a marker is (RawRendered). So nothing the template
 * gives as HTML is read for a marker, and the parse takes no placeholder React didn't write.
 */
function withRaw(c: Collection, ctx: Ctx, element: React.ReactElement, props: object, html: string, text = false): React.ReactElement {
  const n = c.raw.push({ html, text, scope: ctx.scope ?? -1 }) - 1;
  const own = React.cloneElement(element, { ...props, dangerouslySetInnerHTML: { __html: placeholderOf(c.nonce, n) } } as object);
  return React.createElement(RawRendered, { key: element.key ?? undefined, c, n }, own);
}

function RawRendered({ c, n, children }: { c: Collection; n: number; children?: React.ReactNode }): React.ReactNode {
  // (React's development build calls a component again, with no props, to say where a warning came from.)
  if (c) c.rawRendered.add(n);
  return children ?? null;
}

/**
 * A part of the tree React leaves out where it renders the fallback whose marker is `marker` (or, `fallback`: the
 * fallback's own, where it doesn't), inside ctx's.
 */
const newScope = (c: Collection, ctx: Ctx, marker: number, fallback?: boolean): number => c.scopes.push({ parent: ctx.scope ?? -1, marker, fallback }) - 1;

/**
 * A marker as react-dom renders it, said rendered as it does (`rendered`): the parse reads no marker that wasn't. (A
 * component, which no `useId()` of the template's sees: it moves no place in the tree.)
 */
function Marker({ c, n, children }: { c: Collection; n: number; children?: React.ReactNode }): React.ReactElement {
  if (c) c.rendered.add(n);
  return React.createElement(MARK, { "data-n": c.nonce, "data-i": n }, children);
}
const withMark = (c: Collection, n: number, children?: React.ReactNode, key?: React.Key | null): React.ReactElement => React.createElement(Marker, { key: key ?? undefined, c, n, children });
const marker = (c: Collection, mark: Mark, children?: React.ReactNode, key?: React.Key | null): React.ReactElement => withMark(c, c.marks.push(mark) - 1, children, key);

/** Whether a component threw to suspend, in this collection's renderer (see react-dom.ts's `suspends`). */
const suspended = (c: Collection, thrown: unknown): boolean => suspends(thrown, c.async);

const settle = (thenable: PromiseLike<unknown>) => void thenable.then(undefined, () => {});

/** `error`, thrown in `name` at `frame`, as the RenderError that says so (one this render made already stays as it is). */
export function positioned(c: Collection, error: unknown, name: string, frame: Frame): unknown {
  if ((error instanceof RenderError && c.made.has(error)) || c.passes?.(error)) return error;
  const made = new RenderError(threw(error), name, positionOf(frame), error);
  c.made.add(made);
  return made;
}

/** Where a part failed: a marker standing for its error, or in a <style>'s or <script>'s text (`ctx.raw`), nothing, the error kept by the boundary it's in. */
function failedPart(c: Collection, error: unknown, fatal: boolean, ctx?: Ctx): React.ReactElement | null {
  if (!ctx?.raw) return marker(c, { k: "f", error, fatal, scope: ctx?.scope });
  c.rawErrors.push({ error, fatal, boundary: ctx.boundary });
  return null;
}

/** `called`: what the component threw as it was called (synchronously, in its call: see otherReactsHook). */
function errorMark(c: Collection, error: unknown, name: string, frame: Frame, ctx?: Ctx, called = false): React.ReactElement | null {
  // (A render the component started, refused: the render fails with it as it is.)
  if (isRefusal(error)) return failedPart(c, error, true, ctx);
  // (A component's hooks fail where react-dom renders with another copy of React: said so, whatever the component threw.)
  if (!(error instanceof RenderError) && !c.passes?.(error) && !isServerReact() && !oneReact()) return fatalMark(c, REACT_COPIES, frame, error, ctx);
  // (Or the template's own components call another copy's: said so too.)
  if (otherReactsHook(error, called)) return fatalMark(c, TEMPLATE_REACT, frame, error, ctx);
  const made = positioned(c, error, name, frame);
  return failedPart(c, made, c.fatal.has(made as object) || !(made instanceof RenderError), ctx);
}

function fatalMark(c: Collection, message: string, frame: Frame, cause?: unknown, ctx?: Ctx): React.ReactElement | null {
  const made = new RenderError(message, frame.name || "template", positionOf(frame), cause);
  c.made.add(made);
  c.fatal.add(made);
  return failedPart(c, made, true, ctx);
}

/** What failed in a <style>'s or <script>'s text, put in the boundary it's in (or the content's top), after the parse. */
export function withRawErrors(c: Collection, parts: Part[]): Part[] {
  for (const { error, fatal, boundary } of c.rawErrors) (c.boundaryParts.get(boundary) ?? parts).push({ t: "error", error: error as RenderError, fatal });
  return parts;
}

/** A list's element with a key (React's warning for a list without keys is for the template's own lists, which React checked as they were made). */
const keyed = (node: React.ReactNode, i: number): React.ReactNode => (React.isValidElement(node) && node.key == null ? React.cloneElement(node, { key: `.${i}` }) : node);

/** A node of the template, prepared for React to render (see above). */
export function prep(node: unknown, c: Collection, ctx: Ctx, given = false): React.ReactNode {
  if (node === null || node === undefined || typeof node === "boolean" || typeof node === "string" || typeof node === "number" || typeof node === "bigint") return node as React.ReactNode;
  if (typeof node === "function" || typeof node === "symbol") return null;
  if (Array.isArray(node)) {
    checkKeys(node, ctx.frame.name, given);
    return node.map((item, i) => keyed(prep(item, c, ctx, given), i));
  }
  // (A promise among it, handled at once: see capture.ts's handled. React 19 waits for it; React 18 renders none.)
  const object = handled(node) as Record<string | symbol, any>;
  if (isWalkerNode(object)) return "boundary" in object ? prepBoundary(object, c, ctx) : prepRecord(object as RecordNode, c, ctx);
  if (React.isValidElement(object)) return prepElement(object, c, ctx);
  // (In a <style>'s or <script>'s text, React writes what it writes of any other value.)
  if (ctx.raw && !isWalkerNode(object as never) && !React.isValidElement(object as never)) return object as React.ReactNode;
  if (object.$$typeof === PORTAL) return fatalMark(c, "Portals aren't supported by server rendering (React's server renderer has none either)", ctx.frame, undefined, ctx);
  // A promise: React 19 renders what it resolves to, as `use()` of it gives it (React 18 renders none: below).
  if (!REACT_18 && isThenable(object)) return React.createElement(Awaited, { thenable: object, c, ctx, at: nextOrder(c, ctx) });
  // A context: React 19 renders its value (prepared here). A lazy node: as a lazy component (prepLazy).
  if (!REACT_18 && object.$$typeof === CONTEXT) return React.createElement(ContextValue, { context: object as unknown as React.Context<unknown>, c, ctx });
  if (object.$$typeof === LAZY) return prepLazy(React.createElement(React.Fragment, null, object as React.ReactNode), c, ctx);
  // An element of another major of React's (React 19's, rendered with 18's, or the other way round): said so.
  if (object.$$typeof === OTHER_ELEMENT) return fatalMark(c, TEMPLATE_REACT, ctx.frame, undefined, ctx);
  if (object.$$typeof) return object as React.ReactNode;
  if (typeof object[Symbol.iterator] === "function") return Array.from(object as Iterable<unknown>).map((item, i) => keyed(prep(item, c, ctx), i));
  const keys = Object.prototype.toString.call(object) === "[object Object]" ? `object with keys {${Object.keys(object).join(", ")}}` : Object.prototype.toString.call(object);
  return fatalMark(c, `Objects are not valid as a React child (found: ${keys}). If you meant to render a collection of children, use an array instead`, ctx.frame, undefined, ctx);
}

function withDefaults(type: any, props: Record<string, unknown>): Record<string, unknown> {
  const defaults = type?.defaultProps;
  if (!defaults) return props;
  const out = { ...props };
  for (const key in defaults) if (out[key] === undefined) out[key] = defaults[key];
  return out;
}

const keepOf = (ctx: Ctx, element: unknown) => (ctx.watch && ctx.watch.element === element ? ctx.watch.record : undefined);

/**
 * What `React.memo` or `forwardRef` wraps, asked of the collector as itself: a memo'd Row, Column or block (or a
 * <Tailwind>, a <Head>) is that one, recorded where it is (React would call it with these props; no memo or ref
 * matters on a server). `undefined` for a component of the user's own, called as React calls it.
 */
function asWrapped(type: unknown, props: Record<string, any>, key: React.Key | null, c: Collection, ctx: Ctx): React.ReactNode | undefined {
  if (ctx.raw || !c.collector) return undefined;
  const recorded = c.collector(React.createElement(type as React.ComponentType, { ...props, key: key ?? undefined }));
  return recorded ? prepRecorded(recorded, c, ctx, key) : undefined;
}

function prepElement(element: React.ReactElement, c: Collection, ctx: Ctx, keep = keepOf(ctx, element)): React.ReactNode {
  const type = element.type as any;
  const props = element.props as Record<string, any>;
  if (typeof type === "string") return prepHost(element, c, ctx);
  // (Nothing is recorded in a <style>'s or <script>'s text: it's text, and no marker goes there.)
  const recorded = ctx.raw || ctx.text ? undefined : c.collector?.(element);
  if (recorded) return prepRecorded(recorded, c, ctx, element.key);
  const inner: Ctx = { ...ctx, watch: null };
  if (typeof type === "function") {
    if (type.$$typeof === CLIENT_REF) return fatalMark(c, clientMessage(type), ctx.frame, undefined, ctx);
    if (type.prototype?.isReactComponent) return classElement(type, props, element, c, ctx, keep);
    return callElement(type, type, props, undefined, element.key, c, ctx, keep);
  }
  if (keep) keep.output = { value: props.children };
  if (PASSTHROUGH.has(type)) return React.cloneElement(element, undefined, prep(props.children, c, inner, true));
  if (type === SUSPENSE) {
    // (Its fallback marked: where React renders it, the parse asks why. See parse.ts's fallbackFailed.)
    const at = c.marks.length;
    c.marks.push({ k: "fb", frame: placeFrame(ctx.frame, "Suspense"), scope: ctx.scope });
    const fallback = withMark(c, at, prep(props.fallback, c, { ...inner, scope: newScope(c, ctx, at, true) }, true));
    return React.cloneElement(element, { fallback }, prep(props.children, c, { ...inner, suspense: ctx.suspense + 1, suspenseAt: at, scope: newScope(c, ctx, at) }, true));
  }
  if (type === ACTIVITY) return props.mode === "hidden" ? null : React.cloneElement(element, undefined, prep(props.children, c, inner, true));
  if (type !== null && typeof type === "object") {
    switch (type.$$typeof) {
      case FORWARD_REF: {
        let ref: unknown = null;
        let own = props;
        if (REACT_18) ref = (element as { ref?: unknown }).ref ?? null;
        else if ("ref" in props) ({ ref, ...own } = props);
        return asWrapped(type.render, own, element.key, c, ctx) ?? callElement(type.render, type, own, ref, element.key, c, ctx, keep);
      }
      case MEMO: {
        const wrapped = type.type;
        const own = REACT_18 ? withDefaults(wrapped, props) : props;
        if (typeof wrapped === "function" && !wrapped.prototype?.isReactComponent) return asWrapped(wrapped, own, element.key, c, ctx) ?? callElement(wrapped, type, own, undefined, element.key, c, ctx, keep);
        // (A memo of a memo or a forwardRef: unwrapped again, the collector asked at each.)
        return prepElement(React.createElement(wrapped, { ...own, key: element.key ?? undefined }), c, ctx, keep);
      }
      case LAZY:
        return prepLazy(element, c, ctx);
      case PROVIDER:
        return React.cloneElement(element, undefined, prep(props.children, c, inner, true));
      case CONTEXT:
        // React 18: a Consumer (the context). React 19: the provider.
        if (REACT_18) return React.cloneElement(element, undefined, consumer(props.children, c, inner, keep) as React.ReactNode);
        return React.cloneElement(element, undefined, prep(props.children, c, inner, true));
      case CONSUMER:
        return React.cloneElement(element, undefined, consumer(props.children, c, inner, keep) as React.ReactNode);
      case CLIENT_REF:
        return fatalMark(c, clientMessage(type), ctx.frame, undefined, ctx);
    }
  }
  const missing = type === undefined || (typeof type === "object" && type !== null && Object.keys(type).length === 0);
  return fatalMark(
    c,
    `Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: ${type === null ? "null" : typeof type}.${missing ? " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports." : ""}`,
    ctx.frame,
    undefined,
    ctx
  );
}

const clientMessage = (type: any) =>
  `<${type.$$id ?? type.name ?? "component"}> is a Client Component ("use client"): it can't render in server code (a Server Component or route handler). Render it from a Client Component, or import it without "use client"`;

/** A Consumer's function, its result prepared (and kept, where it's a boundary's own). */
function consumer(fn: unknown, c: Collection, ctx: Ctx, keep?: Record<string, any>) {
  if (typeof fn !== "function") return fn;
  // (Its place in tree order, where it's prepared: see Order.)
  const at = nextOrder(c, ctx);
  return (value: unknown) => {
    let result: unknown;
    try {
      const call = () => sharing(c.shared, () => fn(value));
      result = handled(c.async ? call() : asUserCall(ctx.frame, call));
    } catch (caught) {
      const thrown = handled(caught);
      if (suspended(c, thrown)) throw thrown;
      return fails(c, at, errorMark(c, thrown, ctx.frame.name, ctx.frame, ctx, true));
    }
    if (keep) keep.output = { value: result };
    return prep(result, c, { ...ctx, order: at });
  };
}

const URL_PROPS = ["href", "src", "action", "formAction", "xlinkHref"];
/** The elements whose content a parser reads to their own end tag (host.ts's TO_END_TAG). */
const TO_END_TAG = new Set(["style", "script", "title", "textarea", "noscript", "noembed", "noframes", "iframe", "xmp"]);

function prepHost(element: React.ReactElement, c: Collection, ctx: Ctx): React.ReactNode {
  const type = element.type as string;
  const props = element.props as Record<string, any>;
  try {
    validateHost(type, props);
  } catch (error) {
    return fails(c, nextOrder(c, ctx), errorMark(c, error, type, placeFrame(ctx.frame, type), ctx));
  }
  // A `javascript:` URL as React 19 writes it (one that throws), with React 18 too.
  let urls: Record<string, unknown> | undefined;
  // A form's or button's action that's a function isn't written: React 19 writes a script that runs it, which an email
  // or a document can't (and which would end the markup after the template's).
  for (const key of ["action", "formAction"]) if (typeof props[key] === "function") (urls ??= {})[key] = undefined;
  if (REACT_18 && !isCustom(type, props)) {
    for (const key of type === "object" ? [...URL_PROPS, "data"] : URL_PROPS) {
      if (props[key] == null) continue;
      const value = unrun(props[key]);
      if (value !== props[key] && value !== "" + props[key]) (urls ??= {})[key] = value;
    }
  }
  const html = props.dangerouslySetInnerHTML;
  // (A <style>'s or <script>'s text, and what's in it, is taken whole: HTML given whole there stays where it is.)
  // (A parser reads a tag's name in any case: `<STYLE>` is a <style>.)
  // (As React names it: React writes a `<STYLE>`'s children as any element's.)
  const textOnly = type === "style" || type === "script";
  // A <style>'s or <script>'s HTML (JSON-LD, CSS from data): its whole text, kept out of react-dom's output as any
  // HTML given whole, so nothing in it (a `<!--`, an end tag) is read as the template's markup.
  // (In what React 18 writes in one, an element's HTML too: the parse reads that as markup.)
  if (html != null && html.__html != null && (!ctx.raw || REACT_18) && (textOnly || ctx.raw)) return withRaw(c, ctx, element, { ...urls }, "" + html.__html, textOnly);
  if (html != null && html.__html != null && !ctx.raw && !textOnly) {
    // (React writes a newline before a <pre>'s or <listing>'s HTML that starts with one, which a parser drops.)
    const lead = (type === "pre" || type === "listing") && typeof html.__html === "string" && html.__html[0] === "\n" ? "\n" : "";
    return withRaw(c, ctx, element, { ...urls }, lead + html.__html);
  }
  const children = props.children;
  const lower = type.toLowerCase();
  const foreign = !!ctx.foreign || (!!ctx.head && (lower === "svg" || lower === "math"));
  const ends = ctx.head && !foreign && TO_END_TAG.has(lower) ? [...(ctx.ends ?? []), lower] : ctx.ends;
  const inner: Ctx = { ...ctx, watch: null, foreign: foreign || undefined, ends };
  if (textOnly) {
    // Its text, taken whole by the parse: no marker is put in it (`raw`). In a <Head> on React 19, which writes it as
    // given and writes no component, list or markup in it, what's in it is rendered where it is (headText).
    const given = children != null && typeof children !== "boolean" && (typeof children === "object" || (!!inner.foreign && typeof children === "string"));
    if (!ctx.head || REACT_18 || !given) return React.cloneElement(element, urls as object, prep(children, c, { ...inner, raw: true }, true));
    return headText(c, ctx, inner, element, urls, children, true);
  }
  // A <Head>'s <title> on React 19, which writes no component or markup in it: the same, its HTML as a <Head>'s markup.
  if (type === "title" && ctx.head && !REACT_18 && children != null && typeof children === "object") {
    return headText(c, ctx, { ...inner, ends: inner.ends ?? ["title"] }, element, urls, children, false);
  }
  if (ctx.raw) return React.cloneElement(element, urls as object, prep(children, c, inner, true));
  if (children === undefined || children === null || typeof children !== "object") return urls ? React.cloneElement(element, urls as object) : element;
  return React.cloneElement(element, urls as object, prep(children, c, inner, true));
}

function prepRecorded(recorded: Recorded, c: Collection, ctx: Ctx, key: React.Key | null): React.ReactNode {
  const frame = recorded.name ? childFrame(ctx.frame, recorded.name) : ctx.frame;
  let nodes: React.ReactNode;
  try {
    nodes = recorded.record(() => positionOf(frame));
  } catch (error) {
    return fails(c, nextOrder(c, ctx), errorMark(c, error, frame.name, frame, ctx));
  }
  const out = prep(nodes, c, { ...ctx, frame, watch: null });
  return key == null || !React.isValidElement(out) ? out : React.cloneElement(out, { key });
}

/** A record: what's inside it, in the middle of a list of three (its two ends and it), where its content's ids always were. */
function prepRecord(node: RecordNode, c: Collection, ctx: Ctx): React.ReactNode {
  // (What's in a Row, Column or block is its own: a <Tailwind>'s is where it is, see Ctx's links.)
  const links = (node.record as { kind?: string }).kind === "tailwind" ? ctx.links : undefined;
  if (ctx.raw) return node.children === undefined ? null : prep(node.children, c, { ...ctx, watch: null, links });
  const children = node.children === undefined ? undefined : [null, keyed(prep(node.children, c, { ...ctx, watch: null, head: ctx.head || node.quiet, links }), 1), null];
  return marker(c, { k: "r", record: node.record, quiet: node.quiet, scope: ctx.scope }, children);
}

/**
 * A part left out when it fails: a marker around it; in a render that leaves parts out, a Suspense whose fallback says
 * it suspended (a synchronous render) or failed where React handled it itself (see parse.ts).
 */
function prepBoundary(node: BoundaryNode, c: Collection, ctx: Ctx): React.ReactNode {
  if (ctx.raw) return prep(node.child, c, ctx);
  const at = c.marks.length;
  c.marks.push({ k: "b", record: node.boundary });
  // (In a Suspense of its own: its fallback's marker made first, so what's in it is a part React leaves out there.)
  const fallback = c.omit && ctx.suspense === 0 ? marker(c, { k: "s", boundary: at, scope: ctx.scope }) : undefined;
  const scope = fallback ? newScope(c, ctx, (fallback.props as { n: number }).n) : ctx.scope;
  c.marks[at].scope = scope;
  const links = node.boundary ? [...(ctx.links ?? []), node.boundary as Record<string, any>] : ctx.links;
  const inner: Ctx = { ...ctx, boundary: at, watch: node.boundary ? { element: node.child, record: node.boundary as Record<string, any> } : null, scope, links };
  const child = prep(node.child, c, inner);
  const element = withMark(c, at, child);
  return fallback ? React.createElement(React.Suspense, { fallback }, element) : element;
}

// ── Components ──

interface CallProps {
  /** Its place in tree order (an async render's: see Order), given where it's prepared. */
  at: Order;
  fn: (props: any, second?: unknown) => unknown;
  props: Record<string, any>;
  second: unknown;
  name: string;
  frame: Frame;
  keep?: Record<string, any>;
  c: Collection;
  ctx: Ctx;
  own?: boolean;
}

/** In an async render, what a component at `at` (its place in tree order) waits for, or the error it failed with, said. */
function waits(c: Collection, at: Order): void {
  if (!c.async) return;
  c.waiting.add(at);
  c.changed?.();
}
/** In an async render, the next place in tree order in what ctx's component returned (none in a synchronous one). */
function nextOrder(c: Collection, ctx: Ctx): Order {
  if (!c.async) return TOP;
  const parent = ctx.order ?? TOP;
  const n = (c.counts.get(parent) ?? 0) + 1;
  c.counts.set(parent, n);
  return [...parent, n];
}

function fails(c: Collection, at: Order, mark: React.ReactElement | null): React.ReactElement | null {
  if (c.async && mark) {
    c.errors.push({ at, error: (c.marks[(mark.props as { n: number }).n] as { error: unknown }).error });
    c.changed?.();
  }
  return mark;
}

function Call(placed: CallProps): React.ReactNode {
  const { at, fn, props, second, name, frame, keep, c, ctx, own } = placed;
  let result: unknown;
  // (Its promise kept by this placement's own props (Call's), not the user's: one element placed twice is called in
  // each place.)
  if (c.async) c.waiting.delete(at);
  const pending = c.pending.get(placed);
  if (pending) result = pending;
  else {
    try {
      // (A render the user's code starts here would start react-dom's inside its own: said by name, see react-dom.ts.)
      const call = () => sharing(c.shared, () => fn(props, second));
      // (Its promise handled at once: see capture.ts's handled.)
      result = handled(own ? asOwnCall(call) : c.async ? call() : asUserCall(frame, call));
    } catch (caught) {
      const thrown = handled(caught);
      // A promise it throws again once it has rejected: what it rejected with, as `use()` of it fails.
      if (isThenable(thrown)) {
        const promise = thrown as Tracked;
        track(promise);
        if (promise.status === "rejected") return fails(c, at, errorMark(c, promise.reason, name, frame, ctx));
      }
      if (suspended(c, thrown)) {
        c.suspended.push({ name, frame, boundary: ctx.boundary, inSuspense: ctx.suspense > 0, suspenseAt: ctx.suspenseAt });
        waits(c, at);
        throw thrown;
      }
      return fails(c, at, errorMark(c, thrown, name, frame, ctx, true));
    }
  }
  if (isThenable(result)) {
    // An async component: what its promise resolves to (it isn't called again).
    if (!c.async) {
      settle(result);
      c.suspended.push({ name, frame, boundary: ctx.boundary, inSuspense: ctx.suspense > 0, suspenseAt: ctx.suspenseAt });
      throw result;
    }
    c.pending.set(placed, result);
    const promise = result as Tracked;
    track(promise);
    if (promise.status === "rejected") return fails(c, at, errorMark(c, promise.reason, name, frame, ctx));
    if (promise.status !== "fulfilled") {
      waits(c, at);
      throw promise;
    }
    result = promise.value;
  }
  if (keep) keep.output = { value: result };
  return prep(result, c, { ...ctx, frame, watch: null, order: at });
}

/** Call, named as the component it calls (React's warnings name it so). */
const calls = new Map<string, React.FC<CallProps>>();
function callFor(name: string): React.FC<CallProps> {
  let type = calls.get(name);
  if (!type) {
    type = (props: CallProps) => Call(props) as React.ReactElement;
    type.displayName = name;
    if (calls.size < 1000) calls.set(name, type);
  }
  return type;
}

function callElement(fn: any, named: unknown, props: Record<string, any>, second: unknown, key: React.Key | null, c: Collection, ctx: Ctx, keep?: Record<string, any>): React.ReactElement {
  // A <Link> (itself, memo'd or forwardRef'd to): the components whose markup it's in hold one.
  if (isLinkType(fn)) for (const record of ctx.links ?? []) record.link = true;
  // (One of Elements' that gives itself to the collection in what a lazy component renders: called as it is, `_own`.)
  if (fn?.[ROUTED]) props = { ...props, _own: true };
  const name = nameOf(named);
  const frame = c.frameless?.(named) ? ctx.frame : childFrame(ctx.frame, name);
  if (!c.async && fn?.[Symbol.toStringTag] === "AsyncFunction") {
    // Not called when nothing can wait for it: what suspends in a synchronous render.
    c.suspended.push({ name, frame, boundary: ctx.boundary, inSuspense: ctx.suspense > 0, suspenseAt: ctx.suspenseAt });
    return React.createElement(Suspends, { key: key ?? undefined });
  }
  return React.createElement(callFor(name), { key: key ?? undefined, at: nextOrder(c, ctx), fn, props, second, name, frame, keep, c, ctx, own: !!c.own?.(named) });
}

/** What an async component is in a synchronous render: a component that suspends (React renders the nearest fallback, or fails). */
const NEVER: PromiseLike<never> = { then: () => NEVER } as PromiseLike<never>;
function Suspends(): never {
  throw NEVER;
}

/** What a class's lifecycle React calls before its render threw (getDerivedStateFromProps, componentWillMount). */
const FAILED = Symbol("failed");

/** A class component as a subclass whose render catches what it throws and prepares what it returns. */
function classElement(Ctor: any, props: Record<string, any>, element: React.ReactElement, c: Collection, ctx: Ctx, keep?: Record<string, any>): React.ReactElement {
  const name = nameOf(Ctor);
  const frame = childFrame(ctx.frame, name);
  const at = nextOrder(c, ctx);
  const inner: Ctx = { ...ctx, frame, watch: null, order: at };
  /** Its render (`call`), what it throws caught and what it returns prepared; or what failed before it, said. */
  const collected = (self: { props: object; state?: unknown }, call: () => unknown): React.ReactNode => {
    const failed = (self as unknown as Record<symbol, { error: unknown } | undefined>)[FAILED] ?? (self.state as Record<symbol, { error: unknown } | undefined> | null | undefined)?.[FAILED];
    if (failed) return fails(c, at, errorMark(c, failed.error, name, frame, ctx, true));
    let result: unknown;
    try {
      // (With the render's work, as Call calls a component: see sharing.)
      const shared = () => sharing(c.shared, call);
      result = handled(c.async ? shared() : asUserCall(frame, shared));
    } catch (caught) {
      const thrown = handled(caught);
      if (suspended(c, thrown)) {
        c.suspended.push({ name, frame, boundary: ctx.boundary, inSuspense: ctx.suspense > 0, suspenseAt: ctx.suspenseAt });
        throw thrown;
      }
      return fails(c, at, errorMark(c, thrown, name, frame, ctx, true));
    }
    if (keep) keep.output = { value: result };
    return prep(result, c, inner);
  };
  class Collected extends Ctor {
    constructor(p: unknown, context: unknown) {
      let failed: unknown;
      try {
        super(p, context);
      } catch (error) {
        failed = error;
      }
      if (failed !== undefined) {
        // (Constructed as another class: React's development build, naming where it warns, constructs each class
        // component with props it can't set, and expects what that throws. Nothing of the render's.)
        if (new.target !== Collected) throw failed;
        if (suspended(c, failed)) throw failed;
        const mark = fails(c, at, errorMark(c, failed, name, frame, ctx, true));
        // (What a constructor that threw renders: its error's marker.)
        return { props: p, state: null, render: () => mark } as never;
      }
      // (A render given as a class field, `render = () => …`, is the instance's own, which hides this class's.)
      // @ts-expect-error -- super() was called: had it thrown, the constructor returned above.
      const self = this as unknown as Record<string | symbol, unknown> & { props: object; render: () => unknown };
      if (Object.prototype.hasOwnProperty.call(self, "render") && typeof self.render === "function") {
        const own = self.render;
        self.render = () => collected(self, () => own.call(self));
      }
      // What React calls before its render, which fails where it is too (React would render a <Suspense>'s fallback).
      for (const name of ["UNSAFE_componentWillMount", "componentWillMount"]) {
        const own = self[name];
        if (typeof own === "function") self[name] = () => {
          try {
            own.call(self);
          } catch (error) {
            self[FAILED] ??= { error };
          }
        };
      }
    }
    render(): React.ReactNode {
      return collected(this as unknown as { props: object }, () => super.render());
    }
  }
  if (typeof Ctor.getDerivedStateFromProps === "function") {
    (Collected as unknown as { getDerivedStateFromProps: (props: unknown, state: unknown) => unknown }).getDerivedStateFromProps = (props, state) => {
      try {
        return Ctor.getDerivedStateFromProps(props, state);
      } catch (error) {
        return { [FAILED]: { error } };
      }
    };
  }
  Object.defineProperty(Collected, "name", { value: name });
  (Collected as unknown as { displayName: string }).displayName = name;
  return React.createElement(Collected as unknown as React.ComponentType<any>, { ...props, key: element.key ?? undefined });
}

/** The error a synchronous render that suspended outside every Suspense fails with: the first component that did. */
export function suspendedError(c: Collection): RenderError | undefined {
  const first = c.suspended.find((s) => !s.inSuspense) ?? c.suspended[0];
  return first && new RenderError(ASYNC_IN_SYNC, first.name, positionOf(first.frame));
}

/**
 * A lazy component (`React.lazy`): what it loads can't be had without React's internals, so react-dom renders it where
 * it is, with the contexts around it, inside COLLECTING's provider: Elements' components React renders in it give
 * their element to the collection, which collects them where they are (see root-capture.ts's collectedHere). A
 * component of the user's own React renders there (the one it loads) is said where it is if it starts a render (the
 * lazy component's place, as a component Call calls). Where it hasn't loaded, a synchronous render says it's async,
 * where it is (`<lazy>`); an async one waits for it. HTML given whole in what React renders there isn't prepared: it's
 * in react-dom's output as written, where the parse takes no marker or placeholder React didn't write (parse.ts).
 */
function prepLazy(element: React.ReactElement, c: Collection, ctx: Ctx): React.ReactNode {
  if (ctx.raw) return element;
  const frame = placeFrame(ctx.frame, "lazy");
  const lazy = { frame, boundary: ctx.boundary, suspenseAt: ctx.suspenseAt };
  c.lazies.push(lazy);
  return React.createElement(LazyRendered, { key: element.key ?? undefined, element, c, ctx: { ...ctx, frame, watch: null, order: nextOrder(c, ctx) }, lazy });
}

/**
 * Rendered after a lazy component in a synchronous render: react-dom renders it where the lazy one rendered with no
 * error (it rendered, or suspended: react-dom goes on past it), and not where it failed, which React's static render
 * says nothing of (it renders the <Suspense>'s fallback, or fails). See parse.ts's fallbackFailed.
 */
function LazyDone({ lazy }: { lazy?: Collection["lazies"][number] }): null {
  if (lazy) lazy.done = true;
  return null;
}

function LazyRendered({ element, c, ctx, lazy }: { element: React.ReactElement; c: Collection; ctx: Ctx; lazy: Collection["lazies"][number] }): React.ReactNode {
  // (React's development build calls a component again, with no props, to say where a warning came from.)
  if (!c) return null;
  if (!c.async) enterFrame(ctx.frame);
  const unkeyed = React.cloneElement(element, { key: c.async ? null : "lazy" } as object);
  const context = COLLECTING.context();
  const rendered = c.async ? unkeyed : [unkeyed, React.createElement(LazyDone, { key: "done", lazy })];
  // (Its value this render's only: see root-capture.ts's Stamped.)
  const holder = { value: (found: React.ReactElement) => prep(found, c, ctx), start: undefined as unknown };
  return context ? React.createElement(context.Provider, { value: holder }, React.createElement(Stamp, { holder }, rendered)) : rendered;
}

/** A promise as a child (React 19): what it resolves to, prepared, as `use()` of it gives it. */
function Awaited({ thenable, c, ctx, at }: { thenable: PromiseLike<unknown>; c: Collection; ctx: Ctx; at: Order }): React.ReactNode {
  const use = (React as unknown as { use: (usable: unknown) => unknown }).use;
  let value: unknown;
  try {
    value = use(thenable);
  } catch (thrown) {
    // (Said where it is, as a component that suspends: see suspendedError.)
    if (suspended(c, thrown)) {
      c.suspended.push({ name: ctx.frame.name, frame: ctx.frame, boundary: ctx.boundary, inSuspense: ctx.suspense > 0, suspenseAt: ctx.suspenseAt });
      throw thrown;
    }
    // (What it rejected with: where it is, as a component's error. React would render a <Suspense>'s fallback for it.)
    return fails(c, at, errorMark(c, thrown, ctx.frame.name, ctx.frame, ctx));
  }
  return prep(value, c, { ...ctx, order: at });
}

/** A context as a child (React 19): its value, prepared. */
function ContextValue({ context, c, ctx }: { context: React.Context<unknown>; c: Collection; ctx: Ctx }): React.ReactNode {
  return prep(React.useContext(context), c, ctx);
}

/**
 * A <Head>'s <style>, <script> or <title> on React 19, which renders no component, list or markup in one: what's in it
 * rendered where it is (with the template's contexts, what's async in it waited for), in a marker React writes before
 * it, and the element given that as its HTML whole (`raw`'s `from`), which the parse puts back (parse.ts): a style's or
 * script's text as a browser reads what's between its tags (its text as given, its markup as written; under an <svg>
 * or <math>, escaped as any text), a title's as markup. What's in it is recorded nowhere (`text`).
 */
function headText(c: Collection, ctx: Ctx, inner: Ctx, element: React.ReactElement, props: object | undefined, children: unknown, text: boolean): React.ReactNode {
  const at = c.marks.push({ k: "t", unescape: text && !inner.foreign, ends: inner.ends ?? [], scope: ctx.scope }) - 1;
  const content = withMark(c, at, prep(children, c, { ...inner, text: true }, true), "text");
  const n = c.raw.push({ html: "", text, scope: ctx.scope ?? -1, from: at }) - 1;
  const own = React.cloneElement(element, { ...props, children: undefined, dangerouslySetInnerHTML: { __html: placeholderOf(c.nonce, n) } } as object);
  return React.createElement(React.Fragment, { key: element.key ?? undefined }, content, React.createElement(RawRendered, { key: "own", c, n }, own));
}
