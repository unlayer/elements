/**
 * The style properties components pick from. There are no margins: space
 * between siblings is the parent's `gap`, space inside a box its `padding`,
 * which every target can do (margins aren't reliable in email).
 */
import type { EmailSupport, StyleSpec } from "./define";

/** Shown as asked in email, by how the writer writes it. */
const writer: EmailSupport = { level: "full", source: "writer" };
import { border, color, enumOf, flex, fontFamily, fontWeight, insets, length, lineHeight, radius } from "./kinds";

/** Inherited from the root down through layouts, as in CSS. */
export const textStyle = {
  color: { kind: color(), label: "Text color", inherited: true, email: writer },
  fontFamily: {
    kind: fontFamily(),
    label: "Font",
    inherited: true,
    email: {
      level: "outlook",
      shows: "its fallback: classic Outlook doesn't load web fonts",
      when: (value) => typeof value === "object" && value !== null && !Array.isArray(value) && "src" in value,
      source: "outlook-captures",
    },
  },
  // Word rounds sizes to half points (13px is 10pt): a fraction of a px.
  fontSize: { kind: length(["px"], { min: 1 }), label: "Font size", inherited: true, mobile: true, email: { level: "full", source: "outlook-captures" } },
  fontWeight: { kind: fontWeight(), label: "Font weight", inherited: true, email: { level: "full", source: "caniemail" } },
  fontStyle: { kind: enumOf(["normal", "italic"]), label: "Font style", inherited: true, email: { level: "full", source: "caniemail" } },
  // Written in px with mso-line-height-rule: exactly, which Word keeps (it drops unitless ones).
  lineHeight: { kind: lineHeight(), label: "Line height", inherited: true, mobile: true, email: { level: "full", source: "outlook-captures" } },
  letterSpacing: {
    kind: length(["px"], { min: -100 }),
    label: "Letter spacing",
    inherited: true,
    mobile: true,
    email: { level: "outlook", shows: "normal spacing: Word keeps letter spacing but doesn't draw it", source: "outlook-captures" },
  },
  textAlign: { kind: enumOf(["left", "center", "right", "justify"]), label: "Alignment", inherited: true, mobile: true, email: { level: "full", source: "caniemail" } },
  textTransform: { kind: enumOf(["none", "uppercase", "lowercase", "capitalize"]), label: "Letter case", inherited: true, email: { level: "full", source: "assumed" } },
  textDecoration: { kind: enumOf(["none", "underline", "line-through"]), label: "Decoration", email: { level: "full", source: "caniemail" } },
} satisfies Record<string, StyleSpec>;

/** Text styles for a container, passed down to its text: all but decoration, which is a text element's own (CSS doesn't pass it down). */
export const inheritedTextStyle = (({ textDecoration: _, ...rest }) => rest)(textStyle);

export const boxStyle = {
  // Widths are the resolver's, written as table, cell and image attributes in px (what Word sizes by).
  width: { kind: length(["px", "%"]), label: "Width", mobile: true, email: writer },
  minWidth: { kind: length(["px", "%"]), label: "Minimum width", email: writer },
  maxWidth: { kind: length(["px", "%"]), label: "Maximum width", mobile: true, email: writer },
  height: { kind: length(["px"]), label: "Height", email: writer },
  // Cell padding, which Word keeps (it drops a div's).
  padding: { kind: insets(), label: "Padding", mobile: true, email: { level: "full", source: "outlook-captures" } },
  backgroundColor: { kind: color(), label: "Background color", email: writer },
  border: { kind: border(), label: "Border", mobile: true, email: { level: "full", source: "caniemail" } },
  borderRadius: { kind: radius(), label: "Corner radius", email: { level: "outlook", shows: "square corners", source: "caniemail" } },
  overflow: {
    kind: enumOf(["visible", "hidden"]),
    label: "Overflow",
    description: "Whether content past a set height is cut off.",
    email: { level: "outlook", shows: "content past the height: Word doesn't cut it off", values: ["hidden"], source: "caniemail" },
  },
} satisfies Record<string, StyleSpec>;

export const layoutStyle = {
  gap: { kind: length(["px"]), label: "Gap", description: "Space between children.", mobile: true, email: writer },
  alignItems: {
    kind: enumOf(["start", "center", "end", "stretch"]),
    label: "Align items",
    description: "Where children sit across the layout's direction (vertically in a Row, horizontally in a Column), as CSS align-items.",
    // A cell's align, and a Row's cells' valign.
    email: writer as EmailSupport | readonly EmailSupport[],
  },
  justifyContent: {
    kind: enumOf(["start", "center", "end", "space-between"]),
    label: "Justify content",
    description: "Where children sit along the layout's direction, as CSS justify-content.",
    email: writer as EmailSupport | readonly EmailSupport[],
  },
} satisfies Record<string, StyleSpec>;

/** On any child, read by the Row it's in. */
export const placementStyle = {
  flex: {
    kind: flex(),
    label: "Share",
    description: 'In a Row: its share of the width left after children with a width (default 1); "none" takes its own size.',
    email: writer,
  },
} satisfies Record<string, StyleSpec>;

/** The keys of `group` named, as a group of their own. */
export function pick<G extends Record<string, StyleSpec>, const K extends keyof G>(group: G, ...keys: K[]): Pick<G, K> {
  return Object.fromEntries(keys.map((key) => [key, group[key]])) as Pick<G, K>;
}
