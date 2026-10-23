import { SocialExporters, SocialDefaults } from "@unlayer/exporters";
import { social } from "../exporters/social";
import type { SocialValues, SocialIcon, SizeInput } from "../types";
import { createItemComponent, type ItemComponentProps } from "../utils/create-component";
import { mapSemanticProps, type SemanticProps } from "../utils/semantic-props";

// `iconSize`/`spacing` are pixel counts the exporter does arithmetic on, so they
// must reach it as numbers. Accept a number or a px string for DX and coerce in
// the mapper — a raw "34px" would otherwise render `max-width:NaNpx`.
type SocialSemanticProps = Omit<SemanticProps<SocialValues>, "iconSize" | "spacing"> & {
  /** Social icons shorthand (array of {name, url}) */
  icons?: SocialIcon[];
  /** Icon shape */
  iconType?: "circle" | "rounded" | "squared";
  /** Icon size in px — a number (34) or px string ("34px"). */
  iconSize?: SizeInput;
  /** Gap between icons in px — a number or px string. */
  spacing?: SizeInput;
  /** Alias of `align` (which wins where both are given). */
  textAlign?: SocialValues["align"];
};

export interface SocialProps
  extends Omit<ItemComponentProps<SemanticProps<SocialValues>>, "icons" | "iconSize" | "spacing"> {
  icons?: SocialIcon[] | SocialValues["icons"];
  iconType?: "circle" | "rounded" | "squared";
  iconSize?: SizeInput;
  spacing?: SizeInput;
  /** Alias of `align` (which wins where both are given). */
  textAlign?: SocialValues["align"];
}

// Defaults from the editor schema
const DEFAULT_ICONS: SocialValues["icons"] = SocialDefaults.icons ?? { iconType: "circle", icons: [] };

const DEFAULT_VALUES = {
  ...SocialDefaults,
} as unknown as SocialValues;

/**
 * Social - Renders social-media icon links.
 *
 * @example Shorthand
 * ```tsx
 * <Social icons={[{ name: "Facebook", url: "https://facebook.com" }]} iconType="rounded" />
 * ```
 *
 * @example Full Control
 * ```tsx
 * <Social values={{
 *   icons: { icons: [
 *     { name: "Facebook", url: "https://facebook.com/..." },
 *     { name: "Twitter", url: "https://twitter.com/..." }
 *   ]}
 * }} />
 * ```
 */
const Social = createItemComponent<SocialValues, SocialSemanticProps>({
  name: "Social",
  defaultValues: DEFAULT_VALUES,
  propMapper: (props) => {
    const { icons, iconType, ...rest } = props;
    const base: Partial<SocialValues> = mapSemanticProps((Array.isArray(icons) || iconType !== undefined ? rest : props) as SemanticProps<SocialValues>, DEFAULT_VALUES, "Social");
    // Map shorthand icons array → exporter format; an iconType passed without them is threaded into the nested group.
    if (Array.isArray(icons)) base.icons = { iconType: iconType ?? base.icons?.iconType ?? "circle", icons: icons.map((icon: SocialIcon) => ({ name: icon.name, url: icon.url ?? undefined })) };
    else if (iconType !== undefined) base.icons = { ...DEFAULT_ICONS, ...base.icons, iconType };
    // The exporter does arithmetic on iconSize/spacing (icon box sizing and the container max-width), so coerce a px
    // string or number down to a number. A non-px unit ("50%", "1.5em") is invalid here: dropped, so mergeValues
    // falls back to the schema default.
    for (const key of ["iconSize", "spacing"] as const) {
      const v = (base as Record<string, unknown>)[key];
      if (typeof v !== "string") continue;
      const m = /^(\d+(?:\.\d+)?)(?:px)?$/.exec(v.trim());
      if (m) (base as Record<string, unknown>)[key] = parseFloat(m[1]);
      else delete (base as Record<string, unknown>)[key];
    }
    return base;
  },
  displayName: "Social",
  // The web HTML (a document's too) without react-dom (see exporters/markup.ts).
  exporters: { ...SocialExporters, web: social },
});

export default Social;
