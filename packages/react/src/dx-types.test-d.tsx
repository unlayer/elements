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
import type { ColumnProps } from "./components/Column";
import type {
  BorderInput,
  HeadingProps,
  ButtonProps,
  ParagraphProps,
  ImageProps,
} from "./types";

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
