import { describe, it, expect } from "vitest";
import { getWidthPercentages, generateGridCSS } from "./grid-css";
import { ColumnExporters } from "@unlayer-dev/exporters";

// ============================================================
// Unit tests for grid CSS generation
// ============================================================

describe("getWidthPercentages", () => {
  it("returns empty for empty cells", () => {
    expect(getWidthPercentages([])).toEqual([]);
  });

  it("returns empty for zero-sum cells", () => {
    expect(getWidthPercentages([0, 0])).toEqual([]);
  });

  it("calculates equal columns", () => {
    expect(getWidthPercentages([1, 1])).toEqual([
      { value: 50, className: "50" },
      { value: 50, className: "50" },
    ]);
  });

  it("calculates unequal columns with decimal percentages", () => {
    expect(getWidthPercentages([1, 2])).toEqual([
      { value: 33.33, className: "33p33" },
      { value: 66.67, className: "66p67" },
    ]);
  });

  it("calculates three equal columns", () => {
    expect(getWidthPercentages([1, 1, 1])).toEqual([
      { value: 33.33, className: "33p33" },
      { value: 33.33, className: "33p33" },
      { value: 33.33, className: "33p33" },
    ]);
  });

  it("handles single column", () => {
    expect(getWidthPercentages([1])).toEqual([
      { value: 100, className: "100" },
    ]);
  });

  it("handles complex ratios", () => {
    const result = getWidthPercentages([1, 2, 3]);
    expect(result).toEqual([
      { value: 16.67, className: "16p67" },
      { value: 33.33, className: "33p33" },
      { value: 50, className: "50" },
    ]);
  });
});

describe("generateGridCSS", () => {
  describe("web mode", () => {
    it("generates flexbox CSS with responsive breakpoint", () => {
      const css = generateGridCSS({ cells: [1, 1], mode: "web" });

      expect(css).toContain("display: flex");
      expect(css).toContain("u-col-50");
      expect(css).toContain("flex: 0 0 50%");
      expect(css).toContain("max-width: 50%");
      expect(css).toContain("max-width: 620px");
    });

    it("uses custom mobile breakpoint", () => {
      const css = generateGridCSS({
        cells: [1, 1],
        mode: "web",
        mobileBreakpoint: 768,
      });
      expect(css).toContain("max-width: 768px");
    });
  });

  describe("email mode", () => {
    it("generates email CSS with min/max queries", () => {
      const css = generateGridCSS({ cells: [1, 1], mode: "email" });

      expect(css).toContain("min-width: 620px");
      expect(css).toContain("max-width: 620px");
      expect(css).toContain("u-col-50");
      expect(css).toContain("width: 300px !important");
    });

    it("uses custom content width", () => {
      const css = generateGridCSS({
        cells: [1, 1],
        mode: "email",
        contentWidth: 800,
      });
      expect(css).toContain("min-width: 820px");
      expect(css).toContain("width: 800px !important");
      expect(css).toContain("width: 400px !important");
    });
  });

  describe("document mode", () => {
    it("falls back to web CSS", () => {
      const webCss = generateGridCSS({ cells: [1, 1], mode: "web" });
      const docCss = generateGridCSS({ cells: [1, 1], mode: "document" });
      expect(docCss).toEqual(webCss);
    });
  });
});

// ============================================================
// DRIFT DETECTION: Column exporter ↔ Grid CSS sync
//
// The column exporter generates HTML with class="u-col u-col-{pct}"
// The grid CSS generates CSS rules targeting .u-col-{pct}
// These MUST use the same class name formula.
//
// If the column exporter changes its naming convention,
// these tests will fail — catching the drift.
// ============================================================

describe("drift detection: column exporter ↔ grid CSS", () => {
  const minimalValues = (index: number) => ({
    padding: "0px",
    _meta: { htmlID: `u_column_${index + 1}`, htmlClassNames: "" },
  });
  const bodyValues = { contentWidth: 600 };
  const rowValues = {};

  /**
   * Extract all u-col-* class names from an HTML string.
   * The column exporter outputs class="u-col u-col-{pct}"
   */
  function extractColClasses(html: string): string[] {
    const matches = html.match(/u-col-[\dp]+/g) || [];
    // Deduplicate (email mode repeats the class)
    return [...new Set(matches)];
  }

  /**
   * Extract all u-col-* selectors from a CSS string.
   */
  function extractCssSelectors(css: string): string[] {
    const matches = css.match(/u-col-[\dp]+/g) || [];
    return [...new Set(matches)];
  }

  const cellConfigs = [
    { cells: [1, 1], label: "2 equal columns [1,1]" },
    { cells: [1, 2], label: "1:2 ratio [1,2]" },
    { cells: [1, 1, 1], label: "3 equal columns [1,1,1]" },
    { cells: [1, 2, 3], label: "1:2:3 ratio [1,2,3]" },
    { cells: [1, 1, 1, 1], label: "4 equal columns [1,1,1,1]" },
    { cells: [2, 1], label: "2:1 ratio [2,1]" },
    { cells: [1, 3], label: "1:3 ratio [1,3]" },
  ];

  describe("web mode", () => {
    cellConfigs.forEach(({ cells, label }) => {
      it(`class names match for ${label}`, () => {
        // Get class names from column exporter
        const exporterClasses = new Set<string>();
        cells.forEach((_, index) => {
          const html = ColumnExporters.web!(
            "<div>content</div>",
            minimalValues(index),
            index,
            cells,
            bodyValues,
            rowValues
          );
          extractColClasses(html).forEach((c) => exporterClasses.add(c));
        });

        // Get selectors from grid CSS
        const css = generateGridCSS({ cells, mode: "web" });
        const cssSelectors = new Set(extractCssSelectors(css));

        // Every class the exporter outputs must have a matching CSS rule
        for (const cls of exporterClasses) {
          expect(
            cssSelectors.has(cls),
            `Column exporter produced class "${cls}" but grid CSS has no matching selector. ` +
              `CSS selectors: [${[...cssSelectors].join(", ")}]`
          ).toBe(true);
        }
      });
    });
  });

  describe("email mode", () => {
    cellConfigs.forEach(({ cells, label }) => {
      it(`class names match for ${label}`, () => {
        const exporterClasses = new Set<string>();
        cells.forEach((_, index) => {
          const html = ColumnExporters.email!(
            "<div>content</div>",
            minimalValues(index),
            index,
            cells,
            bodyValues,
            rowValues
          );
          extractColClasses(html).forEach((c) => exporterClasses.add(c));
        });

        const css = generateGridCSS({ cells, mode: "email" });
        const cssSelectors = new Set(extractCssSelectors(css));

        for (const cls of exporterClasses) {
          expect(
            cssSelectors.has(cls),
            `Column exporter produced class "${cls}" but grid CSS has no matching selector. ` +
              `CSS selectors: [${[...cssSelectors].join(", ")}]`
          ).toBe(true);
        }
      });
    });
  });

  describe("class name formula consistency", () => {
    it("getWidthPercentages matches column exporter naming for all common layouts", () => {
      // This tests the core formula directly:
      // The column exporter does: Math.round((colSpan / rowSpan) * 100 * 100) / 100
      // then: `${value}`.replace(/\./g, 'p')
      // getWidthPercentages must produce identical results.

      const allCells = [
        [1],
        [1, 1],
        [1, 2],
        [2, 1],
        [1, 1, 1],
        [1, 2, 3],
        [1, 1, 1, 1],
        [1, 3],
        [3, 1],
        [2, 3],
        [1, 1, 1, 1, 1, 1], // 6 columns
      ];

      for (const cells of allCells) {
        const widths = getWidthPercentages(cells);
        const total = cells.reduce((a, b) => a + b, 0);

        cells.forEach((span, i) => {
          // Replicate the column exporter's formula exactly
          const expectedValue =
            Math.round((span / total) * 100 * 100) / 100;
          const expectedClassName = `${expectedValue}`.replace(/\./g, "p");

          expect(widths[i].value).toBe(expectedValue);
          expect(widths[i].className).toBe(expectedClassName);
        });
      }
    });
  });
});
