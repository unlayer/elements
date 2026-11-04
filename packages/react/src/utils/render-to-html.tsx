import React from "react";
import type { UnlayerConfig } from "@unlayer-internal/shared-elements";
import { withRenderScope } from "./render-scope";
import { renderThroughNewEngine, type Rendered } from "../compat/render";

/**
 * A template through the new engine: what fails is said with the API that failed and what to check, and what's already
 * said so (a template that isn't one) as it is.
 */
function throughNewEngine<T>(element: React.ReactElement, options: RenderToHtmlOptions | undefined, name: string, read: (result: Rendered) => T): T {
  return withRenderScope(() => {
    try {
      return read(renderThroughNewEngine(element, options, name));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.startsWith("[Unlayer]")) throw error;
      throw Object.assign(new Error(`[Unlayer] ${name} failed: ${message}\nTip: Ensure your tree uses Body > Row > Column > Item structure.`), { cause: error });
    }
  });
}

/**
 * Options for renderToHtml — config overrides plus document-level extras.
 */
export interface RenderToHtmlOptions extends Partial<UnlayerConfig> {
  /** Document language; overrides the root's `lang` prop. */
  lang?: string;
  /** Document `<title>` */
  title?: string;
  /**
   * Web-font stylesheets to load via `<link rel="stylesheet">` tags.
   * Elements has no font registry, so pass the URLs for any non-system
   * fonts your design uses (e.g. Google Fonts CSS URLs).
   */
  fonts?: Array<{ url: string }>;
}

/**
 * Renders an Unlayer element tree to a complete HTML document, from
 * `<!DOCTYPE html>` to `</html>`, for its output: an email (tables, with the
 * conditional comments Outlook needs), a page, or a printed document.
 *
 * Use {@link renderToHtmlParts} instead when your app owns the document
 * shell and only needs the head/body chunks.
 *
 * @param element - A React element tree (e.g. `<Email><Row>...</Row></Email>`), or a
 *   template component that returns one (`<Welcome name="Ada" />`, also `memo`/`forwardRef`/a
 *   class). A template is called in a render of its own to reach its root (its hooks work). A
 *   Row, Column or block on its own, or Rows in a list, get a root around them.
 * @param options - Config overrides (mode, cdnBaseUrl, etc.) plus `title` and `fonts`
 * @returns Complete HTML document string
 * @throws {Error} If rendering fails, or `element` isn't a template (plain markup, a root of
 *   another copy of this package, a root inside other markup), with a helpful message
 *
 * @example
 * ```tsx
 * import { renderToHtml, Email, Row, Column, Paragraph } from "@unlayer/react-elements";
 *
 * const html = renderToHtml(
 *   <Email><Row><Column><Paragraph>Hello</Paragraph></Column></Row></Email>,
 *   { title: "Welcome" }
 * );
 * // "<!DOCTYPE HTML PUBLIC ...><html ...>...</html>"
 * ```
 */
export function renderToHtml(
  element: React.ReactElement,
  options?: RenderToHtmlOptions
): string {
  return throughNewEngine(element, options, "renderToHtml", ({ html }) => html);
}

/**
 * Renders an Unlayer element tree to a plain text string.
 *
 * Renders the body markup then converts to plain text using
 * `htmlToPlainText`. Useful for generating the text/plain MIME part
 * of multipart emails (critical for deliverability).
 *
 * @param element - A React element tree (e.g. `<Body><Row>...</Row></Body>`)
 * @param config  - Optional config overrides (mode, cdnBaseUrl, etc.)
 * @returns Plain text representation of the email
 *
 * @example
 * ```tsx
 * import { renderToPlainText, Body, Row, Column, Paragraph } from "@unlayer/react-elements";
 *
 * const text = renderToPlainText(
 *   <Body mode="email"><Row><Column><Paragraph>Hello World</Paragraph></Column></Row></Body>
 * );
 * // "Hello World"
 * ```
 */
export function renderToPlainText(
  element: React.ReactElement,
  config?: Partial<UnlayerConfig>
): string {
  // A template component renders as its root, as in renderToHtml (context providers around it included).
  return throughNewEngine(element, config, "renderToPlainText", ({ text }) => text);
}

/**
 * Result of renderToHtmlParts — head and body as separate strings.
 */
export interface HtmlParts {
  /**
   * Pre-assembled `<head>` content: the css in a `<style>` tag, the js in a
   * `<script>` tag, and the tags — joined and ready to drop into a document.
   * Equivalent to composing the granular fields below yourself.
   */
  head: string;
  /**
   * The rendered body markup, wrapped in the renderer's host `<div>`. In
   * email/document mode it contains the `<body>` tag itself; web mode has
   * none. No doctype/html/head shell — embeddable as-is, or extract the
   * `<body>` tag when composing a full document.
   */
  body: string;
  /** Raw component CSS (no `<style>` wrapper) — e.g. for inlining pipelines */
  css: string;
  /** Raw component JS (no `<script>` wrapper); empty for most email designs */
  js: string;
  /**
   * Individual head tags (`<meta>`, `<link>`, ...) contributed by components.
   * Not part of the editor's documented chunk parameters, but exposed here
   * because `head` can contain them — without this field, reassembling the
   * head from `css` + `js` would silently drop them. Usually empty.
   *
   * There is deliberately no `fonts` chunk: Elements has no font registry to
   * resolve font URLs from — pass stylesheet URLs via renderToHtml's `fonts`
   * option instead.
   */
  tags: string[];
}

/**
 * Renders an Unlayer element tree to separate head and body HTML strings.
 *
 * Use this when your app owns the document shell — an existing page
 * template, an ESP template with its own meta tags, an iframe srcdoc —
 * and you want to place the `<style>` block and body markup yourself.
 * For a complete ready-to-send document in one call, use
 * {@link renderToHtml}.
 *
 * - `head` contains `<style>` tags with CSS generated by each component's
 *   head function (button hover colors, body fonts, link styles, etc.)
 * - `body` is the rendered body markup without any document shell
 *
 * @param element - A React element tree (e.g. `<Email><Row>...</Row></Email>`)
 * @param config  - Optional config overrides (mode, cdnBaseUrl, etc.)
 * @returns `{ head, body }` — drop these into your HTML document template
 *
 * @example
 * ```tsx
 * import { renderToHtmlParts, Email, Row, Column, Button } from "@unlayer/react-elements";
 *
 * const { head, body } = renderToHtmlParts(
 *   <Email>
 *     <Row><Column><Button>Click</Button></Column></Row>
 *   </Email>
 * );
 *
 * const html = `<!DOCTYPE html>
 * <html><head>${head}</head>${body}</html>`;
 * ```
 */
export function renderToHtmlParts(
  element: React.ReactElement,
  config?: Partial<UnlayerConfig>
): HtmlParts {
  return throughNewEngine(element, config, "renderToHtmlParts", ({ head, body, css, js, tags }) => ({ head, body, css, js, tags }));
}
