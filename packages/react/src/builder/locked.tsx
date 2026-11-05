/**
 * What no tool shows (a Layer, an Svg, a Table, a box in a column, a template's own component): the new engine's own
 * markup for it, in an HTML block of the builder's. It can be moved, duplicated or deleted there, not edited; it
 * comes back as an `Html` block.
 */
import type { Json, Node } from "@unlayer-internal/elements-core";
import { renderTemplate } from "@unlayer-internal/elements-exporters";
import React from "react";
import { Html } from "../index";
import { withParagraphMargin } from "./text";
import { cssSides } from "./values";

type Sides = { top: number; right: number; bottom: number; left: number };

/**
 * An HTML block of the node's own markup, drawn at its width, with `around` its place's spacing and `inherited` the
 * text styles its ancestors give it (beyond the root's).
 */
export function lockedHtml(node: Node, path: string, width: number, root: Node, components: unknown, around: Sides, inherited: Record<string, Json> = {}): React.ReactElement {
  return <Html key={path} values={{ html: renderSubtree(node, width, root, components, inherited), containerPadding: cssSides(around) } as never} />;
}

/** A node drawn on its own by the new engine, at its width, in the root's output: its HTML, with its stylesheet. */
function renderSubtree(node: Node, width: number, root: Node, components: unknown, inherited: Record<string, Json>): string {
  // Drawn at its width in a page at least as wide as a root can be (a Document's block as a page's), the root's text
  // styles around it, and the text styles its ancestors give it in a Column around it.
  const drawn = Math.round(width);
  // A Document's page numbers as the builder's tokens, which a Page can hold.
  const tokens = (n: Node): Node =>
    n.type === "PageNumber" ? { type: "MergeTag", props: { name: n.props?.total ? "page_count" : "page_number" } } : n.children ? { ...n, children: n.children.map((child) => (typeof child === "string" ? child : tokens(child))) } : n;
  const own = tokens(node);
  const around = { ...inherited, ...(drawn < 200 ? { width: drawn } : {}) };
  const page: Node = { type: root.type === "Email" ? "Email" : "Page", props: { width: Math.max(200, drawn) }, style: root.style, children: [Object.keys(around).length ? { type: "Column", style: around, children: [own] } : own] };
  const { head, body } = renderTemplate({ root: page }, { components: components as never });
  const style = /<style>[\s\S]*?<\/style>/.exec(head)?.[0] ?? "";
  return withParagraphMargin(style + body, "margin-top:1em;margin-bottom:1em");
}
