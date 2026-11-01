/** Raw: markup an importer brought in (a builder block), written as it is, its CSS in the stylesheet; in a div where it has an id, classes or a place in a Row. */
import { h, importedCss, raw } from "../jsx";
import type { Component } from "./context";

export const Raw: Component = ({ node, placement, classes }) => {
  if (typeof node.props.css === "string") importedCss(node.props.css);
  const html = raw(String(node.props.html));
  const names = classes();
  if (!node.id && !names && placement.length === 0) return html;
  return (
    <div id={node.id} class={names} style={placement}>
      {html}
    </div>
  );
};
