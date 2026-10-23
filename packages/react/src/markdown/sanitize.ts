/**
 * What Markdown can hold that an email shouldn't: URLs that run code (`javascript:`), and raw HTML with scripts,
 * event handlers, frames or forms. Raw HTML is kept to tags and attributes that only display (allowlists), read in one
 * pass as a browser reads it and written again: what's left out can't join what's around it into a tag.
 */

import { commentEnd, rawTextEnd, readTag, type Attribute } from "../utils/html-tags";
import { codePoint, decoded, entities, tight } from "../utils/entities";

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "`": "&#96;" };

/** Text as HTML; an entity reference written in it (`&copy;`) is kept, as Markdown keeps it. */
export const escapeText = (text: string) => text.replace(/&(?!#\d+;|#x[\da-f]+;|[a-z][\da-z]*;)|[<>"]/gi, (ch) => ESCAPES[ch]);
/** An attribute's value: every `&` escaped too, so an entity in a URL (`&#106;avascript:`) stays text. */
export const escapeAttribute = (text: string) => text.replace(/[&<>"]/g, (ch) => ESCAPES[ch]);

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
 * Whether CSS could load or run something (`url()`, `image()`, `image-set()`, `expression()`, `behavior`,
 * `-moz-binding`, an old Internet Explorer's `progid:` filter, a `javascript:` URL), read as the browser reads it: its escapes decoded (`\75 rl(`); a comment, which can hide one
 * from a check (`expr/**\/ession(`), counts as one. A `style` it keeps passes; so does what a <Tailwind> inlines into
 * Markdown's HTML for its classes (src/tailwind/html.ts).
 */
export const unsafeStyle = (css: string) => /expression|javascript:|vbscript:|behavior|-moz-binding|progid|url\(|image\(|image-set\(|\/\*/i.test(readCss(css));

/** CSS as the browser reads it: its references and escapes decoded (`\75 rl(`), its spaces and control characters gone. */
const readCss = (css: string) => tight(entities(css).replace(/\\(?:([\da-f]{1,6})[\t\n\f\r ]?|([\s\S]))/gi, (_, hex?: string, ch?: string) => (hex ? codePoint(parseInt(hex, 16)) : ch!)));

/**
 * Whether CSS has a `url()` whose URL isn't a web one (`http:`, `https:`), a relative one, or a PNG, GIF, JPEG or WebP
 * data URL, read as the browser reads it (see unsafeStyle): a class's `bg-[url(javascript:…)]`, which a <Tailwind>
 * doesn't write (src/tailwind/props.ts).
 */
export const unsafeUrl = (css: string) => /url\(["']?(?!https?:|data:image\/(?:png|gif|jpe?g|webp)[;,]|(?![a-z][\w+.-]*:))/i.test(readCss(css));

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

/**
 * A class attribute's names but those whose arbitrary value (Tailwind's `bg-[…]`, `[background:…]`: from the first
 * bracket, as the browser reads the attribute) is CSS that could load or run something, as a <Tailwind> would inline
 * it, or any renderer of the design later.
 */
function keptClasses(value: string): string {
  const names = value.split(/[\t\n\f\r ]+/);
  const kept = names.filter((name) => {
    const read = entities(name);
    const at = read.search(/[[(]/);
    return at < 0 || !unsafeStyle(read.slice(at));
  });
  // (As written where it keeps them all.)
  return kept.length === names.length ? value : kept.join(" ");
}

/** A kept tag's attributes, written again: those on the list, each once (the first of a name, as a browser reads it). */
function keptAttributes(list: Attribute[]): string {
  let kept = "";
  const seen = new Set<string>();
  for (const { name: key, value } of list) {
    if (seen.has(key)) continue;
    seen.add(key);
    if (!ATTRIBUTES.has(key) && !/^aria-[a-z]+$/.test(key)) continue;
    if (URL_ATTRIBUTES[key] && safeUrl(value ?? "", URL_ATTRIBUTES[key]) === undefined) continue;
    if (key === "style" && unsafeStyle(value ?? "")) continue;
    const written = key === "class" && value !== undefined ? keptClasses(value) : value;
    if (key === "class" && value && !written!.trim()) continue;
    kept += written === undefined ? ` ${key}` : ` ${key}="${written.replace(/["<>`]/g, (ch) => ESCAPES[ch])}"`;
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
 *   without `url()`, `image()`, `image-set()`, `expression()`, `behavior`, `-moz-binding`, a `progid:` filter,
 *   `javascript:` or a comment, and `class` without a name whose arbitrary value (`bg-[…]`) would be such CSS. No event
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
    const comment = commentEnd(s, lt);
    if (comment !== undefined) {
      i = comment;
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
      const end = rawTextEnd(s, tag.name, i);
      i = readTag(s, end)?.end || s.length;
    }
  }
  return out;
}
