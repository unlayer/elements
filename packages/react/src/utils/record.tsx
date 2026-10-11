/**
 * What Rows, Columns and blocks render while a template is collected (see
 * collect.ts): they record their props, and render markers around what React
 * renders inside them.
 */
import React, { Suspense } from "react";
import { collecting, marker, type Collection } from "./collect";
import { isAsyncComponent, isElementsType } from "./unwrap-root";

/**
 * Children with each component Elements doesn't know wrapped: markers that
 * say where its output starts and ends, inside a Suspense whose fallback (a
 * marker) stands for it when it throws, suspends or is async, so it's left
 * out and the rest renders. Fragments are kept, their children wrapped too.
 */
export function guard(children: React.ReactNode, collection: Collection): React.ReactNode {
  return React.Children.toArray(children).map((child) => {
    if (!React.isValidElement(child) || isElementsType(child.type)) return child;
    if (typeof child.type === "string") {
      // Markup with a component of the user's own in it (`<div><Promo /></div>`): that component gets its own too.
      const inside = (child.props as { children?: React.ReactNode }).children;
      return inside !== undefined && hasComponent(inside) ? React.cloneElement(child, undefined, guard(inside, collection)) : child;
    }
    if (child.type === React.Fragment) {
      return React.createElement(React.Fragment, { key: child.key }, guard((child.props as { children?: React.ReactNode }).children, collection));
    }
    const at = collection.recorded.push({ kind: "boundary", element: child }) - 1;
    // An async component is left out without calling it: it can't render synchronously, and React 18 leaves
    // the promise it gives back unhandled (its rejection would end the process).
    if (isAsyncComponent(child.type)) return marker(collection, at, "f");
    return React.createElement(
      Suspense,
      { key: child.key ?? `b${at}`, fallback: marker(collection, at, "f") },
      marker(collection, at, "o"),
      child,
      marker(collection, at, "c")
    );
  });
}

/** Whether there's a component of the user's own in `children`, in markup or Fragments (not in Elements' own). */
function hasComponent(children: React.ReactNode): boolean {
  return React.Children.toArray(children).some(
    (child) =>
      React.isValidElement(child) &&
      (typeof child.type === "string" || child.type === React.Fragment ? hasComponent((child.props as { children?: React.ReactNode }).children) : !isElementsType(child.type))
  );
}

/** A Row or Column while collecting: its props, and markers around its children. */
export function recordContainer(kind: "row" | "column", props: Record<string, any>): React.ReactElement {
  const collection = collecting()!;
  const at = collection.recorded.push({ kind, props }) - 1;
  return (
    <>
      {marker(collection, at, "o")}
      {guard(props.children, collection)}
      {marker(collection, at, "c")}
    </>
  );
}

/** A block while collecting: its props, and a marker in its place. */
export function recordBlock(type: React.ComponentType<any>, props: Record<string, any>): React.ReactElement {
  const collection = collecting()!;
  const at = collection.recorded.push({ kind: "block", type, props }) - 1;
  return marker(collection, at);
}
