/**
 * Rough text widths without a browser: whether a word fits a column on
 * phones, and how wide a table's columns are when their content sizes them.
 * Arial/Helvetica advance widths, padded for wider faces.
 */

/** Arial advance widths in 1/1000 em, ASCII 32 (space) to 126 (~). */
const ARIAL = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, // space to /
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, // 0 to ?
  1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, // @ to O
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, // P to _
  333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, // ` to o
  556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584, // p to ~
];

/** Bold faces and wider families (Inter, SF, Helvetica Neue) run wider than Arial. */
const BOLD = 1.05;
const SAFETY = 1.08;

/**
 * Width in px of `word` at `fontSize` px. `exact` leaves out the padding for wider faces: where widths are
 * compared with each other (columns sharing a row), not with the room there is.
 */
export function wordWidth(word: string, fontSize: number, options: { bold?: boolean; letterSpacing?: number; exact?: boolean } = {}): number {
  let em = 0;
  for (const char of word) {
    const code = char.codePointAt(0)!;
    em += (code >= 32 && code <= 126 ? ARIAL[code - 32] : 600) / 1000;
  }
  const chars = [...word].length;
  return em * fontSize * (options.bold ? BOLD : 1) * (options.exact ? 1 : SAFETY) + (options.letterSpacing ?? 0) * chars;
}

/**
 * The words a browser can't wrap inside: split at spaces and after hyphens.
 * Links and email addresses are left out (they break anywhere in the original too).
 */
export function unbreakableWords(text: string): string[] {
  return text
    .split(/[ \t\r\n]+/)
    .flatMap((word) => word.split(/(?<=-)/))
    .filter((word) => word && !/:\/\/|^www\.|@/.test(word));
}

/** Visible text of an HTML fragment (tags removed, common entities decoded). */
export function htmlText(html: string): string {
  const text = html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, "\u00a0")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
  return /text-transform:\s*uppercase/i.test(html) ? text.toUpperCase() : text;
}

/** A table column: what its content needs (min-content, max-content), and a width it sets, if any (px). */
export interface TableColumn {
  min: number;
  max: number;
  set?: number;
}

/**
 * How wide a full-width table's columns are, as the browser's automatic
 * table layout works it out: a set width holds (at least its content's
 * min-content) and doesn't grow while a column without one is there; the
 * columns without one share the rest by their content. All fit on one line:
 * each gets its max-content and the room left over in proportion to it (an
 * empty one gets none). Otherwise each gets its min-content and the room
 * between that and its max-content in proportion. Too little room: each its
 * min-content (the table runs over).
 */
export function autoTableWidths(columns: TableColumn[], width: number): number[] {
  const out = columns.map((c) => (c.set !== undefined ? Math.max(c.set, c.min) : 0));
  const auto = columns.map((c, i) => (c.set === undefined ? i : -1)).filter((i) => i >= 0);
  if (!auto.length) return out;
  const room = Math.max(0, width - out.reduce((a, b) => a + b, 0));
  const sum = (f: (c: TableColumn) => number) => auto.reduce((a, i) => a + f(columns[i]), 0);
  const maxes = sum((c) => c.max);
  const mins = sum((c) => c.min);
  for (const i of auto) {
    const c = columns[i];
    if (maxes <= room) out[i] = maxes > 0 ? c.max + ((room - maxes) * c.max) / maxes : room / auto.length;
    else if (mins <= room) out[i] = c.min + ((room - mins) * (c.max - c.min)) / (maxes - mins || 1);
    else out[i] = c.min;
  }
  return out;
}
