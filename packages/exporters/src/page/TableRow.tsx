/** A TableRow: `<tr>` with its background and the text styles its cells inherit. */
import { h } from "../jsx";
import { textDeclarations } from "../shared/css";
import { isNode, type Component } from "./context";

export const TableRow: Component = ({ node, style, parent: table, classes, render }) => (
  <tr id={node.id} class={classes()} style={[{ backgroundColor: style.backgroundColor, height: style.height }, textDeclarations(node.text, table.text)]}>
    {node.children.filter(isNode).map((cell) => render(cell, []))}
  </tr>
);
