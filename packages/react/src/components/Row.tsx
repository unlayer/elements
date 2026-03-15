import React from "react";
import type { RenderMode, UnlayerConfig, RowValues } from "@unlayer-internal/shared-elements";
import { renderRowToHtml, validateColumnLayout } from "@unlayer-internal/shared-elements";
import type { ColumnLayout } from "@unlayer-internal/shared-elements";
import { mapSemanticProps, type SemanticProps } from "../utils/semantic-props";
import { ROW_DEFAULTS, BODY_DEFAULTS } from "../utils/container-defaults";

/**
 * Row - Container for columns in a layout
 *
 * Uses the Row exporter from @unlayer-dev/exporters (via shared).
 * Column children call their own exporters.
 *
 * @example
 * ```tsx
 * <Row cells={[1, 1]}>
 *   <Column><Button>Click me</Button></Column>
 *   <Column><Paragraph>Hello</Paragraph></Column>
 * </Row>
 * ```
 */

const DEFAULT_VALUES = ROW_DEFAULTS;

const DEFAULT_BODY_VALUES = BODY_DEFAULTS;

export interface RowProps extends SemanticProps<RowValues> {
  children?: React.ReactNode;
  layout?: ColumnLayout;
  cells?: number[];
  mode?: RenderMode;
  className?: string;
  style?: React.CSSProperties;
  index?: number;
  bodyValues?: any;
  collection?: string;
  /** @internal - Unlayer config threaded from UnlayerProvider via Body */
  _config?: UnlayerConfig;
}

/**
 * Process Column children and extract their HTML
 */
function processChildren(
  children: React.ReactNode,
  cells: number[],
  bodyValues: any,
  rowValues: any,
  mode: RenderMode,
  _config?: UnlayerConfig
): string {
  if (!children) return "";

  let innerHTML = "";
  const childrenArray = React.Children.toArray(children);

  childrenArray.forEach((child, index) => {
    if (!React.isValidElement(child)) {
      if (typeof child === "string" || typeof child === "number") {
        innerHTML += String(child);
      }
      return;
    }

    const componentType = child.type as any;
    const isColumn =
      componentType?.displayName === "Column" ||
      componentType?.name === "Column";

    if (isColumn && typeof child.type === "function") {
      // Call Column component with context props
      const rendered = (child.type as Function)({
        ...child.props,
        index,
        cells,
        bodyValues,
        rowValues,
        mode,
        _config
      });

      // Extract HTML from dangerouslySetInnerHTML
      if (rendered?.props?.dangerouslySetInnerHTML?.__html) {
        innerHTML += rendered.props.dangerouslySetInnerHTML.__html;
      }
    } else if (React.isValidElement(child)) {
      const name = (child.type as any)?.displayName || (child.type as any)?.name || "Unknown";
      console.warn(
        `Row: <${name}> is not a valid Row child. Only <Column> components can be direct children of <Row>. ` +
        `Wrap it in a <Column>: <Row><Column><${name} /></Column></Row>`
      );
    }
  });

  return innerHTML;
}

const Row: React.FC<RowProps> = (props) => {
  const {
    layout,
    cells: propsCells,
    children,
    mode: modeProp,
    className,
    style,
    index = 0,
    bodyValues = {},
    collection = "rows",
    _config,
    ...semanticProps
  } = props;

  // Resolve mode: explicit prop > _config > default
  const mode: RenderMode = modeProp ?? _config?.mode ?? "web";

  // Determine cells from layout or props
  let cells = propsCells || [1];
  if (layout) {
    validateColumnLayout(layout, React.Children.count(children));
    cells = layout.cells;
  }

  // Merge body values with defaults
  const safeBodyValues = { ...DEFAULT_BODY_VALUES, ...bodyValues };

  // Map semantic props to values
  const values = mapSemanticProps<RowValues>(
    semanticProps,
    DEFAULT_VALUES,
    "Row"
  );

  const valuesWithMeta = {
    ...values,
    cells,
    _meta: {
      htmlID: `u_row_${index + 1}`,
      htmlClassNames: "u_row",
      ...(values._meta || {})
    }
  };

  // Process Column children
  const innerHTML = processChildren(
    children,
    cells,
    safeBodyValues,
    valuesWithMeta,
    mode,
    _config
  );

  try {
    const html = renderRowToHtml({
      innerHTML,
      values: valuesWithMeta,
      bodyValues: safeBodyValues,
      mode,
      cells,
      collection,
    });

    return (
      <div
        dangerouslySetInnerHTML={{ __html: html }}
        className={className}
        style={style}
      />
    );
  } catch (error) {
    console.error("Row rendering failed:", error);
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }
};

Row.displayName = "Row";

export default Row;
