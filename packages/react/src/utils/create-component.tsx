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
import {
  mergeValues,
  generateHtmlFromTextJson,
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

  // Internal props (for advanced use)
  index?: number;
  colIndex?: number;
  cells?: any[];
  bodyValues?: any;
  rowValues?: any;
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
  innerHTML?: string;
  _config?: UnlayerConfig;
  exporter: Function;
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
  const { type, values, mode, className, style, args = [], innerHTML, _config, exporter } = config;

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

    // 4. Ensure bodyValues has required fields
    const safeBodyValues = {
      contentWidth: 600,
      ...bodyValues
    };

    // 5. Resolve exporter for this mode (fallback to web)
    const exporter = (config.exporters[mode] || config.exporters.web)!;

    // 6. Render using utility (handles all boilerplate)
    return renderComponent<TValues>({
      type: config.name,
      values: valuesWithMeta,
      mode,
      className,
      style,
      args: [index, colIndex, cells, safeBodyValues, rowValues],
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
