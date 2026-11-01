// @vitest-environment node
/**
 * Two copies of Elements in one process (a package's CommonJS build, its ESM one rendering; a package still on
 * another version), with one React: their Markdown and code blocks share the work of the render another copy runs.
 */
import { createRequire } from "node:module";
import { beforeAll, describe, expect, it, vi } from "vitest";
import React from "react";
import { Column, Email, Row, renderToHtml as renderToHtmlSync } from "../index";
import { CodeBlock } from "../code";
import { Markdown } from "../markdown";

describe("Markdown and code blocks of another copy of Elements (a package's CommonJS build, its ESM one rendering)", () => {
  // Their entries reached the render's work through the main entry they imported, and another copy's render was none
  // of theirs: each block had all of it (12 fences of 8 KB of Java took 4.5 s, 562 sparse tables 195 MB of HTML).
  const SLOT = Symbol.for("@unlayer/react-elements/render-work");
  const fill = (unit: string, n: number) => unit.repeat(Math.ceil(n / unit.length)).slice(0, n);
  const java = fill("int a = 1;\n", 7999) + ";";
  const colored = (html: string) => html.split('<pre style="').slice(1).map((block) => block.includes('<span style="'));
  const blocks = (n: number, block: (i: number) => React.ReactElement) => (
    <Email>
      <Row>
        <Column>{Array.from({ length: n }, (_, i) => block(i))}</Column>
      </Row>
    </Email>
  );
  // This file's (the copy renderToHtmlSync is), and another's.
  const own = { CodeBlock, Markdown };
  let other: typeof import("../code") & typeof import("../markdown") & { renderToHtml: typeof renderToHtmlSync };
  beforeAll(async () => {
    vi.resetModules();
    other = { ...(await import("../code")), ...(await import("../markdown")), renderToHtml: (await import("../index")).renderToHtml };
  });

  it("share the work of the render another copy runs, as its own copy's blocks do", () => {
    for (const { CodeBlock, Markdown } of [own, other]) {
      expect(colored(renderToHtmlSync(blocks(3, (i) => <CodeBlock key={i} language="java" code={java} />)))).toEqual([true, false, false]);
      expect(colored(renderToHtmlSync(blocks(3, (i) => <Markdown key={i} markdown={"```java\n" + java + "\n```"} />)))).toEqual([true, false, false]);
    }
    // And its tables, the cells one Markdown of them all has.
    const table = "|" + "a|".repeat(20) + "\n|" + "-|".repeat(20) + "\n" + "|\n".repeat(49);
    const tables = (html: string) => (html.match(/<table[^>]*class="[^"]*u_content_table/g) ?? []).length;
    const sparse = (Markdown: typeof own.Markdown) => renderToHtmlSync(blocks(40, (i) => <Markdown key={i} html="escape" markdown={table} />), { onError: "omit" });
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(tables(sparse(other.Markdown))).toBe(tables(sparse(own.Markdown)));
    expect(tables(sparse(own.Markdown))).toBeLessThan(10);
  });

  it("keep work of their own where the other copy's is another version's (its slot's another protocol)", async () => {
    const global = globalThis as Record<symbol, unknown>;
    const slot = global[SLOT];
    global[SLOT] = { version: 0, shared: undefined };
    try {
      vi.resetModules();
      const skewed = { ...(await import("../code")), ...(await import("../markdown")), renderToHtml: (await import("../index")).renderToHtml };
      const fence = "```java\n" + java + "\n```";
      // Its own renders share their work among its blocks; this copy's renders' work it can't read: each block has its own.
      expect(colored(skewed.renderToHtml(blocks(3, (i) => <skewed.CodeBlock key={i} language="java" code={java} />)))).toEqual([true, false, false]);
      expect(colored(renderToHtmlSync(blocks(3, (i) => <skewed.CodeBlock key={i} language="java" code={java} />)))).toEqual([true, true, true]);
      expect(colored(renderToHtmlSync(blocks(3, (i) => <own.CodeBlock key={i} language="java" code={java} />)))).toEqual([true, false, false]);
      // Its Markdown the same: its fences share its own renders' budget, and each has its own in this copy's render.
      expect(colored(skewed.renderToHtml(blocks(3, (i) => <skewed.Markdown key={i} markdown={fence} />)))).toEqual([true, false, false]);
      expect(colored(renderToHtmlSync(blocks(3, (i) => <skewed.Markdown key={i} markdown={fence} />)))).toEqual([true, true, true]);
      expect(colored(renderToHtmlSync(blocks(3, (i) => <own.Markdown key={i} markdown={fence} />)))).toEqual([true, false, false]);
    } finally {
      global[SLOT] = slot;
    }
  });
});

describe("Elements 0.2.1 and 0.3 in one process (a package still on 0.2.1)", () => {
  // 0.2.1 counts its renders in a number at `Symbol.for("@unlayer/react-elements/renders")`, where 0.3 kept an object
  // of its own: whichever copy wrote it first, the other's renders failed ("Cannot create property 'n' on number").
  const OLD = Symbol.for("@unlayer/react-elements/renders");
  const NEW = Symbol.for("@unlayer/react-elements/render-count");
  type Elements = typeof import("../index");
  const email = (L: Pick<Elements, "Email" | "Row" | "Column" | "Paragraph">) => React.createElement(L.Email, null, React.createElement(L.Row, null, React.createElement(L.Column, null, React.createElement(L.Paragraph, null, "Hi there"))));
  const renders = (L: Pick<Elements, "Email" | "Row" | "Column" | "Paragraph" | "renderToHtml">) => L.renderToHtml(email(L)).includes("Hi there");
  /** A copy of 0.3 loaded now, as a process loads one after what's already run: its module build, or its CommonJS build. */
  const fresh = async (): Promise<Elements> => (vi.resetModules(), (await import("../index")) as Elements);
  const commonJs = () => createRequire(import.meta.url)("../../dist/index.cjs") as Elements;
  const old = async () => (await import("@unlayer/react-elements-021")) as unknown as Elements;
  const clear = () => {
    const global = globalThis as Record<symbol, unknown>;
    const kept = { [OLD]: global[OLD], [NEW]: global[NEW] };
    delete global[OLD];
    delete global[NEW];
    return () => Object.assign(global, kept);
  };

  it("render with 0.2.1 rendering first, then 0.3's module build and its CommonJS build loaded after it", async () => {
    const restore = clear();
    try {
      const v021 = await old();
      expect(renders(v021)).toBe(true);
      const module = await fresh();
      expect(renders(module)).toBe(true);
      expect(renders(commonJs())).toBe(true);
      expect([renders(v021), renders(module)]).toEqual([true, true]);
    } finally {
      restore();
    }
  });

  it("render with 0.3 rendering first, then 0.2.1, then 0.3's CommonJS build and another module copy loaded after it", async () => {
    const restore = clear();
    try {
      const module = await fresh();
      expect(renders(module)).toBe(true);
      const v021 = await old();
      expect(renders(v021)).toBe(true);
      expect(renders(commonJs())).toBe(true);
      expect(renders(await fresh())).toBe(true);
      expect([renders(module), renders(v021)]).toEqual([true, true]);
    } finally {
      restore();
    }
  });
});
