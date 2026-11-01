/**
 * Resolving a document: what every target needs worked out the same way
 * before it writes anything. Defaults applied, text styles inherited, and
 * every box's width on desktop in px, from the root's width down. Targets
 * only turn this into markup; none of them decides layout on its own.
 */
import type { ComponentDefinition, Target } from "./define";
import { Diagnostics, type Diagnostic } from "./diagnostics";
import { assetParts, readLength, type Asset, type Border, type FontFamily, type Insets, type LineHeight } from "./kinds";
import { isNode, type ElementsDocument, type Json, type Node } from "./model";
import { expandDocument } from "./expand";
import { propsWithDefaults, registryOf, type ComponentsOption, type Registry } from "./registry";

/** Text styles as they apply to a node: its own, its component's defaults, else its parent's. */
export interface ResolvedText {
  color: string;
  fontFamily: FontFamily;
  fontSize: number;
  fontWeight: number;
  fontStyle: "normal" | "italic";
  lineHeight: LineHeight;
  /** The line height in px at this node's font size. */
  lineHeightPx: number;
  letterSpacing: number;
  textAlign: "left" | "center" | "right" | "justify";
  textTransform: "none" | "uppercase" | "lowercase" | "capitalize";
}

export interface ResolvedNode {
  /** The author's id, if any. */
  id?: string;
  /** Where it is in the template ("root.children[2]"), for messages. */
  path: string;
  type: string;
  definition: ComponentDefinition;
  /** Its props, with the definition's defaults where not given. */
  props: Record<string, Json>;
  /** Its component's default style under its own (inherited text styles are in `text`). */
  style: Record<string, Json>;
  hover?: Record<string, Json>;
  mobile?: Record<string, Json>;
  hidden?: { mobile?: boolean; desktop?: boolean };
  text: ResolvedText;
  /** The width its parent gives it on desktop, in px (null inside text). */
  available: number | null;
  /**
   * Its width on desktop in px, padding and border included; null where it
   * takes its own size and that size isn't known (a Button's text, an Image
   * without its size, text inside text).
   */
  width: number | null;
  /** Its width inside its padding and border, in px, or null. */
  contentWidth: number | null;
  children: Array<ResolvedNode | string>;
  compat?: Record<string, Json>;
}

export interface ResolvedDocument {
  root: ResolvedNode;
  diagnostics: Diagnostic[];
}

/** What a root's text styles start from, under its own defaults. */
const INITIAL_TEXT: Omit<ResolvedText, "lineHeightPx"> = {
  color: "#000000",
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: 16,
  fontWeight: 400,
  fontStyle: "normal",
  lineHeight: 1.5,
  letterSpacing: 0,
  textAlign: "left",
  textTransform: "none",
};

const INHERITED = Object.keys(INITIAL_TEXT) as Array<keyof typeof INITIAL_TEXT>;

/** A length in px, given the width a percentage is of. */
export function toPx(value: Json | undefined, of: number | null): number | null {
  const length = readLength(value);
  if (!length) return null;
  switch (length.unit) {
    case "px":
      return length.value;
    case "%":
      return of === null ? null : (of * length.value) / 100;
    case "pt":
      return (length.value * 96) / 72;
    case "mm":
      return (length.value * 96) / 25.4;
    case "in":
      return length.value * 96;
  }
}

export function lineHeightPx(lineHeight: LineHeight, fontSize: number): number {
  return typeof lineHeight === "number" ? Math.round(lineHeight * fontSize * 100) / 100 : Number.parseFloat(lineHeight);
}

/** The horizontal space a box's padding and border take. */
export function horizontalFrame(style: Record<string, Json>): number {
  const padding = style.padding as Insets | undefined;
  const border = style.border as Border | undefined;
  return (padding ? padding.left + padding.right : 0) + (border?.left?.width ?? 0) + (border?.right?.width ?? 0);
}

interface Context {
  d: Diagnostics;
  registry: Registry;
  /** The root's type: Rows stack on phones by default in a responsive one. */
  responsive: boolean;
}

/**
 * Resolves a valid document (see `checkDocument`), its custom components
 * expanded first: what's resolved is primitives only.
 */
export function resolveDocument(input: ElementsDocument, options?: ComponentsOption | Registry): ResolvedDocument {
  const registry = registryOf(options);
  const expanded = expandDocument(input, registry);
  const document = expanded.document;
  const d = new Diagnostics();
  d.list.push(...expanded.diagnostics);
  const definition = registry.get(document.root.type)!;
  const context: Context = { d, registry, responsive: !!definition.responsive };
  const root = resolveNode(document.root, "root", { ...INITIAL_TEXT, lineHeightPx: 24 }, null, context);
  const width = toPx(root.props.width, null);
  root.width = width;
  root.contentWidth = width;
  root.children = resolveChildren(document.root, "root", root, width, "stack", context);
  return { root, diagnostics: d.list };
}

function styleOf(node: Node, definition: ComponentDefinition, props: Record<string, Json>, context: Context): Record<string, Json> {
  const style: Record<string, Json> = { ...((definition.defaultStyle ?? {}) as Record<string, Json>) };
  const by = definition.defaultStyleBy;
  if (by) Object.assign(style, by.values[String(props[by.prop])] ?? {});
  if (definition.type === "Row") style.wrap = context.responsive ? "stack" : "none";
  return { ...style, ...node.style };
}

function textOf(parent: ResolvedText, style: Record<string, Json>): ResolvedText {
  const text = { ...parent } as Record<string, unknown>;
  for (const key of INHERITED) if (style[key] !== undefined) text[key] = style[key];
  const out = text as unknown as ResolvedText;
  out.lineHeightPx = lineHeightPx(out.lineHeight, out.fontSize);
  return out;
}

/** A node with its own values worked out; its width and children are set by its parent's layout. */
function resolveNode(node: Node, path: string, parentText: ResolvedText, available: number | null, context: Context): ResolvedNode {
  const definition = context.registry.get(node.type)!;
  const props = propsWithDefaults(definition, node.props);
  const style = styleOf(node, definition, props, context);
  return {
    ...(node.id ? { id: node.id } : {}),
    path,
    type: node.type,
    definition,
    props,
    style,
    ...(node.hover ? { hover: node.hover } : {}),
    ...(node.mobile ? { mobile: node.mobile } : {}),
    ...(node.hidden ? { hidden: node.hidden } : {}),
    text: textOf(parentText, style),
    available,
    width: null,
    contentWidth: null,
    children: [],
    ...(node.compat ? { compat: node.compat } : {}),
  };
}

function clamp(width: number, style: Record<string, Json>, of: number | null): number {
  const min = toPx(style.minWidth, of);
  const max = toPx(style.maxWidth, of);
  if (max !== null) width = Math.min(width, max);
  if (min !== null) width = Math.max(width, min);
  return width;
}

/** The size a node has of its own: an image's, when its document gives it. */
function intrinsicWidth(resolved: ResolvedNode, available: number | null): number | null {
  if (resolved.type !== "Image" || resolved.props.src === undefined) return null;
  const own = assetParts(resolved.props.src as Asset).width ?? null;
  if (own === null) return null;
  return clamp(available === null ? own : Math.min(own, available), resolved.style, available);
}

/** The width a node takes of `available` where its parent stacks its children. */
function stackedWidth(resolved: ResolvedNode, available: number | null): number | null {
  const set = toPx(resolved.style.width, available);
  if (set !== null) return clamp(set, resolved.style, available);
  if (resolved.definition.sizing === "stretch") return available === null ? null : clamp(available, resolved.style, available);
  if (resolved.definition.sizing === "shrink") return intrinsicWidth(resolved, available);
  return null;
}

function setWidth(resolved: ResolvedNode, width: number | null): void {
  resolved.width = width === null ? null : Math.round(width);
  resolved.contentWidth = resolved.width === null ? null : Math.max(0, resolved.width - horizontalFrame(resolved.style));
}

type Layout = "stack" | "row" | "text";

function resolveChildren(node: Node, path: string, parent: ResolvedNode, available: number | null, layout: Layout, context: Context): Array<ResolvedNode | string> {
  const out: Array<ResolvedNode | string> = [];
  const nodes: Array<{ source: Node; resolved: ResolvedNode; at: string }> = [];
  (node.children ?? []).forEach((child, index) => {
    if (!isNode(child)) {
      out.push(child);
      return;
    }
    const at = `${path}.children[${index}]`;
    // Inside text only an image takes up width.
    const inText = layout === "text" && child.type !== "Image";
    const resolved = resolveNode(child, at, parent.text, inText ? null : available, context);
    if (resolved.style.flex !== undefined && layout !== "row") {
      context.d.warning("style/ignored", `flex only applies to a child of a Row; this ${child.type} is in a ${parent.type}`, `${at}.style.flex`, child.id);
    }
    nodes.push({ source: child, resolved, at });
    out.push(resolved);
  });

  if (layout === "row") layOutRow(parent, nodes, available, path, context);
  else {
    for (const { resolved, at, source } of nodes) {
      if (resolved.available === null && layout === "text") continue;
      const width = stackedWidth(resolved, resolved.available);
      if (width !== null && resolved.available !== null && width > resolved.available + 0.5) {
        context.d.warning("layout/overflow", `This ${source.type} is ${Math.round(width)}px wide, wider than the ${Math.round(resolved.available)}px it's in`, at, source.id);
      }
      setWidth(resolved, width);
    }
  }

  for (const { source, resolved, at } of nodes) {
    const own: Layout = source.type === "Row" ? "row" : resolved.definition.children.text ? "text" : "stack";
    // A box without a known width (a Link around an image) gives its children what it was given.
    resolved.children = resolveChildren(source, at, resolved, resolved.contentWidth ?? resolved.available, own, context);
    if (resolved.width === null && source.type === "Link") {
      const image = resolved.children.find((c): c is ResolvedNode => typeof c !== "string" && c.type === "Image");
      if (image && image.width !== null) setWidth(resolved, image.width + horizontalFrame(resolved.style));
    }
  }
  return out;
}

/**
 * A Row: children with a width take it; the rest share what's left by their
 * flex (1 by default), after the gaps. Widths are whole px that add up to the
 * Row's width.
 */
function layOutRow(row: ResolvedNode, nodes: Array<{ source: Node; resolved: ResolvedNode; at: string }>, available: number | null, path: string, context: Context): void {
  if (available === null) return;
  const gap = toPx(row.style.gap, null) ?? 0;
  let free = available - gap * Math.max(0, nodes.length - 1);
  const shares: Array<{ resolved: ResolvedNode; share: number }> = [];
  for (const { resolved } of nodes) {
    const set = toPx(resolved.style.width, available);
    if (set !== null) {
      setWidth(resolved, clamp(set, resolved.style, available));
      free -= resolved.width!;
    } else if (resolved.style.flex === "none" || resolved.style.flex === 0) {
      setWidth(resolved, intrinsicWidth(resolved, available));
      free -= resolved.width ?? 0;
    } else {
      shares.push({ resolved, share: typeof resolved.style.flex === "number" ? resolved.style.flex : 1 });
    }
  }
  if (free < 0) {
    context.d.warning("layout/overflow", `The Row's children are ${Math.round(-free)}px wider than the ${Math.round(available)}px it has`, path, row.id);
    free = 0;
  }
  const total = shares.reduce((sum, s) => sum + s.share, 0);
  if (!shares.length) return;
  // Largest remainder: whole px that add up to the free width.
  const room = Math.floor(free);
  const exact = shares.map((s) => (room * s.share) / total);
  const widths = exact.map(Math.floor);
  let left = room - widths.reduce((a, b) => a + b, 0);
  const order = exact.map((value, index) => ({ index, rest: value - Math.floor(value) })).sort((a, b) => b.rest - a.rest || a.index - b.index);
  for (const { index } of order) {
    if (left <= 0) break;
    widths[index] += 1;
    left -= 1;
  }
  shares.forEach((s, index) => setWidth(s.resolved, clamp(widths[index], s.resolved.style, available)));
}

/** Errors for each component the target doesn't render (custom components: for what they're made of). */
export function checkTarget(input: ElementsDocument, target: Target, options?: ComponentsOption | Registry): Diagnostic[] {
  const registry = registryOf(options);
  const document = expandDocument(input, registry).document;
  const d = new Diagnostics();
  const visit = (node: Node, path: string) => {
    const definition = registry.get(node.type);
    if (definition && !definition.targets[target]) {
      d.error("target/unsupported", `A ${node.type} can't be rendered to ${target}`, path, node.id);
    }
    node.children?.forEach((child, index) => isNode(child) && visit(child, `${path}.children[${index}]`));
  };
  visit(document.root, "root");
  return d.list;
}
