/**
 * Validate that a URL is safe to use as a link target in an email.
 *
 * Elements refuses links that run scripts (`javascript:`) when it renders. This
 * is stricter, for a value that comes from outside: an absolute http(s) URL only.
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
