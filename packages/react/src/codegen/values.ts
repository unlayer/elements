/** Small helpers for design values: plain objects, deep equality, and what differs from a default. */

export type Plain = Record<string, any>;

export function isPlainObject(value: unknown): value is Plain {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/** Deep equality for JSON-like values (a key holding `undefined` counts as missing). */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }
  if (!isPlainObject(a) || !isPlainObject(b)) return false;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) if (!deepEqual(a[key], b[key])) return false;
  return true;
}

/**
 * The part of `value` that differs from `defaults`: keys equal to their default are left out, and an object's keys
 * are compared one by one (a nested object is merged into its default, so only what differs needs saying).
 * `undefined` when nothing differs.
 */
export function differences(value: unknown, defaults: unknown): unknown {
  if (deepEqual(value, defaults)) return undefined;
  if (!isPlainObject(value) || !isPlainObject(defaults)) return value;
  const out: Plain = {};
  for (const [key, item] of Object.entries(value)) {
    if (item === undefined) continue;
    if (!(key in defaults)) out[key] = item;
    else {
      const diff = differences(item, defaults[key]);
      if (diff !== undefined) out[key] = diff;
    }
  }
  return Object.keys(out).length ? out : undefined;
}

/** A copy without the given keys. */
export function omit(value: Plain, keys: Iterable<string>): Plain {
  const out = { ...value };
  for (const key of keys) delete out[key];
  return out;
}

/** An identifier JavaScript accepts as a property name or JSX attribute without quotes. */
export const isIdentifier = (name: string): boolean => /^[A-Za-z_$][\w$]*$/.test(name);

/** A component name: PascalCase letters and digits, starting with a letter. */
export function componentIdentifier(name: string | undefined, fallback = "Template"): string {
  const words = String(name ?? "").match(/[A-Za-z0-9]+/g) ?? [];
  const pascal = words.map((w) => w[0].toUpperCase() + w.slice(1)).join("");
  return /^[A-Z]/.test(pascal) ? pascal : fallback;
}
