import React from "react";
import type { RenderMode, UnlayerConfig, ColumnValues } from "@unlayer-internal/shared-elements";
import { ColumnExporters, ContentExporters } from "@unlayer/exporters";
import { UNLAYER_RENDER_KEY, UNLAYER_CONFIG_KEY, nextHtmlId, safeName, safeMeta, hatch } from "../utils/create-component";
import { RenderError } from "@unlayer-internal/shared-elements";
import { mapSemanticProps, type SemanticProps } from "../utils/semantic-props";
import type { DeviceProps, SizeInput, BorderInput } from "../types";
import { COLUMN_DEFAULTS } from "../utils/container-defaults";
import { failed, looseText } from "../utils/render-scope";
import { RECORDS } from "../utils/collect";
import { DEFAULT_CONTAINER_PADDING } from "../utils/image-sizing";

/** Unlayer's default content-block padding when a block sets none. */

/**
 * Column - Single column in a Row layout
 *
 * Calls the Column exporter from @unlayer/exporters.
 * Must be used inside <Row> component.
 *
 * @example
 * ```tsx
 * <Row cells={[1, 1]}>
 *   <Column>
 *     <Button>Click me</Button>
 *   </Column>
 *   <Column>
 *     <Paragraph>Hello</Paragraph>
 *   </Column>
 * </Row>
 * ```
 */

const DEFAULT_VALUES = COLUMN_DEFAULTS;

// ============================================
// Column exporter wrapper (inlined from shared/utils/render-container-to-html.ts)
// ============================================

type ColumnExporterFunction = (innerHTML: string, values: Record<string, any>, index: number, cells: number[], bodyValues?: Record<string, any>, rowValues?: Record<string, any>) => string;

function renderColumnToHtml(innerHTML: string, values: any, index: number, cells: number[], bodyValues: any, rowValues: any, mode: RenderMode): string {
  const columnExporter = (ColumnExporters[mode] || ColumnExporters.web) as ColumnExporterFunction;
  return columnExporter(innerHTML, values, index, cells, bodyValues, rowValues);
}

// Canonical content-container wrapper (the `u_content_*` block that carries
// each item's containerPadding). Signature per mode: (innerHTML, values,
// bodyValues, meta). Delegating to the exporter keeps padding, classes, and the
// per-mode div/table structure consistent with the canonical exporter output.
type ContentExporterFunction = (innerHTML: string, values: Record<string, any>, bodyValues?: Record<string, any>, meta?: Record<string, any>) => string;

function renderContentToHtml(innerHTML: string, values: any, bodyValues: any, mode: RenderMode): string {
  const contentExporter = (ContentExporters[mode] || ContentExporters.web) as ContentExporterFunction;
  return contentExporter(innerHTML, values, bodyValues, {});
}

// ============================================
// Component
// ============================================

// The editor hides rows and content on a device, never a column: no hideOnMobile/hideOnDesktop here.
export type ColumnProps = Omit<SemanticProps<ColumnValues>, "padding" | "border" | "borderRadius" | keyof DeviceProps> & Omit<DeviceProps, "hideOnMobile" | "hideOnDesktop"> & {
  children?: React.ReactNode;
  // Internal props (provided by Row)
  index?: number;
  cells?: number[];
  bodyValues?: any;
  rowValues?: any;
  mode?: RenderMode;
  /** Class names on the column's cell; HTML only. */
  className?: string;
  /** Inline CSS on the column's cell, after the renderer's own (a prop given wins over the same property); HTML only. */
  style?: React.CSSProperties;
  /** Padding — a CSS string ("0 24px", "10px") or a number (px). */
  padding?: SizeInput;
  /** Corner radius — a number (→ px) or CSS string ("8px"). */
  borderRadius?: SizeInput;
  /** Per-side border object (great for hairline dividers). Width fields accept
   *  a number/px string; reuse it as a factored-out const without `as const`. */
  border?: BorderInput;
  /** @internal - Unlayer config threaded from UnlayerProvider via Body/Row */
  _config?: UnlayerConfig;
};

// A collecting walk records a Column (see utils/record.tsx); rendered, it's the collected Column's HTML.
export const Column: React.FC<ColumnProps> = (props) => {
  const {
    children,
    index = 0,
    cells = [1],
    bodyValues = {},
    rowValues = {},
    mode: modeProp,
    className,
    style,
    _config,
    ...semanticProps
  } = props;

  // Resolve mode: explicit prop > _config > default
  const mode: RenderMode = modeProp ?? _config?.mode ?? "web";

  // Map semantic props to values
  const values = mapSemanticProps<ColumnValues>(semanticProps as SemanticProps<ColumnValues>, DEFAULT_VALUES, "Column");

  // Add _meta (an id or class names given in values kept to what they can hold, as for rows and blocks)
  const valuesWithMeta = { ...values, _meta: safeMeta({ htmlID: nextHtmlId(_config, "u_column"), htmlClassNames: "u_column", ...(values._meta || {}) }) };

  // Render children to HTML - extract from dangerouslySetInnerHTML
  let innerHTML = "";
  for (const child of React.Children.toArray(children)) {
    if (typeof child === "string" || typeof child === "number") {
      innerHTML += looseText(child, "Column");
      continue;
    }
    // Call component function to get rendered result
    if (!React.isValidElement(child) || typeof child.type !== "function") continue;
    const ComponentType = child.type as any;
    const config = ComponentType[UNLAYER_CONFIG_KEY];
    // Use __unlayerRender (hook-free) if available, otherwise call directly
    const renderFn: Function = ComponentType[UNLAYER_RENDER_KEY] || ComponentType;
    // Allocate the content id BEFORE rendering and thread it in, so the value-level _meta.htmlID exporters see
    // (custom tool head css scopes on it) is unique per instance and matches both the wrapper id and the
    // head-extraction/json numbering. Custom tools carry an explicit meta base (custom_<slug>); built-ins derive it
    // from the component name.
    const componentName = config?.metaName ?? (ComponentType.displayName || ComponentType.name || "component").toLowerCase();
    const contentHtmlId = nextHtmlId(_config, `u_content_${componentName}`);
    // Thread the column/body context so width-aware item exporters (Image) can size against the real available width
    // (contentWidth × column fraction) instead of the fallback. Mirrors the editor, which passes this context to the
    // content exporters.
    let rendered: any;
    try {
      rendered = renderFn({ ...child.props, _config, _metaHtmlId: contentHtmlId, colIndex: index, cells, bodyValues, rowValues, columnValues: valuesWithMeta });
    } catch (error) {
      // Its exporter failed: the render fails, or (`onError: "omit"`) it's left out of the HTML, and by its record
      // (normalize.tsx gives it) of the head and the design too; the next block takes its id.
      const ids = (_config as { __ids?: Record<string, number> } | undefined)?.__ids;
      if (ids) ids[`u_content_${componentName}`]--;
      const record = (child.props as { _record?: { position?: string } })._record;
      const name = config?.name ?? (ComponentType.displayName || ComponentType.name || "Block");
      failed(error instanceof RenderError ? error : new RenderError(`${name} failed to render: ${String((error as Error)?.message ?? error)}`, name, record?.position ?? `Column ${index + 1} › ${name}`, error), record);
      continue;
    }

    // Extract HTML from dangerouslySetInnerHTML
    const inner = rendered?.props?.dangerouslySetInnerHTML;
    if (!inner) {
      if (rendered) console.warn(`Column: <${ComponentType.displayName || ComponentType.name || "Unknown"}> did not produce renderable HTML. Ensure it is an Unlayer component (Button, Text, Image, etc.).`);
      continue;
    }
    const componentHTML = inner.__html;

    // Some components intentionally produce no output in unsupported modes. Do not turn that into a padded
    // content wrapper.
    if (!componentHTML && config?.omitEmptyOutput) continue;

    // Resolve the block's OWN containerPadding directly from props. `containerPadding` is a universal base-content
    // prop: it passes straight through mapSemanticProps untouched and is not present in any item's defaultValues,
    // so reading it from props (flat prop + `values` escape hatch) is equivalent to running the item's full value
    // pipeline — without paying for a second propMapper call per child (for Paragraph that re-runs the Lexical
    // textJson convert). Falls back to Unlayer's content default; a bare number is px.
    const childProps = child.props as {
      containerPadding?: string | number;
      skipInText?: boolean;
      hideOnMobile?: boolean;
      hideOnDesktop?: boolean;
      values?: { containerPadding?: string | number; _override?: Record<string, any>; _meta?: Record<string, any> };
    };
    const rawContainerPadding = childProps.containerPadding ?? childProps.values?.containerPadding ?? DEFAULT_CONTAINER_PADDING;
    const containerPadding = typeof rawContainerPadding === "number" ? `${rawContainerPadding}px` : rawContainerPadding;

    // A custom tool's props are its own values, as in 0.1.22: a `hideOnMobile` of its own isn't a device setting.
    const device = config?.contentType === "custom" ? {} : childProps;
    const override = childProps.values?._override;

    // Wrap via the canonical content-container exporter for this mode.
    const contentValues = {
      containerPadding,
      _override: {
        ...override,
        mobile: { ...override?.mobile, ...(device.hideOnMobile !== undefined ? { hideMobile: device.hideOnMobile } : {}) },
        desktop: { ...override?.desktop, ...(device.hideOnDesktop !== undefined ? { hideDesktop: device.hideOnDesktop } : {}) },
      },
      _meta: { htmlID: contentHtmlId, htmlClassNames: `u_content_${componentName}`, ...(childProps.values?._meta?.htmlID ? { htmlID: safeName(childProps.values._meta.htmlID) } : {}) },
    };
    const content = renderContentToHtml(componentHTML, contentValues, bodyValues, mode);
    // `skipInText`: the block isn't in the plain text.
    innerHTML += childProps.skipInText ? content.replace(/<[a-z]+/, '$& data-skip-in-text="true"') : content;
  }

  // Its `style` and `className` on its column cell (see hatch). Its exporter failing fails its Row.
  const html = hatch(renderColumnToHtml(innerHTML, valuesWithMeta, index, cells, bodyValues, rowValues, mode), /<div[^>]*class="u-col[ "][^>]*>/, style, className, semanticProps);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

Column.displayName = "Column";
(Column as unknown as Record<symbol, boolean>)[RECORDS] = true;

export default Column;
