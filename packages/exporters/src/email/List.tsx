/**
 * A List as a table: an item a row, its marker in a cell as wide as the
 * indent, right-aligned against the item. Word's own lists indent and space
 * differently from version to version; a table lays out the same in every
 * client. `role="list"` and `"listitem"` keep it a list for screen readers.
 */
import { toPx } from "@unlayer-internal/elements-core";
import { h, NotOutlook } from "../jsx";
import { isNode, shown, type Component } from "./context";
import { Box, phoneGap } from "./layout";
import { Table } from "./markup";
import { fullText, hiding } from "./styles";

/** The space between a marker and its item. */
const MARKER_GAP = 8;

export const List: Component = ({ node, style, fill, render }) => {
  const items = node.children.filter(isNode).filter(shown);
  const indent = toPx(style.indent, null) ?? 0;
  const gap = typeof style.gap === "number" ? style.gap : 0;
  const marker = (index: number) => (node.props.type === "number" ? `${Number(node.props.start) + index}.` : "•");
  return (
    <Box node={node} fill={fill}>
      <Table role="list" class={phoneGap(node)} width="100%">
        {items.map((item, index) => {
          const hidden = hiding(item, "table-row");
          const below = index < items.length - 1 && gap ? gap : undefined;
          const row = (
            <tr role="listitem" class={hidden.class} style={hidden.style}>
              <td aria-hidden="true" width={indent} valign="top" style={[fullText(item, { align: false }), { textAlign: "right", width: indent, boxSizing: "border-box", paddingRight: MARKER_GAP, paddingBottom: below }]}>
                {marker(index)}
              </td>
              <td valign="top" style={{ paddingBottom: below }}>
                {render(item)}
              </td>
            </tr>
          );
          return item.hidden?.desktop ? <NotOutlook>{row}</NotOutlook> : row;
        })}
      </Table>
    </Box>
  );
};
