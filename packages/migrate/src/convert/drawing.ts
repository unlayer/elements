/**
 * What an inline `<svg>` draws, for the content check: an icon is content
 * like an image, and one whose shapes lost what draws them (a path's `d`, a
 * line's ends) shows nothing. Each SVG is read as its shapes with the
 * attributes that place and paint them, written one way whatever their order,
 * case or number formatting, so the same drawing reads the same on both sides.
 */
import type { DefaultTreeAdapterMap } from "parse5";

type Node = DefaultTreeAdapterMap["node"];
type Element = DefaultTreeAdapterMap["element"];

export const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

/** Attributes that name, label or describe a shape, not what it draws. */
const NOT_DRAWING = /^(id|class|role|focusable|tabindex|lang|xml:lang|xml:space|version|baseprofile|xmlns(:.*)?|aria-.*|data-.*)$/;
/** On the `<svg>` itself: its size and place in the page (a look), not what it draws. */
const NOT_DRAWING_ROOT = /^(width|height|x|y|style)$/;
/** Values that are numbers (coordinates, sizes, a path): compared as numbers, however they're written. */
const NUMERIC = /^(d|points|viewbox|transform|gradienttransform|patterntransform|x|y|x1|y1|x2|y2|cx|cy|r|rx|ry|fx|fy|fr|dx|dy|width|height|rotate|offset|pathlength|stroke-width|stroke-dasharray|stroke-dashoffset|stroke-miterlimit|opacity|fill-opacity|stroke-opacity|stop-opacity|font-size|startoffset|textlength|refx|refy|markerwidth|markerheight)$/;
/** Containers whose shapes aren't drawn where they are, only where something refers to them. */
const DEFINITIONS = new Set(["defs", "symbol", "clippath", "mask", "pattern", "marker", "lineargradient", "radialgradient", "filter", "title", "desc", "metadata", "style", "script"]);

const number = (value: string | undefined) => (value === undefined ? NaN : parseFloat(value));
const positive = (value: string | undefined) => number(value) > 0;

/** An attribute's name as SVG writes it, lowercase: `xlink:href` is `href`. */
function name(a: { name: string; prefix?: string }): string {
  const full = (a.prefix ? `${a.prefix}:${a.name}` : a.name).toLowerCase();
  return full === "xlink:href" ? "href" : full;
}

function attribute(element: Element, wanted: string): string | undefined {
  return element.attrs.find((a) => name(a) === wanted)?.value;
}

/** A value written one way: numbers as numbers (`2.0`, `2`; `1,2` and `1 2`), colors as rgba, keywords lowercase. */
function canonical(property: string, value: string, color: (value: string) => number[] | undefined): string {
  const v = value.trim().replace(/\s+/g, " ");
  if (NUMERIC.test(property)) {
    return (v.match(/[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?|[a-z]+|[%()]/gi) ?? [])
      .map((token) => (/\d/.test(token) ? String(Number(token) || 0) : token))
      .join(" ");
  }
  const rgba = color(v);
  if (rgba) return `rgba(${rgba.map((c) => Math.round(c * 100) / 100).join(",")})`;
  return /^[a-z-]+$/i.test(v) ? v.toLowerCase() : v;
}

/** A shape's attributes that draw it, written one way and in order: `d=M 21 15 v 4`, `stroke=rgba(…)`. */
function drawn(element: Element, root: boolean, color: (value: string) => number[] | undefined): string[] {
  const out: string[] = [];
  for (const a of element.attrs) {
    const key = name(a);
    if (NOT_DRAWING.test(key) || (root && NOT_DRAWING_ROOT.test(key))) continue;
    if (key === "style") {
      // Each declaration, as an attribute would be (`fill: red` is `fill=red`).
      for (const piece of a.value.split(/;(?![^(]*\))/)) {
        const colon = piece.indexOf(":");
        if (colon < 0) continue;
        const property = piece.slice(0, colon).trim().toLowerCase();
        const value = piece.slice(colon + 1).trim();
        if (property && value) out.push(`style ${property}=${canonical(property, value, color)}`);
      }
      continue;
    }
    out.push(`${key}=${canonical(key, a.value, color)}`);
  }
  return out.sort();
}

const tag = (element: Element) => element.tagName.toLowerCase();

/** Whether a shape draws something where it is: a path with its `d`, a line with two ends apart, a circle with a radius. */
function draws(element: Element): boolean {
  // Geometry set by CSS (`d: path(…)`, `r: 4px`) can't be told apart from a style that only paints: it may draw.
  const styled = (property: string) => new RegExp(`(^|;)\\s*${property}\\s*:`, "i").test(attribute(element, "style") ?? "");
  const at = (coordinate: string) => number(attribute(element, coordinate)) || 0;
  switch (tag(element)) {
    case "path":
      return !!attribute(element, "d")?.trim() || styled("d");
    case "polyline":
    case "polygon":
      return /\d/.test(attribute(element, "points") ?? "");
    case "line":
      return at("x1") !== at("x2") || at("y1") !== at("y2") || ["x1", "y1", "x2", "y2"].some(styled);
    case "rect":
    case "foreignobject":
      return (positive(attribute(element, "width")) || styled("width")) && (positive(attribute(element, "height")) || styled("height"));
    case "image":
      return !!attribute(element, "href")?.trim();
    case "circle":
      return positive(attribute(element, "r")) || styled("r");
    case "ellipse":
      return positive(attribute(element, "rx")) || positive(attribute(element, "ry")) || styled("rx") || styled("ry");
    case "use":
      return !!attribute(element, "href")?.trim();
    case "text":
      return textOf(element).trim() !== "";
    default:
      return false;
  }
}

function textOf(node: Node): string {
  if (node.nodeName === "#text") return (node as { value: string }).value;
  return "childNodes" in node ? (node.childNodes as Node[]).map(textOf).join("") : "";
}

const isElement = (node: Node): node is Element => "tagName" in node;

/** FNV-1a: a short, stable name for a drawing too long to list. */
function hash(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/**
 * What an inline `<svg>` draws, as a target the check compares (like an image's URL): its shapes, its viewBox and
 * a hash of everything that draws it. Undefined when it draws nothing (no shape that has what draws it, a size of 0):
 * an icon whose shapes lost their attributes is an icon lost. `byId` finds what a `<use>` refers to.
 */
export function svgDrawing(svg: Element, byId: (id: string) => Element | undefined, color: (value: string) => number[] | undefined): string | undefined {
  if (["width", "height"].some((size) => /^\s*0+(\.0*)?(px)?\s*$/i.test(attribute(svg, size) ?? ""))) return undefined;
  const parts: string[] = [];
  const shapes: string[] = [];
  const visit = (element: Element, depth: number, defined: boolean, seen: Set<Element>) => {
    if (seen.has(element) || depth > 50) return;
    seen.add(element);
    const own = tag(element);
    const definition = defined || DEFINITIONS.has(own);
    parts.push(`${"  ".repeat(depth)}${own}[${drawn(element, element === svg, color).join(" ")}]`);
    if (!definition && draws(element)) shapes.push(own);
    // What a `<use>` draws is what it refers to.
    if (own === "use") {
      const ref = attribute(element, "href")?.trim();
      const target = ref?.startsWith("#") ? byId(ref.slice(1)) : undefined;
      if (target) visit(target, depth + 1, definition, seen);
    }
    for (const child of element.childNodes) if (isElement(child)) visit(child, depth + 1, definition, seen);
  };
  visit(svg, 0, false, new Set());
  if (!shapes.length) return undefined;
  const counts = new Map<string, number>();
  for (const shape of shapes) counts.set(shape, (counts.get(shape) ?? 0) + 1);
  const list = [...counts].map(([shape, n]) => (n > 1 ? `${shape} ×${n}` : shape)).join(", ");
  const box = attribute(svg, "viewbox");
  const viewBox = box === undefined ? undefined : canonical("viewbox", box, color);
  return `${list}${viewBox ? ` in viewBox ${viewBox}` : ""} (drawing ${hash(parts.join("\n"))})`;
}
