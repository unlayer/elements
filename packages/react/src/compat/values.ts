/** Legacy design values as the new engine's: lengths, sides, colors, borders, line heights and weights. */
import { asset, type Json } from "@unlayer-internal/elements-core";
import { escapeText, normalizeLinkValue } from "@unlayer-internal/shared-elements";

export type Values = Record<string, any>;
export type Sides = { top: number; right: number; bottom: number; left: number };

/** The alignments of a block's text legacy reads. */
export const TEXT_ALIGNS: ReadonlySet<string> = new Set(["left", "center", "right", "justify"]);

/** Where today's components' icons and placeholders come from, unless the render says otherwise. */
export const DEFAULT_CDN = "https://cdn.tools.unlayer.com";

/** A value as an HTML attribute's, escaped as legacy escapes it. */
export const attribute = (value: unknown): string => escapeText(String(value ?? "")).replace(/"/g, "&quot;");

/** Whether a block's row has columns that stack on phones. */
export const columnsStack = ({ cells, row }: { cells: number[]; row: Values }): boolean => cells.length > 1 && !(row.noStackMobile || row._override?.mobile?.noStackMobile);

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

/** The line styles the new engine draws. */
export const LINE_STYLES = new Set(["solid", "dashed", "dotted", "none"]);

/** A legacy border where it's always drawn: a width that can't be read is said, and leaves that side out; another style is said, and solid. */
export function drawnBorder(values: Values = {}, color: string, note: (what: string, value: unknown) => void): Json | undefined {
  const read: Values = { ...values };
  for (const side of ["Top", "Right", "Bottom", "Left"]) {
    const [width, style] = [read[`border${side}Width`], read[`border${side}Style`]];
    if (width !== undefined && width !== "" && px(width) === undefined) note("border's width", width);
    if (style && !LINE_STYLES.has(style)) {
      note("border's style", style);
      read[`border${side}Style`] = "solid";
    }
  }
  return border(read, color);
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

/**
 * A font weight legacy's CSS draws as it says, where the new engine's are in hundreds: bolder or lighter than the 400
 * around it, or another number at the nearest hundred (the face a font without that weight draws).
 */
export function nearestWeight(value: unknown): number | undefined {
  if (value === "bolder") return 700;
  if (value === "lighter") return 100;
  const number = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN;
  return number >= 1 && number <= 1000 ? Math.min(900, Math.max(100, Math.round(number / 100) * 100)) : undefined;
}

/** A font weight where it's always drawn: bolder, lighter or another number at the nearest hundred, which is said; what can't be read is said too. */
export function drawnWeight(value: unknown, what: string, note: (message: string) => void): number | undefined {
  const out = fontWeight(value) ?? nearestWeight(value);
  if (out === undefined) note(`${what}'s font weight ${JSON.stringify(value)} can't be read: it's drawn without it.`);
  else if (fontWeight(value) === undefined && !/er$/.test(String(value))) note(`${what}'s font weight ${JSON.stringify(value)} is drawn at the nearest hundred.`);
  return out;
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
 * A block's link where it's always drawn: its URL and how it opens, or a link to nothing (legacy's `href=""`), and the
 * attributes legacy writes on it besides (its class and own attributes, a target of another kind). A click handler
 * isn't written: it's said.
 */
export function drawnLink(value: unknown, keep: (text: string) => string, note: (message: string) => void): { href: Json; attrs?: Json } {
  const given = normalizeLinkValue(value);
  if (!given && value !== undefined && value !== null) note(`A link ${JSON.stringify(value)} can't be read: it's a link to nothing.`);
  const target = typeof given?.target === "string" && given.target ? given.target : undefined;
  const opens = target === "_self" || target === "_blank";
  const own = given?.customAttrs && typeof given.customAttrs === "object" ? Object.entries(given.customAttrs as Record<string, unknown>).filter(([name, v]) => typeof v === "string" && v.trim() && !/^on/i.test(name)) : [];
  const attrs: Record<string, string> = Object.fromEntries(own.map(([name, v]) => [name, keep(v as string)]));
  if (typeof given?.class === "string" && given.class) attrs.class = given.class;
  if (target && !opens) attrs.target = target;
  if (given?.onClick || Object.keys(given?.customAttrs ?? {}).some((name) => /^on/i.test(name))) note("A link's click handler can't be written: it's drawn without it.");
  const url = typeof given?.url === "string" ? given.url : "";
  if (given && typeof given.url !== "string" && given.url) note(`A link's URL ${JSON.stringify(given.url)} can't be read: it's a link to nothing.`);
  const href = url ? keep(encodedUrl(url)) : "";
  return { href: { href, ...(opens ? { target } : {}) } as Json, ...(Object.keys(attrs).length ? { attrs } : {}) };
}

/**
 * A URL an image can be drawn from: as it is where it's text, a number as the text legacy writes; undefined where the
 * new engine won't write it (one that runs a script), which is said.
 */
export function drawnImageUrl(value: unknown, keep: (text: string) => string, say: (message: string) => void): string | undefined {
  if (typeof value !== "string" && typeof value !== "number") {
    say(`${JSON.stringify(value)} can't be read.`);
    return undefined;
  }
  if (typeof value === "number") say(`${value} isn't a URL: it's written as it is.`);
  const url = keep(inAttribute(String(value)));
  if (asset().parse(url).ok) return url;
  say(`${JSON.stringify(value)} isn't one Elements writes.`);
  return undefined;
}

/**
 * A block's values on a desktop window, and those legacy's stylesheet gives it on phones, of the keys it reads: one set
 * for desktop is the value above 480px, the block's own below it (unless it has one for phones). In a printed document
 * one set for desktop is the value at any width, but its padding: that rule's selector finds nothing there. (An image's
 * `src` set for desktop says only its size: its URL stays.)
 */
export function deviceValues(values: Values, keys: string[], mode: "email" | "web" | "document"): { values: Values; phone: Values } {
  const { desktop = {}, mobile = {} } = values._override ?? {};
  const out = { ...values };
  const phone: Values = {};
  for (const key of keys) {
    if (desktop[key] !== undefined && !(mode === "document" && key === "containerPadding")) {
      out[key] = key === "src" ? { ...values.src, ...desktop.src } : desktop[key];
      if (mode !== "document" && values[key] !== undefined) phone[key] = key === "src" ? { autoWidth: undefined, ...values.src } : values[key];
    }
    if (mobile[key] !== undefined) phone[key] = mobile[key];
  }
  return { values: out, phone };
}

/**
 * Whether text holds an email service's tag that the new engine would write otherwise than legacy: <%name%>, a Liquid
 * tag ({% if orders > 1 %}), or a merge tag holding what it escapes ({{ a > b }}, {{ name | default: "x" }}). A plain
 * merge tag ({{name}}) is written as it is.
 */
export function serviceTag(text: string): boolean {
  return text.includes("<%") || text.includes("{%") || /\{\{[^}]*[<>&"'][^}]*\}\}/.test(text);
}

const SERVICE_TAG = /<%[\s\S]*?%>|\{%[\s\S]*?%\}|\{\{[^}]*[<>&"'][^}]*\}\}/g;
const KEPT_TAG = /\uE000(\d+)\uE001/g;

/** Text with each email service's tag in it (or what `pattern` finds) a mark of its place in `tags`, which the writers leave as it is. */
export const keepServiceTags = (text: string, tags: string[], pattern: RegExp = SERVICE_TAG): string => text.replace(pattern, (tag) => `\uE000${tags.push(tag) - 1}\uE001`);

/** Text for an attribute: a double quote in an email service's tag would end it, so it's encoded, as legacy encodes it. */
export const inAttribute = (text: string): string => text.replace(SERVICE_TAG, (tag) => tag.replace(/"/g, "&quot;"));

/** The marks in written markup as the tags they were, for the service to fill in. */
export const restoreServiceTags = (text: string, tags: string[]): string => text.replace(KEPT_TAG, (mark, index) => tags[Number(index)] ?? mark);
