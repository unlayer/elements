/**
 * A Table: its columns' widths in a colgroup as shares of its width (fixed
 * layout), no spacing between cells. Header rows at its top are its `<thead>`,
 * footer rows at its end its `<tfoot>`.
 */
import { h } from "../jsx";
import { textDeclarations } from "../shared/css";
import { isNode, type Component } from "./context";
import { box } from "./layout";

/** A width as a share of `of`, in %. */
export const share = (width: number, of: number) => `${Math.round((width / of) * 1e4) / 100}%`;

export const Table: Component = ({ node, style, parent, placement, classes, render }) => {
  const rows = node.children.filter(isNode);
  const columns = node.columns ?? [];
  const total = columns.reduce((sum, width) => sum + width, 0) || 1;
  const head = rows.findIndex((row) => !row.props.header);
  const [header, rest] = head < 0 ? [rows, []] : [rows.slice(0, head), rows.slice(head)];
  const foot = rest.findIndex((row) => row.props.footer);
  const [body, footer] = foot < 0 ? [rest, []] : [rest.slice(0, foot), rest.slice(foot)];
  return (
    <table
      id={node.id}
      class={classes()}
      style={[
        placement,
        { borderCollapse: style.borderCollapse ?? "separate", borderSpacing: 0, tableLayout: "fixed" },
        box(node, parent.type !== "Row"),
        // A table is as wide as its content unless told: this one fills its parent.
        { width: style.width === undefined && parent.type !== "Row" ? "100%" : undefined },
        textDeclarations(node.text, parent.text),
      ]}
    >
      <colgroup>
        {columns.map((width, index) => (
          <col style={{ width: node.ownColumns ? (node.ownColumns[index] ? width : "auto") : share(width, total) }} />
        ))}
      </colgroup>
      {header.length > 0 && <thead>{header.map((row) => render(row, []))}</thead>}
      {body.length > 0 && <tbody>{body.map((row) => render(row, []))}</tbody>}
      {footer.length > 0 && <tfoot>{footer.map((row) => render(row, []))}</tfoot>}
    </table>
  );
};
