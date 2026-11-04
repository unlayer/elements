/** A Divider: an `<hr>` drawn by its top border, in a padded div where it has padding; placed by its parent's text alignment. */
import { h, type Style } from "../jsx";
import type { Component } from "./context";

const MARGIN: Record<string, string> = { center: "0 auto", right: "0 0 0 auto" };

export const Divider: Component = ({ node, style, parent, placement, classes }) => {
  const line: Style = {
    margin: MARGIN[parent.text.textAlign] ?? "0",
    border: "0",
    borderTop: style.borderTop,
    width: style.width,
  };
  const label = node.compat?.ariaLabel as string | undefined;
  if (style.padding === undefined) return <hr id={node.id} class={classes()} aria-label={label} style={[placement, line]} />;
  return (
    <div id={node.id} class={classes()} aria-label={label} style={[placement, { boxSizing: "border-box", padding: style.padding }]}>
      <hr style={line} />
    </div>
  );
};
