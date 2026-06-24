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

// ── Agent-friendly prop inputs ───────────────────────────────────────────────
// The canonical value types are stricter than the forms authors (human and AI)
// naturally write — and the flattened semantic props are typed `any`, so the
// wrong form type-checks and renders broken. These widen the public surface to
// the natural forms and replace the `any`; mapSemanticProps normalizes them at
// runtime (see normalizeCssProps / Image propMapper).

/** fontFamily accepts a ready stack object or a bare family-name string. */
export type FontFamilyInput = { label: string; value: string } | string;
/** fontWeight accepts a number, a numeric string, or a CSS keyword. */
export type FontWeightInput =
  | number
  | `${number}`
  | "normal"
  | "bold"
  | "lighter"
  | "bolder";
/** A CSS size: a number (treated as px) or a string ("24px", "50%", "1.5em"). */
export type SizeInput = number | (string & {});
/** Heading levels (h1–h6). */
export type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

/** Shared text/style props, agent-friendly (replace the loose `any` flat keys). */
export type TextStyleProps = {
  fontFamily?: FontFamilyInput;
  fontWeight?: FontWeightInput;
  fontSize?: SizeInput;
  lineHeight?: SizeInput;
  /** Letter spacing — a CSS string ("0.5px", "-0.01em") or a number (px). */
  letterSpacing?: SizeInput;
  color?: string;
};

/** Image `src` accepts a plain URL string or the value object (loosened sizing). */
export type ImageSrcInput =
  | string
  | {
      url: string;
      width?: SizeInput;
      height?: number;
      autoWidth?: boolean;
      maxWidth?: SizeInput;
      [key: string]: unknown;
    };

/** Button component props */
export type ButtonProps = Omit<
  ItemProps<ButtonValues>,
  keyof TextStyleProps | "width"
> &
  TextStyleProps & {
    /** Display width — a number/px pins the button; "100%" makes it full-width. */
    width?: SizeInput;
  };
/** Heading component props */
export type HeadingProps = Omit<
  ItemProps<HeadingValues>,
  keyof TextStyleProps | "headingType"
> &
  TextStyleProps & {
    /** Heading level h1–h6. */
    headingType?: HeadingLevel;
    /** Alias for `headingType`. */
    level?: HeadingLevel;
    /** Heading text (or use children). */
    text?: string;
  };
/** Divider component props */
export type DividerProps = ItemProps<DividerValues>;
/** HTML component props */
export type HtmlProps = ItemProps<HtmlValues>;
/** Paragraph component props */
export type ParagraphProps = Omit<ItemProps<ParagraphValues>, keyof TextStyleProps> &
  TextStyleProps & {
    /** Plain-text content (or use `html` for inline formatting, or children). */
    text?: string;
  };

/** Image component props — supports `alt` shorthand for `altText`. */
export type ImageProps = Omit<
  ItemProps<ImageValues>,
  "src" | "width" | "maxWidth"
> & {
  /** Alt text (alias for altText) */
  alt?: string;
  /** Image URL string, or the value object `{ url, width?, maxWidth?, ... }`. */
  src?: ImageSrcInput;
  /** Display width — number/px pins the image; "50%" sets a percentage width. */
  width?: SizeInput;
  /** Display width as a CSS value ("50%", "300px"). */
  maxWidth?: SizeInput;
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

