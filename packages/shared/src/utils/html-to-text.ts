/**
 * HTML to Plain Text Converter
 *
 * Pure regex-based HTML-to-text conversion — no DOM dependency.
 * Works in Node.js, edge runtimes, and browsers.
 *
 * Critical for email deliverability: spam filters penalize HTML-only emails.
 */

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

/** `html` without the elements `test` picks, by their start tag: what's in them goes too (nested ones counted). */
function without(html: string, test: (tag: string) => boolean): string {
  const open = /<([a-z][\w-]*)\b[^>]*>/gi;
  for (let m = open.exec(html); m; m = open.exec(html)) {
    if (!test(m[0])) continue;
    let end = m.index + m[0].length;
    if (!/\/>$/.test(m[0]) && !/^(area|br|col|embed|hr|img|input|link|meta|source|wbr)$/i.test(m[1])) {
      const tags = new RegExp(`<(/?)${m[1]}\\b[^>]*>`, "gi");
      tags.lastIndex = end;
      for (let t = tags.exec(html), depth = 1; t; t = tags.exec(html)) {
        if (!/\/>$/.test(t[0]) && (depth += t[1] ? -1 : 1) === 0) {
          end = t.index + t[0].length;
          break;
        }
      }
    }
    html = html.slice(0, m.index) + html.slice(end);
    open.lastIndex = m.index;
  }
  return html;
}

/**
 * Markup without its tags. An email service's tag (`<%first_name%>`, SendGrid's; `<%= name %>`) isn't one: it's text
 * to a browser too (a tag's name starts with a letter), which the service fills in, so it stays.
 */
const untagged = (html: string) => html.replace(/<(?!%[^<>]*%>)[^>]+>/g, "");

/**
 * Decode HTML entities (named and numeric).
 */
function decodeEntities(text: string): string {
  // Named entities
  let result = text.replace(/&\w+;/g, (match) => HTML_ENTITIES[match] ?? match);

  // Numeric entities: &#123; and &#x1A;
  result = result.replace(/&#(\d+);/g, (_, code) =>
    String.fromCharCode(parseInt(code, 10))
  );
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, code) =>
    String.fromCharCode(parseInt(code, 16))
  );

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

  let text = html;
  const { links = "inline", uppercaseHeadings = true, skip = [], wordwrap } = options;

  // 1. Remove elements marked with data-skip-in-text (preview div, a block's `skipInText`, etc.) and those `skip` names,
  // with what's in them.
  text = without(text, (tag) => /data-skip-in-text="true"/.test(tag) || skip.some((s) => (s[0] === "." ? new RegExp(`\\sclass="([^"]*\\s)?${s.slice(1).replace(/\W/g, "\\$&")}[\\s"]`) : new RegExp(`^<${s}[\\s>/]`, "i")).test(tag)));

  // 2. Remove <head>, <style>, <script> blocks entirely
  text = text.replace(/<head[\s\S]*?<\/head>/gi, "");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, "");
  text = text.replace(/<script[\s\S]*?<\/script>/gi, "");

  // A line break, first: headings, links and list items keep theirs ("WELCOME BACK,<br>ADA").
  text = text.replace(/<br\s*\/?>/gi, "\n");

  // 3. Convert links, a heading's and preformatted text's too: <a href="url">text</a> → text (url), or text [1] with the
  // URLs at the end, or text. Its URL (or its text, if that's the URL) is set aside until the end, so nothing changes it
  // (a heading's capitals). An attribute's value, in either quote, is read whole (`href="…it's"`).
  const urls: string[] = [];
  const url = (href: string) => `\u0001${urls.push(decodeEntities(href)) - 1}\u0001`;
  const listed: string[] = [];
  text = text.replace(/<a\b((?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/a>/gi, (link, attributes: string, content: string) => {
    const [, ...quoted] = /\shref\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s"'>]+))/i.exec(attributes) ?? [];
    const href = quoted.find(Boolean);
    if (!href) return link;
    const clean = untagged(content).trim();
    // Skip if link text is the same as URL (avoid duplication)
    if (clean === href || clean === decodeEntities(href)) return url(href);
    return links === "none" ? clean : links === "after" ? `${clean} [${listed.push(href)}]` : `${clean} (${url(href)})`;
  });
  const restore = (text: string) => text.replace(/\u0001(\d+)\u0001/g, (_, i: string) => urls[Number(i)]);

  // Preformatted text (code) as it is, spaces and lines kept (but at their ends): set aside until the end.
  const pre: string[] = [];
  // A line of its own, unless it ends a table cell (code with line numbers: a row per line).
  text = text.replace(/<pre\b[^>]*>([\s\S]*?)<\/pre>(\s*<\/t[dh]>)?/gi, (_, content: string, cell?: string) => `\u0000${pre.push(restore(decodeEntities(untagged(content))).replace(/[^\S\n]+$/gm, "")) - 1}\u0000${cell ?? "\n"}`);

  // 4. Convert headings: h1-h2 → UPPERCASE, h3-h6 → as-is
  text = text.replace(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi, (_, content) => {
    const clean = untagged(content).trim();
    // Entities stay as written, to decode below (`&amp;` uppercased wouldn't), and an email service's tags as they are.
    const upper = clean.replace(/<%[^<>]*%>|&#?\w+;|[^&<]+|[&<]/g, (part: string) => (/^(&#?\w+;|<%[^<>]*%>)$/.test(part) || !uppercaseHeadings ? part : part.toUpperCase()));
    return "\n" + upper + "\n";
  });
  text = text.replace(/<h[3-6][^>]*>([\s\S]*?)<\/h[3-6]>/gi, (_, content) => {
    const clean = untagged(content).trim();
    return "\n" + clean + "\n";
  });

  // 5. Convert images: <img alt="text"> → [text]
  text = text.replace(/<img[^>]+alt=["']([^"']+)["'][^>]*\/?>/gi, (_, alt) => {
    return `[${alt}]`;
  });
  // Remove images without alt text
  text = text.replace(/<img[^>]*\/?>/gi, "");

  // 6. Convert horizontal rules
  text = text.replace(/<hr[^>]*\/?>/gi, "\n---\n");

  // 7. Convert list items
  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, content) => {
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
