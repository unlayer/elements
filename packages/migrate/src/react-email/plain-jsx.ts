/**
 * HTML React rendered, back as JSX: for a block the migration keeps as markup where it can write it with HTML
 * elements only (see `plainKept` in codemod.ts), so the migrated file doesn't need React Email's components. Markers
 * (`slot(i)`) stand for what comes from code: in text (children) and as an attribute's or a style property's whole
 * value. Anything else (a comment, a marker inside other text, a <style>) can't be written: `Unwritable`.
 */

import { parseFragment, type DefaultTreeAdapterMap } from "parse5";

type ChildNode = DefaultTreeAdapterMap["childNode"];
type Element = DefaultTreeAdapterMap["element"];

export class Unwritable extends Error {}

/** The marker for slot `i` (private-use characters, which neither markup nor a template's text holds). */
export const slot = (i: number, set = 0) => (set ? `${i}` : `${i}`);
const SLOT_RE = /(\d+)/g;
const ANY_SLOT = /|||/;

const SVG = "http://www.w3.org/2000/svg";
const VOID = new Set("area base br col embed hr img input link meta param source track wbr".split(" "));

/** HTML attribute names React writes otherwise, and its props are named so (parse5 reads names in lowercase). */
const REACT_NAMES: Record<string, string> = {
  class: "className", for: "htmlFor", cellpadding: "cellPadding", cellspacing: "cellSpacing", colspan: "colSpan",
  rowspan: "rowSpan", valign: "vAlign", bgcolor: "bgColor", tabindex: "tabIndex", srcset: "srcSet", crossorigin: "crossOrigin",
  referrerpolicy: "referrerPolicy", datetime: "dateTime", frameborder: "frameBorder", allowfullscreen: "allowFullScreen",
  maxlength: "maxLength", minlength: "minLength", readonly: "readOnly", usemap: "useMap", "http-equiv": "httpEquiv",
  charset: "charSet", contenteditable: "contentEditable", spellcheck: "spellCheck", accesskey: "accessKey",
  autocomplete: "autoComplete", enctype: "encType", novalidate: "noValidate", hreflang: "hrefLang", marginwidth: "marginWidth",
  marginheight: "marginHeight", itemprop: "itemProp", itemscope: "itemScope", itemtype: "itemType", fetchpriority: "fetchPriority",
  "xlink:href": "xlinkHref", "xml:space": "xmlSpace", "xml:lang": "xmlLang",
};
/** Props React's types take as numbers only. */
const NUMERIC = new Set(["border", "colSpan", "rowSpan", "tabIndex", "span", "start", "size", "cols", "rows", "maxLength", "minLength"]);
/** Props React writes as `name=""` when true. */
const BOOLEAN = new Set(["hidden", "reversed", "disabled", "checked", "readOnly", "allowFullScreen", "itemScope", "noValidate", "open", "selected", "multiple", "required", "autoFocus", "defer", "async", "noModule", "playsInline", "controls", "loop", "muted", "autoPlay"]);

/**
 * `html` as JSX. `code(i)`: what slot `i` stands for, as code (a child's is written in braces). `roots`: how many
 * elements and texts it has at the top.
 */
export function htmlToJsx(html: string, code: (i: number) => string): { jsx: string; roots: number } {
  const fragment = parseFragment(html);
  const roots = fragment.childNodes.filter((n) => n.nodeName !== "#text" || (n as DefaultTreeAdapterMap["textNode"]).value.trim());
  return { jsx: fragment.childNodes.map((n) => node(n, code)).join(""), roots: roots.length };
}

function node(n: ChildNode, code: (i: number) => string): string {
  if (n.nodeName === "#text") return text((n as DefaultTreeAdapterMap["textNode"]).value, code);
  if (n.nodeName === "#comment" || !("tagName" in n)) throw new Unwritable("a comment");
  const element = n as Element;
  const tag = element.tagName;
  if (/^(script|style|template|noscript)$/.test(tag)) throw new Unwritable(`a <${tag}>`);
  const svg = element.namespaceURI === SVG;
  const attrs = element.attrs.map((a) => attribute(a.prefix ? `${a.prefix}:${a.name}` : a.name, a.value, svg, code)).join("");
  const children = element.childNodes.map((c) => node(c, code)).join("");
  return VOID.has(tag) && !children ? `<${tag}${attrs} />` : `<${tag}${attrs}>${children}</${tag}>`;
}

/** Text as JSX: written as it is where JSX reads it so, else as a string; slots as the code they stand for. */
function text(value: string, code: (i: number) => string): string {
  let out = "";
  let at = 0;
  const plain = (s: string) => {
    if (!s) return;
    if (ANY_SLOT.test(s)) throw new Unwritable("a value inside other text");
    // As written where JSX reads it the same: on one line, not only spaces, no spaces JSX would join.
    out += /[{}<>&\r\n\t]/.test(s) || !s.trim() || s.includes("  ") ? `{${JSON.stringify(s)}}` : s;
  };
  for (const match of value.matchAll(SLOT_RE)) {
    plain(value.slice(at, match.index));
    out += `{${code(Number(match[1]))}}`;
    at = match.index! + match[0].length;
  }
  plain(value.slice(at));
  return out;
}

/** The slot a value is, whole; undefined for a value with none; Unwritable for a value with one inside. */
function wholeSlot(value: string): number | undefined {
  const match = /^(\d+)$/.exec(value);
  if (match) return Number(match[1]);
  if (ANY_SLOT.test(value)) throw new Unwritable("a value inside an attribute");
  return undefined;
}

function attribute(raw: string, value: string, svg: boolean, code: (i: number) => string): string {
  let name = REACT_NAMES[raw] ?? raw;
  // SVG's hyphenated attributes (`stroke-width`) are React's camelCase props (not `data-*`, `aria-*`).
  if (svg && name.includes("-") && !/^(data|aria)-/.test(name)) name = name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
  if (name === "style") return ` style={${style(value, code)}}`;
  const whole = wholeSlot(value);
  if (whole !== undefined) return ` ${name}={${code(whole)}}`;
  if (value === "" && BOOLEAN.has(name)) return ` ${name}`;
  if (NUMERIC.has(name) && /^-?\d+$/.test(value)) return ` ${name}={${value}}`;
  return ` ${name}=${/["&\n\\{}]/.test(value) ? `{${JSON.stringify(value)}}` : `"${value}"`}`;
}

/** A style attribute as a style object: each declaration's property in camelCase; a value that's a slot, its code. */
function style(css: string, code: (i: number) => string): string {
  const entries: string[] = [];
  for (const declaration of declarations(css)) {
    const colon = declaration.indexOf(":");
    if (colon < 0) continue;
    const property = declaration.slice(0, colon).trim();
    const value = declaration.slice(colon + 1).trim();
    if (!property) continue;
    const key = property.startsWith("--")
      ? JSON.stringify(property)
      : property.toLowerCase().replace(/^-ms-/, "ms-").replace(/^-(webkit|moz|o)-/, (_, p: string) => `${p.charAt(0).toUpperCase()}${p.slice(1)}-`).replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    const whole = wholeSlot(value);
    entries.push(`${/^[A-Za-z_$][\w$]*$/.test(key) || key.startsWith('"') ? key : JSON.stringify(key)}: ${whole !== undefined ? `(${code(whole)})` : JSON.stringify(value)}`);
  }
  return `{ ${entries.join(", ")} }`;
}

/** A style attribute's declarations: split at `;` outside parentheses and quotes. */
function declarations(css: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let quote = "";
  let start = 0;
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (quote) {
      if (c === quote) quote = "";
    } else if (c === '"' || c === "'") quote = c;
    else if (c === "(") depth++;
    else if (c === ")") depth--;
    else if (c === ";" && depth === 0) {
      out.push(css.slice(start, i));
      start = i + 1;
    }
  }
  out.push(css.slice(start));
  return out.filter((d) => d.trim());
}
