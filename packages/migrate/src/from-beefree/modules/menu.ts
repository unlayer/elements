/** Beefree's `menu` module as a Menu. */
import { align, boxString, color, fontFamily, fontWeight, letterSpacing, px, pxString, sides } from "../css";
import type { ModuleContext, ModuleResult } from "../context";
import type { Values } from "../types";
import { blockDevice, blockPadding } from "./common";

export function menu(descriptor: Record<string, any>, ctx: ModuleContext): ModuleResult {
  const items: Record<string, any>[] = Array.isArray(descriptor.menuItemsList?.items) ? descriptor.menuItemsList.items : [];
  if (!items.length) {
    ctx.warn("empty-module", `${ctx.where}: the menu has no items, so it's left out.`);
    return [];
  }
  const style = descriptor.style ?? {};
  const computed = descriptor.computedStyle ?? {};
  const textColor = color(style.color) || ctx.textColor;
  const values: Values = {
    menu: {
      items: items.map((item, i) => ({
        key: String(i + 1),
        text: String(item.text ?? ""),
        link: { name: "web", values: { href: String(item.link?.href ?? ""), target: typeof item.link?.target === "string" && item.link.target ? item.link.target : "_blank" } },
      })),
    },
    fontSize: pxString(px(style["font-size"]) ?? 14),
    textColor,
    // Beefree's items are links, in its link color.
    linkColor: color(computed.linkColor) || textColor,
    align: align(style["text-align"]) ?? "center",
    layout: computed.layout === "vertical" ? "vertical" : "horizontal",
    separator: typeof computed.separator === "string" ? computed.separator : "",
    padding: boxString(sides(computed.menuItemsSpacing)),
  };
  const font = fontFamily(style["font-family"], ctx.webFonts);
  if (font) values.fontFamily = font;
  const weight = fontWeight(style["font-weight"]);
  if (weight !== undefined && weight !== 400) values.fontWeight = weight;
  const spacing = letterSpacing(style["letter-spacing"]);
  if (spacing) values.letterSpacing = spacing;
  if (computed.hamburger?.mobile === true) ctx.warn("menu-hamburger", `${ctx.where}: Beefree folds this menu into a hamburger button on phones; Unlayer menus have none, so phones show its items.`);
  const { containerPadding } = blockPadding(descriptor);
  return [ctx.builder.content("menu", { containerPadding, ...values }, blockDevice(descriptor, ctx))];
}
