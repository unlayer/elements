/**
 * Whether marked (18.0.14's, the version built in) can read a setext heading (a line underlined with `=` or `-`) from a
 * place, told in time that doesn't grow with the text after it. marked tries its rule before each line of a list
 * item's text (`text` takes one line at a time there), and the rule reads every line after it for an underline, to
 * where the text can't go on: an item of 100 KB of lines (`- [a]: b` and `!@`) took 1.5 s. Its rule is
 * `^(?!FIRST)((?:.|\n(?!GOES))+?)\n {0,3}(=+|-+) *(?:\n+|$)`: a heading can only start at a place where an underline
 * follows before the first character the text can't go on to (a `\r`, U+2028 or U+2029, which `.` doesn't read, or a
 * line break before a line `GOES` stops at), and that's worked out once for each text being read.
 */

/** A text being read, with where its underlines, the line breaks the text can't go on past and its line ends are, once found. */
export interface Text {
  text: string;
  found?: { underlines: number[]; stops: number[] };
}

/** The parts of marked's rule (see above), or undefined where it isn't that rule (then it's run as it is). */
function parts(rule: RegExp): { goes: RegExp; tail: RegExp } | undefined {
  const source = rule.source;
  const tail = String.raw`))+?)\n {0,3}(=+|-+) *(?:\n+|$)`;
  const middle = String.raw`)((?:.|\n(?!`;
  const at = source.indexOf(middle);
  if (!source.startsWith("^(?!") || at < 0 || !source.endsWith(tail) || rule.flags.replace(/[dg]/g, "")) return undefined;
  const goes = source.slice(at + middle.length, source.length - tail.length);
  try {
    return { goes: new RegExp(`(?:${goes})`, "y"), tail: /\n {0,3}(=+|-+) *(?:\n+|$)/y };
  } catch {
    return undefined;
  }
}

const known = new WeakMap<RegExp, ReturnType<typeof parts> | null>();

/** The first place in `list` (sorted) at or after `from`, or Infinity. */
function next(list: number[], from: number): number {
  let low = 0;
  let high = list.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (list[mid] < from) low = mid + 1;
    else high = mid;
  }
  return low < list.length ? list[low] : Infinity;
}

/**
 * Whether marked's setext heading rule (`rule`) can match `src`, a suffix of `read`'s text: false only where it can't
 * (it's run where it can, for its token).
 */
export function headingCan(rule: RegExp, read: Text, src: string): boolean {
  let rule_ = known.get(rule);
  if (rule_ === undefined) known.set(rule, (rule_ = parts(rule) ?? null));
  if (!rule_) return true;
  const { text } = read;
  if (!read.found) {
    // Each line break an underline line follows, and each the text can't go on past (the next line a block's start,
    // or blank), and each character `.` doesn't read but `\n` (where the text can't go on either).
    const underlines: number[] = [];
    const stops: number[] = [];
    for (let at = 0; at < text.length; at++) {
      const char = text[at];
      if (char === "\n") {
        rule_.tail.lastIndex = at;
        if (rule_.tail.test(text)) underlines.push(at);
        rule_.goes.lastIndex = at + 1;
        if (rule_.goes.test(text)) stops.push(at);
      } else if (char === "\r" || char === "\u2028" || char === "\u2029") stops.push(at);
    }
    read.found = { underlines, stops };
  }
  const from = text.length - src.length;
  // The heading's text goes on to the first stop (an underline can start there: the line break the text can't take).
  const underline = next(read.found.underlines, from + 1);
  return underline < Infinity && underline <= next(read.found.stops, from);
}
