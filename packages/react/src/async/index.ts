/**
 * @unlayer/react-elements/async: the renderers for templates that load data as they render. Async templates and
 * components, Suspense (`use()` on React 19, thrown promises on React 18) and `<Tailwind config>` are resolved
 * first; the HTML, plain text and design are then what Elements' synchronous renderers make, from the same render.
 */
import type React from "react";
import {
  renderToHtml as renderHtml,
  type DesignJSON,
  type HtmlParts,
  type PlainTextOptions,
  type RenderToHtmlOptions,
  type RenderToJsonOptions,
  type UnlayerConfig,
} from "@unlayer/react-elements";
import type { TailwindConfig, TailwindHandle } from "@unlayer/react-elements/tailwind";
import { prettyHtml } from "./pretty";
import { collectWaiting, take } from "./collect";
import type { CollectOptions, Flat } from "../engine";
import type { Engine, Renders } from "../utils/internals";

export type { DesignJSON, HtmlParts, PlainTextOptions, RenderToHtmlOptions, RenderToJsonOptions };

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

// Shared with the Tailwind entry, a bundle of its own (the package's entries share nothing else but the main one): the
// compiler it registers when it loads, and a handle's resolver.
const LOADER = Symbol.for("@unlayer/react-elements/tailwind-loader");
const TAILWIND = Symbol.for("@unlayer/react-elements/tailwind");

/**
 * When none of `handles` is compiling again after a class it couldn't read (see the Tailwind entry's
 * declarationReader), whose classes a synchronous render couldn't read till then: a few rounds at most, as another
 * render's class can make one compile again while this waits. Nothing (undefined) where none is: the render isn't put
 * off a tick for it.
 */
function compiled(handles: unknown[], rounds = 4): Promise<void> | undefined {
  const waits = handles.map((handle) => (handle as Record<symbol, { ready?(): Promise<void> | undefined }> | null)?.[TAILWIND]?.ready?.()).filter(Boolean);
  return waits.length && rounds ? Promise.all(waits).then(() => compiled(handles, rounds - 1)) : undefined;
}

interface Collected {
  recorded: Array<{ kind: string; props?: { tw?: unknown; config?: TailwindConfig }; load?: Load }>;
}
type Load = (config?: TailwindConfig) => Promise<TailwindHandle>;
/**
 * A render's scope (see utils/render-scope.ts): what it compiled for its <Tailwind config>s, for their rewrites; the
 * parts it left out, and how many of them were left out before it rendered again.
 */
type Scope = { tailwind?: unknown; omitted: unknown[]; listed?: number };
interface Internals {
  newScope(): Scope;
  withScope<T>(scope: Scope, run: () => T): T;
  unwrapAsync(element: React.ReactElement, scope: Scope, steps: typeof take, idPrefix?: string, api?: string): Promise<React.ReactElement>;
  collectAsync(root: React.ReactElement, scope: Scope, options: Partial<UnlayerConfig> | undefined, collect: (node: React.ReactNode, walk: CollectOptions) => Promise<Flat>): Promise<Collected>;
  /** Whether a type is one of Elements' roots, of any copy (see utils/root-type.ts). */
  isRoot(type: unknown): boolean;
  engine: Engine;
  /** The synchronous renders, in the scope they're run in (the render functions make one of their own). */
  renders: Renders;
  /** Says what the render's components left to say once it's done (an older main entry's has none). */
  done?(scope: Scope): void;
}

/**
 * Elements' Tailwind compiler, for a `<Tailwind config>` of a copy of Elements that doesn't carry its own (an older
 * one): the Tailwind entry's loaded last, never loaded otherwise.
 */
async function tailwindLoader(): Promise<Load> {
  const loaded = (globalThis as Record<symbol, unknown>)[LOADER];
  if (typeof loaded === "function") return loaded as Load;
  // Not where a bundler would follow it (into `tailwindcss`, an optional peer dependency): loaded when it runs.
  return (await import(/* webpackIgnore: true */ /* @vite-ignore */ "@unlayer/react-elements/tailwind")).loadTailwind;
}

/**
 * Renders `element` once, resolving what's async in it: its root first (an async template, or one that `use()`s a
 * promise), then its content, walked waiting for its async components, Suspense and `use()` (siblings at once, the
 * output in tree order); the synchronous render `run` makes the output from that, in the same scope. A template with
 * no root is its own content (what it rendered) where `api` names the render function (in what it says of one); the
 * design, which needs a root, names none.
 */
async function render<T>(element: React.ReactElement, options: Partial<UnlayerConfig> | undefined, run: (renders: Renders, root: React.ReactElement) => T, api?: string): Promise<T> {
  const internals = (renderHtml as unknown as Record<symbol, Internals>)[Symbol.for("@unlayer/react-elements/internals")];
  const scope = internals.newScope();
  try {
    return await renderIn(internals, scope, element, options, run, api);
  } finally {
    internals.done?.(scope);
  }
}

/** `render`'s, in its scope. */
async function renderIn<T>(internals: Internals, scope: Scope, element: React.ReactElement, options: Partial<UnlayerConfig> | undefined, run: (renders: Renders, root: React.ReactElement) => T, api?: string): Promise<T> {
  const root = await internals.unwrapAsync(element, scope, take, options?.idPrefix, api);
  const content = internals.isRoot(root.type) ? (root.props as { children?: React.ReactNode } | null)?.children : api && root;
  const scopes: Array<{ config?: TailwindConfig; load?: Load }> = [];
  // The handles its <Tailwind tw>s are given.
  const given: unknown[] = [];
  if (content && typeof content === "object") {
    const collected = await internals.collectAsync(root, scope, options, (node, walk) => collectWaiting(internals.engine, node, walk));
    for (const r of collected.recorded) {
      if (r.kind !== "tailwind") continue;
      if (r.props?.tw) given.push(r.props.tw);
      else scopes.push({ config: r.props?.config, load: typeof r.load === "function" ? r.load : undefined });
    }
  }
  // Each scope's config compiled by its copy's compiler (an older copy's by the one loaded last), once each.
  const handles = new Map<Load, Map<unknown, TailwindHandle>>();
  for (const { config, load: own } of scopes) {
    const load = own ?? (await tailwindLoader());
    const compiled = handles.get(load) ?? new Map<unknown, TailwindHandle>();
    handles.set(load, compiled);
    if (!compiled.has(config)) compiled.set(config, await load(config));
  }
  // The handles, in the render's scope, which gives them to its <Tailwind config>s' rewrites: a <Tailwind> says which
  // it is, by its type (an older copy's doesn't: any compiled for its config). A render the user's code starts has a
  // scope of its own, without them.
  scope.tailwind = (config: TailwindConfig | undefined, type?: unknown) => {
    const own = handles.get((type as Record<symbol, Load> | undefined)?.[LOADER] as Load)?.get(config);
    if (own) return own;
    for (const compiled of handles.values()) if (compiled.has(config)) return compiled.get(config);
    return undefined;
  };
  // (Right before the render, which is synchronous: nothing compiles again in between.)
  const all = [...given, ...[...handles.values()].flatMap((compiled) => [...compiled.values()])];
  const waiting = compiled(all);
  if (waiting) await waiting;
  // A class of its own Tailwind couldn't read makes it compile again as it renders: it waits, and renders again, in
  // its scope (what it worked out kept, its components not run again), a few times at most (each such class is built
  // alone first, then refused).
  for (let again = 3; ; again--) {
    try {
      return internals.withScope(scope, () => run(internals.renders, root));
    } catch (error) {
      const wait = again > 0 && (error as Record<symbol, { compiling?: boolean }> | null)?.[TAILWIND]?.compiling ? compiled(all) : undefined;
      if (!wait) throw error;
      // (What it left out so far is listed and said: it isn't again.)
      scope.listed = scope.omitted.length;
      await wait;
    }
  }
}

/**
 * `renderToHtml`, for templates that load data as they render: async templates and components, Suspense and
 * `<Tailwind config>` are resolved first. The same document; with `pretty`, formatted for reading.
 */
export async function renderToHtml(element: React.ReactElement, options?: RenderToHtmlOptions & PrettyOption): Promise<string> {
  const { pretty, ...rest } = options ?? {};
  const html = await render(element, rest, (renders, root) => renders.html(root, rest), "renderToHtml");
  return pretty ? prettyHtml(html) : html;
}

/** `renderToPlainText`, for templates that load data as they render (see renderToHtml), with the same options. */
export function renderToPlainText(element: React.ReactElement, config?: Partial<UnlayerConfig> & PlainTextOptions): Promise<string> {
  return render(element, config, (renders, root) => renders.text(root, config), "renderToPlainText");
}

/** `renderToJson`, for templates that load data as they render (see renderToHtml), with the same options. */
export function renderToJson(element: React.ReactElement, options?: RenderToJsonOptions): Promise<DesignJSON> {
  return render(element, options, (renders, root) => renders.json(root, options));
}

/** `renderToHtmlParts`, for templates that load data as they render (see renderToHtml); with `pretty`, its head and body formatted. */
export async function renderToHtmlParts(element: React.ReactElement, config?: Partial<UnlayerConfig> & PrettyOption): Promise<HtmlParts> {
  const { pretty, ...rest } = config ?? {};
  const parts = await render(element, rest, (renders, root) => renders.parts(root, rest), "renderToHtmlParts");
  return pretty ? { ...parts, head: await prettyHtml(parts.head), body: await prettyHtml(parts.body) } : parts;
}
