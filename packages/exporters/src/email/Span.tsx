/** A Span: styled text inside text, only what differs from the text around it. */
import { h } from "../jsx";
import type { Writer } from "./context";
import { hiding, inline, runText } from "./styles";

export const writeSpan: Writer = (node, place, context) => {
  const hidden = hiding(node, context, "inline");
  return (
    <span id={node.id} class={hidden.className} style={[runText(node, place.parent), { textDecoration: node.style.textDecoration, backgroundColor: node.style.backgroundColor }, hidden.style]}>
      {inline(node, context)}
    </span>
  );
};
