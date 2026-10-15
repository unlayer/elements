/** What a module's conversion knows about the template and where the module is, and how it reports. */
import type { DesignBuilder } from "./design";
import type { BeefreeVersion, BeefreeWebFont, DesignContent } from "./types";

/** Where a block sits, for an image's width as a percent of what its column leaves it (see image.ts). */
export interface Slot {
  bodyWidth: number;
  /** The row's padding, left and right (Unlayer's, around the columns). */
  rowSides: [number, number];
  cells: number[];
  column: number;
  /** The column's padding and border widths, left and right. */
  columnSides: [number, number];
}

export interface ModuleContext {
  version: BeefreeVersion;
  builder: DesignBuilder;
  webFonts: readonly BeefreeWebFont[];
  /** The body's text color: a text block without its own shows it. */
  textColor: string;
  /** The body's link color. */
  linkColor: string;
  /** The body's direction (`ltr`, `rtl`). */
  direction: string;
  /** `Row 2, column 1, module 3 (image)`. */
  where: string;
  slot: Slot;
  warn(reason: string, message: string): void;
  /** Report the module as kept as HTML. */
  fallback(reason: string): void;
}

/** A module's conversion: the blocks it becomes (none when it's left out, and said so). */
export type ModuleResult = DesignContent[];

/**
 * The width in px a block has in its slot: the body's width less the row's sides, its column's share of that, less
 * the column's and the block's sides (as the renderers work it out).
 */
export function slotWidth(slot: Slot, blockSides: [number, number]): number {
  const total = slot.cells.reduce((a, b) => a + b, 0) || 1;
  const row = slot.bodyWidth - slot.rowSides[0] - slot.rowSides[1];
  const column = ((slot.cells[slot.column] ?? 1) / total) * row;
  return column - slot.columnSides[0] - slot.columnSides[1] - blockSides[0] - blockSides[1];
}
