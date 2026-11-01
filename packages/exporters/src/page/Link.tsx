/** A Link: inside text, or as a block (around an image); its color always written (the browser has its own). */
import { h } from "../jsx";
import { textDeclarations } from "../shared/css";
import { link } from "../shared/link";
import type { Component } from "./context";

export const Link: Component = ({ node, style, parent, placement, classes, children }) => (
  <a
    id={node.id}
    class={classes()}
    {...link(node.props.href)}
    style={[placement, textDeclarations(node.text, parent.text, ["color"]), { textDecoration: style.textDecoration, backgroundColor: style.backgroundColor }]}
  >
    {children()}
  </a>
);
