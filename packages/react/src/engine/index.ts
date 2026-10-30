/**
 * The engine's entry points: a template's content collected (its Rows, Columns and blocks recorded, see
 * utils/record.tsx, as a tree of its records, markup and text) by react-dom/server, synchronously or waiting for
 * what's async in it; markup rendered (Elements' own components: the root's HTML); a template wrapper called with
 * hooks (capture.ts). React's public API only: see react-dom.ts, and ARCHITECTURE.md.
 */
import React, { cloneElement } from "react";
import { ASYNC_IN_SYNC, childFrame, nameOf, omits, positionOf, RenderError, rootFrame, threw, type OnError } from "./errors";
import { flatten, type Flat } from "./output";
import { before, newCollection, prep, rootCtx, suspendedError, withRawErrors, type Collector } from "./collector";
import { parse } from "./parse";
import { forked } from "./capture";
import { refuseNested, renderFailure, staticMarkup, streamedMarkup, streamSuspension, suspendedInReact, suspends } from "./react-dom";
import { sharedNow, sharing, type Shared } from "./shared";

export { RenderError, type OnError } from "./errors";
export { flatten, htmlOf, PENDING, type Flat, type Item, type Markup, type Cut, type Part, type RecordItem } from "./output";
export { passesThrough, type Collector, type Recorded } from "./collector";
export { callCaptured, callClassCaptured, captureLazyRoot, isStreamed, track } from "./capture";
export { sharedNow, sharing, type Shared } from "./shared";
export { withFreeBuild } from "./react-dom";

/** What the component or template wrapper being called shares with the rest of its render (see Shared). */
export const renderShared = (): Shared | undefined => sharedNow();

/** Where the content starts in the tree: how many template wrappers above it called useId() (see capture.ts). */
export type TreeContext = number;
export const ROOT_TREE: TreeContext = 0;

export interface CollectOptions {
  collector: Collector;
  onError?: OnError;
  /** The root's name (Email, Page, …): where positions start. */
  root: string;
  /** Where the content is in the tree (after the template wrappers called to reach the root). */
  tree?: TreeContext;
  /** Errors passed on as they are. */
  passes?: (error: unknown) => boolean;
  /** Components that are no place of their own in positions. */
  frameless?: (type: unknown) => boolean;
  /** Elements' own components, which can start a render of their own (a root met in the content). */
  own?: (type: unknown) => boolean;
  /** What the `useId()`s start with (React's `identifierPrefix`). */
  idPrefix?: string;
  /** What the render's components share (see Shared): the render's own, the same in each walk of it. */
  shared?: Shared;
}

/** What a collecting render that react-dom failed (not a part of the template) fails with. */
function failure(error: unknown, options: CollectOptions, frame: ReturnType<typeof rootFrame>, c?: Parameters<typeof suspendedError>[0], failedAt?: ReturnType<typeof rootFrame>): unknown {
  if (error instanceof RenderError || options.passes?.(error)) return error;
  // What suspended where nothing could wait for it: the first component that did, or the lazy one React loads. (Where
  // one did outside every <Suspense>, that's what failed the render, whatever React's error says.)
  if (c && (suspends(error) || suspendedInReact(error) || c.suspended.some((s) => !s.inSuspense))) return suspendedError(c) ?? new RenderError(ASYNC_IN_SYNC, "lazy", positionOf(c.lazies[0]?.frame ?? frame), error);
  // What React rendered itself and failed (what a lazy component renders: the component it loads, or one in what that
  // renders): where it is, as React said (its component, in a development build), at the lazy one's place.
  const at = failedAt ?? (c?.async && c.lazies.length ? c.lazies[0].frame : undefined);
  const told = c?.reactErrors.find((t) => t.error === error)?.name;
  return renderFailure(error, frame.name) ?? new RenderError(threw(error), told ?? at?.name ?? frame.name, positionOf(at ?? frame), error);
}

/** Elements' own components, which a component stack names around the user's: not what failed. */
const OWN = new Set(["Call", "Marker", "RawRendered", "LazyDone", "Stamp", "Awaited", "ContextValue", "HeadText", "Collected", "Suspense", "Lazy"]);
/**
 * The component a React error was thrown in, from the component stack react-dom gives its `onError` (a development
 * build's): the first named one inside the lazy component it's in (past its place, LazyRendered, what's named isn't
 * what failed: the lazy one is), not Elements' own, nor markup (React 19 names elements: `unlayer-mark`, `div`).
 */
function failedIn(info: unknown): string | undefined {
  const stack = (info as { componentStack?: unknown } | undefined)?.componentStack;
  if (typeof stack !== "string") return undefined;
  for (const line of stack.split("\n")) {
    // (A component with no name of its own is a line with its file only, `at file:///…`: no name.)
    const name = /^\s*(?:at|in)\s+([A-Za-z_$][\w$.-]*)(?=\s|$)/.exec(line)?.[1];
    if (name === "LazyRendered") return undefined;
    if (name && !OWN.has(name) && !/^[a-z][\w-]*$/.test(name)) return name;
  }
  return undefined;
}

/** `node` collected synchronously: what's async in it fails (or is left out, as `onError` says). */
export function collect(node: React.ReactNode, options: CollectOptions): Flat {
  refuseNested("This render");
  const c = newCollection({ collector: options.collector, passes: options.passes, frameless: options.frameless, own: options.own, omit: omits(options.onError), shared: options.shared ?? sharedNow() ?? {} });
  const frame = rootFrame(options.root);
  let html: string;
  // (Where React was rendering when it failed: this render's, see react-dom.ts's ownStatic.)
  const failed: { at?: ReturnType<typeof rootFrame> } = {};
  try {
    html = sharing(c.shared, () => staticMarkup(forked(options.tree ?? 0, prep(node, c, rootCtx(frame))), options.idPrefix, failed));
  } catch (error) {
    throw failure(error, options, frame, c, failed.at);
  }
  return flatten(withRawErrors(c, parse(html, c)), c.omit) as Flat;
}

/** `node` collected once everything in it has settled: react-dom's streaming render, waited for whole. */
export async function collectAsync(node: React.ReactNode, options: CollectOptions): Promise<Flat> {
  await streamSuspension();
  const c = newCollection({ collector: options.collector, passes: options.passes, frameless: options.frameless, own: options.own, omit: omits(options.onError), async: true, shared: options.shared ?? {} });
  const frame = rootFrame(options.root);
  const prepared = sharing(c.shared, () => forked(options.tree ?? 0, prep(node, c, rootCtx(frame))));
  // A render that fails fails with the first error in tree order once nothing before it can still fail: it doesn't
  // wait for what comes after it (a promise that never settles there), and react-dom's render is stopped.
  const control: { abort?: (reason: unknown) => void } = {};
  let fail!: (error: unknown) => void;
  const failed = new Promise<never>((_, reject) => (fail = reject));
  c.changed = () => {
    if (c.omit || !c.errors.length) return;
    const first = c.errors.reduce((a, b) => (before(b.at, a.at) ? b : a));
    for (const at of c.waiting) if (before(at, first.at)) return;
    c.changed = undefined;
    control.abort?.(first.error);
    fail(first.error);
  };
  let html: string;
  try {
    // (What React handles itself, in order: a <Suspense>'s fallback rendered for it, see parse.ts's fallbackFailed.)
    const streamed = streamedMarkup(prepared, options.idPrefix, (raw) => raw, (error, info) => void c.reactErrors.push({ error, name: failedIn(info) }), control);
    streamed.catch(() => {});
    html = await Promise.race([streamed, failed]);
  } catch (error) {
    throw failure(error, options, frame, c);
  } finally {
    c.changed = undefined;
  }
  return flatten(withRawErrors(c, parse(html, c)), c.omit) as Flat;
}

let own = 0;
/** Whether Elements' own markup is rendering (see renderStatic): a root reads no context of the render around it. */
export const ownMarkup = (): boolean => own > 0;

/** Markup of Elements' own (a root's, a row's) as react-dom's static render writes it. */
export function renderStatic(node: React.ReactNode, options: { bare?: (type: unknown) => boolean; passes?: (error: unknown) => boolean; idPrefix?: string } = {}): string {
  own++;
  try {
    return staticMarkup(node, options.idPrefix);
  } catch (error) {
    if (error instanceof RenderError || options.passes?.(error)) throw error;
    throw renderFailure(error, "markup") ?? error;
  } finally {
    own--;
  }
}

/**
 * An element of one of Elements' own components (`bare`: a root, a Row, a block, which call no hooks), with `given`
 * props, called as it is; the HTML it renders in its `<div dangerouslySetInnerHTML>` given as it is (`inner`): what
 * renderStatic would write, without writing it out again. Where it isn't one, or doesn't render such a `<div>` in the
 * end, `html` is renderStatic's.
 */
export function renderOwn(node: React.ReactElement, given: Record<string, unknown>, options: { bare?: (type: unknown) => boolean; passes?: (error: unknown) => boolean } = {}): { html: string; inner?: string } {
  const bare = options.bare;
  const type = node.type;
  if (typeof type !== "function" || !bare?.(type)) return { html: renderStatic(cloneElement(node, given), options) };
  const props = { ...(node.props as object), ...given };
  own++;
  try {
    let frame = rootFrame("");
    let element: any = { type, props };
    for (;;) {
      const name = nameOf(element.type);
      frame = childFrame(frame, name);
      let result: any;
      try {
        result = element.type(element.props);
      } catch (error) {
        if (error instanceof RenderError || options.passes?.(error)) throw error;
        throw new RenderError(threw(error), name, positionOf(frame), error);
      }
      const html = result?.type === "div" && Object.keys(result.props).length === 1 ? result.props.dangerouslySetInnerHTML : undefined;
      if (html && typeof html === "object" && "__html" in html) return { html: "", inner: html.__html == null ? "" : "" + html.__html };
      if (typeof result?.type !== "function" || !bare(result.type)) return { html: renderStatic(result, options) };
      element = result;
    }
  } finally {
    own--;
  }
}
