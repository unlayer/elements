import { SocialExporters, SocialDefaults } from "@unlayer/exporters";
import type { SocialValues, SocialIcon } from "../types";
import { createItemComponent, type ItemComponentProps } from "../utils/create-component";
import { mapSemanticProps, type SemanticProps } from "../utils/semantic-props";

type SocialSemanticProps = SemanticProps<SocialValues> & {
  /** Social icons shorthand (array of {name, url}) */
  icons?: SocialIcon[];
  /** Icon shape */
  iconType?: "circle" | "rounded" | "squared";
};

export interface SocialProps extends Omit<ItemComponentProps<SemanticProps<SocialValues>>, "icons"> {
  icons?: SocialIcon[] | SocialValues["icons"];
  iconType?: "circle" | "rounded" | "squared";
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
      return base;
    }

    // If iconType passed without shorthand icons, thread it into nested group
    if (iconType !== undefined) {
      const base: Partial<SocialValues> = mapSemanticProps(
        rest as SemanticProps<SocialValues>,
        DEFAULT_VALUES,
        "Social"
      );
      base.icons = { ...DEFAULT_ICONS, ...base.icons, iconType };
      return base;
    }

    return mapSemanticProps(
      props as SemanticProps<SocialValues>,
      DEFAULT_VALUES,
      "Social"
    );
  },
  displayName: "Social",
  exporters: SocialExporters,
});

export default Social;
