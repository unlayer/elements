/**
 * A Button as a one-cell table: its background, border and corners on the
 * cell, its padding both on the link (so all of it is clickable) and, for
 * Outlook, which has no padding on links, as the cell's `mso-padding-alt`.
 * On hover the cell changes its background and the link its text's color,
 * each where it's set (the link's own inline color would win over the
 * cell's).
 * Not VML: in captures of classic Outlook, Word draws a VML button's label in
 * its own font, wrapped inside the shape's fixed size. Square corners in
 * classic Outlook.
 */
import { h, type Style } from "../jsx";
import { insets } from "../shared/css";
import { link } from "../shared/link";
import type { Component } from "./context";
import { boxWidth, phoneWidth, TEXT_ALIGN } from "./layout";
import { bgcolor, ownBorders, Table } from "./markup";
import { fullText } from "./styles";

/** Where a table sits in its cell on phones: its margins (the cell's `align` is for desktop). */
const PLACE: Record<string, Style> = { start: { marginLeft: 0, marginRight: "auto" }, center: { marginLeft: "auto", marginRight: "auto" }, end: { marginLeft: "auto", marginRight: 0 } };

export const Button: Component = ({ node, style, mobile, fill, phoneText, text }) => {
  const width = boxWidth(node, fill);
  return (
    <Table id={node.id} phone={[phoneWidth(mobile.maxWidth ?? mobile.width), PLACE[mobile.alignSelf as string]]} width={width.width} style={{ maxWidth: width.maxWidth, borderCollapse: ownBorders(style, mobile) }}>
      <tr>
        <td
          align={TEXT_ALIGN[node.text.textAlign]}
          bgcolor={bgcolor(style.backgroundColor)}
          // The background is the cell's, so its hover is too; the text's color is the link's (below).
          hover={{ backgroundColor: node.hover?.backgroundColor }}
          phone={{ border: mobile.border, backgroundColor: mobile.backgroundColor }}
          style={{ backgroundColor: style.backgroundColor, border: style.border, borderRadius: style.borderRadius, msoPaddingAlt: insets(style.padding) }}
        >
          <a
            {...link(node.props)}
            phone={[phoneText, { padding: mobile.padding }]}
            hover={{ color: node.hover?.color }}
            style={[
              // A button with a width fills it.
              { display: width.width !== undefined ? "block" : "inline-block", padding: style.padding },
              fullText(node),
              { textDecoration: style.textDecoration ?? "none", borderRadius: style.borderRadius },
            ]}
          >
            {text()}
          </a>
        </td>
      </tr>
    </Table>
  );
};
