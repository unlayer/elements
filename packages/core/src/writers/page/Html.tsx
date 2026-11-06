/** An Html block: its markup written as it is, in one div, so a stack's gap goes around the block and not between what's in it, as in an email. */
import { h, raw } from "../jsx";
import type { Component } from "./context";

export const HtmlBlock: Component = ({ node, placement, classes }) => {
  return (
    <div id={node.id} class={classes()} style={placement}>
      {raw(String(node.props.html))}
    </div>
  );
};
