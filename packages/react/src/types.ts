/**
 * Type Definitions
 *
 * Re-exports shared types from @unlayer-internal/shared-elements
 * and defines React-specific component prop types.
 */

import type { SemanticProps } from "@unlayer-internal/shared-elements";

// ============================================
// RE-EXPORT ALL SHARED TYPES
// ============================================

export type {
  // Sub-types
  Href,
  Icons,
  VideoSource,
  Table_table,
  TextAlign,
  LinkStyle,
  // Component value types
  ButtonValues,
  ImageValues,
  HeadingValues,
  DividerValues,
  HtmlValues,
  MenuValues,
  ParagraphValues,
  SocialValues,
  TableValues,
  VideoValues,
  // Container value types
  RowValues,
  ColumnValues,
  BodyValues,
  ContentValues,
  // Shorthand types
  SocialIcon,
  MenuItem,
  // Utility types
  RenderMode,
} from "@unlayer-internal/shared-elements";

// ============================================
// COMPONENT PROP TYPES
// ============================================

// Import value types for prop definitions
import type {
  ButtonValues,
  ImageValues,
  HeadingValues,
  DividerValues,
  HtmlValues,
  MenuValues,
  ParagraphValues,
  SocialValues,
  TableValues,
  VideoValues,
  SocialIcon,
  MenuItem,
} from "@unlayer-internal/shared-elements";

/**
 * Public props for item components.
 * Includes semantic flat props, children, values escape hatch,
 * className, style, and mode. Excludes internal threading props.
 */
type ItemProps<TValues> = SemanticProps<TValues, React.ReactNode> & {
  className?: string;
  style?: React.CSSProperties;
  mode?: "web" | "email" | "document";
};

/** Button component props */
export type ButtonProps = ItemProps<ButtonValues>;
/** Heading component props */
export type HeadingProps = ItemProps<HeadingValues>;
/** Divider component props */
export type DividerProps = ItemProps<DividerValues>;
/** HTML component props */
export type HtmlProps = ItemProps<HtmlValues>;
/** Paragraph component props */
export type ParagraphProps = ItemProps<ParagraphValues>;

/** Image component props — supports `alt` shorthand for `altText`. */
export type ImageProps = ItemProps<ImageValues> & {
  /** Alt text (alias for altText) */
  alt?: string;
};

/** Social component props — supports `icons` shorthand array. */
export type SocialProps = ItemProps<SocialValues> & {
  /** Social icons shorthand */
  icons?: SocialIcon[];
  /** Icon shape */
  iconType?: "circle" | "rounded" | "squared";
};

/** Menu component props — supports `items` shorthand array. */
export type MenuProps = ItemProps<MenuValues> & {
  /** Menu items shorthand */
  items?: MenuItem[];
};

/** Table component props — supports `headers` + `data` shorthands. */
export type TableProps = ItemProps<TableValues> & {
  /** Column headers */
  headers?: string[];
  /** Row data as 2D array */
  data?: string[][];
};

/** Video component props — supports `videoUrl` shorthand. */
export type VideoProps = ItemProps<VideoValues> & {
  /** YouTube/Vimeo URL (auto-parsed) */
  videoUrl?: string;
};

