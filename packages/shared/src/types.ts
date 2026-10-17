/**
 * Shared Type Definitions
 *
 * Framework-agnostic types used across all Unlayer Elements packages.
 * Value types use Record<string, any> since the runtime semantic-props mapper
 * determines nesting from default-values objects, not from static types.
 * Shared sub-types (Href, Icons, etc.) are inlined here.
 */

// ============================================
// SHARED SUB-TYPES (inlined, no external deps)
// ============================================

export interface Href {
  name: string;
  attrs?: {
    href?: string;
    target?: string;
    onClick?: unknown;
    class?: string;
    download?: boolean;
    [k: string]: unknown;
  };
  values?: {
    [k: string]: string | number | { label?: string; value: string | number }[];
  };
}

export interface Icons {
  iconType: string;
  icons: { name: string; url: string; imgUrl?: string }[];
  editor?: {
    data?: {
      customIcons?: { name: string; url: string; icons: { [k: string]: string } }[];
      customOptions?: { value: string; label: string }[];
      showDefaultIcons?: boolean;
      showDefaultOptions?: boolean;
    };
  };
}

export interface VideoSource {
  loading?: boolean;
  playIconColor?: string;
  playIconSize?: number;
  playIconType?: string;
  thumbnail?: string | null;
  type?: "youtube" | "vimeo";
  url?: string;
  videoId?: string;
}

export type Table_table = {
  headers?: { cells?: { text?: string; width?: number }[]; height?: number }[];
  rows?: { cells?: { text?: string; width?: number }[]; height?: number }[];
  footers?: { cells?: { text?: string; width?: number }[]; height?: number }[];
};

export type TextAlign = "left" | "center" | "right" | "justify";

export interface LinkStyle {
  body?: boolean;
  inherit?: boolean;
  linkColor?: string;
  linkHoverColor?: string;
  linkUnderline?: boolean;
  linkHoverUnderline?: boolean;
}

// ============================================
// COMPONENT VALUE TYPES (from @unlayer/types)
// ============================================

export type { ButtonValues } from "@unlayer/types/tools/button";
export type { ImageValues } from "@unlayer/types/tools/image";
export type { HeadingValues } from "@unlayer/types/tools/heading";
export type { DividerValues } from "@unlayer/types/tools/divider";
export type { HtmlValues } from "@unlayer/types/tools/html";
export type { MenuValues } from "@unlayer/types/tools/menu";
export type { ParagraphValues } from "@unlayer/types/tools/paragraph";
export type { PageBreakValues } from "@unlayer/types/tools/page-break";
export type { SocialValues } from "@unlayer/types/tools/social";
export type { TableValues } from "@unlayer/types/tools/table";
export type { VideoValues } from "@unlayer/types/tools/video";

// ============================================
// CONTAINER VALUE TYPES (from @unlayer/types)
// ============================================

export type { RowValues } from "@unlayer/types/containers/row";
export type { ColumnValues } from "@unlayer/types/containers/column";
export type { BodyValues } from "@unlayer/types/containers/body";
export type { ContentValues } from "@unlayer/types/containers/content";

// ============================================
// SHORTHAND TYPES
// ============================================

/** A social-media icon entry for the `icons` shorthand prop. */
export interface SocialIcon {
  /** Platform name (e.g., "Facebook", "X", "Instagram") */
  name: string;
  /** Profile or share URL */
  url: string;
}

/** A menu item entry for the `items` shorthand prop. */
export interface MenuItem {
  /** Display text */
  text: string;
  /** Link URL */
  href: string;
  /** Link target (default: "_blank") */
  target?: string;
}

// ============================================
// TYPE UTILITIES
// ============================================

export type RenderMode = "web" | "email" | "document";

/** Any text, number, true or false, or null, keeping a type's own strings and numbers as suggestions (see LooseValue). */
type AnyScalar = (string & {}) | (number & {}) | boolean | null;

/**
 * A value as the builder may store it, at any depth: its own type, or any text, number, true or false, or null (designs
 * hold `lineHeight: 1.5`, `fontWeight: "700"`, a padding as a number). Objects and lists keep their keys checked.
 * `(string & {})` and `(number & {})` keep the type's own strings and numbers as suggestions, where a plain `string`
 * would swallow them: don't simplify them.
 */
export type LooseValue<T> = T extends string | number | boolean | null | undefined
  ? T | AnyScalar
  : T extends (...args: any[]) => any
    ? T
    : T extends readonly (infer Item)[]
      ? readonly LooseValue<Item>[] | AnyScalar
      : T extends object
        ? { [K in keyof T]?: LooseValue<T[K]> } | AnyScalar
        : T;

/**
 * What a component's `values` prop takes: the builder's values, as many as you set (the defaults fill in the rest),
 * at any depth. Its keys are checked, so a misspelled one is a type error; its values aren't (they reach the
 * renderer as they are, as the builder stores them). The flat props are the typed way to set a value.
 */
export type ValuesInput<V> = { [K in keyof V]?: LooseValue<V[K]> } & {
  /** Settings for one device (`mobile`, `desktop`), as the builder stores them: the `mobile` prop sets the phone's. */
  _override?: {
    mobile?: { [K in keyof V]?: LooseValue<V[K]> } & { hideMobile?: boolean };
    desktop?: { [K in keyof V]?: LooseValue<V[K]> } & { hideDesktop?: boolean };
  };
  /** Hidden on a desktop screen (the `hideOnDesktop` prop). */
  hideDesktop?: boolean;
};

// ============================================
// DESIGN JSON TYPES (Unlayer editor schema)
// ============================================

export interface DesignContent {
  type: string;
  /** Custom tool name — present when `type` is "custom" */
  slug?: string;
  values: Record<string, any>;
}

export interface DesignColumn {
  contents: DesignContent[];
  values: Record<string, any>;
}

export interface DesignRow {
  cells: number[];
  columns: DesignColumn[];
  values: Record<string, any>;
}

export interface DesignBody {
  rows: DesignRow[];
  values: Record<string, any>;
}

export interface DesignJSON {
  counters: Record<string, number>;
  body: DesignBody;
  schemaVersion: number;
}

/** Phone settings use the same flat CSS inputs as desktop props. */
export interface MobileProps {
  padding?: number | string;
  containerPadding?: number | string;
  fontSize?: number | string;
  lineHeight?: number | string;
  textAlign?: TextAlign;
  width?: number | string;
  maxWidth?: number | string;
  autoWidth?: boolean;
  /** Column border on this device (per side, as the desktop `border`). */
  border?: Partial<Record<`border${"Top" | "Right" | "Bottom" | "Left"}${"Width" | "Style" | "Color"}`, number | string>>;
}

export interface DeviceProps {
  mobile?: MobileProps;
  hideOnMobile?: boolean;
  hideOnDesktop?: boolean;
}
