/**
 * A template of today's components, by its design (what renderToJson returns: the builder's JSON), as the new
 * engine's tree. The body is the Email or Page; each row a Section around a Row of its columns; each block what
 * `block()` makes of it (its new component, or a Raw node with its legacy HTML). Where legacy draws something other
 * than the design asks, the tree draws it as legacy does (quirks.ts).
 */
import type React from "react";
import type { Json } from "@unlayer-internal/elements-core";
import { escapeText, type UnlayerConfig } from "@unlayer-internal/shared-elements";
import { safeName, textDirectionOf, UNLAYER_CONFIG_KEY, UNLAYER_RENDER_KEY } from "../utils/create-component";
import { DEFAULT_CONTAINER_PADDING } from "../utils/image-sizing";
import { pageBodyColor, pageMargin, rowColorInEmail, rowPaddingInEmail } from "./quirks";
import { border, color, px, serviceTag, sides, some, type Values } from "./values";

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
  /** Says what's drawn otherwise than the block asks: a diagnostic of the render. */
  note(message: string, severity?: "warning" | "info"): void;
  /** Text with its email service's tags kept out of the writers' escaping (see render.ts, which puts them back). */
  keep(text: string): string;
}

/** Where a block is, as the design says it. */
export type FramePlace = Omit<Place, "source" | "note" | "keep">;

export interface LowerOptions {
  mode: Mode;
  config?: Partial<UnlayerConfig>;
  /** A block as a node of the tree, or null where it draws nothing in this output. */
  block(block: DesignBlock, place: FramePlace): TreeNode | null;
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

/** Thrown where the frame (the body, a row, a column) holds what the new engine can't draw as legacy does. */
export class Unlowerable extends Error {}

/**
 * The values of a row, a column or the body that the lowering reads, or that draw nothing in legacy's output (the
 * editor's flags, a value only a popup reads, a document's page size, which the PDF takes). Any other value that isn't
 * empty is one the frame can't draw as legacy does, whatever it is (a row's anchor, its columns' alignment): the
 * template renders as today.
 */
const READ = {
  row: new Set(["displayCondition", "backgroundColor", "columnsBackgroundColor", "backgroundImage", "padding", "noStackMobile", "cells", "_meta", "_override", "hideDesktop", "hideMobile", "selectable", "draggable", "duplicatable", "deletable", "hideable", "locked"]),
  column: new Set(["backgroundColor", "padding", "border", "borderRadius", "_meta", "_override", "hideDesktop", "hideMobile", "deletable", "locked"]),
  body: new Set(["textDirection", "borderRadius", "contentAlign", "contentVerticalAlign", "contentWidth", "fontFamily", "textColor", "backgroundColor", "documentSize", "documentOrientation", "documentMargin", "preheaderText", "linkStyle", "backgroundImage", "_meta"]),
};

function onlyRead(values: Values, what: keyof typeof READ): void {
  for (const [key, value] of Object.entries(values)) {
    if (READ[what].has(key) || value === undefined || value === null || value === "" || value === false) continue;
    if (typeof value === "object" && !Array.isArray(value) && !Object.keys(value).length) continue;
    throw new Unlowerable(`a ${what}'s ${key} ${JSON.stringify(value)}`);
  }
  // Settings for a tablet's width, which legacy applies there.
  if (Object.keys(values._override?.tablet ?? {}).length) throw new Unlowerable(`a ${what}'s settings for tablets`);
}

/** Today's link style of the body: links in the browser's blue, underlined. Another is drawn by legacy's head CSS. */
const BODY_LINKS = { body: true, linkColor: "#0000ee", linkHoverColor: "#0000ee", linkUnderline: true, linkHoverUnderline: true };

/** Sides that must be read: a value that isn't one is what the frame can't draw. */
function readSides(value: unknown, what: string) {
  const out = sides(value);
  if (!out && value !== undefined && value !== null && value !== "") throw new Unlowerable(`${what} ${JSON.stringify(value)}`);
  return out;
}

/**
 * A row's or column's settings for phones and for desktop windows, which legacy applies on either side of 480px. A
 * page's are the new engine's too; an email's phone settings start at its own width (its columns stack there, as
 * legacy's do), so none can be drawn as legacy draws them. A printed document has no phone settings in legacy.
 */
function phoneSettings(values: Values, what: string, mode: Mode): void {
  const desktop = Object.keys(values._override?.desktop ?? {}).filter((key) => key !== "hideDesktop");
  if (desktop.length) throw new Unlowerable(`${what}'s settings for desktop windows`);
  // Not stacking on phones (the builder keeps it with phone settings) is the new email's own, at its width too.
  const phone = Object.keys(values._override?.mobile ?? {}).filter((key) => key !== "noStackMobile");
  if (mode === "email" && (phone.length || hidden(values))) throw new Unlowerable(`${what}'s settings for phones in an email, which legacy applies below 480px`);
  // A page's: its padding (and where it's hidden), which the new components have too.
  if (mode === "web" && phone.some((key) => key !== "padding" && key !== "hideMobile")) throw new Unlowerable(`${what}'s settings for phones`);
}

/** An id its author gave a row, column or block (legacy writes it; the ids it numbers itself aren't written). */
export function givenId(values: Values): string | undefined {
  const id = values._meta?.htmlID;
  return typeof id === "string" && id && !/^u_(row|column|body|content_[a-z0-9_]+)_?\d*$/.test(id) ? safeName(id) || undefined : undefined;
}

/** Class names its author gave a row or a column, which legacy writes and the new components have no place for. */
function givenClasses(values: Values, own: string, what: string): void {
  const names = values._meta?.htmlClassNames;
  if (typeof names === "string" && names.trim() && names.trim() !== own) throw new Unlowerable(`${what}'s own class names`);
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
  const attribute = (value: unknown) => escapeText(String(value ?? "")).replace(/"/g, "&quot;");
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
 * A block as a Column writes it: its markup (its exporter's, or what a component of the user's rendered) in its box.
 * "" where it writes nothing in this output; undefined where it has no markup (its exporter failed, which it says).
 */
export function writeBlock(element: React.ReactElement<any>, id: string, frame: BlockFrame, mode: Mode, config: unknown): string | undefined {
  const type = element.type as any;
  const rendered = (type[UNLAYER_RENDER_KEY] ?? type)({ ...element.props, _config: config, _metaHtmlId: id, ...frame });
  const inner = rendered?.props?.dangerouslySetInnerHTML;
  if (!inner) {
    if (rendered) console.warn(`Column: <${type.displayName || type.name || "Unknown"}> did not produce renderable HTML. Ensure it is an Unlayer component (Button, Text, Image, etc.).`);
    return undefined;
  }
  const own = type[UNLAYER_CONFIG_KEY];
  if (!inner.__html && own?.omitEmptyOutput) return "";
  const { containerPadding, values, hideOnMobile, hideOnDesktop } = element.props;
  const padding = containerPadding ?? values?.containerPadding ?? DEFAULT_CONTAINER_PADDING;
  // A custom tool's props are its own values: a `hideOnMobile` of its own isn't a device setting.
  const device = own?.contentType !== "custom";
  const override = values?._override;
  return contentBox(
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
}

export const defined = <T extends object>(object: T): T => Object.fromEntries(Object.entries(object).filter(([, v]) => v !== undefined)) as T;

/** The sides of a line every column of a row has (legacy stretches columns to the row's height: one line across it). */
type Lines = Partial<Record<"top" | "bottom", Json>>;

function column(design: Values, width: string | undefined, rowLines: Lines, background: string | undefined, stacks: boolean, place: Omit<FramePlace, "column" | "index">, index: number, options: LowerOptions): TreeNode {
  const values: Values = design.values ?? {};
  onlyRead(values, "column");
  phoneSettings(values, "a column", options.mode);
  // Its padding on phones, 0 too (which takes off its desktop padding there).
  const phonePadding = options.mode === "web" ? readSides(values._override?.mobile?.padding, "a column's phone padding") : undefined;
  const radius = px(values.borderRadius);
  if (radius === undefined && values.borderRadius !== undefined && values.borderRadius !== "") throw new Unlowerable(`a column's corner radius ${JSON.stringify(values.borderRadius)}`);
  const own = border(values.border) as Record<string, Json> | undefined;
  // A line its row draws is the row's on desktop; where the columns stack, each draws it again on phones.
  const lines = own && Object.fromEntries(Object.entries(own).filter(([side]) => !(side in rowLines)));
  const phoneLines = stacks && Object.keys(rowLines).length ? rowLines : undefined;
  const mobile = defined({ padding: phonePadding, border: phoneLines as Json | undefined });
  const at: FramePlace = { ...place, column: values, index };
  givenClasses(values, "u_column", "a column");
  return defined({
    type: "Column",
    id: givenId(values),
    designColumn: true as const,
    style: defined({
      width,
      backgroundColor: background === undefined ? color(values.backgroundColor) : undefined,
      padding: some(readSides(values.padding, "a column's padding")),
      border: lines && Object.keys(lines).length ? lines : undefined,
      borderRadius: radius || undefined,
    }) as Record<string, Json>,
    mobile: Object.keys(mobile).length ? (mobile as Record<string, Json>) : undefined,
    children: (design.contents ?? []).flatMap((block: DesignBlock) => {
      const node = options.block(block, at);
      if (!node) return [];
      // A Raw block is hidden by its own box's classes, as legacy hides it (see contentBox); a printed document hides nothing.
      const hide = node.type === "Raw" || options.mode === "document" ? undefined : hidden(block.values ?? {});
      return [hide ? { ...node, hidden: { ...node.hidden, ...hide } } : node];
    }),
  });
}

function row(design: Values, place: Omit<FramePlace, "row" | "column" | "cells" | "index">, options: LowerOptions): TreeNode {
  const values: Values = design.values ?? {};
  onlyRead(values, "row");
  if (values.backgroundImage?.url) throw new Unlowerable("a row's background image");
  phoneSettings(values, "a row", options.mode);
  givenClasses(values, "u_row", "a row");
  const padding = readSides(values.padding, "a row's padding");
  const cells: number[] = design.cells ?? values.cells ?? [1];
  const total = cells.reduce((sum, cell) => sum + cell, 0) || 1;
  const columns: Values[] = design.columns ?? [];
  // Columns that don't fit the row's layout: legacy says so and may render the body without its rows.
  if (columns.length !== cells.length) throw new Unlowerable("a row whose columns don't fit its layout");
  // Legacy shares are each column's whole box, its padding included: a percentage of the row.
  const widths = cells.map((cell) => (cells.length > 1 ? `${Math.round((cell / total) * 1e6) / 1e4}%` : undefined));
  // A printed document never stacks a row's columns (it has no phones); a row the builder says not to stack doesn't.
  const stacks = options.mode !== "document" && !(values.noStackMobile || values._override?.mobile?.noStackMobile);
  // Legacy stretches a row's columns to its height, so a line along the top or the bottom of each is one line across
  // the row; the new email's columns end with their content. A line every column has is the row's.
  const lines: Lines = {};
  if (columns.length > 1) {
    for (const side of ["top", "bottom"] as const) {
      const each = columns.map((c) => (border(c.values?.border) as Record<string, Json> | undefined)?.[side]);
      if (each.every((line) => line && JSON.stringify(line) === JSON.stringify(each[0]))) lines[side] = each[0]!;
    }
  }
  // Columns side by side with backgrounds or lines of their own end with their content in the new email, where legacy's
  // are as tall as the row: one background they all have is the row's; others can't be drawn as legacy draws them.
  const backgrounds = columns.map((c) => color(c.values?.backgroundColor));
  const shared = columns.length > 1 && backgrounds.every((b) => b && b === backgrounds[0]) && !color(values.columnsBackgroundColor) ? backgrounds[0] : undefined;
  if (options.mode === "email" && columns.length > 1) {
    for (const c of columns) {
      const own = (border(c.values?.border) ?? {}) as Record<string, Json>;
      const unshared = Object.keys(own).some((side) => !(side in lines));
      if (unshared || (color(c.values?.backgroundColor) && !shared) || (px(c.values?.borderRadius) && (shared || color(c.values?.backgroundColor)))) {
        throw new Unlowerable("columns side by side whose backgrounds or lines legacy draws as tall as their row");
      }
    }
  }
  const at = { ...place, row: values, cells };
  const inner = defined({
    type: "Row",
    props: stacks ? undefined : { stackOnMobile: false },
    style: defined({ backgroundColor: (options.mode === "email" ? rowColorInEmail(color(values.columnsBackgroundColor)) : color(values.columnsBackgroundColor)) ?? shared, border: Object.keys(lines).length ? (lines as Json) : undefined }) as Record<string, Json>,
    mobile: stacks && Object.keys(lines).length ? { border: Object.fromEntries(Object.keys(lines).map((side) => [side, "none"])) } : undefined,
    children: columns.map((c, index) => column(c, widths[index], lines, shared, stacks, at, index, options)),
  });
  const compat = values.displayCondition ? { displayCondition: values.displayCondition } : undefined;
  if (options.mode === "email") {
    // Sides unequal: legacy's content sits off center by half their difference (they're outside it), which a Section
    // can't draw.
    if (padding && padding.left !== padding.right) throw new Unlowerable("a row whose side padding differs from side to side");
    return defined({
      type: "Section",
      id: givenId(values),
      style: defined({ backgroundColor: rowColorInEmail(color(values.backgroundColor)), padding: some(padding && rowPaddingInEmail(padding)) }) as Record<string, Json>,
      compat,
      children: [inner],
    });
  }
  // On a page, legacy's row is a band of the page's width with its padding, and its columns are kept to the content
  // width inside the padding, centered.
  const phonePadding = options.mode === "web" ? readSides(values._override?.mobile?.padding, "a row's phone padding") : undefined;
  return defined({
    type: "Column",
    id: givenId(values),
    style: defined({ backgroundColor: color(values.backgroundColor), padding: some(padding), alignItems: "center" }) as Record<string, Json>,
    mobile: phonePadding ? { padding: phonePadding } : undefined,
    hidden: options.mode === "web" ? hidden(values) : undefined,
    compat,
    children: [{ type: "Column", style: { width: "100%", maxWidth: px(place.body.contentWidth) ?? 500 }, children: [inner] }],
  });
}

/**
 * A page's content isn't kept to a width of its own: each row keeps its columns to the content width (see row()), so
 * the root is as wide as any window.
 */
export const PAGE_WIDTH = 100_000;

/** The preview text's length legacy writes at most (the rest of its 150 is filler). */
const PREVIEW_LENGTH = 150;

/** The design's body, rows and blocks as the new engine's tree. */
export function lowerDesign(design: { body: Values }, options: LowerOptions): { root: TreeNode } {
  const values: Values = design.body.values ?? {};
  onlyRead(values, "body");
  if (values.backgroundImage?.url) throw new Unlowerable("the body's background image");
  // A content width that isn't in px (100%, 80%): legacy's rows take that share of the window.
  if (values.contentWidth !== undefined && px(values.contentWidth) === undefined) throw new Unlowerable(`a content width of ${JSON.stringify(values.contentWidth)}`);
  // A page narrower than a phone: legacy's rows take a phone's whole width at 480px and below.
  if (options.mode === "web" && (px(values.contentWidth) ?? 500) < 480) throw new Unlowerable("a page narrower than a phone");
  if (values.linkStyle && Object.entries(BODY_LINKS).some(([key, value]) => values.linkStyle[key] !== undefined && values.linkStyle[key] !== value)) throw new Unlowerable("the body's own link style");
  if (values.fontFamily !== undefined && values.fontFamily !== "" && typeof values.fontFamily?.value !== "string") throw new Unlowerable(`the body's font ${JSON.stringify(values.fontFamily)}`);
  if (values.contentAlign !== undefined && values.contentAlign !== "center") throw new Unlowerable(`content aligned ${values.contentAlign}`);
  // An email service's tag, which legacy writes as it is for the service to fill in (the new engine escapes it).
  if (typeof values.preheaderText === "string" && serviceTag(values.preheaderText)) throw new Unlowerable("an email service's tag in the preview text");
  const place = { mode: options.mode, body: values, config: options.config ?? {} };
  const rows = (design.body.rows ?? []).map((r: Values) => row(r, place, options));
  const email = options.mode === "email";
  const root = defined({
    type: email ? "Email" : "Page",
    props: defined({
      width: email ? px(values.contentWidth) : PAGE_WIDTH,
      // Legacy's preview text: none where it's only white space, its first 150 characters where it's longer.
      previewText: email && typeof values.preheaderText === "string" && values.preheaderText.trim() ? values.preheaderText.slice(0, PREVIEW_LENGTH) : undefined,
      dir: textDirectionOf(options.config?.textDirection ?? values.textDirection),
    }) as Record<string, Json>,
    style: defined({
      backgroundColor: email ? color(values.backgroundColor) : color(pageBodyColor(values.backgroundColor, "#ffffff")),
      color: (email ? values.textColor : pageBodyColor(values.textColor, "#000000")) || undefined,
      fontFamily: values.fontFamily?.value || undefined,
      // A printed document's text is 15px (its stylesheet's), a page's and an email's the browser's 16px.
      fontSize: options.mode === "document" ? 15 : undefined,
    }) as Record<string, Json>,
    // A page keeps the browser's margin around its rows (legacy's page doesn't reset the body's).
    children: email ? rows : [{ type: "Column", style: { padding: pageMargin() }, children: rows }],
  });
  return { root };
}
