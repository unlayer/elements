/**
 * Divider, Html, Menu and Social render their web and document HTML without react-dom: with react-dom/server's
 * renderers made to throw, in this test's modules and in the @unlayer/exporters module Node loads (where its own
 * web and document exporters of these blocks call them), each block renders on a page and in a document, the same
 * HTML as with them. (The rest of a render, which collects the template and renders its rows, still uses react-dom.)
 */
import { createRequire } from "node:module";
import { describe, expect, it, onTestFinished, vi } from "vitest";
import { DividerExporters, HtmlExporters, MenuExporters, SocialExporters } from "@unlayer/exporters";
import { Divider, Html, Menu, Social } from "../index";
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
