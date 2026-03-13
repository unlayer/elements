import { describe, it, expect } from "vitest";
import { ensureMeta } from "./ensure-meta";

describe("ensureMeta", () => {
  it("adds _meta with correct ID and class", () => {
    const result = ensureMeta({ text: "hello" }, "button", 0);
    expect(result._meta.htmlID).toBe("u_content_button_1");
    expect(result._meta.htmlClassNames).toBe("u_content_button");
  });

  it("preserves existing _meta fields", () => {
    const result = ensureMeta({ _meta: { custom: true } }, "text", 2);
    expect(result._meta.htmlID).toBe("u_content_text_3");
    expect(result._meta.custom).toBe(true);
  });

  it("uses correct index offset", () => {
    const result = ensureMeta({}, "image", 5);
    expect(result._meta.htmlID).toBe("u_content_image_6");
  });
});
