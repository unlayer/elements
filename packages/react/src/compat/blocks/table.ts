/**
 * A table block as a Table in a Column with the block's padding: its header, rows and footer as TableRows of
 * TableCells, each cell in its section's styles and its own, its text as runs (markup no run holds is written as it is).
 * Legacy's cells share their borders (border-collapse), and its table's border is theirs, so the Table has none.
 */
import type { Json } from "@unlayer-internal/elements-core";
import { generateHtmlFromTextJson } from "@unlayer-internal/shared-elements";
import type { DesignBlock, Place, TreeNode } from "../lower";
import { linesInHeaderAndFooter, spaceBeforeTag } from "../quirks";
import { parseRuns } from "../../builder/read-runs";
import { bodyLinks, styled } from "../links";
import { deviceValues, drawnBorder, font, fontWeight, letterSpacing, lineHeight, px, sides, some, TEXT_ALIGNS, type Values } from "../values";

const VERTICAL = new Set(["top", "middle", "bottom"]);

/** The styles of a cell in a section (`header`, `content`, `footer`), which its own override. */
function sectionStyle(values: Values, section: string, mode: Place["mode"], note: (what: string, value: unknown) => void): Record<string, Json> {
  const of = (key: string) => {
    const value = values[`${section}${key}`];
    return value === undefined || value === null || value === "" ? undefined : value;
  };
  const read = <T>(key: string, what: string, reader: (value: unknown) => T | undefined): T | undefined => {
    const value = of(key);
    if (value === undefined) return undefined;
    const out = reader(value);
    if (out === undefined) note(`${section} ${what}`, value);
    return out;
  };
  const size = read("FontSize", "font size", px);
  const out: Record<string, Json | undefined> = {
    fontSize: size,
    // A header cell's own, where it says none: bold and centered (the browser's).
    fontWeight: read("FontWeight", "font weight", fontWeight) ?? (section === "header" ? 700 : undefined),
    fontFamily: font(of("FontFamily")),
    color: of("Color"),
    textAlign: read("TextAlign", "alignment", (value) => (TEXT_ALIGNS.has(value as string) ? (value as string) : undefined)) ?? (section === "header" ? "center" : undefined),
    verticalAlign: read("VerticalAlign", "vertical alignment", (value) => (VERTICAL.has(value as string) ? (value as string) : undefined)) ?? "middle",
    backgroundColor: of("BackgroundColor"),
    // No padding is the browser's own, 1px.
    padding: read("Padding", "padding", sides) ?? { top: 1, right: 1, bottom: 1, left: 1 },
    // Only its rows' text has a line height and letter spacing of its own.
    lineHeight: (section === "content" ? read("LineHeight", "line height", lineHeight) : undefined) ?? linesInHeaderAndFooter(mode),
    letterSpacing: section === "content" ? read("LetterSpacing", "letter spacing", (value) => letterSpacing(value, size)) : undefined,
  };
  return Object.fromEntries(Object.entries(out).filter(([, value]) => value !== undefined)) as Record<string, Json>;
}

/** The style a link in the table has, its own where it isn't the body's, and on a page under the pointer. */
function linkStyle(values: Values, place: Place): { style: Record<string, Json>; hover: Record<string, Json> } {
  const own: Values = values.linkStyle ?? {};
  const body: Values = place.body.linkStyle ?? {};
  const style: Record<string, Json> = { ...bodyLinks(place.body, place.mode).style };
  const hover: Record<string, Json> = { ...bodyLinks(place.body, place.mode).hover };
  if (own.inherit) return { style, hover };
  const line = (under: unknown) => (under ? "underline" : "none");
  if (own.linkColor && own.linkColor !== (body.linkColor ?? "#0000ee")) style.color = own.linkColor;
  if (own.linkUnderline !== undefined && own.linkUnderline !== null && own.linkUnderline !== (body.linkUnderline ?? true)) style.textDecoration = line(own.linkUnderline);
  if (place.mode === "web") {
    if (own.linkHoverColor && own.linkHoverColor !== (body.linkHoverColor ?? "#0000ee")) hover.color = own.linkHoverColor;
    if (own.linkHoverUnderline !== undefined && own.linkHoverUnderline !== null && own.linkHoverUnderline !== own.linkUnderline) hover.textDecoration = line(own.linkHoverUnderline);
  }
  return { style, hover };
}

/** A cell's HTML: its Lexical textJson's, or its own; a cell that says nothing is a line of its height. */
function cellHtml(cell: Values, place: Place): string {
  const html = spaceBeforeTag(typeof cell.textJson === "string" ? generateHtmlFromTextJson(cell.textJson) : cell.text ? String(cell.text) : "");
  return html.trim() ? place.keepHtml(html) : "​";
}

/** A cell's HTML as runs; markup no run holds is written as it is. */
function cellRuns(html: string, weight: number, link: ReturnType<typeof linkStyle>): Array<TreeNode | string> {
  const { children, left } = parseRuns(html, { weight });
  if (left.length) return [{ type: "Raw", props: { html } }];
  return children.length ? styled(children, link.style, link.hover) : ["​"];
}

/**
 * Its columns' widths, as legacy's colgroup draws them: the first row's cells say their share, each 50 where it doesn't
 * say; a table of its width shares them out in those proportions. Past those, a row's cells share what's left, or all of
 * them the table where nothing is. Undefined where they're all alike.
 */
function columnWidths(first: Values[], count: number): string[] | undefined {
  const shares = first.map((cell) => (typeof cell.width === "number" && cell.width > 0 ? cell.width : 50));
  const total = shares.reduce((sum, share) => sum + share, 0);
  const extra = count - shares.length;
  if (extra > 0 && total >= 100) return undefined;
  const all = extra > 0 ? [...shares, ...Array(extra).fill((100 - total) / extra)] : shares;
  const sum = all.reduce((a, b) => a + b, 0);
  return new Set(all).size > 1 ? all.map((share) => `${Math.round((share / sum) * 1e6) / 1e4}%`) : undefined;
}

export function table(block: DesignBlock, place: Place): TreeNode | null {
  const { values: stored } = block;
  const { values, phone } = deviceValues(stored, ["containerPadding"], place.mode);
  const note = (what: string, value: unknown) => place.note(`A table's ${what} ${JSON.stringify(value)} can't be read: it's drawn without it.`);
  const data: Values = values.table ?? {};
  const isValues = (value: unknown): value is Values => !!value && typeof value === "object";
  // A cell that can't be read is an empty one, which keeps the columns after it where they are. A row of nothing else is
  // left out, as a row that can't be read is, and a table of no others isn't drawn (legacy's fails, and draws none).
  let unread = false;
  const leftOut = (what: string, value: unknown) => {
    unread = true;
    note(what, value);
    return false;
  };
  const cellsOf = (row: Values): Values[] => (Array.isArray(row?.cells) ? row.cells : []).map((own: unknown) => (isValues(own) ? own : {}));
  const readable = (own: unknown) => {
    if (!isValues(own)) return leftOut("row", own);
    const cells: unknown[] = Array.isArray(own.cells) ? own.cells : [];
    for (const cell of cells) if (!isValues(cell)) note("cell", cell);
    return !cells.length || cells.some(isValues) || leftOut("row", own);
  };
  const rowsOf = (list: unknown): Values[] => (Array.isArray(list) ? list : []).filter(readable);
  const [headers, rows, footers] = [rowsOf(data.headers), rowsOf(data.rows), rowsOf(data.footers)];
  // (A block given a mode of its own is drawn as that output's.)
  const document = (values.mode ?? place.mode) === "document";
  const link = linkStyle(values, place);
  const lines = drawnBorder(values.border, "#CCC", note);
  const styles = { header: sectionStyle(values, "header", place.mode, note), content: sectionStyle(values, "content", place.mode, note), footer: sectionStyle(values, "footer", place.mode, note) };

  const shown = [...(values.enableHeader ? headers : []), ...rows, ...(values.enableFooter ? footers : [])];
  if (unread && !shown.length) return null;
  const first = cellsOf(headers[0]).length ? cellsOf(headers[0]) : cellsOf(rows[0]);
  const count = Math.max(0, ...shown.map((row) => cellsOf(row).length));
  const widths = columnWidths(first, count);
  if (first.length && count > first.length) place.note(`A table's rows have more cells (${count}) than its first row's (${first.length}): its columns may not be the widths it says.`);
  let widthsDrawn = false;
  // Each cell's HTML, which legacy's plain text reads: its markup has a line between each two cells.
  const written: string[] = [];

  const cell = (own: Values, style: Record<string, Json>, width: string | undefined): TreeNode => {
    const padding = own.padding ? sides(own.padding) : undefined;
    if (own.padding && !padding) note("cell's padding", own.padding);
    const merged: Record<string, Json> = {
      ...style,
      ...(width ? { width } : {}),
      ...(own.backgroundColor ? { backgroundColor: own.backgroundColor } : {}),
      ...(own.color ? { color: own.color } : {}),
      ...(TEXT_ALIGNS.has(own.textAlign) ? { textAlign: own.textAlign } : {}),
      ...(VERTICAL.has(own.verticalAlign) ? { verticalAlign: own.verticalAlign } : {}),
      ...(padding ? { padding } : {}),
      ...(lines ? { border: lines } : {}),
    };
    const html = cellHtml(own, place);
    written.push(html);
    return { type: "TableCell", style: merged, children: cellRuns(html, (style.fontWeight as number | undefined) ?? 400, link) };
  };
  const row = (own: Values, style: Record<string, Json>, props: Record<string, Json>, stripe?: string): TreeNode => {
    // Its widths are the first row's: enough for the columns the table has.
    const given = widthsDrawn ? undefined : widths;
    if (cellsOf(own).length >= (widths?.length ?? 0)) widthsDrawn = true;
    const height = typeof own.height === "number" && own.height > 0 ? own.height : undefined;
    return {
      type: "TableRow",
      ...(Object.keys(props).length ? { props } : {}),
      ...(height !== undefined || stripe ? { style: { ...(height !== undefined ? { height } : {}), ...(stripe ? { backgroundColor: stripe } : {}) } } : {}),
      children: cellsOf(own).map((own, index) => cell(own, stripe ? { ...style, backgroundColor: stripe } : style, given?.[index])),
    };
  };
  // A printed table's space where it has no header or footer of its own: a row 6px tall past the line it shares, which a page repeats.
  const spacer = (props: Record<string, Json>): TreeNode => ({
    type: "TableRow",
    props,
    style: { height: 6 + (px(values.border?.[props.header ? "borderTopWidth" : "borderBottomWidth"]) ?? 0) / 2 },
    children: (first.length ? first : [{}]).map(() => ({ type: "TableCell", style: { padding: { top: 0, right: 0, bottom: 0, left: 0 }, fontSize: 1, lineHeight: "1px" } })),
  });

  // What a merge tag rule writes around the rows for the sending service, to repeat them: as it is.
  const state = place.config.mergeTagState;
  const rule = values.mergeTagGroup && values.mergeTagRule ? state?.mergeTags?.[state.mergeTagGroup]?.rules?.[state.mergeTagRule] : undefined;
  const ruleText = (html: unknown): TreeNode[] => {
    if (!rule?.before || !rule?.after) return [];
    const kept = place.keepHtml(String(html));
    written.push(kept);
    return [{ type: "Raw", props: { html: `${kept}\n` } }];
  };
  const header = !!values.enableHeader;
  const footer = !!values.enableFooter;
  const headerRepeats = !document || values.repeatHeaderOnEachPage !== false;
  const footerRepeats = !document || values.repeatFooterOnEachPage !== false;
  const stripe = values.stripedRows && values.stripedRowsBackgroundColor ? String(values.stripedRowsBackgroundColor) : undefined;
  const tableRows: TreeNode[] = [
    ...(header && headerRepeats ? headers.map((own) => row(own, styles.header, { header: true })) : document ? [spacer({ header: true })] : []),
    ...(header && !headerRepeats ? headers.map((own) => row(own, styles.header, {})) : []),
    ...ruleText(rule?.before),
    ...rows.map((own, index) => row(own, styles.content, {}, index % 2 === 0 ? stripe : undefined)),
    ...ruleText(rule?.after),
    ...(footer && !footerRepeats ? footers.map((own) => row(own, styles.footer, {})) : []),
    ...(footer && footerRepeats ? footers.map((own) => row(own, styles.footer, { footer: true })) : document ? [spacer({ footer: true })] : []),
  ];
  const padding = sides(values.containerPadding ?? "10px");
  if (!padding) note("padding", values.containerPadding);
  const phonePadding = phone.containerPadding === undefined ? undefined : sides(phone.containerPadding);
  if (phone.containerPadding !== undefined && !phonePadding) note("padding on phones", phone.containerPadding);
  return {
    type: "Column",
    style: { ...(some(padding ?? sides("10px")) ? { padding: padding ?? sides("10px")! } : {}) },
    ...(phonePadding ? { mobile: { padding: phonePadding } } : {}),
    children: [{ type: "Table", style: { borderCollapse: "collapse" }, children: tableRows }],
    textAs: { type: "Raw", props: { html: `<table>${written.map((html) => `<td>${html}</td>\n\n`).join("")}</table>` } },
  };
}
