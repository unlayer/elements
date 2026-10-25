/**
 * designToElements, one setting or block at a time (see __fixtures__/designs.ts): the code it writes, what it says,
 * and that the code renders back to the design.
 */
import { describe, expect, it, vi } from "vitest";
import * as prettier from "prettier";
import { DESIGNS, design } from "./__fixtures__/designs";
import { designToElements } from "./design-to-elements";
import { inTime, within } from "../test-timing";
import { formatElements } from "./format";
import { BLOCK_DEFAULTS } from "./defaults";
import React from "react";
import { compareDesigns } from "./compare";
import { evaluate, roundTrip } from "./test-harness";
import * as Elements from "../index";
import { UNLAYER_CONFIG_KEY } from "../utils/create-component";
import guide from "../../docs/codegen.md?raw";
import { Font } from "../font/index";
import { BodyExporters } from "@unlayer/exporters";
import { editorLink } from "./links";
import type { Plain } from "./values";

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

  it("takes the root from the displayMode renderToJson writes, which stays out of its props", () => {
    const { Email, Page, Document, Row, Column, Paragraph } = Elements;
    for (const [Root, name, mode] of [[Page, "Page", "web"], [Document, "Document", "document"], [Email, "Email", "email"]] as const) {
      const design = Elements.renderToJson(<Root><Row><Column><Paragraph>Hi</Paragraph></Column></Row></Root>) as any;
      expect(design.body.values.displayMode).toBe(mode);
      const result = roundTrip(design);
      expect(result.code).toContain(`<${name}>`);
      expect(result.code).not.toContain("displayMode");
      expect((result.design as any).body.values.displayMode).toBe(mode);
      expect(result.differences).toEqual([]);
    }
    // A design without one (the editor's own saves) is compared without it.
    const { displayMode: _mode, ...values } = (Elements.renderToJson(<Page><Row><Column><Paragraph>Hi</Paragraph></Column></Row></Page>) as any).body.values;
    expect(compareDesigns({ body: { rows: [], values } }, { body: { rows: [], values: { ...values, displayMode: "email" } } })).toEqual([]);
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
      for (const [, from] of source.matchAll(/^(?:import|export)\s[^;=(]*?\sfrom "([^"]+)"/gm)) expect(from, file).toMatch(/^(\.\/|\.\.\/utils\/(container-defaults|image-sizing)$|\.\.\/utils\/font-design$|@unlayer\/exporters$|@unlayer-internal\/shared-elements$)/);
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

  it("writes code in time linear in the design's size: a large table, many menu items, values nested deep", async () => {
    // The printer took the trailing spaces off all the code written so far at each line break, so the time grew with
    // the code's size squared, and with the indentation of values nested deep faster: an editor's 100×100 table took
    // 34 s, 1,000 menu items 13 s, a value 400 deep 47 s (and was 338 KB of code).
    const cells = (n: number, text: string) => Array.from({ length: n }, (_, i) => ({ text: `${text}${i}` }));
    const deep = (depth: number) => Array.from({ length: depth }).reduce<Plain>((value) => ({ a: value }), { x: 1 });
    const nested = (depth: number) => design([{ type: "text", values: { text: "<p>x</p>", custom: deep(depth) } }]);
    const shapes: [string, Plain][] = [
      ["table 60×60", design([{ type: "table", values: { table: { headers: [{ cells: cells(60, "h") }], rows: Array.from({ length: 60 }, () => ({ cells: cells(60, "c") })) } } }])],
      ["menu of 1,000 items", design([{ type: "menu", values: { menu: { items: Array.from({ length: 1000 }, (_, i) => ({ key: `k${i}`, text: `t${i}`, link: { name: "web", values: { href: `https://e.test/${i}` } } })) } } }])],
      ["values 200 deep", nested(200)],
      // A px length checked digit by digit every way it could split them: 50,000 digits took a second.
      ["a padding of 100,000 digits", design([{ type: "text", values: { text: "<p>x</p>", containerPadding: `${"1".repeat(102400)}x` } }])],
      // A `mailto:` link's empty fields looked for from inside each run of letters: 100,000 took seconds.
      ["a mailto: link of 100,000 letters", design([{ type: "button", values: { text: "Write", href: { name: "web", values: { href: `mailto:${"a".repeat(102400)}` } } } }])],
    ];
    for (const [shape, source] of shapes) expect([shape, inTime(await within(1000, () => quiet(() => designToElements(source))))]).toEqual([shape, true]);
    // Deeper than 16, a value is written as its JSON, which gives it back the same: as prettier writes it.
    const result = quiet(() => roundTrip(nested(200)));
    expect(result.differences).toEqual([]);
    expect(result.code).toContain(`JSON.parse(\n`);
    expect(result.code.length).toBeLessThan(5000);
    expect(await prettier.format(result.code, { parser: "typescript" })).toBe(result.code);
    // Up to it, written out.
    expect(quiet(() => designToElements(nested(14))).code).not.toContain("JSON.parse");
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

  it("writes a menu item without a link without one: its design's link has no URL", () => {
    const template = (
      <Elements.Email>
        <Elements.Row>
          <Elements.Column>
            <Elements.Menu items={[{ text: "Terms", href: "https://example.com/terms" }, { text: "No link" }]} />
          </Elements.Column>
        </Elements.Row>
      </Elements.Email>
    );
    const { code, design, back, html } = backAgain(template);
    expect(inline(code)).toContain(inline(`{ text: "No link" }`));
    const items = (d: Plain) => (d as any).body.rows[0].columns[0].contents[0].values.menu.items;
    expect(items(design)[1].link).toEqual({ name: "web", values: { target: "_blank" } });
    expect(items(back)).toEqual(items(design));
    expect(html).toBe(Elements.renderToHtml(template));
  });
});

describe("links: the URL the editor exports for each", () => {
  const EMAIL = "mailto:{{email}}?subject={{subject}}&body={{body}}";
  const WEB = { href: "{{href}}", target: "{{target}}" };
  /** Links as the editor saves them: an action, its values and the templates they fill in. */
  const SAVED: Record<string, Plain> = {
    "an email": { name: "email", values: { href: "", target: "_blank", email: "support@example.com", subject: "Help & questions?", body: "Hi,\nI have a question" }, attrs: { href: EMAIL } },
    "an email without a subject": { name: "email", values: { email: "hi@example.com", subject: "", body: "Hello" }, attrs: { href: EMAIL } },
    "an email without a subject or body": { name: "email", values: { email: "hi@example.com", subject: "", body: "" }, attrs: { href: EMAIL } },
    // (Where the address is shorter than its placeholder, the editor doesn't encode the subject.)
    "an email without an address": { name: "email", values: { email: "", subject: "Hi there", body: "" }, attrs: { href: EMAIL } },
    "an email with a merge tag and markup in its subject": { name: "email", values: { email: "hi@example.com", subject: "Hi {{first_name}} <3", body: "" }, attrs: { href: EMAIL } },
    "a phone call": { name: "phone", values: { href: "", target: "_blank", phone: "+14154154151" }, attrs: { href: "tel:{{phone}}" } },
    "a text message": { name: "sms", values: { phone: "+14154154150" }, attrs: { href: "sms:{{phone}}" } },
    "a web page": { name: "web", values: { href: "https://example.com/a b?q=1&r=2", target: "_self" }, attrs: WEB },
    "a web page from a list of options": { name: "web", values: { href: { label: "Home", value: "https://example.com" }, target: "_blank" }, attrs: WEB },
    "the empty web link": { name: "web", values: { href: "", target: "_blank" }, attrs: WEB },
    "a page section": { name: "anchor", values: { href: "pricing" }, attrs: { href: "#{{href}}", target: "_self" } },
    "a web page with a query its link type adds": { name: "web", values: { href: "https://example.com/", target: "_blank", source: "news letter" }, attrs: { ...WEB, "+href": "?utm_source={{source}}" } },
  };
  /** A link with attributes beside its URL and target, which the components' links don't take. */
  const ATTRIBUTES = { name: "web", values: { href: "https://example.com/", target: "_blank", title: "Our site" }, attrs: { ...WEB, rel: "nofollow", title: "{{title}}", "x-track": "cta" } };
  /** The pinned exporters' URL for a link and its target: their popup's close button is a link they fill in. */
  const exported = (link: unknown) => {
    const tag = /<a [^>]*>/.exec(BodyExporters.popup!("", { popupCloseButton_action: link, _meta: { htmlID: "u_body" } } as never, undefined as never))![0];
    const attr = (name: string) => (new RegExp(` ${name}="([^"]*)"`).exec(tag)?.[1] ?? "").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    return { url: attr("href"), target: attr("target") };
  };

  it.each(Object.entries(SAVED))("%s: as the pinned exporters fill it in", (_, link) => {
    expect(editorLink(link)).toMatchObject(exported(link));
  });

  it("reads a link without its templates (a design the editor didn't save) as its link editor does: with its action's", () => {
    expect(editorLink({ name: "email", values: { email: "support@example.com", subject: "Help" } })).toEqual({ url: "mailto:support@example.com?subject=Help", target: "_blank", kept: true });
    expect(editorLink({ name: "phone", values: { phone: "+15550100" } })).toEqual({ url: "tel:+15550100", target: "_blank", kept: true });
    expect(editorLink({ name: "web", values: { href: "https://example.com" } })).toEqual({ url: "https://example.com", target: "_blank", kept: true });
    expect(editorLink("https://example.com")).toEqual({ url: "https://example.com", target: "_blank", kept: true });
  });

  it("says what a URL can't hold, and which actions the builder doesn't read back from their URL", () => {
    expect(editorLink({ name: "close_popup", attrs: { onClick: "closePopup()" }, values: {} })).toEqual({ lost: ["onClick"] });
    expect(editorLink({ name: "web", values: { href: "https://example.com", target: "_blank", class: "cta" }, attrs: { ...WEB, "data-id": "{{id}}" } })).toEqual({ lost: ["class", "data-id"] });
    expect(editorLink(SAVED["a page section"])).toMatchObject({ kept: false });
    // An email link of the embedder's, which the builder reads back as its own (with a subject and body).
    expect(editorLink({ name: "email", values: { email: "a@b.com", cc: "c@d.com" }, attrs: { href: "mailto:{{email}}?cc={{cc}}" } })).toEqual({ url: "mailto:a@b.com?cc=c%40d.com", target: "_blank", kept: false });
    // A web link is one whatever its templates.
    expect(editorLink(SAVED["a web page with a query its link type adds"])).toMatchObject({ kept: true });
    // Any other attribute: the components' links are a URL and where it opens.
    expect(editorLink(ATTRIBUTES)).toEqual({ lost: ["rel", "title", "x-track"] });
    // One the exporters fill in empty isn't there.
    expect(editorLink({ name: "web", values: { href: "https://example.com", target: "_blank", title: "" }, attrs: { ...WEB, title: "{{title}}" } })).toMatchObject({ url: "https://example.com", kept: true });
  });

  it("writes a link with attributes the components don't take as the design has it, and compares it with them", () => {
    const link = ATTRIBUTES;
    const source = design([
      { type: "button", values: { text: "Go", href: link } },
      { type: "image", values: { src: { url: "https://example.com/a.png" }, action: link } },
      { type: "menu", values: { menu: { items: [{ key: "1606923979749", text: "Home", link }] } } },
    ]);
    const { code, warnings, differences } = roundTrip(source);
    expect(code.match(/rel: "nofollow"/g)).toHaveLength(3);
    // Each block's link, which a URL can't hold (and the Image's action, as Elements writes a web link, without its templates).
    expect(warnings.filter((warning) => warning.includes("link has `rel` and `title` and `x-track`, which a URL can't hold"))).toHaveLength(3);
    expect(differences).toEqual([]);
    // The URL alone (what the code was before) is another link: what it lacks shows.
    const button = (href: unknown) => design([{ type: "button", values: { text: "Go", href } }]);
    const where = "body.rows[0].columns[0].contents[0].values.href";
    expect(compareDesigns(button(link), button({ name: "web", values: { href: "https://example.com/", target: "_blank" } })).map((d) => d.path)).toEqual([`${where}.values.title`, `${where}.attrs`]);
  });

  it("keeps a menu item's web link without a URL as the design has it, with no URL", () => {
    const bare = { name: "web", values: { target: "_self" } };
    // Written with the `items` shorthand, and as the design has them (the editor's item keys).
    const source = design([
      { type: "menu", values: { menu: { items: [{ key: "1", text: "Home", link: bare }] } } },
      { type: "menu", values: { menu: { items: [{ key: "1606923979749", text: "Home", link: bare }] } } },
    ]);
    const { code, warnings, design: back } = roundTrip(source);
    expect(inline(code)).toContain(inline(`items={[{ text: "Home", target: "_self" }]}`));
    expect(code).not.toContain("href");
    expect(warnings).toEqual([]);
    const links = (d: Plain) => (d as any).body.rows[0].columns[0].contents.map((block: any) => JSON.stringify(block.values.menu.items[0].link));
    expect(links(back)).toEqual(links(source));
  });

  it("writes them in the code, whose HTML links where the editor's does", () => {
    const keep = ["an email", "an email without a subject", "a phone call", "a text message", "a web page"];
    const source = design([
      ...keep.map((name) => ({ type: "button", values: { text: name, href: SAVED[name] } })),
      { type: "image", values: { src: { url: "https://example.com/a.png" }, action: SAVED["an email without a subject or body"] } },
      { type: "menu", values: { menu: { items: [{ key: "1606923979749", text: "Call", link: SAVED["a phone call"] }, { key: "1606923979750", text: "Write", link: SAVED["an email"] }] } } },
    ]);
    const { code, warnings, differences } = roundTrip(source);
    expect(code).not.toMatch(/\{\{(href|target|email|subject|body|phone)\}\}/);
    expect(warnings).toEqual([]);
    expect(differences).toEqual([]);
    const html = Elements.renderToHtml(React.createElement(evaluate(code)));
    const hrefs = [...html.matchAll(/<a [^>]*?href="([^"]*)"/g)].map(([, href]) => href.replace(/&amp;/g, "&"));
    for (const name of [...keep, "an email without a subject or body"]) expect(hrefs, name).toContain(exported(SAVED[name]).url);
    expect(hrefs.filter((href) => href === exported(SAVED["a phone call"]).url)).toHaveLength(2);
    expect(hrefs.filter((href) => href === exported(SAVED["an email"]).url)).toHaveLength(2);
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
