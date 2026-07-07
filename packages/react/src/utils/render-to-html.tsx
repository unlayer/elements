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

/** displayName of a React element's component type. */
function elementDisplayName(element: React.ReactElement): string | undefined {
  return (element.type as { displayName?: string })?.displayName;
}

function isUnlayerWrapperElement(element: React.ReactElement): boolean {
  const name = elementDisplayName(element);
  return name === "Body" || (name ? name in MODE_BY_WRAPPER : false);
}

/**
 * See through an <UnlayerProvider> root (or a chain of them) to the wrapper
 * element it hosts, collecting the provider configs along the way. Mode
 * resolution, head extraction, and the outer-div strip must all operate on
 * the wrapper, not the provider.
 */
function unwrapProviderRoot(element: React.ReactElement): {
  element: React.ReactElement;
  providerConfig?: Partial<UnlayerConfig>;
} {
  let current = element;
  let providerConfig: Partial<UnlayerConfig> | undefined;
  while (elementDisplayName(current) === "UnlayerProvider") {
    const props = current.props as {
      config?: Partial<UnlayerConfig>;
      children?: React.ReactNode;
    };
    const elementChildren = React.Children.toArray(props.children).filter(
      React.isValidElement
    ) as React.ReactElement[];
    if (elementChildren.length !== 1) break;
    providerConfig = { ...providerConfig, ...props.config };
    current = elementChildren[0];
  }
  return { element: current, providerConfig };
}

/**
 * Resolve the display mode for a tree: wrapper component type first
 * (Email/Page/Document), then an explicit `mode` prop (Body), then config.
 */
function resolveDisplayMode(
  element: React.ReactElement,
  mergedConfig: Partial<UnlayerConfig>
): RenderMode {
  const displayName = elementDisplayName(element);
  const wrapperMode = displayName ? MODE_BY_WRAPPER[displayName] : undefined;
  const props = element.props as {
    mode?: RenderMode;
    config?: Partial<UnlayerConfig>;
  };
  return (
    wrapperMode ??
    props.mode ??
    // A <Body config={{ mode }}> prop participates the same way it does in
    // Body's own resolution, so the document shell matches the body markup.
    props.config?.mode ??
    mergedConfig.mode ??
    "web"
  );
}

/**
 * Inject the caller's config options into the tree's Body/Email/Page/Document
 * root, reaching through <UnlayerProvider> roots. Only the raw options are
 * injected (not defaults) so Body's own resolution keeps the intended
 * precedence: explicit options > provider context > defaults.
 */
function injectConfig(
  element: React.ReactElement,
  config: Partial<UnlayerConfig>
): React.ReactElement {
  if (elementDisplayName(element) === "UnlayerProvider") {
    const children = React.Children.toArray(
      (element.props as { children?: React.ReactNode }).children
    );
    const elementChildren = children.filter(React.isValidElement) as React.ReactElement[];
    if (children.length === 1 && elementChildren.length === 1) {
      return React.cloneElement(
        element,
        undefined,
        injectConfig(elementChildren[0], config)
      );
    }
    return element;
  }
  if (isUnlayerWrapperElement(element)) {
    const existing = (element.props as { config?: Partial<UnlayerConfig> }).config;
    return React.cloneElement(element, { config: { ...existing, ...config } });
  }
  return element;
}

/**
 * Render the element tree to body markup (no document shell).
 *
 * - Passes config via the `config` prop (no React context — works in
 *   Server Components); an UnlayerProvider in the tree still applies because
 *   only the caller's explicit options are injected.
 * - Uses `renderToStaticMarkup` — no React hydration markers
 */
function renderBody(
  element: React.ReactElement,
  config?: Partial<UnlayerConfig>
): string {
  try {
    const enriched = injectConfig(element, config ?? {});
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

  // Server pipelines must fail loudly: a render error raises instead of
  // shipping a document with missing blocks. Pass onError: "render-fallback"
  // to opt back into placeholder rendering.
  const effectiveConfig: Partial<UnlayerConfig> = { onError: "throw", ...config };

  // See through an UnlayerProvider root: mode, head extraction, and the
  // outer-div strip are all decided by the wrapper element it hosts.
  const { element: wrapperElement, providerConfig } = unwrapProviderRoot(element);
  const mergedConfig = { ...DEFAULT_CONFIG, ...providerConfig, ...config };
  const displayMode = resolveDisplayMode(wrapperElement, mergedConfig);

  // Only Unlayer wrappers (Body/Email/Page/Document) get their renderer's
  // host <div> stripped — for any other root (a bare item, a custom
  // component) the outer div is the element's own markup and must stay.
  const rawBody = renderBody(element, effectiveConfig);
  const body = isUnlayerWrapperElement(wrapperElement) ? stripOuterDiv(rawBody) : rawBody;
  const { css, js, tags } = extractHeadFromTree(wrapperElement, {
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
  const html = renderBody(element, { onError: "throw", ...config });
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
  // Render body markup (failing loudly by default, like renderToHtml)
  const body = renderBody(element, { onError: "throw", ...config });

  // Resolve display mode from the wrapper component (seeing through an
  // UnlayerProvider root), element props, or config
  const { element: wrapperElement, providerConfig } = unwrapProviderRoot(element);
  const mergedConfig = { ...DEFAULT_CONFIG, ...providerConfig, ...config };
  const displayMode = resolveDisplayMode(wrapperElement, mergedConfig);

  // Extract head CSS/JS/tags by walking the element tree
  const { css, js, tags } = extractHeadFromTree(wrapperElement, {
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
