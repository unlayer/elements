/**
 * A Section: a band across the window, a row of the email's body table. Its
 * background and border on a full-width cell, its content at the content
 * width inside its padding.
 */
import { h, NotOutlook } from "../jsx";
import { px } from "../shared/css";
import type { Writer } from "./context";
import { stackRows } from "./layout";
import { bgcolor, Table } from "./markup";
import { hiding, mobileTextOf, phoneClass } from "./styles";

type Sides = { top: number; right: number; bottom: number; left: number };

/** `place.parent` is the root, whose width is the content width. */
export const writeSection: Writer = (node, place, context) => {
  const width = place.parent.width ?? 600;
  const { style } = node;
  const padding = (style.padding as Sides | undefined) ?? { top: 0, right: 0, bottom: 0, left: 0 };
  const stack = stackRows(node, context, mobileTextOf(node, place.mobile));
  const hidden = hiding(node, context, "table-row");
  const phonePadding = node.mobile?.padding as Sides | undefined;
  const cellClass = phoneClass(context, {
    paddingTop: phonePadding?.top,
    paddingBottom: phonePadding?.bottom,
    border: node.mobile?.border,
    backgroundColor: node.mobile?.backgroundColor,
  });

  // The content at the content width; its side padding on a cell around it.
  const content =
    padding.left || padding.right ? (
      <Table width="100%" style={{ maxWidth: width }}>
        <tr>
          <td style={{ padding: `0 ${px(padding.right)} 0 ${px(padding.left)}` }}>
            <Table class={stack.className} width="100%">
              {stack.rows}
            </Table>
          </td>
        </tr>
      </Table>
    ) : (
      <Table class={stack.className} width="100%" style={{ maxWidth: width }}>
        {stack.rows}
      </Table>
    );

  const row = (
    <tr class={hidden.className} style={hidden.style}>
      <td
        id={node.id}
        align="center"
        bgcolor={bgcolor(style.backgroundColor)}
        class={cellClass}
        style={{ paddingTop: padding.top || undefined, paddingBottom: padding.bottom || undefined, backgroundColor: style.backgroundColor, border: style.border }}
      >
        {content}
      </td>
    </tr>
  );
  // What's hidden on desktop isn't Outlook's at all.
  return node.hidden?.desktop ? <NotOutlook>{row}</NotOutlook> : row;
};
