/**
 * The HTML each block's exporter writes in a render, for a caller that asks (the new engine's render of a template of
 * today's components, for the blocks it keeps as they're written). Blocks are numbered in the order the render meets
 * them, which is the design's (rows, their columns, their blocks); a block the caller doesn't want isn't written at
 * all. Nothing happens when no one asks.
 */
interface Recording {
  /** Whether the caller wants block `n`'s HTML (one it doesn't isn't written). */
  wants(n: number): boolean;
  /** Block `n`'s HTML ("" where it writes none in this output). */
  block(n: number, html: string): void;
  next: number;
}

let recording: Recording | undefined;

/** Runs `render`, telling `block` the HTML of each block `wants` says it wants, by its number in the render. */
export function recordingBlockHtml<T>(wants: (n: number) => boolean, block: (n: number, html: string) => void, render: () => T): T {
  const previous = recording;
  recording = { wants, block, next: 0 };
  try {
    return render();
  } finally {
    recording = previous;
  }
}

/**
 * The next block's number in a render that records them, and whether it's written: undefined where nothing records
 * (it's written).
 */
export function nextBlock(): { n: number; wanted: boolean } | undefined {
  if (!recording) return undefined;
  const n = recording.next++;
  return { n, wanted: recording.wants(n) };
}

/** Block `n`'s HTML, for the caller that asked. */
export function blockHtml(n: number | undefined, html: string): void {
  if (recording && n !== undefined) recording.block(n, html);
}
