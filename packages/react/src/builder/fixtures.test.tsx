/**
 * Designs from outside the adapter: ones the real builder saved, read as expected; malformed JSON, read without
 * throwing into a template that renders; and a design's size, against what the builder itself saves.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import React from "react";
import { describe, expect, it } from "vitest";
import * as codemodSpotify from "../primitives/codemod/SpotifyWelcome";
import * as jsxRuntime from "react/jsx-runtime";
import ts from "typescript";
import type { Node } from "@unlayer-internal/elements-core";
import * as primitives from "../primitives";
import { render, validate } from "../primitives";
import { collectTemplate } from "../primitives/collect";
import { fromDesign, toDesign, type DisplayMode } from "./index";
import { HIDDEN } from "./manifest";
import { seen, type Seen } from "./testing/reader";
import { everyTool, invoice, sample, TEMPLATES } from "./testing/templates";

const tree = (element: React.ReactElement): Node => collectTemplate(element).document!.root;

/** Printed code run as a module, with the components it imports: the element its component returns. */
function run(code: string): React.ReactElement {
  const js = ts.transpileModule(code, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const module = { exports: {} as { default: () => React.ReactElement } };
  const modules: Record<string, unknown> = { "@unlayer/react-elements/primitives": primitives, "react/jsx-runtime": jsxRuntime };
  new Function("require", "module", "exports", js)((name: string) => modules[name], module, module.exports);
  return module.exports.default();
}

const fixture = (name: string) => JSON.parse(readFileSync(join(__dirname, "__fixtures__/designs", `${name}.json`), "utf8"));

/** Where what a reader gets differs, as "block 3 (Button) own". */
function differing(a: Seen[], b: Seen[]): string[] {
  const close = (x: unknown, y: unknown): boolean => {
    if (typeof x === "number" && typeof y === "number") return Math.abs(x - y) <= 1;
    if (x && y && typeof x === "object" && typeof y === "object") return [...new Set([...Object.keys(x), ...Object.keys(y)])].every((k) => close((x as never)[k], (y as never)[k]));
    return JSON.stringify(x) === JSON.stringify(y);
  };
  if (a.length !== b.length) return [`${a.length} blocks, then ${b.length}`];
  return a.flatMap((block, i) => [...new Set([...Object.keys(block), ...Object.keys(b[i])])].filter((key) => !close((block as never)[key], (b[i] as never)[key])).map((key) => `block ${i} (${block.kind}) ${key}`));
}

describe("designs the real builder saved", () => {
  // Designs the earlier adapter wrote (its node of each item in values._elements, which isn't read now), loaded in
  // the real builder and saved by it. Each reads as the template it was written from, but for what that adapter kept
  // only in its payload, and the values the builder gave what it didn't write (its own defaults).
  const cases: Array<[string, React.ReactElement, DisplayMode, string[]]> = [
    [
      "sample.saved-in-builder",
      sample,
      "email",
      [
        // The heading's background and corners, and the image's corners (blocks 0 and 4), were in the payload only;
        // the earlier adapter wrote every link to open a new window, today's components' default (1 and 3).
        "block 0 (Heading) own",
        "block 1 (Paragraph) runs",
        "block 3 (Button) own",
        "block 4 (Image) own",
      ],
    ],
    ["every-tool.saved-in-builder", everyTool, "email", ["block 0 (Heading) own", "block 2 (Button) own", "block 3 (Link) own", "block 5 (Paragraph) runs", "block 11 (Paragraph) hidden"]],
    // The body had no background written: the builder's grey.
    ["invoice.saved-in-builder", invoice, "document", [0, 1, 2, 3, 4, 5, 6].map((i) => `block ${i} (${i === 1 ? "Heading" : "Paragraph"}) behind`)],
    // A heading's words changed in the builder's editor; the button's hover is the builder's default (white on blue).
    ["SpotifyPremiumWelcome.edited-in-builder", <codemodSpotify.SpotifyPremiumWelcome key="spotify" />, "email", ["block 3 (Heading) runs", "block 5 (Button) own"]],
  ];
  for (const [name, template, displayMode, expected] of cases) {
    it(`reads ${name} as the template it was written from`, () => {
      const back = fromDesign(fixture(name), { displayMode });
      expect(back.report).toEqual([]);
      expect(differing(seen(template), seen(back.element))).toEqual(expected);
    });
  }

  it("reads the edit in the edited one as the builder made it: only the heading's words", () => {
    const back = fromDesign(fixture("SpotifyPremiumWelcome.edited-in-builder"));
    const heading = seen(back.element)[3];
    expect(heading.runs!.map((run) => run.text)).toEqual(["Premium starts today."]);
    expect(seen(<codemodSpotify.SpotifyPremiumWelcome />)[3].runs!.map((run) => run.text)).toEqual(["Premium is yours. Welcome."]);
  });
});

describe("text as the builder's editors write it", () => {
  // paragraphs.builder-editor: a text block as the builder's editor writes one (each `<p>` with its margins of 0, its
  // direction, its alignment, an empty line's `<br>`, an indent), and one as its older editor wrote them (each `<p>`
  // with its line height and no margins: the builder's export resets them, `p { margin: 0 }`).
  const padding = (top: number, bottom: number, left = 10) => ({ top, right: 10, bottom, left });
  const line = (children: Node["children"], top: number, bottom: number, style: Record<string, unknown> = {}, left = 10): Node => ({ type: "Paragraph", style: { fontSize: 14, lineHeight: 1.4, ...style, padding: padding(top, bottom, left) } as never, children });

  it("reads each paragraph as a Paragraph, spaced as the builder spaces them: by their margins, none unless their own", () => {
    const back = fromDesign(fixture("paragraphs.builder-editor"));
    expect(back.report).toEqual([]);
    expect(tree(back.element).children).toEqual([
      line(["First line"], 10, 0),
      line([{ type: "Span", style: { fontWeight: 700 }, children: ["Second"] }, " line"], 0, 0, { textAlign: "center" }),
      line(["\u200b"], 0, 0),
      line(["Indented"], 0, 10, {}, 50),
      line(["One"], 10, 0),
      line(["\u00a0"], 0, 0),
      line(["Two"], 0, 10),
    ]);
  });
});

describe("malformed design JSON", () => {
  /** A seeded random number generator (mulberry32). */
  const random = (seed: number) => {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  const ODD: unknown[] = [null, undefined, 0, -1, 1e9, NaN, "", "x", "__proto__", "constructor", "toString", true, [], [null], {}, { __proto__: { x: 1 } }, { constructor: 1 }, JSON.parse('{"toString":null}'), JSON.parse('{"valueOf":1,"toString":"x"}'), "javascript:alert(1)", "<script>x</script>", "10px 20px 30px 40px 50px", { value: 5 }];

  /** The design with one value somewhere replaced by something odd. */
  function damaged(design: any, seed: number): any {
    const next = random(seed);
    const copy = JSON.parse(JSON.stringify(design));
    const paths: Array<[any, string]> = [];
    const walk = (value: any) => {
      if (!value || typeof value !== "object") return;
      for (const key of Object.keys(value)) {
        paths.push([value, key]);
        walk(value[key]);
      }
    };
    walk(copy);
    for (let i = 0; i < 3; i++) {
      const [holder, key] = paths[Math.floor(next() * paths.length)];
      const odd = ODD[Math.floor(next() * ODD.length)];
      if (next() < 0.2) holder["__proto__" + (i ? i : "")] = odd;
      else holder[key] = odd;
    }
    return copy;
  }

  it("is read without throwing, into a template that validates, what it can't read said", async () => {
    const designs = Object.values(TEMPLATES).map((template) => toDesign(template).design);
    for (let seed = 1; seed <= 300; seed++) {
      const design = damaged(designs[seed % designs.length], seed);
      const back = fromDesign(design);
      const { diagnostics } = validate(back.element);
      expect([seed, diagnostics.filter((d) => d.severity === "error")]).toEqual([seed, []]);
      expect(typeof back.code).toBe("string");
      if (seed % 50 === 0) await render(back.element);
    }
  });

  it("leaves out only a link Elements refuses (a file's, a script's): the rest of its block is kept, and the template renders", async () => {
    const block = (content: unknown) => ({ body: { values: {}, rows: [{ cells: [1], values: {}, columns: [{ values: {}, contents: [content] }] }] } });
    const ok = { name: "web", values: { href: "https://x.test" } };
    const designs = {
      image: block({ type: "image", values: { src: { url: "https://x.test/a.png", width: 100, height: 100 }, action: { name: "web", values: { href: "file:///x" } } } }),
      menu: block({ type: "menu", values: { menu: { items: [{ key: "1", text: "A", link: { name: "web", values: { href: "javascript:alert(1)" } } }, { key: "2", text: "B", link: ok }] } } }),
      social: block({ type: "social", values: { icons: { iconType: "circle", icons: [{ name: "Facebook", url: "data:text/html,x" }, { name: "X", url: "https://x.test" }] } } }),
    };
    const read = Object.fromEntries(Object.entries(designs).map(([name, design]) => [name, fromDesign(design)]));
    for (const { element } of Object.values(read)) {
      expect(validate(element).diagnostics.filter((d) => d.severity === "error")).toEqual([]);
      await render(element);
    }
    expect(tree(read.image.element).children).toEqual([{ type: "Column", style: { padding: { top: 10, right: 10, bottom: 10, left: 10 }, alignItems: "center" }, children: [{ type: "Image", props: { src: { src: "https://x.test/a.png", width: 100, height: 100 } } }] }]);
    expect(read.image.report).toEqual(['root.children[0].children[0]: its href "file:///x" isn\'t one Elements writes: what it holds without it']);
    expect(((tree(read.menu.element).children as Node[])[0].children![0] as Node).props!.items).toEqual([{ text: "A", href: "#" }, { text: "B", href: "https://x.test" }]);
    expect(read.menu.report).toEqual(['root.children[0].children[0]: its items[0]\'s link "javascript:alert(1)" isn\'t one Elements writes: it\'s "#"']);
    expect(((tree(read.social.element).children as Node[])[0].children![0] as Node).props!.icons).toEqual([{ name: "Facebook", href: "#" }, { name: "X", href: "https://x.test" }]);
  });

  it("passes a design's markup through toSafeHtml where one is given: an html block's, a text's, a text kept as markup", async () => {
    const block = (content: unknown) => ({ body: { values: {}, rows: [{ cells: [1], values: {}, columns: [{ values: {}, contents: [content] }] }] } });
    const script = "<script>alert(1)</script>";
    const strip = (html: string) => html.replace(/<script[\s\S]*?<\/script>/g, "");
    for (const content of [{ type: "html", values: { html: `${script}Hi` } }, { type: "text", values: { text: `${script}Hi` } }, { type: "text", values: { text: `<marquee>Hi</marquee>${script}` } }]) {
      const design = block(content);
      expect((await render(fromDesign(design).element)).html).toContain(script);
      const safe = (await render(fromDesign(design, { toSafeHtml: strip }).element)).html;
      expect(safe).not.toContain("<script");
      expect(safe).toContain("Hi");
    }
  });

  it("leaves out a value whose own toString or valueOf isn't a function (which can't be read as text), wherever it is, and says so", () => {
    const odd = () => JSON.parse('{"toString":null}');
    const design = toDesign(TEMPLATES.sample).design as any;
    const [first, second] = design.body.rows[0].columns[0].contents;
    first.values.containerPadding = odd();
    second.values.fontSize = odd();
    design.body.rows[0].values.padding = odd();
    design.body.rows[0].columns[0].values.padding = odd();
    design.body.values.contentWidth = odd();
    design.body.values.textColor = JSON.parse('{"valueOf":null,"toString":"x"}');
    let back: ReturnType<typeof fromDesign> | undefined;
    expect(() => (back = fromDesign(design))).not.toThrow();
    expect(validate(back!.element).diagnostics.filter((d) => d.severity === "error")).toEqual([]);
    expect(back!.report.filter((line) => line.includes("toString or valueOf"))).toEqual(
      ["body.rows[0].columns[0].contents[0].values.containerPadding", "body.rows[0].columns[0].contents[1].values.fontSize", "body.rows[0].columns[0].values.padding", "body.rows[0].values.padding", "body.values.contentWidth", "body.values.textColor"].map((path) => `${path}: a value whose own toString or valueOf isn't a function can't be read: left out`)
    );
  });

  it("reads markup nested deeper than any text's as an Html block, and says so, rather than running out of stack", async () => {
    const nested = (open: string, close: string, n: number) => open.repeat(n) + "x" + close.repeat(n);
    for (const [type, key, text] of [["text", "text", nested("<ul><li>a", "</li></ul>", 1000)], ["text", "text", nested("<b>", "</b>", 3000)], ["button", "text", nested("<b>", "</b>", 3000)]]) {
      const back = fromDesign({ body: { values: {}, rows: [{ cells: [1], values: {}, columns: [{ values: {}, contents: [{ type, values: { [key]: text } }] }] }] } });
      expect(back.report).toEqual(expect.arrayContaining([expect.stringContaining("markup nested more than 64 deep")]));
      await render(back.element);
    }
  });

  it("reads JSON that isn't a design as an empty template, and says so", () => {
    for (const design of [null, "x", 5, [], {}, { body: 5 }, { body: { rows: "x" } }, { body: { rows: [null, 5, { columns: "x" }, { columns: [null, { contents: [null, { type: "constructor", values: 5 }, { type: "__proto__" }] }] }] } }]) {
      const back = fromDesign(design);
      expect(validate(back.element).valid).toBe(true);
      expect(back.report.length).toBeGreaterThan(0);
    }
    expect(fromDesign({ body: { rows: [{ columns: [{ contents: [{ type: "timer", values: {} }] }] }] } }).report).toEqual(["rows[0].columns[0].contents[0]: a timer of the builder's has no component in Elements: left out"]);
  });

  it("writes no code from a design's data: the code it prints, run, is the template it gives", () => {
    const design = toDesign(TEMPLATES.sample).design as any;
    const [, text] = design.body.rows[0].columns[0].contents;
    text.values.text = '"}; globalThis.ran = 1; {"<a href="javascript:alert(1)">x</a> {`${globalThis.ran = 2}`}';
    design.body.values.title = '"/><script>globalThis.ran = 3</script>';
    design.body.rows[0].columns[0].contents[0].values._meta = { htmlID: 'a"} onload={() => (globalThis.ran = 4)} x={"' };
    const designs = [design, ...Object.values(TEMPLATES).map((template) => toDesign(template).design)];
    for (const each of designs) {
      const back = fromDesign(each, { name: "Template" });
      expect(tree(run(back.code))).toEqual(tree(back.element));
    }
    expect((globalThis as { ran?: number }).ran).toBeUndefined();
  });
});

describe("a design's size", () => {
  /** What the builder saves beside what toDesign() writes (from the designs it saved): its own defaults on every item. */
  const SAVES: Record<string, Record<string, unknown>> = {
    body: fixture("every-tool.saved-in-builder").body.values,
    row: { hideDesktop: false },
    content: { anchor: "", hideDesktop: false, displayCondition: null, _styleGuide: null, locked: false },
  };
  /** The design as the builder itself would save the same layout: no hidden properties, and the builder's own defaults. */
  function builderSaves(design: any): any {
    const copy = JSON.parse(JSON.stringify(design));
    const strip = (tool: string, values: Record<string, any>, saves: Record<string, unknown>) => {
      for (const { key, path } of HIDDEN[tool] ?? []) {
        if (path.startsWith("hidden.")) continue;
        delete values[key];
        delete values._override?.mobile?.[key];
      }
      for (const [key, value] of Object.entries(saves)) if (!(key in values) && !key.startsWith("_elements")) values[key] = value;
    };
    strip("body", copy.body.values, Object.fromEntries(Object.entries(SAVES.body).filter(([key]) => key.startsWith("popup"))));
    for (const rows of [copy.body.rows, copy.body.headers ?? [], copy.body.footers ?? []]) {
      for (const row of rows) {
        strip("row", row.values, SAVES.row);
        for (const column of row.columns) {
          strip("column", column.values, {});
          for (const content of column.contents) strip(content.type, content.values, SAVES.content);
        }
      }
    }
    return copy;
  }
  const size = (value: unknown) => JSON.stringify(value).length;

  it("is at most about 1.1 times what the builder saved for the same template", () => {
    for (const [name, template] of [["sample", sample], ["every-tool", everyTool], ["invoice", invoice]] as const) {
      const saved = JSON.parse(JSON.stringify(fixture(`${name}.saved-in-builder`), (key, value) => (key === "_elements" ? undefined : value)));
      expect([name, size(toDesign(template).design) <= 1.1 * size(saved)]).toEqual([name, true]);
    }
  });

  it("is at most about 1.1 times what the builder would save for the same layout, hidden properties and all", () => {
    for (const [name, template] of Object.entries(TEMPLATES)) {
      const design = toDesign(template).design;
      const ratio = size(design) / size(builderSaves(design));
      expect([name, ratio <= 1.1]).toEqual([name, true]);
    }
  });
});
