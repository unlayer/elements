import { describe, it, expect, vi } from "vitest";
import React, { memo, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { renderToHtml, renderToHtmlParts, renderToPlainText } from "./render-to-html";
import { renderToJson } from "./render-to-json";
import { Email, Page, Row, Column, Paragraph, Heading, Html, Button as ElementsButton, ColumnLayouts } from "../index";

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
    const texts = order.map((t) => body.search(new RegExp(`>\\s*${t}\\s*<`)));
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
    const targetId = new RegExp(`id="(u_content_paragraph_\\d+)"[^>]*>(?:(?!id=")[\\s\\S])*?>\\s*Target\\s*<`).exec(html)?.[1];
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

  it("fails the render, naming it and where it is; left out (onError: \"omit\") with what it renders, said once per render", () => {
    const boom = new Error("boom");
    const Boom = () => {
      throw boom;
    };
    const Section = () => <>{block("In the section")}<Boom /></>;
    const email = <Email><Section />{block("After")}</Email>;
    const said = "[Unlayer] boom (in <Boom> at Section › Boom)";
    for (const render of [() => renderToHtml(email), () => renderToJson(email), () => renderToPlainText(email)]) expect(render).toThrow(said);
    for (const render of [() => renderToHtml(email, { onError: "omit" }), () => renderToJson(email, { onError: "omit" })]) {
      let output = "";
      expect(messages(() => (output = JSON.stringify(render())))).toEqual([said.replace("[Unlayer] ", "[Unlayer] Left out: ")]);
      expect(output).toContain("After");
      expect(output).not.toContain("In the section");
    }
  });

  it("says a lazy component suspends, where it is", () => {
    const Later = React.lazy(() => new Promise<{ default: React.FC }>(() => {}));
    const email = <Email><Row><Column><Later /><Paragraph>Still here</Paragraph></Column></Row></Email>;
    const said = '[Unlayer] it is async or suspends, and this renderer is synchronous: render with "@unlayer/react-elements/async", or load its data first and pass it as props (in <lazy> at Row 1 › Column 1 › lazy)';
    expect(() => renderToHtml(email)).toThrow(said);
    let html = "";
    expect(messages(() => (html = renderToHtml(email, { onError: "omit" })))).toEqual([said.replace("[Unlayer] ", "[Unlayer] Left out: ")]);
    expect(html).toContain("Still here");
  });

  it("reach the template's components from a context Provider around the root, as from one inside it", () => {
    const Theme = React.createContext("default theme");
    const Themed = () => <Paragraph>{`Theme: ${React.useContext(Theme)}`}</Paragraph>;
    const around = <Theme.Provider value="dark"><Email><Row><Column><Themed /></Column></Row></Email></Theme.Provider>;
    const inside = <Email><Theme.Provider value="dark"><Row><Column><Themed /></Column></Row></Theme.Provider></Email>;
    const Template = () => around;
    for (const element of [around, <Template />]) {
      expect(renderToHtml(element)).toBe(renderToHtml(inside));
      expect(renderToPlainText(element)).toContain("Theme: dark");
      expect(JSON.stringify(renderToJson(element))).toBe(JSON.stringify(renderToJson(inside)));
    }
  });

  it.each([
    ["throws (no render it can see)", () => { throw new Error("Invalid hook call"); }],
    ["gives an outer render's ids", () => "«R1»"],
  ])("collect an email where React's useId %s: the React Elements calls isn't the renderer's, as in Next.js's server layers", (_, useId) => {
    const email = <Email><Row><Column><Paragraph>Hello</Paragraph></Column></Row><Row layout={ColumnLayouts.TwoEqual}><Column><Paragraph>Left</Paragraph></Column><Column><Paragraph>Right</Paragraph></Column></Row></Email>;
    const html = renderToHtml(email);
    const design = JSON.stringify(renderToJson(email));
    const spy = vi.spyOn(React, "useId").mockImplementation(useId as () => string);
    try {
      expect(renderToHtml(email)).toBe(html);
      expect(JSON.stringify(renderToJson(email))).toBe(design);
    } finally {
      spy.mockRestore();
    }
  });

  it("render a component of the user's own named Row or Column (its displayName) as React renders it, keeping its own props", () => {
    const BrandRow = ({ children }: { children?: React.ReactNode }) => <Row backgroundColor="#ff0000">{children}</Row>;
    const Plain = ({ children }: { children?: React.ReactNode }) => <Row backgroundColor="#ff0000">{children}</Row>;
    BrandRow.displayName = "Row";
    const Half = ({ children }: { children?: React.ReactNode }) => <Column backgroundColor="#00ff00">{children}</Column>;
    Half.displayName = "Column";
    const named = <Email><BrandRow><Half><Paragraph>Hi</Paragraph></Half></BrandRow></Email>;
    const plain = <Email><Plain><Column backgroundColor="#00ff00"><Paragraph>Hi</Paragraph></Column></Plain></Email>;
    expect(renderToHtml(named)).toContain("#ff0000");
    expect(renderToHtml(named)).toBe(renderToHtml(plain));
    expect(JSON.stringify(renderToJson(named))).toBe(JSON.stringify(renderToJson(plain)));
  });

  it("give a template the context of a Provider around it (translations, a brand), as 0.1.22's HTML and plain text did (its renderToJson threw)", () => {
    const Brand = React.createContext({ name: "Default Co" });
    const Receipt = () => {
      const { name } = React.useContext(Brand);
      return <Email previewText={`Your ${name} receipt`}><Row><Column><Paragraph>{`Thanks for shopping at ${name}`}</Paragraph></Column></Row></Email>;
    };
    const wrapped = <Brand.Provider value={{ name: "Acme" }}><Receipt /></Brand.Provider>;
    for (const output of [renderToHtml(wrapped), renderToPlainText(wrapped), JSON.stringify(renderToJson(wrapped))]) {
      expect(output).toContain("Thanks for shopping at Acme");
      expect(output).not.toContain("Default Co");
    }
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

  it("keeps markup other than a bare div as it is: a table, an image, a linked image, a styled rule, elements side by side", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const shapes: Array<[React.FC, string]> = [
        [() => <table><tbody><tr><td align="right">cell</td></tr></tbody></table>, '<table><tbody><tr><td align="right">cell</td></tr></tbody></table>'],
        [() => <img src="https://example.com/pic.png" alt="pic" />, '<img src="https://example.com/pic.png" alt="pic"/>'],
        // A link or a rule its block couldn't hold all of (an image in the link, the rule's style) stays as it is.
        [() => <a href="https://example.com"><img src="https://example.com/logo.png" alt="Logo" width="120" /></a>, '<a href="https://example.com"><img src="https://example.com/logo.png" alt="Logo" width="120"/></a>'],
        [() => <hr style={{ borderTop: "2px dashed #cccccc" }} />, '<hr style="border-top:2px dashed #cccccc"/>'],
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

  it("makes a link alone a Paragraph holding it, and a rule a Divider: blocks the design can edit", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const Visit = () => <a href="https://example.com/visit" target="_self">Visit <b>now</b></a>;
      const email = <Email><Row><Column><Visit /><hr /></Column></Row></Email>;
      const html = renderToHtml(email);
      expect(html).toContain('<a href="https://example.com/visit" target="_self">Visit <b>now</b></a>');
      expect(html).toContain("u_content_divider");
      const [link, rule] = renderToJson(email).body.rows[0].columns[0].contents;
      expect(link).toMatchObject({ type: "text", values: { text: '<a href="https://example.com/visit" target="_self">Visit <b>now</b></a>' } });
      expect(rule.type).toBe("divider");
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
  it("that throws fails the render; left out (onError: \"omit\"), the rest renders (markup straight in a Column isn't rendered, as before)", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const deep = new Error("deep");
      const Boom = () => {
        throw deep;
      };
      const email = <Email><Row><Column><Paragraph>Before</Paragraph><div><Boom /></div><Paragraph>After</Paragraph></Column></Row></Email>;
      expect(() => renderToHtml(email)).toThrow("[Unlayer] deep (in <Boom> at Row 1 › Column 1 › Boom)");
      const html = renderToHtml(email, { onError: "omit" });
      expect(html).toContain("Before");
      expect(html).toContain("After");
      expect(error).toHaveBeenCalledWith("[Unlayer] Left out: deep (in <Boom> at Row 1 › Column 1 › Boom)", deep);
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
  it("isn't called by the synchronous renderers, and its rejection can't end the process", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    let calls = 0;
    async function Orders() {
      calls++;
      await new Promise((resolve) => setTimeout(resolve, 5));
      throw new Error("db unavailable");
    }
    try {
      const email = <Email>{block("Hello")}<Orders /><Row><Column><Orders /><Paragraph>In a column</Paragraph></Column></Row></Email>;
      expect(() => renderToHtml(email)).toThrow("(in <Orders>)");
      expect(renderToHtml(email, { onError: "omit" })).toContain("In a column");
      expect(JSON.stringify(renderToJson(email, { onError: "omit" }))).toContain("Hello");
      // Vitest fails the run on an unhandled rejection: give one the time to happen.
      await new Promise((resolve) => setTimeout(resolve, 30));
      expect(calls).toBe(0);
      expect(error).toHaveBeenCalledWith(expect.stringContaining("(in <Orders> at Row 2 › Column 1 › Orders)"));
    } finally {
      error.mockRestore();
    }
  });
});

describe("React's warnings about a template", () => {
  // React says where a list without keys is rendered, in its development build; Elements renders it, and says so too,
  // naming the component the list is in, once.
  it("name the component a list without keys is in, once", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const items = ["Shoes", "Hat"];
      const List = () => <>{items.map((item) => <Paragraph>{item}</Paragraph>)}</>;
      const email = <Email><Row><Column><List /></Column></Row></Email>;
      renderToHtml(email);
      renderToHtml(email);
      const keys = error.mock.calls.map((call) => String(call[0])).filter((m) => m.startsWith("[Unlayer]") && m.includes('unique "key"'));
      // (React 18 says it where the list is made, in its development build; React 19 where it renders.)
      if (Number.parseInt(React.version) >= 19) expect(keys).toEqual(['[Unlayer] Each child in a list should have a unique "key" prop (in the list <List> renders). See https://react.dev/link/warning-keys.']);
      else expect(keys).toEqual([]);
      // Two with the same key.
      const Twins = () => <>{["a", "b"].map((item) => <Paragraph key="same">{item}</Paragraph>)}</>;
      renderToHtml(<Email><Row><Column><Twins /></Column></Row></Email>);
      expect(error.mock.calls.map((call) => String(call[0]))).toContain('[Unlayer] Two children in a list have the same key, "same" (in the list <Twins> renders): keys should be unique.');
    } finally {
      error.mockRestore();
    }
  });
});

describe("a root (Email, Page, Document) placed among another's rows", () => {
  it("renders, as 0.1.22 rendered it (a shared layout's <Email> inside the template's)", () => {
    const html = renderToHtml(<Email><Email><Row><Column><Paragraph>Inner content</Paragraph></Column></Row></Email></Email>);
    expect(html).toContain("Inner content");
  });
});

describe("a root (Email, Page, Document) placed in a Column", () => {
  it("is left out, saying so, as 0.1.22 said", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const email = <Email><Row><Column><Paragraph>Outer</Paragraph><Email><Row><Column><Paragraph>Inner</Paragraph></Column></Row></Email></Column></Row></Email>;
      const html = renderToHtml(email);
      expect(html).toContain("Outer");
      expect(html).not.toContain("Inner");
      expect(JSON.stringify(renderToJson(email))).not.toContain("Inner");
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("<Email> is a root: it can't be placed in a Row or Column"));
    } finally {
      warn.mockRestore();
    }
  });
});
