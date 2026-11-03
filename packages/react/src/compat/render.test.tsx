import { describe, expect, it, vi } from "vitest";
import { Button, Column, Document, Email, Html, Image, Page, Paragraph, Row, registerTool, renderToHtml, renderToHtmlParts, renderToPlainText } from "../index";
import { legacyRenderToHtml, legacyRenderToHtmlParts, legacyRenderToPlainText } from "../utils/render-to-html";
import { withRenderScope } from "../utils/render-scope";
import * as exporters from "@unlayer/exporters";
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
    const write = vi.spyOn(exporters.ContentExporters, "email");
    try {
      renderToHtml(<Email><Row><Column><Paragraph>One</Paragraph><Button href="https://example.com">Two</Button></Column></Row></Email>);
      expect(write).not.toHaveBeenCalled();
      // A block that keeps its legacy HTML (the user's own HTML) is the only one written by them.
      renderToHtml(<Email><Row><Column><Paragraph>One</Paragraph><Html html="<b>Two</b>" /></Column></Row></Email>);
      expect(write).toHaveBeenCalledTimes(1);
    } finally {
      write.mockRestore();
    }
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
