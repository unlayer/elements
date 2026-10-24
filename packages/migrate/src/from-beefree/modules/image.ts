/**
 * Beefree's `image` module (and an `addon` holding an image, such as a GIF) as an Image.
 *
 * Beefree sizes an image by its `computedStyle.class`: `autowidth` shows it at its natural width up to its column's,
 * as Unlayer's automatic width does; `fixedwidth` at the width set (`computedStyle.width`, in px, or `percWidth`);
 * `fullwidth` across its column. An Unlayer image's fixed width is a percent of what its column leaves it.
 */
import { align, px } from "../css";
import { slotWidth, type ModuleContext, type ModuleResult } from "../context";
import type { Values } from "../types";
import { blockDevice, blockPadding } from "./common";

const round2 = (n: number) => Math.round(n * 100) / 100;

export function image(descriptor: Record<string, any>, ctx: ModuleContext): ModuleResult {
  const source = descriptor.image ?? {};
  const url = typeof source.src === "string" ? source.src.trim() : "";
  if (!url) {
    ctx.warn("image-without-src", `${ctx.where}: the image has no source, so it's left out.`);
    return [];
  }
  const classes = String(descriptor.computedStyle?.class ?? "").toLowerCase().split(/\s+/);
  const { containerPadding, sides } = blockPadding(descriptor);
  const available = slotWidth(ctx.slot, sides);
  const shown = px(descriptor.computedStyle?.width);
  const naturalWidth = px(source.width) ?? shown;
  const naturalHeight = px(source.height);

  const src: Values = { url };
  if (naturalWidth) src.width = Math.round(naturalWidth);
  if (naturalWidth && naturalHeight) src.height = Math.round(naturalHeight);
  const share = typeof source.percWidth === "number" ? source.percWidth : undefined;
  if (classes.includes("fullwidth")) Object.assign(src, { autoWidth: false, maxWidth: "100%" });
  else if (classes.includes("fixedwidth") || (share !== undefined && !classes.includes("autowidth"))) {
    const width = shown ?? (share !== undefined ? (share / 100) * available : undefined);
    const pct = width !== undefined && available > 0 ? Math.min(100, round2((width / available) * 100)) : 100;
    Object.assign(src, { autoWidth: false, maxWidth: `${pct}%` });
  } else Object.assign(src, { autoWidth: true, maxWidth: "100%" });

  const href = typeof source.href === "string" ? source.href.trim() : "";
  const values: Values = {
    containerPadding,
    src,
    textAlign: align(descriptor.computedStyle?.class) ?? align(descriptor.style?.["text-align"]) ?? "center",
    altText: typeof source.alt === "string" ? source.alt : "",
    // Beefree's email export opens an image's link in a new tab whatever its target says.
    action: { name: "web", values: { href, target: "_blank" } },
  };
  const radius = px(descriptor.style?.["border-radius"] ?? source.style?.["border-radius"]);
  if (radius) ctx.warn("image-radius", `${ctx.where}: its rounded corners (${radius}px) have no Unlayer image setting, so they're square.`);

  // Phones: `fullwidthOnMobile` (the image across its column), and the phone alignment its phone class gives.
  const phone: Values = {};
  if (classes.includes("fullwidthonmobile")) phone.src = { autoWidth: false, maxWidth: "100%" };
  const phoneSide = align(descriptor.mobileStyle?.class);
  if (phoneSide && phoneSide !== values.textAlign) phone.textAlign = phoneSide;
  return [ctx.builder.content("image", values, blockDevice(descriptor, ctx, phone))];
}
