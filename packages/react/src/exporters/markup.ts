/**
 * HTML as react-dom/server's renderToStaticMarkup writes it, for the elements the web and document exporters of
 * Divider, Html, Menu and Social render with React in @unlayer/exporters: so those blocks render without react-dom
 * (an edge runtime, a React Server Components layer), the same as with it.
 */
import { attribute, escape, SAFE_NAME, style } from "./attributes";
import { REACT_18 } from "./react-version";

/** An element's HTML, kept apart from text (which is escaped where it's put). */
export class Markup {
  constructor(readonly html: string) {}
}

/** A child only React can render (a React element, an iterable, a promise): the exporter that has it renders with React. */
export class NeedsReact extends Error {}

/** Children as React renders them: text escaped, numbers as text, nothing for booleans, null and functions. */
function children(node: unknown): string {
  if (node == null || typeof node === "boolean" || typeof node === "function" || typeof node === "symbol") return "";
  if (typeof node === "string" || typeof node === "number") return escape(node);
  // (React 18 renders no BigInt.)
  if (typeof node === "bigint") return REACT_18 ? "" : escape(node);
  if (node instanceof Markup) return node.html;
  if (Array.isArray(node)) return node.map(children).join("");
  throw new NeedsReact();
}

/** A prop of an element React 18 renders as a custom element (one with an `is`): as it's given, but for its style. */
function customAttribute(name: string, value: unknown): string {
  if (name === "style") return style(value);
  if (name === "suppressContentEditableWarning" || name === "suppressHydrationWarning" || typeof value === "function" || typeof value === "symbol" || !SAFE_NAME.test(name)) return "";
  return ` ${name}="${escape(value)}"`;
}

/** `React.createElement(tag, props, ...children)`, rendered. */
export function element(tag: "a" | "div" | "img" | "span", props: Record<string, unknown>, ...given: unknown[]): Markup {
  const all = given.length ? { ...props, children: given.length > 1 ? given : given[0] } : props;
  const custom = REACT_18 && tag !== "img" && typeof all.is === "string";
  let html = `<${tag}`;
  let content: unknown = null;
  let inner: unknown = null;
  for (const name in all) {
    if (!Object.prototype.hasOwnProperty.call(all, name)) continue;
    const value = all[name];
    // (`key`, `ref`, `__self` and `__source` are React's; React's element can't have its own `__proto__`.)
    if (value == null || name === "key" || name === "ref" || name === "__self" || name === "__source" || name === "__proto__") continue;
    if (name === "children") content = value;
    else if (name === "dangerouslySetInnerHTML") inner = value;
    else if (custom) html += customAttribute(name, value);
    // A link to nowhere is written (React 19 leaves out other empty URLs).
    else html += tag === "a" && name === "href" && value === "" ? ' href=""' : attribute(name, value);
  }
  if (tag === "img") {
    if (content != null || inner != null) throw new Error("img is a self-closing tag.");
    return new Markup(`${html}/>`);
  }
  html += ">";
  if (inner != null) {
    if (content != null || typeof inner !== "object" || !("__html" in inner)) throw new Error("`dangerouslySetInnerHTML` must be `{__html: ...}`, without children.");
    const raw = (inner as { __html: unknown }).__html;
    if (raw != null) html += "" + raw;
  }
  return new Markup(`${html}${children(content)}</${tag}>`);
}

/** HTML as the exporters write what React renders: without the image preloads React 19 adds (nor any in markup given). */
export const staticMarkup = (markup: Markup | null): string => (markup ? markup.html : "").replace(/<link rel="preload" as="image"[^>]*\/?>/g, "");
