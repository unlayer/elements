import { describe, it, expect } from "vitest";
import { mapSemanticProps } from "./semantic-props";

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

  describe("href normalization", () => {
    it("normalizes string href to link object", () => {
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

    it("passes object href through", () => {
      const hrefObj = { name: "email", values: { href: "mailto:test@test.com" } };
      const result = mapSemanticProps(
        { href: hrefObj },
        BUTTON_DEFAULTS,
        "Button"
      );
      expect(result.href).toEqual(hrefObj);
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
