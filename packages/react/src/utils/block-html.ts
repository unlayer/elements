/**
 * The HTML each block's exporter writes in a render, by the block's id, for a caller that asks (the new
 * engine's shadow render of a legacy template). Nothing is kept when no one asks.
 */
let listener: ((id: string, html: string) => void) | undefined;

/** Runs `render`, telling `onBlock` each block's id and HTML as its exporter writes it. */
export function recordingBlockHtml<T>(onBlock: (id: string, html: string) => void, render: () => T): T {
  const previous = listener;
  listener = onBlock;
  try {
    return render();
  } finally {
    listener = previous;
  }
}

/** A block's HTML, for the caller that asked (none: nothing happens). */
export function blockHtml(id: unknown, html: string): void {
  if (listener && typeof id === "string") listener(id, html);
}
