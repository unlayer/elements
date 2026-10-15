import { describe, expect, it } from "vitest";
import { beefreeToDesign, BeefreeFormatError, readBeefree } from "../../src/from-beefree";
import { module, page, single } from "./builders";

const template = single(module("paragraph", { paragraph: { html: "<p>Hello</p>", style: {}, computedStyle: {} }, style: {} }));

describe("reading a Beefree template", () => {
  it("takes the page at the top, as the Template Catalog API wraps it, and as ITemplateJson wraps it", () => {
    expect(readBeefree(template).wrapper).toBe("page");
    expect(readBeefree({ id: 1, name: "x", json_data: template }).wrapper).toBe("json_data.page");
    expect(readBeefree({ data: { json: { ...template, comments: {} } } }).wrapper).toBe("data.json.page");
    // The catalog's `json_data` as JSON text.
    expect(readBeefree({ json_data: JSON.stringify(template) }).wrapper).toBe("json_data.page");
    for (const input of [template, { json_data: template }, { data: { json: template } }]) {
      expect(beefreeToDesign(input).design.body.rows).toHaveLength(1);
    }
  });

  it("reads JSON text and bytes, with or without a UTF-8 BOM", () => {
    const text = JSON.stringify(template);
    expect(() => JSON.parse(`﻿${text}`)).toThrow();
    expect(beefreeToDesign(`﻿${text}`).version).toBe("2.0.0");
    const bom = new Uint8Array([0xef, 0xbb, 0xbf, ...new TextEncoder().encode(text)]);
    expect(beefreeToDesign(bom).version).toBe("2.0.0");
    expect(beefreeToDesign(new TextEncoder().encode(text)).version).toBe("2.0.0");
  });

  it("reads version 0.0.1, whose body type is misspelled `mailup-bee-page-proprerties`", () => {
    const old = single(module("text", { text: { html: "<p>Hi</p>", style: { color: "#111111", "line-height": "120%", "font-family": "inherit" }, computedStyle: { linkColor: "#0000FF" } }, style: {} }), { version: "0.0.1" });
    expect(old.page.body.type).toBe("mailup-bee-page-proprerties");
    const result = beefreeToDesign(old);
    expect(result.version).toBe("0.0.1");
    expect(result.warnings.filter((w) => w.reason === "body-type")).toEqual([]);
  });

  it("reports a body type its version doesn't write, and reads it as that version's", () => {
    const odd = single(module("paragraph", { paragraph: { html: "<p>Hi</p>" } }));
    odd.page.body.type = "something-else";
    const result = beefreeToDesign(odd);
    expect(result.warnings.map((w) => w.reason)).toContain("body-type");
    expect(result.design.body.rows).toHaveLength(1);
  });

  it("fails loudly on an unknown or missing version, instead of reading it as well as it can", () => {
    const newer = page([], { version: "3.0.0" });
    expect(() => beefreeToDesign(newer)).toThrow(BeefreeFormatError);
    expect(() => beefreeToDesign(newer)).toThrow(/Unknown Beefree template version "3\.0\.0": only 0\.0\.1 and 2\.0\.0 are supported/);
    const numeric = page([]);
    numeric.page.template.version = 2;
    expect(() => beefreeToDesign(numeric)).toThrow(/Unknown Beefree template version 2:/);
    const missing = page([]);
    delete missing.page.template;
    expect(() => beefreeToDesign(missing)).toThrow(/has no `page\.template\.version`/);
  });

  it("fails loudly on what isn't a full template: invalid JSON, Simple Schema, rows, a row, a popup's layout, a page without rows", () => {
    expect(() => beefreeToDesign("{ not json")).toThrow(/isn't valid JSON/);
    expect(() => beefreeToDesign({ template: { type: "email", rows: [] } })).toThrow(/Simple Schema/);
    expect(() => beefreeToDesign([{ columns: [] }])).toThrow(/a list \(a rows collection/);
    expect(() => beefreeToDesign({ type: "one-column-empty", columns: [] })).toThrow(/a single row/);
    expect(() => beefreeToDesign({ theme: {}, layout: "bar" })).toThrow(/popup's layout configuration/);
    expect(() => beefreeToDesign({ hello: "world" })).toThrow(/no `page`/);
    const rowless = page([]);
    delete rowless.page.rows;
    expect(() => beefreeToDesign(rowless)).toThrow(/`page\.rows` is missing/);
    for (const input of ["{ not json", { hello: "world" }]) expect(() => beefreeToDesign(input)).toThrow(BeefreeFormatError);
  });

  it("is pure: the same input gives the same design, and the input isn't changed", () => {
    const input = JSON.parse(JSON.stringify(template));
    const first = beefreeToDesign(input);
    expect(beefreeToDesign(input)).toEqual(first);
    expect(input).toEqual(template);
  });
});
