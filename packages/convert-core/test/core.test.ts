import { describe, expect, it } from "vitest";
import { el, expr, fallbackHtml, hole, printJsx, ReportBuilder, treeToDesign, treeToTsx, boxSides, toPx } from "../src/index";

const tree = el("Email", { contentWidth: "600px" }, [
  el("Row", { layout: "TwoEqual" }, [
    el("Column", {}, [el("Paragraph", { html: '<p class="x">Tom &amp; Jerry</p>' })]),
    el("Column", {}, [fallbackHtml("<div>raw</div>", "unsupported element: div")]),
  ]),
]);

describe("printing", () => {
  it("prints valid, formatted TSX that keeps HTML exactly", async () => {
    const code = await treeToTsx(tree, { componentName: "Welcome" });
    expect(code).toContain("export default function Welcome()");
    expect(code).toContain("layout={ColumnLayouts.TwoEqual}");
    expect(code).toContain('html={`<p class="x">Tom &amp; Jerry</p>`}');
    expect(code).toContain("{/* TODO(convert): unsupported element: div */}");
    expect(code).toMatch(/^\/\*\* @jsxRuntime automatic \*\//);
  });

  it("prints code holes and expressions", () => {
    const withCode = el("Column", {}, [
      hole("items.map((item) => (§0))", [[el("Paragraph", { key: expr("item.id") }, ["Hi ", expr("item.name")])]]),
    ]);
    const { jsx } = printJsx(withCode);
    expect(jsx).toContain("{items.map((item) => (<Paragraph key={item.id}>Hi {item.name}</Paragraph>))}");
  });

  it("prints phone props and preserves them in the editor design", async () => {
    const tree = el("Email", {}, [el("Row", {}, [el("Column", { mobile: { padding: "8px 16px" } }, [el("Image", { src: { url: "https://example.com/image.png", width: 640 }, width: "120px", mobile: { autoWidth: true }, hideOnMobile: true })])])]);
    const code = await treeToTsx(tree);
    expect(code).toContain('padding: "8px 16px"');
    expect(code).toContain("autoWidth: true");
    expect(code).toContain("hideOnMobile={true}");
    const column = treeToDesign(tree).body.rows[0].columns[0];
    expect(column.values._override.mobile).toMatchObject({ padding: "8px 16px" });
    expect(column.contents[0].values._override.mobile).toMatchObject({ hideMobile: true, src: { autoWidth: true } });
  });

  it("renames components that clash with other imports", () => {
    expect(printJsx(el("Html", { html: "x" }), { Html: "UnlayerHtml" }).jsx).toBe('<UnlayerHtml html="x" />');
  });
});

describe("report", () => {
  it("counts native and fallback blocks", () => {
    const report = new ReportBuilder();
    report.note("image border radius dropped", "8px");
    const result = report.finish(tree);
    expect(result).toMatchObject({ contentNodes: 2, nativeNodes: 1, fallbackNodes: 1, nativeRatio: 0.5 });
    expect(result.fallbacks).toEqual([{ reason: "unsupported element", detail: "div" }]);
    expect(result.notes).toEqual([{ reason: "image border radius dropped", detail: "8px" }]);
  });
});

describe("outputs and css", () => {
  it("renders design JSON through Elements", () => {
    const design = treeToDesign(tree);
    expect(design.body.rows[0].cells).toEqual([1, 1]);
    expect(design.body.rows[0].columns[1].contents[0].type).toBe("html");
  });

  it("reads lengths and box shorthands", () => {
    expect(toPx("1.5em")).toBe(24);
    expect(toPx("12pt")).toBe(16);
    expect(boxSides({ padding: "8px 16px", paddingTop: "4px" }, "padding")).toEqual({ top: 4, right: 16, bottom: 8, left: 16 });
  });
});

describe("meaningful text", () => {
  it.each([
    ["$1.00", "$100"],
    ["1,000", "1000"],
    ["-10", "10"],
    ["10%", "10"],
    ["€10", "$10"],
    ["10 %", "10"],
    ["1/2", "12"],
    ["07:30", "0730"],
    ["1'000", "1000"],
  ])("detects %s changed to %s", async (original, converted) => {
    const { compareText } = await import("../src/index");
    expect(
      compareText(
        `<p>Pay ${original} today.</p>`,
        `<p>Pay ${converted} today!</p>`,
      ).missing.length,
    ).toBeGreaterThan(0);
  });

  it("decodes the full entity set while tolerating sentence punctuation", async () => {
    const { compareText, decodeHtmlEntities } = await import("../src/index");
    expect(
      compareText(
        "<p>Total: 10 &euro;, &frac12; &NotEqualTilde;</p>",
        "<p>Total 10 €, ½ ≂̸</p>",
      ).missing,
    ).toEqual([]);
    expect(decodeHtmlEntities("&#x110000;")).toBe("�");
  });

  it("counts words that changed places as missing", async () => {
    const { compareText } = await import("../src/index");
    const check = compareText(
      "<p>Subtotal 10</p><p>Shipping free</p><p>Total 12</p>",
      "<p>Subtotal 12</p><p>Shipping free</p><p>Total 10</p>",
    );
    expect(check.missing.sort()).toEqual(["10", "12"]);
    expect(
      compareText("<p>Hello <b>there</b></p><p>Bye</p>", "<div><p>Hello there</p></div><p>Bye</p>").missing,
    ).toEqual([]);
  });
});
