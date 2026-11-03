/**
 * A horizontal menu block on a page as legacy draws it, in a Column with the block's padding: a Row kept side by side
 * that wraps, each link and each separator a Text in the links' padding (legacy pads its separators too; the new Menu
 * has a link's padding either side of one, not twice), separators left out on phones; its lines the page's 1.5.
 * Kept as legacy writes it: an email's or a printed document's menu, whose lines are the font's "normal" height (each
 * font's own, which no exact line height the new engine writes matches in every font); a vertical menu; a link that
 * isn't a web one.
 */
import type { Json } from "@unlayer-internal/elements-core";
import type { DesignBlock, Place, TreeNode } from "../lower";
import { fontOfValues } from "../quirks";
import { ALIGN, fontWeight, letterSpacing, px, sides, some, webLink, type Values } from "../values";

export function menu(block: DesignBlock, place: Place): TreeNode | undefined {
  const { values } = block;
  if (place.mode !== "web" || (values.mode !== undefined && values.mode !== place.mode)) return undefined;
  if ((values.layout ?? "horizontal") !== "horizontal") return undefined;
  const items: Values[] = values.menu?.items ?? [];
  const padding = sides(values.padding ?? "5px 15px");
  const blockPadding = sides(values.containerPadding ?? "10px");
  const size = px(values.fontSize ?? "14px");
  const weight = values.fontWeight === undefined || values.fontWeight === "" || values.fontWeight === "normal" ? undefined : fontWeight(values.fontWeight);
  const spacing = values.letterSpacing === undefined || values.letterSpacing === "" ? 0 : letterSpacing(values.letterSpacing, size);
  if (!items.length || !padding || !blockPadding || size === undefined || spacing === undefined || (weight === undefined && values.fontWeight !== undefined && values.fontWeight !== "" && values.fontWeight !== "normal")) return undefined;
  if (!ALIGN[values.align ?? "center"] || Object.keys(values._override?.mobile ?? {}).some((key) => key !== "hideMobile")) return undefined;
  const links = items.map((item) => ({ text: typeof item.text === "string" ? item.text : "", href: webLink(item.link) }));
  // An item with no link, or one a link here can't hold, keeps the menu's legacy HTML.
  if (links.some((link) => !link.href || !link.text)) return undefined;
  const text: Record<string, Json> = Object.fromEntries(
    Object.entries({ fontSize: size, fontWeight: weight, letterSpacing: spacing || undefined, fontFamily: fontOfValues(values.fontFamily) }).filter(([, v]) => v !== undefined)
  ) as Record<string, Json>;
  const separator = typeof values.separator === "string" ? values.separator : "";
  const children: TreeNode[] = links.flatMap((link, index) => [
    ...(index && separator
      ? [
          {
            type: "Text",
            hidden: { mobile: true },
            style: { flex: "none", padding, ...text, ...(typeof values.textColor === "string" && values.textColor ? { color: values.textColor } : {}) },
            children: [separator],
          },
        ]
      : []),
    {
      type: "Text",
      style: { flex: "none", padding, ...text },
      children: [{ type: "Link", props: { href: link.href! }, style: { color: typeof values.linkColor === "string" && values.linkColor ? values.linkColor : "#0068A5", textDecoration: "none" }, children: [link.text] }],
    },
  ]);
  const row: TreeNode = { type: "Row", props: { stackOnMobile: false }, style: { flexWrap: "wrap", justifyContent: ALIGN[values.align ?? "center"] }, children };
  // In plain text, legacy's links and separators are one line (inline elements side by side in its markup).
  const line: TreeNode = { type: "Paragraph", children: links.flatMap((link, index) => [...(index && separator ? [separator] : []), { type: "Link", props: { href: link.href! }, children: [link.text] }]) };
  return { type: "Column", style: some(blockPadding) ? { padding: blockPadding } : {}, children: [{ ...row, textAs: line }] };
}
