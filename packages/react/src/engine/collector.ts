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
import { asOwnCall, asUserCall, isRefusal, isServerReact, isThenable, oneReact, REACT_COPIES, staticMarkup, streamedMarkup, suspendedInReact, suspends } from "./react-dom";
import { parse, placeholderOf } from "./parse";
import { flatten, htmlOf, PENDING, type Item, type Part } from "./output";
import { track } from "./capture";

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
const PASSTHROUGH = new Set<unknown>([FRAGMENT, Symbol.for("react.strict_mode"), Symbol.for("react.profiler"), Symbol.for("react.suspense_list"), Symbol.for("react.view_transition"), Symbol.for("react.legacy_hidden"), Symbol.for("react.scope")]);

/** Whether an element type renders its children on a server (template wrappers: see utils/unwrap-root.ts). */
export const passesThrough = (type: unknown, props: { mode?: unknown }): boolean => PASSTHROUGH.has(type) || type === SUSPENSE || (type === ACTIVITY && props.mode !== "hidden");

/** What a collecting render walks for an element instead of calling it (its record), and the name it's at. */
export interface Recorded {
  name?: string;
  record(position: () => string): React.ReactNode;
}
export type Collector = (element: React.ReactElement) => Recorded | undefined;

/** What each marker stands for, by its number. */
export type Mark =
  | { k: "r"; record: object; quiet?: boolean }
  | { k: "b"; record: object | null }
  | { k: "f"; error: unknown; fatal: boolean }
  /** A boundary's Suspense fallback: what's in it suspended in a synchronous render. */
  | { k: "s"; boundary: number }
  /** What a lazy component rendered: the collection's HTML number `raw`, read as markup (see prepLazy). */
  | { k: "h"; raw: number };

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
  suspended: Array<{ name: string; frame: Frame; boundary: number; inSuspense: boolean }>;
  /** An async component's promise, by its props (React calls Call again once it settles). */
  pending: WeakMap<object, Tracked>;
  /** What the render's components share, while each is called. */
  shared: Shared;
  /**
   * An async render's components by the order React first called them (the tree's order), those waiting, and the
   * errors found, which `changed` is told of: a render that fails fails with the first error in tree order without
   * waiting for what comes after it (collectAsync).
   */
  order: WeakMap<object, number>;
  calls: number;
  waiting: Set<number>;
  errors: Array<{ at: number; error: unknown }>;
  changed?: () => void;
  /**
   * The markers react-dom rendered (by `Marker`, see below), and those the parse read: only one of these is a marker,
   * read once (parse.ts). HTML given whole, kept out of react-dom's output (`raw`: an element's, or `markup`, what a
   * lazy component rendered), and those the parse swapped back.
   */
  rendered: Set<number>;
  read: Set<number>;
  raw: Array<{ html: string; markup: boolean }>;
  rawRead: Set<number>;
  /** What failed in a <style>'s or <script>'s text (no marker there), by the boundary it's in; the boundaries' parts. */
  rawErrors: Array<{ error: unknown; fatal: boolean; boundary: number }>;
  boundaryParts: Map<number, Part[]>;
  /** A <Head>'s markup rendered on its own (headHtmlOf): the elements it's in whose content runs to their end tag. */
  headEnds?: readonly string[];
}

interface Ctx {
  frame: Frame;
  /** The Suspenses of the template's own around this place. */
  suspense: number;
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
}

type Tracked = PromiseLike<unknown> & { status?: "pending" | "fulfilled" | "rejected"; value?: unknown; reason?: unknown };

/**
 * The renders' numbers, for every copy of Elements in the process (by Symbol.for): each render's markers carry its own
 * (its `nonce`), so a render started inside another (a root's content) has markers of its own. A count, not a random
 * number: a render's output depends only on its arguments (ARCHITECTURE.md, invariant 8), and the markers never reach
 * it. Text React writes can't be a marker (it's escaped), and HTML given whole (`dangerouslySetInnerHTML`) is taken
 * whole, between the render's own comments, whatever it holds.
 */
const COUNT = Symbol.for("@unlayer/react-elements/renders");
const renders = ((globalThis as Record<symbol, { n: number } | undefined>)[COUNT] ??= { n: 0 }) as { n: number };

export function newCollection(options: { collector?: Collector; passes?: (error: unknown) => boolean; frameless?: (type: unknown) => boolean; own?: (type: unknown) => boolean; omit: boolean; async?: boolean; shared: Shared }): Collection {
  renders.n = (renders.n + 1) % Number.MAX_SAFE_INTEGER;
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
    pending: new WeakMap(),
    shared: options.shared,
    order: new WeakMap(),
    calls: 0,
    waiting: new Set(),
    errors: [],
    rendered: new Set(),
    read: new Set(),
    raw: [],
    rawRead: new Set(),
    rawErrors: [],
    boundaryParts: new Map(),
  };
}

export const rootCtx = (frame: Frame): Ctx => ({ frame, suspense: 0, boundary: -1, watch: null });

/**
 * HTML given whole, kept by the collection, and the placeholder react-dom writes in its place (a comment, which the
 * parse swaps back: parse.ts). So nothing the template gives as HTML is read for a marker.
 */
function rawPlaceholder(c: Collection, html: string): string {
  return placeholderOf(c.nonce, c.raw.push({ html, markup: false }) - 1);
}

/**
 * A marker as react-dom renders it, said rendered as it does (`rendered`): the parse reads no marker that wasn't. (A
 * component, which no `useId()` of the template's sees: it moves no place in the tree.)
 */
function Marker({ c, n, children }: { c: Collection; n: number; children?: React.ReactNode }): React.ReactElement {
  c.rendered.add(n);
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
  if (!ctx?.raw) return marker(c, { k: "f", error, fatal });
  c.rawErrors.push({ error, fatal, boundary: ctx.boundary });
  return null;
}

function errorMark(c: Collection, error: unknown, name: string, frame: Frame, ctx?: Ctx): React.ReactElement | null {
  // (A render the component started, refused: the render fails with it as it is.)
  if (isRefusal(error)) return failedPart(c, error, true, ctx);
  // (A component's hooks fail where react-dom renders with another copy of React: said so, whatever the component threw.)
  if (!(error instanceof RenderError) && !c.passes?.(error) && !isServerReact() && !oneReact()) return fatalMark(c, REACT_COPIES, frame, error, ctx);
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
  const object = node as Record<string | symbol, any>;
  if (isWalkerNode(object)) return "boundary" in object ? prepBoundary(object, c, ctx) : prepRecord(object as RecordNode, c, ctx);
  if (React.isValidElement(object)) return prepElement(object, c, ctx);
  // (In a <style>'s or <script>'s text, React writes what it writes of any other value.)
  if (ctx.raw && !isWalkerNode(object as never) && !React.isValidElement(object as never)) return object as React.ReactNode;
  if (object.$$typeof === PORTAL) return fatalMark(c, "Portals aren't supported by server rendering (React's server renderer has none either)", ctx.frame, undefined, ctx);
  // A promise: React 19 renders what it resolves to, as `use()` of it gives it (React 18 renders none: below).
  if (!REACT_18 && isThenable(object)) return React.createElement(Awaited, { thenable: object, c, ctx });
  // A context: React 19 renders its value (prepared here). A lazy node: as a lazy component (prepLazy).
  if (!REACT_18 && object.$$typeof === CONTEXT) return React.createElement(ContextValue, { context: object as unknown as React.Context<unknown>, c, ctx });
  if (object.$$typeof === LAZY) return prepLazy(React.createElement(React.Fragment, null, object as React.ReactNode), c, ctx);
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

function prepElement(element: React.ReactElement, c: Collection, ctx: Ctx, keep = keepOf(ctx, element)): React.ReactNode {
  const type = element.type as any;
  const props = element.props as Record<string, any>;
  if (typeof type === "string") return prepHost(element, c, ctx);
  // (Nothing is recorded in a <style>'s or <script>'s text: it's text, and no marker goes there.)
  const recorded = ctx.raw ? undefined : c.collector?.(element);
  if (recorded) return prepRecorded(recorded, c, ctx, element.key);
  const inner: Ctx = { ...ctx, watch: null };
  if (typeof type === "function") {
    if (type.$$typeof === CLIENT_REF) return fatalMark(c, clientMessage(type), ctx.frame, undefined, ctx);
    if (type.prototype?.isReactComponent) return classElement(type, props, element, c, ctx, keep);
    return callElement(type, type, props, undefined, element.key, c, ctx, keep);
  }
  if (keep) keep.output = { value: props.children };
  if (PASSTHROUGH.has(type)) return React.cloneElement(element, undefined, prep(props.children, c, inner, true));
  if (type === SUSPENSE) return React.cloneElement(element, { fallback: prep(props.fallback, c, inner, true) }, prep(props.children, c, { ...inner, suspense: ctx.suspense + 1 }, true));
  if (type === ACTIVITY) return props.mode === "hidden" ? null : React.cloneElement(element, undefined, prep(props.children, c, inner, true));
  if (type !== null && typeof type === "object") {
    switch (type.$$typeof) {
      case FORWARD_REF: {
        let ref: unknown = null;
        let own = props;
        if (REACT_18) ref = (element as { ref?: unknown }).ref ?? null;
        else if ("ref" in props) ({ ref, ...own } = props);
        return callElement(type.render, type, own, ref, element.key, c, ctx, keep);
      }
      case MEMO: {
        const wrapped = type.type;
        const own = REACT_18 ? withDefaults(wrapped, props) : props;
        if (typeof wrapped === "function" && !wrapped.prototype?.isReactComponent) return callElement(wrapped, type, own, undefined, element.key, c, ctx, keep);
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
  return (value: unknown) => {
    let result: unknown;
    try {
      result = c.async ? fn(value) : asUserCall(ctx.frame, () => fn(value));
    } catch (thrown) {
      if (suspended(c, thrown)) throw thrown;
      return errorMark(c, thrown, ctx.frame.name, ctx.frame, ctx);
    }
    if (keep) keep.output = { value: result };
    return prep(result, c, ctx);
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
    return errorMark(c, error, type, placeFrame(ctx.frame, type), ctx);
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
  if (html != null && html.__html != null && !ctx.raw && !textOnly) {
    // (React writes a newline before a <pre>'s or <listing>'s HTML that starts with one, which a parser drops.)
    const lead = (type === "pre" || type === "listing") && typeof html.__html === "string" && html.__html[0] === "\n" ? "\n" : "";
    return React.cloneElement(element, { ...urls, dangerouslySetInnerHTML: { __html: rawPlaceholder(c, lead + html.__html) } } as object);
  }
  const children = props.children;
  const lower = type.toLowerCase();
  const foreign = !!ctx.foreign || (!!ctx.head && (lower === "svg" || lower === "math"));
  const ends = ctx.head && !foreign && TO_END_TAG.has(lower) ? [...(ctx.ends ?? []), lower] : ctx.ends;
  const inner: Ctx = { ...ctx, watch: null, foreign: foreign || undefined, ends };
  if (textOnly) {
    // Its text, taken whole by the parse: no marker is put in it (`raw`). In a <Head> on React 19, which writes it as
    // given and writes no component, list or markup in it, it's rendered here and given to React as one string: as a
    // browser reads what's between its tags (rawTextOf), or under an <svg> or <math> escaped as any text.
    const given = children != null && typeof children !== "boolean" && (typeof children === "object" || (!!inner.foreign && typeof children === "string"));
    if (!ctx.head || REACT_18 || !given) return React.cloneElement(element, urls as object, prep(children, c, { ...inner, raw: true }, true));
    let text: string;
    try {
      text = rawTextOf(children, c, !!inner.foreign, inner.ends ?? []);
    } catch (error) {
      return errorMark(c, error, type, placeFrame(ctx.frame, type), ctx);
    }
    return React.cloneElement(element, urls as object, text);
  }
  // A <Head>'s <title> on React 19, which writes no component or markup in it: what's in it rendered here, as a
  // <Head>'s markup (its style's and script's text as given), given to React as its HTML.
  if (type === "title" && ctx.head && !REACT_18 && children != null && typeof children === "object") {
    let html: string;
    try {
      html = headHtmlOf(children, c, !!inner.foreign, inner.ends ?? ["title"]);
    } catch (error) {
      return errorMark(c, error, type, placeFrame(ctx.frame, type), ctx);
    }
    return React.cloneElement(element, { ...urls, children: undefined, dangerouslySetInnerHTML: { __html: rawPlaceholder(c, html) } } as object);
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
    return errorMark(c, error, frame.name, frame, ctx);
  }
  const out = prep(nodes, c, { ...ctx, frame, watch: null });
  return key == null || !React.isValidElement(out) ? out : React.cloneElement(out, { key });
}

/** A record: what's inside it, in the middle of a list of three (its two ends and it), where its content's ids always were. */
function prepRecord(node: RecordNode, c: Collection, ctx: Ctx): React.ReactNode {
  if (ctx.raw) return node.children === undefined ? null : prep(node.children, c, { ...ctx, watch: null });
  const children = node.children === undefined ? undefined : [null, keyed(prep(node.children, c, { ...ctx, watch: null, head: ctx.head || node.quiet }), 1), null];
  return marker(c, { k: "r", record: node.record, quiet: node.quiet }, children);
}

/** A part left out when it fails: a marker around it; in a synchronous render that leaves parts out, a Suspense whose fallback says it suspended. */
function prepBoundary(node: BoundaryNode, c: Collection, ctx: Ctx): React.ReactNode {
  if (ctx.raw) return prep(node.child, c, ctx);
  const at = c.marks.length;
  const inner: Ctx = { ...ctx, boundary: at, watch: node.boundary ? { element: node.child, record: node.boundary as Record<string, any> } : null };
  c.marks.push({ k: "b", record: node.boundary });
  const child = prep(node.child, c, inner);
  const element = withMark(c, at, child);
  if (!c.omit || c.async || ctx.suspense > 0) return element;
  return React.createElement(React.Suspense, { fallback: marker(c, { k: "s", boundary: at }) }, element);
}

// ── Components ──

interface CallProps {
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

/** In an async render, what a component at `at` (its place in call order) waits for, or the error it failed with, said. */
function waits(c: Collection, at: number): void {
  if (!c.async) return;
  c.waiting.add(at);
  c.changed?.();
}
function fails(c: Collection, at: number, mark: React.ReactElement | null): React.ReactElement | null {
  if (c.async && mark) {
    c.errors.push({ at, error: (c.marks[(mark.props as { n: number }).n] as { error: unknown }).error });
    c.changed?.();
  }
  return mark;
}

function Call({ fn, props, second, name, frame, keep, c, ctx, own }: CallProps): React.ReactNode {
  let result: unknown;
  let at = 0;
  if (c.async) {
    at = c.order.get(props) ?? (c.order.set(props, ++c.calls), c.calls);
    c.waiting.delete(at);
  }
  const pending = c.pending.get(props);
  if (pending) result = pending;
  else {
    try {
      // (A render the user's code starts here would start react-dom's inside its own: said by name, see react-dom.ts.)
      const call = () => sharing(c.shared, () => fn(props, second));
      result = own ? asOwnCall(call) : c.async ? call() : asUserCall(frame, call);
    } catch (thrown) {
      // A promise it throws again once it has rejected: what it rejected with, as `use()` of it fails.
      if (isThenable(thrown)) {
        const promise = thrown as Tracked;
        track(promise);
        if (promise.status === "rejected") return fails(c, at, errorMark(c, promise.reason, name, frame, ctx));
      }
      if (suspended(c, thrown)) {
        c.suspended.push({ name, frame, boundary: ctx.boundary, inSuspense: ctx.suspense > 0 });
        waits(c, at);
        throw thrown;
      }
      return fails(c, at, errorMark(c, thrown, name, frame, ctx));
    }
  }
  if (isThenable(result)) {
    // An async component: what its promise resolves to (it isn't called again).
    if (!c.async) {
      settle(result);
      c.suspended.push({ name, frame, boundary: ctx.boundary, inSuspense: ctx.suspense > 0 });
      throw result;
    }
    c.pending.set(props, result);
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
  return prep(result, c, { ...ctx, frame, watch: null });
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
  const name = nameOf(named);
  const frame = c.frameless?.(named) ? ctx.frame : childFrame(ctx.frame, name);
  if (!c.async && fn?.[Symbol.toStringTag] === "AsyncFunction") {
    // Not called when nothing can wait for it: what suspends in a synchronous render.
    c.suspended.push({ name, frame, boundary: ctx.boundary, inSuspense: ctx.suspense > 0 });
    return React.createElement(Suspends, { key: key ?? undefined });
  }
  return React.createElement(callFor(name), { key: key ?? undefined, fn, props, second, name, frame, keep, c, ctx, own: !!c.own?.(named) });
}

/** What an async component is in a synchronous render: a component that suspends (React renders the nearest fallback, or fails). */
const NEVER: PromiseLike<never> = { then: () => NEVER } as PromiseLike<never>;
function Suspends(): never {
  throw NEVER;
}

/** A class component as a subclass whose render catches what it throws and prepares what it returns. */
function classElement(Ctor: any, props: Record<string, any>, element: React.ReactElement, c: Collection, ctx: Ctx, keep?: Record<string, any>): React.ReactElement {
  const name = nameOf(Ctor);
  const frame = childFrame(ctx.frame, name);
  const inner: Ctx = { ...ctx, frame, watch: null };
  class Collected extends Ctor {
    constructor(p: unknown, context: unknown) {
      let failed: unknown;
      try {
        super(p, context);
      } catch (error) {
        failed = error;
      }
      if (failed !== undefined) {
        if (suspended(c, failed)) throw failed;
        const mark = errorMark(c, failed, name, frame, ctx);
        // (What a constructor that threw renders: its error's marker.)
        return { props: p, state: null, render: () => mark } as never;
      }
    }
    render(): React.ReactNode {
      let result: unknown;
      try {
        result = c.async ? super.render() : asUserCall(frame, () => super.render());
      } catch (thrown) {
        if (suspended(c, thrown)) {
          c.suspended.push({ name, frame, boundary: ctx.boundary, inSuspense: ctx.suspense > 0 });
          throw thrown;
        }
        return errorMark(c, thrown, name, frame, ctx);
      }
      if (keep) keep.output = { value: result };
      return prep(result, c, inner);
    }
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
 * A lazy component (`React.lazy`): what it loads can't be had without React's internals, so react-dom renders it on its
 * own, and its HTML is kept by the collection as HTML given whole (see `rawPlaceholder`): the markup it renders, never
 * read for a marker, and nothing in it recorded (a Row in it renders as its HTML). It reads the defaults of the
 * contexts around it (ARCHITECTURE.md). Where it hasn't loaded, a synchronous render says it's async, where it is
 * (`<lazy>`); an async one waits for it.
 */
function prepLazy(element: React.ReactElement, c: Collection, ctx: Ctx): React.ReactNode {
  if (ctx.raw) return element;
  const frame = placeFrame(ctx.frame, "lazy");
  return React.createElement(LazyRendered, { key: element.key ?? undefined, element, c, frame });
}

const lazyRenders = new WeakMap<Collection, WeakMap<object, Tracked>>();

function LazyRendered({ element, c, frame }: { element: React.ReactElement; c: Collection; frame: Frame }): React.ReactNode {
  const unkeyed = React.cloneElement(element, { key: null } as object);
  if (!c.async) {
    let html: string;
    try {
      html = staticMarkup(unkeyed);
    } catch (error) {
      if (suspends(error) || suspendedInReact(error)) {
        const made = new RenderError(ASYNC_IN_SYNC, "lazy", positionOf(frame));
        c.made.add(made);
        return marker(c, { k: "f", error: made, fatal: false });
      }
      return errorMark(c, error, "lazy", frame);
    }
    return marker(c, { k: "h", raw: c.raw.push({ html, markup: true }) - 1 });
  }
  let renders = lazyRenders.get(c);
  if (!renders) lazyRenders.set(c, (renders = new WeakMap()));
  let pending = renders.get(element);
  if (!pending) {
    pending = streamedMarkup(unkeyed, undefined, (html) => html) as Tracked;
    renders.set(element, pending);
    track(pending);
  }
  if (pending.status === "rejected") return errorMark(c, pending.reason, "lazy", frame);
  if (pending.status !== "fulfilled") throw pending;
  return marker(c, { k: "h", raw: c.raw.push({ html: String(pending.value), markup: true }) - 1 });
}

/** A promise as a child (React 19): what it resolves to, prepared, as `use()` of it gives it. */
function Awaited({ thenable, c, ctx }: { thenable: PromiseLike<unknown>; c: Collection; ctx: Ctx }): React.ReactNode {
  const use = (React as unknown as { use: (usable: unknown) => unknown }).use;
  let value: unknown;
  try {
    value = use(thenable);
  } catch (thrown) {
    // (Said where it is, as a component that suspends: see suspendedError.)
    if (suspended(c, thrown)) c.suspended.push({ name: ctx.frame.name, frame: ctx.frame, boundary: ctx.boundary, inSuspense: ctx.suspense > 0 });
    throw thrown;
  }
  return prep(value, c, ctx);
}

/** A context as a child (React 19): its value, prepared. */
function ContextValue({ context, c, ctx }: { context: React.Context<unknown>; c: Collection; ctx: Ctx }): React.ReactNode {
  return prep(React.useContext(context), c, ctx);
}

/** React's text escaping, undone. */
const unescapeText = (s: string) => s.replace(/&amp;|&lt;|&gt;|&quot;|&#x27;/g, (e) => ({ "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#x27;": "'" })[e]!);

/**
 * A <style>'s or <script>'s children in a <Head> as their text, as a browser reads what's between its tags: what they
 * render (components, lists, markup), its text as given and its markup as written; under an <svg> or <math>
 * (`escaped`), its text escaped as any. Rendered by react-dom on its own, as a <Head>'s markup (headHtmlOf: the contexts
 * around it read their defaults, ARCHITECTURE.md), the template's components prepared and named as anywhere.
 */
function rawTextOf(children: unknown, c: Collection, escaped: boolean, ends: readonly string[]): string {
  const html = headHtmlOf(children, c, escaped, ends);
  if (escaped) return html;
  return html.split(/(<[^>]*>)/).map((piece, i) => (i % 2 ? piece : unescapeText(piece))).join("");
}

/** What `children` render as a <Head>'s markup (in a record of its own that's a <Head>'s: see parse.ts), as HTML. */
function headHtmlOf(children: unknown, c: Collection, foreign: boolean, ends: readonly string[] = ["title"]): string {
  const own = newCollection({ collector: undefined, passes: c.passes, frameless: c.frameless, own: c.own, omit: false, shared: c.shared });
  // (What it's in: in a <title>, its end tag is escaped in a style's or script's text there.)
  own.headEnds = ends;
  const holder: { content?: Item[] } = {};
  const html = staticMarkup(prep(recordNode(holder, children as React.ReactNode, true), own, { ...rootCtx({ name: "title", label: "title", parent: null, counts: null }), head: true, foreign }));
  if (flatten(withRawErrors(own, parse(html, own)), false) === PENDING) return "";
  return htmlOf(holder.content ?? []);
}
