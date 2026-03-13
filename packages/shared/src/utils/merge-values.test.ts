import { describe, it, expect } from "vitest";
import { mergeValues } from "./merge-values";

describe("mergeValues", () => {
  it("returns defaults when no user values", () => {
    const defaults = { color: "red", size: 10 };
    expect(mergeValues(defaults)).toEqual(defaults);
  });

  it("merges user values over defaults", () => {
    const defaults = { color: "red", size: 10 };
    const result = mergeValues(defaults, { color: "blue" });
    expect(result).toEqual({ color: "blue", size: 10 });
  });

  it("handles undefined user values", () => {
    const defaults = { a: 1 };
    expect(mergeValues(defaults, undefined)).toEqual({ a: 1 });
  });

  it("deep merges nested objects", () => {
    const defaults = {
      align: "center",
      icons: { iconType: "circle", icons: [] },
    };
    const result = mergeValues(defaults, {
      icons: { icons: [{ name: "Facebook" }] },
    });
    // iconType should survive — it's in defaults, not overridden
    expect(result.icons.iconType).toBe("circle");
    expect(result.icons.icons).toEqual([{ name: "Facebook" }]);
    expect(result.align).toBe("center");
  });

  it("replaces arrays entirely (no array merge)", () => {
    const defaults = { items: [1, 2, 3] };
    const result = mergeValues(defaults, { items: [4, 5] });
    expect(result.items).toEqual([4, 5]);
  });

  it("replaces primitives entirely", () => {
    const defaults = { color: "red", nested: { a: 1 } };
    const result = mergeValues(defaults, { color: "blue" });
    expect(result.color).toBe("blue");
    expect(result.nested).toEqual({ a: 1 });
  });

  it("handles null user values in nested objects", () => {
    const defaults = { nested: { a: 1, b: 2 } };
    const result = mergeValues(defaults, { nested: null as any });
    expect(result.nested).toBeNull();
  });
});
