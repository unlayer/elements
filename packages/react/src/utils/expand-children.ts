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
// Inside a render React runs (a Row's): components are called there, as React
// calls them, so their hooks and the context around them work. A render of
// their own (callIsolated) would reset that render's hooks, and couldn't see a
// Provider placed in the email.
let driven = 0;
// What each component rendered in this pass of that render: React runs a
// render again when a component sets state while rendering, and each pass
// calls every component once, so its hooks run in the same order.
let pass: WeakMap<object, Map<number, React.ReactNode>> | undefined;

/** Runs `render` as one pass of a render React is running (a Row's own). */
export function drivenByReact<T>(render: () => T): T {
  const outer = pass;
  driven++;
  pass = new WeakMap();
  try {
    return render();
  } finally {
    driven--;
    pass = outer;
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

/** Calls a user component (memo and forwardRef unwrapped) with its props. */
function callComponent(element: React.ReactElement<any>): React.ReactNode {
  const type = innerType(element.type);
  const props = { ...element.props };
  return type.$$typeof === FORWARD_REF ? type.render(props, null) : type(props);
}

const isThenable = (value: unknown): boolean => typeof (value as { then?: unknown } | null)?.then === "function";

/**
 * A user component's blocks, or nothing when it can't render here: one that's
 * async (Elements renders synchronously) or throws is left out, and the rest
 * of the email renders, as when such a component wasn't called at all.
 */
function renderedOrNothing(element: React.ReactElement<any>, call: () => unknown): React.ReactNode {
  const name = innerType(element.type)?.displayName || innerType(element.type)?.name || "component";
  let out: unknown;
  try {
    out = call();
  } catch (error) {
    if (isThenable(error) || /async and suspending/.test(String((error as Error)?.message))) {
      console.warn(`[Unlayer] <${name}> suspends or is async: Elements renders synchronously, so it's left out. Load its data first and pass it as props.`);
    } else {
      console.error(`[Unlayer] <${name}> threw while rendering, so it's left out:`, error);
    }
    return null;
  }
  if (isThenable(out)) {
    console.warn(`[Unlayer] <${name}> is async: Elements renders synchronously, so it's left out. Load its data first and pass it as props.`);
    return null;
  }
  return out as React.ReactNode;
}

/** Notes what a component rendered in this render (the last pass of it), for the head and the design. */
function record(list: object, at: number, out: React.ReactNode): void {
  if (rendered) rendered.set(list, (rendered.get(list) ?? new Map()).set(at, out));
}

// A user component is called once per place in a render: in the render React runs (once
// per pass of it), or outside one (renderToJson) in a render of its own, so its hooks work
// either way.
function contents(element: React.ReactElement<any>, list: object, at: number): React.ReactNode {
  if (element.type === React.Fragment) return element.props.children;
  const own = driven ? pass : rendered;
  const done = own?.get(list);
  if (done?.has(at)) return done.get(at);
  const type = innerType(element.type);
  const out = (isElementsType(type) ? React.createElement(type, { ...element.props }) : renderedOrNothing(element, () => (driven ? callComponent(element) : callIsolated(() => callComponent(element), `u${++called}-`)))) as React.ReactNode;
  if (own) own.set(list, (done ?? new Map()).set(at, out));
  if (driven) record(list, at, out);
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

/**
 * A user component among Body's children, in the render Body runs: it calls the
 * component in its place, so the component's hooks are its own (state,
 * `useId()`), as when React renders it, and places what it returns as Body's
 * own children are placed. It has no hooks of its own.
 */
function Expanded({ element, list, at, place, depth, prefix }: { element: React.ReactElement<any>; list: object; at: number; place: (child: React.ReactElement) => React.ReactElement; depth: number; prefix: string }): React.ReactNode {
  const inside = renderedOrNothing(element, () => callComponent(element));
  // Noted again on each pass (a component that sets state while rendering): the head reads the last.
  record(list, at, inside);
  // A component that renders plain HTML (`<div dangerouslySetInnerHTML>`) is kept as it is.
  if (React.isValidElement(inside) && typeof inside.type === "string") return inside;
  return bodyChildren(inside, place, depth + 1, prefix);
}
Expanded.displayName = "Expanded";

/**
 * Body's children, for the render Body runs: Fragments flattened, blocks and
 * rows given Body's settings by `place`, and each user component an element
 * that calls it in that render (see Expanded). Nothing is called here, so
 * Body's own render keeps no hooks of theirs: a component added, removed or
 * moved between renders keeps its own state. Each child gets a key (its own,
 * or its place), as React expects of a list.
 */
export function bodyChildren(children: React.ReactNode, place: (child: React.ReactElement) => React.ReactElement, depth = 0, prefix = ""): React.ReactNode[] {
  if (depth > 50) throw new Error("[Unlayer] components nested more than 50 deep");
  const out: React.ReactNode[] = [];
  // The list the children are in (a single child is its own), as expandChildren keys them.
  const list = children as object;
  React.Children.forEach(children, (child, at) => {
    if (child == null || typeof child === "boolean") return;
    if (!React.isValidElement(child)) return void out.push(child);
    const key = `${prefix}${child.key ?? `#${at}`}`;
    if (child.type === React.Fragment) return void out.push(...bodyChildren((child.props as { children?: React.ReactNode }).children, place, depth + 1, `${key}/`));
    const type = innerType(child.type);
    if (expands(child) && !isElementsType(type)) return void out.push(React.createElement(Expanded, { key, element: child, list, at, place, depth, prefix: `${key}/` }));
    const element = expands(child) ? React.createElement(type, { ...(child.props as object) }) : child;
    // An HTML element (<div>) is kept: Body's settings would be written as its attributes.
    out.push(React.cloneElement(typeof element.type === "string" ? element : place(element), { key }));
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
