/** A Divider: a table with a top border and an empty cell Word can't make taller. */
import { h, raw } from "../jsx";
import { px } from "../shared/css";
import type { Writer } from "./context";
import { phoneWidth, TEXT_ALIGN } from "./layout";
import { Table } from "./markup";
import { phoneClass } from "./styles";

export const writeDivider: Writer = (node, _place, context) => {
  const { style, mobile } = node;
  const length = style.width;
  const percent = typeof length === "string" && length.endsWith("%");
  const padded = style.padding !== undefined || mobile?.padding !== undefined;
  const lineClass = mobile?.width !== undefined ? phoneClass(context, phoneWidth(mobile.width)) : undefined;

  const line = (
    <Table id={style.padding === undefined ? node.id : undefined} width={percent ? length : "100%"} class={lineClass} style={{ maxWidth: percent ? undefined : length }}>
      <tr>
        <td style={{ borderTop: `${px(style.thickness as number)} ${style.lineStyle} ${style.color}`, fontSize: 0, lineHeight: 0, msoLineHeightRule: "exactly" }}>{raw("&nbsp;")}</td>
      </tr>
    </Table>
  );
  if (!padded) return line;

  const align = TEXT_ALIGN[node.text.textAlign];
  return (
    <Table id={node.id} width="100%">
      <tr>
        <td align={align === "left" ? undefined : align} class={phoneClass(context, { padding: mobile?.padding })} style={{ padding: style.padding }}>
          {line}
        </td>
      </tr>
    </Table>
  );
};
