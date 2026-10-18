// @vitest-environment node
/**
 * The async walk: siblings' promises start at once, the output is in tree order whatever settles first, ids follow
 * the tree, the error a render fails with is the first in tree order, and React's hooks dispatcher is the walker's
 * only while it calls a component (never across an await).
 */
import { describe, expect, it, vi } from "vitest";
import React, { useId } from "react";
import { Column, Email, Paragraph, RenderError, Row, renderToHtml as renderToHtmlSync } from "../index";
import { renderToHtml, renderToHtmlParts, renderToJson } from "../async";
import { theSlot } from "./dispatcher";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** A seeded random number generator (mulberry32), for delays. */
function random(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A template whose parts load at random: async blocks, an async component of Rows, nested ones, all with ids. */
function template(name: string, delay: () => number) {
  const Block = async ({ text }: { text: string }) => {
    const id = useId();
    await sleep(delay());
    return <Paragraph>{`${name} ${text} ${id}`}</Paragraph>;
  };
  const Nested = async () => {
    await sleep(delay());
    return <><Block text="nested one" /><Block text="nested two" /></>;
  };
  const Rows = async () => {
    await sleep(delay());
    return [1, 2].map((n) => <Row key={n}><Column><Block text={`row ${n}`} /><Nested /></Column></Row>);
  };
  return (
    <Email>
      <Row><Column><Block text="first" /><Block text="second" /></Column></Row>
      <Rows />
      <Row><Column><Paragraph>{`${name} last`}</Paragraph><Block text="third" /></Column></Row>
    </Email>
  );
}

describe("the async walk", () => {
  it("starts siblings at once, and writes them in tree order", async () => {
    const started: string[] = [];
    const Late = async ({ text, ms }: { text: string; ms: number }) => {
      started.push(text);
      await sleep(ms);
      return <Paragraph>{text}</Paragraph>;
    };
    const t0 = Date.now();
    const html = await renderToHtml(<Email><Row><Column><Late text="slow" ms={60} /><Late text="medium" ms={40} /><Late text="fast" ms={20} /></Column></Row></Email>);
    // At once: about the slowest one's time, not the three's.
    expect(Date.now() - t0).toBeLessThan(110);
    expect(started).toEqual(["slow", "medium", "fast"]);
    expect(html.indexOf("slow")).toBeLessThan(html.indexOf("medium"));
    expect(html.indexOf("medium")).toBeLessThan(html.indexOf("fast"));
  });

  it("gives byte-identical output whatever order things settle in, ids by their place in the tree", async () => {
    const outputs = new Set<string>();
    const designs = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) {
      const delay = random(seed);
      const ms = () => Math.floor(delay() * 8);
      outputs.add(await renderToHtml(template("A", ms)));
      designs.add(JSON.stringify(await renderToJson(template("A", ms))));
    }
    expect(outputs.size).toBe(1);
    expect(designs.size).toBe(1);
    expect([...outputs][0]).toMatch(/A nested two (:R\w+:|«R\w+»|_R_\w+_)/);
  });

  it("keeps two renders under way at once apart, with random delays", async () => {
    const expected = { A: await renderToHtml(template("A", () => 0)), B: await renderToHtml(template("B", () => 0)) };
    for (let seed = 1; seed <= 20; seed++) {
      const delay = random(seed);
      const ms = () => Math.floor(delay() * 10);
      const [a, b] = await Promise.all([renderToHtml(template("A", ms)), renderToHtml(template("B", ms))]);
      expect(a).toBe(expected.A);
      expect(b).toBe(expected.B);
    }
  });

  it("fails with the first error in tree order, whatever fails first, without waiting for what comes after it", async () => {
    const Fails = async ({ text, ms }: { text: string; ms: number }) => {
      await sleep(ms);
      throw new Error(text);
    };
    const Never = () => {
      throw new Promise(() => {});
    };
    for (const [first, second] of [[5, 30], [30, 5]]) {
      const email = <Email><Row><Column><Fails text="first" ms={first} /><Fails text="second" ms={second} /></Column></Row><Row><Column><Never /></Column></Row></Email>;
      await expect(renderToHtml(email)).rejects.toMatchObject({ message: "[Unlayer] first (in <Fails> at Row 1 › Column 1 › Fails)" });
    }
  });

  it("leaves failed parts out (onError: \"omit\"), listed in tree order whatever fails first", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const Fails = async ({ text, ms }: { text: string; ms: number }) => {
        await sleep(ms);
        throw new Error(text);
      };
      for (const [first, second] of [[5, 30], [30, 5]]) {
        const email = <Email><Row><Column><Paragraph>Kept</Paragraph><Fails text="first" ms={first} /><Fails text="second" ms={second} /></Column></Row></Email>;
        const parts = await renderToHtmlParts(email, { onError: "omit" });
        expect(parts.body).toContain("Kept");
        expect(parts.omitted.map((e) => [e.message, e.position])).toEqual([
          ["[Unlayer] first (in <Fails> at Row 1 › Column 1 › Fails)", "Row 1 › Column 1 › Fails"],
          ["[Unlayer] second (in <Fails> at Row 1 › Column 1 › Fails 2)", "Row 1 › Column 1 › Fails 2"],
        ]);
        expect(parts.omitted.every((e) => e instanceof RenderError)).toBe(true);
      }
    } finally {
      error.mockRestore();
    }
  });

  it("puts React's dispatcher back after each component, never holding it across an await", async () => {
    const slot = theSlot()!;
    const before = slot.get();
    const seen: unknown[] = [];
    const Watch = async () => {
      const id = useId(); // the walker's, while it calls this
      await sleep(1);
      seen.push(slot.get()); // after an await: not the walker's
      return <Paragraph>{id}</Paragraph>;
    };
    const render = renderToHtml(<Email><Row><Column><Watch /><Watch /></Column></Row></Email>);
    // While the render waits.
    seen.push(slot.get());
    await render;
    expect(seen).toEqual([before, before, before]);
    expect(slot.get()).toBe(before);
    // The synchronous renderers too, and one inside another.
    const Inner = () => <Paragraph>{renderToHtmlSync(<Email><Row><Column><Paragraph>inner</Paragraph></Column></Row></Email>).length > 0 ? "nested" : ""}</Paragraph>;
    expect(renderToHtmlSync(<Email><Row><Column><Inner /></Column></Row></Email>)).toContain("nested");
    expect(slot.get()).toBe(before);
    expect(React.isValidElement(<Inner />)).toBe(true);
  });
});
