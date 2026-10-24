/**
 * What a class's value can be written as, in a prop or in markup's `style` (see props.ts and html.ts).
 */
import { cssValueSafe } from "@unlayer-internal/shared-elements";
import type { ClassDeclaration } from "./declarations";

/**
 * A class's value as a prop can take it, or an inline style in markup, or undefined where it can't: the editor's
 * exporters write props into a `style="…"` (or a `<style>`) as they are, so nothing that ends an attribute or starts a
 * tag (`"`, `<`, `>`, or a CSS escape of one of them or of `'`), and nothing CSS can't hold there (see cssValueSafe). A
 * font family's names in double quotes are in single ones, as the exporters write them. (An arbitrary value from data,
 * `[color:'"><img …>']`, can't add markup that way, in a prop or in markup, a Markdown's too.)
 */
export function propValue({ property, value }: ClassDeclaration): string | undefined {
  const written = property === "font-family" ? value.replace(/"([^"'\\<>]*)"/g, "'$1'") : value;
  return /["<>]|\\(?:["'<>]|0{0,4}(?:22|27|3c|3e)(?![\da-f]))/i.test(written) || !cssValueSafe(written) ? undefined : written;
}
