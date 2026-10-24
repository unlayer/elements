/**
 * A config's plugins kept from throwing into Tailwind's compiler as it builds. Tailwind keeps every class it was given
 * and builds them all again with the next new one, so a plugin's function that throws for one class (a class from
 * data) would fail every build after it: every render's with that handle, other tenants' too. What such a function
 * (a utility's or component's for a value, `matchUtilities` and `matchComponents`; a variant's, `matchVariant`) throws
 * while a build runs, or gives that the compiler would throw for (see `compilable` and `selectors`), is logged
 * instead, and the class gives no CSS; the reader (declarations.ts) fails the component whose class it was, where it's
 * read. What can't be read as CSS (a quote or a bracket left open, a comment: see `readable`) is logged too, and the
 * class left out; nothing (`undefined`, `null` or `false`, as a function returns for a value it doesn't take) is no
 * CSS, the class one Tailwind doesn't have, as Tailwind 3 took it.
 */
import { APPLY, readable, type PluginFailure } from "./declarations";

type Api = Record<string, any>;
type Fn = (this: unknown, ...args: any[]) => unknown;

/** The keys of `map` (a function's `values` or `modifiers`) that give `value`. */
const keysIn = (map: unknown, value: unknown): string[] => (map && typeof map === "object" ? Object.keys(map).filter((key) => (map as Record<string, unknown>)[key] === value) : []);

/**
 * What a function was given, to tie its failure to its class: its value (as Tailwind gave it: an arbitrary one
 * decoded, `(--x)` as `var(--x)`) and the keys of its `values` that give it, and its modifier, with the keys of its
 * `modifiers` that give that.
 */
function given(values: unknown, modifiers: unknown, value: unknown, extra: unknown): Pick<PluginFailure, "keys" | "value" | "modifier" | "modifierKeys"> {
  const keys = keysIn(values, value);
  const modifier = (extra as { modifier?: unknown } | null | undefined)?.modifier;
  return { ...(keys.length ? { keys } : {}), ...(typeof value === "string" ? { value } : {}), ...(typeof modifier === "string" ? { modifier, modifierKeys: keysIn(modifiers, modifier) } : {}) };
}

/** Whether what a plugin's function gave reads as CSS: each string in it, a key or a value, as `readable` takes a class. */
const clean = (out: unknown, depth = 0): boolean =>
  typeof out === "string" ? readable(out) : out && typeof out === "object" && depth < 32 ? Object.entries(out).every(([key, value]) => readable(key) && clean(value, depth + 1)) : true;

/** What a plugin's function gave, for an error that says it: its type, or the text of what it is. */
const what = (out: unknown): string => (Array.isArray(out) ? "a list" : out && typeof out === "object" ? "an object" : `\`${typeof out === "string" ? JSON.stringify(out) : String(out)}\``);

/**
 * What a utility's or component's function gave, as Tailwind's compiler can take it: each `@apply` in it an APPLY
 * declaration of its classes, which the reader applies (Tailwind's compiler throws for one of a class or a variant it
 * doesn't have, or of the class itself, and then for every build after it). It throws (an Error saying so) where the
 * compiler would: for a list holding nothing (`[null]`), and for what nests more than 32 deep.
 */
function compilable(out: unknown, name: string): unknown {
  // (CSS is an object, or a list of them: Tailwind reads a string, a number or a function as no CSS, or as characters.)
  const css = (item: unknown) => !!item && typeof item === "object";
  const bad = Array.isArray(out) ? out.find((item) => !css(item)) : out;
  if (!css(out) || (Array.isArray(out) && out.some((item) => !css(item)))) throw new Error(`<Tailwind>: the plugin's \`${name}\` function gives ${Array.isArray(out) ? `a list holding ${what(bad)}` : what(out)}, not CSS (an object, or a list of them)`);
  let applies = 0;
  const walk = (value: unknown, depth: number): unknown => {
    if (depth > 32) throw new Error(`<Tailwind>: the plugin's \`${name}\` function gives CSS nested more than 32 deep`);
    if (Array.isArray(value)) {
      if (value.some((item) => item == null)) throw new Error(`<Tailwind>: the plugin's \`${name}\` function gives a list holding ${what(value.find((item) => item == null))}, which Tailwind can't compile`);
      return value.map((item) => walk(item, depth + 1));
    }
    if (!value || typeof value !== "object") return value;
    return Object.fromEntries(
      Object.entries(value).map(([key, inner]) =>
        /^@apply(\s|$)/.test(key) ? [`${APPLY}${applies++}`, applied(key.slice(6).trim(), name)] : [key, walk(inner, depth + 1)]
      )
    );
  };
  return walk(out, 0);
}

/** An `@apply`'s classes, as an APPLY declaration's value (URL-encoded: CSS reads it as written). */
function applied(classes: string, name: string): string {
  if (!classes) throw new Error(`<Tailwind>: the plugin's \`${name}\` function gives an \`@apply\` with no class in it`);
  return encodeURIComponent(classes).replace(/[!'()*~]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

/** What a variant's function gave, where Tailwind's compiler can take it: a selector, or a list of them (it throws otherwise). */
function selectors(out: unknown, name: string): unknown {
  if (typeof out === "string" || (Array.isArray(out) && out.every((item) => typeof item === "string"))) return out;
  throw new Error(`<Tailwind>: the plugin's \`${name}\` variant gives ${what(out)}, not a selector or a list of them`);
}

/**
 * `config` with its plugins' (and its presets' plugins') functions for a class kept from throwing into a build
 * (`building()`): each failure goes to `log`, the class giving no CSS (a utility nothing, a variant no selector).
 * Outside a build (Tailwind tries a variant's function as it registers it) they're called as they are.
 */
export function guarded<T>(config: T, log: PluginFailure[], building: () => boolean): T {
  if (!config || typeof config !== "object") return config;
  const guard = (fn: Fn, name: string, variant: boolean, options?: Api): Fn =>
    function (value, extra) {
      if (!building()) return fn.call(this, value, extra);
      try {
        const out = fn.call(this, value, extra);
        if (out == null || out === false) return variant ? [] : {};
        if (clean(out)) return variant ? selectors(out, name) : compilable(out, name);
        log.push({ name, variant, ...given(options?.values, options?.modifiers, value, extra) });
      } catch (error) {
        log.push({ name, variant, ...given(options?.values, options?.modifiers, value, extra), error });
      }
      return variant ? [] : {};
    };
  const api = (given: Api): Api => {
    const own = Object.create(given) as Api;
    for (const method of ["matchUtilities", "matchComponents"])
      if (typeof given[method] === "function")
        own[method] = (fns: Record<string, unknown>, options?: Api) =>
          given[method](Object.fromEntries(Object.entries(fns ?? {}).map(([name, fn]) => [name, typeof fn === "function" ? guard(fn as Fn, name, false, options) : fn])), options);
    if (typeof given.matchVariant === "function") own.matchVariant = (name: string, fn: unknown, options?: Api) => given.matchVariant(name, typeof fn === "function" ? guard(fn as Fn, name, true, options) : fn, options);
    return own;
  };
  const handler = (fn: unknown) => (typeof fn === "function" ? function (this: unknown, given: Api) { return fn.call(this, api(given)); } : fn);
  const plugin = (p: any): unknown => {
    // (Tailwind calls an options plugin, `plugin.withOptions`, for its handler, and takes `{ handler, config }`.)
    if (typeof p === "function" && "__isOptionsFunction" in p)
      return Object.assign((options?: unknown) => {
        const made = p(options);
        return made && typeof made === "object" ? { ...made, handler: handler(made.handler) } : made;
      }, { __isOptionsFunction: true });
    if (typeof p === "function") return handler(p);
    return p && typeof p === "object" && "handler" in p ? { ...p, handler: handler(p.handler) } : p;
  };
  const { plugins, presets } = config as { plugins?: unknown; presets?: unknown };
  return {
    ...config,
    ...(Array.isArray(plugins) ? { plugins: plugins.map(plugin) } : {}),
    ...(Array.isArray(presets) ? { presets: presets.map((preset) => guarded(preset, log, building)) } : {}),
  };
}
