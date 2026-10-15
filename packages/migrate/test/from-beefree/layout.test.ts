import { describe, expect, it } from "vitest";
import { beefreeToDesign } from "../../src/from-beefree";
import { column, module, page, row } from "./builders";

const text = (words = "x") => module("paragraph", { paragraph: { html: `<p>${words}</p>` } });
const pad = (t: number, r = t, b = t, l = r) => ({ "padding-top": `${t}px`, "padding-right": `${r}px`, "padding-bottom": `${b}px`, "padding-left": `${l}px` });

describe("the body", () => {
  it("message width, page background, font (with its web font), text and link colors, alignment, preheader", () => {
    const { design } = beefreeToDesign(
      page([], {
        container: { "background-color": "#f8eeee", "background-image": "url('https://example.com/bg.png')", "background-repeat": "repeat" },
        body: { color: "#000000", "font-family": "Libre Baskerville, sans-serif" },
        computed: { messageWidth: "640px", linkColor: "#0068A5", align: "left" },
        webFonts: [{ name: "Libre Baskerville", fontFamily: "'Libre Baskerville', sans-serif", url: "https://fonts.googleapis.com/css2?family=Libre+Baskerville" }],
        head: { meta: { preheader: "Fall is here", title: "Kids" } },
      })
    );
    expect(design.body.values).toMatchObject({
      contentWidth: "640px",
      backgroundColor: "#f8eeee",
      textColor: "#000000",
      contentAlign: "left",
      fontFamily: { label: "Libre Baskerville", value: "Libre Baskerville, sans-serif", url: "https://fonts.googleapis.com/css2?family=Libre+Baskerville" },
      linkStyle: { body: true, linkColor: "#0068A5", linkHoverColor: "#0068A5", linkUnderline: true, linkHoverUnderline: true },
      backgroundImage: { url: "https://example.com/bg.png", fullWidth: true, repeat: "repeat", size: "custom", position: "center" },
      preheaderText: "Fall is here",
      accessibilityTitle: "Kids",
      _meta: { htmlID: "u_body", htmlClassNames: "u_body" },
    });
    expect(design.schemaVersion).toBe(27);
  });

  it("a right-to-left body; a text block in the other direction keeps its own", () => {
    const { design } = beefreeToDesign(page([row([column([module("paragraph", { paragraph: { html: "<p>Hello</p>", style: { direction: "ltr" } } })])])], { body: { direction: "rtl" } }));
    expect(design.body.values.textDirection).toBe("rtl");
    expect(design.body.rows[0].columns[0].contents[0].values.text).toBe('<div dir="ltr"><p style="margin: 0;">Hello</p></div>');
  });
});

describe("rows and columns", () => {
  it("the 12-column grid as cells in lowest terms", () => {
    const grid = (shares: number[]) => beefreeToDesign(page([row(shares.map((s) => column([text()], s)))])).design.body.rows[0].cells;
    expect(grid([12])).toEqual([1]);
    expect(grid([6, 6])).toEqual([1, 1]);
    expect(grid([4, 8])).toEqual([1, 2]);
    expect(grid([3, 6, 3])).toEqual([1, 2, 1]);
    expect(grid([3, 3, 3, 3])).toEqual([1, 1, 1, 1]);
    expect(grid([2, 2, 2, 2, 2, 2])).toEqual([1, 1, 1, 1, 1, 1]);
    expect(grid([5, 7])).toEqual([5, 7]);
  });

  it("backgrounds: the row's across the page, its content's behind the columns, a background image either way", () => {
    const { design } = beefreeToDesign(
      page([
        row([column([text()])], { container: { "background-color": "#cf9d88", "background-image": "url('https://example.com/full.png')", "background-position": "top center" }, content: { "background-color": "#ffffff" } }),
        row([column([text()])], { content: { "background-color": "transparent", "background-image": "url('https://example.com/area.png')", "background-repeat": "repeat", "background-size": "cover" } }),
      ])
    );
    const [full, area] = design.body.rows.map((r) => r.values);
    expect(full).toMatchObject({ backgroundColor: "#cf9d88", columnsBackgroundColor: "#ffffff", backgroundImage: { url: "https://example.com/full.png", fullWidth: true, position: "top-center" } });
    expect(area).toMatchObject({ backgroundColor: "", columnsBackgroundColor: "", backgroundImage: { url: "https://example.com/area.png", fullWidth: false, repeat: "repeat", size: "cover" } });
  });

  it("columns: padding, background, borders, and the row's corner radius for its columns", () => {
    const { design } = beefreeToDesign(
      page([row([column([text()], 6, { "background-color": "#094b3c", ...pad(10, 20), "border-top": "1px solid #dddddd", "border-bottom": "0px solid transparent" }), column([text()], 6)], { computed: { columnsBorderRadius: "15px" } })])
    );
    const [first, second] = design.body.rows[0].columns.map((c) => c.values);
    expect(first).toMatchObject({ backgroundColor: "#094b3c", padding: "10px 20px 10px 20px", borderRadius: "15px", border: { borderTopWidth: "1px", borderTopStyle: "solid", borderTopColor: "#dddddd" } });
    expect(first.border).not.toHaveProperty("borderBottomWidth");
    expect(second).toMatchObject({ backgroundColor: "", padding: "0px", border: {} });
  });

  it("the content's padding: its sides to the outer columns, its top and bottom the row's where the content has no background", () => {
    const { design } = beefreeToDesign(page([row([column([text()], 6), column([text()], 6)], { content: { ...pad(20, 30, 40, 50) }, mobile: pad(5, 6, 7, 8) })]));
    const [r] = design.body.rows;
    expect(r.values.padding).toBe("20px 0px 40px 0px");
    expect(r.values._override).toEqual({ mobile: { padding: "5px 0px 7px 0px" } });
    expect(r.columns.map((c) => c.values.padding)).toEqual(["0px 0px 0px 50px", "0px 30px 0px 0px"]);
    // Stacked on phones, each column has both sides.
    expect(r.columns.map((c) => c.values._override)).toEqual([{ mobile: { padding: "0px 6px 0px 8px" } }, { mobile: { padding: "0px 6px 0px 8px" } }]);
  });

  it("with a background of its own, the content's padding is inside its columns too (reported where they're cards)", () => {
    const plain = beefreeToDesign(page([row([column([text()])], { content: { "background-color": "#fffeec", ...pad(35) } })]));
    expect(plain.design.body.rows[0].values.padding).toBe("0px");
    expect(plain.design.body.rows[0].columns[0].values.padding).toBe("35px");
    expect(plain.warnings).toEqual([]);
    const cards = beefreeToDesign(page([row([column([text()], 12, { "background-color": "#094b3c" })], { content: { "background-color": "#fffeec", ...pad(35) } })]));
    expect(cards.warnings.map((w) => w.reason)).toEqual(["row-padding"]);
  });

  it("space between columns: half on each side of it, inside the columns", () => {
    const { design } = beefreeToDesign(page([row([column([text()], 6), column([text()], 6)], { computed: { columnsSpacing: "36px" } })]));
    expect(design.body.rows[0].columns.map((c) => c.values.padding)).toEqual(["0px 18px 0px 0px", "0px 0px 0px 18px"]);
  });

  it("phones: columns side by side, hidden rows, and what Unlayer has no setting for, reported", () => {
    const { design, warnings } = beefreeToDesign(
      page([
        row([column([text()], 6), column([text()], 6)], { computed: { rowColStackOnMobile: false } }),
        row([column([text()], 6), column([text()], 6)], { computed: { hideContentOnMobile: true, rowReverseColStackOnMobile: true, verticalAlign: "middle" } }),
        row([column([text()])], { computed: { hideContentOnDesktop: true } }),
      ])
    );
    expect(design.body.rows.map((r) => r.values._override)).toEqual([{ mobile: { noStackMobile: true } }, { mobile: { hideMobile: true } }, { desktop: { hideDesktop: true } }]);
    expect(warnings.map((w) => [w.where, w.reason])).toEqual([
      ["Row 2", "row-reverse-stack"],
      ["Row 2", "row-vertical-align"],
    ]);
  });

  it("locked and synced rows lose the lock and the sync, said so; a display condition is kept", () => {
    const condition = { type: "segment", label: "VIP", description: "VIPs only", before: "{% if vip %}", after: "{% endif %}" };
    const { design, warnings } = beefreeToDesign(page([row([column([text()])], { extra: { locked: true, synced: true, container: { style: {}, displayCondition: condition } } })]));
    expect(warnings.map((w) => w.reason)).toEqual(["row-locked", "row-synced"]);
    expect(design.body.rows[0].values.displayCondition).toEqual(condition);
  });

  it("rows and columns without modules stay (a band of color is content); a row without columns is left out", () => {
    const { design, warnings } = beefreeToDesign(page([row([column([])], { content: { "background-color": "#ff0000", ...pad(20) } }), row([])]));
    expect(design.body.rows).toHaveLength(1);
    expect(design.body.rows[0].columns[0].contents).toEqual([]);
    expect(warnings.map((w) => w.message)).toEqual(["Row 2: the row has no columns, so it's left out."]);
  });

  it("numbers rows, columns and blocks as renderToJson does, and counts them", () => {
    const { design } = beefreeToDesign(page([row([column([text(), text()], 6), column([text()], 6)]), row([column([module("divider", { divider: { style: { "border-top": "1px solid #000" } } })])])]));
    expect(design.counters).toEqual({ u_content_text: 3, u_column: 3, u_row: 2, u_content_divider: 1 });
    expect(design.body.rows[1].values._meta).toEqual({ htmlID: "u_row_2", htmlClassNames: "u_row" });
    expect(design.body.rows[0].columns[1].values._meta).toEqual({ htmlID: "u_column_2", htmlClassNames: "u_column" });
    expect(design.body.rows[0].columns[1].contents[0].values._meta).toEqual({ htmlID: "u_content_text_3", htmlClassNames: "u_content_text" });
    expect(design.body.rows[0].values.cells).toEqual([1, 1]);
  });
});
