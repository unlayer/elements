/**
 * Type Definitions
 *
 * Re-exports the canonical value types from @unlayer-internal/shared-elements
 * and defines the agent-friendly input types components build their props from.
 *
 * Each component's prop type (ButtonProps, HeadingProps, …) lives next to its
 * component — these are just the shared building blocks they share.
 */

// ============================================
// RE-EXPORT SHARED VALUE TYPES
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
// AGENT-FRIENDLY INPUT TYPES
// ============================================
// The canonical value types are stricter than the forms authors (human and AI)
// naturally write. These widen the public surface to the natural forms; the
// runtime normalizes them at render time. Components import these to build their
// own prop types.

// Imported locally (not just re-exported) so BorderInput can be derived from the
// canonical border shape.
import type { ColumnValues } from "@unlayer-internal/shared-elements";

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

/**
 * The `border` object, agent-friendly. The canonical type pins each per-side
 * `*Width` to `${number}px`, so a literal like "1px" type-checks inline but a
 * factored-out object widens "1px" to `string` and stops compiling — exactly the
 * reusable-divider pattern authors reach for. Relax the `*Width` fields to
 * SizeInput (the runtime accepts any CSS string), derived from the canonical
 * shape so it tracks the schema instead of duplicating it.
 */
export type BorderInput = {
  [K in keyof NonNullable<ColumnValues["border"]>]?: K extends `${string}Width`
    ? SizeInput
    : NonNullable<ColumnValues["border"]>[K];
};

/** Heading levels (h1–h6). */
export type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

/** Shared text/style inputs, agent-friendly. */
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
