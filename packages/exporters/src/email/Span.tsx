/**
 * A Span: styled text inside text, only what differs from the text around it.
 * Raised or lowered, it's a <sup> or <sub> (every client, Word too, raises
 * and lowers those), with no line height of its own, so it doesn't push its
 * line apart.
 */
import { h } from "../jsx";
import type { Component } from "./context";
import { hiding, runText } from "./styles";

const TAGS: Record<string, string> = { super: "sup", sub: "sub" };

export const Span: Component = ({ node, style, parent, phoneText, text }) => {
  const hidden = hiding(node, "inline");
  const Tag = TAGS[style.verticalAlign as string] ?? "span";
  return (
    <Tag
      id={node.id}
      class={hidden.class}
      // Raised or lowered, it keeps no line height on phones either.
      phone={Tag === "span" ? phoneText : phoneText.filter(([property]) => property !== "line-height")}
      style={[runText(node, parent), { textDecoration: style.textDecoration, backgroundColor: style.backgroundColor, lineHeight: Tag === "span" ? undefined : "0" }, hidden.style]}
    >
      {text()}
    </Tag>
  );
};
