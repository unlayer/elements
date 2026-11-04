import React from "react";
import { describe, it, expect, vi } from "vitest";
import { Email, Page, Document, Row, Column, Paragraph, Heading, Button, Html, Image, registerTool, renderToHtml, renderToJson } from "../index";
import { lowerTemplate } from "../compat/template";
import { collectDeviceStyles } from "./device-overrides";
import { withRenderScope } from "./render-scope";
import fixtures from "./fixtures/device-parity.json";

const h = React.createElement;
const normalize = (css: string) => css.replace(/\s*([{}:;,])\s*/g, "$1").replace(/\s+/g, " ").trim();
const stylesheet = (html: string) => [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("\n");
const parsed = (html: string) => new DOMParser().parseFromString(html, "text/html");
/** Each rule in a stylesheet's @media blocks, with its query. */
function deviceRules(css: string): string[] {
  return [...normalize(css).matchAll(/(@media[^{}]+)\{((?:[^{}]+\{[^{}]*\})+)\}/g)].flatMap(([, query, rules]) => [...rules.matchAll(/[^{}]+\{[^{}]*\}/g)].map(([rule]) => `${query.trim()} ${rule.trim()}`));
}
/** The elements with the class of a rule at `query` whose declarations match. */
function withRule(html: string, query: string, declarations: RegExp): HTMLElement[] {
  const names = deviceRules(stylesheet(html)).filter((rule) => rule.startsWith(query) && declarations.test(rule)).map((rule) => /\.([\w-]+)\{/.exec(rule)![1]);
  return names.flatMap((name) => [...parsed(html).querySelectorAll<HTMLElement>(`.${name}`)]);
}
const PHONE = "@media (max-width:480px)";

/** HTML no run holds: a text or heading block keeps it as it is, in the box the editor's CSS selects. */
const AS_IT_IS = "<ul><li>Item</li></ul>";
const items: Record<string, any> = { text: Paragraph, heading: Heading, button: Button, image: Image };
function fromDesign(design: any, mode: string) {
  const Root: React.ElementType = mode === "email" ? Email : mode === "web" ? Page : Document;
  return h(Root, { values: design.body.values },
    ...design.body.rows.map((r: any) => h(Row, { values: r.values, cells: r.cells },
      ...r.columns.map((c: any) => h(Column, { values: c.values },
        ...c.contents.map((item: any) => h(items[item.type], { values: ["text", "heading"].includes(item.type) ? { ...item.values, text: AS_IT_IS } : item.values })))))));
}

describe("device settings", () => {
  // The fixture is CSS the editor exported. What a block written as it is selects (its box's id and class, `hide-*`) is
  // held to it; a block the new engine draws has a class of its own for each rule, with the editor's values (here for
  // an image, and every tool's in compat/blocks.test.tsx).
  const editorsText = (rule: string) => / (#u_content_(text|heading)_|\.hide-)/.test(rule);
  it.each(fixtures.filter(({ name }) => name !== "image"))("a text block written as it is matches exported editor CSS: $name / $mode", ({ design, mode, css }) => {
    const rendered = deviceRules(stylesheet(renderToHtml(fromDesign(design, mode)))).map((rule) => rule.replace(/u_content_paragraph_/g, "u_content_text_"));
    // (Each block's CSS brings the visibility rules along: the first of each.)
    expect([...new Set(rendered.filter(editorsText))]).toEqual(deviceRules(css).filter(editorsText));
  });

  it.each(fixtures.filter(({ name, mode }) => name === "padding" && mode !== "document"))("a row's and a column's phone padding is the editor's: $mode", ({ design, mode, css }) => {
    const declarations = (rules: string[]) => rules.map((rule) => rule.slice(rule.indexOf("{"))).sort();
    const own = deviceRules(stylesheet(renderToHtml(fromDesign(design, mode)))).filter((rule) => /\.u-frame-\d+\{/.test(rule));
    // (An email's row selects only its vertical padding: its horizontal rule selects nothing there.)
    const editors = deviceRules(css).filter((rule) => (mode === "email" ? /#u_column_1 |--vertical/ : /#u_column_1 |#u_row_1/).test(rule));
    expect(own).toHaveLength(2);
    expect(declarations(own)).toEqual(declarations(editors));
  });

  it.each(fixtures.filter(({ name }) => name === "image"))("an image's phone size is the editor's, in rules for that <img>: $mode", ({ design, mode, css }) => {
    const html = renderToHtml(fromDesign(design, mode));
    const size = (rules: string[]) => ["width", "max-width"].map((property) => new RegExp(`[{;]${property}:([^ !;]+)`).exec(rules.join(""))?.[1]);
    const images = [...parsed(html).querySelectorAll("img")];
    expect(images).toHaveLength(2);
    images.forEach((image, i) => {
      const own = deviceRules(stylesheet(html)).filter((rule) => [...image.classList].some((name) => rule.includes(`.${name}{`)));
      expect(size(own)).toEqual(size(deviceRules(css).filter((rule) => rule.includes(`#u_content_image_${i + 1} .v-src-`))));
    });
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

  it("puts each row's, column's and block's phone rule on that element alone, at 480px or below, the same in each render", () => {
    const tree = <Email><Row mobile={{ padding: 4 }}><Column mobile={{ padding: 8 }}><Paragraph mobile={{ fontSize: 18 }}>One</Paragraph><Paragraph mobile={{ fontSize: 20 }}>Two</Paragraph></Column></Row><Row mobile={{ padding: 6 }}><Column mobile={{ padding: 12 }}><Paragraph mobile={{ fontSize: 22 }}>Three</Paragraph></Column></Row></Email>;
    const html = renderToHtml(tree);
    expect(renderToHtml(tree)).toBe(html);
    const holds = (declarations: RegExp) => {
      const elements = withRule(html, PHONE, declarations);
      expect(elements).toHaveLength(1);
      return elements[0].textContent;
    };
    expect(holds(/font-size:18px/)).toBe("One");
    expect(holds(/font-size:20px/)).toBe("Two");
    expect(holds(/font-size:22px/)).toBe("Three");
    expect(holds(/padding:8px/)).toBe("OneTwo");
    expect(holds(/padding-top:4px/)).toBe("OneTwo");
    expect(holds(/padding:12px/)).toBe("Three");
    expect(holds(/padding-top:6px/)).toBe("Three");
  });

  it("ignores unsupported widgets and retains zero line height", () => {
    const styles: Record<string, string[]> = {};
    collectDeviceStyles({ _meta: { htmlID: "sample" }, _override: { mobile: { fontSize: "20px", lineHeight: 0, color: "red" } } }, "contents", "Paragraph", "email", styles);
    expect(styles.mobile).toEqual(["#sample .v-font-size { font-size: 20px !important; }", "#sample .v-line-height { line-height: 0 !important; }"]);
  });

  it("renders a column's phone border as the editor does, and keeps it in the design", () => {
    const border = { borderLeftWidth: 14, borderLeftStyle: "solid", borderLeftColor: "#ffffff", borderRightWidth: "14px", borderRightColor: "#ffffff" };
    const tree = <Email><Row><Column mobile={{ border }}><Paragraph>Card</Paragraph></Column></Row></Email>;
    const column = renderToJson(tree).body.rows[0].columns[0].values;
    expect(column._override.mobile.border).toMatchObject({ borderLeftWidth: "14px", borderRightWidth: "14px", borderLeftColor: "#ffffff" });
    const html = renderToHtml(tree);
    const declared = "border-top:0px solid transparent !important;border-left:14px solid #ffffff !important;border-right:14px solid #ffffff !important;border-bottom:0px solid transparent !important;";
    expect(deviceRules(stylesheet(html)).filter((rule) => rule.includes(declared))).toHaveLength(1);
    expect(withRule(html, PHONE, /border-left:14px/).map((element) => element.textContent)).toEqual(["Card"]);
  });

  it("hides a block the new engine draws on its device, in the element that holds it", () => {
    const blocks = <Row><Column><Paragraph hideOnMobile>Desktop</Paragraph><Paragraph hideOnDesktop>Phone</Paragraph><Paragraph>Both</Paragraph></Column></Row>;
    const page = renderToHtml(<Page>{blocks}</Page>);
    expect(withRule(page, PHONE, /display:none/).map((element) => element.textContent)).toEqual(["Desktop"]);
    expect(withRule(page, "@media (min-width:481px)", /display:none/).map((element) => element.textContent)).toEqual(["Phone"]);

    const email = renderToHtml(<Email>{blocks}</Email>);
    expect(withRule(email, PHONE, /display:none/).map((element) => element.textContent)).toEqual(["Desktop"]);
    // On desktop, and for Outlook, which reads no media query: not there until a phone's rule shows it.
    const [phone] = withRule(email, PHONE, /display:table-row/);
    expect(phone.textContent).toBe("Phone");
    expect(phone.style.display).toBe("none");
    expect(email).toMatch(/<!--\[if !mso\]><!--><tr [^>]*style="display:none">(?:(?!<!--<!\[endif\]-->)[\s\S])*>Phone</);
  });

  it("passes the visibility of a block written as it is through to its canonical wrapper, whose classes the head has", () => {
    const html = renderToHtml(<Email><Row><Column><Paragraph html={AS_IT_IS} hideOnMobile /><Paragraph html={AS_IT_IS} hideOnDesktop /></Column></Row></Email>);
    const doc = parsed(html);
    expect(doc.querySelector("#u_content_paragraph_1")?.classList.contains("hide-mobile")).toBe(true);
    expect(doc.querySelector("#u_content_paragraph_2")?.classList.contains("hide-default__display-table")).toBe(true);
    expect(doc.querySelector("#u_content_paragraph_2")?.getAttribute("style")).toContain("display: none");
    expect(deviceRules(stylesheet(html))).toContain(`${PHONE} .hide-mobile{max-height:0px;overflow:hidden;display:none !important;}`);
    expect(deviceRules(stylesheet(html))).toContain("@media (min-width:0px) .hide-default__display-table{display:table !important;mso-hide:unset !important;}");
  });
});

describe("phone values that could break the head's CSS", () => {
  // (A design's own values: the `mobile` prop doesn't take such a value.)
  const phone = (fontSize: string) => ({ _override: { mobile: { fontSize } } }) as any;
  const open = "calc(12px + 4px";

  it("drops one that leaves a bracket open, which would swallow the phone rules after it, and says so", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const html = renderToHtml(
        <Email>
          <Row><Column><Paragraph values={phone(open)}>Open bracket</Paragraph></Column></Row>
          <Row><Column><Paragraph values={phone("30px")}>Later rule</Paragraph></Column></Row>
        </Email>
      );
      expect(html).not.toContain(open);
      expect(withRule(html, PHONE, /font-size:30px/).map((element) => element.textContent)).toEqual(["Later rule"]);
      expect(warn.mock.calls.map(([message]) => String(message)).join()).toContain("can't be read");
    } finally {
      warn.mockRestore();
    }
  });

  it("drops one from a block written as it is, whose rules go into the head as they are", () => {
    const html = renderToHtml(
      <Email>
        <Row><Column><Paragraph html={AS_IT_IS} values={phone(open)} /></Column></Row>
        <Row><Column><Paragraph html={AS_IT_IS} values={phone("30px")} /></Column></Row>
      </Email>
    );
    expect(html).not.toContain(open);
    expect(deviceRules(stylesheet(html))).toContain(`${PHONE} #u_content_paragraph_2 .v-font-size{font-size:30px !important;}`);
  });

  it("says so of one it drops from a block written as it is", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      renderToHtml(<Email><Row><Column><Paragraph html={AS_IT_IS} values={phone("calc(13px + 5px")} /></Column></Row></Email>);
      expect(warn).toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  const padding = (value: string, key = "padding", device = "mobile") => ({ _override: { [device]: { [key]: value } } }) as any;
  const Tool = registerTool({ name: "device_probe", renderer: { exporters: { web: () => "<b>Tool</b>", email: () => "<b>Tool</b>" } } } as any) as any;
  it.each<[string, (value: string) => React.ReactElement]>([
    ["a text's padding written as it is", (value) => <Paragraph html={AS_IT_IS} values={padding(value, "containerPadding")} />],
    ["a text's padding for desktop written as it is", (value) => <Paragraph html={AS_IT_IS} values={padding(value, "containerPadding", "desktop")} />],
    ["a heading's line height written as it is", (value) => <Heading values={{ text: AS_IT_IS, ...padding(value, "lineHeight") } as any} />],
    ["a row's padding", (value) => <Row values={padding(value)}><Column><Paragraph>x</Paragraph></Column></Row>],
    ["a column's padding", (value) => <Row><Column values={padding(value)}><Paragraph>x</Paragraph></Column></Row>],
    ["an Html block's padding", (value) => <Html html="<b>x</b>" values={padding(value, "containerPadding")} />],
    ["a custom tool's padding", (value) => <Tool values={padding(value, "containerPadding")} />],
  ])("says so of %s it drops, and doesn't write it", (what, block) => {
    // (Its own value: a message is said once per process.)
    const value = `calc(1px + ${what.replace(/\W/g, "")}`;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const element = block(value);
      const inner = (element.type as any).displayName === "Row" ? element : <Row><Column>{element}</Column></Row>;
      const html = renderToHtml(<Email>{inner}</Email>);
      expect(html).not.toContain(value);
      expect(warn.mock.calls.map(([message]) => String(message)).join()).toContain(value);
    } finally {
      warn.mockRestore();
    }
  });

  it("says so of a value for phones a block written as it is doesn't read, as of a drawn block", () => {
    const { diagnostics } = withRenderScope(() => lowerTemplate(<Email><Row><Column><Paragraph html={AS_IT_IS} values={padding("#ff0000", "color")} /></Column></Row></Email>, undefined, "renderToHtml"));
    expect(diagnostics.map((d) => d.message)).toContain("A text's color on phones isn't read: it's drawn without it.");
  });

  it("writes a row's phone padding in em as it is", () => {
    const html = renderToHtml(<Email><Row mobile={{ padding: "2em 0" }}><Column><Paragraph>Padded</Paragraph></Column></Row></Email>);
    expect(html).not.toContain("undefined");
    expect(withRule(html, PHONE, /\{padding-top:2em !important;padding-bottom:2em !important;\}/).map((element) => element.textContent)).toEqual(["Padded"]);
  });
});
