/**
 * A Section: one element across the window, its content kept to the content
 * width by its inline padding, however wide the window is.
 */
import { h } from "../jsx";
import { px, textDeclarations } from "../shared/css";
import type { Writer } from "./context";
import { stackChildren, stackOf } from "./layout";
import { classesFor } from "./styles";

export const writeSection: Writer = (node, parent, context) => {
  const classes = classesFor(node, context);
  const { top, right, bottom, left } = (node.style.padding as { top: number; right: number; bottom: number; left: number } | undefined) ?? { top: 0, right: 0, bottom: 0, left: 0 };
  // The side padding, at least as given, more where the window is wider than the content.
  const side = (padding: number) => `max(${px(padding)}, calc((100% - ${px(parent.width ?? 0)}) / 2 + ${px(padding)}))`;
  return (
    <section
      id={node.id}
      class={classes}
      style={[
        stackOf(node),
        { padding: `${px(top)} ${side(right)} ${px(bottom)} ${side(left)}`, backgroundColor: node.style.backgroundColor, border: node.style.border },
        textDeclarations(node.text, parent.text),
      ]}
    >
      {stackChildren(node, context)}
    </section>
  );
};
