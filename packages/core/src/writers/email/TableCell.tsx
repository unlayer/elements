/**
 * A TableCell: `<th>` in a header row, else `<td>`; its width in px for Word
 * and as a share of the row elsewhere (padding and border inside it), all of
 * its text styles on it (Outlook doesn't carry styles down through tables).
 */
import { h } from "../jsx";
import { share } from "../shared/css";
import type { Component } from "./context";
import { bgcolor } from "./markup";
import { fullText } from "./styles";

export const TableCell: Component = ({ node, style, mobile, parent: row, phoneText, text }) => {
  const Cell = row.props.header ? "th" : "td";
  const span = Number(node.props.colSpan);
  return (
    <Cell
      id={node.id}
      scope={row.props.header ? "col" : undefined}
      colspan={span > 1 ? span : undefined}
      dir={node.props.dir as string | undefined}
      width={node.width ?? undefined}
      valign={(style.verticalAlign as string | undefined) ?? "top"}
      bgcolor={bgcolor(style.backgroundColor)}
      phone={[phoneText, { padding: mobile.padding, backgroundColor: mobile.backgroundColor }]}
      style={[
        // A header cell is bold of its own: its weight is always written.
        fullText(node, { weight: Cell === "th" }),
        {
          // Beside a column that keeps its own px, a free one takes what's left: Word's attribute isn't its width.
          width: node.width !== null && row.width ? (row.columnSizes && typeof style.width !== "string" ? (style.width ?? "auto") : share(node.width, row.width)) : undefined,
          boxSizing: "border-box",
          padding: style.padding,
          backgroundColor: style.backgroundColor,
          border: style.border,
          textDecoration: style.textDecoration,
        },
      ]}
    >
      {text()}
    </Cell>
  );
};
