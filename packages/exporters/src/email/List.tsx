/**
 * A List as a table: an item a row, its marker in a cell as wide as the
 * indent, right-aligned against the item. Word's own lists indent and space
 * differently from version to version; a table lays out the same in every
 * client. `role="list"` and `"listitem"` keep it a list for screen readers.
 */
import { toPx, type ResolvedNode } from "@unlayer-internal/elements-core";
import { Fragment, h, NotOutlook, type Html } from "../jsx";
import { isNode, shown, type Component } from "./context";
import { Box, gapBelow } from "./layout";
import { gapsAfter } from "../shared/gaps";
import { Table } from "./markup";
import { fullText, hiding } from "./styles";

/** The space between a marker and its item. */
const MARKER_GAP = 8;

export const List: Component = ({ node, style, fill, render }) => {
  const items = node.children.filter(isNode).filter(shown);
  const indent = toPx(style.indent, null) ?? 0;
  const gaps = gapsAfter(items);
  const numbers = numbersOf(items, Number(node.props.start));
  const marker = (index: number) => (node.props.type === "number" ? numberOf(items[index], numbers[index]) : "•");
  return (
    <Box node={node} fill={fill}>
      <Table role="list" width="100%">
        {items.map((item, index) => {
          const hidden = hiding(item, "table-row");
          const below = gapBelow(node, gaps[index]);
          const row = (
            <tr role="listitem" class={hidden.class} style={hidden.style}>
              <td aria-hidden="true" width={indent} valign="top" phone={below.phone} style={[fullText(item, { align: false }), { textAlign: "right", width: indent, boxSizing: "border-box", paddingRight: MARKER_GAP }, below.style]}>
                {marker(index)}
              </td>
              <td valign="top" phone={below.phone} style={below.style}>
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

/** Each item's number on desktop and on phones: the start, and one more for each item shown before it there. */
function numbersOf(items: readonly ResolvedNode[], start: number): Array<{ desktop: number; phone: number }> {
  let [desktop, phone] = [start, start];
  return items.map((item) => {
    const at = { desktop, phone };
    if (!item.hidden?.desktop) desktop += 1;
    if (!item.hidden?.mobile) phone += 1;
    return at;
  });
}

/** An item's number, or where desktop and phones count it differently, each one where it shows (desktop's in Outlook). */
function numberOf(item: ResolvedNode, at: { desktop: number; phone: number }): Html | string {
  if (item.hidden?.desktop) return `${at.phone}.`;
  if (item.hidden?.mobile || at.desktop === at.phone) return `${at.desktop}.`;
  const [desktop, phone] = [hiding({ hidden: { mobile: true } }, "inline"), hiding({ hidden: { desktop: true } }, "inline")];
  return (
    <>
      <span class={desktop.class}>{at.desktop}.</span>
      <NotOutlook>
        <span class={phone.class} style={phone.style}>
          {at.phone}.
        </span>
      </NotOutlook>
    </>
  );
}
