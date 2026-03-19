import React from "react";
import type { RenderMode, UnlayerConfig, RowValues } from "@unlayer-internal/shared-elements";
import { validateColumnLayout } from "@unlayer-internal/shared-elements";
import type { ColumnLayout } from "@unlayer-internal/shared-elements";
import { RowExporters } from "@unlayer/exporters";
import { mapSemanticProps, type SemanticProps } from "../utils/semantic-props";
import { ROW_DEFAULTS, BODY_DEFAULTS } from "../utils/container-defaults";

/**
 * Row - Container for columns in a layout
 *
 * Uses the Row exporter from @unlayer/exporters.
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

// ============================================
// Grid CSS (inlined from shared/utils/grid-css.ts)
// ============================================

interface WidthPercentage {
  value: number;
  className: string;
}

function getWidthPercentages(cells: number[]): WidthPercentage[] {
  if (cells.length === 0) return [];
  const total = cells.reduce((a, b) => a + b, 0);
  if (total <= 0) return [];
  return cells.map((span) => {
    const value = Math.round((span / total) * 100 * 100) / 100;
    const className = `${value}`.replace(/\./g, 'p');
    return { value, className };
  });
}

function generateGridCSS(cells: number[], mode: RenderMode, contentWidth: number = 600, mobileBreakpoint: number = 620): string {
  const widths = getWidthPercentages(cells);

  if (mode === 'email') {
    const minQuery = `@media only screen and (min-width: ${contentWidth + 20}px)`;
    const maxQuery = `@media only screen and (max-width: ${contentWidth + 20}px)`;

    return `
${minQuery} {
  .u-row { width: ${contentWidth}px !important; }
  .u-row .u-col { vertical-align: top; }
${widths.map(({ value, className }) => `  .u-row .u-col-${className} { width: ${Math.round((contentWidth * value) / 100)}px !important; }`).join('\n')}
}

${maxQuery} {
  .u-row-container { max-width: 100% !important; padding-left: 0px !important; padding-right: 0px !important; }
  .u-row { width: 100% !important; }
  .u-row .u-col { display: block !important; width: 100% !important; min-width: 320px !important; max-width: 100% !important; }
  .u-row .u-col > div { margin: 0 auto; }
  .no-stack .u-col { min-width: 0 !important; display: table-cell !important; }
${widths.map(({ value, className }) => `  .no-stack .u-col-${className} { width: ${value}% !important; }`).join('\n')}
}`;
  }

  // Web mode
  const baseCSS = `
.u-row {
  display: flex;
  flex-wrap: nowrap;
  margin-left: 0;
  margin-right: 0;
}
.u-row .u-col {
  position: relative;
  width: 100%;
  padding-right: 0;
  padding-left: 0;
}`;

  const columnCSS = widths
    .map(
      ({ value, className }) =>
        `.u-row .u-col.u-col-${className} { flex: 0 0 ${value}%; max-width: ${value}%; }`,
    )
    .join('\n');

  const responsiveCSS = `
@media only screen and (max-width: ${mobileBreakpoint}px) {
  .u-row { width: 100% !important; }
  .u-row .u-col {
    display: block !important;
    width: 100% !important;
    min-width: 320px !important;
    max-width: 100% !important;
  }
  .u-row .u-col > div { margin: 0 auto; }
  .no-stack .u-col {
    min-width: 0 !important;
    display: table-cell !important;
  }
${widths.map(({ value, className }) => `  .no-stack .u-col-${className} { width: ${value}% !important; }`).join('\n')}
}`;

  return baseCSS + '\n' + columnCSS + '\n' + responsiveCSS;
}

// ============================================
// Row exporter wrapper (inlined from shared/utils/render-container-to-html.ts)
// ============================================

type ContainerExporterFunction = (innerHTML: string, values: Record<string, any>, bodyValues?: Record<string, any>, options?: Record<string, any>) => string;

function renderRowToHtml(innerHTML: string, values: any, bodyValues: any, mode: RenderMode, cells: number[], collection: string = "rows"): string {
  const rowExporter = (RowExporters[mode] || RowExporters.web) as ContainerExporterFunction;
  const html = rowExporter(innerHTML, values, bodyValues, {
    collection,
    variant: mode,
  });

  const css = generateGridCSS(cells, mode);
  return css ? `<style>${css}</style>${html}` : html;
}

// ============================================
// Children processing
// ============================================

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

// ============================================
// Component
// ============================================

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
    const html = renderRowToHtml(innerHTML, valuesWithMeta, safeBodyValues, mode, cells, collection);

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
