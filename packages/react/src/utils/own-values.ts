/**
 * A custom tool's values for one render: its definition's (its `values`, its options' `defaultValue`s) under what the
 * element gives, every plain object and array in them the render's own. So an exporter or a head that changes a value
 * it's given, or an app that changes a render's design in place, changes nothing of the definition's, nor of another
 * render's (ARCHITECTURE.md: no object of the design is the defaults').
 */
import { mergeValues } from "@unlayer-internal/shared-elements";

/** `value` with each plain object and array in it copied (anything else, a class's instance, a function, as it is). */
export function own<T>(value: T, depth = 0): T {
  if (value === null || typeof value !== "object" || depth > 64) return value;
  if (Array.isArray(value)) return value.map((item) => own(item, depth + 1)) as T;
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) return value;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(value)) out[key] = own((value as Record<string, unknown>)[key], depth + 1);
  return out as T;
}

export const ownValues = <T extends Record<string, any>>(defaults: T, given?: Partial<T>): T => own(mergeValues(defaults, given));
