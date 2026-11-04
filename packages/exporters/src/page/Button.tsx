/** A Button: a link drawn as a box. */
import { h } from "../jsx";
import { textDeclarations } from "../shared/css";
import { link } from "../shared/link";
import type { Component } from "./context";
import { box } from "./layout";

export const Button: Component = ({ node, parent, placement, classes, children }) => {
  const { class: own, ...attributes } = link(node.props);
  const boxed = box(node, parent.type !== "Row");
  return (
    <a
      id={node.id}
      class={[classes(), own]}
      {...attributes}
      style={[placement, { display: "inline-block", textDecoration: node.style.textDecoration ?? "none" }, textDeclarations(node.text, parent.text, ["color"]), { ...boxed, boxSizing: (node.style.boxSizing as string | undefined) ?? boxed.boxSizing }]}
    >
      {children()}
    </a>
  );
};
