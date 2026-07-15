import React from "react";
import type { RenderMode, UnlayerConfig, ColumnValues } from "@unlayer-internal/shared-elements";
import { ColumnExporters, ContentExporters } from "@unlayer/exporters";
import { UNLAYER_RENDER_KEY, UNLAYER_CONFIG_KEY, nextHtmlId } from "../utils/create-component";
import { escapeHtml } from "@unlayer-internal/shared-elements";
import { flattenChildren, unwrapComponentType } from "../utils/children";
import { mapSemanticProps, type SemanticProps } from "../utils/semantic-props";
import type { SizeInput, BorderInput } from "../types";
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

export type ColumnProps = Omit<SemanticProps<ColumnValues>, "padding" | "border" | "borderRadius"> & {
  children?: React.ReactNode;
  /** @internal - column index, threaded by Row */
  index?: number;
  /** @internal - row cell spans, threaded by Row */
  cells?: number[];
  /** @internal - resolved body values, threaded by Row */
  bodyValues?: any;
  /** @internal - resolved row values, threaded by Row */
  rowValues?: any;
  mode?: RenderMode;
  className?: string;
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
    semanticProps as SemanticProps<ColumnValues>,
    DEFAULT_VALUES,
    "Column"
  );

  // Add _meta
  const valuesWithMeta = {
    ...values,
    _meta: {
      htmlID: nextHtmlId(_config, "u_column"),
      htmlClassNames: "u_column",
      ...(values._meta || {})
    }
  };

  // Render children to HTML - extract from dangerouslySetInnerHTML
  let innerHTML = "";
  if (children) {
    // Fragments are flattened so items behind a <>…</> still render; each
    // child gets its own try/catch so one failing block cannot wipe out the
    // HTML already accumulated for its siblings.
    const childrenArray = flattenChildren(children);

    childrenArray.forEach((child) => {
      try {
        if (typeof child === "string" || typeof child === "number") {
          // Plain-text contract: string children are text, not markup.
          innerHTML += escapeHtml(String(child));
        } else if (React.isValidElement(child)) {
          // Unwrap React.memo/forwardRef so wrapped Unlayer components render
          // instead of being dropped (their statics live on the inner type).
          const resolvedChildType = unwrapComponentType(child.type);
          if (typeof resolvedChildType === "function") {
            const ComponentType = resolvedChildType as any;
            // Use __unlayerRender (hook-free) if available, otherwise call directly
            const renderFn: Function = ComponentType[UNLAYER_RENDER_KEY] || ComponentType;
            // Allocate the content id BEFORE rendering and thread it in, so
            // the value-level _meta.htmlID exporters see (custom tool head
            // css scopes on it) is unique per instance and matches both the
            // wrapper id and the head-extraction/json numbering. Custom
            // tools carry an explicit meta base (custom_<slug>); built-ins
            // derive it from the component name.
            const componentName =
              ComponentType?.[UNLAYER_CONFIG_KEY]?.metaName ??
              (
                ComponentType?.displayName ||
                ComponentType?.name ||
                "component"
              ).toLowerCase();
            const contentHtmlId = nextHtmlId(_config, `u_content_${componentName}`);
            // Thread the column/body context so width-aware item exporters (Image)
            // can size against the real available width (contentWidth × column
            // fraction) instead of the fallback. Mirrors the editor, which passes
            // this context to the content exporters.
            const rendered = renderFn({
              ...child.props,
              _config,
              _metaHtmlId: contentHtmlId,
              colIndex: index,
              cells,
              bodyValues,
              rowValues,
              columnValues: valuesWithMeta,
            });

            // Extract HTML from dangerouslySetInnerHTML
            if (
              rendered &&
              typeof rendered === "object" &&
              rendered.props &&
              rendered.props.dangerouslySetInnerHTML
            ) {
              const componentHTML =
                rendered.props.dangerouslySetInnerHTML.__html;

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
                containerPadding?: string | number;
                values?: { containerPadding?: string | number };
              };
              const rawContainerPadding =
                childProps.containerPadding ??
                childProps.values?.containerPadding ??
                DEFAULT_CONTAINER_PADDING;
              // A bare number is treated as px (same idiom as other size props).
              const containerPadding =
                typeof rawContainerPadding === "number"
                  ? `${rawContainerPadding}px`
                  : rawContainerPadding;

              // Wrap via the canonical content-container exporter for this mode.
              const contentValues = {
                containerPadding,
                _meta: {
                  htmlID: contentHtmlId,
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
          } else {
            // Host elements (<div>), class components, and other unsupported
            // child types would silently vanish — say so.
            const name =
              typeof child.type === "string"
                ? `<${child.type}>`
                : `<${(child.type as any)?.displayName || (child.type as any)?.name || "Unknown"}>`;
            console.warn(
              `Column: ${name} is not an Unlayer component and was skipped. ` +
                `Only Unlayer components (Button, Paragraph, Image, …) render ` +
                `inside <Column>; for raw markup use <Html>.`
            );
          }
        }
      } catch (error) {
        // Propagate in strict pipelines (renderToHtml defaults to "throw");
        // otherwise skip only this child and keep its siblings' HTML.
        if (_config?.onError === "throw") throw error;
        console.error("Column: Failed to render child:", error);
      }
    });
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
    if (_config?.onError === "throw") throw error;
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
