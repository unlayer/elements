/** A Span: styled text inside text. */
import { h } from "../jsx";
import { textDeclarations } from "../shared/css";
import type { Component } from "./context";

export const Span: Component = ({ node, style, parent, classes, children }) => (
  <span id={node.id} class={classes()} style={[textDeclarations(node.text, parent.text), { textDecoration: style.textDecoration, backgroundColor: style.backgroundColor }]}>
    {children()}
  </span>
);
