/**
 * Beefree's `divider` and `spacer` modules as Dividers. A divider Beefree draws (a border with a width and a color)
 * is a Divider; one it doesn't (a transparent or 0px border, which templates use as space) and a spacer are space: an
 * invisible Divider whose padding is that height, which stays a block the editor edits. A spacer with a background
 * color is a Divider that thick in that color.
 */
import { align, border, boxString, hasSides, percent, px, pxString, sides } from "../css";
import type { ModuleContext, ModuleResult } from "../context";
import type { Values } from "../types";
import { blockDevice } from "./common";

const INVISIBLE = { borderTopWidth: "0px", borderTopStyle: "solid", borderTopColor: "transparent" };

/** Space `height` px tall, below a block's own padding. */
function space(height: number, padding: [number, number, number, number], ctx: ModuleContext, descriptor: Record<string, any>, phoneHeight?: number): ModuleResult {
  const [t, r, b, l] = padding;
  const phone: Values = {};
  if (phoneHeight !== undefined || hasSides(descriptor.mobileStyle)) {
    const [mt, mr, mb, ml] = hasSides(descriptor.mobileStyle) ? sides({ ...descriptor.style, ...descriptor.mobileStyle }) : padding;
    phone.containerPadding = boxString([mt + (phoneHeight ?? height), mr, mb, ml]);
  }
  return [ctx.builder.content("divider", { containerPadding: boxString([t + height, r, b, l]), border: { ...INVISIBLE } }, blockDevice(descriptor, ctx, phone))];
}

export function divider(descriptor: Record<string, any>, ctx: ModuleContext): ModuleResult {
  const style = descriptor.divider?.style ?? {};
  const padding = sides(descriptor.style);
  const line = border(style["border-top"]);
  if (!line) {
    // Beefree's space: its height where it sets one, else the transparent border's width.
    const height = px(style.height) ?? px(String(style["border-top"] ?? "").trim().split(/\s+/)[0]) ?? 0;
    return space(height, padding, ctx, descriptor);
  }
  const width = percent(style.width) ?? (px(style.width) !== undefined ? undefined : 100);
  const values: Values = {
    containerPadding: boxString(padding),
    width: width !== undefined ? `${width}%` : pxString(px(style.width)!),
    border: { borderTopWidth: pxString(line.width), borderTopStyle: line.style, borderTopColor: line.color },
    textAlign: align(descriptor.computedStyle?.align) ?? align(descriptor.style?.["text-align"]) ?? "center",
  };
  return [ctx.builder.content("divider", values, blockDevice(descriptor, ctx))];
}

export function spacer(descriptor: Record<string, any>, ctx: ModuleContext): ModuleResult {
  const style = descriptor.spacer?.style ?? {};
  const height = px(style.height) ?? 0;
  const phoneHeight = px(descriptor.mobileStyle?.height);
  const fill = border(`${height}px solid ${style["background-color"] ?? ""}`);
  if (fill && height > 0) {
    const phone: Values = {};
    if (phoneHeight !== undefined && phoneHeight !== height) {
      ctx.warn("phone-style", `${ctx.where}: its phone height (${phoneHeight}px) has no Unlayer equivalent for a colored spacer, so phones show it ${height}px tall.`);
    }
    return [ctx.builder.content("divider", { containerPadding: "0px", border: { borderTopWidth: pxString(height), borderTopStyle: "solid", borderTopColor: fill.color } }, blockDevice(descriptor, ctx, phone))];
  }
  return space(height, [0, 0, 0, 0], ctx, descriptor, phoneHeight);
}
