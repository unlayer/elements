import React from "react";
import { describe, expect, it } from "vitest";
import * as Elements from "@unlayer/react-elements";
import { toDesign } from "@unlayer/react-elements/builder";
import { autoTableWidths, el, editorFonts, pinImageWidths, shareEditorFonts, expr, fallbackHtml, hole, NewComponentsError, printJsx, readTemplate, ReportBuilder, TODAYS_COMPONENTS, toNewComponents, treeToNewComponents, treeToTsx, boxSides, toPx, SLOT_OPEN, SLOT_CLOSE } from "../../src/convert/index";

/** What a module the codemod writes may import: the new components, and React. */
const MODULES = { "@unlayer/react-elements": Elements as unknown as Record<string, unknown>, react: React as unknown as Record<string, unknown> };

const tree = el("Email", { contentWidth: "600px" }, [
  el("Row", { layout: "TwoEqual" }, [
    el("Column", {}, [el("Paragraph", { html: '<p class="x">Tom &amp; Jerry</p>' })]),
    el("Column", {}, [fallbackHtml("<div>raw</div>", "unsupported element: div")]),
  ]),
]);

describe("printing", () => {
  it("prints valid, formatted TSX that keeps HTML exactly, in today's components from where nothing resolves them", async () => {
    const code = await treeToTsx(tree, { componentName: "Welcome" });
    expect(code).toContain(`from "${TODAYS_COMPONENTS}";`);
    expect(code).toContain("export default function Welcome()");
    expect(code).toContain("layout={ColumnLayouts.TwoEqual}");
    expect(code).toContain('html={`<p class="x">Tom &amp; Jerry</p>`}');
    expect(code).toContain("{/* TODO(convert): unsupported element: div */}");
    expect(code).toMatch(/^\/\*\* @jsxRuntime automatic \*\//);
  });

  it("prints code holes and expressions", () => {
    const withCode = el("Column", {}, [
      hole(`items.map((item) => (${SLOT_OPEN}0${SLOT_CLOSE}))`, [[el("Paragraph", { key: expr("item.id") }, ["Hi ", expr("item.name")])]]),
    ]);
    const { jsx } = printJsx(withCode);
    expect(jsx).toContain("{items.map((item) => (<Paragraph key={item.id}>Hi {item.name}</Paragraph>))}");
  });

  it("prints phone props, and keeps them in the new components", async () => {
    const tree = el("Email", {}, [el("Row", {}, [el("Column", { mobile: { padding: "8px 16px" } }, [el("Image", { src: { url: "https://example.com/image.png", width: 640 }, width: "120px", mobile: { autoWidth: true }, hideOnMobile: true })])])]);
    const code = await treeToTsx(tree);
    expect(code).toContain('padding: "8px 16px"');
    expect(code).toContain("autoWidth: true");
    expect(code).toContain("hideOnMobile={true}");
    const moved = (await treeToNewComponents(tree)).code;
    expect(moved).toContain('mobile={{ padding: "8px 16px" }}');
    expect(moved).toContain("hidden={{ mobile: true }}");
    expect(moved).toMatch(/mobile=\{\{ width: "100%"/);
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

describe("the new components", () => {
  it("are what a tree is written in, read back as an element without running the module", async () => {
    const { code, notes } = await treeToNewComponents(tree);
    expect(code).toMatch(/from "@unlayer\/react-elements";/);
    expect(code).not.toContain(TODAYS_COMPONENTS);
    expect(notes).toEqual(expect.any(Array));
    const element = readTemplate(code, MODULES);
    expect(element.type).toBe(Elements.Email);
    const { html } = await Elements.render(element);
    expect(html).toContain("Tom &amp; Jerry");
    expect(html).toContain("<div>raw</div>");
    // The visual editor gets both columns, the one it can't map as an HTML block.
    const { design } = toDesign(element);
    expect(design.body.rows[0].columns).toHaveLength(2);
    expect(design.body.rows[0].columns[1].contents[0].type).toBe("html");
  });

  it("are read with JSX's spacing, entities, negative numbers and spread objects", () => {
    const element = readTemplate(
      `/** @jsxRuntime automatic */\nimport { Email as Root, Text } from "@unlayer/react-elements";\nimport { Fragment } from "react";\nexport default function Template() {\n  return (\n    <Root style={{ margin: -2, ...{ padding: [1, +2] } }} title="a &amp; b">\n      <Text>\n        Hello &amp;\n        welcome{" "}\n      </Text>\n      <Fragment key="x">{[<Text key={0}>{null}</Text>]}</Fragment>\n    </Root>\n  );\n}\n`,
      MODULES,
    );
    const props = element.props as { style: unknown; title: string; children: React.ReactElement[] };
    expect(element.type).toBe(Elements.Email);
    expect(props.style).toEqual({ margin: -2, padding: [1, 2] });
    expect(props.title).toBe("a & b");
    expect((props.children[0].props as { children: unknown }).children).toEqual(["Hello & welcome", " "]);
    expect(props.children[1].type).toBe(React.Fragment);
  });

  it("aren't read from a module that runs code, or uses what it doesn't import", () => {
    const module = (body: string, imports = `import { Email, Text } from "@unlayer/react-elements";`) => `${imports}\nexport default function Template() {\n${body}\n}\n`;
    expect(() => readTemplate(module("const name = 'Alex';\nreturn <Email><Text>{name}</Text></Email>;"), MODULES)).toThrow(/does more than return its JSX/);
    expect(() => readTemplate(module("return <Email><Text>{name}</Text></Email>;"), MODULES)).toThrow(/can't be read as it's written: this code \(name\)/);
    expect(() => readTemplate(module("return <Email><Text>{`${1}`}</Text></Email>;"), MODULES)).toThrow(/can't be read/);
    expect(() => readTemplate(module("return <Email><Section /></Email>;"), MODULES)).toThrow(/a component it doesn't import \(Section\)/);
    expect(() => readTemplate(module("return <Email />;", `import { Email } from "./email";`), MODULES)).toThrow(/an import of \.\/email/);
    expect(() => readTemplate(module("return <Email><Body /></Email>;", `import { Email, Body } from "@unlayer/react-elements";`), MODULES)).toThrow(/@unlayer\/react-elements has no Body/);
  });

  it("fail where the codemod can't write them, with why and the source in today's components", async () => {
    const todays = (body: string, names = "Column, Email, Page, Paragraph, Row") => `import { ${names} } from "${TODAYS_COMPONENTS}";\n${body}\n`;
    // A root chosen at run time.
    const chosen = todays("export default function T({ web }: { web: boolean }) {\n  const Root = web ? Page : Email;\n  return <Root><Row><Column><Paragraph html=\"Hi\" /></Column></Row></Root>;\n}");
    const error = await toNewComponents(chosen).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(NewComponentsError);
    expect((error as NewComponentsError).reason).toMatch(/its root is chosen at run time/);
    expect((error as NewComponentsError).intermediate).toBe(chosen);
    expect((error as Error).message).toMatch(/^it can't be written in the new components: line 3: its root is chosen at run time/);
    // One of today's components used other than as an element stays imported from today's: it can't run.
    const used = todays("const parts = [Paragraph];\nexport default function T() {\n  return <Email><Row><Column><Paragraph html=\"Hi\" /></Column></Row></Email>;\n}");
    await expect(toNewComponents(used)).rejects.toThrow(/it still uses today's Paragraph \(line 1: Paragraph stays imported from/);
  });

  it("list Columns written one under another apart, as they move", async () => {
    const source = `import { Column, Email, Paragraph, Row } from "${TODAYS_COMPONENTS}";\nexport default function T({ layout }: { layout: any }) {\n  return <Email><Row layout={layout}><Column><Paragraph html="A" /></Column><Column><Paragraph html="B" /></Column></Row></Email>;\n}\n`;
    const { stacked, notes } = await toNewComponents(source);
    expect(stacked).toEqual([expect.stringMatching(/^line 3: this Row's layout can't be read \(layout\): its Columns are written one under another/)]);
    expect(notes).toContain(stacked[0]);
    expect((await toNewComponents(source.replace("layout={layout}", ""))).stacked).toEqual([]);
  });
});

describe("outputs and css", () => {

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
    const { compareText } = await import("../../src/convert/index");
    expect(
      compareText(
        `<p>Pay ${original} today.</p>`,
        `<p>Pay ${converted} today!</p>`,
      ).missing.length,
    ).toBeGreaterThan(0);
  });

  it("decodes the full entity set while tolerating sentence punctuation", async () => {
    const { compareText, decodeHtmlEntities } = await import("../../src/convert/index");
    expect(
      compareText(
        "<p>Total: 10 &euro;, &frac12; &NotEqualTilde;</p>",
        "<p>Total 10 €, ½ ≂̸</p>",
      ).missing,
    ).toEqual([]);
    expect(decodeHtmlEntities("&#x110000;")).toBe("�");
  });

  it("counts words that changed places as missing", async () => {
    const { compareText } = await import("../../src/convert/index");
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

  it("finds a family that only a Paragraph's rich text names", () => {
    const rich = { body: { rows: [{ columns: [{ contents: [{ type: "paragraph", values: { fontFamily: { label: "Inter", value: "Inter, sans-serif" }, textJson: JSON.stringify({ root: { children: [{ type: "extended-text", style: "font-family:'Instrument Serif'", text: "x" }] } }) } }] }] }] } };
    const urls = ["Inter", "Instrument+Serif", "Unused"].map((family) => ({ url: `https://fonts.googleapis.com/css2?family=${family}:wght@400&display=swap` }));
    expect(editorFonts(rich, urls).map((font) => font.label)).toEqual(expect.arrayContaining(["Instrument Serif"]));
  });

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

describe("code holes", () => {
  it("leave a § in the template's own code as it is", async () => {
    const tree = el("Email", {}, [el("Row", {}, [el("Column", {}, [hole(`legalRef === "§13" ? ${SLOT_OPEN}0${SLOT_CLOSE} : null`, [[el("Paragraph", {}, ["Legal"])]])])])]);
    const { jsx } = printJsx(tree);
    expect(jsx).toContain('legalRef === "§13" ? <Paragraph>Legal</Paragraph> : null');
  });
});

describe("autoTableWidths", () => {
  it("gives columns that fit their max-content and the rest in proportion; an empty one none", () => {
    expect(autoTableWidths([{ min: 40, max: 40 }, { min: 80, max: 360 }], 600).map(Math.round)).toEqual([60, 540]);
    expect(autoTableWidths([{ min: 0, max: 0 }, { min: 50, max: 100 }], 600)).toEqual([0, 600]);
  });

  it("grows columns from their min-content toward their max-content when not all fit, and keeps a set width", () => {
    expect(autoTableWidths([{ min: 100, max: 500 }, { min: 100, max: 300 }], 400).map(Math.round)).toEqual([233, 167]);
    expect(autoTableWidths([{ min: 10, max: 10, set: 200 }, { min: 50, max: 100 }], 600)).toEqual([200, 400]);
  });
});

