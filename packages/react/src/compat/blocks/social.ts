/**
 * A social block on a page (or a printed document) as legacy draws it, in a Column with the block's padding, placed
 * by its alignment: a Row of its icons, each a link (to a mailto: address for an Email icon given an address) around
 * its icon from the configured CDN, its alternate text "<name> icon", the spacing between each two. An email's icons
 * are inline tables with a space between each two in its markup, as wide as the body's font draws a space: kept as
 * legacy writes them, as are custom icons, an icon list that may wrap, and no icons (legacy's placeholder).
 */
import type { DesignBlock, Place, TreeNode } from "../lower";
import { ALIGN, px, sides, some, type Values } from "../values";

/** At most this wide (legacy's icons wrap where they don't fit; a Row of them doesn't): wider ones keep their legacy HTML. */
const ONE_LINE = 300;

export function social(block: DesignBlock, place: Place): TreeNode | undefined {
  const { values } = block;
  if (place.mode === "email" || (values.mode !== undefined && values.mode !== place.mode)) return undefined;
  const icons: Values[] = values.icons?.icons ?? [];
  const type = values.icons?.iconType ?? "circle";
  const size = px(values.iconSize ?? 32);
  const spacing = px(values.spacing ?? 5) ?? 0;
  const padding = sides(values.containerPadding ?? "10px");
  const cdn = place.config.cdnBaseUrl ?? "https://cdn.tools.unlayer.com";
  if (!icons.length || values.icons?.editor?.data?.customIcons?.length || !size || !padding || !ALIGN[values.align ?? "center"]) return undefined;
  if (icons.length * size + (icons.length - 1) * spacing > ONE_LINE) return undefined;
  if (icons.some((icon) => !icon || typeof icon.name !== "string" || !icon.name || typeof icon.url !== "string" || !icon.url || icon.imgUrl)) return undefined;
  const href = (icon: Values) => (icon.name !== "Email" || icon.url.includes("mailto") ? icon.url : `mailto:${icon.url}`);
  return {
    type: "Column",
    style: some(padding) ? { padding } : {},
    children: [
      {
        type: "Row",
        props: { stackOnMobile: false },
        style: { gap: spacing, justifyContent: ALIGN[values.align ?? "center"] },
        children: icons.map((icon) => ({
          type: "Link",
          props: { href: { href: href(icon), target: "_blank" }, "aria-label": `${icon.name} icon` },
          style: { flex: "none" },
          children: [{ type: "Image", props: { src: { src: `${cdn}/social/icons/${type}/${icon.name.toLowerCase()}.png`, width: size, height: size }, alt: `${icon.name} icon` }, style: { width: size, height: size } }],
        })),
      },
    ],
  };
}
