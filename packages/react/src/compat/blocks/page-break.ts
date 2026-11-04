/**
 * A page break: nothing in an email or on a page, where its exporter writes nothing for it; in a printed document, or
 * where a block says it's in one, a box of the block's padding that the printed page breaks after.
 */
import type { TreeNode } from "../lower";
import { sides, some, type Values } from "../values";
import type { Lowering } from "./index";

export const pageBreak: Lowering = ({ values }: { values: Values }, place): TreeNode | null => {
  if ((values.mode ?? place.mode) !== "document") return null;
  const padding = sides(values.containerPadding ?? "10px");
  if (!padding) place.note(`A page break's padding ${JSON.stringify(values.containerPadding)} can't be read: it's drawn without it.`);
  return { type: "Column", style: { ...(some(padding) ? { padding } : {}), breakAfter: "page" } };
};
