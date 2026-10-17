/**
 * Beefree's `social` module as Social icons. Each icon keeps its own image (`imgUrl`): Beefree's icon sets (white
 * logos, outlines, a template's own uploads) mostly have no Unlayer equivalent, and the email looks as it did. The
 * network is named as the editor names it, and the set's shape is the nearest Unlayer icon type.
 */
import { align, px, sides } from "../css";
import type { ModuleContext, ModuleResult } from "../context";
import type { Values } from "../types";
import { blockDevice, blockPadding } from "./common";

/** Beefree's network ids (any case) as the editor's names (`name.toLowerCase()` is the editor's icon file). */
const NETWORKS: Record<string, string> = {
  facebook: "Facebook",
  twitter: "Twitter",
  x: "X",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  pinterest: "Pinterest",
  tiktok: "TikTok",
  vimeo: "Vimeo",
  mail: "Email",
  email: "Email",
  whatsapp: "WhatsApp",
  snapchat: "Snapchat",
  tumblr: "Tumblr",
  reddit: "Reddit",
  telegram: "Telegram",
  discord: "Discord",
  spotify: "Spotify",
  soundcloud: "SoundCloud",
  github: "GitHub",
  dribbble: "Dribbble",
  behance: "Behance",
  medium: "Medium",
  skype: "Skype",
  flickr: "Flickr",
  rss: "RSS",
  yelp: "Yelp",
  google: "GooglePlus",
  googleplus: "GooglePlus",
  "google+": "GooglePlus",
  messenger: "Messenger",
  threads: "Threads",
  wechat: "WeChat",
  line: "Line",
  tripadvisor: "TripAdvisor",
};

/** The network an icon is: its name, its id, or its image's file name (`…/circle-color/facebook@2x.png`). */
function network(icon: Record<string, any>): string | undefined {
  const file = String(icon.image?.src ?? "").split("/").pop()?.replace(/(@\dx)?\.\w+$/, "") ?? "";
  for (const candidate of [icon.name, icon.id, file, icon.image?.title, icon.image?.alt]) {
    const key = String(candidate ?? "").trim().toLowerCase().replace(/\s+/g, "");
    if (NETWORKS[key]) return NETWORKS[key];
  }
  return undefined;
}

/** The Unlayer icon type nearest Beefree's icon set (from the icons' image folder: `circle-white`, `t-only-logo-dark-gray`, …). */
function iconType(src: string): string {
  const set = src.split("/").slice(-2, -1)[0]?.toLowerCase() ?? "";
  const shape = /square/.test(set) ? "squared" : /round/.test(set) ? "rounded" : "circle";
  if (/white/.test(set) && shape === "circle") return "circle-white";
  if (/dark|black|gray|grey/.test(set)) return `${shape}-black`;
  return shape;
}

export function social(descriptor: Record<string, any>, ctx: ModuleContext): ModuleResult {
  const list: Record<string, any>[] = Array.isArray(descriptor.iconsList?.icons) ? descriptor.iconsList.icons : [];
  const icons: Values[] = [];
  for (const icon of list) {
    const src = String(icon.image?.src ?? "").trim();
    const name = network(icon) ?? (String(icon.image?.alt ?? icon.image?.title ?? icon.text ?? "").trim() || "Link");
    if (!network(icon)) ctx.warn("social-custom-icon", `${ctx.where}: the icon "${name}" isn't a network the editor lists; it keeps its image and link.`);
    icons.push({ name, url: String(icon.image?.href ?? ""), ...(src ? { imgUrl: src } : {}) });
  }
  if (!icons.length) {
    ctx.warn("empty-module", `${ctx.where}: the social module has no icons, so it's left out.`);
    return [];
  }
  const computed = descriptor.computedStyle ?? {};
  // Each icon's padding (`computedStyle.padding`, "0 5px 5px 0") puts its right and left sides between two icons.
  const [, right, , left] = sides({ padding: String(computed.padding ?? "0 5px 0 0") });
  const width = px(computed.iconsDefaultWidth) ?? px(list[0]?.image?.width) ?? 32;
  const { containerPadding } = blockPadding(descriptor);
  const values: Values = {
    containerPadding,
    icons: { iconType: iconType(String(list[0]?.image?.src ?? "")), icons },
    align: align(descriptor.style?.["text-align"]) ?? "center",
    iconSize: Math.round(width),
    spacing: Math.round(right + left),
  };
  return [ctx.builder.content("social", values, blockDevice(descriptor, ctx))];
}
