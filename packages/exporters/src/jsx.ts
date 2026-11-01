/**
 * JSX that writes HTML strings, for the writers' components: no React, no DOM.
 *
 *   <td align="center" style={{ padding: node.style.padding, fontSize: 0 }}>{label}</td>
 *
 * - Text and attribute values are escaped, always: what users write can't add markup.
 * - `style` is an object (or a list of objects and `[property, value]` pairs, merged in order).
 *   Properties are camelCase (`msoPaddingAlt` is `mso-padding-alt`); a value is written by its
 *   property: a number in px (unitless for `fontWeight`, `lineHeight`, `flex`), padding and
 *   radius from their objects, a border from its sides. Empty values are left out. Colors are
 *   shortened (`#ffffff` is `#fff`). `style` is always the last attribute.
 * - Attributes with no value (`undefined`, `null`, `false`) are left out.
 * - `<Outlook>` and `<NotOutlook>` write conditional comments; `<Merged>` puts neighbouring
 *   comments of a kind into one; `open()` and `close()` write an element's tags apart, for
 *   Outlook's tables that open in one comment and close in another.
 *
 * The writers' tsconfig sets `jsxFactory: "h"` and `jsxFragmentFactory: "Fragment"`; each
 * `.tsx` file imports them from here.
 */
import { border, css, escapeAttr, escapeText, insets, px, radius, type Declarations } from "./shared/css";

type Kind = "outlook" | "notOutlook";

/** Markup: an element, a list of pieces (a fragment), or what's inside a conditional comment. */
export class Html {
  constructor(
    readonly markup: string,
    readonly options: { kind?: Kind; list?: Html[]; start?: string } = {}
  ) {}

  toString(): string {
    const { kind, list } = this.options;
    if (list) return list.join("");
    if (kind === "outlook") return `<!--[if mso]>${this.markup}<![endif]-->`;
    if (kind === "notOutlook") return `<!--[if !mso]><!-->${this.markup}<!--<![endif]-->`;
    return this.markup;
  }
}

export type Child = Html | string | number | boolean | null | undefined | readonly Child[];

export interface Style {
  [property: string]: unknown;
}
export type StyleValue = Style | Declarations | Declarations[number] | readonly StyleValue[] | false | null | undefined;

type Attribute = string | number | boolean | null | undefined;
type Component<P> = (props: P & { children?: Child }) => Html;

/** Markup written as it is: only for markup the writers make themselves. */
export const raw = (markup: string) => new Html(markup);

/** Children as pieces: text escaped, fragments opened, nothing for `null`, `undefined` and booleans. */
function pieces(children: Child, out: Html[] = []): Html[] {
  if (children === null || children === undefined || typeof children === "boolean") return out;
  if (Array.isArray(children)) {
    for (const child of children as readonly Child[]) pieces(child, out);
  } else if (children instanceof Html) {
    if (children.options.list) out.push(...children.options.list);
    else out.push(children);
  } else out.push(new Html(escapeText(String(children))));
  return out;
}

const VOID = new Set(["img", "br", "hr", "meta", "link"]);
const UNITLESS = new Set(["fontWeight", "lineHeight", "flex", "flexGrow", "flexShrink", "opacity", "zIndex", "order"]);
const kebab = (key: string) => key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

function declaration(key: string, value: unknown, out: Declarations): void {
  if (value === undefined || value === null || value === false) return;
  if (key === "border" && typeof value === "object") out.push(...border(value as never));
  else if (key === "padding" && typeof value === "object") out.push(["padding", insets(value as never)]);
  else if (key === "borderRadius" && typeof value !== "string") out.push(["border-radius", radius(value as never)]);
  else if (typeof value === "number") out.push([kebab(key), UNITLESS.has(key) ? String(value) : px(value)]);
  else out.push([kebab(key), String(value)]);
}

/** A `[property, value]` pair, as opposed to a list of styles. */
const isPair = (value: readonly unknown[]): value is [string, string | number | undefined] => value.length === 2 && typeof value[0] === "string";

function declarations(style: StyleValue, out: Declarations = []): Declarations {
  if (!style) return out;
  if (Array.isArray(style)) {
    if (isPair(style)) out.push(style);
    else for (const item of style as readonly StyleValue[]) declarations(item, out);
  } else for (const [key, value] of Object.entries(style as Style)) declaration(key, value, out);
  return out;
}

/** A style's CSS text, as written in a `style` attribute or a stylesheet rule. */
export function styleText(style: StyleValue, important = false): string {
  return css(declarations(style), important);
}

function attributes(props: Record<string, unknown>): string {
  let out = "";
  for (const [name, value] of Object.entries(props)) {
    if (name === "children" || name === "style" || value === undefined || value === null || value === false) continue;
    out += ` ${name}="${escapeAttr(String(value))}"`;
  }
  const style = styleText(props.style as StyleValue);
  return style ? `${out} style="${escapeAttr(style)}"` : out;
}

export function h(type: string | Component<any>, props: Record<string, unknown> | null, ...children: Child[]): Html {
  const all = props ?? {};
  if (typeof type === "function") return type({ ...all, children });
  const start = `<${type}${attributes(all)}>`;
  if (VOID.has(type)) return new Html(start);
  return new Html(`${start}${pieces(children).join("")}</${type}>`, { start });
}

export function Fragment({ children }: { children?: Child }): Html {
  return new Html("", { list: pieces(children) });
}

/** What only classic Outlook reads (`<!--[if mso]>`). */
export const Outlook = ({ children }: { children?: Child }) => new Html(pieces(children).join(""), { kind: "outlook" });

/** What every client but classic Outlook reads (`<!--[if !mso]><!-->`). */
export const NotOutlook = ({ children }: { children?: Child }) => new Html(pieces(children).join(""), { kind: "notOutlook" });

/** Its children, with neighbouring conditional comments of a kind written as one. */
export function Merged({ children }: { children?: Child }): Html {
  const out: Html[] = [];
  for (const piece of pieces(children)) {
    const last = out[out.length - 1];
    if (piece.options.kind && last?.options.kind === piece.options.kind) out[out.length - 1] = new Html(last.markup + piece.markup, { kind: piece.options.kind });
    else out.push(piece);
  }
  return new Html("", { list: out });
}

/** An element's start tag alone. */
export const open = (element: Html) => new Html(element.options.start ?? element.markup);

/** An element's end tag alone. */
export const close = (tag: string) => new Html(`</${tag}>`);

// eslint-disable-next-line @typescript-eslint/no-namespace
export declare namespace h {
  namespace JSX {
    type Element = Html;
    interface ElementChildrenAttribute {
      children: unknown;
    }
    interface IntrinsicElements {
      [tag: string]: { style?: StyleValue; children?: Child } & { [attribute: string]: Attribute | StyleValue | Child };
    }
  }
}
