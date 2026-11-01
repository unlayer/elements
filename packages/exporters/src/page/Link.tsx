/** A Link: inside text, or as a block (around an image); its color always written (the browser has its own). */
import { linkParts, type LinkValue } from "@unlayer-internal/elements-core";
import { h } from "../jsx";
import { textDeclarations } from "../shared/css";
import type { Writer } from "./context";
import { classesFor, inline } from "./styles";

export const writeLink: Writer = (node, parent, context, placement) => {
  const classes = classesFor(node, context);
  const { href, target } = linkParts(node.props.href as LinkValue);
  return (
    <a
      id={node.id}
      class={classes}
      href={href}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      style={[placement, textDeclarations(node.text, parent.text, ["color"]), { textDecoration: node.style.textDecoration, backgroundColor: node.style.backgroundColor }]}
    >
      {inline(node, context)}
    </a>
  );
};
