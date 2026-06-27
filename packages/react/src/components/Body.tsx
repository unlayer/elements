import React from "react";
import ReactDOMServer from "react-dom/server";
import type { RenderMode, UnlayerConfig, BodyValues } from "@unlayer-internal/shared-elements";
import { DEFAULT_CONFIG, mergeValues } from "@unlayer-internal/shared-elements";
import { BodyExporters } from "@unlayer/exporters";
import { mapSemanticProps, type SemanticProps } from "../utils/semantic-props";
import type { SizeInput } from "../types";
import { BODY_DEFAULTS } from "../utils/container-defaults";

export type BodyProps = Omit<SemanticProps<BodyValues>, "padding" | "borderRadius"> & {
  children?: React.ReactNode;
  mode?: RenderMode;
  className?: string;
  style?: React.CSSProperties;
  index?: number;
  /** Optional config (replaces context-based config for Server Component usage) */
  config?: Partial<UnlayerConfig>;
  /** Preview text shown in email client inboxes (email mode only) */
  previewText?: string;
  /** Padding — a CSS string ("0 48px", "20px") or a number (px). */
  padding?: SizeInput;
  /** Corner radius — a number (→ px) or CSS string ("8px"). */
  borderRadius?: SizeInput;
};

const DEFAULT_VALUES = BODY_DEFAULTS;

// ============================================
// Preview text (inlined from shared/utils/preview.ts)
// ============================================

const MAX_PREVIEW_LENGTH = 150;

const PADDING_CHARS = [
  "\u00A0", "\u200C", "\u200B", "\u200D", "\u200E", "\u200F", "\uFEFF",
];

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
    truncated +
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
 * Works in both Server Components and Client Components.
 * In Server Components, pass config as a prop.
 * In Client Components, config can come from UnlayerProvider context or props.
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
const Body: React.FC<BodyProps> = (props) => {
  const { children, mode: modeProp, className, style, index = 0, config: configProp, previewText, ...semanticProps } = props;

  // Resolve config: explicit prop > default (no hooks, Server Component safe)
  const resolvedConfig: UnlayerConfig = { ...DEFAULT_CONFIG, ...configProp };

  // Resolve mode: explicit prop > config > default
  const mode: RenderMode = modeProp ?? resolvedConfig.mode ?? "web";

  // Build _config to thread through children
  const _config: UnlayerConfig = { ...resolvedConfig, mode };

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

  // Ensure _meta
  const valuesWithMeta = {
    ...values,
    _meta: {
      htmlID: `u_body_${index + 1}`,
      htmlClassNames: "u_body",
      ...(values._meta || {})
    }
  };

  // Clone children with _config AND the body's resolved values so Row/Column
  // inherit body-level context — notably `contentWidth`, which determines the
  // row container max-width (and therefore each column's width) in web mode.
  // Without this, Row falls back to BODY_DEFAULTS.contentWidth ("500px") and
  // <Body contentWidth="…"> is silently ignored for layout.
  let enrichedChildren = children;
  if (children) {
    enrichedChildren = React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child as React.ReactElement<any>, {
          _config,
          bodyValues: values,
        });
      }
      return child;
    });
  }

  // Process children to innerHTML
  let innerHTML = "";
  if (enrichedChildren) {
    try {
      innerHTML = ReactDOMServer.renderToString(enrichedChildren as React.ReactElement);
    } catch (error) {
      console.error("Body: Failed to render children:", error);
      innerHTML = "";
    }
  }

  try {
    const html = renderBodyToHtml(innerHTML, valuesWithMeta, mode, previewText);

    return (
      <div
        dangerouslySetInnerHTML={{ __html: html }}
        className={className}
        style={style}
      />
    );
  } catch (error) {
    console.error("Body rendering failed:", error);
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }
};

Body.displayName = "Body";

export default Body;
