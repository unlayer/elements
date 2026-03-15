/**
 * Shared Container Rendering Functions
 *
 * Framework-agnostic rendering for Body, Row, and Column containers.
 * These take innerHTML (already-rendered children) and container values,
 * call the appropriate exporter, and return an HTML string.
 */

import type { DisplayMode } from "./exporter-resolver";
import { BodyExporters, RowExporters, ColumnExporters } from "@unlayer-dev/exporters";
import { generateGridCSS } from "./grid-css";

/** Container exporter signature. Defined locally until added to @unlayer/types. */
type ContainerExporterFunction = (innerHTML: string, values: Record<string, any>, bodyValues?: Record<string, any>, options?: Record<string, any>) => string;

/** Column exporter signature. Defined locally until added to @unlayer/types. */
type ColumnExporterFunction = (innerHTML: string, values: Record<string, any>, index: number, cells: number[], bodyValues?: Record<string, any>, rowValues?: Record<string, any>) => string;
import { generatePreviewHtml } from "./preview";

// ============================================
// Body
// ============================================

export interface RenderBodyConfig {
  innerHTML: string;
  values: any;
  mode: DisplayMode;
  /** Preview text shown in email client inboxes (email mode only) */
  previewText?: string;
}

/**
 * Render the Body container to HTML.
 * Strips `min-height: 100vh` — the editor needs it but Elements doesn't.
 */
export function renderBodyToHtml(config: RenderBodyConfig): string {
  const { innerHTML, values, mode, previewText } = config;

  // Prepend preview text HTML in email mode
  let finalInnerHtml = innerHTML;
  if (mode === "email" && previewText) {
    const previewHtml = generatePreviewHtml(previewText);
    if (previewHtml) {
      finalInnerHtml = previewHtml + innerHTML;
    }
  }

  const bodyExporter = (BodyExporters[mode] || BodyExporters.web) as ContainerExporterFunction;
  const raw = mode === "document"
    ? bodyExporter(finalInnerHtml, values, { type: "" })
    : bodyExporter(finalInnerHtml, values);

  return raw
    .replace('min-height: 100vh; ', '')
    .replace('min-height: 100vh;', '');
}

// ============================================
// Row
// ============================================

export interface RenderRowConfig {
  innerHTML: string;
  values: any;
  bodyValues: any;
  mode: DisplayMode;
  cells: number[];
  collection?: string;
}

/**
 * Render the Row container to HTML (including grid CSS).
 */
export function renderRowToHtml(config: RenderRowConfig): string {
  const { innerHTML, values, bodyValues, mode, cells, collection = "rows" } = config;

  const rowExporter = (RowExporters[mode] || RowExporters.web) as ContainerExporterFunction;
  const html = rowExporter(innerHTML, values, bodyValues, {
    collection,
    variant: mode,
  });

  const css = generateGridCSS({ cells, mode });
  return css ? `<style>${css}</style>${html}` : html;
}

// ============================================
// Column
// ============================================

export interface RenderColumnConfig {
  innerHTML: string;
  values: any;
  index: number;
  cells: number[];
  bodyValues: any;
  rowValues: any;
  mode: DisplayMode;
}

/**
 * Render the Column container to HTML.
 */
export function renderColumnToHtml(config: RenderColumnConfig): string {
  const { innerHTML, values, index, cells, bodyValues, rowValues, mode } = config;

  const columnExporter = (ColumnExporters[mode] || ColumnExporters.web) as ColumnExporterFunction;
  return columnExporter(innerHTML, values, index, cells, bodyValues, rowValues);
}
