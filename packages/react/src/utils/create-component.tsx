/**
 * Universal Component Factory
 *
 * Eliminates boilerplate by creating components from configuration.
 * This factory handles all the repetitive logic that was duplicated
 * across Button, Heading, Paragraph, etc.
 */

import React from "react";
import type { ExporterName } from "@unlayer/types";

/** Exporter map keyed by display mode. Defined locally until added to @unlayer/types. */
type ItemExporters = Partial<Record<ExporterName, (...args: any[]) => string>>;
import type { RenderMode, UnlayerConfig } from "@unlayer-internal/shared-elements";
import type { SizeInput } from "../types";
import {
  mergeValues,
  generateHtmlFromTextJson,
  normalizeValuesForExporter,
  DEFAULT_CONFIG,
} from "@unlayer-internal/shared-elements";


/**
 * Static property key for the hook-free render function.
 * Column calls this directly instead of the outer component
 * (which uses hooks and would break when called as a plain function).
 */
export const UNLAYER_RENDER_KEY = "__unlayerRender";

/**
 * Static property key for the item's config (name, defaultValues, propMapper).
 * Used by renderToJson to extract values without rendering to HTML.
 */
export const UNLAYER_CONFIG_KEY = "__unlayerItemConfig";

/**
 * Base props that all item components support
 */
export interface BaseItemComponentProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  mode?: RenderMode;
  /** Padding of the content wrapper around this item — a number (→ px) or a CSS
   *  string ("10px", "16px 24px"). Applied by the containing Column. */
  containerPadding?: SizeInput;

  // Internal props (for advanced use)
  index?: number;
  colIndex?: number;
  cells?: any[];
  bodyValues?: any;
  rowValues?: any;
  /** @internal - this column's values, threaded by Column for width-aware exporters */
  columnValues?: any;
  /** @internal - Unlayer config threaded from UnlayerProvider */
  _config?: UnlayerConfig;
}

/**
 * Configuration for creating an item component
 */
export interface ItemComponentConfig<TValues, TSemanticProps> {
  /** Component name (e.g., 'Button', 'Heading') */
  name: string;

  /** Default values for the component */
  defaultValues: TValues;

  /** Function to map semantic props to values format */
  propMapper: (
    props: TSemanticProps & { children?: React.ReactNode }
  ) => Partial<TValues>;

  /** Display name for React DevTools */
  displayName?: string;

  /** Per-component exporters map — enables tree-shaking.
   *  Keys are display modes ('web', 'email', 'document'), values are exporter functions. */
  exporters: ItemExporters;
}

/**
 * Props type that combines base props with semantic props
 */
export type ItemComponentProps<TSemanticProps> = BaseItemComponentProps &
  TSemanticProps;

// ============================================
// Internal: rendering helpers (merged from render-component.tsx)
// ============================================

interface ErrorFallbackProps {
  type: string;
  error: Error;
  className?: string;
  style?: React.CSSProperties;
}

/** Error fallback component shown when an exporter throws. */
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

interface RenderConfig<T = any> {
  type: string;
  values: T;
  mode: RenderMode;
  className?: string;
  style?: React.CSSProperties;
  args?: any[];
  /** Column/body context merged into the exporter `meta` (8th arg). */
  metaContext?: Record<string, any>;
  innerHTML?: string;
  _config?: UnlayerConfig;
  exporter: Function;
}

/**
 * Allocate the next unique HTML id for a prefix, scoped to one render.
 * Counters live on the threaded `_config` (`__ids`), which Body resets per
 * render — so renderToHtml produces unique ids (u_row_1, u_row_2, …) like the
 * editor and like renderToJson, instead of resetting per row. Falls back to
 * `${prefix}_1` when rendered standalone (no _config).
 */
export function nextHtmlId(config: any, prefix: string): string {
  if (!config) return `${prefix}_1`;
  const ids: Record<string, number> = (config.__ids ??= {});
  ids[prefix] = (ids[prefix] || 0) + 1;
  return `${prefix}_${ids[prefix]}`;
}

/** Add _meta fields if not present. */
function ensureMeta(values: any, type: string, index: number = 0): any {
  return {
    ...values,
    _meta: {
      htmlID: `u_content_${type.toLowerCase()}_${index + 1}`,
      htmlClassNames: `u_content_${type.toLowerCase()}`,
      ...(values._meta || {})
    }
  };
}

/**
 * Render a component by calling its exporter and wrapping the HTML output.
 * Handles error boundaries, exporterConfig construction, and container vs item calling conventions.
 */
function renderComponent<T = any>(config: RenderConfig<T>): JSX.Element {
  const { type, values, mode, className, style, args = [], innerHTML, _config, exporter, metaContext } = config;

  try {
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
        ...(metaContext ?? {}),
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

// ============================================
// Public API
// ============================================

/**
 * Create an item component (Button, Heading, Paragraph, etc.)
 *
 * This factory eliminates the ~100 lines of boilerplate code that was
 * duplicated across every item component.
 *
 * @example
 * ```tsx
 * const Button = createItemComponent({
 *   name: "Button",
 *   defaultValues: BUTTON_DEFAULTS,
 *   propMapper: mapButtonProps,
 *   displayName: "Button"
 * });
 * ```
 */
export function createItemComponent<
  TValues extends Record<string, any> = any,
  TSemanticProps = any
>(
  config: ItemComponentConfig<TValues, TSemanticProps>
): React.FC<ItemComponentProps<TSemanticProps>> {
  // Inner render function — no hooks, safe to call as a plain function (Column does this)
  function renderFn(
    props: ItemComponentProps<TSemanticProps>
  ): React.ReactElement | null {
    const {
      // Base props
      mode: modeProp,
      className,
      style,

      // Internal props
      index = 0,
      colIndex = 0,
      cells = [],
      bodyValues = {},
      rowValues = {},
      columnValues = {},
      _config,

      // Children
      children,

      // Rest are semantic props
      ...restProps
    } = props as ItemComponentProps<TSemanticProps>;

    // Resolve mode: explicit prop > _config > default
    const mode: RenderMode = modeProp ?? _config?.mode ?? "web";

    // 1. Map semantic props to values format (handles dual API)
    const mappedValues = config.propMapper({
      children,
      ...restProps
    } as TSemanticProps & { children?: React.ReactNode });

    // 2. Merge with defaults
    const finalValues = mergeValues(config.defaultValues, mappedValues);

    // 3. Ensure _meta is present
    const valuesWithMeta = ensureMeta(
      finalValues,
      config.name.toLowerCase(),
      index
    );

    // 4. Ensure bodyValues has a contentWidth. Default to the schema-shaped
    //    "500px" (matches BodyDefaults.contentWidth and the exporter's image
    //    fallback width), so a standalone item (no Body) sizes the same as the
    //    editor and the value is a CSS string everywhere it might be consumed.
    const safeBodyValues = {
      contentWidth: "500px",
      ...bodyValues
    };

    // 5. Resolve link/action fields to the exporter's render-value shape.
    //    Skipped on the renderToJson path (which uses propMapper directly)
    //    so JSON output preserves the schema's storage shape.
    const valuesForExporter = normalizeValuesForExporter(
      valuesWithMeta as Record<string, any>,
      config.name
    );

    // 6. Resolve exporter for this mode (fallback to web)
    const exporter = (config.exporters[mode] || config.exporters.web)!;

    // 7. Render using utility (handles all boilerplate)
    return renderComponent<TValues>({
      type: config.name,
      values: valuesForExporter as TValues,
      mode,
      className,
      style,
      args: [index, colIndex, cells, safeBodyValues, rowValues],
      // The 8th arg the exporters actually read: column/body context for
      // width-aware rendering (Image's available-width calc), mirroring the editor.
      metaContext: {
        columnIndex: colIndex,
        columnValues,
        rowCells: cells,
        rowValues,
        bodyValues: safeBodyValues,
      },
      _config,
      exporter,
    });
  }

  // Outer React component — hook-free, works in both Server and Client Components
  const ItemComponent: React.FC<ItemComponentProps<TSemanticProps>> = (
    props
  ) => {
    return renderFn(props);
  };

  // Set display name for React DevTools
  ItemComponent.displayName = config.displayName || config.name;

  // Expose hook-free render for Column to call directly
  (ItemComponent as any)[UNLAYER_RENDER_KEY] = renderFn;

  // Expose config for renderToJson to extract values without HTML rendering
  (ItemComponent as any)[UNLAYER_CONFIG_KEY] = {
    name: config.name,
    defaultValues: config.defaultValues,
    propMapper: config.propMapper,
  };

  return ItemComponent;
}
