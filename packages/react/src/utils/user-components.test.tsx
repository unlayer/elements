import { describe, it, expect, vi } from "vitest";
import React, { forwardRef, memo, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { renderToHtml, renderToHtmlParts, renderToPlainText } from "./render-to-html";
import { renderToJson } from "./render-to-json";
import { Email, Page, Row, Column, Paragraph, Heading, Html, Button as ElementsButton, ColumnLayouts, Image, Divider, Menu, Social, Table, Video, UnlayerProvider } from "../index";
import { Font } from "../font";
import { Head } from "../head";
import * as asyncRenderers from "../async";

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

describe("React.memo (or forwardRef) around one of Elements' own components", () => {
  const blocks: Array<[string, React.ComponentType<any>, Record<string, unknown>]> = [
    ["Paragraph", Paragraph, { children: "para text" }],
    ["Heading", Heading, { children: "heading text" }],
    ["Button", ElementsButton, { href: "https://x.test", children: "button text" }],
    ["Image", Image, { src: "https://img.test/a.png", alt: "alt text", width: 100, height: 50 }],
    ["Divider", Divider, {}],
    ["Html", Html, { html: "<p>html block text</p>" }],
    ["Menu", Menu, { items: [{ text: "menu item", href: "https://x.test/m" }] }],
    ["Social", Social, { icons: [{ name: "Facebook", url: "https://facebook.com/x" }] }],
    ["Table", Table, { headers: ["h1"], rows: [["table cell"]] }],
    ["Video", Video, { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }],
  ];
  // (forwardRef of a component taking no ref: React says so, in development.)
  const wrappers: Array<[string, <T>(type: T) => T]> = [
    ["memo", (type) => memo(type as any) as any],
    ["a memo of a memo", (type) => memo(memo(type as any)) as any],
    ["forwardRef", (type) => forwardRef(type as any) as any],
  ];
  const quiet = <T,>(render: () => T): T => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      return render();
    } finally {
      error.mockRestore();
    }
  };
  const both = (template: React.ReactElement) => quiet(() => ({ html: renderToHtml(template), design: renderToJson(template) }));

  describe.each(wrappers)("%s", (_, wrap) => {
    it.each(blocks)("of a %s is that block, in the HTML and the design", (_, Block, props) => {
      const Wrapped = wrap(Block);
      expect(both(<Email><Row><Column><Wrapped {...props} /></Column></Row></Email>)).toEqual(both(<Email><Row><Column><Block {...props} /></Column></Row></Email>));
    });

    it("of a Row or a Column is that Row or Column, with what's in it", () => {
      const WrappedRow = wrap(Row);
      const WrappedColumn = wrap(Column);
      const after = <Row><Column><Paragraph>Footer</Paragraph></Column></Row>;
      expect(both(<Email><WrappedRow><Column><Paragraph>in a row</Paragraph></Column></WrappedRow>{after}</Email>)).toEqual(both(<Email><Row><Column><Paragraph>in a row</Paragraph></Column></Row>{after}</Email>));
      expect(both(<Email><Row><WrappedColumn><Paragraph>in a column</Paragraph></WrappedColumn></Row>{after}</Email>)).toEqual(both(<Email><Row><Column><Paragraph>in a column</Paragraph></Column></Row>{after}</Email>));
    });
  });

  it("is that component in the async renderers too", async () => {
    const [WrappedRow, WrappedColumn, WrappedParagraph] = [memo(Row), memo(Column), memo(Paragraph)];
    const template = (wrapped: boolean) => (wrapped ? <Email><WrappedRow><WrappedColumn><WrappedParagraph>text</WrappedParagraph></WrappedColumn></WrappedRow></Email> : <Email><Row><Column><Paragraph>text</Paragraph></Column></Row></Email>);
    expect(await asyncRenderers.renderToJson(template(true))).toEqual(await asyncRenderers.renderToJson(template(false)));
    expect(await asyncRenderers.renderToHtml(template(true))).toBe(await asyncRenderers.renderToHtml(template(false)));
  });

  it("keeps a key it's given, in a list", () => {
    const P = memo(Paragraph);
    const items = ["one", "two"];
    expect(both(<Email><Row><Column>{items.map((t) => <P key={t}>{t}</P>)}</Column></Row></Email>)).toEqual(both(<Email><Row><Column>{items.map((t) => <Paragraph key={t}>{t}</Paragraph>)}</Column></Row></Email>));
  });
});

describe("what a lazy template's module renders around its root", () => {
  const loaded = (type: React.ComponentType) => React.lazy(() => ({ then: (done: (m: { default: React.ComponentType }) => void) => done({ default: type }) }) as Promise<{ default: React.ComponentType }>);
  const later = (type: React.ComponentType) => React.lazy(() => new Promise<{ default: React.ComponentType }>((done) => setTimeout(() => done({ default: type }), 2)));
  const content = <Row><Column><Paragraph>Bonjour</Paragraph></Column></Row>;

  it("gives the root an <UnlayerProvider>'s config there, as the same template not lazy (it was left out)", async () => {
    const Receipt = () => <UnlayerProvider config={{ textDirection: "rtl" }}><Email>{content}</Email></UnlayerProvider>;
    expect(renderToHtml(<Receipt />)).toContain('dir="rtl"');
    expect(renderToHtml(React.createElement(loaded(Receipt)))).toBe(renderToHtml(<Receipt />));
    expect(await asyncRenderers.renderToHtml(React.createElement(later(Receipt)))).toBe(await asyncRenderers.renderToHtml(<Receipt />));
  });

  it("isn't in a context's provider there: the content reads the context's default (documented: provide it inside the root, or around the lazy element)", async () => {
    const Locale = React.createContext("en");
    const Greeting = () => <Paragraph>{useContextValue(Locale) === "fr" ? "Bonjour Ada" : "Hello Ada"}</Paragraph>;
    const outside = () => <Locale.Provider value="fr"><Email><Row><Column><Greeting /></Column></Row></Email></Locale.Provider>;
    const inside = () => <Email><Locale.Provider value="fr"><Row><Column><Greeting /></Column></Row></Locale.Provider></Email>;
    expect(renderToPlainText(React.createElement(loaded(outside)))).toContain("Hello Ada");
    expect((await asyncRenderers.renderToPlainText(React.createElement(later(outside))))).toContain("Hello Ada");
    expect(renderToPlainText(React.createElement(loaded(inside)))).toContain("Bonjour Ada");
    expect(renderToPlainText(<Locale.Provider value="fr">{React.createElement(loaded(outside))}</Locale.Provider>)).toContain("Bonjour Ada");
  });
});

const useContextValue = <T,>(context: React.Context<T>): T => React.useContext(context);

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

describe("a template with no root", () => {
  // Rows, a block and markup with no Email, Page, Document or Body around them, inside a wrapper: rendered as a
  // root's content is, without the root's markup. The HTML, the head and the plain text are made from one render.
  const counted = () => {
    const runs: Record<string, number> = {};
    const ran = (name: string) => void (runs[name] = (runs[name] ?? 0) + 1);
    const Hero = () => {
      ran("Hero");
      const [text] = useState("Hero");
      return <Paragraph mobile={{ fontSize: "30px" }}>{text}</Paragraph>;
    };
    const Note = () => {
      ran("Note");
      const [text] = useState("Note");
      return <b>{text}</b>;
    };
    const Rows = ({ children }: { children?: React.ReactNode }) => (ran("Rows"), <>{block("One")}{children}<div><Note /></div></>);
    const Wrapper = ({ children }: { children: React.ReactNode }) => (ran("Wrapper"), <>{children}</>);
    return { runs, element: <Wrapper><Rows><Row><Column><Hero /></Column></Row></Rows></Wrapper> };
  };

  it.each([
    ["renderToHtml", (element: React.ReactElement) => renderToHtml(element)],
    ["renderToHtmlParts", (element: React.ReactElement) => Object.values(renderToHtmlParts(element)).join("")],
    ["renderToPlainText", (element: React.ReactElement) => renderToPlainText(element)],
  ])("%s runs each of its components once", (_, render) => {
    const { runs, element } = counted();
    const out = render(element);
    expect(out).toContain("Hero");
    expect(out).toContain("Note");
    expect(runs).toEqual({ Wrapper: 1, Rows: 1, Hero: 1, Note: 1 });
  });

  it("renderToJson says it needs a root, calling its wrappers once and nothing they render", () => {
    const { runs, element } = counted();
    expect(() => renderToJson(element)).toThrow("Root element must be <Body>, <Email>, <Page>, or <Document>");
    expect(runs).toEqual({ Wrapper: 1, Rows: 1 });
  });

  it("numbers its rows and blocks as its head does, in the render's mode", () => {
    const html = renderToHtml(counted().element, { mode: "email" });
    const body = html.slice(html.indexOf("</head>"));
    const ids = [...body.matchAll(/id="(u_(?:row|column|content_paragraph)_\d+)"/g)].map((m) => m[1]);
    expect(ids).toEqual(["u_row_1", "u_column_1", "u_content_paragraph_1", "u_row_2", "u_column_2", "u_content_paragraph_2"]);
    // The phone CSS the second block asked for is on its id.
    expect(/#(u_content_paragraph_\d+)[^{]*\{[^}]*font-size:\s*30px/.exec(html)?.[1]).toBe("u_content_paragraph_2");
    expect(body.match(/id="u_row_\d+" class="u-row-container/g)).toHaveLength(2);
  });

  it("fails on a part that fails, naming it and where it is, or leaves it out (onError: \"omit\"), as in a root", () => {
    const Later = async () => <Paragraph>Later</Paragraph>;
    const Broken = () => {
      throw new Error("boom");
    };
    const Rows = () => <>{block("Kept")}<Row><Column><Later /></Column></Row><Row><Column><Broken /></Column></Row></>;
    expect(() => renderToHtml(<Rows />)).toThrow('it is async or suspends, and this renderer is synchronous: render with "@unlayer/react-elements/async", or load its data first and pass it as props (in <Later> at Rows › Row 2 › Column 1 › Later)');
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const parts = renderToHtmlParts(<Rows />, { onError: "omit" });
      expect(parts.body).toContain("Kept");
      expect(parts.omitted.map((e) => e.message)).toEqual(["[Unlayer] it is async or suspends, and this renderer is synchronous: render with \"@unlayer/react-elements/async\", or load its data first and pass it as props (in <Later> at Rows › Row 2 › Column 1 › Later)", "[Unlayer] boom (in <Broken> at Rows › Row 3 › Column 1 › Broken)"]);
    } finally {
      error.mockRestore();
    }
  });

  it("is markup given no settings as attributes", () => {
    expect(renderToHtml(<div>Markup</div>)).toContain("<div>Markup</div>");
  });

  it("says what fails at its top is in the template, in every renderer", async () => {
    // (Not a component: a module's object, as a story file's default export is.)
    const Invalid = {} as unknown as React.FC;
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      for (const render of [renderToHtml, renderToHtmlParts, renderToPlainText, asyncRenderers.renderToHtml]) {
        await expect(Promise.resolve().then(() => render(<Invalid />))).rejects.toThrow(/but got: object\. .* \(in <template>\)$/);
      }
    } finally {
      error.mockRestore();
    }
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

  // Every kind of component is asked what it returned: an element given `dangerouslySetInnerHTML` gives what's in it,
  // any other element is kept whole, with its styles.
  const Ctx = React.createContext(0);
  const kinds = (element: React.ReactElement): Record<string, React.ReactElement> => {
    function Fn() {
      return element;
    }
    class Cls extends React.Component {
      render() {
        return element;
      }
    }
    // (Loaded already: a synchronous render renders it.)
    const loaded = (type: React.ComponentType) => React.lazy(() => ({ then: (resolve: (m: { default: React.ComponentType }) => void) => resolve({ default: type }) }) as Promise<{ default: React.ComponentType }>);
    const Forward = React.forwardRef(() => element);
    return {
      "a function": <Fn />,
      "a class": <Cls />,
      "a memo'd function": React.createElement(memo(Fn)),
      "a memo'd class": React.createElement(memo(Cls)),
      "a forwardRef": <Forward />,
      "a memo'd forwardRef": React.createElement(memo(Forward)),
      "a memo of a memo": React.createElement(memo(memo(Fn))),
      "a lazy function": React.createElement(loaded(Fn)),
      "a lazy class": React.createElement(loaded(Cls)),
      "a context's Consumer": <Ctx.Consumer>{() => element}</Ctx.Consumer>,
      "a context's Provider": <Ctx.Provider value={1}>{element}</Ctx.Provider>,
      "a StrictMode": <React.StrictMode>{element}</React.StrictMode>,
      "a Suspense": <React.Suspense>{element}</React.Suspense>,
    };
  };
  const shapes: Array<[string, React.ReactElement, string]> = [
    ["keeps the element around its content", <div style={{ backgroundColor: "red" }}>Hi</div>, '<div style="background-color:red">Hi</div>'],
    ["gives what's in an element given dangerouslySetInnerHTML", <div dangerouslySetInnerHTML={{ __html: "<p>Hi</p>" }} />, "<p>Hi</p>"],
  ];
  for (const [what, shape, kept] of shapes) {
    // (What a lazy component loads React renders itself, which Elements can't ask what it returned: below.)
    const asked = Object.entries(kinds(shape)).filter(([kind]) => !(shape.props.dangerouslySetInnerHTML && kind.startsWith("a lazy")));
    it.each(asked)(`${what}, from %s`, async (_, node) => {
      const email = <Email><Row><Column>{node}</Column></Row></Email>;
      const block = (design: { body: { rows: any[] } }) => design.body.rows[0].columns[0].contents;
      expect(block(renderToJson(email))).toEqual([expect.objectContaining({ type: "html", values: expect.objectContaining({ html: kept }) })]);
      expect(renderToHtml(email)).toContain(kept);
      expect(block(await asyncRenderers.renderToJson(email))).toEqual([expect.objectContaining({ type: "html", values: expect.objectContaining({ html: kept }) })]);
    });
  }

  // (One that loaded is rendered where it is: as 0.2.1 and 0.3's own renderer rendered it, the component it loads.)
  it("renders a lazy component that loaded as the component it loads: the contexts around it, its Rows and blocks the email's and the design's", async () => {
    const I18n = React.createContext({ locale: "en", cta: "Shop now" });
    const Promo = () => {
      const t = React.useContext(I18n);
      return (
        <Row backgroundColor="#fef3c7">
          <Column>
            <Heading>{`Promo (${t.locale})`}</Heading>
            <ElementsButton href="https://example.com/promo">{t.cta}</ElementsButton>
          </Column>
        </Row>
      );
    };
    const Loaded = React.lazy(() => ({ then: (resolve: (m: { default: React.ComponentType }) => void) => resolve({ default: Promo }) }) as Promise<{ default: React.ComponentType }>);
    const email = (promo: React.ReactNode) => (
      <I18n.Provider value={{ locale: "fr", cta: "Acheter" }}>
        <Email>
          <Row><Column><Paragraph>Bonjour</Paragraph></Column></Row>
          {promo}
          <Row><Column><Paragraph>Au revoir</Paragraph></Column></Row>
        </Email>
      </I18n.Provider>
    );
    // (The negative control: the component itself, with the context it's given, its Row and Button the email's.)
    const html = renderToHtml(email(<Promo />));
    expect(html).toContain("Acheter");
    expect(html).toContain("v:roundrect");
    expect(renderToJson(email(<Promo />)).body.rows.map((row) => row.columns[0].contents.map((c) => c.type))).toEqual([["text"], ["heading", "button"], ["text"]]);
    expect(renderToHtml(email(<Loaded />))).toBe(html);
    expect(renderToJson(email(<Loaded />))).toEqual(renderToJson(email(<Promo />)));
    expect(renderToPlainText(email(<Loaded />))).toBe(renderToPlainText(email(<Promo />)));
    expect(await asyncRenderers.renderToHtml(email(<Loaded />))).toBe(html);
    // HTML given whole in what it renders, with a comment it doesn't end, ends nothing after it.
    const Open = () => <><Row><Column><Html html="<p>Hi <!-- truncated" /></Column></Row><Row><Column><Paragraph>Next row</Paragraph></Column></Row></>;
    const Comment = () => <div dangerouslySetInnerHTML={{ __html: "<p>Hi <!-- truncated" }} />;
    const LoadedComment = React.lazy(() => ({ then: (resolve: (m: { default: React.ComponentType }) => void) => resolve({ default: Comment }) }) as Promise<{ default: React.ComponentType }>);
    const after = renderToJson(<Email><Row><Column><LoadedComment /></Column></Row><Row><Column><Paragraph>Next row</Paragraph></Column></Row></Email>);
    expect(after.body.rows).toHaveLength(2);
    expect(JSON.stringify(after.body.rows[1])).toContain("Next row");
    expect(renderToJson(<Email><Open /></Email>).body.rows).toHaveLength(2);
  });

  it("keeps a lazy component's element given dangerouslySetInnerHTML whole (React renders what it loads, unasked)", () => {
    const element = <div dangerouslySetInnerHTML={{ __html: "<p>Hi</p>" }} />;
    const Fn = () => element;
    const loaded = React.lazy(() => ({ then: (resolve: (m: { default: React.ComponentType }) => void) => resolve({ default: Fn }) }) as Promise<{ default: React.ComponentType }>);
    const email = <Email><Row><Column>{React.createElement(loaded)}</Column></Row></Email>;
    expect(renderToJson(email).body.rows[0].columns[0].contents).toEqual([expect.objectContaining({ type: "html", values: expect.objectContaining({ html: "<div><p>Hi</p></div>" }) })]);
  });

  it("asks a component the async renderers waited for what it returned: an async one, a class that suspended, a lazy one", async () => {
    const element = <div style={{ backgroundColor: "red" }}>Hi</div>;
    const kept = '<div style="background-color:red">Hi</div>';
    const later = <T,>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), 1));
    let ready: Promise<unknown> | undefined;
    class Suspends extends React.Component {
      render() {
        if (!ready) throw (ready = later(null));
        return element;
      }
    }
    const Async = async () => (await later(null), element);
    const Lazy = React.lazy(() => later({ default: () => element }));
    const LazyClass = React.lazy(() => later({ default: Suspends }));
    for (const node of [<Suspends key="a" />, React.createElement(Async as unknown as React.FC), <Lazy key="c" />, <LazyClass key="d" />]) {
      ready = undefined;
      const design = await asyncRenderers.renderToJson(<Email><Row><Column>{node}</Column></Row></Email>);
      expect(design.body.rows[0].columns[0].contents).toEqual([expect.objectContaining({ type: "html", values: expect.objectContaining({ html: kept }) })]);
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

describe("markup holding what writes nothing", () => {
  it("is markup: a <Font> in a link straight in a Column leaves the link a Paragraph, in the HTML and the design", () => {
    const font = <Font family="Inter" url="https://fonts.example.com/inter.css" />;
    const email = <Email><Row><Column><a href="https://example.com/x">{font}Go</a><Paragraph>After</Paragraph></Column></Row></Email>;
    const contents = renderToJson(email).body.rows[0].columns[0].contents as { type: string; values: { text?: string } }[];
    expect(contents.map((content) => content.type)).toEqual(["text", "text"]);
    expect(contents[0].values.text).toContain('href="https://example.com/x"');
    expect(renderToHtml(email)).toContain(">Go</a>");
  });
});

describe("a block rendered to a string inside a component", () => {
  it("is what the block renders with react-dom's own render; Elements' render functions can't start there", () => {
    const viaParts = () => renderToHtmlParts(<Paragraph>From parts</Paragraph>).body;
    const viaReactDom = () => renderToStaticMarkup(<Paragraph>From react-dom</Paragraph>);
    const viaPlainText = () => renderToPlainText(<Paragraph>From plain text</Paragraph>);
    const Signature = ({ make }: { make: () => string }) => <Row><Column><Html html={make()} /></Column></Row>;
    const html = renderToHtml(<Email>{block("Hello")}<Signature make={viaReactDom} /></Email>);
    expect(html).toContain("From react-dom");
    expect(html).not.toContain("unlayer-mark");
    // (react-dom can't start a render inside its own: said by name, see src/utils/nested-renders.test.tsx.)
    for (const make of [viaParts, viaPlainText]) expect(() => renderToHtml(<Email>{block("Hello")}<Signature make={make} /></Email>)).toThrow(/can't start while a component of a template that Elements is rendering synchronously is called/);
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
  it.skipIf(process.env.NODE_ENV === "production")("name the component a list without keys is in, once", () => {
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

  it.skipIf(process.env.NODE_ENV === "production")("say a bounded number of them (a list's keys can come from data), then once that no more are said", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const Pairs = ({ ids }: { ids: number[] }) => <>{ids.flatMap((id) => [<Paragraph key={`id-${id}`}>a</Paragraph>, <Paragraph key={`id-${id}`}>b</Paragraph>])}</>;
      for (let batch = 0; batch < 3; batch++) renderToHtml(<Email><Row><Column><Pairs ids={Array.from({ length: 100 }, (_, i) => batch * 100 + i)} /></Column></Row></Email>);
      const said = error.mock.calls.map((call) => String(call[0])).filter((m) => m.startsWith("[Unlayer]"));
      expect(said.length).toBeLessThanOrEqual(101);
      expect(said.at(-1)).toBe("[Unlayer] More warnings about keys in lists aren't said.");
    } finally {
      error.mockRestore();
    }
  });
});

describe("keys in lists of lists", () => {
  // The React Email migration writes a list item that's several Rows as a list of them (`articles.map((article) =>
  // [<Row key={0} />, <Row key={1} />])`): each list's keys are its own, as in React, so a key in each isn't two
  // children with the same key.
  it("are each list's own, in every renderer", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const articles = ["One", "Two", "Three"];
      const email = (
        <Email>
          {articles.map((title, index) => [
            <Row key={0}><Column><Paragraph>{title}</Paragraph></Column></Row>,
            <Row key={1}><Column>{index < articles.length - 1 ? <Paragraph>Next</Paragraph> : null}</Column></Row>,
          ])}
        </Email>
      );
      renderToHtml(email);
      renderToJson(email);
      renderToPlainText(email);
      const { renderToHtml: renderAsync } = await import("../async");
      await renderAsync(email);
      expect(error.mock.calls.map((call) => String(call[0])).filter((m) => /key/.test(m))).toEqual([]);
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

describe("a component that asks for a resource hint (ReactDOM.preload, preconnect, preinit: React 19)", () => {
  // React 19 writes what's asked for before the markup it renders, which an email has no use for: the template's
  // markup was read from the wrong place (the email blank, or its markup cut short).
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- react-dom's own entry, which the hints are on.
  const ReactDOM = require("react-dom") as Record<string, ((...args: unknown[]) => void) | undefined>;
  const HINTS: Array<[string, () => void]> = [
    ["preload (an image)", () => ReactDOM.preload!("https://cdn.example.com/hero.png", { as: "image", fetchPriority: "high" })],
    ["preload (a font)", () => ReactDOM.preload!("https://cdn.example.com/f.woff2", { as: "font", type: "font/woff2", crossOrigin: "" })],
    ["preinit (a stylesheet)", () => ReactDOM.preinit!("https://cdn.example.com/site.css", { as: "style", precedence: "default" })],
    ["preconnect", () => ReactDOM.preconnect!("https://cdn.example.com")],
    ["prefetchDNS", () => ReactDOM.prefetchDNS!("https://cdn.example.com")],
  ];
  const template = (asks?: () => void) => {
    const Hero = () => (asks?.(), <img src="https://cdn.example.com/hero.png" alt="Hero" width={600} />);
    const Name = () => (asks?.(), <b>Ada</b>);
    const Meta = () => (asks?.(), <meta name="x-hero" content="1" />);
    return (
      <Email>
        <Head><Meta /></Head>
        <Row><Column><Hero /><Paragraph>Welcome aboard, <Name /></Paragraph></Column></Row>
        <Row><Column><Paragraph>Footer</Paragraph></Column></Row>
      </Email>
    );
  };
  it.runIf(typeof ReactDOM.preload === "function")("renders the template as it renders without it, in each renderer", async () => {
    // (The negative control: the template that asks for nothing.)
    const html = renderToHtml(template());
    expect(html).toContain("Welcome aboard, <b>Ada</b>");
    expect(html).toContain("hero.png");
    for (const [name, asks] of HINTS) {
      expect(renderToHtml(template(asks)), name).toBe(html);
      expect(renderToJson(template(asks)), name).toEqual(renderToJson(template()));
      expect(renderToPlainText(template(asks)), name).toBe(renderToPlainText(template()));
      expect(await asyncRenderers.renderToHtml(template(asks)), name).toBe(html);
      expect(await asyncRenderers.renderToJson(template(asks)), name).toEqual(renderToJson(template()));
    }
  });
});

describe("a class component whose render is a class field (`render = () => …`), or bound in its constructor", () => {
  // The field is the instance's own, which hid the render Elements wraps a class's in: a blank email, an empty design.
  // And a render bound in the constructor (`this.render = this.render.bind(this)`, as `auto-bind` does) is Elements'
  // own wrapped render, bound: wrapped again, what it captured was overwritten, a blank email with nothing said.
  /** A class rendering `render`: as a class field, bound in its constructor, or (the negative control) as a method. */
  const classOf = <P extends object>(name: string, field: boolean | "bound", render: (props: P) => React.ReactNode) => {
    const made =
      field === "bound"
        ? class extends React.Component<P> {
            constructor(props: P) {
              super(props);
              this.render = this.render.bind(this);
            }
            render() {
              return render(this.props);
            }
          }
        : field
          ? class extends React.Component<P> {
              render = () => render(this.props);
            }
          : class extends React.Component<P> {
              render() {
                return render(this.props);
              }
            };
    (made as unknown as { displayName: string }).displayName = name;
    return made;
  };
  const kinds = (field: boolean | "bound") => {
    const Welcome = classOf<{ name: string }>("Welcome", field, ({ name }) => <Email><Row><Column><Paragraph>{`Welcome ${name}`}</Paragraph><ElementsButton href="https://example.com/start">Start</ElementsButton></Column></Row></Email>);
    const Col = classOf<{ n: number }>("Col", field, ({ n }) => <Column><Paragraph>{`Column ${n}`}</Paragraph></Column>);
    const Section = classOf<{ n: number }>("Section", field, ({ n }) => <Row><Column><Heading>{`Section ${n}`}</Heading><ElementsButton href="https://example.com">Go</ElementsButton></Column></Row>);
    const Text = classOf<{ n: number }>("Text", field, ({ n }) => <Paragraph>{`In a Column ${n}`}</Paragraph>);
    return {
      template: <Welcome name="Ada" />,
      columns: <Email><Row layout={ColumnLayouts.TwoEqual}><Col n={1} /><Col n={2} /></Row></Email>,
      rows: <Email><Section n={1} /><Section n={2} /></Email>,
      "in a Column": <Email><Row><Column><Text n={1} /><Text n={2} /></Column></Row></Email>,
    };
  };
  it("renders as one whose render is a method: a template, a Row, a Column, a block in a Column", async () => {
    const methods = kinds(false);
    expect(renderToHtml(methods.template)).toContain("Welcome Ada");
    for (const [kind, fields] of [["a class field", kinds(true)], ["bound", kinds("bound")]] as const) {
      for (const key of Object.keys(methods) as Array<keyof typeof methods>) {
        const at = `${kind}: ${key}`;
        expect(renderToHtml(fields[key]), at).toBe(renderToHtml(methods[key]));
        expect(renderToJson(fields[key]), at).toEqual(renderToJson(methods[key]));
        expect(renderToPlainText(fields[key]), at).toBe(renderToPlainText(methods[key]));
        expect(await asyncRenderers.renderToHtml(fields[key]), at).toBe(renderToHtml(methods[key]));
      }
    }
  });
});
