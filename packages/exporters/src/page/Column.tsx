/** A Column: a flex column with its gap, in its box. */
import { h } from "../jsx";
import { textDeclarations } from "../shared/css";
import type { Writer } from "./context";
import { box, stackChildren, stackOf } from "./layout";
import { classesFor } from "./styles";

export const writeColumn: Writer = (node, parent, context, placement) => {
  const classes = classesFor(node, context);
  return (
    <div id={node.id} class={classes} style={[placement, stackOf(node), box(node, parent.type !== "Row"), textDeclarations(node.text, parent.text)]}>
      {stackChildren(node, context)}
    </div>
  );
};
