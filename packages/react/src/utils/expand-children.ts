// Fragments and user components (`<Header />` returning a Row) among a Body's,
// Row's or Column's children, expanded into what they render, so the render,
// the head's phone CSS and renderToJson see the same blocks (ids line up).

import React from "react";
import { callIsolated, isElementsType } from "./unwrap-root";

const MEMO = Symbol.for("react.memo");
const FORWARD_REF = Symbol.for("react.forward_ref");
// What each element rendered to, for the render under way only: an element
// object kept between renders (`const footer = <Footer />`) is called again by
// the next one, which may read other data (another user's).
let rendered: WeakMap<object, React.ReactNode> | undefined;

/** Runs one render (renderToHtml, renderToJson, …) with its own record of what each component rendered. */
export function withRenderScope<T>(render: () => T): T {
  if (rendered) return render();
  rendered = new WeakMap();
  try {
    return render();
  } finally {
    rendered = undefined;
  }
}

function innerType(type: any): any {
  while (type?.$$typeof === MEMO) type = type.type;
  return type;
}

function expands(child: React.ReactNode): child is React.ReactElement {
  if (!React.isValidElement(child)) return false;
  if (child.type === React.Fragment) return true;
  const type = innerType(child.type);
  if (isElementsType(type)) return type !== child.type;
  return type?.$$typeof === FORWARD_REF || (typeof type === "function" && !type.prototype?.isReactComponent);
}

// A user component is called in a render of its own (hooks work), once per element in a render.
function contents(element: React.ReactElement<any>): React.ReactNode {
  if (element.type === React.Fragment) return element.props.children;
  if (rendered?.has(element)) return rendered.get(element);
  const type = innerType(element.type);
  const props = { ...element.props };
  const out = (isElementsType(type)
    ? React.createElement(type, props)
    : callIsolated(() => (type.$$typeof === FORWARD_REF ? type.render(props, null) : type(props)))) as React.ReactNode;
  rendered?.set(element, out);
  return out;
}

/** The children with Fragments and user components expanded; `children` itself when there are none. */
export function expandChildren(children: React.ReactNode, depth = 0): React.ReactNode {
  let any = false;
  React.Children.forEach(children, (child) => (any ||= expands(child)));
  if (!any) return children;
  if (depth > 50) throw new Error("[Unlayer] components nested more than 50 deep");
  const out: React.ReactNode[] = [];
  const add = (child: React.ReactNode) => child != null && typeof child !== "boolean" && out.push(child);
  React.Children.forEach(children, (child) => {
    if (expands(child)) React.Children.forEach(expandChildren(contents(child), depth + 1), add);
    else add(child);
  });
  return out;
}

const ENTITIES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/**
 * Text placed straight in a Row or Column, as HTML: escaped, as React shows
 * text (raw HTML goes in an Html block). The editor has no place for it, so
 * the warning says where it belongs.
 */
export function looseText(child: string | number, container: string): string {
  const text = String(child);
  if (text.trim()) {
    console.warn(`${container}: text placed straight in a ${container} shows as text and isn't kept in the editor's design. Put it in a <Paragraph>, or HTML in an <Html> block.`);
  }
  return text.replace(/[&<>"']/g, (c) => ENTITIES[c]);
}
