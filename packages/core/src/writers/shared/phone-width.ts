/** What a child of a Row kept side by side asks of its place on phones. */
import type { Json } from "../../model";
import type { ResolvedNode } from "../../resolve";

/**
 * Its phone width, in a Row that stays side by side on phones: the Row's layout gives a child its place (a flex basis
 * on a page, a cell in an email), so that's where the width has to go, within its phone maximum. A padded Divider's is
 * its line's, in its place.
 */
export function phoneWidthInRow(child: ResolvedNode, row: ResolvedNode): Json | undefined {
  if (row.type !== "Row" || row.props.stackOnMobile !== false) return undefined;
  if (child.type === "Divider" && child.style.padding !== undefined) return undefined;
  const { width, maxWidth } = child.mobile ?? {};
  return typeof width === "number" && typeof maxWidth === "number" ? Math.min(width, maxWidth) : width;
}
