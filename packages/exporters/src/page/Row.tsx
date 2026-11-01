/** A Row: a flex row, each child placed by its width or share (`rowPlacement`); stacked on phones by a class. */
import { h } from "../jsx";
import { textDeclarations } from "../shared/css";
import { isNode, type Writer } from "./context";
import { box, FLEX_ALIGN, JUSTIFY, rowPlacement } from "./layout";
import { classesFor } from "./styles";

export const writeRow: Writer = (node, parent, context, placement) => {
  const classes = classesFor(node, context);
  const { style } = node;
  return (
    <div
      id={node.id}
      class={classes}
      style={[
        placement,
        {
          display: "flex",
          gap: style.gap,
          alignItems: style.align ? FLEX_ALIGN[style.align as string] : undefined,
          justifyContent: style.justify ? JUSTIFY[style.justify as string] : undefined,
          flexWrap: style.wrap === "wrap" ? "wrap" : undefined,
        },
        box(node, parent.type !== "Row"),
        textDeclarations(node.text, parent.text),
      ]}
    >
      {node.children.filter(isNode).map((child) => context.render(child, node, rowPlacement(child, node)))}
    </div>
  );
};
