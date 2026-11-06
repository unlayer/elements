/**
 * Images: a Canvas is a fixed-size root, its children laid out in it as on a page, written as an
 * image by @unlayer/react-elements/image (and as HTML by render(), to look at); an Svg draws shapes (Rect, Circle, Ellipse,
 * Line, Polygon, Path) in a box of its own, on a page, in a Canvas and in a PDF. An email can't show one: Gmail and
 * Outlook drop inline SVG.
 */
import { defineComponent, prop, type PropSpecs, type SupportByTarget } from "./define";
import { color, length, number, text } from "./kinds";
import { ROOT_DEFAULT_STYLE, ROOT_PROPS, ROOT_STYLE, TEXT_EDITOR } from "./roots";
import { boxStyle, css, layoutStyle, pick, placementStyle } from "./styles";

const WRITTEN: SupportByTarget = { web: { level: "full", source: "writer" } };
const coordinate = (label: string, description?: string) => prop(number(), { support: WRITTEN, label, ...(description ? { description } : {}), default: 0 });
const size = (label: string) => prop(number({ min: 0 }), { support: WRITTEN, label, required: true });

export const Canvas = defineComponent({
  type: "Canvas",
  label: "Canvas",
  description: "An image of a fixed size (a social card, a banner): its children laid out in it as on a page. Written as PNG or SVG with @unlayer/react-elements/image.",
  categories: ["root"],
  props: {
    width: prop(length(["px"], { min: 16 }), { support: WRITTEN, label: "Width", description: "The image's width, in px.", default: 1200 }),
    height: prop(length(["px"], { min: 16 }), { support: WRITTEN, label: "Height", description: "The image's height, in px: what's past it is cut.", default: 630 }),
    ...ROOT_PROPS,
  },
  style: { ...ROOT_STYLE, padding: boxStyle.padding, justifyContent: layoutStyle.justifyContent },
  defaultStyle: ROOT_DEFAULT_STYLE,
  children: { categories: ["section", "layout", "block"] },
  sizing: "none",
  targets: { web: {} },
  editor: {
    groups: [
      { title: "Canvas", paths: ["props.width", "props.height", "style.backgroundColor", "style.padding"] },
      { title: "Layout", paths: ["style.gap", "style.alignItems", "style.justifyContent"] },
      TEXT_EDITOR,
    ],
  },
});

export const Svg = defineComponent({
  type: "Svg",
  label: "Vector drawing",
  description: "Shapes (Rect, Circle, Ellipse, Line, Polygon, Path) drawn in a box of its own: its width and height, and the coordinates its viewBox gives them.",
  categories: ["block"],
  props: {
    width: size("Width"),
    height: size("Height"),
    viewBox: prop(text({ maxLength: 100 }), { support: WRITTEN, label: "View box", description: 'The shapes\' coordinates in it, as "x y width height" (its width and height by default).' }),
    title: prop(text({ maxLength: 200 }), { support: WRITTEN, label: "Title", description: "What it shows, read out by screen readers." }),
  },
  style: { ...pick(boxStyle, "padding", "backgroundColor", "border", "borderRadius"), ...placementStyle },
  children: { categories: ["shape"] },
  sizing: "shrink",
  targets: { web: {} },
  unsupported: { email: "Gmail and classic Outlook don't show inline SVG; use an Image of it (a PNG) instead" },
  editor: { groups: [{ title: "Drawing", paths: ["props.width", "props.height", "props.viewBox", "props.title"] }] },
});

/** How a shape is painted. */
const PAINT = {
  fill: { kind: color(), label: "Fill", description: 'Its inside ("transparent" for none).', support: { web: css } },
  stroke: { kind: color(), label: "Stroke", description: "Its outline's color.", support: { web: css } },
  strokeWidth: { kind: number({ min: 0 }), label: "Stroke width", support: { web: css } },
  opacity: { kind: number({ min: 0, max: 1 }), label: "Opacity", support: { web: css } },
};
const PAINT_DEFAULT = { fill: "#000000" } as const;

const shape = <const P extends PropSpecs>(type: string, label: string, description: string, props: P) =>
  defineComponent({ type, label, description, categories: ["shape"], props, style: PAINT, defaultStyle: PAINT_DEFAULT, children: {}, sizing: "none", targets: { web: {} } });

export const Rect = shape("Rect", "Rectangle", "A rectangle at x, y in its Svg, rounded by rx.", {
  x: coordinate("X"),
  y: coordinate("Y"),
  width: size("Width"),
  height: size("Height"),
  rx: prop(number({ min: 0 }), { support: WRITTEN, label: "Corner radius" }),
});
export const Circle = shape("Circle", "Circle", "A circle centered at cx, cy in its Svg.", { cx: coordinate("Center X"), cy: coordinate("Center Y"), r: size("Radius") });
export const Ellipse = shape("Ellipse", "Ellipse", "An ellipse centered at cx, cy in its Svg.", { cx: coordinate("Center X"), cy: coordinate("Center Y"), rx: size("Radius across"), ry: size("Radius down") });
export const Line = shape("Line", "Line", "A straight line from x1, y1 to x2, y2 in its Svg (drawn by its stroke).", {
  x1: coordinate("Start X"),
  y1: coordinate("Start Y"),
  x2: coordinate("End X"),
  y2: coordinate("End Y"),
});
export const Polygon = shape("Polygon", "Polygon", 'A closed shape through its points ("0,0 40,0 20,30"), in its Svg.', {
  points: prop(text({ maxLength: 10000 }), { support: WRITTEN, label: "Points", required: true }),
});
export const Path = shape("Path", "Path", "A shape drawn by an SVG path (d), in its Svg.", {
  d: prop(text({ maxLength: 100000 }), { support: WRITTEN, label: "Path", description: 'SVG path data ("M0 0 L40 0 L20 30 Z").', required: true }),
});

/** The shapes, by type. */
export const SHAPES = [Rect, Circle, Ellipse, Line, Polygon, Path];

