/**
 * Text in an attribute as the browser reads it, to tell what a URL's scheme is: its character references decoded,
 * and the characters a browser leaves out of a scheme dropped. The Markdown sanitizer (src/markdown/sanitize.ts) and
 * the rich text in children (inline-html.ts) read URLs with it.
 */

import { entities } from "@unlayer-internal/shared-elements";

export { codePoint, entities } from "@unlayer-internal/shared-elements";

/** Text without the control characters and spaces a browser leaves out of a URL's scheme (and more). */
export const tight = (text: string) => text.replace(/[\u0000- \u007f-\u009f]/g, "");

/** A URL as the browser reads it (references decoded, control characters and spaces dropped), to read its scheme. */
export const decoded = (url: string) => tight(entities(url));
