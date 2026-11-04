/**
 * Built-in components made of primitives: today's Social, Menu and Video on the new engine (RFC 0001, step 7).
 * Each is a component of its own in the template (validated, described, and a block of its own in the builder's
 * design), and is expanded into the primitives it's made of before layout, as a custom component is: the writers
 * draw only primitives, in every output, and nothing in a render needs a browser or the network.
 */
import { prop, type ComponentDefinition, type PropSpecs, type StyleSpecs, type SupportByTarget } from "./define";
import { color, enumOf, insets, items, link, number, text, type LinkValue } from "./kinds";
import type { Json } from "./model";
import type { ExpandContext, ExpandProps } from "./registry";
import { css, layoutStyle, pick, placementStyle, textStyle } from "./styles";

const WRITTEN: SupportByTarget = { email: { level: "full", source: "writer" }, web: { level: "full", source: "writer" } };
const BY_PRIMITIVES: SupportByTarget = { email: { level: "full", source: "writer" }, web: css as SupportByTarget["web"] };

/** A definition made of primitives: `expand` returns the node it is, from its props and style (defaults applied). */
function defineComposite<const P extends PropSpecs, const S extends StyleSpecs>(
  definition: ComponentDefinition<P, S> & { expand(props: ExpandProps<P>, context: ExpandContext): unknown }
): ComponentDefinition<P, S> {
  return { ...definition, custom: true } as ComponentDefinition<P, S>;
}

/** Where the social networks' icons are, by style and network: Unlayer's, as today's Social uses them. */
const SOCIAL_ICONS = "https://cdn.tools.unlayer.com/social/icons";

export const Social = defineComposite({
  type: "Social",
  label: "Social icons",
  description: "Links to social profiles: a line of the networks' icons, each linked to its profile.",
  categories: ["block"],
  props: {
    // Its icon is found by its name's letters and digits ("LinkedIn": linkedin.png): a name needs one.
    icons: prop(items({ name: text({ maxLength: 40, pattern: /[A-Za-z0-9]/, mismatch: `has no letter (a to z) or digit, which its icon is found by ("Instagram")` }), href: link() }, "icon"), {
      support: WRITTEN,
      label: "Icons",
      required: true,
      description: 'Each network by name ("Instagram", "LinkedIn") and the link to its profile.',
    }),
    iconType: prop(enumOf(["circle", "rounded", "squared"]), { support: WRITTEN, label: "Icon style", default: "circle" }),
    size: prop(number({ min: 1, integer: true }), { support: WRITTEN, label: "Icon size", description: "Each icon's width and height, in px.", default: 32 }),
  },
  style: {
    gap: { ...layoutStyle.gap, label: "Space between icons", support: BY_PRIMITIVES },
    justifyContent: { kind: enumOf(["start", "center", "end"]), label: "Alignment", description: "Where the icons sit across the line.", support: BY_PRIMITIVES },
    ...placementStyle,
  },
  defaultStyle: { gap: 5, justifyContent: "center" },
  children: {},
  sizing: "stretch",
  targets: { email: {}, web: {} },
  editor: { groups: [{ title: "Social icons", paths: ["props.icons", "props.iconType", "props.size", "style.gap", "style.justifyContent"] }] },
  expand: ({ icons, iconType, size }, { style }) => ({
    type: "Row",
    props: { stackOnMobile: false },
    style: { gap: style.gap, justifyContent: style.justifyContent },
    children: icons.map((icon: { name: string; href: LinkValue }) => ({
      type: "Link",
      // Each opens in a new window, as the builder's do, unless it says otherwise.
      props: { href: typeof icon.href === "string" ? { href: icon.href, target: "_blank" } : icon.href, title: icon.name },
      style: { flex: "none" },
      children: [
        {
          type: "Image",
          props: { src: `${SOCIAL_ICONS}/${iconType}/${icon.name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.png`, alt: icon.name },
          style: { width: size },
        },
      ],
    })),
  }),
});

type Sides = { top: number; right: number; bottom: number; left: number };
const MENU_TEXT = ["fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "textTransform"] as const;

export const Menu = defineComposite({
  type: "Menu",
  label: "Menu",
  description: "A line of links (a site's sections, a footer's), onto more lines where they don't fit, with a separator between them on desktop; or links down a column.",
  categories: ["block"],
  props: {
    items: prop(items({ text: text({ maxLength: 200 }), href: link() }, "item"), {
      support: WRITTEN,
      label: "Items",
      required: true,
      description: "Each link's text and where it goes.",
    }),
    separator: prop(text({ maxLength: 10 }), { support: WRITTEN, label: "Separator", description: 'Between the links of a horizontal menu ("|", "·"), on desktop: phones show none.', default: "" }),
    layout: prop(enumOf(["horizontal", "vertical"]), { support: WRITTEN, label: "Layout", default: "horizontal" }),
  },
  style: {
    ...pick(textStyle, "color", ...MENU_TEXT),
    separatorColor: { kind: color(), label: "Separator color", support: BY_PRIMITIVES },
    padding: { kind: insets(), label: "Each link's padding", description: "Around each link: its sides are the space between them.", support: BY_PRIMITIVES },
    justifyContent: { kind: enumOf(["start", "center", "end"]), label: "Alignment", description: "Where the links sit.", support: BY_PRIMITIVES },
    ...placementStyle,
  },
  defaultStyle: {
    color: "#0068A5",
    fontSize: 14,
    lineHeight: 1.2,
    separatorColor: "#444444",
    padding: { top: 5, right: 15, bottom: 5, left: 15 },
    justifyContent: "center",
  },
  children: {},
  sizing: "stretch",
  targets: { email: {}, web: {} },
  editor: {
    groups: [
      { title: "Menu", paths: ["props.items", "props.layout", "props.separator", "style.justifyContent"] },
      { title: "Text", paths: ["style.color", "style.separatorColor", ...MENU_TEXT.map((key) => `style.${key}`)] },
      { title: "Spacing", paths: ["style.padding"] },
    ],
  },
  expand: ({ items: links, separator, layout }, { style, responsive }) => {
    const padding = style.padding as Sides;
    const text = Object.fromEntries(MENU_TEXT.filter((key) => style[key] !== undefined).map((key) => [key, style[key]]));
    const link = (item: { text: string; href: LinkValue }) => ({ type: "Link", props: { href: item.href }, style: { color: style.color, textDecoration: "none" }, children: [item.text] });
    if (layout === "vertical") {
      return { type: "Column", style: { ...text, gap: padding.top + padding.bottom, padding, alignItems: style.justifyContent }, children: links.map(link) };
    }
    // Each link in its padding, as today's Menu has it: two links are its sides apart, and a separator between them
    // has a link's padding on either side, not twice the space. Separators are left out on phones, where a template
    // has phones (a Document or a Canvas has none); they're as high in the line as the links' words.
    const item = (entry: { text: string; href: LinkValue }) => ({ type: "Text", style: { flex: "none", padding }, children: [link(entry)] });
    const between = {
      type: "Text",
      ...(responsive ? { hidden: { mobile: true } } : {}),
      style: { flex: "none", padding: { top: padding.top, right: 0, bottom: padding.bottom, left: 0 }, color: style.separatorColor },
      children: [separator],
    };
    return {
      type: "Row",
      props: { stackOnMobile: false },
      // Links that don't fit on one line go onto another, as today's Menu's do.
      style: { ...text, flexWrap: "wrap", justifyContent: style.justifyContent },
      children: links.flatMap((entry: { text: string; href: LinkValue }, index: number) => [...(index && separator ? [between] : []), item(entry)]),
    };
  },
});
