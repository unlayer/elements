// Auto-generated react index file
import Button from "./components/Button";
import Divider from "./components/Divider";
import Heading from "./components/Heading";
import Html from "./components/Html";
import Image from "./components/Image";
import Menu from "./components/Menu";
import Paragraph from "./components/Paragraph";
import Social from "./components/Social";
import Table from "./components/Table";
import Video from "./components/Video";
import Row from "./components/Row";
import Column from "./components/Column";
import Body from "./components/Body";
import Email from "./components/Email";
import Page from "./components/Page";
import Document from "./components/Document";
import {
  ColumnLayouts,
  validateColumnLayout,
  type ColumnLayout,
  type ValidColumnLayout
} from "./layouts/ColumnLayouts";
import { UnlayerProvider, useUnlayerConfig } from "./context";
import { renderToHtml, renderToPlainText, renderToHtmlParts } from "./utils/render-to-html";
export type { HtmlParts } from "./utils/render-to-html";
import { renderToJson, renderRowToJson } from "./utils/render-to-json";
import { htmlToTextJson } from "@unlayer-internal/shared-elements";

// 🎯 Export clean public types (hiding internal implementation details)
export type {
  // Clean component prop types
  ButtonProps,
  DividerProps,
  HeadingProps,
  HtmlProps,
  ImageProps,
  MenuProps,
  ParagraphProps,
  SocialProps,
  TableProps,
  VideoProps,
  // Value types for configuration
  ButtonValues,
  DividerValues,
  HeadingValues,
  HtmlValues,
  ImageValues,
  MenuValues,
  ParagraphValues,
  SocialValues,
  TableValues,
  VideoValues,
  // Container value types
  BodyValues,
  RowValues,
  ColumnValues,
  ContentValues,
  // Shared sub-types
  Href,
  Icons,
  VideoSource,
  TextAlign,
  LinkStyle,
  // Shorthand types
  SocialIcon,
  MenuItem,
} from "./types";

// Design JSON types (re-export from shared)
export type {
  DesignJSON,
  DesignBody,
  DesignRow,
  DesignColumn,
  DesignContent,
} from "@unlayer-internal/shared-elements";

// Export Row props separately since it has a custom interface
export type { RowProps } from "./components/Row";

// Export semantic wrapper prop types
export type { EmailProps } from "./components/Email";
export type { PageProps } from "./components/Page";
export type { DocumentProps } from "./components/Document";

// Export context (UnlayerProvider, useUnlayerConfig, UnlayerConfig type)
export type { UnlayerConfig, UnlayerProviderProps } from "./context";
export { DEFAULT_CONFIG } from "./context";

// Export individual renderers
export {
  Button,
  Divider,
  Heading,
  Html,
  Image,
  Menu,
  Paragraph,
  Social,
  Table,
  Video,
  Row,
  Column,
  Body,
  Email,
  Page,
  Document,
  ColumnLayouts,
  validateColumnLayout,
  UnlayerProvider,
  useUnlayerConfig,
  renderToHtml,
  renderToPlainText,
  renderToHtmlParts,
  renderToJson,
  renderRowToJson,
  htmlToTextJson,
  type ColumnLayout,
  type ValidColumnLayout
};

