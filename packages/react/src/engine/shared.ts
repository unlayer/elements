/**
 * What the components of one render share (the work left to its Markdown and code blocks, together): the render's,
 * keyed by whoever keeps something in it. Kept in one slot on globalThis (by Symbol.for), for every copy of Elements in
 * the process, so a copy's Markdown and code entries read the render another copy runs.
 */
export type Shared = Record<symbol, unknown>;
const SLOT = Symbol.for("@unlayer/react-elements/render-work");
const SLOT_VERSION = 1;
type Slot = { version: number; shared: Shared | undefined };
const slot: Slot = (() => {
  const global = globalThis as Record<symbol, Slot | undefined>;
  const found = global[SLOT];
  if (found?.version === SLOT_VERSION) return found;
  const own: Slot = { version: SLOT_VERSION, shared: undefined };
  if (!found) global[SLOT] = own;
  return own;
})();
export const sharedNow = (): Shared | undefined => slot.shared;

/** `fn`, called with what `share` is shared with (see `slot`). */
export function sharing<T>(share: Shared | undefined, fn: () => T): T {
  const outer = slot.shared;
  slot.shared = share;
  try {
    return fn();
  } finally {
    slot.shared = outer;
  }
}
