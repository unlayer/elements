/**
 * The body, rows and columns as the root, `<Row>` and `<Column>` props. A design row's padding is `<Row padding>`
 * (the editor's, around the row, as Elements renders it).
 */
import { ColumnLayouts } from "@unlayer-internal/shared-elements";
import { fontFamilyOf } from "../utils/font-design";
import { BODY_DEFAULTS, COLUMN_DEFAULTS, EDITOR_BODY_DEFAULTS, ROW_DEFAULTS } from "./defaults";
import { placeDevice } from "./device";
import { withoutRestoredUrl } from "./fonts";
import { attributes, lostThroughValues, placeValues, Props, withoutMeta } from "./props";
import { codeValue, type Attr } from "./print";
import type { ModuleState } from "./state";
import { deepEqual, isPlainObject, type Plain } from "./values";
import { dropFixedFlags, warnLost, warnMergeTagRule } from "./warnings";

export type RootName = "Email" | "Page" | "Document";

const BODY_TYPED = ["backgroundColor", "contentWidth", "contentAlign", "contentVerticalAlign", "fontFamily", "fontWeight", "textColor", "linkStyle", "backgroundImage", "textDirection", "accessibilityTitle"];
const ROW_TYPED = new Set(["backgroundColor", "columnsBackgroundColor", "backgroundImage", "padding"]);
const COLUMN_TYPED = new Set(["backgroundColor", "padding", "borderRadius", "border"]);

const checkLost = (props: Props, defaults: Plain, where: string, state: ModuleState) => warnLost(lostThroughValues(props.values, defaults, props.component), where, state);

export interface RootResult {
  attrs: Attr[];
  /** The `<Font>`s the root holds (the body's own font as `default`, where it's one). */
  fonts: Array<{ family: string; url: string; fallback?: string; default?: boolean }>;
}

/** The body's values as the root's props (and `<Font>`s for its web fonts). */
export function convertBody(values: Plain, root: RootName, state: ModuleState): RootResult {
  const props = new Props(root);
  let rest = withoutMeta(values, props);
  // The builder's popup settings, at their defaults (Elements doesn't write them).
  for (const key of Object.keys(rest)) if (!(key in BODY_DEFAULTS) && key in EDITOR_BODY_DEFAULTS && deepEqual(rest[key], EDITOR_BODY_DEFAULTS[key])) delete rest[key];

  // (Its `displayMode` is the root's: see designToElements.)
  const { preheaderText, fontFamily, displayMode: _mode, ...others } = rest;
  rest = others;
  if (typeof preheaderText === "string" && preheaderText !== "") props.add("previewText", preheaderText);
  else if (preheaderText !== undefined && preheaderText !== "") props.values.preheaderText = preheaderText;

  // A web font: a <Font> loads it, and is the template's font where the family is the one <Font default> writes.
  const fonts: RootResult["fonts"] = [];
  const font = fontDefault(fontFamily);
  if (font) fonts.push({ ...font, default: true });
  else if (fontFamily !== undefined) rest = { fontFamily: withoutRestoredUrl(fontFamily, state), ...rest };

  const typed = new Set([...BODY_TYPED, ...(root === "Document" ? ["documentSize", "documentOrientation"] : [])]);
  // Not the Document's own (a Document takes its page size and orientation as props).
  if (root !== "Document") for (const key of ["documentSize", "documentOrientation", "documentMargin"]) if (deepEqual(rest[key], BODY_DEFAULTS[key as keyof typeof BODY_DEFAULTS])) delete rest[key];
  placeValues(rest, BODY_DEFAULTS, props, { typed, richFonts: true });
  checkLost(props, BODY_DEFAULTS, "The body", state);
  return { attrs: attributes(props, state.types), fonts };
}

/** `<Font default>`'s props where the body's font is exactly what it writes, else undefined. */
function fontDefault(fontFamily: unknown): { family: string; url: string; fallback: string } | undefined {
  if (!isPlainObject(fontFamily) || typeof fontFamily.url !== "string" || typeof fontFamily.label !== "string" || typeof fontFamily.value !== "string") return undefined;
  const stack = /^'([^']*)', (.+)$/.exec(fontFamily.value);
  if (!stack || stack[1] !== fontFamily.label) return undefined;
  const font = { family: fontFamily.label, url: fontFamily.url, fallback: stack[2] };
  return deepEqual(fontFamilyOf(font), fontFamily) ? font : undefined;
}

/** Keys rows have in the builder that no prop sets, at the value they take when missing. */
const ROW_BUILDER_ONLY: Plain = { hideDesktop: false, anchor: "", displayCondition: null, _styleGuide: null, locked: false, columns: false };

/** Whether a padding is zero on every side. */
const zero = (padding: unknown) => typeof padding === "string" && padding.trim().split(/\s+/).every((side) => /^0(\.0+)?[a-z%]*$/.test(side));

/** A row's cells as `layout` (one of ColumnLayouts) or `cells`. */
function layoutAttr(cells: number[]): Attr {
  const name = Object.entries(ColumnLayouts).find(([, layout]) => deepEqual(layout.cells, cells))?.[0];
  return name ? { name: "layout", value: codeValue(`ColumnLayouts.${name}`) } : { name: "cells", value: cells };
}

/** A design row's values as `<Row>` props (`columns`: how many it has; a layout needs as many as its cells). */
export function convertRow(row: Plain, cells: number[], columns: number, where: string, state: ModuleState): { attrs: Attr[]; layout: boolean } {
  const props = new Props("Row");
  const layout = columns === cells.length ? layoutAttr(cells) : { name: "cells", value: cells };
  props.attrs.push(layout);
  const rest = withoutMeta(isPlainObject(row.values) ? row.values : {}, props);
  warnMergeTagRule(rest, where, state, false);
  // (renderToJson writes the row's cells in its values too.)
  delete rest.cells;
  dropFixedFlags(rest, where, state);
  for (const [key, value] of Object.entries(ROW_BUILDER_ONLY)) {
    if (key in rest && !deepEqual(rest[key], value)) props.values[key] = rest[key];
    delete rest[key];
  }
  // A padding of 0 is left out (the row's default).
  const { _override, ...others } = rest;
  if (zero(others.padding)) delete others.padding;
  placeValues(others, ROW_DEFAULTS, props, { typed: ROW_TYPED });
  placeDevice(_override, props, ROW_DEFAULTS, "row");
  checkLost(props, ROW_DEFAULTS, where, state);
  return { attrs: attributes(props, state.types), layout: layout.name === "layout" };
}

/** A design column's values as `<Column>` props. */
export function convertColumn(column: Plain, where: string, state: ModuleState): Attr[] {
  const props = new Props("Column");
  const { _override, ...rest } = withoutMeta(isPlainObject(column.values) ? column.values : {}, props);
  for (const key of ["deletable", "locked"]) {
    if (key in rest && !deepEqual(rest[key], COLUMN_DEFAULTS[key as keyof typeof COLUMN_DEFAULTS])) props.values[key] = rest[key];
    delete rest[key];
  }
  placeValues(rest, COLUMN_DEFAULTS, props, { typed: COLUMN_TYPED });
  placeDevice(_override, props, COLUMN_DEFAULTS, "column");
  checkLost(props, COLUMN_DEFAULTS, where, state);
  return attributes(props, state.types);
}
