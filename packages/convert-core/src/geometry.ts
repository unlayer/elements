/**
 * Where text sits across the page, without a browser: each box's left edge
 * and width at the width a document is read at, from the CSS that puts boxes
 * side by side (table cells, `display: table-cell`, inline-blocks, flex rows,
 * floats) and sizes and places them (width, max/min-width, padding, borders,
 * auto margins, `align`). Coarse on purpose: it tells a column from a stacked
 * block, which side text sits on, and about how wide its column is; not exact
 * positions, and nothing vertical.
 */

import type { DefaultTreeAdapterMap } from "parse5";
import { attr, isElement, StyledDocument, type StyledWord } from "./cascade";
import { autoTableWidths, wordWidth, type TableColumn } from "./text-width";

type Element = DefaultTreeAdapterMap["element"];
type Node = DefaultTreeAdapterMap["node"];

export type Align = "left" | "center" | "right";
/** An alignment, and whether it's the text's start or end (which flips where the direction does) rather than a side. */
export interface Flow {
  align: Align;
  logical?: "start" | "end";
  /** From an `align` attribute or <center> (the browser's -webkit-center): a table inside resets it. */
  legacy?: boolean;
  /** A text-align this can't read, here or above (what inherits it can't be placed). */
  unknown?: boolean;
}

/** An element's content box across the page, and how it aligns its inline content. */
export interface Placement {
  x: number;
  width: number;
  align: Align;
  /** The alignment is the text's start or end, so a box inside with the other direction flips it. */
  logical?: "start" | "end";
  /** It comes from an `align` attribute or <center>: a table inside starts over at the text's start. */
  legacy?: boolean;
  /** A property this needs couldn't be read (a rule it can't place): the placement is a guess. */
  unknown?: boolean;
  /**
   * How far its anchor may be from `x`'s: a column its content sizes sits where text widths put it, and
   * those are estimates (see `bandedPlacements`).
   */
  spread?: number;
}

const INLINE = new Set(["a", "span", "strong", "b", "em", "i", "u", "s", "small", "code", "sup", "sub", "font", "mark", "abbr", "label", "br", "big", "del", "ins", "kbd", "q", "samp", "tt", "var", "cite", "dfn", "time"]);
const DISPLAY: Record<string, string> = {
  table: "table",
  tr: "table-row",
  td: "table-cell",
  th: "table-cell",
  tbody: "table-row-group",
  thead: "table-row-group",
  tfoot: "table-row-group",
  li: "list-item",
  img: "inline-block",
  button: "inline-block",
  center: "block",
};

/** A length in px against `of` (for %); undefined when it isn't one (auto, a unit this can't size). */
function length(value: string | null | undefined, of: number): number | undefined {
  if (!value) return undefined;
  const text = value.trim().replace(/\s*!important$/i, "");
  // `calc()` of lengths added and taken away (`calc(50% - 4px)`).
  const calc = /^calc\((.*)\)$/i.exec(text);
  if (calc) {
    const terms = calc[1].trim().split(/\s+([+-])\s+/);
    let total = length(terms[0], of);
    for (let i = 1; i < terms.length && total !== undefined; i += 2) {
      const term = length(terms[i + 1], of);
      total = term === undefined ? undefined : terms[i] === "+" ? total + term : total - term;
    }
    return total;
  }
  const m = /^(-?[\d.]+)(px|%|em|rem|pt|ch)?$/.exec(text);
  if (!m) return undefined;
  const n = parseFloat(m[1]);
  switch (m[2]) {
    case "%":
      return (n * of) / 100;
    case "em":
    case "rem":
      return n * 16;
    case "pt":
      return (n * 4) / 3;
    case "ch":
      // About half the font size (the width of "0" in common fonts).
      return n * 8;
    default:
      return n;
  }
}

/** A value set that isn't a length this can work out (and isn't `auto`): where the box sits can't be told. */
function unreadable(value: string | null | undefined): boolean {
  if (value === null) return true;
  if (!value) return false;
  const text = value.trim().replace(/\s*!important$/i, "");
  return !/^(auto|none|initial|unset|0)$/i.test(text) && length(text, 100) === undefined;
}

/** Four sides from a shorthand and its longhands (`padding`, `padding-left`, …). */
function sides(doc: StyledDocument, element: Element, name: "padding" | "margin", of: number): { left: number; right: number; autoLeft: boolean; autoRight: boolean; leftSet: boolean; rightSet: boolean; unknown: boolean } {
  const all = doc.property(element, name);
  // `a` / `a b` / `a b c` / `a b c d`: right is the 2nd (else the 1st), left the 4th (else the right).
  const parts = all ? all.trim().replace(/\s*!important$/i, "").split(/\s+/) : [];
  let leftRaw = doc.property(element, `${name}-left`) || (parts[3] ?? parts[1] ?? parts[0] ?? "");
  let rightRaw = doc.property(element, `${name}-right`) || (parts[1] ?? parts[0] ?? "");
  let unknown = all === null || doc.property(element, `${name}-left`) === null || doc.property(element, `${name}-right`) === null || unreadable(leftRaw) || unreadable(rightRaw);
  // The logical sides (`padding-inline-start`, `margin-inline`): the start is the left, or the right right to left.
  // Set beside a physical side to another value, which one the cascade puts last isn't told: unknown.
  const inline = doc.property(element, `${name}-inline`);
  const pair = (inline ?? "").trim().replace(/\s*!important$/i, "").split(/\s+/).filter(Boolean);
  const startRaw = doc.property(element, `${name}-inline-start`) || pair[0] || "";
  const endRaw = doc.property(element, `${name}-inline-end`) || pair[1] || pair[0] || "";
  if (inline === null || doc.property(element, `${name}-inline-start`) === null || doc.property(element, `${name}-inline-end`) === null) unknown = true;
  const rtl = doc.look(element).get("direction") === "rtl";
  for (const [logical, side] of [[startRaw, rtl ? "right" : "left"], [endRaw, rtl ? "left" : "right"]] as const) {
    if (!logical) continue;
    const physical = side === "left" ? leftRaw : rightRaw;
    if (physical && physical.trim() !== logical.trim()) unknown = true;
    if (side === "left") leftRaw = logical;
    else rightRaw = logical;
    if (unreadable(logical)) unknown = true;
  }
  return {
    left: length(leftRaw, of) ?? 0,
    right: length(rightRaw, of) ?? 0,
    autoLeft: /^auto/i.test(leftRaw ?? ""),
    autoRight: /^auto/i.test(rightRaw ?? ""),
    leftSet: !!leftRaw,
    rightSet: !!rightRaw,
    unknown,
  };
}

function borderWidth(doc: StyledDocument, element: Element, side: "left" | "right"): number {
  const width = (own: string | null) => {
    if (!own || /\bnone\b|\bhidden\b/.test(own)) return 0;
    return own.split(/\s+/).map((p) => length(p, 0)).find((n) => n !== undefined) ?? 0;
  };
  const physical = width(doc.property(element, `border-${side}-width`) || doc.property(element, `border-${side}`) || doc.property(element, "border-width") || doc.property(element, "border"));
  // The logical side (`border-inline-start`): the start is the left, or the right right to left. Beside a
  // physical one, the wider (which the cascade puts last isn't told).
  const logical = (side === "left") !== (doc.look(element).get("direction") === "rtl") ? "start" : "end";
  const inline = doc.property(element, "border-inline-width") || doc.property(element, "border-inline");
  return Math.max(physical, width(doc.property(element, `border-inline-${logical}-width`) || doc.property(element, `border-inline-${logical}`) || inline));
}

/** Whether a set width includes the padding and borders: `box-sizing: border-box`, or a table's or button's default. */
function borderBox(element: Element, sizing: string | null): boolean {
  return sizing ? /^border-box/i.test(sizing.trim()) : /^(table|button)$/.test(element.tagName);
}

/** The padding and borders across a box: what a width set on its content box leaves outside it. */
function paddingAndBorders(doc: StyledDocument, element: Element, of: number): number {
  const padding = sides(doc, element, "padding", of);
  return padding.left + padding.right + borderWidth(doc, element, "left") + borderWidth(doc, element, "right");
}

function display(doc: StyledDocument, element: Element): string {
  const own = (doc.property(element, "display") ?? "").trim().replace(/\s*!important$/i, "").toLowerCase();
  // `inherit` takes the parent's; `initial`/`unset`/`revert` are inline (initial) or the element's default.
  if (own === "inherit" && isElement(element.parentNode)) return display(doc, element.parentNode);
  if (own === "initial" || own === "unset") return "inline";
  if (own && own !== "revert" && own !== "inherit") return own;
  return DISPLAY[element.tagName] ?? (INLINE.has(element.tagName) ? "inline" : "block");
}

/**
 * How a box aligns what's inline in it: its text-align, an `align` attribute (legacy, inherited as
 * text-align; a table's only places the table), or <center>'s own. Unset, it's what's above it: the
 * text's start or end where that's what's above, in this box's own direction. With `ownAlign` false, what
 * the element sets itself is left out (an inline box's own text-align aligns no line: its block's does).
 */
function textAlign(doc: StyledDocument, element: Element, inherited: Flow, rtl: boolean, ownAlign = true): Flow {
  const start: Flow = { align: rtl ? "right" : "left", logical: "start" };
  const end: Flow = { align: rtl ? "left" : "right", logical: "end" };
  // The browser resets an alignment that comes from an `align` attribute or <center> at a table.
  const reset = element.tagName === "table" && inherited.legacy;
  const unread = inherited.unknown ? { unknown: true } : {};
  const above: Flow = reset ? start : inherited.logical === "start" ? { ...start, ...unread } : inherited.logical === "end" ? { ...end, ...unread } : { align: inherited.align, ...(inherited.legacy ? { legacy: true } : {}), ...unread };
  if (!ownAlign) return above;
  const css = doc.property(element, "text-align");
  if (css === null) return { ...above, unknown: true };
  const own = css || (element.tagName === "table" || element.tagName === "img" ? "" : attr(element, "align")) || (element.tagName === "center" ? "center" : "");
  if (!own) return above;
  const v = own.trim().toLowerCase().replace(/\s*!important$/, "");
  const legacy = !css || /^-webkit-/.test(v) ? { legacy: true } : {};
  if (/center/.test(v)) return { align: "center", ...legacy };
  if (v === "right" || v === "-webkit-right") return { align: "right", ...legacy };
  if (v === "left" || v === "-webkit-left") return { align: "left", ...legacy };
  // A justified paragraph's last line sits at the start.
  if (v === "start" || v === "justify" || v === "justify-all") return start;
  if (v === "end") return end;
  return above;
}

/** The box's text direction: its CSS `direction`, else its `dir` attribute, else what's above it; undefined for `dir="auto"` (it depends on the text). */
function direction(doc: StyledDocument, element: Element, inherited: boolean): boolean | undefined {
  const css = (doc.property(element, "direction") ?? "").trim().toLowerCase();
  if (css === "rtl" || css === "ltr") return css === "rtl";
  const dir = (attr(element, "dir") ?? "").trim().toLowerCase();
  if (dir === "rtl" || dir === "ltr") return dir === "rtl";
  return dir === "auto" ? undefined : inherited;
}

/**
 * Every element's placement in `doc` (inline elements take their box's).
 * The page is `doc.width` wide; the body's own margin (8px by default) counts.
 */
export function placements(doc: StyledDocument): Map<Element, Placement> {
  const out = new Map<Element, Placement>();
  const body = doc.elements().find((e) => e.tagName === "body");
  if (!body) return out;
  const html = doc.elements().find((e) => e.tagName === "html");
  const rtl = /^rtl$/i.test(attr(html ?? body, "dir") ?? "") || /^rtl$/i.test(attr(body, "dir") ?? "");
  // The body: 8px margins unless it sets its own.
  const bodyMargin = sides(doc, body, "margin", doc.width);
  const set = (doc.property(body, "margin") ?? "") !== "" || (doc.property(body, "margin-left") ?? "") !== "";
  const left = set ? bodyMargin.left : 8;
  const right = set ? bodyMargin.right : 8;
  place(doc, body, left, doc.width - left - right, { align: rtl ? "right" : "left", logical: "start" }, undefined, rtl, out, false);
  return out;
}

/**
 * Place `element` in a containing box (`x`, `available`): its own width and
 * position, then its children. `blockAlign` is how an `align` attribute above
 * places block children (the browser centers them under `align="center"`).
 */
function place(doc: StyledDocument, element: Element, x: number, available: number, inherited: Flow, blockAlign: Align | undefined, rtlAbove: boolean, out: Map<Element, Placement>, inline: boolean, givenWidth?: number): Placement {
  const kind = display(doc, element);
  // Its own direction (a `dir` on it flips where its text starts); `dir="auto"` depends on the text.
  const ownDirection = direction(doc, element, rtlAbove);
  const rtl = ownDirection ?? rtlAbove;
  // A box as wide as its content (`width: fit-content`, `max-width: min-content`, a badge): its text starts at its start edge.
  const sized = (name: string) => /^(min|max|fit)-content$/i.test((doc.property(element, name) ?? "").trim().replace(/\s*!important$/i, ""));
  const hugs = sized("width") || sized("max-width");
  let unknown =
    ownDirection === undefined ||
    doc.property(element, "display") === null ||
    ["width", "min-width", "max-width"].filter((name) => !sized(name)).some((name) => unreadable(doc.property(element, name))) ||
    ["text-align", "justify-content", "place-content", "float"].some((name) => doc.property(element, name) === null);
  // Its outer width: given (a cell's share), set (width, the width attribute), or all there is; then max-/min-width.
  const margin = sides(doc, element, "margin", available);
  // A table cell's width is its share of the row (browsers ignore max-/min-width on cells).
  const cell = givenWidth !== undefined || kind === "table-cell";
  // A width set on the content box (the default but for tables and buttons) leaves its padding and borders outside.
  const sizing = doc.property(element, "box-sizing");
  if (sizing === null) unknown = true;
  const around = cell || borderBox(element, sizing) ? 0 : paddingAndBorders(doc, element, available);
  const set = (value: number | undefined) => (value === undefined ? undefined : value + around);
  const declared = set(length(doc.property(element, "width"), available) ?? length(attr(element, "width"), available));
  let width = givenWidth ?? declared ?? (inline ? undefined : available - margin.left - margin.right);
  const max = cell ? undefined : set(length(doc.property(element, "max-width"), available));
  const min = cell ? undefined : set(length(doc.property(element, "min-width"), available));
  if (width !== undefined && max !== undefined) width = Math.min(width, max);
  if (width !== undefined && min !== undefined) width = Math.max(width, min);
  if (width === undefined && max !== undefined) width = Math.min(max, available);
  const outer = width ?? available;
  // Where it starts: auto margins, then an `align` above (or its own on a table), else its margin.
  let left = x + margin.left;
  if (givenWidth === undefined && !inline && outer < available - margin.left - margin.right - 0.5) {
    // A table's `align` gives it auto margins, which CSS overrides only on the sides it sets (React Email's
    // `align="center"` with `margin-right: auto` stays centered).
    const own = element.tagName === "table" ? (attr(element, "align") ?? "").toLowerCase() : "";
    const autoLeft = margin.autoLeft || (!margin.leftSet && (own === "center" || own === "right"));
    const autoRight = margin.autoRight || (!margin.rightSet && (own === "center" || own === "left"));
    const spare = available - outer;
    const position: Align | undefined = autoLeft && autoRight ? "center" : autoLeft ? "right" : autoRight ? "left" : margin.leftSet || margin.rightSet ? undefined : blockAlign;
    if (position === "center") left = x + spare / 2;
    else if (position === "right") left = x + spare - margin.right;
  }
  const padding = sides(doc, element, "padding", available);
  const cellPadding = element.tagName === "td" || element.tagName === "th" ? Number(attr(tableOf(element) ?? element, "cellpadding") ?? NaN) : NaN;
  const padLeft = Number.isFinite(cellPadding) && !padding.left ? cellPadding : padding.left;
  const padRight = Number.isFinite(cellPadding) && !padding.right ? cellPadding : padding.right;
  const contentX = left + borderWidth(doc, element, "left") + padLeft;
  const contentWidth = Math.max(0, outer - borderWidth(doc, element, "left") - borderWidth(doc, element, "right") - padLeft - padRight);
  // A flex row places its own text (an anonymous item) by justify-content (a column's is vertical).
  const justify = /flex$/.test(kind) && !/column/.test(doc.property(element, "flex-direction") ?? "") ? justifyContent(doc, element) : "";
  const text = textAlign(doc, element, inherited, rtl);
  const justified = /center|end|right|left/.test(justify);
  let flow: Flow = justified ? { align: flexAlign(justify, rtl) } : text;
  if (hugs) {
    // Where the box itself sits depends on its content's width when something centers it, or it starts on the right.
    if (rtl || margin.autoLeft || margin.autoRight || (blockAlign !== undefined && blockAlign !== "left")) unknown = true;
    flow = { align: "left" };
  }
  const placement: Placement = { x: contentX, width: contentWidth, ...flow, ...(unknown || flow.unknown || margin.unknown || padding.unknown ? { unknown: true } : {}) };
  out.set(element, placement);
  // An `align` attribute (not CSS text-align) also places block children (`-webkit-center`). A CSS
  // text-align on the element overrides it, and what it inherits from above.
  const own = (attr(element, "align") ?? "").toLowerCase();
  const cssAlign = !!doc.property(element, "text-align");
  // A table inside starts over: the browser resets the -webkit-center an `align` attribute gives.
  const childBlockAlign: Align | undefined =
    element.tagName === "table" ? undefined
    : cssAlign ? undefined
    : own === "center" || element.tagName === "center" ? "center" : own === "right" ? "right" : own === "left" ? "left" : blockAlign;
  // (A flex item's text lines up by the box's text-align, which it inherits, not by justify-content.)
  placeChildren(doc, element, kind, justified && !hugs ? { ...placement, ...text, ...(placement.unknown ? { unknown: true } : {}) } : placement, childBlockAlign, rtl, out);
  // A layout the check doesn't model places what's in it as unknown (the check fails on it), never as block flow.
  if (unmodeled(doc, element, kind)) unknownWithin(element, out);
  return placement;
}

/** The display values the check places. */
const PLACED = /^(block|inline|inline-block|flex|inline-flex|flow-root|list-item|table|inline-table|table-row|table-cell|table-row-group|table-header-group|table-footer-group|table-column|table-column-group|none)$/;

/**
 * Whether a box lays out what's in it in a way the check doesn't model: a grid, columns of text, a box taken out
 * of the flow, flex items that wrap or (in a column) don't stretch, vertical text, size containment, a width
 * from an aspect ratio, or a display it doesn't know. Each depends on things the check
 * doesn't read (heights, content sizes), so the same CSS on both sides isn't the same layout.
 */
function unmodeled(doc: StyledDocument, element: Element, kind: string): boolean {
  const read = (name: string) => {
    const value = doc.property(element, name);
    return value === null ? null : value.trim().toLowerCase().replace(/\s*!important$/, "");
  };
  const is = (name: string, neutral: RegExp) => {
    const value = read(name);
    return value === null || (value !== "" && !neutral.test(value));
  };
  if (!PLACED.test(kind)) return true;
  if (is("position", /^(static|relative|initial|unset|revert|revert-layer)$/)) return true;
  if (is("column-count", /^(auto|initial|unset)$/) || is("column-width", /^(auto|initial|unset)$/) || is("columns", /^(auto|auto auto|initial|unset)$/)) return true;
  if (is("writing-mode", /^(horizontal-tb|initial|unset)$/)) return true;
  if (is("contain", /^(none|layout|style|layout style|style layout|initial|unset)$/)) return true;
  // A width from an aspect ratio: set, with no width of its own.
  if (is("aspect-ratio", /^(auto|initial|unset)$/) && !read("width") && !attr(element, "width")) return true;
  if (/flex$/.test(kind)) {
    if (is("flex-wrap", /^(nowrap|initial|unset)$/) || /wrap/.test(read("flex-flow") ?? "?")) return true;
    // A column: its items are as wide as it (stretched) unless aligned otherwise.
    if (/column/.test(read("flex-direction") ?? "?") || /column/.test(read("flex-flow") ?? "")) {
      const stretched = /^(|normal|stretch|initial|unset)$/;
      if (is("align-items", stretched) || is("place-items", stretched)) return true;
      const own = /^(|auto|normal|stretch|initial|unset)$/;
      for (const child of element.childNodes) {
        if (!isElement(child)) continue;
        for (const name of ["align-self", "place-self"]) {
          const value = doc.property(child, name);
          if (value === null || !own.test(value.trim().toLowerCase().replace(/\s*!important$/, ""))) return true;
        }
      }
    }
  }
  return false;
}

const VISIBLE_TEXT = /[^\s\u200b-\u200d\u2060\ufeff]/;

/** Whether an element holds text a reader sees (not just spaces, or markup in comments). */
function hasText(element: Element): boolean {
  return element.childNodes.some((n) => (n.nodeName === "#text" ? VISIBLE_TEXT.test((n as { value?: string }).value ?? "") : isElement(n) && hasText(n)));
}

/** Marks an element and what's placed inside it as unknown. */
function unknownWithin(element: Element, out: Map<Element, Placement>): void {
  for (const [e, p] of out) if (e === element || contains(element, e)) out.set(e, { ...p, unknown: true });
}

function contains(ancestor: Element, element: Element): boolean {
  for (let up = element.parentNode; isElement(up); up = up.parentNode) if (up === ancestor) return true;
  return false;
}

function tableOf(element: Element): Element | undefined {
  for (let up = element.parentNode; isElement(up); up = up.parentNode) if (up.tagName === "table") return up;
  return undefined;
}

/** Element children worth placing (not hidden by `display: none`). */
function children(doc: StyledDocument, element: Element): Element[] {
  const kids = element.childNodes.filter(isElement) as Element[];
  return kids.filter((k) => !/^none/i.test(doc.property(k, "display") ?? ""));
}

function placeChildren(doc: StyledDocument, element: Element, kind: string, box: Placement, blockAlign: Align | undefined, rtl: boolean, out: Map<Element, Placement>): void {
  const kids = children(doc, element);
  if (!kids.length) return;
  // Table rows: cells side by side. Cells straight in a table (Elements' `display: table` row) are one row.
  if (kind === "table" || kind === "table-row-group" || kind === "inline-table") {
    let cells: Element[] = [];
    const flushCells = () => {
      if (cells.length) row(doc, element, cells, box, blockAlign, rtl, out);
      cells = [];
    };
    for (const kid of kids) {
      const k = display(doc, kid);
      if (k === "table-cell") {
        cells.push(kid);
        continue;
      }
      flushCells();
      if (k === "table-row") row(doc, kid, cellsOf(doc, kid), box, blockAlign, rtl, out);
      else place(doc, kid, box.x, box.width, box, blockAlign, rtl, out, false);
    }
    flushCells();
    return;
  }
  if (kind === "table-row") {
    row(doc, element, cellsOf(doc, element), box, blockAlign, rtl, out);
    return;
  }
  // `display: table-cell` siblings (Elements' columns), floats, inline-blocks, a flex row: side by side.
  const flex = /^(inline-)?flex$/.test(kind) && !/column/i.test(doc.property(element, "flex-direction") ?? "");
  const sideBySide = (k: Element) => {
    const d = display(doc, k);
    return d === "table-cell" || d === "inline-block" || d === "inline-table" || d === "inline-flex" || /^(left|right)$/i.test(doc.property(k, "float") ?? "");
  };
  let run: Element[] = [];
  const flush = () => {
    if (run.length) line(doc, run, box, blockAlign, rtl, out, flex);
    run = [];
  };
  // Content after a float flows around it: where its lines sit depends on the float's height, which isn't modeled.
  let afterFloat = false;
  for (const kid of kids) {
    if (flex || sideBySide(kid)) {
      run.push(kid);
      if (/^(left|right)$/i.test(doc.property(kid, "float") ?? "")) afterFloat = true;
      continue;
    }
    flush();
    const inline = display(doc, kid) === "inline";
    place(doc, kid, box.x, box.width, box, blockAlign, rtl, out, inline);
    // Its text is on its block's lines, aligned as they are: its own text-align reaches only blocks inside it.
    if (inline) out.set(kid, { ...box, ...textAlign(doc, kid, box, direction(doc, kid, rtl) ?? rtl, false) });
    if (/^(both|left|right)$/i.test(doc.property(kid, "clear") ?? "")) afterFloat = false;
    if (afterFloat) unknownWithin(kid, out);
  }
  flush();
  // Inline text and inline-blocks in one box share lines: where each sits depends on the others' widths.
  const text = element.childNodes.some((n) => n.nodeName === "#text" && VISIBLE_TEXT.test((n as { value?: string }).value ?? ""));
  // Only inline boxes with text of their own take room on the line (not a button's empty Outlook spacers).
  const inlines = kids.filter((k) => display(doc, k) === "inline" && hasText(k));
  const atomic = kids.filter((k) => /^inline-(block|table|flex|grid)$/.test(display(doc, k)) && !/^(left|right)$/i.test(doc.property(k, "float") ?? ""));
  if (atomic.length && (text || inlines.length)) for (const k of [...atomic, ...inlines]) unknownWithin(k, out);
}

/** A table's first row: the first `tr` (or row-displayed box) in it, not in a table inside it. */
function firstRow(doc: StyledDocument, table: Element): Element | undefined {
  const find = (node: Element): Element | undefined => {
    for (const child of node.childNodes) {
      if (!isElement(child)) continue;
      if (child.tagName === "tr" || display(doc, child) === "table-row") return child;
      if (/^(inline-)?table$/.test(display(doc, child))) continue;
      const found = find(child);
      if (found) return found;
    }
    return undefined;
  };
  return find(table);
}

function cellsOf(doc: StyledDocument, rowElement: Element): Element[] {
  return children(doc, rowElement).filter((c) => display(doc, c) === "table-cell" || c.tagName === "td" || c.tagName === "th");
}

/**
 * A table row: each cell's width set (px or %); cells without one, beside others, as wide as the browser's
 * automatic table layout makes them (by their content), or unknown where their content can't be measured.
 * Then in the row's direction: left to right, or right to left.
 */
function row(doc: StyledDocument, rowElement: Element, cells: Element[], box: Placement, blockAlign: Align | undefined, rtl: boolean, out: Map<Element, Placement>): void {
  if (!out.has(rowElement)) out.set(rowElement, box);
  // The space around each cell (`border-spacing`, else the `cellspacing` attribute, else the browser's 2px for
  // a <table>), unless the borders collapse.
  // (The table is the box displayed as one: a <table>, or Elements' `display: table` row.)
  let table: Element | undefined = rowElement;
  while (table && !/^(inline-)?table$/.test(display(doc, table))) table = isElement(table.parentNode) ? table.parentNode : undefined;
  let spacing = 0;
  let spacingUnknown = false;
  if (table) {
    const collapse = doc.property(table, "border-collapse");
    const css = doc.property(table, "border-spacing");
    const attribute = Number(attr(table, "cellspacing") ?? NaN);
    if (collapse === null || css === null) spacingUnknown = true;
    else if (!/^collapse/i.test(collapse.trim())) {
      const first = css.trim().replace(/\s*!important$/i, "").split(/\s+/)[0];
      // (The browser's 2px is its style for <table>; a box displayed as a table starts at 0.)
      const value = first ? length(first, 0) : Number.isFinite(attribute) ? attribute : table.tagName === "table" ? 2 : 0;
      if (value === undefined) spacingUnknown = true;
      else spacing = value;
    }
  }
  box = { ...box, x: box.x + spacing, width: Math.max(0, box.width - spacing * (cells.length + 1)) };
  const widths = cells.map((c) => length(doc.property(c, "width"), box.width) ?? length(attr(c, "width"), box.width) ?? length(doc.property(c, "min-width"), box.width));
  let unmeasured = false;
  let sized = false;
  // A fixed table layout (with a width set on the table) gives cells their set widths and shares the rest
  // equally, whatever they hold; its first row decides, so a later row set otherwise is unknown.
  const layout = table ? doc.property(table, "table-layout") : "";
  const fixedLayout = !!table && /^fixed/i.test(layout ?? "") && !!(doc.property(table, "width") || attr(table, "width"));
  if (layout === null) unmeasured = true;
  if (fixedLayout && table) {
    const first = firstRow(doc, table);
    if (first && first !== rowElement) {
      const firstWidths = cellsOf(doc, first).map((c) => doc.property(c, "width") || attr(c, "width") || "");
      if (firstWidths.length !== cells.length || cells.some((c, i) => (doc.property(c, "width") || attr(c, "width") || "") !== firstWidths[i])) unmeasured = true;
    }
  }
  if (!fixedLayout && cells.length > 1 && widths.some((w) => w === undefined)) {
    const columns = cells.map((c, i): TableColumn | undefined => {
      const needs = extent(doc, c);
      return needs && { ...needs, ...(widths[i] !== undefined ? { set: widths[i] } : {}) };
    });
    if (columns.every((c): c is TableColumn => c !== undefined)) {
      autoTableWidths(columns, box.width).forEach((w, i) => (widths[i] = w));
      sized = true;
    } else unmeasured = true;
  }
  const fixed = widths.reduce<number>((a, w) => a + (w ?? 0), 0);
  const free = widths.filter((w) => w === undefined).length;
  const share = free ? Math.max(0, box.width - fixed) / free : 0;
  // Set widths that add up past the row share it out in proportion, as a 100%-wide table does.
  const total = fixed + share * free;
  // (Content wider than the row runs over it: each column keeps its min-content.)
  const scale = !sized && total > box.width && total > 0 ? box.width / total : 1;
  let x = rtl ? box.x + box.width : box.x;
  // A cell floated, or (beside other cells) displayed as something else, isn't a cell to the browser: cells
  // displayed as blocks share one anonymous cell and stack. One such cell alone lays out as a cell would.
  const broken = cells.some((c) => /^(left|right)$/i.test(doc.property(c, "float") ?? "")) || (cells.length > 1 && cells.some((c) => display(doc, c) !== "table-cell"));
  for (let i = 0; i < cells.length; i++) {
    const w = (widths[i] ?? share) * scale;
    if (rtl) x -= w;
    place(doc, cells[i], x, w, box, blockAlign, rtl, out, false, w);
    if (broken || unmeasured || spacingUnknown) unknownWithin(cells[i], out);
    x += rtl ? -spacing : w + spacing;
  }
}

/** Text widths are worked out at this scale: the check reads a page at a low and a high estimate too. */
let textScale = 1;
/**
 * The width taken for an image without a px width (its file's own size, which the check doesn't fetch):
 * the check reads a page with none and with one wider than any row, and passes what holds at both.
 */
let imageGuess = 0;
const WIDEST = 2000;

/**
 * What a box's content needs across: its widest unbreakable run of text or
 * box (min-content) and its widest line unwrapped (max-content), padding,
 * borders and margins in. From the text (each piece at its font size and
 * weight), boxes with a width in px, and images without one at `imageGuess`;
 * undefined where it can't be told: a box sized in % (other than all of
 * it), a flex or grid box.
 */
function extent(doc: StyledDocument, element: Element): { min: number; max: number } | undefined {
  const kind = display(doc, element);
  if (/flex|grid/.test(kind)) return undefined;
  const margin = sides(doc, element, "margin", 0);
  const padding = sides(doc, element, "padding", 0);
  if (margin.unknown || padding.unknown || doc.property(element, "width") === null) return undefined;
  const around = margin.left + margin.right + padding.left + padding.right + borderWidth(doc, element, "left") + borderWidth(doc, element, "right");
  const declared = (doc.property(element, "width") || attr(element, "width") || "").trim().replace(/\s*!important$/i, "");
  // An image sized in % of its cell gives way to the rest (as the browser's min-content does), up to its own size.
  if (element.tagName === "img" && /%$/.test(declared)) return { min: around, max: imageGuess + around };
  if (/%$/.test(declared) && parseFloat(declared) < 100) return undefined;
  const px = /%$/.test(declared) ? undefined : length(declared, 0);
  const set = px === undefined ? undefined : px + margin.left + margin.right + (borderBox(element, doc.property(element, "box-sizing")) ? 0 : around - margin.left - margin.right);
  if (set !== undefined) return { min: set, max: set };
  if (element.tagName === "img") return { min: imageGuess + around, max: imageGuess + around };
  if (kind === "table-row") {
    // Cells side by side: the row needs what they all need.
    const cells = cellsOf(doc, element).map((c) => extent(doc, c));
    if (cells.some((c) => !c)) return undefined;
    return cells.reduce<{ min: number; max: number }>((a, c) => ({ min: a.min + c!.min, max: a.max + c!.max }), { min: around, max: around });
  }
  let min = 0;
  let max = 0;
  let line = 0;
  const flush = () => {
    max = Math.max(max, line);
    line = 0;
  };
  for (const node of element.childNodes) {
    if (node.nodeName === "#text") {
      const text = ((node as { value?: string }).value ?? "").replace(/[ \t\r\n]+/g, " ");
      const style = doc.style(element);
      if (!text || style.hidden || style.visible === false) continue;
      const measure = (t: string) => wordWidth(style.transform === "uppercase" ? t.toUpperCase() : t, style.size ?? 16, { bold: (style.weight ?? 400) >= 600, exact: true }) * textScale;
      line += measure(text);
      // A non-breaking space joins words; a line breaks at spaces and after hyphens.
      for (const unit of text.split(" ").flatMap((w) => w.split(/(?<=-)/))) if (unit) min = Math.max(min, measure(unit));
      continue;
    }
    if (!isElement(node) || /^none/i.test(doc.property(node, "display") ?? "")) continue;
    if (node.tagName === "br") {
      flush();
      continue;
    }
    const inner = extent(doc, node);
    if (!inner) return undefined;
    min = Math.max(min, inner.min);
    const k = display(doc, node);
    if (k === "inline" || /^inline-/.test(k)) line += inner.max;
    else {
      flush();
      max = Math.max(max, inner.max);
    }
  }
  flush();
  return { min: min + around, max: max + around };
}

/** How far the text-width estimates may be off, either way: the check passes a word only where it holds at both. */
const LOW = 0.9;
const HIGH = 1.12;
const banded = new WeakMap<StyledDocument, Map<Element, Placement>>();

/**
 * Each element's placement at the middle estimate, with how far its anchor
 * moves at the low and the high one (`spread`): where cells are sized by
 * their content, what the check compares has to hold at either end.
 */
export function bandedPlacements(doc: StyledDocument): Map<Element, Placement> {
  const cached = banded.get(doc);
  if (cached) return cached;
  const at = (scale: number, image: number) => {
    textScale = scale;
    imageGuess = image;
    try {
      return placements(doc);
    } finally {
      textScale = 1;
      imageGuess = 0;
    }
  };
  const mid = at(1, 0);
  const others = [at(LOW, 0), at(HIGH, 0), at(LOW, WIDEST), at(HIGH, WIDEST)];
  const out = new Map<Element, Placement>();
  for (const [element, p] of mid) {
    const ends = others.map((o) => o.get(element));
    const spread = Math.max(0, ...ends.map((e) => (e ? Math.abs(anchor(e) - anchor(p)) : 0)));
    const unknown = p.unknown || ends.some((e) => e?.unknown);
    out.set(element, { ...p, ...(spread > 0.5 ? { spread } : {}), ...(unknown ? { unknown: true } : {}) });
  }
  banded.set(doc, out);
  return out;
}

/**
 * Boxes on one line (inline-blocks, cells, floats, flex items): each its set
 * width (or an equal share of what's left), wrapping when the line is full,
 * each line placed by the box's text-align.
 */
function line(doc: StyledDocument, items: Element[], box: Placement, blockAlign: Align | undefined, rtl: boolean, out: Map<Element, Placement>, flex: boolean): void {
  const widths = items.map((k) => {
    const margin = sides(doc, k, "margin", box.width);
    // A max-width only caps a box that shrinks to its content: it isn't its width.
    const w = length(doc.property(k, "width"), box.width) ?? length(attr(k, "width"), box.width) ?? length(doc.property(k, "min-width"), box.width) ?? (flex ? length(doc.property(k, "flex-basis"), box.width) : undefined);
    return w === undefined ? undefined : w + margin.left + margin.right;
  });
  // Flex items that grow (`flex: 1`) share what's left equally: they don't shrink to their content.
  const grows = (k: Element) => {
    const shorthand = (doc.property(k, "flex") ?? "").trim().split(/\s+/)[0];
    return parseFloat(doc.property(k, "flex-grow") || (/^\d/.test(shorthand ?? "") ? shorthand : "") || "0") > 0;
  };
  // A side margin on an item placed by its share or its content moves it by an amount this doesn't work out:
  // one that could move it by half the distance the check allows, or an auto one, leaves it unplaced.
  const shifted = (element: Element) => {
    const margin = sides(doc, element, "margin", box.width);
    // (An auto margin moves a flex item; on an inline-block it's 0.)
    if (margin.unknown || (flex && (margin.autoLeft || margin.autoRight)) || Math.abs(margin.left) >= 60 || Math.abs(margin.right) >= 60) unknownWithin(element, out);
  };
  // The space between flex items (`column-gap`, or `gap`'s second value or only one).
  let gap = 0;
  let gapUnknown = false;
  if (flex) {
    const container = items[0].parentNode as Element;
    const column = doc.property(container, "column-gap");
    const both = doc.property(container, "gap");
    const parts = (both ?? "").trim().replace(/\s*!important$/i, "").split(/\s+/).filter(Boolean);
    const raw = (column || parts[1] || parts[0] || "").trim().replace(/\s*!important$/i, "");
    gapUnknown = column === null || both === null || (!/^(normal|0)?$/i.test(raw) && length(raw, box.width) === undefined);
    gap = /^normal$/i.test(raw) ? 0 : length(raw, box.width) ?? 0;
  }
  const unknownAll = () => items.forEach((element) => unknownWithin(element, out));
  if (flex && widths.every((w) => w === undefined) && items.every(grows)) {
    const share = Math.max(0, box.width - gap * (items.length - 1)) / items.length;
    items.forEach((element, i) => {
      place(doc, element, rtl ? box.x + box.width - (i + 1) * share - i * gap : box.x + i * (share + gap), share, box, blockAlign, rtl, out, false, share);
      shifted(element);
    });
    if (gapUnknown) unknownAll();
    return;
  }
  // Boxes that shrink to their content (a button: an inline-block without a width), each alone at an edge of
  // the line, sit where the line's alignment puts them: their text lines up as the line's does. In a flex row
  // without widths, the first item starts the row and the last ends it (space-between), or all sit by
  // justify-content.
  const justify = flex ? justifyContent(doc, items[0].parentNode as Element) : "";
  const [start, end]: Align[] = rtl ? ["right", "left"] : ["left", "right"];
  const edges = items.map((element, i): Align => {
    const float = (doc.property(element, "float") ?? "").trim().toLowerCase();
    return !flex && (float === "left" || float === "right")
      ? float
      : !flex
      ? box.align
      : /space-between|space-around|space-evenly/.test(justify)
        ? items.length === 1 ? start : i === 0 ? start : i === items.length - 1 ? end : "center"
        : flexAlign(justify, rtl);
  });
  // (Two at one edge sit one after the other, and one centered between others is centered in what's left.)
  const alone = items.length === 1 || (new Set(edges).size === edges.length && !edges.includes("center"));
  if (widths.every((w) => w === undefined) && alone) {
    items.forEach((element, i) => {
      const align = edges[i];
      const own = textAlign(doc, element, { align }, rtl).align;
      // On one line, its own text-align doesn't move its text, the line's does; wider than the line, it fills
      // it and its text lines up by its own. Where its width can't be told: unknown.
      const needs = own !== align ? extent(doc, element) : undefined;
      const placement: Placement = { x: box.x, width: box.width, align: needs && needs.max > box.width ? own : align };
      out.set(element, placement);
      placeChildren(doc, element, display(doc, element), placement, blockAlign, rtl, out);
      out.set(element, placement);
      if (own !== align && !needs) unknownWithin(element, out);
      shifted(element);
    });
    return;
  }
  // Otherwise each takes its width: set, a share (a cell, a flex item that grows), or its content's, by the
  // text widths' estimate (where that can't be told, the line is unknown).
  let unmeasured = false;
  for (let i = 0; i < items.length; i++) {
    if (widths[i] !== undefined || display(doc, items[i]) === "table-cell" || (flex && grows(items[i]))) continue;
    const needs = extent(doc, items[i]);
    if (needs) widths[i] = Math.min(needs.max, box.width);
    else unmeasured = true;
  }
  const fixed = widths.reduce<number>((a, w) => a + (w ?? 0), 0);
  const free = widths.filter((w) => w === undefined).length;
  const share = free ? Math.max(0, box.width - fixed - gap * (items.length - 1)) / free : 0;
  // Lines: fill up to the box's width.
  const lines: Array<Array<{ element: Element; width: number }>> = [[]];
  let used = 0;
  items.forEach((element, i) => {
    const width = Math.min(widths[i] ?? share, box.width);
    if (!flex && used + width > box.width + 0.5 && lines[lines.length - 1].length) {
      lines.push([]);
      used = 0;
    }
    lines[lines.length - 1].push({ element, width });
    used += width;
  });
  // Boxes floated right sit from the line's right edge, in order; the rest as the line places them.
  const floatsRight = (element: Element) => !flex && /^right$/i.test((doc.property(element, "float") ?? "").trim());
  let right = box.x + box.width;
  for (const items_ of lines) {
    for (const it of items_.filter((item) => floatsRight(item.element))) {
      right -= it.width;
      const margin = sides(doc, it.element, "margin", box.width);
      place(doc, it.element, right, it.width - margin.left - margin.right, box, blockAlign, rtl, out, false, it.width - margin.left - margin.right);
    }
  }
  let overflows = false;
  for (const all of lines) {
    const items_ = all.filter((item) => !floatsRight(item.element));
    const total = items_.reduce((a, it) => a + it.width, 0) + gap * Math.max(0, items_.length - 1);
    // A flex row wider than its box shrinks its items, by amounts this doesn't work out.
    overflows ||= flex && total > box.width + 0.5;
    const spare = Math.max(0, box.width - total);
    const align = flex ? flexAlign(justify, rtl) : box.align;
    const spread = flex && /space-between/.test(justify) && items_.length > 1 ? spare / (items_.length - 1) : 0;
    // (Spread out, the items fill the row from edge to edge.)
    let x = box.x + (spread ? 0 : align === "center" ? spare / 2 : align === "right" ? spare : 0);
    // Right to left, the first box is the rightmost.
    for (const it of rtl ? [...items_].reverse() : items_) {
      const margin = sides(doc, it.element, "margin", box.width);
      place(doc, it.element, x, it.width - margin.left - margin.right, box, blockAlign, rtl, out, false, it.width - margin.left - margin.right);
      x += it.width + spread + gap;
    }
  }
  if (gapUnknown || unmeasured || overflows) unknownAll();
}

/** A flex box's `justify-content`, or what `place-content` gives it (its second value, else its only one). */
function justifyContent(doc: StyledDocument, element: Element): string {
  const own = (doc.property(element, "justify-content") ?? "").trim().toLowerCase();
  if (own) return own;
  const place = (doc.property(element, "place-content") ?? "").trim().toLowerCase().split(/\s+/).filter(Boolean);
  return place[1] ?? place[0] ?? "";
}

/** Where a flex row's `justify-content` puts its items: its start and end are the right and left right to left. */
function flexAlign(justify: string, rtl: boolean): Align {
  if (/center/.test(justify)) return "center";
  if (/\bleft\b/.test(justify)) return "left";
  if (/\bright\b/.test(justify)) return "right";
  return /end/.test(justify) !== rtl ? "right" : "left";
}

/** Where a line of text in `p` lines up: its left edge, center or right edge, by its alignment. */
export function anchor(p: Placement): number {
  return p.align === "center" ? p.x + p.width / 2 : p.align === "right" ? p.x + p.width : p.x;
}

/** The placement of the box a node sits in: its nearest placed ancestor (or itself). */
export function placementOf(map: Map<Element, Placement>, node: Node): Placement | undefined {
  for (let n: Node | null = node; n; n = (n as { parentNode?: Node | null }).parentNode ?? null) {
    if (isElement(n) && map.has(n)) return map.get(n);
  }
  return undefined;
}

/** Text that sits elsewhere across the page, by more than the model's own error. */
export interface LayoutDifference {
  /** The words. */
  items: string[];
  /** How far, in px at the width read (negative: to the left). */
  by: number;
}

/**
 * Words whose place across the page the check can't work out on one side or
 * both: a width, padding, margin or display there that it can't read. Read
 * as anywhere, a move would pass unseen, so the check fails on them (unknown
 * on both sides, whether they sit in the same place can't be told either).
 */
export function unplaced(original: StyledDocument, converted: StyledDocument, a: StyledWord[], b: StyledWord[]): Array<{ side: "original" | "migrated"; words: string[] }> {
  const pa = bandedPlacements(original);
  const pb = bandedPlacements(converted);
  const out = { original: [] as string[], migrated: [] as string[] };
  for (let i = 0; i < a.length && i < b.length; i++) {
    if (!a[i].shown || !a[i].at || !b[i].at) continue;
    const x = placementOf(pa, a[i].at!);
    const y = placementOf(pb, b[i].at!);
    if (!x || !y || (!x.unknown && !y.unknown)) continue;
    // Unknown on both sides tells nothing about whether it moved: listed on the original's side.
    out[x.unknown ? "original" : "migrated"].push(a[i].word);
  }
  return (["original", "migrated"] as const).filter((side) => out[side].length).map((side) => ({ side, words: out[side] }));
}

/**
 * Moves the model can tell from its own error: on the 106 benchmark
 * templates it reads at most 100px apart where a browser shows no move,
 * while a column stacked or swapped, or a block moved to the other side,
 * moves text 150px or more.
 */
export const MOVED_PX = 120;

/**
 * Words (the same words, in order, on both sides) whose position across the
 * page differs: each document's anchors (a line's left edge, center or right
 * edge), after the shift the whole email may have (the median difference).
 * Images aren't compared: where an image sits often depends on sizes the
 * model infers from content (a flex item, a shrink-to-fit box).
 */
export function compareLayout(original: StyledDocument, converted: StyledDocument, a: StyledWord[], b: StyledWord[]): LayoutDifference[] {
  const pa = bandedPlacements(original);
  const pb = bandedPlacements(converted);
  const pairs: Array<{ item: string; x: number; y: number; spread: number }> = [];
  for (let i = 0; i < a.length && i < b.length; i++) {
    if (!a[i].shown || !a[i].at || !b[i].at) continue;
    const x = placementOf(pa, a[i].at!);
    const y = placementOf(pb, b[i].at!);
    if (!x || !y || x.unknown || y.unknown) continue;
    pairs.push({ item: a[i].word, x: anchor(x), y: anchor(y), spread: (x.spread ?? 0) + (y.spread ?? 0) });
  }
  if (!pairs.length) return [];
  const diffs = pairs.map((p) => p.y - p.x).sort((p, q) => p - q);
  const shift = diffs[Math.floor(diffs.length / 2)];
  const out: LayoutDifference[] = [];
  for (const p of pairs) {
    const by = Math.round(p.y - p.x - shift);
    // Within the distance allowed wherever text widths put the columns its content sizes.
    if (Math.abs(by) + p.spread <= MOVED_PX) continue;
    const last = out[out.length - 1];
    if (last && Math.abs(last.by - by) <= 10) last.items.push(p.item);
    else out.push({ items: [p.item], by });
  }
  return out;
}


