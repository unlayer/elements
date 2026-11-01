import {
  checkDocument,
  checkTarget,
  ElementsError,
  registryOf,
  resolveDocument,
  type ComponentsOption,
  type Diagnostic,
  type Target,
} from "@unlayer-internal/elements-core";
import { renderEmail, type EmailOptions } from "./email";
import { renderPage, type PageOptions } from "./page";
import { renderText } from "./plain-text";

export { renderEmail, EMAIL_PHONE_MARGIN, GMAIL_CLIP_BYTES, GMAIL_STYLE_BYTES, type EmailHtml, type EmailOptions } from "./email";
export { renderPage, PAGE_PHONE_WIDTH, type PageHtml, type PageOptions } from "./page";
export { renderText, type TextOptions } from "./plain-text";
export { Stylesheet, CLASS_PREFIX, type Media } from "./shared/classes";

export interface RenderOptions extends PageOptions, EmailOptions {}

export interface RenderResult {
  /** The whole document, from `<!DOCTYPE html>`. */
  html: string;
  /** The plain-text version. */
  text: string;
  /** What goes in `<head>` and in `<body>`, and the body's own style: to embed the output in a page of your own. */
  head: string;
  body: string;
  bodyStyle: string;
  /** Warnings and notes (errors are thrown). */
  diagnostics: Diagnostic[];
}

/** The output each root renders to, and whether its writer exists yet. */
const OUTPUTS: Record<string, { target: Target; ready: boolean; later?: string }> = {
  Page: { target: "web", ready: true },
  Email: { target: "email", ready: true },
};

/**
 * A template (Elements' internal tree, with the custom components it uses)
 * rendered to the output its root says: checked, custom components
 * expanded, laid out, then written. Throws an `ElementsError` listing
 * the errors if there are any.
 */
export function renderTemplate(input: unknown, options: RenderOptions & ComponentsOption = {}): RenderResult {
  const registry = registryOf(options);
  const checked = checkDocument(input, registry);
  const diagnostics = [...checked.diagnostics];
  if (!checked.document || diagnostics.some((d) => d.severity === "error")) throw new ElementsError(diagnostics);
  const root = checked.document.root.type;
  const output = OUTPUTS[root];
  if (!output?.ready) throw new Error(`[Elements] ${output?.later ?? `A ${root} can't be rendered yet`}`);
  diagnostics.push(...checkTarget(checked.document, output.target, registry));
  const resolved = resolveDocument(checked.document, registry);
  diagnostics.push(...resolved.diagnostics);
  if (diagnostics.some((d) => d.severity === "error")) throw new ElementsError(diagnostics);
  const text = renderText(resolved, options);
  if (output.target === "email") {
    const email = renderEmail(resolved, options);
    return { html: email.html, head: email.head, body: email.body, bodyStyle: email.bodyStyle, text, diagnostics: [...diagnostics, ...email.diagnostics] };
  }
  return { ...renderPage(resolved, options), text, diagnostics };
}
