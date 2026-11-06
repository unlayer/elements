/**
 * CSS helpers every converter needs: reading lengths and box shorthands.
 */

/** "16px" → 16, "1.5em" → 24, 12 → 12; undefined for %, auto, calc(), … */
export function toPx(value: unknown, emBase = 16): number | undefined {
  return lengthPx(value, emBase, emBase);
}

function lengthPx(value: unknown, emBase: number, remBase: number): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return undefined;
  // `!important` (Tailwind's `!p-6`) doesn't change the length.
  const match = /^(-?\d*\.?\d+)(px|em|rem|pt)?$/.exec(value.trim().replace(/\s*!\s*important$/i, ""));
  if (!match) return undefined;
  const n = Number.parseFloat(match[1]);
  switch (match[2]) {
    case "em":
      return n * emBase;
    case "rem":
      return n * remBase;
    case "pt":
      return (n * 4) / 3;
    default:
      return n;
  }
}

export interface BoxSides {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** The font size an element sets itself, in px (what its `em` lengths are relative to). */
export function ownFontSize(style: Record<string, unknown>): number | undefined {
  const size = style.fontSize;
  if (typeof size === "number" && Number.isFinite(size)) return size;
  const text = typeof size === "string" ? size.trim().replace(/\s*!\s*important$/i, "") : undefined;
  return text !== undefined && /^\d*\.?\d+(px)?$/.test(text) ? Number.parseFloat(text) : undefined;
}

/**
 * Resolve a margin/padding: the shorthand (`style.padding`) and the longhands
 * (`style.paddingTop`, …) that override it, in px. `em` is relative to the
 * element's own font size (16px when it doesn't set one in px). Unreadable
 * sides (%, calc(), auto) are 0.
 */
export function boxSides(style: Record<string, unknown>, property: "margin" | "padding"): BoxSides {
  const sides: BoxSides = { top: 0, right: 0, bottom: 0, left: 0 };
  const em = ownFontSize(style) ?? 16;
  const toPx = (value: unknown) => lengthPx(value, em, 16);
  const shorthand = style[property];
  if (shorthand !== undefined) {
    const parts = String(shorthand).trim().replace(/\s*!\s*important$/i, "").split(/\s+/).map((part) => toPx(part) ?? 0);
    const [t, r = t, b = t, l = r] = typeof shorthand === "number" ? [shorthand] : parts;
    Object.assign(sides, { top: t, right: r, bottom: b, left: l });
  }
  for (const side of ["Top", "Right", "Bottom", "Left"] as const) {
    const value = style[`${property}${side}`];
    if (value !== undefined) sides[side.toLowerCase() as keyof BoxSides] = toPx(value) ?? 0;
  }
  return sides;
}

/** "color: red; font-size: 14px" → { color: "red", fontSize: "14px" } */
export function parseStyle(css: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const declaration of css.split(";")) {
    const index = declaration.indexOf(":");
    if (index === -1) continue;
    const property = declaration.slice(0, index).trim();
    const value = declaration.slice(index + 1).trim();
    if (!property || !value) continue;
    out[property.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = value;
  }
  return out;
}
