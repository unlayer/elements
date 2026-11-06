/**
 * A design's values as Elements 0.2's components read them, which is how the builder draws them: lengths, sides, colors,
 * borders, line heights, weights, fonts, alignments and links (as the new engine's), email services' tags, the id an
 * author gave a part, where it's hidden, and a text tool's link style. fromDesign() reads designs with these; today's
 * components' lowering (src/compat) reads them with the same.
 */
import type { Json } from "@unlayer-internal/elements-core";
import type { Run } from "./read-runs";

export type Values = Record<string, any>;
export type Sides = { top: number; right: number; bottom: number; left: number };

/** px from 12, "12" or "12px"; undefined for anything else. */
export const px = (value: unknown): number | undefined => {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  const match = typeof value === "string" ? /^\s*(-?[\d.]+)\s*(px)?\s*$/.exec(value) : null;
  return match && Number.isFinite(Number(match[1])) ? Number(match[1]) : undefined;
};

/** "10px 20px" (1 to 4 values in px) as four sides; undefined for anything else. */
export function sides(value: unknown): Sides | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "number") return { top: value, right: value, bottom: value, left: value };
  const parts = String(value).trim().split(/\s+/).map(px);
  if (parts.length > 4 || parts.some((part) => part === undefined)) return undefined;
  const [top, right = top, bottom = top, left = right] = parts as number[];
  return { top, right, bottom, left };
}

export const color = (value: unknown) => (typeof value === "string" && value !== "" && value !== "transparent" ? value : undefined);
export const some = (s: Sides | undefined) => (s && (s.top || s.right || s.bottom || s.left) ? s : undefined);

/**
 * A legacy border (`borderTopWidth`, …) as the new engine's, side by side; sides of no width left out. A side with no
 * color is in `color`: legacy's column draws it transparent, a button in its text's color (CSS's own).
 */
export function border(values: Values = {}, color = "transparent"): Json | undefined {
  const out: Record<string, Json> = {};
  for (const side of ["Top", "Right", "Bottom", "Left"]) {
    const width = px(values[`border${side}Width`]);
    if (!width) continue;
    out[side.toLowerCase()] = { width, style: values[`border${side}Style`] || "solid", color: values[`border${side}Color`] || color };
  }
  return Object.keys(out).length ? out : undefined;
}

/** A legacy line height ("140%", 1.4, "1.4", "24px") as the new engine's; undefined for anything else. */
export function lineHeight(value: unknown): number | string | undefined {
  if (typeof value === "number") return value > 0 ? value : undefined;
  if (typeof value !== "string") return undefined;
  const text = value.trim();
  if (/^\d*\.?\d+(px|%)$/.test(text)) return text;
  const multiple = /^(\d*\.?\d+)(em)?$/.exec(text);
  return multiple && Number(multiple[1]) > 0 ? Number(multiple[1]) : undefined;
}

/** A legacy font weight (400, "700", "bold") as the new engine's: 100 to 900 in hundreds; undefined for others. */
export function fontWeight(value: unknown): number | undefined {
  if (value === "bold") return 700;
  if (value === "normal") return 400;
  const number = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN;
  return Number.isInteger(number) && number >= 100 && number <= 900 && number % 100 === 0 ? number : undefined;
}

/** A font: legacy's `{ label, value }`, or a stack. */
export const font = (value: unknown): string | undefined =>
  typeof value === "string" ? value || undefined : value && typeof value === "object" && typeof (value as { value?: unknown }).value === "string" ? (value as { value: string }).value || undefined : undefined;

/** Letter spacing in px: legacy's em of the font size, or px. */
export function letterSpacing(value: unknown, fontSize: number | undefined): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value !== "string" || !value.trim()) return undefined;
  const text = value.trim();
  if (/em$/.test(text)) return fontSize === undefined || !Number.isFinite(parseFloat(text)) ? undefined : Math.round(parseFloat(text) * fontSize * 1000) / 1000;
  return px(text);
}

/** Legacy's alignment (left, center, right) as a Column's alignItems. */
export const ALIGN: Record<string, "start" | "center" | "end"> = { left: "start", center: "center", right: "end" };

/**
 * A legacy link as the new engine's, read as legacy's exporters read it (normalizeLinkValue: a URL, the builder's
 * `{ name, values: { href, target }, attrs }`, or `{ url, target }`), its quotes and angle brackets encoded as legacy
 * encodes them: null where it has no URL (legacy writes no link, or `href=""`), undefined where it holds what a link
 * here can't (a target other than _blank or _self, a class or attributes of its own, a click handler).
 */
export function webLink(value: unknown): Json | null | undefined {
  const link = normalizeLinkValue(value);
  if (!link) return value === undefined || value === null ? null : undefined;
  // What legacy writes on a link besides its URL and target (its other keys, such as the builder's, it doesn't read).
  const { url, target, class: names, onClick, customAttrs } = link;
  const own = customAttrs && typeof customAttrs === "object" ? Object.values(customAttrs).some((v) => typeof v === "string" && v.trim()) : false;
  if (names || onClick || own) return undefined;
  if (url === undefined || url === null || url === "") return null;
  if (typeof url !== "string" || (target !== undefined && target !== "_blank" && target !== "_self")) return undefined;
  const href = encodedUrl(url);
  return target ? { href, target } : href;
}

/** A URL with its quotes and angle brackets encoded as legacy encodes them, an email service's tag left as it is. */
export const encodedUrl = (url: string) => url.replace(/<%[\w.]+%>|["<>]/g, (c) => (c.length > 1 ? c : encodeURIComponent(c)));

/**
 * A link in the render-value shape today's exporters read (`{ url, target, ...customAttrs }`), from any of the three
 * shapes they take: a URL, `{ url, target }`, or the builder's `{ name, values: { href, target }, attrs }` (its href and
 * target in `values` first, then in `attrs`, whose other keys are the link's own attributes). Undefined for another.
 */
function normalizeLinkValue(value: unknown): Record<string, any> | undefined {
  if (value == null) return undefined;
  if (typeof value === "string") return { url: value, target: "_blank" };
  if (typeof value !== "object") return undefined;
  const v = value as Record<string, any>;
  if ("url" in v) return v;
  if ("name" in v && ((v.values && typeof v.values === "object") || (v.attrs && typeof v.attrs === "object"))) {
    const inner = v.values && typeof v.values === "object" ? (v.values as Record<string, any>) : {};
    const attrs = v.attrs && typeof v.attrs === "object" ? (v.attrs as Record<string, any>) : {};
    const { href: attrsHref, target: attrsTarget, ...customAttrs } = attrs;
    // `||`, not `??`: the builder's default is `values: { href: "" }`, which `attrs`' href is read past.
    return { url: inner.href || attrsHref || "", target: inner.target || attrsTarget || "_blank", ...customAttrs };
  }
  return undefined;
}

/**
 * Whether text holds an email service's tag that the new engine would write otherwise than legacy: <%name%>, a Liquid
 * tag ({% if orders > 1 %}), or a merge tag holding what it escapes ({{ a > b }}, {{ name | default: "x" }}). A plain
 * merge tag ({{name}}) is written as it is.
 */
export function serviceTag(text: string): boolean {
  return text.includes("<%") || text.includes("{%") || /\{\{[^}]*[<>&"'][^}]*\}\}/.test(text);
}

/**
 * Whether text holds what Elements 0.2's lowering kept of an email service's tag, a mark it wrote as `\uFDD0<n>\uFDD1`:
 * a value holding one is only known once the tag is filled in.
 */
export const holdsKept = (text: string): boolean => text.includes("\uFDD0");

/**
 * An id its author gave a row, column or block (legacy writes it; the ids it numbers itself aren't written), without
 * what would end its attribute.
 */
export function givenId(values: Values): string | undefined {
  const id = values._meta?.htmlID;
  return typeof id === "string" && id && !/^u_(row|column|body|content_[a-z0-9_]+)_?\d*$/.test(id) ? id.replace(/["'<>&`\s\u0000-\u001f\u007f]/g, "") || undefined : undefined;
}

/**
 * Where a block, column or row is hidden: on desktop, or on phones, by its overrides (legacy reads only these: a flat
 * `hideDesktop` or `hideMobile` in its values hides nothing).
 */
export function hidden(values: Values): { mobile?: boolean; desktop?: boolean } | undefined {
  const desktop = !!values._override?.desktop?.hideDesktop;
  const mobile = !!values._override?.mobile?.hideMobile;
  return desktop || mobile ? { ...(desktop ? { desktop } : {}), ...(mobile ? { mobile } : {}) } : undefined;
}

/**
 * The style legacy gives a block's links where it doesn't take the body's: their color, and no underline where it
 * says none. Null on a page where its hover style is another: for what has no place for that (a text tool read back).
 */
export function linkStyleOf(values: Values, mode: "email" | "web" | "document"): Record<string, Json> | undefined | null {
  const style = values.linkStyle;
  if (!style || style.inherit !== false) return undefined;
  const color = typeof style.linkColor === "string" && style.linkColor ? style.linkColor : undefined;
  const underline = style.linkUnderline !== false;
  if (mode === "web" && (style.linkHoverColor !== style.linkColor || (style.linkHoverUnderline !== false) !== underline)) return null;
  return { ...(color ? { color } : {}), ...(underline ? {} : { textDecoration: "none" }) };
}

/** The links among runs in the block's link style (in what a link doesn't set itself), and under the pointer. */
export function styled(runs: Run[], style: Record<string, Json> | undefined, hover: Record<string, Json> = {}): Run[] {
  if (!Object.keys(style ?? {}).length && !Object.keys(hover).length) return runs;
  return runs.map((run) => {
    if (typeof run === "string") return run;
    const children = run.children && styled(run.children, style, hover);
    if (run.type === "Link") return { ...run, style: { ...style, ...run.style }, ...(Object.keys(hover).length ? { hover } : {}), ...(children ? { children } : {}) };
    return children ? { ...run, children } : run;
  });
}
