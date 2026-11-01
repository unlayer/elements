/**
 * Writing markup and CSS from resolved values: escaping, and each value kind
 * as CSS. Shared by every HTML target.
 */
import type { Border, BorderSide, FontFamily, Insets, Json, LineHeight, Radius, ResolvedText } from "@unlayer-internal/elements-core";

export function escapeText(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#39;");
}

/** An HTML attribute list, skipping absent values. */
export function attrs(values: Record<string, string | number | undefined | null | false>): string {
  return Object.entries(values)
    .filter(([, value]) => value !== undefined && value !== null && value !== false)
    .map(([name, value]) => ` ${name}="${escapeAttr(String(value))}"`)
    .join("");
}

export type Declarations = Array<[string, string | number | undefined]>;

/** Declarations as a style attribute's text, skipping absent values. */
export function css(declarations: Declarations, important = false): string {
  return declarations
    .filter((d): d is [string, string | number] => d[1] !== undefined && d[1] !== "")
    .map(([property, value]) => `${property}:${shortColors(String(value))}${important ? "!important" : ""}`)
    .join(";");
}

/** `#ffffff` as `#fff` wherever it's the same color: bytes count in email (Gmail clips at 102 KB). */
export function shortColors(value: string): string {
  return value.replace(/#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3(?![0-9a-f])/gi, "#$1$2$3");
}

/** A style attribute, or nothing when there's no style. */
export function styleAttr(declarations: Declarations): string {
  const text = css(declarations);
  return text ? ` style="${escapeAttr(text)}"` : "";
}

export const px = (value: number): string => (value === 0 ? "0" : `${Math.round(value * 100) / 100}px`);

/** A length from a document (a number of px, or "50%"). */
export function length(value: Json | undefined): string | undefined {
  if (value === undefined || value === null) return undefined;
  return typeof value === "number" ? px(value) : String(value);
}

export function insets(value: Json | undefined): string | undefined {
  if (!value) return undefined;
  const { top, right, bottom, left } = value as Insets;
  if (top === right && right === bottom && bottom === left) return px(top);
  if (top === bottom && right === left) return `${px(top)} ${px(right)}`;
  return `${px(top)} ${px(right)} ${px(bottom)} ${px(left)}`;
}

const side = (s: BorderSide) => `${px(s.width)} ${s.style} ${s.color}`;

export function border(value: Json | undefined): Declarations {
  if (!value) return [];
  const b = value as Border;
  const sides = (["top", "right", "bottom", "left"] as const).filter((key) => b[key]);
  if (sides.length === 4 && sides.every((key) => side(b[key]!) === side(b.top!))) return [["border", side(b.top!)]];
  return sides.map((key) => [`border-${key}`, side(b[key]!)]);
}

export function radius(value: Json | undefined): string | undefined {
  if (value === undefined) return undefined;
  const r = value as Radius;
  return typeof r === "number" ? px(r) : `${px(r.topLeft)} ${px(r.topRight)} ${px(r.bottomRight)} ${px(r.bottomLeft)}`;
}

/** A font stack, as written (validated: nothing that could end a declaration). */
export function fontFamily(value: FontFamily): string {
  return value;
}

export function lineHeight(value: LineHeight): string {
  return typeof value === "number" ? String(value) : value;
}

const TEXT_CSS: Array<[keyof ResolvedText, string, (value: never) => string]> = [
  ["color", "color", (v: string) => v],
  ["fontFamily", "font-family", fontFamily],
  ["fontSize", "font-size", px],
  ["fontWeight", "font-weight", (v: number) => String(v)],
  ["fontStyle", "font-style", (v: string) => v],
  ["lineHeight", "line-height", lineHeight],
  ["letterSpacing", "letter-spacing", px],
  ["textAlign", "text-align", (v: string) => v],
  ["textTransform", "text-transform", (v: string) => v],
];

const same = (a: unknown, b: unknown) => a === b || JSON.stringify(a) === JSON.stringify(b);

/**
 * The text styles that differ from what's inherited (all of them without a
 * parent), plus those in `always` (what a browser's own styles would change:
 * a heading's size and weight, a link's color).
 */
export function textDeclarations(text: ResolvedText, parent: ResolvedText | undefined, always: ReadonlyArray<keyof ResolvedText> = []): Declarations {
  const out: Declarations = [];
  for (const [key, property, write] of TEXT_CSS) {
    if (!parent || always.includes(key) || !same(text[key], parent[key])) out.push([property, write(text[key] as never)]);
  }
  return out;
}

/** The value of a text style as CSS, for overrides (phones, hover). */
export function textValue(key: string, value: Json): string | undefined {
  const entry = TEXT_CSS.find(([k]) => k === key);
  return entry ? entry[2](value as never) : undefined;
}
