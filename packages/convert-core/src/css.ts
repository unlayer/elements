/**
 * CSS helpers every converter needs: reading lengths and box shorthands.
 */

/** "16px" → 16, "1.5em" → 24, 12 → 12; undefined for %, auto, calc(), … */
export function toPx(value: unknown, emBase = 16): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return undefined;
  const match = /^(-?\d*\.?\d+)(px|em|rem|pt)?$/.exec(value.trim());
  if (!match) return undefined;
  const n = Number.parseFloat(match[1]);
  switch (match[2]) {
    case "em":
    case "rem":
      return n * emBase;
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

/**
 * Resolve a margin/padding: the shorthand (`style.padding`) and the longhands
 * (`style.paddingTop`, …) that override it, in px. Unreadable sides are 0.
 */
export function boxSides(style: Record<string, unknown>, property: "margin" | "padding"): BoxSides {
  const sides: BoxSides = { top: 0, right: 0, bottom: 0, left: 0 };
  const shorthand = style[property];
  if (shorthand !== undefined) {
    const parts = String(shorthand).trim().split(/\s+/).map((part) => toPx(part) ?? 0);
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
