/**
 * Shared Item Rendering Pipeline
 *
 * Encapsulates the full item component rendering logic:
 * merge defaults → ensure meta → validate → build exporterConfig → call exporter → return HTML
 *
 * Framework wrappers call this and inject the HTML into their own element type.
 */

import type { DisplayMode } from "./exporter-resolver";
import type { UnlayerConfig } from "../config";
import { DEFAULT_CONFIG } from "../config";
import { generateHtmlFromTextJson } from "./lexical-helpers";
import { mergeValues } from "./merge-values";
import { ensureMeta } from "./ensure-meta";
import { validateRequiredPaths } from "./validate-required-paths";

export interface RenderItemConfig<T = any> {
  /** Component type name (e.g., 'Button', 'Text', 'Row') */
  type: string;
  /** Default values for the component */
  defaultValues: T;
  /** Mapped values from user props (output of mapSemanticProps or propMapper) */
  mappedValues: Partial<T>;
  /** Render mode */
  mode: DisplayMode;
  /** Exporter function for this mode */
  exporter: Function;
  /** Component index within the column */
  index?: number;
  /** Column index within the row */
  colIndex?: number;
  /** Cell widths array */
  cells?: any[];
  /** Body-level values */
  bodyValues?: any;
  /** Row-level values */
  rowValues?: any;
  /** Unlayer config from context */
  _config?: UnlayerConfig;
}

export interface RenderItemResult {
  /** The rendered HTML string, or null on error */
  html: string | null;
  /** Error if rendering failed */
  error?: Error;
}

/**
 * Render an item component to an HTML string.
 *
 * This is the core shared function that all framework wrappers use.
 * It handles the full pipeline:
 * 1. Merge mapped values with defaults
 * 2. Inject _meta
 * 3. Validate required paths
 * 4. Build exporterConfig from UnlayerConfig
 * 5. Call exporter with proper args
 * 6. Return { html, error? }
 */
export function renderItemToHtml<T extends Record<string, any> = any>(
  config: RenderItemConfig<T>
): RenderItemResult {
  const {
    type,
    defaultValues,
    mappedValues,
    mode,
    exporter,
    index = 0,
    colIndex = 0,
    cells = [],
    bodyValues = {},
    rowValues = {},
    _config,
  } = config;

  try {
    // 1. Merge with defaults
    const finalValues = mergeValues(defaultValues, mappedValues);

    // 2. Ensure _meta is present
    const valuesWithMeta = ensureMeta(finalValues, type.toLowerCase(), index);

    // 3. Validate required paths
    validateRequiredPaths(type, valuesWithMeta);

    // 4. Build exporterConfig
    const cfg = _config ?? DEFAULT_CONFIG;
    const exporterConfig = {
      generateHtmlFromTextJson,
      toSafeHtml: cfg.toSafeHtml,
      textDirection: cfg.textDirection,
      cdnBaseUrl: cfg.cdnBaseUrl,
    };

    // 5. Ensure bodyValues has required fields
    const safeBodyValues = {
      contentWidth: 600,
      ...bodyValues,
    };

    // 6. Call exporter
    // Item exporters signature: (values, index, colIndex, cells, bodyValues, rowValues, embeddedValues, meta)
    // Args 2-7 are deprecated positional params; the 8th arg is a meta object with all context
    const meta = {
      exporterConfig,
      mergeTagState: cfg.mergeTagState,
    };
    const raw = exporter(
      valuesWithMeta,
      index,
      colIndex,
      cells,
      safeBodyValues,
      rowValues,
      undefined,
      meta,
    );

    const html = typeof raw === "string" ? raw : String(raw);

    return { html };
  } catch (error) {
    console.error(`${type} rendering failed:`, error);
    return { html: null, error: error as Error };
  }
}
