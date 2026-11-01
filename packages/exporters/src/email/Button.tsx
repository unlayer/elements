/**
 * A Button as a one-cell table: its background, border and corners on the
 * cell, its padding both on the link (so all of it is clickable) and, for
 * Outlook, which has no padding on links, as the cell's `mso-padding-alt`.
 * Not VML: Word draws a VML button's label in its own font, wrapped inside the
 * shape's fixed size (unlayer/email-renderer's captures). Square corners in
 * classic Outlook.
 */
import { linkParts, type LinkValue } from "@unlayer-internal/elements-core";
import { h } from "../jsx";
import { insets } from "../shared/css";
import type { Writer } from "./context";
import { boxWidth, phoneWidth, TEXT_ALIGN } from "./layout";
import { bgcolor, names, Table } from "./markup";
import { fullText, hoverClass, inline, mobileTextOf, phoneClass, phoneText } from "./styles";

export const writeButton: Writer = (node, place, context) => {
  const { href, target } = linkParts(node.props.href as LinkValue);
  const { style, mobile } = node;
  const width = boxWidth(node, place.fill);
  const linkClass = phoneClass(context, [phoneText(node, mobileTextOf(node, place.mobile)), { padding: mobile?.padding }]);
  const label = inline(node, context);
  const cellClass = names(hoverClass(node, context), phoneClass(context, { border: mobile?.border, backgroundColor: mobile?.backgroundColor }));
  const mobileWidth = mobile?.maxWidth ?? mobile?.width;
  const tableClass = mobileWidth !== undefined ? phoneClass(context, phoneWidth(mobileWidth)) : undefined;

  return (
    <Table id={node.id} class={tableClass} width={width.width} style={{ maxWidth: width.maxWidth }}>
      <tr>
        <td
          align={TEXT_ALIGN[node.text.textAlign]}
          bgcolor={bgcolor(style.backgroundColor)}
          class={cellClass}
          style={{ backgroundColor: style.backgroundColor, border: style.border, borderRadius: style.borderRadius, msoPaddingAlt: insets(style.padding) }}
        >
          <a
            href={href}
            target={target}
            rel={target === "_blank" ? "noopener noreferrer" : undefined}
            class={linkClass}
            style={[
              // A button with a width fills it.
              { display: width.width !== undefined ? "block" : "inline-block", padding: style.padding },
              fullText(node),
              { textDecoration: style.textDecoration ?? "none", borderRadius: style.borderRadius },
            ]}
          >
            {label}
          </a>
        </td>
      </tr>
    </Table>
  );
};
