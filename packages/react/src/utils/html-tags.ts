/**
 * Tags in HTML as a browser's tokenizer reads them, for code that reads markup it's given and writes it again: the
 * Markdown sanitizer (src/markdown/sanitize.ts) and the Tailwind classes inlined in markup (src/tailwind/html.ts).
 * Whitespace is HTML's: no vertical tab, no non-breaking space.
 */

/** An attribute as written: its name (in lower case, as a browser reads it), its value (undefined: none) and where it is. */
export interface Attribute {
  name: string;
  value: string | undefined;
  /** Its value's quote (`"` or `'`), or "" where it has none. */
  quote: string;
  /** Where its name starts, and where it ends (after its value). */
  start: number;
  end: number;
}

/** A tag as a browser reads it: `<img/src=x/onerror=…>` is an `img` whose `src` is `x/onerror=…`. */
export interface Tag {
  close: boolean;
  name: string;
  attributes: Attribute[];
  selfClosing: boolean;
  /** Where its name ends, and where it ends (after its `>`). */
  nameEnd: number;
  end: number;
}

const TAG = /<(\/?)([a-z][^\t\n\f\r />]*)/iy;
const GAP = /[\t\n\f\r /]*/y;
const NAME = /[^\t\n\f\r />][^\t\n\f\r />=]*/y;
const EQUALS = /[\t\n\f\r ]*=[\t\n\f\r ]*/y;
const VALUE = /"([^"]*)"|'([^']*)'|([^\t\n\f\r >"'][^\t\n\f\r >]*)/y;
/** A comment, a doctype, CDATA, `<?xml …>` or `</ …>` (each a comment to a browser), to where it ends. */
const COMMENT = /<!--(?:-?>|[\s\S]*?--!?>|[\s\S]*)|<(?:[!?]|\/(?![a-z]))[^>]*>?/iy;

/** What `re` matches at `i` (its `lastIndex` then where the match ends). */
const at = (re: RegExp, s: string, i: number) => ((re.lastIndex = i), re.exec(s));

/** Where the comment (or what a browser reads as one) at `start` (a `<`) ends; undefined where none starts there. */
export function commentEnd(s: string, start: number): number | undefined {
  return at(COMMENT, s, start) ? COMMENT.lastIndex : undefined;
}

/**
 * The tag at `start` (a `<`): undefined where none starts there, null where the input ends in it (before its `>`, or in
 * a quote left open).
 */
export function readTag(s: string, start: number): Tag | null | undefined {
  const tag = at(TAG, s, start);
  if (!tag) return undefined;
  const attributes: Attribute[] = [];
  const nameEnd = TAG.lastIndex;
  for (let i = nameEnd; ; ) {
    const gap = at(GAP, s, i)![0];
    i = GAP.lastIndex;
    if (i >= s.length) return null;
    if (s[i] === ">") return { close: !!tag[1], name: tag[2].toLowerCase(), attributes, selfClosing: gap.endsWith("/"), nameEnd, end: i + 1 };
    const begin = i;
    const name = at(NAME, s, i)![0].toLowerCase();
    i = NAME.lastIndex;
    let value: string | undefined;
    let quote = "";
    if (at(EQUALS, s, i)) {
      i = EQUALS.lastIndex;
      value = "";
      // (`x=>`: an empty value, and the tag's end.)
      if (s[i] !== ">") {
        const given = at(VALUE, s, i);
        if (!given) return null;
        value = given[1] ?? given[2] ?? given[3];
        quote = given[1] !== undefined ? '"' : given[2] !== undefined ? "'" : "";
        i = VALUE.lastIndex;
      }
    }
    attributes.push({ name, value, quote, start: begin, end: i });
  }
}

/**
 * Where the text of a raw text element (`<script>`, `<style>`, `<textarea>`, …: no tags in it) that starts at `from`
 * ends: at its end tag, or the input's end.
 */
export function rawTextEnd(s: string, name: string, from: number): number {
  const end = at(new RegExp(`</${name}(?=[\\t\\n\\f\\r />]|$)`, "gi"), s, from);
  return end ? end.index : s.length;
}
