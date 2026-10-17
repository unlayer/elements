/**
 * Pages and documents render without react-dom: with react-dom/server's renderers made to throw, in this test's
 * modules and in the @unlayer/exporters module Node loads (where its own web and document exporters of Divider, Html,
 * Menu and Social call them), each of those blocks renders on a page and in a document, and so does a whole template
 * with every block, by every renderer, the same as with them. (@unlayer/exporters still imports react-dom/server, so
 * it has to be installed: it isn't called.)
 */
import { createRequire } from "node:module";
import { describe, expect, it, onTestFinished, vi } from "vitest";
import { DividerExporters, HtmlExporters, MenuExporters, SocialExporters } from "@unlayer/exporters";
import { Button, Column, Divider, Document, Heading, Html, Image, Menu, Page, PageBreak, Paragraph, Row, Social, Table, Video, renderToHtml, renderToHtmlParts, renderToJson, renderToPlainText } from "../index";
import * as Async from "../async";
import { UNLAYER_RENDER_KEY } from "../utils/create-component";

const { RENDERERS, poisoned } = vi.hoisted(() => ({
  RENDERERS: ["renderToString", "renderToStaticMarkup", "renderToNodeStream", "renderToStaticNodeStream", "renderToPipeableStream", "renderToReadableStream"] as const,
  poisoned: () => {
    throw new Error("react-dom/server can't run here");
  },
}));

// This test's modules (Elements' own) get a react-dom/server that can't render.
vi.mock("react-dom/server", async (actual) => ({ ...(await actual<object>()), ...Object.fromEntries(RENDERERS.map((name) => [name, poisoned])) }));

/** The react-dom/server @unlayer/exporters renders with (Node's module, which vi.mock doesn't reach). */
const exportersServer = createRequire(createRequire(import.meta.url).resolve("@unlayer/exporters"))("react-dom/server") as Record<string, unknown>;

/** Its renderers made to throw, until the test ends. */
function poisonExporters() {
  const saved = RENDERERS.map((name) => [name, exportersServer[name]] as const);
  for (const name of RENDERERS) if (name in exportersServer) exportersServer[name] = poisoned;
  onTestFinished(() => {
    for (const [name, renderer] of saved) if (renderer) exportersServer[name] = renderer;
  });
}

const BLOCKS = {
  Divider: [Divider, { width: "80%", border: { borderTopWidth: "2px", borderTopStyle: "dashed", borderTopColor: "#cccccc" }, textAlign: "left" }],
  Html: [Html, { html: '<p>Hello <b>{{name}}</b> &amp; "you"</p>' }],
  Menu: [Menu, { items: [{ text: "Home", href: "https://example.com/" }, { text: "Ünï <b>", href: "javascript:alert(1)", target: "_self" }, { text: "No link" }], separator: "|", linkColor: "#2563eb" }],
  Social: [Social, { icons: [{ name: "Facebook", url: "https://facebook.com/x" }, { name: "Email", url: "hi@example.com" }], iconType: "rounded", iconSize: 24, spacing: 6 }],
} as const;

/** A block's HTML as its component renders it in a mode (the hook-free render a Column calls). */
function blockHtml(Component: unknown, props: object, mode: "web" | "document"): string {
  const element = (Component as Record<string, (props: object) => { props: { dangerouslySetInnerHTML?: { __html: string } } }>)[UNLAYER_RENDER_KEY]({ ...props, mode });
  const html = element.props.dangerouslySetInnerHTML?.__html;
  if (html === undefined) throw new Error("rendered its error fallback");
  return html;
}

describe.each(Object.entries(BLOCKS))("%s", (name, [Component, props]) => {
  it.each(["web", "document"] as const)("renders in %s mode where react-dom/server can't render", (mode) => {
    const before = blockHtml(Component, props, mode);
    poisonExporters();
    // (@unlayer/exporters' own exporter for it fails now.)
    const upstream = { Divider: DividerExporters, Html: HtmlExporters, Menu: MenuExporters, Social: SocialExporters }[name]!;
    const exporter = (upstream[mode] ?? upstream.web) as (...args: unknown[]) => string;
    expect(() => exporter({ menu: { items: [{ text: "a" }] }, icons: { icons: [] }, html: "" })).toThrow("react-dom/server can't run here");
    const error = vi.spyOn(console, "error");
    try {
      const html = blockHtml(Component, props, mode);
      expect(html).toBe(before);
      expect(html.length).toBeGreaterThan(20);
      expect(error).not.toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });
});

describe("a whole template", () => {
  const content = (
    <>
      <Row cells={[1, 2]}>
        <Column>
          <Heading>Hello, <b>world</b></Heading>
          <Paragraph>
            Text with a <a href="https://example.com/">link</a>
          </Paragraph>
          <Button href="https://example.com/go">Go</Button>
          <Image src="https://example.com/a.png" alt="A" width={200} />
        </Column>
        <Column>
          <Divider width="80%" />
          <Html html="<p>Raw <b>HTML</b></p>" />
          <Menu items={[{ text: "Home", href: "https://example.com/" }, { text: <b>Bold</b> as unknown as string, href: "https://example.com/b" }]} separator="|" />
          <Social icons={[{ name: "Facebook", url: "https://facebook.com/x" }]} />
          <Table columns={2} rows={1} />
          <Video videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />
          <PageBreak />
        </Column>
      </Row>
    </>
  );
  const renders = {
    renderToHtml: (root: React.ReactElement) => renderToHtml(root),
    renderToHtmlParts: (root: React.ReactElement) => JSON.stringify(renderToHtmlParts(root)),
    renderToPlainText: (root: React.ReactElement) => renderToPlainText(root),
    renderToJson: (root: React.ReactElement) => JSON.stringify(renderToJson(root)),
    "async renderToHtml": (root: React.ReactElement) => Async.renderToHtml(root),
  };
  it.each(Object.entries(renders).flatMap(([name, render]) => [[name, "Page", Page, render], [name, "Document", Document, render]] as const))("%s renders a %s where react-dom/server can't render", async (_, __, Root, render) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    onTestFinished(() => warn.mockRestore());
    const root = <Root>{content}</Root>;
    const before = await render(root);
    poisonExporters();
    const error = vi.spyOn(console, "error");
    try {
      const after = await render(root);
      expect(after).toBe(before);
      expect(after).toContain("Bold");
      expect(error).not.toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });
});
