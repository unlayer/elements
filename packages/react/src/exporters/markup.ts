/**
 * HTML as react-dom/server's renderToStaticMarkup writes it, for the elements the web and document exporters of
 * Divider, Html, Menu and Social render with React in @unlayer/exporters: so those blocks render without react-dom
 * (an edge runtime, a React Server Components layer), the same as with it. Written by the engine's host markup
 * (src/engine/host.ts), as the walker writes a template's; a child that's a React element (a Menu item's text) is
 * rendered by the walker.
 */
import type React from "react";
import { escapeText, openTag, propsBody, validateHost, VOID } from "../engine/host";
import { REACT_18 } from "../engine/react-compat";
import { renderStatic } from "../engine";

/** An element's HTML, kept apart from text (which is escaped where it's put). */
export class Markup {
  constructor(readonly html: string) {}
}

/** Children as React renders them: text escaped, numbers as text, nothing for booleans, null and functions. */
function children(node: unknown): string {
  if (node == null || typeof node === "boolean" || typeof node === "function" || typeof node === "symbol") return "";
  if (typeof node === "string" || typeof node === "number") return escapeText(node);
  // (React 18 renders no BigInt.)
  if (typeof node === "bigint") return REACT_18 ? "" : escapeText(node);
  if (node instanceof Markup) return node.html;
  if (Array.isArray(node)) return node.map(children).join("");
  // A React element (an item's text given as JSX), as the walker renders it.
  return renderStatic(node as React.ReactNode);
}

/** `React.createElement(tag, props, ...children)`, rendered (the props React keeps for itself left out). */
export function element(tag: "a" | "div" | "img" | "span", props: Record<string, unknown>, ...given: unknown[]): Markup {
  const all: Record<string, any> = {};
  for (const name in props) {
    // (`key`, `ref`, `__self` and `__source` are React's; React's element can't have its own `__proto__`.)
    if (!Object.prototype.hasOwnProperty.call(props, name) || name === "key" || name === "ref" || name === "__self" || name === "__source" || name === "__proto__") continue;
    Object.defineProperty(all, name, { value: props[name], enumerable: true, writable: true, configurable: true });
  }
  if (given.length) all.children = given.length > 1 ? given : given[0];
  validateHost(tag, all);
  const open = openTag(tag, all);
  if (VOID.has(tag)) return new Markup(open);
  return new Markup(`${open}${propsBody(tag, all) ?? children(all.children)}</${tag}>`);
}

/** HTML as the exporters write what React renders: without the image preloads React 19 adds (nor any in markup given). */
export const staticMarkup = (markup: Markup | null): string => (markup ? markup.html : "").replace(/<link rel="preload" as="image"[^>]*\/?>/g, "");
