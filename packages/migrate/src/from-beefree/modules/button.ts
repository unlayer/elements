/** Beefree's `button` module as a Button. */
import { align, borderValues, boxString, color, fontFamily, fontWeight, letterSpacing, lineHeight, percent, px, pxString, sides } from "../css";
import { slotWidth, type ModuleContext, type ModuleResult } from "../context";
import { textOf } from "../html";
import { buttonLabel } from "../text";
import type { Values } from "../types";
import { blockDevice, blockPadding } from "./common";

/** A button's width setting (`auto`, a percent, px) as the editor's `size`. */
function size(width: unknown, available: number): Values | undefined {
  if (typeof width !== "string" || !width.trim() || width.trim() === "auto") return undefined;
  const share = percent(width);
  if (share !== undefined) return { autoWidth: false, width: `${Math.min(100, share)}%` };
  const pixels = px(width);
  if (pixels !== undefined && available > 0) return { autoWidth: false, width: `${Math.min(100, Math.round((pixels / available) * 10000) / 100)}%` };
  return undefined;
}

export function button(descriptor: Record<string, any>, ctx: ModuleContext): ModuleResult {
  const source = descriptor.button ?? {};
  const style = source.style ?? {};
  const hover = descriptor.hoverStyle ?? {};
  const { html, lifted } = buttonLabel(String(source.label ?? ""));
  if (!textOf(html).trim()) ctx.warn("empty-text", `${ctx.where}: the button has no label.`);

  const { containerPadding, sides: blockSides } = blockPadding(descriptor);
  const text = color(style.color) || "#FFFFFF";
  const background = color(style["background-color"]);
  const values: Values = {
    containerPadding,
    // Beefree's email export opens a button's link in a new tab whatever its target says.
    href: { name: "web", values: { href: String(source.href ?? ""), target: "_blank" } },
    // Without a hover style the button doesn't change on hover (the editor's default hover is its own blue).
    buttonColors: { color: text, backgroundColor: background, hoverColor: color(hover.color) || text, hoverBackgroundColor: color(hover["background-color"]) || background },
    fontSize: pxString(px(style["font-size"]) ?? px(lifted.fontSize) ?? 14),
    lineHeight: lineHeight(style["line-height"]) ?? "120%",
    textAlign: align(descriptor.style?.["text-align"]) ?? "center",
    padding: boxString(sides(style)),
    border: borderValues(style),
    borderRadius: px(style["border-radius"]) !== undefined ? pxString(px(style["border-radius"])!) : String(style["border-radius"] ?? "0px"),
    text: html,
  };
  const font = fontFamily(style["font-family"], ctx.webFonts) ?? fontFamily(lifted.fontFamily, ctx.webFonts);
  if (font) values.fontFamily = font;
  const weight = fontWeight(style["font-weight"]);
  if (weight !== undefined && weight !== 400) values.fontWeight = weight;
  const spacing = letterSpacing(style["letter-spacing"]);
  if (spacing) values.letterSpacing = spacing;
  const available = slotWidth(ctx.slot, blockSides);
  const width = size(style.width, available) ?? (typeof source.percWidth === "number" ? size(`${source.percWidth}%`, available) : undefined);
  if (width) values.size = width;
  if (hover["border-top"] || hover["border-bottom"]) {
    const hoverBorder = borderValues(hover);
    if (JSON.stringify(hoverBorder) !== JSON.stringify(values.border)) ctx.warn("hover-border", `${ctx.where}: its hover border has no Unlayer equivalent, so it keeps its border on hover.`);
  }
  const phoneWidth = size(descriptor.mobileStyle?.width, available);
  return [ctx.builder.content("button", values, blockDevice(descriptor, ctx, phoneWidth ? { size: phoneWidth } : {}))];
}
