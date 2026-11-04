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
   * What today's components draw that no style holds, as they lower into this
   * tree (packages/react/src/compat), for the writers. A template can't set it:
   * the JSX of /primitives leaves it out, as it can hold markup and CSS. An id
   * of any characters (`anyId`, read when the template is checked), a
   * `className`, on a Column, a Text, a Divider or an Image an `ariaLabel`; on a
   * root the stylesheet
   * rules that select it (`css`) and an email's `previewHtml`; on a Section an
   * `align`; on a Section or an email's Row a `background` picture, and on a Row
   * `stretch` (its columns table cells, as tall as it is, each at least its
   * `minWidth` and `phoneMinWidth`); on an email's Raw `wide` (across the window, between Sections);
   * in an email, `ownPhone` (its phone styles start where what's hidden does) and on an Image
   * `fillsOnPhones` (its whole place, from where its Row stacks); on a page's Divider `inLine` (a line in a line of no
   * height, by the font's middle).
   */
  compat?: Record<string, Json>;
}

/** A string is text, where the parent takes text. */
export type Child = Node | string;

export function isNode(child: Child): child is Node {
  return typeof child === "object" && child !== null;
}
