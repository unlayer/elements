/** Legacy design values as the new engine's: lengths, sides, colors, borders, line heights and weights. */
import { asset, type Json } from "@unlayer-internal/elements-core";
import { escapeText, normalizeLinkValue } from "@unlayer-internal/shared-elements";
import { border, encodedUrl, fontWeight, px, type Values } from "../builder/read-values";

// The values the builder adapter reads designs with too: its own now, read the same here.
export { ALIGN, border, color, encodedUrl, font, fontWeight, holdsKept, letterSpacing, lineHeight, px, serviceTag, sides, some, webLink } from "../builder/read-values";
export type { Sides, Values } from "../builder/read-values";

/** The alignments of a block's text legacy reads. */
export const TEXT_ALIGNS: ReadonlySet<string> = new Set(["left", "center", "right", "justify"]);

/** Where today's components' icons and placeholders come from, unless the render says otherwise. */
export const DEFAULT_CDN = "https://cdn.tools.unlayer.com";

/** A value as an HTML attribute's, escaped as legacy escapes it. */
export const attribute = (value: unknown): string => escapeText(String(value ?? "")).replace(/"/g, "&quot;");

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

/** An entity reference, written as it's given where legacy doesn't escape a `&`. */
export const ENTITY = /&(?:#\d+|#x[\da-f]+|\w+);/gi;

/**
 * A URL for an email's markup or a link: its tags and its `&amp;`s as written, which legacy writes so (read as `&`, where
 * the writers would have them read as themselves). Only those: another entity could hide a scheme (`java&#115;cript:`).
 */
export const keptUrl = (url: string, keep: (text: string, pattern?: RegExp) => string): string => keep(keep(url), /&amp;/gi);

/**
 * A block's link where it's always drawn: its URL and how it opens, or a link to nothing (legacy's `href=""`), and the
 * attributes legacy writes on it besides (its class and own attributes, a target of another kind). A click handler
 * isn't written: it's said.
 */
export function drawnLink(value: unknown, keep: (text: string, pattern?: RegExp) => string, note: (message: string) => void): { href: Json; attrs?: Json } {
  const given = normalizeLinkValue(value);
  if (!given && value !== undefined && value !== null) note(`A link ${JSON.stringify(value)} can't be read: it's a link to nothing.`);
  const target = typeof given?.target === "string" && given.target ? given.target : undefined;
  const opens = target === "_self" || target === "_blank";
  const own = given?.customAttrs && typeof given.customAttrs === "object" ? Object.entries(given.customAttrs as Record<string, unknown>).filter(([name, v]) => typeof v === "string" && v.trim() && !/^on/i.test(name)) : [];
  const attrs: Record<string, string> = Object.fromEntries(own.map(([name, v]) => [name, keep(keep(v as string), ENTITY)]));
  if (typeof given?.class === "string" && given.class) attrs.class = given.class;
  if (target && !opens) attrs.target = target;
  if (given?.onClick || Object.keys(given?.customAttrs ?? {}).some((name) => /^on/i.test(name))) note("A link's click handler can't be written: it's drawn without it.");
  const url = typeof given?.url === "string" ? given.url : "";
  if (given && typeof given.url !== "string" && given.url) note(`A link's URL ${JSON.stringify(given.url)} can't be read: it's a link to nothing.`);
  const href = url ? keptUrl(encodedUrl(url), keep) : "";
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
  const url = keep(String(value));
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

const SERVICE_TAG = /<%[\s\S]*?%>|\{%[\s\S]*?%\}|\{\{[^}]*[<>&"'][^}]*\}\}/g;

/**
 * How what's kept gets past the writers, which escape all they're given: as a mark in the tree's strings,
 * `\uFDD0<its place in the render's tags>\uFDD1`, which `restoreServiceTags` puts back once they're written. A mark in
 * what's written comes from `keepServiceTags` and nothing else. Its characters are noncharacters, which Unicode reserves
 * for a program's own use: no text loses one to them (an icon font's private-use characters stay), and no case or
 * normal form of a character is one. `withoutMarks` turns them into U+FFFD in all a template gives the lowering
 * (template.ts), and what decodes text on its way (runs.ts's entities, a Lexical textJson, the plain text's entities)
 * won't write them. They're replaced, never deleted: deleting one could join what's around it into something a sanitizer
 * had no reason to refuse (`java\uFDD0script:` is a relative address; without it, it isn't).
 */
const OPEN = "\uFDD0";
const CLOSE = "\uFDD1";
const NONCHARACTERS = /[\uFDD0-\uFDEF]/g;
const REPLACEMENT = "\uFFFD";
const KEPT = /\uFDD0(\d+)\uFDD1/g;

/**
 * A value of a template's with its noncharacters replaced, the marks' among them, through its lists and objects (its keys
 * too), so no mark comes from it. A React element is left: what it writes is taken through this when it's written.
 */
export function withoutMarks<T>(value: T, seen = new Map<object, unknown>()): T {
  if (typeof value === "string") return value.replace(NONCHARACTERS, REPLACEMENT) as T;
  // (A React element's mark is a symbol: JSON can't write one, so a design's key of that name is only a key.)
  if (value === null || typeof value !== "object" || typeof (value as { $$typeof?: unknown }).$$typeof === "symbol") return value;
  if (seen.has(value)) return seen.get(value) as T;
  if (Array.isArray(value)) {
    const list: unknown[] = [];
    seen.set(value, list);
    for (const item of value) list.push(withoutMarks(item, seen));
    return list as T;
  }
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) return value;
  const out: Record<string, unknown> = {};
  seen.set(value, out);
  // (As a key of its own, whatever it's called: JSON's `__proto__` isn't this object's prototype.)
  for (const [key, item] of Object.entries(value)) Object.defineProperty(out, key.replace(NONCHARACTERS, REPLACEMENT), { value: withoutMarks(item, seen), enumerable: true, writable: true, configurable: true });
  return out as T;
}

const mark = (tags: string[], tag: string) => `${OPEN}${tags.push(tag) - 1}${CLOSE}`;

/** What can start an element or a comment, written in HTML as it is: `<` before a letter, `/`, `!` or `?` (before another character it's text: `{% if a < 1 %}`, `<%name%>`). */
const FORMS_MARKUP = /<[a-zA-Z/!?]/;

/**
 * A value that's text, not HTML (an item's words, an attribute's), with each email service's tag in it (or what `pattern`
 * finds) a mark of its place in `tags`, which the writers leave as it is. It can't add markup, whatever it holds: a tag
 * whose content could is left to be escaped as text is, and a double quote, which would end an attribute, is encoded, as
 * legacy encodes it. (What's beside a tag is escaped, and a tag's end is its own, so nothing it's put back beside adds to it.)
 */
export const keepServiceTags = (text: string, tags: string[], pattern: RegExp = SERVICE_TAG): string => text.replace(pattern, (tag) => (FORMS_MARKUP.test(tag) ? tag : mark(tags, tag.replace(/"/g, "&quot;"))));

/** A value that's HTML, as legacy writes it (a text block's, a button's label, a table's cell), with every email service's tag in it marked as it's written. */
export const keepHtmlTags = (html: string, tags: string[]): string => html.replace(SERVICE_TAG, (tag) => mark(tags, tag));

/** The marks in written markup as the tags they were, for the service to fill in. */
export const restoreServiceTags = (text: string, tags: string[]): string => text.replace(KEPT, (_, index) => tags[Number(index)] ?? "");
