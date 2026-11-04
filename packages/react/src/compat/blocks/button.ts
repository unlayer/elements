/**
 * A button block as a Button in a Column with the block's padding, placed by its alignment (legacy's padded cell).
 * Its label is its HTML as runs (markup no run holds is written as it is); its colors, size, padding, corners and border
 * its own, and what's set for desktop windows and phones. It always draws: a value that can't be read is said, and
 * drawn as the new Button's default. With no link it links to nothing, as legacy's `href=""`.
 */
import type { Json } from "@unlayer-internal/elements-core";
import { generateHtmlFromTextJson } from "@unlayer-internal/shared-elements";
import type { DesignBlock, Place, TreeNode } from "../lower";
import { buttonHover, buttonWidthOnPage, fontOfValues } from "../quirks";
import { parseRuns } from "../runs";
import { ALIGN, color, deviceValues, drawnBorder, drawnLink, drawnWeight, letterSpacing, lineHeight, px, sides, some, webLink, type Values } from "../values";

/** A width legacy's button reads: px or a share of its place; else what's said, and none. */
function widthOf(size: Values | undefined, note: (what: string, value: unknown) => void, what: string): Json | undefined {
  if (!size || size.autoWidth !== false) return undefined;
  if (typeof size.width === "number" || /^\s*\d*\.?\d+(px)?\s*$/.test(String(size.width))) return px(size.width);
  if (/^\s*\d*\.?\d+%\s*$/.test(String(size.width))) return String(size.width).trim();
  note(what, size.width);
  return undefined;
}

/** Its phone settings legacy's stylesheet reads: the block's padding, the label's size, line height and padding, and its width. */
function phoneStyles(phone: Values, note: (what: string, value: unknown) => void): { column: Record<string, Json>; button: Record<string, Json> } {
  const column: Record<string, Json> = {};
  const button: Record<string, Json> = {};
  const read = (key: string, what: string, reader: (value: unknown) => Json | undefined, into: Record<string, Json>, as: string) => {
    if (phone[key] === undefined) return;
    const value = reader(phone[key]);
    if (value === undefined) note(`${what} on phones`, phone[key]);
    else into[as] = value;
  };
  read("containerPadding", "padding", sides, column, "padding");
  read("padding", "label's padding", sides, button, "padding");
  read("fontSize", "font size", px, button, "fontSize");
  read("lineHeight", "line height", lineHeight, button, "lineHeight");
  if (phone.size) {
    const width = widthOf(phone.size, note, "width on phones");
    if (width !== undefined) button.width = width;
  }
  read("textAlign", "alignment", (value) => ALIGN[value as string], button, "alignSelf");
  return { column, button };
}

export function button(block: DesignBlock, place: Place): TreeNode {
  const { values, phone } = deviceValues(block.values, ["containerPadding", "padding", "fontSize", "lineHeight", "textAlign", "size"], place.mode);
  const note = (what: string, value: unknown) => place.note(`A button's ${what} ${JSON.stringify(value)} can't be read: it's drawn without it.`);
  const read = <T>(value: unknown, what: string, reader: (value: unknown) => T | undefined): T | undefined => {
    if (value === undefined || value === null || value === "") return undefined;
    const out = reader(value);
    if (out === undefined) note(what, value);
    return out;
  };
  const colors: Values = values.buttonColors ?? {};
  const size = read(values.fontSize, "font size", px);
  const weight = values.fontWeight === undefined || values.fontWeight === null || values.fontWeight === "" ? undefined : drawnWeight(values.fontWeight, "A button", place.note);
  const padding = read(values.padding, "label's padding", sides);
  const blockPadding = read(values.containerPadding ?? "10px", "padding", sides) ?? sides("10px");
  const height = read(values.lineHeight ?? "120%", "line height", lineHeight) ?? "120%";
  const spacing = read(values.letterSpacing, "letter spacing", (value) => letterSpacing(value, size ?? 14)) ?? 0;
  const radius = read(values.borderRadius, "corner radius", px) ?? 0;
  const width = widthOf(values.size, note, "width");
  const phoneValues = phoneStyles(phone, note);
  if (values.textAlign !== undefined && !ALIGN[values.textAlign]) note("alignment", values.textAlign);

  const link = drawnLink(values.href, place.keep, place.note);
  if (webLink(values.href) === null) place.note(`A button says no link: it's a link to nothing, as it was.`, "info");

  // Its label as stored (legacy's exporter unescapes it, after the props escape it once: the stored HTML).
  const textJson = place.source?.textJson;
  const stored = typeof textJson === "string" ? generateHtmlFromTextJson(textJson) : typeof values.text === "string" ? values.text : "";
  const html = place.keepHtml(place.config.toSafeHtml ? place.config.toSafeHtml(stored) : stored);
  const { children, left } = parseRuns(html, { weight: weight ?? 400, links: false });
  // (Paragraphs in a label are lines either way, but legacy's plain text reads them as one.)
  const label: Array<TreeNode | string> = left.length || /<(p|div)\b/i.test(html) ? [{ type: "Raw", props: { html } }] : children;

  const hover = buttonHover(place.mode, colors);
  const node: TreeNode = {
    type: "Button",
    props: link,
    style: Object.fromEntries(
      Object.entries({
        width,
        // A page's holds its padding on top, whatever its width, and runs past the end of a place too narrow for it.
        ...(place.mode !== "email" ? buttonWidthOnPage() : {}),
        // A transparent label is one (a background that's transparent is none).
        color: typeof colors.color === "string" && colors.color ? colors.color : undefined,
        // A background given as none (transparent, or empty, which legacy writes as no color) is none, where the new
        // Button would draw its own default.
        backgroundColor: colors.backgroundColor === undefined ? undefined : color(colors.backgroundColor) ?? "transparent",
        fontFamily: fontOfValues(values.fontFamily),
        fontSize: size,
        fontWeight: weight,
        lineHeight: height,
        letterSpacing: spacing || undefined,
        padding,
        borderRadius: radius,
        border: drawnBorder(values.border, typeof colors.color === "string" && colors.color ? colors.color : "#FFFFFF", note),
      }).filter(([, value]) => value !== undefined)
    ) as Record<string, Json>,
    ...(hover ? { hover } : {}),
    ...(Object.keys(phoneValues.button).length ? { mobile: phoneValues.button } : {}),
    children: label,
  };
  return {
    type: "Column",
    style: { ...(some(blockPadding) ? { padding: blockPadding! } : {}), alignItems: ALIGN[values.textAlign ?? "center"] ?? "start" },
    ...(Object.keys(phoneValues.column).length ? { mobile: phoneValues.column } : {}),
    children: [node],
  };
}
