/**
 * CSS values as the exporters can read them.
 *
 * Props accept any CSS color, but the exporters convert colors for Outlook
 * (bgcolor attributes) assuming hex or `rgba(r, g, b, a)` — the forms the
 * editor's color picker produces — so `rgb(1, 2, 3)` or `rgb(1 2 3)` came out
 * as "#NaN0203". And font stacks are written into style="" attributes, so a
 * double-quoted family name ended the attribute early.
 */
import { mergeValues } from "./merge-values";

/** A channel: a number, maybe a percentage. One way to read each digit, so a long value can't make it backtrack. */
const CHANNEL = /^-?(?:\d+(?:\.\d*)?|\.\d+)%?$/;

/**
 * rgb()/rgba() in any CSS syntax → "#rrggbb", or "rgba(r, g, b, a)" when translucent. Other values pass through.
 * Read in one pass, token by token (no pattern that could backtrack on a long value from data).
 */
export function normalizeColor(value: string): string {
  const text = value.trim();
  const open = text.indexOf("(");
  if (!/^rgba?$/i.test(text.slice(0, open)) || !text.endsWith(")")) return value;
  // r g b, r, g, b, or either with an alpha after "/" or ",".
  const [rgb, slashed, extra] = text.slice(open + 1, -1).split("/");
  const channels = rgb.trim().split(/\s*,\s*|\s+/);
  if (slashed !== undefined) channels.push(slashed.trim());
  if (extra !== undefined || channels.length > 4 || channels.length < (slashed === undefined ? 3 : 4) || !channels.every((c) => CHANNEL.test(c))) return value;
  // A number, or a percentage of `full`.
  const num = (text: string, full: number) => (text.endsWith("%") ? (parseFloat(text) / 100) * full : parseFloat(text));
  const [r, g, b] = channels.slice(0, 3).map((text) => Math.max(0, Math.min(255, Math.round(num(text, 255)))));
  const alpha = channels[3] === undefined ? 1 : num(channels[3], 1);
  if (alpha < 1) return `rgba(${r}, ${g}, ${b}, ${Math.max(0, alpha)})`;
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Whether a value can be written into a CSS declaration as it is: nothing that ends the declaration, the rule or
 * the `<style>` element (`16px</style><script>`, `;`, `}`), no comment that hides the rules after it (`/*`), and
 * every bracket closed by its own kind (`calc(12px` or `16px (]` would swallow the rules after it).
 */
export function cssValueSafe(text: string): boolean {
  if (/[<>{};]|\/\*|\*\//.test(text)) return false;
  const open: string[] = [];
  for (const c of text) {
    if (c === "(" || c === "[") open.push(c === "(" ? ")" : "]");
    else if ((c === ")" || c === "]") && open.pop() !== c) return false;
  }
  return !open.length;
}

/**
 * A device's settings (`_override.mobile`) with each text value that isn't safe in CSS left out: the editor writes
 * them into its export's `<style>` as they are, as Elements' head does with the ones it keeps.
 */
export function cssSafeValues<T>(value: T): T {
  if (typeof value === "string") return (cssValueSafe(value) ? value : undefined) as T;
  if (Array.isArray(value)) return value.map(cssSafeValues) as T;
  if (!isPlainObject(value)) return value;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    const safe = cssSafeValues(v);
    if (safe !== undefined || v === undefined) out[k] = safe;
  }
  return out as T;
}

/** A font stack safe inside style="": family names quoted with ' instead of " (an apostrophe in one escaped). */
export function normalizeFontStack(value: string): string {
  return value.replace(/"([^"]*)"?/g, (_, name: string) => `'${name.replace(/'/g, "\\'")}'`);
}

/**
 * Normalize color fields and font stacks in a component's values. Returns
 * new objects (values can alias the caller's, e.g. a shared style constant).
 */
export function normalizeCssValues<T>(value: T, key?: string): T {
  if (typeof value === "string") {
    // (Only a stack with a double quote, and a color with a bracket, are written otherwise.)
    if (key === "fontFamily") return (value.includes('"') ? normalizeFontStack(value) : value) as T;
    return ((key === "color" || key?.endsWith("Color")) && value.includes("(") ? normalizeColor(value) : value) as T;
  }
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => normalizeCssValues(item)) as T;
  if (!isPlainObject(value)) return value;
  const out: Record<string, unknown> = {};
  // A fontFamily object ({ label, value }) holds font stacks.
  for (const k of Object.keys(value)) out[k] = normalizeCssValues(value[k], key === "fontFamily" ? key : k);
  return out as T;
}

/**
 * A design's values with each bare zero in its px lengths written `0px` (`0 0 12px` is `0px 0px 12px`), at any depth:
 * the design's schema types these as px, where CSS and the editor read `0` as `0px`. Only where every part is a px
 * length or a zero (`0 auto` and `1em 0` stay as they are); a custom tool's own values stay as it wrote them.
 */
export function pxZeros<T>(value: T, key = ""): T {
  if (typeof value === "string") return (pxKey(key) && PX_LENGTHS.test(value) ? value.replace(/(^|\s)0(?=\s|$)/g, "$10px") : value) as T;
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => pxZeros(item)) as T;
  if (!isPlainObject(value) || "slug" in value) return value;
  // A copy (the design shares no object with the defaults it's merged from), its keys in order.
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(value)) {
    const v = pxZeros(value[k], k);
    if (k === "__proto__") Object.defineProperty(out, k, { value: v, enumerable: true, writable: true, configurable: true });
    else out[k] = v;
  }
  return out as T;
}

/**
 * `values` merged over `defaults` as mergeValues merges them, as pxZeros writes the result: a copy that shares no
 * object with either, its px lengths' bare zeros `0px`. One pass, where the design is made (instead of a pass over
 * the whole design after).
 */
export function pxMerged<T>(defaults: T, values: unknown, key = ""): T {
  if (!values) return pxZeros(defaults, key);
  const d = defaults as Record<string, unknown>;
  const v = values as Record<string, unknown>;
  // (A custom tool's own values, which pxZeros leaves as they are.)
  if ("slug" in d || "slug" in v) return mergeValues(d, v) as T;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(d)) out[k] = Object.prototype.hasOwnProperty.call(v, k) ? merged(d[k], v[k], k) : pxZeros(d[k], k);
  for (const k of Object.keys(v)) if (!Object.prototype.hasOwnProperty.call(d, k)) out[k] = pxZeros(v[k], k);
  return out as T;
}

/** A value over a default, as mergeValues merges it (plain objects into each other, anything else in its place). */
const merged = (base: unknown, value: unknown, key: string) =>
  value !== null && base !== null && typeof value === "object" && typeof base === "object" && !Array.isArray(value) && !Array.isArray(base) ? pxMerged(base, value, key) : pxZeros(value, key);

/** A key the schema types as px lengths: a padding or margin, a box of them, a radius, a width, a font size. */
const PX_KEY = /(padding|margin|radius|width|spacing|fontsize)$/i;
const PX_LENGTHS = /^\s*((-?[\d.]+px|0)(\s+|$))+$/;
function pxKey(key: string): boolean {
  // (Most keys don't end in one of their last letters: g, s, h, e.)
  const last = key.charCodeAt(key.length - 1) | 32;
  return (last === 103 || last === 115 || last === 104 || last === 101) && PX_KEY.test(key);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
