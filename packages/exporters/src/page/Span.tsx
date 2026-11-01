/** A Span: styled text inside text. Raised or lowered, a <sup> or <sub> with no line height of its own, so it doesn't push its line apart. */
import { h } from "../jsx";
import { textDeclarations } from "../shared/css";
import type { Component } from "./context";

const TAGS: Record<string, string> = { super: "sup", sub: "sub" };

export const Span: Component = ({ node, style, parent, classes, children }) => {
  const Tag = TAGS[style.verticalAlign as string] ?? "span";
  return (
    <Tag
      id={node.id}
      class={classes()}
      style={[textDeclarations(node.text, parent.text), { textDecoration: style.textDecoration, backgroundColor: style.backgroundColor, lineHeight: Tag === "span" ? undefined : "0" }]}
    >
      {children()}
    </Tag>
  );
};
