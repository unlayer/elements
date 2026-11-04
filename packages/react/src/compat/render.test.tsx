import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Button, Column, Divider, Document, Email, Heading, Html, Image, Menu, Page, PageBreak, Paragraph, Row, Social, Table, Video, registerTool, renderToHtml, renderToHtmlParts, renderToJson, renderToPlainText } from "../index";
import { legacyRenderToHtml, legacyRenderToHtmlParts, legacyRenderToPlainText } from "../utils/render-to-html";
import { withRenderScope } from "../utils/render-scope";
import * as exporters from "@unlayer/exporters";
import * as compat from "./render";
import { renderThroughNewEngine, type Rendered } from "./render";
import { storyElement, storyTemplate } from "./story";

const modules = import.meta.glob(["../components/*.stories.tsx", "../examples/*.stories.tsx", "../SpotifyWelcome.stories.tsx", "../context/*.stories.tsx"], { eager: true }) as Record<string, any>;

/** Every story's template (as the comparison stories render them), by name. */
function templates(): Array<[string, React.ReactElement]> {
  const out: Array<[string, React.ReactElement]> = [];
  for (const [file, module] of Object.entries(modules)) {
    for (const name of Object.keys(module)) {
      if (name === "default" || !module[name] || typeof module[name] !== "object") continue;
      let element: React.ReactElement;
      try {
        element = storyElement(module, name);
      } catch {
        continue; // a story whose render uses React state (CompletePixelParityTest)
      }
      for (const root of [undefined, "email", "web"] as const) {
        let template: React.ReactElement | undefined;
        try {
          template = storyTemplate(element, root);
        } catch {
          continue;
        }
        // A story that renders its template inside a component of its own (PhoneOverrides' parts) isn't one.
        if (template && file.includes("PhoneOverrides")) break;
        if (template) out.push([`${file.replace("../", "")} ${name}${root ? ` (${root})` : ""}`, template]);
        if (root === undefined && template) break;
      }
    }
  }
  return out;
}

describe("renderToHtml(), renderToHtmlParts() and renderToPlainText() through the new engine", () => {
  const all = templates();
  const quiet = () => [vi.spyOn(console, "warn").mockImplementation(() => {}), vi.spyOn(console, "error").mockImplementation(() => {})];

  it("render every story's template through the new engine", () => {
    const [warn, error] = quiet();
    try {
      for (const [name, template] of all) {
        const rendered = withRenderScope(() => renderThroughNewEngine(template, undefined, "renderToHtml"));
        expect(rendered?.html, name).toMatch(/^<!DOCTYPE html>/);
      }
      expect(all.length).toBeGreaterThan(150);
    } finally {
      warn.mockRestore();
      error.mockRestore();
    }
  });

  it("give each story's template the plain text legacy gives it", () => {
    const [warn, error] = quiet();
    try {
      const different = all.filter(([, template]) => renderToPlainText(template) !== legacyRenderToPlainText(template)).map(([name]) => name);
      expect(different).toEqual([]);
    } finally {
      warn.mockRestore();
      error.mockRestore();
    }
  });

  it("call a function of the user's own named after a root, around one of today's", () => {
    const Named = Object.assign((props: Record<string, unknown>) => <Email {...props} />, { displayName: "Email" });
    expect(renderToHtml(<Named lang="ar"><Row><Column><Paragraph>Hi</Paragraph></Column></Row></Named>)).toBe(renderToHtml(<Email lang="ar"><Row><Column><Paragraph>Hi</Paragraph></Column></Row></Email>));
  });

  it("read a root of another build of the package, as a project's CommonJS one and a tool's ES module one are: its mark says so", () => {
    const Twin = Object.assign((props: Record<string, unknown>) => <Email {...props} />, { displayName: "Email", [Symbol.for("@unlayer/react-elements/root")]: true });
    // Read as a root, by its props: it isn't called.
    const called = vi.fn();
    const template = <Twin lang="ar" onCalled={called}><Row><Column><Paragraph>Hi</Paragraph></Column></Row></Twin>;
    expect(renderToHtml(template)).toContain('lang="ar"');
    expect(called).not.toHaveBeenCalled();
  });

  it("say so of a root of another copy of today's components, which they can't read", () => {
    const Foreign = Object.assign((props: { children?: React.ReactNode }) => <div>{props.children}</div>, { displayName: "Email" });
    const template = <Foreign><Row><Column><Paragraph>Hi</Paragraph></Column></Row></Foreign>;
    for (const render of [renderToHtml, renderToHtmlParts, renderToPlainText]) expect(() => render(template)).toThrow(/another copy of @unlayer\/react-elements.*duplicate install/);
  });

  it("draw what the new engine refuses without it, and say so, rather than as today", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      // Too long a language, and the same id twice: the first keeps it.
      const template = <Email lang={"x".repeat(40)}><Row values={{ _meta: { htmlID: "same" } } as never}><Column><Paragraph>One</Paragraph></Column></Row><Row values={{ _meta: { htmlID: "same" } } as never}><Column><Paragraph>Two</Paragraph></Column></Row></Email>;
      const html = renderToHtml(template);
      expect(html).not.toBe(legacyRenderToHtml(template));
      expect(html).not.toContain("xxxx");
      expect(html).toContain("One");
      expect(html).toContain("Two");
      expect(html.match(/id="same"/g)).toHaveLength(1);
      const rendered = withRenderScope(() => renderThroughNewEngine(template, undefined, "renderToHtml"));
      expect(rendered?.diagnostics.filter((d) => d.code === "compat/refused").map((d) => d.path).sort()).toEqual(["root.children[1].id", "root.props.lang"]);
      expect(renderToHtmlParts(template).body).toContain("Two");
    } finally {
      warn.mockRestore();
    }
  });

  it("say once what a frame draws otherwise than asked, and only that", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      // Unique to this test: a kind of warning is said once per process.
      const template = <Page values={{ fontSize: "120%" } as never}><Row values={{ somethingNew: 1 } as never}><Column><Paragraph>A</Paragraph></Column></Row></Page>;
      renderToHtml(template);
      renderToHtml(template);
      const said = warn.mock.calls.map((call) => String(call[0]));
      expect(said).toHaveLength(1);
      expect(said[0]).toContain("The body's fontSize");
    } finally {
      warn.mockRestore();
    }
  });

  it("give every printed document what makes backgrounds print, whatever its blocks", () => {
    const html = renderToHtml(<Document backgroundColor="#eeeeee"><Row><Column><Paragraph>Words only</Paragraph></Column></Row></Document>);
    expect(html).toContain("print-color-adjust: exact");
    expect(html).toContain("-webkit-print-color-adjust: exact");
    // A page doesn't print that way, and an email's blocks have their own text color.
    expect(renderToHtml(<Page><Row><Column><Paragraph>A</Paragraph></Column></Row></Page>)).not.toContain("print-color-adjust");
    expect(renderToHtml(<Email><Row><Column><Paragraph>A</Paragraph></Column></Row></Email>)).not.toContain("table, td {");
  });

  it("give a template's own text in an email the template's text color, as legacy's stylesheet does", () => {
    expect(renderToHtml(<Email textColor="#336699"><Row><Column>Loose<Paragraph>A</Paragraph></Column></Row></Email>)).toContain("table, td { color: #336699; }");
  });

  it("read a template's own markup and text as lines of their own in the plain text", () => {
    for (const Root of [Email, Page, Document]) {
      const text = renderToPlainText(<Root>{"Before"}<Row>Beside<Column>Inside<Paragraph>Block</Paragraph></Column></Row></Root>);
      expect(text.split(/\n+/)).toEqual(["Before", "Beside", "Inside", "Block"]);
    }
  });

  it("render without its rows a template whose Row doesn't fit its layout, and say so", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const template = <Email><Row layout={{ cells: [1, 1], expectedColumns: 2 } as never}><Column><Paragraph>One</Paragraph></Column></Row></Email>;
      const rendered = withRenderScope(() => renderThroughNewEngine(template, undefined, "renderToHtml"));
      expect(rendered?.html).not.toContain("One");
      expect(rendered?.diagnostics.map((d) => d.code)).toContain("compat/layout");
      expect(error.mock.calls.join()).toContain("Body: Failed to render children");
    } finally {
      error.mockRestore();
      warn.mockRestore();
    }
  });

  it("write no block with today's exporters where every block moves over", () => {
    const write = vi.spyOn(exporters.ColumnExporters, "email");
    const table = vi.spyOn(exporters.TableExporters, "email");
    const button = vi.spyOn(exporters.ButtonExporters, "email");
    const menu = vi.spyOn(exporters.MenuExporters, "email");
    try {
      renderToHtml(<Email><Row><Column><Paragraph>One</Paragraph><Button href="https://example.com">Two</Button></Column></Row></Email>);
      expect(write).not.toHaveBeenCalled();
      renderToHtml(<Email><Row><Column><Button href="https://example.com">One</Button><Table /><Menu items={[{ text: "Docs", href: "https://example.com/docs" }]} /></Column></Row></Email>);
      expect(menu).not.toHaveBeenCalled();
      expect(table).not.toHaveBeenCalled();
      expect(button).not.toHaveBeenCalled();
    } finally {
      write.mockRestore();
      table.mockRestore();
      button.mockRestore();
      menu.mockRestore();
    }
  });

  describe("where an email's phone settings apply", () => {
    /** What each query in the stylesheet holds. */
    const queries = (html: string) => {
      const sheet = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("");
      const out: Record<string, string> = {};
      // (Each query's rules have no query inside them: its closing brace is the second in a row.)
      for (const [, width, rules] of sheet.matchAll(/@media \(max-width: (\d+)px\)\{(.*?\})\}/g)) out[width] = (out[width] ?? "") + rules;
      return out;
    };

    it("are legacy's 480px for a block's phone values, while its row stacks at the email's width", () => {
      const { 480: phone, 620: stacking } = queries(
        renderToHtml(
          <Email contentWidth="600px">
            <Row cells={[1, 1]}>
              <Column><Paragraph mobile={{ fontSize: "23px", containerPadding: "37px" }}>Words</Paragraph></Column>
              <Column><Button href="https://example.com" mobile={{ fontSize: "19px" }}>Go</Button><Divider mobile={{ containerPadding: "31px" }} /><Table values={{ _override: { mobile: { containerPadding: "29px" } } } as never} /></Column>
            </Row>
          </Email>
        )
      );
      expect(stacking).toContain(">div{width:100%!important;max-width:100%!important}");
      for (const rule of ["font-size:23px", "padding:37px", "font-size:19px", "padding:31px", "padding:29px"]) {
        expect(phone).toContain(rule);
        expect(stacking).not.toContain(rule);
      }
    });

    it("are 480px for what's hidden or shown on phones, whatever the tool", () => {
      const { 480: phone, 620: stacking } = queries(renderToHtml(<Email contentWidth="600px"><Row><Column><Paragraph hideOnMobile>A</Paragraph><Button href="https://example.com" hideOnDesktop>B</Button></Column></Row></Email>));
      expect(phone).toContain("display:none!important");
      expect(phone).toContain("display:table-row!important");
      expect(stacking ?? "").not.toContain("display:");
    });

    it("leave what belongs to a row's stacking at the email's width: an image's maximum, its columns' cells", () => {
      const line = { borderTopWidth: "2px", borderTopStyle: "solid", borderTopColor: "#ff0000" };
      const html = renderToHtml(
        <Email contentWidth="600px">
          <Row cells={[1, 1]}>
            <Column border={line as never}><Image src={{ url: "https://example.com/a.png", width: 600, height: 300 }} altText="A" values={{ _override: { mobile: { containerPadding: "37px" } } } as never} /></Column>
            <Column border={line as never}><Paragraph>B</Paragraph></Column>
          </Row>
        </Email>
      );
      const { 480: phone, 620: stacking } = queries(html);
      expect(stacking).toContain("max-width:300px!important");
      // Its columns are cells that stack there, each with its own line.
      expect(stacking).toContain("display:block!important");
      expect(html.match(/<td[^>]*style="[^"]*border-top:2px solid/g)).toHaveLength(2);
      expect(phone).toContain("padding:37px");
      expect(phone).not.toContain("max-width:300px");
      expect(phone).not.toContain("display:block");
    });

    it("are a page's own, and nothing changes on one", () => {
      const html = renderToHtml(<Page><Row><Column><Paragraph mobile={{ fontSize: "23px" }} hideOnMobile>A</Paragraph></Column></Row></Page>);
      expect(queries(html)[480]).toContain("font-size:23px");
    });
  });

  describe("of buttons, dividers and tables", () => {
    /** Every way each can't be read or held, in each output: nothing of the closed exporters' runs for them. */
    const everything = (
      <>
        <Button>No link</Button>
        <Button href="<%unsubscribe%>" width="300px" values={{ fontSize: "large", lineHeight: "tall", letterSpacing: "wide", padding: "5%", borderRadius: "50%", fontWeight: "heavy", textAlign: "middle" } as never}>Unread</Button>
        <Button href="https://example.com" mode="email" mobile={{ fontSize: "20px", textAlign: "left" }} values={{ _override: { desktop: { fontSize: "23px" }, tablet: { fontSize: "43px" } } } as never}><b>Devices</b></Button>
        <Button href="https://example.com" values={{ text: "<ul><li>Markup</li></ul>" } as never} />
        <Divider values={{ containerPadding: "1em", width: "auto", border: { borderTopWidth: "thin", borderTopStyle: "double" } } as never} />
        <Divider mode="web" mobile={{ containerPadding: "2px", width: "20%" }} />
        <Table values={{ table: { headers: [{ cells: [{ text: "<%name%>" }] }], rows: [{ cells: [{ text: "<ul><li>Markup</li></ul>", padding: "5%" }] }], footers: [] }, contentFontSize: "large", contentColor: "not a color" } as never} />
        <Paragraph html="<ul><li>Paragraph markup</li></ul>" mobile={{ fontSize: "20px" }} hideOnMobile />
        <Paragraph html="Paragraph values" textDirection="rtl" mode="web" values={{ fontSize: "big", lineHeight: "tall", containerPadding: "wide", _override: { mobile: { fontSize: "big" }, desktop: { fontSize: "23px" }, tablet: { fontSize: "43px" } } } as never} />
        <Paragraph html="Paragraph {% if a > 1 %}tag{% endif %} <%name%>" />
        <Heading values={{ text: "Heading level", headingType: "h7", textDirection: "sideways" } as never} />
        <Heading values={{ text: '<a href="https://example.com" data-x="1">Heading markup</a>' } as never} />
      </>
    );
    const closed = () => [exporters.ParagraphExporters, exporters.HeadingExporters, exporters.ButtonExporters, exporters.DividerExporters, exporters.TableExporters, exporters.BodyExporters, exporters.RowExporters, exporters.ColumnExporters].flatMap((tool) => (["email", "web", "document"] as const).map((mode) => vi.spyOn(tool, mode)));

    it.each([["Email", Email], ["Page", Page], ["Document", Document]])("write none of it with today's exporters in a %s", (_, Root) => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const spies = closed();
      try {
        const template = <Root><Row><Column>{everything}</Column></Row></Root>;
        const html = renderToHtml(template);
        for (const words of ["No link", "Unread", "Devices", "Markup", "name", "Paragraph markup", "Paragraph values", "<%name%>", "Heading level", "Heading markup"]) expect(html).toContain(words);
        renderToPlainText(template);
        for (const spy of spies) expect(spy).not.toHaveBeenCalled();
      } finally {
        warn.mockRestore();
        for (const spy of spies) spy.mockRestore();
      }
    });

    it("say what they can't read: in the render's diagnostics, and a warning", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      try {
        const rendered = withRenderScope(() => renderThroughNewEngine(<Email><Row><Column><Button href="https://example.com" fontSize="enormous">Go</Button><Button>None</Button></Column></Row></Email>, undefined, "renderToHtml")) as Rendered;
        expect(rendered.diagnostics.filter((d) => d.code === "compat/block").map((d) => d.severity)).toEqual(["warning", "info"]);
        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn.mock.calls[0][0]).toContain('font size "enormous"');
      } finally {
        warn.mockRestore();
      }
    });

    it("write a link to nothing as it is, as legacy's", () => {
      expect(renderToHtml(<Email><Row><Column><Button>Go</Button></Column></Row></Email>)).toMatch(/<a href="" target="_blank"[^>]*>/);
      expect(renderToHtml(<Page><Row><Column><Button>Go</Button></Column></Row></Page>)).toMatch(/<a [^>]*href="" target="_blank"/);
    });

    it("keep an email service's tags as they are, in a link and in words, for the service to fill in", () => {
      const tags = ["<%first_name%>", "{% if orders > 1 %}Thanks{% endif %}", '{{ name | default: "there" }}'];
      const template = (
        <Email>
          <Row>
            <Column>
              <Button href="<%unsubscribe%>">{tags[0]}</Button>
              <Table values={{ table: { headers: [], rows: [{ cells: tags.map((text) => ({ text })) }], footers: [] } } as never} />
            </Column>
          </Row>
        </Email>
      );
      const html = renderToHtml(template);
      expect(html).toContain('href="<%unsubscribe%>"');
      for (const tag of tags) expect(html).toContain(tag);
      const { body } = renderToHtmlParts(template);
      for (const tag of tags) expect(body).toContain(tag);
      // In the plain text as today's reads them.
      const words = <Email><Row><Column><Button href="https://example.com">{tags[1]}</Button></Column></Row></Email>;
      expect(renderToPlainText(words)).toBe(legacyRenderToPlainText(words));
      expect(renderToPlainText(words)).toContain(tags[1]);
    });

    it("keep a table's plain text as today's", () => {
      const template = (Root: typeof Email) => <Root><Row><Column><Paragraph>Before</Paragraph><Table headers={["N", "E"]} data={[["Ada", '<a href="https://example.com">mail</a>'], ["", "x &amp; y"]]} /><Paragraph>After</Paragraph></Column></Row></Root>;
      for (const Root of [Email, Page, Document] as Array<typeof Email>) expect(renderToPlainText(template(Root))).toBe(legacyRenderToPlainText(template(Root)));
    });

    it("keep a label's paragraphs and an empty button's plain text as today's", () => {
      const template = <Email><Row><Column><Button href="https://example.com" values={{ text: '<p style="margin:0">One</p><p style="margin:0">Two</p>' } as never} /><Button href="https://example.com">{""}</Button></Column></Row></Email>;
      expect(renderToPlainText(template)).toBe(legacyRenderToPlainText(template));
    });
  });

  describe("of custom tools, Html blocks and a user's own markup", () => {
    const Tool = registerTool({
      name: "open_tool",
      renderer: {
        exporters: { web: () => "<i>Tool</i>", email: () => "<i>Tool</i>" },
        head: { css: (values) => `#${values._meta.htmlID} i { color: red; }`, js: () => "var tool = 1;", tags: () => ['<meta name="tool">'] },
      },
    });
    const Mine = () => <section>Mine</section>;
    const template = (Root: typeof Email) => (
      <Root textColor="#333333" backgroundColor="#eeeeee">
        <Row>
          <Column>
            <Paragraph>Words</Paragraph>
            <Html html="<b>Html</b>" hideOnMobile mobile={{ containerPadding: "2px" } as never} />
            <Tool />
            <Mine />
          </Column>
        </Row>
      </Root>
    );
    /** A spy on every function the closed package exports, in its objects (its exporters and its heads). */
    const spyOnClosed = () => {
      const seen = new Set<object>();
      const spies: Array<ReturnType<typeof vi.spyOn>> = [];
      const visit = (object: unknown) => {
        if (!object || typeof object !== "object" || seen.has(object)) return;
        seen.add(object);
        for (const [key, value] of Object.entries(object)) {
          if (typeof value === "function") spies.push(vi.spyOn(object as Record<string, any>, key).mockName(key));
          else visit(value);
        }
      };
      Object.values(exporters).forEach(visit);
      return spies;
    };
    const ROOTS = [["Email", Email], ["Page", Page], ["Document", Document]] as Array<[string, typeof Email]>;

    it.each(ROOTS)("run nothing of the closed package (%s)", (_, Root) => {
      const spies = spyOnClosed();
      try {
        expect(spies.length).toBeGreaterThan(50);
        const html = renderToHtml(template(Root));
        const parts = renderToHtmlParts(template(Root));
        const text = renderToPlainText(template(Root));
        expect(spies.filter((spy) => spy.mock.calls.length).map((spy) => spy.getMockName())).toEqual([]);
        for (const written of [html, parts.body]) for (const words of ["Words", "<b>Html</b>", "<i>Tool</i>", "<section>Mine</section>"]) expect(written).toContain(words);
        expect(text).toContain("Html");
        // The spies do see them: the same template through today's components.
        legacyRenderToHtml(template(Root));
        expect(spies.some((spy) => spy.mock.calls.length)).toBe(true);
      } finally {
        spies.forEach((spy) => spy.mockRestore());
      }
    });

    it.each(ROOTS)("draw what the template holds as the same words as legacy (%s)", (_, Root) => {
      expect(renderToPlainText(template(Root))).toBe(legacyRenderToPlainText(template(Root)));
    });

    it.each(ROOTS)("have their own head, whole, and none of legacy's (%s)", (_, Root) => {
      const { css, js, tags, head } = renderToHtmlParts(template(Root));
      expect(css).toContain("#u_content_custom_open_tool_1 i { color: red; }");
      expect(js).toBe("var tool = 1;");
      expect(tags).toEqual(['<meta name="tool">']);
      expect(head).toContain('<meta name="tool">');
      expect(css).not.toMatch(/u_content_body|font-size: 1rem/);
    });

    it("keep an email's text color on tables, which is the only color their text has", () => {
      const { css } = renderToHtmlParts(template(Email));
      expect(css).toContain("table, td { color: #333333; }");
      // Before the tool's own rules, so that one of its own for a cell wins, as in legacy's head.
      expect(css.indexOf("table, td { color")).toBeLessThan(css.indexOf("#u_content_custom_open_tool_1"));
    });

    it("print a document's backgrounds", () => {
      expect(renderToHtmlParts(template(Document)).css).toContain("print-color-adjust: exact");
    });

    it("hide by their box's classes and the head's rules, and draw their phone padding", () => {
      const email = renderToHtml(template(Email));
      expect(email).toContain('class="u_content_html hide-mobile"');
      expect(email).toContain("@media (max-width: 480px) { .hide-mobile { max-height: 0px; overflow: hidden; display: none !important; } }");
      expect(email).toContain("@media (min-width: 0px) { .hide-default__display-block");
      expect(email).toContain("@media (max-width: 480px) { #u_content_html_1 .v-container-padding-padding { padding: 2px !important; } }");
      const page = renderToHtml(template(Page as never));
      expect(page).toContain('class="u_content_html v-container-padding-padding hide-mobile"');
      expect(page).toContain("@media (max-width: 480px) { .hide-mobile { display: none !important; } }");
      expect(page).toContain("@media (max-width: 480px) { #u_content_html_1.v-container-padding-padding { padding: 2px !important; } }");
      // A printed document has no phones.
      const document = renderToHtml(template(Document as never));
      expect(document).not.toMatch(/hide-mobile/);
    });

    it("have no device rules for the blocks a new component draws, which write no such classes", () => {
      const { css } = renderToHtmlParts(<Page><Row mobile={{ padding: "1px" } as never}><Column><Paragraph mobile={{ fontSize: "20px" }}>Words</Paragraph><Html html="<b>Html</b>" /></Column></Row></Page>);
      expect(css).not.toMatch(/u_row_1|u_content_paragraph_1|u_column_1/);
    });

    it("keep today's stylesheet beside a block that still keeps its legacy HTML", () => {
      const { css, js } = renderToHtmlParts(<Email textColor="#333333"><Row><Column><Tool /><Menu items={[{ text: "Docs", href: "https://example.com/docs" }]} /></Column></Row></Email>);
      expect(css).toContain("#u_content_custom_open_tool_1 i { color: red; }");
      expect(js).toBe("var tool = 1;");
      expect(css).toMatch(/table, td \{\s*color: #333333;/);
    });

    it("call a custom tool's exporter once, and only once it's lowered: a template that can't be renders as today", () => {
      const exporter = vi.fn(() => "<i>Once</i>");
      const Once = registerTool({ name: "once", renderer: { exporters: { web: exporter, email: exporter } } });
      expect(renderToHtml(<Email><Row><Column><Once /></Column></Row></Email>)).toContain("<i>Once</i>");
      expect(exporter).toHaveBeenCalledTimes(1);
      exporter.mockClear();
      const unlowerable = <Email><Row><Column><Once /></Column></Row><Row backgroundImage={{ url: "https://example.com/bg.png" } as never}><Column><Paragraph>Hi</Paragraph></Column></Row></Email>;
      expect(renderToHtml(unlowerable)).toContain("<i>Once</i>");
      expect(exporter).toHaveBeenCalledTimes(1);
    });

    it("say so and leave out a custom tool whose exporter throws, as legacy, and keep the rest", () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      try {
        const Broken = registerTool({ name: "broken", renderer: { exporters: { web: () => { throw new Error("no"); } } } });
        const page = <Page><Row><Column><Broken /><Paragraph>Still here</Paragraph></Column></Row></Page>;
        const html = renderToHtml(page);
        expect(html).toContain("Still here");
        expect(html).not.toContain("u_content_custom_broken");
        expect(error).toHaveBeenCalledWith("broken rendering failed:", expect.any(Error));
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("<broken> did not produce renderable HTML"));
      } finally {
        error.mockRestore();
        warn.mockRestore();
      }
    });

    it("leave no collecting marker in a block's HTML, and say so, where a block rendered to a string can't be told from one collected (another copy of React)", () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      const useId = vi.spyOn(React, "useId").mockImplementation(() => {
        throw new Error("another copy of React");
      });
      try {
        const Leaky = registerTool({ name: "leaky", renderer: { exporters: { web: (v) => `<i>${v.inner.html}</i>`, email: (v) => `<i>${v.inner.html}</i>` } } });
        const Inner = () => <Leaky values={{ inner: { html: renderToStaticMarkup(<Paragraph>Lost</Paragraph>) } }} />;
        const html = renderToHtml(<Email><Row><Column><Inner /><Paragraph>Kept</Paragraph></Column></Row></Email>);
        expect(html).toContain("<i></i>");
        expect(html).toContain("Kept");
        expect(error).toHaveBeenCalledWith(expect.stringContaining("left a marker behind"));
      } finally {
        useId.mockRestore();
        error.mockRestore();
      }
    });
  });

  it("give the parts their shapes: head and body, the head's CSS and script, and its tags", () => {
    const parts = renderToHtmlParts(<Page><Row><Column><Paragraph>Hello</Paragraph></Column></Row></Page>);
    expect(Object.keys(parts).sort()).toEqual(["body", "css", "head", "js", "tags"]);
    expect(parts.head).toBe(`<style>${parts.css}</style>`);
    // The page's own margin and background, which an app's page embedding the parts takes from the head.
    expect(parts.css).toContain("body{margin:0;background-color:#f7f8f9}");
    expect(parts.body).toContain(">Hello</p>");
    expect([parts.js, parts.tags]).toEqual(["", []]);
  });

  it("link the fonts legacy links, an email's out of Outlook's view", () => {
    const font = { url: "https://fonts.googleapis.com/css2?family=Inter" };
    const html = renderToHtml(<Email fonts={[font]}><Row><Column><Paragraph>Hi</Paragraph></Column></Row></Email>, { title: "Hi", lang: "en" });
    expect(html).toContain('<!--[if !mso]><!--><link href="https://fonts.googleapis.com/css2?family=Inter" rel="stylesheet" type="text/css"><!--<![endif]--></head>');
    expect(html).toContain("<title>Hi</title>");
    expect(html).toMatch(/<html[^>]* lang="en"/);
  });

  it("keep an email service's <%name%> tags as legacy writes them, in the blocks that hold one", () => {
    const html = renderToHtml(<Email><Row><Column><Button href="<%unsubscribe%>">Unsubscribe</Button><Paragraph>Hi</Paragraph></Column></Row></Email>);
    expect(html).toContain('href="<%unsubscribe%>"');
    expect(html).toContain(">Hi</p>");
  });

  it("give renderToHtmlParts() a body of legacy's shape: the root's host <div>, holding the <body> tag in an email or a printed document", () => {
    for (const Root of [Email, Document, Page]) {
      const template = <Root className="mine" style={{ outline: "1px solid red" }}><Row><Column><Paragraph>x</Paragraph></Column></Row></Root>;
      const body = renderToHtmlParts(template).body;
      const legacy = legacyRenderToHtmlParts(template).body;
      // The same host <div> as legacy's, and a <body> tag where legacy has one.
      expect(body.slice(0, body.indexOf(">") + 1)).toBe(legacy.slice(0, legacy.indexOf(">") + 1));
      expect(/<body[\s>]/.test(body)).toBe(/<body[\s>]/.test(legacy));
      expect(body.endsWith("</div>")).toBe(true);
    }
    expect(renderToHtmlParts(<Email><Row><Column><Paragraph>x</Paragraph></Column></Row></Email>).body).toMatch(/^<div>\n<body[^>]*>[\s\S]*<\/body>\n<\/div>$/);
  });

  it.each(["a Row of today's components", "renderToHtmlParts() of a template that renders as today"])("keep each block of the template where a custom tool's exporter renders %s of its own", (kind) => {
    const Nested = registerTool({
      name: kind.startsWith("a Row") ? "nested_row" : "nested_parts",
      renderer: {
        exporters: {
          email: () =>
            kind.startsWith("a Row")
              ? renderToStaticMarkup(<Row mode="email"><Column><Paragraph>Inner words</Paragraph></Column></Row>)
              : renderToHtmlParts(<Page><Row backgroundImage={{ url: "https://example.com/bg.png" } as never}><Column><Paragraph>Inner words</Paragraph></Column></Row></Page>).body,
        },
      },
    });
    const template = <Email><Row><Column><Nested /><Html html="<p>Critical final notice</p>" /></Column></Row></Email>;
    const html = renderToHtml(template);
    expect(html).toContain("Inner words");
    expect(html).toContain("Critical final notice");
  });

  it("ask nothing of an email client that legacy's head doesn't: no light color scheme, no format detection off", () => {
    const html = renderToHtml(<Email><Row><Column><Paragraph>Call 555 0100</Paragraph></Column></Row></Email>);
    expect(html).not.toMatch(/color-scheme|format-detection/);
    expect(html).toContain('<meta name="x-apple-disable-message-reformatting">');
  });

  it("say which render failed, and what to check, where the new engine's plain text fails", () => {
    const spy = vi.spyOn(compat, "renderThroughNewEngine").mockReturnValue({
      get text(): string {
        throw new Error("the plain text failed");
      },
    } as never);
    try {
      const template = <Email><Row><Column><Paragraph>Plain words</Paragraph></Column></Row></Email>;
      expect(() => renderToPlainText(template)).toThrow("[Unlayer] renderToPlainText failed: the plain text failed");
      expect(() => renderToPlainText(template)).toThrow("Body > Row > Column > Item");
    } finally {
      spy.mockRestore();
    }
  });

  it("add a custom tool's script to the head whole, whatever it holds ($& and $' are text)", () => {
    const script = "var s = x.replace(/a/g, '\\\\$&') + \"$'\";";
    const Tool = registerTool({ name: "dollar_script", renderer: { exporters: { web: () => "<i>T</i>", email: () => "<i>T</i>" }, head: { js: () => script } } });
    for (const Root of [Email, Page]) {
      const html = renderToHtml(<Root><Row><Column><Tool /></Column></Row></Root>);
      expect(html.match(/<\/head>/g)).toHaveLength(1);
      expect(html).toContain(script);
    }
  });

  it("say what's drawn otherwise than a block asks, in the render's diagnostics and on the console, and draw the rest", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const template = <Page><Row><Column><Social containerPadding="lots" icons={[{ name: "X", url: "https://x.example" }]} /></Column></Row></Page>;
      const rendered = withRenderScope(() => renderThroughNewEngine(template, undefined, "renderToHtml")) as Rendered;
      expect(rendered.diagnostics.map((d) => d.message)).toContain('A social block\'s padding "lots" can\'t be read: it\'s drawn without it.');
      expect(warn).toHaveBeenCalledWith('[Unlayer] A social block\'s padding "lots" can\'t be read: it\'s drawn without it. (blocks[0])');
      expect(rendered.html).toContain('href="https://x.example"');
    } finally {
      warn.mockRestore();
    }
  });

  it("write no social, menu, image or video with today's exporters, whatever they hold", () => {
    const spies = [exporters.SocialExporters, exporters.MenuExporters, exporters.ImageExporters, exporters.VideoExporters, exporters.BodyExporters].flatMap((tool: Record<string, any>) => Object.keys(tool).map((mode) => vi.spyOn(tool, mode)));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      for (const Root of [Email, Page, Document]) {
        renderToHtml(
          <Root>
            <Row>
              <Column>
                <Social icons={[]} />
                <Social icons={[{ name: "X", url: "https://x.example/<%id%>", imgUrl: 7 } as never]} hideOnMobile containerPadding="lots" mobile={{ containerPadding: "1px" } as never} values={{ _override: { desktop: { containerPadding: "2px" }, tablet: { containerPadding: "3px" } } } as never} />
                <Menu items={[]} />
                <Menu layout="vertical" items={[{ text: "<%a%>", href: "https://a.example" }]} hideOnDesktop mobile={{ fontSize: "20px" } as never} />
                <Image values={{ src: { url: "" } } as never} />
                <Image src={{ url: "https://a.example/a.png", width: 100, height: 10 }} alt="<%a%>" action={{ url: "https://a.example" } as never} hideOnMobile mobile={{ textAlign: "left" } as never} />
                <Video values={{ video: { type: "dailymotion", videoId: "x" } } as never} hideOnMobile />
                <PageBreak />
              </Column>
            </Row>
          </Root>
        );
      }
      for (const spy of spies) expect(spy).not.toHaveBeenCalled();
    } finally {
      for (const spy of spies) spy.mockRestore();
      warn.mockRestore();
    }
  });

  it("hide on phones in an email at legacy's 480px, whatever its width, its columns still stacking at its width", () => {
    const html = renderToHtml(<Email contentWidth="600px"><Row cells={[1, 1]}><Column><Menu separator="|" items={[{ text: "A", href: "https://a.example" }, { text: "B", href: "https://b.example" }]} /></Column><Column><Paragraph>Text</Paragraph></Column></Row></Email>);
    expect(html).toMatch(/@media \(max-width: 480px\)\{\.e\w+\{display:none!important\}\}/);
    expect(html).toContain("@media (max-width: 620px)");
  });

  it("keep an email service's tag in the plain text, in the words as in an attribute, for the service to fill in", () => {
    const read = (block: React.ReactElement) => renderToPlainText(<Page><Row><Column>{block}</Column></Row></Page>);
    expect(read(<Paragraph html="Hi <%= name %>, you have <%count%> items" />)).toBe("Hi <%= name %>, you have <%count%> items");
    expect(read(<Heading values={{ text: "Dear <%name%>" } as never} />)).toBe("DEAR <%name%>");
    expect(read(<Menu items={[{ text: "Docs", href: "https://a.example/<%id%>" }]} />)).toContain("(https://a.example/<%id%>)");
    expect(read(<Image src={{ url: "https://a.example/<%id%>.png", width: 100, height: 50 }} alt="Hi <%name%>" />)).toBe("[Hi <%name%>]");
  });

  it("can't be ended by a double quote in an email service's tag, in an attribute", () => {
    const html = renderToHtml(<Email><Row><Column><Image src={`https://a.example/{{ " }}x.png`} alt={'{{ " }} x-pwn=1 y'} /></Column></Row></Email>);
    expect(new DOMParser().parseFromString(html, "text/html").querySelector("[x-pwn]")).toBeNull();
    expect(html).toContain("{{ &quot; }} x-pwn=1 y");
  });

  it("draw an image a template links as legacy links it", () => {
    const html = renderToHtml(<Page><Row><Column><Image src="https://example.com/a.png" alt="A" action={{ url: "#hero", target: "_self" } as never} /></Column></Row></Page>);
    expect(html).toMatch(/<a href="#hero" target="_self"[^>]*>\s*<img[^>]*alt="A"/);
  });
});

describe("today's components straight through React", () => {
  const words = <Paragraph>Words</Paragraph>;
  const twoColumns = <Row cells={[1, 1]}><Column>{words}</Column><Column><Button href="https://example.com">Go</Button></Column></Row>;
  /** Each class the new engine's writers name after a rule (`e` and five or more characters). */
  const engineClasses = (html: string) => [...new Set([...html.replace(/<style>[\s\S]*?<\/style>/g, "").matchAll(/class="(e[a-z0-9]{5,})"/g)].map((m) => m[1]))];
  const sheets = (html: string) => [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("");
  const asBody = (element: React.ReactElement) => /<body\b/.test(renderToStaticMarkup(element));

  it.each([["Email", Email, "email"], ["Page", Page, "web"], ["Document", Document, "document"]] as const)("draw a %s through the new engine, in its host <div>, with the stylesheet its markup needs", (_, Root, mode) => {
    const html = renderToStaticMarkup(<Root className="mine" style={{ outline: "1px solid red" }}><Row cells={[1, 1]}><Column>{words}</Column><Column>{words}</Column></Row></Root>);
    expect(html).toMatch(/^<div class="mine" style="outline:1px solid red">/);
    expect(html.match(/Words/g)).toHaveLength(2);
    // Not today's markup.
    expect(html).not.toContain("u_row");
    // A <body> tag in an email and a printed document, as legacy's; none on a page.
    expect(/<body\b/.test(html)).toBe(mode !== "web");
    // Nothing else holds what its classes need here.
    if (mode !== "document") expect(engineClasses(html).length).toBeGreaterThan(0);
    for (const name of engineClasses(html)) expect(sheets(html)).toContain(`.${name}`);
    // renderToHtmlParts() has its stylesheet in its head.
    expect(renderToHtmlParts(<Root><Row cells={[1, 1]}><Column>{words}</Column><Column>{words}</Column></Row></Root>).body).not.toContain("<style>");
  });

  it("keep a page's margin for the page it's in", () => {
    expect(renderToStaticMarkup(<Page><Row><Column>{words}</Column></Row></Page>)).not.toContain("padding:8px");
    expect(renderToHtml(<Page><Row><Column>{words}</Column></Row></Page>)).toContain("padding:8px");
  });

  it("leave out what fails of a live preview, and say so, rather than failing the app's render", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const Missing = undefined as unknown as React.ComponentType;
      expect(renderToStaticMarkup(<Email className="mine"><Row><Column><Missing /></Column></Row></Email>)).toBe('<div class="mine"></div>');
      expect(error.mock.calls.join()).toContain("Body rendering failed");
    } finally {
      error.mockRestore();
    }
  });

  describe("on their own", () => {
    const pieces = [
      ["a Row", (props: Record<string, unknown>) => <Row {...props}>{<Column>{words}</Column>}</Row>],
      ["a Column", (props: Record<string, unknown>) => <Column {...props}>{words}</Column>],
      ["a block", (props: Record<string, unknown>) => <Paragraph {...props}>Words</Paragraph>],
    ] as const;

    it.each(pieces)("draw %s through the new engine, in the mode it says or its config does", (_, piece) => {
      const email = renderToStaticMarkup(piece({ mode: "email" }));
      expect(email).toContain("Words");
      expect(email).toContain('role="presentation"');
      expect(email).toContain("<!--[if mso]>");
      expect(renderToStaticMarkup(piece({ _config: { mode: "email" } }))).toContain('role="presentation"');
      // A mode of its own wins over its config's.
      expect(renderToStaticMarkup(piece({ mode: "web", _config: { mode: "email" } }))).not.toContain("<table");
      expect(renderToStaticMarkup(piece({}))).not.toContain("<table");
    });

    it.each(pieces)("write %s alone: its markup in its host <div>, not a document or an email of its own", (_, piece) => {
      for (const mode of ["email", "web", "document"]) {
        const html = renderToStaticMarkup(piece({ mode, className: "mine", style: { outline: "1px solid red" } }));
        expect(html).toMatch(/^<div class="mine" style="outline:1px solid red">/);
        expect(html).not.toMatch(/<body\b|<main\b|<html\b|role="article"|aria-roledescription/);
        // What it's in has its own background: no body's.
        expect(html.replace(/<style>[\s\S]*?<\/style>/g, "")).not.toMatch(/background-color|bgcolor/);
        for (const name of engineClasses(html)) expect(sheets(html)).toContain(`.${name}`);
      }
    });

    it("keep a Row to its body's content width, and a Column or block to none, where they're put", () => {
      expect(renderToStaticMarkup(<Row><Column>{words}</Column></Row>)).toContain("max-width:500px");
      expect(renderToStaticMarkup(<Row bodyValues={{ contentWidth: "321px" }}><Column>{words}</Column></Row>)).toContain("max-width:321px");
      expect(renderToStaticMarkup(<Column>{words}</Column>)).not.toContain("max-width:500px");
      expect(renderToStaticMarkup(words)).not.toContain("max-width:500px");
    });

    it("give a block no box of its own, and the font of what it's in: a Column gives those", () => {
      const alone = renderToStaticMarkup(<Paragraph containerPadding="33px">Words</Paragraph>);
      expect(alone).not.toContain("padding:33px");
      expect(alone).toContain("font-family:inherit");
      const inColumn = renderToStaticMarkup(<Column><Paragraph containerPadding="33px">Words</Paragraph></Column>);
      expect(inColumn).toContain("padding:33px");
      expect(inColumn).not.toContain("font-family:inherit");
    });

    it("fail where a Row's Columns don't fit its layout, as 0.2.1 does", () => {
      expect(() => renderToStaticMarkup(<Row layout={{ cells: [1, 1], expectedColumns: 2 } as never}><Column>{words}</Column></Row>)).toThrow();
    });

    it("can't take another render's frame classes for theirs, on one page", () => {
      const frame = (html: string) => /u-frame-[\w-]+/.exec(html)?.[0];
      const one = renderToStaticMarkup(<Row padding="1em"><Column>{words}</Column></Row>);
      const other = renderToStaticMarkup(<Row padding="2em"><Column>{words}</Column></Row>);
      expect(frame(one)).toBeDefined();
      expect(frame(one)).not.toBe(frame(other));
      // The same piece twice has the same.
      expect(frame(renderToStaticMarkup(<Row padding="1em"><Column>{words}</Column></Row>))).toBe(frame(one));
    });

    it("draw the same as a root does: a block in a Row is what it is in a root", () => {
      const inside = (html: string) => /<p\b[^>]*>Words<\/p>/.exec(html)?.[0];
      expect(inside(renderToStaticMarkup(twoColumns))).toBe(inside(renderToStaticMarkup(<Page>{twoColumns}</Page>)));
    });

    it("hold their own hover and phone rules", () => {
      const html = renderToStaticMarkup(<Button href="https://example.com" hoverBackgroundColor="#123456" mobile={{ fontSize: "23px" }}>Go</Button>);
      expect(sheets(html)).toMatch(/:hover\{[^}]*#123456/);
      expect(sheets(html)).toContain("font-size:23px");
    });

    it("a block with HTML of its own (a custom tool, an Html block, a page break) writes it, with no engine around it", () => {
      const Tool = registerTool({ name: "on_its_own", renderer: { exporters: { web: () => "<i>Mine</i>", email: () => "<i>Mine</i>" } } });
      expect(renderToStaticMarkup(<Tool />)).toBe("<div><i>Mine</i></div>");
      expect(renderToStaticMarkup(<Html html="<b>Mine</b>" />)).toBe("<div><div><b>Mine</b></div></div>");
      expect(renderToStaticMarkup(<PageBreak mode="document" />)).toContain("u-content-page-break");
      expect(renderToStaticMarkup(<PageBreak mode="web" />)).toBe("<div></div>");
    });
  });

  describe("among a template's rows", () => {
    it.each([["Email", Email], ["Page", Page], ["Document", Document]] as const)("draw a block and a Column where they are in a %s, with no word of the design's walk", (_, Root) => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      try {
        const template = <Root><Paragraph>Block among</Paragraph><Row><Column><Paragraph>In a row</Paragraph></Column></Row><Column><Paragraph>Column among</Paragraph></Column></Root>;
        const html = renderToHtml(template);
        expect(html.indexOf("Block among")).toBeGreaterThan(-1);
        expect(html.indexOf("Block among")).toBeLessThan(html.indexOf("In a row"));
        expect(html.indexOf("In a row")).toBeLessThan(html.indexOf("Column among"));
        expect(renderToPlainText(template).split(/\n+/)).toEqual(["Block among", "In a row", "Column among"]);
        expect(warn.mock.calls.join()).not.toContain("valid Body child");
      } finally {
        warn.mockRestore();
      }
    });

    it("say nothing of markup among them, which is drawn; renderToJson says it isn't in the design", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      try {
        const template = <Email><div>Markup among</div><Row><Column>{words}</Column></Row></Email>;
        expect(renderToHtml(template)).toContain("Markup among");
        renderToPlainText(template);
        renderToHtmlParts(template);
        expect(warn).not.toHaveBeenCalled();
        renderToJson(template);
        expect(warn.mock.calls.join()).toContain("renderToJson: <div> is not a valid Body child");
      } finally {
        warn.mockRestore();
      }
    });

    it("say what's in a Row that isn't a Column, as a Row does, not as renderToJson does", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      try {
        renderToHtml(<Email><Row><Paragraph>Stray</Paragraph><Column>{words}</Column></Row></Email>);
        expect(warn.mock.calls.join()).toContain("Row: <Paragraph> is not a valid Row child. Only <Column> components can be direct children of <Row>");
        expect(warn.mock.calls.join()).not.toContain("renderToJson");
      } finally {
        warn.mockRestore();
      }
    });
  });

  describe("a Row or Column placed in a Column", () => {
    // Rows a component of the template renders in a Column: 0.2.1's renderToHtml draws them; its renderToJson fails.
    const Layout = ({ mode }: { mode?: "web" | "email" }) => (
      <div>
        <Row mode={mode} cells={[1]}><Column><Paragraph>Nested row</Paragraph></Column></Row>
        <Column mode={mode}><Paragraph>Nested column</Paragraph></Column>
      </div>
    );
    const template = (Root: typeof Email, mode?: "web" | "email") => <Root><Row><Column><Paragraph>Before</Paragraph><Layout mode={mode} /><Paragraph>After</Paragraph></Column></Row></Root>;

    it.each([["Email", Email], ["Page", Page], ["Document", Document]] as const)("draw in a %s, each in a block's box named after it, the blocks around them where they are", (_, Root) => {
      const html = renderToHtml(template(Root as typeof Email));
      for (const name of ["u_content_row_1", "u_content_column_1"]) expect(html).toContain(`id="${name}"`);
      const at = ["Before", "Nested row", "Nested column", "After"].map((word) => html.indexOf(word));
      expect(at[0]).toBeGreaterThan(-1);
      expect([...at].sort((a, b) => a - b)).toEqual(at);
    });

    it("read as lines of their own in the plain text", () => {
      expect(renderToPlainText(template(Email)).split(/\n+/)).toEqual(["Before", "Nested row", "Nested column", "After"]);
    });

    it("read in the plain text as they do on their own, not as their markup does", () => {
      const social = <Social icons={[{ name: "Facebook", url: "https://a.example/" }, { name: "X", url: "https://b.example/" }]} />;
      const own = renderToPlainText(<Page><Row><Column>{social}</Column></Row></Page>);
      expect(own).toContain("(https://a.example/) (https://b.example/)");
      expect(renderToPlainText(<Page><Row><Column><Row><Column>{social}</Column></Row></Column></Row></Page>)).toContain(own);
    });

    it("keep an email service's tag in their plain text, as a block's in a Column does", () => {
      expect(renderToPlainText(<Email><Row><Column><Row><Column><Paragraph html="Hi <%= name %>, you have items" /></Column></Row></Column></Row></Email>)).toBe("Hi <%= name %>, you have items");
    });

    it("draw in the mode they say, or the template's", () => {
      const row = (html: string) => html.slice(html.indexOf('id="u_content_row_1"'), html.indexOf("Nested row"));
      expect(row(renderToHtml(template(Email)))).not.toContain("display:flex");
      expect(row(renderToHtml(template(Email, "web")))).toContain("display:flex");
    });

    it("hold the stylesheet their own blocks need", () => {
      const html = renderToHtml(<Page><Row><Column><Row cells={[1, 1]}><Column><Paragraph mobile={{ fontSize: "23px" }}>A</Paragraph></Column><Column>{words}</Column></Row></Column></Row></Page>);
      expect(html).toContain("font-size:23px");
    });

    it("are still refused by renderToJson, as 0.2.1's is", () => {
      expect(() => renderToJson(template(Email))).toThrow("<Row> is not a recognized Unlayer item component");
    });
  });
});
