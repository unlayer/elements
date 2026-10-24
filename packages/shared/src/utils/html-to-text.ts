/**
 * HTML to Plain Text Converter
 *
 * Pure regex-based HTML-to-text conversion — no DOM dependency.
 * Works in Node.js, edge runtimes, and browsers.
 *
 * Critical for email deliverability: spam filters penalize HTML-only emails.
 */

import { removeBetween, replaceAltImages, replaceElements, replaceLinks, replaceTags, untagged, withoutElements } from "./html-scan";
import { TextMarks } from "./text-marks";

/**
 * Common HTML named entity map for decoding.
 *
 * Covers the entities that actually appear in email/marketing content —
 * currency, typographic punctuation, common symbols, and the Latin-1 accented
 * letters used in European names and words. Kept as a curated map (rather than
 * the full HTML5 named-reference set, which is ~2000 entries) so the bundle
 * stays within its size budget. Numeric entities (`&#123;`, `&#x1a;`) are
 * handled separately below, so anything missing here still decodes if written
 * numerically.
 */
const HTML_ENTITIES: Record<string, string> = Object.fromEntries(
  // Each name, then the character it stands for (`amp&lt<…`): the same map, written compactly for the bundle.
  Array.from("amp&lt<gt>quot\"apos'nbsp mdash—ndash–laquo«raquo»lsquo‘rsquo’ldquo“rdquo”bull•middot·hellip…cent¢pound£yen¥euro€copy©reg®trade™sect§para¶deg°plusmn±times×divide÷microµfrac14¼frac12½frac34¾szligßagraveàaacuteáacircâatildeãaumläaringåaeligæccedilçegraveèeacuteéecircêeumlëigraveìiacuteíicircîiumlïntildeñograveòoacuteóocircôotildeõoumlöoslashøugraveùuacuteúucircûuumlü".matchAll(/([a-z\d]+)([^a-z\d])/gi), ([, name, char]) => [`&${name};`, char])
);

/** How `htmlToPlainText` writes plain text; each left out is as before. */
export interface PlainTextOptions {
  /** Wrap lines at this many characters, between words (default: no wrapping); the URLs `links: "after"` lists aren't. */
  wordwrap?: number;
  /** Links: "inline" (default) `text (url)`, "after" `text [1]` with the URLs listed at the end, or "none" (the text only); a heading's too, its URL as written. */
  links?: "inline" | "after" | "none";
  /** h1 and h2 in capitals (default true). */
  uppercaseHeadings?: boolean;
  /** Elements left out, with what's in them, by tag name (`"img"`) or class (`".footer"`). */
  skip?: string[];
}

/**
 * `text` without the whitespace but line breaks at its lines' ends, as `/[^\S\n]+$/gm` leaves it, read once: that regex
 * tries again from each character of a run of spaces that no line ends (80,000 spaces then `x` took 11 s). A run that
 * ends a line goes; in one that doesn't, what's before its last line break (`\r`, U+2028, U+2029) goes.
 */
function trimLineEnds(text: string): string {
  return text.replace(/[^\S\n]+/g, (run: string, at: number) => {
    const end = at + run.length;
    if (end === text.length || text[end] === "\n") return "";
    for (let i = run.length - 1; i > 0; i--) if (run[i] === "\r" || run[i] === "\u2028" || run[i] === "\u2029") return run.slice(i);
    return run;
  });
}

/**
 * Decode HTML entities (named and numeric).
 */
function decode(text: string, marks: TextMarks): string {
  // Named entities
  let result = text.replace(/&\w+;/g, (match) => HTML_ENTITIES[match] ?? match);

  // Numeric entities: &#123; and &#x1A; (U+0000 and U+0001 as what stands for them: see text-marks.ts)
  const char = (code: number) => {
    const decoded = String.fromCharCode(code);
    return decoded === "\0" || decoded === "\u0001" ? marks.standIn(decoded) : decoded;
  };
  result = result.replace(/&#(\d+);/g, (_, code) => char(parseInt(code, 10)));
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, code) => char(parseInt(code, 16)));

  return result;
}

/**
 * Convert an HTML string to readable plain text.
 *
 * @param html - HTML string to convert
 * @returns Plain text representation
 *
 * @example
 * ```ts
 * import { htmlToPlainText } from "@unlayer-internal/shared-elements";
 *
 * const text = htmlToPlainText("<h1>Hello</h1><p>World</p>");
 * // "HELLO\nWorld"
 * ```
 */
export function htmlToPlainText(html: string, options: PlainTextOptions = {}): string {
  if (!html) return "";
  // Its own U+0000 and U+0001 (what the placeholders are made of) kept out of their way: see text-marks.ts.
  const marks = new TextMarks(html);
  return marks.output(plainText(marks.input(), options, marks));
}

/** A `javascript:` URL, as a browser reads one (spaces and control characters before it, any case). */
const BLOCKED = /^[\s\0-\x1f]*j\s*a\s*v\s*a\s*s\s*c\s*r\s*i\s*p\s*t\s*:/i;

/** htmlToPlainText's text, of HTML that holds neither U+0000 nor U+0001, nor decodes to them (see `marks`). */
function plainText(html: string, options: PlainTextOptions, marks: TextMarks): string {
  const decodeEntities = (text: string) => decode(text, marks);
  let text = html;
  const { links = "inline", uppercaseHeadings = true, skip = [], wordwrap } = options;

  // 1. Remove elements marked with data-skip-in-text (preview div, a block's `skipInText`, etc.) and those `skip` names,
  // with what's in them.
  // (Each step reads the text once, whatever it holds: see html-scan.ts.)
  // (A name or class as written: its characters escaped, so `a+` is no pattern and `(` no error.)
  const skipping = skip.map((s) => (s[0] === "." ? new RegExp(`\\sclass="([^"]*\\s)?${s.slice(1).replace(/\W/g, "\\$&")}[\\s"]`) : new RegExp(`^<${s.replace(/\W/g, "\\$&")}[\\s>/]`, "i")));
  text = withoutElements(text, (tag) => /data-skip-in-text="true"/.test(tag) || skipping.some((s) => s.test(tag)));

  // 2. Remove <head>, <style>, <script> blocks entirely
  text = removeBetween(text, /<head/iy, /<\/head>/gi);
  text = removeBetween(text, /<style/iy, /<\/style>/gi);
  text = removeBetween(text, /<script/iy, /<\/script>/gi);

  // A line break, first: headings, links and list items keep theirs ("WELCOME BACK,<br>ADA").
  text = text.replace(/<br\s*\/?>/gi, "\n");

  // 3. Convert links, a heading's and preformatted text's too: <a href="url">text</a> → text (url), or text [1] with the
  // URLs at the end, or text. Its URL (or its text, if that's the URL) is set aside until the end, so nothing changes it
  // (a heading's capitals). An attribute's value, in either quote, is read whole (`href="…it's"`).
  const urls: string[] = [];
  const url = (href: string) => `\u0001${urls.push(decodeEntities(href)) - 1}\u0001`;
  const listed: string[] = [];
  text = replaceLinks(text, (link, attributes, content) => {
    const [, ...quoted] = /\shref\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s"'>]+))/i.exec(attributes) ?? [];
    const href = quoted.find(Boolean);
    if (!href) return link;
    const clean = untagged(content).trim();
    // A URL React blocks (`javascript:`, from data: written as React's `javascript:throw new Error(…)`) isn't one to
    // show: the link's text, as a link without a URL is.
    if (BLOCKED.test(decodeEntities(href))) return clean;
    // Skip if link text is the same as URL (avoid duplication)
    if (clean === href || clean === decodeEntities(href)) return url(href);
    return links === "none" ? clean : links === "after" ? `${clean} [${listed.push(href)}]` : `${clean} (${url(href)})`;
  });
  const restore = (text: string) => text.replace(/\u0001(\d+)\u0001/g, (_, i: string) => urls[Number(i)]);

  // Preformatted text (code) as it is, spaces and lines kept (but at their ends): set aside until the end.
  const pre: string[] = [];
  // A line of its own, unless it ends a table cell (code with line numbers: a row per line).
  text = replaceElements(text, /<pre/iy, /<\/pre>/gi, (_, content, cell) => `\u0000${pre.push(trimLineEnds(restore(decodeEntities(untagged(content))))) - 1}\u0000${cell ?? "\n"}`, { bounded: true, after: /\s*<\/t[dh]>/iy });

  // 4. Convert headings: h1-h2 → UPPERCASE, h3-h6 → as-is
  text = replaceElements(text, /<h[12]/iy, /<\/h[12]>/gi, (_, content) => {
    const clean = untagged(content).trim();
    // Entities stay as written, to decode below (`&amp;` uppercased wouldn't), and an email service's tags as they are.
    const upper = clean.replace(/<%[^<>]*%>|&#?\w+;|[^&<]+|[&<]/g, (part: string) => (/^(&#?\w+;|<%[^<>]*%>)$/.test(part) || !uppercaseHeadings ? part : part.toUpperCase()));
    return "\n" + upper + "\n";
  });
  text = replaceElements(text, /<h[3-6]/iy, /<\/h[3-6]>/gi, (_, content) => {
    const clean = untagged(content).trim();
    return "\n" + clean + "\n";
  });

  // 5. Convert images: <img alt="text"> → [text]
  text = replaceAltImages(text, (alt) => `[${alt}]`);
  // Remove images without alt text
  text = replaceTags(text, /<img/iy, () => "");

  // 6. Convert horizontal rules
  text = replaceTags(text, /<hr/iy, () => "\n---\n");

  // 7. Convert list items
  text = replaceElements(text, /<li/iy, /<\/li>/gi, (_, content) => {
    const clean = untagged(content).trim();
    return "- " + clean + "\n";
  });

  // 9. Convert block-level closing tags to newlines
  text = text.replace(/<\/(?:p|div|tr|blockquote|section|article|header|footer|main|nav|aside)>/gi, "\n");
  text = text.replace(/<\/(?:ul|ol|table|thead|tbody|tfoot)>/gi, "\n");

  // 10. Convert <td> and <th> to tab-separated values
  text = text.replace(/<\/(?:td|th)>/gi, "\t");

  // 11. Remove all remaining HTML tags
  text = untagged(text);

  // 12. Decode HTML entities
  text = decodeEntities(text);

  // 13. Clean up whitespace
  // Replace tabs with spaces
  text = text.replace(/\t/g, "  ");
  // Collapse multiple spaces (but not newlines) into one
  text = text.replace(/[^\S\n]+/g, " ");
  // Trim each line
  text = text
    .split("\n")
    .map((line) => line.trim())
    .join("\n");
  // Collapse 3+ consecutive newlines to 2
  text = text.replace(/\n{3,}/g, "\n\n");
  // Trim leading/trailing whitespace
  text = restore(text.trim());
  // Lines wrapped at `wordwrap` characters, between words (a longer word stays whole); the URLs listed after aren't.
  if (wordwrap) text = text.replace(new RegExp(`(?![^\\n]{1,${wordwrap}}$)([^\\n]{1,${wordwrap}})\\s`, "g"), "$1\n");
  if (listed.length) text += `\n\n${listed.map((href, i) => `[${i + 1}] ${decodeEntities(href)}`).join("\n")}`;

  return text.replace(/\u0000(\d+)\u0000/g, (whole, i: string) => pre[Number(i)] ?? whole);
}
