import { describe, it, expect, vi } from "vitest";
import React, { memo, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { renderToHtml, renderToHtmlParts, renderToPlainText } from "./render-to-html";
import { renderToJson } from "./render-to-json";
import { Email, Page, Row, Column, Paragraph, Heading, Html, Button as ElementsButton } from "../index";

const block = (text: string, props: Record<string, unknown> = {}) => <Row><Column><Paragraph {...props}>{text}</Paragraph></Column></Row>;
const Header = () => block("Header");
const Pair = () => [<React.Fragment key="a">{block("Pair one")}</React.Fragment>, block("Pair two")];
const Gappy = () => <>{null}{block("Gappy")}{false}</>;
const MemoRow = memo(() => block("Memo"));
const Note = ({ text }: { text: string }) => {
  const [value] = useState(text); // a hook: called in a render of its own
  return <Paragraph>{value}</Paragraph>;
};

const template = (
  <Email>
    <Header />
    <>{block("Fragment")}</>
    <Pair />
    <Gappy />
    <MemoRow />
    <Row><Column><Note text="Note" /><Paragraph mobile={{ fontSize: "30px" }}>Target</Paragraph></Column></Row>
    {block("Last")}
  </Email>
);
const order = ["Header", "Fragment", "Pair one", "Pair two", "Gappy", "Memo", "Note", "Target", "Last"];

describe("Fragments and user components among the blocks", () => {
  it("render every block once, in order, each with its own id", () => {
    const html = renderToHtml(template);
    const body = html.slice(html.indexOf("<body"));
    const texts = order.map((t) => body.indexOf(`>${t}<`));
    expect(texts.every((at) => at > 0)).toBe(true);
    expect([...texts].sort((a, b) => a - b)).toEqual(texts);
    const ids = [...body.matchAll(/id="(u_(?:row|column|content_paragraph)_\d+)"/g)].map((m) => m[1]);
    expect(new Set(ids).size).toBe(ids.length);
    // Every row renders as an email row, a user component's too.
    expect(body.match(/id="u_row_\d+" class="u-row-container/g)?.length ?? 0).toBe(8);
    expect(ids.filter((id) => id.startsWith("u_row_")).length).toBe(8);
  });

  it("put the phone CSS on the block that asked for it, and the design has the same blocks", () => {
    const html = renderToHtml(template);
    const selector = /#(u_content_paragraph_\d+)[^{]*\{[^}]*font-size:\s*30px/.exec(html)?.[1];
    const targetId = new RegExp(`id="(u_content_paragraph_\\d+)"[^>]*>(?:(?!id=")[\\s\\S])*?>Target<`).exec(html)?.[1];
    expect(selector).toBeDefined();
    expect(selector).toBe(targetId);
    expect(html.match(new RegExp(`id="${selector}"`, "g"))).toHaveLength(1);

    const design = renderToJson(template) as any;
    const paragraphs = design.body.rows.flatMap((r: any) => r.columns.flatMap((c: any) => c.contents));
    expect(paragraphs.map((p: any) => (p.values.text ?? "").replace(/<[^>]+>/g, ""))).toEqual(order);
    // The design names a paragraph as the editor does (`u_content_text_N`): the same N.
    expect(paragraphs.find((p: any) => /Target/.test(p.values.text)).values._meta.htmlID.replace("_text_", "_paragraph_")).toBe(selector);
  });

  it("leave a template without them as it was", () => {
    const plain = <Email>{block("One")}{block("Two", { mobile: { fontSize: "30px" } })}</Email>;
    const html = renderToHtml(plain);
    expect(/#(u_content_paragraph_\d+)[^{]*\{[^}]*font-size:\s*30px/.exec(html)?.[1]).toBe("u_content_paragraph_2");
  });
});

describe("a component element kept between renders", () => {
  it("renders again in each render, with the data of that render", () => {
    let user = "Alice";
    const Greeting = () => <Paragraph>Hi {user}</Paragraph>;
    const greeting = <Greeting />; // made once, as a module constant would be
    const Footer = () => block(`Bye ${user}`);
    const footer = <Footer />;
    const email = () => <Email><Row><Column>{greeting}</Column></Row>{footer}</Email>;
    expect(renderToHtml(email())).toContain("Hi Alice");
    user = "Bob";
    const html = renderToHtml(email());
    expect(html).toContain("Hi Bob");
    expect(html).toContain("Bye Bob");
    expect(html).not.toContain("Alice");
    expect(JSON.stringify(renderToJson(email()))).toContain("Hi Bob");
  });

  it("is called once for each place it's used in a render (not for each of the render's passes), each use with its own id", () => {
    let calls = 0;
    const Counted = () => (calls++, block("Twice"));
    const counted = <Counted />;
    const html = renderToHtml(<Email>{counted}{counted}</Email>);
    expect(html.match(/Twice/g)).toHaveLength(2);
    expect(calls).toBe(2);
    const ids = [...html.matchAll(/id="(u_content_paragraph_\d+)"/g)].map((m) => m[1]);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("HTML from a component placed straight in the body", () => {
  it("doesn't get the body's settings as attributes", () => {
    const Raw = () => <div dangerouslySetInnerHTML={{ __html: "<p>Raw footer</p>" }} />;
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const html = renderToHtml(<Page><Raw />{block("x")}</Page>);
      expect(html).toContain("<div><p>Raw footer</p></div>");
      expect(html).not.toMatch(/_config=|bodyValues=|\[object Object\]/);
      expect(error).not.toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });
});


describe("a component that fails", () => {
  const messages = (run: () => unknown) => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      run();
      return [...error.mock.calls, ...warn.mock.calls].map((call) => String(call[0]));
    } finally {
      error.mockRestore();
      warn.mockRestore();
    }
  };

  it("is left out with what it renders, and the one that failed in it says so, once per render", () => {
    const Boom = () => {
      throw new Error("boom");
    };
    const Section = () => <>{block("In the section")}<Boom /></>;
    const email = <Email><Section />{block("After")}</Email>;
    for (const render of [() => renderToHtml(email), () => renderToJson(email)]) {
      let output = "";
      expect(messages(() => (output = JSON.stringify(render())))).toEqual(["[Unlayer] <Boom> threw while rendering, so it's left out:"]);
      expect(output).toContain("After");
      expect(output).not.toContain("In the section");
    }
  });

  it("says a lazy component suspends", () => {
    const Later = React.lazy(() => new Promise<{ default: React.FC }>(() => {}));
    let html = "";
    expect(messages(() => (html = renderToHtml(<Email><Row><Column><Later /><Paragraph>Still here</Paragraph></Column></Row></Email>)))).toEqual([
      "[Unlayer] <component> is async or suspends: Elements renders synchronously, so it's left out. Load its data first and pass it as props.",
    ]);
    expect(html).toContain("Still here");
  });

  it("fails on a component that's undefined (a broken import), in a Column or among the rows: a block missing shouldn't send", () => {
    const Missing = undefined as unknown as React.FC;
    for (const email of [
      <Email><Row><Column><Paragraph>Hi</Paragraph><Missing /></Column></Row></Email>,
      <Email><Row><Column><Paragraph>Hi</Paragraph></Column></Row><Missing /></Email>,
    ]) {
      expect(() => renderToHtml(email)).toThrow(/Element type is invalid/);
      expect(() => renderToJson(email)).toThrow(/Element type is invalid/);
    }
  });

  it("names a component whose markup the design can't keep", () => {
    const Banner = () => <div dangerouslySetInnerHTML={{ __html: "<table><tr><td>Sale</td></tr></table>" }} />;
    expect(messages(() => renderToJson(<Email><Banner />{block("x")}</Email>))).toEqual([
      "[Unlayer] renderToJson: <Banner> is not a valid Body child. Only <Row> is allowed.",
    ]);
  });
});

describe("HTML from a component in a Column", () => {
  // As CMS snippets often are: what's in it doesn't pair up as markup.
  const snippets = {
    "a self-closing spacer": '<div style="height:16px"/><p>after spacer</p>',
    "a comment naming a tag": "<!-- <div> old layout --><p>commented</p>",
    "an unclosed div": "<div><p>unclosed wrapper</p>",
    "a stray end tag": "<p>first</p></div><p>second</p>",
    "an attribute naming a tag": '<img alt="see <div> docs" src="https://example.com/a.png"><p>alt text</p>',
    "a script naming a tag": '<p>scripted</p><script>var t = "<div>";</script>',
  };
  it.each(Object.entries(snippets))("is kept as it is, with %s", (_, snippet) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const Snippet = () => <div dangerouslySetInnerHTML={{ __html: snippet }} />;
      expect(renderToHtml(<Email><Row><Column><Snippet /><Paragraph>Next</Paragraph></Column></Row></Email>)).toContain(snippet);
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  it("keeps markup other than a bare div as it is: a link, a table, an image, elements side by side", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const shapes: Array<[React.FC, string]> = [
        [() => <a href="https://example.com/visit">Visit</a>, '<a href="https://example.com/visit">Visit</a>'],
        [() => <table><tbody><tr><td align="right">cell</td></tr></tbody></table>, '<table><tbody><tr><td align="right">cell</td></tr></tbody></table>'],
        [() => <img src="https://example.com/pic.png" alt="pic" />, '<img src="https://example.com/pic.png" alt="pic"/>'],
        [() => <><div>one</div><p>two</p></>, "<div>one</div><p>two</p>"],
      ];
      for (const [Shape, kept] of shapes) {
        const email = <Email><Row><Column><Shape /></Column></Row></Email>;
        expect(renderToHtml(email)).toContain(kept);
        // The design keeps it as an HTML block too.
        expect(renderToJson(email).body.rows[0].columns[0].contents).toEqual([expect.objectContaining({ type: "html", values: expect.objectContaining({ html: kept }) })]);
      }
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  it("says so when markup comes with blocks, which a Column can't hold together", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const Mixed = () => <><div>note</div><Paragraph>Kept</Paragraph></>;
      expect(renderToHtml(<Email><Row><Column><Mixed /></Column></Row></Email>)).toContain("Kept");
      expect(warn.mock.calls.map((call) => String(call[0]))).toEqual(["Column: <Mixed> rendered markup that isn't a block, so it's left out. Put HTML in an <Html> block."]);
    } finally {
      warn.mockRestore();
    }
  });

  it("is numbered as the HTML numbers it, so phone CSS reaches the block that asked for it", () => {
    // A component of the user's own named like a block (React Email's own `Button`), before an Elements Button.
    function Button() {
      return <a href="https://example.com/plain">Plain link</a>;
    }
    const html = renderToHtml(<Email><Row><Column><Button /><ElementsButton href="https://example.com" mobile={{ fontSize: "22px" }}>Real</ElementsButton></Column></Row></Email>);
    const id = /id="(u_content_button_\d+)"[\s\S]{0,1500}?Real/.exec(html)![1];
    const css = /<style[^>]*>([\s\S]*?)<\/style>/.exec(html)![1];
    expect([...new Set(css.match(/#u_content_button_\d+/g))]).toEqual([`#${id}`]);
  });
});

describe("a component inside markup", () => {
  it("that throws is left out, and the rest renders (markup straight in a Column isn't rendered, as before)", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const Boom = () => {
        throw new Error("deep");
      };
      const html = renderToHtml(<Email><Row><Column><Paragraph>Before</Paragraph><div><Boom /></div><Paragraph>After</Paragraph></Column></Row></Email>);
      expect(html).toContain("Before");
      expect(html).toContain("After");
      expect(error).toHaveBeenCalledWith("[Unlayer] <Boom> threw while rendering, so it's left out:", expect.anything());
    } finally {
      error.mockRestore();
    }
  });
});

describe("a block rendered to a string inside a component", () => {
  it("is what the block renders, with Elements' own render functions and with react-dom's", () => {
    const viaParts = () => renderToHtmlParts(<Paragraph>From parts</Paragraph>).body;
    const viaReactDom = () => renderToStaticMarkup(<Paragraph>From react-dom</Paragraph>);
    const viaPlainText = () => renderToPlainText(<Paragraph>From plain text</Paragraph>);
    const Signature = ({ make }: { make: () => string }) => <Row><Column><Html html={make()} /></Column></Row>;
    const html = renderToHtml(<Email>{block("Hello")}<Signature make={viaParts} /><Signature make={viaReactDom} /><Signature make={viaPlainText} /></Email>);
    for (const text of ["From parts", "From react-dom", "From plain text"]) expect(html).toContain(text);
    expect(html).not.toContain("unlayer-mark");
  });

  it("is what each block renders when react-dom gives them many ids (its own can read like the collecting render's)", () => {
    // 85 groups of three blocks rendered by react-dom: its ids reach ones that hold "Rel" (`:Rel:`), none of them
    // the collecting render's.
    const items = Array.from({ length: 85 }, (_, i) => `item${i}`);
    const markup = () => renderToStaticMarkup(<>{items.map((t) => <React.Fragment key={t}><Heading>{`H-${t}`}</Heading><Paragraph>{`P-${t}`}</Paragraph><ElementsButton href="https://example.com">{`B-${t}`}</ElementsButton></React.Fragment>)}</>);
    // The string as markup of its own, and through an Html block after a change (quotes swapped).
    const AsMarkup = () => <div dangerouslySetInnerHTML={{ __html: markup() }} />;
    const Swapped = () => <Html html={markup().replace(/"/g, "'")} />;
    for (const List of [AsMarkup, Swapped]) {
      const html = renderToHtml(<Email><Row><Column><List /></Column></Row></Email>);
      for (const t of items) for (const k of ["H", "P", "B"]) expect(html, List.name).toMatch(new RegExp(`${k}-${t}\\b`));
    }
  });

  it("is what the block renders even when the string is changed before it's used (quotes swapped, tags filtered)", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const swapped = () => renderToStaticMarkup(<ElementsButton href="https://example.com/call">Book a call</ElementsButton>).replace(/"/g, "'");
      // A sanitizer that keeps only the tags it knows.
      const filtered = () => renderToStaticMarkup(<Paragraph>Kept after filtering</Paragraph>).replace(/<\/?([a-z-]+)[^>]*>/g, (tag, name) => (["div", "p", "span", "table", "tbody", "tr", "td", "a", "strong"].includes(name) ? tag : ""));
      const Snippet = ({ make }: { make: () => string }) => <Row><Column><Html html={make()} /></Column></Row>;
      const email = <Email>{block("Hello")}<Snippet make={swapped} /><Snippet make={filtered} /></Email>;
      const html = renderToHtml(email);
      expect(html).toContain("Book a call");
      expect(html).toContain("Kept after filtering");
      expect(html).not.toContain("unlayer-mark");
      expect(JSON.stringify(renderToJson(email))).not.toContain("unlayer-mark");
      expect(error).not.toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });
});

describe("an async component whose data load fails", () => {
  it("isn't called, and its rejection can't end the process", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    let calls = 0;
    async function Orders() {
      calls++;
      await new Promise((resolve) => setTimeout(resolve, 5));
      throw new Error("db unavailable");
    }
    try {
      const email = <Email>{block("Hello")}<Orders /><Row><Column><Orders /><Paragraph>In a column</Paragraph></Column></Row></Email>;
      expect(renderToHtml(email)).toContain("In a column");
      expect(JSON.stringify(renderToJson(email))).toContain("Hello");
      // Vitest fails the run on an unhandled rejection: give one the time to happen.
      await new Promise((resolve) => setTimeout(resolve, 30));
      expect(calls).toBe(0);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("<Orders> is async or suspends"));
    } finally {
      warn.mockRestore();
    }
  });
});
