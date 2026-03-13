import { describe, it, expect } from "vitest";
import { ColumnLayouts, validateColumnLayout } from "./layouts";

describe("ColumnLayouts", () => {
  it("has 8 layout presets", () => {
    expect(Object.keys(ColumnLayouts)).toHaveLength(8);
  });

  it("OneColumn has cells [1]", () => {
    expect(ColumnLayouts.OneColumn.cells).toEqual([1]);
    expect(ColumnLayouts.OneColumn.expectedColumns).toBe(1);
  });

  it("TwoEqual has cells [1,1]", () => {
    expect(ColumnLayouts.TwoEqual.cells).toEqual([1, 1]);
    expect(ColumnLayouts.TwoEqual.expectedColumns).toBe(2);
  });

  it("TwoWideNarrow has cells [2,1]", () => {
    expect(ColumnLayouts.TwoWideNarrow.cells).toEqual([2, 1]);
    expect(ColumnLayouts.TwoWideNarrow.expectedColumns).toBe(2);
  });

  it("ThreeEqual has cells [1,1,1]", () => {
    expect(ColumnLayouts.ThreeEqual.cells).toEqual([1, 1, 1]);
    expect(ColumnLayouts.ThreeEqual.expectedColumns).toBe(3);
  });

  it("every layout has matching cells.length and expectedColumns", () => {
    for (const [name, layout] of Object.entries(ColumnLayouts)) {
      expect(layout.cells.length, `${name} cells/expectedColumns mismatch`).toBe(
        layout.expectedColumns
      );
    }
  });

  it("every layout has matching widths.length and expectedColumns", () => {
    for (const [name, layout] of Object.entries(ColumnLayouts)) {
      expect(layout.widths.length, `${name} widths/expectedColumns mismatch`).toBe(
        layout.expectedColumns
      );
    }
  });
});

describe("validateColumnLayout", () => {
  it("does not throw when column count matches", () => {
    expect(() => validateColumnLayout(ColumnLayouts.TwoEqual, 2)).not.toThrow();
  });

  it("throws when column count does not match", () => {
    expect(() => validateColumnLayout(ColumnLayouts.TwoEqual, 3)).toThrow(
      /TwoEqual layout expects 2.*got 3/
    );
  });

  it("includes layout description in error", () => {
    expect(() => validateColumnLayout(ColumnLayouts.ThreeEqual, 1)).toThrow(
      /Three equal columns/
    );
  });

  it("works for all layouts with correct count", () => {
    for (const layout of Object.values(ColumnLayouts)) {
      expect(() =>
        validateColumnLayout(layout, layout.expectedColumns)
      ).not.toThrow();
    }
  });
});
