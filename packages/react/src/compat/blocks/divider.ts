/** A divider: its line, length and padding (on phones too), placed by its alignment where it's shorter than its column. */
import { contentSlotWidth } from "../../utils/image-sizing";
import type { DesignBlock, Place, TreeNode } from "../lower";
import { dividerLength } from "../quirks";
import { px, sides, some } from "../values";

export function divider({ values }: DesignBlock, place: Place): TreeNode | undefined {
  // A block given a mode of its own is drawn in that output's markup, whatever its template's.
  if (values.mode !== undefined && values.mode !== place.mode) return undefined;
  if (Object.keys(values._override?.mobile ?? {}).some((key) => key !== "containerPadding" && key !== "hideMobile")) return undefined;
  const line = values.border ?? {};
  const width = dividerLength(values.width);
  const lineWidth = line.borderTopWidth === undefined ? 1 : px(line.borderTopWidth);
  const padding = sides(values.containerPadding ?? "10px");
  const phonePadding = values._override?.mobile?.containerPadding;
  if (lineWidth === undefined || !padding || (width !== undefined && width !== 0 && !/^\d*\.?\d+(px|%)?$/.test(String(width)))) return undefined;
  if (phonePadding !== undefined && !sides(phonePadding)) return undefined;
  const length = width === undefined || width === "100%" ? undefined : px(width) ?? String(width);
  // A line longer than its place: legacy's table is that long, past its column; the new one is no longer than its place.
  const room = contentSlotWidth({ bodyValues: place.body, rowValues: place.row, rowCells: place.cells, columnIndex: place.index, columnValues: place.column, containerPadding: values.containerPadding ?? "10px" });
  if (typeof length === "number" && length > room) return undefined;
  const node: TreeNode = {
    type: "Divider",
    style: {
      borderTop: { width: lineWidth, style: line.borderTopStyle ?? "solid", color: line.borderTopColor ?? "#BBBBBB" },
      ...(length !== undefined ? { width: length } : {}),
      ...(some(padding) ? { padding } : {}),
    },
    ...(phonePadding !== undefined ? { mobile: { padding: sides(phonePadding)! } } : {}),
  };
  // The new Divider sits where its parent's text is aligned.
  return length !== undefined ? { type: "Column", style: { textAlign: values.textAlign ?? "center" }, children: [node] } : node;
}
