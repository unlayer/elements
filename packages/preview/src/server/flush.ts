import type { Writable } from "node:stream";

/**
 * Resolves once what's been written to `stream` is written out (to its pipe,
 * file or terminal), so the process can exit without cutting it off. A write's
 * callback comes after the writes before it, where "drain" comes only after a
 * write that returned false: with less buffered than the stream's high water
 * mark, waiting for "drain" would wait forever.
 */
export function flushed(stream: Writable): Promise<void> {
  if (stream.writableLength === 0 || stream.destroyed || stream.writableEnded) return Promise.resolve();
  return new Promise((resolve) => stream.write("", () => resolve()));
}
