import React from "react";
import type { RenderMode, UnlayerConfig, BodyValues } from "@unlayer-internal/shared-elements";
import { mergeValues } from "@unlayer-internal/shared-elements";
import { BodyExporters } from "@unlayer/exporters";
import { mapSemanticProps, type SemanticProps } from "../utils/semantic-props";
import { cssUrl, hatch, nextHtmlId, OWN, safeMeta, safeName, textDirectionOf } from "../utils/create-component";
import type { SizeInput } from "../types";
import { BODY_DEFAULTS } from "../utils/container-defaults";
import { ROOT } from "../utils/root-type";
import { contentHtml } from "../utils/root-content";
import { rootProps } from "../utils/tailwind";
import { ownMarkup } from "../engine";
import { useProvidedConfig } from "../context/UnlayerProvider";
import { rootConfig } from "../context/layer-config";

export type BodyProps = Omit<SemanticProps<BodyValues>, "padding" | "borderRadius"> & {
  children?: React.ReactNode;
  mode?: RenderMode;
  /** Class names on the body (the wrapper in it, on a web page); HTML only. */
  className?: string;
  /** Inline CSS on the body (the wrapper in it, on a web page), after the renderer's own (a prop given wins over the same property); HTML only. */
  style?: React.CSSProperties;
  index?: number;
  /**
   * Config for this root (`cdnBaseUrl`, `textDirection`, `mergeTagState`, …), key by key over the nearest
   * `<UnlayerProvider>`'s; a render function's options win over it.
   */
  config?: Partial<UnlayerConfig>;
  /** Preview text shown in email client inboxes (email mode only) */
  previewText?: string;
  /** Document text direction, also kept in the design JSON. A `config.textDirection` (or renderer option) wins over it; it wins over an `<UnlayerProvider>`'s. */
  textDirection?: string;
  /** Language of the rendered document (for example, "ar"). */
  lang?: string;
  /**
   * Web font stylesheets the content uses (e.g. a Google Fonts CSS URL).
   * renderToHtml links them in the document head, with any `fonts` option.
   */
  fonts?: Array<{ url: string }>;
  /** Padding — a CSS string ("0 48px", "20px") or a number (px). */
  padding?: SizeInput;
  /** Corner radius — a number (→ px) or CSS string ("8px"). */
  borderRadius?: SizeInput;
};

const DEFAULT_VALUES = BODY_DEFAULTS;

const NAMES: Record<string, string> = { email: "Email", web: "Page", document: "Document" };

// ============================================
// Preview text (inlined from shared/utils/preview.ts)
// ============================================

const MAX_PREVIEW_LENGTH = 150;

const PADDING_CHARS = [
  "\u00A0", "\u200C", "\u200B", "\u200D", "\u200E", "\u200F", "\uFEFF",
];

/**
 * previewText is text, as React treats text (it often carries user data, like
 * a name), so it's escaped: markup like `</div>` would end the hidden preview
 * and show whatever follows. The preview is padded with invisible characters
 * below, so it needs no entities.
 */
function escapePreviewText(text: string): string {
  // An email service's `<%name%>` tag (SendGrid's) stays as written, as in 0.1.22, for it to fill in: `<%` can't start an element.
  return text
    .split(/(<%[\w.]+%>)/)
    .map((part, i) => (i % 2 ? part : part.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")))
    .join("");
}

function generatePreviewHtml(text: string): string {
  if (!text || text.trim().length === 0) return "";

  const truncated = text.length > MAX_PREVIEW_LENGTH
    ? text.slice(0, MAX_PREVIEW_LENGTH)
    : text;

  const paddingLength = Math.max(0, MAX_PREVIEW_LENGTH - truncated.length);
  let padding = "";
  for (let i = 0; i < paddingLength; i++) {
    padding += PADDING_CHARS[i % PADDING_CHARS.length];
  }

  return (
    `<div data-skip-in-text="true" style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">` +
    escapePreviewText(truncated) +
    padding +
    `</div>`
  );
}

// ============================================
// Body exporter wrapper (inlined from shared/utils/render-container-to-html.ts)
// ============================================

type ContainerExporterFunction = (innerHTML: string, values: Record<string, any>, bodyValues?: Record<string, any>, options?: Record<string, any>) => string;

function renderBodyToHtml(innerHTML: string, values: any, mode: RenderMode, previewText?: string): string {
  // Prepend preview text HTML in email mode
  let finalInnerHtml = innerHTML;
  if (mode === "email" && previewText) {
    const previewHtml = generatePreviewHtml(previewText);
    if (previewHtml) {
      finalInnerHtml = previewHtml + innerHTML;
    }
  }

  const bodyExporter = (BodyExporters[mode] || BodyExporters.web) as ContainerExporterFunction;
  // The email body exporter reads body context (contentWidth, contentAlign)
  // from `arg3.bodyValues` — it drives the Outlook (MSO) container table width.
  // Passing `values` directly left `bodyValues` undefined, pinning the Outlook
  // table to 600px regardless of contentWidth (modern clients were fine via the
  // container max-width, so non-600px emails rendered narrow only in Outlook).
  const raw =
    mode === "document"
      ? bodyExporter(finalInnerHtml, values, { type: "" })
      : mode === "email"
        ? // The email body exporter reads body context (contentWidth,
          // contentAlign) from the `bodyValues` field of its 3rd argument.
          // Passing `values` directly left it undefined, so the Outlook (MSO)
          // table fell back to 600px regardless of contentWidth.
          bodyExporter(finalInnerHtml, values, { bodyValues: values })
        : bodyExporter(finalInnerHtml, values, values);

  return raw
    .replace('min-height: 100vh; ', '')
    .replace('min-height: 100vh;', '');
}

// ============================================
// Component
// ============================================

/**
 * Body - Universal Server/Client Component
 *
 * Works in both Server Components and Client Components. Its config, key by key: a render function's options, its
 * `config` prop, its `textDirection` prop, the nearest UnlayerProvider's (which the render functions read off the
 * element, and Body from context where React renders it with one: not in Server Components), then the defaults.
 *
 * @example Server Component
 * ```tsx
 * <Body backgroundColor="#F7F8F9" contentWidth="600px" mode="web">
 *   <Row><Column><Paragraph values={{...}} mode="web" /></Column></Row>
 * </Body>
 * ```
 *
 * @example Client Component with Provider
 * ```tsx
 * <UnlayerProvider config={{ mode: "email" }}>
 *   <Body>...</Body>
 * </UnlayerProvider>
 * ```
 */
const Body: React.FC<BodyProps> = (given) => {
  // Classes, from the <Tailwind> its content is in, as props.
  const props = rootProps(given, NAMES[given.mode ?? ""] ?? "Body");
  const { children, mode: modeProp, className, style, index = 0, config: _configProp, previewText, fonts: _fonts, lang: _lang, ...semanticProps } = props;

  // Its config: its `config` prop (a render function passes its options there), its `textDirection`, the nearest
  // <UnlayerProvider>'s (from its context where React has one: not in Server Components), then the defaults.
  // (Rendered by the render functions, it has their config, and reads no context of an app's render it's called in.)
  const resolvedConfig: UnlayerConfig = rootConfig(props, ownMarkup() ? undefined : useProvidedConfig());

  // Resolve mode: explicit prop > config > default
  const mode: RenderMode = modeProp ?? resolvedConfig.mode ?? "web";

  // Build _config to thread through children. Reset the per-render id counters so
  // unique ids are allocated across the whole tree (shared by reference downward).
  const _config: UnlayerConfig = { ...resolvedConfig, mode };
  (_config as { __ids?: Record<string, number> }).__ids = {};

  // Map semantic props, then merge BODY_DEFAULTS on top so the body always
  // carries its full default values (notably contentWidth "500px", textColor
  // "#000000") before rendering — the same way item components merge their
  // defaults. Without this the body exporter / grid CSS fall back to their own
  // internal defaults (e.g. 600px) instead of the schema default, so the
  // Outlook table, container, and grid CSS disagree. Mapped values win.
  const values = mergeValues<BodyValues>(
    DEFAULT_VALUES,
    mapSemanticProps<BodyValues>(semanticProps as SemanticProps<BodyValues>, DEFAULT_VALUES, "Body")
  );

  // Its background image's URL as CSS takes it (see cssUrl); the design keeps it as given.
  cssUrl(values);

  // Ensure _meta, its id and class names kept to what they can hold, as a Row's and a block's are (see safeMeta)
  const valuesWithMeta = {
    ...values,
    _meta: safeMeta({
      htmlID: nextHtmlId(_config, "u_body"),
      htmlClassNames: "u_body",
      ...(values._meta || {})
    })
  };

  // Clone children with _config AND the body's resolved values so Row/Column
  // inherit body-level context — notably `contentWidth`, which determines the
  // row container max-width (and therefore each column's width) in web mode.
  // Without this, Row falls back to BODY_DEFAULTS.contentWidth ("500px") and
  // <Body contentWidth="…"> is silently ignored for layout.
  // Fragments and user components expanded: their rows get the context too.
  // One walk collects the rows and blocks; each is then rendered with Body's settings (see root-content.ts).
  const innerHTML = children ? contentHtml(props, resolvedConfig, _config, mode, NAMES[mode] ?? "Body", values, valuesWithMeta) : "";

  // Its `style` and `className` on the body (see hatch); a right-to-left one's direction and language there too, as
  // Gmail drops the <html>'s.
  const at = /<[a-z]+ [^>]*u_body[^>]*?(?=\/?>)/;
  let html = hatch(renderBodyToHtml(innerHTML, valuesWithMeta, mode, previewText), at, style, className, semanticProps);
  if (textDirectionOf(resolvedConfig.textDirection) === "rtl") html = html.replace(at, (tag) => `${tag} dir="rtl"${_lang ? ` lang="${safeName(_lang)}"` : ""}`);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

Body.displayName = "Body";
(Body as unknown as Record<symbol, boolean>)[OWN] = true;
(Body as unknown as Record<symbol, string>)[ROOT] = "Body";

export default Body;
