/**
 * On Elements' own component types (its blocks, Rows, Columns and roots), the type itself. A component of yours that
 * copied their statics (a HOC, as React's docs say to, with `hoist-non-react-statics`) has the one it wraps there, so
 * it's yours, called as written: its props, the ones it adds (a link's tracking, a color), are the block's.
 */
export const SELF = Symbol.for("@unlayer/react-elements/self");

/** `type` marked as its own (see SELF). */
export function own<T extends object>(type: T): T {
  (type as Record<symbol, unknown>)[SELF] = type;
  return type;
}

/**
 * Whether `type` is the component its statics say, not one that copied them (an older copy's have no SELF; a symbol,
 * a Fragment's or a <Suspense>'s, has no statics).
 */
export const isOwnType = (type: unknown): boolean => (typeof type !== "object" && typeof type !== "function") || type === null || !(SELF in type) || (type as Record<symbol, unknown>)[SELF] === type;
