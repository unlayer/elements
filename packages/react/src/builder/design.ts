/**
 * The builder's design JSON from the rows, columns and blocks toDesign() makes of a template (raise.ts): each part's
 * values are its tool's defaults with its own fields written in, numbered as the builder numbers them (`u_row_1`,
 * `u_content_text_2`, the design's `counters`), and then its values from the template merged over them. Key for key,
 * it's the design Elements 0.2's renderToJson() wrote for the same parts, which designs saved in the builder since
 * then hold.
 */
import {
  BodyDefaults,
  ButtonDefaults,
  ColumnDefaults,
  DividerDefaults,
  HeadingDefaults,
  HtmlDefaults,
  ImageDefaults,
  MenuDefaults,
  ParagraphDefaults,
  RowDefaults,
  schemaVersion,
  SocialDefaults,
  VideoDefaults,
} from "./tool-defaults";
import { merge } from "./hide";
import type { Values } from "./values";

/** The builder's tools toDesign() writes blocks as, by their type in the design. */
export type Tool = "heading" | "text" | "button" | "image" | "divider" | "menu" | "social" | "video" | "html" | "page_break";

/** Where a row or a block is hidden: the builder's `_override.mobile.hideMobile` and `_override.desktop.hideDesktop`. */
export interface Hiding {
  hideOnMobile?: boolean;
  hideOnDesktop?: boolean;
}

/** A block: its tool, where it's hidden, and its values, merged over the tool's defaults. */
export interface Block {
  tool: Tool;
  hiding: Hiding;
  values: Values;
}

/** A block of a tool, hidden where `hiding` says, its values to come. */
export const block = (tool: Tool, hiding: Hiding = {}): Block => ({ tool, hiding, values: {} });

/** A column's own fields: its padding, background, border and corners. */
export interface ColumnFields {
  padding: string;
  backgroundColor?: string;
  border?: Values;
  borderRadius?: string;
}

/** A column: its fields, its values merged over them, and its blocks. */
export interface Column {
  fields: ColumnFields;
  values: Values;
  contents: Block[];
}

/** A column of these fields holding these blocks, its values to come. */
export const columnWith = (fields: ColumnFields, contents: Block[]): Column => ({ fields, values: {}, contents });

/** A row's own fields: its padding, its background and its columns', whether they stay side by side on phones, where it's hidden. */
export interface RowFields extends Hiding {
  padding: string;
  backgroundColor?: string;
  columnsBackgroundColor?: string;
  noStackMobile?: boolean;
}

/** A row: its columns' widths (`cells`), its fields, its values merged over them, and its columns. */
export interface Row {
  cells: number[];
  fields: RowFields;
  values: Values;
  columns: Column[];
}

/** A row of these columns, `cells` their widths, its values to come. */
export const rowWith = (cells: number[], fields: RowFields, columns: Column[]): Row => ({ cells, fields, values: {}, columns });

/** The body's fields: the content's width, text color and font, its weight and direction, a Document's paper. */
export interface BodyFields {
  contentWidth: string;
  textColor?: string;
  fontFamily: { label: string; value: string };
  fontWeight?: number;
  textDirection?: string;
  documentSize?: string;
  documentOrientation?: string;
}

/** A template as the builder's parts: its root, its body's fields and values, its rows, and a Document's header and footer rows. */
export interface Body {
  root: "Email" | "Page" | "Document";
  fields: BodyFields;
  /** An Email's preview text, the builder's `preheaderText`. */
  previewText?: string;
  values: Values;
  rows: Row[];
  headers?: Row[];
  footers?: Row[];
}

type DesignRow = { cells: number[]; columns: Array<{ contents: Array<{ type: string; values: Values }>; values: Values }>; values: Values };
export type Design = { counters?: Record<string, number>; schemaVersion?: number; body: { rows: DesignRow[]; values: Values; headers?: DesignRow[]; footers?: DesignRow[] } };

/** The schema version whose document margin is the one written (an older one's "96px" the builder reads as its preset). */
const DOCUMENT_SCHEMA = 28;

/** A copy of defaults, so a design's values share nothing with them (or with another design's). */
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));

/** The body's defaults, but a popup's (a display mode toDesign() doesn't write). */
const BODY = Object.fromEntries(Object.entries(BodyDefaults).filter(([key]) => !key.startsWith("popup")));

/** Each tool's values before a block's: the builder's defaults, with what Elements 0.2's components added to them. */
const TOOLS: Record<Tool, Values> = {
  heading: { ...HeadingDefaults, color: "#000000", fontWeight: 400, text: "Heading" },
  text: { ...ParagraphDefaults, color: "#000000" },
  button: { ...ButtonDefaults, text: "Button" },
  // The placeholder's size without its height, as wide as its column.
  image: { ...ImageDefaults, src: { url: ImageDefaults.src.url, width: ImageDefaults.src.width, autoWidth: true, maxWidth: "100%" } },
  divider: DividerDefaults,
  menu: MenuDefaults,
  social: SocialDefaults,
  video: { ...VideoDefaults, video: { type: "youtube", videoId: "", thumbnail: "", loading: false, ...VideoDefaults.video } },
  html: HtmlDefaults,
  page_break: { color: "#6b7280" },
};

/** What the builder lets a user do with a row or a block. */
const EDITABLE = { selectable: true, draggable: true, duplicatable: true, deletable: true, hideable: true };

/** A template's parts as the builder's design JSON. */
export function writeParts(body: Body): Design {
  const counters: Record<string, number> = {};
  const next = (key: string) => (counters[key] = (counters[key] ?? 0) + 1);
  const rowsOf = (rows: Row[], kind = "u_row") => rows.map((row) => designRow(row, `${kind}_${next(kind)}`, kind, next));
  const design: Design = { counters, body: { rows: rowsOf(body.rows), values: merge(bodyValues(body), body.values) }, schemaVersion };
  if (body.headers && body.footers) {
    // A Document's header and footer: the builder's `headers` and `footers`, rows numbered after the body's.
    design.schemaVersion = Math.max(schemaVersion, DOCUMENT_SCHEMA);
    design.body.headers = rowsOf(body.headers, "u_header");
    design.body.footers = rowsOf(body.footers, "u_footer");
  }
  if (body.root === "Document") documentMargin(design.body.values);
  return design;
}

/** A row, its columns and their blocks, numbered in that order, each part's values from the template over its own. */
function designRow(row: Row, htmlID: string, htmlClassNames: string, next: (key: string) => number): DesignRow {
  const { hideOnMobile, hideOnDesktop, noStackMobile, ...fields } = row.fields;
  const override = hidingOverride({ hideOnMobile, hideOnDesktop });
  // Whether its columns stay side by side on phones is a phone value, as the builder saves it.
  if (noStackMobile) override.mobile = { ...override.mobile, noStackMobile: true };
  const values = {
    ...withFields(RowDefaults, { ...colored(fields), ...(noStackMobile ? { noStackMobile: false } : {}), ...(Object.keys(override).length ? { _override: override } : {}) }),
    cells: row.cells,
    _meta: { htmlID, htmlClassNames },
    ...EDITABLE,
  };
  const columns = row.columns.map((column) => {
    const own = { ...colored(column.fields), ...(column.fields.border ? { border: colored(column.fields.border) } : {}) };
    const values = { ...withFields(ColumnDefaults, own), _meta: { htmlID: `u_column_${next("u_column")}`, htmlClassNames: "u_column" } };
    return { contents: column.contents.map((block) => content(block, next)), values: merge(values, column.values) };
  });
  return { cells: row.cells, columns, values: merge(values, row.values) };
}

/** A block as the builder's item: its tool's defaults, where it's hidden, its id and class. */
function content(block: Block, next: (key: string) => number): { type: string; values: Values } {
  const base = `u_content_${block.tool}`;
  const override = hidingOverride(block.hiding);
  const values = {
    containerPadding: "10px",
    ...copy(TOOLS[block.tool]),
    ...(Object.keys(override).length ? { _override: override } : {}),
    _meta: { htmlID: `${base}_${next(base)}`, htmlClassNames: base },
    ...EDITABLE,
  };
  return { type: block.tool, values: merge(values, block.values) };
}

/** The body's values: its fields over the builder's defaults, an Email's preview text, its id. */
function bodyValues(body: Body): Values {
  const values = withFields(BODY, { ...body.fields, textColor: body.fields.textColor === undefined ? undefined : exportedColor(body.fields.textColor), fontFamily: font(body.fields.fontFamily) });
  // Only ltr, rtl or auto, as in the HTML.
  if ("textDirection" in values) {
    const direction = typeof values.textDirection === "string" ? values.textDirection.trim().toLowerCase() : "";
    if (direction === "ltr" || direction === "rtl" || direction === "auto") values.textDirection = direction;
    else delete values.textDirection;
  }
  if (body.previewText !== undefined) values.preheaderText = body.previewText;
  values._meta = { htmlID: "u_body", htmlClassNames: "u_body" };
  return values;
}

/** Fields written over defaults: one the defaults have keeps its place, another goes after them; one not given isn't written. */
function withFields(defaults: Values, fields: Values): Values {
  const out = copy(defaults);
  for (const [key, value] of Object.entries(fields)) if (value !== undefined) out[key] = value;
  return out;
}

/** Where a part is hidden, as the builder's phone and desktop values. */
function hidingOverride({ hideOnMobile, hideOnDesktop }: Hiding): Values {
  return { ...(hideOnMobile !== undefined ? { mobile: { hideMobile: hideOnMobile } } : {}), ...(hideOnDesktop !== undefined ? { desktop: { hideDesktop: hideOnDesktop } } : {}) };
}

/** Values with each color (`color`, `…Color`) as the builder's exporters read one (see `exportedColor`). */
function colored(values: Values): Values {
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, typeof value === "string" && (key === "color" || key.endsWith("Color")) ? exportedColor(value) : value]));
}

/** One digit's reading in a color's channel, which can't backtrack on a long value. */
const CHANNEL = /^-?(?:\d+(?:\.\d*)?|\.\d+)%?$/;

/**
 * A color as the builder's exporters read one: rgb() and rgba() in any CSS syntax as "#rrggbb", or "rgba(r, g, b, a)"
 * where it's translucent (they write Outlook's `bgcolor` from hex or that form only); any other as it is.
 */
function exportedColor(value: string): string {
  const text = value.trim();
  const open = text.indexOf("(");
  if (!/^rgba?$/i.test(text.slice(0, open)) || !text.endsWith(")")) return value;
  const [rgb, slashed, extra] = text.slice(open + 1, -1).split("/");
  const channels = rgb.trim().split(/\s*,\s*|\s+/);
  if (slashed !== undefined) channels.push(slashed.trim());
  if (extra !== undefined || channels.length > 4 || channels.length < (slashed === undefined ? 3 : 4) || !channels.every((c) => CHANNEL.test(c))) return value;
  const num = (part: string, full: number) => (part.endsWith("%") ? (parseFloat(part) / 100) * full : parseFloat(part));
  const [r, g, b] = channels.slice(0, 3).map((part) => Math.max(0, Math.min(255, Math.round(num(part, 255)))));
  const alpha = channels[3] === undefined ? 1 : num(channels[3], 1);
  if (alpha < 1) return `rgba(${r}, ${g}, ${b}, ${Math.max(0, alpha)})`;
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

/** A font as the builder's exporters write it into `style=""`: family names quoted with ' (an apostrophe in one escaped). */
const fontStack = (stack: string) => stack.replace(/"([^"]*)"?/g, (_, name: string) => `'${name.replace(/'/g, "\\'")}'`);
const font = (value: { label: string; value: string }) => ({ label: fontStack(value.label), value: fontStack(value.value) });

/** A Document's margin: the builder has one for every side, the widest; the template's sides, where they differ, stay hidden. */
function documentMargin(values: Values) {
  const sides = values.margin;
  if (typeof sides !== "string") return;
  const widths = sides.split(/\s+/).map((part) => parseFloat(part) || 0);
  values.documentMargin = `${Math.max(...widths)}px`;
  if (new Set(widths).size === 1) delete values.margin;
}
