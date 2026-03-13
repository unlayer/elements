/**
 * Preview Text Utility
 *
 * Generates hidden HTML that email clients use for inbox preview text.
 * The preview div is invisible in the rendered email but gets picked up
 * by email clients for the inbox preview line.
 */

const MAX_PREVIEW_LENGTH = 150;

/**
 * Invisible characters used to pad the preview text so email clients
 * don't pull body content into the preview line.
 */
const PADDING_CHARS = [
  "\u00A0",  // non-breaking space
  "\u200C",  // zero-width non-joiner
  "\u200B",  // zero-width space
  "\u200D",  // zero-width joiner
  "\u200E",  // left-to-right mark
  "\u200F",  // right-to-left mark
  "\uFEFF",  // zero-width no-break space
];

/**
 * Generate padding string of invisible characters to fill remaining space.
 * This prevents email clients from showing body text after the preview.
 */
function generatePadding(length: number): string {
  let padding = "";
  for (let i = 0; i < length; i++) {
    padding += PADDING_CHARS[i % PADDING_CHARS.length];
  }
  return padding;
}

/**
 * Generate the hidden preview HTML for email clients.
 *
 * @param text - The preview text to display in email client inboxes
 * @returns HTML string with hidden div containing preview text + invisible padding
 *
 * @example
 * ```ts
 * const html = generatePreviewHtml("Check out our new features!");
 * // Returns: <div data-skip-in-text="true" style="display:none;...">Check out our new features!&#847;&#8204;...</div>
 * ```
 */
export function generatePreviewHtml(text: string): string {
  if (!text || text.trim().length === 0) return "";

  const truncated = text.length > MAX_PREVIEW_LENGTH
    ? text.slice(0, MAX_PREVIEW_LENGTH)
    : text;

  const paddingLength = Math.max(0, MAX_PREVIEW_LENGTH - truncated.length);
  const padding = generatePadding(paddingLength);

  return (
    `<div data-skip-in-text="true" style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">` +
    truncated +
    padding +
    `</div>`
  );
}
