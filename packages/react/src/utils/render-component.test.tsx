import { describe, it, expect, vi } from "vitest";
import { mergeValues, ensureMeta, validateRequiredPaths } from "@unlayer-internal/shared-elements";

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
});

describe("ensureMeta", () => {
  it("adds _meta with correct ID and class", () => {
    const result = ensureMeta({ text: "hello" }, "button", 0);
    expect(result._meta.htmlID).toBe("u_content_button_1");
    expect(result._meta.htmlClassNames).toBe("u_content_button");
  });
});

describe("validateRequiredPaths", () => {
  it("warns when Social is missing icons.icons", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    validateRequiredPaths("Social", {});
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('<Social> is missing required value "icons.icons"')
    );
    warnSpy.mockRestore();
  });

  it("does not warn for components without required paths", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    validateRequiredPaths("Button", {});
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
