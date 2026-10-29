/**
 * MJML's layout → design rows. A section is a row; its columns are the row's columns, as wide as MJML makes them. What
 * surrounds them (the section's padding and border, a wrapper's padding, the space MJML leaves when columns don't fill
 * the section) goes into the outer columns' padding, so each column's content is as wide and where it is in MJML; on
 * phones, where both stack the columns, each column gets the padding MJML gives it there. A wrapper's sections are
 * rows of their own, with its background and padding; a group's columns stay side by side on phones.
 */

import type { Resolved } from "./attributes";
import { contentBlocks, cssClasses } from "./blocks";
import { fallbackBlock, type Context } from "./context";
import { addBoxes, border, borderValues, boxValue, colorValue, padding, px, type Box } from "./css";
import { asShown, inBodyWrapper, sectionHtml } from "./fallback";
import { visibleHtml } from "./html";
import type { DesignColumn, DesignContent, DesignRow, Values } from "./types";

/** What surrounds a section inside a wrapper. */
interface Outer {
  /** Space on each side of the section's box (a wrapper's padding), in px. */
  left: number;
  right: number;
  /** Space above and below it (a wrapper's padding for its first and last section, its gap). */
  top: number;
  bottom: number;
  /** A wrapper's background behind it (within the content width), or across the page (full width). */
  background?: string;
  fullBackground?: string;
  classes: string[];
}

const NONE: Outer = { left: 0, right: 0, top: 0, bottom: 0, classes: [] };

const note = (ctx: Context, reason: string, detail?: string) => ctx.warnings.push(detail === undefined ? { reason } : { reason, detail });

/** A width attribute (`50%`, `200px`) inside `parent`; unset, an equal share among `siblings`. */
function widthIn(value: string | undefined, parent: number, siblings: number): number {
  const v = (value ?? "").trim();
  if (v.endsWith("%")) return (parseFloat(v) / 100) * parent;
  const n = px(v);
  return Number.isFinite(n) ? n : parent / Math.max(1, siblings);
}

/** Border widths on each side (`border`, then `border-top` …). */
function borders(a: Record<string, string>): Box {
  const all = border(a.border)?.width ?? 0;
  return (["top", "right", "bottom", "left"] as const).map((side) => (a[`border-${side}`] !== undefined ? border(a[`border-${side}`])?.width ?? 0 : all)) as Box;
}

/**
 * Cells for columns `widths` px wide: the smallest whole numbers that give each column its width within 1.5px, else
 * the widths themselves (rounded, divided by what they share).
 */
export function cellsFor(widths: number[]): number[] {
  const total = widths.reduce((s, w) => s + w, 0);
  if (!(total > 0)) return widths.map(() => 1);
  for (let sum = widths.length; sum <= 100; sum++) {
    const cells = widths.map((w) => Math.max(1, Math.round((w / total) * sum)));
    if (cells.reduce((s, c) => s + c, 0) !== sum) continue;
    if (cells.every((c, i) => Math.abs((c / sum) * total - widths[i]) <= 1.5)) return cells;
  }
  const rounded = widths.map((w) => Math.max(1, Math.round(w)));
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
  const shared = rounded.reduce(gcd);
  return rounded.map((w) => w / shared);
}

/** A section's or group's columns (and a section's groups): what its `direction` lays out side by side. */
const sideBySide = (node: Resolved) => node.children.filter((c) => c.tag === "mj-column" || (node.tag === "mj-section" && c.tag === "mj-group"));

/**
 * Whether a section or group shows two or more columns left to right, as MJML lays them out unless its `direction`
 * says otherwise (whatever `<mjml dir>` says: that's the page's).
 */
export function columnsLeftToRight(node: Resolved): boolean {
  if ((node.tag === "mj-section" || node.tag === "mj-group") && sideBySide(node).length > 1 && node.attrs.direction !== "rtl") return true;
  return node.children.some((c) => ["mj-wrapper", "mj-section", "mj-group"].includes(c.tag) && columnsLeftToRight(c));
}

export function bodyRows(body: Resolved, width: number, ctx: Context): DesignRow[] {
  const rows: DesignRow[] = [];
  for (const child of body.children) {
    switch (child.tag) {
      case "mj-section":
        rows.push(...sectionRows(child, width, NONE, ctx));
        break;
      case "mj-wrapper":
        rows.push(...wrapperRows(child, width, ctx));
        break;
      case "mj-hero":
        rows.push(fallbackRow(child, width, NONE, ctx, "mj-hero: content over a background image"));
        break;
      case "mj-raw":
        rows.push(...rawRow(child, ctx, NONE));
        break;
      case "mj-spacer":
        // Space between sections: a row with an empty divider that tall.
        rows.push(oneColumnRow(contentBlocks(child, width, ctx, []), NONE));
        break;
      default:
        rows.push(fallbackRow(child, width, NONE, ctx, `${child.tag}: not an MJML section this converter knows`));
    }
  }
  return rows;
}

/** A row holding one block of MJML's HTML for a body-level element, in the space it has. */
function fallbackRow(node: Resolved, width: number, outer: Outer, ctx: Context, reason: string): DesignRow {
  const block = fallbackBlock(ctx, node.tag, reason, () => sectionHtml(node, width, ctx));
  return oneColumnRow([block], outer);
}

function oneColumnRow(contents: DesignContent[], outer: Outer): DesignRow {
  const pad: Box = [outer.top, outer.right, outer.bottom, outer.left];
  return {
    cells: [1],
    values: { ...(outer.background ? { columnsBackgroundColor: outer.background } : {}), ...(outer.fullBackground ? { backgroundColor: outer.fullBackground } : {}) },
    columns: [{ values: pad.some(Boolean) ? { padding: boxValue(pad) } : {}, contents }],
  };
}

/** Body-level `mj-raw`: its HTML in a row of its own; markup no reader sees (Outlook's, comments) goes. */
function rawRow(node: Resolved, ctx: Context, outer: Outer): DesignRow[] {
  if (!visibleHtml(node.content)) {
    if (node.content.trim()) ctx.info.push({ reason: "mj-raw with nothing a reader sees left out (comments, Outlook-only markup)" });
    return [];
  }
  ctx.fallbacks.push({ tag: node.tag, reason: "mj-raw: the template's own HTML" });
  return [oneColumnRow([{ type: "html", values: { html: asShown(inBodyWrapper(node.content, ctx.root), ctx), containerPadding: "0px" } }], outer)];
}

/**
 * `mj-raw` among a section's columns or a wrapper's sections: MJML writes it in their cell, whose font size is 0 (its
 * text doesn't show, its images do). Kept as MJML compiles it there, in a row after them.
 */
function rawsAmong(raws: Resolved[], width: number, outer: Outer, ctx: Context): DesignRow[] {
  const shown = raws.filter((r) => visibleHtml(r.content));
  if (raws.length > shown.length) ctx.info.push({ reason: "mj-raw with nothing a reader sees left out (comments, Outlook-only markup)" });
  if (!shown.length) return [];
  const section: Resolved = {
    tag: "mj-section",
    attrs: { padding: "0px" },
    given: new Set(["padding"]),
    children: shown,
    content: "",
    node: { tagName: "mj-section", attributes: { padding: "0px" } },
  };
  const block = fallbackBlock(ctx, "mj-raw", "mj-raw: HTML among columns or sections (MJML writes it where text has no size)", () => sectionHtml(section, width, ctx));
  return [oneColumnRow([block], { ...outer, top: 0, bottom: 0 })];
}

function wrapperRows(wrapper: Resolved, width: number, ctx: Context): DesignRow[] {
  const a = wrapper.attrs;
  const pad = padding(a);
  const b = borders(a);
  const full = a["full-width"] === "full-width";
  const background = a["background-color"] ? colorValue(a["background-color"]) : undefined;
  if (b.some(Boolean)) note(ctx, "mj-wrapper border not kept", a.border);
  if (a["border-radius"] && !/^0(px)?$/.test(a["border-radius"].trim())) note(ctx, "mj-wrapper border radius not kept", a["border-radius"]);
  if (a["background-url"]) note(ctx, "mj-wrapper background image not kept", a["background-url"]);
  const box = width - pad[1] - pad[3] - b[1] - b[3];
  const gap = px(a.gap);
  const children = wrapper.children.filter((c) => c.tag !== "mj-raw");
  const rows: DesignRow[] = [];
  const around = (top: number, bottom: number): Outer => ({
    left: pad[3] + b[3],
    right: pad[1] + b[1],
    top,
    bottom,
    ...(background && !full ? { background } : {}),
    ...(background && full ? { fullBackground: background } : {}),
    classes: cssClasses(a),
  });
  // Raw HTML between the sections stays where it is among them.
  let raws: Resolved[] = [];
  let i = 0;
  for (const child of wrapper.children) {
    if (child.tag === "mj-raw") {
      raws.push(child);
      continue;
    }
    rows.push(...rawsAmong(raws, box, around(0, 0), ctx));
    raws = [];
    const outer = around((i === 0 ? pad[0] + b[0] : 0) + (i > 0 && Number.isFinite(gap) ? gap : 0), i === children.length - 1 ? pad[2] + b[2] : 0);
    if (child.tag === "mj-section") rows.push(...sectionRows(child, box, outer, ctx));
    else if (child.tag === "mj-hero") rows.push(fallbackRow(child, box, outer, ctx, "mj-hero: content over a background image"));
    else rows.push(fallbackRow(child, box, outer, ctx, `${child.tag}: not a section, in an mj-wrapper`));
    i++;
  }
  rows.push(...rawsAmong(raws, box, around(0, 0), ctx));
  if (full && !background) ctx.info.push({ reason: "full-width mj-wrapper without a background: as wide as the content" });
  return rows;
}

const MJML_POSITIONS: Record<string, string> = {
  "top left": "top-left", "top center": "top-center", "top right": "top-right",
  "center left": "center-left", "center center": "center", "center right": "center-right",
  "bottom left": "bottom-left", "bottom center": "bottom-center", "bottom right": "bottom-right",
};

/** A section's background image, as the row's: at its natural size (MJML's `auto`), or covering or contained. */
function backgroundImage(a: Record<string, string>, full: boolean, ctx: Context): Values | undefined {
  const url = a["background-url"];
  if (!url) return undefined;
  const words = (a["background-position"] || "top center").trim().toLowerCase().split(/\s+/);
  const [first, second = "center"] = words;
  // `left top` is `top left`.
  const ordered = ["left", "right"].includes(first) ? `${second} ${first}` : `${first} ${second}`;
  const position = MJML_POSITIONS[ordered] ?? (words.join(" ") === "center" ? "center" : "custom");
  const size = (a["background-size"] || "auto").trim();
  note(ctx, "section background image approximated (as the row's background image)", url);
  return {
    url,
    fullWidth: full,
    repeat: ["repeat", "no-repeat", "repeat-x", "repeat-y"].includes(a["background-repeat"]) ? a["background-repeat"] : "repeat",
    size: size === "cover" || size === "contain" ? size : "custom",
    position,
  };
}

interface Placed {
  node: Resolved;
  /** Its width in MJML, in px. */
  width: number;
  group?: Resolved;
}

function sectionRows(section: Resolved, width: number, outer: Outer, ctx: Context): DesignRow[] {
  const a = section.attrs;
  // A background image URL with a quote in it: Elements writes it in a quoted url(), where the quote ends it.
  if (/['"]/.test(a["background-url"] ?? "")) return [fallbackRow(section, width, outer, ctx, "mj-section: its background image URL has a quote in it (Elements can't write it)")];
  const full = a["full-width"] === "full-width";
  const pad = padding(a);
  const b = borders(a);
  const box = width - pad[1] - pad[3] - b[1] - b[3];
  const classes = [...outer.classes, ...cssClasses(a)];
  const raws = section.children.filter((c) => c.tag === "mj-raw");
  const kids = section.children.filter((c) => c.tag !== "mj-raw");
  const unknown = kids.filter((c) => c.tag !== "mj-column" && c.tag !== "mj-group");
  for (const u of unknown) note(ctx, "left out: not a column or group in an mj-section (MJML renders nothing for it)", `<${u.tag}>`);
  const parts = kids.filter((c) => c.tag === "mj-column" || c.tag === "mj-group");
  const placed: Placed[] = [];
  for (const kid of parts) {
    const w = widthIn(kid.attrs.width, box, parts.length);
    if (kid.tag === "mj-column") {
      placed.push({ node: kid, width: w });
      continue;
    }
    const columns = kid.children.filter((c) => c.tag === "mj-column");
    for (const column of columns) placed.push({ node: column, width: widthIn(column.attrs.width, w, columns.length), group: kid });
  }
  const groups = new Set(placed.map((p) => p.group));
  const noStack = placed.length > 1 && groups.size === 1 && !groups.has(undefined);
  if (placed.some((p) => p.group) && !noStack) note(ctx, "mj-group beside other columns: its columns stack on phones with the others");
  // Columns MJML shows right to left in a left-to-right email, which Elements lays out in order (phones stack them in
  // order in both).
  if (ctx.direction === "ltr") {
    if (parts.length > 1 && a.direction === "rtl") note(ctx, "section direction rtl not kept: its columns show left to right");
    for (const group of parts) if (group.tag === "mj-group" && sideBySide(group).length > 1 && group.attrs.direction === "rtl") note(ctx, "group direction rtl not kept: its columns show left to right");
  }

  const rows: DesignRow[] = [];
  if (!placed.length) {
    // A section without columns: its space (padding, background) as an empty row.
    placed.push({ node: { tag: "mj-column", attrs: {}, given: new Set(), children: [], content: "", node: { tagName: "mj-column", attributes: {} } }, width: box });
  }
  // Columns wider together than the section wrap onto lines, as MJML's inline blocks do: a row per line.
  const lines: Placed[][] = [];
  for (const p of placed) {
    const line = lines[lines.length - 1];
    if (line && line.reduce((s, q) => s + q.width, 0) + p.width <= box + 0.5) line.push(p);
    else lines.push([p]);
  }
  if (lines.length > 1) note(ctx, "columns wider together than their section: a row for each line they wrap onto");
  const align = (a["text-align"] || "center").toLowerCase();
  const radius = (a["border-radius"] ?? "").trim();
  const rounded = radius && !/^0(px)?$/.test(radius);
  const background = a["background-color"] ? colorValue(a["background-color"]) : undefined;
  const sectionBorder = borderValues(a.border);
  if (rounded) note(ctx, "section border radius approximated on its columns", radius);
  if (sectionBorder || ["top", "right", "bottom", "left"].some((s) => a[`border-${s}`])) note(ctx, "section border drawn on its columns", a.border ?? "");
  const lineRows = lines.map((line, li) => lineRow(line, li === 0, li === lines.length - 1));
  // Raw HTML before the columns goes before the row; the rest after it.
  const firstColumn = section.children.findIndex((c) => c.tag !== "mj-raw");
  const before = firstColumn < 0 ? raws : section.children.slice(0, firstColumn);
  const after = raws.filter((r) => !before.includes(r));
  rows.push(...rawsAmong(before, width, outer, ctx));
  rows.push(...lineRows);
  rows.push(...rawsAmong(after, width, outer, ctx));
  return rows;

  function lineRow(line: Placed[], firstLine: boolean, lastLine: boolean): DesignRow {
  const used = line.reduce((s, p) => s + p.width, 0);
  const leftover = Math.max(0, box - used);
  const [leftSpace, rightSpace] = leftover <= 1 ? [leftover / 2, leftover / 2] : align === "left" ? [0, leftover] : align === "right" ? [leftover, 0] : [leftover / 2, leftover / 2];
  const leftExtra = outer.left + pad[3] + b[3] + leftSpace;
  const rightExtra = outer.right + pad[1] + b[1] + rightSpace;
  const last = line.length - 1;
  const columns: DesignColumn[] = line.map((p, i) => {
    const c = p.node.attrs;
    const own = padding(c);
    const cb = borders(c);
    const inner = Math.max(1, p.width - own[1] - own[3] - cb[1] - cb[3]);
    const top = firstLine ? outer.top + pad[0] + b[0] : 0;
    const bottom = lastLine ? outer.bottom + pad[2] + b[2] : 0;
    const desktop: Box = addBoxes(own, [top, i === last ? rightExtra : 0, bottom, i === 0 ? leftExtra : 0]);
    const phone: Box = addBoxes(own, [i === 0 ? top : 0, outer.right + pad[1] + b[1], i === last ? bottom : 0, outer.left + pad[3] + b[3]]);
    const columnClasses = [...classes, ...cssClasses(p.group?.attrs ?? {}), ...cssClasses(c)];
    const contents = p.node.children.flatMap((child) => contentBlocks(child, inner, ctx, columnClasses));
    const values: Values = {};
    const bg = [c["background-color"], c["inner-background-color"], p.group?.attrs["background-color"]].find(painted);
    if (painted(c["inner-background-color"]) && painted(c["background-color"])) note(ctx, "column inner background not kept (its background covers it)", c["inner-background-color"]);
    if (bg) values.backgroundColor = colorValue(bg);
    else if (rounded && background) values.backgroundColor = background;
    values.padding = boxValue(desktop);
    const ownBorder = borderValues(c.border);
    const sides: Record<string, string> = { ...(ownBorder ?? {}) };
    for (const side of ["Top", "Right", "Bottom", "Left"] as const) {
      const one = c[`border-${side.toLowerCase()}`];
      if (one !== undefined) Object.assign(sides, sideBorder(side, one));
    }
    // The section's border, on the columns' outer sides.
    if (sectionBorder || ["top", "right", "bottom", "left"].some((s) => a[`border-${s}`])) {
      for (const side of ["Top", "Bottom", ...(i === 0 ? ["Left"] : []), ...(i === last ? ["Right"] : [])] as Array<"Top" | "Right" | "Bottom" | "Left">) {
        const one = a[`border-${side.toLowerCase()}`] ?? a.border;
        if (one) Object.assign(sides, sideBorder(side, one));
      }
    }
    if (Object.keys(sides).length) values.border = sides;
    if (c["inner-border"]) note(ctx, "column inner border not kept", c["inner-border"]);
    const columnRadius = (c["border-radius"] || c["inner-border-radius"] || "").trim();
    if (columnRadius && !/^0(px)?$/.test(columnRadius)) values.borderRadius = columnRadius.split(/\s+/).map((r) => (/^[\d.]+$/.test(r) ? `${r}px` : r)).join(" ");
    else if (rounded) values.borderRadius = cornerRadius(radius, i === 0, i === last, firstLine, lastLine);
    if ((c["vertical-align"] || "top") !== "top") note(ctx, "column vertical alignment not kept (columns sit at the top)", c["vertical-align"]);
    if (!noStack && boxValue(phone) !== boxValue(desktop)) values._override = { mobile: { padding: boxValue(phone) } };
    return { values, contents };
  });

  const rowValues: Values = {};
  if (full) {
    if (background) rowValues.backgroundColor = background;
  } else if (background && !rounded) {
    rowValues.columnsBackgroundColor = background;
  }
  if (!full && !background && outer.background) {
    if (rounded) for (const column of columns) column.values.backgroundColor ??= outer.background;
    else rowValues.columnsBackgroundColor = outer.background;
  } else if (!full && background && outer.background && rounded) {
    rowValues.columnsBackgroundColor = outer.background;
  }
  if (outer.fullBackground && !rowValues.backgroundColor) rowValues.backgroundColor = outer.fullBackground;
  if (full && outer.background) rowValues.columnsBackgroundColor = outer.background;
  const image = backgroundImage(a, full, ctx);
  if (image) rowValues.backgroundImage = image;
  // Kept side by side on phones: Elements' phone setting for the row.
  if (noStack) rowValues._override = { mobile: { noStackMobile: true } };
  return { cells: cellsFor(line.map((p, i) => p.width + (i === 0 ? leftExtra : 0) + (i === last ? rightExtra : 0))), values: rowValues, columns };
  }
}

/** Whether a background color paints anything (not `transparent`, `none` or a fully transparent rgba). */
function painted(value: string | undefined): value is string {
  const v = (value ?? "").trim().toLowerCase();
  return !!v && v !== "transparent" && v !== "none" && !/^rgba\([^)]*,\s*0(\.0*)?\s*\)$/.test(v);
}

/** One side of a column's border from a CSS border shorthand. */
function sideBorder(side: "Top" | "Right" | "Bottom" | "Left", value: string): Record<string, string> {
  const b = border(value);
  return b
    ? { [`border${side}Width`]: `${b.width}px`, [`border${side}Style`]: b.style, [`border${side}Color`]: b.color }
    : { [`border${side}Width`]: "0px", [`border${side}Style`]: "solid", [`border${side}Color`]: "transparent" };
}

/** A section's corner radius on one of its columns: the outer corners only. */
function cornerRadius(radius: string, first: boolean, last: boolean, top = true, bottom = true): string {
  const parts = radius.split(/\s+/).map((r) => (/^[\d.]+$/.test(r) ? `${r}px` : r));
  const [tl, tr = tl, br = tl, bl = tr] = parts;
  return [first && top ? tl : "0px", last && top ? tr : "0px", last && bottom ? br : "0px", first && bottom ? bl : "0px"].join(" ");
}
