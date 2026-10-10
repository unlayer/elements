// Fragments and user components (`<Header />` returning a Row) among a Body's,
// Row's or Column's children, expanded into what they render, so the render,
// the head's phone CSS and renderToJson see the same blocks (ids line up).

import React from "react";
import { callIsolated, isElementsType } from "./unwrap-root";

const MEMO = Symbol.for("react.memo");
const FORWARD_REF = Symbol.for("react.forward_ref");
// What each component rendered to, by the children list it's in and its place
// there, for the render under way only: an element object kept between renders
// (`const footer = <Footer />`) is called again by the next one, which may read
// other data (another user's), and one placed twice is called for each place.
let rendered: WeakMap<object, Map<number, React.ReactNode>> | undefined;
// Components called so far in the render: each one's `useId()` values get their own prefix.
let called = 0;
// Inside a render React runs (Body's, a Row's): components are called there,
// as React calls them, so their hooks and the context around them work. A
// render of their own (callIsolated) would reset that render's hooks, and
// couldn't see a Provider placed in the email.
let driven = 0;

/** Runs `render` as part of a render React is running (Body's or a Row's own). */
export function drivenByReact<T>(render: () => T): T {
  driven++;
  try {
    return render();
  } finally {
    driven--;
  }
}

/** Runs one render (renderToHtml, renderToJson, …) with its own record of what each component rendered. */
export function withRenderScope<T>(render: () => T): T {
  if (rendered) return render();
  rendered = new WeakMap();
  called = 0;
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

// A user component is called once per place in a render: in the render React runs, or
// outside one (renderToJson) in a render of its own, so its hooks work either way.
function contents(element: React.ReactElement<any>, list: object, at: number): React.ReactNode {
  if (element.type === React.Fragment) return element.props.children;
  const done = rendered?.get(list);
  if (done?.has(at)) return done.get(at);
  const type = innerType(element.type);
  const props = { ...element.props };
  const call = () => (type.$$typeof === FORWARD_REF ? type.render(props, null) : type(props));
  const out = (isElementsType(type) ? React.createElement(type, props) : driven ? call() : callIsolated(call, `u${++called}-`)) as React.ReactNode;
  if (rendered) rendered.set(list, (done ?? new Map()).set(at, out));
  return out;
}

/**
 * A component that rendered plain HTML (`<div dangerouslySetInnerHTML>`), as
 * an element that gives back what it rendered: a Column reads its HTML (and
 * names its block after it, as before) without calling it a second time.
 */
function renderedAs(element: React.ReactElement<any>, inside: React.ReactNode): React.ReactElement {
  const type = innerType(element.type);
  const Rendered = () => inside;
  Rendered.displayName = type?.displayName || type?.name || "component";
  return React.createElement(Rendered, { ...element.props, key: element.key });
}

/** The children with Fragments and user components expanded; `children` itself when there are none. */
export function expandChildren(children: React.ReactNode, depth = 0): React.ReactNode {
  let any = false;
  React.Children.forEach(children, (child) => (any ||= expands(child)));
  if (!any) return children;
  if (depth > 50) throw new Error("[Unlayer] components nested more than 50 deep");
  const out: React.ReactNode[] = [];
  const add = (child: React.ReactNode) => child != null && typeof child !== "boolean" && out.push(child);
  // The list the children are in (a single child is its own).
  const list = children as object;
  React.Children.forEach(children, (child, at) => {
    if (!expands(child)) return add(child);
    const inside = contents(child, list, at);
    // A component that renders plain HTML (`<div dangerouslySetInnerHTML>`) is kept: a Column renders its HTML, as it always has.
    if (child.type !== React.Fragment && React.isValidElement(inside) && typeof inside.type === "string") return add(renderedAs(child, inside));
    React.Children.forEach(expandChildren(inside, depth + 1), add);
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
