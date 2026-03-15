/**
 * Grid CSS Utilities
 *
 * Generates CSS for column layouts.
 * Used by renderRowToHtml to inject <style> blocks for column widths.
 *
 * SYNC CONTRACT: The class names generated here (u-col-{percentage})
 * must match what the column exporter produces. Both use the same formula:
 *   value = round((colSpan / rowSpan) * 100, 2)
 *   className = value.toString().replace('.', 'p')
 *
 * See grid-css.test.ts for drift detection tests.
 */

export interface WidthPercentage {
  value: number;
  className: string;
}

import type { RenderMode } from "../types";

export interface GridCSSOptions {
  /** Column cells configuration (e.g., [1, 1] for two equal columns) */
  cells: number[];
  /** Display mode */
  mode: RenderMode;
  /** Content width in pixels (default: 600) */
  contentWidth?: number;
  /** Mobile breakpoint in pixels (default: 620) */
  mobileBreakpoint?: number;
}

/**
 * Calculate width percentages from cells array.
 *
 * Uses the same formula as the column exporter:
 *   value = Math.round((colSpan / total) * 100 * 100) / 100
 *   className = `${value}`.replace(/\./g, 'p')
 *
 * @example [1, 1] -> [{ value: 50, className: "50" }, { value: 50, className: "50" }]
 * @example [1, 2] -> [{ value: 33.33, className: "33p33" }, { value: 66.67, className: "66p67" }]
 */
export function getWidthPercentages(cells: number[]): WidthPercentage[] {
  if (cells.length === 0) return [];
  const total = cells.reduce((a, b) => a + b, 0);
  if (total <= 0) return [];
  return cells.map((span) => {
    const value = Math.round((span / total) * 100 * 100) / 100;
    const className = `${value}`.replace(/\./g, 'p');
    return { value, className };
  });
}

/**
 * Generate CSS for column widths.
 *
 * For web mode: flexbox with responsive breakpoint
 * For email mode: percentage widths for email clients
 */
export function generateGridCSS(options: GridCSSOptions): string {
  const { cells, mode, contentWidth = 600, mobileBreakpoint = 620 } = options;
  const widths = getWidthPercentages(cells);

  if (mode === 'email') {
    return generateEmailCSS(widths, contentWidth);
  }

  return generateWebCSS(widths, mobileBreakpoint);
}

function generateEmailCSS(
  widths: WidthPercentage[],
  contentWidth: number,
): string {
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

function generateWebCSS(
  widths: WidthPercentage[],
  mobileBreakpoint: number,
): string {
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
