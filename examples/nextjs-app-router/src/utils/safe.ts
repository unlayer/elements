/**
 * Escape a string before interpolating it into an email body.
 *
 * The Elements package renders the `html` prop verbatim, so any dynamic
 * value (a DB row, webhook payload, CMS field) must be escaped to prevent
 * markup injection.
 */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => escapeMap[char]);
}

const escapeMap: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/**
 * Validate that a URL is safe to use as a link target in an email.
 *
 * Rejects non-http(s) schemes such as `javascript:` that email clients and
 * the receiving application may otherwise preserve.
 */
export function requireSafeUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid URL: ${value}`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`Unsafe URL protocol: ${url.protocol}`);
  }
  return value;
}
