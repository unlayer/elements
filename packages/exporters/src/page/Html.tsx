/** An Html block: its markup written as it is; in a div where it has an id, classes or a place in a Row. */
import { h, raw } from "../jsx";
import type { Component } from "./context";

export const HtmlBlock: Component = ({ node, placement, classes }) => {
  const html = raw(String(node.props.html));
  const names = classes();
  if (!node.id && !names && placement.length === 0) return html;
  return (
    <div id={node.id} class={names} style={placement}>
      {html}
    </div>
  );
};
