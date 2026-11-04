/**
 * The email's body: a full-width table with the window's background, the
 * content at the content width, centered, and Sections as bands across the
 * window between runs of content.
 */
import type { ResolvedNode } from "@unlayer-internal/elements-core";
import { Fragment, h, importedCss } from "../jsx";
import { gapsBefore, gapShown, runHidden } from "../shared/gaps";
import { isNode, shown, type Component } from "./context";
import { Stack } from "./layout";
import { bgcolor, OutlookWidth, ownBorders, Table } from "./markup";
import { spacerRow } from "./spacers";

export const Email: Component = ({ node: root, style, mobile, render }) => {
  const width = root.width ?? 600;
  const gap = typeof style.gap === "number" ? style.gap : 0;
  const phoneGap = typeof mobile.gap === "number" ? mobile.gap : gap;
  if (typeof root.compat?.css === "string") importedCss(root.compat.css);

  // Runs of content between Sections. (Markup among today's components' rows, `compat.wide`, is across the window too.)
  const parts: Array<ResolvedNode | ResolvedNode[]> = [];
  for (const node of root.children.filter(isNode).filter(shown)) {
    const last = parts[parts.length - 1];
    if (node.type === "Section" || node.compat?.wide) parts.push(node);
    else if (Array.isArray(last)) last.push(node);
    else parts.push([node]);
  }

  // Between a Section and its neighbours the gap is a row of its own, outside the Section's background, where both show.
  const gaps = gapsBefore(parts.map((part) => ({ hidden: Array.isArray(part) ? runHidden(part) : part.hidden })));

  return (
    <Table width="100%" bgcolor={bgcolor(style.backgroundColor)} style={{ backgroundColor: style.backgroundColor, borderCollapse: ownBorders(...parts.flatMap((part) => (Array.isArray(part) ? [] : [part.style, part.mobile]))) }}>
      {parts.map((part, index) => (
        <>
          {spacerRow(gapShown(gaps[index], gap, phoneGap), gap, phoneGap)}
          {Array.isArray(part) ? (
            <tr>
              <td align="center">
                <OutlookWidth width={width}>
                  <Stack node={{ ...root, children: part }} render={render} style={{ maxWidth: width }} />
                </OutlookWidth>
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
