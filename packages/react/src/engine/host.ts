/**
 * Host markup (`<div>`, `<p>`, …) written as react-dom's static render writes it: React 19's `pushAttribute` (React
 * 18's attribute names where they differ), escaping, styles, void and preformatted elements. Not written: React 19's
 * hoisting (`<title>`, `<meta>`, `<link>` and image preloads moved to a head) and forms' actions, which an email's or
 * page's markup has no use for, and `<select value>` marking its `<option>`s.
 */
import React from "react";

export const REACT_18 = Number.parseInt(React.version) < 19;

const MATCH_HTML = /["'&<>]/;

export function escapeText(value: unknown): string {
  if (typeof value === "boolean" || typeof value === "number" || typeof value === "bigint") return "" + value;
  const text = "" + value;
  if (!MATCH_HTML.test(text)) return text;
  return text.replace(/["'&<>]/g, (c) => (c === '"' ? "&quot;" : c === "&" ? "&amp;" : c === "'" ? "&#x27;" : c === "<" ? "&lt;" : "&gt;"));
}

const UNITLESS = new Set(
  "animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" ")
);

const ALIASES = new Map(
  Object.entries({
    acceptCharset: "accept-charset", htmlFor: "for", httpEquiv: "http-equiv", crossOrigin: "crossorigin", accentHeight: "accent-height", alignmentBaseline: "alignment-baseline", arabicForm: "arabic-form",
    baselineShift: "baseline-shift", capHeight: "cap-height", clipPath: "clip-path", clipRule: "clip-rule", colorInterpolation: "color-interpolation", colorInterpolationFilters: "color-interpolation-filters",
    colorProfile: "color-profile", colorRendering: "color-rendering", dominantBaseline: "dominant-baseline", enableBackground: "enable-background", fillOpacity: "fill-opacity", fillRule: "fill-rule",
    floodColor: "flood-color", floodOpacity: "flood-opacity", fontFamily: "font-family", fontSize: "font-size", fontSizeAdjust: "font-size-adjust", fontStretch: "font-stretch", fontStyle: "font-style",
    fontVariant: "font-variant", fontWeight: "font-weight", glyphName: "glyph-name", glyphOrientationHorizontal: "glyph-orientation-horizontal", glyphOrientationVertical: "glyph-orientation-vertical",
    horizAdvX: "horiz-adv-x", horizOriginX: "horiz-origin-x", imageRendering: "image-rendering", letterSpacing: "letter-spacing", lightingColor: "lighting-color", markerEnd: "marker-end", markerMid: "marker-mid",
    markerStart: "marker-start", overlinePosition: "overline-position", overlineThickness: "overline-thickness", paintOrder: "paint-order", "panose-1": "panose-1", pointerEvents: "pointer-events",
    renderingIntent: "rendering-intent", shapeRendering: "shape-rendering", stopColor: "stop-color", stopOpacity: "stop-opacity", strikethroughPosition: "strikethrough-position",
    strikethroughThickness: "strikethrough-thickness", strokeDasharray: "stroke-dasharray", strokeDashoffset: "stroke-dashoffset", strokeLinecap: "stroke-linecap", strokeLinejoin: "stroke-linejoin",
    strokeMiterlimit: "stroke-miterlimit", strokeOpacity: "stroke-opacity", strokeWidth: "stroke-width", textAnchor: "text-anchor", textDecoration: "text-decoration", textRendering: "text-rendering",
    transformOrigin: "transform-origin", underlinePosition: "underline-position", underlineThickness: "underline-thickness", unicodeBidi: "unicode-bidi", unicodeRange: "unicode-range", unitsPerEm: "units-per-em",
    vAlphabetic: "v-alphabetic", vHanging: "v-hanging", vIdeographic: "v-ideographic", vMathematical: "v-mathematical", vectorEffect: "vector-effect", vertAdvY: "vert-adv-y", vertOriginX: "vert-origin-x",
    vertOriginY: "vert-origin-y", wordSpacing: "word-spacing", writingMode: "writing-mode", xmlnsXlink: "xmlns:xlink", xHeight: "x-height",
    xlinkActuate: "xlink:actuate", xlinkArcrole: "xlink:arcrole", xlinkRole: "xlink:role", xlinkShow: "xlink:show", xlinkTitle: "xlink:title", xlinkType: "xlink:type", xmlBase: "xml:base", xmlLang: "xml:lang", xmlSpace: "xml:space",
  })
);

const BOOLEANS = new Set(
  "inert allowFullScreen async autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ")
);
const BOOLEANISH = new Set("contentEditable spellCheck draggable value autoReverse externalResourcesRequired focusable preserveAlpha".split(" "));
/** React 18 writes these lowercased (its DOMProperty table). */
const LOWER_18 = new Set("readOnly allowFullScreen autoPlay disablePictureInPicture disableRemotePlayback formNoValidate noModule noValidate playsInline itemScope contentEditable spellCheck".split(" "));
const VALID_ATTRIBUTE_NAME = /^[:A-Z_a-zÀ-ÖØ-öø-˿Ͱ-ͽͿ-῿‌-‍⁰-↏Ⰰ-⿯、-퟿豈-﷏ﷰ-�][:A-Z_a-zÀ-ÖØ-öø-˿Ͱ-ͽͿ-῿‌-‍⁰-↏Ⰰ-⿯、-퟿豈-﷏ﷰ-�\-.0-9·̀-ͯ‿-⁀]*$/;
const JAVASCRIPT_URL = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
export const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr", "menuitem"]);
const VALID_TAG = /^[a-zA-Z][a-zA-Z:_.\-\d]*$/;
const styleNames = new Map<string, string>();

const skip = (value: unknown) => typeof value === "function" || typeof value === "symbol";
const sanitizeURL = (url: string) => (!REACT_18 && JAVASCRIPT_URL.test(url) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : url);

function style(value: Record<string, unknown>): string {
  let out = "";
  for (const name in value) {
    if (!Object.prototype.hasOwnProperty.call(value, name)) continue;
    let v = value[name];
    if (v == null || typeof v === "boolean" || v === "") continue;
    let chunk: string;
    if (name.indexOf("--") === 0) {
      chunk = escapeText(name);
      v = escapeText(("" + v).trim());
    } else {
      chunk = styleNames.get(name) ?? escapeText(name.replace(/([A-Z])/g, "-$1").toLowerCase().replace(/^ms-/, "-ms-"));
      styleNames.set(name, chunk);
      v = typeof v === "number" ? (v === 0 || UNITLESS.has(name) ? "" + v : v + "px") : escapeText(("" + v).trim());
    }
    out += (out ? ";" : "") + chunk + ":" + v;
  }
  return out ? ` style="${out}"` : "";
}

/** One attribute, as React 19's `pushAttribute` writes it. */
function attribute(name: string, value: any): string {
  switch (name) {
    case "className":
      return skip(value) || typeof value === "boolean" ? "" : ` class="${escapeText(value)}"`;
    case "tabIndex":
      return skip(value) || typeof value === "boolean" ? "" : ` tabindex="${escapeText(value)}"`;
    case "dir":
    case "role":
    case "viewBox":
    case "width":
    case "height":
      return skip(value) || typeof value === "boolean" ? "" : ` ${name}="${escapeText(value)}"`;
    case "style":
      return style(value);
    case "src":
    case "href":
      if (value === "" && !REACT_18) return "";
    // falls through
    case "action":
    case "formAction":
      if (skip(value) || typeof value === "boolean") return "";
      return ` ${name}="${escapeText(sanitizeURL("" + value))}"`;
    case "defaultValue":
    case "defaultChecked":
    case "innerHTML":
    case "suppressContentEditableWarning":
    case "suppressHydrationWarning":
    case "ref":
    case "key":
      return "";
    case "autoFocus":
    case "multiple":
    case "muted":
      return value && !skip(value) ? ` ${name.toLowerCase()}=""` : "";
    case "xlinkHref":
      return skip(value) || typeof value === "boolean" ? "" : ` xlink:href="${escapeText(sanitizeURL("" + value))}"`;
    case "capture":
    case "download":
      return value === true ? ` ${name}=""` : value === false || skip(value) ? "" : ` ${name}="${escapeText(value)}"`;
    case "cols":
    case "rows":
    case "size":
    case "span":
      return skip(value) || isNaN(value) || !(value >= 1) ? "" : ` ${name}="${escapeText(value)}"`;
    case "rowSpan":
    case "start":
      return skip(value) || isNaN(value) ? "" : ` ${name}="${escapeText(value)}"`;
  }
  if (BOOLEANS.has(name)) return value && !skip(value) ? ` ${REACT_18 && LOWER_18.has(name) ? name.toLowerCase() : name}=""` : "";
  if (BOOLEANISH.has(name)) return skip(value) ? "" : ` ${REACT_18 && LOWER_18.has(name) ? name.toLowerCase() : name}="${escapeText(value)}"`;
  if (name.length > 2 && (name[0] === "o" || name[0] === "O") && (name[1] === "n" || name[1] === "N")) return "";
  const attr = ALIASES.get(name) ?? name;
  if (!VALID_ATTRIBUTE_NAME.test(attr) || skip(value)) return "";
  if (typeof value === "boolean") {
    const prefix = attr.toLowerCase().slice(0, 5);
    if (prefix !== "data-" && prefix !== "aria-") return "";
  }
  return ` ${attr}="${escapeText(value)}"`;
}

/** A custom element's attribute (a name with "-"), as React 19 writes one. */
function customAttribute(name: string, value: any): string {
  if (name === "style") return style(value);
  if (name === "className") name = "class";
  if (skip(value) || (typeof value === "object" && value !== null) || value === false || name === "suppressContentEditableWarning" || name === "suppressHydrationWarning" || name === "ref" || name === "key") return "";
  if (name.length > 2 && name[0] === "o" && name[1] === "n") return "";
  if (!VALID_ATTRIBUTE_NAME.test(name)) return "";
  return value === true ? ` ${name}=""` : ` ${name}="${escapeText(value)}"`;
}

/** What react-dom throws for markup it can't write (the walker says where). */
export function validateHost(type: string, props: Record<string, any>): void {
  if (!VALID_TAG.test(type)) throw new Error("Invalid tag: " + type);
  const html = props.dangerouslySetInnerHTML;
  if (VOID.has(type.toLowerCase()) && (props.children != null || html != null)) throw new Error(`${type} is a self-closing tag and must neither have \`children\` nor use \`dangerouslySetInnerHTML\`.`);
  if (props.style != null && typeof props.style !== "object")
    throw new Error("The `style` prop expects a mapping from style properties to values, not a string. For example, style={{marginRight: spacing + 'em'}} when using JSX.");
  if (html != null) {
    if (props.children != null) throw new Error("Can only set one of `children` or `props.dangerouslySetInnerHTML`.");
    if (typeof html !== "object" || !("__html" in html)) throw new Error("`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`.");
  }
}

/** `<type …>` with its attributes (an `<input>`'s `checked` and `value` last, as react-dom writes them). */
export function openTag(type: string, props: Record<string, any>): string {
  const custom = type.includes("-");
  const p = type === "input" ? inputProps(props) : type === "textarea" ? textareaProps(props) : props;
  let open = "<" + type;
  for (const key in p) {
    if (!Object.prototype.hasOwnProperty.call(p, key)) continue;
    const value = p[key];
    if (value == null || key === "children" || key === "dangerouslySetInnerHTML" || key === "__text") continue;
    if (key === "__checked") open += ' checked=""';
    else open += custom ? customAttribute(key, value) : attribute(key, value);
  }
  return VOID.has(type) ? open + "/>" : open + ">";
}

/**
 * What's in the element when props say it (`dangerouslySetInnerHTML`, a `<textarea>`'s value), else undefined: its
 * children are walked. react-dom starts a `<pre>`, `<textarea>` or `<listing>` whose text starts with a newline with
 * one more (the parser drops it).
 */
export function propsBody(type: string, props: Record<string, any>): string | undefined {
  const html = props.dangerouslySetInnerHTML;
  const preformatted = type === "pre" || type === "textarea" || type === "listing";
  if (html != null) {
    const body = html.__html == null ? "" : "" + html.__html;
    return preformatted && body[0] === "\n" ? "\n" + body : body;
  }
  if (type === "textarea") {
    const text = escapeText(textareaProps(props).__text);
    return text[0] === "\n" ? "\n" + text : text;
  }
  return undefined;
}

/** The newline react-dom adds before a `<pre>`'s or `<listing>`'s text children that start with one. */
export const leadingNewline = (type: string, children: unknown): string => ((type === "pre" || type === "listing") && typeof children === "string" && children[0] === "\n" ? "\n" : "");

function inputProps(props: Record<string, any>): Record<string, any> {
  const { value, defaultValue, checked, defaultChecked, ...rest } = props;
  const out: Record<string, any> = rest;
  const c = checked ?? defaultChecked;
  if (c && !skip(c)) out.__checked = true;
  const v = value ?? defaultValue;
  if (v != null) out.value = v;
  return out;
}

function textareaProps(props: Record<string, any>): Record<string, any> {
  const { value, defaultValue, children, ...rest } = props;
  let text = value ?? defaultValue;
  if (text == null && children != null) text = Array.isArray(children) ? children.join("") : children;
  return { ...rest, __text: text == null ? "" : "" + text };
}
