/**
 * What Rows, Columns and blocks render while a template is collected (see
 * collect.ts): they record their props, and render markers around what React
 * renders inside them.
 */
import React, { Suspense } from "react";
import { collecting, COLLECTING_ID, marker, RECORDS, within, type Collection } from "./collect";
import { isAsyncComponent, isElementsType } from "./unwrap-root";

/**
 * Children with each component Elements doesn't know wrapped: markers that
 * say where its output starts and ends, inside a Suspense whose fallback (a
 * marker) stands for it when it throws, suspends or is async, so it's left
 * out and the rest renders. Fragments are kept, their children wrapped too.
 */
export function guard(children: React.ReactNode, collection: Collection): React.ReactNode {
  return React.Children.toArray(children).map((child) => {
    if (!React.isValidElement(child)) return child;
    if (isElementsType(child.type)) {
      if ((child.type as unknown as Record<symbol, unknown>)[RECORDS]) return child;
      // A component of the user's own named Row or Column (its displayName): rendered as React renders it.
      if (!olderContainer(child.type)) return bounded(child, collection);
      return recordedForOlder(child, collection);
    }
    // No component at all (`undefined` from a broken or circular import): React says so and the render fails, as an
    // email missing a block shouldn't send. Only what can render gets a boundary that leaves it out.
    if (!child.type || (typeof child.type === "object" && !("$$typeof" in child.type))) return child;
    if (typeof child.type === "string") {
      // Markup with a component of the user's own in it (`<div><Promo /></div>`): that component gets its own too.
      const inside = (child.props as { children?: React.ReactNode }).children;
      const element = inside !== undefined && hasComponent(inside) ? React.cloneElement(child, undefined, guard(inside, collection)) : child;
      // Markup React rejects (`<hr style="…">` as a string) throws out of the render: guarded too when it did.
      return collection.markup ? bounded(element, collection) : element;
    }
    if (child.type === React.Fragment) {
      return React.createElement(React.Fragment, { key: child.key }, guard((child.props as { children?: React.ReactNode }).children, collection));
    }
    return bounded(child, collection);
  });
}

/** `child` between markers, in a Suspense whose fallback (a marker) stands for it when it throws or suspends. */
function bounded(child: React.ReactElement, collection: Collection): React.ReactNode {
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
}

/**
 * A Row, Column or block of an older copy of Elements (0.1.x, from a package still on it), which renders its HTML
 * instead of recording itself: recorded here as this copy's would, so it's in the HTML and the design (rendered by
 * this copy's Row and Column, and by the block's own exporter).
 */
/**
 * Whether a type named Row or Column is an older copy's (0.1.x marks them only by name): their code reads the
 * config Body passes them (`_config`), which a component of the user's own named after one doesn't. Blocks and
 * roots are marked otherwise (`__unlayerRender`, and roots aren't recorded).
 */
function olderContainer(type: unknown): boolean {
  return !/^(Row|Column)$/.test((type as { displayName?: string } | null)?.displayName ?? "") || /\b_config\b/.test(String(type));
}

function recordedForOlder(child: React.ReactElement, collection: Collection): React.ReactNode {
  const type = child.type as unknown as { displayName?: string; __unlayerRender?: unknown };
  const props = child.props as Record<string, any>;
  if (type.displayName === "Row" || type.displayName === "Column") {
    const at = collection.recorded.push({ kind: type.displayName === "Row" ? "row" : "column", props }) - 1;
    return (
      <React.Fragment key={child.key ?? `r${at}`}>
        {marker(collection, at, "o")}
        {guard(props.children, collection)}
        {marker(collection, at, "c")}
      </React.Fragment>
    );
  }
  if (!type.__unlayerRender) return child; // a root (Email, Page, Document) placed inside one
  const at = collection.recorded.push({ kind: "block", type: child.type as React.ComponentType<any>, props }) - 1;
  return React.cloneElement(marker(collection, at), { key: child.key ?? `b${at}` });
}

/** Whether there's a component of the user's own in `children`, in markup or Fragments (not in Elements' own). */
function hasComponent(children: React.ReactNode): boolean {
  return React.Children.toArray(children).some(
    (child) =>
      React.isValidElement(child) &&
      (typeof child.type === "string" || child.type === React.Fragment ? hasComponent((child.props as { children?: React.ReactNode }).children) : !isElementsType(child.type))
  );
}

/**
 * What a Row, Column or block renders while a template is collected: in the collecting render (its ids carry
 * COLLECTING_ID), what `record` gives; in any other render started inside it, what it renders anyway (`real`,
 * called with nothing collecting). When it can't tell, it renders what it renders: a marker never leaves the
 * collecting render.
 */
function Sentinel({ record, real }: { record: () => React.ReactNode; real: () => React.ReactNode }): React.ReactNode {
  // Where ids can't tell (another copy of React: see Collection.blind), it records while collecting: a marker in a
  // render started inside the collecting one is then rendered in its place (normalize.tsx).
  let collected = !!collecting()?.blind;
  if (!collected) {
    try {
      collected = React.useId().slice(1).startsWith(COLLECTING_ID);
    } catch {
      // Not in a render React runs: what it renders.
    }
  }
  return collected ? record() : within(null, real);
}

/** Sentinel by the name of the component it stands for, which React's warnings name (`Check the render method of Column`). */
const named = new Map<string, typeof Sentinel>();

/** A Row, Column or block, while a template is collected (see Sentinel). */
export function whileCollecting(record: () => React.ReactNode, real: () => React.ReactNode, name: string): React.ReactElement {
  let type = named.get(name);
  if (!type) named.set(name, (type = Object.assign((props: Parameters<typeof Sentinel>[0]) => Sentinel(props), { displayName: name })));
  return React.createElement(type, { record, real });
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
