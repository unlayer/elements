/**
 * CSS → Elements props, for the styles React Email components carry.
 */

import { boxSides, ownFontSize, toPx, type BoxSides } from "@unlayer/convert-core";

export type Style = Record<string, any>;

/** Desktop hiding (`display: none`, Tailwind's `hidden`, `visibility: hidden`) must survive conversion as original HTML. */
export function isHidden(style: Style): boolean {
  return /^none\s*(?:!important)?$/i.test(String(style.display ?? "").trim()) || /^hidden\s*(?:!important)?$/i.test(String(style.visibility ?? "").trim());
}

/** Hidden on desktop and shown by a phone rule (`hidden mobile:block`, a `<style>` media query). */
export function shownOnPhones(style: Style): boolean {
  const shown = style._phone?.display;
  return /^none/i.test(String(style.display ?? "").trim()) && typeof shown === "string" && !/^none/i.test(shown.trim());
}

/** The style of an element shown only on phones: no desktop `display: none`, marked to hide on desktop. */
export function phoneOnly(style: Style): Style {
  const { display: _display, ...rest } = style;
  return { ...rest, _hideDesktop: true };
}

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
  mobile?: { fontSize?: string; lineHeight?: string; textAlign?: string };
  /** A right-to-left document: text, buttons and images with no alignment start on the right. */
  rtl?: boolean;
}

export function inherit(parent: Inherited, style: Style | undefined): Inherited {
  if (!style) return parent;
  const next: Inherited = { ...parent, blockAlign: undefined, mobile: { ...parent.mobile } };
  for (const key of ["fontSize", "lineHeight", "textAlign"] as const) {
    if (style[key] !== undefined) delete next.mobile![key];
    if (style._phone?.[key] !== undefined) next.mobile![key] = String(style._phone[key]);
  }
  for (const key of ["color", "fontFamily", "fontSize", "fontWeight", "textAlign", "letterSpacing", "lineHeight"] as const) {
    if (style[key] !== undefined && style[key] !== "" && !/^\s*(inherit|currentcolor)\s*$/i.test(String(style[key]))) next[key] = String(style[key]);
  }
  // A line height in % or em passes on as px, worked out with the font size where it's set (as CSS does);
  // a number passes on as a number, and scales with each element's own size.
  const lineHeight = /^(\d*\.?\d+)(%|em|rem)$/.exec(String(style.lineHeight ?? "").trim());
  const base = lineHeight && (lineHeight[2] === "rem" ? 16 : toPx(next.fontSize, toPx(parent.fontSize) ?? 16));
  if (lineHeight && base) next.lineHeight = px((Number(lineHeight[1]) / (lineHeight[2] === "%" ? 100 : 1)) * base);
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
 * The page color for a gradient background (`linear-gradient(#111111, #222222)`):
 * its first stop, if every stop is an opaque color. One that fades to
 * transparent shows the white behind it, so it gives none. `solid`: one color.
 */
export function gradientColor(style: Style | undefined): { color: string; solid: boolean } | undefined {
  const args = /^\s*(?:repeating-)?(?:linear|radial|conic)-gradient\((.*)\)\s*$/i.exec(String(style?.backgroundImage ?? style?.background ?? ""))?.[1];
  if (!args) return undefined;
  const parts = args.split(/,(?![^(]*\))/).map((part) => part.trim());
  if (/^(to\s|from\s|at\s|[-\d.]+(deg|grad|rad|turn)\b|circle|ellipse|closest|farthest)/i.test(parts[0] ?? "")) parts.shift();
  const colors = parts.map((part) => color(/^((?:rgb|hsl)a?\([^)]*\)|#[0-9a-f]{3,8}|[a-z]+)(?=\s|$)/i.exec(part)?.[1]));
  const opaque = (c: string | undefined) => !!c && /^(#[0-9a-f]{3}|#[0-9a-f]{6}|hsl\((?:[^,)/]*,){0,2}[^,)/]*\)|[a-z]+)$/i.test(c) && !/^(transparent|currentcolor)$/i.test(c);
  if (!colors.length || !colors.every(opaque)) return undefined;
  return { color: colors[0]!, solid: new Set(colors.map((c) => c!.toLowerCase())).size === 1 };
}

/** The page color: the Body's background color, else a gradient's, else white. A gradient it can't show is noted. */
export function pageColor(style: Style, report: { note(reason: string, detail?: string): void }): string {
  const plain = backgroundColor(style);
  if (!/gradient\(/.test(String(style.backgroundImage ?? style.background ?? ""))) return plain ?? "#ffffff";
  const gradient = gradientColor(style);
  const page = plain ?? gradient?.color ?? "#ffffff";
  if (!gradient?.solid || gradient.color !== page) report.note("style not converted", `background gradient (Body, filled with ${page})`);
  return page;
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
  // Padding and margins Elements can't hold in px: a % (of the width around
  // it), calc(), viewport units count as 0; em without a px font size of its own as 16px.
  for (const property of ["padding", "margin"] as const) {
    for (const key of [property, `${property}Top`, `${property}Right`, `${property}Bottom`, `${property}Left`]) {
      const value = style[key];
      if (value === undefined || value === null) continue;
      const text = String(value).trim();
      const name = key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
      if (/%|\b(?:calc|min|max|clamp|var)\(|\dv(?:w|h|min|max)\b/.test(text)) out.push(`${name}: ${text}`);
      else if (/\d(?:\.\d+)?em\b/.test(text) && ownFontSize(style) === undefined) out.push(`${name}: ${text} (at 16px per em)`);
    }
  }
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
    ...backgroundPosition(String(style?.backgroundPosition ?? "")),
  };
}

/**
 * CSS background-position → the editor's `position` ("top-center", "center", …), or
 * `custom` with `customPosition` for lengths. CSS's default is the top left.
 */
function backgroundPosition(css: string): { position: string; customPosition?: [string, string] } {
  const parts = css.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!parts.length) return { position: "top-left" };
  const keywords = ["top", "bottom", "left", "right", "center"];
  if (parts.length > 2 || !parts.every((p) => keywords.includes(p))) {
    const [x = "auto", y = "auto"] = parts;
    return { position: "custom", customPosition: [x, y] };
  }
  let vertical = parts.find((p) => p === "top" || p === "bottom") ?? "center";
  let horizontal = parts.find((p) => p === "left" || p === "right") ?? "center";
  // One keyword: the other axis is centered (`top` is "top center").
  if (parts.length === 1 && parts[0] === "center") vertical = horizontal = "center";
  if (vertical === "center" && horizontal === "center") return { position: "center" };
  return { position: vertical === "center" ? `center-${horizontal}` : `${vertical}-${horizontal}` };
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

/** A color as written: `inherit` (or `currentColor`) is the inherited one. */
export function ownColor(value: unknown, inherited: unknown): unknown {
  return typeof value === "string" && /^(inherit|currentcolor)$/i.test(value.trim()) ? inherited : value;
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
