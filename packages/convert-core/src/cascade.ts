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
  color?: Rgba;
  background?: Rgba;
  /** A `url()` image is behind it: the background color is then unknown, but losing the image isn't. */
  image?: boolean;
  /** Behind an image: the color its box sets under it, what shows where images don't load (none set: unknown). */
  underImage?: Rgba;
  /** The target of the link the word is in ("_self" when the link sets none); absent outside links. */
  target?: string;
}

export const STYLE_PROPERTIES = ["size", "bold", "italic", "transform", "underline", "color", "background", "target"] as const;

export interface StyledWord {
  word: string;
  style: WordStyle;
  /** False for the preview text: inboxes list it, but it isn't shown, so its styles aren't compared. */
  shown: boolean;
}

/** A link or image a reader gets, with the words or image text it carries (for links). */
export interface Target {
  kind: "href" | "src" | "alt";
  value: string;
  /** For a link: the words in it, or its images' URLs and text when it has no words. */
  label?: string;
}

// ============================================
// CSS values
// ============================================

const NAMED: Record<string, string> = {
  black: "000000", white: "ffffff", red: "ff0000", green: "008000", blue: "0000ff", yellow: "ffff00", gray: "808080", grey: "808080",
  silver: "c0c0c0", maroon: "800000", purple: "800080", fuchsia: "ff00ff", magenta: "ff00ff", lime: "00ff00", olive: "808000", navy: "000080",
  teal: "008080", aqua: "00ffff", cyan: "00ffff", orange: "ffa500", pink: "ffc0cb", brown: "a52a2a", gold: "ffd700", indigo: "4b0082",
  violet: "ee82ee", coral: "ff7f50", crimson: "dc143c", darkblue: "00008b", darkgray: "a9a9a9", darkgrey: "a9a9a9", darkgreen: "006400",
  darkred: "8b0000", lightgray: "d3d3d3", lightgrey: "d3d3d3", lightblue: "add8e6", lightgreen: "90ee90", whitesmoke: "f5f5f5",
  gainsboro: "dcdcdc", dimgray: "696969", dimgrey: "696969", slategray: "708090", slategrey: "708090", steelblue: "4682b4",
  royalblue: "4169e1", dodgerblue: "1e90ff", tomato: "ff6347", salmon: "fa8072", beige: "f5f5dc", ivory: "fffff0", khaki: "f0e68c",
  lavender: "e6e6fa", linen: "faf0e6", mintcream: "f5fffa", snow: "fffafa", tan: "d2b48c", turquoise: "40e0d0", chocolate: "d2691e",
  firebrick: "b22222", seagreen: "2e8b57", skyblue: "87ceeb", orchid: "da70d6", plum: "dda0dd", sienna: "a0522d", wheat: "f5deb3",
  aliceblue: "f0f8ff", ghostwhite: "f8f8ff", honeydew: "f0fff0", floralwhite: "fffaf0", oldlace: "fdf5e6", seashell: "fff5ee",
  lightyellow: "ffffe0", lightcyan: "e0ffff", darkorange: "ff8c00", darkviolet: "9400d3", deeppink: "ff1493", hotpink: "ff69b4",
  limegreen: "32cd32", forestgreen: "228b22", midnightblue: "191970", darkslategray: "2f4f4f", darkslategrey: "2f4f4f",
  cornflowerblue: "6495ed", cadetblue: "5f9ea0", rebeccapurple: "663399", slateblue: "6a5acd", mediumblue: "0000cd",
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
  /** Structural pseudo-classes this knows (`first-child`, `last-child`, `root`). */
  pseudo: string[];
  /** A pseudo-class this can't evaluate (`:nth-child(2)`, `:not(…)`): the compound may or may not match. */
  maybe: boolean;
}
interface Selector {
  /** Right to left: each compound and the combinator that relates it to the next one (to its left). */
  parts: Array<{ compound: Compound; combinator?: Combinator }>;
  specificity: [number, number, number];
}

interface Rule {
  selectors: Selector[];
  /** A selector this can't read at all: the rule's properties are unknown on every element. */
  unknownSelector: boolean;
  /** The rule's media apply at desktop width (yes), or can't be told (unknown); rules that never apply aren't kept. */
  media: "yes" | "unknown";
  declarations: Declaration[];
  order: number;
}

const DYNAMIC_PSEUDO = /^(hover|focus|focus-within|focus-visible|active|visited|target|checked|disabled|placeholder-shown|autofill)$/;
const IGNORED_PSEUDO_ELEMENT = /^(before|after|placeholder|selection|marker|-webkit-[\w-]+|-moz-[\w-]+)$/;
const SIMPLE = /\[[^\]]*\]|::?[\w-]+(?:\((?:[^()]|\([^)]*\))*\))?|[#.](?:[\w-]|\\.)+|(?:[\w-]|\\.)+|\*/g;

/** A CSS identifier with its escapes resolved (`sm\:w-full` → `sm:w-full`). */
function unescape(ident: string): string {
  return ident.replace(/\\([0-9a-f]{1,6}\s?|.)/gi, (_, c: string) => (/^[0-9a-f]{1,6}\s?$/i.test(c) && c.trim().length > 1 ? String.fromCodePoint(parseInt(c, 16)) : c));
}

/** A selector, `null` when it never matches a static desktop render (`:hover`), or "unknown" when this can't read it. */
function parseSelector(text: string): Selector | null | "unknown" {
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
        if (!items.length) return "unknown";
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
  if (!items.length || items.length % 2 === 0) return "unknown";
  const specificity: [number, number, number] = [0, 0, 0];
  const parts: Selector["parts"] = [];
  for (let i = items.length - 1; i >= 0; i -= 2) {
    const tokens = items[i].match(SIMPLE);
    if (!tokens || tokens.join("") !== items[i]) return "unknown";
    const compound: Compound = { classes: [], attributes: [], pseudo: [], maybe: false };
    for (const token of tokens) {
      if (token === "*") continue;
      if (token.startsWith("::")) {
        if (IGNORED_PSEUDO_ELEMENT.test(token.slice(2))) return null;
        compound.maybe = true;
        continue;
      }
      if (token.startsWith(":")) {
        const name = /^:([\w-]+)/.exec(token)![1].toLowerCase();
        if (DYNAMIC_PSEUDO.test(name)) return null;
        specificity[1]++;
        if (name === "link" || name === "any-link") compound.attributes.push({ name: "href" });
        else if (["first-child", "last-child", "root"].includes(name)) compound.pseudo.push(name);
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
    parts.push({ compound, combinator: i > 0 ? (items[i - 1] as Combinator) : undefined });
  }
  return { parts, specificity };
}

function parseDeclarations(text: string): Declaration[] {
  const out: Declaration[] = [];
  for (const piece of text.split(/;(?![^(]*\))/)) {
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

/** Whether a media query list applies at desktop width. */
function mediaApplies(query: string): "yes" | "no" | "unknown" {
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
      const px = raw === undefined ? undefined : /^([\d.]+)(px|em|rem)?$/.exec(raw);
      const width = px ? parseFloat(px[1]) * (px[2] === "em" || px[2] === "rem" ? 16 : 1) : undefined;
      if (name === "prefers-color-scheme") {
        if (raw === "dark") result = "no";
      } else if ((name === "min-width" || name === "max-width") && width !== undefined) {
        if (name === "min-width" ? DESKTOP_WIDTH < width : DESKTOP_WIDTH > width) result = "no";
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

/** The rules of a stylesheet that may apply at desktop width, in order. */
function parseStylesheet(css: string, rules: Rule[], media: "yes" | "unknown" = "yes"): void {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "");
  let i = 0;
  while (i < text.length) {
    const open = text.indexOf("{", i);
    if (open < 0) return;
    const prelude = text.slice(i, open).trim();
    // The block's end, nested blocks included.
    let depth = 1;
    let j = open + 1;
    for (; j < text.length && depth; j++) depth += text[j] === "{" ? 1 : text[j] === "}" ? -1 : 0;
    const body = text.slice(open + 1, j - 1);
    i = j;
    // A statement at-rule (`@import …;`) before the block.
    const statement = prelude.lastIndexOf(";");
    const head = statement >= 0 ? prelude.slice(statement + 1).trim() : prelude;
    if (head.startsWith("@")) {
      const at = /^@([\w-]+)\s*(.*)$/s.exec(head);
      if (at?.[1].toLowerCase() === "media") {
        const applies = mediaApplies(at[2]);
        if (applies !== "no") parseStylesheet(body, rules, applies === "unknown" || media === "unknown" ? "unknown" : "yes");
      } else if (at?.[1].toLowerCase() === "supports") {
        parseStylesheet(body, rules, "unknown");
      }
      continue;
    }
    const selectors: Selector[] = [];
    let unknownSelector = false;
    for (const s of splitTopLevel(head)) {
      const selector = parseSelector(s);
      if (selector === "unknown") unknownSelector = true;
      else if (selector) selectors.push(selector);
    }
    if (!selectors.length && !unknownSelector) continue;
    rules.push({ selectors, unknownSelector, media, declarations: parseDeclarations(body), order: rules.length });
  }
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

function attr(element: Element, name: string): string | undefined {
  return element.attrs.find((a) => a.name === name)?.value;
}

function isElement(node: Node | null | undefined): node is Element {
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
    if (p === "first-child" && siblings[0] !== element) return "no";
    if (p === "last-child" && siblings[siblings.length - 1] !== element) return "no";
    if (p === "root" && element.tagName !== "html") return "no";
  }
  return compound.maybe ? "maybe" : "yes";
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
  /** Its own underline (not inherited: decorations draw across what's inside). */
  underline?: boolean;
  /**
   * Its own background color; `undefined` (unknown) when it has an image or a
   * value this can't read. A gradient of opaque colors counts as its first stop.
   */
  background?: Rgba;
  /** It has a `url()` background image. */
  image?: boolean;
  /** Its background color under any image (unknown when unreadable). */
  under?: Rgba;
  /** Whether it breaks words (a block box); from its display. */
  block?: boolean;
  unknown: Set<string>;
}

const INLINE_TAGS = new Set(["a", "span", "strong", "b", "em", "i", "u", "s", "small", "code", "sup", "sub", "font", "mark", "abbr"]);

export class StyledDocument {
  readonly rules: Rule[] = [];
  readonly root: DefaultTreeAdapterMap["document"];
  private readonly computed = new Map<Element, Computed>();
  private readonly rootSize: number;

  constructor(html: string) {
    this.root = parse(html);
    for (const style of this.elements().filter((e) => e.tagName === "style")) {
      const text = style.childNodes.map((n) => ("value" in n ? (n as { value: string }).value : "")).join("");
      parseStylesheet(text, this.rules);
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

  /** The winning declaration of each property on `element`, or unknown when a rule this can't place could win. */
  private declared(element: Element): Map<string, { value: string; unknown: boolean }> {
    // `order` places a declaration in the document: its rule's place, then its place in the rule or style attribute.
    type Candidate = { value: string; important: boolean; level: number; specificity: [number, number, number]; order: number; unknown: boolean };
    const candidates = new Map<string, Candidate[]>();
    const add = (property: string, candidate: Candidate) => {
      for (const p of expand(property, candidate.value)) {
        const list = candidates.get(p.property) ?? [];
        list.push({ ...candidate, value: p.value, unknown: candidate.unknown || p.unknown });
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
      let match: Match = rule.unknownSelector ? "maybe" : "no";
      let specificity: [number, number, number] = [0, 0, 0];
      for (const selector of rule.selectors) {
        const m = matches(element, selector);
        if (m === "no") continue;
        if (m === "yes" && compare(selector.specificity, specificity) >= 0) specificity = selector.specificity;
        match = either(match, m);
      }
      if (match === "no") continue;
      const unknown = match === "maybe" || rule.media === "unknown";
      rule.declarations.forEach((d, i) => add(d.property, { value: d.value, important: d.important, level: 2, specificity, order: rule.order * 10_000 + i, unknown }));
    }
    const inline = attr(element, "style");
    if (inline) parseDeclarations(inline).forEach((d, i) => add(d.property, { value: d.value, important: d.important, level: 3, specificity: [0, 0, 0], order: i, unknown: false }));
    const out = new Map<string, { value: string; unknown: boolean }>();
    for (const [property, list] of candidates) {
      // !important first, then where it comes from (browser < attribute < stylesheet < style attribute), specificity, order.
      const rank = (c: Candidate) => [c.important ? 1 : 0, c.level, ...c.specificity, c.order];
      const sorted = [...list].sort((a, b) => compareArrays(rank(b), rank(a)));
      const winner = sorted.find((c) => !c.unknown);
      // A rule this can't place that would outrank the winner makes the property unknown.
      const doubt = sorted.some((c) => c.unknown && (!winner || compareArrays(rank(c), rank(winner)) >= 0));
      if (winner) out.set(property, { value: winner.value, unknown: doubt });
      else out.set(property, { value: "", unknown: true });
    }
    return out;
  }

  style(element: Element): Computed {
    const cached = this.computed.get(element);
    if (cached) return cached;
    const parent = isElement(element.parentNode) ? this.style(element.parentNode) : undefined;
    const declared = this.declared(element);
    const unknown = new Set<string>();
    const inherit = <T,>(key: string, own: T | undefined, parentValue: T | undefined, parentUnknown: boolean): T | undefined => {
      if (own !== undefined) return own;
      if (parentUnknown) unknown.add(key);
      return parentValue;
    };
    const value = (property: string) => {
      const d = declared.get(property);
      if (!d) return undefined;
      if (d.unknown || /^(inherit|initial|unset|revert)$/i.test(d.value) || /var\(|calc\(|env\(/i.test(d.value)) {
        if (!/^inherit$/i.test(d.value)) unknown.add(property);
        return undefined;
      }
      return d.value;
    };
    const computed: Computed = { unknown };
    // Font size: relative to the parent's.
    const sizeValue = value("font-size");
    const parentSize = parent ? parent.size : 16;
    if (sizeValue !== undefined) {
      const size = fontSize(sizeValue, parentSize, this.rootSize);
      if (size === undefined) unknown.add("font-size");
      computed.size = size;
    } else computed.size = inherit("font-size", undefined, parentSize, !!parent?.unknown.has("font-size"));
    if (MONOSPACE.has(element.tagName) && sizeValue === undefined) unknown.add("font-size");
    if (parent?.unknown.has("font-size") && sizeValue !== undefined && /em|%|smaller|larger/.test(sizeValue)) unknown.add("font-size");
    // Weight, italics, letter case, color, visibility: inherited.
    const weightValue = value("font-weight");
    computed.weight = weightValue !== undefined ? fontWeight(weightValue, parent ? parent.weight : 400) : inherit("font-weight", undefined, parent ? parent.weight : 400, !!parent?.unknown.has("font-weight"));
    if (weightValue !== undefined && computed.weight === undefined) unknown.add("font-weight");
    const styleValue = value("font-style");
    computed.italic = styleValue !== undefined ? /italic|oblique/i.test(styleValue) : inherit("font-style", undefined, parent ? parent.italic : false, !!parent?.unknown.has("font-style"));
    const transformValue = value("text-transform");
    computed.transform = transformValue !== undefined ? transformValue.toLowerCase() : inherit("text-transform", undefined, parent ? parent.transform : "none", !!parent?.unknown.has("text-transform"));
    const colorValue = value("color");
    if (colorValue !== undefined) {
      computed.color = /^currentcolor$/i.test(colorValue) ? parent?.color : parseColor(colorValue);
      if (!computed.color) unknown.add("color");
    } else computed.color = inherit("color", undefined, parent ? parent.color : [0, 0, 0, 1], !!parent?.unknown.has("color"));
    const visibilityValue = value("visibility");
    computed.visible = visibilityValue !== undefined ? !/hidden|collapse/i.test(visibilityValue) : inherit("visibility", undefined, parent ? parent.visible : true, !!parent?.unknown.has("visibility"));
    // Hidden boxes: display:none, a zero-size box that clips (`max-height:0;overflow:hidden`), opacity 0, font size 0.
    const display = value("display");
    const overflow = value("overflow") ?? value("overflow-y");
    const clipped = !!overflow && /hidden|clip/i.test(overflow) && ["max-height", "height"].some((p) => {
      const v = value(p);
      return v !== undefined && lengthPx(v) === 0;
    });
    const opacity = value("opacity");
    // Shown only to screen readers: positioned and clipped to nothing (`sr-only`), or moved far off the page.
    const position = value("position");
    const placed = position !== undefined && /^(absolute|fixed)$/i.test(position.trim());
    const clip = value("clip");
    const clipPath = value("clip-path");
    const tiny = ["width", "height"].every((p) => {
      const v = value(p);
      return v !== undefined && (lengthPx(v) ?? 2) <= 1;
    });
    const readerOnly =
      placed &&
      ((clip !== undefined && /^rect\(\s*0(px)?[\s,]+0(px)?[\s,]+0(px)?[\s,]+0(px)?\s*\)$/i.test(clip.trim())) ||
        (clipPath !== undefined && /^inset\(\s*(50|100)%\s*\)$/i.test(clipPath.trim())) ||
        (tiny && !!overflow && /hidden|clip/i.test(overflow)) ||
        ["left", "top"].some((p) => {
          const v = value(p);
          return v !== undefined && (lengthPx(v) ?? 0) <= -999;
        }));
    computed.hidden = (display !== undefined && /^none$/i.test(display)) || clipped || readerOnly || (opacity !== undefined && parseFloat(opacity) === 0) || computed.size === 0;
    if (["display", "overflow", "max-height", "height", "opacity", "position"].some((p) => unknown.has(p))) unknown.add("hides");
    if (placed && ["clip", "clip-path", "left", "top", "width"].some((p) => unknown.has(p))) unknown.add("hides");
    // As the word check reads tags: these don't break words unless styled as boxes; every other tag does.
    computed.block = INLINE_TAGS.has(element.tagName) ? display !== undefined && /^(block|flex|grid|table|list-item|inline-block|inline-flex)/i.test(display) : true;
    // Its own underline.
    const decoration = value("text-decoration-line") ?? value("text-decoration");
    computed.underline = decoration !== undefined ? /underline/i.test(decoration) : false;
    if (unknown.has("text-decoration") || unknown.has("text-decoration-line")) unknown.add("underline");
    // Its own background color.
    const background = value("background-color");
    const image = value("background-image");
    const painted = image !== undefined && !/^none$/i.test(image);
    const stop = painted ? gradientStop(image) : undefined;
    computed.image = painted && /url\(/i.test(image) && !unknown.has("background-image");
    computed.under = unknown.has("background-color") ? undefined : background !== undefined ? parseColor(background) : [0, 0, 0, 0];
    if (unknown.has("background-color") || unknown.has("background-image") || (painted && !stop)) {
      unknown.add("background");
      computed.background = undefined;
    } else {
      computed.background = stop ?? (background !== undefined ? parseColor(background) : [0, 0, 0, 0]);
      if (!computed.background) unknown.add("background");
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
    const pieces: Array<{ text: string; style: WordStyle; shown: boolean }> = [];
    const flush = () => {
      if (buffer) pieces.push({ text: buffer, style: bufferStyle!, shown: bufferShown });
      buffer = "";
      bufferStyle = undefined;
      pieces.push({ text: " ", style: {}, shown: true });
    };
    // Inside the preview text (`data-skip-in-text`): inboxes list it, but it isn't shown, so its styles aren't compared.
    let preview = 0;
    const visit = (node: Node, chain: Element[]) => {
      if (isElement(node)) {
        const style = this.style(node);
        if (MSO_ONLY.test(node.tagName)) return;
        const skipInText = attr(node, "data-skip-in-text") !== undefined;
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
        if (node.tagName === "br" || node.tagName === "img" || node.tagName === "hr") return void flush();
        if (style.block) flush();
        for (const child of node.childNodes) visit(child, [...chain, node]);
        if (style.block) flush();
      }
    };
    const visitText = (node: Node, chain: Element[]) => {
      if (node.nodeName !== "#text") return;
      const element = chain[chain.length - 1];
      if (!element) return;
      const style = this.style(element);
      if (style.visible === false && !style.unknown.has("visibility")) {
        flush();
        return;
      }
      const text = (node as { value: string }).value;
      const wordStyle = preview ? {} : this.wordStyle(chain);
      for (const part of text.split(/(\s+)/)) {
        if (!part) continue;
        if (/^\s+$/.test(part)) {
          flush();
          continue;
        }
        if (!buffer) {
          bufferStyle = wordStyle;
          bufferShown = !preview;
        }
        buffer += part;
      }
    };
    // What's above where it starts counts: <html>'s background and text styles reach the body.
    const ancestors: Element[] = [];
    for (let up = isElement(body) ? body.parentNode : undefined; isElement(up); up = up.parentNode) ancestors.unshift(up);
    visit(body, ancestors);
    flush();
    // Pieces into words; a word that spans styles keeps its first part's style.
    let word = "";
    let style: WordStyle = {};
    let shown = true;
    for (const piece of pieces) {
      if (piece.text === " ") {
        if (word) out.push({ word, style, shown });
        word = "";
        continue;
      }
      if (!word) {
        style = piece.style;
        shown = piece.shown;
      }
      word += piece.text;
    }
    if (word) out.push({ word, style, shown });
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

  /** The links (href), images (src) and image text (alt) a reader gets, in order. */
  targets(): Target[] {
    const out: Target[] = [];
    for (const e of this.elements()) {
      if (e.tagName !== "a" && e.tagName !== "img") continue;
      if (!this.shows(e)) continue;
      if (e.tagName === "a") {
        const href = attr(e, "href")?.trim();
        if (!href) continue;
        const words = this.words(e).map((w) => w.word).join(" ");
        const images = this.elements(e).filter((i) => i.tagName === "img").flatMap((i) => [attr(i, "src"), attr(i, "alt")].filter((v): v is string => !!v?.trim()).map((v) => v.trim()));
        out.push({ kind: "href", value: href.replace(/%22/gi, '"').replace(/%3C/gi, "<").replace(/%3E/gi, ">"), label: words || images.join(", ") });
      } else {
        const src = attr(e, "src")?.trim();
        const alt = attr(e, "alt")?.trim();
        if (src) out.push({ kind: "src", value: src });
        if (alt) out.push({ kind: "alt", value: alt });
      }
    }
    return out;
  }

  /** A word's style from the elements it's in, outermost first. */
  private wordStyle(chain: Element[]): WordStyle {
    const element = chain[chain.length - 1];
    const own = this.style(element);
    const known = (property: string, v: unknown) => (own.unknown.has(property) ? undefined : v);
    let underline: boolean | undefined = false;
    let background: Rgba | undefined = [255, 255, 255, 1];
    let target: string | undefined;
    let inLink = false;
    let image = false;
    // Where images don't load: the color the box with the image sets under it (none set: unknown).
    let under: Rgba | undefined;
    for (const e of chain) {
      const s = this.style(e);
      if (s.image) {
        image = true;
        under = s.under && s.under[3] >= 1 ? s.under : undefined;
      } else if (!s.unknown.has("background") && s.background && s.background[3] >= 1) {
        // A box with a color of its own covers the images behind it.
        image = false;
      } else if (image && under !== undefined) {
        under = s.unknown.has("background") || !s.background ? undefined : over(s.background, under);
      }
      if (s.unknown.has("underline")) underline = undefined;
      else if (underline !== undefined && s.underline) underline = true;
      if (background !== undefined) background = s.unknown.has("background") || !s.background ? undefined : over(s.background, background);
      if (e.tagName === "a" && attr(e, "href") !== undefined) {
        inLink = true;
        target = (attr(e, "target") || "_self").toLowerCase();
      }
    }
    return {
      size: known("font-size", own.size) as number | undefined,
      bold: own.weight === undefined || own.unknown.has("font-weight") ? undefined : own.weight >= 600,
      italic: known("font-style", own.italic) as boolean | undefined,
      transform: known("text-transform", own.transform) as string | undefined,
      underline,
      color: known("color", own.color) as Rgba | undefined,
      background,
      ...(image ? { image, ...(under ? { underImage: under } : {}) } : {}),
      ...(inLink ? { target } : {}),
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
    const m = /^(.*?)\b([\d.]+(?:px|em|rem|%|pt)|xx-small|x-small|small|medium|large|x-large|xx-large|smaller|larger)(?:\s*\/\s*\S+)?\s+.+$/i.exec(value.trim());
    if (!m) return [{ property: "font-size", value: "", unknown: true }, { property: "font-weight", value: "", unknown: true }, { property: "font-style", value: "", unknown: true }];
    const before = m[1].toLowerCase();
    return [
      { property: "font-size", value: m[2], unknown: false },
      { property: "font-weight", value: /\b(bold|bolder|lighter|[1-9]00)\b/.exec(before)?.[1] ?? "normal", unknown: false },
      { property: "font-style", value: /\b(italic|oblique)\b/.test(before) ? "italic" : "normal", unknown: false },
    ];
  }
  if (property === "text-decoration") return [{ property: "text-decoration", value, unknown: false }];
  return [{ property, value, unknown: false }];
}

/**
 * A gradient's first color, when every stop is an opaque color written out:
 * the one color closest to what it paints behind the start of the text. A
 * stop from a variable, or a translucent one, leaves it unknown.
 */
function gradientStop(image: string): Rgba | undefined {
  const args = /^\s*(?:repeating-)?(?:linear|radial|conic)-gradient\((.*)\)\s*$/i.exec(image)?.[1];
  if (!args) return undefined;
  const parts = args.split(/,(?![^(]*\))/).map((part) => part.trim());
  if (/^(to\s|from\s|at\s|[-\d.]+(deg|grad|rad|turn)\b|circle|ellipse|closest|farthest)/i.test(parts[0] ?? "")) parts.shift();
  const colors = parts.map((part) => parseColor(/^((?:rgb|hsl)a?\([^)]*\)|#[0-9a-f]{3,8}|[a-z]+)(?=\s|$)/i.exec(part)?.[1] ?? ""));
  if (!colors.length || colors.some((c) => !c || c[3] < 1)) return undefined;
  return colors[0];
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
  property: (typeof STYLE_PROPERTIES)[number];
  original: string;
  converted: string;
  /** The words that changed this way, in order. */
  words: string[];
}

export interface StyleCheck {
  differences: StyleDifference[];
  /** Words whose styles were compared (both documents show the same words). */
  compared: number;
  /** Properties left out because one side couldn't be worked out. */
  unknown: number;
}

/** A word as the content check reads it ("" for punctuation alone). */
export function normalizeWord(word: string): string {
  const w = word.normalize("NFC").replace(/[​-‍⁠﻿]/g, "").replace(/[-−－﹣]/g, "−");
  if (/\p{N}/u.test(w)) return w.replace(/[^\p{L}\p{N}\p{Sc}.,/:'’+−%‰]/gu, "").replace(/[.,]+$/g, "");
  if (/^[+−±]$/.test(w)) return w;
  return w.replace(/[^\p{L}\p{Sc}%‰]/gu, "");
}

/** The words a reader sees, as the content check reads them, each with its style. */
export function styledWords(html: string | StyledDocument): StyledWord[] {
  return (typeof html === "string" ? new StyledDocument(html) : html)
    .words()
    .flatMap((w) => w.word.split(/\s+/).map((part) => ({ word: normalizeWord(part), style: w.style, shown: w.shown })))
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
  if (a.length !== b.length || a.some((w, i) => w.word !== b[i].word)) return { differences: [], compared: 0, unknown: 0 };
  const groups = new Map<string, StyleDifference>();
  let unknown = 0;
  let compared = 0;
  for (let i = 0; i < a.length; i++) {
    if (!a[i].shown || !b[i].shown) continue;
    compared++;
    for (const property of STYLE_PROPERTIES) {
      const x = a[i].style[property], y = b[i].style[property];
      if (property === "target" && (x === undefined) !== (y === undefined)) continue;
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
      if (x === undefined || y === undefined) {
        if (property !== "target") unknown++;
        continue;
      }
      if (same(property, x, y)) continue;
      const key = `${property}\u0000${show(property, x)}\u0000${show(property, y)}`;
      const group = groups.get(key) ?? { property, original: show(property, x), converted: show(property, y), words: [] };
      group.words.push(a[i].word);
      groups.set(key, group);
    }
  }
  return { differences: [...groups.values()], compared, unknown };
}
