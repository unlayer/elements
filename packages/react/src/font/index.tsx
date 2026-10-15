/**
 * @unlayer/react-elements/font: `<Font>`, a web font for a template.
 */

export interface FontProps {
  /** The family name your styles use ("Inter"). */
  family: string;
  /**
   * Where it loads from: a stylesheet that declares it (a Google Fonts CSS URL), or the font file itself
   * (`.woff2`, `.woff`, `.ttf`, `.otf`, or any URL with `format`).
   */
  url?: string;
  /** The file's format ("woff2", "woff", "truetype", "opentype"): the URL is then the file. */
  format?: string;
  /** The weight this file is (400, 700, or a range, "100 900"). */
  weight?: number | string;
  /** The style this file is. */
  style?: "normal" | "italic";
  /** Families to show where it doesn't load (Outlook ignores web fonts): "Arial, sans-serif" (the default: sans-serif). */
  fallback?: string;
  /** The template's font: the root's `fontFamily`, unless it sets one (in the design too). */
  default?: boolean;
}

/** Text that can't end a CSS string, a declaration or an attribute. */
const clean = (text: unknown) => String(text ?? "").replace(/[<>{};"'\\]/g, "").trim();
const isFile = (font: FontProps) => !!font.format || /\.(woff2?|ttf|otf)([?#]|$)/i.test(font.url ?? "");
/** A URL that can't end its attribute or its CSS string: what could, percent-encoded. */
const safeUrl = (url: string) => url.trim().replace(/["'()<>\s\\]/g, (c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`);

/** A font's family as a root's `fontFamily` takes it: with the stylesheet the editor loads it from, when it's one. */
export function fontFamilyOf(font: FontProps): { label: string; value: string; url?: string } {
  const family = clean(font.family);
  const fallback = String(font.fallback ?? "sans-serif").replace(/[<>{};"\\]/g, "").trim() || "sans-serif";
  return { label: family, value: `'${family}', ${fallback}`, ...(font.url && !isFile(font) ? { url: safeUrl(font.url) } : {}) };
}

/** The head tags that load a font. In an email Outlook doesn't see them: with a web font declared it can fall back to Times New Roman. */
export function fontTags(font: FontProps, mode: string): string[] {
  if (!font.url) return [];
  const url = safeUrl(font.url);
  const tag = isFile(font)
    ? `<style type="text/css">@font-face { font-family: '${clean(font.family)}'; src: url('${url}')${font.format ? ` format('${clean(font.format)}')` : ""}; font-weight: ${clean(font.weight ?? 400)}; font-style: ${clean(font.style ?? "normal")}; }</style>`
    : `<link href="${url.replace(/&/g, "&amp;")}" rel="stylesheet" type="text/css">`;
  return [mode === "email" ? `<!--[if !mso]><!-->${tag}<!--<![endif]-->` : tag];
}

/** A font stack's first family, as the editor matches fonts: without quotes, any case. */
const primary = (stack: unknown) => String(stack).split(",")[0].replace(/['"]/g, "").trim().toLowerCase();

/**
 * A stylesheet font's URL on the design's fonts of its family (the body's and each block's `fontFamily`, a table's
 * `headerFontFamily` …) that have none: the editor keeps a web font so, loads it from there, and exports its `<link>`.
 */
function fontInDesign(font: FontProps, body: { values?: Record<string, any>; rows?: any[] }): void {
  const { url } = fontFamilyOf(font);
  const family = primary(clean(font.family));
  if (!url || !family) return;
  const add = (values: Record<string, any> | undefined) => {
    for (const [key, value] of Object.entries(values ?? {})) {
      if (/fontFamily$/i.test(key) && value && typeof value.value === "string" && value.url === undefined && primary(value.value) === family) values![key] = { ...value, url };
    }
  };
  add(body.values);
  for (const row of body.rows ?? []) for (const column of row.columns ?? []) for (const content of column.contents ?? []) add(content.values);
}

// The render that collects a template (Elements' main entry): a stack shared by every copy of Elements a process loads.
const COLLECTING = Symbol.for("@unlayer/react-elements/collecting");

/**
 * Font - Declares a web font for the template. Place it in an Email, Page or Document (or a component of yours
 * there): the document's head loads it (the stylesheet's `<link>`, or an `@font-face` for a font file), and with
 * `default` it's the root's `fontFamily`, in the HTML and the design. Outlook ignores web fonts: it shows `fallback`.
 *
 * @example
 * ```tsx
 * <Email>
 *   <Font family="Inter" url="https://fonts.googleapis.com/css2?family=Inter:wght@400;700" fallback="Arial, sans-serif" default />
 *   <Row>…</Row>
 * </Email>
 * ```
 */
export function Font(props: FontProps): null {
  // While a template is collected, what it gives the head and the root is recorded; it renders nothing.
  const frames = (globalThis as Record<symbol, Array<{ recorded: unknown[] } | null> | undefined>)[COLLECTING];
  frames?.[frames.length - 1]?.recorded.push({
    kind: "head",
    tags: (mode: string) => fontTags(props, mode),
    root: props.default ? { fontFamily: fontFamilyOf(props) } : undefined,
    design: (body: Parameters<typeof fontInDesign>[1]) => fontInDesign(props, body),
  });
  return null;
}

Font.displayName = "Font";

export default Font;
