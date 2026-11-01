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
import { renderText } from "./text";
import { renderWeb, type WebOptions } from "./web";

export { renderWeb, WEB_PHONE_WIDTH, type WebHtml, type WebOptions } from "./web";
export { renderText, type TextOptions } from "./text";
export { Stylesheet, CLASS_PREFIX, type Media } from "./classes";

export interface RenderOptions extends WebOptions {}

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
  Email: { target: "email", ready: false, later: "Email output comes with the email writer" },
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
  return { ...renderWeb(resolved, options), text: renderText(resolved, options), diagnostics };
}
