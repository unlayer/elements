/**
 * What the renderers do with a part of a template that fails (`onError`): a component that throws, a Row whose
 * Columns don't fit its layout, an exporter that fails. They all throw a RenderError by default, the synchronous and
 * the async ones alike; with `onError: "omit"` (render options, the root's `config`, an <UnlayerProvider>) or a
 * function, the part is left out of the HTML, the plain text and the design alike, and each part left out is listed.
 * A Row or Column whose own exporter fails is left out as a block is: the render is the template's without it.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { ColumnExporters, RowExporters } from "@unlayer/exporters";
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

  it("renderToJson renders no HTML by default (an exporter that fails fails the HTML, which then has nothing to disagree with), and only with onError the HTML it needs to leave the same parts out", () => {
    let calls = 0;
    const Counted = registerElementsTool({ name: "counted_tool", values: {}, renderer: { exporters: { email: () => (calls++, "<p>counted</p>") } } } as never) as React.FC;
    const email = <Email><Row><Column><Counted /><Paragraph>Text</Paragraph></Column></Row></Email>;
    expect(JSON.stringify(renderToJson(email))).toContain("counted_tool");
    expect(calls).toBe(0);
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(JSON.stringify(renderToJson(email, { onError: "omit" }))).toContain("counted_tool");
    expect(calls).toBe(1);
    expect(JSON.stringify(renderToJson(template(), { onError: "omit" }))).not.toContain("failing_tool");
  });

  it("lists nothing when nothing failed", () => {
    expect(renderToHtmlParts(<Email><Row><Column><Paragraph>Fine</Paragraph></Column></Row></Email>, { onError: "omit" }).omitted).toEqual([]);
  });
});

describe("a Row or Column whose exporter fails", () => {
  // The Row's or Column's exporter fails for the one with this background (the editor's exporters, as they are, for the rest).
  const failing = (exporters: Record<string, (...args: any[]) => string>, color: string, valuesAt: number) => {
    const email = exporters.email;
    vi.spyOn(exporters, "email").mockImplementation((...args: any[]) => {
      if (args[valuesAt]?.backgroundColor === color) throw new Error("exporter down");
      return email(...args);
    });
  };
  const rows = (failingRow: React.ReactNode, columns: React.ReactNode) => (
    <Email>
      <Row><Column><Paragraph>First</Paragraph></Column></Row>
      {failingRow}
      {columns}
    </Email>
  );
  const red = <Row backgroundColor="#ff0000"><Column><Paragraph>Second</Paragraph></Column></Row>;
  const cells = (failingColumn: boolean) => (
    <Row cells={failingColumn ? [2, 1, 1] : [2, 1]}>
      <Column><Paragraph>Third</Paragraph></Column>
      {failingColumn && <Column backgroundColor="#00ff00"><Paragraph>Lonely</Paragraph></Column>}
      <Column><Paragraph>Fourth</Paragraph></Column>
    </Row>
  );
  const renders = (element: React.ReactElement, options?: { onError?: OnError }) => ({
    html: renderToHtml(element, options),
    text: renderToPlainText(element, options),
    design: renderToJson(element, options),
  });

  it("fails the render by default, naming it and where it is", async () => {
    failing(RowExporters as never, "#ff0000", 1);
    const element = rows(red, null);
    expect(() => renderToHtml(element)).toThrow("[Unlayer] Row failed to render: exporter down (in <Row> at Row 2)");
    await expect(asyncRenderers.renderToHtml(element)).rejects.toThrow("(in <Row> at Row 2)");
    try {
      renderToPlainText(element);
    } catch (error) {
      expect(error).toMatchObject({ name: "RenderError", component: "Row", position: "Row 2", cause: new Error("exporter down") });
    }
    // The design calls no exporter.
    expect(designWords(renderToJson(element))).toEqual(["First", "Second"]);
    vi.restoreAllMocks();
    failing(ColumnExporters as never, "#00ff00", 1);
    expect(() => renderToHtml(rows(null, cells(true)))).toThrow("[Unlayer] Column failed to render: exporter down (in <Column> at Row 2 › Column 2)");
  });

  it("with onError: \"omit\", is left out of the HTML, the plain text and the design: they're the template's without it", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    failing(RowExporters as never, "#ff0000", 1);
    failing(ColumnExporters as never, "#00ff00", 1);
    const element = rows(red, cells(true));
    // A Column with its cell (the Columns after it move up); the Row's ids go to the next Row, its Column's to the next.
    expect(renders(element, { onError: "omit" })).toEqual(renders(rows(null, cells(false))));
    // Each said once a render.
    error.mockClear();
    renderToHtml(element, { onError: "omit" });
    expect(error.mock.calls.map((call) => String(call[0]))).toEqual([
      "[Unlayer] Left out: Row failed to render: exporter down (in <Row> at Row 2)",
      "[Unlayer] Left out: Column failed to render: exporter down (in <Column> at Row 3 › Column 2)",
    ]);
    const omitted = (parts: { omitted: RenderError[] }) => parts.omitted.map((e) => [e.component, e.position]);
    expect(omitted(renderToHtmlParts(element, { onError: "omit" }))).toEqual([["Row", "Row 2"], ["Column", "Row 3 › Column 2"]]);
    expect(omitted(await asyncRenderers.renderToHtmlParts(element, { onError: "omit" }))).toEqual([["Row", "Row 2"], ["Column", "Row 3 › Column 2"]]);
    const given: RenderError[] = [];
    expect(renderToHtml(element, { onError: (failure) => void given.push(failure) })).toBe(renders(rows(null, cells(false))).html);
    expect(given.map((e) => e.position)).toEqual(["Row 2", "Row 3 › Column 2"]);
  });

  it("leaves a Row out with its last Column, and a Row with a layout gives its other Columns their cells", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    failing(ColumnExporters as never, "#00ff00", 1);
    const alone = <Row><Column backgroundColor="#00ff00"><Paragraph>Lonely</Paragraph></Column></Row>;
    expect(renders(rows(alone, null), { onError: "omit" })).toEqual(renders(rows(null, null)));
    const laidOut = (failingColumn: boolean) => (
      <Row layout={failingColumn ? ColumnLayouts.TwoEqual : undefined}>
        {failingColumn && <Column backgroundColor="#00ff00"><Paragraph>Lonely</Paragraph></Column>}
        <Column><Paragraph>Third</Paragraph></Column>
      </Row>
    );
    expect(renders(rows(null, laidOut(true)), { onError: "omit" })).toEqual(renders(rows(null, laidOut(false))));
  });
});

describe("a part that suspends in a <Suspense>", () => {
  // `<Suspense>` handles it, whatever `onError` says: the synchronous renderers render its fallback, as react-dom's
  // synchronous render does, and the async ones wait for it. Nothing failed, so nothing is left out or said.
  const later = <T,>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), 5));
  /** Its data suspends until it's there (React 18's Suspense: a thrown promise), once per template made. */
  const thrown = () => {
    const data: { value?: string; promise?: Promise<void> } = {};
    return () => {
      data.promise ??= later("Price").then((value) => void (data.value = value));
      if (data.value === undefined) throw data.promise;
      return <Paragraph>{data.value}</Paragraph>;
    };
  };
  const use = (React as unknown as { use?: <T>(promise: PromiseLike<T>) => T }).use;
  const PRICES: Array<[string, () => React.FC]> = [
    ["an async component", () => async () => <Paragraph>{await later("Price")}</Paragraph>],
    ["a component that throws a promise", thrown],
    ...(use ? [["a component that `use()`s a promise (React 19)", () => {
      const promise = later("Price");
      return () => <Paragraph>{use(promise)}</Paragraph>;
    }] as [string, () => React.FC]] : []),
  ];
  const template = (Price: React.FC, config?: { onError?: OnError }) => (
    <Email config={config}>
      <Row><Column><Paragraph>First</Paragraph></Column></Row>
      <React.Suspense fallback={<Row><Column><Paragraph>Loading</Paragraph></Column></Row>}>
        <Row><Column><Price /></Column></Row>
      </React.Suspense>
    </Email>
  );
  const shown = (text: string) => text.match(/First|Loading|Price/g) ?? [];
  const given: RenderError[] = [];
  const POLICIES: Array<[string, { onError?: OnError } | undefined]> = [
    ["by default", undefined],
    ['with onError: "omit"', { onError: "omit" }],
    ["with an onError function", { onError: (failure) => void given.push(failure) }],
  ];

  describe.each(PRICES)("%s", (_, price) => {
    it.each(POLICIES)("renders the fallback in the synchronous renderers %s", (_, config) => {
      const error = vi.spyOn(console, "error");
      given.length = 0;
      expect(shown(renderToHtml(template(price(), config)))).toEqual(["First", "Loading"]);
      expect(shown(renderToPlainText(template(price(), config)))).toEqual(["First", "Loading"]);
      expect(shown(JSON.stringify(renderToJson(template(price(), config))))).toEqual(["First", "Loading"]);
      expect(renderToHtmlParts(template(price(), config)).omitted).toEqual([]);
      expect(error).not.toHaveBeenCalled();
      expect(given).toEqual([]);
    });

    it.each(POLICIES)("waits for it in the async renderers %s", async (_, config) => {
      const error = vi.spyOn(console, "error");
      given.length = 0;
      expect(shown(await asyncRenderers.renderToHtml(template(price(), config)))).toEqual(["First", "Price"]);
      expect(shown(await asyncRenderers.renderToPlainText(template(price(), config)))).toEqual(["First", "Price"]);
      expect(shown(JSON.stringify(await asyncRenderers.renderToJson(template(price(), config))))).toEqual(["First", "Price"]);
      expect((await asyncRenderers.renderToHtmlParts(template(price(), config))).omitted).toEqual([]);
      expect(error).not.toHaveBeenCalled();
      expect(given).toEqual([]);
    });
  });
});
