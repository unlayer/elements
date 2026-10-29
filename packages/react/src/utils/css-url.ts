/**
 * A background image's URL as the editor's exporters write it: in `url('…')` in a style attribute, and in a
 * `background` and a VML `src` attribute, all in double quotes. What could end the attribute, the CSS string or
 * `url(…)` is percent-encoded, as a browser would (the same address), and an email service's tag in it stays as
 * written, as in 0.2.1, for the service to read it.
 */
import { entities } from "@unlayer-internal/shared-elements";

/** An attribute reference, `${…}`: Braze's (also inside a Liquid tag, `{{${first_name} | default: 'you'}}`), Responsys's. */
const REFERENCE_TAG = String.raw`\$\{[^{}]*\}`;
/** An email service's tag: `{{ … }}`, `{% … %}` (either with `${…}` in it), `${…}`, `<% … %>`, `%% … %%` (AMPscript). */
const TAG = String.raw`\{\{(?:[^{}]|${REFERENCE_TAG})*\}\}|\{%(?:[^{}]|${REFERENCE_TAG})*%\}|${REFERENCE_TAG}|<%[^<>]*%>|%%[^%]*%%`;
/** What could end the attribute, the string or `url(…)`: quotes, brackets, `<`, `>`, `\`, spaces and control characters. */
const ENDS = String.raw`[\u0000- "'()<>\\\u007f]`;
const PARTS = new RegExp(`${TAG}|${ENDS}`, "g");
const ENCODED = new RegExp(ENDS, "g");
const ENDS_ONE = new RegExp(`^${ENDS}$`);
/** What a tag can't keep, wherever it is: a `"` ends the attribute, a `\` or a line break the string. */
const ALWAYS = /[\u0000-\u001f"\\\u007f]/g;
/** A character reference, as a browser reads one in an attribute, and more (any case, with or without `;`). */
const REFERENCE = /&(?:#(?:x[\da-f]+|\d+)|[a-z]+);?/gi;

/**
 * Whether a URL stays where the exporters write it: in `url('…')`, in its string to its end (each `'` in it ends the
 * string or starts another, and a bracket outside one would end `url(…)` or open what its own `)` then closes), and in
 * the comment an email's Outlook markup is in (a `-->` or `--!>` ends it).
 */
function staysInString(url: string): boolean {
  if (/--!?>/.test(url)) return false;
  let inString = true;
  for (const char of url) {
    if (char === "'") inString = !inString;
    else if (!inString && (char === "(" || char === ")")) return false;
  }
  return inString;
}

/**
 * `url` as the exporters can write it. A character reference that reads as a character that could end something
 * (`&#39;`, `&quot;`) is that character encoded, as the browser would read it before the CSS (one that reads as
 * another, `&amp;`, stays as written). A tag keeps all but a `"`, a `\` and control characters; where its quotes would
 * take a bracket out of the string, or leave the string open at the URL's end, or it would end a comment, the whole
 * URL is encoded instead.
 */
export function cssUrlValue(url: string): string {
  const read = url.replace(REFERENCE, (reference) => {
    const char = entities(reference);
    return char !== reference && ENDS_ONE.test(char) ? escape(char) : reference;
  });
  const tagged = read.replace(PARTS, (part) => (part.length > 1 ? part.replace(ALWAYS, escape) : escape(part)));
  return staysInString(tagged) ? tagged : read.replace(ENCODED, escape);
}
