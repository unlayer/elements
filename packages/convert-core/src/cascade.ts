/**
 * The styles a reader sees on each word of an email, worked out without a
 * browser: inline styles, the document's `<style>` rules that apply at a
 * desktop width, the browser's defaults and inheritance. Only what the
 * converters promise to keep is computed (size, weight, italics, letter case,
 * underline, color, the background behind the text, a link's target, and
 * whether the text shows at all). Anything this can't work out for sure (a
 * selector or value it doesn't know) is unknown, never different: a style
 * difference it reports is one a browser shows.
 */
import { parse, type DefaultTreeAdapterMap } from "parse5";
import { isInvalid } from "./validity";

type Node = DefaultTreeAdapterMap["node"];
type Element = DefaultTreeAdapterMap["element"];
type ParentNode = DefaultTreeAdapterMap["parentNode"];

/** The width the check reads a document at: a desktop inbox. */
export const DESKTOP_WIDTH = 700;

export type Rgba = [number, number, number, number];

/** A word's style; a property set to `undefined` is unknown. */
export interface WordStyle {
  size?: number;
  bold?: boolean;
  italic?: boolean;
  transform?: string;
  underline?: boolean;
  /** The first font family (lowercase); undefined when none is set. */
  font?: string;
  /** Struck through (a line-through drawn over it). */
  strike?: boolean;
  color?: Rgba;
  background?: Rgba;
  /** A `url()` image is behind it: the background color is then unknown, but losing the image isn't. */
  image?: boolean;
  /** Behind a gradient that fades: the colors it may be on (`background` is then undefined). */
  backgrounds?: Rgba[];
  /** Behind an image: the color its box sets under it, what shows where images don't load (none set: unknown). */
  underImage?: Rgba;
  /** The target of the link the word is in ("_self" when the link sets none); absent outside links. */
  target?: string;
  /** Why each unknown property is unknown (the rule, query or value this couldn't read). */
  causes?: Partial<Record<(typeof STYLE_PROPERTIES)[number], string>>;
}

export const STYLE_PROPERTIES = ["size", "bold", "italic", "transform", "underline", "strike", "color", "background", "font", "target"] as const;

export interface StyledWord {
  word: string;
  style: WordStyle;
  /** False for the preview text: inboxes list it, but it isn't shown, so its styles aren't compared. */
  shown: boolean;
  /** Whether it's hidden can't be told: why (a rule or value this can't read). It's read as shown. */
  doubt?: string;
  /** The element its text is in. */
  at?: Element;
  /** It starts a line: after a `<br>`, or first in a box that starts one (a paragraph, a row; not a cell). */
  lineStart?: boolean;
}

/** A link or image a reader gets, with the words or image text it carries (for links). */
export interface Target {
  kind: "href" | "src" | "alt";
  value: string;
  /** For a link: the words in it, or its images' URLs and text when it has no words. */
  label?: string;
  /** Whether it shows can't be told: why (a rule or value this can't read). */
  doubt?: string;
}

// ============================================
// CSS values
// ============================================

/** The CSS named colors, all 148. */
const NAMED: Record<string, string> = {
  aliceblue: "f0f8ff", antiquewhite: "faebd7", aqua: "00ffff", aquamarine: "7fffd4", azure: "f0ffff",
  beige: "f5f5dc", bisque: "ffe4c4", black: "000000", blanchedalmond: "ffebcd", blue: "0000ff",
  blueviolet: "8a2be2", brown: "a52a2a", burlywood: "deb887", cadetblue: "5f9ea0", chartreuse: "7fff00",
  chocolate: "d2691e", coral: "ff7f50", cornflowerblue: "6495ed", cornsilk: "fff8dc", crimson: "dc143c",
  cyan: "00ffff", darkblue: "00008b", darkcyan: "008b8b", darkgoldenrod: "b8860b", darkgray: "a9a9a9",
  darkgreen: "006400", darkgrey: "a9a9a9", darkkhaki: "bdb76b", darkmagenta: "8b008b",
  darkolivegreen: "556b2f", darkorange: "ff8c00", darkorchid: "9932cc", darkred: "8b0000",
  darksalmon: "e9967a", darkseagreen: "8fbc8f", darkslateblue: "483d8b", darkslategray: "2f4f4f",
  darkslategrey: "2f4f4f", darkturquoise: "00ced1", darkviolet: "9400d3", deeppink: "ff1493",
  deepskyblue: "00bfff", dimgray: "696969", dimgrey: "696969", dodgerblue: "1e90ff", firebrick: "b22222",
  floralwhite: "fffaf0", forestgreen: "228b22", fuchsia: "ff00ff", gainsboro: "dcdcdc", ghostwhite: "f8f8ff",
  gold: "ffd700", goldenrod: "daa520", gray: "808080", green: "008000", greenyellow: "adff2f", grey: "808080",
  honeydew: "f0fff0", hotpink: "ff69b4", indianred: "cd5c5c", indigo: "4b0082", ivory: "fffff0",
  khaki: "f0e68c", lavender: "e6e6fa", lavenderblush: "fff0f5", lawngreen: "7cfc00", lemonchiffon: "fffacd",
  lightblue: "add8e6", lightcoral: "f08080", lightcyan: "e0ffff", lightgoldenrodyellow: "fafad2",
  lightgray: "d3d3d3", lightgreen: "90ee90", lightgrey: "d3d3d3", lightpink: "ffb6c1", lightsalmon: "ffa07a",
  lightseagreen: "20b2aa", lightskyblue: "87cefa", lightslategray: "778899", lightslategrey: "778899",
  lightsteelblue: "b0c4de", lightyellow: "ffffe0", lime: "00ff00", limegreen: "32cd32", linen: "faf0e6",
  magenta: "ff00ff", maroon: "800000", mediumaquamarine: "66cdaa", mediumblue: "0000cd",
  mediumorchid: "ba55d3", mediumpurple: "9370db", mediumseagreen: "3cb371", mediumslateblue: "7b68ee",
  mediumspringgreen: "00fa9a", mediumturquoise: "48d1cc", mediumvioletred: "c71585", midnightblue: "191970",
  mintcream: "f5fffa", mistyrose: "ffe4e1", moccasin: "ffe4b5", navajowhite: "ffdead", navy: "000080",
  oldlace: "fdf5e6", olive: "808000", olivedrab: "6b8e23", orange: "ffa500", orangered: "ff4500",
  orchid: "da70d6", palegoldenrod: "eee8aa", palegreen: "98fb98", paleturquoise: "afeeee",
  palevioletred: "db7093", papayawhip: "ffefd5", peachpuff: "ffdab9", peru: "cd853f", pink: "ffc0cb",
  plum: "dda0dd", powderblue: "b0e0e6", purple: "800080", rebeccapurple: "663399", red: "ff0000",
  rosybrown: "bc8f8f", royalblue: "4169e1", saddlebrown: "8b4513", salmon: "fa8072", sandybrown: "f4a460",
  seagreen: "2e8b57", seashell: "fff5ee", sienna: "a0522d", silver: "c0c0c0", skyblue: "87ceeb",
  slateblue: "6a5acd", slategray: "708090", slategrey: "708090", snow: "fffafa", springgreen: "00ff7f",
  steelblue: "4682b4", tan: "d2b48c", teal: "008080", thistle: "d8bfd8", tomato: "ff6347", turquoise: "40e0d0",
  violet: "ee82ee", wheat: "f5deb3", white: "ffffff", whitesmoke: "f5f5f5", yellow: "ffff00",
  yellowgreen: "9acd32"
};

/** A CSS color as RGBA, `transparent` included; undefined when it isn't one this knows. */
export function parseColor(value: string): Rgba | undefined {
  const v = value.trim().toLowerCase();
  if (v === "transparent") return [0, 0, 0, 0];
  const named = NAMED[v];
  const hex = named ?? (/^#([0-9a-f]{3,8})$/.exec(v)?.[1]);
  if (hex) {
    const full = hex.length <= 4 ? [...hex].map((c) => c + c).join("") : hex;
    if (full.length !== 6 && full.length !== 8) return undefined;
    const n = (i: number) => parseInt(full.slice(i, i + 2), 16);
    return [n(0), n(2), n(4), full.length === 8 ? n(6) / 255 : 1];
  }
  const fn = /^(rgba?|hsla?)\(([^)]*)\)$/.exec(v);
  if (!fn) return undefined;
  const parts = fn[2].split(/[\s,/]+/).filter(Boolean);
  if (parts.length < 3 || parts.length > 4) return undefined;
  const alpha = parts[3] === undefined ? 1 : parts[3].endsWith("%") ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
  if (!Number.isFinite(alpha)) return undefined;
  if (fn[1].startsWith("rgb")) {
    const channel = (p: string) => (p.endsWith("%") ? (parseFloat(p) * 255) / 100 : parseFloat(p));
    const rgb = parts.slice(0, 3).map(channel);
    return rgb.every(Number.isFinite) ? [rgb[0], rgb[1], rgb[2], alpha] : undefined;
  }
  const h = parseFloat(parts[0]), s = parseFloat(parts[1]) / 100, l = parseFloat(parts[2]) / 100;
  if (![h, s, l].every(Number.isFinite)) return undefined;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => 255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)));
  return [f(0), f(8), f(4), alpha];
}

/** `top` painted over `bottom`. */
function over(top: Rgba, bottom: Rgba): Rgba {
  const a = top[3] + bottom[3] * (1 - top[3]);
  if (!a) return [0, 0, 0, 0];
  const c = (i: number) => (top[i] * top[3] + bottom[i] * bottom[3] * (1 - top[3])) / a;
  return [c(0), c(1), c(2), a];
}

const KEYWORD_SIZES: Record<string, number> = { "xx-small": 9, "x-small": 10, small: 13, medium: 16, large: 18, "x-large": 24, "xx-large": 32, "xxx-large": 48 };

/** A font size in px, given the parent's; undefined when unknown (calc, var, viewport units). */
function fontSize(value: string, parent: number | undefined, root: number): number | undefined {
  const v = value.trim().toLowerCase();
  if (v in KEYWORD_SIZES) return KEYWORD_SIZES[v];
  if (parent === undefined) return undefined;
  if (v === "smaller") return parent / 1.2;
  if (v === "larger") return parent * 1.2;
  const m = /^(-?[\d.]+)(px|em|rem|%|pt)?$/.exec(v);
  if (!m) return undefined;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n)) return undefined;
  switch (m[2]) {
    case "em": return n * parent;
    case "rem": return n * root;
    case "%": return (n * parent) / 100;
    case "pt": return (n * 4) / 3;
    case "px": return n;
    default: return n === 0 ? 0 : undefined;
  }
}

/** A font weight as a number, given the parent's. */
function fontWeight(value: string, parent: number | undefined): number | undefined {
  const v = value.trim().toLowerCase();
  if (v === "normal") return 400;
  if (v === "bold") return 700;
  if (v === "bolder") return parent === undefined ? undefined : parent < 350 ? 400 : parent < 550 ? 700 : 900;
  if (v === "lighter") return parent === undefined ? undefined : parent < 550 ? 100 : parent < 750 ? 400 : 700;
  const n = Number(v);
  return Number.isFinite(n) && n >= 1 && n <= 1000 ? n : undefined;
}

/** A length in px; undefined for anything else (`auto`, %, calc). */
function lengthPx(value: string): number | undefined {
  const m = /^(-?[\d.]+)(px)?$/.exec(value.trim().toLowerCase());
  return m && (m[2] || parseFloat(m[1]) === 0) ? parseFloat(m[1]) : undefined;
}

// ============================================
// Stylesheets
// ============================================

interface Declaration {
  property: string;
  value: string;
  important: boolean;
}

type Combinator = " " | ">" | "+" | "~";
interface Compound {
  tag?: string;
  id?: string;
  classes: string[];
  attributes: Array<{ name: string; op?: string; value?: string }>;
  /** Structural pseudo-classes this knows (`first-child`, `nth-child(2n+1)`, `root`, …). */
  pseudo: string[];
  /** `:not(…)` of compounds this can read: none of them may match. */
  not: Compound[];
  /** A pseudo-class this can't evaluate (`:has(…)`): the compound may or may not match. */
  maybe: boolean;
  /** It names `::first-line` or `::first-letter`: part of the element's text. */
  partial?: boolean;
  /** `:is(…)`/`:where(…)`: each group matches when one of its compounds does. */
  any?: Compound[][];
}
interface Selector {
  /** Right to left: each compound and the combinator that relates it to the next one (to its left). */
  parts: Array<{ compound: Compound; combinator?: Combinator }>;
  specificity: [number, number, number];
  /** `::first-line`, `::first-letter`: it styles part of the element's text, whatever the element's own style says. */
  partial?: boolean;
}

interface Rule {
  selectors: Selector[];
  /** A selector this can't read at all: the rule's properties are unknown on every element. */
  unknownSelector: boolean;
  /** The rule's media apply at the width read (yes), or can't be told (unknown); rules that never apply aren't kept. */
  media: "yes" | "unknown";
  declarations: Declaration[];
  order: number;
  /** Where it's written, to say why a property is unknown: its selector, and the query or nesting around it. */
  source: string;
}

const DYNAMIC_PSEUDO = /^(hover|focus|focus-within|focus-visible|active|visited|target|checked|disabled|placeholder-shown|autofill)$/;
const IGNORED_PSEUDO_ELEMENT = /^(before|after|placeholder|selection|marker|-webkit-[\w-]+|-moz-[\w-]+)$/;
// Identifiers take any non-ASCII character too (`.sólo-móvil`), as CSS does.
const SIMPLE = /\[[^\]]*\]|::?[\w-]+(?:\((?:[^()]|\([^)]*\))*\))?|[#.](?:[\w\u00a0-\uffff-]|\\.)+|(?:[\w\u00a0-\uffff-]|\\.)+|\*/g;

/** A CSS identifier with its escapes resolved (`sm\:w-full` → `sm:w-full`). */
function unescape(ident: string): string {
  return ident.replace(/\\([0-9a-f]{1,6}\s?|.)/gi, (_, c: string) => {
    if (!(/^[0-9a-f]{1,6}\s?$/i.test(c) && c.trim().length > 1)) return c;
    const code = parseInt(c, 16);
    // Zero, a surrogate or past the last code point: the replacement character, as CSS reads it.
    return code === 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff) ? "\ufffd" : String.fromCodePoint(code);
  });
}

/** About how specific a selector argument this can't read could be: its ids, classes, attributes and pseudo-classes, and tags. */
function roughSpecificity(text: string): [number, number, number] {
  let most: [number, number, number] = [0, 0, 0];
  for (const part of splitTopLevel(text)) {
    const p = part.replace(/\([^)]*\)/g, "()");
    const own: [number, number, number] = [(p.match(/#/g) ?? []).length, (p.match(/\.|\[|(?<!:):(?!:)/g) ?? []).length, (p.match(/(?:^|[\s>+~(])[a-z][\w-]*/gi) ?? []).length];
    if (compare(own, most) > 0) most = own;
  }
  return most;
}

/**
 * A selector; `null` when it never matches a static render (`:hover`);
 * "unknown" when it's valid CSS this can't read; "invalid" when the browser
 * drops it (and the rule with it): `.footer &gt; p`, which React writes for
 * `.footer > p` in a `<style>`.
 */
function parseSelector(text: string): Selector | null | "unknown" | "invalid" {
  if (/[&;{}<]/.test(text.replace(/\\./g, "").replace(/"[^"]*"|'[^']*'/g, ""))) return "invalid";
  // Compounds and the combinators between them, in source order.
  const items: string[] = [];
  let current = "";
  let pending: string | undefined;
  let depth = 0;
  const src = text.trim();
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === "\\") {
      current += c + (src[i + 1] ?? "");
      i++;
      continue;
    }
    if (c === "[" || c === "(") depth++;
    if (c === "]" || c === ")") depth--;
    if (!depth && (c === " " || c === ">" || c === "+" || c === "~" || c === "\n" || c === "\t")) {
      if (current) {
        items.push(current);
        current = "";
        pending = /\s/.test(c) ? " " : c;
      } else if (!/\s/.test(c)) {
        if (!items.length) return "invalid";
        pending = c;
      }
      continue;
    }
    if (pending !== undefined) {
      items.push(pending);
      pending = undefined;
    }
    current += c;
  }
  if (current) items.push(current);
  if (!items.length || items.length % 2 === 0) return "invalid";
  const specificity: [number, number, number] = [0, 0, 0];
  const parts: Selector["parts"] = [];
  for (let i = items.length - 1; i >= 0; i -= 2) {
    const compound = parseCompound(items[i], specificity);
    if (compound === null || compound === "unknown" || compound === "invalid") return compound;
    parts.push({ compound, combinator: i > 0 ? (items[i - 1] as Combinator) : undefined });
  }
  return { parts, specificity, ...(parts[0]?.compound.partial ? { partial: true } : {}) };
}

const STRUCTURAL = /^(first-child|last-child|only-child|first-of-type|last-of-type|only-of-type|root|empty|nth-child\(.*\)|nth-last-child\(.*\)|nth-of-type\(.*\)|nth-last-of-type\(.*\))$/;

/** One compound (`p.note:first-child`), adding to `specificity`. */
function parseCompound(text: string, specificity: [number, number, number]): Compound | null | "unknown" | "invalid" {
  const tokens = text.match(SIMPLE);
  if (!tokens || tokens.join("") !== text) return "invalid";
  const compound: Compound = { classes: [], attributes: [], pseudo: [], not: [], maybe: false };
  for (const token of tokens) {
    if (token === "*") continue;
    if (token.startsWith("::")) {
      if (IGNORED_PSEUDO_ELEMENT.test(token.slice(2))) return null;
      if (/^first-(line|letter)$/i.test(token.slice(2))) compound.partial = true;
      else compound.maybe = true;
      continue;
    }
    if (token.startsWith(":")) {
      const name = /^:([\w-]+)/.exec(token)![1].toLowerCase();
      const argument = /^:[\w-]+\((.*)\)$/s.exec(token)?.[1];
      if (DYNAMIC_PSEUDO.test(name)) return null;
      if (/^(is|where|matches|-webkit-any|-moz-any)$/.test(name) && argument !== undefined) {
        // Matches when one argument does; as specific as its most specific argument (`:where` adds nothing).
        // An argument the browser can't read is left out (these lists forgive it); one with a combinator may match.
        const group: Compound[] = [];
        let most: [number, number, number] = [0, 0, 0];
        for (const inner of splitTopLevel(argument)) {
          const own: [number, number, number] = [0, 0, 0];
          const parsed = /[\s>+~]/.test(inner.trim()) ? "unknown" : parseCompound(inner.trim(), own);
          if (parsed === "invalid" || parsed === null) continue;
          if (parsed === "unknown") {
            compound.maybe = true;
            const rough = roughSpecificity(inner);
            if (compare(rough, most) > 0) most = rough;
            continue;
          }
          group.push(parsed);
          if (compare(own, most) > 0) most = own;
        }
        if (name !== "where") most.forEach((n, k) => (specificity[k] += n));
        (compound.any ??= []).push(group);
        continue;
      }
      if (name === "not" && argument !== undefined) {
        // `:not(.a, p.b)`: compounds this can read; anything else (a combinator) may or may not match.
        // Its specificity is its most specific argument's.
        let most: [number, number, number] = [0, 0, 0];
        for (const inner of splitTopLevel(argument)) {
          const own: [number, number, number] = [0, 0, 0];
          const parsed = /[\s>+~]/.test(inner.trim()) ? "unknown" : parseCompound(inner.trim(), own);
          if (parsed === "invalid") return "invalid";
          if (parsed === "unknown" || parsed === null) compound.maybe = true;
          else compound.not.push(parsed);
          if (compare(own, most) > 0) most = own;
        }
        most.forEach((n, k) => (specificity[k] += n));
        continue;
      }
      const pseudo = argument === undefined ? name : `${name}(${argument.replace(/\s+/g, "")})`;
      const structural = STRUCTURAL.test(pseudo) && (argument === undefined || nth(argument) !== undefined);
      // `:has(#a .b)` is as specific as its argument: one this can't evaluate counts as that specific.
      if (!structural && argument !== undefined && name !== "lang" && name !== "dir") roughSpecificity(argument).forEach((n, k) => (specificity[k] += n));
      else specificity[1]++;
      if (name === "link" || name === "any-link") compound.attributes.push({ name: "href" });
      else if (structural) compound.pseudo.push(pseudo);
      else compound.maybe = true;
      continue;
    }
    if (token.startsWith("[")) {
      const m = /^\[\s*([\w-]+)\s*(?:([~|^$*]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\s\]]+))\s*)?(?:[is])?\s*\]$/.exec(token);
      if (!m) return "unknown";
      compound.attributes.push({ name: m[1].toLowerCase(), op: m[2], value: m[3] ?? m[4] ?? m[5] });
      specificity[1]++;
    } else if (token.startsWith("#")) {
      compound.id = unescape(token.slice(1));
      specificity[0]++;
    } else if (token.startsWith(".")) {
      compound.classes.push(unescape(token.slice(1)));
      specificity[1]++;
    } else {
      compound.tag = unescape(token).toLowerCase();
      specificity[2]++;
    }
  }
  return compound;
}

/** `an+b` (`odd`, `even`, `3`, `-n+2`) as [a, b]; undefined for what this doesn't read (`of S`). */
function nth(text: string): [number, number] | undefined {
  const t = text.replace(/\s+/g, "").toLowerCase();
  if (t === "odd") return [2, 1];
  if (t === "even") return [2, 0];
  const m = /^([+-]?\d*)n([+-]\d+)?$/.exec(t);
  if (m) return [m[1] === "" || m[1] === "+" ? 1 : m[1] === "-" ? -1 : Number(m[1]), m[2] ? Number(m[2]) : 0];
  return /^[+-]?\d+$/.test(t) ? [0, Number(t)] : undefined;
}

/** Whether position `index` (1-based) is one of `an+b`. */
function nthMatches([a, b]: [number, number], index: number): boolean {
  if (a === 0) return index === b;
  const n = (index - b) / a;
  return Number.isInteger(n) && n >= 0;
}

function parseDeclarations(text: string): Declaration[] {
  const out: Declaration[] = [];
  for (const piece of text.replace(/\/\*[\s\S]*?\*\//g, "").split(/;(?![^(]*\))/)) {
    const colon = piece.indexOf(":");
    if (colon < 0) continue;
    const property = piece.slice(0, colon).trim().toLowerCase();
    let value = piece.slice(colon + 1).trim();
    const important = /!\s*important\s*$/i.test(value);
    if (important) value = value.replace(/!\s*important\s*$/i, "").trim();
    if (property && value) out.push({ property, value, important });
  }
  return out;
}

/** A length in a media query, in px (em and rem are 16px there). */
function queryPx(text: string): number | undefined {
  const m = /^([\d.]+)(px|em|rem)?$/.exec(text.trim());
  return m ? parseFloat(m[1]) * (m[2] === "em" || m[2] === "rem" ? 16 : 1) : undefined;
}

/** `width >= 40rem`, `400px <= width < 700px`: whether it holds at `width`, undefined when this can't read it. */
function widthRange(feature: string, width: number): boolean | undefined {
  const parts = feature.split(/(<=|>=|<|>|=)/).map((p) => p.trim());
  if (!parts.includes("width") || parts.length < 3) return undefined;
  const test = (left: number, op: string, right: number) =>
    op === "<" ? left < right : op === "<=" ? left <= right : op === ">" ? left > right : op === ">=" ? left >= right : left === right;
  for (let i = 1; i < parts.length; i += 2) {
    const a = parts[i - 1] === "width" ? width : queryPx(parts[i - 1]);
    const b = parts[i + 1] === "width" ? width : queryPx(parts[i + 1]);
    if (a === undefined || b === undefined) return undefined;
    if (!test(a, parts[i], b)) return false;
  }
  return true;
}

/** Whether a media query list applies at `width` (desktop: 700px; phones: 375px). */
function mediaApplies(query: string, width: number): "yes" | "no" | "unknown" {
  let any: "no" | "unknown" = "no";
  for (const single of query.toLowerCase().split(",")) {
    const q = single.trim();
    if (!q) continue;
    if (/^not\b/.test(q)) {
      any = "unknown";
      continue;
    }
    const type = /^(?:only\s+)?(all|screen|print|speech)\b/.exec(q)?.[1];
    if (type === "print" || type === "speech") continue;
    let result: "yes" | "no" | "unknown" = "yes";
    for (const [, feature] of q.matchAll(/\(([^)]*)\)/g)) {
      const [name, raw] = feature.split(":").map((s) => s.trim());
      const px = raw === undefined ? undefined : queryPx(raw);
      const range = raw === undefined ? widthRange(feature, width) : undefined;
      if (name === "prefers-color-scheme") {
        if (raw === "dark") result = "no";
      } else if (/^(min|max)-(device-)?width$/.test(name) && px !== undefined) {
        // The device's width is read as the window's: a phone's screen, or a desktop at least this wide.
        if (name.startsWith("min") ? width < px : width > px) result = "no";
      } else if (name === "orientation" && (raw === "portrait" || raw === "landscape") && width <= 480) {
        // A phone held upright.
        if (raw === "landscape") result = "no";
      } else if (range !== undefined) {
        if (!range) result = "no";
      } else if (result === "yes") {
        result = "unknown";
      }
      if (result === "no") break;
    }
    if (result === "yes") return "yes";
    if (result === "unknown") any = "unknown";
  }
  return any;
}

/**
 * Screen widths above the desktop width read where the `@media` rules of
 * these documents apply otherwise than there (Tailwind's `md:` at 768px,
 * `lg:` at 1024px): the narrowest width of each such set of rules.
 */
export function widerScreens(...htmls: string[]): number[] {
  const queries = [...new Set(htmls.flatMap((html) => [...html.matchAll(/@media\b([^{]*)\{/gi)].map((m) => m[1].trim())))];
  const thresholds = new Set<number>();
  for (const query of queries) {
    for (const [length] of query.matchAll(/[\d.]+(?:px|em|rem)?/gi)) {
      const px = queryPx(length.toLowerCase());
      // Where a `min-width` starts to apply, and just past where a `max-width` stops.
      if (px !== undefined && px >= DESKTOP_WIDTH) thresholds.add(Math.ceil(px)).add(Math.floor(px) + 1);
    }
  }
  const applying = (width: number) => queries.map((query) => mediaApplies(query, width)).join();
  const seen = new Set([applying(DESKTOP_WIDTH)]);
  return [...thresholds].sort((a, b) => a - b).filter((width) => !seen.has(applying(width)) && Boolean(seen.add(applying(width))));
}

// At-rules whose contents don't style the page's text, or don't apply to it.
const NOT_STYLING = /^(font-face|keyframes|-webkit-keyframes|-moz-keyframes|page|import|charset|namespace|font-feature-values|counter-style|property|font-palette-values)$/;

/**
 * The rules of a stylesheet that may apply at `width`, in order. Each records
 * where it's written; what this can't read applies "unknown" (it may or may not).
 */
function parseStylesheet(css: string, rules: Rule[], width: number, media: "yes" | "unknown" = "yes", context = ""): void {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const block of blocks(text)) {
    // `<!--` and `-->` between a stylesheet's rules are ignored (old pages hid CSS from browsers that showed it).
    const prelude = context ? block.prelude : block.prelude.replace(/^(?:\s*(?:<!--|-->))+\s*/, "");
    const { body } = block;
    if (prelude.startsWith("@")) {
      const at = /^@([\w-]+)\s*(.*)$/s.exec(prelude);
      const name = at?.[1].toLowerCase() ?? "";
      if (name === "media") {
        const applies = mediaApplies(at![2], width);
        if (applies !== "no") parseStylesheet(body, rules, width, applies === "unknown" || media === "unknown" ? "unknown" : "yes", `${context}@media ${at![2].trim()} `);
      } else if (!NOT_STYLING.test(name)) {
        // `@supports`, `@layer`, `@container`, …: their rules may or may not apply.
        parseStylesheet(body, rules, width, "unknown", `${context}@${name} ${at?.[2].trim() ?? ""} `);
      }
      continue;
    }
    const selectors: Selector[] = [];
    let unknownSelector = false;
    let invalid = false;
    for (const part of splitTopLevel(prelude)) {
      const selector = parseSelector(part);
      if (selector === "invalid") invalid = true;
      else if (selector === "unknown") unknownSelector = true;
      else if (selector) selectors.push(selector);
    }
    // One selector the browser can't read drops the whole rule.
    if (invalid || (!selectors.length && !unknownSelector)) continue;
    const { declarations, nested } = splitBody(body);
    rules.push({ selectors, unknownSelector, media, declarations: parseDeclarations(declarations), order: rules.length, source: `${context}${prelude}` });
    // Nested blocks (React Email writes Tailwind's `sm:` as `.sm_block{@media (width>=40rem){display:block}}`).
    for (const inner of nested) {
      const at = /^@media\s*(.*)$/is.exec(inner.prelude);
      if (at) {
        const applies = mediaApplies(at[1], width);
        if (applies === "no") continue;
        const both = applies === "unknown" || media === "unknown" ? "unknown" : "yes";
        rules.push({ selectors, unknownSelector, media: both, declarations: parseDeclarations(splitBody(inner.body).declarations), order: rules.length, source: `${context}${prelude} @media ${at[1].trim()}` });
      } else if (/^&\s*:+([\w-]+)/.test(inner.prelude) && DYNAMIC_PSEUDO.test(/^&\s*:+([\w-]+)/.exec(inner.prelude)![1].toLowerCase())) {
        continue; // `&:hover`: never in a static render
      } else {
        // Another nested rule (`& .child`, `@supports`): its properties may apply to anything the rule's selectors reach or below.
        rules.push({ selectors: [], unknownSelector: true, media, declarations: parseDeclarations(splitBody(inner.body).declarations), order: rules.length, source: `${context}${prelude} ${inner.prelude}` });
      }
    }
  }
}

/** The top-level blocks of CSS text: each `prelude { body }`, statements (`@import …;`) skipped. */
function blocks(text: string): Array<{ prelude: string; body: string }> {
  const out: Array<{ prelude: string; body: string }> = [];
  let i = 0;
  while (i < text.length) {
    const open = text.indexOf("{", i);
    if (open < 0) break;
    let depth = 1;
    let j = open + 1;
    for (; j < text.length && depth; j++) depth += text[j] === "{" ? 1 : text[j] === "}" ? -1 : 0;
    // Statements before it (`@import …;`) end at `;`; any other `;` is part of the selector (`&gt;`), which makes it invalid.
    const parts = text.slice(i, open).split(";");
    const statements = parts.slice(0, -1).every((part) => !part.trim() || part.trim().startsWith("@"));
    const prelude = (statements ? parts[parts.length - 1] : parts.join(";")).trim();
    out.push({ prelude, body: text.slice(open + 1, j - 1) });
    i = j;
  }
  return out;
}

/** A rule's body: its own declarations, and the blocks nested in it. */
function splitBody(body: string): { declarations: string; nested: Array<{ prelude: string; body: string }> } {
  if (!body.includes("{")) return { declarations: body, nested: [] };
  let declarations = "";
  const nested: Array<{ prelude: string; body: string }> = [];
  let start = 0;
  let i = 0;
  while (i < body.length) {
    const open = body.indexOf("{", i);
    if (open < 0) break;
    // The nested block's prelude starts after the last declaration before it.
    const before = body.slice(start, open);
    const cut = before.lastIndexOf(";");
    declarations += before.slice(0, cut + 1);
    let depth = 1;
    let j = open + 1;
    for (; j < body.length && depth; j++) depth += body[j] === "{" ? 1 : body[j] === "}" ? -1 : 0;
    nested.push({ prelude: before.slice(cut + 1).trim(), body: body.slice(open + 1, j - 1) });
    start = i = j;
  }
  declarations += body.slice(start);
  return { declarations, nested };
}

function splitTopLevel(text: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "(" || c === "[") depth++;
    else if (c === ")" || c === "]") depth--;
    else if (c === "," && !depth) {
      out.push(text.slice(start, i));
      start = i + 1;
    }
  }
  out.push(text.slice(start));
  return out.map((s) => s.trim()).filter(Boolean);
}

// ============================================
// Matching
// ============================================

export function attr(element: Element, name: string): string | undefined {
  return element.attrs.find((a) => a.name === name)?.value;
}

export function isElement(node: Node | null | undefined): node is Element {
  return !!node && "tagName" in node;
}

function elementSiblingsBefore(element: Element): Element[] {
  const parent = element.parentNode as ParentNode | null;
  if (!parent) return [];
  const siblings = parent.childNodes.filter(isElement);
  return siblings.slice(0, siblings.indexOf(element));
}

type Match = "yes" | "no" | "maybe";

function matchesCompound(element: Element, compound: Compound): Match {
  if (compound.tag && element.tagName !== compound.tag) return "no";
  if (compound.id && attr(element, "id") !== compound.id) return "no";
  if (compound.classes.length) {
    const classes = new Set((attr(element, "class") ?? "").split(/\s+/));
    if (!compound.classes.every((c) => classes.has(c))) return "no";
  }
  for (const a of compound.attributes) {
    const value = attr(element, a.name);
    if (value === undefined) return "no";
    if (!a.op || a.value === undefined) continue;
    const ok =
      a.op === "=" ? value === a.value
      : a.op === "~=" ? value.split(/\s+/).includes(a.value)
      : a.op === "^=" ? value.startsWith(a.value)
      : a.op === "$=" ? value.endsWith(a.value)
      : a.op === "*=" ? value.includes(a.value)
      : value === a.value || value.startsWith(`${a.value}-`);
    if (!ok) return "no";
  }
  for (const p of compound.pseudo) {
    const parent = element.parentNode as ParentNode | null;
    const siblings = parent ? parent.childNodes.filter(isElement) : [element];
    const typed = siblings.filter((e) => e.tagName === element.tagName);
    const name = /^[\w-]+/.exec(p)![0];
    const argument = /\((.*)\)$/.exec(p)?.[1];
    const list = name.endsWith("of-type") ? typed : siblings;
    const index = name.includes("last") ? list.length - list.indexOf(element) : list.indexOf(element) + 1;
    if (name === "root") {
      if (element.tagName !== "html") return "no";
    } else if (name === "empty") {
      if (element.childNodes.some((c) => isElement(c) || ("value" in c && String((c as { value: string }).value) !== ""))) return "no";
    } else if (name.startsWith("only")) {
      if (list.length !== 1) return "no";
    } else if (argument !== undefined) {
      if (!nthMatches(nth(argument)!, index)) return "no";
    } else if (index !== 1) {
      return "no"; // first-child, last-child, first-of-type, last-of-type
    }
  }
  let match: Match = compound.maybe ? "maybe" : "yes";
  for (const group of compound.any ?? []) {
    const one = group.reduce<Match>((m, c) => either(m, matchesCompound(element, c)), "no");
    if (one === "no" && !compound.maybe) return "no";
    if (one !== "yes") match = "maybe";
  }
  for (const not of compound.not) {
    const inner = matchesCompound(element, not);
    if (inner === "yes") return "no";
    if (inner === "maybe") match = "maybe";
  }
  return match;
}

function both(a: Match, b: Match): Match {
  return a === "no" || b === "no" ? "no" : a === "maybe" || b === "maybe" ? "maybe" : "yes";
}

function either(a: Match, b: Match): Match {
  return a === "yes" || b === "yes" ? "yes" : a === "maybe" || b === "maybe" ? "maybe" : "no";
}

function matches(element: Element, selector: Selector, index = 0): Match {
  const part = selector.parts[index];
  const own = matchesCompound(element, part.compound);
  if (own === "no" || index === selector.parts.length - 1) return own;
  const combinator = part.combinator ?? " ";
  let rest: Match = "no";
  if (combinator === ">") {
    const parent = element.parentNode;
    rest = isElement(parent) ? matches(parent, selector, index + 1) : "no";
  } else if (combinator === " ") {
    for (let up = element.parentNode; isElement(up) && rest !== "yes"; up = up.parentNode) rest = either(rest, matches(up, selector, index + 1));
  } else {
    const before = elementSiblingsBefore(element);
    if (combinator === "+") rest = before.length ? matches(before[before.length - 1], selector, index + 1) : "no";
    else for (const s of before) rest = either(rest, matches(s, selector, index + 1));
  }
  return both(own, rest);
}

// ============================================
// The cascade
// ============================================

/** The browser's own styles this takes into account. */
const UA: Record<string, Record<string, string>> = {
  h1: { "font-size": "2em", "font-weight": "bold" },
  h2: { "font-size": "1.5em", "font-weight": "bold" },
  h3: { "font-size": "1.17em", "font-weight": "bold" },
  h4: { "font-weight": "bold" },
  h5: { "font-size": "0.83em", "font-weight": "bold" },
  h6: { "font-size": "0.67em", "font-weight": "bold" },
  b: { "font-weight": "bolder" },
  strong: { "font-weight": "bolder" },
  th: { "font-weight": "bold" },
  i: { "font-style": "italic" },
  em: { "font-style": "italic" },
  cite: { "font-style": "italic" },
  var: { "font-style": "italic" },
  dfn: { "font-style": "italic" },
  address: { "font-style": "italic" },
  u: { "text-decoration": "underline" },
  s: { "text-decoration": "line-through" },
  strike: { "text-decoration": "line-through" },
  del: { "text-decoration": "line-through" },
  mark: { "background-color": "#ffff00", color: "#000000" },
  ins: { "text-decoration": "underline" },
  small: { "font-size": "smaller" },
  big: { "font-size": "larger" },
  sub: { "font-size": "smaller" },
  sup: { "font-size": "smaller" },
  head: { display: "none" },
  style: { display: "none" },
  script: { display: "none" },
  title: { display: "none" },
  template: { display: "none" },
};
/** CSS properties that inherit, among those read here. */
const INHERITED_CSS = new Set(["font-size", "font-weight", "font-style", "text-transform", "color", "visibility", "font-family"]);
/** Initial values of the properties read here that don't inherit. */
const INITIAL: Record<string, string> = {
  // Inherited ones, for `initial`.
  "font-size": "16px",
  "font-weight": "normal",
  "font-style": "normal",
  "text-transform": "none",
  color: "#000000",
  visibility: "visible",
  "background-color": "transparent",
  "background-image": "none",
  display: "inline",
  opacity: "1",
  overflow: "visible",
  "overflow-y": "visible",
  "max-height": "none",
  height: "auto",
  width: "auto",
  position: "static",
  clip: "auto",
  "clip-path": "none",
  left: "auto",
  top: "auto",
  "text-decoration": "none",
  "text-decoration-line": "none",
};

/**
 * `var(--name, fallback)` replaced by the custom properties in effect. `value`
 * is undefined when one isn't set and has no fallback (the declaration is then
 * invalid there); `cause` when one is unknown.
 */
function substitute(text: string, vars: Map<string, { value?: string; cause?: string }>): { value?: string } | { cause: string } {
  let out = text;
  for (let round = 0; round < 20 && /var\(/i.test(out); round++) {
    let missing = false;
    let cause: string | undefined;
    // The innermost var() first (a fallback can hold another).
    out = out.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*((?:[^()]|\([^()]*\))*))?\)/gi, (whole, name: string, fallback: string | undefined) => {
      if (/var\(/i.test(fallback ?? "")) return whole;
      const set = vars.get(name.toLowerCase());
      if (set?.cause) cause ??= set.cause;
      if (set?.value !== undefined) return set.value;
      if (fallback !== undefined) return fallback.trim();
      missing = true;
      return "";
    });
    if (cause) return { cause };
    if (missing) return {};
    // Variables that hold each other grow without end: the browser drops such a value.
    if (out.length > 10_000) return { cause: `a value with variables that refer to each other: ${text.slice(0, 120)}` };
  }
  return /var\(/i.test(out) ? { cause: `a value with variables this can't follow: ${text}` } : { value: out.trim() };
}

// Monospace text at the default size shows at 13px (a browser quirk): its size is left unknown unless set.
const MONOSPACE = new Set(["code", "pre", "kbd", "samp", "tt"]);
const INHERITED = ["font-size", "font-weight", "font-style", "text-transform", "color", "visibility"] as const;
const COMPUTED = [...INHERITED, "display", "text-decoration", "background", "hides", "opacity"] as const;

interface Computed {
  size?: number;
  weight?: number;
  italic?: boolean;
  transform?: string;
  color?: Rgba;
  visible?: boolean;
  /** The element itself hides what's in it (display:none, a zero box, opacity 0). */
  hidden?: boolean;
  /** Its own opacity, below 1: what's in it shows that faint. */
  fade?: number;
  /** Its own underline (not inherited: decorations draw across what's inside). */
  /** The first font family it asks for, lowercase; undefined when none is set (the reader's default). */
  family?: string;
  /** A `url()` image behind it, with its URL. */
  imageUrl?: string;
  underline?: boolean;
  /** Its own line-through. */
  strike?: boolean;
  /**
   * Its own background color; `undefined` (unknown) when it has an image or a
   * value this can't read. A gradient of opaque colors counts as its first stop.
   */
  background?: Rgba;
  /** It has a `url()` background image. */
  image?: boolean;
  /** Its background color under any image (unknown when unreadable). */
  under?: Rgba;
  /** A gradient that fades: the colors it shows (each stop over its own background color, translucent while what's behind shows). */
  gradient?: Rgba[];
  /** Whether it breaks words (a block box); from its display. */
  block?: boolean;
  unknown: Set<string>;
  /** Why each unknown property is unknown: the rule, query or value this couldn't read. */
  causes: Map<string, string>;
  /** Custom properties (`--tw-gradient-from`) in effect: inherited, with their own. */
  vars: Map<string, { value?: string; cause?: string }>;
}

/** Tags whose boxes start a line of their own. */
const LINE_TAGS = new Set(["p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "li", "ul", "ol", "dl", "dt", "dd", "table", "tr", "td", "th", "tbody", "thead", "tfoot", "section", "article", "header", "footer", "main", "nav", "aside", "blockquote", "pre", "center", "address", "form", "fieldset", "figure", "figcaption", "body", "html", "hr"]);
const INLINE_TAGS = new Set(["a", "span", "strong", "b", "em", "i", "u", "s", "small", "code", "sup", "sub", "font", "mark", "abbr"]);

export class StyledDocument {
  readonly rules: Rule[] = [];
  readonly root: DefaultTreeAdapterMap["document"];
  private readonly computed = new Map<Element, Computed>();
  private readonly rootSize: number;

  /** The viewport width media queries are read at. */
  readonly width: number;

  constructor(html: string, options: { width?: number } = {}) {
    this.root = parse(html);
    this.width = options.width ?? DESKTOP_WIDTH;
    for (const style of this.elements().filter((e) => e.tagName === "style")) {
      const text = style.childNodes.map((n) => ("value" in n ? (n as { value: string }).value : "")).join("");
      parseStylesheet(text, this.rules, this.width);
    }
    const html_ = this.elements().find((e) => e.tagName === "html");
    this.rootSize = 16;
    if (html_) {
      const own = this.declared(html_).get("font-size");
      const size = own && !own.unknown ? fontSize(own.value, 16, 16) : undefined;
      if (size !== undefined) this.rootSize = size;
    }
  }

  private all?: Element[];

  elements(from: Node = this.root): Element[] {
    if (from === this.root && this.all) return this.all;
    const out: Element[] = [];
    const walk = (node: Node) => {
      if (isElement(node)) out.push(node);
      const children = "childNodes" in node ? (node as ParentNode).childNodes : [];
      for (const child of children) walk(child);
      if (isElement(node) && node.tagName === "template") walk((node as unknown as { content: Node }).content);
    };
    walk(from);
    if (from === this.root) this.all = out;
    return out;
  }

  private readonly declaredCache = new Map<Element, Map<string, { value: string; unknown: boolean; cause?: string }>>();

  /**
   * A property's winning value on `element` as written: "" when nothing sets
   * it, null when a rule this can't place could set it.
   */
  property(element: Element, name: string): string | null {
    const d = this.declared(element).get(name);
    if (!d) return "";
    if (d.unknown) return null;
    if (!/var\(/i.test(d.value)) return d.value;
    // With its variables: one it can't follow is unknown; an unset one (or a value the property can't take) unsets it.
    const resolved = substitute(d.value, this.style(element).vars);
    if ("cause" in resolved) return null;
    return resolved.value === undefined || isInvalid(name, resolved.value) ? "" : resolved.value;
  }

  /** The winning declaration of each property on `element`, or unknown when a rule this can't place could win. */
  private declared(element: Element): Map<string, { value: string; unknown: boolean; cause?: string }> {
    const cached = this.declaredCache.get(element);
    if (cached) return cached;
    const out = this.declare(element);
    this.declaredCache.set(element, out);
    return out;
  }

  private declare(element: Element): Map<string, { value: string; unknown: boolean; cause?: string }> {
    // `order` places a declaration in the document: its rule's place, then its place in the rule or style attribute.
    type Candidate = { value: string; important: boolean; level: number; specificity: [number, number, number]; order: number; unknown: boolean; cause?: string };
    const candidates = new Map<string, Candidate[]>();
    const add = (property: string, candidate: Candidate) => {
      // A value the property can't take: the browser drops the declaration, and an earlier one applies.
      if (isInvalid(property, candidate.value)) return;
      for (const p of expand(property, candidate.value)) {
        const list = candidates.get(p.property) ?? [];
        list.push({ ...candidate, value: p.value, unknown: candidate.unknown || p.unknown, cause: candidate.cause ?? (p.unknown ? `${property}: ${candidate.value}` : undefined) });
        candidates.set(p.property, list);
      }
    };
    // The browser's defaults, then the attributes that set styles, then the stylesheets, then the style attribute.
    for (const [property, value] of Object.entries(UA[element.tagName] ?? {})) add(property, { value, important: false, level: 0, specificity: [0, 0, 0], order: 0, unknown: false });
    if (element.tagName === "a" && attr(element, "href") !== undefined) {
      add("color", { value: "#0000ee", important: false, level: 0, specificity: [0, 0, 0], order: 0, unknown: false });
      add("text-decoration", { value: "underline", important: false, level: 0, specificity: [0, 0, 0], order: 1, unknown: false });
    }
    if (attr(element, "hidden") !== undefined) add("display", { value: "none", important: false, level: 0, specificity: [0, 0, 0], order: 2, unknown: false });
    const bgcolor = attr(element, "bgcolor");
    if (bgcolor && /^(body|table|tr|td|th)$/.test(element.tagName)) add("background-color", { value: bgcolor, important: false, level: 1, specificity: [0, 0, 0], order: 0, unknown: false });
    if (element.tagName === "font" && attr(element, "color")) add("color", { value: attr(element, "color")!, important: false, level: 1, specificity: [0, 0, 0], order: 0, unknown: false });
    for (const rule of this.rules) {
      // The selectors that match, and those that may: one this can't read may be as specific as any.
      let applies = false;
      let specificity: [number, number, number] = [0, 0, 0];
      let mayApply = rule.unknownSelector;
      let maySpecificity: [number, number, number] = rule.unknownSelector ? [Number.MAX_SAFE_INTEGER, 0, 0] : [0, 0, 0];
      for (const selector of rule.selectors) {
        const m = matches(element, selector);
        if (m === "yes") {
          applies = true;
          if (compare(selector.specificity, specificity) >= 0) specificity = selector.specificity;
        } else if (m === "maybe") {
          mayApply = true;
          if (compare(selector.specificity, maySpecificity) >= 0) maySpecificity = selector.specificity;
        }
      }
      const declare = (rank: [number, number, number], unknown: boolean, condition: string) => {
        const cause = unknown ? `the rule \`${rule.source.trim()}\` (${condition} the check can't evaluate)` : undefined;
        rule.declarations.forEach((d, i) => add(d.property, { value: d.value, important: d.important, level: 2, specificity: rank, order: rule.order * 10_000 + i, unknown, cause }));
      };
      // A rule on `::first-line`/`::first-letter` styles part of the text, over the element's own style: which
      // words can't be told, so what it sets is in doubt wherever it differs.
      if ((applies || mayApply) && rule.selectors.some((selector) => selector.partial && matches(element, selector) !== "no")) {
        const cause = `the rule \`${rule.source.trim()}\` (it styles only part of the text)`;
        rule.declarations.forEach((d, i) => add(d.property, { value: d.value, important: true, level: 9, specificity: [0, 0, 0], order: rule.order * 10_000 + i, unknown: true, cause }));
        continue;
      }
      if (applies) declare(specificity, rule.media === "unknown", "a condition");
      // It may also apply with more weight (a selector it can't read): what it sets is then in doubt.
      if (mayApply && (!applies || compare(maySpecificity, specificity) > 0)) declare(maySpecificity, true, rule.media === "unknown" ? "a condition" : "a selector");
    }
    const inline = attr(element, "style");
    if (inline) parseDeclarations(inline).forEach((d, i) => add(d.property, { value: d.value, important: d.important, level: 3, specificity: [0, 0, 0], order: i, unknown: false }));
    const out = new Map<string, { value: string; unknown: boolean; cause?: string }>();
    for (const [property, list] of candidates) {
      // !important first, then where it comes from (browser < attribute < stylesheet < style attribute), specificity, order.
      const rank = (c: Candidate) => [c.important ? 1 : 0, c.level, ...c.specificity, c.order];
      const sorted = [...list].sort((a, b) => compareArrays(rank(b), rank(a)));
      const winner = sorted.find((c) => !c.unknown);
      // A rule this can't place that would outrank the winner makes the property unknown,
      // unless it would set the same value.
      const doubt = sorted.find((c) => c.unknown && (!winner || compareArrays(rank(c), rank(winner)) >= 0) && (!winner || c.value.trim().toLowerCase() !== winner.value.trim().toLowerCase()));
      if (winner) out.set(property, { value: winner.value, unknown: !!doubt, cause: doubt?.cause });
      else out.set(property, { value: "", unknown: true, cause: sorted[0]?.cause });
    }
    return out;
  }

  style(element: Element): Computed {
    const cached = this.computed.get(element);
    if (cached) return cached;
    const parent = isElement(element.parentNode) ? this.style(element.parentNode) : undefined;
    const declared = this.declared(element);
    const unknown = new Set<string>();
    const causes = new Map<string, string>();
    const doubt = (property: string, cause: string | undefined) => {
      unknown.add(property);
      if (cause && !causes.has(property)) causes.set(property, cause);
    };
    const inherit = <T,>(key: string, own: T | undefined, parentValue: T | undefined, parentUnknown: boolean): T | undefined => {
      if (own !== undefined) return own;
      if (parentUnknown) doubt(key, parent?.causes.get(key));
      return parentValue;
    };
    // Custom properties: inherited, then its own (one that's unknown makes what reads it unknown).
    const vars = new Map(parent?.vars ?? []);
    for (const [property, d] of declared) {
      if (!property.startsWith("--")) continue;
      vars.set(property, d.unknown ? { cause: d.cause ?? `${property}: ${d.value}` } : { value: d.value });
    }
    const value = (property: string): string | undefined => {
      const d = declared.get(property);
      if (!d) return undefined;
      if (d.unknown) {
        doubt(property, d.cause);
        return undefined;
      }
      let v = d.value;
      if (/var\(/i.test(v)) {
        const resolved = substitute(v, vars);
        if ("cause" in resolved) {
          doubt(property, resolved.cause);
          return undefined;
        }
        // A variable that isn't set, without a fallback, or that gives a value the property can't take: the
        // declaration is invalid there, and the property takes its inherited or initial value (a gradient made
        // of unset variables draws nothing).
        if (resolved.value === undefined || isInvalid(property, resolved.value)) return INHERITED_CSS.has(property) ? undefined : INITIAL[property];
        v = resolved.value;
      }
      if (/^(initial|unset|revert|revert-layer)$/i.test(v)) {
        const keyword = v.toLowerCase();
        // `revert`: the browser's own style for the element, else as `unset`.
        if (keyword.startsWith("revert") && UA[element.tagName]?.[property] !== undefined) return UA[element.tagName][property];
        // `unset` (and `revert` with no browser style) inherits an inherited property; `initial` never does.
        if (keyword !== "initial" && INHERITED_CSS.has(property)) return undefined;
        if (INITIAL[property] !== undefined) return INITIAL[property];
        doubt(property, `${property}: ${d.value}`);
        return undefined;
      }
      if (/^inherit$/i.test(v)) return undefined;
      if (/calc\(|env\(|attr\(/i.test(v)) {
        doubt(property, `${property}: ${d.value}`);
        return undefined;
      }
      return v;
    };
    const computed: Computed = { unknown, causes, vars };
    // Font size: relative to the parent's.
    const sizeValue = value("font-size");
    const parentSize = parent ? parent.size : 16;
    if (sizeValue !== undefined) {
      const size = fontSize(sizeValue, parentSize, this.rootSize);
      if (size === undefined) doubt("font-size", `font-size: ${sizeValue}`);
      computed.size = size;
    } else computed.size = inherit("font-size", undefined, parentSize, !!parent?.unknown.has("font-size"));
    if (MONOSPACE.has(element.tagName) && sizeValue === undefined) doubt("font-size", "monospace text at the browser's own size");
    if (parent?.unknown.has("font-size") && sizeValue !== undefined && /em|%|smaller|larger/.test(sizeValue)) doubt("font-size", parent.causes.get("font-size"));
    // Weight, italics, letter case, color, visibility: inherited.
    // The first font family it asks for (not the ones that stand in for it), inherited.
    const familyValue = value("font-family");
    computed.family = familyValue !== undefined ? firstFamily(familyValue) : inherit("font-family", undefined, parent?.family, !!parent?.unknown.has("font-family"));
    const weightValue = value("font-weight");
    computed.weight = weightValue !== undefined ? fontWeight(weightValue, parent ? parent.weight : 400) : inherit("font-weight", undefined, parent ? parent.weight : 400, !!parent?.unknown.has("font-weight"));
    if (weightValue !== undefined && computed.weight === undefined) doubt("font-weight", `font-weight: ${weightValue}`);
    const styleValue = value("font-style");
    computed.italic = styleValue !== undefined ? /italic|oblique/i.test(styleValue) : inherit("font-style", undefined, parent ? parent.italic : false, !!parent?.unknown.has("font-style"));
    const transformValue = value("text-transform");
    computed.transform = transformValue !== undefined ? transformValue.toLowerCase() : inherit("text-transform", undefined, parent ? parent.transform : "none", !!parent?.unknown.has("text-transform"));
    const colorValue = value("color");
    if (colorValue !== undefined) {
      computed.color = /^currentcolor$/i.test(colorValue) ? parent?.color : parseColor(colorValue);
      if (!computed.color) doubt("color", `color: ${colorValue}`);
    } else computed.color = inherit("color", undefined, parent ? parent.color : [0, 0, 0, 1], !!parent?.unknown.has("color"));
    const visibilityValue = value("visibility");
    computed.visible = visibilityValue !== undefined ? !/hidden|collapse/i.test(visibilityValue) : inherit("visibility", undefined, parent ? parent.visible : true, !!parent?.unknown.has("visibility"));
    // Hidden boxes: display:none, a zero-size box that clips (`max-height:0;overflow:hidden`), opacity 0, font size 0.
    const display = value("display");
    const overflow = value("overflow") ?? value("overflow-y") ?? value("overflow-x");
    const position = value("position");
    const placed = position !== undefined && /^(absolute|fixed)$/i.test(position.trim());
    // A box's height and width apply to block boxes: not to inline ones (a span) or to table cells and rows,
    // which grow to fit what's in them (a float or a positioned box is a block box).
    const tag = element.tagName;
    const kind = (display ?? (tag === "td" || tag === "th" ? "table-cell" : tag === "tr" ? "table-row" : INLINE_TAGS.has(tag) ? "inline" : "block")).trim().toLowerCase();
    const floated = /^(left|right)$/i.test((value("float") ?? "").trim());
    const sized = placed || floated || !(kind === "inline" || kind === "contents" || kind.startsWith("table-"));
    // A block box that clips to nothing (`max-height:0;overflow:hidden`, `width:0;overflow:hidden`).
    const clipped = sized && !!overflow && /hidden|clip/i.test(overflow) && ["max-height", "height", "max-width", "width"].some((p) => {
      const v = value(p);
      return v !== undefined && lengthPx(v) === 0;
    });
    const opacity = value("opacity");
    // Shown only to screen readers: positioned and clipped to nothing (`sr-only`), or moved far off the page.
    const clip = value("clip");
    const clipPath = value("clip-path");
    const tiny = ["width", "height"].every((p) => {
      const v = value(p);
      return v !== undefined && (lengthPx(v) ?? 2) <= 1;
    });
    // A clip-path that cuts everything away hides, positioned or not; one this can't measure may.
    const clippedAway = clipPath !== undefined && /^inset\(\s*([5-9]\d|100)(\.\d+)?%\s*\)$/i.test(clipPath.trim());
    const clipUnknown = clipPath !== undefined && !/^none$/i.test(clipPath.trim()) && !clippedAway && !/^inset\(\s*0(px|%)?\s*\)$/i.test(clipPath.trim());
    // Text pushed far to the left (`text-indent: -9999px`): off the page, where no one can scroll to it.
    const indent = value("text-indent");
    const indentedAway = indent !== undefined && (lengthPx(indent) ?? 0) <= -999;
    const readerOnly =
      clippedAway ||
      indentedAway ||
      placed &&
      ((clip !== undefined && /^rect\(\s*0(px)?[\s,]+0(px)?[\s,]+0(px)?[\s,]+0(px)?\s*\)$/i.test(clip.trim())) ||
        (tiny && !!overflow && /hidden|clip/i.test(overflow)) ||
        ["left", "top"].some((p) => {
          const v = value(p);
          return v !== undefined && (lengthPx(v) ?? 0) <= -999;
        }));
    // (A font size of 0 hides only the box's own text: a child with a size of its own shows.)
    computed.hidden = (display !== undefined && /^none$/i.test(display)) || clipped || readerOnly || (opacity !== undefined && parseFloat(opacity) === 0);
    const fade = opacity === undefined ? 1 : /%\s*$/.test(opacity) ? parseFloat(opacity) / 100 : parseFloat(opacity);
    if (Number.isFinite(fade) && fade > 0 && fade < 1) computed.fade = fade;
    const hiding = ["display", "overflow", "max-height", "height", "opacity", "position", "clip-path", "text-indent"].find((p) => unknown.has(p)) ?? (placed ? ["clip", "left", "top", "width"].find((p) => unknown.has(p)) : undefined);
    if (hiding) doubt("hides", causes.get(hiding));
    else if (clipUnknown) doubt("hides", `clip-path: ${clipPath}`);
    // As the word check reads tags: these don't break words unless styled as boxes; every other tag does.
    computed.block = INLINE_TAGS.has(element.tagName) ? display !== undefined && /^(block|flex|grid|table|list-item|inline-block|inline-flex)/i.test(display) : true;
    // Its own underline.
    const decoration = value("text-decoration-line") ?? value("text-decoration");
    computed.underline = decoration !== undefined ? /underline/i.test(decoration) : false;
    computed.strike = decoration !== undefined ? /line-through/i.test(decoration) : false;
    if (unknown.has("text-decoration") || unknown.has("text-decoration-line")) doubt("underline", causes.get("text-decoration") ?? causes.get("text-decoration-line"));
    // Its own background color.
    const background = value("background-color");
    const image = value("background-image");
    const painted = image !== undefined && !/^none$/i.test(image);
    const stop = painted ? gradientStop(image) : undefined;
    computed.image = painted && /url\(/i.test(image) && !unknown.has("background-image");
    // Its own background image's URL (a style, or the `background` attribute email tables use).
    const url = (painted && /url\(\s*['"]?([^'")]+)/i.exec(image)?.[1]) || (/^(body|table|td|th)$/.test(element.tagName) ? attr(element, "background") : undefined);
    if (url?.trim()) computed.imageUrl = url.trim();
    computed.under = unknown.has("background-color") ? undefined : background !== undefined ? parseColor(background) : [0, 0, 0, 0];
    // A gradient that fades (a translucent stop): the text is on one of the colors it shows, over its own background color.
    const stops = painted && !stop && !computed.image && !unknown.has("background-image") ? gradientColors(image) : undefined;
    if (stops && computed.under) computed.gradient = stops.map((c) => over(c, computed.under!));
    if (unknown.has("background-color") || unknown.has("background-image") || (painted && !stop && !computed.gradient)) {
      doubt("background", causes.get("background-image") ?? causes.get("background-color") ?? (painted && !/url\(/i.test(image!) ? `background-image: ${image}` : undefined));
      computed.background = undefined;
    } else if (computed.gradient) {
      computed.background = undefined;
    } else {
      computed.background = stop ?? (background !== undefined ? parseColor(background) : [0, 0, 0, 0]);
      if (!computed.background) doubt("background", `background-color: ${background}`);
    }
    this.computed.set(element, computed);
    return computed;
  }

  /** The words a reader sees, each with its style; hidden text is left out. */
  words(within?: Element): StyledWord[] {
    const out: StyledWord[] = [];
    const body = within ?? this.elements().find((e) => e.tagName === "body") ?? this.root;
    let buffer = "";
    let bufferStyle: WordStyle | undefined;
    let bufferShown = true;
    let bufferDoubt: string | undefined;
    let bufferAt: Element | undefined;
    // Inside a box whose hiding can't be told: why.
    let doubting: string | undefined;
    const pieces: Array<{ text: string; style: WordStyle; shown: boolean; doubt?: string; at?: Element }> = [];
    const flush = () => {
      if (buffer) pieces.push({ text: buffer, style: bufferStyle!, shown: bufferShown, doubt: bufferDoubt, at: bufferAt });
      buffer = "";
      bufferStyle = undefined;
      bufferDoubt = undefined;
      pieces.push({ text: " ", style: {}, shown: true });
    };
    // A line break: what follows starts a line.
    const newLine = () => {
      flush();
      pieces.push({ text: "\n", style: {}, shown: true });
    };
    // Inside the preview text (`data-skip-in-text`): inboxes list it, but it isn't shown, so its styles aren't compared.
    let preview = 0;
    const visit = (node: Node, chain: Element[]) => {
      if (isElement(node)) {
        const style = this.style(node);
        if (MSO_ONLY.test(node.tagName)) return;
        // The preview text: inboxes list it, the email doesn't show it. Shown in the email, it's text like any other.
        const skipInText = attr(node, "data-skip-in-text") !== undefined && !!style.hidden;
        if (skipInText) preview++;
        try {
          visitElement(node, chain, style, skipInText);
        } finally {
          if (skipInText) preview--;
        }
        return;
      }
      visitText(node, chain);
    };
    const visitElement = (node: Element, chain: Element[], style: Computed, skipInText: boolean) => {
      {
        if (style.hidden && !skipInText && !style.unknown.has("hides")) return;
        if (node.tagName === "br" || node.tagName === "hr") return void newLine();
        if (node.tagName === "img") return void flush();
        if (this.startsLine(node)) newLine();
        else if (style.block) flush();
        const outer = doubting;
        if (style.unknown.has("hides") && !skipInText) doubting ??= style.causes.get("hides") ?? "a rule that may hide it";
        try {
          for (const child of node.childNodes) visit(child, [...chain, node]);
        } finally {
          doubting = outer;
        }
        if (this.startsLine(node)) newLine();
        else if (style.block) flush();
      }
    };
    const visitText = (node: Node, chain: Element[]) => {
      if (node.nodeName !== "#text") return;
      const element = chain[chain.length - 1];
      if (!element) return;
      const style = this.style(element);
      // Hidden text: visibility, or a font size of 0 (the box's own text only).
      if ((style.visible === false && !style.unknown.has("visibility")) || (style.size === 0 && !style.unknown.has("font-size"))) {
        flush();
        return;
      }
      // A size this can't read may be 0, which hides the text.
      const doubt = doubting ?? (style.unknown.has("visibility") ? style.causes.get("visibility") ?? "a rule that may hide it" : style.unknown.has("font-size") && !MONOSPACE.has(element.tagName) ? style.causes.get("font-size") ?? "a font size it can't read" : undefined);
      const text = (node as { value: string }).value;
      const wordStyle = preview ? {} : this.wordStyle(chain);
      for (const part of text.split(/(\s+)/)) {
        if (!part) continue;
        if (/^\s+$/.test(part)) {
          flush();
          continue;
        }
        // A word takes the style of its first part with a letter or a digit (`$` then a bold `49`).
        if (!buffer || (!/[\p{L}\p{N}]/u.test(buffer) && /[\p{L}\p{N}]/u.test(part))) {
          bufferStyle = wordStyle;
          bufferShown = !preview;
          bufferDoubt = preview ? undefined : doubt;
          bufferAt = element;
        }
        buffer += part;
      }
    };
    // What's above where it starts counts: <html>'s background and text styles reach the body.
    const ancestors: Element[] = [];
    for (let up = isElement(body) ? body.parentNode : undefined; isElement(up); up = up.parentNode) ancestors.unshift(up);
    visit(body, ancestors);
    flush();
    // Pieces into words; a word that spans styles keeps the style of its first part with a letter or a digit
    // (`$<b>49</b>` is a bold 49, `(<b>required</b>)` a bold word).
    let word = "";
    let style: WordStyle = {};
    let shown = true;
    let doubt: string | undefined;
    let at: Element | undefined;
    let lettered = false;
    let lineAhead = true;
    let lineStart = false;
    const push = () => out.push({ word, style, shown, ...(doubt ? { doubt } : {}), ...(at ? { at } : {}), ...(lineStart ? { lineStart: true } : {}) });
    for (const piece of pieces) {
      if (piece.text === " " || piece.text === "\n") {
        if (word) push();
        word = "";
        doubt = undefined;
        lettered = false;
        if (piece.text === "\n") lineAhead = true;
        continue;
      }
      if (!word) {
        lineStart = lineAhead;
        lineAhead = false;
      }
      const letters = /[\p{L}\p{N}]/u.test(piece.text);
      if (!word || (letters && !lettered)) {
        style = piece.style;
        shown = piece.shown;
        at = piece.at;
        lettered = letters;
      }
      doubt ??= piece.doubt;
      word += piece.text;
    }
    if (word) push();
    return out;
  }

  /** Whether the element and everything around it show (the preview text counts as shown). */
  private shows(element: Element): boolean {
    for (let e: Node | null = element; isElement(e); e = e.parentNode) {
      if (attr(e, "data-skip-in-text") !== undefined) return true;
      if (MSO_ONLY.test(e.tagName)) return false;
      const s = this.style(e);
      if (s.hidden && !s.unknown.has("hides")) return false;
    }
    return true;
  }

  /** Why whether an element shows can't be told (a rule or value around it this can't read), if it can't. */
  private showDoubt(element: Element): string | undefined {
    for (let e: Node | null = element; isElement(e); e = e.parentNode) {
      if (attr(e, "data-skip-in-text") !== undefined) return undefined;
      const s = this.style(e);
      if (s.unknown.has("hides")) return s.causes.get("hides") ?? "a rule that may hide it";
      if (s.unknown.has("visibility")) return s.causes.get("visibility") ?? "a rule that may hide it";
    }
    return undefined;
  }

  /** The links (href), images (src) and image text (alt) a reader gets, in order. */
  targets(): Target[] {
    const out: Target[] = [];
    for (const e of this.elements()) {
      const background = this.style(e).imageUrl;
      if (background && this.shows(e)) out.push({ kind: "src", value: background, ...(this.showDoubt(e) ? { doubt: this.showDoubt(e) } : {}) });
      if (e.tagName !== "a" && e.tagName !== "img") continue;
      if (!this.shows(e)) continue;
      const doubt = this.showDoubt(e);
      const doubted = doubt ? { doubt } : {};
      if (e.tagName === "a") {
        const href = attr(e, "href")?.trim();
        if (!href) continue;
        const words = this.words(e).map((w) => w.word).join(" ");
        const images = this.elements(e).filter((i) => i.tagName === "img").flatMap((i) => [attr(i, "src"), attr(i, "alt")].filter((v): v is string => !!v?.trim()).map((v) => v.trim()));
        out.push({ kind: "href", value: href.replace(/%22/gi, '"').replace(/%3C/gi, "<").replace(/%3E/gi, ">"), label: words || images.join(", "), ...doubted });
      } else {
        const src = attr(e, "src")?.trim();
        const alt = attr(e, "alt")?.trim();
        if (src) out.push({ kind: "src", value: src, ...doubted });
        if (alt) out.push({ kind: "alt", value: alt, ...doubted });
      }
    }
    return out;
  }

  /** Whether a box starts a line of its own: a block (a paragraph, a list item, a table, a row, a cell), not an inline box. */
  private startsLine(element: Element): boolean {
    const display = (this.property(element, "display") ?? "").trim().toLowerCase();
    if (display) return /^(block|list-item|flex|grid|table|flow-root|table-row|table-row-group|table-header-group|table-footer-group|table-cell)$/.test(display.split(/\s+/)[0]);
    return LINE_TAGS.has(element.tagName);
  }

  /** A box decorations from above don't reach into: an inline-block (and its kin), a float, a positioned box. */
  private decorationBoundary(element: Element): boolean {
    const display = (this.property(element, "display") ?? "").trim().toLowerCase();
    const float = (this.property(element, "float") ?? "").trim().toLowerCase();
    const position = (this.property(element, "position") ?? "").trim().toLowerCase();
    return /^inline-(block|table|flex|grid)$/.test(display) || float === "left" || float === "right" || position === "absolute" || position === "fixed";
  }

  /** A word's style from the elements it's in, outermost first. */
  private wordStyle(chain: Element[]): WordStyle {
    const element = chain[chain.length - 1];
    const own = this.style(element);
    const known = (property: string, v: unknown) => (own.unknown.has(property) ? undefined : v);
    let underline: boolean | undefined = false;
    let strike = false;
    let background: Rgba | undefined = [255, 255, 255, 1];
    let underlineCause: string | undefined;
    let backgroundCause: string | undefined;
    let options: Rgba[] | undefined;
    let target: string | undefined;
    let inLink = false;
    let image = false;
    // Where images don't load: the color the box with the image sets under it (none set: unknown).
    let under: Rgba | undefined;
    // Faint text: each box's opacity, multiplied.
    let fade = 1;
    for (const e of chain) {
      const s = this.style(e);
      fade *= s.fade ?? 1;
      if (s.image) {
        image = true;
        under = s.under && s.under[3] >= 1 ? s.under : undefined;
      } else if (!s.unknown.has("background") && s.background && s.background[3] >= 1) {
        // A box with a color of its own covers the images behind it.
        image = false;
      } else if (image && under !== undefined) {
        under = s.unknown.has("background") || !s.background ? undefined : over(s.background, under);
      }
      // Decorations drawn above don't reach into an inline-block, a float or a positioned box.
      if (e !== chain[0] && this.decorationBoundary(e)) {
        underline = underline === undefined ? undefined : false;
        strike = false;
      }
      if (s.unknown.has("underline")) {
        underline = undefined;
        underlineCause ??= s.causes.get("underline");
      } else if (underline !== undefined && s.underline) underline = true;
      if (s.strike) strike = true;
      if (s.gradient && !s.unknown.has("background")) {
        // A gradient that fades: each color it shows, over what's behind.
        const below = background !== undefined ? [background] : options;
        options = below ? s.gradient.flatMap((g) => below.map((b) => over(g, b))) : undefined;
        background = undefined;
      } else if (background !== undefined || options) {
        if (s.unknown.has("background") || !s.background) {
          background = undefined;
          options = undefined;
        } else if (options) {
          if (s.background[3] >= 1) {
            background = s.background;
            options = undefined;
          } else options = options.map((o) => over(s.background!, o));
        } else background = over(s.background, background!);
      }
      if (s.unknown.has("background")) backgroundCause ??= s.causes.get("background");
      if (e.tagName === "a" && attr(e, "href") !== undefined) {
        inLink = true;
        target = (attr(e, "target") || "_self").toLowerCase();
      }
    }
    const causes: WordStyle["causes"] = {};
    const why = (property: (typeof STYLE_PROPERTIES)[number], cause: string | undefined) => cause && (causes[property] = cause);
    if (own.unknown.has("font-size")) why("size", own.causes.get("font-size"));
    if (own.unknown.has("font-weight")) why("bold", own.causes.get("font-weight"));
    if (own.unknown.has("font-style")) why("italic", own.causes.get("font-style"));
    if (own.unknown.has("text-transform")) why("transform", own.causes.get("text-transform"));
    if (own.unknown.has("color")) why("color", own.causes.get("color"));
    if (own.unknown.has("font-family")) why("font", own.causes.get("font-family"));
    if (underline === undefined) why("underline", underlineCause);
    if (background === undefined && !options) why("background", backgroundCause);
    return {
      size: known("font-size", own.size) as number | undefined,
      bold: own.weight === undefined || own.unknown.has("font-weight") ? undefined : own.weight >= 600,
      italic: known("font-style", own.italic) as boolean | undefined,
      transform: known("text-transform", own.transform) as string | undefined,
      underline,
      strike,
      ...(own.family !== undefined && !own.unknown.has("font-family") ? { font: own.family } : {}),
      color: own.color && fade < 1 && !own.unknown.has("color") ? [own.color[0], own.color[1], own.color[2], own.color[3] * fade] : (known("color", own.color) as Rgba | undefined),
      background,
      ...(image ? { image, ...(under ? { underImage: under } : {}) } : {}),
      ...(options ? { backgrounds: options } : {}),
      ...(inLink ? { target } : {}),
      ...(Object.keys(causes).length ? { causes } : {}),
    };
  }
}

// Outlook's VML: not shown by other clients.
const MSO_ONLY = /^(v:|o:|w:)/;

/** Longhands a shorthand sets; values this can't split are unknown. */
function expand(property: string, value: string): Array<{ property: string; value: string; unknown: boolean }> {
  if (property === "background") {
    if (/url\(|gradient\(/i.test(value)) {
      // The image layer as written (a gradient is read as its colors); with a url() in any layer, an image.
      const gradient = /(?:repeating-)?(?:linear|radial|conic)-gradient\((?:[^()]|\([^()]*\))*\)/i.exec(value)?.[0];
      const image = /url\(/i.test(value) ? "url()" : gradient ?? "unreadable-gradient()";
      return [{ property: "background-image", value: image, unknown: false }, { property: "background-color", value: backgroundColorToken(value) ?? "transparent", unknown: false }];
    }
    const color = backgroundColorToken(value);
    return [{ property: "background-color", value: color ?? "transparent", unknown: color === undefined && !/^(none|transparent|initial|unset)$/i.test(value.trim()) && /[a-z#]/i.test(value) && !/^(no-repeat|repeat|center|top|left|right|bottom|cover|contain|fixed|scroll|[\d.]+(px|%)?|\s)+$/i.test(value) }];
  }
  if (property === "font") {
    // `font: italic bold 14px/1.5 Arial`: size and the keywords before it.
    // The size starts a word: `.875em` is 0.875em.
    const m = /^((?:.*?\s)?)((?:\d+\.?\d*|\.\d+)(?:px|em|rem|%|pt)|xx-small|x-small|small|medium|large|x-large|xx-large|smaller|larger)(?:\s*\/\s*\S+)?\s+.+$/i.exec(value.trim());
    if (!m) return [{ property: "font-size", value: "", unknown: true }, { property: "font-weight", value: "", unknown: true }, { property: "font-style", value: "", unknown: true }];
    const before = m[1].toLowerCase();
    return [
      { property: "font-size", value: m[2], unknown: false },
      { property: "font-weight", value: /\b(bold|bolder|lighter|[1-9]00)\b/.exec(before)?.[1] ?? "normal", unknown: false },
      { property: "font-style", value: /\b(italic|oblique)\b/.test(before) ? "italic" : "normal", unknown: false },
    ];
  }
  if (property === "text-decoration") {
    // The shorthand sets the line too: whichever comes last wins, as in the browser.
    const keyword = /^\s*(inherit|initial|unset|revert|revert-layer)\s*$/i.test(value) || /var\(/i.test(value);
    const line = keyword ? value : value.match(/\b(underline|overline|line-through|blink)\b/gi)?.join(" ") ?? "none";
    return [{ property: "text-decoration", value, unknown: false }, { property: "text-decoration-line", value: line, unknown: false }];
  }
  return [{ property, value, unknown: false }];
}

/**
 * A gradient's first color, when every stop is an opaque color written out:
 * the one color closest to what it paints behind the start of the text. A
 * stop from a variable, or a translucent one, leaves it unknown.
 */
function gradientStop(image: string): Rgba | undefined {
  const colors = gradientColors(image);
  if (!colors || colors.some((c) => c[3] < 1)) return undefined;
  return colors[0];
}

/** A gradient's stop colors, as written (translucent ones too); undefined when one can't be read. */
function gradientColors(image: string): Rgba[] | undefined {
  const args = /^\s*(?:repeating-)?(?:linear|radial|conic)-gradient\((.*)\)\s*$/i.exec(image)?.[1];
  if (!args) return undefined;
  const parts = args.split(/,(?![^(]*\))/).map((part) => part.trim());
  if (/^(to\s|from\s|at\s|[-\d.]+(deg|grad|rad|turn)\b|circle|ellipse|closest|farthest)/i.test(parts[0] ?? "")) parts.shift();
  const colors = parts.map((part) => parseColor(/^((?:rgb|hsl)a?\([^)]*\)|#[0-9a-f]{3,8}|[a-z]+)(?=\s|$)/i.exec(part)?.[1] ?? ""));
  return colors.length && colors.every(Boolean) ? (colors as Rgba[]) : undefined;
}

function backgroundColorToken(value: string): string | undefined {
  const fn = /(rgba?|hsla?)\([^)]*\)/i.exec(value)?.[0];
  if (fn) return fn;
  for (const token of value.replace(/url\([^)]*\)|[\w-]+-gradient\((?:[^()]|\([^)]*\))*\)/gi, " ").split(/\s+/)) {
    if (token && parseColor(token) && !/^(transparent)$/i.test(token)) return token;
    if (/^transparent$/i.test(token)) return "transparent";
  }
  return undefined;
}

function compare(a: [number, number, number], b: [number, number, number]): number {
  return compareArrays(a, b);
}

function compareArrays(a: number[], b: number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    if (d) return d;
  }
  return 0;
}

// ============================================
// Comparing two documents
// ============================================

export interface StyleDifference {
  /** A style; "shown": text that is only the inbox preview on one side and in the email on the other; "line": a line break moved. */
  property: (typeof STYLE_PROPERTIES)[number] | "shown" | "line";
  original: string;
  converted: string;
  /** The words that changed this way, in order. */
  words: string[];
  /** Only on screens at least this wide, where a rule for wider screens than the desktop width applies (Tailwind's `md:`). */
  width?: number;
}

/**
 * What the check couldn't verify: a style, or whether words are shown, that
 * one side sets in a way this can't read. Not a difference found, but not a
 * pass either: the check fails on it, saying why.
 */
export interface Unverified {
  /** A style property, or whether the words are shown. */
  what: (typeof STYLE_PROPERTIES)[number] | "shown" | "shown on phones" | "where it sits";
  /** The original template, or the migration (a value the migrated template writes that this can't read). */
  side: "original" | "migrated";
  /** The rule, condition or value it couldn't read. */
  cause: string;
  /** The words it's on, in order. */
  words: string[];
  /** Only on screens at least this wide (see StyleDifference). */
  width?: number;
}

export interface StyleCheck {
  differences: StyleDifference[];
  /** What couldn't be verified on one side, grouped by cause. Both sides unknown the same way (markup kept as it was) isn't. */
  unverified: Unverified[];
  /** Words whose styles were compared (both documents show the same words). */
  compared: number;
  /** Properties left out because one side couldn't be worked out. */
  unknown: number;
}

/** The first family of a `font-family` list, lowercase and unquoted. */
function firstFamily(value: string): string {
  return (value.split(",")[0] ?? "").trim().replace(/^['"]|['"]$/g, "").trim().toLowerCase();
}

/** A word as the content check reads it ("" for punctuation alone). */
export function normalizeWord(word: string): string {
  const w = word.normalize("NFC").replace(/[​-‍⁠﻿]/g, "").replace(/[-−－﹣]/g, "−");
  if (/\p{N}/u.test(w)) return w.replace(/[^\p{L}\p{N}\p{Sc}.,/:'’+−%‰]/gu, "").replace(/[.,]+$/g, "");
  if (/^[+−±]$/.test(w)) return w;
  // Letters, or else the symbols a reader reads (✓ ✗ ★ © → &): punctuation alone ("—", "·", "|") isn't a word.
  if (/\p{L}/u.test(w)) return w.replace(/[^\p{L}\p{Sc}%‰]/gu, "");
  return w.replace(/[^\p{Sc}\p{So}\p{Sm}%‰&]|[|¦]/gu, "");
}

/** The words a reader sees, as the content check reads them, each with its style. */
export function styledWords(html: string | StyledDocument): StyledWord[] {
  return (typeof html === "string" ? new StyledDocument(html) : html)
    .words()
    .flatMap((w) => w.word.split(/\s+/).map((part, k) => ({ word: normalizeWord(part), style: w.style, shown: w.shown, ...(w.doubt ? { doubt: w.doubt } : {}), ...(w.at ? { at: w.at } : {}), ...(w.lineStart && k === 0 ? { lineStart: true } : {}) })))
    .filter((w) => w.word);
}

function show(property: StyleDifference["property"], value: unknown): string {
  if (property === "color" || property === "background") {
    const [r, g, b, a] = value as Rgba;
    const hex = `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;
    return a < 1 ? `${hex} at ${Math.round(a * 100)}%` : hex;
  }
  if (property === "size") return `${Math.round((value as number) * 10) / 10}px`;
  if (property === "bold") return value ? "bold" : "not bold";
  if (property === "italic") return value ? "italic" : "not italic";
  if (property === "underline") return value ? "underlined" : "not underlined";
  if (property === "strike") return value ? "struck through" : "not struck through";
  return String(value);
}

function same(property: StyleDifference["property"], a: unknown, b: unknown): boolean {
  if (property === "size") return Math.abs((a as number) - (b as number)) <= 1;
  if (property === "color" || property === "background") {
    const x = a as Rgba, y = b as Rgba;
    return [0, 1, 2].every((i) => Math.abs(x[i] - y[i]) <= 2) && Math.abs(x[3] - y[3]) <= 0.02;
  }
  return a === b;
}

/**
 * The styles that differ between two documents that show the same words:
 * size, bold, italics, letter case, underline, color, the background behind
 * the text and a link's target. Grouped by property and change, with the
 * words it affects. Nothing is compared when the words differ (the content
 * check reports that).
 */
export function compareStyles(originalHtml: string | StyledDocument, convertedHtml: string | StyledDocument): StyleCheck {
  const a = styledWords(originalHtml);
  const b = styledWords(convertedHtml);
  if (a.length !== b.length || a.some((w, i) => w.word !== b[i].word)) return { differences: [], unverified: [], compared: 0, unknown: 0 };
  const groups = new Map<string, StyleDifference>();
  const doubts = new Map<string, Unverified>();
  const doubt = (what: Unverified["what"], side: Unverified["side"], cause: string | undefined, word: string) => {
    const reason = cause ?? "a value the check can't read";
    const key = `${what}\u0000${side}\u0000${reason}`;
    const entry = doubts.get(key) ?? { what, side, cause: reason, words: [] };
    entry.words.push(word);
    doubts.set(key, entry);
  };
  let unknown = 0;
  let compared = 0;
  for (let i = 0; i < a.length; i++) {
    // Whether it's shown at all: on one side only, the check can't tell it shows the same.
    if (a[i].doubt && !b[i].doubt) doubt("shown", "original", a[i].doubt, a[i].word);
    else if (b[i].doubt && !a[i].doubt) doubt("shown", "migrated", b[i].doubt, b[i].word);
    // The inbox preview on one side, in the email on the other: not the same text a reader sees.
    if (a[i].shown !== b[i].shown) {
      const where = (shown: boolean) => (shown ? "in the email" : "the inbox preview only");
      const key = `shown\u0000${where(a[i].shown)}`;
      const group = groups.get(key) ?? { property: "shown" as const, original: where(a[i].shown), converted: where(b[i].shown), words: [] };
      group.words.push(a[i].word);
      groups.set(key, group);
      continue;
    }
    if (!a[i].shown || !b[i].shown) continue;
    compared++;
    // Where a line breaks: a word that starts a line on one side only (a `<br>` lost or added).
    if (!!a[i].lineStart !== !!b[i].lineStart && i > 0) {
      const where = (start: boolean | undefined) => (start ? "starts a line" : "continues the line");
      const key = `line\u0000${where(a[i].lineStart)}`;
      const group = groups.get(key) ?? { property: "line" as const, original: where(a[i].lineStart), converted: where(b[i].lineStart), words: [] };
      group.words.push(a[i].word);
      groups.set(key, group);
    }
    for (const property of STYLE_PROPERTIES) {
      const x = a[i].style[property], y = b[i].style[property];
      if (property === "target" && (x === undefined) !== (y === undefined)) continue;
      // No font family set is the reader's default (it differs from one client to the next): compared only where both set one.
      if (property === "font" && (x === undefined || y === undefined) && !a[i].style.causes?.font && !b[i].style.causes?.font) continue;
      // An image behind the original's text that the migration doesn't have: the text must still be on
      // the color under the image (what shows where images don't load), or it reads differently.
      if (property === "background" && a[i].style.image && !b[i].style.image && y !== undefined) {
        const under = a[i].style.underImage;
        if (under && same(property, under, y)) continue;
        const original = under ? `an image on ${show(property, under)}` : "an image";
        const key = `background\u0000${original}\u0000${show(property, y)}`;
        const group = groups.get(key) ?? { property, original, converted: show(property, y), words: [] };
        group.words.push(a[i].word);
        groups.set(key, group);
        continue;
      }
      // On a gradient that fades: the other side must show one of the colors it shows.
      if (property === "background" && (a[i].style.backgrounds || b[i].style.backgrounds)) {
        const xs = a[i].style.backgrounds ?? (x ? [x as Rgba] : undefined);
        const ys = b[i].style.backgrounds ?? (y ? [y as Rgba] : undefined);
        if (xs && ys) {
          if (!ys.some((c) => xs.some((o) => same(property, o, c)))) {
            const list = (cs: Rgba[]) => (cs.length > 1 ? `a gradient (${[...new Set(cs.map((c) => show(property, c)))].join(" … ")})` : show(property, cs[0]));
            const key = `background\u0000${list(xs)}\u0000${list(ys)}`;
            const group = groups.get(key) ?? { property, original: list(xs), converted: list(ys), words: [] };
            group.words.push(a[i].word);
            groups.set(key, group);
          }
          continue;
        }
      }
      if (x === undefined || y === undefined) {
        if (property !== "target") unknown++;
        // Unknown on one side only: what the other shows can't be checked against it.
        if (property !== "target" && x === undefined && y !== undefined) doubt(property, "original", a[i].style.causes?.[property], a[i].word);
        if (property !== "target" && y === undefined && x !== undefined) doubt(property, "migrated", b[i].style.causes?.[property], b[i].word);
        // Unknown on both sides, but written differently (`oklch(… 25)` against `oklch(… 250)`): not the same.
        const causeA = a[i].style.causes?.[property];
        const causeB = b[i].style.causes?.[property];
        if (property !== "target" && x === undefined && y === undefined && causeA && causeB && causeA !== causeB) doubt(property, "original", `${causeA}, where the migrated template writes ${causeB}`, a[i].word);
        continue;
      }
      if (same(property, x, y)) continue;
      const key = `${property}\u0000${show(property, x)}\u0000${show(property, y)}`;
      const group = groups.get(key) ?? { property, original: show(property, x), converted: show(property, y), words: [] };
      group.words.push(a[i].word);
      groups.set(key, group);
    }
  }
  return { differences: [...groups.values()], unverified: [...doubts.values()], compared, unknown };
}
