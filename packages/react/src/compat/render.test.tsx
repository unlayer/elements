import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Button, Column, Document, Email, Html, Image, Page, Paragraph, Row, Table, registerTool, renderToHtml, renderToHtmlParts, renderToPlainText } from "../index";
import { legacyRenderToHtml, legacyRenderToHtmlParts, legacyRenderToPlainText } from "../utils/render-to-html";
import { withRenderScope } from "../utils/render-scope";
import * as exporters from "@unlayer/exporters";
import * as compat from "./render";
import { renderThroughNewEngine } from "./render";
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

/** What the new engine can't draw as legacy does in these stories, which render as today (their reasons). */
const AS_TODAY: Record<string, string> = {
  "components/Body.stories.tsx Magazine": "a row's background image",
  // Its links' own color and hover color, which legacy's head CSS draws for every link.
  "examples/MorningBrewDigest.stories.tsx Default": "the body's own link style",
};

describe("renderToHtml(), renderToHtmlParts() and renderToPlainText() through the new engine", () => {
  const all = templates();
  const quiet = () => [vi.spyOn(console, "warn").mockImplementation(() => {}), vi.spyOn(console, "error").mockImplementation(() => {})];

  it("render every story's template through the new engine, but those it says it can't draw", () => {
    const [warn, error] = quiet();
    try {
      const unlowered: Record<string, string> = {};
      for (const [name, template] of all) {
        const rendered = withRenderScope(() => renderThroughNewEngine(template, undefined, "renderToHtml"));
        expect(rendered, name).toBeDefined();
        if (rendered?.unlowered !== undefined) unlowered[name] = rendered.unlowered;
      }
      expect(Object.keys(unlowered).sort()).toEqual(Object.keys(AS_TODAY).sort());
      for (const [name, why] of Object.entries(AS_TODAY)) expect(unlowered[name]).toContain(why);
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

  it("render a template of another copy of today's components as today, through them", () => {
    const Foreign = Object.assign((props: Record<string, unknown>) => <Email {...props} />, { displayName: "Email" });
    const template = <Foreign><Row><Column><Paragraph>Hi</Paragraph></Column></Row></Foreign>;
    expect(withRenderScope(() => renderThroughNewEngine(template, undefined, "renderToHtml"))).toBeUndefined();
    expect(renderToHtml(template)).toBe(legacyRenderToHtml(template));
  });

  it("render a template the new engine can't draw as today", () => {
    const template = <Email><Row backgroundImage={{ url: "https://example.com/bg.png" } as never}><Column><Paragraph>Hi</Paragraph></Column></Row></Email>;
    expect(renderToHtml(template)).toBe(legacyRenderToHtml(template));
    expect(renderToHtmlParts(template)).toEqual(legacyRenderToHtmlParts(template));
  });

  it("write no block with today's exporters where every block moves over", () => {
    const write = vi.spyOn(exporters.ColumnExporters, "email");
    const table = vi.spyOn(exporters.TableExporters, "email");
    const button = vi.spyOn(exporters.ButtonExporters, "email");
    try {
      renderToHtml(<Email><Row><Column><Paragraph>One</Paragraph><Button href="https://example.com">Two</Button></Column></Row></Email>);
      expect(write).not.toHaveBeenCalled();
      // A block that keeps its legacy HTML (a table, until it moves over) is the only one written by them.
      renderToHtml(<Email><Row><Column><Button href="https://example.com">One</Button><Table /></Column></Row></Email>);
      expect(table).toHaveBeenCalledTimes(1);
      expect(button).not.toHaveBeenCalled();
    } finally {
      write.mockRestore();
      table.mockRestore();
      button.mockRestore();
    }
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
      const { css, js } = renderToHtmlParts(<Email textColor="#333333"><Row><Column><Tool /><Table /></Column></Row></Email>);
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
    expect(legacyRenderToHtml(template)).toContain("Critical final notice");
    expect(html).toContain("Inner words");
    expect(html).toContain("Critical final notice");
  });

  it("ask nothing of an email client that legacy's head doesn't: no light color scheme, no format detection off", () => {
    const html = renderToHtml(<Email><Row><Column><Paragraph>Call 555 0100</Paragraph></Column></Row></Email>);
    expect(html).not.toMatch(/color-scheme|format-detection/);
    expect(html).toContain('<meta name="x-apple-disable-message-reformatting">');
  });

  it("render the plain text as today where the new engine's plain text fails", () => {
    const spy = vi.spyOn(compat, "renderThroughNewEngine").mockReturnValue({
      get text(): string {
        throw new Error("the plain text failed");
      },
    } as never);
    try {
      const template = <Email><Row><Column><Paragraph>Plain words</Paragraph></Column></Row></Email>;
      expect(renderToPlainText(template)).toBe(legacyRenderToPlainText(template));
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

  it("draw an image a template links as legacy links it", () => {
    const html = renderToHtml(<Page><Row><Column><Image src="https://example.com/a.png" alt="A" action={{ url: "#hero", target: "_self" } as never} /></Column></Row></Page>);
    expect(html).toMatch(/<a href="#hero" target="_self"[^>]*>\s*<img[^>]*alt="A"/);
  });
});
