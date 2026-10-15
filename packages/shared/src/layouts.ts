/**
 * Column Layouts - All 8 supported column combinations from Unlayer Editor
 *
 * These layouts provide a structured and type-safe way to specify column
 * configurations that match exactly what the Unlayer editor supports.
 *
 * Usage:
 * import { ColumnLayouts } from '@unlayer/react-elements';
 * <Row layout={ColumnLayouts.TwoEqual}>
 *   <Column>...</Column>
 *   <Column>...</Column>
 * </Row>
 */

export interface ColumnLayout {
  name: string;
  description: string;
  cells: number[];
  expectedColumns: number;
  widths: string[]; // e.g., ["50%", "50%"]
}

/** A layout from its name, its columns' relative widths and how it's described. */
function layout(name: string, cells: number[], description: string): ColumnLayout {
  const total = cells.reduce((a, b) => a + b);
  return { name, description, cells, expectedColumns: cells.length, widths: cells.map((cell) => `${+((cell / total) * 100).toFixed(2)}%`) };
}

export const ColumnLayouts = {
  OneColumn: layout('OneColumn', [1], 'One full column (100%)'),
  TwoEqual: layout('TwoEqual', [1, 1], 'Two equal columns (50% + 50%)'),
  TwoWideNarrow: layout('TwoWideNarrow', [2, 1], 'Two columns: wide + narrow (67% + 33%)'),
  TwoNarrowWide: layout('TwoNarrowWide', [1, 2], 'Two columns: narrow + wide (33% + 67%)'),
  ThreeEqual: layout('ThreeEqual', [1, 1, 1], 'Three equal columns (33% + 33% + 33%)'),
  ThreeNarrowWideNarrow: layout('ThreeNarrowWideNarrow', [1, 2, 1], 'Three columns: narrow + wide + narrow (25% + 50% + 25%)'),
  FourEqual: layout('FourEqual', [1, 1, 1, 1], 'Four equal columns (25% + 25% + 25% + 25%)'),
  FiveEqual: layout('FiveEqual', [1, 1, 1, 1, 1], 'Five equal columns (20% + 20% + 20% + 20% + 20%)'),
};

// Export the layout type for strict typing
export type ValidColumnLayout = (typeof ColumnLayouts)[keyof typeof ColumnLayouts];

/**
 * Validates that a layout has the correct number of Column components
 */
export function validateColumnLayout(layout: ColumnLayout, childrenCount: number): void {
  if (layout.expectedColumns !== childrenCount) {
    throw new Error(`${layout.name} layout expects ${layout.expectedColumns} <Column> components, but got ${childrenCount}. Layout: ${layout.description}. Make sure you have exactly ${layout.expectedColumns} <Column> children.`);
  }
}
