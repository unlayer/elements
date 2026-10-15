/**
 * A web font's stylesheet URL in the design, where the editor keeps it: on the `fontFamily` values of its family. A
 * `<Font>` (the font entry) and a root's `fonts` prop both write it here. Nothing in this file imports: the font entry
 * builds it in.
 */

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
