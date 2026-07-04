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
