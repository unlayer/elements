/**
 * A config's plugins kept from throwing into Tailwind's compiler as it builds. Tailwind keeps every class it was given
 * and builds them all again with the next new one, so a plugin's function that throws for one class (a class from
 * data) would fail every build after it: every render's with that handle, other tenants' too. What such a function
 * (a utility's or component's for a value, `matchUtilities` and `matchComponents`; a variant's, `matchVariant`) throws
 * while a build runs, or gives that can't be read as CSS (a quote or a bracket left open, a comment: see `readable`), is
 * logged instead, and the class gives no CSS; the reader (declarations.ts) fails the component whose class it was, where
 * it's read, or leaves the class out.
 */
import { readable, type PluginFailure } from "./declarations";

type Api = Record<string, any>;
type Fn = (this: unknown, ...args: any[]) => unknown;

/** The keys of a function's `values` that give `value` (none: undefined, any of the function's classes). */
function keysOf(values: unknown, value: unknown): string[] | undefined {
  if (!values || typeof values !== "object") return undefined;
  const keys = Object.keys(values).filter((key) => (values as Record<string, unknown>)[key] === value);
  return keys.length ? keys : undefined;
}

/** Whether what a plugin's function gave reads as CSS: each string in it, a key or a value, as `readable` takes a class. */
const clean = (out: unknown, depth = 0): boolean =>
  typeof out === "string" ? readable(out) : out && typeof out === "object" && depth < 32 ? Object.entries(out).every(([key, value]) => readable(key) && clean(value, depth + 1)) : true;

/**
 * `config` with its plugins' (and its presets' plugins') functions for a class kept from throwing into a build
 * (`building()`): each failure goes to `log`, the class giving no CSS (a utility nothing, a variant no selector).
 * Outside a build (Tailwind tries a variant's function as it registers it) they're called as they are.
 */
export function guarded<T>(config: T, log: PluginFailure[], building: () => boolean): T {
  if (!config || typeof config !== "object") return config;
  const guard = (fn: Fn, name: string, variant: boolean, values: unknown): Fn =>
    function (value, extra) {
      if (!building()) return fn.call(this, value, extra);
      let out: unknown;
      try {
        out = fn.call(this, value, extra);
      } catch (error) {
        log.push({ name, variant, keys: keysOf(values, value), error });
        return variant ? [] : {};
      }
      if (clean(out)) return out;
      log.push({ name, variant, keys: keysOf(values, value) });
      return variant ? [] : {};
    };
  const api = (given: Api): Api => {
    const own = Object.create(given) as Api;
    for (const method of ["matchUtilities", "matchComponents"])
      if (typeof given[method] === "function")
        own[method] = (fns: Record<string, unknown>, options?: Api) =>
          given[method](Object.fromEntries(Object.entries(fns ?? {}).map(([name, fn]) => [name, typeof fn === "function" ? guard(fn as Fn, name, false, options?.values) : fn])), options);
    if (typeof given.matchVariant === "function") own.matchVariant = (name: string, fn: unknown, options?: Api) => given.matchVariant(name, typeof fn === "function" ? guard(fn as Fn, name, true, options?.values) : fn, options);
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
