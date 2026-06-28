import { SocialExporters, SocialDefaults } from "@unlayer/exporters";
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
};

export interface SocialProps
  extends Omit<ItemComponentProps<SemanticProps<SocialValues>>, "icons" | "iconSize" | "spacing"> {
  icons?: SocialIcon[] | SocialValues["icons"];
  iconType?: "circle" | "rounded" | "squared";
  iconSize?: SizeInput;
  spacing?: SizeInput;
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

    // The exporter does arithmetic on iconSize/spacing (icon box sizing and the
    // container max-width), so coerce a px string or number down to a number.
    const coerceSizes = (base: Partial<SocialValues>): Partial<SocialValues> => {
      for (const key of ["iconSize", "spacing"] as const) {
        const v = (base as Record<string, unknown>)[key];
        if (typeof v === "string") {
          // px count only — a non-px unit ("50%", "1.5em") is invalid here, so
          // drop it and let mergeValues fall back to the schema default.
          const m = /^(\d+(?:\.\d+)?)(?:px)?$/.exec(v.trim());
          if (m) (base as Record<string, unknown>)[key] = parseFloat(m[1]);
          else delete (base as Record<string, unknown>)[key];
        }
      }
      return base;
    };

    // Map shorthand icons array → exporter format
    if (Array.isArray(icons)) {
      const mapped = icons.map((icon: SocialIcon) => ({
        name: icon.name,
        url: icon.url,
      }));
      const base: Partial<SocialValues> = mapSemanticProps(
        rest as SemanticProps<SocialValues>,
        DEFAULT_VALUES,
        "Social"
      );
      base.icons = {
        iconType: iconType ?? base.icons?.iconType ?? "circle",
        icons: mapped,
      };
      return coerceSizes(base);
    }

    // If iconType passed without shorthand icons, thread it into nested group
    if (iconType !== undefined) {
      const base: Partial<SocialValues> = mapSemanticProps(
        rest as SemanticProps<SocialValues>,
        DEFAULT_VALUES,
        "Social"
      );
      base.icons = { ...DEFAULT_ICONS, ...base.icons, iconType };
      return coerceSizes(base);
    }

    return coerceSizes(
      mapSemanticProps(props as SemanticProps<SocialValues>, DEFAULT_VALUES, "Social")
    );
  },
  displayName: "Social",
  exporters: SocialExporters,
});

export default Social;
