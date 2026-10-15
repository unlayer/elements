/**
 * What Markdown can hold that an email shouldn't: URLs that run code (`javascript:`), and raw HTML with scripts,
 * event handlers, frames or forms. Kept to what can only display.
 */

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };

/** Text as HTML; an entity reference written in it (`&copy;`) is kept, as Markdown keeps it. */
export const escapeText = (text: string) => text.replace(/&(?!#\d+;|#x[\da-f]+;|[a-z][\da-z]*;)|[<>"]/gi, (ch) => ESCAPES[ch]);
/** An attribute's value: every `&` escaped too, so an entity in a URL (`&#106;avascript:`) stays text. */
export const escapeAttribute = (text: string) => text.replace(/[&<>"]/g, (ch) => ESCAPES[ch]);

/** A URL as the browser reads it (entities decoded, control characters and spaces dropped), to read its scheme. */
const decoded = (url: string) =>
  url
    .replace(/&#(x[\da-f]+|\d+);?/gi, (_, n: string) => String.fromCodePoint(n[0].toLowerCase() === "x" ? parseInt(n.slice(1), 16) : Number(n)))
    .replace(/&(colon|tab|newline);/gi, (_, name: string) => ({ colon: ":", tab: "\t", newline: "\n" })[name.toLowerCase()]!)
    .replace(/[\u0000- \u007f-\u009f]/g, "");

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

/** Elements dropped with what's in them, and those dropped alone (their content shows as text). */
const WITH_CONTENT = /<(script|style|iframe|frameset|object|embed|applet|template|noscript|svg|math|select|textarea|title)\b[\s\S]*?(?:<\/\1\s*>|$)/gi;
const DROPPED = /^(frame|form|input|button|option|link|meta|base|param|source|track|dialog)$/i;
const URL_ATTRIBUTES: Record<string, "link" | "image"> = { href: "link", src: "image", background: "image", poster: "image", action: "link", cite: "link" };

/**
 * Raw HTML kept as it displays: no script, style sheet, frame, form or embedded object, no event handler
 * (`onclick`), no URL that runs code, no CSS expression. A `<` that doesn't start a tag is text.
 */
export function sanitizeHtml(html: string): string {
  return html
    .replace(WITH_CONTENT, "")
    .replace(/<!--[\s\S]*?(?:-->|$)|<(\/?)([a-z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>|</gi, (whole, close: string | undefined, name: string | undefined, attributes: string | undefined) => {
      // A comment (an Outlook condition can hold anything) goes; a stray `<` is text.
      if (!name) return whole === "<" ? "&lt;" : "";
      if (DROPPED.test(name)) return "";
      if (close) return `</${name}>`;
      let kept = "";
      for (const [, attribute, assigned, double, single, bare] of (attributes ?? "").matchAll(/([^\s"'<>\/=]+)(\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
        const key = attribute.toLowerCase();
        const value = double ?? single ?? bare ?? "";
        if (/^on|^(srcdoc|formaction|xmlns|xlink:href|srcset)$/.test(key)) continue;
        if (URL_ATTRIBUTES[key] && safeUrl(value, URL_ATTRIBUTES[key]) === undefined) continue;
        if (key === "style" && /expression|javascript:|behavior|-moz-binding|url\s*\(/i.test(decoded(value))) continue;
        kept += assigned ? ` ${key}="${value.replace(/"/g, "&quot;").replace(/</g, "&lt;")}"` : ` ${key}`;
      }
      return `<${name}${kept}${/\/\s*$/.test(attributes ?? "") ? " /" : ""}>`;
    });
}
