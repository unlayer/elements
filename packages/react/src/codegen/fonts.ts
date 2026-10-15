/**
 * Web fonts: the editor keeps a web font's URL on each font of its family (a block's or the body's `fontFamily`),
 * loads it from there and exports its `<link>`. In Elements a `<Font>` loads it, and puts its URL back on the fonts
 * of its family in the design (see the font entry). So the code declares one `<Font>` per web font, and a font that
 * the `<Font>` gives its URL back to is written without it.
 */
import { fontFamilyOf } from "../font/index";
import type { ModuleState } from "./state";
import { isPlainObject, type Plain } from "./values";

/** A font stack's first family, as written (without quotes). */
export const firstFamily = (stack: string) => stack.split(",")[0].replace(/['"]/g, "").trim();

/** The web fonts a design uses (fonts with a URL), by URL: the family each `<Font>` declares. */
export function webFonts(value: unknown, found = new Map<string, string>(), key = ""): Map<string, string> {
  if (Array.isArray(value)) value.forEach((item) => webFonts(item, found));
  else if (isPlainObject(value)) {
    if (/fontFamily$/i.test(key) && typeof value.url === "string" && value.url && typeof value.value === "string") {
      if (!found.has(value.url)) found.set(value.url, firstFamily(value.value) || String(value.label ?? ""));
    } else for (const [name, item] of Object.entries(value)) webFonts(item, found, name);
  }
  return found;
}

/**
 * The families whose URL a `<Font>` puts back on their fonts, by family (any case): the stylesheets (a font file is
 * an `@font-face`, which the editor has no place for) whose family is the only one with that name.
 */
export function restoredFonts(fonts: Map<string, string>): Map<string, string> {
  const urls = new Map<string, Set<string>>();
  for (const [url, family] of fonts) {
    const key = family.toLowerCase();
    if (fontFamilyOf({ family, url }).url === url && fontFamilyOf({ family }).label === family) urls.set(key, (urls.get(key) ?? new Set()).add(url));
  }
  return new Map([...urls].filter(([, set]) => set.size === 1).map(([key, set]) => [key, [...set][0]]));
}

/** A font without the URL its family's `<Font>` gives it back (a label and value: what the prop takes). */
export function withoutRestoredUrl(font: unknown, state: ModuleState): unknown {
  if (!isPlainObject(font) || typeof font.value !== "string" || Object.keys(font).some((key) => !["label", "value", "url"].includes(key))) return font;
  if (state.restoredFonts.get(firstFamily(font.value).toLowerCase()) !== font.url) return font;
  const { url: _url, ...rest } = font as Plain;
  return rest;
}
