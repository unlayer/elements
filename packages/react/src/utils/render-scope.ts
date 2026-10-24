/**
 * One render's scope (renderToHtml, renderToJson, …): what it works out once, like a template's collected content,
 * is reused for the rest of it and never by the next render (an element kept between renders may read other data);
 * what the render does with parts that fail (`onError`), and the parts it left out.
 *
 * Each render function makes a scope of its own, whatever's rendering around it, and the user's code (a component, a
 * template wrapper, a custom tool's exporter or head, `onError`) runs outside it (`guest`): a render it starts is a
 * render of its own. The scope is the module's while a render runs synchronously: never kept across an `await`
 * (async code passes it on itself, as collectAsync does), so renders at once never see each other's.
 */
import { escapeKeepingTags, type OnError, type RenderError } from "@unlayer-internal/shared-elements";
import { omits, reportOmitted } from "../engine/errors";
import type { Shared } from "../engine";
import type { Unwrapped } from "./unwrap-root";

export interface Scope {
  cache: WeakMap<object, unknown>;
  /** What the HTML worked out for a record (a block's values), which the head reuses (see `remember`). */
  values: WeakMap<object, unknown>;
  onError?: OnError;
  idPrefix?: string;
  /** The parts left out, each said once (see reportOmitted). */
  omitted: RenderError[];
  /** Rows and blocks whose exporters failed, by their records: left out of the head and the design too. */
  failed: WeakSet<object>;
  /** Whether its root reads right to left (see setRenderConfig): Tailwind's logical sides follow it. */
  rtl?: boolean;
  /** What its template unwrapped to: its root, the providers' config, where its content starts (see unwrap-root.ts). */
  unwrapped?: Unwrapped;
  /** What an async render compiled for its <Tailwind config>s (the async entry's lookup: see utils/tailwind.ts). */
  tailwind?: unknown;
  /**
   * Where an async render renders again in it (after Tailwind compiles again: see async/index.ts), the parts it had
   * left out before: one left out again isn't listed or said again.
   */
  listed?: number;
}

export const newScope = (): Scope => ({ cache: new WeakMap(), values: new WeakMap(), omitted: [], failed: new WeakSet() });

let scoped: Scope | undefined;

/** `make()`'s result for `key`, worked out once per render (each time outside one). */
export function scopeCache<T>(key: object, make: () => T): T {
  if (!scoped) return make();
  if (!scoped.cache.has(key)) scoped.cache.set(key, make());
  return scoped.cache.get(key) as T;
}

/**
 * What a Row, Column or block's HTML worked out for its record (its values, mapped from its props), for the head to
 * reuse in the same render instead of working it out again (outside a render, nothing is kept).
 */
export function remember(record: object | undefined, value: unknown): void {
  if (record && scoped) scoped.values.set(record, value);
}

export const recall = <T>(record: object | undefined): T | undefined => (record && scoped ? (scoped.values.get(record) as T | undefined) : undefined);

const SAID = {};
/**
 * How this render says a warning once (each time outside one): one said with a `key` is said once for all with it.
 * Got in the render's scope, it says them in that render's from where its scope isn't (the walk: see `guest`).
 */
export function sayer(): (message: string, key?: string) => void {
  const said = scopeCache(SAID, () => new Set<string>());
  return (message, key = message) => void (said.has(key) || console.warn(said.add(key) && message));
}

/** A warning, said once per render (each time outside one): see sayer. */
export const sayOnce = (message: string, key?: string): void => sayer()(message, key);

/**
 * The render's `onError`, `idPrefix` and direction, where its root's config says them (the render functions, or Body
 * rendered on its own): the first config given in a render wins.
 */
export function setRenderConfig(config: { onError?: OnError; idPrefix?: unknown; textDirection?: unknown }): void {
  if (!scoped) return;
  if (config.onError !== undefined) scoped.onError ??= config.onError;
  if (typeof config.idPrefix === "string") scoped.idPrefix ??= config.idPrefix;
  // (As Body reads it for the body's `dir`: see textDirectionOf.)
  const dir = config.textDirection;
  scoped.rtl ??= typeof dir == "string" && dir.trim().toLowerCase() == "rtl";
}

export const onError = (): OnError | undefined => scoped?.onError;
/** Whether the render's root reads right to left (its config's `textDirection`, as its body's `dir`). */
export const rightToLeft = (): boolean => !!scoped?.rtl;
/** What the template's `useId()`s start with in this render (see UnlayerConfig's `idPrefix`). */
export const idPrefix = (): string | undefined => scoped?.idPrefix;

/**
 * A part that failed: thrown, or (`onError: "omit"`) left out, listed and said once; `record`, the row's or block's
 * whose exporter failed, so the head and the design leave it out too.
 */
export function failed(error: RenderError, record?: object): void {
  if (!omits(scoped?.onError)) throw error;
  if (record) scoped!.failed.add(record);
  omitted(error);
}

/** A part the render left out (what a collecting walk left out, a Row that doesn't fit): listed and said. */
export function omitted(error: RenderError): void {
  const policy = scoped?.onError;
  // (Its message says the part: its component and where it is.)
  if (scoped?.listed && scoped.omitted.slice(0, scoped.listed).some((e) => e.message === error.message)) return;
  scoped?.omitted.push(error);
  // (A function's the user's: see `guest`.)
  guest(() => reportOmitted(policy, error));
}

/** Whether a row's or block's exporter failed in this render (see `failed`). */
export const failedBefore = (record: object | undefined): boolean => !!record && !!scoped?.failed.has(record);

/** The parts this render left out. */
export const omissions = (): RenderError[] => scoped?.omitted ?? [];

/** What this render compiled for its <Tailwind config>s, where it's an async render's (see utils/tailwind.ts). */
export const compiledTailwind = (): unknown => scoped?.tailwind;

/** What this render's template unwrapped to (see unwrap-root.ts). */
export const unwrapped = (): Unwrapped | undefined => scoped?.unwrapped;

/** `found`, what this render's template unwraps to, kept for the rest of the render (its scope's). */
export function keepUnwrapped(found: Unwrapped): Unwrapped {
  if (scoped) scoped.unwrapped = found;
  return found;
}

/** Runs `run` in `scope` (a render function's own; an async renderer collects a template in it first, then renders in it). */
export function withScope<T>(scope: Scope | undefined, run: () => T): T {
  const outer = scoped;
  scoped = scope;
  try {
    return run();
  } finally {
    scoped = outer;
  }
}

/** Runs a render function's render in a scope of its own, whatever's rendering around it; said what's left once it's done. */
export function withOwnScope<T>(render: () => T): T {
  const scope = newScope();
  try {
    return withScope(scope, render);
  } finally {
    renderDone(scope);
  }
}

const SHARED = {};

/**
 * What the components of this render share, whatever part of the template they're in: the work left to its Markdown
 * and code blocks, together (see the code entry's work.ts), so a template of many blocks takes what one block of their
 * size would. The render's own (each render function's; an async render's walk and the synchronous render after it
 * alike), given to each component and template wrapper it calls, while it calls it (see the engine's `sharing`): they
 * run outside its scope.
 */
export const sharedByRender = (): Shared => scopeCache(SHARED, () => ({}));

/** What a render's components leave to say once it's done, by what it is (said once, with what the whole render did). */
const DONE = Symbol.for("@unlayer/react-elements/when-done");

/** Says what a render's components left to say once it's done (see DONE): the render functions', as each ends. */
export function renderDone(scope: Scope): void {
  const shared = scope.cache.get(SHARED) as Shared | undefined;
  const done = shared?.[DONE] as Map<string, () => void> | undefined;
  if (!done) return;
  delete shared![DONE];
  for (const say of done.values()) say();
}

/**
 * Runs code of the user's own (a component, a template wrapper, a custom tool's exporter or head, an `onError`
 * function, a Tailwind plugin) outside the render's scope: a render it starts is a render of its own, and Body that
 * React renders there makes its own.
 */
export const guest = <T>(run: () => T): T => withScope(undefined, run);

/**
 * Body's content rendered in the scope of the render that reached it (the render functions'), or one of its own where
 * React renders Body (an app's live preview).
 */
export function withRenderScope<T>(render: () => T): T {
  return scoped ? render() : withOwnScope(render);
}

/**
 * Text placed straight in a Row or Column, as HTML: escaped, as React shows
 * text (raw HTML goes in an Html block). The editor has no place for it, so
 * the warning says where it belongs.
 */
const warnedLoose = new Set<string>();

export function looseText(child: string | number, container: string): string {
  const text = String(child);
  // Said once per container, not on every render.
  if (text.trim() && !warnedLoose.has(container)) {
    warnedLoose.add(container);
    console.warn(`${container}: text placed straight in a ${container} shows as text and isn't kept in the editor's design. Put it in a <Paragraph>, or HTML in an <Html> block.`);
  }
  // An email service's `<%name%>` tag stays as written, as in other text.
  return escapeKeepingTags(text, true);
}
