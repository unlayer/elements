/** A Column: a flex column with its gap, in its box. */
import { h } from "../jsx";
import { textDeclarations } from "../shared/css";
import type { Component } from "./context";
import { box, stackOf } from "./layout";

export const Column: Component = ({ node, parent, placement, classes, children }) => (
  <div id={node.id} class={classes()} style={[placement, stackOf(node), box(node, parent.type !== "Row"), textDeclarations(node.text, parent.text)]}>
    {children()}
  </div>
);
