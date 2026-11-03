/**
 * Output against the previous release, so a change for existing users is never
 * silent. The realistic examples are rendered with this build and with the
 * last published Elements (`@unlayer/react-elements-previous`): their designs
 * and plain text must be the same. Their HTML is compared with a reviewed
 * snapshot, as it changed on purpose (a full document, escaping, device CSS):
 * any further change fails until the snapshot is updated (`vitest -u`) and
 * reviewed. After a release, move the alias in package.json to it.
 */
import { describe, expect, it, vi } from "vitest";
import { lines } from "./lines";
import type React from "react";

const EXAMPLES = [
  "AirbnbConfirmation",
  "LumaEventInvite",
  "MercuryReceipt",
  "MorningBrewDigest",
  "NikeDrop",
  "NotionWelcome",
  "ProductDigest",
  "StripeReceipt",
  "WarbyOrderShipped",
];

type Renderers = {
  renderToHtml: (element: React.ReactElement) => string;
  renderToJson: (element: React.ReactElement) => unknown;
  renderToPlainText: (element: React.ReactElement) => string;
};

/** An example's element, built with this build's components or the previous release's, and those renderers. */
async function example(name: string, release: "current" | "previous"): Promise<{ element: React.ReactElement; render: Renderers }> {
  vi.resetModules();
  if (release === "previous") vi.doMock("../index", () => import("@unlayer/react-elements-previous"));
  else vi.doUnmock("../index");
  const stories = await import(`../examples/${name}.stories.tsx`);
  const render = (release === "previous" ? await import("@unlayer/react-elements-previous") : await import("../index")) as unknown as Renderers;
  return { element: stories[name](), render };
}

/** This build's legacy renderer: today's components' own HTML, which blocks the new engine keeps as they are use. */
async function legacy(): Promise<Pick<Renderers, "renderToHtml">> {
  const { legacyRenderToHtml } = await import("../utils/render-to-html");
  return { renderToHtml: (element) => legacyRenderToHtml(element) };
}


describe.each(EXAMPLES)("%s", (name) => {
  it("gives the design and plain text the previous release gives", async () => {
    const previous = await example(name, "previous");
    const current = await example(name, "current");
    // Each example was built with its release's own components, and they render differently.
    expect(previous.element.type).toBe((previous.render as unknown as { Email: unknown }).Email);
    expect(current.element.type).toBe((current.render as unknown as { Email: unknown }).Email);
    expect(previous.element.type).not.toBe(current.element.type);
    expect(JSON.stringify(current.render.renderToJson(current.element), null, 1)).toBe(JSON.stringify(previous.render.renderToJson(previous.element), null, 1));
    expect(current.render.renderToPlainText(current.element)).toBe(previous.render.renderToPlainText(previous.element));
  });

  it("renders the reviewed HTML", async () => {
    const { element } = await example(name, "current");
    await expect(lines((await legacy()).renderToHtml(element))).toMatchFileSnapshot(`__snapshots__/examples/${name}.html`);
  });

  // renderToHtml() writes it through the new engine (RFC 0001 step 7): other HTML, which test:compare checks draws the same.
  it("renders the reviewed HTML through the new engine", async () => {
    const { element, render } = await example(name, "current");
    await expect(lines(render.renderToHtml(element))).toMatchFileSnapshot(`__snapshots__/examples/${name}.next.html`);
  });
});

describe("a component that renders plain HTML in a Column", () => {
  it("renders its HTML as the previous release does", async () => {
    const { legacyRenderToHtml } = await import("../utils/render-to-html");
    const releases = [await import("../index"), await import("@unlayer/react-elements-previous")] as any[];
    const Footer = () => <div dangerouslySetInnerHTML={{ __html: '<p>Footer copy</p><a href="https://example.com/unsubscribe">Unsubscribe</a>' }} />;
    const template = (E: any) => <E.Email><E.Row><E.Column><E.Paragraph>Start</E.Paragraph><Footer /><E.Paragraph>End</E.Paragraph></E.Column></E.Row></E.Email>;
    const [current, previous] = [legacyRenderToHtml(template(releases[0])), releases[1].renderToHtml(template(releases[1]))].map((html: string) => html.slice(html.indexOf("Start"), html.indexOf("End")));
    expect(current).toContain('<a href="https://example.com/unsubscribe">Unsubscribe</a>');
    expect(current).toBe(previous);
    // Through the new engine, it's an HTML block the new engine keeps as legacy writes it.
    expect(releases[0].renderToHtml(template(releases[0]))).toContain(previous.slice(previous.indexOf("<table"), previous.lastIndexOf("</table>")));
  });
});
