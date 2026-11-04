/**
 * The web fonts the Unlayer editor knows by name. Its export links a font's stylesheet wherever a design uses it: as a
 * block's or the body's font, or as a `font-family` in a text's HTML. A stack is known by its first family.
 */
import type { Values } from "./values";

const FONTS: Record<string, string> = {
  "cabin": "Cabin:400,700",
  "crimson text": "Crimson+Text:400,700",
  "lato": "Lato:400,700",
  "lobster two": "Lobster+Two:400,700",
  "montserrat": "Montserrat:400,700",
  "old standard tt": "Old+Standard+TT:400,700",
  "open sans": "Open+Sans:400,700",
  "pacifico": "Pacifico",
  "playfair display": "Playfair+Display:400,700",
  "raleway": "Raleway:400,700",
  "rubik": "Rubik:400,700",
  "source sans pro": "Source+Sans+Pro:400,700",
};

const IN_TEXT = /\bfont-family\s*:\s*([^;>"}]*)/g;
const RICH_TEXT = ["text", "richText", "textJson"];

/** A stack's stylesheet, where the editor knows its first family. */
const stylesheet = (stack: unknown): string | undefined => {
  if (typeof stack !== "string") return undefined;
  const family = FONTS[stack.split(",")[0].replace(/['"]/g, "").trim().toLowerCase()];
  return family && `https://fonts.googleapis.com/css?family=${family}`;
};

/** What a body or a block's values use. */
function inValues(values: Values | undefined, urls: Set<string>): void {
  for (const [key, value] of Object.entries(values ?? {})) {
    const fromValue = key === "fontFamily" && value && typeof value === "object" ? stylesheet((value as Values).value) : undefined;
    if (fromValue) urls.add(fromValue);
    if (RICH_TEXT.includes(key) && typeof value === "string") {
      for (const [, stack] of value.replace(/&quot;|&#39;/g, "'").matchAll(IN_TEXT)) {
        const url = stylesheet(stack);
        if (url) urls.add(url);
      }
    }
  }
}

/** The stylesheets of the editor's web fonts a design uses, each once. */
export function editorFontLinks(design: { body: Values }): Array<{ url: string }> {
  const urls = new Set<string>();
  inValues(design.body.values, urls);
  for (const row of (design.body.rows ?? []) as Values[]) {
    for (const column of (row.columns ?? []) as Values[]) {
      for (const content of (column.contents ?? []) as Values[]) inValues(content.values, urls);
    }
  }
  return [...urls].map((url) => ({ url }));
}
