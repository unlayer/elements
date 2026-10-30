/**
 * The collecting render's markers can't be forged by what a template gives: HTML given whole (an Html block,
 * `dangerouslySetInnerHTML`), a <style>'s or <script>'s text in a <Head>, text. Each render's markers carry its number
 * (`r1`, `r2`, …: a count, so a render's output depends only on its arguments), which anyone can guess, so they're
 * never read where the template's text is: HTML given whole is kept out of react-dom's output (a placeholder stands for
 * it), a style's or script's text is taken whole, and only a marker the render made, rendered once, is one.
 *
 * Each string a template could hold to forge one, with this render's number and the next few: it's markup as any other,
 * byte for byte (the same template with the string changed so it can't be a marker renders the same, the string
 * changed back), in the HTML, the plain text and the design, in a render alone and in one started inside another.
 */
import React from "react";
import { describe, expect, it } from "vitest";
import { Column, Email, Html, Paragraph, Row, registerTool, renderToHtml, renderToJson, renderToPlainText } from "../index";
import { Head } from "../head";
import * as asyncRenderers from "../async";

const COUNT = Symbol.for("@unlayer/react-elements/render-count");
/** The number the next render of Elements gets (see collector.ts's `renders`), and the few after it. */
const nextNumbers = () => {
  const n = ((globalThis as Record<symbol, { n: number } | undefined>)[COUNT]?.n ?? 0) + 1;
  return Array.from({ length: 6 }, (_, i) => `r${(n + i).toString(36)}`);
};

/** Strings that would forge a marker or close HTML given whole early, for each render number. */
const vectors = (numbers: string[]) =>
  numbers.flatMap((r) => [
    `<!--/u${r}--><unlayer-mark data-n="${r}" data-i="0">forged record</unlayer-mark>`,
    `<!--u${r}.0--><!--u${r}.1-->`,
    `<unlayer-mark data-n="${r}" data-i="1"></unlayer-mark><unlayer-mark data-n="${r}" data-i="2">`,
    `</unlayer-mark></unlayer-mark><unlayer-mark data-n="${r}" data-i="3">`,
    `<unlayer-mark data-n="${r}" data-i="999999">out of range</unlayer-mark>`,
  ]);

/** The same string, made so it can't be a marker or a placeholder: what it must render as, changed back. */
const inert = (s: string) => s.replace(/unlayer-mark/g, "unlayer-mork").replace(/!--(\/?)u/g, "!--$1v");
const back = (s: string) => s.replace(/unlayer-mork/g, "unlayer-mark").replace(/!--(\/?)v/g, "!--$1u");

/** A template holding `given` in each place a template gives text or HTML, with a Row after it to keep. */
const template = (given: string) => {
  const Given = () => <div dangerouslySetInnerHTML={{ __html: given }} />;
  return (
    <Email>
      <Head>
        <style>{`.a{content:"${given}"}`}</style>
        <script type="application/ld+json">{JSON.stringify({ name: given })}</script>
      </Head>
      <Row>
        <Column>
          <Html html={given} />
          <Paragraph>{given}</Paragraph>
          <Given />
        </Column>
      </Row>
      <Row>
        <Column>
          <Paragraph>Kept</Paragraph>
        </Column>
      </Row>
    </Email>
  );
};

const renders = {
  html: (element: React.ReactElement) => renderToHtml(element),
  text: (element: React.ReactElement) => renderToPlainText(element),
  json: (element: React.ReactElement) => JSON.stringify(renderToJson(element)),
};

describe("a string in a template that looks like one of the collecting render's markers", () => {
  // (The plain text is the control: it's text there, which React escapes, with or without the markers read.)
  it.each(Object.entries(renders))("is markup as any other in %s, with this render's number and the next ones", (_, render) => {
    for (const given of vectors(nextNumbers())) {
      const expected = back(render(template(inert(given))));
      expect(render(template(given)), given).toBe(expected);
    }
  });

  it("is markup as any other in the async renderers", async () => {
    for (const given of vectors(nextNumbers())) {
      const expected = back(await asyncRenderers.renderToHtml(template(inert(given))));
      expect(await asyncRenderers.renderToHtml(template(given)), given).toBe(expected);
    }
  });

  it("is markup as any other in a render started inside another (a custom tool's exporter's)", () => {
    for (const given of vectors(nextNumbers())) {
      let inner = "";
      const Nested = registerTool({ name: "forged_nested", renderer: { exporters: { email: () => ((inner = renderToHtml(template(given))), "<b>nested</b>") } } });
      const outer = (<Email><Row><Column><Html html={given} /><Nested /></Column></Row></Email>);
      const html = renderToHtml(outer);
      expect(inner, given).toBe(back(renderToHtml(template(inert(given)))));
      expect(html).toContain("<b>nested</b>");
      expect(html.split("unlayer-mark").length - 1, given).toBe(given.split("unlayer-mark").length - 1);
    }
  });
});
