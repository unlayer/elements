/**
 * Raw: markup an importer brought in (a builder block), written as it is, its CSS in the stylesheet. Its parent
 * hides it where it's hidden. It's in the template's text size again: a stacking Row's cells set theirs to 0 (no
 * gaps between their inline-blocks), which would close up the spaces in its markup.
 */
import { h, importedCss, raw } from "../jsx";
import type { Component } from "./context";

export const Raw: Component = ({ node }) => {
  if (typeof node.props.css === "string") importedCss(node.props.css);
  return (
    <div id={node.id} style={{ fontSize: node.text.fontSize }}>
      {raw(String(node.props.html))}
    </div>
  );
};
