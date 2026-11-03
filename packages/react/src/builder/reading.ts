/** What every tool's reader shares (blocks.ts, text-tool.ts): where a block is, how its values are read, and how it's placed. */
import type { Json, Node } from "@unlayer-internal/elements-core";
import { ALIGN, color, fontWeight, font, letterSpacing, lineHeight as legacyLineHeight, px, some, type Sides, type Values } from "../compat/values";
import type { HiddenParts } from "./hide";

/** Where a block is, as today's image writer works out its room: the body, its row and column, the column's share. */
export interface Slot {
  body: Values;
  row: Values;
  column: Values;
  cells: number[];
  index: number;
  /** Whether the row's columns stack on phones. */
  stacks: boolean;
}

/** What a block is read in: the root's text styles (what a block inherits) and where to say what's left out. */
export interface Context {
  inherited: { color: string; fontFamily: string; fontWeight: number };
  /** The builder's display mode the design is read in. */
  mode: "email" | "web" | "document";
  /** The root's direction, which a block without one of its own takes. */
  dir: string;
  /** A design's markup through the app's sanitizer (fromDesign()'s `toSafeHtml`), where it gave one. */
  safe(html: string): string;
  document: boolean;
  say(message: string): void;
}

export const ZERO: Sides = { top: 0, right: 0, bottom: 0, left: 0 };
export const obj = (value: unknown): Values => (value && typeof value === "object" && !Array.isArray(value) ? (value as Values) : {});
export const str = (value: unknown) => (typeof value === "string" ? value : undefined);
/** Two values the same, colors in either case ("#BBBBBB" is "#bbbbbb"). */
export const same = (a: unknown, b: unknown) => JSON.stringify(a)?.toLowerCase() === JSON.stringify(b)?.toLowerCase();
/** A style set where it isn't what the node takes anyway. */
export const unless = (value: Json | undefined, taken: Json | undefined) => (value === undefined || same(value, taken) ? undefined : value);
/** A line height as Elements': a percentage as the multiple it is ("150%" is 1.5), px as it is. */
export const lineHeight = (value: unknown): Json | undefined => {
  const read = legacyLineHeight(value);
  return typeof read === "string" && read.endsWith("%") ? Math.round(parseFloat(read) * 100) / 10000 : read;
};
/** The builder's alignment (left, center, right) as Elements' (start, center, end); undefined for anything else. */
export const alignOf = (value: unknown) => (typeof value === "string" && Object.hasOwn(ALIGN, value) ? ALIGN[value] : undefined);
export const defined = (record: Record<string, Json | undefined>) => Object.fromEntries(Object.entries(record).filter(([, v]) => v !== undefined)) as Record<string, Json>;

/** A node with its parts, empty ones left out. */
export function make(type: string, parts: { id?: string; props?: Record<string, Json>; style?: Record<string, Json>; mobile?: Record<string, Json>; hover?: Record<string, Json>; hidden?: { mobile?: boolean; desktop?: boolean }; children?: Node["children"] }): Node {
  const node: Node = { type };
  if (parts.id) node.id = parts.id;
  for (const key of ["props", "style", "mobile", "hover"] as const) if (parts[key] && Object.keys(parts[key]!).length) node[key] = parts[key];
  if (parts.hidden && (parts.hidden.mobile || parts.hidden.desktop)) node.hidden = defined(parts.hidden as never) as never;
  if (parts.children) node.children = parts.children;
  return node;
}

/** Whether hidden properties give a block a box of its own (its padding inside it). */
export const boxOf = (hidden: HiddenParts) => ["backgroundColor", "border", "borderRadius", "width", "maxWidth", "padding"].some((key) => key in hidden.style);

/** A block in its place: a Column around it with the place's padding and alignment, where it has either. */
export function placed(node: Node, padding: Sides | undefined, align: string | undefined, phonePadding: Sides | undefined, hiddenOn: Node["hidden"]): Node {
  const alignItems = align && align !== "left" ? alignOf(align) : undefined;
  const visible = !hiddenOn || (!hiddenOn.mobile && !hiddenOn.desktop);
  if (!some(padding) && !alignItems && !phonePadding) return visible ? node : { ...node, hidden: { ...node.hidden, ...hiddenOn } };
  return make("Column", { style: defined({ padding: some(padding), alignItems }), mobile: phonePadding ? { padding: phonePadding } : undefined, hidden: hiddenOn, children: [node] });
}

/** A block's text styles from its fields, those it takes anyway left out. */
export function textStyle(values: Values, taken: Record<string, Json>, context: Context): Record<string, Json> {
  const size = px(values.fontSize);
  return defined({
    fontFamily: unless(font(values.fontFamily), taken.fontFamily ?? context.inherited.fontFamily),
    fontSize: unless(size, taken.fontSize ?? 16),
    fontWeight: unless(fontWeight(values.fontWeight), taken.fontWeight ?? context.inherited.fontWeight),
    color: unless(color(values.color), taken.color ?? context.inherited.color),
    lineHeight: unless(lineHeight(values.lineHeight), taken.lineHeight ?? 1.5),
    letterSpacing: unless(letterSpacing(values.letterSpacing, size) || undefined, taken.letterSpacing),
    textAlign: unless(str(values.textAlign), taken.textAlign ?? "left"),
  });
}

/** Phone values the builder has fields for (a text's size, line height, alignment, letter spacing). */
export function phoneText(values: Values): Record<string, Json> {
  const m = obj(obj(values._override).mobile);
  return defined({ fontSize: px(m.fontSize), lineHeight: lineHeight(m.lineHeight), textAlign: str(m.textAlign), letterSpacing: px(m.letterSpacing) });
}
