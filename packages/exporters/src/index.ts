import {
  checkDocument,
  checkTargetExpanded,
  ElementsError,
  expandDocument,
  registryOf,
  resolveExpanded,
  type ComponentsOption,
  type Diagnostic,
  type ResolvedDocument,
  type Target,
} from "@unlayer-internal/elements-core";
import { renderEmail, type EmailOptions } from "./email";
import { emailSupport } from "./email/support";
import { renderPage, type PageOptions } from "./page";
import { renderText } from "./plain-text";

export { renderEmail, EMAIL_PHONE_MARGIN, GMAIL_CLIP_BYTES, GMAIL_STYLE_BYTES, type EmailHtml, type EmailOptions } from "./email";
export { renderPage, PAGE_PHONE_WIDTH, type PageHtml, type PageOptions } from "./page";
export { renderText, type TextOptions } from "./plain-text";
export { emailSupport } from "./email/support";
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

export interface Prepared {
  /** The template laid out, its custom components expanded; null where it has errors. */
  resolved: ResolvedDocument | null;
  /** The output its root renders to. */
  target: Target | null;
  /** Everything found: errors, warnings and notes. */
  diagnostics: Diagnostic[];
}

/**
 * What both validating and rendering do, once: the template checked, its
 * custom components expanded (each rendered once), checked against the output
 * its root says, laid out, and what that output can't do as asked found.
 * Only what needs the written output (an email's size against Gmail's limits)
 * is left to rendering.
 */
export function prepareTemplate(input: unknown, options: ComponentsOption = {}): Prepared {
  const registry = registryOf(options);
  const checked = checkDocument(input, registry);
  const diagnostics = [...checked.diagnostics];
  const failed = () => diagnostics.some((d) => d.severity === "error");
  if (!checked.document || failed()) return { resolved: null, target: null, diagnostics };
  const root = checked.document.root.type;
  const output = OUTPUTS[root];
  if (!output?.ready) {
    diagnostics.push({ code: "output/unavailable", severity: "error", message: output?.later ?? `A ${root} can't be rendered yet`, path: "root" });
    return { resolved: null, target: null, diagnostics };
  }
  const expanded = expandDocument(checked.document, registry);
  diagnostics.push(...expanded.diagnostics);
  if (failed()) return { resolved: null, target: output.target, diagnostics };
  diagnostics.push(...checkTargetExpanded(expanded.document, output.target, registry));
  if (failed()) return { resolved: null, target: output.target, diagnostics };
  const resolved = resolveExpanded(expanded.document, registry);
  diagnostics.push(...resolved.diagnostics);
  if (output.target === "email") diagnostics.push(...emailSupport(resolved.root));
  return { resolved: failed() ? null : resolved, target: output.target, diagnostics };
}

/** A template's problems, without writing it: errors make it invalid, warnings and notes don't. */
export function validateTemplate(input: unknown, options: ComponentsOption = {}): { valid: boolean; diagnostics: Diagnostic[] } {
  const { diagnostics } = prepareTemplate(input, options);
  return { valid: !diagnostics.some((d) => d.severity === "error"), diagnostics };
}

/**
 * A template (Elements' internal tree, with the custom components it uses)
 * rendered to the output its root says: prepared (`prepareTemplate`), then
 * written. Throws an `ElementsError` listing the errors if there are any.
 */
export function renderTemplate(input: unknown, options: RenderOptions & ComponentsOption = {}): RenderResult {
  const { resolved, target, diagnostics } = prepareTemplate(input, options);
  if (!resolved) throw new ElementsError(diagnostics);
  const text = renderText(resolved, options);
  if (target === "email") {
    const email = renderEmail(resolved, options);
    return { html: email.html, head: email.head, body: email.body, bodyStyle: email.bodyStyle, text, diagnostics: [...diagnostics, ...email.diagnostics] };
  }
  return { ...renderPage(resolved, options), text, diagnostics };
}
