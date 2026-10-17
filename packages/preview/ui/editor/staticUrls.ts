/**
 * Templates point at the templates folder's static/ files with root-relative
 * URLs (`/static/logo.png`), which the preview serves. The Unlayer editor runs
 * in an iframe on editor.unlayer.com, where those URLs mean nothing, so the
 * design it gets has them rewritten first.
 */

const PREFIX = "/static/";

// A value that is a /static/ URL (not text that starts with the words).
const WHOLE = /^\/static\/[^\s"'<>]*$/;

// A /static/ URL inside HTML or CSS text in a value (an HTML block, a text block's markup).
const EMBEDDED = /(\s(?:src|href|background)=["']|url\(\s*(?:&quot;|["'])?)(\/static\/[^"'()\s>&]*)/g;

/**
 * A copy of `design` with each /static/ URL in it replaced by what `to`
 * returns for it: a value that is one (an image's `src.url`, a row's
 * `backgroundImage.url`), and one inside HTML or CSS text.
 */
export function rewriteStaticUrls<T>(design: T, to: (path: string) => string): T {
  const visit = (value: unknown): unknown => {
    if (typeof value === "string") {
      if (WHOLE.test(value)) return to(value);
      return value.includes(PREFIX) ? value.replace(EMBEDDED, (_, lead: string, path: string) => lead + to(path)) : value;
    }
    if (Array.isArray(value)) return value.map(visit);
    if (value !== null && typeof value === "object") {
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, visit(item)]));
    }
    return value;
  };
  return visit(design) as T;
}

/** The distinct /static/ URLs in `design`. */
export function staticPaths(design: unknown): string[] {
  const paths = new Set<string>();
  rewriteStaticUrls(design, (path) => {
    paths.add(path);
    return path;
  });
  return [...paths];
}

/**
 * The URL of a /static/ path on the preview, from `root`: the preview's own
 * address (`http://localhost:3000/`), or the folder a static build is hosted
 * in (`https://example.com/emails/`, where static/ sits next to index.html).
 */
export function staticUrl(path: string, root: string): string {
  return new URL(path.slice(1), root).href;
}

/** A copy of `design` with its /static/ URLs made absolute on the preview at `root`. */
export function absoluteStaticUrls<T>(design: T, root: string): T {
  return rewriteStaticUrls(design, (path) => staticUrl(path, root));
}
