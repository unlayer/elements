/**
 * A divider block as a Divider: its line, length and padding (on desktop windows and phones too), placed by its
 * alignment where it's shorter than its column. It always draws: a value that can't be read is said, and drawn as the
 * new Divider's default.
 */
import { contentSlotWidth } from "../../utils/image-sizing";
import { Unlowerable, type DesignBlock, type Place, type TreeNode } from "../lower";
import { dividerLength } from "../quirks";
import { deviceValues, LINE_STYLES, px, sides, some } from "../values";

export function divider(block: DesignBlock, place: Place): TreeNode {
  const { values, phone } = deviceValues(block.values, ["containerPadding"], place.mode);
  const note = (what: string, value: unknown) => place.note(`A divider's ${what} ${JSON.stringify(value)} can't be read: it's drawn without it.`);
  const line = values.border ?? {};
  let width = dividerLength(values.width);
  if (width !== undefined && width !== 0 && !/^\d*\.?\d+(px|%)?$/.test(String(width))) {
    note("length", width);
    width = undefined;
  }
  let lineWidth = line.borderTopWidth === undefined ? 1 : px(line.borderTopWidth);
  if (lineWidth === undefined) {
    note("line width", line.borderTopWidth);
    lineWidth = 1;
  }
  let padding = sides(values.containerPadding ?? "10px");
  if (!padding) {
    note("padding", values.containerPadding);
    padding = sides("10px");
  }
  const phonePadding = phone.containerPadding === undefined ? undefined : sides(phone.containerPadding);
  if (phone.containerPadding !== undefined && !phonePadding) note("padding on phones", phone.containerPadding);
  const style = line.borderTopStyle ?? "solid";
  if (!LINE_STYLES.has(style)) note("line style", style);
  const length = width === undefined || width === "100%" ? undefined : px(width) ?? String(width);
  // A line longer than its place: legacy's table is that long and pushes its row past the email, which scrolls sideways
  // with the row's other columns moved along; the new email's columns share their row's width, so even legacy's own
  // divider among them draws otherwise (its neighbours squeezed). The email renders as today.
  const room = contentSlotWidth({ bodyValues: place.body, rowValues: place.row, rowCells: place.cells, columnIndex: place.index, columnValues: place.column, containerPadding: values.containerPadding ?? "10px" });
  if (place.mode === "email" && typeof length === "number" && length > room) throw new Unlowerable("a divider longer than its column, whose row legacy draws past the email");
  const node: TreeNode = {
    type: "Divider",
    style: {
      borderTop: { width: lineWidth, style: LINE_STYLES.has(style) ? style : "solid", color: line.borderTopColor ?? "#BBBBBB" },
      ...(length !== undefined ? { width: length } : {}),
      ...(some(padding) ? { padding: padding! } : {}),
    },
    ...(phonePadding ? { mobile: { padding: phonePadding } } : {}),
  };
  // The new Divider sits where its parent's text is aligned.
  return length !== undefined ? { type: "Column", style: { textAlign: values.textAlign ?? "center" }, children: [node] } : node;
}
