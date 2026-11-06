/** A List: `<ul>` or `<ol>`, its markers in its indent (its padding on the side its text starts), in its box. */
import { toPx } from "../../resolve";
import type { Insets } from "../../kinds";
import { h } from "../jsx";
import { px, textDeclarations } from "../shared/css";
import { isNode, type Component } from "./context";

const NONE: Insets = { top: 0, right: 0, bottom: 0, left: 0 };

export const List: Component = ({ node, style, parent, placement, classes, rtl, render }) => {
  const Tag = node.props.type === "number" ? "ol" : "ul";
  const padding = (style.padding as Insets | undefined) ?? NONE;
  const indent = toPx(style.indent, null) ?? 0;
  const start = Number(node.props.start);
  return (
    <Tag
      id={node.id}
      class={classes()}
      start={Tag === "ol" && start !== 1 ? start : undefined}
      style={[
        placement,
        {
          margin: 0,
          padding: `${px(padding.top)} ${px(padding.right + (rtl ? indent : 0))} ${px(padding.bottom)} ${px(padding.left + (rtl ? 0 : indent))}`,
          listStyleType: Tag === "ol" ? "decimal" : "disc",
          boxSizing: "border-box",
          width: parent.type === "Row" ? undefined : style.width,
          maxWidth: style.maxWidth,
          backgroundColor: style.backgroundColor,
          border: style.border,
        },
        textDeclarations(node.text, parent.text),
      ]}
    >
      {node.children.filter(isNode).map((item) => render(item, []))}
    </Tag>
  );
};
