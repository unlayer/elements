/** CSS values as MJML attributes write them, read as the design's values need them. */

/** Four sides, in px: top, right, bottom, left. */
export type Box = [number, number, number, number];

/** A length in px (`12px`, `12`, `0`); `%` of `of` when given; NaN when it isn't a length. */
export function px(value: string | undefined, of?: number): number {
  const v = (value ?? "").trim();
  const match = /^(-?[\d.]+)(px|%)?$/i.exec(v);
  if (!match) return NaN;
  const n = Number(match[1]);
  if (match[2] === "%") return of === undefined ? NaN : (n / 100) * of;
  return n;
}

/** A shorthand (`10px 25px`) as four sides, as MJML's shorthandParser reads it (unparsable sides are 0). */
export function shorthand(value: string | undefined, of?: number): Box {
  const parts = (value ?? "").trim().split(/\s+/).filter(Boolean).map((part) => {
    const n = px(part, of);
    return Number.isFinite(n) ? n : 0;
  });
  switch (parts.length) {
    case 1: return [parts[0], parts[0], parts[0], parts[0]];
    case 2: return [parts[0], parts[1], parts[0], parts[1]];
    case 3: return [parts[0], parts[1], parts[2], parts[1]];
    case 4: return [parts[0], parts[1], parts[2], parts[3]];
    default: return [0, 0, 0, 0];
  }
}

const SIDES = ["top", "right", "bottom", "left"] as const;

/** A padding attribute with its per-side ones (`padding-top`) over the shorthand, as MJML reads them. */
export function padding(attrs: Record<string, string>, name = "padding", of?: number): Box {
  const box = shorthand(attrs[name], of);
  SIDES.forEach((side, i) => {
    const one = attrs[`${name}-${side}`];
    if (one !== undefined && one !== "") {
      const n = px(one, of);
      if (Number.isFinite(n)) box[i] = n;
    }
  });
  return box;
}

const round = (n: number) => Math.round(n * 100) / 100;

/** A box as the design writes it: `10px`, `10px 25px` or four sides. */
export function boxValue(box: Box): string {
  const [t, r, b, l] = box.map((n) => `${round(n)}px`);
  if (t === r && r === b && b === l) return t;
  if (t === b && r === l) return `${t} ${r}`;
  return `${t} ${r} ${b} ${l}`;
}

export function addBoxes(a: Box, b: Box): Box {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2], a[3] + b[3]];
}

/** A border shorthand (`1px solid #ccc`): width in px, style and color; undefined for none. */
export function border(value: string | undefined): { width: number; style: string; color: string } | undefined {
  const v = (value ?? "").trim();
  if (!v || /^(none|0(px)?)$/i.test(v)) return undefined;
  let width = NaN;
  let style = "solid";
  let color = "#000000";
  for (const part of v.split(/\s+(?![^(]*\))/)) {
    if (/^(none|hidden)$/i.test(part)) return undefined;
    if (/^(solid|dashed|dotted|double|groove|ridge|inset|outset)$/i.test(part)) style = part.toLowerCase();
    else if (/^(thin|medium|thick)$/i.test(part)) width = { thin: 1, medium: 3, thick: 5 }[part.toLowerCase() as "thin"];
    else if (Number.isFinite(px(part))) width = px(part);
    else color = colorValue(part);
  }
  if (!Number.isFinite(width)) width = 3; // CSS's medium
  return width > 0 ? { width, style, color } : undefined;
}

/** A design's border object (each side), from a CSS border shorthand. */
export function borderValues(value: string | undefined): Record<string, string> | undefined {
  const b = border(value);
  if (!b) return undefined;
  const out: Record<string, string> = {};
  for (const side of ["Top", "Right", "Bottom", "Left"]) {
    out[`border${side}Width`] = `${b.width}px`;
    out[`border${side}Style`] = b.style;
    out[`border${side}Color`] = b.color;
  }
  return out;
}

/** A color as MJML outputs it: `#abc` becomes `#aabbcc`; anything else as written. */
export function colorValue(value: string | undefined): string {
  const v = (value ?? "").trim();
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(v);
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`.toLowerCase();
  return v;
}

/** A font weight as a number (`bold` is 700, `normal` 400). */
export function fontWeight(value: string | undefined): number | undefined {
  const v = (value ?? "").trim().toLowerCase();
  if (!v) return undefined;
  if (v === "normal") return 400;
  if (v === "bold") return 700;
  if (v === "bolder") return 700;
  if (v === "lighter") return 300;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/** A font size in px (`14px`, `14`); undefined when it's another unit. */
export function fontSize(value: string | undefined): number | undefined {
  const n = px(value);
  return Number.isFinite(n) ? n : undefined;
}

/** A letter spacing in px: `1px`, `0.1em` of the font size; undefined for `normal` or one it can't read. */
export function letterSpacing(value: string | undefined, size: number): number | undefined {
  const v = (value ?? "").trim();
  if (!v || v === "normal") return undefined;
  const em = /^(-?[\d.]+)em$/i.exec(v);
  if (em) return round(Number(em[1]) * size);
  const n = px(v);
  return Number.isFinite(n) ? n : undefined;
}

/** The first family of a font stack, as the editor labels it. */
export function fontLabel(stack: string): string {
  return (stack.split(",")[0] ?? "").trim().replace(/^["']|["']$/g, "");
}

/** Whether a style attribute value is safe to put in a `style="…"` (no quote that would end it). */
export function cssDeclarations(declarations: Array<[string, string | undefined]>): string {
  return declarations
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([name, value]) => `${name}:${String(value).replace(/"/g, "'")}`)
    .join(";");
}
