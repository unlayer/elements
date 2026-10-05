import React from "react";
import { describe, it, expect } from "vitest";
import { Email, Page, Document, Row, Column, Paragraph, Heading, Button, Image, renderToHtml, renderToHtmlParts, renderToJson } from "../index";
import { collectDeviceStyles } from "./device-overrides";
import fixtures from "./fixtures/device-parity.json";

const h = React.createElement;
const normalize = (css: string) => css.replace(/\s*([{}:;,])\s*/g, "$1").replace(/\s+/g, " ").trim();
function deviceCss(html: string): string {
  const css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("\n");
  return normalize([...css.matchAll(/@media[^{}]+\{(?:[^{}]*\{[^{}]*\}[^{}]*)+\}/g)].map((m) => m[0]).filter((rule) => (rule.includes("#u_") && rule.includes(".v-")) || rule.includes(".hide-")).join("\n"));
}
const items: Record<string, any> = { text: Paragraph, heading: Heading, button: Button, image: Image };
function fromDesign(design: any, mode: string) {
  return h(mode === "email" ? Email : mode === "web" ? Page : Document, { values: design.body.values },
    ...design.body.rows.map((r: any) => h(Row, { values: r.values, cells: r.cells },
      ...r.columns.map((c: any) => h(Column, { values: c.values },
        ...c.contents.map((item: any) => h(items[item.type], { values: item.values })))))));
}

describe("device settings", () => {
  it.each(fixtures)("matches exported editor CSS: $name / $mode", ({ design, mode, css }) => {
    expect(deviceCss(renderToHtml(fromDesign(design, mode)))).toBe(normalize(css));
  });

  it.each(["padding", "containerPadding", "fontSize", "lineHeight", "textAlign"])("stores flat phone %s in JSON", (key) => {
    const input: any = { padding: 12, containerPadding: 8, fontSize: 18, lineHeight: 1.4, textAlign: "center" };
    const tree = <Email><Row><Column><Paragraph mobile={{ [key]: input[key] }}>Phone</Paragraph></Column></Row></Email>;
    const values = renderToJson(tree).body.rows[0].columns[0].contents[0].values;
    expect(values._override.mobile[key]).toBe(["padding", "containerPadding", "fontSize"].includes(key) ? `${input[key]}px` : String(input[key]));
    expect(values.mobile).toBeUndefined();
  });

  it("keeps visibility, existing overrides and noStackMobile without mutating inputs", () => {
    const overrides = { mobile: { padding: "7px", hideMobile: true }, desktop: { hideDesktop: true } };
    const before = JSON.stringify(overrides);
    const row = renderToJson(<Email><Row noStackMobile mobile={{ padding: 0 }} hideOnMobile={false} hideOnDesktop={false} values={{ _override: overrides } as any}><Column /></Row></Email>).body.rows[0].values;
    expect(row._override).toEqual({ mobile: { padding: "0px", hideMobile: false, noStackMobile: true }, desktop: { hideDesktop: false } });
    expect(JSON.stringify(overrides)).toBe(before);
  });

  it("stores image sizing in src and button sizing in size", () => {
    const json = renderToJson(<Email><Row><Column><Image src="https://example.com/image.png" mobile={{ autoWidth: true }} /><Button mobile={{ width: 180 }}>Action</Button></Column></Row></Email>);
    expect(json.body.rows[0].columns[0].contents[0].values._override.mobile.src).toEqual({ autoWidth: true });
    expect(json.body.rows[0].columns[0].contents[1].values._override.mobile.size).toEqual({ autoWidth: false, width: "180px" });
  });

  it("matches actual row, column and repeated content IDs across renders", () => {
    const tree = <Email><Row mobile={{ padding: 4 }}><Column mobile={{ padding: 8 }}><Paragraph mobile={{ fontSize: 18 }}>One</Paragraph><Paragraph mobile={{ fontSize: 20 }}>Two</Paragraph></Column></Row><Row mobile={{ padding: 6 }}><Column mobile={{ padding: 12 }}><Paragraph mobile={{ fontSize: 22 }}>Three</Paragraph></Column></Row></Email>;
    const first = renderToHtmlParts(tree);
    expect(first).toEqual(renderToHtmlParts(tree));
    for (const id of ["u_row_1", "u_row_2", "u_column_1", "u_column_2", "u_content_paragraph_1", "u_content_paragraph_2", "u_content_paragraph_3"]) {
      expect(first.body.match(new RegExp(`id="${id}"`, "g"))).toHaveLength(1);
      expect(first.css).toContain(`#${id}`);
    }
  });

  it("ignores unsupported widgets and retains zero line height", () => {
    const styles: Record<string, string[]> = {};
    collectDeviceStyles({ _meta: { htmlID: "sample" }, _override: { mobile: { fontSize: "20px", lineHeight: 0, color: "red" } } }, "contents", "Paragraph", "email", styles);
    expect(styles.mobile).toEqual(["#sample .v-font-size { font-size: 20px !important; }", "#sample .v-line-height { line-height: 0 !important; }"]);
  });

  it("passes content visibility through to the canonical wrapper", () => {
    const html = renderToHtml(<Email><Row><Column><Paragraph hideOnMobile>Desktop</Paragraph><Paragraph hideOnDesktop>Phone</Paragraph></Column></Row></Email>);
    const doc = new DOMParser().parseFromString(html, "text/html");
    expect(doc.querySelector("#u_content_paragraph_1")?.classList.contains("hide-mobile")).toBe(true);
    expect(doc.querySelector("#u_content_paragraph_2")?.classList.contains("hide-default__display-table")).toBe(true);
    expect(doc.querySelector("#u_content_paragraph_2")?.getAttribute("style")).toContain("display: none");
  });
});
