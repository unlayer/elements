/**
 * An Html block: its markup written as it is, in the text around it, as on a page. Its parent hides it where it's
 * hidden. It's in the template's text size again: a stacking Row's cells set theirs to 0 (no gaps between their
 * inline-blocks), which would close up the spaces in its markup.
 */
import { h, raw } from "../jsx";
import type { Component } from "./context";

export const HtmlBlock: Component = ({ node }) => {
  const { color, fontFamily, fontWeight, lineHeight, letterSpacing, textAlign, fontSize } = node.text;
  return (
    <div id={node.id} style={{ color, fontFamily, fontWeight, lineHeight, letterSpacing, textAlign, fontSize }}>
      {raw(String(node.props.html))}
    </div>
  );
};
