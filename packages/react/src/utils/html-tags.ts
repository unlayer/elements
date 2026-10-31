/**
 * Tags in HTML as a browser's tokenizer reads them, for code that reads markup it's given and writes it again: the
 * Markdown sanitizer (src/markdown/sanitize.ts), the rich text in a block's children (src/utils/inline-html.ts), the
 * Tailwind classes inlined in markup (src/tailwind/html.ts) and a block's HTML in an exported document
 * (src/codegen/text.ts).
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

/** Elements whose text has no tags in it, to their end tag (`plaintext`: to the end). */
export const RAW_TEXT = /^(script|style|textarea|title|xmp|iframe|noembed|noframes|plaintext)$/;

/**
 * Each tag in `html` as a browser reads it, with where it starts (`lt`): comments, raw text (`<script>`, `<style>`,
 * `<textarea>`, …) and what isn't a tag passed over, up to a tag the markup ends in (left as it is).
 */
export function tags(html: string, visit: (tag: Tag, lt: number) => void): void {
  for (let i = 0; i < html.length; ) {
    const lt = html.indexOf("<", i);
    if (lt < 0) break;
    const comment = commentEnd(html, lt);
    if (comment !== undefined) {
      i = comment;
      continue;
    }
    const tag = readTag(html, lt);
    if (tag === undefined) {
      i = lt + 1;
      continue;
    }
    if (!tag) break;
    i = tag.end;
    visit(tag, lt);
    if (!tag.close && RAW_TEXT.test(tag.name)) i = tag.name === "plaintext" ? html.length : rawTextEnd(html, tag.name, i);
  }
}

const VOID = new Set("area base br col embed hr img input link meta param source track wbr".split(" "));

/** What a start tag closes first, as a browser's parser does: the element it ends, and where it stops looking for it. */
const BUTTON_SCOPE = ["applet", "button", "caption", "html", "marquee", "object", "table", "td", "template", "th"];
const SPECIAL = ["address", "applet", "area", "article", "aside", "blockquote", "button", "caption", "center", "col", "colgroup", "dd", "details", "dir", "dl", "dt", "fieldset", "figcaption", "figure", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "header", "hgroup", "hr", "li", "main", "marquee", "menu", "nav", "object", "ol", "p", "pre", "section", "summary", "table", "tbody", "td", "template", "tfoot", "th", "thead", "tr", "ul"];
const CLOSES_P = new Set("address article aside blockquote center dd details dialog dir div dl dt fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hgroup hr li listing main menu nav ol p pre search section summary table ul xmp".split(" "));
const IN_TABLE = new Set(["table", "tbody", "thead", "tfoot", "tr", "colgroup"]);
const HEADING = /^h[1-6]$/;
const RULES: Array<{ starts: (name: string) => boolean; closes: string[]; stops: string[] }> = [
  { starts: (name) => CLOSES_P.has(name), closes: ["p"], stops: BUTTON_SCOPE },
  { starts: (name) => name === "li", closes: ["li"], stops: [...BUTTON_SCOPE, "ol", "ul"] },
  { starts: (name) => name === "dd" || name === "dt", closes: ["dd", "dt"], stops: SPECIAL.filter((name) => !/^(address|div|p|dd|dt)$/.test(name)) },
  { starts: (name) => name === "tr", closes: ["tr"], stops: ["html", "table", "template"] },
  { starts: (name) => name === "td" || name === "th" || name === "tr", closes: ["td", "th"], stops: ["html", "table", "template"] },
  { starts: (name) => /^(tbody|thead|tfoot)$/.test(name), closes: ["tbody", "thead", "tfoot"], stops: ["html", "table", "template"] },
];

/**
 * HTML written again from what was read (sanitized HTML, Markdown's, a block's rich text), its tags balanced: an end
 * tag of nothing open left out, what it closes past (opened after the element it ends) closed with it, and what's
 * still open closed at the end. So HTML from a reply can't end the block, column or table it's in
 * (`</td></tr></table>`), or run on into what's after it (an `<a href>` or `<b>` it doesn't end). A start tag that a
 * browser's parser takes to end what's open first closes it here too (a `<table>` straight in a table, a `<p>` or a
 * block in a `<p>`, an `<li>` in an `<li>`, a cell in a cell, a row in a row, a heading in a heading): written as one
 * more end tag past that, it would end the block's own table, which the browser closed already.
 */
export function balanced(html: string): string {
  const open: string[] = [];
  // (Where each name is open, innermost last: an end tag of one that isn't is left out at once, and a start tag finds
  // what it closes, and where a scope stops it, without reading what's open.)
  const at = new Map<string, number[]>();
  const top = (name: string) => {
    const list = at.get(name);
    return list?.length ? list[list.length - 1] : -1;
  };
  const push = (name: string) => {
    (at.get(name) ?? at.set(name, []).get(name)!).push(open.length);
    open.push(name);
  };
  /** End tags for what's open down to place `to`, it included. */
  const closeTo = (to: number) => {
    let ends = "";
    while (open.length > to) {
      const last = open.pop()!;
      at.get(last)!.pop();
      ends += `</${last}>`;
    }
    return ends;
  };
  const out = html.replace(/<(\/?)([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*>/g, (tag, close: string, given: string) => {
    const name = given.toLowerCase();
    if (VOID.has(name) && name !== "hr") return close ? "" : tag;
    if (!close) {
      let ends = "";
      for (const rule of RULES) {
        if (!rule.starts(name)) continue;
        const found = Math.max(...rule.closes.map(top));
        if (found >= 0 && found > Math.max(...rule.stops.map(top))) ends += closeTo(found);
      }
      // A table straight in a table (not in a cell or a caption): the open one ends first.
      if (name === "table" && open.length && IN_TABLE.has(open[open.length - 1])) ends += closeTo(top("table"));
      // A heading in a heading.
      if (HEADING.test(name) && open.length && HEADING.test(open[open.length - 1])) ends += closeTo(open.length - 1);
      if (name === "hr") return ends + tag;
      push(name);
      return ends + tag;
    }
    if (name === "hr") return "";
    return top(name) < 0 ? "" : closeTo(top(name));
  });
  return out + open.reverse().map((n) => `</${n}>`).join("");
}
