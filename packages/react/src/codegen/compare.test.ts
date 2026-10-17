/** The round trip's comparison: what it finds, and what it leaves aside (see compare.ts). */
import { describe, expect, it } from "vitest";
import { design } from "./__fixtures__/designs";
import { compareDesigns, normalizeDesign } from "./compare";

const paths = (a: Record<string, any>, b: Record<string, any>) => compareDesigns(a, b).map((d) => d.path);
const text = (values: Record<string, unknown>, body: Record<string, unknown> = {}) => design([{ type: "text", values: { text: "Hi", ...values } }], { body });

describe("compareDesigns", () => {
  it("finds a value that changed, one that's gone and a block that's gone", () => {
    expect(paths(text({ color: "#111111" }), text({ color: "#222222" }))).toEqual(["body.rows[0].columns[0].contents[0].values.color"]);
    expect(paths(text({ fontSize: "20px" }), text({}))).toEqual(["body.rows[0].columns[0].contents[0].values.fontSize"]);
    expect(paths(design([{ type: "text", values: {} }, { type: "divider", values: {} }]), design([{ type: "text", values: {} }]))).toEqual(["body.rows[0].columns[0].contents"]);
    expect(paths(design([], { row: { padding: "12px" } }), design([]))).toEqual(["body.rows[0].values.padding"]);
    expect(paths(design([{ type: "custom", slug: "a", values: {} }]), design([{ type: "html", values: {} }]))).toEqual(["body.rows[0].columns[0].contents[0].type", "body.rows[0].columns[0].contents[0].slug"]);
  });

  it("leaves aside ids, numbering and values at the builder's defaults", () => {
    const editor = { ...text({ containerPadding: "10px", anchor: "", hideDesktop: false, _meta: { htmlID: "u_content_text_7", htmlClassNames: "u_content_text" } }), counters: { u_row: 9 }, schemaVersion: 12 };
    editor.body.rows[0].id = "abc";
    expect(paths(editor, text({}))).toEqual([]);
  });

  it("takes a text block's missing color as the body's", () => {
    expect(paths(text({}, { textColor: "#333333" }), text({ color: "#333333" }, { textColor: "#333333" }))).toEqual([]);
    expect(paths(text({}, { textColor: "#333333" }), text({ color: "#000000" }, { textColor: "#333333" }))).toEqual(["body.rows[0].columns[0].contents[0].values.color"]);
  });

  it("reads colors, links and paddings written another way as the same", () => {
    expect(paths(text({ color: "rgb(0, 0, 0)" }), text({ color: "#000000" }))).toEqual([]);
    const button = (href: unknown, padding: string) => design([{ type: "button", values: { href, padding } }]);
    expect(paths(button("https://example.com", "8px 8px"), button({ name: "web", values: { href: "https://example.com", target: "_blank" } }, "8px"))).toEqual([]);
  });

  it("reads a bare zero in a px length as 0px, and only there", () => {
    const button = (values: Record<string, unknown>) => design([{ type: "button", values }]);
    expect(paths(button({ borderRadius: "0", padding: "0 0 12px", border: { borderTopWidth: "0" } }), button({ borderRadius: "0px", padding: "0px 0px 12px", border: { borderTopWidth: "0px" } }))).toEqual([]);
    expect(paths(button({ borderRadius: "0 1em" }), button({ borderRadius: "0px 1em" }))).toEqual(["body.rows[0].columns[0].contents[0].values.borderRadius"]);
  });

  it("reads the editor's Lexical paragraph as a text block with its HTML, and leaves textJson beside text aside", () => {
    const lexical = design([{ type: "paragraph", values: { textJson: '{"root":{"type":"root","children":[{"type":"paragraph","children":[{"type":"text","text":"A"}]}]}}' } }]);
    expect(normalizeDesign(lexical).body.rows[0].columns[0].contents[0]).toEqual({ type: "text", values: { color: "#000000", text: '<p style="margin: 0px; margin-block-start: 0px; margin-block-end: 0px;">A</p>' } });
    expect(paths(text({ textJson: "{}" }), text({}))).toEqual([]);
  });

  it("reads device settings that are off as missing, and a row's top-level noStackMobile as its phone setting", () => {
    expect(paths(text({ _override: { mobile: { hideMobile: false }, desktop: {} } }), text({}))).toEqual([]);
    expect(paths(design([], { row: { noStackMobile: true } }), design([], { row: { _override: { mobile: { noStackMobile: true } } } }))).toEqual([]);
  });
});
