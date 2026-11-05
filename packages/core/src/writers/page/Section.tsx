/**
 * A Section: one element across the window, its content kept to the content
 * width by its inline padding, however wide the window is.
 */
import { h } from "../jsx";
import { px, textDeclarations } from "../shared/css";
import type { Component } from "./context";
import { stackOf } from "./layout";

type Sides = { top: number; right: number; bottom: number; left: number };

export const Section: Component = ({ node, style, parent: root, classes, children }) => {
  const { top, right, bottom, left } = (style.padding as Sides | undefined) ?? { top: 0, right: 0, bottom: 0, left: 0 };
  // The side padding: at least as given, more where the window is wider than the content. Inside calc()
  // and max() every length has its unit (a bare 0 there makes the whole declaration invalid).
  const length = (value: number) => `${Math.round(value * 100) / 100}px`;
  const side = (padding: number) => `max(${length(padding)}, calc((100% - ${length(root.width ?? 0)}) / 2 + ${length(padding)}))`;
  return (
    <section
      id={node.id}
      class={classes()}
      style={[stackOf(node), { padding: `${px(top)} ${side(right)} ${px(bottom)} ${side(left)}`, backgroundColor: style.backgroundColor, border: style.border }, textDeclarations(node.text, root.text)]}
    >
      {children()}
    </section>
  );
};
