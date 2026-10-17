/**
 * The model of a template: its root's content collected once per render (collect.ts) and made Elements components
 * only (elements.ts), with the user's components, Fragments, conditions, hooks and Context rendered as React renders
 * them. The HTML (Body), the head (utils/extract-head.ts) and the design (utils/render-to-json.ts) are made from it.
 */
import React from "react";
import { rootProps } from "../utils/tailwind";
import { collect } from "./collect";
import { elements, markup } from "./elements";

export { collect, collectedFrom, collecting, type Collected } from "./collect";
export { KEPT } from "./elements";

/**
 * A root's children as HTML (what Body puts inside it): markup among the rows as it is, and each row or block
 * rendered by Elements with `render` (with the root's settings).
 */
export function childrenHtml(children: React.ReactNode, render: (child: React.ReactElement) => string, root: Record<string, any>, name: string): string {
  const c = collect(children, name);
  c.root = root;
  return markup(c, c.content, render);
}

/** Children (a root's, with its props, or a Row on its own) as Elements components only, for the head and the design. */
export function normalizedChildren(children: React.ReactNode, root?: Record<string, any>, name?: string): React.ReactNode[] {
  const c = collect(children, name);
  c.root = root;
  return elements(c, c.content, "root");
}

/** What a root's content gives the document's head and the root (a <Font>, from "@unlayer/react-elements/font"). */
export const heads = (children: React.ReactNode, root?: string) => collect(children, root).recorded.flatMap((r) => (r.kind === "head" ? [r] : []));
export const headTags = (children: React.ReactNode, mode: string, root?: string) => heads(children, root).flatMap((r) => r.tags(mode));

/** The props a root's content gives it (a <Font default>'s `fontFamily`), where it sets none of them. */
export function rootDefaults(props: Record<string, any>, name?: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const { root } of heads(props.children, name)) for (const key in root) if (props[key] === undefined && props.values?.[key] === undefined) out[key] ??= root[key];
  return out;
}

/**
 * `root` with its children as Elements components only (and its classes and default font as props), in `mode` (the
 * mode it renders in, which its rows' Tailwind rewrites read, as where Body renders them).
 */
export function normalizedRoot(root: React.ReactElement, mode?: string): React.ReactElement {
  const props = root.props as { className?: string; children?: React.ReactNode };
  const name = (root.type as { displayName?: string }).displayName ?? "Body";
  const styled = rootProps(props, name);
  return React.cloneElement(root, { ...styled, ...rootDefaults(styled, name) }, ...normalizedChildren(props.children, mode ? { ...styled, mode } : styled, name));
}
