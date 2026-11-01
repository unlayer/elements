/** A Button: a link drawn as a box. */
import { linkParts, type LinkValue } from "@unlayer-internal/elements-core";
import { h } from "../jsx";
import { textDeclarations } from "../shared/css";
import type { Writer } from "./context";
import { box } from "./layout";
import { classesFor, inline } from "./styles";

export const writeButton: Writer = (node, parent, context, placement) => {
  const classes = classesFor(node, context);
  const { href, target } = linkParts(node.props.href as LinkValue);
  return (
    <a
      id={node.id}
      class={classes}
      href={href}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      style={[placement, { display: "inline-block", textDecoration: "none" }, textDeclarations(node.text, parent.text, ["color"]), box(node, parent.type !== "Row")]}
    >
      {inline(node, context)}
    </a>
  );
};
