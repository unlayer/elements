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
  TableData,
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
  EMPTY_TEXT_JSON,
} from "./utils/lexical-helpers";

// Utils - Value merging
export { mergeValues } from "./utils/merge-values";

// Utils - Meta injection
export { ensureMeta } from "./utils/ensure-meta";

// Utils - Validation
export { validateRequiredPaths } from "./utils/validate-required-paths";

// Utils - Semantic props
export { mapSemanticProps } from "./utils/semantic-props";
export type { SemanticProps } from "./utils/semantic-props";

// Utils - Container rendering
export {
  renderBodyToHtml,
  renderRowToHtml,
  renderColumnToHtml,
} from "./utils/render-container-to-html";
export type {
  RenderBodyConfig,
  RenderRowConfig,
  RenderColumnConfig,
} from "./utils/render-container-to-html";

// Utils - Preview text
export { generatePreviewHtml } from "./utils/preview";

// Utils - HTML to plain text
export { htmlToPlainText } from "./utils/html-to-text";

// Utils - Grid CSS
export { generateGridCSS, getWidthPercentages } from "./utils/grid-css";
export type { GridCSSOptions, WidthPercentage } from "./utils/grid-css";
