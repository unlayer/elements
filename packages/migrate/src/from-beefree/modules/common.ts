/** What every module has: its padding, visibility per device, and phone settings. */
import { align, boxString, color, fontFamily, hasSides, letterSpacing, lineHeight, px, pxString, sides } from "../css";
import type { ModuleContext } from "../context";
import { override } from "../design";
import type { BeefreeStyle, Values } from "../types";

/** A module's padding (its `style`'s), as `containerPadding`, and its left and right sides. */
export function blockPadding(descriptor: Record<string, any>): { containerPadding: string; sides: [number, number] } {
  const box = sides(descriptor.style);
  return { containerPadding: boxString(box), sides: [box[3], box[1]] };
}

/** Phone settings a block's `mobile` takes, by Beefree's `mobileStyle` property. */
const PHONE: Record<string, string> = { "font-size": "fontSize", "text-align": "textAlign", "line-height": "lineHeight" };

/**
 * A module's device settings (`_override`): hidden on phones or desktops, and its phone padding, font size and
 * alignment. `extra` adds settings the module works out itself (an image's width).
 */
export function blockDevice(descriptor: Record<string, any>, ctx: ModuleContext, extra: Values = {}): Values | undefined {
  const computed = descriptor.computedStyle ?? {};
  const phone: Values = { ...extra };
  const desktop: Values = {};
  if (computed.hideContentOnMobile === true) phone.hideMobile = true;
  if (computed.hideContentOnDesktop === true) desktop.hideDesktop = true;
  if (computed.hideContentOnMobile === true && computed.hideContentOnDesktop === true) ctx.warn("hidden-everywhere", `${ctx.where}: hidden on both phones and desktops in Beefree; it stays hidden on both.`);

  const mobile: BeefreeStyle = descriptor.mobileStyle ?? {};
  if (hasSides(mobile) && phone.containerPadding === undefined) {
    const desktopBox = sides(descriptor.style);
    const box = sides({ ...Object.fromEntries(["top", "right", "bottom", "left"].map((side, i) => [`padding-${side}`, pxString(desktopBox[i])])), ...mobile });
    phone.containerPadding = boxString(box);
  }
  for (const [key, value] of Object.entries(mobile)) {
    if (/^padding/.test(key) || value === undefined || value === "") continue;
    const name = PHONE[key];
    if (name === "textAlign") {
      const side = align(value);
      if (side) phone.textAlign = side;
    } else if (name === "fontSize" && px(value) !== undefined) phone.fontSize = pxString(px(value)!);
    else if (name === "lineHeight" && lineHeight(value)) phone.lineHeight = lineHeight(value);
    else if (!(key in EXTRA_PHONE)) ctx.warn("phone-style", `${ctx.where}: its phone setting \`${key}: ${value}\` has no Unlayer equivalent, so phones show the desktop one.`);
  }
  return override(phone, desktop);
}

/** Phone settings a module's own conversion reads (an image's `class`, a spacer's `height`, a button's `width`). */
const EXTRA_PHONE: Record<string, true> = { class: true, height: true, width: true, align: true };

/** The text settings a block takes from a Beefree text style (`paragraph.style`, `heading.style`, `list.style`). */
export function textSettings(style: BeefreeStyle | undefined, ctx: ModuleContext): Values {
  const out: Values = {};
  if (!style) return out;
  const size = px(style["font-size"]);
  if (size !== undefined) out.fontSize = pxString(size);
  const paint = color(style.color);
  if (paint) out.color = paint;
  const font = fontFamily(style["font-family"], ctx.webFonts);
  if (font) out.fontFamily = font;
  const height = lineHeight(style["line-height"]);
  if (height) out.lineHeight = height;
  const side = align(style["text-align"]);
  if (side) out.textAlign = side;
  const spacing = letterSpacing(style["letter-spacing"]);
  if (spacing) out.letterSpacing = spacing;
  return out;
}

/** A text block's link color, as its `linkStyle` (underlined as browsers do, unless the link's own style says not). */
export function linkStyle(linkColor: unknown): Values | undefined {
  const paint = color(linkColor);
  if (!paint) return undefined;
  return { inherit: false, linkColor: paint, linkHoverColor: paint, linkUnderline: true, linkHoverUnderline: true };
}
