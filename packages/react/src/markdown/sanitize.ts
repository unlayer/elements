/**
 * What Markdown can hold that an email shouldn't: URLs that run code (`javascript:`), and raw HTML with scripts,
 * event handlers, frames or forms. Raw HTML is kept to tags and attributes that only display (allowlists), read in one
 * pass as a browser reads it and written again: what's left out can't join what's around it into a tag.
 */

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "`": "&#96;" };

/** Text as HTML; an entity reference written in it (`&copy;`) is kept, as Markdown keeps it. */
export const escapeText = (text: string) => text.replace(/&(?!#\d+;|#x[\da-f]+;|[a-z][\da-z]*;)|[<>"]/gi, (ch) => ESCAPES[ch]);
/** An attribute's value: every `&` escaped too, so an entity in a URL (`&#106;avascript:`) stays text. */
export const escapeAttribute = (text: string) => text.replace(/[&<>"]/g, (ch) => ESCAPES[ch]);

/** A numeric reference's character; one past Unicode's range (or a surrogate) is U+FFFD, as browsers read it. */
const codePoint = (n: number) => String.fromCodePoint(n > 0x10ffff || (n >= 0xd800 && n <= 0xdfff) ? 0xfffd : n);

/** The named references a browser reads as ASCII (`&colon;`, `&lpar;`): the others are characters no check reads. */
const NAMED: Record<string, string> = {
  tab: "\t", newline: "\n", excl: "!", quot: '"', num: "#", dollar: "$", percnt: "%", amp: "&", apos: "'", lpar: "(", rpar: ")", ast: "*", midast: "*",
  plus: "+", comma: ",", period: ".", sol: "/", colon: ":", semi: ";", lt: "<", equals: "=", gt: ">", quest: "?", commat: "@", lsqb: "[", lbrack: "[",
  bsol: "\\", rsqb: "]", rbrack: "]", hat: "^", lowbar: "_", underbar: "_", grave: "`", diacriticalgrave: "`", lcub: "{", lbrace: "{", verbar: "|",
  vert: "|", verticalline: "|", rcub: "}", rbrace: "}", fjlig: "fj",
};

/** An attribute's value as the browser reads it, its references decoded (in any case, and without `;`: reading more, never less). */
const entities = (text: string) =>
  text.replace(/&(?:#(x[\da-f]+|\d+)|([a-z]+));?/gi, (whole, n?: string, name?: string) => (n ? codePoint(n[0].toLowerCase() === "x" ? parseInt(n.slice(1), 16) : Number(n)) : (NAMED[name!.toLowerCase()] ?? whole)));

/** Text without the control characters and spaces a browser leaves out of a URL's scheme (and more). */
const tight = (text: string) => text.replace(/[\u0000- \u007f-\u009f]/g, "");

/** A URL as the browser reads it (references decoded, control characters and spaces dropped), to read its scheme. */
const decoded = (url: string) => tight(entities(url));

/**
 * A link's or an image's URL when it's safe: a web, mail or phone link, an image on the web (or a `cid:` attachment,
 * or a PNG, GIF, JPEG or WebP data URL), or a URL with no scheme (relative, `#anchor`, `{{merge_tag}}`).
 */
export function safeUrl(url: string, kind: "link" | "image"): string | undefined {
  const value = url.trim();
  const scheme = /^([a-z][\w+.-]*):/i.exec(decoded(value))?.[1]?.toLowerCase();
  if (!scheme) return value;
  if (kind === "link" ? /^(https?|mailto|tel)$/.test(scheme) : /^(https?|cid)$/.test(scheme) || /^data:image\/(png|gif|jpe?g|webp)[;,]/i.test(decoded(value))) return value;
  return undefined;
}

/**
 * Whether CSS could load or run something (`url()`, `image-set()`, `expression()`, `behavior`, `-moz-binding`, a
 * `javascript:` URL), read as the browser reads it: its escapes decoded (`\75 rl(`); a comment, which can hide one
 * from a check (`expr/**\/ession(`), counts as one.
 */
const unsafeStyle = (css: string) =>
  /expression|javascript:|vbscript:|behavior|-moz-binding|url\(|image-set\(|\/\*/i.test(tight(entities(css).replace(/\\(?:([\da-f]{1,6})[\t\n\f\r ]?|([\s\S]))/gi, (_, hex?: string, ch?: string) => (hex ? codePoint(parseInt(hex, 16)) : ch!))));

/** The elements kept, as an email or a page shows them: text and its formatting, links, images, lists, tables, sections. */
const KEPT = new Set(
  "a abbr address article aside b bdi bdo big blockquote br caption center cite code col colgroup dd del details dfn div dl dt em figcaption figure font footer h1 h2 h3 h4 h5 h6 header hr i img ins kbd li main mark nav ol p pre q s samp section small span strike strong sub summary sup table tbody td tfoot th thead time tr tt u ul var wbr".split(" ")
);
/**
 * Elements left out with what's in them: scripts and style sheets, frames and embedded objects, form controls' text,
 * templates, and SVG and MathML (which a browser reads by rules of their own). Others not kept are left out alone, what's
 * in them kept.
 */
const WITH_CONTENT = /^(script|style|iframe|frameset|noframes|noembed|noscript|object|applet|template|svg|math|select|textarea|title|xmp|plaintext)$/;
/** The attributes kept (and `aria-*`): how an element displays, what it says, where it links. */
const ATTRIBUTES = new Set(
  "abbr align alt axis background bgcolor border cellpadding cellspacing char charoff cite class clear color colspan compact datetime dir face frame headers height href hreflang hspace id lang name noshade nowrap open rel reversed role rowspan rules scope size span src start style summary target title type valign value vspace width".split(" ")
);
const URL_ATTRIBUTES: Record<string, "link" | "image"> = { href: "link", src: "image", background: "image", cite: "link" };

/** A tag as a browser reads it: `<img/src=x/onerror=…>` is an `img` whose `src` is `x/onerror=…`. */
interface Tag {
  close: boolean;
  name: string;
  attributes: Array<[name: string, value: string | undefined]>;
  selfClosing: boolean;
  /** Where it ends (after its `>`). */
  end: number;
}

// A tag's parts, as a browser's tokenizer reads them (whitespace is HTML's: no vertical tab, no non-breaking space).
const TAG = /<(\/?)([a-z][^\t\n\f\r />]*)/iy;
const GAP = /[\t\n\f\r /]*/y;
const NAME = /[^\t\n\f\r />][^\t\n\f\r />=]*/y;
const EQUALS = /[\t\n\f\r ]*=[\t\n\f\r ]*/y;
const VALUE = /"([^"]*)"|'([^']*)'|([^\t\n\f\r >"'][^\t\n\f\r >]*)/y;
/** A comment, a doctype, CDATA, `<?xml …>` or `</ …>` (each a comment to a browser), to where it ends. */
const COMMENT = /<!--(?:-?>|[\s\S]*?--!?>|[\s\S]*)|<(?:[!?]|\/(?![a-z]))[^>]*>?/iy;

/** What `re` matches at `i` (its `lastIndex` then where the match ends). */
const at = (re: RegExp, s: string, i: number) => ((re.lastIndex = i), re.exec(s));

/**
 * The tag at `start` (a `<`): undefined where none starts there, null where the input ends in it (before its `>`, or in
 * a quote left open).
 */
function readTag(s: string, start: number): Tag | null | undefined {
  const tag = at(TAG, s, start);
  if (!tag) return undefined;
  const attributes: Tag["attributes"] = [];
  for (let i = TAG.lastIndex; ; ) {
    const gap = at(GAP, s, i)![0];
    i = GAP.lastIndex;
    if (i >= s.length) return null;
    if (s[i] === ">") return { close: !!tag[1], name: tag[2].toLowerCase(), attributes, selfClosing: gap.endsWith("/"), end: i + 1 };
    const name = at(NAME, s, i)![0].toLowerCase();
    i = NAME.lastIndex;
    let value: string | undefined;
    if (at(EQUALS, s, i)) {
      i = EQUALS.lastIndex;
      value = "";
      // (`x=>`: an empty value, and the tag's end.)
      if (s[i] !== ">") {
        const given = at(VALUE, s, i);
        if (!given) return null;
        value = given[1] ?? given[2] ?? given[3];
        i = VALUE.lastIndex;
      }
    }
    attributes.push([name, value]);
  }
}

/** A kept tag's attributes, written again: those on the list, each once (the first of a name, as a browser reads it). */
function keptAttributes(list: Tag["attributes"]): string {
  let kept = "";
  const seen = new Set<string>();
  for (const [key, value] of list) {
    if (seen.has(key)) continue;
    seen.add(key);
    if (!ATTRIBUTES.has(key) && !/^aria-[a-z]+$/.test(key)) continue;
    if (URL_ATTRIBUTES[key] && safeUrl(value ?? "", URL_ATTRIBUTES[key]) === undefined) continue;
    if (key === "style" && unsafeStyle(value ?? "")) continue;
    kept += value === undefined ? ` ${key}` : ` ${key}="${value.replace(/["<>`]/g, (ch) => ESCAPES[ch])}"`;
  }
  return kept;
}

/**
 * Raw HTML kept as it displays, read as a browser reads it and written again (what's left out can't join what's around
 * it into a tag):
 * - Tags kept: `a abbr address article aside b bdi bdo big blockquote br caption center cite code col colgroup dd del
 *   details dfn div dl dt em figcaption figure font footer h1`–`h6 header hr i img ins kbd li main mark nav ol p pre q
 *   s samp section small span strike strong sub summary sup table tbody td tfoot th thead time tr tt u ul var wbr`.
 * - Attributes kept: `abbr align alt axis background bgcolor border cellpadding cellspacing char charoff cite class
 *   clear color colspan compact datetime dir face frame headers height href hreflang hspace id lang name noshade nowrap
 *   open rel reversed role rowspan rules scope size span src start style summary target title type valign value vspace
 *   width` and `aria-*`: `href` and `cite` with a web, `mailto:` or `tel:` URL (or one with no scheme), `src` and
 *   `background` with a web or `cid:` URL or a PNG, GIF, JPEG or WebP data URL (or one with no scheme), `style`
 *   without `url()`, `image-set()`, `expression()`, `behavior`, `-moz-binding`, `javascript:` or a comment. No event
 *   handler (`on…`), `data-*`, `srcset` or `srcdoc`.
 * - Left out with what's in them: `script style iframe frameset noframes noembed noscript object applet template svg
 *   math select textarea title xmp plaintext`. Other tags are left out alone, what's in them kept; comments, doctypes,
 *   CDATA and a tag the HTML ends in are left out. A `<` that starts no tag is text (`&lt;`).
 */
export function sanitizeHtml(html: string): string {
  // (A NUL is U+FFFD to a browser, in a tag's name too.)
  const s = html.replace(/\0/g, "�");
  let out = "";
  for (let i = 0; i < s.length; ) {
    const lt = s.indexOf("<", i);
    if (lt < 0) return out + s.slice(i);
    out += s.slice(i, lt);
    if (at(COMMENT, s, lt)) {
      i = COMMENT.lastIndex;
      continue;
    }
    const tag = readTag(s, lt);
    if (tag === undefined) {
      out += "&lt;";
      i = lt + 1;
      continue;
    }
    // A tag the input ends in is left out with the rest, as a browser leaves it out.
    if (!tag) return out;
    i = tag.end;
    if (KEPT.has(tag.name)) out += tag.close ? `</${tag.name}>` : `<${tag.name}${keptAttributes(tag.attributes)}${tag.selfClosing ? " /" : ""}>`;
    else if (!tag.close && WITH_CONTENT.test(tag.name) && !(tag.selfClosing && /^(svg|math)$/.test(tag.name))) {
      // Left out to its end tag (or the input's end), with what's in it. (An empty `<svg … />` has nothing in it.)
      const end = at(new RegExp(`</${tag.name}(?=[\\t\\n\\f\\r />]|$)`, "gi"), s, i);
      i = (end && readTag(s, end.index)?.end) || s.length;
    }
  }
  return out;
}
