/**
 * Reading HTML for its plain text (html-to-text.ts) in time linear in its size, whatever it holds. The converter's
 * regexes (`/<li[^>]*>([\s\S]*?)<\/li>/`, `/<img[^>]+alt=…/`) look from each place they could start to the end of the
 * text where nothing ends them, again from the next: 40 KB of unclosed `<img alt="a" ` took a minute. These find the
 * same matches, by finding each string's places once.
 */

/** Where `pattern` (global) next matches in a text, at or after a place, or -1: the text read once for it. */
export type Next = (from: number) => number;

/** The first place in `sorted` (ascending) whose number is `value` or more: a binary search. */
function firstFrom(sorted: ArrayLike<number>, value: number): number {
  let low = 0;
  let high = sorted.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (sorted[mid] < value) low = mid + 1;
    else high = mid;
  }
  return low;
}

/**
 * Where `pattern` (global, its matches never overlapping) matches in `text`, each found once, as far as asked: in any
 * order, a place is a binary search.
 */
export function places(text: string, pattern: RegExp): Next {
  const at: number[] = [];
  let read = 0;
  return (from) => {
    while ((!at.length || at[at.length - 1] < from) && read <= text.length) {
      pattern.lastIndex = read;
      const match = pattern.exec(text);
      if (!match) read = text.length + 1;
      else {
        at.push(match.index);
        read = match.index + 1;
      }
    }
    const low = firstFrom(at, from);
    return low < at.length ? at[low] : -1;
  };
}

const WORD = /\w/;
/** Whether `char` is a regex word character (`\w`); none past the text's end. */
export const isWord = (char: string | undefined) => char !== undefined && WORD.test(char);

/**
 * `text` with parts of it replaced, read from each `<` on: `read` gives for one where the part starting there ends and
 * what replaces it, else where to look for the next `<` from (nothing replaced), or nothing, which ends the reading.
 */
export function rewrite(text: string, read: (at: number) => [end: number, by: string] | number | undefined): string {
  let out = "";
  let kept = 0;
  for (let at = text.indexOf("<"); at >= 0; ) {
    const part = read(at);
    if (part === undefined) break;
    if (typeof part === "number") at = text.indexOf("<", part);
    else {
      out += text.slice(kept, at) + part[1];
      at = text.indexOf("<", (kept = part[0]));
    }
  }
  return out + text.slice(kept);
}

/**
 * Each element `<name…>…close` in `text` replaced, as `/<name[^>]*>([\s\S]*?)close/gi` replaces them (`name` the start
 * of its start tag, a sticky regex: `/<h[12]/iy`; `bounded`, with `\b` after it): the start tag to its first `>`, then
 * what's in it to the first `close` after. `replace` is given the element and what's in it; `after`, a sticky regex,
 * takes what follows the end tag into the element when it's there (`(\s*<\/td>)?`).
 */
export function replaceElements(
  text: string,
  name: RegExp,
  close: RegExp,
  replace: (element: string, content: string, after: string | undefined) => string,
  { bounded = false, after }: { bounded?: boolean; after?: RegExp } = {}
): string {
  const gt = places(text, />/g);
  const end = places(text, close);
  return rewrite(text, (at) => {
    name.lastIndex = at;
    if (!name.test(text) || (bounded && isWord(text[name.lastIndex]))) return at + 1;
    // Its start tag's `>`, then its end tag: where there's none, there's none after a later start either.
    const open = gt(name.lastIndex);
    const closing = open < 0 ? -1 : end(open + 1);
    if (closing < 0) return;
    close.lastIndex = closing;
    let stop = closing + close.exec(text)![0].length;
    let extra: string | undefined;
    if (after) {
      after.lastIndex = stop;
      extra = after.exec(text)?.[0];
      if (extra) stop += extra.length;
    }
    return [stop, replace(text.slice(at, stop), text.slice(open + 1, closing), extra)];
  });
}

/**
 * Each tag `<name…>` (a sticky regex for its start) in `text` to its first `>` replaced, as `/<name[^>]*>/gi` replaces
 * them (`/<img[^>]*\/?>/`, `/<hr[^>]*\/?>/` too: the `/` is in what's before the `>`).
 */
export function replaceTags(text: string, name: RegExp, replace: (tag: string) => string): string {
  const gt = places(text, />/g);
  return rewrite(text, (at) => {
    name.lastIndex = at;
    if (!name.test(text)) return at + 1;
    const close = gt(name.lastIndex);
    return close < 0 ? undefined : [close + 1, replace(text.slice(at, close + 1))];
  });
}

/**
 * Where each place's attributes end in `text`, as `(?:[^>"']|"[^"]*"|'[^']*')*>` reads them from it: the `>` after
 * them (a quoted value's `>` aside), or -1 where a quote isn't closed or no `>` follows. Worked out once, from the
 * text's end.
 */
export function attributeEnds(text: string): Int32Array {
  const ends = new Int32Array(text.length + 1);
  ends[text.length] = -1;
  let double = -1;
  let single = -1;
  for (let i = text.length - 1; i >= 0; i--) {
    const char = text[i];
    if (char === ">") ends[i] = i;
    else if (char === '"' || char === "'") {
      const close = char === '"' ? double : single;
      ends[i] = close < 0 ? -1 : ends[close + 1];
      if (char === '"') double = i;
      else single = i;
    } else ends[i] = ends[i + 1];
  }
  return ends;
}

/**
 * `text` without each `open…close`, as `/<head[\s\S]*?<\/head>/gi` takes them out (`open` a sticky regex): from where
 * it opens to the first `close` after. Where none closes, none after it does.
 */
export function removeBetween(text: string, open: RegExp, close: RegExp): string {
  const end = places(text, close);
  return rewrite(text, (at) => {
    open.lastIndex = at;
    if (!open.test(text)) return at + 1;
    const closing = end(open.lastIndex);
    if (closing < 0) return;
    close.lastIndex = closing;
    return [closing + close.exec(text)![0].length, ""];
  });
}

/**
 * Each image with alt text replaced, as `/<img[^>]+alt=["']([^"']+)["'][^>]*\/?>/gi` replaces it: the last `alt=` before
 * the tag's first `>` (after a character of it) whose value is quoted, isn't empty and is followed by a `>`, to that
 * `>`. Which `alt=`s are so is worked out once for each.
 */
export function replaceAltImages(text: string, replace: (alt: string) => string): string {
  const gt = places(text, />/g);
  const quote = places(text, /["']/g);
  const alts = places(text, /alt=/gi);
  // The `alt=`s found so far, in order, and for each the last one up to it whose value works (-1: none).
  const found: number[] = [];
  const working: number[] = [];
  const ends: number[] = [];
  /** The last `alt=` before `before` (worked out as far as needed), as an index in `found`, or -1. */
  const lastBefore = (before: number): number => {
    for (let next = alts(found.length ? found[found.length - 1] + 1 : 0); next >= 0 && next < before; next = alts(next + 1)) {
      const value = next + 5;
      const close = /["']/.test(text[next + 4] ?? "") ? quote(value) : -1;
      const end = close > value ? gt(close + 1) : -1;
      found.push(next);
      ends.push(end);
      working.push(end >= 0 ? found.length - 1 : working.length ? working[working.length - 1] : -1);
    }
    return firstFrom(found, before) - 1;
  };
  const start = /<img/iy;
  return rewrite(text, (at) => {
    start.lastIndex = at;
    if (!start.test(text)) return at + 1;
    const first = gt(at + 4);
    if (first < 0) return;
    const last = lastBefore(first);
    const alt = last >= 0 ? working[last] : -1;
    if (alt < 0 || found[alt] < at + 5) return at + 1;
    const value = found[alt] + 5;
    return [ends[alt] + 1, replace(text.slice(value, quote(value)))];
  });
}

/**
 * Markup without its tags, as `/<(?!%[^<>]*%>)[^>]+>/g` takes them out: from a `<` to the first `>` after a character
 * of it. An email service's tag (`<%first_name%>`, SendGrid's; `<%= name %>`) isn't one: it's text to a browser too (a
 * tag's name starts with a letter), which the service fills in, so it stays.
 */
export function untagged(text: string): string {
  if (!text.includes("<")) return text;
  const gt = places(text, />/g);
  const angle = places(text, /[<>]/g);
  return rewrite(text, (at) => {
    if (text[at + 1] === "%") {
      const end = angle(at + 2);
      if (end > at + 2 && text[end] === ">" && text[end - 1] === "%") return at + 1;
    }
    const close = gt(at + 1);
    if (close < 0) return;
    return close === at + 1 ? at + 1 : [close + 1, ""];
  });
}

const VOID = /^(area|br|col|embed|hr|img|input|link|meta|source|wbr)$/i;

/**
 * `html` without the elements `test` picks by their start tag (what's in them goes too, nested ones of their name
 * counted), as reading each start tag (`/<([a-z][\w-]*)\b[^>]*>/gi`) and then the tags of its name after it
 * (`/<(\/?)name\b[^>]*>/gi`, its own closing it at depth 0) takes them out: read once, the tags of every name indexed
 * together where one is first picked.
 */
export function withoutElements(html: string, test: (tag: string) => boolean): string {
  const gt = places(html, />/g);
  let index: Map<string, { at: number[]; sums: number[]; below: Int32Array }> | undefined;
  /** The tags of each name (a tag of `a-b` is one of `a` too: `<a\b` reads it), each `>` once, and where each closes. */
  const build = () => {
    const groups = new Map<string, { at: number[]; step: number[]; last: number }>();
    const tag = /<(\/?)([a-z][\w-]*)/iy;
    for (let at = html.indexOf("<"); at >= 0; at = html.indexOf("<", at + 1)) {
      tag.lastIndex = at;
      const m = tag.exec(html);
      if (!m) continue;
      const nameStart = at + 1 + m[1].length;
      const runEnd = nameStart + m[2].length;
      const close = gt(runEnd);
      if (close < 0) break;
      for (let end = nameStart + 1; end <= runEnd; end++) {
        if (isWord(html[end - 1]) === isWord(html[end])) continue;
        const name = html.slice(nameStart, end).toLowerCase();
        let group = groups.get(name);
        if (!group) groups.set(name, (group = { at: [], step: [], last: -1 }));
        // Of the tags of a name sharing a `>`, the first is read: the rest are in it.
        if (close === group.last) continue;
        group.last = close;
        group.at.push(close + 1);
        group.step.push(html[close - 1] === "/" ? 0 : m[1] ? -1 : 1);
      }
    }
    index = new Map();
    for (const [name, { at, step }] of groups) {
      // The depth after each tag, and for each, the first tag after it where the depth is lower (its element's end).
      const sums = [0];
      for (const s of step) sums.push(sums[sums.length - 1] + s);
      const below = new Int32Array(sums.length).fill(-1);
      const stack: number[] = [];
      for (let k = sums.length - 1; k >= 0; k--) {
        while (stack.length && sums[stack[stack.length - 1]] >= sums[k]) stack.pop();
        below[k] = stack.length ? stack[stack.length - 1] : -1;
        stack.push(k);
      }
      index.set(name, { at, sums, below });
    }
  };
  const open = /<([a-z][\w-]*)/iy;
  return rewrite(html, (at) => {
    open.lastIndex = at;
    const m = open.exec(html);
    if (!m) return at + 1;
    // Its name: the longest start of its letters, digits, `_` and `-` that a word boundary ends.
    let nameEnd = at + 1 + m[1].length;
    while (isWord(html[nameEnd - 1]) === isWord(html[nameEnd])) nameEnd--;
    const close = gt(nameEnd);
    if (close < 0) return;
    if (!test(html.slice(at, close + 1))) return close + 1;
    let end = close + 1;
    const name = html.slice(at + 1, nameEnd);
    if (html[close - 1] !== "/" && !VOID.test(name)) {
      if (!index) build();
      const group = index!.get(name.toLowerCase());
      if (group) {
        // The first of its name's tags after its start tag, and where the depth from there first falls below it.
        const ends = group.below[firstFrom(group.at, end + 1)];
        if (ends > 0) end = group.at[ends - 1];
      }
    }
    return [end, ""];
  });
}

/**
 * Each link replaced, as `/<a\b((?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/a>/gi` replaces it: its attributes to the
 * first `>` outside a quoted value, then what's in it to the first `</a>` after. `replace` is given the link, its
 * attributes and what's in it.
 */
export function replaceLinks(text: string, replace: (link: string, attributes: string, content: string) => string): string {
  const close = places(text, /<\/a>/gi);
  let ends: Int32Array | undefined;
  return rewrite(text, (at) => {
    if ((text[at + 1] !== "a" && text[at + 1] !== "A") || isWord(text[at + 2])) return at + 1;
    ends ??= attributeEnds(text);
    const open = ends[at + 2];
    const closing = open < 0 ? -1 : close(open + 1);
    return closing < 0 ? at + 1 : [closing + 4, replace(text.slice(at, closing + 4), text.slice(at + 2, open), text.slice(open + 1, closing))];
  });
}
