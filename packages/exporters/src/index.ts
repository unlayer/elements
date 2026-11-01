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
  type ResolvedNode,
  type Target,
} from "@unlayer-internal/elements-core";
import { renderEmail, type EmailOptions } from "./email";
import { emailSupport } from "./email/support";
import { support } from "./shared/support";
import { renderPage, type PageOptions } from "./page";
import { renderText } from "./plain-text";
import { prettyHtml } from "./shared/pretty";

export { renderEmail, EMAIL_PHONE_MARGIN, GMAIL_CLIP_BYTES, GMAIL_STYLE_BYTES, type EmailHtml, type EmailOptions } from "./email";
export { renderPage, PAGE_PHONE_WIDTH, type PageHtml, type PageOptions } from "./page";
export { renderText, type TextOptions } from "./plain-text";
export { emailSupport } from "./email/support";
export { support } from "./shared/support";
export { Stylesheet, CLASS_PREFIX, type Media } from "./shared/classes";

export interface RenderOptions extends PageOptions, EmailOptions {
  /** The HTML indented, for reading it; for sending, the compact HTML (white space may change how some email clients show it). */
  pretty?: boolean;
}

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
  // Print HTML: a page writer's, each page a box of the paper's size.
  Document: { target: "web", ready: true },
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
  diagnostics.push(...(output.target === "email" ? emailSupport(resolved.root) : support(resolved.root, output.target)));
  if (root !== "Document") diagnostics.push(...pageNumbersOutside(resolved.root));
  return { resolved: failed() ? null : resolved, target: output.target, diagnostics };
}

/** A PageNumber outside a Document: a page has no number there. */
function pageNumbersOutside(root: ResolvedNode): Diagnostic[] {
  const out: Diagnostic[] = [];
  const visit = (node: ResolvedNode) => {
    if (node.type === "PageNumber") {
      out.push({ code: "document/page-number", severity: "error", message: `A PageNumber is a page's number in a Document; this ${root.type} has no pages`, path: node.path, ...(node.id ? { nodeId: node.id } : {}) });
    }
    for (const child of node.children) if (typeof child !== "string") visit(child);
  };
  visit(root);
  return out;
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
  const written = target === "email" ? renderEmail(resolved, options) : { ...renderPage(resolved, options), diagnostics: [] };
  const shown = (html: string) => (options.pretty ? prettyHtml(html) : html);
  return { html: shown(written.html), head: shown(written.head), body: shown(written.body), bodyStyle: written.bodyStyle, text, diagnostics: [...diagnostics, ...written.diagnostics] };
}
