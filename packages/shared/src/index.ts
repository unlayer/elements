/**
 * @unlayer-internal/shared-elements
 *
 * Framework-agnostic shared logic for Unlayer Elements packages.
 * This package is internal (private: true) and not published to npm.
 */

// Config
export { DEFAULT_CONFIG } from "./config";
export type { UnlayerConfig, HeadConfig } from "./config";
export { RenderError, type OnError } from "./render-error";

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
  PageBreakValues,
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
  LooseValue,
  ValuesInput,
  MobileProps,
  DeviceProps,
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
  textJsonToText,
} from "./utils/lexical-helpers";

// Utils - Value merging
export { mergeValues } from "./utils/merge-values";
export { codePoint, entities } from "./utils/entities";
export { cssValueSafe, normalizeColor, normalizeCssValues, normalizeFontStack, pxMerged, pxZeros } from "./utils/css-values";

// Utils - Semantic props
export {
  escapeText,
  escapeKeepingTags,
  mapSemanticProps,
  isContentProp,
  PROP_ALIASES,
  normalizeLinkValue,
  unrunLinks,
  unrunUrl,
  safeVideoId,
  normalizeValuesForExporter,
} from "./utils/semantic-props";
export type { SemanticProps } from "./utils/semantic-props";

// Utils - HTML to plain text
export { htmlToPlainText, type PlainTextOptions } from "./utils/html-to-text";
