// @vitest-environment node
/**
 * Two copies of Elements in one process (a package's CommonJS build, its ESM one rendering; a package still on
 * another version), with one React: their Markdown and code blocks share the work of the render another copy runs.
 */
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
      const skewed = { ...(await import("../code")), renderToHtml: (await import("../index")).renderToHtml };
      // Its own renders share their work among its blocks; this copy's renders' work it can't read: each block has its own.
      expect(colored(skewed.renderToHtml(blocks(3, (i) => <skewed.CodeBlock key={i} language="java" code={java} />)))).toEqual([true, false, false]);
      expect(colored(renderToHtmlSync(blocks(3, (i) => <skewed.CodeBlock key={i} language="java" code={java} />)))).toEqual([true, true, true]);
      expect(colored(renderToHtmlSync(blocks(3, (i) => <own.CodeBlock key={i} language="java" code={java} />)))).toEqual([true, false, false]);
    } finally {
      global[SLOT] = slot;
    }
  });
});
