import { describe, expect, it } from "vitest";
import { bodyContentWidthPx } from "./image-sizing";

describe("bodyContentWidthPx (the px-parse the content slot's geometry uses)", () => {
  it("number / px-string / bare-numeric-string resolve to px", () => {
    expect(bodyContentWidthPx(600)).toBe(600);
    expect(bodyContentWidthPx("600px")).toBe(600);
    expect(bodyContentWidthPx("600")).toBe(600);
  });

  it("percent / auto / missing fall back (never a parseInt artifact like 50)", () => {
    expect(bodyContentWidthPx("50%")).toBe(500);
    expect(bodyContentWidthPx("auto")).toBe(500);
    expect(bodyContentWidthPx(undefined)).toBe(500);
  });

  it("honors a custom fallback", () => {
    expect(bodyContentWidthPx("50%", 600)).toBe(600);
  });
});
