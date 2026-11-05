/**
 * Raw: markup an importer brought in (a builder block), written as it is, its CSS in the stylesheet. Its parent
 * hides it where it's hidden. It's in the template's text size again: a stacking Row's cells set theirs to 0 (no
 * gaps between their inline-blocks), which would close up the spaces in its markup.
 */
import { h, importedCss, raw } from "../jsx";
import type { Component } from "./context";

export const Raw: Component = ({ node }) => {
  if (typeof node.props.css === "string") importedCss(node.props.css);
  // An Html block of a template takes the text around it, as on a page. (Today's components' markup is the editor's, which doesn't.)
  const around = node.type === "Html" ? { color: node.text.color, fontFamily: node.text.fontFamily, fontWeight: node.text.fontWeight, lineHeight: node.text.lineHeight, letterSpacing: node.text.letterSpacing, textAlign: node.text.textAlign } : {};
  return (
    <div id={node.id} style={{ ...around, fontSize: node.text.fontSize }}>
      {raw(String(node.props.html))}
    </div>
  );
};
