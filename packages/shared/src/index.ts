/**
 * @unlayer-internal/shared-elements
 *
 * Framework-agnostic shared logic for Unlayer Elements packages.
 * This package is internal (private: true) and not published to npm.
 */

// Config
export { DEFAULT_CONFIG } from "./config";
export type { UnlayerConfig, HeadConfig } from "./config";

// Types
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
  // Design JSON types
  DesignContent,
  DesignColumn,
  DesignRow,
  DesignBody,
  DesignJSON,
} from "./types";

// Layouts
export {
  ColumnLayouts,
  validateColumnLayout,
} from "./layouts";
export type {
  ColumnLayout,
  ValidColumnLayout,
} from "./layouts";

// Utils - Lexical helpers
export {
  textToTextJson,
  htmlToTextJson,
  generateHtmlFromTextJson,
} from "./utils/lexical-helpers";

// Utils - Value merging
export { mergeValues } from "./utils/merge-values";

// Utils - Semantic props
export { mapSemanticProps } from "./utils/semantic-props";
export type { SemanticProps } from "./utils/semantic-props";

// Utils - HTML to plain text
export { htmlToPlainText } from "./utils/html-to-text";
