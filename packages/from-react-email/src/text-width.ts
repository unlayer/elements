/**
 * Rough text widths, for deciding whether a word fits a column on phones
 * without a browser. Arial/Helvetica advance widths, padded for wider faces.
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

/** Width in px of `word` at `fontSize` px. */
export function wordWidth(word: string, fontSize: number, options: { bold?: boolean; letterSpacing?: number } = {}): number {
  let em = 0;
  for (const char of word) {
    const code = char.codePointAt(0)!;
    em += (code >= 32 && code <= 126 ? ARIAL[code - 32] : 600) / 1000;
  }
  const chars = [...word].length;
  return em * fontSize * (options.bold ? BOLD : 1) * SAFETY + (options.letterSpacing ?? 0) * chars;
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
