/**
 * The style properties components pick from. There are no margins: space
 * between siblings is the parent's `gap`, space inside a box its `padding`,
 * which every target can do (margins aren't reliable in email).
 */
import type { Support, StyleSpec } from "./define";

/** Shown as asked, by how the writer writes it. */
const writer: Support = { level: "full", source: "writer" };
/** Written as CSS, which browsers show as asked. */
export const css: Support = { level: "full", source: "css" };
import { border, color, enumOf, flex, fontFamily, fontWeight, insets, length, lineHeight, radius } from "./kinds";

/** Inherited from the root down through layouts, as in CSS. */
export const textStyle = {
  color: { kind: color(), label: "Text color", inherited: true, support: { email: writer, web: css }},
  // A web font in a stack is reported from the root's fonts (whether it loads depends on the client).
  fontFamily: { kind: fontFamily(), label: "Font", inherited: true, support: { email: { level: "full", source: "outlook-captures" }, web: css } },
  // Word rounds sizes to half points (13px is 10pt): a fraction of a px.
  fontSize: { kind: length(["px"], { min: 1 }), label: "Font size", inherited: true, mobile: true, support: { email: { level: "full", source: "outlook-captures" }, web: css } },
  fontWeight: { kind: fontWeight(), label: "Font weight", inherited: true, support: { email: { level: "full", source: "caniemail" }, web: css } },
  fontStyle: { kind: enumOf(["normal", "italic"]), label: "Font style", inherited: true, support: { email: { level: "full", source: "caniemail" }, web: css } },
  // Written in px with mso-line-height-rule: exactly, which Word keeps (it drops unitless ones).
  lineHeight: { kind: lineHeight(), label: "Line height", inherited: true, mobile: true, support: { email: { level: "full", source: "outlook-captures" }, web: css } },
  letterSpacing: {
    kind: length(["px"], { min: -100 }),
    label: "Letter spacing",
    inherited: true,
    mobile: true,
    support: { email: { level: "outlook", shows: "normal spacing: Word keeps letter spacing but doesn't draw it", source: "outlook-captures" }, web: css },
  },
  textAlign: { kind: enumOf(["left", "center", "right", "justify"]), label: "Alignment", inherited: true, mobile: true, support: { email: { level: "full", source: "caniemail" }, web: css } },
  textTransform: { kind: enumOf(["none", "uppercase", "lowercase", "capitalize"]), label: "Letter case", inherited: true, support: { email: { level: "full", source: "assumed" }, web: css } },
  textDecoration: { kind: enumOf(["none", "underline", "line-through"]), label: "Decoration", support: { email: { level: "full", source: "caniemail" }, web: css } },
} satisfies Record<string, StyleSpec>;

/** Text styles for a container, passed down to its text: all but decoration, which is a text element's own (CSS doesn't pass it down). */
export const inheritedTextStyle = (({ textDecoration: _, ...rest }) => rest)(textStyle);

export const boxStyle = {
  // Widths are the resolver's, written as table, cell and image attributes in px (what Word sizes by).
  width: { kind: length(["px", "%"]), label: "Width", mobile: true, support: { email: writer, web: css }},
  minWidth: { kind: length(["px", "%"]), label: "Minimum width", support: { email: writer, web: css }},
  maxWidth: { kind: length(["px", "%"]), label: "Maximum width", mobile: true, support: { email: writer, web: css }},
  height: { kind: length(["px"]), label: "Height", support: { email: writer, web: css }},
  // Cell padding, which Word keeps (it drops a div's).
  padding: { kind: insets(), label: "Padding", mobile: true, support: { email: { level: "full", source: "outlook-captures" }, web: css } },
  backgroundColor: { kind: color(), label: "Background color", support: { email: writer, web: css }},
  border: { kind: border(), label: "Border", mobile: true, support: { email: { level: "full", source: "caniemail" }, web: css } },
  borderRadius: { kind: radius(), label: "Corner radius", support: { email: { level: "outlook", shows: "square corners", source: "caniemail" }, web: css } },
  overflow: {
    kind: enumOf(["visible", "hidden"]),
    label: "Overflow",
    description: "Whether content past a set height is cut off.",
    support: { email: { level: "outlook", shows: "content past the height: Word doesn't cut it off", values: ["hidden"], source: "caniemail" }, web: css },
  },
} satisfies Record<string, StyleSpec>;

export const layoutStyle = {
  gap: { kind: length(["px"]), label: "Gap", description: "Space between children.", mobile: true, support: { email: writer, web: css }},
  alignItems: {
    kind: enumOf(["start", "center", "end", "stretch"]),
    label: "Align items",
    description: "Where children sit across the layout's direction (vertically in a Row, horizontally in a Column), as CSS align-items.",
    // A cell's align, and a Row's cells' valign.
    support: { email: writer, web: css },
  },
  justifyContent: {
    kind: enumOf(["start", "center", "end", "space-between"]),
    label: "Justify content",
    description: "Where children sit along the layout's direction, as CSS justify-content.",
    support: { email: writer, web: css },
  },
} satisfies Record<string, StyleSpec>;

/** On any child, read by the Row it's in. */
export const placementStyle = {
  flex: {
    kind: flex(),
    label: "Share",
    description: 'In a Row: its share of the width left after children with a width (default 1); "none" takes its own size.',
    support: { email: writer, web: css },
  },
} satisfies Record<string, StyleSpec>;

/** The keys of `group` named, as a group of their own. */
export function pick<G extends Record<string, StyleSpec>, const K extends keyof G>(group: G, ...keys: K[]): Pick<G, K> {
  return Object.fromEntries(keys.map((key) => [key, group[key]])) as Pick<G, K>;
}
