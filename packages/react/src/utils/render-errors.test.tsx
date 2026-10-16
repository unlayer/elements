/**
 * What the renderers do with a part of a template that fails (`onError`): a component that throws, a Row whose
 * Columns don't fit its layout, an exporter that fails. They all throw a RenderError by default, the synchronous and
 * the async ones alike; with `onError: "omit"` (render options, the root's `config`, an <UnlayerProvider>) or a
 * function, the part is left out of the HTML, the plain text and the design alike, and each part left out is listed.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { Column, ColumnLayouts, Email, Paragraph, RenderError, Row, UnlayerProvider, registerElementsTool, renderToHtml, renderToHtmlParts, renderToJson, renderToPlainText, type OnError } from "../index";
import * as asyncRenderers from "../async";

const Broken = () => {
  throw new Error("no data");
};
const Tool = registerElementsTool({ name: "failing_tool", values: {}, renderer: { exporters: { email: () => { throw new Error("exporter down"); } } } } as never) as React.FC;

/** A template with one of each part that fails, between parts that don't. */
const template = (config?: { onError?: OnError }) => (
  <Email config={config}>
    <Row><Column><Paragraph>First</Paragraph><Broken /><Paragraph>Second</Paragraph></Column></Row>
    <Row layout={ColumnLayouts.TwoEqual}><Column><Paragraph>Lonely</Paragraph></Column></Row>
    <Row><Column><Tool /><Paragraph>Third</Paragraph></Column></Row>
  </Email>
);
const FAILED = [
  ["[Unlayer] no data (in <Broken> at Row 1 › Column 1 › Broken)", "Broken", "Row 1 › Column 1 › Broken"],
  ["[Unlayer] A Row with the TwoEqual layout, for 2 Columns, has 1 (in <Row> at Row 2)", "Row", "Row 2"],
  ["[Unlayer] failing_tool failed to render: exporter down (in <failing_tool> at Row 3 › Column 1 › failing_tool)", "failing_tool", "Row 3 › Column 1 › failing_tool"],
];
const words = (text: string) => text.replace(/<[^>]+>/g, " ").split(/\s+/).filter((w) => /^(First|Second|Third|Lonely)$/.test(w));
const designWords = (design: unknown) => JSON.stringify(design).match(/First|Second|Third|Lonely/g) ?? [];

afterEach(() => vi.restoreAllMocks());

describe("a part of a template that fails", () => {
  it("fails every renderer by default, with a RenderError naming it, where it is, and what it threw", async () => {
    const element = template();
    const sync = [() => renderToHtml(element), () => renderToPlainText(element), () => renderToJson(element), () => renderToHtmlParts(element)];
    for (const render of sync) expect(render).toThrow(FAILED[0][0]);
    for (const render of [asyncRenderers.renderToHtml, asyncRenderers.renderToPlainText, asyncRenderers.renderToJson, asyncRenderers.renderToHtmlParts]) {
      await expect(render(element)).rejects.toThrow(FAILED[0][0]);
    }
    try {
      renderToHtml(element);
    } catch (error) {
      expect(error).toBeInstanceOf(RenderError);
      expect(error).toMatchObject({ name: "RenderError", component: "Broken", position: "Row 1 › Column 1 › Broken", cause: new Error("no data") });
    }
  });

  it.each([
    ["the render's options", (onError: OnError) => [template(), { onError }] as const],
    ["the root's config", (onError: OnError) => [template({ onError }), undefined] as const],
    ["an <UnlayerProvider>", (onError: OnError) => [<UnlayerProvider key="p" config={{ onError }}>{template()}</UnlayerProvider>, undefined] as const],
  ])("with onError: \"omit\" in %s, is left out of the HTML, the plain text and the design alike, each said once", async (_, given) => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const [element, options] = given("omit");
    const html = renderToHtml(element, options);
    expect(error.mock.calls.map((call) => String(call[0]))).toEqual(FAILED.map(([message]) => message.replace("[Unlayer] ", "[Unlayer] Left out: ")));
    expect(words(html)).toEqual(["First", "Second", "Third"]);
    expect(words(renderToPlainText(element, options))).toEqual(["First", "Second", "Third"]);
    const design = renderToJson(element, options);
    expect(designWords(design)).toEqual(["First", "Second", "Third"]);
    // The block whose exporter failed is in neither, and the ids still agree.
    expect(JSON.stringify(design)).not.toContain("failing_tool");
    expect(html).toContain('id="u_content_paragraph_3"');
    expect(JSON.stringify(design)).toContain('"htmlID":"u_content_text_3"');
    const parts = renderToHtmlParts(element, options);
    expect(parts.omitted.map((e) => [e.message, e.component, e.position])).toEqual(FAILED);
    const asyncParts = await asyncRenderers.renderToHtmlParts(element, options);
    expect(asyncParts.omitted.map((e) => e.message)).toEqual(FAILED.map(([message]) => message));
    expect(asyncParts.body).toBe(parts.body);
  });

  it("is given to a function instead (no console), which can fail the render by throwing it", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const given: RenderError[] = [];
    const html = renderToHtml(template(), { onError: (failure) => void given.push(failure) });
    expect(words(html)).toEqual(["First", "Second", "Third"]);
    expect(given.map((e) => e.position)).toEqual(FAILED.map(([, , position]) => position));
    expect(error).not.toHaveBeenCalled();
    const strict = (failure: RenderError) => {
      if (failure.component !== "Broken") throw failure;
    };
    expect(() => renderToHtml(template(), { onError: strict })).toThrow(FAILED[1][0]);
  });

  it("lists nothing when nothing failed", () => {
    expect(renderToHtmlParts(<Email><Row><Column><Paragraph>Fine</Paragraph></Column></Row></Email>, { onError: "omit" }).omitted).toEqual([]);
  });
});
