import { decodeHtmlEntities } from "./entities";

/**
 * Content check: does the converted HTML still say everything the original
 * says? Compares the visible words of two HTML documents as multisets, with
 * no browser, so a dropped block, row or loop shows up as missing words. The
 * same words in another order count too: words out of place are missing.
 */

export interface TextCheck {
  /** Words the original shows and the conversion doesn't (one per lost occurrence). */
  missing: string[];
  /** Words only the conversion shows. */
  added: string[];
  /** Links (href), images (src) and image text (alt) the original has and the conversion doesn't. */
  missingAttributes: string[];
}

const HIDDEN = /<(span|div|p|code|td)\b[^>]*style="[^"]*display:\s*none[^"]*"[^>]*>[\s\S]*?<\/\1>/gi;
const INLINE = /<\/?(?:a|span|strong|b|em|i|u|s|small|code|sup|sub|font|mark|abbr)\b[^>]*>/gi;

/** The words a reader sees in `html`: lower-cased, with meaningful numeric punctuation preserved, in order. */
export function htmlWords(html: string): string[] {
  const text = html
    .replace(/<head\b[\s\S]*?<\/head>/gi, " ")
    .replace(/<(style|script|title)\b[\s\S]*?<\/\1>/gi, " ")
    // React separates adjacent text with <!-- --> (`{name}'s` → `Alex<!-- -->'s`).
    .replace(/<!--[\s\S]*?-->/g, "")
    // Hidden elements (e.g. CodeInline's hidden copy for some clients), but
    // not the preview text: inboxes show it.
    .replace(HIDDEN, (match) =>
      /data-skip-in-text/.test(match.slice(0, match.indexOf(">")))
        ? match
        : " ",
    )
    // Inline tags don't break words (`<b>Hel</b>lo` reads "Hello"); block tags
    // do, and so do inline tags styled as boxes (a link with display:block,
    // pills side by side with display:inline-block).
    .replace(INLINE, (tag) =>
      /display:\s*(block|flex|grid|table|list-item|inline-block|inline-flex)/i.test(
        tag,
      )
        ? " "
        : "",
    )
    .replace(/<[^>]+>/g, " ");
  return decodeHtmlEntities(text)
    .split(/\s+/)
    .map((word) => {
      // Punctuation around prose is cosmetic. Numeric separators, signs,
      // currency symbols and percentages change what the reader is told.
      if (/\p{N}/u.test(word)) {
        return word
          .toLowerCase()
          .replace(/[^\p{L}\p{N}\p{Sc}.,/:'’+\-−%‰]/gu, "")
          .replace(/[.,]+$/g, "");
      }
      return word.toLowerCase().replace(/[^\p{L}\p{Sc}%‰]/gu, "");
    })
    .filter(Boolean);
}

/**
 * The links, images and image text a reader gets: `href=` of links, `src=`
 * and `alt=` of images (alt shows when images are blocked, common in email),
 * entities decoded. Hidden elements and MSO-only markup aren't counted.
 */
export function htmlAttributes(html: string): string[] {
  const visible = visibleHtml(html);
  const out: string[] = [];
  for (const [, tag, attrs] of visible.matchAll(/<(a|img)\b((?:"[^"]*"|'[^']*'|[^'">])*)>/gi)) {
    if (tag.toLowerCase() === "a") {
      const href = attribute(attrs, "href");
      if (href) out.push(`href ${href}`);
    } else {
      const src = attribute(attrs, "src");
      const alt = attribute(attrs, "alt");
      if (src) out.push(`src ${src}`);
      if (alt) out.push(`alt ${alt}`);
    }
  }
  return out;
}

/** Compare the words, links and images two HTML documents show. */
export function compareText(originalHtml: string, convertedHtml: string): TextCheck {
  const originalWords = htmlWords(originalHtml);
  const convertedWords = htmlWords(convertedHtml);
  const counts = new Map<string, number>();
  for (const word of convertedWords) counts.set(word, (counts.get(word) ?? 0) + 1);
  const missing: string[] = [];
  for (const word of originalWords) {
    const left = counts.get(word) ?? 0;
    if (left > 0) counts.set(word, left - 1);
    else missing.push(word);
  }
  const added = [...counts].flatMap(([word, n]) => Array<string>(n).fill(word));
  // Every word there, but not in order: two values swapped places (a total
  // and a subtotal, say). The words out of place count as missing.
  if (!missing.length && !added.length) {
    const moved = outOfOrder(originalWords, convertedWords);
    missing.push(...moved);
    added.push(...moved);
  }
  // Count visible occurrences; Outlook-only duplicates are already excluded.
  const missingAttributes = lostOccurrences(htmlAttributes(originalHtml), htmlAttributes(convertedHtml));
  // A destination must also stay on the same link/image, even if every URL
  // still appears elsewhere in the document.
  for (const item of lostOccurrences(attributePairs(originalHtml), attributePairs(convertedHtml))) {
    const [kind, value, label] = JSON.parse(item) as [string, string, string];
    if (!missingAttributes.includes(`${kind} ${value}`)) missingAttributes.push(`${kind} ${value} (${label})`);
  }
  return { missing, added, missingAttributes };
}

function visibleHtml(html: string): string {
  return html.replace(/<head\b[\s\S]*?<\/head>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(HIDDEN, (match) => (/data-skip-in-text/.test(match.slice(0, match.indexOf(">"))) ? match : " "));
}

function attribute(attrs: string, name: string): string | undefined {
  const match = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i").exec(attrs);
  return match ? decodeHtmlEntities(match[1] ?? match[2] ?? match[3]).trim() : undefined;
}

function attributePairs(html: string): string[] {
  const visible = visibleHtml(html);
  const pairs: string[] = [];
  for (const [, attrs, inner] of visible.matchAll(/<a\b((?:"[^"]*"|'[^']*'|[^'">])*)>([\s\S]*?)<\/a\s*>/gi)) {
    const href = attribute(attrs, "href");
    const label = htmlWords(inner).join(" ") || htmlAttributes(inner).join(", ");
    if (href) pairs.push(JSON.stringify(["href", href, label]));
  }
  for (const [, attrs] of visible.matchAll(/<img\b((?:"[^"]*"|'[^']*'|[^'">])*)>/gi)) {
    const src = attribute(attrs, "src");
    const alt = attribute(attrs, "alt");
    if (src) pairs.push(JSON.stringify(["src", src, alt ?? ""]));
  }
  return pairs;
}

/**
 * Words of `original` outside the longest sequence the two share in order.
 * Past a size limit, every word between the shared start and end.
 */
function outOfOrder(original: string[], converted: string[]): string[] {
  let start = 0;
  while (start < original.length && start < converted.length && original[start] === converted[start]) start++;
  let end = 0;
  while (end < original.length - start && end < converted.length - start && original[original.length - 1 - end] === converted[converted.length - 1 - end]) end++;
  const a = original.slice(start, original.length - end);
  const b = converted.slice(start, converted.length - end);
  if (!a.length) return [];
  if (a.length * b.length > 1_000_000) return a;
  // Longest common subsequence, then the words of `a` it leaves out.
  const width = b.length + 1;
  const table = new Uint32Array((a.length + 1) * width);
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i * width + j] = a[i] === b[j] ? table[(i + 1) * width + j + 1] + 1 : Math.max(table[(i + 1) * width + j], table[i * width + j + 1]);
    }
  }
  const out: string[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length) {
    if (j < b.length && a[i] === b[j]) {
      i++;
      j++;
    } else if (j < b.length && table[i * width + j + 1] >= table[(i + 1) * width + j]) {
      j++;
    } else {
      out.push(a[i++]);
    }
  }
  return out;
}

function lostOccurrences(original: string[], converted: string[]): string[] {
  const counts = new Map<string, number>();
  for (const value of converted) counts.set(value, (counts.get(value) ?? 0) + 1);
  return original.filter((value) => {
    const count = counts.get(value) ?? 0;
    if (!count) return true;
    counts.set(value, count - 1);
    return false;
  });
}
