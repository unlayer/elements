/**
 * Outputs of the Elements tree that go through @unlayer/react-elements:
 * a React element, design JSON for the Unlayer editor, and HTML.
 */

import React from "react";
import * as Elements from "@unlayer/react-elements";
import { isExpr, type ElementNode, type Expr } from "./tree";

const COMPONENTS = Elements as unknown as Record<string, React.ComponentType<any>>;
const LAYOUTS = Elements.ColumnLayouts as unknown as Record<string, unknown>;

/** Build the React element the tree describes. */
export function treeToElement(tree: ElementNode): React.ReactElement {
  const build = (node: ElementNode | string | Expr, key?: number): React.ReactNode => {
    if (typeof node === "string") return node;
    if (isExpr(node) || node.type === "#expr") {
      throw new Error("This tree holds code (from the codemod): render the generated TSX instead");
    }
    const component = COMPONENTS[node.type];
    if (!component) throw new Error(`Unknown Elements component "${node.type}"`);
    const props: Record<string, unknown> = { ...node.props, key };
    if (typeof props.layout === "string") props.layout = LAYOUTS[props.layout];
    const children = (node.children ?? []).map((child, i) => build(child, i));
    return React.createElement(component, props, ...children);
  };
  return build(tree) as React.ReactElement;
}

/** Design JSON the editor opens with `loadDesign()`. */
export function treeToDesign(tree: ElementNode): Record<string, any> {
  return pinImageWidths(Elements.renderToJson(treeToElement(tree)) as Record<string, any>);
}

/**
 * The editor's canvas gives every `img` `width: auto`, which overrides a width
 * attribute: an image in a text or HTML block also gets its width in its style.
 * What the design renders to is unchanged.
 */
export function pinImageWidths<T>(design: T): T {
  const pin = (html: string) =>
    html.replace(/<img\b[^>]*>/g, (tag) => {
      const width = /\swidth=["']?(\d+(?:\.\d+)?%?)/.exec(tag)?.[1];
      const style = /\sstyle="([^"]*)"/.exec(tag);
      if (!width || (style && /(^|;)\s*width\s*:/.test(style[1]))) return tag;
      const value = width.endsWith("%") ? width : `${width}px`;
      if (style) return tag.replace(style[0], ` style="${style[1].replace(/;?\s*$/, "")}${style[1].trim() ? ";" : ""}width:${value}"`);
      return tag.replace(/^<img\b/, `<img style="width:${value}"`);
    });
  const walk = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(walk);
    if (!node || typeof node !== "object") return node;
    return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, (k === "text" || k === "html") && typeof v === "string" ? pin(v) : walk(v)]));
  };
  return walk(design) as T;
}

/** A complete HTML document, as `renderToHtml` writes it. */
export function treeToHtml(tree: ElementNode, options: { fonts?: Array<{ url: string }> } = {}): string {
  return Elements.renderToHtml(treeToElement(tree), options);
}
