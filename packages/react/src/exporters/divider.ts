import { element, staticMarkup } from "./markup";

/** Divider's web and document HTML, as @unlayer/exporters' DividerExporters write them with React (byte for byte). */
export function divider(values: Record<string, any>): string {
  const { border, width, textAlign } = values;
  let rule: Record<string, unknown> = { width, display: "inline-block" };
  if (border) rule = { ...(typeof border == "object" ? border : { borderTop: border }), ...rule, lineHeight: border?.borderTopWidth ?? 1, height: "0px", verticalAlign: "middle" };
  return staticMarkup(element("div", { style: { textAlign, lineHeight: 0 }, "aria-label": "divider" }, element("div", { style: rule }, " ")));
}
