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

type Element = DefaultTreeAdapterMap["element"];
type Node = DefaultTreeAdapterMap["node"];

export type Align = "left" | "center" | "right";

/** An element's content box across the page, and how it aligns its inline content. */
export interface Placement {
  x: number;
  width: number;
  align: Align;
  /** A property this needs couldn't be read (a rule it can't place): the placement is a guess. */
  unknown?: boolean;
  /**
   * In a box that shrinks to its text and aligns it otherwise than its line (an inline-block heading
   * centered in a left-aligned cell): where the text sits depends on its length. Not compared.
   */
  loose?: boolean;
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
  const leftRaw = doc.property(element, `${name}-left`) || (parts[3] ?? parts[1] ?? parts[0] ?? "");
  const rightRaw = doc.property(element, `${name}-right`) || (parts[1] ?? parts[0] ?? "");
  const unknown = all === null || doc.property(element, `${name}-left`) === null || doc.property(element, `${name}-right`) === null || unreadable(leftRaw) || unreadable(rightRaw);
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
  const own = doc.property(element, `border-${side}-width`) || doc.property(element, `border-${side}`) || doc.property(element, "border-width") || doc.property(element, "border");
  if (!own || /\bnone\b|\bhidden\b/.test(own)) return 0;
  const width = own.split(/\s+/).map((p) => length(p, 0)).find((n) => n !== undefined);
  return width ?? 0;
}

function display(doc: StyledDocument, element: Element): string {
  const own = (doc.property(element, "display") ?? "").trim().replace(/\s*!important$/i, "").toLowerCase();
  // `inherit` takes the parent's; `initial`/`unset`/`revert` are inline (initial) or the element's default.
  if (own === "inherit" && isElement(element.parentNode)) return display(doc, element.parentNode);
  if (own === "initial" || own === "unset") return "inline";
  if (own && own !== "revert" && own !== "inherit") return own;
  return DISPLAY[element.tagName] ?? (INLINE.has(element.tagName) ? "inline" : "block");
}

/** How a box aligns what's inline in it: its text-align, or an `align` attribute (legacy, inherited as text-align; a table's only places the table). */
function textAlign(doc: StyledDocument, element: Element, inherited: Align, rtl: boolean): Align {
  const own = doc.property(element, "text-align") || (element.tagName === "table" || element.tagName === "img" ? "" : attr(element, "align"));
  if (!own) return inherited;
  const v = own.trim().toLowerCase().replace(/\s*!important$/, "");
  if (/center/.test(v)) return "center";
  if (v === "right" || (v === "end" && !rtl) || (v === "start" && rtl)) return "right";
  if (v === "left" || v === "justify" || v === "start" || v === "end") return "left";
  return inherited;
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
  place(doc, body, left, doc.width - left - right, rtl ? "right" : "left", undefined, rtl, out, false);
  return out;
}

/**
 * Place `element` in a containing box (`x`, `available`): its own width and
 * position, then its children. `blockAlign` is how an `align` attribute above
 * places block children (the browser centers them under `align="center"`).
 */
function place(doc: StyledDocument, element: Element, x: number, available: number, inherited: Align, blockAlign: Align | undefined, rtl: boolean, out: Map<Element, Placement>, inline: boolean, givenWidth?: number): Placement {
  const kind = display(doc, element);
  // A box as wide as its content (`width: fit-content`, `max-width: min-content`, a badge): its text starts at its start edge.
  const sized = (name: string) => /^(min|max|fit)-content$/i.test((doc.property(element, name) ?? "").trim().replace(/\s*!important$/i, ""));
  const hugs = sized("width") || sized("max-width");
  let unknown =
    doc.property(element, "display") === null ||
    ["width", "min-width", "max-width"].filter((name) => !sized(name)).some((name) => unreadable(doc.property(element, name))) ||
    ["text-align", "justify-content", "float"].some((name) => doc.property(element, name) === null);
  // Its outer width: given (a cell's share), set (width, the width attribute), or all there is; then max-/min-width.
  const margin = sides(doc, element, "margin", available);
  const declared = length(doc.property(element, "width"), available) ?? length(attr(element, "width"), available);
  let width = givenWidth ?? declared ?? (inline ? undefined : available - margin.left - margin.right);
  // A table cell's width is its share of the row (browsers ignore max-/min-width on cells).
  const cell = givenWidth !== undefined || kind === "table-cell";
  const max = cell ? undefined : length(doc.property(element, "max-width"), available);
  const min = cell ? undefined : length(doc.property(element, "min-width"), available);
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
  // A flex container places its own text (an anonymous item) by justify-content.
  const justify = /flex$/.test(kind) ? (doc.property(element, "justify-content") ?? "").toLowerCase() : "";
  let align: Align = /center/.test(justify) ? "center" : /flex-end|end|right/.test(justify) ? "right" : textAlign(doc, element, inherited, rtl);
  if (hugs) {
    // Where the box itself sits depends on its content's width when something centers it, or it starts on the right.
    if (rtl || margin.autoLeft || margin.autoRight || (blockAlign !== undefined && blockAlign !== "left")) unknown = true;
    align = "left";
  }
  const placement: Placement = { x: contentX, width: contentWidth, align, ...(unknown || margin.unknown || padding.unknown ? { unknown: true } : {}) };
  out.set(element, placement);
  // An `align` attribute (not CSS text-align) also places block children (`-webkit-center`). A CSS
  // text-align on the element overrides it, and what it inherits from above.
  const own = (attr(element, "align") ?? "").toLowerCase();
  const cssAlign = !!doc.property(element, "text-align");
  const childBlockAlign: Align | undefined =
    element.tagName === "table" ? blockAlign
    : cssAlign ? undefined
    : own === "center" || element.tagName === "center" ? "center" : own === "right" ? "right" : own === "left" ? "left" : blockAlign;
  placeChildren(doc, element, kind, placement, childBlockAlign, rtl, out);
  return placement;
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
      else place(doc, kid, box.x, box.width, box.align, blockAlign, rtl, out, false);
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
  for (const kid of kids) {
    if (flex || sideBySide(kid)) {
      run.push(kid);
      continue;
    }
    flush();
    const inline = display(doc, kid) === "inline";
    place(doc, kid, box.x, box.width, box.align, blockAlign, rtl, out, inline);
    if (inline) out.set(kid, { ...box, align: textAlign(doc, kid, box.align, rtl) });
  }
  flush();
}

function cellsOf(doc: StyledDocument, rowElement: Element): Element[] {
  return children(doc, rowElement).filter((c) => display(doc, c) === "table-cell" || c.tagName === "td" || c.tagName === "th");
}

/** A table row: each cell's width set (px or %), the rest shared equally; then left to right. */
function row(doc: StyledDocument, rowElement: Element, cells: Element[], box: Placement, blockAlign: Align | undefined, rtl: boolean, out: Map<Element, Placement>): void {
  if (!out.has(rowElement)) out.set(rowElement, box);
  const widths = cells.map((c) => length(doc.property(c, "width"), box.width) ?? length(attr(c, "width"), box.width) ?? length(doc.property(c, "min-width"), box.width));
  const fixed = widths.reduce<number>((a, w) => a + (w ?? 0), 0);
  const free = widths.filter((w) => w === undefined).length;
  const share = free ? Math.max(0, box.width - fixed) / free : 0;
  // Set widths that add up past the row share it out in proportion, as a 100%-wide table does.
  const total = fixed + share * free;
  const scale = total > box.width && total > 0 ? box.width / total : 1;
  let x = box.x;
  for (let i = 0; i < cells.length; i++) {
    const w = (widths[i] ?? share) * scale;
    place(doc, cells[i], x, w, box.align, blockAlign, rtl, out, false, w);
    x += w;
  }
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
  if (flex && widths.every((w) => w === undefined) && items.every(grows)) {
    const share = box.width / items.length;
    items.forEach((element, i) => place(doc, element, box.x + i * share, share, box.align, blockAlign, rtl, out, false, share));
    return;
  }
  // Boxes that shrink to their content (a button: an inline-block without a width) sit where the line's
  // alignment puts them: their text lines up as the line's does. In a flex row without widths, the first
  // item starts the row and the last ends it (space-between), or all sit by justify-content.
  if (widths.every((w) => w === undefined)) {
    const justify = flex ? (doc.property(items[0].parentNode as Element, "justify-content") ?? "").toLowerCase() : "";
    items.forEach((element, i) => {
      const float = (doc.property(element, "float") ?? "").trim().toLowerCase();
      const align: Align = !flex && (float === "left" || float === "right")
        ? float
        : !flex
        ? box.align
        : /space-between|space-around|space-evenly/.test(justify)
          ? items.length === 1 ? "left" : i === 0 ? "left" : i === items.length - 1 ? "right" : "center"
          : /center/.test(justify) ? "center" : /end|right/.test(justify) ? "right" : "left";
      // The box hugs its text: its own text-align doesn't move it, the line's does; unless the text fills
      // the line, which can't be told here.
      const own = textAlign(doc, element, align, rtl);
      const placement: Placement = { x: box.x, width: box.width, align, ...(own !== align || box.loose ? { loose: true } : {}) };
      out.set(element, placement);
      placeChildren(doc, element, display(doc, element), placement, blockAlign, rtl, out);
      out.set(element, placement);
    });
    return;
  }
  const fixed = widths.reduce<number>((a, w) => a + (w ?? 0), 0);
  const free = widths.filter((w) => w === undefined).length;
  const share = free ? Math.max(0, box.width - fixed) / free : 0;
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
  const justify = flex ? (doc.property(items[0].parentNode as Element, "justify-content") ?? "").toLowerCase() : "";
  // Boxes floated right sit from the line's right edge, in order; the rest as the line places them.
  const floatsRight = (element: Element) => !flex && /^right$/i.test((doc.property(element, "float") ?? "").trim());
  let right = box.x + box.width;
  for (const items_ of lines) {
    for (const it of items_.filter((item) => floatsRight(item.element))) {
      right -= it.width;
      const margin = sides(doc, it.element, "margin", box.width);
      place(doc, it.element, right, it.width - margin.left - margin.right, box.align, blockAlign, rtl, out, false, it.width - margin.left - margin.right);
    }
  }
  for (const all of lines) {
    const items_ = all.filter((item) => !floatsRight(item.element));
    const total = items_.reduce((a, it) => a + it.width, 0);
    const spare = Math.max(0, box.width - total);
    const align = flex ? (/center/.test(justify) ? "center" : /end|right/.test(justify) ? "right" : "left") : box.align;
    let x = box.x + (align === "center" ? spare / 2 : align === "right" ? spare : 0);
    const gap = flex && /space-between/.test(justify) && items_.length > 1 ? spare / (items_.length - 1) : 0;
    for (const it of items_) {
      const margin = sides(doc, it.element, "margin", box.width);
      place(doc, it.element, x, it.width - margin.left - margin.right, box.align, blockAlign, rtl, out, false, it.width - margin.left - margin.right);
      x += it.width + gap;
    }
  }
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
 * Words whose place across the page only one side can work out: a width,
 * padding, margin or display there that the check can't read. Read as
 * anywhere, a move would pass unseen, so the check fails on them. Both sides
 * unknown the same way (markup kept as it was) isn't listed.
 */
export function unplaced(original: StyledDocument, converted: StyledDocument, a: StyledWord[], b: StyledWord[]): Array<{ side: "original" | "migrated"; words: string[] }> {
  const pa = placements(original);
  const pb = placements(converted);
  const out = { original: [] as string[], migrated: [] as string[] };
  for (let i = 0; i < a.length && i < b.length; i++) {
    if (!a[i].shown || !a[i].at || !b[i].at) continue;
    const x = placementOf(pa, a[i].at!);
    const y = placementOf(pb, b[i].at!);
    if (!x || !y || x.loose || y.loose || !x.unknown === !y.unknown) continue;
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
  const pa = placements(original);
  const pb = placements(converted);
  const pairs: Array<{ item: string; x: number; y: number }> = [];
  for (let i = 0; i < a.length && i < b.length; i++) {
    if (!a[i].shown || !a[i].at || !b[i].at) continue;
    const x = placementOf(pa, a[i].at!);
    const y = placementOf(pb, b[i].at!);
    if (!x || !y || x.loose || y.loose || x.unknown || y.unknown) continue;
    pairs.push({ item: a[i].word, x: anchor(x), y: anchor(y) });
  }
  if (!pairs.length) return [];
  const diffs = pairs.map((p) => p.y - p.x).sort((p, q) => p - q);
  const shift = diffs[Math.floor(diffs.length / 2)];
  const out: LayoutDifference[] = [];
  for (const p of pairs) {
    const by = Math.round(p.y - p.x - shift);
    if (Math.abs(by) <= MOVED_PX) continue;
    const last = out[out.length - 1];
    if (last && Math.abs(last.by - by) <= 10) last.items.push(p.item);
    else out.push({ items: [p.item], by });
  }
  return out;
}


