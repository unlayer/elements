/** Beefree's CSS values (kebab-case style objects, CSS strings) as the values an Unlayer design takes. */
import type { BeefreeStyle, BeefreeWebFont, Values } from "./types";

/** A length in px (`"10px"`, `"10"`, `0`), or undefined for anything else (`auto`, `%`, `inherit`). */
export function px(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value !== "string") return undefined;
  const match = /^(-?\d*\.?\d+)(px)?$/.exec(value.trim());
  return match ? parseFloat(match[1]) : undefined;
}

/** A percentage (`"36%"` or `36`), as its number. */
export function percent(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value !== "string") return undefined;
  const match = /^(\d*\.?\d+)%$/.exec(value.trim());
  return match ? parseFloat(match[1]) : undefined;
}

/** A number in px as the design writes it (`10px`, `12.5px`). */
export const pxString = (n: number) => `${Math.round(n * 100) / 100}px`;

/** A color, or "" for none (`transparent`, `none`, CSS-wide keywords, empty). */
export function color(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return /^(transparent|none|inherit|initial|unset|revert|currentcolor)?$/i.test(trimmed) || /^rgba\([^)]*,\s*0(\.0+)?\s*\)$/i.test(trimmed) ? "" : trimmed;
}

/** The four sides of a box from a style's `<prefix>-top` … `<prefix>-left` (or the `<prefix>` shorthand), in px. */
export function sides(style: BeefreeStyle | undefined, prefix = "padding"): [number, number, number, number] {
  const out: [number, number, number, number] = [0, 0, 0, 0];
  const short = style?.[prefix];
  if (typeof short === "string" && short.trim()) {
    const parts = short.trim().split(/\s+/).map((part) => px(part) ?? 0);
    const [t, r = t, b = t, l = r] = parts;
    out.splice(0, 4, t, r, b, l);
  }
  (["top", "right", "bottom", "left"] as const).forEach((side, i) => {
    const value = px(style?.[`${prefix}-${side}`]);
    if (value !== undefined) out[i] = value;
  });
  return out;
}

/** Four sides as a CSS shorthand the editor writes (`10px`, or `10px 20px 10px 20px`). */
export function boxString([t, r, b, l]: readonly number[]): string {
  if (t === r && r === b && b === l) return pxString(t);
  return [t, r, b, l].map(pxString).join(" ");
}

/** Whether a style sets any of a box's sides. */
export const hasSides = (style: BeefreeStyle | undefined, prefix = "padding") =>
  !!style && (typeof style[prefix] === "string" || ["top", "right", "bottom", "left"].some((side) => style[`${prefix}-${side}`] !== undefined));

export interface Border {
  width: number;
  style: string;
  color: string;
}

/** A border shorthand (`"1px solid #393E56"`), or undefined when it doesn't show (no width, no color, `none`). */
export function border(value: unknown): Border | undefined {
  if (typeof value !== "string") return undefined;
  const parts = value.trim().split(/\s+(?![^(]*\))/);
  let width: number | undefined;
  let style = "solid";
  let paint = "";
  for (const part of parts) {
    if (px(part) !== undefined && width === undefined) width = px(part);
    else if (/^(none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset)$/i.test(part)) style = part.toLowerCase();
    else paint = part;
  }
  if (!width || style === "none" || style === "hidden" || !color(paint)) return undefined;
  return { width, style, color: color(paint) };
}

/** A style's per-side borders as the editor's `border` value (`borderTopWidth`, …), `{}` when none shows. */
export function borderValues(style: BeefreeStyle | undefined): Values {
  const out: Values = {};
  for (const side of ["Top", "Right", "Bottom", "Left"]) {
    const found = border(style?.[`border-${side.toLowerCase()}`] ?? style?.border);
    if (!found) continue;
    out[`border${side}Width`] = pxString(found.width);
    out[`border${side}Style`] = found.style;
    out[`border${side}Color`] = found.color;
  }
  return out;
}

/** A CSS-wide keyword or nothing: the value comes from the parent (`font-family: inherit`). */
export const inherits = (value: unknown) => typeof value !== "string" || /^\s*(inherit|initial|unset|)\s*$/i.test(value);

/** A font stack's first family, without quotes. */
export const firstFamily = (stack: string) => stack.split(",")[0].replace(/['"]/g, "").trim();

/**
 * A font stack as the editor's `fontFamily` (`{ label, value }`), with its web font's URL where the template loads
 * one for that family (the editor loads it from there). Undefined where it inherits.
 */
export function fontFamily(stack: unknown, webFonts: readonly BeefreeWebFont[]): Values | undefined {
  if (inherits(stack)) return undefined;
  const value = String(stack).trim().replace(/\s*,\s*/g, ", ").replace(/"/g, "'");
  const label = firstFamily(value);
  if (!label) return undefined;
  const web = webFonts.find((font) => font.url && (font.name ?? firstFamily(font.fontFamily ?? "")).toLowerCase() === label.toLowerCase());
  return { label, value, ...(web?.url ? { url: web.url } : {}) };
}

/** A line height as the editor writes it (`120%`): a percent as it is, a unitless number as its percent. */
export function lineHeight(value: unknown): string | undefined {
  if (typeof value === "number") return `${Math.round(value * 100)}%`;
  if (typeof value !== "string" || !value.trim()) return undefined;
  const trimmed = value.trim();
  if (/^\d*\.?\d+%$/.test(trimmed)) return trimmed;
  if (/^\d*\.?\d+$/.test(trimmed)) return `${Math.round(parseFloat(trimmed) * 100)}%`;
  return undefined;
}

/** A font weight as a number (`"700"` → 700, `bold` → 700), or undefined. */
export function fontWeight(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return undefined;
  if (/^\d{3}$/.test(value.trim())) return parseInt(value, 10);
  if (/^bold$/i.test(value.trim())) return 700;
  if (/^normal$/i.test(value.trim())) return 400;
  return undefined;
}

/** A letter spacing that isn't zero (`2px`), or undefined. */
export function letterSpacing(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim() || /^(normal|0(px|em)?)$/i.test(value.trim())) return undefined;
  return value.trim();
}

/** `left`, `center` or `right` (also from `start`/`end` or a class list like `center fixedwidth`), or undefined. */
export function align(value: unknown): "left" | "center" | "right" | "justify" | undefined {
  if (typeof value !== "string") return undefined;
  for (const word of value.trim().toLowerCase().split(/\s+/)) {
    if (word === "left" || word === "center" || word === "right" || word === "justify") return word;
    if (word === "start") return "left";
    if (word === "end") return "right";
  }
  return undefined;
}

/** The URL in a CSS `background-image` (`url('…')`), or undefined. */
export function backgroundUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const match = /url\(\s*(['"]?)(.*?)\1\s*\)/i.exec(value);
  return match && match[2] ? match[2] : undefined;
}

const POSITIONS = new Set(["top-left", "top-center", "top-right", "center-left", "center", "center-right", "bottom-left", "bottom-center", "bottom-right"]);

/** A CSS `background-position` (`top left`, `center top`, `50% 0%`) as the editor's position (`top-left`, `center`). */
export function backgroundPosition(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "center";
  const words = value.trim().toLowerCase().split(/\s+/).map((word) => ({ "0%": "left", "50%": "center", "100%": "right" })[word] ?? word);
  let vertical = "center";
  let horizontal = "center";
  words.forEach((word, i) => {
    if (word === "top" || word === "bottom") vertical = word;
    else if (word === "left" || word === "right") horizontal = word;
    // A second `0%`/`100%` is the vertical one.
    else if (i === 1 && /^(0|100)%$/.test(value.trim().split(/\s+/)[1])) vertical = value.trim().split(/\s+/)[1] === "0%" ? "top" : "bottom";
  });
  const position = vertical === "center" && horizontal === "center" ? "center" : `${vertical}-${horizontal}`;
  return POSITIONS.has(position) ? position : "center";
}

/** A style's background image as the editor's `backgroundImage`, or undefined when it has none. */
export function backgroundImage(style: BeefreeStyle | undefined, fullWidth: boolean): Values | undefined {
  const url = backgroundUrl(style?.["background-image"]);
  if (!url) return undefined;
  const repeat = String(style?.["background-repeat"] ?? "no-repeat").trim();
  const size = String(style?.["background-size"] ?? "").trim();
  return {
    url,
    fullWidth,
    repeat: ["repeat", "repeat-x", "repeat-y", "no-repeat"].includes(repeat) ? repeat : "no-repeat",
    size: size === "cover" || size === "contain" ? size : "custom",
    position: backgroundPosition(style?.["background-position"]),
  };
}
