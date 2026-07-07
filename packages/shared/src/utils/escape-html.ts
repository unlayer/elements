/**
 * HTML escaping for user-provided plain text and URL values.
 *
 * The plain-text API surfaces (component children, the flat `text` prop,
 * shorthand item arrays, previewText) promise text semantics — the value the
 * author passes is what the reader sees. These helpers enforce that promise
 * at the point where a value crosses into markup.
 *
 * Raw-HTML surfaces (`<Html>`, the `html` prop, the `values` escape hatch)
 * deliberately do NOT use these — they are the documented opt-in for markup.
 */

/**
 * Escape a plain-text string for interpolation into HTML content or a
 * double-quoted attribute value (`& < > "`).
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Reject URL schemes that execute script when used as a link target.
 * Returns the URL unchanged when safe, or "" (with a console warning) for
 * `javascript:`, `vbscript:`, and `data:` URLs.
 */
export function sanitizeUrl(url: string): string {
  const scheme = /^\s*([a-z][a-z0-9+.-]*):/i.exec(url)?.[1]?.toLowerCase();
  if (scheme === "javascript" || scheme === "vbscript" || scheme === "data") {
    console.warn(
      `[Unlayer] Blocked link with unsafe "${scheme}:" URL scheme. ` +
        "Only http(s), mailto, tel and relative URLs are rendered."
    );
    return "";
  }
  return url;
}

/**
 * Prepare a user-provided URL for a double-quoted href/src attribute:
 * block script-executing schemes, then escape attribute-breaking characters.
 */
export function escapeUrlAttribute(url: string): string {
  return escapeHtml(sanitizeUrl(url));
}
