/**
 * @unlayer/react-elements/async: the renderers for templates that load data as they render. Async templates and
 * components, Suspense (`use()` on React 19, thrown promises on React 18) and `<Tailwind config>` are resolved
 * first; the HTML, plain text and design are then what Elements' synchronous renderers make, from the same render.
 */
import type React from "react";
import {
  renderToHtml as renderHtml,
  renderToPlainText as renderText,
  renderToJson as renderJson,
  renderToHtmlParts as renderParts,
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
import type { Engine } from "../utils/internals";

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
// compiler it registers when it loads, and the handles an async render compiled, for its <Tailwind config>s to find
// while that render renders.
const LOOKUPS = Symbol.for("@unlayer/react-elements/tailwind-scopes");
const LOADER = Symbol.for("@unlayer/react-elements/tailwind-loader");
const ROOTS = new Set(["Body", "Email", "Page", "Document"]);

interface Collected {
  recorded: Array<{ kind: string; props?: { tw?: unknown; config?: TailwindConfig } }>;
}
type Scope = object;
interface Internals {
  newScope(): Scope;
  withScope<T>(scope: Scope, run: () => T): T;
  unwrapAsync(element: React.ReactElement, steps: typeof take, idPrefix?: string): Promise<React.ReactElement>;
  collectAsync(root: React.ReactElement, scope: Scope, options: Partial<UnlayerConfig> | undefined, collect: (node: React.ReactNode, walk: CollectOptions) => Promise<Flat>): Promise<Collected>;
  engine: Engine;
}

/** Elements' Tailwind compiler, when a template has a `<Tailwind config>`: the Tailwind entry's, never loaded otherwise. */
async function tailwindLoader(): Promise<(config?: TailwindConfig) => Promise<TailwindHandle>> {
  const loaded = (globalThis as Record<symbol, unknown>)[LOADER];
  if (typeof loaded === "function") return loaded as (config?: TailwindConfig) => Promise<TailwindHandle>;
  // Not where a bundler would follow it (into `tailwindcss`, an optional peer dependency): loaded when it runs.
  return (await import(/* webpackIgnore: true */ /* @vite-ignore */ "@unlayer/react-elements/tailwind")).loadTailwind;
}

/**
 * Renders `element` once, resolving what's async in it: its root first (an async template, or one that `use()`s a
 * promise), then its content, walked waiting for its async components, Suspense and `use()` (siblings at once, the
 * output in tree order); the synchronous render `run` makes the output from that, in the same scope.
 */
async function render<T>(element: React.ReactElement, options: Partial<UnlayerConfig> | undefined, run: (root: React.ReactElement) => T): Promise<T> {
  const internals = (renderHtml as unknown as Record<symbol, Internals>)[Symbol.for("@unlayer/react-elements/internals")];
  const scope = internals.newScope();
  const root = await internals.unwrapAsync(element, take, options?.idPrefix);
  const children = (root.props as { children?: React.ReactNode } | null)?.children;
  const configs: Array<TailwindConfig | undefined> = [];
  if (ROOTS.has((root.type as { displayName?: string })?.displayName ?? "") && children && typeof children === "object") {
    const collected = await internals.collectAsync(root, scope, options, (node, walk) => collectWaiting(internals.engine, node, walk));
    for (const r of collected.recorded) if (r.kind === "tailwind" && !r.props?.tw) configs.push(r.props?.config);
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
  const html = await render(element, rest, (root) => renderHtml(root, rest));
  return pretty ? prettyHtml(html) : html;
}

/** `renderToPlainText`, for templates that load data as they render (see renderToHtml), with the same options. */
export function renderToPlainText(element: React.ReactElement, config?: Partial<UnlayerConfig> & PlainTextOptions): Promise<string> {
  return render(element, config, (root) => renderText(root, config));
}

/** `renderToJson`, for templates that load data as they render (see renderToHtml), with the same options. */
export function renderToJson(element: React.ReactElement, options?: RenderToJsonOptions): Promise<DesignJSON> {
  return render(element, options, (root) => renderJson(root, options));
}

/** `renderToHtmlParts`, for templates that load data as they render (see renderToHtml); with `pretty`, its head and body formatted. */
export async function renderToHtmlParts(element: React.ReactElement, config?: Partial<UnlayerConfig> & PrettyOption): Promise<HtmlParts> {
  const { pretty, ...rest } = config ?? {};
  const parts = await render(element, rest, (root) => renderParts(root, rest));
  return pretty ? { ...parts, head: await prettyHtml(parts.head), body: await prettyHtml(parts.body) } : parts;
}
