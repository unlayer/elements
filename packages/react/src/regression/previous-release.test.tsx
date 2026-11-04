/**
 * Output against the previous release, so a change for existing users is never
 * silent. The realistic examples are rendered with this build and with the
 * last published Elements (`@unlayer/react-elements-previous`): their designs,
 * plain text and what a reader gets from their HTML (its words, links and
 * images) must be the same. The HTML itself changed on purpose (the new engine
 * writes it), so it's compared with a reviewed snapshot: any further change
 * fails until the snapshot is updated (`vitest -u`) and reviewed. After a
 * release, move the alias in package.json to it.
 */
import { describe, expect, it, vi } from "vitest";
import { lines, reads } from "./lines";
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

describe.each(EXAMPLES)("%s", (name) => {
  it("gives the design, plain text, words, links and images the previous release gives", async () => {
    const previous = await example(name, "previous");
    const current = await example(name, "current");
    // Each example was built with its release's own components, and they render differently.
    expect(previous.element.type).toBe((previous.render as unknown as { Email: unknown }).Email);
    expect(current.element.type).toBe((current.render as unknown as { Email: unknown }).Email);
    expect(previous.element.type).not.toBe(current.element.type);
    expect(JSON.stringify(current.render.renderToJson(current.element), null, 1)).toBe(JSON.stringify(previous.render.renderToJson(previous.element), null, 1));
    expect(current.render.renderToPlainText(current.element)).toBe(previous.render.renderToPlainText(previous.element));
    expect(reads(current.render.renderToHtml(current.element))).toEqual(reads(previous.render.renderToHtml(previous.element)));
  });

  it("renders the reviewed HTML", async () => {
    const { element, render } = await example(name, "current");
    await expect(lines(render.renderToHtml(element))).toMatchFileSnapshot(`__snapshots__/examples/${name}.html`);
  });
});

describe("a component that renders plain HTML in a Column", () => {
  it("keeps its HTML as the previous release does, where it was written", async () => {
    const releases = [await import("../index"), await import("@unlayer/react-elements-previous")] as any[];
    const markup = '<p>Footer copy</p><a href="https://example.com/unsubscribe">Unsubscribe</a>';
    const Footer = () => <div dangerouslySetInnerHTML={{ __html: markup }} />;
    const template = (E: any) => <E.Email><E.Row><E.Column><E.Paragraph>Start</E.Paragraph><Footer /><E.Paragraph>End</E.Paragraph></E.Column></E.Row></E.Email>;
    const [current, previous] = releases.map((E) => E.renderToHtml(template(E)) as string);
    expect(previous).toContain(markup);
    expect(current).toContain(markup);
    expect(reads(current)).toEqual(reads(previous));
    expect(reads(current)).toMatchObject({ words: ["Start", "Footer", "copy", "Unsubscribe", "End"], links: ["https://example.com/unsubscribe"] });
  });
});
