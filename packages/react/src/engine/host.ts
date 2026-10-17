/**
 * Host markup (`<div>`, `<p>`, …) written as react-dom's static render writes it: its attributes (attributes.ts),
 * void, preformatted and custom elements, an `<input>`'s and `<textarea>`'s value. The walker writes the markup of a
 * template with it, and the string exporters (src/exporters) the markup of their blocks. Not written: React 19's
 * hoisting (`<title>`, `<meta>`, `<link>` and image preloads moved to a head) and forms' actions, which an email's or
 * page's markup has no use for, and `<select value>` marking its `<option>`s.
 */
import { attribute, customAttribute, escapeText } from "./attributes";
import { REACT_18 } from "./react-compat";

export { escapeText };

export const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr", "menuitem"]);
const VALID_TAG = /^[a-zA-Z][a-zA-Z:_.\-\d]*$/;
/** SVG's and MathML's elements whose names have a "-", and those react-dom writes its own way: never custom elements. */
const NOT_CUSTOM = new Set(["annotation-xml", "color-profile", "font-face", "font-face-src", "font-face-uri", "font-face-format", "font-face-name", "missing-glyph", "select", "option", "textarea", "title", "listing", "pre", "html"]);

const skip = (value: unknown) => typeof value === "function" || typeof value === "symbol";

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

/** Whether react-dom writes `type` as a custom element: a name with "-" (in React 18, also one with an `is`). */
const isCustom = (type: string, props: Record<string, any>) => !VOID.has(type) && !NOT_CUSTOM.has(type) && (type.includes("-") || (REACT_18 && typeof props.is === "string"));

/**
 * `<type …>` with its attributes as react-dom writes them: an `<input>`'s `checked` and `value` last, an `<option>`'s
 * `selected` last, a `<select>`'s `value` on none (it marks an option, which this doesn't).
 */
export function openTag(type: string, props: Record<string, any>): string {
  const custom = isCustom(type, props);
  const p = type === "input" ? inputProps(props) : type === "textarea" ? textareaProps(props) : props;
  let open = "<" + type;
  for (const key in p) {
    if (!Object.prototype.hasOwnProperty.call(p, key)) continue;
    const value = p[key];
    if (value == null || key === "children" || key === "dangerouslySetInnerHTML" || key === "__text") continue;
    if (key === "__checked") open += ' checked=""';
    else if (custom) open += customAttribute(key, value);
    // A link to nowhere is written (React 19 leaves out other empty URLs).
    else if (value === "" && key === "href" && type === "a") open += ' href=""';
    else if (type === "select" ? key !== "value" && key !== "defaultValue" : type !== "option" || key !== "selected") open += attribute(key, value);
  }
  if (type === "option" && p.selected) open += ' selected=""';
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
  if (text == null && children != null) {
    if (Array.isArray(children) && children.length > 1) throw new Error("<textarea> can only have at most one child.");
    text = Array.isArray(children) ? children[0] : children;
  }
  return { ...rest, __text: text == null ? "" : "" + text };
}
