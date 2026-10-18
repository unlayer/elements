import { element, staticMarkup } from "./markup";
import { present } from "./present";

/** The icons, each with its image from the editor's custom icons for the icon type where it's one of them. */
function withCustomIcons({ icons, customIcons, iconType }: { icons: any[]; customIcons?: any[]; iconType?: string }) {
  return icons
    .map((icon) => {
      if (!icon) return;
      const custom = customIcons?.find((own) => own && own.name === icon.name);
      return { ...icon, imgUrl: custom ? custom.icons[iconType as string] : icon.imgUrl };
    })
    .filter(Boolean);
}

/** An icon's link: an email address as a `mailto:` link. */
const href = (icon: any) => (icon?.name !== "Email" || icon?.url?.includes("mailto") ? icon?.url : `mailto:${icon?.url}`);

/**
 * Social's web HTML (which a document uses too), as @unlayer/exporters' SocialExporters write it with React (byte
 * for byte): a link and image for each icon, from the config's CDN.
 */
export function social(values: Record<string, any>, ...args: any[]): string {
  const { exporterConfig: config } = args[6] || {};
  const { icons: { editor: { data } = {}, iconType, icons: given } = {}, align, spacing, iconSize } = values;
  const cdnBaseUrl = config?.cdnBaseUrl || "";
  const icons = withCustomIcons({ icons: present(given), customIcons: data?.customIcons, iconType }).map((icon) => ({ ...icon, url: href(icon) }));
  if (!icons.length)
    return staticMarkup(element("div", { style: { textAlign: align, lineHeight: "0px" } }, element("img", { src: `${cdnBaseUrl}/social/icons/default.png`, height: iconSize, alt: "social icon" })));
  return staticMarkup(
    element(
      "div",
      { style: { textAlign: align, lineHeight: "0px", direction: "ltr" }, "aria-label": "social" },
      icons.map((icon, index) => {
        if (!icon) return null;
        const src = icon?.imgUrl || `${cdnBaseUrl}/social/icons/${iconType}/${icon.name.toLowerCase()}.png`;
        return element(
          "a",
          {
            key: `icon-${index}`,
            href: href(icon),
            target: "_blank",
            "aria-label": `${icon.name} icon`,
            style: { display: "inline-block", width: `${iconSize}px`, height: `${iconSize}px`, marginRight: `${index == icons.length - 1 ? 0 : spacing}px` },
          },
          element("img", { alt: `${icon?.name} icon`, src, width: iconSize, height: iconSize })
        );
      })
    )
  );
}
