/**
 * The image model (model.ts) drawn by Satori (the boxes laid out by Yoga, the text drawn as paths) and resvg (that
 * SVG as pixels): the only file that imports an engine. Another engine is another file like this one, drawing the
 * same canvas; the writer doesn't change.
 */
import { Resvg } from "@resvg/resvg-js";
import { createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import satori from "satori";
import type { Block, Engine, Picture, Run } from "./model";

/** The tree without styles left undefined (Satori reads every key it's given) and empty children. */
function clean(node: ReactNode): ReactNode {
  if (Array.isArray(node)) return node.map(clean);
  if (!isValidElement(node)) return node;
  const { style, children, ...props } = (node as ReactElement<{ style?: Record<string, unknown>; children?: ReactNode }>).props;
  const kept = style && Object.fromEntries(Object.entries(style).filter(([, value]) => value !== undefined && value !== null));
  const list = ([] as ReactNode[]).concat(children ?? []).filter((child) => child !== null && child !== undefined && child !== false).map(clean);
  return createElement(node.type as string, { ...props, key: node.key, ...(kept ? { style: kept } : {}) }, ...list);
}

const picture = (item: Picture, key?: number): ReactElement => createElement("img", { key, src: item.src, alt: item.alt, style: item.style });

const run = (item: Run, key: number): ReactNode => {
  if (typeof item === "string") return item;
  if (item.kind === "span") return createElement("span", { key, style: item.style }, ...item.runs.map(run));
  return picture(item, key);
};

const block = (item: Block, key?: number): ReactElement => {
  switch (item.kind) {
    case "box":
      return createElement("div", { key, style: item.style }, ...item.children.map(block));
    case "text":
      return createElement("div", { key, style: item.style }, ...item.runs.map(run));
    case "image":
      return picture(item, key);
    case "drawing":
      return createElement(
        "svg",
        { key, width: item.width, height: item.height, viewBox: item.viewBox, xmlns: "http://www.w3.org/2000/svg" },
        ...item.shapes.map((shape, i) => createElement(shape.kind, { key: i, ...shape.attributes }))
      );
  }
};

export const satoriResvg: Engine = async (canvas, output) => {
  const tree = clean(createElement("div", { style: canvas.style }, ...canvas.children.map(block)));
  const fonts = canvas.fonts.map((font) => ({ name: font.family, data: font.data, weight: font.weight, style: font.style }));
  const svg = await satori(tree as ReactElement, { width: canvas.width, height: canvas.height, fonts });
  if (output.format === "svg") return new TextEncoder().encode(svg);
  return new Uint8Array(new Resvg(svg, { fitTo: { mode: "width", value: Math.round(canvas.width * output.scale) }, font: { loadSystemFonts: false } }).render().asPng());
};
