/**
 * Universal Component Renderer (React)
 *
 * Handles the boilerplate for all Unlayer Elements React components:
 * - Exporter loading
 * - Error handling
 * - HTML rendering via JSX
 * - Type safety
 *
 * Pure logic (mergeValues, ensureMeta, validateRequiredPaths) lives in
 * @unlayer-internal/shared-elements. This file provides the React-specific
 * JSX wrapper that returns a <div dangerouslySetInnerHTML>.
 */

import React from "react";
import type { RenderMode } from "@unlayer-internal/shared-elements";
import type { UnlayerConfig } from "@unlayer-internal/shared-elements";
import {
  generateHtmlFromTextJson,
  validateRequiredPaths,
  DEFAULT_CONFIG,
} from "@unlayer-internal/shared-elements";

interface RenderConfig<T = any> {
  /** Component type (e.g., 'Button', 'Text', 'Row') */
  type: string;
  /** Component values (exporter format) */
  values: T;
  /** Render mode */
  mode: RenderMode;
  /** Optional className for wrapper */
  className?: string;
  /** Optional styles for wrapper */
  style?: React.CSSProperties;
  /** Additional arguments for exporter (order matters!) */
  args?: any[];
  /** Optional innerHTML for container components */
  innerHTML?: string;
  /** Unlayer config from context (threaded via _config prop) */
  _config?: UnlayerConfig;
  /** Direct exporter function — bypasses dynamic lookup for tree-shaking */
  exporter: Function;
}

interface ErrorFallbackProps {
  type: string;
  error: Error;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Error fallback component
 */
const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  type,
  className,
  style
}) => (
  <div className={className} style={style}>
    <div
      style={{
        padding: "20px",
        backgroundColor: "#fee",
        border: "1px solid #fcc",
        borderRadius: "4px",
        color: "#c33",
        textAlign: "center",
        fontFamily: "system-ui, sans-serif"
      }}
    >
      <strong>{type} failed to render.</strong>
      <br />
      <small>Check console for details.</small>
    </div>
  </div>
);

/**
 * Main render function - handles all component rendering
 */
export function renderComponent<T = any>(config: RenderConfig<T>): JSX.Element {
  const { type, values, mode, className, style, args = [], innerHTML, _config, exporter } = config;

  try {
    // Validate required paths before calling exporter
    validateRequiredPaths(type, values);

    // Build exporterConfig from _config (falls back to defaults)
    const cfg = _config ?? DEFAULT_CONFIG;
    const exporterConfig = {
      generateHtmlFromTextJson,
      toSafeHtml: cfg.toSafeHtml,
      textDirection: cfg.textDirection,
      cdnBaseUrl: cfg.cdnBaseUrl,
    };

    // Call exporter with appropriate arguments
    let html: string;
    if (innerHTML !== undefined) {
      // Container components (Row, Body) take innerHTML first
      html = exporter(innerHTML, values, ...args);
    } else {
      // Content components take values first
      // Item exporters signature: (values, index, colIndex, cells, bodyValues, rowValues, embeddedValues, meta)
      // Args 2-7 are deprecated positional params; the 8th arg is a meta object with all context
      const meta = {
        exporterConfig,
        mergeTagState: cfg.mergeTagState,
      };
      html = exporter(values, ...args, undefined, meta);
    }

    // Ensure string output
    html = typeof html === "string" ? html : String(html);

    // Return rendered component
    return (
      <div
        className={className}
        style={style}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch (error) {
    console.error(`${type} rendering failed:`, error);
    return (
      <ErrorFallback
        type={type}
        error={error as Error}
        className={className}
        style={style}
      />
    );
  }
}
