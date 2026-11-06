/**
 * The template tree: what a template's JSX is collected into inside one
 * render, and what layout and every writer read. Internal, never public; plain
 * data (no functions, no React elements).
 */

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export interface ElementsDocument {
  root: Node;
}

export interface Node {
  /** Only when the author gives one; unique in the template, and written to the HTML as is. */
  id?: string;
  /** A defined component: "Email", "Row", "Heading", … */
  type: string;
  /** Meaning: href, src, alt, level. */
  props?: Record<string, Json>;
  /** Appearance, in the value kinds the component's definition gives. */
  style?: Record<string, Json>;
  /** Style overrides on phones (Email and Page). */
  mobile?: Record<string, Json>;
  /** Style while the pointer is over it, where the definition allows. */
  hover?: Record<string, Json>;
  hidden?: { mobile?: boolean; desktop?: boolean };
  children?: Child[];
}

/** A string is text, where the parent takes text. */
export type Child = Node | string;

export function isNode(child: Child): child is Node {
  return typeof child === "object" && child !== null;
}
