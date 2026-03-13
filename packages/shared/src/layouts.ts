/**
 * Column Layouts - All 8 supported column combinations from Unlayer Editor
 *
 * These layouts provide a structured and type-safe way to specify column
 * configurations that match exactly what the Unlayer editor supports.
 *
 * Usage:
 * import { ColumnLayouts } from '@unlayer-internal/shared-elements';
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

export const ColumnLayouts = {
  OneColumn: {
    name: 'OneColumn',
    description: 'One full column (100%)',
    cells: [1],
    expectedColumns: 1,
    widths: ['100%'],
  } as ColumnLayout,

  TwoEqual: {
    name: 'TwoEqual',
    description: 'Two equal columns (50% + 50%)',
    cells: [1, 1],
    expectedColumns: 2,
    widths: ['50%', '50%'],
  } as ColumnLayout,

  TwoWideNarrow: {
    name: 'TwoWideNarrow',
    description: 'Two columns: wide + narrow (67% + 33%)',
    cells: [2, 1],
    expectedColumns: 2,
    widths: ['66.67%', '33.33%'],
  } as ColumnLayout,

  TwoNarrowWide: {
    name: 'TwoNarrowWide',
    description: 'Two columns: narrow + wide (33% + 67%)',
    cells: [1, 2],
    expectedColumns: 2,
    widths: ['33.33%', '66.67%'],
  } as ColumnLayout,

  ThreeEqual: {
    name: 'ThreeEqual',
    description: 'Three equal columns (33% + 33% + 33%)',
    cells: [1, 1, 1],
    expectedColumns: 3,
    widths: ['33.33%', '33.33%', '33.33%'],
  } as ColumnLayout,

  ThreeNarrowWideNarrow: {
    name: 'ThreeNarrowWideNarrow',
    description: 'Three columns: narrow + wide + narrow (25% + 50% + 25%)',
    cells: [1, 2, 1],
    expectedColumns: 3,
    widths: ['25%', '50%', '25%'],
  } as ColumnLayout,

  FourEqual: {
    name: 'FourEqual',
    description: 'Four equal columns (25% + 25% + 25% + 25%)',
    cells: [1, 1, 1, 1],
    expectedColumns: 4,
    widths: ['25%', '25%', '25%', '25%'],
  } as ColumnLayout,

  FiveEqual: {
    name: 'FiveEqual',
    description: 'Five equal columns (20% + 20% + 20% + 20% + 20%)',
    cells: [1, 1, 1, 1, 1],
    expectedColumns: 5,
    widths: ['20%', '20%', '20%', '20%', '20%'],
  } as ColumnLayout,
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
