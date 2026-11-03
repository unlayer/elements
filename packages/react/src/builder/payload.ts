/**
 * What a template keeps in the builder's design JSON, so it comes back as it was. The builder's values are the
 * design: what the builder holds (a heading's text, its size, its color) is only there. Each body, row, column and
 * block carries, in its `values._elements`, only what the builder can't hold: what of its node the builder has no
 * field for, and how much of a value the builder shows belongs to the node's place rather than to the node (a
 * Section's space, written into the padding of the blocks in it). The builder keeps any key in `values` as it is (it
 * shows no editor for one it doesn't know), through loading, editing, saving and duplicating; a key beside `values`
 * it drops.
 *
 * On the way back, each builder value is read as the node's (less its place), except where it's still what the
 * builder has for nothing set (its defaults, below) or what the node takes from what it's in (taken.ts).
 *
 * Experimental: this is version 1 to be, not yet frozen. It's frozen (every later version reads it as this one does)
 * once a test sets every field of every tool to another value, to its default and removes it, designs saved by the
 * real builder for every tool read back, the defaults below are checked against what today's components write, and a
 * review finds nothing new. Till then a design written with it may read otherwise in a later release.
 */
import type { Json, Node } from "@unlayer-internal/elements-core";

/** The format's version: a later one reads this one. */
export const PAYLOAD_VERSION = 1;

/** Where a template keeps itself in an item's values. */
export const PAYLOAD_KEY = "_elements";

/** A node a row, a column or a run of blocks stands for, without the children the builder holds. */
export interface Group {
  /** The same for every row (or block) of one node: rows of a Section, blocks of a Column. */
  key: string;
  node: Node;
}

export type Sides = { top: number; right: number; bottom: number; left: number };

export interface Payload {
  v: number;
  /**
   * What of the node the builder has no field for, without its children where the builder holds them (a row's
   * columns, a column's blocks, a text's runs it holds as HTML). A block or a Row's column whose node is all in the
   * builder's values has none: it's the component its tool is (a column's is a Column).
   */
  node?: Node;
  /** By key, the part of a value the builder holds that is the node's place, not the node's (a Section's space). */
  place?: Record<string, Partial<Sides>>;
  /** By key, a value as written, where the builder's can't be read back on its own (a width it measures its own way). */
  w?: Record<string, Json>;
  /**
   * The values the builder holds that the node doesn't set itself (it takes them from what it's in, or from its
   * component): each is left out where it's still what the node takes (taken.ts). Said either way, whichever is
   * shorter: `taken`, those values; or `own`, the ones the node sets, all others taken. Each is a list of paths
   * between spaces, a style's by its name alone (`fontSize props.level`).
   */
  taken?: string;
  own?: string;
  /** By key, a fingerprint of a long value written that's only told apart, not read (a block's own markup). */
  h?: Record<string, string>;
  /**
   * The defaults (below) that aren't the item's, as the node sets that value itself (a button's hover color, a
   * body's background): the builder's value there is read as the node's whatever it is. A value with parts names the
   * part (`buttonColors.hoverColor`). Between spaces.
   */
  held?: string;
  /** A row: the Section it's part of (or a Document's page, header or footer). */
  sec?: Group;
  /** A row: the Grid it's a row of (its columns its cells). */
  grid?: Group;
  /** A row of blocks directly in the root or a Section (no Row of its own), or its column; also any row with neither a node nor a Grid. */
  run?: true;
  /** A column that is a Row's child that isn't a Column (a block of its own size). */
  direct?: true;
  /** A block: the boxes it's in, in the column it's in, outermost first (a Column in a Column). */
  wrap?: Group[];
  /** A block the builder shows as HTML: it can be moved, not edited. */
  locked?: true;
  /** A page break that's only where a Document's page starts (not a PageBreak of the template's). */
  implied?: true;
  /** A row: its children the builder has no column for (hidden on desktop), by their place among its children. */
  kept?: Array<{ index: number; node: Node }>;
}

/** Values the builder sets for itself, or rebuilds: not written by a template, so not compared. */
export const BUILDER_OWN = new Set([PAYLOAD_KEY, "_meta", "selectable", "draggable", "duplicatable", "deletable", "hideable", "locked"]);

const NO_IMAGE: Json = { url: "", fullWidth: true, repeat: "no-repeat", size: "custom", position: "center" };
const LINKS = { linkColor: "#0000ee", linkHoverColor: "#0000ee", linkUnderline: true, linkHoverUnderline: true };

/**
 * What the builder holds for an item where its template sets nothing: the values today's components write for
 * themselves. Part of this format: once it's frozen, a value here is read as nothing set in every design of this
 * version, and a later version that writes other ones has a table of its own.
 */
export const DEFAULTS: Readonly<Record<string, Readonly<Record<string, Json>>>> = {
  body: {
    // Today's body's own background, where the template's root has none.
    backgroundColor: "#F7F8F9",
    _styleGuide: null,
    borderRadius: "10px",
    contentAlign: "center",
    contentVerticalAlign: "middle",
    language: {},
    documentSize: "A4",
    documentOrientation: "portrait",
    documentMargin: "96px",
    preheaderText: "",
    linkStyle: { body: true, ...LINKS },
    backgroundImage: NO_IMAGE,
    accessibilityTitle: "",
  },
  row: {
    displayCondition: null,
    columns: false,
    _styleGuide: null,
    backgroundColor: "",
    columnsBackgroundColor: "",
    backgroundImage: NO_IMAGE,
    padding: "0px",
    anchor: "",
    noStackMobile: false,
    cells: [1],
  },
  column: { backgroundColor: "", padding: "0px", border: {}, borderRadius: "0px" },
  heading: { linkStyle: { inherit: true, ...LINKS } },
  text: { linkStyle: { inherit: true, ...LINKS } },
  button: { size: { autoWidth: true, width: "100%" }, border: {}, textAlign: "left", buttonColors: { hoverColor: "#FFFFFF", hoverBackgroundColor: "#0879A1" } },
  image: { action: { name: "web", values: { href: "", target: "_blank" } }, textAlign: "left", src: { autoWidth: true, maxWidth: "100%" } },
  divider: { textAlign: "left" },
  menu: {},
  social: {},
  video: {},
  html: {},
  page_break: {},
};

/**
 * The values today's components write for an item whatever its template sets (a button's link, its padding): one the
 * builder removed is read as removed, as a value it changed is. Part of this format.
 */
export const WRITTEN: Readonly<Record<string, readonly string[]>> = {
  body: ["contentWidth", "fontFamily", "textColor", "backgroundColor"],
  row: ["padding", "columnsBackgroundColor", "noStackMobile"],
  column: ["padding", "backgroundColor", "border", "borderRadius"],
  heading: ["containerPadding", "headingType", "fontSize", "textAlign", "lineHeight", "color", "fontWeight", "text", "fontFamily"],
  text: ["containerPadding", "fontSize", "textAlign", "lineHeight", "color", "fontFamily", "fontWeight", "text"],
  button: ["containerPadding", "href", "buttonColors", "size", "fontSize", "lineHeight", "textAlign", "padding", "border", "borderRadius", "text", "fontFamily", "fontWeight"],
  image: ["containerPadding", "src", "textAlign", "altText", "action"],
  divider: ["containerPadding", "width", "border", "textAlign"],
  menu: ["containerPadding", "menu", "fontSize", "textColor", "linkColor", "align", "layout", "separator", "padding", "fontFamily"],
  social: ["containerPadding", "icons", "align", "iconSize", "spacing"],
  video: ["containerPadding", "video"],
};

/**
 * Values whose parts are a node's and the builder's own (a button's colors, an image's source and width): their
 * default is only the builder's parts, and their setter tells each part apart, so it's given every value.
 */
export const PARTED = new Set(["button.buttonColors", "image.src"]);

/** Values that are a node's padding and its place (a block's spacing is its padding and its stack's gap, a row's its Section's). */
export const PADDING_BY = new Set(["heading.containerPadding", "text.containerPadding", "divider.containerPadding", "column.padding", "row.padding"]);
/** Values that are only a block's place (a button's spacing is its stack's). */
export const PLACED = new Set(["button", "image", "menu", "social", "video", "html", "page_break"].map((kind) => `${kind}.containerPadding`));

export const sidesCss = (s: Partial<Sides>) => `${s.top ?? 0}px ${s.right ?? 0}px ${s.bottom ?? 0}px ${s.left ?? 0}px`;

/**
 * The values an item was written with, as far as they're told apart from a change: the format's defaults, its
 * place, and what was kept as written. A value the node holds isn't here: the builder's is the node's.
 */
export function baseline(kind: string, payload: Payload | undefined): Record<string, Json> | undefined {
  if (!payload) return undefined;
  const out: Record<string, Json> = { ...DEFAULTS[kind] };
  // A Document's page settings are its own: the builder's defaults for them are an email's.
  if (kind === "body" && payload.node?.type === "Document") for (const key of ["documentSize", "documentOrientation", "documentMargin"]) delete out[key];
  for (const held of (payload.held ?? "").split(" ").filter(Boolean)) {
    const [key, part] = held.split(".");
    if (part === undefined) delete out[key];
    else if (out[key] && typeof out[key] === "object") {
      const { [part]: _held, ...rest } = out[key] as Record<string, Json>;
      out[key] = rest;
    }
  }
  // Its place: none where none is said.
  for (const key of ["containerPadding", "padding"]) if (PADDING_BY.has(`${kind}.${key}`) || PLACED.has(`${kind}.${key}`)) out[key] = sidesCss(payload.place?.[key] ?? {});
  // A row's band is its Section's background.
  if (kind === "row" && typeof payload.sec?.node.style?.backgroundColor === "string") out.backgroundColor = payload.sec.node.style.backgroundColor;
  // The builder's own data the node keeps (a display condition) is as it was written.
  for (const [key, value] of Object.entries((payload.node?.compat?.builder ?? {}) as Record<string, Json>)) out[key] = value;
  return { ...out, ...payload.w };
}

/** A node without its children (they're the builder's rows, columns or blocks). */
export function bare(node: Node): Node {
  const { children: _children, ...rest } = node;
  return rest;
}

/** A fingerprint of an item's phone values but their hiding (which is kept as written, and read). */
export function phonePrint(value: unknown): string {
  const mobile = (value as { mobile?: Record<string, unknown> } | undefined)?.mobile;
  if (!mobile || !("hideMobile" in mobile)) return fingerprint(value);
  const { hideMobile: _hiding, ...rest } = mobile;
  return fingerprint({ ...(value as object), mobile: rest });
}

/** A short fingerprint of a long value (cyrb53), to tell it from another. */
export function fingerprint(value: unknown): string {
  // An object's keys in any order.
  const canon = (v: unknown): unknown => (Array.isArray(v) ? v.map(canon) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon((v as Record<string, unknown>)[k])])) : v);
  const text = typeof value === "string" ? value : JSON.stringify(canon(value ?? null));
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}
