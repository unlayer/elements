/**
 * designToElements, one setting or block at a time (see __fixtures__/designs.ts): the code it writes, what it says,
 * and that the code renders back to the design.
 */
import { describe, expect, it, vi } from "vitest";
import * as prettier from "prettier";
import { DESIGNS, design } from "./__fixtures__/designs";
import { designToElements } from "./design-to-elements";
import { formatElements } from "./format";
import { BLOCK_DEFAULTS } from "./defaults";
import React from "react";
import { compareDesigns } from "./compare";
import { evaluate, roundTrip } from "./test-harness";
import * as Elements from "../index";
import { UNLAYER_CONFIG_KEY } from "../utils/create-component";
import guide from "../../docs/codegen.md?raw";
import { Font } from "../font/index";

const quiet = <T,>(run: () => T): T => {
  const spies = (["warn", "error"] as const).map((level) => vi.spyOn(console, level).mockImplementation(() => {}));
  try {
    return run();
  } finally {
    spies.forEach((spy) => spy.mockRestore());
  }
};

/** Code on one line, as written inline (the snippets don't depend on where the printer breaks lines). */
const inline = (code: string) =>
  code
    .replace(/\s+/g, " ")
    .replace(/,\s*([}\]])/g, " $1")
    .replace(/\[\s+/g, "[")
    .replace(/\s+\]/g, "]")
    .replace(/\s+>/g, ">");

describe("designToElements", () => {
  it.each(Object.entries(DESIGNS))("%s", (_, c) => {
    // The code renders without a word from Elements (no prop it ignores, no padding it moves).
    const said = (["warn", "error"] as const).map((level) => vi.spyOn(console, level));
    const result = roundTrip(c.design, c.options);
    for (const spy of said) {
      expect(spy.mock.calls).toEqual([]);
      spy.mockRestore();
    }
    for (const snippet of c.code) expect(inline(result.code)).toContain(inline(snippet));
    for (const snippet of c.absent ?? []) expect(inline(result.code)).not.toContain(inline(snippet));
    for (const warning of c.warnings ?? []) expect(result.warnings).toContainEqual(expect.stringMatching(warning));
    expect(result.differences.map((d) => d.path)).toEqual(c.losses ?? []);
  });

  it("writes a whole module: imports (a props type only where `values` is written as it) and the named component", () => {
    const { code } = designToElements(design([{ type: "text", values: { text: "Hi" } }]), { componentName: "welcome-email" });
    expect(code).toBe(
      [
        'import {',
        "  Email,",
        "  Row,",
        "  Column,",
        "  ColumnLayouts,",
        "  Paragraph,",
        '} from "@unlayer/react-elements";',
        "",
        "export default function WelcomeEmail() {",
        "  return (",
        "    <Email>",
        "      <Row layout={ColumnLayouts.OneColumn}>",
        "        <Column>",
        '          <Paragraph html="Hi" />',
        "        </Column>",
        "      </Row>",
        "    </Email>",
        "  );",
        "}",
        "",
      ].join("\n")
    );
  });

  it("keeps what a design holds as data: no text, key, type or name of it becomes code", () => {
    const hostile = '"}/> </Email>; globalThis.hacked = 1; <x a={"`${1}` \\ */ {{x}} \u2028 \n & \'';
    const source = design(
      [
        { type: "text", values: { text: hostile, [`bad"key`]: hostile, color: hostile } },
        { type: "heading", values: { text: hostile, anchor: hostile } },
        { type: "button", values: { text: hostile, href: { name: "web", values: { href: hostile, target: hostile } } } },
        { type: `x */ globalThis.hacked = 2; /*`, values: {} },
        { type: "custom", slug: hostile, values: {} },
      ],
      { body: { preheaderText: hostile, fontFamily: { label: hostile, value: hostile, url: hostile } } }
    );
    const result = quiet(() => roundTrip(source, { componentName: hostile }));
    expect((globalThis as Record<string, unknown>).hacked).toBeUndefined();
    expect(result.code).toContain("export default function EmailGlobalThisHacked1XA1X()");
    expect(result.code).toContain('{/* TODO: a "x * / globalThis.hacked = 2; /*" block');
    // What a block without a component held is a TODO; everything else comes back as it was.
    expect(result.differences.map((d) => d.path)).toEqual(["body.rows[0].columns[0].contents"]);
  });

  it("names the component apart from what it imports", () => {
    expect(designToElements(design([]), { componentName: "Email" }).code).toContain("export default function EmailTemplate()");
    expect(designToElements(design([]), { componentName: "42" }).code).toContain("export default function Template()");
  });

  it("takes the design's JSON text, and says what isn't a design", () => {
    expect(designToElements(JSON.stringify(design([]))).code).toContain("<Email>");
    expect(() => designToElements({ rows: [] })).toThrow(/expected an Unlayer design/);
    expect(() => designToElements("{")).toThrow(/isn't valid JSON/);
  });

  it("writes an empty design as an empty root", () => {
    const { code } = designToElements({ body: { rows: [], values: {} } }, { displayMode: "web" });
    expect(code).toContain("return <Page />;");
  });

  it("names the row and column in every warning", () => {
    const { warnings } = designToElements(
      design([], { columns: [{ values: {}, contents: [{ type: "form", values: {} }] }, { values: {}, contents: [{ type: "carousel", values: {} }] }] })
    );
    expect(warnings).toEqual([expect.stringMatching(/^Row 1, column 1, block 1: a "form" block/), expect.stringMatching(/^Row 1, column 2, block 1: a "carousel" block/)]);
  });

  it("is pure: it imports nothing that renders or needs Node", () => {
    const modules = import.meta.glob<string>(["./*.ts", "!./*.test.ts", "!./test-harness.ts"], { query: "?raw", import: "default", eager: true });
    expect(Object.keys(modules)).toContain("./design-to-elements.ts");
    for (const [file, source] of Object.entries(modules)) {
      for (const [, from] of source.matchAll(/^(?:import|export)\s[^;=(]*?\sfrom "([^"]+)"/gm)) expect(from, file).toMatch(/^(\.\/|\.\.\/utils\/(container-defaults|image-sizing)$|\.\.\/font\/index$|@unlayer\/exporters$|@unlayer-internal\/shared-elements$)/);
    }
  });

  it("keeps the defaults it compares with equal to the components' own", () => {
    const components = Elements as unknown as Record<string, Record<string, { defaultValues: unknown }>>;
    for (const [name, defaults] of Object.entries(BLOCK_DEFAULTS)) expect(components[name][UNLAYER_CONFIG_KEY].defaultValues, name).toEqual(defaults);
  });

  it("writes the code as prettier formats it", async () => {
    for (const c of Object.values(DESIGNS)) {
      const { code } = quiet(() => designToElements(c.design, c.options));
      expect(await prettier.format(code, { parser: "typescript" })).toBe(code);
    }
  });

  it("formats with prettier, and the formatted code renders the same design", async () => {
    const source = design([{ type: "text", values: { text: "A long paragraph of plain words that a narrower print width wraps onto more lines than one" } }]);
    const { code } = designToElements(source);
    const narrow = await formatElements(code, { printWidth: 40 });
    expect(narrow).not.toBe(code);
    expect(compareDesigns(source, Elements.renderToJson(React.createElement(evaluate(narrow))) as never)).toEqual([]);
  });
});

describe("Elements templates come back as they render", () => {
  const backAgain = (template: React.ReactElement) => {
    const design = Elements.renderToJson(template) as never;
    const { code } = designToElements(design);
    const Back = evaluate(code);
    return { code, design, back: Elements.renderToJson(React.createElement(Back)) as never, html: Elements.renderToHtml(React.createElement(Back)) };
  };

  it("keeps a web font declared without `default`: its <Font>, and its URL on the fonts of its family", () => {
    const url = "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500&display=swap";
    const serif = "Fraunces, Georgia, 'Times New Roman', serif";
    const template = (
      <Elements.Email>
        <Font family="Fraunces" url={url} fallback="Georgia, serif" />
        <Elements.Row>
          <Elements.Column>
            <Elements.Heading fontFamily={serif}>Welcome</Elements.Heading>
            <Elements.Paragraph fontFamily="Georgia, serif" html="Hello" />
          </Elements.Column>
        </Elements.Row>
      </Elements.Email>
    );
    const { code, design, back, html } = backAgain(template);
    expect(inline(code)).toContain(inline(`<Font family="Fraunces" url={ "${url}" } />`));
    // The heading's font without the URL its <Font> gives back.
    expect(inline(code)).toContain(inline(`fontFamily={{ label: "${serif}", value: "${serif}" }}`));
    expect(compareDesigns(design, back)).toEqual([]);
    expect(html).toContain(url.replace(/&/g, "&amp;"));
    expect(html).toBe(Elements.renderToHtml(template));
  });

  it("writes an image's px width as the whole pixel its percent was written from", () => {
    const template = (
      <Elements.Email>
        <Elements.Row>
          <Elements.Column padding="0 24px">
            <Elements.Image src="https://example.com/logo.png" width={32} containerPadding="0" />
            <Elements.Image src="https://example.com/mark.png" width={92} />
          </Elements.Column>
        </Elements.Row>
      </Elements.Email>
    );
    const { code, design, back, html } = backAgain(template);
    expect(code).toContain("width={32}");
    expect(code).toContain("width={92}");
    expect(compareDesigns(design, back)).toEqual([]);
    expect(html).toContain("max-width: 32px");
    expect(html).toContain("max-width: 92px");
  });
});

describe("the codegen guide", () => {
  it("shows the code its example design gives", () => {
    const example = guide.slice(guide.indexOf("## What the code looks like"));
    const json = /```json\n([\s\S]*?)```/.exec(example)![1];
    const tsx = /```tsx\n([\s\S]*?)```/.exec(example)![1];
    expect(designToElements(JSON.parse(json), { componentName: "OrderShipped" }).code).toBe(tsx);
    // And it comes back as the design.
    expect(roundTrip(JSON.parse(json)).differences).toEqual([]);
  });
});
