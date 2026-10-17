/**
 * What each component writes into a design when given no props (so only what differs needs a prop), and what the
 * builder takes a value missing from a design to be (so a design and its round trip compare as the builder shows
 * them). From the same source as the components: the editor's schema defaults in `@unlayer/exporters`, with the
 * additions each component makes (kept equal to them by codegen's tests).
 */
import {
  ButtonDefaults,
  DividerDefaults,
  HeadingDefaults,
  HtmlDefaults,
  ImageDefaults,
  MenuDefaults,
  ParagraphDefaults,
  SocialDefaults,
  TableDefaults,
  TextDefaults,
  TimerDefaults,
  VideoDefaults,
  BodyDefaults,
} from "@unlayer/exporters";
import { BODY_DEFAULTS, COLUMN_DEFAULTS, ROW_DEFAULTS } from "../utils/container-defaults";
import type { Plain } from "./values";

const { height: _placeholderHeight, ...imageSrc } = ImageDefaults.src as Plain;

/** Each block component's own defaults (its `DEFAULT_VALUES`), by component name. */
export const BLOCK_DEFAULTS: Record<string, Plain> = {
  Paragraph: { ...ParagraphDefaults, color: "#000000" },
  Heading: { ...HeadingDefaults, color: "#000000", fontWeight: 400, text: "Heading" },
  Button: { ...ButtonDefaults, text: "Button" },
  Image: { ...ImageDefaults, src: { ...imageSrc, autoWidth: true, maxWidth: "100%" } },
  Divider: { ...DividerDefaults },
  Html: { ...HtmlDefaults },
  Menu: { ...MenuDefaults },
  Social: { ...SocialDefaults },
  Table: { ...TableDefaults, table: { headers: [], rows: [], footers: [] } },
  Video: { ...VideoDefaults, video: { type: "youtube", videoId: "", thumbnail: "", loading: false, ...(VideoDefaults.video as Plain) } },
  PageBreak: { color: "#6b7280" },
};

/** What renderToJson adds to every block: its padding, and the builder's flags for it. */
export const BLOCK_BASE = { containerPadding: "10px", selectable: true, draggable: true, duplicatable: true, deletable: true, hideable: true };

/** The flags renderToJson always writes as `true` (a design's `false` can't come back through Elements). */
export const ALWAYS_TRUE = ["selectable", "draggable", "duplicatable", "deletable", "hideable"] as const;

export { BODY_DEFAULTS, ROW_DEFAULTS, COLUMN_DEFAULTS };

/** Design content types each block component writes (`paragraph` is the editor's Lexical text, read as `text`). */
export const COMPONENT_OF_TYPE: Record<string, string> = {
  text: "Paragraph",
  paragraph: "Paragraph",
  heading: "Heading",
  button: "Button",
  image: "Image",
  divider: "Divider",
  html: "Html",
  menu: "Menu",
  social: "Social",
  table: "Table",
  video: "Video",
  page_break: "PageBreak",
};

/** Keys every block has in the builder, at the values it takes when they're missing. */
const EDITOR_BLOCK_BASE: Plain = {
  containerPadding: "10px",
  anchor: "",
  hideDesktop: false,
  displayCondition: null,
  _styleGuide: null,
  selectable: true,
  draggable: true,
  duplicatable: true,
  deletable: true,
  hideable: true,
  locked: false,
};

/**
 * What the builder takes a missing value to be, by content type: the schema's defaults (and a heading's weight, which
 * the exporter writes as 400 when it's missing). A text block's missing color is the body's text color (see compare.ts).
 */
export const EDITOR_DEFAULTS: Record<string, Plain> = {
  text: { ...EDITOR_BLOCK_BASE, ...TextDefaults },
  paragraph: { ...EDITOR_BLOCK_BASE, ...ParagraphDefaults },
  heading: { ...EDITOR_BLOCK_BASE, ...HeadingDefaults, fontWeight: 400 },
  button: { ...EDITOR_BLOCK_BASE, ...ButtonDefaults },
  // (An image without `autoWidth` and `maxWidth` is sized automatically, as the exporter reads it.)
  image: { ...EDITOR_BLOCK_BASE, ...ImageDefaults, src: { ...(ImageDefaults.src as Plain), autoWidth: true, maxWidth: "100%" } },
  divider: { ...EDITOR_BLOCK_BASE, ...DividerDefaults },
  html: { ...EDITOR_BLOCK_BASE, ...HtmlDefaults },
  menu: { ...EDITOR_BLOCK_BASE, ...MenuDefaults },
  social: { ...EDITOR_BLOCK_BASE, ...SocialDefaults },
  table: { ...EDITOR_BLOCK_BASE, ...TableDefaults },
  // (A video block without a video: no type, id or thumbnail, as Elements' empty one.)
  video: { ...EDITOR_BLOCK_BASE, ...VideoDefaults, video: { type: "youtube", videoId: "", thumbnail: "", loading: false, ...(VideoDefaults.video as Plain) } },
  timer: { ...EDITOR_BLOCK_BASE, ...TimerDefaults },
  page_break: { ...EDITOR_BLOCK_BASE, color: "#6b7280" },
};

export const editorBlockDefaults = (type: string): Plain => EDITOR_DEFAULTS[type] ?? EDITOR_BLOCK_BASE;

/** The builder's defaults for the containers (the body's popup settings included). */
export const EDITOR_BODY_DEFAULTS: Plain = { ...BodyDefaults };
export const EDITOR_ROW_DEFAULTS: Plain = { ...ROW_DEFAULTS, hideDesktop: false };
export const EDITOR_COLUMN_DEFAULTS: Plain = { ...COLUMN_DEFAULTS };
