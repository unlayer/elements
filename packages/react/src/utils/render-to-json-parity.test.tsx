/**
 * Parity test: renderToJson output vs real editor fixture.
 *
 * Compares field-by-field what renderToJson produces against
 * what the Unlayer editor stores in its JSON format.
 *
 * This test documents KNOWN differences and catches regressions.
 */
import { describe, it, expect } from "vitest";
import React from "react";
import { renderToJson } from "./render-to-json";
import Body from "../components/Body";
import Row from "../components/Row";
import Column from "../components/Column";
import Paragraph from "../components/Paragraph";
import Button from "../components/Button";
import Image from "../components/Image";
import Divider from "../components/Divider";

/**
 * Reference: what the editor produces for a simple design.
 * Extracted from: cypress/fixtures/templates/migrations/after/template.json (schemaVersion 24)
 */

describe("renderToJson parity with editor", () => {
  // Build a simple design that covers key content types
  const design = renderToJson(
    <Body backgroundColor="#f0f0f0" contentWidth="600px">
      <Row>
        <Column>
          <Image
            values={{
              src: { url: "https://example.com/image.png", width: 250, height: 68, maxWidth: "43.1%", autoWidth: true },
              textAlign: "center",
              altText: "Logo",
              action: { name: "web", values: { href: "https://example.com", target: "_blank" } },
            }}
          />
        </Column>
      </Row>
      <Row>
        <Column>
          <Paragraph color="#f47373" textAlign="center">
            Some text content
          </Paragraph>
          <Button
            values={{
              buttonColors: { color: "#FFFFFF", backgroundColor: "#000000", hoverColor: "#FFFFFF", hoverBackgroundColor: "#3AAEE0" },
              size: { autoWidth: true, width: "50%" },
              textAlign: "center",
              lineHeight: "120%",
              borderRadius: "4px",
              padding: "10px 20px",
              text: "Click me",
            }}
          />
          <Divider />
        </Column>
      </Row>
    </Body>
  );

  describe("top-level structure", () => {
    it("has schemaVersion", () => {
      expect(design.schemaVersion).toBe(24);
    });
    it("has counters", () => {
      expect(design.counters).toBeDefined();
      expect(typeof design.counters.u_row).toBe("number");
    });
    it("has body with rows and values", () => {
      expect(design.body.rows).toHaveLength(2);
      expect(design.body.values).toBeDefined();
    });
  });

  describe("body values", () => {
    const bv = design.body.values;

    it("matches editor body fields", () => {
      // These fields match what the editor stores
      expect(bv.backgroundColor).toBe("#f0f0f0");
      expect(bv.contentWidth).toBe("600px");
      expect(bv.fontFamily).toEqual({ label: "Arial", value: "arial,helvetica,sans-serif" });
      expect(bv.linkStyle).toEqual({
        body: true,
        linkColor: "#0000ee",
        linkHoverColor: "#0000ee",
        linkUnderline: true,
        linkHoverUnderline: true,
      });
      expect(bv._meta).toEqual({ htmlID: "u_body", htmlClassNames: "u_body" });
    });

    it("includes backgroundImage with correct structure", () => {
      expect(bv.backgroundImage).toMatchObject({
        url: "",
        fullWidth: true,
        repeat: "no-repeat",
        size: "custom",
        position: "center", // Editor uses "top-center" for user-set, "center" for default
      });
    });
  });

  describe("row values", () => {
    const rv = design.body.rows[0].values;

    it("matches editor row structure", () => {
      expect(rv.columns).toBe(false);
      expect(rv.backgroundColor).toBe("");
      expect(rv.columnsBackgroundColor).toBe("");
      expect(rv.padding).toBe("0px");
      expect(rv._meta.htmlClassNames).toBe("u_row");
    });

    it("has backgroundImage with post-migration format", () => {
      // Must use string enums (not boolean flags)
      expect(rv.backgroundImage.repeat).toBe("no-repeat");
      expect(rv.backgroundImage.size).toBe("custom");
      expect(rv.backgroundImage.position).toBe("center");
    });

    it("has cells array on row object", () => {
      expect(design.body.rows[0].cells).toEqual([1]);
    });

    it("has admin meta flags matching editor", () => {
      // The editor includes these on rows
      expect(rv.selectable).toBe(true);
      expect(rv.draggable).toBe(true);
      expect(rv.duplicatable).toBe(true);
      expect(rv.deletable).toBe(true);
    });
  });

  describe("column values", () => {
    const cv = design.body.rows[0].columns[0].values;

    it("matches editor column structure", () => {
      expect(cv.border).toEqual({});
      expect(cv.padding).toBe("0px");
      expect(cv.backgroundColor).toBe("");
      expect(cv._meta.htmlClassNames).toBe("u_column");
    });

    it("has deletable flag matching editor", () => {
      // Editor columns have deletable
      expect(cv.deletable).toBe(true);
    });
  });

  describe("image content values", () => {
    const iv = design.body.rows[0].columns[0].contents[0].values;

    it("has correct type", () => {
      expect(design.body.rows[0].columns[0].contents[0].type).toBe("image");
    });

    it("matches editor image field set", () => {
      expect(iv.containerPadding).toBe("10px");
      expect(iv.textAlign).toBe("center");
      expect(iv.altText).toBe("Logo");
      expect(iv.src.url).toBe("https://example.com/image.png");
      expect(iv.action.name).toBe("web");
      expect(iv.action.values.href).toBe("https://example.com");
    });

    it("has _meta", () => {
      expect(iv._meta.htmlClassNames).toBe("u_content_image");
    });

    it("has admin meta flags matching editor", () => {
      expect(iv.selectable).toBe(true);
      expect(iv.draggable).toBe(true);
      expect(iv.duplicatable).toBe(true);
      expect(iv.deletable).toBe(true);
    });
  });

  describe("text (paragraph) content values", () => {
    const tv = design.body.rows[1].columns[0].contents[0].values;

    it("has correct type (paragraph maps to text)", () => {
      expect(design.body.rows[1].columns[0].contents[0].type).toBe("text");
    });

    it("matches editor text field set", () => {
      expect(tv.containerPadding).toBe("10px");
      expect(tv.color).toBe("#f47373");
      expect(tv.textAlign).toBe("center");
      expect(tv.lineHeight).toBe("140%");
      expect(tv.linkStyle).toEqual({
        inherit: true,
        linkColor: "#0000ee",
        linkHoverColor: "#0000ee",
        linkUnderline: true,
        linkHoverUnderline: true,
      });
    });

    it("has text content", () => {
      expect(tv.text).toBeDefined();
      expect(typeof tv.text).toBe("string");
    });
  });

  describe("button content values", () => {
    const bv = design.body.rows[1].columns[0].contents[1].values;

    it("has correct type", () => {
      expect(design.body.rows[1].columns[0].contents[1].type).toBe("button");
    });

    it("matches editor button field set", () => {
      expect(bv.containerPadding).toBe("10px");
      expect(bv.href).toMatchObject({
        name: "web",
        values: { href: "", target: "_blank" },
      });
      expect(bv.buttonColors).toEqual({
        color: "#FFFFFF",
        backgroundColor: "#000000",
        hoverColor: "#FFFFFF",
        hoverBackgroundColor: "#3AAEE0",
      });
      expect(bv.size).toEqual({ autoWidth: true, width: "50%" });
      expect(bv.textAlign).toBe("center");
      expect(bv.lineHeight).toBe("120%");
      expect(bv.borderRadius).toBe("4px");
      expect(bv.padding).toBe("10px 20px");
      expect(bv.text).toBe("Click me");
    });
  });

  describe("divider content values", () => {
    const dv = design.body.rows[1].columns[0].contents[2].values;

    it("has correct type", () => {
      expect(design.body.rows[1].columns[0].contents[2].type).toBe("divider");
    });

    it("matches editor divider field set exactly", () => {
      // Divider in editor fixture: containerPadding, _meta, admin flags, width, border, textAlign
      expect(dv.containerPadding).toBe("10px");
      expect(dv.width).toBe("100%");
      expect(dv.border).toEqual({
        borderTopWidth: "1px",
        borderTopStyle: "solid",
        borderTopColor: "#BBBBBB",
      });
      expect(dv.textAlign).toBe("center");
    });
  });

  describe("KNOWN DIFFERENCES vs editor (documented)", () => {
    it("renderToJson includes hideable (editor does not in v24 fixtures)", () => {
      const rv = design.body.rows[0].values;
      // Our output includes hideable: true
      // Editor v24 fixtures do NOT include hideable on rows/items
      // The editor handles this gracefully on load
      expect(rv.hideable).toBe(true);
    });

    it("renderToJson does NOT include id fields (editor does)", () => {
      // Editor: { id: "9fe1a3ff-...", cells: [...], columns: [...], values: {...} }
      // Ours:   { cells: [...], columns: [...], values: {...} }
      // The editor generates nanoid() IDs — we can't replicate those
      expect((design.body.rows[0] as any).id).toBeUndefined();
    });

    it("renderToJson does NOT include body.id/headers/footers", () => {
      expect((design.body as any).id).toBeUndefined();
      expect((design.body as any).headers).toBeUndefined();
      expect((design.body as any).footers).toBeUndefined();
    });

    it("renderToJson does NOT include calculatedWidth/Height on buttons", () => {
      const bv = design.body.rows[1].columns[0].contents[1].values;
      // Editor computes these at save time based on layout
      expect(bv.calculatedWidth).toBeUndefined();
      expect(bv.calculatedHeight).toBeUndefined();
    });

    it("renderToJson does NOT include action.attrs (merge tag templates)", () => {
      const iv = design.body.rows[0].columns[0].contents[0].values;
      // Editor adds attrs: { href: "{{href}}", target: "{{target}}" } for merge tags
      expect(iv.action.attrs).toBeUndefined();
    });

    it("body values include extra defaults not in editor fixture", () => {
      const bv = design.body.values;
      // Our renderToJson dumps ALL defaults from BodyDefaults
      // Editor only stores fields that were explicitly set
      // These extra fields are harmless — editor handles them gracefully
      expect(bv.textColor).toBe("#000000");       // In our defaults, not in fixture
      expect(bv.preheaderText).toBe("");           // In our defaults, not in fixture
      expect(bv.contentAlign).toBe("center");      // In our defaults, not in fixture
    });
  });
});
