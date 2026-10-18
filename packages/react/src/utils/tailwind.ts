/**
 * Scopes: a component (the Tailwind entry's <Tailwind>) whose props rewrite the props of the Elements components
 * inside it. Its type carries the rewrite as `[TAILWIND]`; while a template is collected it records itself (with
 * that rewrite in its props), so each Row, Column and block knows the scope it's in (see src/model/elements.ts), and a root
 * whose content is one is rewritten by it too. The main entry knows no more of Tailwind than that.
 */
import React from "react";
import { rightToLeft, scopeCache } from "./render-scope";

/** A scope's rewrite: on its component type, in its recorded props, and on the errors it throws (passed on as they are). */
export const TAILWIND = Symbol.for("@unlayer/react-elements/tailwind");

type Rewrite = (scope: Record<PropertyKey, any>, name: string, defaults: Record<string, any> | undefined, props: Record<string, any>, rtl?: boolean) => Record<string, any>;

/** On a scope's component type (the Tailwind entry's <Tailwind>): its copy's compiler, for the async renderers. */
export const TAILWIND_LOADER = Symbol.for("@unlayer/react-elements/tailwind-loader");

/** Whether an error is one a scope threw: the renderers pass it on as it is. */
export const isTailwindError = (error: unknown): boolean => !!(error as Record<symbol, unknown> | null)?.[TAILWIND];

/**
 * A component's props as the scope it's in (its recorded props) rewrites them, in the render's direction (logical
 * sides, `ps-4`, are the right in a right-to-left root). A Row's can hold a function under `[TAILWIND]`, which
 * src/model/elements.ts gives the Row's children (its Columns), its props, the root's and the direction, to change
 * (Tailwind's padding classes, which inset the content as in CSS, and text styles for the text inside); so can a
 * Column's `style` and the root's props, for a Row without one.
 */
export const classProps = (scope: Record<PropertyKey, any>, name: string, defaults: Record<string, any> | undefined, props: Record<string, any>): Record<string, any> =>
  (scope[TAILWIND] as Rewrite)(scope, name, defaults, props, rightToLeft());

/** The scope a root's content is in: its only child, through context providers and Fragments. */
function tailwindIn(children: React.ReactNode): React.ReactElement<Record<PropertyKey, any>> | undefined {
  // The elements themselves (not copies, as React.Children gives): a render asks with the same one each time.
  const only = Array.isArray(children) ? children.filter((c) => c != null && typeof c !== "boolean") : [children];
  const child = only.length === 1 && React.isValidElement<{ children?: React.ReactNode }>(only[0]) ? only[0] : undefined;
  if (!child) return undefined;
  return (child.type as unknown as Record<symbol, unknown>)?.[TAILWIND] ? (child as React.ReactElement<Record<PropertyKey, any>>) : typeof child.type === "string" ? undefined : tailwindIn(child.props.children);
}

/**
 * A root's (Email, Page, Document, Body) props with its `className` rewritten by the scope its content is in, worked
 * out once per render (Body and the head and design ask for the same; its settings, `mode` and `config`, aren't styles).
 */
export function rootProps<P extends { className?: string; children?: React.ReactNode }>(props: P, name: string): P {
  const scope = props.className ? tailwindIn(props.children) : undefined;
  if (!scope) return props;
  const { children: _children, mode: _mode, config: _config, ...styles } = props as Record<string, any>;
  // (By its props: the element itself is the children the render's collected under.)
  const done = scopeCache(scope.props as object, () => new Map<string, Record<string, any>>());
  if (!done.has(props.className!)) done.set(props.className!, (scope.type as unknown as Record<symbol, Rewrite>)[TAILWIND](scope.props, name, undefined, styles));
  return { ...props, ...done.get(props.className!), className: undefined };
}
