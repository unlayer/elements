/**
 * The style properties components pick from. There are no margins: space
 * between siblings is the parent's `gap`, space inside a box its `padding`,
 * which every target can do (margins aren't reliable in email).
 */
import type { StyleSpec } from "./define";
import { border, color, enumOf, flex, fontFamily, fontWeight, insets, length, lineHeight, radius } from "./kinds";

/** Inherited from the root down through layouts, as in CSS. */
export const textStyle = {
  color: { kind: color(), label: "Text color", inherited: true },
  fontFamily: { kind: fontFamily(), label: "Font", inherited: true },
  fontSize: { kind: length(["px"], { min: 1 }), label: "Font size", inherited: true, mobile: true },
  fontWeight: { kind: fontWeight(), label: "Font weight", inherited: true },
  fontStyle: { kind: enumOf(["normal", "italic"]), label: "Font style", inherited: true },
  lineHeight: { kind: lineHeight(), label: "Line height", inherited: true, mobile: true },
  letterSpacing: { kind: length(["px"], { min: -100 }), label: "Letter spacing", inherited: true, mobile: true },
  textAlign: { kind: enumOf(["left", "center", "right", "justify"]), label: "Alignment", inherited: true, mobile: true },
  textTransform: { kind: enumOf(["none", "uppercase", "lowercase", "capitalize"]), label: "Letter case", inherited: true },
  textDecoration: { kind: enumOf(["none", "underline", "line-through"]), label: "Decoration" },
} satisfies Record<string, StyleSpec>;

export const boxStyle = {
  width: { kind: length(["px", "%"]), label: "Width", mobile: true },
  minWidth: { kind: length(["px", "%"]), label: "Minimum width" },
  maxWidth: { kind: length(["px", "%"]), label: "Maximum width", mobile: true },
  height: { kind: length(["px"]), label: "Height" },
  padding: { kind: insets(), label: "Padding", mobile: true },
  backgroundColor: { kind: color(), label: "Background color" },
  border: { kind: border(), label: "Border", mobile: true },
  borderRadius: { kind: radius(), label: "Corner radius" },
  overflow: { kind: enumOf(["visible", "hidden"]), label: "Overflow", description: "Whether content past a set height is cut off." },
} satisfies Record<string, StyleSpec>;

export const layoutStyle = {
  gap: { kind: length(["px"]), label: "Gap", description: "Space between children.", mobile: true },
  align: {
    kind: enumOf(["start", "center", "end", "stretch"]),
    label: "Align",
    description: "Where children sit across the layout's direction (vertically in a Row, horizontally in a Column).",
  },
  justify: { kind: enumOf(["start", "center", "end", "between"]), label: "Justify", description: "Where children sit along the layout's direction." },
} satisfies Record<string, StyleSpec>;

/** On any child, read by the Row it's in. */
export const placementStyle = {
  flex: {
    kind: flex(),
    label: "Share",
    description: 'In a Row: its share of the width left after children with a width (default 1); "none" takes its own size.',
  },
} satisfies Record<string, StyleSpec>;

/** The keys of `group` named, as a group of their own. */
export function pick<G extends Record<string, StyleSpec>, const K extends keyof G>(group: G, ...keys: K[]): Pick<G, K> {
  return Object.fromEntries(keys.map((key) => [key, group[key]])) as Pick<G, K>;
}
