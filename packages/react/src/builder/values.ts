/**
 * Values both ways between the template and the builder, as the builder's editors store them: a length as "8px",
 * sides as "10px 20px", a border side by side (`borderTopWidth`, …), a line height as "150%", a font as
 * `{ label, value }`, a link as `{ name: "web", values: { href, target } }`. A hidden property is written by its kind
 * (from the component's definition), so it's what the builder's own editor for it would write; read back, it's parsed
 * by the same kind, and one that doesn't parse is left out and said.
 */
import { definitionOf, linkParts, type Border, type Insets, type Json, type LinkValue } from "@unlayer-internal/elements-core";
import { border as legacyBorder, px, sides, type Values } from "../compat/values";

export type { Values };

const round = (n: number) => Math.round(n * 100) / 100;
export const cssPx = (n: number) => `${round(n)}px`;

/** Sides as CSS, in as few values as say them ("10px", "10px 20px"). */
export function cssSides(s: Insets): string {
  const [t, r, b, l] = [s.top, s.right, s.bottom, s.left].map(cssPx);
  if (t === r && r === b && b === l) return t;
  if (t === b && r === l) return `${t} ${r}`;
  if (r === l) return `${t} ${r} ${b}`;
  return `${t} ${r} ${b} ${l}`;
}

/** A border as the builder's (`borderTopWidth`, `borderTopStyle`, `borderTopColor`, …), sides it has only. */
export function builderBorder(value: Border | undefined): Values {
  const out: Values = {};
  for (const side of ["top", "right", "bottom", "left"] as const) {
    const line = value?.[side];
    if (!line) continue;
    const name = side[0].toUpperCase() + side.slice(1);
    out[`border${name}Width`] = line.style === "none" ? "0px" : cssPx(line.width);
    out[`border${name}Style`] = line.style === "none" ? "solid" : line.style;
    out[`border${name}Color`] = line.color;
  }
  return out;
}

/** The builder's border as Elements', sides of no width left out (a side with no color is black, as CSS draws one). */
export const readBorder = (value: unknown): Json | undefined => legacyBorder((value && typeof value === "object" ? value : {}) as Values, "#000000");

/** A line height as the builder's: a multiple as a percentage ("150%"), px as it is. */
export const cssLineHeight = (value: Json) => (typeof value === "number" ? `${round(value * 100)}%` : String(value));

/** A font stack as the builder's `{ label, value }`: its first family the label. */
export const builderFont = (stack: string) => ({ label: stack.split(",")[0].replace(/["']/g, "").trim(), value: stack });

/** A link as the builder's: in the same window where the template gives no target, where the builder's own default is a new one. */
export const builderLink = (value: LinkValue) => {
  const { href, target } = linkParts(value);
  return { name: "web", values: { href, target: target ?? "_self" } };
};

/** A style or prop as its tool's editor would store it, by its kind. */
export function encode(kind: string, value: Json): unknown {
  switch (kind) {
    case "length":
      return typeof value === "number" ? cssPx(value) : value;
    case "insets":
      return cssSides(value as Insets);
    case "border":
      return builderBorder(value as Border);
    case "line":
      return builderBorder({ top: value as Border["top"] });
    case "radius":
      return typeof value === "number" ? cssPx(value) : [value as Record<string, number>].map((c) => [c.topLeft, c.topRight, c.bottomRight, c.bottomLeft].map(cssPx).join(" "))[0];
    case "lineHeight":
      return cssLineHeight(value);
    case "fontFamily":
      return builderFont(String(value));
    case "link":
      return builderLink(value as LinkValue);
    case "asset": {
      const asset = typeof value === "string" ? { src: value } : (value as { src: string; width?: number; height?: number });
      return { url: asset.src, ...(asset.width ? { width: asset.width } : {}), ...(asset.height ? { height: asset.height } : {}) };
    }
    default:
      return value;
  }
}

/** The builder's value as the template's input for a kind (what the kind's own parser takes). */
export function decode(kind: string, value: unknown): unknown {
  switch (kind) {
    case "border":
      return readBorder(value);
    case "line": {
      const lines = readBorder(value) as Border | undefined;
      return lines?.top;
    }
    case "radius":
      return typeof value === "string" && /\s/.test(value.trim()) ? value.trim().split(/\s+/) : value;
    case "fontFamily":
      return value && typeof value === "object" ? (value as { value?: unknown }).value : value;
    case "link": {
      const link = value as { values?: { href?: unknown; target?: unknown } } | undefined;
      if (!link || typeof link !== "object" || !link.values) return value;
      const { href, target } = link.values;
      // ("_self" is what a link does with no target.)
      return target === "_blank" ? { href, target } : href;
    }
    case "asset": {
      const asset = value as { url?: unknown; width?: unknown; height?: unknown };
      if (!asset || typeof asset !== "object") return value;
      // A URL alone where its size isn't known, as the template gives one.
      return asset.width || asset.height ? { src: asset.url, ...(asset.width ? { width: asset.width } : {}), ...(asset.height ? { height: asset.height } : {}) } : asset.url;
    }
    case "length":
      return typeof value === "string" && px(value) !== undefined && !value.trim().endsWith("%") ? px(value) : value;
    case "insets":
      return typeof value === "string" ? sides(value) ?? value : value;
    default:
      return value;
  }
}

/** The kind of a component's style or prop (`style.padding`), or undefined where it has none. */
export function kindOf(type: string, path: string): { name: string; parse(value: unknown): { ok: true; value: Json } | { ok: false; message: string } } | undefined {
  const definition = definitionOf(type);
  const [part, key] = [path.slice(0, path.indexOf(".")), path.slice(path.indexOf(".") + 1)];
  const specs = (part === "props" ? definition?.props : definition?.style) as Record<string, { kind: { name: string; parse(value: unknown): any } }> | undefined;
  return specs && Object.hasOwn(specs, key) ? specs[key].kind : undefined;
}
