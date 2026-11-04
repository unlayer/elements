/**
 * Universal Component Factory
 *
 * Eliminates boilerplate by creating components from configuration.
 * This factory handles all the repetitive logic that was duplicated
 * across Button, Heading, Paragraph, etc.
 */

import React from "react";
import { collecting, RECORDS } from "./collect";
import { recordBlock, whileCollecting } from "./record";
import type { RenderMode, UnlayerConfig } from "@unlayer-internal/shared-elements";

/** A block's own HTML, by display mode: a custom tool's, an Html block's. */
type ItemExporters = Partial<Record<RenderMode, (...args: any[]) => string>>;
import type { DeviceProps, SizeInput } from "../types";
import { contentSlotWidth, pinImageSrc } from "./image-sizing";
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
export interface BaseItemComponentProps extends DeviceProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  mode?: RenderMode;
  /** Padding of the content wrapper around this item — a number (→ px) or a CSS
   *  string ("10px", "16px 24px"). Applied by the containing Column. */
  containerPadding?: SizeInput;

  // Internal props (for advanced use)
  index?: number;
  /** @internal — content id allocated by the containing Column; keeps the
   *  value-level _meta.htmlID unique per instance and aligned with the
   *  wrapper id and head/json numbering. */
  _metaHtmlId?: string;
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

  /** The block's own HTML, for one that has it (a custom tool, an Html block, a page break). */
  exporters?: ItemExporters;

  /** How it renders straight through React where it has no HTML of its own: the new engine draws it (compat/render.ts). */
  draw?: (type: React.ComponentType<any>, props: Record<string, any>) => React.ReactElement;

  /** Design-JSON content type override (defaults to the lowercased name).
   *  Custom tools use "custom". */
  contentType?: string;

  /** Custom tool name — emitted as the content's `slug` in design JSON. */
  slug?: string;

  /** Base name for `_meta.htmlID`/`htmlClassNames`, prefixed with
   *  `u_content_` where used (defaults to the lowercased `name`). Custom
   *  tools pass `custom_<slug>`, rendering as `u_content_custom_<slug>`. */
  metaName?: string;

  /** Head contributions (css/js/tags builders) carried by the component itself. */
  head?: Record<string, any>;
}

/**
 * Props type that combines base props with semantic props
 */
export type ItemComponentProps<TSemanticProps> = BaseItemComponentProps &
  Omit<TSemanticProps, keyof DeviceProps>;

// ============================================
// Internal: rendering helpers (merged from render-component.tsx)
// ============================================

interface ErrorFallbackProps {
  type: string;
  error: Error;
  className?: string;
  style?: React.CSSProperties;
}

/** Error fallback component shown when a block can't be drawn. */
export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
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
  className?: string;
  style?: React.CSSProperties;
  args?: any[];
  /** Column/body context merged into the exporter `meta` (8th arg). */
  metaContext?: Record<string, any>;
  _config?: UnlayerConfig;
  exporter: Function;
}

/**
 * An HTML id (or, with `spaces`, a list of class names) that can't end its attribute: all else stays as 0.1.22 wrote
 * it (`סיכום`, `section.2`, `sm:hidden`). The head's CSS escapes the id it selects (see device-overrides.ts).
 */
export function safeName(value: unknown, spaces = false): string {
  const text = String(value ?? "");
  // Class names apart on lines or by tabs stay apart, as the browser reads them.
  return spaces ? text.replace(/[\t\n\f\r]/g, " ").replace(/["'<>&`\u0000-\u001f\u007f]/g, "") : text.replace(/["'<>&`\s\u0000-\u001f\u007f]/g, "");
}

/** A block's or row's `_meta` with its id and class names kept to what they can hold (see `safeName`). */
export const safeMeta = <T extends { htmlID?: unknown; htmlClassNames?: unknown }>(meta: T) => ({ ...meta, htmlID: safeName(meta.htmlID), htmlClassNames: safeName(meta.htmlClassNames, true) });

/** A direction the `dir` attribute takes (ltr, rtl, auto). Anything else is dropped: it's written into markup. */
export function textDirectionOf(value: unknown): "ltr" | "rtl" | "auto" | undefined {
  const dir = typeof value === "string" ? value.trim().toLowerCase() : "";
  return dir === "ltr" || dir === "rtl" || dir === "auto" ? dir : undefined;
}

/** A block by its own exporter: its HTML in a <div>, or what says it failed. */
function renderComponent<T = any>(config: RenderConfig<T>): JSX.Element {
  const { type, values, className, style, args = [], _config, exporter, metaContext } = config;

  try {
    // Build exporterConfig from _config (falls back to defaults)
    const cfg = _config ?? DEFAULT_CONFIG;
    const exporterConfig = {
      generateHtmlFromTextJson,
      toSafeHtml: cfg.toSafeHtml,
      textDirection: textDirectionOf(cfg.textDirection),
      cdnBaseUrl: cfg.cdnBaseUrl,
    };

    // Item exporters signature: (values, index, colIndex, cells, bodyValues, rowValues, embeddedValues, meta)
    // Args 2-7 are deprecated positional params; the 8th arg is a meta object with all context
    const meta = {
      exporterConfig,
      mergeTagState: cfg.mergeTagState,
      ...(metaContext ?? {}),
    };
    let html = exporter(values, ...args, undefined, meta);

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
    if (config.draw) return config.draw(ItemComponent as React.ComponentType<any>, props);
    const {
      // Base props
      mode: modeProp,
      className,
      style,

      // Internal props
      index = 0,
      _metaHtmlId,
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

    // 3. Ensure _meta is present. The Column-allocated id wins so every
    //    instance is unique; the index fallback covers standalone renders.
    const metaName = config.metaName ?? config.name.toLowerCase();
    const meta = {
      htmlID: _metaHtmlId ?? `u_content_${metaName}_${index + 1}`,
      htmlClassNames: `u_content_${metaName}`,
      ...((finalValues as Record<string, any>)._meta || {}),
    };
    // An id or class name given in `values` reaches an attribute and the head's CSS selectors: only what they can hold.
    const valuesWithMeta = { ...finalValues, _meta: safeMeta(meta) };

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
      config.name,
      mode
    );

    // 5b. Convert a fixed (px) image pin to the editor's canonical percent now
    //     that the column geometry is known (Column threads columnValues/cells/
    //     bodyValues). Guarded on `src.autoWidth === false`, so only pinned
    //     images are touched; responsive images and non-image blocks pass through.
    const exportSrc = (valuesForExporter as Record<string, any>).src;
    if (exportSrc && typeof exportSrc === "object" && exportSrc.autoWidth === false) {
      const availableWidth = contentSlotWidth({
        bodyValues: safeBodyValues,
        rowValues,
        rowCells: cells,
        columnIndex: colIndex,
        columnValues,
        containerPadding:
          (props as { containerPadding?: unknown; values?: { containerPadding?: unknown } })
            .containerPadding ??
          (props as { values?: { containerPadding?: unknown } }).values?.containerPadding,
      });
      (valuesForExporter as Record<string, any>).src = pinImageSrc(exportSrc, availableWidth);
    }

    // 6. Resolve exporter for this mode (fallback to web)
    const exporter = (config.exporters?.[mode] || config.exporters?.web)!;

    // 7. Render it
    return renderComponent<TValues>({
      type: config.name,
      values: valuesForExporter as TValues,
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
    if (collecting()) return whileCollecting(() => recordBlock(ItemComponent, props as Record<string, any>), () => renderFn(props), ItemComponent.displayName ?? "Block");
    return renderFn(props);
  };

  // Set display name for React DevTools
  ItemComponent.displayName = config.displayName || config.name;

  // Expose hook-free render for Column to call directly
  (ItemComponent as any)[UNLAYER_RENDER_KEY] = renderFn;
  (ItemComponent as any)[RECORDS] = true;

  // Expose config for renderToJson and the new engine to read values without rendering
  (ItemComponent as any)[UNLAYER_CONFIG_KEY] = {
    name: config.name,
    defaultValues: config.defaultValues,
    propMapper: config.propMapper,
    contentType: config.contentType,
    slug: config.slug,
    metaName: config.metaName,
    head: config.head,
  };

  return ItemComponent;
}
