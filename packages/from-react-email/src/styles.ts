/**
 * CSS → Elements props, for the styles React Email components carry.
 */

import { boxSides, toPx, type BoxSides } from "@unlayer/convert-core";

export type Style = Record<string, any>;

/** CSS properties that pass from a container to the text inside it. */
export interface Inherited {
  color?: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string | number;
  textAlign?: string;
  letterSpacing?: string;
  lineHeight?: string;
  /**
   * How a flex box (`display: flex; justify-content: center`) places the
   * images and buttons directly inside it. Not inherited further.
   */
  blockAlign?: string;
}

export function inherit(parent: Inherited, style: Style | undefined): Inherited {
  if (!style) return parent;
  const next: Inherited = { ...parent, blockAlign: undefined };
  for (const key of ["color", "fontFamily", "fontSize", "fontWeight", "textAlign", "letterSpacing", "lineHeight"] as const) {
    if (style[key] !== undefined && style[key] !== "") next[key] = String(style[key]);
  }
  if (/flex/.test(String(style.display ?? ""))) {
    const justify = String(style.justifyContent ?? "");
    next.blockAlign = justify === "center" ? "center" : /end|right/.test(justify) ? "right" : undefined;
  }
  return next;
}

/** "Inter, -apple-system, sans-serif" → { label: "Inter", value: "Inter, -apple-system, sans-serif" } */
export function fontFamilyProp(stack: string): { label: string; value: string } {
  // Elements writes the stack into a style="" attribute, so quote names with '.
  const value = stack.replace(/"/g, "'");
  const first = value.split(",")[0]?.trim().replace(/^'|'$/g, "") || value;
  return { label: first, value };
}

export function px(n: number): string {
  return `${Math.round(n * 100) / 100}px`;
}

export function sidesToCss(sides: BoxSides): string {
  const { top, right, bottom, left } = sides;
  return [top, right, bottom, left].map(px).join(" ");
}

export function addSides(a: BoxSides, b: BoxSides): BoxSides {
  return { top: a.top + b.top, right: a.right + b.right, bottom: a.bottom + b.bottom, left: a.left + b.left };
}

export const ZERO: BoxSides = { top: 0, right: 0, bottom: 0, left: 0 };

/** "1px solid #eaeaea" → { width: "1px", style: "solid", color: "#eaeaea" } */
export function parseBorder(value: unknown): { width?: string; style?: string; color?: string } {
  if (typeof value !== "string") return {};
  const out: { width?: string; style?: string; color?: string } = {};
  for (const part of value.trim().split(/\s+(?![^(]*\))/)) {
    if (toPx(part) !== undefined) out.width = px(toPx(part) as number);
    else if (/^(none|solid|dashed|dotted|double|groove|ridge|inset|outset|hidden)$/.test(part)) out.style = part;
    else out.color = part;
  }
  return out;
}

/** A plain color from `background` / `backgroundColor`, if there is one. */
export function backgroundColor(style: Style | undefined): string | undefined {
  if (!style) return undefined;
  const value = style.backgroundColor ?? style.background;
  if (typeof value !== "string") return undefined;
  return /^(#[0-9a-f]{3,8}|rgba?\([^)]*\)|hsla?\([^)]*\)|[a-z]+)$/i.test(value.trim()) ? color(value) : undefined;
}

/**
 * Visible CSS with no Elements equivalent, by name (`box-shadow`,
 * `background gradient`, …): what a block or box loses, for the report.
 */
export function unconverted(style: Style | undefined): string[] {
  if (!style) return [];
  const set = (value: unknown) => value !== undefined && value !== null && !/^(none|0|0px|normal|initial|unset)?$/i.test(String(value).trim());
  const out: string[] = [];
  if (set(style.boxShadow)) out.push("box-shadow");
  if (set(style.textShadow)) out.push("text-shadow");
  if (style.opacity !== undefined && Number(style.opacity) < 1) out.push("opacity");
  if (set(style.transform)) out.push("transform");
  if (set(style.filter) || set(style.backdropFilter)) out.push("filter");
  if (set(style.clipPath)) out.push("clip-path");
  if (set(style.outline) && !/^(0|none)\b/.test(String(style.outline).trim()) && !/\b0(px)?\s/.test(String(style.outline))) out.push("outline");
  if (/^(absolute|fixed|sticky)$/.test(String(style.position ?? "").trim())) out.push(`position: ${String(style.position).trim()}`);
  if (/gradient\(/.test(String(style.backgroundImage ?? "") + String(style.background ?? ""))) out.push("background gradient");
  return out;
}

/**
 * A CSS background image → an Elements Row `backgroundImage`. `fullWidth`
 * picks the full-width band (true) or the content area (false).
 */
export function backgroundImage(style: Style | undefined, fullWidth: boolean): Record<string, unknown> | undefined {
  const source = String(style?.backgroundImage ?? style?.background ?? "");
  const url = /url\((['"]?)(.*?)\1\)/.exec(source)?.[2];
  if (!url) return undefined;
  const size = String(style?.backgroundSize ?? "");
  const repeat = String(style?.backgroundRepeat ?? "repeat");
  return {
    url,
    fullWidth,
    repeat: repeat === "no-repeat" ? "no-repeat" : repeat,
    size: size === "cover" || size === "contain" ? size : "custom",
    position: String(style?.backgroundPosition ?? "top center").replace(/^top$/, "top center"),
  };
}

/**
 * Colors as hex where possible: the exporters mangle `rgb()` (React Email's
 * Tailwind inlines colors that way) into "#NaN…". Translucent colors stay
 * `rgba()`.
 */
export function color(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const text = String(value).trim();
  const match = /^rgba?\(\s*(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)(?:\s*[,/]\s*(\d*\.?\d+%?))?\s*\)$/i.exec(text);
  if (!match) return text;
  const [r, g, b] = match.slice(1, 4).map((n) => Math.max(0, Math.min(255, Math.round(Number(n)))));
  const alphaText = match[4];
  const alpha = alphaText === undefined ? 1 : alphaText.endsWith("%") ? Number.parseFloat(alphaText) / 100 : Number(alphaText);
  if (alpha < 1) return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

/** Margins with the defaults a component applies when the style leaves them out. */
export function margins(style: Style, defaults: Partial<BoxSides> = {}): BoxSides {
  const sides = boxSides(style, "margin");
  if (style.margin === undefined) {
    for (const side of ["top", "right", "bottom", "left"] as const) {
      const longhand = `margin${side[0].toUpperCase()}${side.slice(1)}`;
      if (style[longhand] === undefined && defaults[side] !== undefined) sides[side] = defaults[side] as number;
    }
  }
  return sides;
}

export { boxSides, toPx };
export type { BoxSides };
