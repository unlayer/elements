import { MenuExporters, MenuDefaults } from "@unlayer/exporters";
import type { MenuValues, MenuItem, SizeInput } from "../types";
import { createItemComponent, type ItemComponentProps } from "../utils/create-component";
import { mapSemanticProps, type SemanticProps } from "../utils/semantic-props";

type MenuSemanticProps = Omit<SemanticProps<MenuValues>, "padding"> & {
  /** Menu items shorthand */
  items?: MenuItem[];
  /** Inner padding — a number (→ px) or CSS string. */
  padding?: SizeInput;
};

export interface MenuProps extends ItemComponentProps<MenuSemanticProps> {}

// Defaults from the editor schema
const DEFAULT_MENU: NonNullable<MenuValues["menu"]> = MenuDefaults.menu ?? { items: [] };

const DEFAULT_VALUES = {
  ...MenuDefaults,
} as unknown as MenuValues;

/**
 * Menu - Renders a navigation menu.
 *
 * @example Shorthand
 * ```tsx
 * <Menu items={[{ text: "Home", href: "/" }, { text: "About", href: "/about" }]} />
 * ```
 *
 * @example Full Control
 * ```tsx
 * <Menu values={{
 *   menu: {
 *     items: [
 *       { key: "home", text: "Home", link: { name: "web", values: { href: "/" } } }
 *     ]
 *   }
 * }} />
 * ```
 */
const Menu = createItemComponent<MenuValues, MenuSemanticProps>({
  name: "Menu",
  defaultValues: DEFAULT_VALUES,
  propMapper: (props) => {
    const { items, ...rest } = props;

    if (Array.isArray(items)) {
      const mapped = items.map((item: MenuItem, i: number) => ({
        key: String(i + 1),
        text: item.text,
        link: {
          name: "web",
          values: { href: item.href, target: item.target ?? "_blank" },
        },
      }));
      const base: Partial<MenuValues> = mapSemanticProps(
        rest as SemanticProps<MenuValues>,
        DEFAULT_VALUES,
        "Menu"
      );
      base.menu = { items: mapped };
      return base;
    }

    return mapSemanticProps(
      props as SemanticProps<MenuValues>,
      DEFAULT_VALUES,
      "Menu"
    );
  },
  displayName: "Menu",
  exporters: MenuExporters,
});

export default Menu;
