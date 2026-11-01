/** A Divider: an `<hr>` drawn by its top border, in a padded div where it has padding; placed by its parent's text alignment. */
import { h, type Style } from "../jsx";
import { px } from "../shared/css";
import type { Component } from "./context";

const MARGIN: Record<string, string> = { center: "0 auto", right: "0 0 0 auto" };

export const Divider: Component = ({ node, style, parent, placement, classes }) => {
  const line: Style = {
    margin: MARGIN[parent.text.textAlign] ?? "0",
    border: "0",
    borderTop: `${px(style.thickness as number)} ${style.lineStyle} ${style.color}`,
    width: style.width,
  };
  if (style.padding === undefined) return <hr id={node.id} class={classes()} style={[placement, line]} />;
  return (
    <div id={node.id} class={classes()} style={[placement, { boxSizing: "border-box", padding: style.padding }]}>
      <hr style={line} />
    </div>
  );
};
