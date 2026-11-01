/**
 * A Link: inside text, a run with its color and decoration always written
 * (email clients color links their own way); as a block, around an image or
 * text of its own, with all of its text styles.
 */
import { linkParts, type LinkValue } from "@unlayer-internal/elements-core";
import { h } from "../jsx";
import { inText, type Writer } from "./context";
import { names } from "./markup";
import { fullText, hiding, hoverClass, inline, mobileTextOf, phoneClass, phoneText, runText } from "./styles";

export const writeLink: Writer = (node, place, context) => {
  const { href, target } = linkParts(node.props.href as LinkValue);
  const rel = target === "_blank" ? "noopener noreferrer" : undefined;
  const { style } = node;

  if (place.inline) {
    const hidden = hiding(node, context, "inline");
    const className = names(hidden.className, hoverClass(node, context));
    return (
      <a id={node.id} class={className} href={href} target={target} rel={rel} style={[runText(node, place.parent, ["color"]), { textDecoration: style.textDecoration, backgroundColor: style.backgroundColor }, hidden.style]}>
        {inline(node, context)}
      </a>
    );
  }

  const onlyImage = node.children.every((child) => typeof child !== "string" && child.type === "Image");
  const className = names(onlyImage ? undefined : phoneClass(context, phoneText(node, mobileTextOf(node, place.mobile))), hoverClass(node, context));
  const content = node.children.map((child) =>
    typeof child === "string" ? child : context.render(child, child.type === "Image" ? { parent: node, fill: place.fill, mobile: {}, inline: false } : inText(node))
  );
  return (
    <a
      id={node.id}
      class={className}
      href={href}
      target={target}
      rel={rel}
      style={onlyImage ? { textDecoration: "none" } : [fullText(node, { align: false }), { textDecoration: style.textDecoration, backgroundColor: style.backgroundColor }]}
    >
      {content}
    </a>
  );
};
