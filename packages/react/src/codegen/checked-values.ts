/**
 * Whether a component's `values`, as the design has them, type-check as its `values` prop. That prop checks keys, at
 * every depth, and takes any text, number, true or false in any of them (see `ValuesInput`): so they type-check where
 * every key is one its type has, and every object or list is under a key whose type has one. Where they don't (a key a
 * newer builder writes), the module writes them `as unknown as <Component>Props["values"]`, which always compiles.
 * The keys come from the types themselves (values-shapes.ts, which codegen's type-check test keeps current).
 */
import { VALUES_SHAPES, type Shape } from "./values-shapes";
import { isPlainObject, type Plain } from "./values";

const own = (object: object, key: string) => Object.prototype.hasOwnProperty.call(object, key);

/** Whether `value` fits a key of shape `shape`. */
function fits(value: unknown, shape: Shape): boolean {
  if (shape === 1 || value === null || typeof value !== "object") return true;
  if (Array.isArray(value)) return Array.isArray(shape) && value.every((item) => fits(item, shape[0]));
  return isPlainObject(value) && shape !== 0 && !Array.isArray(shape) && keysFit(value, shape);
}

const keysFit = (values: Plain, shape: { [key: string]: Shape }) => Object.entries(values).every(([key, value]) => value === undefined || (own(shape, key) && fits(value, shape[key])));

/** Device settings (`_override`): the component's own keys, for a phone or a desktop, and whether it's hidden there. */
function overrideFits(override: unknown, shape: { [key: string]: Shape }): boolean {
  if (override === null || typeof override !== "object") return true;
  if (!isPlainObject(override)) return false;
  const devices: Record<string, { [key: string]: Shape }> = { mobile: { ...shape, hideMobile: 0 }, desktop: { ...shape, hideDesktop: 0 } };
  return Object.entries(override).every(([device, settings]) => settings === undefined || (own(devices, device) && fits(settings, devices[device])));
}

/** Whether `values` type-check as `component`'s `values` prop written as they are. */
export function valuesTypeCheck(component: string, values: Plain): boolean {
  const shape = own(VALUES_SHAPES, component) ? VALUES_SHAPES[component] : 0;
  if (shape === 1) return true;
  if (shape === 0 || Array.isArray(shape)) return false;
  const { _override, ...rest } = values;
  return keysFit(rest, shape) && overrideFits(_override, shape);
}
