/**
 * A button block as a Button in a Column with the block's padding, placed by its alignment (legacy's padded cell).
 * Its label is its HTML as runs; its colors, size, padding, corners and border its own. Kept as legacy writes it: a
 * button with no link (legacy's `href=""`), a link with what a link here can't hold, a label with markup no run holds.
 */
import type { Json } from "@unlayer-internal/elements-core";
import type { DesignBlock, Place, TreeNode } from "../lower";
import { buttonHover, fontOfValues } from "../quirks";
import { parseRuns } from "../runs";
import { ALIGN, border, color, fontWeight, letterSpacing, lineHeight, px, sides, some, webLink, type Values } from "../values";

/** A button's phone settings: the block's padding (the Column's), the label's size, line height and padding. */
function phone(values: Values): { column: Record<string, Json>; button: Record<string, Json> } | undefined {
  const column: Record<string, Json> = {};
  const button: Record<string, Json> = {};
  for (const [key, value] of Object.entries(values._override?.mobile ?? {})) {
    if (key === "hideMobile") continue;
    if (key === "containerPadding" && sides(value)) column.padding = sides(value)!;
    else if (key === "padding" && sides(value)) button.padding = sides(value)!;
    else if (key === "fontSize" && px(value) !== undefined) button.fontSize = px(value)!;
    else if (key === "lineHeight" && lineHeight(value) !== undefined) button.lineHeight = lineHeight(value)!;
    else return undefined;
  }
  return { column, button };
}

export function button(block: DesignBlock, place: Place): TreeNode | undefined {
  const { values } = block;
  if (values.mode !== undefined && values.mode !== place.mode) return undefined;
  if (place.source?.textJson !== undefined) return undefined;
  const href = webLink(values.href);
  const colors: Values = values.buttonColors ?? {};
  const size = px(values.fontSize);
  const height = lineHeight(values.lineHeight ?? "120%");
  const weight = values.fontWeight === undefined || values.fontWeight === "" ? undefined : fontWeight(values.fontWeight);
  const spacing = values.letterSpacing === undefined || values.letterSpacing === "" ? 0 : letterSpacing(values.letterSpacing, size);
  const padding = sides(values.padding ?? "10px 20px");
  const radius = values.borderRadius === undefined || values.borderRadius === "" ? 0 : px(values.borderRadius);
  const blockPadding = sides(values.containerPadding ?? "10px");
  const phoneValues = phone(values);
  const width = values.size && values.size.autoWidth === false ? values.size.width : undefined;
  if (!href || size === undefined || height === undefined || spacing === undefined || !padding || radius === undefined || !blockPadding || !phoneValues) return undefined;
  if ((values.fontWeight !== undefined && values.fontWeight !== "" && weight === undefined) || (width !== undefined && !/^\d*\.?\d+(px|%)$/.test(String(width)))) return undefined;
  if (values.textAlign !== undefined && !ALIGN[values.textAlign]) return undefined;
  // Its label as stored (legacy's exporter unescapes it, after the props escape it once: the stored HTML).
  const html = typeof values.text === "string" ? values.text : "";
  const { children, left } = parseRuns(place.config.toSafeHtml ? place.config.toSafeHtml(html) : html, { weight: weight ?? 400, links: false });
  if (left.length || children.some((run) => typeof run !== "string" && run.type !== "Span" && run.type !== "LineBreak")) return undefined;
  const hover = buttonHover(place.mode, colors);
  const node: TreeNode = {
    type: "Button",
    props: { href },
    style: Object.fromEntries(
      Object.entries({
        width: width === undefined ? undefined : px(width) ?? width,
        // A transparent label is one (a background that's transparent is none).
        color: typeof colors.color === "string" && colors.color ? colors.color : undefined,
        backgroundColor: color(colors.backgroundColor),
        fontFamily: fontOfValues(values.fontFamily),
        fontSize: size,
        fontWeight: weight,
        lineHeight: height,
        letterSpacing: spacing || undefined,
        padding,
        borderRadius: radius,
        border: border(values.border, typeof colors.color === "string" && colors.color ? colors.color : "#FFFFFF"),
      }).filter(([, value]) => value !== undefined)
    ) as Record<string, Json>,
    ...(hover ? { hover } : {}),
    ...(Object.keys(phoneValues.button).length ? { mobile: phoneValues.button } : {}),
    children: children.length ? children : ["​"],
  };
  return {
    type: "Column",
    style: { ...(some(blockPadding) ? { padding: blockPadding } : {}), alignItems: ALIGN[values.textAlign ?? "center"] },
    ...(Object.keys(phoneValues.column).length ? { mobile: phoneValues.column } : {}),
    children: [node],
  };
}
