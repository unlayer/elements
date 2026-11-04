/**
 * A social block as its exporter draws it, in a Column with the block's padding, placed by its alignment: its icons on
 * a line that wraps where they don't fit, always left to right. Each is a link (to a mailto: address for an Email icon
 * given an address) around its image: a custom icon's, an icon's own, else the configured CDN's for its name and style,
 * its alternate text "<name> icon", the spacing to the next inside its box as legacy's margin is. In an email's markup
 * an image is as tall as its file makes it, in a box as tall as the icon size; on a page's, the icon size. No icons:
 * a page's placeholder, or in an email's markup nothing. It always draws: what can't be read is said.
 */
import type { TreeNode } from "../lower";
import { ALIGN, DEFAULT_CDN, deviceValues, drawnImageUrl, encodedUrl, keptUrl, px, sides, some, type Values } from "../values";
import type { Lowering } from "./index";

export const social: Lowering = (block, place): TreeNode => {
  const { values, phone } = deviceValues(block.values, ["containerPadding"], place.mode);
  const asEmail = (values.mode ?? place.mode) === "email";
  const said = (what: string, value: unknown) => place.note(`A social block's ${what} ${JSON.stringify(value)} can't be read: it's drawn without it.`);
  const type = values.icons?.iconType ?? "circle";
  const cdn = place.config.cdnBaseUrl ?? DEFAULT_CDN;
  let size = px(values.iconSize ?? 32);
  if (size === undefined || size < 0) {
    said("icon size", values.iconSize);
    size = 32;
  }
  let spacing = px(values.spacing ?? 5);
  if (spacing === undefined || spacing < 0) {
    said("spacing", values.spacing);
    spacing = 0;
  }
  const padding = sides(values.containerPadding ?? "10px");
  if (!padding) said("padding", values.containerPadding);
  const phonePadding = phone.containerPadding === undefined ? undefined : sides(phone.containerPadding);
  if (phone.containerPadding !== undefined && !phonePadding) said("padding on phones", phone.containerPadding);
  let align = ALIGN[values.align ?? "center"];
  if (!align) {
    said("alignment", values.align);
    // An email's markup has it as a <div align>, which "middle" centers; a page's as text-align, which ignores it.
    align = asEmail && values.align === "middle" ? "center" : "start";
  }
  const column = (children: TreeNode[]): TreeNode => ({ type: "Column", style: some(padding) ? { padding: padding! } : {}, ...(phonePadding ? { mobile: { padding: phonePadding } } : {}), compat: { ariaLabel: "social" }, children });
  if (values.icons?.icons !== undefined && !Array.isArray(values.icons.icons)) said("icons", values.icons.icons);
  const listed: unknown[] = Array.isArray(values.icons?.icons) ? values.icons.icons : [];
  if (!listed.length) {
    if (asEmail) return column([]);
    const { compat: _, ...placeholder } = column([{ type: "Image", props: { src: `${cdn}/social/icons/default.png`, alt: "social icon" }, style: { height: size } }]);
    return { ...placeholder, style: { ...placeholder.style, alignItems: align } };
  }
  const icons = listed.filter((icon): icon is Values => {
    if (!icon || typeof icon !== "object") said("icon", icon);
    return !!icon && typeof icon === "object";
  });
  const custom: unknown[] = Array.isArray(values.icons?.editor?.data?.customIcons) ? values.icons.editor.data.customIcons : [];
  // An email's markup has a tag in an icon's URL as written; a page's has it escaped, and neither one in its name.
  const inUrl = (text: string) => (asEmail ? keptUrl(text, place.keep) : text);
  const nodes = icons.map((icon, index): TreeNode => {
    const name = typeof icon.name === "string" ? icon.name : "";
    if (!name) said("icon's name", icon.name);
    const own = custom.find((other) => (other as Values | null)?.name === icon.name) as Values | undefined;
    const givenImage = own ? own.icons?.[type] : icon.imgUrl;
    const named = `${cdn}/social/icons/${type}/${name.toLowerCase()}.png`;
    const url = givenImage ? drawnImageUrl(givenImage, inUrl, (message) => place.note(`A social icon's ${message}`)) : undefined;
    const alt = `${name} icon`;
    const title = name || undefined;
    const image: TreeNode = {
      type: "Image",
      props: { src: size ? { src: url ?? named, width: size, height: size } : url ?? named, alt, ...(asEmail && title ? { title } : {}) },
      style: asEmail ? { width: size! } : { width: size!, height: size! },
    };
    const given = icon.url;
    const address = typeof given === "number" ? String(given) : given;
    if (given !== undefined && given !== null && typeof address !== "string") said("icon's link", given);
    const href = typeof address === "string" ? (icon.name !== "Email" || address.includes("mailto") ? address : `mailto:${address}`) : undefined;
    const drawn: TreeNode =
      href === undefined
        ? image
        : {
            type: "Link",
            props: { href: { href: inUrl(encodedUrl(href)), target: "_blank" }, ...(asEmail ? (title ? { title } : {}) : { "aria-label": alt }) },
            children: [image],
          };
    const gap = index === icons.length - 1 ? 0 : spacing!;
    // Its box: the icon and the space to the next (which goes along where the line wraps, as legacy's margin does).
    return { type: "Column", ...(asEmail ? { compat: { ariaLabel: alt } } : {}), style: { flex: "none", width: size! + gap, ...(gap ? { padding: { top: 0, right: gap, bottom: 0, left: 0 } } : {}), ...(asEmail ? { height: size! } : {}) }, children: [drawn] };
  });
  const rtl = (place.config.textDirection ?? place.body.textDirection) === "rtl";
  // As legacy's plain text reads it: its links' addresses, on one line in a page's markup, each on its own in an email's.
  const reads = nodes.map((node): TreeNode | string => {
    const drawn = (node.children as TreeNode[])[0];
    return drawn.type === "Link" ? { ...drawn, children: [] } : `[${drawn.props?.alt}]`;
  });
  const reading: TreeNode = asEmail ? { type: "Column", children: reads.map((read) => ({ type: "Column", children: [{ type: "Paragraph", children: [read] }] })) } : { type: "Paragraph", children: reads.flatMap((read, index) => (index ? [" ", read] : [read])) };
  return { ...column([{ type: "Row", props: { stackOnMobile: false, ...(rtl ? { dir: "ltr" } : {}) }, style: { flexWrap: "wrap", justifyContent: align }, children: nodes }]), textAs: reading };
};
