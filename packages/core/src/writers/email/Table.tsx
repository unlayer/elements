/**
 * A Table: a data table (no `role="presentation"`), its columns' widths in a
 * colgroup as shares of its width (fixed layout), in its box. Header rows at
 * its top are its `<thead>`, footer rows at its end its `<tfoot>`.
 */
import { h } from "../jsx";
import { columnWidth } from "../shared/css";
import { isNode, shown, type Component } from "./context";
import { Box } from "./layout";
import { TABLE } from "./markup";

export const Table: Component = ({ node, style, fill, render }) => {
  const rows = node.children.filter(isNode).filter(shown);
  const columns = node.columns ?? [];
  const total = columns.reduce((sum, width) => sum + width, 0) || 1;
  const head = rows.findIndex((row) => !row.props.header);
  const [header, rest] = head < 0 ? [rows, []] : [rows.slice(0, head), rows.slice(head)];
  const foot = rest.findIndex((row) => row.props.footer);
  const [body, footer] = foot < 0 ? [rest, []] : [rest.slice(0, foot), rest.slice(foot)];
  return (
    <Box node={node} fill={fill}>
      <table cellpadding={TABLE.cellpadding} cellspacing={TABLE.cellspacing} border={TABLE.border} width="100%" style={{ tableLayout: "fixed", borderCollapse: style.borderCollapse ?? "separate" }}>
        <colgroup>
          {columns.map((width, index) => (
            <col width={width} style={{ width: columnWidth(node, width, index, total) }} />
          ))}
        </colgroup>
        {header.length > 0 && <thead>{header.map((row) => render(row))}</thead>}
        {body.length > 0 && <tbody>{body.map((row) => render(row))}</tbody>}
        {footer.length > 0 && <tfoot>{footer.map((row) => render(row))}</tfoot>}
      </table>
    </Box>
  );
};
