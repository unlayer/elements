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

/** One tag per line, so a change shows as the lines it touches. */
export function lines(html: string): string {
  return `${html.replace(/>\s*</g, ">\n<").trim()}\n`;
}

describe.each(EXAMPLES)("%s", (name) => {
  it("gives the design and plain text the previous release gives", async () => {
    const previous = await example(name, "previous");
    const current = await example(name, "current");
    // Each example was built with its release's own components, and they render differently.
    expect(previous.element.type).toBe((previous.render as unknown as { Email: unknown }).Email);
    expect(current.element.type).toBe((current.render as unknown as { Email: unknown }).Email);
    expect(previous.element.type).not.toBe(current.element.type);
    expect(previous.render.renderToHtml(previous.element)).not.toBe(current.render.renderToHtml(current.element));
    expect(JSON.stringify(current.render.renderToJson(current.element), null, 1)).toBe(JSON.stringify(previous.render.renderToJson(previous.element), null, 1));
    expect(current.render.renderToPlainText(current.element)).toBe(previous.render.renderToPlainText(previous.element));
  });

  it("renders the reviewed HTML", async () => {
    const { element, render } = await example(name, "current");
    await expect(lines(render.renderToHtml(element))).toMatchFileSnapshot(`__snapshots__/examples/${name}.html`);
  });
});

describe("a component that renders plain HTML in a Column", () => {
  it("renders its HTML as the previous release does", async () => {
    const releases = [await import("../index"), await import("@unlayer/react-elements-previous")] as any[];
    const [current, previous] = releases.map((E) => {
      const Footer = () => <div dangerouslySetInnerHTML={{ __html: '<p>Footer copy</p><a href="https://example.com/unsubscribe">Unsubscribe</a>' }} />;
      const html: string = E.renderToHtml(
        <E.Email><E.Row><E.Column><E.Paragraph>Start</E.Paragraph><Footer /><E.Paragraph>End</E.Paragraph></E.Column></E.Row></E.Email>
      );
      return html.slice(html.indexOf("Start"), html.indexOf("End"));
    });
    expect(current).toContain('<a href="https://example.com/unsubscribe">Unsubscribe</a>');
    expect(current).toBe(previous);
  });
});
