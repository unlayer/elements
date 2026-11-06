/**
 * Whether a declaration's value is one the browser drops: an invalid value
 * makes the whole declaration ignored, so an earlier one for the property
 * applies (`color: red; color: not-a-color` is red). Only values this can
 * judge are called invalid: anything else is kept, and read as before.
 */
import { parseColor } from "./cascade";

const GLOBAL = /^(inherit|initial|unset|revert|revert-layer)$/i;
const LENGTH = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?(px|em|rem|ex|ch|vw|vh|vmin|vmax|vi|vb|svw|svh|lvw|lvh|dvw|dvh|cm|mm|q|in|pt|pc|lh|rlh|cap|ic|rex|rch|cqw|cqh|cqi|cqb|cqmin|cqmax|%)$/i;
const ZERO = /^[+-]?0*\.?0+$/;
const NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i;
const MATH = /^(calc|min|max|clamp|env|attr)\(/i;
const COLOR_WORDS = /^(transparent|currentcolor)$/i;

const lengthy = (v: string, extra: RegExp) => LENGTH.test(v) || ZERO.test(v) || MATH.test(v) || extra.test(v);
const color = (v: string) => COLOR_WORDS.test(v) || parseColor(v) !== undefined || /^(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix|light-dark)\(/i.test(v) || /^-webkit-|^(canvas|canvastext|linktext|visitedtext|activetext|buttonface|buttontext|field|fieldtext|graytext|highlight|highlighttext|mark|marktext|accentcolor|accentcolortext)$/i.test(v);
const tokens = (v: string) => v.match(/[a-z-]+\((?:[^()]|\([^()]*\))*\)|"[^"]*"|'[^']*'|[^\s,/]+/gi) ?? [];
const box = (v: string, extra: RegExp) => {
  const parts = tokens(v);
  return parts.length >= 1 && parts.length <= 4 && parts.every((p) => lengthy(p, extra));
};

const VALID: Record<string, (v: string) => boolean> = {
  color,
  "background-color": color,
  display: (v) => /^(none|contents|block|inline|inline-block|flow|flow-root|list-item|table|inline-table|table-row|table-cell|table-row-group|table-header-group|table-footer-group|table-column|table-column-group|table-caption|flex|inline-flex|grid|inline-grid|ruby|ruby-text|-webkit-box|-webkit-inline-box|-moz-box|run-in)(\s+(block|inline|flow|flow-root|list-item|table|flex|grid|ruby))*$/i.test(v),
  visibility: (v) => /^(visible|hidden|collapse)$/i.test(v),
  opacity: (v) => NUMBER.test(v) || /^[+-]?(\d+\.?\d*|\.\d+)%$/.test(v) || MATH.test(v),
  "font-size": (v) => lengthy(v, /^(xx-small|x-small|small|medium|large|x-large|xx-large|xxx-large|larger|smaller|math)$/i),
  "font-weight": (v) => /^(normal|bold|bolder|lighter)$/i.test(v) || (NUMBER.test(v) && Number(v) >= 1 && Number(v) <= 1000) || MATH.test(v),
  "font-style": (v) => /^(normal|italic|oblique)(\s+[+-]?[\d.]+(deg|grad|rad|turn))?$/i.test(v),
  "text-transform": (v) => /^(none|capitalize|uppercase|lowercase|full-width|full-size-kana|math-auto)(\s+(full-width|full-size-kana))*$/i.test(v),
  "text-decoration-line": (v) => /^(none|spelling-error|grammar-error)$/i.test(v) || tokens(v).every((t) => /^(underline|overline|line-through|blink)$/i.test(t)),
  "text-decoration": (v) => tokens(v).every((t) => /^(none|underline|overline|line-through|blink|solid|double|dotted|dashed|wavy|auto|from-font)$/i.test(t) || color(t) || lengthy(t, /^$/)),
  "text-align": (v) => /^(left|right|center|justify|start|end|match-parent|justify-all|-webkit-(center|left|right|auto|match-parent)|-moz-(center|left|right))$/i.test(v),
  "text-indent": (v) => tokens(v).every((t) => lengthy(t, /^(hanging|each-line)$/i)),
  width: (v) => lengthy(v, /^(auto|min-content|max-content|fit-content|stretch|-webkit-fill-available|-moz-available|fit-content\(.*\))$/i),
  "min-width": (v) => lengthy(v, /^(auto|min-content|max-content|fit-content|stretch|-webkit-fill-available)$/i),
  "max-width": (v) => lengthy(v, /^(none|min-content|max-content|fit-content|stretch|-webkit-fill-available)$/i),
  height: (v) => lengthy(v, /^(auto|min-content|max-content|fit-content|stretch)$/i),
  "max-height": (v) => lengthy(v, /^(none|min-content|max-content|fit-content|stretch)$/i),
  margin: (v) => box(v, /^auto$/i),
  padding: (v) => box(v, /^$/),
  ...Object.fromEntries(["top", "right", "bottom", "left"].flatMap((side) => [[`margin-${side}`, (v: string) => lengthy(v, /^auto$/i)], [`padding-${side}`, (v: string) => lengthy(v, /^$/)]])),
  overflow: (v) => tokens(v).length <= 2 && tokens(v).every((t) => /^(visible|hidden|clip|scroll|auto|overlay)$/i.test(t)),
  "overflow-x": (v) => /^(visible|hidden|clip|scroll|auto|overlay)$/i.test(v),
  "overflow-y": (v) => /^(visible|hidden|clip|scroll|auto|overlay)$/i.test(v),
  position: (v) => /^(static|relative|absolute|fixed|sticky|-webkit-sticky)$/i.test(v),
  float: (v) => /^(none|left|right|inline-start|inline-end)$/i.test(v),
  direction: (v) => /^(ltr|rtl)$/i.test(v),
};

/** The declaration is dropped by the browser: its value can't be what the property takes. */
export function isInvalid(property: string, value: string): boolean {
  const v = value.trim();
  if (!v) return true;
  if (GLOBAL.test(v) || /var\(/i.test(v)) return false; // a variable is checked once it's substituted
  // A function this doesn't know (other than calc() and its kin, which give numbers) isn't judged.
  if ([...v.matchAll(/([a-z-]+)\(/gi)].some((m) => !/^(calc|min|max|clamp|rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix|light-dark)$/i.test(m[1]))) return false;
  const valid = VALID[property.toLowerCase()];
  return valid ? !valid(v) : false;
}
