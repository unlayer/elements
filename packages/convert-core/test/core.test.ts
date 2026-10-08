import { describe, expect, it } from "vitest";
import { el, editorFonts, fillEmptyColumns, pinImageWidths, shareEditorFonts, expr, fallbackHtml, hole, printJsx, ReportBuilder, treeToDesign, treeToTsx, boxSides, toPx } from "../src/index";

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

describe("editor fonts", () => {
  const design = {
    body: {
      values: { fontFamily: { label: "Inter", value: "Inter,Arial,sans-serif" } },
      rows: [{ values: {}, columns: [{ contents: [
        { type: "heading", values: { fontFamily: { label: "Instrument Serif", value: "'Instrument Serif',Georgia,serif" } } },
        { type: "text", values: { text: '<p style="font-family: Brand, sans-serif">x</p>' } },
      ] }] }],
    },
  };

  it("registers each family the design uses once, with all its weights", () => {
    const fonts = editorFonts(design, [
      { url: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&display=swap" },
      { url: "https://fonts.googleapis.com/css2?family=Inter:wght@600&display=swap" },
      { url: "https://fonts.googleapis.com/css2?family=Inter:wght@400&display=swap" },
      { url: "https://fonts.googleapis.com/css2?family=Instrument+Serif:wght@400&display=swap" },
      { url: "https://fonts.googleapis.com/css2?family=Unused:wght@400&display=swap" },
    ]);
    expect(fonts).toEqual([
      { label: "Instrument Serif", value: "'Instrument Serif',Georgia,serif", url: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@0,400;1,400&display=swap" },
      { label: "Inter", value: "Inter,Arial,sans-serif", url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" },
    ]);
  });

  it("matches @font-face stylesheets and fonts named only in text", () => {
    const face = (weight: number) => `data:text/css,${encodeURIComponent(`@font-face{font-family:'Brand';src:url('https://cdn.example.com/brand-${weight}.woff2');font-weight:${weight}}`)}`;
    const [font] = editorFonts(design, [{ url: face(400) }, { url: face(700) }]);
    expect(font.label).toBe("Brand");
    expect(font.value).toBe("'Brand'");
    expect(decodeURIComponent(font.url)).toContain("brand-400.woff2");
    expect(decodeURIComponent(font.url)).toContain("brand-700.woff2");
  });

  it("keeps stylesheets it can't merge, and skips ones it can't match", () => {
    expect(editorFonts(design, [{ url: "https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400" }, { url: "https://cdn.example.com/inter.css" }])).toEqual([
      { label: "Inter", value: "Inter,Arial,sans-serif", url: "https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400&display=swap" },
    ]);
  });
});

describe("shared editor fonts", () => {
  it("gives every list one stylesheet per family with all the styles any list uses", () => {
    const inter = (weights: string) => ({ label: "Inter", value: "Inter,Arial,sans-serif", url: `https://fonts.googleapis.com/css2?family=Inter:wght@${weights}&display=swap` });
    const serif = { label: "Serif", value: "'Instrument Serif',serif", url: "https://fonts.googleapis.com/css2?family=Instrument+Serif:wght@400&display=swap" };
    const [a, b] = shareEditorFonts([[inter("400;600"), serif], [inter("300;400")]]);
    const all = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap";
    expect(a).toEqual([{ ...inter("400;600"), url: all }, serif]);
    expect(b).toEqual([{ ...inter("300;400"), url: all }]);
  });
});

describe("pinned image widths", () => {
  it("adds an image's width attribute to its style in text and HTML blocks", () => {
    const design = { rows: [{ contents: [
      { values: { text: '<a><img alt="X" src="x.png" style="display:block" width="18"/></a><img src="y.png" width="50%">' } },
      { values: { html: '<img src="z.png" width="24" style="width:30px">', src: { url: "a.png", width: 18 } } },
    ] }] };
    const [text, html] = pinImageWidths(design).rows[0].contents;
    expect(text.values.text).toBe('<a><img alt="X" src="x.png" style="display:block;width:18px" width="18"/></a><img style="width:50%" src="y.png" width="50%">');
    expect(html.values).toEqual(design.rows[0].contents[1].values);
  });
});

describe("empty columns in a design", () => {
  it("get an invisible divider each, numbered after the design's own", () => {
    const divider = (n: number) => ({ type: "divider", values: { _meta: { htmlID: `u_content_divider_${n}` } } });
    const design = {
      counters: { u_content_divider: 2 },
      body: { rows: [{ columns: [{ contents: [] }, { contents: [divider(1), divider(2)] }, { contents: [] }] }] },
    };
    const filled = fillEmptyColumns(design);
    const [left, middle, right] = filled.body.rows[0].columns as any[];
    expect(left.contents).toEqual([{ type: "divider", values: expect.objectContaining({ border: expect.objectContaining({ borderTopWidth: "0px" }), containerPadding: "0px", _meta: { htmlID: "u_content_divider_3", htmlClassNames: "u_content_divider" } }) }]);
    expect(right.contents[0].values._meta.htmlID).toBe("u_content_divider_4");
    expect(middle.contents).toEqual([divider(1), divider(2)]);
    expect(filled.counters.u_content_divider).toBe(4);
    // The design passed in is unchanged.
    expect(design.body.rows[0].columns[0].contents).toEqual([]);
    expect(design.counters.u_content_divider).toBe(2);
  });
});
