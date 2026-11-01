/** A Span: styled text inside text, only what differs from the text around it. */
import { h } from "../jsx";
import type { Component } from "./context";
import { hiding, runText } from "./styles";

export const Span: Component = ({ node, style, parent, text }) => {
  const hidden = hiding(node, "inline");
  return (
    <span id={node.id} class={hidden.class} style={[runText(node, parent), { textDecoration: style.textDecoration, backgroundColor: style.backgroundColor }, hidden.style]}>
      {text()}
    </span>
  );
};
