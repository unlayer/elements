import { describe, it, expect, vi } from "vitest";
import { validateRequiredPaths } from "./validate-required-paths";

describe("validateRequiredPaths", () => {
  it("warns when Social is missing icons.icons", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    validateRequiredPaths("Social", {});
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('<Social> is missing required value "icons.icons"')
    );
    warnSpy.mockRestore();
  });

  it("warns when Menu is missing menu.items", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    validateRequiredPaths("Menu", {});
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('<Menu> is missing required value "menu.items"')
    );
    warnSpy.mockRestore();
  });

  it("warns when Table is missing table", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    validateRequiredPaths("Table", {});
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('<Table> is missing required value "table"')
    );
    warnSpy.mockRestore();
  });

  it("warns when Video is missing video", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    validateRequiredPaths("Video", {});
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('<Video> is missing required value "video"')
    );
    warnSpy.mockRestore();
  });

  it("does not warn when required paths are present", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    validateRequiredPaths("Social", { icons: { icons: [] } });
    validateRequiredPaths("Menu", { menu: { items: [] } });
    validateRequiredPaths("Table", { table: { headers: [], rows: [] } });
    validateRequiredPaths("Video", { video: { type: "youtube" } });
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("does not warn for components without required paths", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    validateRequiredPaths("Button", {});
    validateRequiredPaths("Text", {});
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("includes usage example in warning", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    validateRequiredPaths("Menu", {});
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Example:")
    );
    warnSpy.mockRestore();
  });
});
