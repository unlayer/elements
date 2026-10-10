/**
 * Runtime mode renders a template with sample props, so their values would
 * become fixed text. Text props the template shows as given become merge
 * tags instead (`{{user.name}}`), which the editor keeps and email services
 * fill in.
 *
 * The template is rendered once more with a marker in place of each text
 * prop. A prop becomes a merge tag only where its marker comes through
 * intact and, with the sample values put back, the conversion is the same:
 * a prop the template changes (`name.toUpperCase()`, a date it formats) or
 * tests keeps its sample value. It's rendered again with other values (a
 * lowercase first letter, more words, longer), which must show as given
 * too: a change a sample doesn't reveal (`name.split(" ")[0]` of "Alex",
 * `slice(0, 40)` of a short title) keeps the sample value as well.
 */

import { decodeHtmlEntities } from "@unlayer/convert-core";
import { parseFragment, type DefaultTreeAdapterMap } from "parse5";

const OPEN = "\uE000";
const CLOSE = "\uE001";
// Mixed case makes upper/lowercasing change the marker, even when the sample
// already has that case. Such a prop must keep its transformed sample value.
const MARKER = /\uE000uNlAyEr(\d+)\uE001/g;

/** A text prop: its path (`user.name`) and sample value. */
export interface TextProp {
  path: string;
  value: string;
}

/** The text props of `props`: string values, nested in plain objects (not in lists, which loops repeat). */
export function textProps(props: Record<string, unknown>, prefix = ""): TextProp[] {
  const out: TextProp[] = [];
  for (const [key, value] of Object.entries(props)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string" && value.trim()) out.push({ path, value });
    else if (isPlainObject(value)) out.push(...textProps(value, path));
  }
  return out;
}

/**
 * Another value for a text prop, that a change the template makes shows on: its first letter in
 * lowercase, more words, and longer than a title cut short.
 */
function otherValue(value: string): string {
  return `${value.charAt(0).toLowerCase()}${value.slice(1)} zQ mOrE wOrDs ${"x".repeat(48)}`;
}

/** `props` with the chosen text props replaced by markers, or by `value(i)`. */
function withMarkers(props: Record<string, unknown>, probes: TextProp[], chosen: number[], value = (i: number) => `${OPEN}uNlAyEr${i}${CLOSE}`): Record<string, unknown> {
  // Copies only the objects on each prop's path: props can hold functions and elements.
  const copy: Record<string, unknown> = { ...props };
  for (const i of chosen) {
    const keys = probes[i].path.split(".");
    let target = copy;
    for (const key of keys.slice(0, -1)) {
      target[key] = { ...(target[key] as Record<string, unknown>) };
      target = target[key] as Record<string, unknown>;
    }
    target[keys[keys.length - 1]] = value(i);
  }
  return copy;
}

/**
 * A converted template (an Elements tree, design JSON) with text props as
 * merge tags. `render` converts the template with the props given; `base`
 * is its output with the sample props. Props that fail together are tried
 * one by one. `used`: the props that became merge tags; `kept`: props the
 * output shows but that keep their sample value.
 */
export async function mergeTagged<T>(
  props: Record<string, unknown>,
  base: T,
  render: (props: Record<string, unknown>) => T | Promise<T>,
): Promise<{ result?: T; used: string[]; kept: string[] }> {
  // A prop written as HTML (`footerHtml`: its sample's markup is markup in the output) isn't
  // text: as a merge tag, its links would go. A prop shown as text (escaped) still is.
  const output = JSON.stringify(base);
  const asHtml = (p: TextProp) => /<[a-z!/]/i.test(p.value) && output.includes(JSON.stringify(p.value).slice(1, -1));
  // A sample that's already an email service's placeholder (`{{ first_name }}`, `*|FNAME|*`, `{% if %}`) stays as
  // written: as a merge tag named after the prop, the service would get another name.
  const placeholder = (p: TextProp) => /\{\{|\{%|\*\|[^|]*\|\*|<%|%%[^%\s]+%%|\[\[[^\]]+\]\]/.test(p.value);
  const html = textProps(props).filter((p) => asHtml(p) || placeholder(p)).map((p) => p.path);
  const probes = textProps(props).filter((p) => !asHtml(p) && !placeholder(p));
  if (!probes.length) return { used: [], kept: html };
  const attempt = async (chosen: number[]): Promise<T | undefined> => {
    let output: T;
    try {
      output = await render(withMarkers(props, probes, chosen));
    } catch {
      return undefined; // the template can't take a placeholder there
    }
    if (hasBrokenMarkers(output) || !sameOutput(replaceMarkers(output, probes, (p) => p.value), base)) return undefined;
    // Shown as given: with other values in, the output is the marked one with them in place.
    const others = probes.map((p) => otherValue(p.value));
    let other: T;
    try {
      other = await render(withMarkers(props, probes, chosen, (i) => others[i]));
    } catch {
      return undefined;
    }
    if (!sameOutput(replaceMarkers(output, probes.map((p, i) => ({ ...p, value: others[i] })), (p) => p.value), other)) return undefined;
    return output;
  };
  const all = probes.map((_, i) => i);
  let chosen = all;
  let marked = await attempt(all);
  if (!marked) {
    chosen = [];
    for (const i of all) if (await attempt([i])) chosen.push(i);
    marked = chosen.length ? await attempt(chosen) : undefined;
  }
  const shown = (p: TextProp) => JSON.stringify(base).includes(JSON.stringify(p.value).slice(1, -1));
  if (!marked) return { used: [], kept: [...html, ...probes.filter(shown).map((p) => p.path)] };
  const tag = (p: TextProp) => `{{${p.path}}}`;
  const result = replaceMarkers(marked, probes, tag);
  const text = JSON.stringify(result);
  return {
    result,
    // Tagged somewhere (image sources keep the sample value).
    used: [...markersIn(marked)]
      .sort((a, b) => a - b)
      .map((i) => probes[i])
      .filter((p) => text.includes(tag(p)))
      .map((p) => p.path),
    kept: [
      ...html,
      ...probes
        .filter((p) => !text.includes(tag(p)) && shown(p))
        .map((p) => p.path),
    ],
  };
}

/** Replace markers only in text and links; styles and image sources keep samples. */
export function replaceMarkers<T>(
  output: T,
  probes: TextProp[],
  tag: (prop: TextProp) => string,
): T {
  type Context = "sample" | "text" | "html" | "richText";
  const escape = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  const swap = (text: string, allowed: boolean, html = false) =>
    text.replace(MARKER, (_, i: string) => {
      const p = probes[Number(i)];
      const value = allowed ? tag(p) : p.value;
      return html ? escape(value) : value;
    });
  const html = (source: string) => {
    // Source ranges preserve the markup verbatim while the parser identifies
    // text and attributes, including quoted '>' and embedded styles/images.
    const allowed: Array<{ start: number; end: number }> = [];
    const visit = (
      node: DefaultTreeAdapterMap["node"],
      hidden = false,
    ): void => {
      const blocked =
        hidden || node.nodeName === "style" || node.nodeName === "script";
      if (node.nodeName === "#text" && !blocked && node.sourceCodeLocation) {
        allowed.push({
          start: node.sourceCodeLocation.startOffset,
          end: node.sourceCodeLocation.endOffset,
        });
      }
      if ("tagName" in node) {
        for (const [name, location] of Object.entries(
          node.sourceCodeLocation?.attrs ?? {},
        )) {
          if (
            (node.tagName === "a" && name === "href") ||
            (node.tagName === "img" && name === "alt")
          ) {
            allowed.push({
              start: location.startOffset,
              end: location.endOffset,
            });
          }
        }
        if ("content" in node) visit(node.content, blocked);
      }
      if ("childNodes" in node)
        for (const child of node.childNodes) visit(child, blocked);
    };
    visit(parseFragment(source, { sourceCodeLocationInfo: true }));
    return source.replace(MARKER, (marker, i: string, offset: number) =>
      swap(
        marker,
        allowed.some(
          (r) => offset >= r.start && offset + marker.length <= r.end,
        ),
        true,
      ),
    );
  };
  const walk = (value: unknown, context: Context = "sample"): unknown => {
    if (typeof value === "string") {
      if (context === "html") return html(value);
      if (context === "richText") {
        try {
          return JSON.stringify(walk(JSON.parse(value), "richText"));
        } catch {
          return swap(value, false);
        }
      }
      return swap(value, context === "text");
    }
    if (Array.isArray(value)) return value.map((item) => walk(item, context));
    if (value && typeof value === "object") {
      const node = value as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const [key, inner] of Object.entries(node)) {
        const field: Context =
          key === "html" || (key === "text" && context !== "richText")
            ? "html"
            : key === "textJson"
              ? "richText"
              : ["children", "previewText", "preheaderText", "alt", "altText", "href"].includes(
                    key,
                  ) ||
                  (context === "richText" && key === "text")
                ? "text"
                : // Design actions contain their link in values.href; other URLs
                  // (fonts, backgroundImage, src.url) must stay usable sample values.
                  key === "url" && context === "text"
                  ? "text"
                  : key === "action"
                    ? "text"
                    : context === "richText"
                      ? "richText"
                      : "sample";
        out[key] = walk(inner, field);
      }
      return out;
    }
    return value;
  };
  return walk(output) as T;
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Which markers appear in `output`. */
function markersIn(output: unknown): Set<number> {
  const found = new Set<number>();
  for (const m of JSON.stringify(output).matchAll(MARKER)) found.add(Number(m[1]));
  return found;
}

/** Whether marker characters appear outside whole markers (a marker cut or changed). */
function hasBrokenMarkers(output: unknown): boolean {
  return /[\uE000\uE001]/.test(JSON.stringify(output).replace(MARKER, ""));
}

/** Two outputs the same, reading HTML entities as the characters they stand for. */
function sameOutput(a: unknown, b: unknown): boolean {
  const text = (output: unknown) =>
    JSON.stringify(output, (_, value: unknown) =>
      typeof value === "string" ? decodeHtmlEntities(value) : value,
    );
  return text(a) === text(b);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
