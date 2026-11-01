// @vitest-environment node
/**
 * The async renderers' collecting render (react-dom's stream, waited for whole): siblings' promises start at once,
 * the output is in tree order whatever settles first, ids follow the tree, and the error a render fails with is the
 * first in tree order.
 */
import { describe, expect, it, vi } from "vitest";
import React, { useId } from "react";
import { Column, Email, Paragraph, RenderError, Row } from "../index";
import { renderToHtml, renderToHtmlParts, renderToJson } from "../async";

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

describe("the async collecting render", () => {
  it("starts siblings at once, and writes them in tree order", async () => {
    const started: string[] = [];
    const Late = async ({ text, ms }: { text: string; ms: number }) => {
      started.push(text);
      await sleep(ms);
      return <Paragraph>{text}</Paragraph>;
    };
    const render = () => renderToHtml(<Email><Row><Column><Late text="slow" ms={300} /><Late text="medium" ms={200} /><Late text="fast" ms={100} /></Column></Row></Email>);
    // At once: about the slowest one's time (300 ms), not the three's (600), the fastest of three renders where one
    // takes longer (a busy machine's timers run late; this is waiting, not work, so the limit isn't scaled).
    let start = performance.now();
    const html = await render();
    let ms = performance.now() - start;
    expect(started).toEqual(["slow", "medium", "fast"]);
    for (let i = 0; i < 2 && ms >= 450; i++) {
      start = performance.now();
      await render();
      ms = Math.min(ms, performance.now() - start);
    }
    expect(ms).toBeLessThan(450);
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

  it("fails with the first error in tree order once everything in it has settled, whatever fails first", async () => {
    const Fails = async ({ text, ms }: { text: string; ms: number }) => {
      await sleep(ms);
      throw new Error(text);
    };
    // (What's after the errors, slower than both: the render waits for it, as React's stream does.)
    let settled = 0;
    const Slow = async () => (await sleep(60), settled++, <Paragraph>Slow</Paragraph>);
    for (const [first, second] of [[5, 30], [30, 5]]) {
      const before = settled;
      const email = <Email><Row><Column><Fails text="first" ms={first} /><Fails text="second" ms={second} /></Column></Row><Row><Column><Slow /></Column></Row></Email>;
      await expect(renderToHtml(email)).rejects.toMatchObject({ message: "[Unlayer] first (in <Fails> at Row 1 › Column 1 › Fails)" });
      expect(settled).toBe(before + 1);
    }
    // A class whose constructor or render throws, the same.
    class Broken extends React.Component<{ where: "constructor" | "render" }> {
      constructor(props: { where: "constructor" | "render" }) {
        super(props);
        if (props.where === "constructor") throw new Error("constructor failed");
      }
      render(): React.ReactNode {
        throw new Error("render failed");
      }
    }
    for (const where of ["constructor", "render"] as const) {
      const email = <Email><Row><Column><Broken where={where} /></Column></Row><Row><Column><Slow /></Column></Row></Email>;
      await expect(renderToHtml(email)).rejects.toMatchObject({ message: `[Unlayer] ${where} failed (in <Broken> at Row 1 › Column 1 › Broken)` });
    }
    // And markup React can't write (an <img> with children), the same.
    const img = React.createElement("img", { src: "https://example.com/a.png" }, "a child");
    await expect(renderToHtml(<Email><Row><Column>{img}</Column></Row><Row><Column><Slow /></Column></Row></Email>)).rejects.toMatchObject({ name: "RenderError", component: "img", position: "Row 1 › Column 1 › img" });
    // A lazy component whose load fails, in a <Suspense> or not (React would stop the whole render at once for one
    // outside any), fails where it is in the tree, as any part does.
    const failsLater = <T,>(ms = 20, text = "lazy") => sleep(ms).then((): T => {
      throw new Error(text);
    });
    const FailsAfter = () => {
      throw new Error("after");
    };
    const LoadsLater = React.lazy(() => sleep(20).then(() => ({ default: () => <Paragraph>Loaded</Paragraph> })));
    await expect(renderToHtml(<Email><Row><Column>{img}<LoadsLater /></Column></Row></Email>)).rejects.toMatchObject({ component: "img" });
    for (const suspense of [false, true]) {
      const LazyFails = React.lazy(() => failsLater<{ default: React.ComponentType }>());
      const FailsSooner = React.lazy(() => failsLater<{ default: React.ComponentType }>(5));
      const wrap = (node: React.ReactNode) => (suspense ? <React.Suspense fallback={null}>{node}</React.Suspense> : node);
      const at = suspense ? "in a <Suspense>" : "in none";
      await expect(renderToHtml(<Email><Row><Column>{wrap(<LazyFails />)}<FailsAfter /></Column></Row></Email>), at).rejects.toMatchObject({ message: expect.stringMatching(/^\[Unlayer\] lazy/) });
      await expect(renderToHtml(<Email><Row><Column><LoadsLater /><Fails text="first in the tree" ms={30} />{wrap(<FailsSooner />)}</Column></Row></Email>), at).rejects.toMatchObject({ message: expect.stringMatching(/^\[Unlayer\] first in the tree/) });
      await expect(renderToHtml(<Email><Row><Column>{wrap(<FailsSooner />)}<Slow /></Column></Row></Email>), at).rejects.toMatchObject({ message: expect.stringMatching(/^\[Unlayer\] lazy/) });
      // Two whose loads fail, the second sooner (React tells them as they fail): each is where it is. (React 18.0 writes
      // no digest where a boundary failed: there, they're in the order React told them, both said.)
      const First = React.lazy(() => failsLater<{ default: React.ComponentType }>(30, "first lazy"));
      const Second = React.lazy(() => failsLater<{ default: React.ComponentType }>(5, "second lazy"));
      const two = <Email><Row><Column><Paragraph>Kept</Paragraph>{wrap(<First />)}{wrap(<Second />)}</Column></Row></Email>;
      const digests = !React.version.startsWith("18.0.");
      await expect(renderToHtml(two), at).rejects.toMatchObject({ message: expect.stringMatching(digests ? /^\[Unlayer\] first lazy/ : /^\[Unlayer\] (first|second) lazy/) });
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      try {
        const parts = await renderToHtmlParts(two, { onError: "omit" });
        expect(parts.body, at).toContain("Kept");
        const omitted = parts.omitted.map((e) => (e.cause as Error).message);
        expect(digests ? omitted : [...omitted].sort(), at).toEqual(["first lazy", "second lazy"]);
      } finally {
        error.mockRestore();
      }
    }
    if ((React as unknown as { use?: unknown }).use) {
      // A promise given as a child (React 19), the same.
      const header = failsLater<string>(20, "promised");
      header.catch(() => {});
      const promised = <Email><Row><Column><div>{header as unknown as React.ReactNode}</div><FailsAfter /></Column></Row></Email>;
      await expect(renderToHtml(promised)).rejects.toMatchObject({ message: expect.stringMatching(/^\[Unlayer\] promised/) });
    }
    // What an async component renders is before what's after it in the tree, though React calls it once that's settled,
    // after what's after it: a component it returns, and markup in it (the negative control: what's after it alone).
    const Inside = () => {
      throw new Error("inside");
    };
    const After = () => {
      throw new Error("after");
    };
    const Later = async ({ inside }: { inside: React.ReactNode }) => (await sleep(10), <div>{inside}</div>);
    const order = (inside: React.ReactNode) => <Email><Row><Column><Later inside={inside} /><After /></Column></Row></Email>;
    await expect(renderToHtml(order(<Inside />))).rejects.toMatchObject({ component: "Inside", position: "Row 1 › Column 1 › Later › Inside" });
    await expect(renderToHtml(order(img))).rejects.toMatchObject({ component: "img" });
    await expect(renderToHtml(order(null))).rejects.toMatchObject({ component: "After" });
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
});

describe("one element placed twice (`const item = <Item />` in two Rows)", () => {
  // The async renderers kept what an async component gave by its props, which one element placed twice shares: it was
  // called once, and its second place took the first's.
  it("calls an async component in each place, as the synchronous renderers call a component", async () => {
    let calls = 0;
    const Item = async () => {
      const n = ++calls;
      await new Promise((done) => setTimeout(done, 2));
      return <Paragraph>{`call ${n}`}</Paragraph>;
    };
    const item = <Item />;
    const html = await renderToHtml(<Email><Row><Column>{item}</Column></Row><Row><Column>{item}</Column></Row></Email>);
    expect(calls).toBe(2);
    expect(html).toContain("call 1");
    expect(html).toContain("call 2");
    // (The negative control: two elements, each called once.)
    calls = 0;
    await renderToHtml(<Email><Row><Column><Item /></Column></Row><Row><Column><Item /></Column></Row></Email>);
    expect(calls).toBe(2);
  });
});
