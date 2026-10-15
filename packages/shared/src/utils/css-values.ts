/**
 * CSS values as the exporters can read them.
 *
 * Props accept any CSS color, but the exporters convert colors for Outlook
 * (bgcolor attributes) assuming hex or `rgba(r, g, b, a)` — the forms the
 * editor's color picker produces — so `rgb(1, 2, 3)` or `rgb(1 2 3)` came out
 * as "#NaN0203". And font stacks are written into style="" attributes, so a
 * double-quoted family name ended the attribute early.
 */

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
  if (typeof value === "string") return (key === "fontFamily" ? normalizeFontStack(value) : key === "color" || key?.endsWith("Color") ? normalizeColor(value) : value) as T;
  if (Array.isArray(value)) return value.map((item) => normalizeCssValues(item)) as T;
  if (!isPlainObject(value)) return value;
  const out: Record<string, unknown> = {};
  // A fontFamily object ({ label, value }) holds font stacks.
  for (const [k, v] of Object.entries(value)) out[k] = normalizeCssValues(v, key === "fontFamily" ? key : k);
  return out as T;
}

/**
 * A design's values with each bare zero in its px lengths written `0px` (`0 0 12px` is `0px 0px 12px`), at any depth:
 * the design's schema types these as px, where CSS and the editor read `0` as `0px`. Only where every part is a px
 * length or a zero (`0 auto` and `1em 0` stay as they are); a custom tool's own values stay as it wrote them.
 */
export function pxZeros<T>(value: T, key = ""): T {
  // (A key the schema types as px lengths: a padding or margin, a box of them, a radius, a width, a font size.)
  if (typeof value === "string") return (/(padding|margin|radius|width|spacing|fontsize)$/i.test(key) && /^\s*((-?[\d.]+px|0)(\s+|$))+$/.test(value) ? value.replace(/(^|\s)0(?=\s|$)/g, "$10px") : value) as T;
  if (Array.isArray(value)) return value.map((item) => pxZeros(item)) as T;
  if (!isPlainObject(value) || "slug" in value) return value;
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, pxZeros(v, k)])) as T;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
