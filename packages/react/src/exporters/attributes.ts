/**
 * An element's attributes as react-dom/server writes them (React 18's property table, React 19's attribute switch):
 * which props it writes, under which name, and how it writes their values, its `style` included.
 */
import { REACT_18, REACT_19_3 } from "./react-version";

const ESCAPES: Record<string, string> = { '"': "&quot;", "&": "&amp;", "'": "&#x27;", "<": "&lt;", ">": "&gt;" };

/** Text or an attribute's value, escaped as React escapes it. */
export const escape = (value: unknown): string => ("" + value).replace(/["&'<>]/g, (c) => ESCAPES[c]);

const NAME_START = ":A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD";
/** An attribute name React writes (others it leaves out). */
export const SAFE_NAME = new RegExp(`^[${NAME_START}][${NAME_START}\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$`);

const JAVASCRIPT_URL = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
/** A URL attribute's value: React 19 writes a `javascript:` URL as one that throws. */
const url = (value: string) => (JAVASCRIPT_URL.test(value) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : value);

/**
 * How React writes a prop it knows: as a string (S), as a boolean attribute (B: present or not), as either (O), as a
 * number (N), a positive number (P), "true" or "false" (Y), a URL (U), or not at all (X).
 */
type Kind = "S" | "B" | "O" | "N" | "P" | "Y" | "U" | "X";

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
rule("defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning ref", "X");
rule("capture download", "O");
rule("cols rows size span", "P");
const BOOLEANS = "allowFullScreen async autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope";
if (REACT_18) {
  rule(`${BOOLEANS} autoFocus checked multiple muted selected`, "B", lower);
  rule("contentEditable draggable spellCheck value", "Y", lower);
  rule("autoReverse externalResourcesRequired focusable preserveAlpha", "Y");
  rule("rowSpan start", "N", lower);
  rule("src href action formAction", "S", lower);
  RULES.set("xlinkHref", ["xlink:href", "S"]);
} else {
  rule(`${BOOLEANS} inert${REACT_19_3 ? " credentialless" : ""}`, "B");
  rule("autoFocus multiple muted", "B", lower);
  rule("contentEditable draggable spellCheck value autoReverse externalResourcesRequired focusable preserveAlpha", "Y");
  rule("rowSpan start", "N");
  rule("src href action formAction", "U");
  RULES.set("xlinkHref", ["xlink:href", "U"]);
}

const written = (name: string, value: unknown) => ` ${name}="${escape(value)}"`;

/** A prop of an element as React writes it (` name="value"`), or "" where it writes none. */
export function attribute(name: string, value: unknown): string {
  if (name === "style") return style(value);
  const known = RULES.get(name);
  // An event handler's prop (`onClick`, `onclick`).
  if (!known && name.length > 2 && /^on/i.test(name)) return "";
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
    case "S":
      return typeof value === "boolean" ? "" : written(attribute, value);
    default:
      // Any other: written as given, where it's a name an attribute can have (and a boolean only in data-* and aria-*).
      return !SAFE_NAME.test(attribute) || (typeof value === "boolean" && !/^(data|aria)-/i.test(attribute)) ? "" : written(attribute, value);
  }
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

/** A `style` prop as React writes it: its declarations in order, names in kebab case, numbers in px where they take a unit. */
export function style(value: unknown): string {
  if (typeof value !== "object") throw new Error("The `style` prop expects a mapping from style properties to values, not a string.");
  const declarations: string[] = [];
  for (const name in value) {
    if (!Object.prototype.hasOwnProperty.call(value, name)) continue;
    const css = (value as Record<string, unknown>)[name];
    if (css == null || typeof css === "boolean" || css === "") continue;
    if (name.indexOf("--") === 0) declarations.push(`${escape(name)}:${escape(("" + css).trim())}`);
    else {
      const property = escape(name.replace(/([A-Z])/g, "-$1").toLowerCase().replace(/^ms-/, "-ms-"));
      declarations.push(`${property}:${typeof css === "number" ? (css !== 0 && !UNITLESS_NUMBERS.has(name) ? `${css}px` : "" + css) : escape(("" + css).trim())}`);
    }
  }
  return declarations.length ? ` style="${declarations.join(";")}"` : "";
}
