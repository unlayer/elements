/**
 * State that every copy of Elements in the process shares (a slot on globalThis, by Symbol.for), kept apart by React:
 * what a copy keeps there is about its React and that React's react-dom (the contexts a lazy component's render reads,
 * the static renders under way and the modules they render with), so a copy on another React (another major, or another
 * install of one) has its own, and copies on one React share it. Where the slot holds what isn't this protocol's (an
 * older copy's), this copy keeps its own (for the life of the process: every copy of this one on this React finds it).
 */
const OWN = new Map<symbol, WeakMap<object, unknown>>();

/** `key`'s value for the React `react` identifies (one of its functions), `make`'s the first time it's asked for. */
export function perReact<T>(key: symbol, react: object, make: () => T): T {
  const global = globalThis as Record<symbol, unknown>;
  let byReact = global[key];
  if (!(byReact instanceof WeakMap)) {
    if (byReact === undefined) global[key] = byReact = new WeakMap<object, unknown>();
    else {
      if (!OWN.has(key)) OWN.set(key, new WeakMap<object, unknown>());
      byReact = OWN.get(key)!;
    }
  }
  const map = byReact as WeakMap<object, unknown>;
  if (!map.has(react)) map.set(react, make());
  return map.get(react) as T;
}
