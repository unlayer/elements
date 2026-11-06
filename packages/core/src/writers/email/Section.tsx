/**
 * A Section: a band across the window, a row of the email's body table. Its
 * background and border on a full-width cell, its content at the content
 * width inside its padding.
 */
import { h, NotOutlook } from "../jsx";
import { px } from "../shared/css";
import type { Component } from "./context";
import { Stack } from "./layout";
import { bgcolor, OutlookWidth, Table } from "./markup";
import { hiding } from "./styles";

type Sides = { top: number; right: number; bottom: number; left: number };

export const Section: Component = ({ node, style, mobile, parent: root, render }) => {
  const width = root.width ?? 600;
  const padding = (style.padding as Sides | undefined) ?? { top: 0, right: 0, bottom: 0, left: 0 };
  const phonePadding = mobile.padding as Sides | undefined;
  // The sides phones set, where they're other than desktop's: on the cell that holds the side padding.
  const phoneSides =
    phonePadding && (phonePadding.left !== padding.left || phonePadding.right !== padding.right) ? { paddingLeft: phonePadding.left, paddingRight: phonePadding.right } : undefined;
  const hidden = hiding(node, "table-row");

  const row = (
    <tr class={hidden.class} style={hidden.style}>
      <td
        id={node.id}
        align="center"
        bgcolor={bgcolor(style.backgroundColor)}
        phone={{ paddingTop: phonePadding?.top, paddingBottom: phonePadding?.bottom, border: mobile.border, backgroundColor: mobile.backgroundColor }}
        style={{ paddingTop: padding.top || undefined, paddingBottom: padding.bottom || undefined, backgroundColor: style.backgroundColor, border: style.border }}
      >
        <OutlookWidth width={width}>
          {padding.left || padding.right || phoneSides ? (
            // The side padding on a cell around the content, and phones' own sides on it.
            <Table width="100%" style={{ maxWidth: width }}>
              <tr>
                <td phone={phoneSides} style={padding.left || padding.right ? { padding: `0 ${px(padding.right)} 0 ${px(padding.left)}` } : undefined}>
                  <Stack node={node} render={render} />
                </td>
              </tr>
            </Table>
          ) : (
            <Stack node={node} render={render} style={{ maxWidth: width }} />
          )}
        </OutlookWidth>
      </td>
    </tr>
  );
  // What's hidden on desktop isn't Outlook's at all.
  return node.hidden?.desktop ? <NotOutlook>{row}</NotOutlook> : row;
};
