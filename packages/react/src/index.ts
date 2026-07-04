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
export type { HtmlParts, RenderToHtmlOptions } from "./utils/render-to-html";
import { renderToJson, renderRowToJson } from "./utils/render-to-json";
import { htmlToTextJson } from "@unlayer-internal/shared-elements";

// 🎯 Export clean public types (hiding internal implementation details)
export type {
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
  // Agent-friendly input building blocks — exported so authors can annotate
  // their own factored-out helpers/consts (e.g. a shared border or text style).
  SizeInput,
  BorderInput,
  TextStyleProps,
  FontFamilyInput,
  FontWeightInput,
  HeadingLevel,
  ImageSrcInput,
} from "./types";

// Design JSON types (re-export from shared)
export type {
  DesignJSON,
  DesignBody,
  DesignRow,
  DesignColumn,
  DesignContent,
} from "@unlayer-internal/shared-elements";

// Component prop types — each lives with its component (single source of truth).
export type { ButtonProps } from "./components/Button";
export type { DividerProps } from "./components/Divider";
export type { HeadingProps } from "./components/Heading";
export type { HtmlProps } from "./components/Html";
export type { ImageProps } from "./components/Image";
export type { MenuProps } from "./components/Menu";
export type { ParagraphProps } from "./components/Paragraph";
export type { SocialProps } from "./components/Social";
export type { TableProps } from "./components/Table";
export type { VideoProps } from "./components/Video";
export type { RowProps } from "./components/Row";
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

