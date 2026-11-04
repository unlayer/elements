/**
 * Raw: markup an importer brought in (a builder block), written as it is, its CSS in the stylesheet. Its parent
 * hides it where it's hidden. It's in the template's text size again: a stacking Row's cells set theirs to 0 (no
 * gaps between their inline-blocks), which would close up the spaces in its markup. Markup among today's components'
 * rows (`compat.wide`) is a row of the email's table of its own, across the window, in no text size of its own; markup
 * that opens around rows ("open", and "close" where it ends) holds a table of its own for them.
 */
import { h, importedCss, raw } from "../jsx";
import { attrs } from "../shared/css";
import { TABLE } from "./markup";
import type { Component } from "./context";

export const Raw: Component = ({ node }) => {
  if (typeof node.props.css === "string") importedCss(node.props.css);
  if (node.compat?.wide === "open") return raw(`<tr><td>${String(node.props.html)}<table${attrs({ ...TABLE, width: "100%" })}>`);
  if (node.compat?.wide === "close") return raw(`</table>${String(node.props.html)}</td></tr>`);
  if (node.compat?.wide) {
    return (
      <tr>
        <td>{raw(String(node.props.html))}</td>
      </tr>
    );
  }
  return (
    <div id={node.id} style={{ fontSize: node.text.fontSize }}>
      {raw(String(node.props.html))}
    </div>
  );
};
