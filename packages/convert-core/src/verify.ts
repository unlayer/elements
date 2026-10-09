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
  /** Links, images and image text only the conversion has. */
  addedAttributes: string[];
}

// A hidden element's opening tag; Elements hides a block on desktop with display:none on its table.
const HIDDEN = /<([a-z][\w-]*)\b[^>]*style="[^"]*display:\s*none[^"]*"[^>]*>/gi;
const VOID = /^(area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)$/i;
const INLINE = /<\/?(?:a|span|strong|b|em|i|u|s|small|code|sup|sub|font|mark|abbr)\b[^>]*>/gi;

/** The words a reader sees in `html`, as written, with meaningful numeric punctuation and lone signs preserved, in order. */
export function htmlWords(html: string): string[] {
  // Hidden elements (e.g. CodeInline's hidden copy for some clients) aren't read.
  const text = withoutHidden(hideClasses(html, hiddenClasses(html))
    .replace(/<head\b[\s\S]*?<\/head>/gi, " ")
    .replace(/<(style|script|title)\b[\s\S]*?<\/\1>/gi, " ")
    // React separates adjacent text with <!-- --> (`{name}'s` → `Alex<!-- -->'s`).
    .replace(/<!--[\s\S]*?-->/g, ""))
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
    .normalize("NFC")
    // Zero-width characters (preview text padding) aren't read.
    .replace(/[\u200b-\u200d\u2060\ufeff]/g, "")
    // One minus, however it was written (-, −, &minus;).
    .replace(/[-−－﹣]/g, "−")
    .split(/\s+/)
    .map((word) => {
      // Punctuation around prose is cosmetic. Numeric separators, signs,
      // currency symbols and percentages change what the reader is told,
      // and so does a sign on its own ("Balance − 100").
      if (/\p{N}/u.test(word)) {
        return word.replace(/[^\p{L}\p{N}\p{Sc}.,/:'’+−%‰]/gu, "").replace(/[.,]+$/g, "");
      }
      if (/^[+−±]$/.test(word)) return word;
      return word.replace(/[^\p{L}\p{Sc}%‰]/gu, "");
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
      const href = linkUrl(attrs);
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
  if (!missing.length) {
    const moved = outOfOrder(originalWords, convertedWords);
    missing.push(...moved);
    added.push(...moved);
  }
  // Count visible occurrences; Outlook-only duplicates are already excluded.
  const missingAttributes = lostOccurrences(htmlAttributes(originalHtml), htmlAttributes(convertedHtml));
  // Added ones as a set: a renderer may repeat a link (a button's fallback), but a new destination is new.
  const originalAttributes = new Set(htmlAttributes(originalHtml));
  const addedAttributes = [...new Set(htmlAttributes(convertedHtml))].filter((item) => !originalAttributes.has(item));
  // A destination must also stay on the same link/image, even if every URL
  // still appears elsewhere in the document.
  for (const item of lostOccurrences(attributePairs(originalHtml), attributePairs(convertedHtml))) {
    const [kind, value, label] = JSON.parse(item) as [string, string, string];
    if (!missingAttributes.includes(`${kind} ${value}`)) missingAttributes.push(`${kind} ${value} (${label})`);
  }
  return { missing, added, missingAttributes, addedAttributes };
}

function visibleHtml(html: string): string {
  return withoutHidden(hideClasses(html, hiddenClasses(html)).replace(/<head\b[\s\S]*?<\/head>/gi, " ").replace(/<!--[\s\S]*?-->/g, ""));
}

/** `html` without its hidden elements, nested tags and all; the preview text (`data-skip-in-text`) stays: inboxes show it. */
function withoutHidden(html: string): string {
  let out = "";
  let from = 0;
  HIDDEN.lastIndex = 0;
  for (let open = HIDDEN.exec(html); open; open = HIDDEN.exec(html)) {
    if (/data-skip-in-text/.test(open[0])) continue;
    if (VOID.test(open[1])) {
      out += `${html.slice(from, open.index)} `;
      from = HIDDEN.lastIndex;
      continue;
    }
    const tags = new RegExp(`<(/?)${open[1]}\\b[^>]*>`, "gi");
    tags.lastIndex = HIDDEN.lastIndex;
    let depth = 1;
    while (depth) {
      const tag = tags.exec(html);
      if (!tag) break;
      depth += tag[1] ? -1 : 1;
    }
    // Unclosed: leave it.
    if (depth) continue;
    out += `${html.slice(from, open.index)} `;
    from = HIDDEN.lastIndex = tags.lastIndex;
  }
  return out + html.slice(from);
}

/** A link's URL: `"`, `<` and `>` percent-encoded (as Elements writes them) are the same URL. */
function linkUrl(attrs: string): string | undefined {
  return attribute(attrs, "href")?.replace(/%22/gi, '"').replace(/%3C/gi, "<").replace(/%3E/gi, ">");
}

function attribute(attrs: string, name: string): string | undefined {
  const match = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i").exec(attrs);
  return match ? decodeHtmlEntities(match[1] ?? match[2] ?? match[3]).trim() : undefined;
}

function attributePairs(html: string): string[] {
  const visible = visibleHtml(html);
  const pairs: string[] = [];
  for (const [, attrs, inner] of visible.matchAll(/<a\b((?:"[^"]*"|'[^']*'|[^'">])*)>([\s\S]*?)<\/a\s*>/gi)) {
    const href = linkUrl(attrs);
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

/**
 * Classes a document's stylesheets hide everywhere (`.hide{display:none}`, outside
 * media queries): hidden though no inline style says so. A rule in a media query
 * (dark mode, phones) applies only sometimes, so it doesn't count.
 */
export function hiddenClasses(html: string): Map<string, { important: boolean }> {
  const out = new Map<string, { important: boolean }>();
  for (const [, sheet] of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    const css = withoutAtRules(sheet.replace(/\/\*[\s\S]*?\*\//g, ""));
    for (const [, selectors, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const hide = /(?:^|;)\s*display\s*:\s*none\s*(!\s*important)?/i.exec(body);
      if (!hide) continue;
      for (const selector of selectors.split(",")) {
        const name = /^\s*\.([\w-]+)\s*$/.exec(selector)?.[1];
        if (name) out.set(name, { important: Boolean(hide[1]) || Boolean(out.get(name)?.important) });
      }
    }
  }
  return out;
}

/**
 * `html` with display:none written on the elements `classes` hide: unless their own style
 * sets a display, which wins over a class rule that isn't `!important`.
 */
export function hideClasses(html: string, classes: ReadonlyMap<string, { important: boolean }>): string {
  if (!classes.size) return html;
  return html.replace(/<([a-z][\w-]*)((?:\s(?:"[^"]*"|'[^']*'|[^'">])*)?)>/gi, (tag, name: string, attrs: string) => {
    const names = /\sclass\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attrs);
    const rules = names ? (names[1] ?? names[2]).split(/\s+/).flatMap((c) => classes.get(c) ?? []) : [];
    if (!rules.length) return tag;
    const style = /\sstyle\s*=\s*"([^"]*)"/i.exec(attrs);
    if (style && /(?:^|;)\s*display\s*:/i.test(style[1]) && !rules.some((rule) => rule.important)) return tag;
    if (style) return tag.replace(style[0], ` style="${style[1].replace(/;?\s*$/, ";")}display:none"`);
    const selfClosing = /\/\s*$/.test(attrs);
    return `<${name}${attrs.replace(/\/\s*$/, "")} style="display:none"${selfClosing ? "/" : ""}>`;
  });
}

/** CSS without its at-rule blocks (@media, @supports, @font-face). */
function withoutAtRules(css: string): string {
  let out = "";
  for (let i = 0; i < css.length; ) {
    const at = css.indexOf("@", i);
    if (at < 0) return out + css.slice(i);
    out += css.slice(i, at);
    const open = css.indexOf("{", at);
    const semi = css.indexOf(";", at);
    if (open < 0 || (semi >= 0 && semi < open)) {
      i = semi < 0 ? css.length : semi + 1;
      continue;
    }
    let depth = 1;
    let j = open + 1;
    for (; j < css.length && depth; j++) depth += css[j] === "{" ? 1 : css[j] === "}" ? -1 : 0;
    i = j;
  }
  return out;
}

