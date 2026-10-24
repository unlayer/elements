/**
 * What a quote costs marked (18.0.14's, the version built in) to read, and where to end it when that's more than is
 * left. marked reads a quote a chunk at a time: its `>` lines, up to a line without one that continues its paragraph
 * (a lazy line), then the lazy lines with the `>` lines after them, and so on. After each chunk it copies the lines
 * left; where the chunk ends in a list, it reads that list again with all the lines left (joining them, and the quote
 * so far, once more); where it ends in a quote, that quote, once. So a quote with a lazy line every other line took time
 * growing with its size squared: `>- a\nb\n` repeated took 1.5 s for 50 KB and 6.6 s for 100 KB, `> a\nb\n` 15 s for
 * 800 KB. And each quote looks to its end, so a line that ends a quote at once, repeated (`> ```\na\n`), did too.
 *
 * The work counted here is marked's for a quote, at the most: its characters (marked looks for its end, splits it into
 * lines and reads each chunk), the lines left after each chunk, and the quote's characters again for each chunk that
 * can end in a list and once where one can end in a quote.
 */

/**
 * How a quote is read: all of it (`cut` undefined), or up to `cut`, its first chunk's end (a quote of one chunk is read
 * at once); and the work counted for it.
 */
export type QuoteRead = { cut?: number; work: number };

const QUOTE = / {0,3}>/y;
const MARKER = / {0,3}>[ \t]?/y;
const BLANK = /[ \t]*(?:\n|$)/y;
/** A line that can start a list, after its `>`: its bullet or number at any indentation. */
const BULLET = /[ \t]*(?:[*+-]|\d{1,9}[.)])(?:[ \t\n]|$)/y;
/** A line that can start a quote, after its `>`. */
const NESTED = /[ \t]*>/y;
/** A line that may add no block of its own (blank, or a link's definition): a list before it is still the last block. */
const INERT = /[ \t]*(?:\[|\n|$)/y;

const at = (pattern: RegExp, src: string, index: number): boolean => {
  pattern.lastIndex = index;
  return pattern.test(src);
};

/** Where a `>` line's content starts: after its `>` and a space or tab. */
const content = (src: string, index: number): number => {
  MARKER.lastIndex = index;
  MARKER.test(src);
  return MARKER.lastIndex;
};

/**
 * How a quote at the start of `src` is read with `left` work left: all of it where its work fits, else its first chunk
 * (cut before its first line without a `>`, which is read on as Markdown outside the quote: nothing is left out). The
 * text is read only as far as it's needed: to the quote's end at the most, no further than `left` (and the first
 * chunk's end) where that's less. With `again` (a quote marked reads again), past the work it isn't read: `cut` is 0.
 */
export function readQuote(src: string, left: number, again = false): QuoteRead {
  let off = 0;
  let line = 0;
  // Whether the line before is a `>` line; where the first chunk ends.
  let quoted = false;
  let first: number | undefined;
  // The chunks that ended (and the lines before each), and those of them that can end in a list.
  let chunks = 0;
  let before = 0;
  let lists = 0;
  // In the chunk being read: whether it can end in a list, whether it may add no block; and whether the quote can hold one.
  let list = false;
  let inert = true;
  let wasList = false;
  let nested = false;
  const work = () => off + (chunks * line - before) + lists * off + (nested ? off : 0);
  const over = (): QuoteRead | undefined => (again ? { cut: 0, work: 0 } : first !== undefined ? { cut: first, work: Infinity } : undefined);
  if (again && left < 0) return { cut: 0, work: 0 };
  for (;;) {
    const quote = at(QUOTE, src, off);
    if (!quote && (off >= src.length || at(BLANK, src, off))) break;
    if (!quote && quoted) {
      // A chunk ends.
      first ??= off;
      wasList = list || (inert && wasList);
      if (wasList) lists++;
      chunks++;
      before += line;
      list = false;
      inert = true;
    }
    const text = quote ? content(src, off) : off;
    if (at(BULLET, src, text)) list = true;
    if (!at(INERT, src, text)) inert = false;
    if (quote && at(NESTED, src, text)) nested = true;
    quoted = quote;
    const end = src.indexOf("\n", off);
    line++;
    off = end < 0 ? src.length : end + 1;
    if (end < 0) break;
    // Past what's left already (it only grows as more is read).
    if (work() > left) {
      const read = over();
      if (read) return read;
    }
  }
  return work() <= left || !chunks ? { work: work() } : over()!;
}
