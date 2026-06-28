import { describe, it, expect } from "vitest";
import {
  mapSemanticProps,
  normalizeLinkValue,
  normalizeValuesForExporter,
} from "./semantic-props";

// Simulate Button defaults (has nested buttonColors, backgroundImage, border)
const BUTTON_DEFAULTS = {
  borderRadius: "4px",
  buttonColors: {
    color: "#FFFFFF",
    backgroundColor: "#0879A1",
    hoverColor: "#FFFFFF",
    hoverBackgroundColor: "#0879A1",
  },
  fontSize: "14px",
  padding: "10px 20px",
  textAlign: "center",
  text: "Button",
};

// Simulate Body defaults (has nested backgroundImage, fontFamily, linkStyle)
const BODY_DEFAULTS = {
  _meta: {},
  backgroundColor: "#F7F8F9",
  backgroundImage: {
    url: "",
    fullWidth: true,
    repeat: "no-repeat",
    size: "custom",
    position: "center",
  },
  contentAlign: "center",
  contentWidth: "500px",
  fontFamily: {
    label: "Arial",
    value: "arial,helvetica,sans-serif",
  },
  linkStyle: {
    body: true,
    linkColor: "#0000ee",
    linkHoverColor: "#0000ee",
    linkUnderline: true,
    linkHoverUnderline: true,
  },
  textColor: "#000000",
};

describe("mapSemanticProps", () => {
  describe("flat props → nested grouping", () => {
    it("groups flat color/backgroundColor into buttonColors", () => {
      const result = mapSemanticProps(
        { color: "white", backgroundColor: "blue" },
        BUTTON_DEFAULTS,
        "Button"
      );
      expect(result.buttonColors).toEqual({
        color: "white",
        backgroundColor: "blue",
      });
    });

    it("keeps top-level flat props as-is", () => {
      const result = mapSemanticProps(
        { fontSize: "18px", borderRadius: "8px" },
        BUTTON_DEFAULTS,
        "Button"
      );
      expect(result.fontSize).toBe("18px");
      expect(result.borderRadius).toBe("8px");
    });

    it("groups linkColor/linkUnderline into linkStyle", () => {
      const result = mapSemanticProps(
        { linkColor: "#ff0000", linkUnderline: false },
        BODY_DEFAULTS,
        "Body"
      );
      expect(result.linkStyle).toEqual({
        linkColor: "#ff0000",
        linkUnderline: false,
      });
    });
  });

  describe("nested object props (pass-through)", () => {
    it("passes nested object prop directly", () => {
      const result = mapSemanticProps(
        { buttonColors: { color: "red", backgroundColor: "green" } },
        BUTTON_DEFAULTS,
        "Button"
      );
      expect(result.buttonColors).toEqual({
        color: "red",
        backgroundColor: "green",
      });
    });

    it("passes backgroundImage object directly", () => {
      const bgImage = { url: "https://example.com/bg.jpg", fullWidth: false };
      const result = mapSemanticProps(
        { backgroundImage: bgImage },
        BODY_DEFAULTS,
        "Body"
      );
      expect(result.backgroundImage).toEqual(bgImage);
    });
  });

  describe("values escape hatch", () => {
    it("uses values prop as base", () => {
      const result = mapSemanticProps(
        { values: { fontSize: "20px", text: "Custom" } },
        BUTTON_DEFAULTS,
        "Button"
      );
      expect(result.fontSize).toBe("20px");
      expect(result.text).toBe("Custom");
    });

    it("flat props override values escape hatch", () => {
      const result = mapSemanticProps(
        { values: { fontSize: "20px" }, fontSize: "24px" },
        BUTTON_DEFAULTS,
        "Button"
      );
      expect(result.fontSize).toBe("24px");
    });

    it("flat nested props merge with values escape hatch nested", () => {
      const result = mapSemanticProps(
        {
          values: { buttonColors: { color: "red", backgroundColor: "blue" } },
          backgroundColor: "green",
        },
        BUTTON_DEFAULTS,
        "Button"
      );
      // flat backgroundColor should override into buttonColors
      expect(result.buttonColors.color).toBe("red"); // from values
      expect(result.buttonColors.backgroundColor).toBe("green"); // from flat prop
    });
  });

  describe("children → text/textJson conversion", () => {
    it("converts children to text for Button", () => {
      const result = mapSemanticProps(
        { children: "Click me" },
        BUTTON_DEFAULTS,
        "Button"
      );
      expect(result.text).toBe("Click me");
    });

    it("converts children to textJson for Paragraph", () => {
      const result = mapSemanticProps(
        { children: "Hello world" },
        { textJson: null, fontSize: "14px" },
        "Paragraph"
      );
      expect(result.textJson).toBeDefined();
      expect(result.text).toBeUndefined();
    });

    it("does not overwrite existing text from values", () => {
      const result = mapSemanticProps(
        { children: "From children", values: { text: "From values" } },
        BUTTON_DEFAULTS,
        "Button"
      );
      expect(result.text).toBe("From values");
    });
  });

  describe("html prop → textJson conversion (Paragraph)", () => {
    it("converts html prop to textJson for Paragraph", () => {
      const result = mapSemanticProps(
        { html: "<b>Bold</b>" },
        { textJson: null, fontSize: "14px" },
        "Paragraph"
      );
      expect(result.textJson).toBeDefined();
      expect(result.html).toBeUndefined();
    });

    it("does not convert html prop for non-Paragraph", () => {
      const result = mapSemanticProps(
        { html: "<b>Bold</b>" },
        BUTTON_DEFAULTS,
        "Button"
      );
      // For non-Paragraph, html stays as a regular prop
      expect(result.html).toBe("<b>Bold</b>");
    });
  });

  describe("href normalization (mapper preserves storage shape)", () => {
    // The mapper deliberately keeps the schema's storage shape so renderToJson
    // round-trips back into the editor unchanged. The exporter's render shape
    // (`{ url, target }`) is produced later by `normalizeValuesForExporter`.

    it("wraps string href into the storage shape {name, values}", () => {
      const result = mapSemanticProps(
        { href: "https://example.com" },
        BUTTON_DEFAULTS,
        "Button"
      );
      expect(result.href).toEqual({
        name: "web",
        values: { href: "https://example.com", target: "_blank" },
      });
    });

    it("passes a canonical object href ({name, values}) through unchanged", () => {
      const hrefObj = { name: "email", values: { href: "mailto:test@test.com" } };
      const result = mapSemanticProps(
        { href: hrefObj },
        BUTTON_DEFAULTS,
        "Button"
      );
      expect(result.href).toEqual(hrefObj);
    });

    it("canonicalizes an attrs href into values.href so the editor reads it", () => {
      // The link must land in `values.href` (where the Builder reads it), not be
      // left in `attrs` with an empty values.href — otherwise renderToJson →
      // editor loses the link even though renderToHtml renders it.
      const result = mapSemanticProps(
        { href: { name: "web", attrs: { href: "https://x.com/cta", target: "_self" } } },
        BUTTON_DEFAULTS,
        "Button"
      );
      expect((result.href as any).values).toEqual({
        href: "https://x.com/cta",
        target: "_self",
      });
      expect((result.href as any).attrs).toBeUndefined();
    });

    it("keeps genuine custom attrs while lifting the href into values", () => {
      const result = mapSemanticProps(
        { href: { name: "web", values: { href: "https://x.com/v" }, attrs: { class: "cta" } } },
        BUTTON_DEFAULTS,
        "Button"
      );
      expect((result.href as any).values.href).toBe("https://x.com/v");
      expect((result.href as any).attrs).toEqual({ class: "cta" });
    });
  });

  describe("edge cases", () => {
    it("returns empty object when no props given", () => {
      const result = mapSemanticProps({}, BUTTON_DEFAULTS, "Button");
      expect(result).toEqual({});
    });

    it("skips undefined values", () => {
      const result = mapSemanticProps(
        { fontSize: undefined, borderRadius: "8px" },
        BUTTON_DEFAULTS,
        "Button"
      );
      expect(result).toEqual({ borderRadius: "8px" });
      expect("fontSize" in result).toBe(false);
    });

    it("handles _meta in defaults without grouping into it", () => {
      const result = mapSemanticProps(
        { backgroundColor: "#fff" },
        BODY_DEFAULTS,
        "Body"
      );
      // backgroundColor is NOT a child of _meta (which is skipped)
      expect(result._meta).toBeUndefined();
      expect(result.backgroundColor).toBe("#fff");
    });
  });
});

describe("normalizeLinkValue", () => {
  it("returns undefined for null/undefined", () => {
    expect(normalizeLinkValue(null)).toBeUndefined();
    expect(normalizeLinkValue(undefined)).toBeUndefined();
  });

  it("converts a string to {url, target: '_blank'}", () => {
    expect(normalizeLinkValue("https://example.com")).toEqual({
      url: "https://example.com",
      target: "_blank",
    });
  });

  it("passes a render-shape value ({url, ...}) through unchanged", () => {
    const v = { url: "https://example.com", target: "_self" };
    expect(normalizeLinkValue(v)).toEqual(v);
  });

  it("resolves storage shape ({name, values: {href, target}}) to render shape", () => {
    expect(
      normalizeLinkValue({
        name: "web",
        values: { href: "https://example.com", target: "_blank" },
      })
    ).toEqual({ url: "https://example.com", target: "_blank" });
  });

  it("defaults missing target to '_blank'", () => {
    expect(
      normalizeLinkValue({ name: "email", values: { href: "mailto:a@b.com" } })
    ).toEqual({ url: "mailto:a@b.com", target: "_blank" });
  });

  it("returns undefined for unknown shapes (caller keeps original)", () => {
    expect(normalizeLinkValue({ random: "thing" })).toBeUndefined();
    expect(normalizeLinkValue(42)).toBeUndefined();
  });

  it("returns undefined for a bare {name} with no values/attrs (not a link)", () => {
    // Honor the contract: only the actual storage variants (values or attrs)
    // normalize; a name-only object falls through so the caller keeps it.
    expect(normalizeLinkValue({ name: "web" })).toBeUndefined();
  });

  it("reads href/target from `attrs` (the alias the canonical Href type exposes)", () => {
    expect(
      normalizeLinkValue({ name: "web", attrs: { href: "https://x.com/a", target: "_self" } })
    ).toEqual({ url: "https://x.com/a", target: "_self" });
  });

  it("an empty `values.href` (the schema default) falls through to `attrs.href`", () => {
    // mergeValues merges the schema default `values: { href: "" }` in, so an empty
    // values.href must NOT win over an attrs href — guards the `||` vs `??` fix.
    expect(
      normalizeLinkValue({ name: "web", values: { href: "" }, attrs: { href: "https://x.com/a" } })
    ).toEqual({ url: "https://x.com/a", target: "_blank" });
  });

  it("keeps genuine custom attrs (non href/target) on the render value", () => {
    expect(
      normalizeLinkValue({ name: "web", values: { href: "https://x.com/v" }, attrs: { class: "cta", "data-id": "7" } })
    ).toEqual({ url: "https://x.com/v", target: "_blank", class: "cta", "data-id": "7" });
  });
});

describe("normalizeValuesForExporter", () => {
  const STORAGE_HREF = {
    name: "web",
    values: { href: "https://example.com", target: "_blank" },
  };
  const RENDER_HREF = { url: "https://example.com", target: "_blank" };

  it("normalizes top-level href (Button/Video case)", () => {
    const out = normalizeValuesForExporter(
      { href: STORAGE_HREF, text: "Click" },
      "Button"
    );
    expect(out.href).toEqual(RENDER_HREF);
    expect(out.text).toBe("Click");
  });

  it("normalizes top-level action (Image/Timer case)", () => {
    const out = normalizeValuesForExporter(
      { action: STORAGE_HREF, altText: "alt" },
      "Image"
    );
    expect(out.action).toEqual(RENDER_HREF);
    expect(out.altText).toBe("alt");
  });

  it("walks menu.items[].link for Menu", () => {
    const out = normalizeValuesForExporter(
      {
        menu: {
          items: [
            { key: "1", text: "Home", link: STORAGE_HREF },
            { key: "2", text: "About", link: STORAGE_HREF },
          ],
        },
      },
      "Menu"
    );
    expect(out.menu.items[0].link).toEqual(RENDER_HREF);
    expect(out.menu.items[1].link).toEqual(RENDER_HREF);
  });

  it("does not mutate the input values", () => {
    const input = { href: STORAGE_HREF };
    const out = normalizeValuesForExporter(input, "Button");
    expect(input.href).toEqual(STORAGE_HREF); // unchanged
    expect(out).not.toBe(input);
  });

  it("is a no-op when there are no link fields", () => {
    const input = { fontSize: "14px", color: "#000" };
    const out = normalizeValuesForExporter(input, "Heading");
    expect(out).toEqual(input);
  });

  it("leaves render-shape values as-is", () => {
    const out = normalizeValuesForExporter(
      { href: RENDER_HREF },
      "Button"
    );
    expect(out.href).toEqual(RENDER_HREF);
  });
});
