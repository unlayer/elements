/**
 * A web font's stylesheet URL in the design, where the editor keeps it: on the `fontFamily` values of its family. A
 * `<Font>` (the font entry) and a root's `fonts` prop both write it here. It imports only what the main entry has
 * (the font entry builds it in).
 */
import { entities, unrunUrl } from "@unlayer-internal/shared-elements";

/** A URL that can't end its attribute or its CSS string: what could, percent-encoded. */
export const safeUrl = (url: string) => url.trim().replace(/["'()<>\s\\]/g, (c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`);

/** A font stack's first family, as the editor matches fonts: without quotes, any case. */
export const primaryFamily = (stack: unknown) => String(stack).split(",")[0].replace(/['"]/g, "").trim().toLowerCase();

/**
 * A stylesheet's URL on the design's fonts of `family` (a primary family, see primaryFamily) that have none: the
 * body's and each block's `fontFamily`, a table's `headerFontFamily` … The editor keeps a web font so, loads it from
 * there, and exports its `<link>`. Whether the design has a font of the family (it can hold the stylesheet).
 */
export function fontUrlInDesign(family: string, url: string, body: { values?: Record<string, any>; rows?: any[] }): boolean {
  let found = false;
  const add = (values: Record<string, any> | undefined) => {
    for (const [key, value] of Object.entries(values ?? {})) {
      if (!/fontFamily$/i.test(key) || !value || typeof value.value !== "string" || primaryFamily(value.value) !== family) continue;
      found = true;
      if (value.url === undefined) values![key] = { ...value, url };
    }
  };
  add(body.values);
  for (const row of body.rows ?? []) for (const column of row.columns ?? []) for (const content of column.contents ?? []) add(content.values);
  return found;
}

/** A URL's percent-encoded text decoded (as written where it can't be). */
function decoded(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

/**
 * The families a stylesheet URL loads, where it names them: its `family` parameters, as Google Fonts (and services
 * like it) write them (`family=Inter:wght@400;700`, `family=Open+Sans|Lato`), or the `font-family` of the
 * `@font-face` rules a `data:text/css` URL holds. Primary families (see primaryFamily).
 */
export function urlFamilies(url: string): string[] {
  const text = String(url);
  if (/^data:text\/css[,;]/i.test(text)) return [...decoded(text.slice(text.indexOf(",") + 1)).matchAll(/font-family:\s*([^;}]+)/gi)].map((m) => primaryFamily(m[1]));
  const query = text.split("#")[0].split("?")[1] ?? "";
  return query
    .split("&")
    .filter((param) => param.startsWith("family="))
    .flatMap((param) => decoded(param.slice(7).replace(/\+/g, " ")).split("|"))
    .map((family) => primaryFamily(family.split(":")[0]))
    .filter(Boolean);
}

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

/**
 * Text that can't end a CSS string, a declaration or an attribute, read as a browser reads it in a style attribute:
 * its character references decoded first (`&#59;` is a `;` there), and no `&` or control character left to make one.
 * A fallback's families can be quoted (`'Helvetica Neue', Arial`).
 */
const UNSAFE = /[<>{};"'\\&\u0000-\u001f\u007f]/g;
const UNSAFE_QUOTED = /[<>{};"\\&\u0000-\u001f\u007f]/g;
const clean = (text: unknown, quoted = false) => entities(String(text ?? "")).replace(quoted ? UNSAFE_QUOTED : UNSAFE, "").trim();
const isFile = (font: FontProps) => !!font.format || /\.(woff2?|ttf|otf)([?#]|$)/i.test(font.url ?? "");

/** A font's family as a root's `fontFamily` takes it: with the stylesheet the editor loads it from, when it's one. */
export function fontFamilyOf(font: FontProps): { label: string; value: string; url?: string } {
  const family = clean(font.family);
  const fallback = clean(font.fallback ?? "sans-serif", true) || "sans-serif";
  return { label: family, value: `'${family}', ${fallback}`, ...(font.url && !isFile(font) ? { url: safeUrl(font.url) } : {}) };
}

/** The head tags that load a font. In an email Outlook doesn't see them: with a web font declared it can fall back to Times New Roman. */
export function fontTags(font: FontProps, mode: string): string[] {
  // (None for a URL that runs code: `javascript:`, as React tells one.)
  if (!font.url || unrunUrl(String(font.url)) !== String(font.url)) return [];
  const url = safeUrl(font.url);
  const tag = isFile(font)
    ? `<style type="text/css">@font-face { font-family: '${clean(font.family)}'; src: url('${url}')${font.format ? ` format('${clean(font.format)}')` : ""}; font-weight: ${clean(font.weight ?? 400)}; font-style: ${clean(font.style ?? "normal")}; }</style>`
    : `<link href="${url.replace(/&/g, "&amp;")}" rel="stylesheet" type="text/css">`;
  return [mode === "email" ? `<!--[if !mso]><!-->${tag}<!--<![endif]-->` : tag];
}

/** A stylesheet font's URL on the design's fonts of its family that have none (see fontUrlInDesign). */
