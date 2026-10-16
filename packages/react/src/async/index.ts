/**
 * @unlayer/react-elements/async: the renderers for templates that load data as they render. Async templates and
 * components, Suspense (`use()` on React 19, thrown promises on React 18) and `<Tailwind config>` are resolved
 * first; the HTML, plain text and design are then what Elements' synchronous renderers make, from the same render.
 */
import React from "react";
import {
  renderToHtml as renderHtml,
  renderToPlainText as renderText,
  renderToJson as renderJson,
  renderToHtmlParts as renderParts,
  type DesignJSON,
  type HtmlParts,
  type PlainTextOptions,
  type RenderToHtmlOptions,
  type UnlayerConfig,
} from "@unlayer/react-elements";
import type { TailwindConfig, TailwindHandle } from "@unlayer/react-elements/tailwind";
import { asyncComponent, renderAll, renderStatic } from "./stream";
import { prettyHtml } from "./pretty";
import { runner, storage, type Runner } from "./running";

export type { DesignJSON, HtmlParts, PlainTextOptions, RenderToHtmlOptions };

/**
 * HTML formatted for reading, as the renderers' `pretty` formats it (with prettier, an optional peer dependency):
 * no space added or taken where it would show, and Outlook's conditional comments kept as they are. Not on edge
 * runtimes, which can't load prettier as it runs: format at build time there.
 */
export const pretty: (html: string) => Promise<string> = prettyHtml;

/** The renderers' options: the synchronous ones', and `pretty`. */
export interface PrettyOption {
  /** The HTML formatted for reading (with prettier, an optional peer dependency); the same document otherwise. */
  pretty?: boolean;
}

// Shared with the main entry (one for every copy of Elements a process loads).
const TAILWIND = Symbol.for("@unlayer/react-elements/tailwind");
const LOOKUPS = Symbol.for("@unlayer/react-elements/tailwind-scopes");
const FRAMES = Symbol.for("@unlayer/react-elements/collecting");
const ASYNCS = Symbol.for("@unlayer/react-elements/async-collections");
const LOADER = Symbol.for("@unlayer/react-elements/tailwind-loader");
const PROVIDER = Symbol.for("@unlayer/react-elements/provider");
const RUNNING = Symbol.for("@unlayer/react-elements/async-running");
const MEMO = Symbol.for("react.memo");
const ROOTS = new Set(["Body", "Email", "Page", "Document"]);

interface Collection {
  nonce: string;
  recorded: Array<{ kind: string; props?: { tw?: unknown; config?: TailwindConfig } }>;
  async: (element: React.ReactElement) => React.ReactElement;
  blind?: boolean;
}
interface Internals {
  guard(children: React.ReactNode, collection: Collection): React.ReactNode;
  parse(html: string, collection: Collection): unknown;
  idsSeen(render?: (node: React.ReactNode, options?: object) => string): boolean;
  intact(children: React.ReactNode, collection: Collection): void;
  unwrap(element: React.ReactElement, api: string, scope: WeakMap<object, unknown>): React.ReactElement;
  withScope<T>(scope: WeakMap<object, unknown>, run: () => T): T;
}

let renders = 0;
/** A collection's nonce, as the main entry's are (see normalize.tsx): not a random number, which prerendering frameworks reject. */
const nonce = () => [++renders, (globalThis.performance?.timeOrigin ?? 0) * 1e3, (globalThis.performance?.now() ?? 0) * 1e6].map((n) => Math.floor(n).toString(36)).join("_");

const isAsync = (type: unknown) => (type as { [Symbol.toStringTag]?: string } | null)?.[Symbol.toStringTag] === "AsyncFunction";

/**
 * An async template (`async function Welcome()`) called, until a root or a template React can call comes out; one in
 * a context provider, an <UnlayerProvider>, a Fragment or a <Tailwind> too, which then hold what it gives.
 */
async function resolved(element: React.ReactElement, depth = 0): Promise<React.ReactElement> {
  if (depth > 20 || !React.isValidElement(element)) return element;
  let type = element.type as any;
  while (type?.$$typeof === MEMO) type = type.type;
  if (isAsync(type)) {
    let out: unknown;
    try {
      out = await type({ ...type.defaultProps, ...(element.props as object) });
    } catch (error) {
      throw Object.assign(new Error(`[Unlayer] <${type.displayName || type.name}> threw while rendering: ${String((error as Error)?.message ?? error)}`), { cause: error });
    }
    return React.isValidElement(out) ? resolved(out, depth + 1) : element;
  }
  const inside = React.Children.toArray((element.props as { children?: React.ReactNode }).children);
  const wrapper = type === React.Fragment || type?.[TAILWIND] || type?.[PROVIDER] || ((type?.$$typeof === Symbol.for("react.provider") || type?.$$typeof === Symbol.for("react.context")) && "value" in (element.props as object));
  if (wrapper && inside.length === 1 && React.isValidElement(inside[0])) return React.cloneElement(element, undefined, await resolved(inside[0], depth + 1));
  return element;
}

/** Elements' Tailwind compiler, when a template has a `<Tailwind config>`: the Tailwind entry's, never loaded otherwise. */
async function tailwindLoader(): Promise<(config?: TailwindConfig) => Promise<TailwindHandle>> {
  const loaded = (globalThis as Record<symbol, unknown>)[LOADER];
  if (typeof loaded === "function") return loaded as (config?: TailwindConfig) => Promise<TailwindHandle>;
  // Not where a bundler would follow it (into `tailwindcss`, an optional peer dependency): loaded when it runs.
  return (await import(/* webpackIgnore: true */ /* @vite-ignore */ "@unlayer/react-elements/tailwind")).loadTailwind;
}

/**
 * Renders `element` once, resolving what's async in it: its root first (an async template), then its content, in
 * React's streaming render (the template's components, with their context, run there, once), which the synchronous
 * render `run` makes the output from.
 */
async function render<T>(element: React.ReactElement, api: string, run: (root: React.ReactElement) => T): Promise<T> {
  const internals = (renderHtml as unknown as Record<symbol, Internals>)[Symbol.for("@unlayer/react-elements/internals")];
  const scope = new WeakMap<object, unknown>();
  const root = internals.unwrap(await resolved(element), api, scope);
  const children = (root.props as { children?: React.ReactNode } | null)?.children;
  const configs: Array<TailwindConfig | undefined> = [];
  if (ROOTS.has((root.type as { displayName?: string })?.displayName ?? "") && children && typeof children === "object") {
    // Where Elements' React isn't the one react-dom renders with, ids can't name it (see the main entry's Collection.blind).
    const collection: Collection = { nonce: nonce(), recorded: [], async: asyncComponent, ...(internals.idsSeen(renderStatic) ? {} : { blind: true }) };
    const shared = globalThis as Record<symbol, unknown>;
    const frames = (shared[FRAMES] ??= []) as unknown[];
    const asyncs = (shared[ASYNCS] ??= new Map()) as Map<string, Collection>;
    // Its components run while it's under way, after awaits too: its frame stays, and its ids name it (or, blind, the
    // runner tells its work: see running.ts).
    const running = (shared[RUNNING] ??= runner(storage<Collection>())) as Runner<Collection>;
    frames.push(collection);
    asyncs.set(collection.nonce, collection);
    let html: string;
    try {
      html = await running.run(collection, () => renderAll(React.createElement(React.Fragment, null, internals.guard(children, collection)), `unlayer-collect-${collection.nonce}-`));
    } finally {
      frames.splice(frames.indexOf(collection), 1);
      asyncs.delete(collection.nonce);
    }
    // The collected template, for the render after (see the main entry's normalize.tsx); one that isn't fails there.
    const nodes = internals.parse(html, collection);
    internals.intact(children, collection);
    scope.set(children as object, { nodes, collection, told: new Set() });
    for (const r of collection.recorded) if (r.kind === "tailwind" && !r.props?.tw) configs.push(r.props?.config);
  }
  const handles = new Map<unknown, TailwindHandle>();
  if (configs.length) {
    const load = await tailwindLoader();
    for (const config of configs) if (!handles.has(config)) handles.set(config, await load(config));
  }
  // The handles, for the <Tailwind config> elements to find while it renders (the Tailwind entry's lookups).
  const lookups = ((globalThis as Record<symbol, unknown>)[LOOKUPS] ??= []) as Array<(config?: TailwindConfig) => unknown>;
  const lookup = (config?: TailwindConfig) => handles.get(config);
  lookups.push(lookup);
  try {
    return internals.withScope(scope, () => run(root));
  } finally {
    lookups.splice(lookups.indexOf(lookup), 1);
  }
}

/**
 * `renderToHtml`, for templates that load data as they render: async templates and components, Suspense and
 * `<Tailwind config>` are resolved first. The same document; with `pretty`, formatted for reading.
 */
export async function renderToHtml(element: React.ReactElement, options?: RenderToHtmlOptions & PrettyOption): Promise<string> {
  const { pretty, ...rest } = options ?? {};
  const html = await render(element, "renderToHtml", (root) => renderHtml(root, rest));
  return pretty ? prettyHtml(html) : html;
}

/** `renderToPlainText`, for templates that load data as they render (see renderToHtml), with the same options. */
export function renderToPlainText(element: React.ReactElement, config?: Partial<UnlayerConfig> & PlainTextOptions): Promise<string> {
  return render(element, "renderToPlainText", (root) => renderText(root, config));
}

/** `renderToJson`, for templates that load data as they render (see renderToHtml). */
export function renderToJson(element: React.ReactElement): Promise<DesignJSON> {
  return render(element, "renderToJson", (root) => renderJson(root));
}

/** `renderToHtmlParts`, for templates that load data as they render (see renderToHtml); with `pretty`, its head and body formatted. */
export async function renderToHtmlParts(element: React.ReactElement, config?: Partial<UnlayerConfig> & PrettyOption): Promise<HtmlParts> {
  const { pretty, ...rest } = config ?? {};
  const parts = await render(element, "renderToHtmlParts", (root) => renderParts(root, rest));
  return pretty ? { ...parts, head: await prettyHtml(parts.head), body: await prettyHtml(parts.body) } : parts;
}
