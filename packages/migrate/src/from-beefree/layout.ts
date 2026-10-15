/**
 * Beefree's rows and columns as Unlayer rows and columns.
 *
 * A Beefree row is a full-width container (its own background) around the row's content, the message's width (a
 * background of its own, padding inside it), which holds columns on a 12-column grid. An Unlayer row is the same
 * full-width band (`backgroundColor`) around its columns' area (`columnsBackgroundColor`), with padding between them:
 * so a Beefree row's content padding is the Unlayer row's padding where its content has no background of its own,
 * and goes to its columns where it has one.
 */
import { backgroundImage, borderValues, boxString, color, px, pxString, sides } from "./css";
import type { ModuleContext, Slot } from "./context";
import { override, type DesignBuilder } from "./design";
import { convertModule, moduleKind } from "./modules/index";
import type { BeefreeColumn, BeefreeRow, DesignContent, DesignRow, Values } from "./types";

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

/** The columns' grid shares (`grid-columns`, 12 to a row) as a row's cells, in lowest terms (`[4, 8]` → `[1, 2]`). */
export function rowCells(columns: BeefreeColumn[]): number[] {
  const shares = columns.map((column) => {
    const share = Number(column["grid-columns"]);
    return Number.isFinite(share) && share > 0 ? Math.round(share) : Math.max(1, Math.round(12 / columns.length));
  });
  const divisor = shares.reduce(gcd);
  return shares.map((share) => share / divisor);
}

export interface RowContext {
  builder: DesignBuilder;
  bodyWidth: number;
  /** A module's context at a place (`Row 2, column 1, module 3 (image)`). */
  moduleContext(where: string, slot: Slot): ModuleContext;
  warn(reason: string, message: string, where?: string): void;
}

type Sides = [number, number, number, number];
const add = (a: Sides, b: Sides): Sides => [a[0] + b[0], a[1] + b[1], a[2] + b[2], a[3] + b[3]];
const zero = (box: Sides) => box.every((side) => side === 0);

export function convertRow(row: BeefreeRow, index: number, ctx: RowContext): DesignRow | undefined {
  const where = `Row ${index + 1}`;
  const columns = Array.isArray(row.columns) ? row.columns : [];
  if (!columns.length) {
    ctx.warn("empty-row", `${where}: the row has no columns, so it's left out.`, where);
    return undefined;
  }
  const cells = rowCells(columns);
  const container = row.container?.style ?? {};
  const content = row.content?.style ?? {};
  const computed = row.content?.computedStyle ?? {};

  const values: Values = {};
  const fill = color(container["background-color"]);
  if (fill) values.backgroundColor = fill;
  const area = color(content["background-color"]);
  if (area) values.columnsBackgroundColor = area;
  const fullImage = backgroundImage(container, true);
  const areaImage = backgroundImage(content, false);
  if (fullImage) values.backgroundImage = fullImage;
  else if (areaImage) values.backgroundImage = areaImage;
  const image = (fullImage ?? areaImage) as Values | undefined;
  if (image && image.size !== "custom") ctx.warn("background-size", `${where}: its background image is sized to \`${image.size}\`; Unlayer keeps the setting, but its email HTML shows the image at its own size.`, where);
  if (fullImage && areaImage) ctx.warn("row-two-images", `${where}: the row has a background image and its content another; Unlayer rows take one, so the content's (${areaImage.url}) is left out.`, where);

  // The content's padding. Its sides go to the outer columns: an Unlayer row's own side padding is outside its
  // columns' area, which only narrows it on screens narrower than the message. Its top and bottom are the row's where
  // the content has no background of its own (the same space), else its columns'.
  const padding = sides(content) as Sides;
  const phonePadding = row.content?.mobileStyle && Object.keys(row.content.mobileStyle).some((key) => /^padding/.test(key)) ? (sides(row.content.mobileStyle) as Sides) : undefined;
  const verticalOnRow = !area && !areaImage;
  const stacked = computed.rowColStackOnMobile !== false && columns.length > 1;
  const last = columns.length - 1;
  /** A content padding's share for column `c`: side by side, or stacked (phones), where each column has both sides. */
  const share = ([t, r, b, l]: Sides, c: number, stack: boolean): Sides =>
    stack ? [verticalOnRow || c > 0 ? 0 : t, r, verticalOnRow || c < last ? 0 : b, l] : [verticalOnRow ? 0 : t, c === last ? r : 0, verticalOnRow ? 0 : b, c === 0 ? l : 0];
  const columnExtra: Sides[] = columns.map((_, c) => share(padding, c, false));
  const columnPhoneExtra: Sides[] = columns.map((_, c) => share(phonePadding ?? padding, c, stacked));
  const phone: Values = {};
  if (verticalOnRow && (padding[0] || padding[2])) values.padding = boxString([padding[0], 0, padding[2], 0]);
  if (verticalOnRow && phonePadding && (phonePadding[0] !== padding[0] || phonePadding[2] !== padding[2])) phone.padding = boxString([phonePadding[0], 0, phonePadding[2], 0]);

  // Space between columns: half on each side of it, inside the columns.
  const gap = px(computed.columnsSpacing) ?? 0;
  const cards = columns.some((column) => color(column.style?.["background-color"]) || Object.keys(borderValues(column.style)).length);
  if (gap && columns.length > 1) {
    if (cards) ctx.warn("row-column-spacing", `${where}: the ${pxString(gap)} space between its columns has no Unlayer equivalent; its columns have backgrounds or borders, so they touch.`, where);
    else columns.forEach((_, c) => {
      columnExtra[c][3] += c > 0 ? gap / 2 : 0;
      columnExtra[c][1] += c < last ? gap / 2 : 0;
      if (!stacked) {
        columnPhoneExtra[c][3] += c > 0 ? gap / 2 : 0;
        columnPhoneExtra[c][1] += c < last ? gap / 2 : 0;
      }
    });
  }
  if (cards && !verticalOnRow && !zero(padding)) {
    ctx.warn("row-padding", `${where}: the padding around its columns, inside the row's background, has no Unlayer equivalent: it's inside its columns, whose backgrounds or borders now reach the row's edges.`, where);
  }

  if (computed.hideContentOnMobile === true) phone.hideMobile = true;
  if (computed.rowColStackOnMobile === false) phone.noStackMobile = true;
  const desktop: Values = computed.hideContentOnDesktop === true ? { hideDesktop: true } : {};

  if (computed.rowReverseColStackOnMobile === true && computed.rowColStackOnMobile !== false && columns.length > 1) {
    ctx.warn("row-reverse-stack", `${where}: Beefree stacks its columns in reverse order on phones; Unlayer stacks them in order.`, where);
  }
  if (computed.verticalAlign && computed.verticalAlign !== "top" && columns.length > 1) {
    ctx.warn("row-vertical-align", `${where}: its columns are aligned to the ${computed.verticalAlign} in Beefree; Unlayer columns sit at the top.`, where);
  }
  if (Object.keys(borderValues(content)).length || px(content["border-radius"])) {
    ctx.warn("row-border", `${where}: the border and rounded corners around the row's content have no Unlayer row setting, so they're left out.`, where);
  }
  const width = px(content.width);
  if (width && Math.abs(width - ctx.bodyWidth) > 0.5) ctx.warn("row-width", `${where}: the row's content is ${pxString(width)} wide and the message ${pxString(ctx.bodyWidth)}; Unlayer rows are the message's width.`, where);
  if (row.locked) ctx.warn("row-locked", `${where}: the row is locked in Beefree; the lock isn't kept.`, where);
  if (row.synced) ctx.warn("row-synced", `${where}: the row is a synced row in Beefree; it's a copy here, no longer synced.`, where);
  const condition = row.container?.displayCondition;
  if (condition && typeof condition === "object" && (condition.before || condition.after)) {
    values.displayCondition = { type: condition.type ?? "", label: condition.label ?? condition.name ?? "", description: condition.description ?? "", before: condition.before ?? "", after: condition.after ?? "" };
  }

  const rowSides: [number, number] = [0, 0];
  const radius = px(computed.columnsBorderRadius);
  const designColumns = columns.map((column, c) => {
    const at = `${where}, column ${c + 1}`;
    const style = column.style ?? {};
    const box = add(sides(style) as Sides, columnExtra[c]);
    const border = borderValues(style);
    const borderLeft = px(border.borderLeftWidth) ?? 0;
    const borderRight = px(border.borderRightWidth) ?? 0;
    const slot: Slot = { bodyWidth: ctx.bodyWidth, rowSides, cells, column: c, columnSides: [box[3] + borderLeft, box[1] + borderRight] };
    const contents: DesignContent[] = [];
    (Array.isArray(column.modules) ? column.modules : []).forEach((module, m) => {
      const kind = moduleKind(module?.type);
      contents.push(...convertModule(module ?? {}, ctx.moduleContext(`${at}, module ${m + 1} (${kind})`, slot)));
    });
    const columnValues: Values = { padding: boxString(box), border };
    const columnFill = color(style["background-color"]);
    if (columnFill) columnValues.backgroundColor = columnFill;
    if (radius) columnValues.borderRadius = pxString(radius);
    const columnPhone: Values = {};
    const ownPhone = column.mobileStyle && Object.keys(column.mobileStyle).some((key) => /^padding/.test(key)) ? (sides({ ...style, ...column.mobileStyle }) as Sides) : undefined;
    const phoneBox = add(ownPhone ?? (sides(style) as Sides), columnPhoneExtra[c]);
    if (phoneBox.some((side, i) => side !== box[i])) columnPhone.padding = boxString(phoneBox);
    return ctx.builder.column(contents, columnValues, override(columnPhone));
  });

  return ctx.builder.row(cells, designColumns, values, override(phone, desktop));
}
