/**
 * CSS → Elements props, for the styles React Email components carry.
 */

import { boxSides, ownFontSize, toPx, type BoxSides, type Expr } from "@unlayer/convert-core";

export type Style = Record<string, any>;

/**
 * Desktop hiding must survive conversion as original HTML: `display: none` (Tailwind's
 * `hidden`), `visibility: hidden`, opacity 0, and a box that clips to nothing
 * (`max-height: 0; overflow: hidden`, a common way to hide content outside phones),
 * and text only screen readers get (`sr-only`, or placed far off the page).
 */
export function isHidden(style: Style): boolean {
  const value = (key: string) => String(style[key] ?? "").trim().replace(/\s*!\s*important$/i, "");
  if (/^none$/i.test(value("display")) || /^hidden$/i.test(value("visibility"))) return true;
  if (value("opacity") !== "" && Number.parseFloat(value("opacity")) === 0) return true;
  const clips = /^(hidden|clip)$/i.test(value("overflow")) || /^(hidden|clip)$/i.test(value("overflowY"));
  if (clips && (toPx(value("maxHeight")) === 0 || toPx(value("height")) === 0)) return true;
  // Shown only to screen readers: positioned and clipped to nothing (`sr-only`), or moved far off the page.
  if (!/^(absolute|fixed)$/i.test(value("position"))) return false;
  if (/^rect\(\s*0(px)?[\s,]+0(px)?[\s,]+0(px)?[\s,]+0(px)?\s*\)$/i.test(value("clip")) || /^inset\(\s*(50|100)%\s*\)$/i.test(value("clipPath"))) return true;
  if (clips && (toPx(value("width")) ?? 2) <= 1 && (toPx(value("height")) ?? 2) <= 1) return true;
  return [value("left"), value("top")].some((v) => (toPx(v) ?? 0) <= -999);
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
  /** Italics, letter case and underline from a container: kept on a span around the text (Elements has no prop for them). */
  fontStyle?: string;
  textTransform?: string;
  textDecoration?: string;
  /**
   * How a flex box (`display: flex; justify-content: center`) places the
   * images and buttons directly inside it. Not inherited further.
   */
  blockAlign?: string;
  mobile?: { fontSize?: string; lineHeight?: string; textAlign?: string };
  /**
   * A right-to-left document: text, buttons and images with no alignment start on the right.
   * The template's `dir` expression when it comes from props (`dir={direction}`).
   */
  rtl?: true | Expr;
}

/** A font size in px: em and % relative to `parent`'s size, rem to 16px; undefined when it isn't a length. */
export function fontSizePx(value: unknown, parent: unknown): number | undefined {
  const text = String(value ?? "").trim().replace(/\s*!\s*important$/i, "");
  const base = toPx(parent) ?? 16;
  const m = /^(\d*\.?\d+)(em|%|rem)$/.exec(text);
  if (m) return Number(m[1]) * (m[2] === "rem" ? 16 : m[2] === "%" ? base / 100 : base);
  return typeof value === "number" || /^\d*\.?\d+(px|pt)?$/.test(text) ? toPx(text) : undefined;
}

export function inherit(parent: Inherited, style: Style | undefined): Inherited {
  if (!style) return parent;
  const next: Inherited = { ...parent, blockAlign: undefined, mobile: { ...parent.mobile } };
  for (const key of ["fontSize", "lineHeight", "textAlign"] as const) {
    if (style[key] !== undefined) delete next.mobile![key];
    if (style._phone?.[key] !== undefined) next.mobile![key] = String(style._phone[key]);
  }
  for (const key of ["color", "fontFamily", "fontSize", "fontWeight", "textAlign", "letterSpacing", "lineHeight", "fontStyle", "textTransform"] as const) {
    if (style[key] !== undefined && style[key] !== "" && !/^\s*(inherit|currentcolor)\s*$/i.test(String(style[key]))) next[key] = String(style[key]);
  }
  // An underline isn't inherited, but it's drawn across everything inside.
  const decoration = style.textDecorationLine ?? style.textDecoration;
  if (decoration !== undefined && /underline|line-through|overline/i.test(String(decoration))) next.textDecoration = String(decoration);
  // A relative size (`2em`, `120%`) is worked out against the parent's size, as CSS does.
  const size = fontSizePx(style.fontSize, parent.fontSize);
  if (size !== undefined) next.fontSize = px(size);
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

const COLOR = /^(#[0-9a-f]{3,8}|rgba?\([^)]*\)|hsla?\([^)]*\)|[a-z]+)$/i;
const BACKGROUND_WORDS = /^(none|transparent|repeat|repeat-x|repeat-y|no-repeat|space|round|scroll|fixed|local|top|bottom|left|right|center|cover|contain|auto|border-box|padding-box|content-box|initial|inherit|unset)$/i;

/** A plain color from `background-color`, or the color in a `background` shorthand (`#f4f4f4 url(…) no-repeat`). */
export function backgroundColor(style: Style | undefined): string | undefined {
  if (!style) return undefined;
  if (typeof style.backgroundColor === "string") return COLOR.test(style.backgroundColor.trim()) ? color(style.backgroundColor) : undefined;
  if (typeof style.background !== "string") return undefined;
  const value = style.background.trim();
  if (COLOR.test(value)) return color(value);
  // The shorthand's color: the part that isn't an image, a keyword, a length or a size.
  const rest = value.replace(/(?:repeating-)?(?:linear|radial|conic)-gradient\((?:[^()]|\([^)]*\))*\)|url\([^)]*\)/gi, " ");
  const color_ = rest.match(/rgba?\([^)]*\)|hsla?\([^)]*\)|#[0-9a-f]{3,8}\b|[a-z]+/gi)?.find((part) => !BACKGROUND_WORDS.test(part));
  return color_ && COLOR.test(color_) ? color(color_) : undefined;
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

/**
 * A box's or a button's fill: its background color, else a gradient's first
 * stop (as the page's is), the closest an Elements background shows. Without
 * it, white text on a gradient would land on the white page.
 */
export function fillColor(style: Style | undefined): string | undefined {
  return backgroundColor(style) ?? gradientColor(style)?.color;
}

/**
 * A Container width Elements can't hold (`max-width: 100%` and no width in
 * px): an email's content width is in px. The email keeps the width it gets,
 * and says so. Call it only when neither width is in px.
 */
export function noteContainerWidth(style: Style, em: number, contentWidth: number, report: { note(reason: string, detail?: string): void }): void {
  for (const value of [style.maxWidth, style.width]) {
    if (typeof value !== "string" || !value.trim() || /^(auto|none|initial|unset|inherit)$/i.test(value.trim()) || toPx(value, em) !== undefined) continue;
    report.note("style not converted", `Container width ${value.trim()} (the email's content is ${contentWidth}px wide)`);
  }
}

/** The page color: the Body's background color, else a gradient's, else <Html>'s, else white. A gradient it can't show is noted. */
export function pageColor(style: Style, report: { note(reason: string, detail?: string): void }, html?: Style): string {
  const plain = backgroundColor(style);
  // A Body without a background of its own shows what's behind it: <Html>'s.
  if (html && plain === undefined && !/gradient\(|url\(/i.test(String(style.backgroundImage ?? style.background ?? ""))) return pageColor(html, report);
  // An email's page has a color, no image: where images don't load, the original shows that color too.
  if (/url\(/i.test(String(style.backgroundImage ?? style.background ?? ""))) report.note("style not converted", `background image (Body, its color ${plain ?? "#ffffff"} shows)`);
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
  // From the longhands, else from the `background` shorthand (`url(…) no-repeat center / cover`).
  const shorthand = typeof style?.background === "string" ? style.background.replace(/url\([^)]*\)/gi, " ") : "";
  const [beforeSize, afterSize = ""] = shorthand.split("/");
  const size = String(style?.backgroundSize ?? afterSize.trim().split(/\s+/)[0] ?? "");
  const repeat = String(style?.backgroundRepeat ?? /\b(no-repeat|repeat-x|repeat-y|repeat)\b/i.exec(beforeSize)?.[1] ?? "repeat");
  const position = style?.backgroundPosition ?? (beforeSize.match(/\b(top|bottom|left|right|center)\b/gi) ?? []).join(" ");
  return {
    url,
    fullWidth,
    repeat: repeat === "no-repeat" ? "no-repeat" : repeat,
    size: size === "cover" || size === "contain" ? size : "custom",
    ...backgroundPosition(String(position ?? "")),
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

/** A translucent `rgba()` color as `#rrggbbaa`: an Elements Row drops `rgba()` backgrounds and keeps this form. */
export function hexAlpha(value: unknown): unknown {
  const match = typeof value === "string" ? /^rgba\((\d+), (\d+), (\d+), (\d*\.?\d+)\)$/.exec(value.trim()) : null;
  if (!match) return value;
  return `#${[...match.slice(1, 4).map(Number), Math.round(Number(match[4]) * 255)].map((n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0")).join("")}`;
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
