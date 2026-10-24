import React from "react";
import type { PlainTextOptions, RenderMode, UnlayerConfig } from "@unlayer-internal/shared-elements";
import { htmlToPlainText, RenderError } from "@unlayer-internal/shared-elements";
import { renderOwn } from "../engine";
import { OWN_MARKUP, rootlessHtml, rootlessRoot } from "./root-content";
import { extractHeadFromTree } from "./extract-head";
import { htmlRoot, providedConfig } from "./unwrap-root";
import { isRoot } from "./root-type";
import { ownRoot } from "./own-root";
import { rootConfig, rootMode, type RootConfigProps } from "../context/layer-config";
import { normalizedRoot } from "../model";
import { omissions, setRenderConfig, withOwnScope } from "./render-scope";
import { isTailwindError } from "./tailwind";
import {
  emailLayout,
  webLayout,
  documentLayout,
  type DocumentLayoutArgs,
} from "./document-layouts";

/**
 * The root's config (see rootConfig), key by key: the render function's options over the root's `config` prop, over
 * its `textDirection`, over the <UnlayerProvider>s found around it, over the defaults.
 */
function resolveConfig(element: React.ReactElement, config?: Partial<UnlayerConfig>): UnlayerConfig {
  return rootConfig(element.props as RootConfigProps, providedConfig(element), config);
}

/**
 * The root the head and the plain text are read from: the root, or for a template with no root (what it rendered, an
 * Elements component, markup), one holding it, whose content is the one the HTML rendered (collected once).
 */
const headRoot = (element: React.ReactElement, mode: RenderMode): React.ReactElement => (isRoot(element.type) ? element : rootlessRoot(element, mode));

/**
 * Render the element tree to body markup (no document shell).
 *
 * - Passes the root's whole config (see resolveConfig) via its `config` prop:
 *   no React context, so it works in Server Components
 * - Rendered by the engine as react-dom's static markup — no hydration markers
 */
export function renderBody(
  element: React.ReactElement,
  config?: Partial<UnlayerConfig>,
  name = "renderToHtml"
): string {
  const { html, inner } = bodyHtml(element, config, name);
  return inner === undefined ? html : `<div>${inner}</div>`;
}

/** The body markup (see renderBody), and a root's HTML as it is in its renderer's `<div>` (`inner`), where it has one. */
function bodyHtml(element: React.ReactElement, config?: Partial<UnlayerConfig>, name = "renderToHtml"): { html: string; inner?: string } {
  const mergedConfig = resolveConfig(element, config);
  // What it does with a part that fails (see RenderError): the render functions' option over the root's config.
  setRenderConfig(mergedConfig);

  try {
    // A template with no root: its content as a root's, with no body around it (see root-content.ts).
    if (!isRoot(element.type)) return { html: rootlessHtml(element, mergedConfig, rootMode(element, mergedConfig)) };
    // Pass config via prop (not context) so this works in React Server Components: the root's own `config` and the
    // Provider's are in it (see resolveConfig). Body threads it as `_config` to children via cloneElement. (A root of
    // another copy of Elements renders as this copy's: this render renders it all, see own-root.ts.)
    return renderOwn(ownRoot(element), { config: mergedConfig }, OWN_MARKUP);
  } catch (error) {
    // A part of the template that failed says which and where; a scope's error is as it is.
    if (error instanceof RenderError || isTailwindError(error)) throw error;
    const message =
      error instanceof Error ? error.message : String(error);
    // Keep the original error as `cause`: its stack points at the template line that threw.
    throw Object.assign(
      new Error(
        `[Unlayer] ${name} failed: ${message}\n` +
          `Tip: Ensure your tree uses Body > Row > Column > Item structure.`
      ),
      { cause: error }
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
 * @param element - A React element tree (e.g. `<Email><Row>...</Row></Email>`), or a
 *   template component that returns one (`<Welcome name="Ada" />`, also `memo`/`forwardRef`).
 *   A template is called in a render of its own to reach its root (its hooks work); a class
 *   component, or one that doesn't return an element, renders without its root's settings,
 *   with a warning.
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
  return withOwnScope(() => htmlDocument(element, options));
}

/** CSS for a `<style>` element: a `</style` in it would end the element (CSS escapes the slash). */
function styleText(css: string): string {
  return css.replace(/<\/(style)/gi, "<\\/$1");
}

/** renderToHtml in the render's scope (the async renderers' too, which collected the template in it). */
export function htmlDocument(element: React.ReactElement, options?: RenderToHtmlOptions): string {
  const { title, lang: optionLang, fonts: optionFonts = [], ...config } = options ?? {};
  // A template component (<Welcome/>) renders as its root, whose settings follow.
  element = htmlRoot(element, "renderToHtml", config.idPrefix);
  // The root's own `fonts` prop, then the option's, each URL once.
  const rootFonts = (element.props as { fonts?: Array<{ url: string }> } | null)?.fonts ?? [];
  const fonts = [...rootFonts, ...optionFonts].filter((font, i, all) => font?.url && all.findIndex((f) => f?.url === font.url) === i);

  const lang = optionLang ?? (element.props as { lang?: string }).lang;
  const mergedConfig = resolveConfig(element, config);
  const displayMode = rootMode(element, mergedConfig);

  // Only Unlayer wrappers (Body/Email/Page/Document) get their renderer's
  // host <div> stripped — for any other root (a bare item, a custom
  // component) the outer div is the element's own markup and must stay.
  const isUnlayerWrapper = isRoot(element.type);
  // (A root's HTML as Body writes it in its `<div>`, which the document has instead.)
  const rendered = bodyHtml(element, config);
  const body = rendered.inner !== undefined ? (isUnlayerWrapper ? rendered.inner : `<div>${rendered.inner}</div>`) : isUnlayerWrapper ? stripOuterDiv(rendered.html) : rendered.html;
  const { css, js, tags } = extractHeadFromTree(headRoot(element, displayMode), {
    displayMode,
    headConfig: mergedConfig.headConfig,
  });

  const layoutArgs: DocumentLayoutArgs = {
    lang: lang ? ` lang="${escapeForHtml(String(lang))}"` : "",
    dir: mergedConfig.textDirection
      ? ` dir="${escapeForHtml(String(mergedConfig.textDirection))}"`
      : "",
    titleTag: title ? `<title>${escapeForHtml(title.trim())}</title>` : "",
    css: styleText(css),
    scriptTag: js
      ? `<script type="application/javascript">\n${js}\n</script>`
      : "",
    tagLines: tags.join("\n"),
    fontLinks: fonts
      .filter((font) => font?.url)
      .map(
        (font) =>
          `<link href="${escapeForHtml(String(font.url))}" rel="stylesheet" type="text/css">`
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
  config?: Partial<UnlayerConfig> & PlainTextOptions
): string {
  return withOwnScope(() => plainText(element, config));
}

/** renderToPlainText in the render's scope (see htmlDocument). */
export function plainText(element: React.ReactElement, config?: Partial<UnlayerConfig> & PlainTextOptions): string {
  // A template component renders as its root, as in renderToHtml (context providers around it included).
  const root = htmlRoot(element, "renderToPlainText", config?.idPrefix);
  const resolved = resolveConfig(root, config);
  setRenderConfig(resolved);
  // Collected first, as renderToHtml's head is: it fails where that does.
  const mode = rootMode(root, resolved);
  normalizedRoot(headRoot(root, mode), mode);
  // How the text is written (wrapping, links, headings, what's left out): see PlainTextOptions.
  return htmlToPlainText(renderBody(root, config, "renderToPlainText"), config);
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
   * The parts of the template left out (`onError: "omit"`, or a function), in the order the render found them: each
   * a RenderError naming the component, where it is (`position`) and what it threw (`cause`). Empty when nothing was.
   */
  omitted: RenderError[];
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
  return withOwnScope(() => htmlParts(element, config));
}

/** renderToHtmlParts in the render's scope (see htmlDocument). */
export function htmlParts(element: React.ReactElement, config?: Partial<UnlayerConfig>): HtmlParts {
  element = htmlRoot(element, "renderToHtmlParts", config?.idPrefix);
  // Render body markup
  const body = renderBody(element, config, "renderToHtmlParts");

  // Resolve display mode from the wrapper component, element props, or config
  const mergedConfig = resolveConfig(element, config);
  const displayMode = rootMode(element, mergedConfig);

  // Extract head CSS/JS/tags by walking the element tree
  const { css, js, tags } = extractHeadFromTree(headRoot(element, displayMode), {
    displayMode,
    headConfig: mergedConfig.headConfig,
  });

  // Build head string
  const headParts: string[] = [];

  if (css) {
    headParts.push(`<style>${styleText(css)}</style>`);
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
    omitted: [...omissions()],
  };
}
