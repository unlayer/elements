/** A TableCell: `<th>` in a header row, else `<td>`; its padding and border inside its width; its weight and alignment always written (a header cell's own are bold and centered). */
import { h } from "../jsx";
import { textDeclarations } from "../shared/css";
import type { Component } from "./context";

export const TableCell: Component = ({ node, style, parent: row, classes, children }) => {
  const Cell = row.props.header ? "th" : "td";
  const span = Number(node.props.colSpan);
  return (
    <Cell
      id={node.id}
      class={classes()}
      scope={row.props.header ? "col" : undefined}
      colspan={span > 1 ? span : undefined}
      dir={node.props.dir as string | undefined}
      style={[
        { boxSizing: "border-box", padding: style.padding, backgroundColor: style.backgroundColor, border: style.border, verticalAlign: style.verticalAlign ?? "top" },
        textDeclarations(node.text, row.text, Cell === "th" ? ["fontWeight", "textAlign"] : []),
        { textDecoration: style.textDecoration },
      ]}
    >
      {children()}
    </Cell>
  );
};
