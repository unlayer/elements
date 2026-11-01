/**
 * A Table: a data table (no `role="presentation"`), its columns' widths in a
 * colgroup as shares of its width (fixed layout), in its box. Header rows at
 * its top are its `<thead>`.
 */
import { h } from "../jsx";
import { isNode, shown, type Component } from "./context";
import { Box } from "./layout";
import { TABLE } from "./markup";

/** A width as a share of `of`, in %. */
export const share = (width: number, of: number) => `${Math.round((width / of) * 1e4) / 100}%`;

export const Table: Component = ({ node, fill, render }) => {
  const rows = node.children.filter(isNode).filter(shown);
  const columns = node.columns ?? [];
  const total = columns.reduce((sum, width) => sum + width, 0) || 1;
  const head = rows.findIndex((row) => !row.props.header);
  const [header, body] = head < 0 ? [rows, []] : [rows.slice(0, head), rows.slice(head)];
  return (
    <Box node={node} fill={fill}>
      <table cellpadding={TABLE.cellpadding} cellspacing={TABLE.cellspacing} border={TABLE.border} width="100%" style={{ tableLayout: "fixed" }}>
        <colgroup>
          {columns.map((width) => (
            <col width={width} style={{ width: share(width, total) }} />
          ))}
        </colgroup>
        {header.length > 0 && <thead>{header.map((row) => render(row))}</thead>}
        {body.length > 0 && <tbody>{body.map((row) => render(row))}</tbody>}
      </table>
    </Box>
  );
};
