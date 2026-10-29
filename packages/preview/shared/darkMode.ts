/**
 * Emulated dark mode: what an email client does to an email's colors for a
 * reader in dark mode. Clients do it two ways, and the preview shows both:
 *
 * - "partial": only light backgrounds get dark and only dark text gets light
 *   (Apple Mail, Outlook on phones); colors already readable on dark stay;
 * - "full": every background and text color has its lightness flipped (the
 *   Gmail apps, Outlook.com, Outlook on Windows in dark mode).
 *
 * Lightness is changed in OKLab, so hues stay recognizable, and images aren't
 * touched (clients don't recolor them): a dark logo on a transparent
 * background is exactly what this is for spotting.
 *
 * Shared: the preview app applies it to its frame, and `screenshot --dark`
 * loads this module into the page it captures (built as dist/dark-mode.js), so
 * both show the same colors. It runs in a browser and imports nothing.
 */

export type DarkMode = "off" | "partial" | "full";

type Rgba = [number, number, number, number];

const NAMED: Record<string, string> = {
  black: "#000000",
  white: "#ffffff",
  red: "#ff0000",
  green: "#008000",
  blue: "#0000ff",
  yellow: "#ffff00",
  orange: "#ffa500",
  purple: "#800080",
  gray: "#808080",
  grey: "#808080",
  silver: "#c0c0c0",
  navy: "#000080",
  teal: "#008080",
  maroon: "#800000",
  olive: "#808000",
  lime: "#00ff00",
  aqua: "#00ffff",
  fuchsia: "#ff00ff",
  whitesmoke: "#f5f5f5",
  gainsboro: "#dcdcdc",
  lightgray: "#d3d3d3",
  lightgrey: "#d3d3d3",
  darkgray: "#a9a9a9",
  darkgrey: "#a9a9a9",
  dimgray: "#696969",
  dimgrey: "#696969",
  snow: "#fffafa",
  ivory: "#fffff0",
  beige: "#f5f5dc",
  linen: "#faf0e6",
};

function parseHex(hex: string): Rgba | undefined {
  const h = hex.slice(1);
  const expand = h.length <= 4 ? h.split("").map((c) => c + c).join("") : h;
  if (!/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(expand)) return undefined;
  const n = (i: number) => Number.parseInt(expand.slice(i, i + 2), 16);
  return [n(0) / 255, n(2) / 255, n(4) / 255, expand.length === 8 ? n(6) / 255 : 1];
}

function channel(value: string, max: number): number {
  const v = value.trim();
  return v.endsWith("%") ? Number.parseFloat(v) / 100 : Number.parseFloat(v) / max;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)];
}

/** An sRGB color (0–1 channels and alpha) from a CSS color, or undefined for what this doesn't read (oklch(), currentColor…). */
export function parseColor(input: string): Rgba | undefined {
  const value = input.trim().toLowerCase();
  if (value.startsWith("#")) return parseHex(value);
  if (NAMED[value]) return parseHex(NAMED[value]);
  const fn = /^(rgba?|hsla?)\(([^)]*)\)$/.exec(value);
  if (!fn) return undefined;
  const parts = fn[2].split(/[\s,/]+/).filter(Boolean);
  if (parts.length < 3) return undefined;
  const alpha = parts[3] !== undefined ? channel(parts[3], 1) : 1;
  if (fn[1].startsWith("rgb")) return [channel(parts[0], 255), channel(parts[1], 255), channel(parts[2], 255), alpha];
  const [r, g, b] = hslToRgb(Number.parseFloat(parts[0]), channel(parts[1], 100), channel(parts[2], 100));
  return [r, g, b, alpha];
}

// sRGB ↔ OKLab (Björn Ottosson's published matrices).
const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLinear = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function rgbToOklab([r, g, b]: number[]): [number, number, number] {
  const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)];
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabToRgb([L, a, b]: number[]): [number, number, number] {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clamp = (c: number) => Math.min(1, Math.max(0, fromLinear(c)));
  return [
    clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

function toCss([r, g, b, alpha]: Rgba): string {
  const hex = (c: number) => Math.round(c * 255).toString(16).padStart(2, "0");
  return alpha >= 1 ? `#${hex(r)}${hex(g)}${hex(b)}` : `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${Number(alpha.toFixed(3))})`;
}

type Role = "background" | "text";

/** The color a client in dark `mode` would show for `color` used as `role`. */
export function darkColor(color: string, role: Role, mode: Exclude<DarkMode, "off">): string {
  const rgba = parseColor(color);
  if (!rgba) return color;
  const [L, a, b] = rgbToOklab(rgba);
  let next = L;
  let chroma = 1;
  if (mode === "full") {
    // Flip lightness, keeping backgrounds a little off black and text a little off white.
    next = role === "background" ? Math.max(0.16, 1 - L) : Math.min(0.94, 1 - L + 0.06);
    chroma = 0.85;
  } else if (role === "background" && L >= 0.62) {
    // Only light backgrounds: white ends near 0.2 lightness, a pale tint a little lighter.
    next = 0.2 + (1 - L) * 0.5;
    chroma = 0.85;
  } else if (role === "text" && L <= 0.5) {
    // Only dark text: black ends near 0.9.
    next = 0.9 - L * 0.3;
    chroma = 0.9;
  } else {
    return color;
  }
  const [r, g, bl] = oklabToRgb([next, a * chroma, b * chroma]);
  return toCss([r, g, bl, rgba[3]]);
}

const COLOR_TOKEN = new RegExp(`#[0-9a-f]{3,8}\\b|(?:rgba?|hsla?)\\([^)]*\\)|\\b(?:${Object.keys(NAMED).join("|")})\\b`, "gi");

function darkValue(value: string, role: Role, mode: Exclude<DarkMode, "off">): string {
  return value.replace(COLOR_TOKEN, (token) => darkColor(token, role, mode));
}

// Longhands only: a shorthand (`background`, `border-color`) reads back the longhands it sets, which would
// otherwise be changed twice.
const STYLE_ROLES: Array<[string, Role]> = [
  ["background-color", "background"],
  ["border-top-color", "background"],
  ["border-right-color", "background"],
  ["border-bottom-color", "background"],
  ["border-left-color", "background"],
  ["color", "text"],
];

const ATTRIBUTE_ROLES: Array<[string, Role]> = [
  ["bgcolor", "background"],
  ["color", "text"],
];

const ORIGINAL = "data-preview-original-";

/** Removes any emulated dark mode from `doc`, then applies `mode` (or nothing for "off"). */
export function setDarkMode(doc: Document, mode: DarkMode): void {
  const body = doc.body;
  if (!body) return;
  if ((body.getAttribute("data-preview-dark") ?? "off") === mode) return;
  for (const element of Array.from(doc.querySelectorAll<HTMLElement>("*"))) {
    for (const attribute of Array.from(element.attributes)) {
      if (!attribute.name.startsWith(ORIGINAL)) continue;
      const name = attribute.name.slice(ORIGINAL.length);
      if (name.startsWith("style-")) {
        const property = name.slice("style-".length);
        if (attribute.value) element.style.setProperty(property, attribute.value);
        else element.style.removeProperty(property);
      } else {
        element.setAttribute(name, attribute.value);
      }
      element.removeAttribute(attribute.name);
    }
  }
  body.removeAttribute("data-preview-dark");
  if (mode === "off") return;
  body.setAttribute("data-preview-dark", mode);

  // Clients start from a white page with black text when the email sets none.
  if (!body.style.backgroundColor && !body.style.background && !body.getAttribute("bgcolor")) {
    body.setAttribute(`${ORIGINAL}style-background-color`, "");
    body.style.backgroundColor = "#ffffff";
  }
  if (!body.style.color) {
    body.setAttribute(`${ORIGINAL}style-color`, "");
    body.style.color = "#000000";
  }

  for (const element of Array.from(doc.querySelectorAll<HTMLElement>("*"))) {
    for (const [property, role] of STYLE_ROLES) {
      const value = element.style.getPropertyValue(property);
      if (!value) continue;
      if (!element.hasAttribute(`${ORIGINAL}style-${property}`)) element.setAttribute(`${ORIGINAL}style-${property}`, value);
      element.style.setProperty(property, darkValue(value, role, mode), element.style.getPropertyPriority(property));
    }
    for (const [attribute, role] of ATTRIBUTE_ROLES) {
      const value = element.getAttribute(attribute);
      if (!value || (attribute === "color" && element.tagName !== "FONT")) continue;
      element.setAttribute(`${ORIGINAL}${attribute}`, value);
      element.setAttribute(attribute, darkValue(value, role, mode));
    }
  }
}
