/**
 * Elements' styles as the page model's (model.ts): lengths from CSS px (96 to the inch) to PDF points (72), a font
 * stack to a family the PDF has (one whose file is given, else the standard PDF font it's closest to), boxes and text.
 */
import { fontStack, type Border, type Radius, type ResolvedNode } from "../index";
import type { Style } from "./model";

/** CSS px in PDF points. */
export const pt = (px: number): number => Math.round(px * 0.75 * 1000) / 1000;

type Sides = { top: number; right: number; bottom: number; left: number };

/** The standard PDF fonts, by the families they stand in for. */
const STANDARD: Array<[RegExp, string]> = [
  [/^(courier|courier new|consolas|menlo|monaco|monospace|ui-monospace|sf mono)$/i, "Courier"],
  [/^(times|times new roman|georgia|garamond|cambria|serif|ui-serif|palatino)$/i, "Times-Roman"],
];

/** The family a stack is drawn in: the first one whose file is given (lowercased), else the standard font closest to the stack's first. */
export function pdfFamily(stack: string, given: ReadonlySet<string>): string {
  const families = fontStack(stack);
  const known = families.find((family) => given.has(family.toLowerCase()));
  if (known) return known.toLowerCase();
  for (const family of families) for (const [pattern, standard] of STANDARD) if (pattern.test(family)) return standard;
  return "Helvetica";
}

/** A node's text styles, its own as it resolved (inherited ones included). */
export function textStyle(node: ResolvedNode, given: ReadonlySet<string>): Style {
  const text = node.text;
  return {
    color: text.color,
    fontFamily: pdfFamily(String(text.fontFamily), given),
    fontSize: pt(text.fontSize),
    fontWeight: text.fontWeight,
    fontStyle: text.fontStyle,
    // A multiple of the font size.
    lineHeight: text.fontSize ? Math.round((text.lineHeightPx / text.fontSize) * 1000) / 1000 : undefined,
    letterSpacing: text.letterSpacing ? pt(text.letterSpacing) : undefined,
    textAlign: text.textAlign,
    textTransform: text.textTransform === "none" ? undefined : text.textTransform,
  };
}

/** A run's own styles (a Span's, a Link's), over its text's. */
export function runStyle(node: ResolvedNode, given: ReadonlySet<string>): Style {
  const style = node.style;
  const out: Style = { ...textStyle(node, given), textAlign: undefined };
  if (style.textDecoration !== undefined) out.textDecoration = String(style.textDecoration);
  if (style.backgroundColor !== undefined) out.backgroundColor = String(style.backgroundColor);
  if (style.verticalAlign === "super" || style.verticalAlign === "sub") out.verticalAlign = style.verticalAlign;
  return out;
}

const sides = (value: unknown): Sides | undefined => (value && typeof value === "object" ? (value as Sides) : undefined);

/** A box's own styles: padding, background, border, corners, height. */
export function boxStyle(node: ResolvedNode): Style {
  const style = node.style;
  const out: Style = {};
  const padding = sides(style.padding);
  if (padding) Object.assign(out, { paddingTop: pt(padding.top), paddingRight: pt(padding.right), paddingBottom: pt(padding.bottom), paddingLeft: pt(padding.left) });
  if (typeof style.backgroundColor === "string") out.backgroundColor = style.backgroundColor;
  Object.assign(out, borderStyle(style.border as Border | undefined));
  Object.assign(out, radiusStyle(style.borderRadius as Radius | undefined));
  if (typeof style.height === "number") out.height = pt(style.height);
  if (style.overflow === "hidden") out.overflow = "hidden";
  return out;
}

export function borderStyle(border: Border | undefined): Style {
  const out: Style = {};
  if (!border) return out;
  for (const side of ["top", "right", "bottom", "left"] as const) {
    const line = border[side];
    if (!line) continue;
    const name = side[0].toUpperCase() + side.slice(1);
    out[`border${name}Width`] = line.style === "none" ? 0 : pt(line.width);
    out[`border${name}Style`] = line.style === "none" ? "solid" : line.style;
    out[`border${name}Color`] = line.color;
  }
  return out;
}

export function radiusStyle(radius: Radius | undefined): Style {
  if (radius === undefined) return {};
  if (typeof radius === "number") return { borderRadius: pt(radius) };
  return {
    borderTopLeftRadius: pt(radius.topLeft),
    borderTopRightRadius: pt(radius.topRight),
    borderBottomRightRadius: pt(radius.bottomRight),
    borderBottomLeftRadius: pt(radius.bottomLeft),
  };
}

const FLEX: Record<string, string> = { start: "flex-start", center: "center", end: "flex-end", stretch: "stretch", "space-between": "space-between" };
/** An alignment as flexbox says it. */
export const flex = (value: unknown): Style[string] => (typeof value === "string" ? FLEX[value] : undefined);

/**
 * Where a child sits across a stack, as in the other outputs: one that fills the width fills it; one of its own size
 * (an Image, a Button, a box with a width) where the stack's alignItems says, else its text alignment.
 */
export function alignSelf(child: ResolvedNode, stack: ResolvedNode): Style[string] {
  const sized = child.style.width !== undefined || child.style.maxWidth !== undefined;
  if (child.type === "Divider" || (child.definition.sizing !== "shrink" && !sized)) return undefined;
  const align = stack.style.alignItems as string | undefined;
  if (align === "stretch") return undefined;
  if (align) return flex(align);
  return { left: "flex-start", justify: "flex-start", center: "center", right: "flex-end" }[stack.text.textAlign];
}
