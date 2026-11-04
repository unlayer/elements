import { describe, it, expect, vi } from "vitest";
import React from "react";
import { legacyRenderToHtml, renderToHtml, renderToHtmlParts, renderToPlainText } from "./render-to-html";
import { renderToJson } from "./render-to-json";
import Body from "../components/Body";
import Row from "../components/Row";
import Column from "../components/Column";
import Paragraph from "../components/Paragraph";
import Button from "../components/Button";
import Heading from "../components/Heading";
import Image from "../components/Image";
import Email from "../components/Email";
import Page from "../components/Page";
import Document from "../components/Document";
import { ColumnLayouts } from "../layouts/ColumnLayouts";

describe("renderToHtml", () => {
  // Today's components' own HTML numbers every element (the new engine writes only the ids authors give).
  it("generates unique element ids across the whole tree (no duplicates), in today's components' own HTML", () => {
    const html = legacyRenderToHtml(
      <Email contentWidth="600px">
        <Row layout={ColumnLayouts.OneColumn}>
          <Column>
            <Heading>A</Heading>
            <Image src="https://x/1.png" />
          </Column>
        </Row>
        <Row layout={ColumnLayouts.OneColumn}>
          <Column>
            <Heading>B</Heading>
            <Image src="https://x/2.png" />
          </Column>
        </Row>
      </Email>
    );
    const ids = [...html.matchAll(/id="(u_[a-z0-9_]+)"/gi)].map((m) => m[1]);
    expect(ids.length).toBeGreaterThan(6);
    expect(new Set(ids).size).toBe(ids.length); // every id is unique
  });

  it("renders a simple element to HTML string", () => {
    const html = renderToHtml(<Button>Click me</Button>);
    expect(typeof html).toBe("string");
    expect(html).toContain("Click me");
  });

  it("returns clean HTML without React hydration markers", () => {
    const html = renderToHtml(<Button>Test</Button>);
    expect(html).not.toContain("data-reactroot");
    expect(html).not.toContain("<!-- -->");
  });

  it("accepts config overrides", () => {
    const html = renderToHtml(<Button>Test</Button>, { mode: "email" });
    expect(typeof html).toBe("string");
    expect(html).toContain("Test");
  });

  it("renders a full Body/Row/Column tree", () => {
    const html = renderToHtml(
      <Body>
        <Row>
          <Column>
            <Paragraph>Hello World</Paragraph>
          </Column>
        </Row>
      </Body>
    );
    expect(html).toContain("Hello World");
  });

  it("works without config parameter", () => {
    const html = renderToHtml(<Paragraph>No config</Paragraph>);
    expect(html).toContain("No config");
  });

  it("throws with helpful message on render failure", () => {
    // A component that throws during render
    const Broken = () => { throw new Error("boom"); };
    expect(() => renderToHtml(<Broken />)).toThrow("[Unlayer] renderToHtml failed: boom");
  });

  it("includes tip in error message", () => {
    const Broken = () => { throw new Error("test"); };
    try {
      renderToHtml(<Broken />);
    } catch (e: any) {
      expect(e.message).toContain("Body > Row > Column > Item");
    }
  });

  it("renders bare Paragraph without Body/Row/Column wrapper", () => {
    const html = renderToHtml(<Paragraph>Bare paragraph</Paragraph>);
    expect(html).toContain("Bare paragraph");
    expect(typeof html).toBe("string");
  });

  it("renders bare Heading without wrapper", () => {
    const html = renderToHtml(<Heading>Bare heading</Heading>);
    expect(html).toContain("Bare heading");
    expect(html).toContain("<h1");
  });

  it("renders bare Image without wrapper", () => {
    const html = renderToHtml(<Image src="https://example.com/img.png" alt="Test" />);
    expect(html).toContain("https://example.com/img.png");
    expect(html).toContain("<img");
  });
});

// Today's components' own document shell (the legacy renderer's): a template the new engine can't draw renders in it.
describe("today's components' own HTML: full document shell", () => {
  const emailTree = (
    <Email>
      <Row>
        <Column>
          <Paragraph>Hello</Paragraph>
        </Column>
      </Row>
    </Email>
  );

  it("email mode returns a complete XHTML document with MSO support", () => {
    const html = legacyRenderToHtml(emailTree);
    expect(html.startsWith('<!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN"')).toBe(true);
    expect(html.trimEnd().endsWith("</html>")).toBe(true);
    expect(html).toContain('xmlns:v="urn:schemas-microsoft-com:vml"');
    expect(html).toContain("<!--[if gte mso 9]>");
    expect(html).toContain('<meta name="x-apple-disable-message-reformatting">');
    expect(html).toContain('<style type="text/css">');
    // Exactly one <body> — the email body exporter's own tag, not doubled by the shell
    expect(html.match(/<body[\s>]/g)).toHaveLength(1);
    // The Body renderer's <div> wrapper must not leak into the document
    expect(html).not.toMatch(/<\/head>\s*<div>/);
  });

  it("web mode returns an HTML5 document with the shell's <body>", () => {
    const html = legacyRenderToHtml(
      <Body mode="web">
        <Row>
          <Column>
            <Paragraph>Hello</Paragraph>
          </Column>
        </Row>
      </Body>
    );
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html.trimEnd().endsWith("</html>")).toBe(true);
    expect(html).toContain('<meta charset="utf-8">');
    expect(html.match(/<body[\s>]/g)).toHaveLength(1);
  });

  it("renders the title escaped", () => {
    const html = legacyRenderToHtml(emailTree, { title: 'Hi <"world"> & co' });
    expect(html).toContain("<title>Hi &lt;&quot;world&quot;&gt; &amp; co</title>");
  });

  it("renders font links (email wraps them in a !mso conditional)", () => {
    const html = renderToHtml(emailTree, {
      fonts: [{ url: "https://fonts.googleapis.com/css2?family=Inter" }],
    });
    expect(html).toContain(
      '<link href="https://fonts.googleapis.com/css2?family=Inter" rel="stylesheet" type="text/css">'
    );
    expect(html).toContain("<!--[if !mso]><!--><link");
  });

  it("links the root's own fonts prop, with the option's, each once", () => {
    const inter = { url: "https://fonts.googleapis.com/css2?family=Inter" };
    const serif = { url: "https://fonts.googleapis.com/css2?family=Instrument+Serif" };
    const html = renderToHtml(
      <Email fonts={[inter, serif]}>
        <Row>
          <Column>
            <Paragraph>Hello</Paragraph>
          </Column>
        </Row>
      </Email>,
      { fonts: [inter] }
    );
    expect(html.match(/family=Inter"/g)).toHaveLength(1);
    expect(html).toContain('href="https://fonts.googleapis.com/css2?family=Instrument+Serif"');
  });

  it("applies textDirection as the html dir attribute", () => {
    const html = renderToHtml(emailTree, { textDirection: "rtl" });
    expect(html).toContain('<html dir="rtl" xmlns=');
  });

  it("every <p> in the document carries the inline margin reset", () => {
    const html = legacyRenderToHtml(emailTree);
    const pTags = html.match(/<p[^>]*>/g) ?? [];
    expect(pTags.length).toBeGreaterThan(0);
    for (const tag of pTags) {
      expect(tag).toContain("margin: 0px; margin-block-start: 0px; margin-block-end: 0px;");
    }
  });

  it("document mode returns a print-ready XHTML document", async () => {
    const { default: Document } = await import("../components/Document");
    const html = legacyRenderToHtml(
      <Document>
        <Row>
          <Column>
            <Paragraph>Hello</Paragraph>
          </Column>
        </Row>
      </Document>
    );
    expect(html.startsWith('<!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN"')).toBe(true);
    expect(html.trimEnd().endsWith("</html>")).toBe(true);
    expect(html).toContain('<html xmlns="http://www.w3.org/1999/xhtml">');
    // Document mode carries no VML/MSO email plumbing
    expect(html).not.toContain("xmlns:v=");
    expect(html).not.toContain("<!--[if gte mso 9]>");
    // Exactly one <body> — the document body exporter's own tag
    expect(html.match(/<body[\s>]/g)).toHaveLength(1);
    expect(html).not.toMatch(/<\/head>\s*<div>/);
  });

  it("renders an empty tree to a valid document without crashing", () => {
    const html = legacyRenderToHtml(<Email />);
    expect(html.startsWith("<!DOCTYPE HTML PUBLIC")).toBe(true);
    expect(html.trimEnd().endsWith("</html>")).toBe(true);
    expect(html.match(/<body[\s>]/g)).toHaveLength(1);
  });

  it("keeps a bare item root's own wrapper div (only Unlayer wrappers get stripped)", () => {
    const html = renderToHtml(<Button className="cta-wrapper">Click</Button>);
    // The Button's host <div class="cta-wrapper"> is the element's own
    // markup, not a Body wrapper — it must survive into the document.
    expect(html).toContain('class="cta-wrapper"');
  });

  it("strips the Body renderer's wrapper even when the root has className/style", () => {
    const html = legacyRenderToHtml(
      <Email className="my-email" style={{ outline: "1px solid red" }}>
        <Row>
          <Column>
            <Paragraph>Hello</Paragraph>
          </Column>
        </Row>
      </Email>
    );
    expect(html.startsWith("<!DOCTYPE HTML PUBLIC")).toBe(true);
    expect(html.match(/<body[\s>]/g)).toHaveLength(1);
    expect(html).not.toMatch(/<\/head>\s*<div/);
  });
});

describe("renderToHtml: the new engine's document", () => {
  const tree = (Root: typeof Email) => (
    <Root>
      <Row>
        <Column>
          <Paragraph>Hello</Paragraph>
        </Column>
      </Row>
    </Root>
  );

  it("is a whole document, an email's with Outlook's settings, each with one <body>", () => {
    for (const Root of [Email, Page, Document]) {
      const html = renderToHtml(tree(Root));
      expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
      expect(html.trimEnd().endsWith("</html>")).toBe(true);
      expect(html.match(/<body[\s>]/g)).toHaveLength(1);
      expect(html.includes("<o:PixelsPerInch>96</o:PixelsPerInch>")).toBe(Root === Email);
    }
    expect(renderToHtml(tree(Email))).toContain('<meta name="x-apple-disable-message-reformatting">');
  });

  it("renders the title escaped", () => {
    const html = renderToHtml(tree(Email), { title: 'Hi <"world"> & co' });
    expect(html).toMatch(/<title>Hi &lt;("|&quot;)world("|&quot;)&gt; &amp; co<\/title>/);
  });

  it("sets every <p>'s margins to 0", () => {
    const tags = renderToHtml(tree(Email)).match(/<p[\s>][^>]*>/g) ?? [];
    expect(tags.length).toBeGreaterThan(0);
    for (const tag of tags) expect(tag).toContain("margin:0");
  });

  it("renders an empty tree to a valid document without crashing", () => {
    const html = renderToHtml(<Email />);
    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(html.match(/<body[\s>]/g)).toHaveLength(1);
  });
});

describe("display mode resolution for wrapper components", () => {
  const rows = (
    <Row>
      <Column>
        <Button href="https://example.com">Click</Button>
      </Column>
    </Row>
  );

  it("Email extracts head CSS in email mode (same as Body mode='email')", async () => {
    const { renderToHtmlParts } = await import("./render-to-html");
    const viaEmail = renderToHtmlParts(<Email>{rows}</Email>);
    const viaBody = renderToHtmlParts(<Body mode="email">{rows}</Body>);
    expect(viaEmail.head).toBe(viaBody.head);
  });

  it("Page extracts head CSS in web mode (same as Body mode='web')", async () => {
    const { renderToHtmlParts } = await import("./render-to-html");
    const { default: Page } = await import("../components/Page");
    const viaPage = renderToHtmlParts(<Page>{rows}</Page>);
    const viaBody = renderToHtmlParts(<Body mode="web">{rows}</Body>);
    expect(viaPage.head).toBe(viaBody.head);
  });

  it("Document extracts head CSS in document mode (same as Body mode='document')", async () => {
    const { renderToHtmlParts } = await import("./render-to-html");
    const { default: Document } = await import("../components/Document");
    const viaDocument = renderToHtmlParts(<Document>{rows}</Document>);
    const viaBody = renderToHtmlParts(<Body mode="document">{rows}</Body>);
    expect(viaDocument.head).toBe(viaBody.head);
  });
});

describe("renderToPlainText: unaffected by the document shell", () => {
  it("emits only the content text — no doctype, CSS, or meta noise", async () => {
    const { renderToPlainText } = await import("./render-to-html");
    const text = renderToPlainText(
      <Email>
        <Row>
          <Column>
            <Paragraph>First paragraph</Paragraph>
            <Paragraph>Second paragraph</Paragraph>
          </Column>
        </Row>
      </Email>
    );
    expect(text).toContain("First paragraph");
    expect(text).toContain("Second paragraph");
    expect(text).not.toContain("DOCTYPE");
    expect(text).not.toContain("margin");
    expect(text).not.toContain("{");
  });
});

describe("document direction and language", () => {
  it.each([Email, Page, Document])("uses root metadata without requiring renderer options", (Root) => {
    const html = renderToHtml(<Root textDirection="rtl" lang="ar"><Row><Column><Paragraph>مرحبا</Paragraph></Column></Row></Root>);
    expect(html).toMatch(/<html[^>]*dir="rtl"/);
    expect(html).toMatch(/<html[^>]*lang="ar"/);
  });

  it("allows renderer options to override root metadata and escapes language", () => {
    const html = renderToHtml(<Email textDirection="rtl" lang="ar"><Row><Column /></Row></Email>, { textDirection: "ltr", lang: 'en" data-injected="yes' });
    expect(html).toMatch(/<html[^>]*dir="ltr"/);
    expect(html).toContain('lang="en&quot; data-injected=&quot;yes"');
  });

  it("reads direction from design body values", () => {
    const html = renderToHtml(<Email values={{ textDirection: "rtl" } as any}><Row><Column /></Row></Email>);
    expect(html).toMatch(/<html[^>]*dir="rtl"/);
  });
});

describe("renderToHtml with a template component", () => {
  const root = ({ name }: { name: string }) => (
    <Email lang="ar" textDirection="rtl" fonts={[{ url: "https://fonts.googleapis.com/css2?family=Inter" }]}>
      <Row>
        <Column>
          <Paragraph mobile={{ fontSize: "12px" }}>Hello {name}</Paragraph>
        </Column>
      </Row>
    </Email>
  );
  const Welcome = (props: { name: string }) => root(props);
  const direct = renderToHtml(root({ name: "Ada" }));

  it("renders <Welcome /> as its root, with the root's settings", () => {
    expect(renderToHtml(<Welcome name="Ada" />)).toBe(direct);
    expect(direct).toContain('lang="ar"');
    expect(direct).toContain('dir="rtl"');
    expect(direct).toContain("family=Inter");
    expect(direct).toMatch(/font-size:\s*12px/);
  });

  it("unwraps memo and forwardRef, nested in any order", () => {
    const Memo = React.memo(Welcome);
    const Ref = React.forwardRef<unknown, { name: string }>((props, _ref) => <Welcome {...props} />);
    const MemoRef = React.memo(Ref);
    for (const Template of [Memo, Ref, MemoRef]) expect(renderToHtml(<Template name="Ada" />)).toBe(direct);
  });

  it("unwraps a wrapper that uses hooks, keeping the root's settings", () => {
    const WithHook = (props: { name: string }) => {
      React.useId();
      const [name] = React.useState(props.name);
      return root({ name });
    };
    expect(renderToHtml(<WithHook name="Ada" />)).toBe(direct);
  });

  it("falls back to rendering through React, with a warning, for a wrapper past the depth limit", () => {
    let Deep: React.ComponentType<{ name: string }> = Welcome;
    for (let i = 0; i < 21; i++) {
      const Inner = Deep;
      Deep = (props: { name: string }) => <Inner {...props} />;
    }
    const warnings: string[] = [];
    const warn = console.warn;
    console.warn = (message: string) => void warnings.push(message);
    try {
      expect(renderToHtml(<Deep name="Ada" />)).toContain("Hello Ada");
    } finally {
      console.warn = warn;
    }
    expect(warnings.join()).toContain("couldn't unwrap");
  });

  it("unwraps StrictMode and Profiler, keeping the root's settings; says why a class template isn't unwrapped", () => {
    const warnings: string[] = [];
    const warn = console.warn;
    console.warn = (message: string) => void warnings.push(message);
    class Template extends React.Component<{ name: string }> {
      render() { return root(this.props); }
    }
    try {
      expect(renderToHtml(<React.StrictMode><Welcome name="Ada" /></React.StrictMode>)).toBe(direct);
      expect(renderToHtml(<React.Profiler id="email" onRender={() => {}}><Welcome name="Ada" /></React.Profiler>)).toBe(direct);
      expect(warnings).toEqual([]);
      // A class renders through React, as in 0.1.22, and the message says why its root's settings aren't read.
      expect(renderToHtml(<Template name="Ada" />)).toContain("Hello Ada");
    } finally {
      console.warn = warn;
    }
    expect(warnings.join()).toContain("couldn't unwrap <Template> (<Template> is a class component");
  });

  it("says nothing when the template has no root whose settings go unread (Rows, nothing, a list), as 0.1.22", () => {
    const warnings: string[] = [];
    const warn = console.warn;
    console.warn = (message: string) => void warnings.push(message);
    const Theme = React.createContext("light");
    const Banner = () => <Row><Column><Paragraph>Hi</Paragraph></Column></Row>;
    const Nothing = () => null;
    const List = () => [<Banner key="a" />, <Banner key="b" />] as unknown as React.ReactElement;
    const InMarkup = () => <div>{root({ name: "Ada" })}</div>;
    try {
      for (const template of [<Banner />, <Nothing />, <List />, <Theme.Provider value="dark"><Row><Column><Paragraph>Hi</Paragraph></Column></Row></Theme.Provider>]) {
        renderToHtml(template);
      }
      expect(warnings).toEqual([]);
      // A root inside other markup: its settings go unread, which the message says.
      expect(renderToHtml(<InMarkup />)).toContain("Hello Ada");
    } finally {
      console.warn = warn;
    }
    expect(warnings.join()).toContain("couldn't unwrap <InMarkup> (its root is inside other markup)");
  });

  it("gives the design of a template named like an Elements component (`displayName = \"Row\"`), as 0.1.22 did", () => {
    const Layout = (props: { name: string }) => root(props);
    Layout.displayName = "Row";
    expect(JSON.stringify(renderToJson(<Layout name="Ada" />))).toContain("Hello Ada");
  });

  it("says an async template isn't supported", () => {
    const Async = (async () => root({ name: "Ada" })) as unknown as React.ComponentType;
    expect(() => renderToHtml(<Async />)).toThrow("async and suspending templates aren't supported");
  });

  it("leaves Elements components and plain HTML as they are", () => {
    const warn = console.warn;
    const warnings: string[] = [];
    console.warn = (message: string) => void warnings.push(message);
    try {
      renderToHtml(<Paragraph>Just a block</Paragraph>);
    } finally {
      console.warn = warn;
    }
    expect(warnings).toEqual([]);
  });
});

describe("renderToHtml inside a React render", () => {
  // An app showing a live preview: renderToHtml runs while its component renders.
  const { render: mount } = require("@testing-library/react") as typeof import("@testing-library/react");
  const Template = ({ name }: { name: string }) => {
    const id = React.useId();
    const [greeting] = React.useState("Hello");
    return (
      <Email lang="ar" textDirection="rtl" previewText={id}>
        <Row>
          <Column>
            <Paragraph mobile={{ fontSize: "12px" }}>{`${greeting} ${name}`}</Paragraph>
          </Column>
        </Row>
      </Email>
    );
  };
  const Preview = ({ name }: { name: string }) => {
    const [count, setCount] = React.useState(0);
    const html = React.useMemo(() => renderToHtml(<Template name={name} />), [name]);
    React.useEffect(() => void setCount((c) => c + 1), [name]);
    return <output data-count={count}>{html}</output>;
  };

  it("doesn't touch the app's hooks, across re-renders, and keeps the root's settings", () => {
    const errors: string[] = [];
    const error = console.error;
    console.error = (...args: unknown[]) => void errors.push(args.map(String).join(" "));
    let mounted: ReturnType<typeof mount>;
    try {
      mounted = mount(<Preview name="Ada" />);
      mounted.rerender(<Preview name="Grace" />);
      mounted.rerender(<Preview name="Linus" />);
    } finally {
      console.error = error;
    }
    expect(errors).toEqual([]);
    const { container } = mounted;
    expect(container.querySelector("output")?.getAttribute("data-count")).toBe("3");
    const html = container.querySelector("output")?.textContent ?? "";
    expect(html).toContain("Hello Linus");
    expect(html).toContain('lang="ar"');
    expect(html).toContain('dir="rtl"');
    expect(html).toMatch(/font-size:\s*12px/);
  });

  it("leaves the app's render working when the template throws", () => {
    const Broken = () => {
      React.useId();
      throw new Error("template bug");
    };
    const App = ({ n }: { n: number }) => {
      const [label] = React.useState("ok");
      const html = React.useMemo(() => {
        try {
          return renderToHtml(<Broken />);
        } catch {
          return "failed";
        }
      }, [n]);
      return <output>{`${label} ${html}`}</output>;
    };
    const warn = console.warn;
    console.warn = () => undefined;
    try {
      const { rerender, container } = mount(<App n={1} />);
      rerender(<App n={2} />);
      expect(container.querySelector("output")?.textContent).toBe("ok failed");
    } finally {
      console.warn = warn;
    }
  });

  it("works inside a server render of the app", () => {
    const { renderToString } = require("react-dom/server") as typeof import("react-dom/server");
    const App = () => {
      const id = React.useId();
      const html = renderToHtml(<Template name="Ada" />);
      return <output data-id={id}>{html}</output>;
    };
    const out = renderToString(<App />);
    expect(out).toContain("Hello Ada");
    expect(out).toContain("dir=&quot;rtl&quot;");
    expect(out).toMatch(/data-id=":R[^"]*:"/);
  });

  it("keeps the root's settings for a template that uses hooks, outside a render too", () => {
    const html = renderToHtml(<Template name="Ada" />);
    expect(html).toContain("Hello Ada");
    expect(html).toContain('dir="rtl"');
  });
});

describe("what a render takes as a template", () => {
  const block = <Paragraph>Words</Paragraph>;
  const rows = <Row><Column>{block}</Column></Row>;
  const renders = [["renderToHtml", renderToHtml], ["renderToHtmlParts", renderToHtmlParts], ["renderToPlainText", renderToPlainText]] as const;
  const text = (element: React.ReactElement) => renderToPlainText(element);
  const quietly = (run: () => void) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      run();
      return warn.mock.calls.map((call) => String(call[0]));
    } finally {
      warn.mockRestore();
    }
  };

  describe("with no root of its own, in a root around it, in the mode it says or the render's", () => {
    const Banner = () => rows;
    const List = () => [<Banner key="a" />, <Banner key="b" />] as unknown as React.ReactElement;
    const Theme = React.createContext("from no provider");
    const FromContext = () => <Paragraph>{React.useContext(Theme)}</Paragraph>;

    it.each([
      ["a block", block],
      ["a Column", <Column>{block}</Column>],
      ["a Row", rows],
      ["a component that returns a Row", <Banner />],
      ["a memo around one", React.createElement(React.memo(Banner))],
      ["a Fragment of Rows", <>{rows}{rows}</>],
      ["a component that returns a list", <List />],
    ])("%s", (_, template) => {
      const warnings = quietly(() => {
        expect(renderToHtml(template)).toMatch(/^<!DOCTYPE html>/);
        expect(renderToHtml(template)).toContain("Words");
        expect(renderToHtml(template)).not.toContain("<table");
        expect(renderToHtml(template, { mode: "email" })).toContain('role="presentation"');
        expect(renderToHtmlParts(template).body).toContain("Words");
        expect(text(template)).toContain("Words");
      });
      expect(warnings).toEqual([]);
    });

    it("a Row's own mode wins over the render's, as a root's does", () => {
      expect(renderToHtml(<Row mode="email"><Column>{block}</Column></Row>, { mode: "web" })).toContain('role="presentation"');
    });

    it("what's in a provider stays in it", () => {
      expect(text(<Theme.Provider value="from the provider"><Row><Column><FromContext /></Column></Row></Theme.Provider>)).toBe("from the provider");
    });

    it("nothing: a document with nothing in it", () => {
      const Nothing = () => null;
      expect(quietly(() => expect(renderToHtml(<Nothing />)).toMatch(/^<!DOCTYPE html>[\s\S]*<\/html>$/))).toEqual([]);
      expect(text(<Nothing />)).toBe("");
    });

    it("a block's own host <div>, with its className and style, in the document", () => {
      const html = renderToHtml(<Button className="cta-wrapper" style={{ outline: "1px solid red" }}>Go</Button>);
      expect(html).toContain('<div class="cta-wrapper" style="outline:1px solid red">');
      expect(html.indexOf("cta-wrapper")).toBeLessThan(html.indexOf("Go"));
    });

    it("a block's own padding isn't a Column's: it has none here", () => {
      expect(renderToHtml(<Paragraph containerPadding="33px">Words</Paragraph>)).not.toContain("padding:33px");
    });
  });

  describe("a template component, its root's settings read", () => {
    class Template extends React.Component<{ name: string }> {
      static contextType = React.createContext("from context");
      declare context: string;
      state = { greeting: "Hello" };
      render() {
        return <Email lang="ar"><Row><Column><Paragraph>{`${this.state.greeting} ${this.props.name}, ${this.context}`}</Paragraph></Column></Row></Email>;
      }
    }

    it("a class, called by React so its state and context work", () => {
      const warnings = quietly(() => {
        const html = renderToHtml(<Template name="Ada" />);
        expect(html).toContain("Hello Ada, from context");
        expect(html).toContain('lang="ar"');
        expect(html).toContain('role="article"');
      });
      expect(warnings).toEqual([]);
    });

    it("a class that throws fails the render, saying so", () => {
      class Broken extends React.Component {
        render(): React.ReactNode {
          throw new Error("boom");
        }
      }
      expect(() => renderToHtml(<Broken />)).toThrow("[Unlayer] renderToHtml failed: boom");
    });

    it("in a Suspense, which waits for nothing here", () => {
      expect(renderToHtml(<React.Suspense fallback={null}><Email lang="ar">{rows}</Email></React.Suspense>)).toContain('lang="ar"');
    });

    it("renderToJson still says a class isn't called", () => {
      expect(() => renderToJson(<Template name="Ada" />)).toThrow("Root element must be");
    });
  });

  describe("what can't be one, saying so", () => {
    const Markup = () => <div>Markup</div>;
    const InMarkup = () => <div><Email>{rows}</Email></div>;
    const Lazy = React.lazy(() => Promise.resolve({ default: () => <Email>{rows}</Email> }));
    let Deep: React.ComponentType = () => <Email>{rows}</Email>;
    for (let i = 0; i < 21; i++) {
      const Inner = Deep;
      Deep = () => <Inner />;
    }

    it.each([
      ["markup", <div>Markup</div>, /<div> isn't a template.*<Html> block/],
      ["markup around Rows", <div>{rows}</div>, /<div> isn't a template/],
      ["a component that returns markup", <Markup />, /<div> isn't a template/],
      ["a root in markup", <div><Email>{rows}</Email></div>, /<div> isn't a template/],
      ["a component with a root in its markup", <InMarkup />, /couldn't read <InMarkup> as a template \(its root is inside other markup\).*Pass the root element/],
      ["two roots", <><Email>{rows}</Email><Email>{rows}</Email></>, /its root is inside other markup/],
      ["a lazy component", <Lazy />, /async and suspending templates aren't supported/],
      ["a component past the depth limit", <Deep />, /couldn't read <.*> as a template \(it wraps more than 20 components\)/],
      ["what isn't an element", "Words" as unknown as React.ReactElement, /a template is a React element.*not string/],
    ])("%s", (_, template, why) => {
      for (const [name, render] of renders) {
        expect(() => render(template)).toThrow(why);
        expect(() => render(template)).toThrow(`[Unlayer] ${name}`);
      }
    });
  });

  it("says what a failure is once: what's said by Elements isn't said again", () => {
    const Broken = () => {
      throw new Error("boom");
    };
    let message = "";
    try {
      renderToHtml(<Email><Row><Column>{block}</Column></Row><Broken /></Email>);
      renderToHtml(<div />);
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message.match(/\[Unlayer\]/g)).toHaveLength(1);
  });

  it("keeps the first error as the cause, where it says more than a message", () => {
    const boom = new Error("boom");
    const Broken = () => {
      throw boom;
    };
    let thrown: Error | undefined;
    try {
      renderToHtml(<Broken />);
    } catch (error) {
      thrown = error as Error;
    }
    expect(thrown?.message).toContain("[Unlayer] renderToHtml failed: boom");
    expect((thrown as Error & { cause?: unknown }).cause).toBe(boom);
  });
});
