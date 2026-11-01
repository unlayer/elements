/**
 * Built-in components made of primitives: today's Social, Menu and Video on the new engine (RFC 0001, step 7).
 * Each is a component of its own in the template (validated, described, and a block of its own in the builder's
 * design), and is expanded into the primitives it's made of before layout, as a custom component is: the writers
 * draw only primitives, in every output, and nothing in a render needs a browser or the network.
 */
import { prop, type ComponentDefinition, type PropSpecs, type StyleSpecs, type SupportByTarget } from "./define";
import { enumOf, items, link, number, text, type LinkValue } from "./kinds";
import type { Json } from "./model";
import type { ExpandContext, ExpandProps } from "./registry";
import { css, layoutStyle, placementStyle } from "./styles";

const WRITTEN: SupportByTarget = { email: { level: "full", source: "writer" }, web: { level: "full", source: "writer" } };
const BY_PRIMITIVES: SupportByTarget = { email: { level: "full", source: "writer" }, web: css as SupportByTarget["web"] };

/** A definition made of primitives: `expand` returns the node it is, from its props and style (defaults applied). */
function defineComposite<const P extends PropSpecs, const S extends StyleSpecs>(
  definition: ComponentDefinition<P, S> & { expand(props: ExpandProps<P>, context: ExpandContext): Json }
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
    icons: prop(items({ name: text({ maxLength: 40 }), href: link() }, "icon"), {
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
      props: { href: icon.href, title: icon.name },
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
