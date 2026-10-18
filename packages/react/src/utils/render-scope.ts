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
/** A warning, said once per render (each time outside one). */
export function sayOnce(message: string): void {
  const said = scopeCache(SAID, () => new Set<string>());
  if (!said.has(message)) console.warn(said.add(message) && message);
}

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
  scoped?.omitted.push(error);
  // (A function's the user's: see `guest`.)
  guest(() => reportOmitted(policy, error));
}

/** Whether a row's or block's exporter failed in this render (see `failed`). */
export const failedBefore = (record: object | undefined): boolean => !!record && !!scoped?.failed.has(record);

/** The parts this render left out. */
export const omissions = (): RenderError[] => scoped?.omitted ?? [];

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

/** Runs a render function's render in a scope of its own, whatever's rendering around it. */
export const withOwnScope = <T>(render: () => T): T => withScope(newScope(), render);

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
