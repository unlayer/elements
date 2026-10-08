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

/**
 * The editor draws an empty column (a card's spacer column, or code that
 * rendered nothing) as a "No content here" placeholder that stretches its row
 * and covers its neighbours: in a design, each gets an invisible zero-height
 * divider. The email doesn't need them (each is about 1KB of its HTML), so the
 * migrated code doesn't have them.
 */
export function fillEmptyColumns<T>(design: T): T {
  const out = structuredClone(design) as {
    counters?: Record<string, number>;
    body?: { rows?: Array<{ columns?: Array<{ contents?: Array<{ values?: { _meta?: { htmlID?: string } } }> }> }> };
  };
  const columns = (out.body?.rows ?? []).flatMap((row) => row.columns ?? []);
  // The next divider id: the design's counter, else past the highest one in use.
  let count =
    out.counters?.u_content_divider ??
    Math.max(0, ...columns.flatMap((c) => c.contents ?? []).map((c) => Number(/^u_content_divider_(\d+)$/.exec(c.values?._meta?.htmlID ?? "")?.[1] ?? 0)));
  for (const column of columns) {
    if (column.contents?.length) continue;
    count++;
    column.contents = [
      {
        type: "divider",
        values: {
          containerPadding: "0px",
          width: "100%",
          border: { borderTopWidth: "0px", borderTopStyle: "solid", borderTopColor: "#BBBBBB" },
          textAlign: "center",
          _meta: { htmlID: `u_content_divider_${count}`, htmlClassNames: "u_content_divider" },
          selectable: true,
          draggable: true,
          duplicatable: true,
          deletable: true,
          hideable: true,
        },
      } as never,
    ];
  }
  if (out.counters && count) out.counters.u_content_divider = count;
  return out as T;
}

/** A complete HTML document, as `renderToHtml` writes it. */
export function treeToHtml(tree: ElementNode, options: { fonts?: Array<{ url: string }> } = {}): string {
  return Elements.renderToHtml(treeToElement(tree), options);
}
