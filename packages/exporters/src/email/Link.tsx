/**
 * A Link: inside text, a run with its color and decoration always written
 * (email clients color links their own way); as a block, around an image or
 * text of its own, with all of its text styles.
 */
import { Fragment, h } from "../jsx";
import { link } from "../shared/link";
import type { Component } from "./context";
import { fullText, hiding, runText } from "./styles";

export const Link: Component = ({ node, style, parent, fill, inline, phoneText, text, render }) => {
  if (inline) {
    const hidden = hiding(node, "inline");
    return (
      <a id={node.id} class={hidden.class} hover={node.hover} {...link(node.props)} style={[runText(node, parent, ["color"]), { textDecoration: style.textDecoration, backgroundColor: style.backgroundColor }, hidden.style]}>
        {text()}
      </a>
    );
  }
  // A block: around an image (which fills what the link is given), or text of its own.
  const onlyImage = node.children.every((child) => typeof child !== "string" && child.type === "Image");
  return (
    <a
      id={node.id}
      phone={onlyImage ? undefined : phoneText}
      hover={node.hover}
      {...link(node.props)}
      style={onlyImage ? { textDecoration: "none" } : [fullText(node, { align: false }), { textDecoration: style.textDecoration, backgroundColor: style.backgroundColor }]}
    >
      {onlyImage ? <>{node.children.map((child) => typeof child !== "string" && render(child, { fill }))}</> : text()}
    </a>
  );
};
