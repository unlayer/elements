/**
 * A template of today's components, by its design (what renderToJson returns: the builder's JSON), as the new
 * engine's tree. The body is the Email or Page; each row a Section around a Row of its columns; each block what
 * `block()` makes of it (its new component, or a Raw node with its legacy HTML). Where legacy draws something other
 * than the design asks, the tree draws it as legacy does (quirks.ts).
 */
import type React from "react";
import { line, parseColor, type Diagnostic, type Json } from "@unlayer-internal/elements-core";
import { EMAIL_PHONE_MARGIN } from "@unlayer-internal/elements-exporters";
import { escapeKeepingTags, type UnlayerConfig } from "@unlayer-internal/shared-elements";
import { safeName, textDirectionOf, UNLAYER_CONFIG_KEY, UNLAYER_RENDER_KEY } from "../utils/create-component";
import { collectDeviceStyles, cssValue, deviceStylesCss } from "../utils/device-overrides";
import { contentSlotWidth, DEFAULT_CONTAINER_PADDING } from "../utils/image-sizing";
import { documentBodyPicture, ownMarkupCss, pageBodyColor, pageMargin, pictureCss, pictureOf, rowColorInEmail, rowOffsetInEmail, rowPaddingInEmail, type Picture } from "./quirks";
import { ALIGN, attribute, color, fontWeight, lineHeight, px, sides, some, type Values } from "./values";

/** A block of the design: its tool and values. */
export interface DesignBlock {
  type: string;
  slug?: string;
  values: Values;
}

export interface TreeNode {
  type: string;
  id?: string;
  props?: Record<string, Json>;
  style?: Record<string, Json>;
  mobile?: Record<string, Json>;
  hover?: Record<string, Json>;
  hidden?: { mobile?: boolean; desktop?: boolean };
  children?: Array<TreeNode | string>;
  compat?: Record<string, Json>;
  /**
   * What it reads as in legacy's plain text, where its own markup reads otherwise (written for the plain text only;
   * see render.ts). Not the new engine's: left out of the tree it writes.
   */
  textAs?: TreeNode;
  /** A column of the design's (not one a block is drawn in), for the plain text's lines. */
  designColumn?: true;
}

/** The legacy output a template renders to: its root's (Email, Page, Document), or the config's. */
export type Mode = "email" | "web" | "document";

/** Where a block is, as its tool's exporter reads it: the body, its row and column, and the render's config. */
export interface Place {
  mode: Mode;
  body: Values;
  row: Values;
  column: Values;
  /** The row's column shares, and the block's column among them. */
  cells: number[];
  index: number;
  config: Partial<UnlayerConfig>;
  /**
   * The block's values as its exporter gets them (its props mapped, defaults in), where they hold what the design
   * doesn't: a text's Lexical textJson, whose formatting the design's plain `text` leaves out.
   */
  source?: Values;
  /** The block's id, as a render numbers it. */
  id?: string;
  /** Says what's drawn otherwise than the block asks: a diagnostic of the render. */
  note(message: string, severity?: "warning" | "info"): void;
  /** Text with its email service's tags (or what `pattern` finds) kept out of the writers' escaping (render.ts puts them back). */
  keep(text: string, pattern?: RegExp): string;
}

/** Where a block is, as the design says it. */
export type FramePlace = Omit<Place, "source" | "id" | "note" | "keep">;

/** What a template holds beside its design, which legacy draws. */
export interface OutsideTheDesign {
  /** The markup before each row, and after the last. */
  among: string[];
  rows: Array<{
    /** Its values as its exporter gets them, where they aren't the design's (no defaults). */
    values?: Values;
    /** The start and end of the <div> a Row's own className and style are on, around it. */
    around?: [string, string];
    /** Text straight in it, as HTML: what's before each of its columns, and after the last. */
    text: string[];
    /** Each of its columns' text, as HTML: what's before each of its blocks, and after the last. */
    columns: string[][];
  }>;
}

export interface LowerOptions {
  mode: Mode;
  config?: Partial<UnlayerConfig>;
  /** A block as a node of the tree, or null where it draws nothing in this output. */
  block(block: DesignBlock, place: FramePlace): TreeNode | null;
  outside?: OutsideTheDesign;
  /** Rendered by React into a page of someone else's, whose margin is its own. */
  embedded?: boolean;
  /** On a page, as wide as what it's in: a Column or block on its own, which no content width keeps. */
  wide?: boolean;
  /** Of the frame's class names, so that another render's on the same page can't be taken for them. */
  names?: string;
}

/**
 * Where a block, column or row is hidden: on desktop, or on phones, by its overrides (legacy reads only these: a flat
 * `hideDesktop` or `hideMobile` in its values hides nothing).
 */
export function hidden(values: Values): TreeNode["hidden"] {
  const desktop = !!values._override?.desktop?.hideDesktop;
  const mobile = !!values._override?.mobile?.hideMobile;
  return desktop || mobile ? { ...(desktop ? { desktop } : {}), ...(mobile ? { mobile } : {}) } : undefined;
}

/** What lowering a template's frame (its body, rows and columns) gathers beside the tree. */
interface Frame {
  mode: Mode;
  /** The email's width. */
  width: number;
  /** Rules for what no style holds, under class names of their own. */
  rules: string[];
  /** Rules for its rows' and columns' settings for a device. */
  device: Record<string, string[]>;
  names: number;
  notes: Diagnostic[];
  /** Whether markup or text of the template's is in the tree (it takes what legacy's stylesheet gives it). */
  loose: boolean;
  /** Where its rows' content sits across the window. */
  contentAlign?: "left" | "right" | "center";
  /** An email's class for a content width that isn't in px. */
  contentWidth?: string;
  /** An email's class for a Section whose cells may run past its content's table. */
  fixedTable?: string;
  /** What's in its class names, where another render's are on the same page. */
  namedAfter: string;
  /** Rows no content width keeps (see LowerOptions). */
  wide?: boolean;
}

/** Said of the frame. A warning where it's drawn otherwise than asked; a note where legacy draws nothing of it either. */
function say(frame: Frame, severity: Diagnostic["severity"], message: string, path: string): void {
  frame.notes.push({ code: "compat/frame", severity, message, path });
}

const isEmpty = (value: unknown) => value === undefined || value === null || value === "" || value === false || (typeof value === "object" && !Array.isArray(value) && !Object.keys(value).length);

/**
 * The values of a row, a column or the body that the lowering reads, or that draw nothing in legacy's output (the
 * editor's flags, a value only a popup reads, a document's page size, which the PDF takes). Any other value that isn't
 * empty draws nothing in legacy's output either: it's noted.
 */
const READ = {
  row: new Set(["displayCondition", "backgroundColor", "columnsBackgroundColor", "backgroundImage", "padding", "noStackMobile", "cells", "anchor", "alignItems", "_meta", "_override", "hideDesktop", "hideMobile", "selectable", "draggable", "duplicatable", "deletable", "hideable", "locked"]),
  column: new Set(["backgroundColor", "padding", "border", "borderRadius", "_meta", "_override", "hideDesktop", "hideMobile", "deletable", "locked"]),
  body: new Set(["textDirection", "borderRadius", "contentAlign", "contentVerticalAlign", "contentWidth", "fontFamily", "fontSize", "fontWeight", "lineHeight", "textColor", "backgroundColor", "documentSize", "documentOrientation", "documentMargin", "preheaderText", "linkStyle", "backgroundImage", "_meta"]),
};

/** What of a frame's settings for a device legacy draws (the rest, with what it doesn't read in its values, is noted). */
const DRAWN = { row: ["padding", "noStackMobile", "hideMobile", "hideDesktop"], column: ["padding", "border"], body: [] as string[] };

function unread(values: Values, what: keyof typeof READ, frame: Frame, path: string): void {
  for (const [key, value] of Object.entries(values)) {
    if (!READ[what].has(key) && !isEmpty(value)) say(frame, "info", `A ${what}'s ${key} ${JSON.stringify(value)} draws nothing`, `${path}.values.${key}`);
  }
  // Tablets: legacy writes a class for a block hidden on one and no rule for it, and no rule at all for anything else.
  if (Object.keys(values._override?.tablet ?? {}).length) say(frame, "info", `A ${what}'s settings for tablets draw nothing`, `${path}.values._override.tablet`);
  for (const device of ["desktop", "mobile"]) {
    for (const key of Object.keys(values._override?.[device] ?? {})) {
      if (!DRAWN[what].includes(key)) say(frame, "info", `A ${what}'s ${key} for ${device === "mobile" ? "phones" : "desktop windows"} draws nothing`, `${path}.values._override.${device}.${key}`);
    }
  }
}

/** A value CSS holds where no style does; said where it can't be written. */
function written(value: unknown, what: string, frame: Frame, path: string): string | undefined {
  const text = cssValue(value);
  if (text === undefined) say(frame, "warning", `${what} ${JSON.stringify(value)} can't be written in CSS, so it isn't drawn`, path);
  return text;
}

/** A class of the frame's own, with these declarations. */
function ruled(frame: Frame, declarations: string[]): string {
  const name = `u-frame-${frame.namedAfter}${++frame.names}`;
  if (declarations.length) frame.rules.push(`.${name} { ${declarations.join("; ")}; }`);
  return name;
}

/** Sides the new engine takes; others (in em, in %) are written in `css` as legacy writes them, for the browser to draw or not. */
function sidesOr(css: string[], value: unknown, what: string, frame: Frame, path: string) {
  const out = sides(value);
  if (out || isEmpty(value)) return out;
  const text = written(value, what, frame, path);
  if (text) css.push(`padding: ${text}`);
  return undefined;
}

/** A color the new engine takes; another (hsl(), a variable) is written in `css` as legacy writes it. */
function colorOr(css: string[], property: string, value: unknown, what: string, frame: Frame, path: string): string | undefined {
  const named = color(value);
  if (named === undefined || parseColor(named).ok) return named;
  const text = written(named, what, frame, path);
  if (text) css.push(`${property}: ${text}`);
  return undefined;
}

/**
 * A column's lines the new engine takes; another (of a width in em, a style it doesn't read) is written in `css` as
 * legacy writes it. A side of no width has none; a side with no color is transparent.
 */
function linesOr(css: string[], values: Values | undefined, frame: Frame, path: string): Record<string, Json> | undefined {
  const out: Record<string, Json> = {};
  for (const side of ["Top", "Right", "Bottom", "Left"]) {
    const width = values?.[`border${side}Width`];
    if (isEmpty(width) || !parseFloat(String(width))) continue;
    const style = values?.[`border${side}Style`] || "solid";
    const lineColor = values?.[`border${side}Color`] || "transparent";
    const parsed = px(width);
    if (parsed !== undefined && line().parse({ width: parsed, style, color: lineColor }).ok) out[side.toLowerCase()] = { width: parsed, style, color: lineColor };
    else {
      const text = written(`${width} ${style} ${lineColor}`, "A column's line", frame, path);
      if (text) css.push(`border-${side.toLowerCase()}: ${text}`);
    }
  }
  return Object.keys(out).length ? out : undefined;
}

/**
 * A class for a row's or column's settings for a device, whose rules legacy's own function writes (at legacy's 480px on
 * either side, whatever the output): undefined where it has none that draw.
 */
function deviceClass(values: Values, collection: "rows" | "columns", frame: Frame, path: string): string | undefined {
  const { desktop = {}, mobile = {} } = values._override ?? {};
  const set = (key: string) => key in desktop || key in mobile;
  if (!set("padding") && !set("border")) return undefined;
  const name = ruled(frame, []);
  const what = collection === "rows" ? "A row" : "A column";
  collectDeviceStyles(values, collection, frame.mode, frame.device, name, (key, value, on) => say(frame, "warning", `${what}'s ${key} on ${on === "mobile" ? "phones" : "desktop"} ${JSON.stringify(value)} can't be written in CSS, so it isn't drawn`, `${path}.values._override.${on}.${key}`));
  return name;
}

/** An id its author gave a row, column or block (legacy writes it; the ids it numbers itself aren't written). */
export function givenId(values: Values): string | undefined {
  const id = values._meta?.htmlID;
  return typeof id === "string" && id && !/^u_(row|column|body|content_[a-z0-9_]+)_?\d*$/.test(id) ? safeName(id) || undefined : undefined;
}

/** A node with the id its author gave it, whatever it holds (`compat.anyId`): legacy writes any id. */
export function withGivenId<T extends TreeNode>(node: T, id: string | undefined): T {
  if (!id) return node;
  return { ...node, id, ...(/^[A-Za-z][A-Za-z0-9_-]*$/.test(id) ? {} : { compat: { ...node.compat, anyId: true } }) };
}

/** Class names its author gave a row or a column, which legacy writes (users' CSS scopes on them), and the frame's own. */
function classNames(values: Values, own: string, ...more: Array<string | undefined>): string | undefined {
  const names = values._meta?.htmlClassNames;
  const given = typeof names === "string" && names.trim() !== own ? safeName(names, true).trim() : undefined;
  return [given, ...more].filter(Boolean).join(" ") || undefined;
}

/** What a block's box says: its id and class, its padding, where it's hidden. */
export interface ContentBox {
  id: string;
  className: string;
  padding: unknown;
  override?: { desktop?: Values; tablet?: Values; mobile?: Values };
}

/**
 * A block's own HTML in the box today's components write around it, byte for byte: users' head CSS scopes on its id
 * and class, its phone padding selects its `v-container-padding-padding`, and its `hide-*` classes hide it (the head
 * has their rules: deviceVisibilityCss). A page's and a printed document's box is a <div>; a printed document's has
 * the template's font and hides nothing; an email's is a table, with the font on the table and on its cell, and one
 * hidden on desktop isn't there for Outlook or until the head's rules say so.
 */
export function contentBox(html: string, box: ContentBox, font: unknown, mode: Mode): string {
  // In attributes: what a value holds can't end one.
  const id = attribute(box.id);
  const className = attribute(box.className);
  const padding = attribute(box.padding);
  const family = attribute(font);
  const { desktop, tablet, mobile } = box.override ?? {};
  const hide = `${desktop?.hideDesktop ? " hide-desktop" : ""}${tablet?.hideTablet ? " hide-tablet" : ""}${mobile?.hideMobile ? " hide-mobile" : ""}`;
  if (mode === "document") return `\n  <div id="${id}" data-page-row="${id}" class="${className} v-container-padding" style="overflow-wrap: break-word;${padding && `padding: ${padding};`}${family && `font-family: ${family};`}">\n    ${html}\n  </div>\n`;
  if (mode !== "email") return `\n  <div id="${id}" class="${className} v-container-padding-padding${hide}" style="overflow-wrap: break-word;padding: ${padding};">\n    ${html}\n  </div>\n`;
  const byDefault = !!desktop?.hideDesktop;
  const table = `\n<table id="${id}" class="${className}${byDefault ? " hide-default__display-table" : ""}${hide}" style="${byDefault ? "display: none;mso-hide: all;" : ""}font-family:${family};" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">\n  <tbody>\n    <tr>\n      <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:${padding};font-family:${family};" align="left">\n        ${html}\n      </td>\n    </tr>\n  </tbody>\n</table>\n`;
  return byDefault ? `<!--[if !mso]><!-->${table}<!--<![endif]-->` : table;
}

/** A block's id and class base: a custom tool's (custom_<slug>), else its component's name. */
export const blockName = (type: any): string => type?.[UNLAYER_CONFIG_KEY]?.metaName ?? (type?.displayName || type?.name || "component").toLowerCase();

/** Where a block is, as today's Body, Row and Column give it to its exporter. */
export interface BlockFrame {
  colIndex: number;
  cells: number[];
  bodyValues: Values;
  rowValues: Values;
  columnValues: Values;
}

/**
 * A block as a Column writes it: its markup (its exporter's, or what a component of the user's rendered) in its box,
 * and what's read for it in the plain text where that isn't its markup (a Row or Column placed there, drawn on its own).
 * Undefined where it has no markup (its exporter failed, which it says).
 */
export function writeBlock(element: React.ReactElement<any>, id: string, frame: BlockFrame, mode: Mode, config: unknown): { html: string; text?: string } | undefined {
  const type = element.type as any;
  const rendered = (type[UNLAYER_RENDER_KEY] ?? type)({ ...element.props, _config: config, _metaHtmlId: id, ...frame });
  const inner = rendered?.props?.dangerouslySetInnerHTML;
  if (!inner) {
    if (rendered) console.warn(`Column: <${type.displayName || type.name || "Unknown"}> did not produce renderable HTML. Ensure it is an Unlayer component (Button, Text, Image, etc.).`);
    return undefined;
  }
  const own = type[UNLAYER_CONFIG_KEY];
  const { containerPadding, values, hideOnMobile, hideOnDesktop } = element.props;
  const padding = containerPadding ?? values?.containerPadding ?? DEFAULT_CONTAINER_PADDING;
  // A custom tool's props are its own values: a `hideOnMobile` of its own isn't a device setting.
  const device = own?.contentType !== "custom";
  const override = values?._override;
  const html = contentBox(
    inner.__html,
    {
      id: values?._meta?.htmlID ? safeName(values._meta.htmlID) : id,
      className: `u_content_${blockName(type)}`,
      // A bare number is in px.
      padding: typeof padding === "number" ? `${padding}px` : padding,
      override: {
        ...override,
        mobile: { ...override?.mobile, ...(device && hideOnMobile !== undefined ? { hideMobile: hideOnMobile } : {}) },
        desktop: { ...override?.desktop, ...(device && hideOnDesktop !== undefined ? { hideDesktop: hideOnDesktop } : {}) },
      },
    },
    frame.bodyValues.fontFamily?.value,
    mode
  );
  return { html, text: inner.__text };
}

export const defined = <T extends object>(object: T): T => Object.fromEntries(Object.entries(object).filter(([, v]) => v !== undefined)) as T;

/** Markup or text of the template's, as a node: in a printed document in the font's own line height, as legacy's. */
function looseMarkup(html: string, frame: Frame, compat?: Record<string, Json>, opens = 0): TreeNode {
  frame.loose = true;
  const inDocument = `${opens < 0 ? "" : '<div style="line-height:normal">'}${html}${opens > 0 ? "" : "</div>"}`;
  // It reads as a block of its own in the plain text, whatever it is (see render.ts).
  return defined({ type: "Raw", props: { html: frame.mode === "document" ? inDocument : html }, compat, textAs: defined({ type: "Raw", props: { html: `<div>${html}</div><div></div>` }, compat }) });
}

/** How many elements a piece of markup leaves open (a wrapper around rows, whose end is in another piece); less than 0 where it ends some. */
function leftOpen(html: string): number {
  let open = 0;
  for (const [, end, name, self] of html.replace(/<!--[\s\S]*?-->/g, "").matchAll(/<(\/?)([a-zA-Z][\w:-]*)\b[^>]*?(\/?)>/g)) {
    if (end) open--;
    else if (!self && !/^(area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)$/i.test(name)) open++;
  }
  return open;
}

function column(design: Values, width: string | undefined, rigid: boolean, asCell: boolean, place: Omit<FramePlace, "column" | "index">, index: number, options: LowerOptions, frame: Frame, loose: string[], path: string): TreeNode {
  const values: Values = design.values ?? {};
  unread(values, "column", frame, path);
  const css: string[] = [];
  const background = colorOr(css, "background-color", values.backgroundColor, "A column's background", frame, path);
  const padding = sidesOr(css, values.padding, "A column's padding", frame, path);
  const lines = linesOr(css, values.border, frame, path);
  const radius = px(values.borderRadius);
  if (radius === undefined && !isEmpty(values.borderRadius)) {
    const text = written(values.borderRadius, "A column's corner radius", frame, path);
    if (text) css.push(`border-radius: ${text}`);
  }
  const flexes = options.mode !== "email";
  // On a page, legacy's column is its share of the row inside its side lines (a row's that don't fit run past it).
  const sidesOfLines = flexes ? ((lines?.left as { width?: number } | undefined)?.width ?? 0) + ((lines?.right as { width?: number } | undefined)?.width ?? 0) : 0;
  if (sidesOfLines) css.push(`flex: 0 0 calc(${width ?? "100%"} + ${sidesOfLines}px) !important`);
  // A column in a row holding more than its columns' shares: legacy's keeps its share, one past the layout its content.
  else if (flexes && rigid) css.push(...(width ? ["flex-shrink: 0 !important"] : ["flex: 0 1 100% !important", "min-width: auto !important"]));
  const at: FramePlace = { ...place, column: values, index };
  const own = css.length ? ruled(frame, css) : undefined;
  // (On a phone too, where it's the row's whole width inside them.)
  if (sidesOfLines && options.mode === "web") frame.rules.push(`@media (max-width: 480px) { .${own}.${own} { width: calc(100% + ${sidesOfLines}px) !important; max-width: none !important; align-self: flex-start !important; } }`);
  const className = classNames(values, "u_column", own, deviceClass(values, "columns", frame, path));
  const contents: DesignBlock[] = design.contents ?? [];
  return withGivenId(defined({
    type: "Column",
    designColumn: true as const,
    style: defined({
      width,
      backgroundColor: background,
      padding: some(padding),
      border: lines,
      borderRadius: radius || undefined,
    }) as Record<string, Json>,
    compat: compatOf({ className, minWidth: asCell ? widthHeld(design) || undefined : undefined, phoneMinWidth: asCell ? widthHeld(design, true) || undefined : undefined }),
    children: contents.flatMap((block, n): TreeNode[] => {
      const text = loose[n] ? [looseMarkup(loose[n], frame)] : [];
      const node = options.block(block, at);
      if (!node) return text;
      // A Raw block is hidden by its own box's classes, as legacy hides it (see contentBox); a printed document hides nothing.
      const hide = node.type === "Raw" || options.mode === "document" ? undefined : hidden(block.values ?? {});
      return [...text, hide ? { ...node, hidden: { ...node.hidden, ...hide } } : node];
    }).concat(loose[contents.length] ? [looseMarkup(loose[contents.length], frame)] : []),
  }), givenId(values));
}

/** Text straight in a row, beside its columns, as wide as its longest word (see `boxedCells` in an email). */
function rowText(html: string | undefined, frame: Frame): TreeNode[] {
  if (!html) return [];
  const node = looseMarkup(html, frame);
  return [frame.mode === "email" ? node : { ...node, compat: { className: ruled(frame, ["flex: 0 1 auto !important", "min-width: auto !important"]) } }];
}

/**
 * The width a column's blocks of a fixed length take, with the block's and the column's padding and side lines: a
 * divider's, a button's. Legacy's cell grows to it, and its row runs past the email; on a phone, a row's that stays side
 * by side grows to its divider's alone (a button there gives way).
 */
function widthHeld(design: Values, onPhones = false): number {
  const { padding, border: lines } = design.values ?? {};
  const across = (value: unknown) => {
    const out = sides(value);
    return out ? out.left + out.right : 0;
  };
  const own = across(padding) + (px(lines?.borderLeftWidth) ?? 0) + (px(lines?.borderRightWidth) ?? 0);
  return Math.max(
    0,
    ...(design.contents ?? []).map(({ type, values }: DesignBlock) => {
      const length = type === "divider" && typeof values?.width !== "object" ? px(values?.width) : !onPhones && type === "button" && values?.size?.autoWidth === false ? px(values.size.width) : undefined;
      return length === undefined ? 0 : length + across(values.containerPadding ?? "10px") + own;
    })
  );
}

/** What the writers read of a node (see `compat` in core's model), where it has any. */
function compatOf(values: Record<string, Json | undefined>): Record<string, Json> | undefined {
  const compat = defined(values) as Record<string, Json>;
  return Object.keys(compat).length ? compat : undefined;
}

/** Whether a column draws a box that legacy has as tall as its row. */
const drawsBox = (values: Values = {}) => !!color(values.backgroundColor) || ["Top", "Right", "Bottom", "Left"].some((side) => parseFloat(String(values.border?.[`border${side}Width`])) > 0);

/** A background picture as the email writers read it. */
const emailPicture = ({ url, repeat, position, tile }: Picture): Json => defined({ url, repeat, position, tile }) as Json;

/** The CSS names for a row's `alignItems` the new Row has. */
const ROW_ALIGN: Record<string, string> = { center: "center", "flex-start": "start", start: "start", "flex-end": "end", end: "end", stretch: "stretch" };

function row(design: Values, rowIndex: number, place: Omit<FramePlace, "row" | "column" | "cells" | "index">, options: LowerOptions, frame: Frame): TreeNode {
  const values: Values = design.values ?? {};
  const path = `body.rows[${rowIndex}]`;
  unread(values, "row", frame, path);
  const email = options.mode === "email";
  const outside = options.outside?.rows[rowIndex];
  // Its own value, where it isn't the design's (the design's has the defaults' position and size, which legacy's row doesn't read).
  const image = outside?.values ? outside.values.backgroundImage : values.backgroundImage;
  const picture = pictureOf(image, options.mode);
  const band: string[] = [];
  const padding = sidesOr(band, values.padding, "A row's padding", frame, path);
  const bandColor = colorOr(band, "background-color", values.backgroundColor, "A row's background", frame, path);
  const inner: string[] = [];
  const innerColor = colorOr(inner, "background-color", values.columnsBackgroundColor, "A row's columns' background", frame, path);
  const cells: number[] = design.cells ?? values.cells ?? [1];
  const total = cells.reduce((sum, cell) => sum + cell, 0) || 1;
  const columns: Values[] = design.columns ?? [];
  // Columns that don't fit the row's layout: each has its own share, and one past the layout has none (legacy's has none either).
  if (columns.length && columns.length !== cells.length) say(frame, "warning", `A row of ${columns.length} column(s) in a layout of ${cells.length}: those past it have no share of the row`, `${path}.cells`);
  const rowTexts = outside?.text ?? [];
  const holdsText = rowTexts.some(Boolean);
  // Legacy shares are each column's whole box, its padding included: a percentage of the row.
  const widths = cells.map((cell) => (cells.length > 1 || columns.length > 1 || holdsText ? `${Math.round((cell / total) * 1e6) / 1e4}%` : undefined));
  // A printed document never stacks a row's columns (it has no phones); a row the builder says not to stack doesn't.
  const stacks = options.mode !== "document" && !(values.noStackMobile || values._override?.mobile?.noStackMobile);
  // On a page, a row's columns take its alignment (legacy's on an email draws nothing).
  const align = email || isEmpty(values.alignItems) ? undefined : ROW_ALIGN[String(values.alignItems)];
  const ownAlign = !email && !isEmpty(values.alignItems) && !align ? written(values.alignItems, "A row's alignment", frame, path) : undefined;
  // Table cells, as legacy's columns are, where it shows: side by side with backgrounds or lines of their own (as tall
  // as the row), kept side by side on phones (their shares, whatever their content), or as wide as what's in them takes.
  const pastItsShare = columns.some((c, index) => widthHeld(c) > (frame.width * (cells[index] ?? 0)) / total);
  const asCells = email && (holdsText || pastItsShare || (columns.length > 1 && (!stacks || cells.includes(0) || columns.some((c) => drawsBox(c.values)))));
  // On a page, what's more than a row's shares runs past it (legacy's columns keep their shares).
  const rigid = holdsText || columns.length !== cells.length || columns.some((c) => parseFloat(c.values?.border?.borderLeftWidth) > 0 || parseFloat(c.values?.border?.borderRightWidth) > 0);
  const at = { ...place, row: values, cells };
  const texts = outside?.columns ?? [];
  const innerRow = defined({
    type: "Row",
    props: stacks ? undefined : { stackOnMobile: false },
    style: defined({ backgroundColor: email ? rowColorInEmail(innerColor) : undefined, alignItems: align }) as Record<string, Json>,
    compat: compatOf({
      stretch: asCells || undefined,
      background: email && picture && !image.fullWidth ? emailPicture(picture) : undefined,
      className: ownAlign ? ruled(frame, [`align-items: ${ownAlign}`]) : undefined,
    }),
    children: columns.flatMap((c, index): TreeNode[] => [
      ...rowText(rowTexts[index], frame),
      column(c, widths[index], rigid, asCells, at, index, options, frame, texts[index] ?? [], `${path}.columns[${index}]`),
    ]).concat(rowText(rowTexts[columns.length], frame)),
  });
  const hide = options.mode === "document" ? undefined : hidden(values);
  const conditions = values.displayCondition ? { displayCondition: values.displayCondition } : {};
  if (email) {
    // Sides that differ: legacy's content sits off centre, the difference on the side with more. Sides it can't read are
    // written as they are, outside the content as legacy's are. Neither on phones (legacy's phone CSS zeroes them).
    const offset = padding && rowOffsetInEmail(padding);
    if (offset?.left) band.push(`padding-left: ${offset.left}px`);
    if (offset?.right) band.push(`padding-right: ${offset.right}px`);
    const own = band.length ? ruled(frame, band) : undefined;
    if (band.some((declaration) => declaration.startsWith("padding"))) frame.rules.push(`@media (max-width: ${frame.width + EMAIL_PHONE_MARGIN}px) { .${own} { padding-left: 0 !important; padding-right: 0 !important; } }`);
    // Past the content width, the cells run out of their table to the right, as legacy's do, not moving it off centre.
    const fixedTable = asCells || pastItsShare ? (frame.fixedTable ??= ruled(frame, [])) : undefined;
    const className = classNames(values, "u_row", own, frame.contentWidth, fixedTable, deviceClass(values, "rows", frame, path));
    return withGivenId(defined({
      type: "Section",
      hidden: hide,
      style: defined({ backgroundColor: rowColorInEmail(bandColor), padding: some(padding && rowPaddingInEmail(padding)) }) as Record<string, Json>,
      compat: compatOf({ ...conditions, className, align: frame.contentAlign === "center" ? undefined : frame.contentAlign, background: picture && image.fullWidth ? emailPicture(picture) : undefined }),
      children: [innerRow],
    }), givenId(values));
  }
  // On a page, legacy's row is a band of the page's width with its padding, and its columns are kept to the content
  // width inside the padding, centered.
  if (picture) (image.fullWidth ? band : inner).push(pictureCss(picture));
  const contentWidth = px(place.body.contentWidth);
  if (contentWidth === undefined && !isEmpty(place.body.contentWidth)) {
    const text = written(place.body.contentWidth, "The content width", frame, path);
    if (text) inner.push(`max-width: ${text}`);
  }
  const contentClass = inner.length ? ruled(frame, inner) : undefined;
  return withGivenId(defined({
    type: "Column",
    style: defined({ backgroundColor: bandColor, padding: some(padding), alignItems: frame.contentAlign === "left" ? "start" : frame.contentAlign === "right" ? "end" : "center" }) as Record<string, Json>,
    hidden: hide,
    compat: compatOf({ ...conditions, className: classNames(values, "u_row", band.length ? ruled(frame, band) : undefined, deviceClass(values, "rows", frame, path)) }),
    children: [
      defined({
        type: "Column",
        // Legacy's rows take a phone's whole width at 480px and below, whatever the content width.
        mobile: options.mode === "web" && (contentWidth === undefined || contentWidth < 480) ? { maxWidth: "100%" } : undefined,
        style: defined({ width: "100%", maxWidth: frame.wide ? undefined : contentWidth ?? (contentClass ? undefined : 500), backgroundColor: innerColor }) as Record<string, Json>,
        compat: compatOf({ className: contentClass }),
        children: [innerRow],
      }),
    ],
  }), givenId(values));
}

/**
 * A page's content isn't kept to a width of its own: each row keeps its columns to the content width (see row()), so
 * the root is as wide as any window.
 */
export const PAGE_WIDTH = 100_000;

/** The preview text's length legacy writes at most (the rest of its 150 is filler). */
const PREVIEW_LENGTH = 150;

/**
 * The body's own size and weight of text, which legacy's page gives what doesn't set its own (a size in em or rem of
 * the browser's 16px).
 */
function pageText(values: Values, frame: Frame): Record<string, Json> {
  const size = /^(\d*\.?\d+)r?em$/.exec(String(values.fontSize ?? "").trim());
  const text = defined({ fontSize: size ? Number(size[1]) * 16 : px(values.fontSize), lineHeight: lineHeight(values.lineHeight), fontWeight: fontWeight(values.fontWeight) }) as Record<string, Json>;
  for (const key of ["fontSize", "lineHeight", "fontWeight"]) if (text[key] === undefined && !isEmpty(values[key])) say(frame, "warning", `The body's ${key} ${JSON.stringify(values[key])} isn't one the new engine reads, so it isn't drawn`, `body.values.${key}`);
  return text;
}

/** The design's body, rows and blocks as the new engine's tree, and what it says of them. */
export function lowerDesign(design: { body: Values }, options: LowerOptions): { root: TreeNode; diagnostics: Diagnostic[] } {
  const values: Values = design.body.values ?? {};
  const email = options.mode === "email";
  // An email's rows are at least a phone's 320px wide, as legacy's; a width that isn't in px has them at legacy's 500px at most.
  const contentWidth = px(values.contentWidth);
  const frame: Frame = { mode: options.mode, width: contentWidth === undefined ? 500 : Math.max(contentWidth, 320), rules: [], device: {}, names: 0, notes: [], loose: false, namedAfter: options.names ? `${options.names}-` : "", wide: options.wide };
  unread(values, "body", frame, "body");
  frame.contentAlign = values.contentAlign === "left" || values.contentAlign === "right" ? values.contentAlign : "center";
  // A content width that isn't in px (80%, 30em): legacy's rows take as much of the window as that, up to 500px, in an email.
  if (email && contentWidth === undefined && !isEmpty(values.contentWidth) && values.contentWidth !== "100%") {
    const text = written(values.contentWidth, "The content width", frame, "body.values.contentWidth");
    if (text) {
      frame.contentWidth = ruled(frame, []);
      frame.rules.push(`.${frame.contentWidth} > table { max-width: min(${frame.width}px, ${text}) !important; min-width: 320px !important; }`);
    }
  }
  const body: string[] = [];
  const picture = options.mode === "document" ? documentBodyPicture(values.backgroundImage) : email ? undefined : pictureOf(values.backgroundImage, options.mode);
  if (picture) body.push(pictureCss(picture));
  // A printed document's content has it too, inside the body's margin.
  const content = picture && options.mode === "document" ? ruled(frame, [pictureCss(picture)]) : undefined;
  // Legacy's email has none of the body's picture.
  if (email && values.backgroundImage?.url) say(frame, "info", "The body's background picture draws nothing in an email: give a row one", "body.values.backgroundImage");
  // An email's body takes any color as it's written; a page's only those its stylesheet does (see pageBodyColor).
  const background = email ? colorOr(body, "background-color", values.backgroundColor, "The body's background", frame, "body.values.backgroundColor") : color(pageBodyColor(values.backgroundColor, "#ffffff"));
  if (values.fontFamily !== undefined && values.fontFamily !== "" && typeof values.fontFamily?.value !== "string") say(frame, "warning", `The body's font ${JSON.stringify(values.fontFamily)} isn't one legacy reads ({ label, value }), so it's in the default font`, "body.values.fontFamily");
  if (body.length) frame.rules.push(`body { ${body.join("; ")}; }`);
  const place = { mode: options.mode, body: values, config: options.config ?? {} };
  const among = options.outside?.among ?? [];
  const wide = (html: string | undefined): TreeNode[] => {
    if (!html?.trim()) return [];
    const opens = leftOpen(html);
    return [looseMarkup(html, frame, email ? { wide: opens > 0 ? "open" : opens < 0 ? "close" : true } : undefined, opens)];
  };
  const anchor = (r: Values): TreeNode[] => (r.values?.anchor ? [{ type: "Raw", props: { html: `<a name="${attribute(r.values.anchor)}"></a>`, text: "" }, ...(email ? { compat: { wide: true } } : {}) }] : []);
  // (In an email, a table of its own for the row inside it.)
  const aroundRow = (html: string, wide: "open" | "close"): TreeNode => ({ type: "Raw", props: { html, text: "" }, ...(email ? { compat: { wide } } : {}) });
  const rows = ((design.body.rows ?? []) as Values[]).flatMap((r, index) => {
    const around = options.outside?.rows[index]?.around;
    return [...wide(among[index]), ...(around ? [aroundRow(around[0], "open")] : []), ...anchor(r), row(r, index, place, options, frame), ...(around ? [aroundRow(around[1], "close")] : [])];
  });
  rows.push(...wide(among[(design.body.rows ?? []).length]));
  const textColor = email ? values.textColor : pageBodyColor(values.textColor, "#000000");
  const preview = email && typeof values.preheaderText === "string" && values.preheaderText.trim() ? values.preheaderText.slice(0, PREVIEW_LENGTH) : undefined;
  if (frame.fixedTable) frame.rules.push(`.${frame.fixedTable} > table { table-layout: fixed; }`);
  const css = [frame.mode === "document" || frame.loose ? ownMarkupCss(options.mode, values) : "", ...frame.rules, deviceStylesCss(frame.device, options.mode)].filter(Boolean).join("\n");
  const root = defined({
    type: email ? "Email" : "Page",
    props: defined({
      width: email ? frame.width : PAGE_WIDTH,
      // Legacy's preview text: none where it's only white space, its first 150 characters where it's longer.
      previewText: preview,
      dir: textDirectionOf(options.config?.textDirection ?? values.textDirection),
    }) as Record<string, Json>,
    style: defined({
      backgroundColor: background,
      color: (typeof textColor === "string" && textColor && parseColor(textColor).ok ? textColor : undefined) || undefined,
      // (An email's text with no font of the body's is in the browser's; a page's stylesheet has its own default.)
      fontFamily: values.fontFamily?.value || (options.embedded && options.wide ? "inherit" : email ? "initial" : undefined),
      // A printed document's text is 15px (its stylesheet's), a page's and an email's the browser's 16px.
      fontSize: options.mode === "document" ? 15 : undefined,
      ...(options.mode === "web" ? pageText(values, frame) : {}),
    }) as Record<string, Json>,
    compat: compatOf({
      css: css || undefined,
      // An email service's <%name%> tag, which legacy writes as it is for the service to fill in.
      previewHtml: preview?.includes("<%") ? escapeKeepingTags(preview) : undefined,
    }),
    // A page keeps the browser's margin around its rows (legacy's page doesn't reset the body's).
    children: email ? rows : options.embedded ? rows : [{ type: "Column", style: { padding: pageMargin() }, children: content ? [{ type: "Column", compat: { className: content }, children: rows }] : rows }],
  });
  return { root, diagnostics: frame.notes };
}
