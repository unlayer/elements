/**
 * Content check: does the converted HTML still say everything the original
 * says? Compares the visible words of two HTML documents as multisets, with
 * no browser, so a dropped block, row or loop shows up as missing words.
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

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  mdash: "—",
  ndash: "–",
  hellip: "…",
  copy: "©",
  reg: "®",
  trade: "™",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  middot: "·",
  bull: "•",
  rarr: "→",
  larr: "←",
};

/** The words a reader sees in `html`: lower-cased, punctuation stripped, in order. */
export function htmlWords(html: string): string[] {
  const text = html
    .replace(/<head\b[\s\S]*?<\/head>/gi, " ")
    .replace(/<(style|script|title)\b[\s\S]*?<\/\1>/gi, " ")
    // React separates adjacent text with <!-- --> (`{name}'s` → `Alex<!-- -->'s`).
    .replace(/<!--[\s\S]*?-->/g, "")
    // Hidden elements (e.g. CodeInline's hidden copy for some clients), but
    // not the preview text: inboxes show it.
    .replace(HIDDEN, (match) => (/data-skip-in-text/.test(match.slice(0, match.indexOf(">"))) ? match : " "))
    // Inline tags don't break words (`<b>Hel</b>lo` reads "Hello"); block tags
    // do, and so do inline tags styled as boxes (a link with display:block,
    // pills side by side with display:inline-block).
    .replace(INLINE, (tag) => (/display:\s*(block|flex|grid|table|list-item|inline-block|inline-flex)/i.test(tag) ? " " : ""))
    .replace(/<[^>]+>/g, " ")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, body: string) => {
      if (body[0] === "#") {
        const code = body[1] === "x" || body[1] === "X" ? Number.parseInt(body.slice(2), 16) : Number(body.slice(1));
        return Number.isFinite(code) ? String.fromCodePoint(code) : match;
      }
      return ENTITIES[body.toLowerCase()] ?? match;
    });
  return text
    .split(/\s+/)
    .map((word) => word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, ""))
    .filter(Boolean);
}

/**
 * The links, images and image text a reader gets: `href=` of links, `src=`
 * and `alt=` of images (alt shows when images are blocked, common in email),
 * entities decoded. Hidden elements and MSO-only markup aren't counted.
 */
export function htmlAttributes(html: string): string[] {
  const visible = html
    .replace(/<head\b[\s\S]*?<\/head>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(HIDDEN, (match) => (/data-skip-in-text/.test(match.slice(0, match.indexOf(">"))) ? match : " "));
  const out: string[] = [];
  for (const [, tag, attrs] of visible.matchAll(/<(a|img)\b([^>]*)>/gi)) {
    const value = (name: string) => new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i").exec(attrs);
    const pick = (name: string) => {
      const m = value(name);
      return m ? decodeEntities(m[2] ?? m[3] ?? "").trim() : undefined;
    };
    if (tag.toLowerCase() === "a") {
      const href = pick("href");
      if (href) out.push(`href ${href}`);
    } else {
      const src = pick("src");
      const alt = pick("alt");
      if (src) out.push(`src ${src}`);
      if (alt) out.push(`alt ${alt}`);
    }
  }
  return out;
}

/** Compare the words, links and images two HTML documents show. */
export function compareText(originalHtml: string, convertedHtml: string): TextCheck {
  const counts = new Map<string, number>();
  for (const word of htmlWords(convertedHtml)) counts.set(word, (counts.get(word) ?? 0) + 1);
  const missing: string[] = [];
  for (const word of htmlWords(originalHtml)) {
    const left = counts.get(word) ?? 0;
    if (left > 0) counts.set(word, left - 1);
    else missing.push(word);
  }
  const added = [...counts].flatMap(([word, n]) => Array<string>(n).fill(word));
  // Links and images: each the original has must be there (as a set: Elements
  // may repeat one, e.g. a button's link for Outlook).
  const have = new Set(htmlAttributes(convertedHtml));
  const missingAttributes = [...new Set(htmlAttributes(originalHtml))].filter((a) => !have.has(a));
  return { missing, added, missingAttributes };
}

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, body: string) => {
    if (body[0] === "#") {
      const code = body[1] === "x" || body[1] === "X" ? Number.parseInt(body.slice(2), 16) : Number(body.slice(1));
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return ENTITIES[body.toLowerCase()] ?? match;
  });
}
