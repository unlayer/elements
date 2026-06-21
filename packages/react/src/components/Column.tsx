import React from "react";
import type { RenderMode, UnlayerConfig, ColumnValues } from "@unlayer-internal/shared-elements";
import { ColumnExporters, ContentExporters } from "@unlayer/exporters";
import { UNLAYER_RENDER_KEY } from "../utils/create-component";
import { mapSemanticProps, type SemanticProps } from "../utils/semantic-props";
import { COLUMN_DEFAULTS } from "../utils/container-defaults";

/** Unlayer's default content-block padding when a block sets none. */
const DEFAULT_CONTAINER_PADDING = "10px";

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

export interface ColumnProps extends SemanticProps<ColumnValues> {
  children?: React.ReactNode;
  // Internal props (provided by Row)
  index?: number;
  cells?: number[];
  bodyValues?: any;
  rowValues?: any;
  mode?: RenderMode;
  className?: string;
  style?: React.CSSProperties;
  /** @internal - Unlayer config threaded from UnlayerProvider via Body/Row */
  _config?: UnlayerConfig;
}

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
  const values = mapSemanticProps<ColumnValues>(
    semanticProps,
    DEFAULT_VALUES,
    "Column"
  );

  // Add _meta
  const valuesWithMeta = {
    ...values,
    _meta: {
      htmlID: `u_column_${index + 1}`,
      htmlClassNames: "u_column",
      ...(values._meta || {})
    }
  };

  // Render children to HTML - extract from dangerouslySetInnerHTML
  let innerHTML = "";
  if (children) {
    try {
      const childrenArray = React.Children.toArray(children);

      childrenArray.forEach((child, childIndex) => {
        if (typeof child === "string" || typeof child === "number") {
          innerHTML += String(child);
        } else if (React.isValidElement(child)) {
          // Call component function to get rendered result
          if (typeof child.type === "function") {
            const ComponentType = child.type as any;
            // Use __unlayerRender (hook-free) if available, otherwise call directly
            const renderFn: Function = ComponentType[UNLAYER_RENDER_KEY] || ComponentType;
            const rendered = renderFn({ ...child.props, _config });

            // Extract HTML from dangerouslySetInnerHTML
            if (
              rendered &&
              typeof rendered === "object" &&
              rendered.props &&
              rendered.props.dangerouslySetInnerHTML
            ) {
              const componentHTML =
                rendered.props.dangerouslySetInnerHTML.__html;
              const componentType = child.type as any;
              const componentName = (
                componentType?.displayName ||
                componentType?.name ||
                "component"
              ).toLowerCase();

              // Resolve the block's OWN containerPadding directly from props.
              // `containerPadding` is a universal base-content prop: it passes
              // straight through mapSemanticProps untouched and is not present in
              // any item's defaultValues, so reading it from props (flat prop +
              // `values` escape hatch) is equivalent to running the item's full
              // value pipeline — without paying for a second propMapper call per
              // child (for Paragraph that re-runs the Lexical textJson convert).
              // Falls back to Unlayer's content default. (Previously this read
              // `child.props.values?.containerPadding` only, which is undefined
              // for the flat-prop API, so every block collapsed to 0px padding.)
              const childProps = child.props as {
                containerPadding?: string;
                values?: { containerPadding?: string };
              };
              const containerPadding =
                childProps.containerPadding ??
                childProps.values?.containerPadding ??
                DEFAULT_CONTAINER_PADDING;

              // Wrap via the canonical content-container exporter for this mode.
              const contentValues = {
                containerPadding,
                _meta: {
                  htmlID: `u_content_${componentName}_${childIndex + 1}`,
                  htmlClassNames: `u_content_${componentName}`,
                },
              };
              innerHTML += renderContentToHtml(
                componentHTML,
                contentValues,
                bodyValues,
                mode
              );
            } else if (rendered) {
              const name = (child.type as any)?.displayName || (child.type as any)?.name || "Unknown";
              console.warn(
                `Column: <${name}> did not produce renderable HTML. ` +
                `Ensure it is an Unlayer component (Button, Text, Image, etc.).`
              );
            }
          }
        }
      });
    } catch (error) {
      console.error("Column: Failed to render children:", error);
      innerHTML = "";
    }
  }

  try {
    const html = renderColumnToHtml(innerHTML, valuesWithMeta, index, cells, bodyValues, rowValues, mode);

    return (
      <div
        dangerouslySetInnerHTML={{ __html: html }}
        className={className}
        style={style}
      />
    );
  } catch (error) {
    console.error("Column rendering failed:", error);
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }
};

Column.displayName = "Column";

export default Column;
