/**
 * A template of today's components, by its design (what renderToJson returns: the builder's JSON), as the new
 * engine's tree. The body is the Email or Page; each row a Section around a Row of its columns; each block what
 * `block()` makes of it (its new component, or a Raw node with its legacy HTML). Where legacy draws something other
 * than the design asks, the tree draws it as legacy does (quirks.ts).
 */
import type { Json } from "@unlayer-internal/elements-core";
import type { UnlayerConfig } from "@unlayer-internal/shared-elements";
import { safeName, textDirectionOf } from "../utils/create-component";
import { pageBodyColor, pageMargin, rowColorInEmail, rowPaddingInEmail } from "./quirks";
import { border, color, px, sides, some, type Values } from "./values";

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
}

export interface LowerOptions {
  mode: Mode;
  config?: Partial<UnlayerConfig>;
  /** A block as a node of the tree, or null where it draws nothing in this output. */
  block(block: DesignBlock, place: Place): TreeNode | null;
}

/** Where a block, column or row is hidden: on desktop, or on phones (an override). */
export function hidden(values: Values): TreeNode["hidden"] {
  const desktop = !!(values.hideDesktop || values._override?.desktop?.hideDesktop);
  const mobile = !!(values.hideMobile || values._override?.mobile?.hideMobile);
  return desktop || mobile ? { ...(desktop ? { desktop } : {}), ...(mobile ? { mobile } : {}) } : undefined;
}

/** Thrown where the frame (the body, a row, a column) holds what the new engine can't draw as legacy does. */
export class Unlowerable extends Error {}

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

export const defined = <T extends object>(object: T): T => Object.fromEntries(Object.entries(object).filter(([, v]) => v !== undefined)) as T;

/** The sides of a line every column of a row has (legacy stretches columns to the row's height: one line across it). */
type Lines = Partial<Record<"top" | "bottom", Json>>;

function column(design: Values, width: string | undefined, rowLines: Lines, background: string | undefined, stacks: boolean, place: Omit<Place, "column" | "index">, index: number, options: LowerOptions): TreeNode {
  const values: Values = design.values ?? {};
  phoneSettings(values, "a column", options.mode);
  const phonePadding = options.mode === "web" ? some(readSides(values._override?.mobile?.padding, "a column's phone padding")) : undefined;
  const radius = px(values.borderRadius);
  if (radius === undefined && values.borderRadius !== undefined && values.borderRadius !== "") throw new Unlowerable(`a column's corner radius ${JSON.stringify(values.borderRadius)}`);
  const own = border(values.border) as Record<string, Json> | undefined;
  // A line its row draws is the row's on desktop; where the columns stack, each draws it again on phones.
  const lines = own && Object.fromEntries(Object.entries(own).filter(([side]) => !(side in rowLines)));
  const phoneLines = stacks && Object.keys(rowLines).length ? rowLines : undefined;
  const mobile = defined({ padding: phonePadding, border: phoneLines as Json | undefined });
  const at: Place = { ...place, column: values, index };
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
      // A Raw block is hidden by its own markup's classes, as legacy hides it; a printed document hides nothing.
      const hide = node.type === "Raw" || options.mode === "document" ? undefined : hidden(block.values ?? {});
      return [hide ? { ...node, hidden: { ...node.hidden, ...hide } } : node];
    }),
  });
}

function row(design: Values, place: Omit<Place, "row" | "column" | "cells" | "index">, options: LowerOptions): TreeNode {
  const values: Values = design.values ?? {};
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

/** The design's body, rows and blocks as the new engine's tree. */
export function lowerDesign(design: { body: Values }, options: LowerOptions): { root: TreeNode } {
  const values: Values = design.body.values ?? {};
  if (values.backgroundImage?.url) throw new Unlowerable("the body's background image");
  if (values.contentAlign !== undefined && values.contentAlign !== "center") throw new Unlowerable(`content aligned ${values.contentAlign}`);
  // An email service's <%name%> tag, which legacy writes as it is for the service to fill in (the new engine escapes it).
  if (typeof values.preheaderText === "string" && values.preheaderText.includes("<%")) throw new Unlowerable("an email service's <%name%> tag in the preview text");
  const place = { mode: options.mode, body: values, config: options.config ?? {} };
  const rows = (design.body.rows ?? []).map((r: Values) => row(r, place, options));
  const email = options.mode === "email";
  const root = defined({
    type: email ? "Email" : "Page",
    props: defined({
      width: email ? px(values.contentWidth) : PAGE_WIDTH,
      previewText: email && values.preheaderText ? values.preheaderText : undefined,
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
