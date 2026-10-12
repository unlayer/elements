import { describe, expect, it } from "vitest";
import { normalizeColor, normalizeCssValues, normalizeFontStack } from "./css-values";

describe("normalizeColor", () => {
  it("writes opaque rgb()/rgba() as hex, in comma or space syntax", () => {
    expect(normalizeColor("rgb(1, 2, 3)")).toBe("#010203");
    expect(normalizeColor("rgb(255 255 255)")).toBe("#ffffff");
    expect(normalizeColor("rgba(16,17,18,1)")).toBe("#101112");
    expect(normalizeColor("rgb(100% 0% 50%)")).toBe("#ff0080");
  });

  it("keeps translucent colors as rgba(r, g, b, a)", () => {
    expect(normalizeColor("rgba(0, 0, 0, 0.5)")).toBe("rgba(0, 0, 0, 0.5)");
    expect(normalizeColor("rgb(0 0 0 / 25%)")).toBe("rgba(0, 0, 0, 0.25)");
  });

  it("reads a long value from data quickly (no backtracking)", () => {
    const digits = "1".repeat(48);
    const spaces = " ".repeat(48);
    for (const value of [`rgb(${digits}${spaces}${digits}${spaces}x`, `rgb(${"1".repeat(195)}x`, `rgb(1${" ".repeat(190)}x`, `rgb(1 ${"1 ".repeat(95)}x`, `rgb(${"1 1 ".repeat(48)}!`]) {
      const start = performance.now();
      expect(normalizeColor(value)).toBe(value);
      expect(performance.now() - start, value.slice(0, 20)).toBeLessThan(20);
    }
  });

  it("leaves other values alone", () => {
    for (const value of ["#abc", "red", "transparent", "var(--x)", "hsl(0 0% 0%)"]) {
      expect(normalizeColor(value)).toBe(value);
    }
  });
});

describe("normalizeFontStack", () => {
  it("quotes family names with ' so the stack fits in style=\"\"", () => {
    expect(normalizeFontStack('"Inter", "Helvetica Neue", sans-serif')).toBe("'Inter', 'Helvetica Neue', sans-serif");
  });

  it("escapes an apostrophe in a name it quotes with ', so the name stays whole", () => {
    expect(normalizeFontStack(`"O'Reilly Sans", serif`)).toBe(`'O\\'Reilly Sans', serif`);
    expect(normalizeFontStack(`'Inter', "Brand's Font"`)).toBe(`'Inter', 'Brand\\'s Font'`);
  });
});

describe("normalizeCssValues", () => {
  it("preserves exact color literals in content, links and metadata", () => {
    const input = {
      text: "rgb(1, 2, 3)",
      html: "rgba(1, 2, 3, 1)",
      altText: "rgb(1 2 3)",
      href: { values: { href: "rgb(1, 2, 3)" } },
      textJson: { root: { children: [{ text: "rgb(1, 2, 3)" }] } },
      _meta: { htmlID: "rgb(1, 2, 3)" },
    };
    expect(normalizeCssValues(input)).toEqual(input);
  });

  it("normalizes colors and font stacks at any depth, without touching the input", () => {
    const input = {
      color: "rgb(1, 2, 3)",
      buttonColors: { backgroundColor: "rgb(4 5 6)" },
      fontFamily: { label: "Inter", value: '"Inter", sans-serif' },
      border: { borderTopColor: "rgba(0,0,0,0.5)" },
      text: "Paid with rgb(1, 2, 3) in mind",
    };
    const out = normalizeCssValues(input);
    expect(out).toEqual({
      color: "#010203",
      buttonColors: { backgroundColor: "#040506" },
      fontFamily: { label: "Inter", value: "'Inter', sans-serif" },
      border: { borderTopColor: "rgba(0, 0, 0, 0.5)" },
      text: "Paid with rgb(1, 2, 3) in mind",
    });
    expect(input.color).toBe("rgb(1, 2, 3)");
  });

  it("passes a long value through at once", () => {
    const value = `rgb(1${" ".repeat(50_000)}`;
    const start = performance.now();
    expect(normalizeColor(value)).toBe(value);
    expect(performance.now() - start).toBeLessThan(100);
  });
});
