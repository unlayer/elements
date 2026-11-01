/**
 * The email's body: a full-width table with the window's background, the
 * content at the content width, centered, and Sections as bands across the
 * window between runs of content.
 */
import type { ResolvedNode } from "@unlayer-internal/elements-core";
import { Fragment, h, NotOutlook, raw, type Html } from "../jsx";
import { px } from "../shared/css";
import { gapHidden, gapsBefore, gapShown, runHidden, type GapAt } from "../shared/gaps";
import { isNode, shown, type Component } from "./context";
import { Stack } from "./layout";
import { bgcolor, Table } from "./markup";
import { hiding } from "./styles";

export const Email: Component = ({ node: root, style, mobile, render }) => {
  const width = root.width ?? 600;
  const gap = typeof style.gap === "number" ? style.gap : 0;
  const phoneGap = typeof mobile.gap === "number" ? mobile.gap : gap;

  // Runs of content between Sections.
  const parts: Array<ResolvedNode | ResolvedNode[]> = [];
  for (const node of root.children.filter(isNode).filter(shown)) {
    const last = parts[parts.length - 1];
    if (node.type === "Section") parts.push(node);
    else if (Array.isArray(last)) last.push(node);
    else parts.push([node]);
  }

  // Between a Section and its neighbours the gap is a row of its own, outside the Section's background, where both show.
  const gaps = gapsBefore(parts.map((part) => ({ hidden: Array.isArray(part) ? runHidden(part) : part.hidden })));

  return (
    <Table width="100%" bgcolor={bgcolor(style.backgroundColor)} style={{ backgroundColor: style.backgroundColor }}>
      {parts.map((part, index) => (
        <>
          {spacer(gapShown(gaps[index], gap, phoneGap), gap, phoneGap)}
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

/** A gap as a row of its own: as tall as the gap, the phone gap on phones, hidden where there's none (and out of Outlook's view then). */
function spacer(at: GapAt, gap: number, phoneGap: number): Html | null {
  if (!at.desktop && !at.phone) return null;
  const hidden = hiding({ hidden: gapHidden(at) }, "table-row");
  const row = (
    <tr class={hidden.class} style={hidden.style}>
      <td phone={at.phone && phoneGap !== gap ? { lineHeight: px(phoneGap) } : undefined} style={{ fontSize: 0, lineHeight: px(gap), msoLineHeightRule: "exactly" }}>
        {raw("&nbsp;")}
      </td>
    </tr>
  );
  return at.desktop ? row : <NotOutlook>{row}</NotOutlook>;
}
