import { beforeAll, describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as current from "../index";
import { Button, Column, Divider, Document, Email, Heading, Html, Image, Menu, Page, PageBreak, Paragraph, Row, Social, Table, registerTool, renderToHtml, renderToHtmlParts, renderToJson, renderToPlainText } from "../index";
import * as published from "@unlayer/react-elements-previous";
import { UNLAYER_CONFIG_KEY } from "../utils/create-component";
import { withRenderScope } from "../utils/render-scope";
import * as compat from "./render";
import { renderThroughNewEngine, type Rendered } from "./render";

type Release = typeof current;
/** The last published release, the reference for what legacy drew. A template has to be made with its own components. */
const previous = published as unknown as Release;

const stories = import.meta.glob(["../components/*.stories.tsx", "../examples/*.stories.tsx", "../SpotifyWelcome.stories.tsx", "../context/*.stories.tsx"]);

/** What a story renders, called as Storybook calls it (its args, its meta's). */
function storyElement(module: Record<string, any>, name: string): React.ReactElement {
  const meta = module.default ?? {};
  const story = module[name];
  const args = { ...meta.args, ...story.args };
  const render = story.render ?? meta.render;
  return render ? render(args, { args, loaded: {}, argTypes: {}, globals: {}, parameters: {} }) : React.createElement(meta.component, args);
}

/** The blocks of today's components in a story's markup (a gallery's), in order. */
function blocksIn(node: React.ReactNode): React.ReactElement[] {
  return React.Children.toArray(node).flatMap((child) => {
    if (!React.isValidElement(child)) return [];
    if ((child.type as unknown as Record<symbol, unknown>)?.[UNLAYER_CONFIG_KEY]) return [child];
    return typeof child.type === "string" ? blocksIn((child.props as { children?: React.ReactNode }).children) : [];
  });
}

/**
 * The template a story renders, as `root` where it's blocks without one (the story's own markup isn't a template's, and
 * is left out); undefined where it renders blocks only for the other root.
 */
function storyTemplate(element: React.ReactElement, root: "email" | "web" | undefined, parts: Pick<Release, "Email" | "Page" | "Row" | "Column">): React.ReactElement | undefined {
  const props = element.props as { tree?: React.ReactElement; children?: React.ReactNode };
  const name = (element.type as { displayName?: string })?.displayName;
  // A live preview of a template's parts.
  if (name === undefined && React.isValidElement(props.tree)) return storyTemplate(props.tree, root, parts);
  // A provider: its config stays around the template.
  if (name === "UnlayerProvider") {
    const template = storyTemplate(React.Children.only(props.children) as React.ReactElement, root, parts);
    return template && React.cloneElement(element, undefined, template);
  }
  const isBlock = !!(element.type as unknown as Record<symbol, unknown>)?.[UNLAYER_CONFIG_KEY];
  const blocks = isBlock ? [element] : typeof element.type === "string" ? blocksIn(props.children) : undefined;
  if (!blocks) return root ? undefined : element;
  if (!root) throw new Error("A story of blocks is rendered in an Email or a Page");
  // Blocks that all say their mode (a story of an email's block) are put in that root only.
  const modes = new Set(blocks.map((block) => (block.props as { mode?: string }).mode));
  if (modes.size === 1 && !modes.has(undefined) && !modes.has(root)) return undefined;
  const { Row, Column } = parts;
  const Root = root === "email" ? parts.Email : parts.Page;
  return <Root><Row><Column>{blocks.map((block, index) => React.cloneElement(block, { key: index }))}</Column></Row></Root>;
}

/** Every story's template, by name, made with the components now loaded. */
async function templates(): Promise<Array<[string, React.ReactElement]>> {
  // (Imported here: it's the published release's where publishedTemplates has it mocked.)
  const parts = await import("../index");
  const out: Array<[string, React.ReactElement]> = [];
  for (const [file, load] of Object.entries(stories)) {
    const module = (await load()) as Record<string, any>;
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
          template = storyTemplate(element, root, parts);
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

/** The same templates, made with the published release's components. */
async function publishedTemplates(): Promise<Array<[string, React.ReactElement]>> {
  const components = import.meta.glob(["../components/*.tsx", "!../components/*.stories.tsx", "!../components/*.test.tsx"]);
  const ours = ["../index", "../context", "../context/UnlayerProvider", "../layouts/ColumnLayouts", "../utils/register-tool", "../utils/render-to-html", ...Object.keys(components)];
  vi.resetModules();
  for (const path of ours) {
    // A story imports a component as its file's default, or by its name.
    vi.doMock(path, async () => {
      const copy = (await import("@unlayer/react-elements-previous")) as Record<string, unknown>;
      return { ...copy, default: copy[/(\w+)\.tsx$/.exec(path)?.[1] ?? ""] };
    });
  }
  try {
    return await templates();
  } finally {
    for (const path of ours) vi.doUnmock(path);
    vi.resetModules();
  }
}

describe("renderToHtml(), renderToHtmlParts() and renderToPlainText() through the new engine", () => {
  let all: Array<[string, React.ReactElement]>;
  beforeAll(async () => {
    all = await templates();
  });
  const quiet = () => [vi.spyOn(console, "warn").mockImplementation(() => {}), vi.spyOn(console, "error").mockImplementation(() => {})];

  it("render every story's template through the new engine", () => {
    const [warn, error] = quiet();
    try {
      for (const [name, template] of all) {
        const rendered = withRenderScope(() => renderThroughNewEngine(template, undefined, "renderToHtml"));
        expect(rendered?.html, name).toMatch(/^<!DOCTYPE /i);
      }
      expect(all.length).toBeGreaterThan(150);
    } finally {
      warn.mockRestore();
      error.mockRestore();
    }
  });

  it("give each story's template the plain text 0.2.1 gives it", async () => {
    const [warn, error] = quiet();
    try {
      const before = new Map(await publishedTemplates());
      expect(before.size).toBe(all.length);
      // Each made with the release's own components.
      for (const [name, template] of all) expect(before.get(name)!.type, name).not.toBe(template.type);
      const different = all.filter(([name, template]) => renderToPlainText(template) !== previous.renderToPlainText(before.get(name)!)).map(([name]) => name);
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

  describe.each([["an email", Email], ["a page", Page], ["a printed document", Document]] as const)("in %s", (_, Root) => {
    it("leave a block that can't be drawn undrawn and say so, and the rest draws, as 0.2.1's", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      try {
        // A sanitizer that throws on one block's HTML: each tool that reads it.
        const toSafeHtml = (html: string) => {
          if (html.includes("Refused")) throw new Error(`refused ${Root.displayName}`);
          return html;
        };
        const blocks = [<Paragraph html="Refused" />, <Heading text="Refused" />, <Button href="https://example.com" text="Refused" />];
        const template = (block: React.ReactElement, L: Release = current) => { const R = L[Root.displayName as "Email"]; return <R><L.Row><L.Column><L.Paragraph>Before</L.Paragraph>{block}<L.Paragraph>After</L.Paragraph></L.Column></L.Row></R>; };
        for (const block of blocks) {
          const html = renderToHtml(template(block), { toSafeHtml } as never);
          expect(html).toContain("Before");
          expect(html).toContain("After");
          expect(html).not.toContain("Refused");
          expect(renderToPlainText(template(block), { toSafeHtml } as never)).toBe("Before\n\nAfter");
        }
        const said = warn.mock.calls.flat().join("\n");
        expect(said).toContain(`refused ${Root.displayName}`);
        expect(said).toContain("it's left out");
      } finally {
        warn.mockRestore();
        error.mockRestore();
      }
    });
  });

  it("say so of a root of a copy older than 0.3, which they can't read", () => {
    const rows = <previous.Row><previous.Column><previous.Paragraph>Hi</previous.Paragraph></previous.Column></previous.Row>;
    for (const Root of [previous.Email, previous.Page, previous.Document, previous.Body]) {
      // Also inside a template of the user's, and in a component of the user's own named like a root.
      const named = Object.assign(() => <Root>{rows}</Root>, { displayName: "Email" });
      for (const render of [renderToHtml, renderToHtmlParts, renderToPlainText]) {
        for (const template of [<Root>{rows}</Root>, React.createElement(() => <Root>{rows}</Root>), React.createElement(named)]) {
          expect(() => render(template)).toThrow(/another copy of @unlayer\/react-elements.*duplicate install/);
        }
      }
    }
  });

  describe("of a component of the user's named like a root", () => {
    const rows = (L: Release) => <L.Row><L.Column><L.Paragraph>Words</L.Paragraph></L.Column></L.Row>;
    const named = <T extends object>(component: T, displayName: string) => Object.assign(component, { displayName }) as T & React.ComponentType;
    const ROOTS = ["Email", "Page", "Document", "Body"] as const;
    const whole = (L: Release, name: (typeof ROOTS)[number]) => {
      const Root = L[name] as typeof Email;
      return <Root>{rows(L)}</Root>;
    };
    /** Each way a template can be named like a root and give one. */
    const WRAPPERS: Record<string, (L: Release, name: (typeof ROOTS)[number]) => React.ReactElement> = {
      memo: (L, name) => React.createElement(named(React.memo(() => whole(L, name)), name)),
      forwardRef: (L, name) => React.createElement(named(React.forwardRef(() => whole(L, name)), name)),
      class: (L, name) => {
        class Template extends React.Component {
          render() {
            return whole(L, name);
          }
        }
        return React.createElement(named(Template, name));
      },
      function: (L, name) => React.createElement(named(() => whole(L, name), name)),
      "function around another named function": (L, name) => {
        const Inner = named(() => whole(L, name), name);
        return React.createElement(named(() => <Inner />, name));
      },
    };

    it.each(Object.keys(WRAPPERS))("%s: is called like any template, and draws its root as the root draws", (kind) => {
      for (const name of ROOTS) {
        const expected = renderToHtml(whole(current, name));
        expect(renderToHtml(WRAPPERS[kind](current, name)), name).toBe(expected);
        expect(renderToPlainText(WRAPPERS[kind](current, name)), name).toBe(renderToPlainText(whole(current, name)));
        expect(renderToPlainText(WRAPPERS[kind](current, name)), name).toBe(previous.renderToPlainText(WRAPPERS[kind](previous, name)));
      }
    });

    it("gives Rows: they're drawn in the output its name says", () => {
      for (const name of ROOTS) {
        const template = React.createElement(named(() => rows(current), name));
        expect(renderToHtml(template), name).toBe(renderToHtml(whole(current, name)));
        expect(previous.renderToHtml(React.createElement(named(() => rows(previous), name)))).toContain("Words");
      }
    });

    it("gives Rows through memo or a class: the same", () => {
      class Template extends React.Component {
        render() {
          return rows(current);
        }
      }
      expect(renderToHtml(React.createElement(named(Template, "Page")))).toBe(renderToHtml(whole(current, "Page")));
      expect(renderToHtml(React.createElement(named(React.memo(() => rows(current)), "Email")))).toBe(renderToHtml(whole(current, "Email")));
    });

    it("gives markup: it's drawn, and no copy is said to be older, even of HTML a copy could have written", () => {
      for (const [name, Mode] of [["Body", Page], ["Page", Page], ["Email", Email], ["Document", Document]] as const) {
        for (const markup of [<div>Words</div>, <div dangerouslySetInnerHTML={{ __html: '<div id="u_body_1" class="u_body">Words</div>' }} />]) {
          const html = renderToHtml(React.createElement(named(() => markup, name)));
          expect(html, name).toContain("Words");
          expect(html.includes('aria-roledescription="email"'), name).toBe(Mode === Email);
        }
      }
      // A component that isn't named like one isn't a template: it says so, as markup itself does.
      expect(() => renderToHtml(React.createElement(() => <div>Words</div>))).toThrow(/<div> isn't a template/);
    });

    it("gives nothing or text: it's drawn as what it is, in the output its name says", () => {
      expect(renderToHtml(React.createElement(named(() => null, "Email")))).toContain('aria-roledescription="email"');
      expect(renderToHtml(React.createElement(named(() => "Words" as never, "Email")))).toContain("Words");
    });

    it("named Row or Column, gives a root: it's called too", () => {
      for (const name of ["Row", "Column"]) expect(renderToHtml(React.createElement(named(() => whole(current, "Email"), name)))).toBe(renderToHtml(whole(current, "Email")));
    });
  });

  it("draw what the new engine refuses without it, and say so", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      // Too long a language, and the same id twice: the first keeps it.
      const template = <Email lang={"x".repeat(40)}><Row values={{ _meta: { htmlID: "same" } } as never}><Column><Paragraph>One</Paragraph></Column></Row><Row values={{ _meta: { htmlID: "same" } } as never}><Column><Paragraph>Two</Paragraph></Column></Row></Email>;
      const html = renderToHtml(template);
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
      expect(stacking).toContain("width:100%!important;max-width:100%!important");
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
    /** Every way each can't be read or held, in each output. */
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
    it.each([["Email", Email], ["Page", Page], ["Document", Document]])("draw all of it in a %s", (_, Root) => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      try {
        const template = <Root><Row><Column>{everything}</Column></Row></Root>;
        const html = renderToHtml(template);
        for (const words of ["No link", "Unread", "Devices", "Markup", "name", "Paragraph markup", "Paragraph values", "<%name%>", "Heading level", "Heading markup"]) expect(html).toContain(words);
        const text = renderToPlainText(template);
        for (const words of ["No link", "Unread", "Devices", "Markup", "Paragraph markup", "Paragraph values"]) expect(text).toContain(words);
      } finally {
        warn.mockRestore();
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
      // In the plain text as 0.2.1 reads them.
      const words = ({ Email, Row, Column, Button }: Release) => <Email><Row><Column><Button href="https://example.com" values={{ text: tags[1] } as never} /></Column></Row></Email>;
      expect(renderToPlainText(words(current))).toBe(previous.renderToPlainText(words(previous)));
      expect(renderToPlainText(words(current))).toContain(tags[1]);
    });

    // React writes a component's children escaped: the tag goes back into the plain text as it was written, as 0.2.1 reads it.
    it("read an email service's tag in a component's children as it was written, in the plain text", () => {
      const tag = "{% if orders > 1 %}Thanks{% endif %}";
      const words = ({ Email, Row, Column, Button }: Release) => <Email><Row><Column><Button href="https://example.com">{tag}</Button></Column></Row></Email>;
      expect(renderToPlainText(words(current))).toBe(previous.renderToPlainText(words(previous)));
    });

    it("draw text that isn't a string as 0.2.1 draws it: a heading's and a button's", () => {
      const words = (L: Release, root: "Email" | "Page" | "Document", block: React.ReactElement) => {
        const Root = L[root] as typeof Email;
        const doc = new DOMParser().parseFromString(L.renderToHtml(<Root><L.Row><L.Column>{block}</L.Column></L.Row></Root>), "text/html");
        doc.querySelectorAll("style, script, title").forEach((element) => element.remove());
        return doc.body.textContent?.replace(/[\s\u200b]+/g, " ").trim();
      };
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      try {
        for (const root of ["Email", "Page", "Document"] as const) {
          for (const [value, heading, button] of [[2024, "2024", "2024"], [49.5, "49.5", "49.5"], [0, "", "0"], [true, "true", "true"], [["a", "b"], "a,b", "a,b"]] as const) {
            const asHeading = (L: Release) => <L.Heading text={value as never} />;
            const asButton = (L: Release) => <L.Button href="https://example.com" text={value as never} />;
            const asValues = (L: Release) => <L.Heading values={{ text: value } as never} />;
            expect(words(current, root, asHeading(current)), `${value}`).toBe(heading);
            expect(words(previous, root, asHeading(previous)), `${value}`).toBe(heading);
            expect(words(current, root, asValues(current)), `${value}`).toBe(heading);
            expect(words(current, root, asButton(current)), `${value}`).toBe(button);
            expect(words(previous, root, asButton(previous)), `${value}`).toBe(button);
            expect(renderToPlainText(<Email><Row><Column>{asHeading(current)}{asButton(current)}</Column></Row></Email>)).toBe(previous.renderToPlainText(<previous.Email><previous.Row><previous.Column>{asHeading(previous)}{asButton(previous)}</previous.Column></previous.Row></previous.Email>));
          }
          // (A cell's, where 0.2.1's table fails on it and draws none, is drawn; one that's nothing is an empty cell, as 0.2.1's.)
          const cell = (text: unknown) => <Table values={{ table: { headers: [], footers: [], rows: [{ cells: [{ text }, { text: "Beside" }] }] } } as never} />;
          expect(words(current, root, cell(2024))).toBe("2024Beside");
          expect(words(current, root, cell(0))).toBe("Beside");
        }
      } finally {
        warn.mockRestore();
      }
    });

    it("draw a `<` that starts no tag as text, as a browser reads 0.2.1's, and keep its words in the plain text, where 0.2.1 loses them", () => {
      const inputs = ["a < b > c", "< i >x</ i >", "< span >x", "x< br >y", '< a href="https://example.com" >y', "<b>bold</b> a < b"];
      for (const html of inputs) {
        for (const root of ["Email", "Page", "Document"] as const) {
          const template = (L: Release) => {
            const Root = L[root] as typeof Email;
            return <Root><L.Row><L.Column><L.Paragraph html={html} /><L.Paragraph>After</L.Paragraph></L.Column></L.Row></Root>;
          };
          const read = (L: Release) => {
            const doc = new DOMParser().parseFromString(L.renderToHtml(template(L)), "text/html");
            doc.querySelectorAll("style, script, title").forEach((element) => element.remove());
            return { words: doc.body.textContent?.replace(/\s+/g, ""), bold: doc.querySelectorAll("b, strong, [style*='font-weight:700'], [style*='font-weight: 700']").length };
          };
          expect(read(current).words, html).toBe(read(previous).words);
          expect(read(current).bold, html).toBe(html.includes("<b>") ? 1 : 0);
          // (`</ i >` is a comment to a browser: that block is written as it is, and reads as 0.2.1's.)
          if (html.includes("</ ")) expect(renderToPlainText(template(current)), html).toBe(previous.renderToPlainText(template(previous)));
          else for (const word of html.replace(/<\/? *\w+>/g, " ").split(/\s+/).filter((part) => /^\w+$/.test(part))) expect(renderToPlainText(template(current)), html).toContain(word);
        }
      }
    });

    it("write a text block's color over what its Row's own style or class gives, as 0.2.1's", () => {
      const colorOf = (html: string, words: string) => {
        const element = Array.from(new DOMParser().parseFromString(html, "text/html").body.querySelectorAll("*")).find((candidate) => candidate.children.length === 0 && candidate.textContent === words);
        return /(?:^|;)color:([^;]+)/.exec(element?.getAttribute("style") ?? "")?.[1];
      };
      const blocks = <Column><Paragraph>Words</Paragraph><Heading text="Title" /><Paragraph color="#123456">Own</Paragraph></Column>;
      for (const Root of [Page, Document]) {
        for (const own of [{ style: { color: "#c33" } }, { className: "mine" }]) {
          const html = renderToHtml(<Root><Row {...own}>{blocks}</Row></Root>);
          expect(colorOf(html, "Words")).toBe("#000");
          expect(colorOf(html, "Title")).toBe("#000");
          expect(colorOf(html, "Own")).toBe("#123456");
        }
        // A Row with neither leaves it to what's around it, the same color.
        expect(colorOf(renderToHtml(<Root><Row>{blocks}</Row></Root>), "Words")).toBeUndefined();
      }
    });

    it("read an `&amp;` in a URL, and an entity in an image's text or a link's own attribute, as 0.2.1 reads them", () => {
      const url = "https://example.com/a?a=1&amp;b=2&c=3";
      const words = "Tom &amp; Jerry &copy; A&B";
      const PLACES: Array<[string, Array<keyof typeof current | "Email" | "Page" | "Document">, (L: Release) => React.ReactElement, string, string]> = [
        ["an Image's URL", ["Email", "Page", "Document"], (L) => <L.Image src={url} alt="a" />, "img", "src"],
        ["an Image's text", ["Email", "Page", "Document"], (L) => <L.Image src="https://example.com/a.png" alt={words} />, "img", "alt"],
        ["an Image's link", ["Email", "Page", "Document"], (L) => <L.Image src="https://example.com/a.png" alt="a" action={{ url } as never} />, "a", "href"],
        ["a Button's link", ["Email", "Page", "Document"], (L) => <L.Button href={url}>Go</L.Button>, "a", "href"],
        ["a link's own attribute", ["Email", "Page", "Document"], (L) => <L.Button href={{ url: "https://example.com", customAttrs: { "data-x": words } } as never}>Go</L.Button>, "a", "data-x"],
        ["a Menu's link", ["Email", "Page", "Document"], (L) => <L.Menu items={[{ text: "A", href: url }]} />, "a", "href"],
        ["a Social's link", ["Email", "Page", "Document"], (L) => <L.Social icons={[{ name: "Twitter", url }]} />, "a", "href"],
        ["a Social's image", ["Email", "Page", "Document"], (L) => <L.Social values={{ icons: { icons: [{ name: "Twitter", url: "https://example.com", imgUrl: url }] } } as never} />, "img", "src"],
        ["a Video's thumbnail", ["Email"], (L) => <L.Video values={{ video: { thumbnail: url, url: "https://example.com/v" } } as never} />, "img", "src"],
        ["a Video's link", ["Email"], (L) => <L.Video values={{ video: { thumbnail: "https://example.com/t.png", url } } as never} />, "a", "href"],
      ];
      const read = (L: Release, root: string, block: (L: Release) => React.ReactElement, selector: string, attribute: string) => {
        const Root = L[root as "Email"];
        const doc = new DOMParser().parseFromString(L.renderToHtml(<Root><L.Row><L.Column>{block(L)}</L.Column></L.Row></Root>), "text/html");
        return Array.from(doc.querySelectorAll(selector)).find((element) => element.hasAttribute(attribute))?.getAttribute(attribute);
      };
      for (const [name, roots, block, selector, attribute] of PLACES) {
        for (const root of roots) {
          const value = read(current, root as string, block, selector, attribute);
          expect(value, `${name} in ${String(root)}`).toBe(read(published as unknown as Release, root as string, block, selector, attribute));
        }
      }
      // (In a URL, only that: another entity could hide a scheme.)
      const hidden = renderToHtml(<Email><Row><Column><Button href={"java&#115;cript:alert(1)"}>Go</Button></Column></Row></Email>);
      expect(new DOMParser().parseFromString(hidden, "text/html").querySelector("a")?.getAttribute("href")).toBe("java&#115;cript:alert(1)");
    });

    it("keep a table's plain text as 0.2.1's", () => {
      const template = ({ Row, Column, Paragraph, Table }: Release, Root: typeof Email) => <Root><Row><Column><Paragraph>Before</Paragraph><Table headers={["N", "E"]} data={[["Ada", '<a href="https://example.com">mail</a>'], ["", "x &amp; y"]]} /><Paragraph>After</Paragraph></Column></Row></Root>;
      for (const root of ["Email", "Page", "Document"] as const) expect(renderToPlainText(template(current, current[root] as typeof Email))).toBe(previous.renderToPlainText(template(previous, previous[root] as typeof Email)));
    });

    it("keep a label's paragraphs and an empty button's plain text as 0.2.1's", () => {
      const template = ({ Email, Row, Column, Button }: Release) => <Email><Row><Column><Button href="https://example.com" values={{ text: '<p style="margin:0">One</p><p style="margin:0">Two</p>' } as never} /><Button href="https://example.com">{""}</Button></Column></Row></Email>;
      expect(renderToPlainText(template(current))).toBe(previous.renderToPlainText(template(previous)));
    });
  });

  describe("of custom tools, Html blocks and a user's own markup", () => {
    const toolOf = ({ registerTool }: Release) =>
      registerTool({
        name: "open_tool",
        renderer: {
          exporters: { web: () => "<i>Tool</i>", email: () => "<i>Tool</i>" },
          head: { css: (values) => `#${values._meta.htmlID} i { color: red; }`, js: () => "var tool = 1;", tags: () => ['<meta name="tool">'] },
        },
      });
    const Mine = () => <section>Mine</section>;
    const templateOf = ({ Row, Column, Paragraph, Html }: Release, Tool: ReturnType<typeof toolOf>, Root: typeof Email) => (
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
    const Tool = toolOf(current);
    const PublishedTool = toolOf(previous);
    const template = (Root: typeof Email) => templateOf(current, Tool, Root);
    const ROOTS = [["Email", Email], ["Page", Page], ["Document", Document]] as Array<[string, typeof Email]>;

    it.each(ROOTS)("draw what the template holds, in the HTML and its parts (%s)", (_, Root) => {
      for (const written of [renderToHtml(template(Root)), renderToHtmlParts(template(Root)).body]) for (const words of ["Words", "<b>Html</b>", "<i>Tool</i>", "<section>Mine</section>"]) expect(written).toContain(words);
      expect(renderToPlainText(template(Root))).toContain("Html");
    });

    it.each(["Email", "Page", "Document"] as const)("draw what the template holds as the same words as 0.2.1 (%s)", (root) => {
      expect(renderToPlainText(template(current[root] as typeof Email))).toBe(previous.renderToPlainText(templateOf(previous, PublishedTool, previous[root] as typeof Email)));
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

    it("call a custom tool's exporter once, whatever else its template holds", () => {
      const exporter = vi.fn(() => "<i>Once</i>");
      const Once = registerTool({ name: "once", renderer: { exporters: { web: exporter, email: exporter } } });
      expect(renderToHtml(<Email><Row><Column><Once /></Column></Row></Email>)).toContain("<i>Once</i>");
      expect(exporter).toHaveBeenCalledTimes(1);
      exporter.mockClear();
      const pictured = <Email><Row><Column><Once /></Column></Row><Row backgroundImage={{ url: "https://example.com/bg.png" } as never}><Column><Paragraph>Hi</Paragraph></Column></Row></Email>;
      expect(renderToHtml(pictured)).toContain("<i>Once</i>");
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

  it("give renderToHtmlParts() a body of 0.2.1's shape: the root's host <div>, holding the <body> tag in an email or a printed document", () => {
    for (const root of ["Email", "Document", "Page"] as const) {
      const template = ({ Row, Column, Paragraph, [root]: Root }: Release) => <Root className="mine" style={{ outline: "1px solid red" }}><Row><Column><Paragraph>x</Paragraph></Column></Row></Root>;
      const body = renderToHtmlParts(template(current)).body;
      const before = previous.renderToHtmlParts(template(previous)).body;
      // The same host <div> as 0.2.1's, and a <body> tag where 0.2.1 has one.
      expect(body.slice(0, body.indexOf(">") + 1)).toBe(before.slice(0, before.indexOf(">") + 1));
      expect(/<body[\s>]/.test(body)).toBe(/<body[\s>]/.test(before));
      expect(body.endsWith("</div>")).toBe(true);
    }
    expect(renderToHtmlParts(<Email><Row><Column><Paragraph>x</Paragraph></Column></Row></Email>).body).toMatch(/^<div>\n<body[^>]*>[\s\S]*<\/body>\n<\/div>$/);
  });

  it.each(["a Row of today's components", "renderToHtmlParts() of a template"])("keep each block of the template where a custom tool's exporter renders %s of its own", (kind) => {
    const Nested = registerTool({
      name: kind.startsWith("a Row") ? "nested_row" : "nested_parts",
      renderer: {
        exporters: {
          email: () =>
            kind.startsWith("a Row")
              ? renderToStaticMarkup(<Row mode="email"><Column><Paragraph>Inner words</Paragraph></Column></Row>)
              : renderToHtmlParts(<Page><Row><Column><Paragraph>Inner words</Paragraph></Column></Row></Page>).body,
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
      expect(renderToPlainText(<Email><Row><Column><Row><Column><Paragraph>{"{% if orders > 1 %}Thanks{% endif %}"}</Paragraph></Column></Row></Column></Row></Email>)).toBe("{% if orders > 1 %}Thanks{% endif %}");
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
