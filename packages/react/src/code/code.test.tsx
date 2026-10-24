import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { Button, Column, Email, Heading, Page, Paragraph, Row, renderToHtml, renderToJson, renderToPlainText } from "../index";
import { CodeBlock, CodeInline, codeInline, codeThemes, highlightCode, listLanguages, registerLanguage } from "./index";
import { escapeHtml } from "./highlight";

let warn: MockInstance;
beforeEach(() => {
  warn = vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => warn.mockRestore());

const email = (content: React.ReactNode) => (
  <Email>
    <Row>
      <Column>{content}</Column>
    </Row>
  </Email>
);
const SOURCE = `function total(items) {\n  // the sum\n  return items.reduce((sum, item) => sum + item.price, 0);\n}`;

describe("CodeBlock", () => {
  it("writes highlighted code with inline styles only, no class an email client would have to resolve", () => {
    const html = highlightCode(SOURCE, { language: "js" });
    expect(html).not.toMatch(/\sclass=/);
    expect(html).toContain('<span style="color: #b0326f">function</span>');
    expect(html).toContain('<span style="color: #6b7280; font-style: italic">// the sum</span>');
    // Outlook: a <pre> (spaces and lines kept), a monospace stack ending in Courier New, pixels for the line height.
    expect(html).toMatch(/<pre style="[^"]*font-family: ui-monospace,[^"]*'Courier New', monospace; font-size: 13px; line-height: 20px; mso-line-height-rule: exactly/);
    expect(html).toContain('bgcolor="#f6f7f9"');
    expect(html).toContain('\n  <span style="color: #b0326f">return</span>');
  });

  it("is an HTML block in the email, the design and the plain text", () => {
    const element = email(<CodeBlock language="ts" theme="dark" fontSize={14}>{SOURCE}</CodeBlock>);
    const html = renderToHtml(element);
    expect(html).toContain("background-color: #1b1f2a");
    expect(html).toContain("font-size: 14px; line-height: 21px");
    const block = renderToJson(element).body.rows[0].columns[0].contents[0];
    expect(block.type).toBe("html");
    expect(block.values.html).toContain('<span style="color: #f28fbf">function</span>');
    // The code as written: its indentation kept.
    expect(renderToPlainText(element)).toBe(SOURCE);
  });

  it("numbers lines in a row each, numbers left out of the plain text", () => {
    const html = highlightCode("a\n\n  b", { lineNumbers: 9 });
    expect(html.match(/<tr>/g)).toHaveLength(4);
    expect(html).toMatch(/data-skip-in-text="true"[^>]*>9<\/td>[\s\S]*>10<\/td>[\s\S]*>11<\/td>/);
    expect(renderToPlainText(email(<CodeBlock lineNumbers>{"a\n\n  b"}</CodeBlock>))).toBe("a\n\n  b");
  });

  it("takes its own themes, and one of yours", () => {
    expect(Object.keys(codeThemes)).toEqual(["light", "dark", "github-light", "github-dark", "one-dark", "monokai", "dracula", "nord", "solarized-light", "solarized-dark"]);
    const theme = { ...codeThemes.light, background: "#000000", tokens: { keyword: "color: #ff0000; font-weight: bold" } };
    const html = highlightCode("const a = 1", { language: "js", theme, lineHeight: "18px", padding: 8, wrap: false });
    expect(html).toContain('<span style="color: #ff0000; font-weight: bold">const</span>');
    expect(html).toMatch(/background-color: #000000.*padding: 8px.*line-height: 18px.*white-space: pre; overflow-x: auto/s);
  });

  it("takes highlight.js's themes by name: their colors, a scope's own style over its parent's", () => {
    const code = "class A extends B { get() { return 'x'; } } // done";
    const github = highlightCode(code, { language: "js", theme: "github-light" });
    expect(github).toContain('<span style="color: #d73a49">class</span>');
    expect(github).toContain('<span style="color: #032f62">&#x27;x&#x27;</span>');
    expect(github).toContain('<span style="color: #6a737d">// done</span>');
    expect(github).toMatch(/bgcolor="#ffffff" style="[^"]*border: 1px solid #d1d9e0/);
    // Monokai's class names: white (`.hljs-title.class_`), and bold as a title (`.hljs-title`).
    expect(highlightCode(code, { language: "js", theme: "monokai" })).toContain('<span style="color: white; font-weight: bold">A</span>');
    for (const name of ["github-dark", "one-dark", "dracula", "nord", "solarized-light", "solarized-dark"] as const) {
      const theme = codeThemes[name];
      expect(highlightCode(code, { language: "js", theme: name })).toContain(`bgcolor="${theme.background}"`);
      expect(theme.tokens.keyword).toMatch(/^color: #[0-9a-f]{6}/);
      expect(theme.tokens.comment).toMatch(/^color: #[0-9a-f]{6}/);
    }
    expect(codeInline("x", { theme: "nord" })).toContain("color: #d8dee9; background-color: #2e3440");
  });

  it("shows code it has no grammar for without colors, and says so once", () => {
    expect(highlightCode("<b>x</b>", { language: "brainfudge" })).toContain("&lt;b&gt;x&lt;/b&gt;");
    highlightCode("y", { language: "brainfudge" });
    expect(warn.mock.calls.map((c) => String(c[0]))).toEqual([
      '[Unlayer] CodeBlock has no grammar for `brainfudge`, so it\'s shown without colors: add one with registerLanguage() from "@unlayer/react-elements/code".',
    ]);
    registerLanguage("brainfudge", () => ({ name: "brainfudge", contains: [{ scope: "keyword", match: /\+/ }] }));
    expect(listLanguages()).toContain("brainfudge");
    expect(highlightCode("+", { language: "brainfudge" })).toContain('<span style="color: #b0326f">+</span>');
  });

  it("highlights up to 8,192 characters at once: on some code highlight.js's time grows with its size squared, so a longer block is shown without colors, and said", () => {
    // 40 KB took 4.4 s in INI and 2.2 s in Markdown; a line of `$a` in Java 6 s for 32 KB; C# on short lines too.
    const fill = (unit: string, n: number) => unit.repeat(Math.ceil(n / unit.length)).slice(0, n);
    const shapes: [string, string][] = [["ini", ".e1"], ["toml", ".e1"], ["markdown", "["], ["java", "$a"], ["csharp", "a a\n"], ["shell", "${"]];
    for (const [language, unit] of shapes) {
      const code = fill(unit, 40960).trim();
      const start = performance.now();
      const html = highlightCode(code, { language });
      expect([language, performance.now() - start < 1000, html.includes(`${escapeHtml(code)}</code>`), html.includes("<span style=")]).toEqual([language, true, true, false]);
    }
    expect(warn.mock.calls[0][0]).toBe("[Unlayer] CodeBlock: its code is 40960 characters, more than the 8192 highlight.js is given at once (on some code its time grows with the code's size squared), so it's shown without colors.");
    // In the block's own style.
    const block = renderToHtml(email(<CodeBlock language="ini" theme="dark" code={fill(".e1", 40960)} />));
    expect(block).toContain('bgcolor="#1b1f2a"');
    expect(block).toMatch(/<pre style="[^"]*font-family: ui-monospace,[^"]*"><code[^>]*>\.e1\.e1/);
    // Up to it, highlighted (the slowest grammar's worst, 0.4 s).
    expect(highlightCode(fill("a = 1\n", 8192), { language: "ini" })).toContain('<span style="color: #b4530a">1</span>');
  });

  it("writes a token nested deep in others (`${` over and over, in shell) with a style about as long as its theme's", () => {
    // Each token's style was its parents' written out, so the HTML grew with the code's size squared: 16 KB of `${`
    // was more HTML than a string can hold.
    const start = performance.now();
    const html = highlightCode("${".repeat(4096), { language: "shell" });
    expect(performance.now() - start).toBeLessThan(1000);
    expect(html.length).toBeLessThan(4 * 1024 * 1024);
    expect(html).toContain('<span style="color: #8a5a00">${</span>');
    // Nested as code is: the parent's declarations, then the token's own, as written.
    expect(highlightCode("console.log(`at ${line}`)", { language: "js", theme: "github-light" })).toContain('<span style="color: #032f62; color: #24292e">${line}</span>');
  });

  it("says a bounded number of languages it has no grammar for (a fence's label is whoever writes the Markdown's)", () => {
    const said = () => warn.mock.calls.map((c) => String(c[0]));
    for (let round = 0; round < 2; round++) for (let i = 0; i < 60; i++) highlightCode("x", { language: `unknown-${i}` });
    // Twenty at most (each once), then once that no more are said; none again.
    expect(said().length).toBeLessThanOrEqual(21);
    expect(said().at(-1)).toBe("[Unlayer] CodeBlock: more languages with no grammar are shown without colors, and not said.");
    highlightCode("x", { language: "unknown-later" });
    expect(said().length).toBeLessThanOrEqual(21);
  });
});

describe("CodeInline", () => {
  const style = /<code style="font-family: ui-monospace,[^"]*'Courier New', monospace; font-size: 0.9em; color: #1d2433; background-color: #eef0f4; padding: 1px 4px; border-radius: 4px">npm &amp;&amp; go<\/code>/;

  it("is written into Paragraph, Heading and Button text, in the HTML and the design", () => {
    const element = email(
      <>
        <Paragraph>
          Run <CodeInline>npm &amp;&amp; go</CodeInline> & wait
        </Paragraph>
        <Heading>
          Use <CodeInline code="npm && go" />
        </Heading>
        <Button href="https://example.com">
          <CodeInline>npm && go</CodeInline>
        </Button>
      </>
    );
    const html = renderToHtml(element);
    expect(html.match(new RegExp(style.source, "g"))).toHaveLength(3);
    expect(html).toContain("&amp; wait");
    const [paragraph, heading] = renderToJson(element).body.rows[0].columns[0].contents;
    expect(paragraph.values.text).toMatch(style);
    expect(heading.values.text).toMatch(style);
    expect(renderToPlainText(element)).toContain("Run npm && go & wait");
  });

  it("is a <code> of its own, and HTML for an `html` prop", () => {
    expect(codeInline("a<b", { theme: "dark" })).toBe(
      `<code style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 0.9em; color: #e8ebf2; background-color: #2a303d; padding: 1px 4px; border-radius: 4px">a&lt;b</code>`
    );
    const html = renderToHtml(
      <Page>
        <Row>
          <Column>
            <Paragraph html={`Run ${codeInline("npm i")}`} />
          </Column>
        </Row>
      </Page>
    );
    expect(html).toContain(">npm i</code>");
  });
});
