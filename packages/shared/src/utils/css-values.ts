/**
 * CSS values as the exporters can read them.
 *
 * Props accept any CSS color, but the exporters convert colors for Outlook
 * (bgcolor attributes) assuming hex or `rgba(r, g, b, a)` — the forms the
 * editor's color picker produces — so `rgb(1, 2, 3)` or `rgb(1 2 3)` came out
 * as "#NaN0203". And font stacks are written into style="" attributes, so a
 * double-quoted family name ended the attribute early.
 */

const CHANNEL = String.raw`(-?\d*\.?\d+%?)`;
const COLOR_FUNCTION = new RegExp(
  String.raw`^rgba?\(\s*${CHANNEL}\s*[,\s]\s*${CHANNEL}\s*[,\s]\s*${CHANNEL}\s*(?:[,/]\s*${CHANNEL}\s*)?\)$`,
  "i"
);

/** rgb()/rgba() in any CSS syntax → "#rrggbb", or "rgba(r, g, b, a)" when translucent. Other values pass through. */
export function normalizeColor(value: string): string {
  const match = COLOR_FUNCTION.exec(value.trim());
  if (!match) return value;
  // A number, or a percentage of `full`.
  const num = (text: string, full: number) => (text.endsWith("%") ? (Number.parseFloat(text) / 100) * full : Number.parseFloat(text));
  const [r, g, b] = [match[1], match[2], match[3]].map((text) => Math.max(0, Math.min(255, Math.round(num(text, 255)))));
  const alpha = match[4] === undefined ? 1 : num(match[4], 1);
  if (alpha < 1) return `rgba(${r}, ${g}, ${b}, ${Math.max(0, alpha)})`;
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

/** A font stack safe inside style="": family names quoted with ' instead of ". */
export function normalizeFontStack(value: string): string {
  return value.replace(/"/g, "'");
}

/**
 * Normalize colors and font stacks anywhere in a component's values. Returns
 * new objects (values can alias the caller's, e.g. a shared style constant).
 */
export function normalizeCssValues<T>(value: T, key?: string): T {
  if (typeof value === "string") return (key === "fontFamily" ? normalizeFontStack(value) : normalizeColor(value)) as T;
  if (Array.isArray(value)) return value.map((item) => normalizeCssValues(item)) as T;
  if (!isPlainObject(value)) return value;
  const out: Record<string, unknown> = {};
  // A fontFamily object ({ label, value }) holds font stacks.
  for (const [k, v] of Object.entries(value)) out[k] = normalizeCssValues(v, key === "fontFamily" ? key : k);
  return out as T;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
