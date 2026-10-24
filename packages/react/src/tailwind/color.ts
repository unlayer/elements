/**
 * Colors as email clients read them. Tailwind's palette is written in `oklch()`, and its opacity modifiers
 * (`bg-black/50`) in `color-mix()`, which no email client and few older browsers support: each color function is
 * converted to `#rrggbb`, or `rgba(r, g, b, a)` when it's translucent (the forms the exporters expect). Colors
 * outside sRGB are clipped to it, as the hex values Tailwind's documentation lists are.
 */
import { skip, split } from "./css";

/** Red, green, blue in sRGB (0–1, maybe outside it before clipping), and alpha. */
type Rgba = [number, number, number, number];

const toLinear = (c: number) => Math.sign(c) * (Math.abs(c) <= 0.04045 ? Math.abs(c) / 12.92 : ((Math.abs(c) + 0.055) / 1.055) ** 2.4);
const toGamma = (c: number) => Math.sign(c) * (Math.abs(c) <= 0.0031308 ? 12.92 * Math.abs(c) : 1.055 * Math.abs(c) ** (1 / 2.4) - 0.055);
const multiply = (m: number[][], v: number[]) => m.map((row) => row[0] * v[0] + row[1] * v[1] + row[2] * v[2]);

function oklabToRgb([l, a, b]: number[]): number[] {
  const lms = multiply(
    [
      [1, 0.3963377774, 0.2158037573],
      [1, -0.1055613458, -0.0638541728],
      [1, -0.0894841775, -1.291485548],
    ],
    [l, a, b]
  ).map((x) => x ** 3);
  return multiply(
    [
      [4.0767416621, -3.3077115913, 0.2309699292],
      [-1.2684380046, 2.6097574011, -0.3413193965],
      [-0.0041960863, -0.7034186147, 1.707614701],
    ],
    lms
  ).map(toGamma);
}

function rgbToOklab(rgb: number[]): number[] {
  const lms = multiply(
    [
      [0.4122214708, 0.5363325363, 0.0514459929],
      [0.2119034982, 0.6806995451, 0.1073969566],
      [0.0883024619, 0.2817188376, 0.6299787005],
    ],
    rgb.map(toLinear)
  ).map(Math.cbrt);
  return multiply(
    [
      [0.2104542553, 0.793617785, -0.0040720468],
      [1.9779984951, -2.428592205, 0.4505937099],
      [0.0259040371, 0.7827717662, -0.808675766],
    ],
    lms
  );
}

/** CIE Lab (D50, as CSS's `lab()`) to sRGB. */
function labToRgb([l, a, b]: number[]): number[] {
  const fy = (l + 16) / 116;
  const fx = fy + a / 500;
  const fz = fy - b / 200;
  const k = 24389 / 27;
  const e = 216 / 24389;
  const xyz = [
    ((fx ** 3 > e ? fx ** 3 : (116 * fx - 16) / k) * 0.3457) / 0.3585,
    l > k * e ? fy ** 3 : l / k,
    ((fz ** 3 > e ? fz ** 3 : (116 * fz - 16) / k) * (1 - 0.3457 - 0.3585)) / 0.3585,
  ];
  // D50 to D65 (Bradford), then XYZ to linear sRGB: CSS Color 4's matrices.
  const d65 = multiply(
    [
      [0.955473421488075, -0.02309845494876471, 0.06325924320057072],
      [-0.0283697093338637, 1.0099953980813041, 0.021041441191917323],
      [0.012314014864481998, -0.020507649298898964, 1.330365926242124],
    ],
    xyz
  );
  return multiply(
    [
      [3.2409699419045226, -1.537383177570094, -0.4986107602930034],
      [-0.9692436362808796, 1.8759675015077202, 0.04155505740717559],
      [0.05563007969699366, -0.20397695888897652, 1.0569715142428786],
    ],
    d65
  ).map(toGamma);
}

function hslToRgb(h: number, s: number, l: number): number[] {
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [f(0), f(8), f(4)];
}

/** A number, a percentage of `full`, or `none` (0). */
function number(text: string, full = 1): number {
  if (text === "none") return 0;
  const value = parseFloat(text);
  return text.endsWith("%") ? (value / 100) * full : value;
}

/** An angle in degrees. */
function angle(text: string): number {
  if (text === "none") return 0;
  const value = parseFloat(text);
  if (text.endsWith("turn")) return value * 360;
  if (text.endsWith("grad")) return value * 0.9;
  if (text.endsWith("rad")) return (value * 180) / Math.PI;
  return value;
}

const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const NAMED: Record<string, Rgba> = { transparent: [0, 0, 0, 0], black: [0, 0, 0, 1], white: [1, 1, 1, 1] };

/** A color's channels: the functions Tailwind writes, hex, and the names it uses; undefined for others. */
function parse(text: string): Rgba | undefined {
  const value = text.trim().toLowerCase();
  if (NAMED[value]) return NAMED[value];
  const hex = HEX.exec(value)?.[1];
  if (hex) {
    const [r, g, b, a = 1] = (hex.length <= 4 ? [...hex].map((d) => d + d) : hex.match(/../g)!).map((d) => parseInt(d, 16) / 255);
    return [r, g, b, a];
  }
  const open = value.indexOf("(");
  if (open < 0 || !value.endsWith(")")) return undefined;
  const name = value.slice(0, open);
  const inner = value.slice(open + 1, -1);
  if (name === "color-mix") return mix(inner);
  const [channels, slashed] = split(inner, "/");
  const parts = channels.split(/[\s,]+/).filter(Boolean);
  if (slashed === undefined && parts.length === 4) parts.length = 3;
  const alphaText = slashed?.trim() ?? split(inner, ",")[3]?.trim();
  const alpha = alphaText === undefined ? 1 : number(alphaText);
  if (parts.length !== 3) return undefined;
  const [x, y, z] = parts;
  let rgb: number[];
  if (name === "rgb" || name === "rgba") rgb = [number(x, 255), number(y, 255), number(z, 255)].map((c) => c / 255);
  else if (name === "hsl" || name === "hsla") rgb = hslToRgb(angle(x), number(y, 100) / 100, number(z, 100) / 100);
  else if (name === "hwb") {
    const [w, b] = [number(y, 100) / 100, number(z, 100) / 100];
    rgb = w + b >= 1 ? [w / (w + b), w / (w + b), w / (w + b)] : hslToRgb(angle(x), 1, 0.5).map((c) => c * (1 - w - b) + w);
  } else if (name === "oklab") rgb = oklabToRgb([number(x), number(y, 0.4), number(z, 0.4)]);
  else if (name === "oklch") {
    const [c, h] = [number(y, 0.4), (angle(z) * Math.PI) / 180];
    rgb = oklabToRgb([number(x), c * Math.cos(h), c * Math.sin(h)]);
  } else if (name === "lab") rgb = labToRgb([number(x, 100), number(y, 125), number(z, 125)]);
  else if (name === "lch") {
    const [c, h] = [number(y, 150), (angle(z) * Math.PI) / 180];
    rgb = labToRgb([number(x, 100), c * Math.cos(h), c * Math.sin(h)]);
  } else return undefined;
  return [rgb[0], rgb[1], rgb[2], Math.max(0, Math.min(1, alpha))];
}

/** `color-mix(in <space>, a [p], b [p])`, mixed in oklab (oklch, lab and lch too) or in sRGB, alpha premultiplied. */
function mix(inner: string): Rgba | undefined {
  const [space, ...colors] = split(inner, ",").map((s) => s.trim());
  if (colors.length !== 2 || !space.startsWith("in ")) return undefined;
  const stops = colors.map((stop) => {
    const percent = /\s(-?[\d.]+)%$/.exec(stop) ?? /^(-?[\d.]+)%\s/.exec(stop);
    return { color: parse(percent ? stop.replace(percent[0], " ").trim() : stop), weight: percent ? parseFloat(percent[1]) / 100 : undefined };
  });
  const [a, b] = stops;
  if (!a.color || !b.color) return undefined;
  let p = a.weight ?? (b.weight === undefined ? 0.5 : 1 - b.weight);
  let q = b.weight ?? 1 - p;
  const sum = p + q;
  if (sum <= 0) return undefined;
  [p, q] = [p / sum, q / sum];
  const linear = /srgb/.test(space) && !/oklab|oklch|lab|lch/.test(space);
  const into = (c: Rgba) => (linear ? (space.includes("linear") ? c.slice(0, 3).map(toLinear) : c.slice(0, 3)) : rgbToOklab(c.slice(0, 3)));
  const [x, y] = [into(a.color), into(b.color)];
  const alpha = a.color[3] * p + b.color[3] * q;
  const channels = x.map((c, i) => (alpha ? (c * a.color![3] * p + y[i] * b.color![3] * q) / alpha : 0));
  const rgb = linear ? (space.includes("linear") ? channels.map(toGamma) : channels) : oklabToRgb(channels);
  return [rgb[0], rgb[1], rgb[2], alpha * Math.min(1, sum)];
}

/** A color as `#rrggbb`, or `rgba(r, g, b, a)` when translucent. */
function format([r, g, b, a]: Rgba): string {
  const bytes = [r, g, b].map((c) => Math.round(Math.max(0, Math.min(1, c)) * 255));
  if (a < 1) return `rgba(${bytes.join(", ")}, ${parseFloat(a.toFixed(3))})`;
  return `#${bytes.map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

const FUNCTIONS = /\b(?:color-mix|oklch|oklab|lab|lch|rgba?|hsla?|hwb)\(/gi;

/**
 * `value` with each color function in it, and each translucent hex color (`#ff000080`, which Outlook can't read), as
 * `#rrggbb` or `rgba()`; one it can't read is left as it is.
 */
export function emailColors(value: string): string {
  value = value.replace(/#(?:[0-9a-f]{4}|[0-9a-f]{8})\b/gi, (hex) => format(parse(hex)!));
  let out = "";
  let from = 0;
  for (const match of value.matchAll(FUNCTIONS)) {
    if (match.index! < from) continue;
    const end = skip(value, match.index! + match[0].length - 1);
    const color = parse(value.slice(match.index!, end));
    if (!color) continue;
    out += value.slice(from, match.index!) + format(color);
    from = end;
  }
  return out + value.slice(from);
}

/** Whether `value` is one color (for `background`, which can hold an image too). */
export const isColor = (value: string): boolean => !!parse(value) || /^(#[0-9a-f]{3,8}|[a-z]+)$/i.test(value.trim());
