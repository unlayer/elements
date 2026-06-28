/**
 * Type-level regression guard for the agent-friendly DX surface.
 *
 * These are NOT vitest tests — they are compile-time assertions checked by
 * `pnpm typecheck` (tsc --noEmit -p tsconfig.typecheck.json), which CI runs.
 * The file imports only TYPES, so it stays out of the render graph (no
 * storybook / @unlayer/exporters resolution noise) and type-checks in isolation.
 *
 * Each `const _x: SomeType = value` asserts a natural authoring form compiles;
 * each `@ts-expect-error` asserts garbage is still rejected (tsc fails if the
 * directive becomes unused — i.e. the bad form started compiling). If a relaxed
 * input type is reverted, the matching assertion below stops compiling.
 */
// Import the ACTUAL component prop types (what `<X>` accepts in JSX), not just
// the exported aliases — these are the types that must stay agent-friendly.
import type { ColumnProps } from "./components/Column";
import type { ButtonProps } from "./components/Button";
import type { MenuProps } from "./components/Menu";
import type { TableProps } from "./components/Table";
import type { DividerProps } from "./components/Divider";
import type { HeadingProps } from "./components/Heading";
import type { ParagraphProps } from "./components/Paragraph";
import type { ImageProps } from "./components/Image";
import type { BorderInput } from "./types";

// ── border: THE regression this guard exists for ────────────────────────────
// A reusable hairline object factored into a `const` (no `as const`) must satisfy
// the Column `border` type. Before BorderInput, the per-side *Width was pinned to
// `${number}px`, so the widened `string` failed strict tsc — see the fix.
const HAIRLINE = {
  borderBottomWidth: "1px",
  borderBottomStyle: "solid",
  borderBottomColor: "#E3E8EE",
};
export const _border_factored_const: BorderInput = HAIRLINE;
export const _border_on_column: ColumnProps["border"] = HAIRLINE;
export const _border_numeric_width: BorderInput = {
  borderTopWidth: 2,
  borderTopStyle: "solid",
  borderTopColor: "#222222",
};
// @ts-expect-error a border is an object of per-side props, never a bare CSS string
export const _border_reject_string: ColumnProps["border"] = "1px solid #ccc";

// ── box-model dimensions: bare number (→ px) + factored border, across the
//    ACTUAL component types (the canonical schema pins these to `${number}px`).
export const _col_radius_num: ColumnProps["borderRadius"] = 8;
export const _btn_radius_num: ButtonProps["borderRadius"] = 8;
export const _btn_padding_num: ButtonProps["padding"] = 14;
export const _btn_containerPadding_num: ButtonProps["containerPadding"] = 14;
export const _btn_containerPadding_str: ButtonProps["containerPadding"] = "16px 24px";
export const _btn_border_factored: ButtonProps["border"] = HAIRLINE;
export const _menu_padding_num: MenuProps["padding"] = 10;
export const _table_padding_num: TableProps["padding"] = 12;
export const _table_border_factored: TableProps["border"] = HAIRLINE;
export const _divider_border_factored: DividerProps["border"] = HAIRLINE;

// Menu's text inputs are relaxed to match Heading/Paragraph (string fontFamily,
// number/em sizes) — it has fontFamily/fontWeight/fontSize/letterSpacing.
export const _menu_fontFamily_string: MenuProps["fontFamily"] = "Arial";
export const _menu_fontSize_num: MenuProps["fontSize"] = 14;
export const _menu_letterSpacing_em: MenuProps["letterSpacing"] = "0.08em";
export const _menu_fontWeight_num: MenuProps["fontWeight"] = 700;

// ── the rest of the natural DX surface (broader contract) ───────────────────
export const _fontSize_number: HeadingProps["fontSize"] = 28;
export const _fontSize_string: HeadingProps["fontSize"] = "28px";
export const _fontWeight_number: HeadingProps["fontWeight"] = 700;
export const _fontWeight_numeric_string: HeadingProps["fontWeight"] = "700";
export const _fontWeight_keyword: HeadingProps["fontWeight"] = "bold";
export const _fontFamily_string: HeadingProps["fontFamily"] = "Arial";
export const _fontFamily_object: HeadingProps["fontFamily"] = {
  label: "Arial",
  value: "arial,sans-serif",
};
export const _lineHeight_number: ParagraphProps["lineHeight"] = 1.4;
export const _button_full_width: ButtonProps["width"] = "100%";
export const _button_px: ButtonProps["width"] = 200;
export const _image_percent: ImageProps["maxWidth"] = "50%";

// @ts-expect-error fontWeight does not accept arbitrary words
export const _fontWeight_reject: HeadingProps["fontWeight"] = "heavy";
