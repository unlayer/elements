/**
 * JSX that writes HTML strings, for the email and page components: no React, no DOM.
 *
 *   <td align="center" style={{ padding: node.style.padding, fontSize: 0 }}>{label}</td>
 *
 * - Text and attribute values are escaped, always: what users write can't add markup.
 * - `style` is an object (or a list of objects and `[property, value]` pairs, merged in order).
 *   Properties are camelCase (`msoPaddingAlt` is `mso-padding-alt`); a value is written by its
 *   property: a number in px (unitless for `fontWeight`, `lineHeight`, `flex`), padding and
 *   radius from their objects, a border from its sides, one side (`borderTop`) from its own. Empty values are left out. Colors are
 *   shortened (`#ffffff` is `#fff`). `style` is always the last attribute.
 * - Attributes with no value (`undefined`, `null`, `false`) are left out.
 * - `phone={style}` and `hover={style}` are styles for phones and on hover: each is a rule in the
 *   render's stylesheet, under a class named after it, added to the element's classes. `class`
 *   takes a name or a list of names (empty ones left out). The classes are written in the order
 *   these props are, where the first of them that has one is.
 * - `<Outlook>` and `<NotOutlook>` write conditional comments; `<Merged>` puts neighbouring
 *   comments of a kind into one; `open()` and `close()` write an element's tags apart, for
 *   Outlook's tables that open in one comment and close in another.
 *
 * The exporters' tsconfig sets `jsxFactory: "h"` and `jsxFragmentFactory: "Fragment"`; each
 * `.tsx` file imports them from here.
 */
import type { Level, Media, Stylesheet } from "./shared/classes";
import { border, css, escapeAttr, escapeText, insets, px, radius, type Declarations } from "./shared/css";

// ─── The render's stylesheet ────────────────────────────────────────────────

const sheets: Stylesheet[] = [];

/** Writes markup with `sheet` as the stylesheet its `phone`, `hover` and `rule()` classes go in. */
export function withStylesheet<T>(sheet: Stylesheet, write: () => T): T {
  sheets.push(sheet);
  try {
    return write();
  } finally {
    sheets.pop();
  }
}

/** The class of a rule in the render's stylesheet (`&` is where the class goes: `&>div{…}`). */
export function rule(media: Media, text: string, level: Level = "own"): string {
  const sheet = sheets[sheets.length - 1];
  if (!sheet) throw new Error("[Elements] Markup with phone or hover styles is written inside withStylesheet()");
  return sheet.classFor(media, text, level);
}

/** Puts an imported node's CSS in the render's stylesheet (see `Stylesheet.addImported`). */
export function importedCss(css: string): void {
  const sheet = sheets[sheets.length - 1];
  if (!sheet) throw new Error("[Elements] Markup with imported CSS is written inside withStylesheet()");
  sheet.addImported(css);
}

let phoneMedia: Media = "phone";

/** Writes markup with its `phone` styles in the `hiding` media, starting where what's hidden does, not where they do. */
export function withPhoneAtHiding<T>(write: () => T): T {
  const before = phoneMedia;
  phoneMedia = "hiding";
  try {
    return write();
  } finally {
    phoneMedia = before;
  }
}

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

const VOID = new Set(["img", "br", "hr", "meta", "link", "col", "wbr"]);
const UNITLESS = new Set(["fontWeight", "lineHeight", "flex", "flexGrow", "flexShrink", "opacity", "zIndex", "order"]);
const kebab = (key: string) => key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

function declaration(key: string, value: unknown, out: Declarations): void {
  if (value === undefined || value === null || value === false) return;
  if (key === "border" && typeof value === "object") out.push(...border(value as never));
  else if (key === "padding" && typeof value === "object") out.push(["padding", insets(value as never)]);
  else if (key === "borderRadius" && typeof value !== "string") out.push(["border-radius", radius(value as never)]);
  else if (/^border(Top|Right|Bottom|Left)$/.test(key) && typeof value === "object") {
    const side = value as { width: number; style: string; color: string };
    out.push([kebab(key), `${px(side.width)} ${side.style} ${side.color}`]);
  }
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

/** A `class`, `phone` or `hover` prop's class names. */
function classesOf(name: string, value: unknown): string[] {
  if (name === "class") return (Array.isArray(value) ? value : [value]).filter((v): v is string => typeof v === "string" && v !== "");
  const text = styleText(value as StyleValue, true);
  if (!text) return [];
  return [name === "phone" ? rule(phoneMedia, `&{${text}}`) : rule("all", `&:hover{${text}}`, "hover")];
}

function attributes(props: Record<string, unknown>): string {
  const out: string[] = [];
  const classes: string[] = [];
  let slot = -1;
  for (const [name, value] of Object.entries(props)) {
    if (name === "children" || name === "style" || value === undefined || value === null || value === false) continue;
    if (name === "class" || name === "phone" || name === "hover") {
      const found = classesOf(name, value);
      if (found.length && slot < 0) slot = out.push("") - 1;
      classes.push(...found);
      continue;
    }
    out.push(` ${name}="${escapeAttr(String(value))}"`);
  }
  if (slot >= 0) out[slot] = ` class="${escapeAttr(classes.join(" "))}"`;
  const style = styleText(props.style as StyleValue);
  return style ? `${out.join("")} style="${escapeAttr(style)}"` : out.join("");
}

/** `element` with an `id` as its first attribute, unless `id` is empty. */
export function withId(element: Html, id: string | undefined): Html {
  if (!id) return element;
  const tag = /^<[a-zA-Z0-9]+/.exec(element.markup)?.[0];
  if (!tag) throw new Error("[Elements] An id goes on an element");
  const insert = (markup: string) => `${tag} id="${escapeAttr(id)}"${markup.slice(tag.length)}`;
  return new Html(insert(element.markup), { ...element.options, start: element.options.start && insert(element.options.start) });
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

const OUTLOOK_ONLY = /<!--\[if mso\]>[\s\S]*?<!\[endif\]-->/g;
const NOT_OUTLOOK_MARKS = /<!--\[if !mso\]><!-->|<!--<!\[endif\]-->/g;

/**
 * What every client but classic Outlook reads (`<!--[if !mso]><!-->`). Conditional comments can't nest:
 * Outlook ends what it skips at the first `<![endif]>`, and would show the rest. So inside, Outlook's own
 * markup is left out (Outlook never sees any of it) and the inner comments of this kind are unwrapped.
 */
export const NotOutlook = ({ children }: { children?: Child }) =>
  new Html(pieces(children).join("").replace(OUTLOOK_ONLY, "").replace(NOT_OUTLOOK_MARKS, ""), { kind: "notOutlook" });

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
      [tag: string]: { style?: StyleValue; phone?: StyleValue; hover?: StyleValue; class?: string | ReadonlyArray<string | undefined>; children?: Child } & {
        [attribute: string]: Attribute | StyleValue | Child | ReadonlyArray<string | undefined>;
      };
    }
  }
}
