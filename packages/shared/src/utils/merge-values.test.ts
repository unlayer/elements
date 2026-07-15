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

  describe("prototype-pollution guard", () => {
    // JSON.parse is the realistic source of these values (unlike an object
    // literal, `{"__proto__": …}` from JSON.parse creates an *own* enumerable
    // key that Object.keys surfaces and a naive merge would copy).
    it("does not pollute Object.prototype via a top-level __proto__ key", () => {
      const malicious = JSON.parse('{"__proto__": {"polluted": "yes"}}');
      const result = mergeValues<Record<string, any>>({ a: 1 }, malicious);
      expect(({} as any).polluted).toBeUndefined();
      expect((result as any).polluted).toBeUndefined();
      expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    });

    it("does not pollute via a nested __proto__ key (guard runs at every depth)", () => {
      const malicious = JSON.parse(
        '{"nested": {"__proto__": {"polluted": "yes"}}}'
      );
      const result = mergeValues<Record<string, any>>(
        { nested: { a: 1 } },
        malicious
      );
      expect(({} as any).polluted).toBeUndefined();
      expect(result.nested.a).toBe(1);
      expect((result.nested as any).polluted).toBeUndefined();
    });

    it("skips constructor and prototype keys", () => {
      const before = ({} as any).evil;
      const result = mergeValues<Record<string, any>>(
        { a: 1 },
        {
          constructor: { evil: true },
          prototype: { evil: true },
        } as any
      );
      expect((result as any).constructor).toBe(Object);
      expect(({} as any).evil).toBe(before);
      // Legitimate keys alongside the blocked ones still merge.
      expect(result.a).toBe(1);
    });

    it("still merges sibling keys when a __proto__ key is present", () => {
      const malicious = JSON.parse('{"__proto__": {"x": 1}, "color": "blue"}');
      const result = mergeValues<Record<string, any>>(
        { color: "red", size: 10 },
        malicious
      );
      expect(result.color).toBe("blue");
      expect(result.size).toBe(10);
      expect(({} as any).x).toBeUndefined();
    });
  });
});
