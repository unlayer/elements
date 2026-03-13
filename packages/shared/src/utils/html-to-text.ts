/**
 * HTML to Plain Text Converter
 *
 * Pure regex-based HTML-to-text conversion — no DOM dependency.
 * Works in Node.js, edge runtimes, and browsers.
 *
 * Critical for email deliverability: spam filters penalize HTML-only emails.
 */

/**
 * Common HTML entity map for decoding.
 */
const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
  "&mdash;": "—",
  "&ndash;": "–",
  "&laquo;": "«",
  "&raquo;": "»",
  "&bull;": "•",
  "&middot;": "·",
  "&hellip;": "…",
  "&copy;": "©",
  "&reg;": "®",
  "&trade;": "™",
};

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
export function htmlToPlainText(html: string): string {
  if (!html) return "";

  let text = html;

  // 1. Remove elements marked with data-skip-in-text (preview div, etc.)
  text = text.replace(/<[^>]+data-skip-in-text="true"[^>]*>[\s\S]*?<\/[^>]+>/gi, "");

  // 2. Remove <head>, <style>, <script> blocks entirely
  text = text.replace(/<head[\s\S]*?<\/head>/gi, "");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, "");
  text = text.replace(/<script[\s\S]*?<\/script>/gi, "");

  // 3. Convert headings: h1-h2 → UPPERCASE, h3-h6 → as-is
  text = text.replace(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi, (_, content) => {
    const clean = content.replace(/<[^>]+>/g, "").trim();
    return "\n" + clean.toUpperCase() + "\n";
  });
  text = text.replace(/<h[3-6][^>]*>([\s\S]*?)<\/h[3-6]>/gi, (_, content) => {
    const clean = content.replace(/<[^>]+>/g, "").trim();
    return "\n" + clean + "\n";
  });

  // 4. Convert links: <a href="url">text</a> → text (url)
  text = text.replace(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href, content) => {
    const clean = content.replace(/<[^>]+>/g, "").trim();
    // Skip if link text is the same as URL (avoid duplication)
    if (clean === href || clean === decodeEntities(href)) {
      return clean;
    }
    return `${clean} (${href})`;
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
    const clean = content.replace(/<[^>]+>/g, "").trim();
    return "- " + clean + "\n";
  });

  // 8. Convert <br> tags
  text = text.replace(/<br\s*\/?>/gi, "\n");

  // 9. Convert block-level closing tags to newlines
  text = text.replace(/<\/(?:p|div|tr|blockquote|section|article|header|footer|main|nav|aside)>/gi, "\n");
  text = text.replace(/<\/(?:ul|ol|table|thead|tbody|tfoot)>/gi, "\n");

  // 10. Convert <td> and <th> to tab-separated values
  text = text.replace(/<\/(?:td|th)>/gi, "\t");

  // 11. Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, "");

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
  text = text.trim();

  return text;
}
