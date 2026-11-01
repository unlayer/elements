/**
 * The design's blocks that have moved over to the new components (RFC 0001 step 7), by tool: each lowers its
 * block, or says it can't (undefined), and the block keeps the HTML today's exporter writes (a Raw node). A tool is
 * added here once the comparisons with main pass with it.
 */
import type { DesignBlock, TreeNode } from "./lower";
import { px, sides, some } from "./values";

/** A Divider: its line, length and padding (on phones too); placed by its alignment where it's shorter than its column. */
function divider({ values }: DesignBlock): TreeNode {
  const line = values.border ?? {};
  const width = typeof values.width === "object" ? values.width?.width : values.width;
  const padding = some(sides(values.containerPadding));
  const phonePadding = sides(values._override?.mobile?.containerPadding);
  const node: TreeNode = {
    type: "Divider",
    style: {
      borderTop: { width: px(line.borderTopWidth) ?? 1, style: line.borderTopStyle ?? "solid", color: line.borderTopColor ?? "#BBBBBB" },
      ...(width ? { width } : {}),
      ...(padding ? { padding } : {}),
    },
    ...(phonePadding ? { mobile: { padding: phonePadding } } : {}),
  };
  return width && width !== "100%" ? { type: "Column", style: { textAlign: values.textAlign ?? "center" }, children: [node] } : node;
}

export const BLOCKS: Readonly<Record<string, (block: DesignBlock) => TreeNode | undefined>> = { divider };
