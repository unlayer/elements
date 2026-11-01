/** A Button: a link drawn as a box. */
import { h } from "../jsx";
import { textDeclarations } from "../shared/css";
import { link } from "../shared/link";
import type { Component } from "./context";
import { box } from "./layout";

export const Button: Component = ({ node, parent, placement, classes, children }) => (
  <a
    id={node.id}
    class={classes()}
    {...link(node.props.href)}
    style={[placement, { display: "inline-block", textDecoration: "none" }, textDeclarations(node.text, parent.text, ["color"]), box(node, parent.type !== "Row")]}
  >
    {children()}
  </a>
);
