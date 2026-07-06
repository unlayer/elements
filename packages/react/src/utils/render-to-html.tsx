import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { UnlayerConfig } from "@unlayer-internal/shared-elements";
import { DEFAULT_CONFIG } from "@unlayer-internal/shared-elements";
import { htmlToPlainText } from "@unlayer-internal/shared-elements";
import type { RenderMode } from "@unlayer-internal/shared-elements";
import { extractHeadFromTree } from "./extract-head";
import {
  emailLayout,
  webLayout,
  documentLayout,
  type DocumentLayoutArgs,
} from "./document-layouts";

// Email/Page/Document lock their render mode internally (they render
// <Body mode="...">), so the top-level element's own props never carry it.
// Map wrapper displayName → mode so head extraction and the document layout
// always match what the body actually rendered as.
const MODE_BY_WRAPPER: Record<string, RenderMode> = {
  Email: "email",
  Page: "web",
  Document: "document",
};

/**
 * Resolve the display mode for a tree: wrapper component type first
 * (Email/Page/Document), then an explicit `mode` prop (Body), then config.
 */
function resolveDisplayMode(
  element: React.ReactElement,
  mergedConfig: Partial<UnlayerConfig>
): RenderMode {
  const displayName = (element.type as { displayName?: string })?.displayName;
  const wrapperMode = displayName ? MODE_BY_WRAPPER[displayName] : undefined;
  return (
    wrapperMode ??
    (element.props as { mode?: RenderMode }).mode ??
    mergedConfig.mode ??
    "web"
  );
}

/**
 * Render the element tree to body markup (no document shell).
 *
 * - Passes merged config via the `config` prop (no React context — works in
 *   Server Components)
 * - Uses `renderToStaticMarkup` — no React hydration markers
 */
function renderBody(
  element: React.ReactElement,
  config?: Partial<UnlayerConfig>
): string {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    // Pass config via prop (not context) so this works in React Server Components.
    // Body reads `config` prop and threads it as `_config` to children via cloneElement.
    const enriched = React.cloneElement(element, { config: mergedConfig });
    return renderToStaticMarkup(enriched);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    throw new Error(
      `[Unlayer] renderToHtml failed: ${message}\n` +
        `Tip: Ensure your tree uses Body > Row > Column > Item structure.`
    );
  }
}

/**
 * Strip the outer `<div>` wrapper that Body's renderer adds around the
 * exporter output, leaving the raw body markup for document assembly.
 */
function stripOuterDiv(html: string): string {
  const match = html.match(/^\s*<div[^>]*>([\s\S]*)<\/div>\s*$/);
  return match ? match[1] : html;
}

/** Minimal escaping for text interpolated into HTML (title, font URLs). */
function escapeForHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Options for renderToHtml — config overrides plus document-level extras.
 */
export interface RenderToHtmlOptions extends Partial<UnlayerConfig> {
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
 * Renders an Unlayer element tree to a complete HTML document — from
 * `<!DOCTYPE ...>` to `</html>` — matching the editor's exportHtml layouts.
 *
 * Per-mode document shells (mirroring the editor's layout templates):
 * - `email`: XHTML transitional doctype, VML/Office namespaces, and the MSO
 *   conditional comments Outlook needs
 * - `web`: HTML5 doctype with standard viewport/charset meta tags
 * - `document`: XHTML transitional doctype for print/PDF pipelines
 *
 * Use {@link renderToHtmlParts} instead when your app owns the document
 * shell and only needs the head/body chunks.
 *
 * @param element - A React element tree (e.g. `<Email><Row>...</Row></Email>`)
 * @param options - Config overrides (mode, cdnBaseUrl, etc.) plus `title` and `fonts`
 * @returns Complete HTML document string
 * @throws {Error} If rendering fails, with a helpful message
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
  const { title, fonts = [], ...config } = options ?? {};

  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const displayMode = resolveDisplayMode(element, mergedConfig);

  // Only Unlayer wrappers (Body/Email/Page/Document) get their renderer's
  // host <div> stripped — for any other root (a bare item, a custom
  // component) the outer div is the element's own markup and must stay.
  const wrapperName = (element.type as { displayName?: string })?.displayName;
  const isUnlayerWrapper =
    wrapperName === "Body" || (wrapperName ? wrapperName in MODE_BY_WRAPPER : false);
  const rawBody = renderBody(element, config);
  const body = isUnlayerWrapper ? stripOuterDiv(rawBody) : rawBody;
  const { css, js, tags } = extractHeadFromTree(element, {
    displayMode,
    headConfig: mergedConfig.headConfig,
  });

  const layoutArgs: DocumentLayoutArgs = {
    dir: mergedConfig.textDirection
      ? ` dir="${escapeForHtml(String(mergedConfig.textDirection))}"`
      : "",
    titleTag: title ? `<title>${escapeForHtml(title.trim())}</title>` : "",
    styleTag: css ? `<style type="text/css">\n${css}\n</style>` : "",
    scriptTag: js
      ? `<script type="application/javascript">\n${js}\n</script>`
      : "",
    tagLines: tags.join("\n"),
    fontLinks: fonts
      .filter((font) => font?.url)
      .map(
        (font) =>
          `<link href="${escapeForHtml(font.url)}" rel="stylesheet" type="text/css">`
      )
      .join(""),
    body,
  };

  if (displayMode === "email") return emailLayout(layoutArgs);
  if (displayMode === "document") return documentLayout(layoutArgs);
  return webLayout(layoutArgs);
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
  const html = renderBody(element, config);
  return htmlToPlainText(html);
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
  // Render body markup
  const body = renderBody(element, config);

  // Resolve display mode from the wrapper component, element props, or config
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const displayMode = resolveDisplayMode(element, mergedConfig);

  // Extract head CSS/JS/tags by walking the element tree
  const { css, js, tags } = extractHeadFromTree(element, {
    displayMode,
    headConfig: mergedConfig.headConfig,
  });

  // Build head string
  const headParts: string[] = [];

  if (css) {
    headParts.push(`<style>${css}</style>`);
  }

  if (js) {
    headParts.push(`<script>${js}</script>`);
  }

  if (tags.length > 0) {
    headParts.push(...tags);
  }

  return {
    head: headParts.join("\n"),
    body,
    css,
    js,
    tags,
  };
}
