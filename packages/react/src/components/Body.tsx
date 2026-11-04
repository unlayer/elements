import React from "react";
import type { RenderMode, UnlayerConfig, BodyValues } from "@unlayer-internal/shared-elements";
import type { SemanticProps } from "../utils/semantic-props";
import type { SizeInput } from "../types";
import { withRenderScope } from "../utils/render-scope";
import { renderThroughNewEngine } from "../compat/render";

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
  /** Document text direction, also kept in the design JSON. Renderer options can override it. */
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
  const { className, style, config } = props;
  try {
    // A render of its own when Body is rendered straight through React (not renderToHtml, which reads it, never renders it).
    const { inner } = withRenderScope(() => renderThroughNewEngine(React.createElement(Body, props), config, "Body", { embedded: true }), true);
    return <div className={className} style={style} dangerouslySetInnerHTML={{ __html: inner }} />;
  } catch (error) {
    console.error("Body rendering failed:", error);
    return <div className={className} style={style} />;
  }
};

Body.displayName = "Body";

export default Body;
