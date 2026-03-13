/**
 * Universal Component Factory
 *
 * Eliminates boilerplate by creating components from configuration.
 * This factory handles all the repetitive logic that was duplicated
 * across Button, Heading, Paragraph, etc.
 */

import React from "react";
import type { ItemExporters } from "@unlayer-dev/exporters";
import type { DisplayMode, UnlayerConfig } from "@unlayer-internal/shared-elements";
import { mergeValues, ensureMeta } from "@unlayer-internal/shared-elements";
import { renderComponent } from "./render-component";


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
  mode?: DisplayMode;

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
    const mode: DisplayMode = modeProp ?? _config?.mode ?? "web";

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
    const exporter = config.exporters[mode] || config.exporters.web;

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
