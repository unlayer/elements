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
  /**
   * Data from another format that Elements doesn't render, kept so it goes
   * back out unchanged (a builder block's display conditions). The writers read
   * what today's components draw that no style holds, as they lower into this
   * tree (packages/react/src/compat): an id of any characters (`anyId`, read
   * when the template is checked), a `className`, on a Column or a Text an
   * `ariaLabel`; on a root the stylesheet
   * rules that select it (`css`) and an email's `previewHtml`; on a Section an
   * `align`; on a Section or an email's Row a `background` picture, and on a Row
   * `stretch` (its columns table cells, as tall as it is, each at least its
   * `minWidth` and `phoneMinWidth`); on an email's Raw `wide` (across the window, between Sections);
   * in an email, `ownPhone` (its phone styles start where what's hidden does) and on an Image
   * `stackedMaxWidth` (its maximum where its Row stacks).
   */
  compat?: Record<string, Json>;
}

/** A string is text, where the parent takes text. */
export type Child = Node | string;

export function isNode(child: Child): child is Node {
  return typeof child === "object" && child !== null;
}
