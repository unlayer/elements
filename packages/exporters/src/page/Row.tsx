/** A Row: a flex row, each child placed by its width or share (`rowPlacement`); stacked on phones by a class. */
import { h } from "../jsx";
import { textDeclarations } from "../shared/css";
import type { Component } from "./context";
import { box, FLEX_ALIGN, JUSTIFY } from "./layout";

export const Row: Component = ({ node, style, parent, placement, classes, children }) => (
  <div
    id={node.id}
    class={classes()}
    style={[
      placement,
      {
        display: "flex",
        gap: style.gap,
        alignItems: FLEX_ALIGN[style.align as string],
        justifyContent: JUSTIFY[style.justify as string],
        flexWrap: style.wrap === "wrap" ? "wrap" : undefined,
      },
      box(node, parent.type !== "Row"),
      textDeclarations(node.text, parent.text),
    ]}
  >
    {children()}
  </div>
);
