/** A Span: styled text inside text. */
import { h } from "../jsx";
import { textDeclarations } from "../shared/css";
import type { Writer } from "./context";
import { classesFor, inline } from "./styles";

export const writeSpan: Writer = (node, parent, context) => {
  const classes = classesFor(node, context);
  return (
    <span id={node.id} class={classes} style={[textDeclarations(node.text, parent.text), { textDecoration: node.style.textDecoration, backgroundColor: node.style.backgroundColor }]}>
      {inline(node, context)}
    </span>
  );
};
