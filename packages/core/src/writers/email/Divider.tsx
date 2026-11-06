/** A Divider: a table with a top border and an empty cell Word can't make taller, in a padded table where it has padding. */
import { h, raw } from "../jsx";
import type { Component } from "./context";
import { phoneWidth, TEXT_ALIGN } from "./layout";
import { ownBorders, Table } from "./markup";

export const Divider: Component = ({ node, style, mobile, fill, parent, rtl }) => {
  // In a Row its column is already its width: the line fills it.
  const length = fill ? "100%" : style.width;
  const percent = typeof length === "string" && length.endsWith("%");
  const padded = style.padding !== undefined || mobile.padding !== undefined;
  const align = ({ center: "center", end: "right" } as Record<string, string>)[parent.style.alignItems as string] ?? TEXT_ALIGN[node.text.textAlign];

  const line = (
    <Table id={padded ? undefined : node.id} width={percent ? length : "100%"} phone={phoneWidth(mobile.width)} style={{ maxWidth: percent ? undefined : length, borderCollapse: ownBorders(style) }}>
      <tr>
        <td style={{ borderTop: style.borderTop, fontSize: 0, lineHeight: 0, msoLineHeightRule: "exactly" }}>{raw("&nbsp;")}</td>
      </tr>
    </Table>
  );
  if (!padded) return line;
  return (
    <Table id={node.id} width="100%">
      <tr>
        <td align={align === "left" && !rtl ? undefined : align} phone={{ padding: mobile.padding }} style={{ padding: style.padding }}>
          {line}
        </td>
      </tr>
    </Table>
  );
};
