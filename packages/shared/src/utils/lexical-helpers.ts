/**
 * Lexical Helpers for Text JSON Conversion
 *
 * Utilities to convert between plain text, Lexical JSON, and HTML.
 * HTML generation is done via direct JSON tree walking — no Lexical
 * headless editor or DOM required.
 */

/**
 * Empty Lexical JSON structure (used as fallback).
 * Uses extended-paragraph type for Unlayer editor compatibility.
 */
export const EMPTY_TEXT_JSON =
  '{"root":{"children":[{"children":[],"format":"","indent":0,"type":"extended-paragraph","version":1,"textFormat":0,"textStyle":""}],"format":"","indent":0,"type":"root","version":1}}';

/**
 * Create Lexical JSON for plain text.
 *
 * Builds the JSON string directly to match the Unlayer editor's
 * rich-text serialization format.
 *
 * @param text - Plain text string
 * @returns Lexical JSON string
 *
 * @example
 * ```ts
 * const json = textToTextJson("Hello world");
 * ```
 */
export function textToTextJson(text: string): string {
  if (!text) return EMPTY_TEXT_JSON;

  const escaped = JSON.stringify(text); // handles quotes/newlines in text
  return `{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":${escaped},"type":"extended-text","version":1}],"format":"","indent":0,"type":"extended-paragraph","version":1,"textFormat":0,"textStyle":""}],"format":"","indent":0,"type":"root","version":1}}`;
}

// ── Lexical format bitmask → HTML tag mapping ────────────────────────────────
// Lexical encodes inline formatting in a numeric `format` bitmask on text nodes.
const FORMAT_TAGS: Array<[number, string, string]> = [
  [1, "<strong>", "</strong>"],    // bold
  [2, "<em>", "</em>"],            // italic
  [4, "<s>", "</s>"],              // strikethrough
  [8, "<u>", "</u>"],              // underline
  [16, "<code>", "</code>"],       // code
  [32, "<sub>", "</sub>"],         // subscript
  [64, "<sup>", "</sup>"],         // superscript
];

/**
 * Escape HTML special characters in text content.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Convert a Lexical text node to HTML, applying format bitmask.
 */
function textNodeToHtml(node: any): string {
  let html = escapeHtml(node.text || "");

  // Apply inline style attribute if present
  const style = node.style;

  // Wrap in format tags (innermost first)
  const format = node.format || 0;
  let openTags = "";
  let closeTags = "";
  for (const [bit, open, close] of FORMAT_TAGS) {
    if (format & bit) {
      openTags += open;
      closeTags = close + closeTags;
    }
  }
  html = openTags + html + closeTags;

  // Wrap in <span> if inline style is present
  if (style) {
    html = `<span style="${escapeHtml(style)}">${html}</span>`;
  }

  return html;
}

// Lexical serializes element-node alignment either as a string ("center")
// or, in older payloads, as the in-memory numeric format code.
const NUMERIC_ALIGN: Record<number, string> = {
  1: "left",
  2: "center",
  3: "right",
  4: "justify",
};

/**
 * Build a ` dir="..."` attribute chunk from a node's direction. Only "ltr"
 * and "rtl" are valid — the editor ignores anything else, and whitelisting
 * also keeps untrusted Lexical JSON from injecting attribute markup.
 */
function dirAttribute(direction: unknown): string {
  return direction === "ltr" || direction === "rtl"
    ? ` dir="${direction}"`
    : "";
}

/**
 * Resolve a paragraph node's text-align value from its `format` field.
 */
function paragraphAlign(format: unknown): string | undefined {
  if (typeof format === "string") {
    return ["left", "center", "right", "justify"].includes(format)
      ? format
      : undefined;
  }
  if (typeof format === "number") {
    return NUMERIC_ALIGN[format];
  }
  return undefined;
}

/**
 * Convert a Lexical paragraph node to HTML, matching the markup the
 * Unlayer editor exports for paragraphs.
 */
function paragraphNodeToHtml(node: any, childrenHtml: string): string {
  // Heading/Button textJson from editor round-trips marks its paragraphs as
  // inline tools; those export as <span> with no block styling.
  const isInlineTool = !!node.isInlineTool;
  const tag = isInlineTool ? "span" : "p";

  const dir = dirAttribute(node.direction);

  const styleParts: string[] = [];

  // Custom paragraph styles (e.g. background-color) come first so the
  // resets below win if they overlap.
  if (node.style) {
    styleParts.push(String(node.style).replace(/;+\s*$/, ""));
  }

  if (!isInlineTool) {
    // Reset the browser's default <p> margins so multiple paragraph lines
    // don't gain extra vertical spacing in email clients that strip head
    // resets. Zero both the physical shorthand and the logical block
    // longhands so the reset wins regardless of how a client resolves the
    // logical-vs-physical cascade.
    styleParts.push(
      "margin: 0px",
      "margin-block-start: 0px",
      "margin-block-end: 0px"
    );
  }

  const indent = Number(node.indent) || 0;
  if (indent > 0) {
    styleParts.push(`padding-inline-start: ${indent * 40}px`);
  }

  const align = paragraphAlign(node.format);
  if (align) {
    styleParts.push(`text-align: ${align}`);
  }

  const style =
    styleParts.length > 0
      ? ` style="${escapeHtml(styleParts.join("; ") + ";")}"`
      : "";

  // Empty paragraphs get a <br> for consistency with the editor
  return `<${tag}${dir}${style}>${childrenHtml || "<br>"}</${tag}>`;
}

/**
 * Convert a Lexical JSON node (and its children) to HTML.
 * Handles: root, paragraph, heading, text, link, list, listitem, linebreak.
 */
function nodeToHtml(node: any): string {
  if (!node || typeof node !== "object") return "";

  const type = node.type;

  // Leaf: text node
  if (type === "text" || type === "extended-text") {
    return textNodeToHtml(node);
  }

  // Leaf: line break
  if (type === "linebreak") {
    return "<br>";
  }

  // Recurse into children
  const childrenHtml = (node.children || []).map(nodeToHtml).join("");

  switch (type) {
    case "root":
      return childrenHtml;

    case "paragraph":
    case "extended-paragraph":
      return paragraphNodeToHtml(node, childrenHtml);

    case "heading": {
      // Whitelist the tag — it's interpolated into markup
      const tag = /^h[1-6]$/.test(node.tag) ? node.tag : "h1";
      const dir = dirAttribute(node.direction);
      return `<${tag}${dir}>${childrenHtml}</${tag}>`;
    }

    case "link": {
      const href = node.url ? ` href="${escapeHtml(node.url)}"` : "";
      const target = node.target ? ` target="${escapeHtml(node.target)}"` : "";
      const rel = node.rel ? ` rel="${escapeHtml(node.rel)}"` : "";
      return `<a${href}${target}${rel}>${childrenHtml}</a>`;
    }

    case "list": {
      const tag = node.listType === "number" ? "ol" : "ul";
      return `<${tag}>${childrenHtml}</${tag}>`;
    }

    case "listitem":
      return `<li>${childrenHtml}</li>`;

    default:
      // Unknown node type — pass through children
      return childrenHtml;
  }
}

/**
 * Convert Lexical JSON to HTML.
 *
 * Walks the JSON tree directly — no Lexical headless editor or DOM required.
 * Works identically in Node.js and browser environments.
 *
 * @param textJson - Lexical JSON string
 * @returns HTML string
 *
 * @example
 * ```ts
 * const html = generateHtmlFromTextJson('{"root":...}');
 * ```
 */
export function generateHtmlFromTextJson(textJson: string): string {
  if (!textJson) return "";

  try {
    const parsed = JSON.parse(textJson);

    // Raw HTML passthrough (produced by htmlToTextJson)
    if (parsed.__html) return parsed.__html;

    // Walk the Lexical JSON tree and produce HTML
    return nodeToHtml(parsed.root);
  } catch {
    return "";
  }
}

/**
 * Convert an HTML string to a textJson-compatible value.
 *
 * Wraps the HTML in a passthrough format that `generateHtmlFromTextJson`
 * detects and returns directly — avoiding the Lexical headless editor
 * round-trip (HTML → Lexical JSON → HTML) which doesn't work reliably
 * in browser environments.
 *
 * Supports any HTML formatting: bold, italic, underline, strikethrough,
 * code, links, lists, etc.
 *
 * @param html - HTML string with formatting (e.g. `"Hello <b>bold</b>"`)
 * @returns JSON string compatible with Paragraph's `textJson` prop
 *
 * @example
 * ```ts
 * const json = htmlToTextJson('Hello <b>world</b> and <a href="https://example.com">link</a>');
 * ```
 */
export function htmlToTextJson(html: string): string {
  if (!html) return EMPTY_TEXT_JSON;
  return JSON.stringify({ __html: html });
}
