/**
 * Host markup (`<div>`, `<p>`, …) written as react-dom's static render writes it, for the installed React: its
 * attributes (attributes.ts); void, preformatted and custom elements; a `<select>`'s value marking its `<option>`s, an
 * `<input>`'s, `<textarea>`'s, `<button>`'s and `<form>`'s own rules; a `<style>`'s, `<script>`'s and `<title>`'s text
 * (React 18 writes it as any text, escaped; React 19 its one child as it is, but for what would end it). In a <Head>,
 * a `<style>`'s and `<script>`'s text is written as it is in every React (but for what would end it), and a
 * `<title>`'s children rendered: those tags are the document's head. The walker writes the markup of a template with
 * it, and the string exporters (src/exporters) the markup of their blocks.
 *
 * Not written as react-dom 19 writes it, on purpose (src/engine/differential.test.tsx lists each): its hoisting (a
 * `<title>`, `<meta>`, `<link>`, `<style precedence href>` or async `<script>` moved to the start of the markup, and
 * image preloads added), its document singletons (an `<html>` at the top given a `<head>`), and a form's action that's
 * a function (a script that runs it). An email's or a page's markup is a part of the document Elements writes, which
 * has a head of its own (<Head>), and runs no script.
 */
import { attribute, customAttribute, escapeText, objectData } from "./attributes";
import { REACT_18, REACT_18_2 } from "./react-compat";

export { escapeText };

/**
 * Where markup is (react-dom's format context): the value of the `<select>` it's in, which marks its `<option>`s;
 * whether it's in a table, a row or a table's section (whose children start afresh); whether it's a <Head>'s; and
 * whether it's the text of a <Head>'s `<style>` or `<script>`, written as it is.
 */
export interface Format {
  selected?: unknown;
  table?: boolean;
  head?: boolean;
  raw?: boolean;
}
export const TOP: Format = {};

/** Where what's in a `type` element is, as react-dom works it out. */
export function childFormat(format: Format, type: string, props: Record<string, any>): Format {
  const head = format.head;
  switch (type) {
    case "select":
      return { selected: props.value != null ? props.value : props.defaultValue, head };
    case "table":
    case "thead":
    case "tbody":
    case "tfoot":
    case "colgroup":
    case "tr":
      return { table: true, head };
    case "svg":
    case "math":
    case "foreignObject":
      return { head };
    case "noscript":
    case "picture":
      if (!REACT_18) return { head };
      break;
    case "style":
    case "script":
      if (head) return { head, raw: true };
  }
  return format.table ? { head } : format;
}

export const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"]);
const VALID_TAG = /^[a-zA-Z][a-zA-Z:_.\-\d]*$/;
/** SVG's and MathML's elements whose names have a "-", and those react-dom writes its own way: never custom elements. */
const NOT_CUSTOM = new Set(["annotation-xml", "color-profile", "font-face", "font-face-src", "font-face-uri", "font-face-format", "font-face-name", "missing-glyph", "select", "option", "textarea", "title", "listing", "pre", "html", "menuitem"]);
/** React 19 writes these after an element's other attributes: a form's, and an input's or a button's form settings. */
const FIELDS = ["name", "formAction", "formEncType", "formMethod", "formTarget"];
const LATER: Record<string, string[] | undefined> = REACT_18 ? {} : { form: ["action", "encType", "method", "target"], input: FIELDS, button: FIELDS };

/** What react-dom throws for markup it can't write (the walker says where). */
export function validateHost(type: string, props: Record<string, any>): void {
  if (!VALID_TAG.test(type)) throw new Error("Invalid tag: " + type);
  const html = props.dangerouslySetInnerHTML;
  const content = props.children != null || html != null;
  if (VOID.has(type) && content) throw new Error(`${type} is a self-closing tag and must neither have \`children\` nor use \`dangerouslySetInnerHTML\`.`);
  if (type === "menuitem" && content) throw new Error("menuitems cannot have `children` nor `dangerouslySetInnerHTML`.");
  if (html != null && (type === "textarea" || (REACT_18_2 && type === "title"))) throw new Error(`\`dangerouslySetInnerHTML\` does not make sense on <${type}>.`);
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
 * `selected` last (where the `<select>` it's in has a value, whether that's its value), React 19's form settings after
 * the rest, and none for what an element holds as its content (a `<textarea>`'s value) or gives its options (a
 * `<select>`'s).
 */
export function openTag(type: string, props: Record<string, any>, format: Format = TOP): string {
  const custom = isCustom(type, props);
  const later = LATER[type];
  let open = "<" + type;
  for (const key in props) {
    if (!Object.prototype.hasOwnProperty.call(props, key)) continue;
    const value = props[key];
    if (value == null || key === "children" || key === "dangerouslySetInnerHTML" || later?.includes(key)) continue;
    if (custom) open += customAttribute(key, value);
    else if (type === "input" ? /^(value|defaultValue|checked|defaultChecked)$/.test(key) : type === "select" || type === "textarea" ? key === "value" || key === "defaultValue" : type === "option" && key === "selected") continue;
    // A link to nowhere is written (React 19 leaves out other empty URLs).
    else if (value === "" && key === "href" && type === "a") open += ' href=""';
    else open += !REACT_18 && type === "object" && key === "data" ? objectData(value) : attribute(key, value);
  }
  if (later) for (const key of later) if (props[key] != null) open += attribute(key, props[key]);
  if (type === "input") {
    const checked = props.checked != null ? props.checked : props.defaultChecked;
    if (checked && typeof checked !== "function" && typeof checked !== "symbol") open += ' checked=""';
    const value = props.value != null ? props.value : props.defaultValue;
    if (value != null) open += attribute("value", value);
  }
  if (type === "option" && selects(format.selected, props)) open += ' selected=""';
  return VOID.has(type) ? open + "/>" : open + ">";
}

/** Whether an `<option>` is selected: where its `<select>` has a value, whether that's its value (or one of them), else its `selected`. */
function selects(selected: unknown, props: Record<string, any>): boolean {
  if (selected == null) return !!props.selected;
  const value = props.value != null ? "" + props.value : optionText(props.children);
  return Array.isArray(selected) ? selected.some((v) => "" + v === value) : "" + selected === value;
}

/** An option's value where it has none, as react-dom reads it: its children's text, joined (an element's is `[object Object]`). */
function optionText(children: unknown): string {
  let text = "";
  const add = (child: any): void => {
    if (child == null || typeof child === "boolean" || typeof child === "function" || typeof child === "symbol" || (REACT_18 && typeof child === "bigint")) return;
    if (Array.isArray(child)) child.forEach(add);
    else text += child;
  };
  add(children);
  return text;
}

/**
 * What's in the element when its props say it (`dangerouslySetInnerHTML`, a `<textarea>`'s value, React 19's text of a
 * `<style>`, `<script>` or `<title>`), else undefined: its children are walked. react-dom starts a `<pre>`,
 * `<textarea>` or `<listing>` whose text starts with a newline with one more (the parser drops it).
 */
export function propsBody(type: string, props: Record<string, any>, format: Format = TOP): string | undefined {
  const html = props.dangerouslySetInnerHTML;
  if (type === "textarea") return textareaText(props);
  if (html != null) {
    const given = html.__html;
    const body = given == null ? "" : "" + given;
    return (type === "pre" || type === "listing") && typeof given === "string" && given[0] === "\n" ? "\n" + body : body;
  }
  if (type === "menuitem") return "";
  if (REACT_18 || format.head || !/^(style|script|title)$/.test(type)) return undefined;
  // React 19: a script's text if it's a string; a style's or a title's one child (none for more than one).
  const children = props.children;
  if (type === "script") return typeof children === "string" ? escapeScript(children) : "";
  const child = Array.isArray(children) ? (children.length < 2 ? children[0] : null) : children;
  if (child == null || typeof child === "function" || typeof child === "symbol") return "";
  return type === "style" ? escapeStyle("" + child) : escapeText("" + child);
}

/** A `<textarea>`'s text: its value, else its default value, else its one child. */
function textareaText(props: Record<string, any>): string {
  let value = props.value != null ? props.value : props.defaultValue;
  const children = props.children;
  if (children != null) {
    if (value != null) throw new Error("If you supply `defaultValue` on a <textarea>, do not pass children.");
    if (Array.isArray(children) && children.length > 1) throw new Error("<textarea> can only have at most one child.");
    value = "" + children;
  }
  return value == null ? "" : (typeof value === "string" && value[0] === "\n" ? "\n" : "") + escapeText("" + value);
}

/** The newline react-dom adds before a `<pre>`'s or `<listing>`'s text children that start with one. */
export const leadingNewline = (type: string, children: unknown): string => ((type === "pre" || type === "listing") && typeof children === "string" && children[0] === "\n" ? "\n" : "");

/** A `<style>`'s text as React 19 writes it: what would end one (`</style`) or start one escaped, as CSS reads it. */
export const escapeStyle = (text: string) => text.replace(/(<\/|<)(s)(tyle)/gi, (_, before: string, s: string, after: string) => before + (s === "s" ? "\\73 " : "\\53 ") + after);
/** A `<script>`'s text as React 19 writes it: what would end one (`</script`) or start one escaped, as JavaScript reads it. */
export const escapeScript = (text: string) => text.replace(/(<\/|<)(s)(cript)/gi, (_, before: string, s: string, after: string) => before + (s === "s" ? "\\u0073" : "\\u0053") + after);
/** A <Head>'s `<style>`'s or `<script>`'s text, written as it is: what would end it escaped. */
export const rawText = (type: string, text: string) => (type === "style" ? escapeStyle(text) : escapeScript(text));
