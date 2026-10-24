import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { Button, Column, Email, Heading, Html, Page, Paragraph, Row, registerTool, renderToHtml, renderToJson, renderToPlainText } from "../index";
import * as asyncRenderers from "../async";
import { CodeBlock, CodeInline, codeInline, codeThemes, highlightCode, listLanguages, registerLanguage } from "./index";
import { escapeHtml, HIGHLIGHT_LIMIT } from "./highlight";

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

  it("shows code it has no grammar for without colors, and says so once in a render", () => {
    const said = '[Unlayer] CodeBlock has no grammar for `brainfudge`, so it\'s shown without colors: add one with registerLanguage() from "@unlayer/react-elements/code".';
    expect(highlightCode("<b>x</b>", { language: "brainfudge" })).toContain("&lt;b&gt;x&lt;/b&gt;");
    // Outside a render, each time; in one, once (each render says it).
    const email = (
      <Email>
        <Row>
          <Column>
            <CodeBlock language="brainfudge">y</CodeBlock>
            <CodeBlock language="brainfudge">z</CodeBlock>
          </Column>
        </Row>
      </Email>
    );
    renderToHtml(email);
    renderToHtml(email);
    expect(warn.mock.calls.map((c) => String(c[0]))).toEqual([said, said, said]);
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

  it("takes off its code's trailing whitespace in time linear in its size, before any limit", () => {
    // `/\s+$/` tried again from each character of a long run of spaces that `x` ends: 100,000 took 5.7 s, also with no
    // language, before the 8,192 characters' limit.
    for (const code of ["a" + " ".repeat(102400) + "x", "\n".repeat(102400) + "x", "a\t \r\n".repeat(25600) + "x  \n\n"]) {
      for (const language of [undefined, "js"]) {
        const start = performance.now();
        const html = renderToHtml(email(<CodeBlock language={language} code={code} />));
        expect([JSON.stringify(code.slice(0, 6)), language, performance.now() - start < 1000]).toEqual([JSON.stringify(code.slice(0, 6)), language, true]);
        expect(html).toMatch(/x<\/code>/);
      }
    }
    // As before: a leading line break and the trailing whitespace off, the rest kept.
    expect(highlightCode("\n  a  \n\t\n ", {})).toContain("<code style=\"font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 13px; line-height: 20px; mso-line-height-rule: exactly\">  a</code>");
  });

  it("costs about ten times as much for ten times as much code of any short shape, in any language (random, seeded)", () => {
    // Past HIGHLIGHT_LIMIT characters code is written without colors; up to it, it's highlighted (checked too).
    const pieces = ["$", "{", "}", "(", "(", ")", "[", "]", "<", ">", "</", "/*", "*/", "//", "#", '"', "'", "`", "${", "\\", "-", "_", ".", "1", "e", "a", "=", ":", ";", ",", " ", "  ", "\t", "\n", "\n", "\r\n", "<!--", "-->", "<<EOF\n", "@", "%", "!", "?"];
    const languages = [undefined, ...listLanguages()];
    let seed = 7;
    const random = (n: number) => ((seed = (Math.imul(seed, 1103515245) + 12345) >>> 0), Math.floor((seed / 2 ** 32) * n));
    // A shape: a unit over and over, between a piece before it and one after it (`x` after spaces, say).
    const fill = (head: string, unit: string, tail: string, bytes: number) => head + unit.repeat(Math.ceil(bytes / unit.length)).slice(0, bytes) + tail;
    const time = (code: string, language: string | undefined) => {
      const start = performance.now();
      highlightCode(code, { language, lineNumbers: random(4) === 0 });
      return performance.now() - start;
    };
    const slow: string[] = [];
    for (let run = 0; run < 150; run++) {
      let unit = "";
      for (let i = 0, n = 1 + random(4); i < n; i++) unit += pieces[random(pieces.length)];
      const [head, tail] = [random(2) ? pieces[random(pieces.length)] : "", random(3) ? pieces[random(pieces.length)] : ""];
      const language = languages[random(languages.length)];
      const small = Math.max(time(fill(head, unit, tail, 10240), language), 2);
      const large = time(fill(head, unit, tail, 102400), language);
      // And up to the limit, highlighted: no shape of any grammar takes more than about a second.
      const highlighted = time(fill(head, unit, tail, HIGHLIGHT_LIMIT - 16), language);
      const shape = JSON.stringify([head, unit, tail]);
      // (A shape that looks slow is timed twice more, its fastest kept: a garbage collection or a busy machine in one
      // timing isn't its cost. The seeded shapes stay the same: these timings draw nothing.)
      const again = (bytes: number) => {
        const start = performance.now();
        highlightCode(fill(head, unit, tail, bytes), { language });
        return performance.now() - start;
      };
      const slower = (large: number, small: number) => large > 20 * small && large > 100;
      const [fast, quick] = slower(large, small) ? [Math.min(large, again(102400), again(102400)), Math.max(Math.min(small, again(10240), again(10240)), 2)] : [large, small];
      if (slower(fast, quick) || highlighted > 2000) slow.push(`${language} ${shape}: ${quick.toFixed(1)} ms for 10 KB, ${fast.toFixed(1)} ms for 100 KB, ${highlighted.toFixed(0)} ms highlighted`);
    }
    expect(slow).toEqual([]);
  }, 120_000);

  it("writes a token nested deep in others (`${` over and over, in shell) with a style about as long as its theme's", () => {
    // Each token's style was its parents' written out, so the HTML grew with the code's size squared: 16 KB of `${`
    // was more HTML than a string can hold. (1,024 deep: past about 3,000, highlight.js's own recursion can run out of
    // Node 20's stack before its code is optimized, and it then writes the code without colors.)
    const start = performance.now();
    const html = highlightCode("${".repeat(1024), { language: "shell" });
    expect(performance.now() - start).toBeLessThan(1000);
    expect(html.length).toBeLessThan(4 * 1024 * 1024);
    expect(html).toContain('<span style="color: #8a5a00">${</span>');
    // Nested as code is: the parent's declarations, then the token's own, as written.
    expect(highlightCode("console.log(`at ${line}`)", { language: "js", theme: "github-light" })).toContain('<span style="color: #032f62; color: #24292e">${line}</span>');
  });

  it("says a bounded number of languages it has no grammar for in a render (a fence's label is whoever writes the Markdown's)", () => {
    const said = () => warn.mock.calls.map((c) => String(c[0]));
    const blocks = Array.from({ length: 120 }, (_, i) => <CodeBlock key={i} language={`unknown-${i % 60}`}>x</CodeBlock>);
    renderToHtml(
      <Email>
        <Row>
          <Column>{blocks}</Column>
        </Row>
      </Email>
    );
    // Twenty at most in the render (each once), then once that no more are said.
    expect(said().length).toBe(21);
    expect(said().at(-1)).toBe("[Unlayer] CodeBlock: more languages with no grammar are shown without colors, and not said.");
    // The next render says its own (it was a set for every render, said in the first only).
    renderToHtml(
      <Email>
        <Row>
          <Column>
            <CodeBlock language="unknown-0">x</CodeBlock>
          </Column>
        </Row>
      </Email>
    );
    expect(said().length).toBe(22);
  });
});

describe("highlightCode() in a render", () => {
  let warn: MockInstance;
  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => warn.mockRestore());
  // (Ending in a `;`: none of it is trimmed, so `code(8192)` is all of a render's work.)
  const code = (n: number) => "int a = 1;\n".repeat(Math.ceil(n / 11)).slice(0, n - 1) + ";";
  const colored = (html: string) => (html.match(/<span style="/g) ?? []).length;
  const budget = () => warn.mock.calls.map((c) => String(c[0])).filter((m) => m.includes("for one render"));

  it("charges a template wrapper's highlightCode() calls to its render, as its CodeBlocks' are", async () => {
    // A digest that highlights each comment itself: its wrapper ran with no render's work, 12 of 8 KB of `$a` 4.6 s.
    function Digest({ list }: { list: string[] }) {
      return (
        <Email>
          <Row>
            <Column>
              {list.map((c, i) => (
                <Html key={i} html={highlightCode(c, { language: "java" })} />
              ))}
            </Column>
          </Row>
        </Email>
      );
    }
    const list = [code(8000), code(8000), code(8000)];
    for (const html of [renderToHtml(<Digest list={list} />), await asyncRenderers.renderToHtml(<Digest list={list} />)]) {
      const blocks = html.split('<pre style="').slice(1).map(colored);
      expect(blocks.map((n) => n > 0)).toEqual([true, false, false]);
    }
    expect(budget()).toHaveLength(2);
  });

  it("gives a render started inside a component's call its own work, its wrappers' calls included", () => {
    function Snippet() {
      return (
        <Email>
          <Row>
            <Column>
              <Html html={highlightCode("const a = 1;", { language: "javascript" })} />
            </Column>
          </Row>
        </Email>
      );
    }
    const alone = renderToHtml(<Snippet />);
    let inner = "";
    function Preview() {
      inner = renderToHtml(<Snippet />);
      return <Paragraph>preview</Paragraph>;
    }
    // The outer render's first block takes all of its work: the inner render has its own.
    renderToHtml(
      <Email>
        <Row>
          <Column>
            <CodeBlock language="java" code={code(8192)} />
            <Preview />
          </Column>
        </Row>
      </Email>
    );
    expect([inner === alone, colored(inner) > 0]).toEqual([true, true]);
    // And the inner render's wrapper takes none of the outer's.
    function Big() {
      return (
        <Email>
          <Row>
            <Column>
              <Html html={highlightCode(code(8192), { language: "java" })} />
            </Column>
          </Row>
        </Email>
      );
    }
    function First() {
      renderToHtml(<Big />);
      return null;
    }
    const small = (
      <Row>
        <Column>
          <CodeBlock language="javascript" code="const a = 1;" />
        </Column>
      </Row>
    );
    expect(
      renderToHtml(
        <Email>
          <Row>
            <Column>
              <First />
            </Column>
          </Row>
          {small}
        </Email>
      )
    ).toContain(renderToHtml(<Email>{small}</Email>).match(/<pre[\s\S]*<\/pre>/)![0]);
  });

  it("charges the user's code a render runs outside its components' calls to that render: a Consumer's render prop, a custom tool's exporter", () => {
    // They ran with the work of whatever render was running: none at the top (12 of 8 KB all highlighted), the outer
    // render's in one a component starts (the outer render's own block lost its colors).
    const Theme = React.createContext("light");
    const consumed = () => <Theme.Consumer>{(theme) => <Html html={highlightCode(code(8000), { language: "java", theme: theme as "light" })} />}</Theme.Consumer>;
    const Snip = registerTool({ name: "work-snip", values: { code: "" }, renderer: { exporters: { email: (values: { code: string }) => `<div>${highlightCode(values.code, { language: "java" })}</div>` } } });
    const blocks = (block: (i: number) => React.ReactElement) => (
      <Email>
        <Row>
          <Column>{[0, 1, 2].map(block)}</Column>
        </Row>
      </Email>
    );
    const each = (html: string) => html.split('<pre style="').slice(1).map((b) => colored(b) > 0);
    expect(each(renderToHtml(blocks((i) => <React.Fragment key={i}>{consumed()}</React.Fragment>)))).toEqual([true, false, false]);
    expect(each(renderToHtml(blocks((i) => <Snip key={i} code={code(8000)} />)))).toEqual([true, false, false]);
    // In a render a component starts: its own, and none of the outer one's.
    const inner = () => blocks((i) => <React.Fragment key={i}>{i === 0 ? consumed() : null}</React.Fragment>);
    const alone = renderToHtml(inner());
    let nested = "";
    function Embed() {
      nested = renderToHtml(inner());
      return <Paragraph>embedded</Paragraph>;
    }
    const outer = renderToHtml(
      <Email>
        <Row>
          <Column>
            <Embed />
            <CodeBlock language="java" code={code(8000)} />
          </Column>
        </Row>
      </Email>
    );
    expect([nested === alone, each(outer)]).toEqual([true, [true]]);
  });

  it("is a call of its own after an `await` in an async component (there, no render's work is known: CodeBlock's is)", async () => {
    async function Comment({ c }: { c: string }) {
      await Promise.resolve();
      return <Html html={highlightCode(c, { language: "java" })} />;
    }
    const html = await asyncRenderers.renderToHtml(
      <Email>
        <Row>
          <Column>
            <Comment c={code(8000)} />
            <Comment c={code(8000)} />
          </Column>
        </Row>
      </Email>
    );
    expect(html.split('<pre style="').slice(1).map((block) => colored(block) > 0)).toEqual([true, true]);
  });

  it("reads a theme by its name only where it's one of the themes (`__proto__` from data is the default)", () => {
    for (const theme of ["__proto__", "constructor", "toString"]) expect(highlightCode("a", { language: "js", theme: theme as "light" })).toBe(highlightCode("a", { language: "js" }));
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
