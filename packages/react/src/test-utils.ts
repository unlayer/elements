import React from "react";
import { REACT_18 } from "./engine/react-compat";

/** React's act(): `react`'s since React 18.3, react-dom's test utils' before (18.0–18.2). */
export const act: typeof React.act = (React as { act?: typeof React.act }).act ?? (await import("react-dom/test-utils")).act;

/**
 * Asserts that a rendered component did NOT hit the error fallback.
 * The error fallback contains "failed to render" text — if that's
 * present, the component crashed and the test should fail.
 */
export function expectNoRenderError(container: HTMLElement): void {
  const html = container.innerHTML;
  if (html.includes("failed to render")) {
    throw new Error(
      `Component crashed to error fallback.\nRendered HTML:\n${html}`
    );
  }
}

/** The URL react-dom 19 writes for a `javascript:` one, as in an attribute: Elements writes it with any React. */
export const BLOCKED_URL = "javascript:throw new Error(&#x27;React has blocked a javascript: URL as a security precaution.&#x27;)";

const JAVASCRIPT_URL = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
const unescaped = (value: string) => value.replace(/&(quot|amp|lt|gt|#x27);/g, (_, name: string) => ({ quot: '"', amp: "&", lt: "<", gt: ">", "#x27": "'" })[name]!);
/** The names with "-" that aren't custom elements, as React tells them. */
const NOT_CUSTOM = /^(annotation-xml|color-profile|font-face|font-face-src|font-face-uri|font-face-format|font-face-name|missing-glyph)$/;

/**
 * react-dom's markup with a `javascript:` URL written as Elements writes it: as react-dom 19 writes it, with any React
 * (react-dom 18 writes it as given). In React 18's markup, a `src`, `href`, `action`, `formaction` or `xlink:href`, and
 * an <object>'s `data`, but a custom element's (a name with "-" or an `is`, as React 18 tells one); React 19's is as
 * Elements writes it.
 */
export function blockedUrls(html: string): string {
  if (!REACT_18) return html;
  return html.replace(/<([a-zA-Z][^\s/>]*)([^>]*)>/g, (tag, name: string, attributes: string) => {
    if ((name.includes("-") && !NOT_CUSTOM.test(name)) || / is="/.test(attributes)) return tag;
    const urls = name === "object" ? /^(src|href|action|formaction|xlink:href|data)$/ : /^(src|href|action|formaction|xlink:href)$/;
    return `<${name}${attributes.replace(/ ([^\s="]+)="([^"]*)"/g, (whole, attribute: string, value: string) => (urls.test(attribute) && JAVASCRIPT_URL.test(unescaped(value)) ? ` ${attribute}="${BLOCKED_URL}"` : whole))}>`;
  });
}
