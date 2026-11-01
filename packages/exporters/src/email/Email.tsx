/**
 * The email's body: a full-width table with the window's background, the
 * content at the content width, centered, and Sections as bands across the
 * window between runs of content.
 */
import type { ResolvedNode } from "@unlayer-internal/elements-core";
import { Fragment, h, raw } from "../jsx";
import { px } from "../shared/css";
import { isNode, shown, type Component } from "./context";
import { Stack } from "./layout";
import { bgcolor, Table } from "./markup";

export const Email: Component = ({ node: root, style, render }) => {
  const width = root.width ?? 600;
  const gap = typeof style.gap === "number" ? style.gap : 0;

  // Runs of content between Sections.
  const parts: Array<ResolvedNode | ResolvedNode[]> = [];
  for (const node of root.children.filter(isNode).filter(shown)) {
    const last = parts[parts.length - 1];
    if (node.type === "Section") parts.push(node);
    else if (Array.isArray(last)) last.push(node);
    else parts.push([node]);
  }

  // Between a Section and its neighbours the gap is a row of its own, outside the Section's background.
  const spacer = gap ? (
    <tr>
      <td style={{ fontSize: 0, lineHeight: px(gap), msoLineHeightRule: "exactly" }}>{raw("&nbsp;")}</td>
    </tr>
  ) : null;

  return (
    <Table width="100%" bgcolor={bgcolor(style.backgroundColor)} style={{ backgroundColor: style.backgroundColor }}>
      {parts.map((part, index) => (
        <>
          {index > 0 && spacer}
          {Array.isArray(part) ? (
            <tr>
              <td align="center">
                <Stack node={{ ...root, children: part }} render={render} style={{ maxWidth: width }} />
              </td>
            </tr>
          ) : (
            render(part)
          )}
        </>
      ))}
    </Table>
  );
};
