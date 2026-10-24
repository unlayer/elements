/**
 * What a class's value can be written as, in a prop or in markup's `style` (see props.ts and html.ts).
 */
import { cssValueSafe } from "@unlayer-internal/shared-elements";
import { unsafeUrl } from "../markdown/sanitize";
import type { ClassDeclaration } from "./declarations";

/**
 * A class's value as a prop can take it, or undefined where it can't: the editor's
 * exporters write props into a `style="…"` (or a `<style>`) as they are, so nothing that ends an attribute or starts a
 * tag (`"`, `<`, `>`, or a CSS escape of one of them or of `'`), and nothing CSS can't hold there (see cssValueSafe). A
 * font family's names in double quotes are in single ones, as the exporters write them. (An arbitrary value from data,
 * `[color:'"><img …>']`, can't add markup that way.)
 */
export function propValue({ property, value }: ClassDeclaration): string | undefined {
  const written = property === "font-family" ? value.replace(/"([^"'\\<>]*)"/g, "'$1'") : value;
  return /["<>]|\\(?:["'<>]|0{0,4}(?:22|27|3c|3e)(?![\da-f]))/i.test(written) || !cssValueSafe(written) ? undefined : written;
}

/** A string in CSS, single- or double-quoted (its quote closed). */
const STRINGS = /'[^']*'|"[^"]*"/g;
/** An image data URL of SVG, which markup keeps (see markupValue). */
const SVG = /url\(\s*(["']?)data:image\/svg\+xml[;,][^"')]*\1\s*\)/gi;

/**
 * A class's value as markup's `style` can take it, or undefined where it can't. Markup's `style` is written escaped
 * (its `"` as `&quot;`), so a value only can't hold what could end the attribute once its references and CSS escapes
 * are read (`<`, `>`, or a CSS escape of one of them or of a quote: `font-['\\22><img …>']`), a URL that runs code or
 * loads what isn't an image (`url(javascript:…)`, as a prop can't hold either), or, outside its strings, what ends a
 * declaration or a block, or opens a comment. A string's `;` is its own (`url('/a.png?v=1;2')`). A font family's names
 * and a `url()` in double quotes are in single ones, as a prop's are, where they hold no quote (`'Open Sans'`).
 */
export function markupValue({ property, value }: ClassDeclaration): string | undefined {
  let written = property === "font-family" ? value.replace(/"([^"'\\<>]*)"/g, "'$1'") : value;
  written = written.replace(/url\(\s*"([^"'\\<>]*)"\s*\)/gi, "url('$1')");
  if (/[<>]|\\(?:["'<>]|0{0,4}(?:22|27|3c|3e)(?![\da-f]))/i.test(written) || unsafeUrl(written.replace(SVG, "url(a.png)"))) return undefined;
  return cssValueSafe(written.replace(STRINGS, "''")) ? written : undefined;
}
