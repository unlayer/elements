/** A ListItem: `<li>`, the List's gap above it but the first. */
import { h } from "../jsx";
import { textDeclarations } from "../shared/css";
import type { Component } from "./context";

export const ListItem: Component = ({ node, style, parent: list, classes, children }) => {
  const first = list.children.find((child) => typeof child !== "string") === node;
  return (
    <li id={node.id} class={classes()} style={[{ margin: 0, marginTop: first ? undefined : list.style.gap }, textDeclarations(node.text, list.text), { textDecoration: style.textDecoration }]}>
      {children()}
    </li>
  );
};
