/**
 * One render's scope (renderToHtml, renderToJson, …): what it works out once, like a template's collected content,
 * is reused for the rest of it and never by the next render (an element kept between renders may read other data);
 * what the render does with parts that fail (`onError`), and the parts it left out.
 */
import { escapeKeepingTags, type OnError, type RenderError } from "@unlayer-internal/shared-elements";
import { omits, reportOmitted } from "../engine/errors";

export interface Scope {
  cache: WeakMap<object, unknown>;
  onError?: OnError;
  /** The parts left out, each said once (see reportOmitted). */
  omitted: RenderError[];
  /** Rows and blocks whose exporters failed, by their records: left out of the head and the design too. */
  failed: WeakSet<object>;
}

export const newScope = (): Scope => ({ cache: new WeakMap(), omitted: [], failed: new WeakSet() });

let scoped: Scope | undefined;

/** `make()`'s result for `key`, worked out once per render (each time outside one). */
export function scopeCache<T>(key: object, make: () => T): T {
  if (!scoped) return make();
  if (!scoped.cache.has(key)) scoped.cache.set(key, make());
  return scoped.cache.get(key) as T;
}

const SAID = {};
/** A warning, said once per render (each time outside one). */
export function sayOnce(message: string): void {
  const said = scopeCache(SAID, () => new Set<string>());
  if (!said.has(message)) console.warn(said.add(message) && message);
}

/** The render's `onError`, where its root's config says it (the render functions, or Body rendered on its own). */
export function setOnError(onError: OnError | undefined): void {
  if (scoped && onError !== undefined) scoped.onError ??= onError;
}

export const onError = (): OnError | undefined => scoped?.onError;

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
  scoped?.omitted.push(error);
  reportOmitted(scoped?.onError, error);
}

/** Whether a row's or block's exporter failed in this render (see `failed`). */
export const failedBefore = (record: object | undefined): boolean => !!record && !!scoped?.failed.has(record);

/** The parts this render left out. */
export const omissions = (): RenderError[] => scoped?.omitted ?? [];

/**
 * Runs `run` in `scope` (an async renderer collects a template in it first, then renders in it); with none, outside
 * any (a template's components run so: a render one of them starts is a render of its own).
 */
export function withScope<T>(scope: Scope | undefined, run: () => T): T {
  const outer = scoped;
  scoped = scope;
  try {
    return run();
  } finally {
    scoped = outer;
  }
}

/** Runs one render with its own scope (a render inside another, as Body's in renderToHtml's, shares it). */
export function withRenderScope<T>(render: () => T): T {
  return scoped ? render() : withScope(newScope(), render);
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
