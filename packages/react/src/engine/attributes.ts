/**
 * An element's attributes as react-dom/server writes them (React 18's property table, React 19's attribute switch):
 * which props it writes, under which name, and how it writes their values, its `style` included; and text, escaped as
 * React escapes it. The walker's host markup (host.ts) and the string exporters (src/exporters) both write with these.
 */
import { unrunUrl } from "@unlayer-internal/shared-elements";
import { REACT_18, REACT_19_3 } from "./react-compat";

const MATCH_HTML = /["'&<>]/;
const ESCAPES: Record<string, string> = { '"': "&quot;", "&": "&amp;", "'": "&#x27;", "<": "&lt;", ">": "&gt;" };

/** Text or an attribute's value, escaped as React escapes it. */
export function escapeText(value: unknown): string {
  const text = "" + value;
  return MATCH_HTML.test(text) ? text.replace(/["'&<>]/g, (c) => ESCAPES[c]) : text;
}

const NAME_START = ":A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD";
/** An attribute name React writes (others it leaves out). */
const SAFE_NAME = new RegExp(`^[${NAME_START}][${NAME_START}\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$`);

/**
 * A URL attribute's value: a `javascript:` URL (as React 19 tells one) as one that throws, as React 19 writes it, with
 * any React (React 18 writes it as given), so a link from data runs nothing. (A character reference in it can't make
 * one: its `&` is written `&amp;`.)
 */
const url = (value: string) => unrunUrl(value);
/** A value React writes as text, a `javascript:` URL as url() writes it; others as they are. */
export const unrun = (value: unknown) => (value == null || typeof value == "boolean" || typeof value == "function" || typeof value == "symbol" ? value : url("" + value));

/**
 * How React writes a prop it knows: as a string (S), as a boolean attribute (B: present or not), as either (O), as a
 * number (N), a positive number (P), "true" or "false" (Y), a URL (U: React 19's; L: React 18's, a string), or not at
 * all (X).
 */
type Kind = "S" | "B" | "O" | "N" | "P" | "Y" | "U" | "L" | "X";

/** The props React writes otherwise than as a string under their own name: the attribute's name, and how. */
const RULES = new Map<string, [string, Kind]>();
const rule = (names: string, kind: Kind, attribute: (name: string) => string = (name) => name) => {
  for (const name of names.split(" ")) RULES.set(name, [attribute(name), kind]);
};
const lower = (name: string) => name.toLowerCase();
// SVG's attributes, XML's and two of HTML's, which their props name in camel case (React's list, and its camel case).
const CAMEL_CASED = "accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type xml:base xml:lang xml:space accept-charset http-equiv";
for (const attribute of `${CAMEL_CASED}${REACT_18 ? "" : " transform-origin"}${REACT_19_3 ? " mask-type" : ""}`.split(" ")) {
  RULES.set(attribute.replace(/[-:]([a-z])/g, (_, letter: string) => letter.toUpperCase()), [attribute, "S"]);
}
rule("className htmlFor tabIndex crossOrigin", "S", (name) => (name === "className" ? "class" : name === "htmlFor" ? "for" : lower(name)));
rule("defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning ref key", "X");
rule("capture download", "O");
rule("cols rows size span", "P");
const BOOLEANS = "allowFullScreen async autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope";
if (REACT_18) {
  rule(`${BOOLEANS} autoFocus checked multiple muted selected`, "B", lower);
  rule("contentEditable draggable spellCheck value", "Y", lower);
  rule("autoReverse externalResourcesRequired focusable preserveAlpha", "Y");
  rule("rowSpan start", "N", lower);
  rule("src href action formAction", "L", lower);
  RULES.set("xlinkHref", ["xlink:href", "L"]);
} else {
  rule(`${BOOLEANS} inert${REACT_19_3 ? " credentialless" : ""}`, "B");
  rule("autoFocus multiple muted", "B", lower);
  rule("contentEditable draggable spellCheck value autoReverse externalResourcesRequired focusable preserveAlpha", "Y");
  rule("rowSpan start", "N");
  rule("src href action formAction", "U");
  RULES.set("xlinkHref", ["xlink:href", "U"]);
}

const written = (name: string, value: unknown) => ` ${name}="${escapeText(value)}"`;

/** An `<object>`'s `data` as React 19 writes it: a URL, any value as text (an empty one left out). */
export function objectData(value: unknown): string {
  const data = url("" + value);
  return data ? written("data", data) : "";
}

/** A prop of an element as React writes it (` name="value"`), or "" where it writes none. */
export function attribute(name: string, value: unknown): string {
  if (name === "style") return style(value);
  const known = RULES.get(name);
  // An event handler's prop (`onClick`, `onclick`).
  if (!known && name.length > 2 && (name[0] === "o" || name[0] === "O") && (name[1] === "n" || name[1] === "N")) return "";
  const [attribute, kind] = known ?? [name, undefined];
  if (kind === "X" || typeof value === "function" || typeof value === "symbol") return "";
  switch (kind) {
    case "B":
      return value ? ` ${attribute}=""` : "";
    case "O":
      return value === true ? ` ${attribute}=""` : value === false ? "" : written(attribute, value);
    case "Y":
      return written(attribute, value);
    case "N":
    case "P":
      // (React 18 leaves a boolean out; React 19 writes it, as a number would be.)
      return (REACT_18 && typeof value === "boolean") || isNaN(value as number) || (kind === "P" && !((value as number) >= 1)) ? "" : written(attribute, value);
    case "U":
      return typeof value === "boolean" || (value === "" && (name === "src" || name === "href")) ? "" : written(attribute, url("" + value));
    case "L":
    case "S":
      return typeof value === "boolean" ? "" : written(attribute, kind === "L" ? url("" + value) : value);
    default:
      // Any other: written as given, where it's a name an attribute can have (and a boolean only in data-* and aria-*).
      return !SAFE_NAME.test(attribute) || (typeof value === "boolean" && !/^(data|aria)-/i.test(attribute)) ? "" : written(attribute, value);
  }
}

/**
 * A prop of a custom element (`<my-widget>`; in React 18 also one with an `is`): React 18 writes each as it's given
 * (`className` too, a boolean as "true" or "false"), React 19 `className` as `class`, `true` as an empty value, and
 * neither `false` nor an object. (A string handler, `onclick="…"`, is written as any other.)
 */
export function customAttribute(name: string, value: unknown): string {
  if (name === "style") return style(value);
  if (name === "suppressContentEditableWarning" || name === "suppressHydrationWarning" || typeof value === "function" || typeof value === "symbol") return "";
  if (REACT_18) return SAFE_NAME.test(name) ? written(name, value) : "";
  if (name === "className") name = "class";
  if (name === "ref" || name === "key" || value === false || (typeof value === "object" && value !== null) || !SAFE_NAME.test(name)) return "";
  return value === true ? ` ${name}=""` : written(name, value);
}

// The CSS properties whose numbers have no unit: React 18's list, each with the vendor prefixes it adds; React 19's,
// which adds `scale` and lists its prefixed ones.
const UNITLESS = "animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth".split(" ");
const UNITLESS_NUMBERS = new Set(
  REACT_18
    ? UNITLESS.flatMap((name) => [name, ...["Webkit", "ms", "Moz", "O"].map((prefix) => prefix + name[0].toUpperCase() + name.slice(1))])
    : [
        ...UNITLESS,
        ..."scale MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "),
      ]
);

/** Style properties' names as CSS writes them (`marginTop`: `margin-top`), worked out once each: a thousand kept at most (a style's keys can come from data). */
export const cssNames = new Map<string, string>();

/** A `style` prop as React writes it: its declarations in order, names in kebab case, numbers in px where they take a unit. */
export function style(value: unknown): string {
  if (typeof value !== "object") throw new Error("The `style` prop expects a mapping from style properties to values, not a string. For example, style={{marginRight: spacing + 'em'}} when using JSX.");
  let out = "";
  for (const name in value) {
    if (!Object.prototype.hasOwnProperty.call(value, name)) continue;
    const css = (value as Record<string, unknown>)[name];
    if (css == null || typeof css === "boolean" || css === "") continue;
    let declaration: string;
    if (name.indexOf("--") === 0) declaration = `${escapeText(name)}:${escapeText(("" + css).trim())}`;
    else {
      let property = cssNames.get(name);
      if (property === undefined) {
        property = escapeText(name.replace(/([A-Z])/g, "-$1").toLowerCase().replace(/^ms-/, "-ms-"));
        if (cssNames.size < 1000) cssNames.set(name, property);
      }
      declaration = `${property}:${typeof css === "number" ? (css !== 0 && !UNITLESS_NUMBERS.has(name) ? `${css}px` : "" + css) : escapeText(("" + css).trim())}`;
    }
    out += out ? ";" + declaration : declaration;
  }
  return out ? ` style="${out}"` : "";
}
