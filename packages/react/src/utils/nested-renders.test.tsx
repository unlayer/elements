/**
 * Elements' renders inside another React render: an app page that renders on the server and works out its
 * design or HTML while it renders (`useMemo(() => renderToJson(<T />))`), and a template's component that does.
 * Elements' renders put React's hooks dispatcher back as they found it, so the outer component's hooks after the
 * call work, however deep (0.3.0 rendered with react-dom, whose module keeps a render's hook state: three levels
 * deep, a component calling a hook after the call was left out).
 */
import { describe, it, expect, vi } from "vitest";
import React, { useId, useMemo, useState } from "react";
import { renderToPipeableStream, renderToStaticMarkup, renderToString } from "react-dom/server";
// @ts-ignore react-dom/server.browser has no types of its own (the same API as react-dom/server).
import { renderToString as renderToStringWithBrowserBuild } from "react-dom/server.browser";
import { renderToHtml, renderToPlainText } from "./render-to-html";
import { renderToJson } from "./render-to-json";
import { Email, Page, Row, Column, Paragraph } from "../index";

const Template = () => <Email><Row><Column><Paragraph>Hello from the template</Paragraph></Column></Row></Email>;

describe("a page that renders on the server", () => {
  it("can work out the template's design while it renders, and use hooks after (as 0.1.22 could)", () => {
    function EditorPage() {
      const design = useMemo(() => renderToJson(<Template />), []);
      const [open] = useState(false);
      return <pre>{`${design.body.rows.length} rows, open=${open}`}</pre>;
    }
    expect(renderToString(<EditorPage />)).toBe("<pre>1 rows, open=false</pre>");
  });

  it("can work out its HTML too", () => {
    function PreviewPage() {
      const html = useMemo(() => renderToHtml(<Template />), []);
      const [zoom] = useState(1);
      return <pre>{`${html.includes("Hello from the template")}, zoom=${zoom}`}</pre>;
    }
    expect(renderToString(<PreviewPage />)).toBe("<pre>true, zoom=1</pre>");
  });
});

/** Where a stream of react-dom's is written: nowhere (Node's streams aren't in this test's environment). */
const sink = () => ({ write: () => true, end: () => {}, destroy: () => {}, on() { return this; } }) as unknown as NodeJS.WritableStream;

describe("a page that renders on the server, with a Context Provider around a component that renders an email", () => {
  // The template's own providers are the email's. A context it doesn't provide reads, inside the page's renderToString,
  // the page's value, as 0.2 did (react-dom's own render inside a render, renderToStaticMarkup in a component, reads
  // its default), and inside its stream, its default (see src/regression/render-isolation.test.tsx). An email that
  // mustn't read the page's gets the value as a prop, or a provider of its own in what's rendered.
  it("gives the email the template's own providers over the page's, in react-dom's renders and its streaming one", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const Brand = React.createContext("default");
      const Reads = () => <Paragraph>{`brand=${React.useContext(Brand)}`}</Paragraph>;
      const email = (own?: string) => <Email>{own ? <Brand.Provider value={own}><Row><Column><Reads /></Column></Row></Brand.Provider> : <Row><Column><Reads /></Column></Row>}</Email>;
      const ReactDomReads = () => <>{`brand=${React.useContext(Brand)}`}</>;
      expect(renderToPlainText(email()).trim()).toBe("brand=default");
      const seen: string[][] = [];
      function Preview() {
        const read = useMemo(() => [renderToPlainText(email()).trim(), renderToPlainText(email("its own")).trim()], []);
        seen.push(read);
        return <pre>{read.join(", ")}</pre>;
      }
      // (react-dom's render inside a component of react-dom's render, which has no hooks: React 18's would lose them.)
      const ReactDom = () => (seen.push([renderToStaticMarkup(<ReactDomReads />)]), null);
      const page = <Brand.Provider value="the page's"><main><Preview /><ReactDom /></main></Brand.Provider>;
      renderToString(page);
      await new Promise<void>((resolve, reject) => {
        const stream = renderToPipeableStream(page, { onAllReady: () => (stream.pipe(sink()), resolve()), onShellError: reject });
      });
      expect(seen).toEqual([["brand=the page's", "brand=its own"], ["brand=default"], ["brand=default", "brand=its own"], ["brand=default"]]);
      expect(error).not.toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });
});

describe("a template's component that renders another template, inside an app's renderToString", () => {
  it("gives that render the outer walk's providers over the app's, and the outer render's value for a context neither provides", () => {
    // (Inside an app's renderToString, a context no walk provides reads that render's value; see
    // src/regression/render-isolation.test.tsx.)
    const Brand = React.createContext("default");
    const Theme = React.createContext("light");
    const Inner = () => <Paragraph>{`theme=${React.useContext(Theme)} brand=${React.useContext(Brand)}`}</Paragraph>;
    let inner = "";
    const Starts = () => {
      inner = renderToPlainText(<Email><Row><Column><Inner /></Column></Row></Email>).trim();
      return <Paragraph>{`outer brand=${React.useContext(Brand)}`}</Paragraph>;
    };
    let outer = "";
    const Page = () => {
      outer = renderToPlainText(<Email><Theme.Provider value="the outer email's"><Row><Column><Starts /></Column></Row></Theme.Provider></Email>).trim();
      return <div />;
    };
    renderToString(<Brand.Provider value="TenantA"><Theme.Provider value="the page's"><Page /></Theme.Provider></Brand.Provider>);
    expect(inner).toBe("theme=the outer email's brand=TenantA");
    expect(outer).toBe("outer brand=TenantA");
  });
});

describe("a page that renders with react-dom's browser build (react-dom/server.browser)", () => {
  it("can work out the template's design and HTML while it renders, and use hooks after (as 0.1.22 could)", () => {
    function EditorPage() {
      const design = useMemo(() => renderToJson(<Template />), []);
      const html = useMemo(() => renderToHtml(<Template />), []);
      const [open] = useState(false);
      return <pre>{`${design.body.rows.length} rows, ${html.includes("Hello from the template")}, open=${open}`}</pre>;
    }
    expect(renderToStringWithBrowserBuild(<EditorPage />)).toBe("<pre>1 rows, true, open=false</pre>");
  });
});

describe("a template's component", () => {
  it("can work out another template's design while Elements renders it", () => {
    function RowCount() {
      const design = useMemo(() => renderToJson(<Template />), []);
      const [label] = useState("rows");
      return <div dangerouslySetInnerHTML={{ __html: `${design.body.rows.length} ${label}` }} />;
    }
    const html = renderToHtml(<Email><Row><Column><Paragraph>Before</Paragraph><RowCount /></Column></Row></Email>);
    expect(html).toContain("Before");
    expect(html).toContain("1 rows");
  });

  it("starts a render where it is, inside the providers around it, its ids the document's; one the rest of the user's code starts, as alone", async () => {
    // By design (the walker's `calling`): as React's renders inside a render read the context it has, and so the ids
    // of an Elements render a component puts in the document don't repeat the document's.
    const { registerTool } = await import("../index");
    const asyncRenderers = await import("../async");
    const Theme = React.createContext("none");
    const Themed = () => <Paragraph>{`theme=${React.useContext(Theme)} id=${useId()}`}</Paragraph>;
    const inner = <Email><Row><Column><Themed /></Column></Row></Email>;
    const seen = (html: string) => /theme=(\w+) id=([^<\s]+)/.exec(html)!.slice(1);
    const [none, alone] = seen(renderToHtml(inner));
    expect(none).toBe("none");
    const got: Record<string, string[]> = {};
    const Starts = ({ at }: { at: string }) => ((got[at] = seen(renderToHtml(inner))), <Paragraph>{`outer ${useId()}`}</Paragraph>);
    const Tool = registerTool({ name: "nested_where", renderer: { exporters: { email: () => ((got.exporter = seen(renderToHtml(inner))), "<b>tool</b>") } } });
    const outer = (at: string) => <Email><Theme.Provider value="dark"><Row><Column><Paragraph>Before</Paragraph><Starts at={at} /><Tool /></Column></Row></Theme.Provider></Email>;
    const Wrapper = () => ((got.wrapper = seen(renderToHtml(inner))), outer("component in a wrapper's template"));
    const html = renderToHtml(outer("component"));
    await asyncRenderers.renderToHtml(outer("component, async"));
    renderToHtml(<Theme.Provider value="dark"><Wrapper /></Theme.Provider>);
    for (const at of ["component", "component, async", "component in a wrapper's template"]) {
      expect(got[at][0], at).toBe("dark");
      expect(got[at][1], at).not.toBe(alone);
    }
    expect(html).not.toContain(got.component[1]);
    for (const at of ["exporter", "wrapper"]) expect(got[at], at).toEqual([none, alone]);
  });

  it("can nest one more, and a component there calls hooks after the call", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      function Deepest() {
        const design = renderToJson(<Template />);
        return <div dangerouslySetInnerHTML={{ __html: `deepest ${design.body.rows.length} rows` }} />;
      }
      function DeepestWithHook() {
        renderToJson(<Template />);
        const [label] = useState("never shown");
        return <div dangerouslySetInnerHTML={{ __html: label }} />;
      }
      function Deeper() {
        const html = renderToHtml(<Email><Row><Column><Deepest /><DeepestWithHook /></Column></Row></Email>);
        return <div dangerouslySetInnerHTML={{ __html: `${html.includes("deepest 1 rows") ? "deepest shown" : "deepest left out"}, ${html.includes("never shown") ? "hook shown" : "hook left out"}` }} />;
      }
      const html = renderToHtml(<Email><Row><Column><Paragraph>Outer</Paragraph><Deeper /></Column></Row></Email>);
      expect(html).toContain("Outer");
      expect(html).toContain("deepest shown, hook shown");
      expect(error).not.toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });
});

describe("a template that renders another one while it's called (its wrapper)", () => {
  // That render is its own, as one a component among the rows starts is: what it does with a part that fails, the
  // parts it leaves out and its ids aren't the outer render's, which its root's config hadn't given yet.
  const InnerBroken = (): React.ReactElement => {
    throw new Error("inner data");
  };
  const OuterBroken = (): React.ReactElement => {
    throw new Error("outer data");
  };
  const Id = () => <div dangerouslySetInnerHTML={{ __html: `useId=${useId()}` }} />;
  const inner = <Email><Row><Column><Paragraph>Inner</Paragraph><InnerBroken /><Id /></Column></Row></Email>;
  const outer = <Email><Row><Column><Paragraph>Outer</Paragraph><OuterBroken /><Id /></Column></Row></Email>;
  const renderers = async () => {
    const { renderToHtmlParts } = await import("./render-to-html");
    const asyncRenderers = await import("../async");
    const sync = { renderToHtml, renderToPlainText, renderToJson, renderToHtmlParts } as Record<string, (element: React.ReactElement, options?: object) => unknown>;
    return { sync, all: { ...sync, ...Object.fromEntries(Object.entries(asyncRenderers).filter(([name]) => name in sync).map(([name, render]) => [`async ${name}`, render])) } as Record<string, (element: React.ReactElement, options?: object) => unknown> };
  };

  it("keeps the outer render's onError: a part of its own that fails fails it", async () => {
    const { sync, all } = await renderers();
    const left: unknown[] = [];
    for (const [innerName, render] of Object.entries(sync)) {
      function Outer() {
        render(inner, { onError: (failure: unknown) => void left.push(failure) });
        return outer;
      }
      for (const [name, outerRender] of Object.entries(all)) {
        const rendering = async () => outerRender(<Outer />);
        await expect(rendering(), `${innerName} in ${name}`).rejects.toThrow(/outer data/);
      }
    }
    expect(left.length).toBeGreaterThan(0);
  });

  it("keeps the parts each leaves out its own", async () => {
    const { renderToHtmlParts } = await import("./render-to-html");
    const asyncRenderers = await import("../async");
    let innerParts: ReturnType<typeof renderToHtmlParts> | undefined;
    function Outer() {
      innerParts = renderToHtmlParts(inner, { onError: () => {} });
      return outer;
    }
    for (const render of [renderToHtmlParts, asyncRenderers.renderToHtmlParts]) {
      const parts = await render(<Outer />, { onError: () => {} });
      expect(parts.omitted.map((e) => e.component)).toEqual(["OuterBroken"]);
      expect(innerParts!.omitted.map((e) => e.component)).toEqual(["InnerBroken"]);
    }
  });

  it("keeps its ids' prefix its own", async () => {
    const { sync, all } = await renderers();
    const id = /useId=([^<"\\]*)/;
    for (const [innerName, render] of Object.entries(sync)) {
      function Outer() {
        render(inner, { onError: () => {}, idPrefix: "inner-" });
        return outer;
      }
      for (const [name, outerRender] of Object.entries(all)) {
        if (/Json/.test(name)) continue;
        const given = id.exec(JSON.stringify(await outerRender(<Outer />, { onError: () => {} })))?.[1];
        expect(given, `${innerName} in ${name}`).toMatch(/R/);
        expect(given, `${innerName} in ${name}`).not.toContain("inner-");
      }
    }
  });
});

describe("a page that renders on the server, with a template whose component works out another design", () => {
  // Three renders: the page's (react-dom/server), Elements', and the component's call. The page's hooks keep working,
  // and the component's after the call.
  it("keeps the page's hooks, and the component's hooks after its call", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      function Count() {
        const design = renderToJson(<Template />);
        return <div dangerouslySetInnerHTML={{ __html: `${design.body.rows.length} rows` }} />;
      }
      function CountWithHook() {
        const design = renderToJson(<Template />);
        const [label] = useState("labelled rows");
        return <div dangerouslySetInnerHTML={{ __html: `${design.body.rows.length} ${label}` }} />;
      }
      function PreviewPage() {
        const html = useMemo(() => renderToHtml(<Email><Row><Column><Paragraph>Outer</Paragraph><Count /><CountWithHook /></Column></Row></Email>), []);
        const [zoom] = useState(1);
        return <pre>{`${html.includes("Outer")}, ${html.includes("1 rows")}, ${html.includes("labelled")}, zoom=${zoom}`}</pre>;
      }
      expect(renderToString(<PreviewPage />)).toBe("<pre>true, true, true, zoom=1</pre>");
      expect(error).not.toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });
});

describe("an error of the template's own", () => {
  it("is the error it throws (react-dom can render here)", () => {
    expect(() => renderToJson(<Row />)).toThrow(/Root element must be/);
  });
});

describe("a component that isn't one (undefined: a broken or circular import)", () => {
  // React says so and the render fails, as an email missing a block shouldn't be sent: the plain text too (it was
  // empty, without an error).
  it("fails renderToHtml, renderToJson and renderToPlainText", async () => {
    const { renderToPlainText } = await import("./render-to-html");
    const Missing = undefined as unknown as React.ComponentType;
    const email = <Email><Row><Column><Paragraph>Hi</Paragraph><Missing /></Column></Row></Email>;
    for (const render of [renderToHtml, renderToJson, renderToPlainText]) expect(() => render(email)).toThrow(/Element type is invalid/);
  });

  // Inside a component of the user's own or a Provider (a layout around the rows), its boundary caught React's error,
  // and the whole layout was left out: an email with an empty body, and the render succeeded.
  it("fails them inside a layout or a Provider too, as an object or a Date as a child does", async () => {
    const { renderToPlainText } = await import("./render-to-html");
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const Missing = undefined as unknown as React.ComponentType;
      const Layout = ({ children }: { children?: React.ReactNode }) => <>{children}<Row><Column><Paragraph>Footer</Paragraph></Column></Row></>;
      const Theme = React.createContext("light");
      const rows = <><Row><Column><Paragraph>Order shipped</Paragraph><Missing /></Column></Row></>;
      for (const [email, why] of [
        [<Email><Layout>{rows}</Layout></Email>, /Element type is invalid/],
        [<Email><Theme.Provider value="dark">{rows}</Theme.Provider></Email>, /Element type is invalid/],
        [<Email><Layout><Row><Column>{["Shipped ", new Date(0) as unknown as string]}</Column></Row></Layout></Email>, /Objects are not valid as a React child/],
      ] as const) {
        for (const render of [renderToHtml, renderToJson, renderToPlainText]) expect(() => render(email)).toThrow(why);
      }
    } finally {
      error.mockRestore();
    }
  });
});

describe("a component of the user's own that calls a hook, in React's development build", () => {
  // React 18's development build calls a component once more, with hooks off, to say where a warning came from (an
  // undefined component, a list without keys). Elements took that call's failure for the component's own: a layout
  // with a hook around an undefined component gave a blank email, blamed on the layout; a template with a hook and a
  // list without keys rendered as a web document, with a warning, the first time only.
  it("fails the render for an undefined component in a layout with a hook, as without the hook", async () => {
    const { renderToPlainText } = await import("./render-to-html");
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const Missing = undefined as unknown as React.ComponentType;
      const Theme = React.createContext("light");
      const HookedLayout = ({ children }: { children?: React.ReactNode }) => {
        React.useContext(Theme);
        return <>{children}<Missing /></>;
      };
      const email = <Email><HookedLayout><Row><Column><Paragraph>Order shipped</Paragraph></Column></Row></HookedLayout></Email>;
      for (const render of [renderToHtml, renderToJson, renderToPlainText]) expect(() => render(email)).toThrow(/Element type is invalid/);
    } finally {
      error.mockRestore();
    }
  });

  // React renders a component again when it sets its state while it renders: that render is the one that counts.
  it("renders a template that sets its state while it renders as React does (its last render)", () => {
    function Counted() {
      const [n, setN] = useState(0);
      if (n < 1) setN(n + 1);
      // The root it picks from that state too: an email, with its preview text.
      return n < 1 ? <Page><Row><Column><Paragraph>{`n=${n}`}</Paragraph></Column></Row></Page> : <Email previewText="Ready"><Row><Column><Paragraph>{`n=${n}`}</Paragraph></Column></Row></Email>;
    }
    const html = renderToHtml(<Counted />);
    expect(html).toContain("n=1");
    expect(html).toContain("Ready");
    expect(html.startsWith("<!DOCTYPE HTML PUBLIC")).toBe(true);
    expect(JSON.stringify(renderToJson(<Counted />))).toContain("n=1");
  });

  // As React does, and as a component among the rows does: its last render isn't taken as the template.
  it("fails a template that sets its state every time it renders", async () => {
    const { RenderError } = await import("../index");
    const asyncRenderers = await import("../async");
    function Looping() {
      const [n, setN] = useState(0);
      setN(n + 1);
      return <Email><Row><Column><Paragraph>{`n=${n}`}</Paragraph></Column></Row></Email>;
    }
    const looping = /Too many re-renders: a component sets its state every time it renders/;
    for (const render of [renderToHtml, renderToJson, renderToPlainText]) expect(() => render(<Looping />)).toThrow(looping);
    for (const render of [asyncRenderers.renderToHtml, asyncRenderers.renderToJson]) await expect(render(<Looping />)).rejects.toThrow(looping);
    let thrown: unknown;
    try {
      renderToHtml(<Looping />);
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(RenderError);
    expect(thrown).toMatchObject({ component: "Looping", position: "" });
    const inside = () => renderToHtml(<Email><Row><Column><Looping /></Column></Row></Email>);
    expect(inside).toThrow(looping);
  });

  it("renders a template with a hook and a list without keys the same every time", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const OrderTemplate = ({ items }: { items: string[] }) => {
        const [title] = useState("Your order");
        return <Email><Row><Column><Paragraph>{title}</Paragraph>{items.map((item) => <Paragraph>{item}</Paragraph>)}</Column></Row></Email>;
      };
      const template = <OrderTemplate items={["Shoes", "Hat"]} />;
      const [first, second] = [renderToHtml(template), renderToHtml(template)];
      expect(first).toBe(second);
      expect(first.startsWith("<!DOCTYPE HTML PUBLIC")).toBe(true);
      expect(warn).not.toHaveBeenCalled();
      expect(JSON.stringify(renderToJson(template))).toContain("Hat");
    } finally {
      error.mockRestore();
      warn.mockRestore();
    }
  });
});

describe("a Row whose Columns don't fit its layout", () => {
  // It fails the render (a RenderError naming it and where it is), the HTML, the plain text and the design alike.
  // With `onError: "omit"` it's left out of all three, said once per render with console.error, and listed in
  // renderToHtmlParts' `omitted`; the rows around it render. (0.1.22 rendered no rows at all, and its design kept it.)
  const MESSAGE = "A Row with the TwoEqual layout, for 2 Columns, has 1 (in <Row> at Row 2)";
  const template = async (Root: React.ElementType) => {
    const { ColumnLayouts } = await import("../index");
    return (
      <Root>
        <Row><Column><Paragraph>Before</Paragraph></Column></Row>
        <Row layout={ColumnLayouts.TwoEqual}><Column><Paragraph>Lonely</Paragraph></Column></Row>
        <Row layout={ColumnLayouts.TwoEqual}><Column><Paragraph>Left</Paragraph></Column><Column><Paragraph>Right</Paragraph></Column></Row>
      </Root>
    );
  };

  it.each(["Email", "Page", "Document"])("%s: fails the render, or only that Row is left out, said once per render", async (name) => {
    const roots = await import("../index");
    const element = await template(roots[name as "Email" | "Page" | "Document"]);
    for (const render of [() => renderToHtml(element), () => renderToPlainText(element), () => renderToJson(element)]) expect(render).toThrow(`[Unlayer] ${MESSAGE}`);
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const omit = { onError: "omit" } as const;
      const html = renderToHtml(element, omit);
      expect(html).toMatch(/^<!DOCTYPE/i);
      expect(html).toContain("Before");
      expect(html).toContain("Right");
      expect(html).not.toContain("Lonely");
      expect(error.mock.calls.map((call) => String(call[0]))).toEqual([`[Unlayer] Left out: ${MESSAGE}`]);
      expect(renderToPlainText(element, omit)).toBe("Before\n\nLeft\n\nRight");
      const design = renderToJson(element, omit);
      expect(design.body.rows.map((row) => [row.cells, row.columns.length])).toEqual([[[1], 1], [[1, 1], 2]]);
      expect(JSON.stringify(design)).not.toContain("Lonely");
      // One for each render.
      expect(error.mock.calls.map((call) => String(call[0]))).toEqual([1, 2, 3].map(() => `[Unlayer] Left out: ${MESSAGE}`));
      // Listed, with where it is.
      const { omitted } = roots.renderToHtmlParts(element, omit);
      expect(omitted.map((e) => [e.message, e.component, e.position])).toEqual([[`[Unlayer] ${MESSAGE}`, "Row", "Row 2"]]);
      // A function instead of the console.
      const given: unknown[] = [];
      error.mockClear();
      expect(renderToHtml(element, { onError: (e) => void given.push(e.position) })).not.toContain("Lonely");
      expect([given, error.mock.calls]).toEqual([["Row 2"], []]);
    } finally {
      error.mockRestore();
    }
  });

  it("renderRowToJson fails on it", async () => {
    const { ColumnLayouts, renderRowToJson } = await import("../index");
    expect(() => renderRowToJson(<Row layout={ColumnLayouts.ThreeEqual}><Column><Paragraph>One</Paragraph></Column><Column><Paragraph>Two</Paragraph></Column></Row>)).toThrow(
      "[Unlayer] A Row with the ThreeEqual layout, for 3 Columns, has 2 (in <Row> at Row 1)"
    );
    // One that fits gives its row, with the layout's cells.
    expect(renderRowToJson(<Row layout={ColumnLayouts.TwoWideNarrow}><Column><Paragraph>Wide</Paragraph></Column><Column><Paragraph>Narrow</Paragraph></Column></Row>).cells).toEqual([2, 1]);
  });
});

describe("an app's own react-dom/server render of an email, with a Context Provider around it", () => {
  // The web exporters of these blocks render with react-dom/server themselves: rendered with another module, the
  // app's render couldn't restore its context ("Tried to pop a Context at the root of the app").
  it("renders, as in 0.1.22", async () => {
    const { Page, Divider, Html, Menu, Social } = await import("../index");
    const Theme = React.createContext("light");
    const html = renderToString(
      <Theme.Provider value="dark">
        <Page><Row><Column>
          <Paragraph>Hello</Paragraph>
          <Divider />
          <Html html="<b>kept</b>" />
          <Menu items={[{ text: "Home", href: "https://example.com" }]} />
          <Social icons={{ iconType: "circle", icons: [{ name: "Facebook", url: "https://facebook.com" }] } as never} />
        </Column></Row></Page>
      </Theme.Provider>
    );
    expect(html).toContain("Hello");
    expect(html).toContain("<b>kept</b>");
    expect(html).toContain("Home");
  });
});

describe("markup beside or around a Row's Columns", () => {
  // The Row says markup isn't a Column, and renders its Columns with their widths: each takes its place among the
  // Columns (they took one among all the children, so the ones after markup got no cell: `width="NaN"`). An Outlook
  // comment a component renders in a Row (an MSO table opened for Outlook) keeps the Columns after it, as in 0.1.22.
  it("keeps the Columns, with their widths, in the HTML and the design alike", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const Mso = () => <div dangerouslySetInnerHTML={{ __html: "<!--[if mso]><table><tr><td><![endif]-->" }} />;
      const Wrapped = () => <div><Column><Paragraph>A</Paragraph></Column><Column><Paragraph>B</Paragraph></Column></div>;
      for (const row of [
        <Row><Mso /><Column><Paragraph>A</Paragraph></Column><Column><Paragraph>B</Paragraph></Column></Row>,
        <Row><div><Column><Paragraph>A</Paragraph></Column><Column><Paragraph>B</Paragraph></Column></div></Row>,
        <Row><Wrapped /></Row>,
      ]) {
        const email = <Email>{row}</Email>;
        const html = renderToHtml(email);
        expect(html).not.toContain("NaN");
        expect(html).toMatch(/>\s*A\s*</);
        expect(html).toMatch(/>\s*B\s*</);
        const design = renderToJson(email);
        expect([design.body.rows[0].cells, design.body.rows[0].columns.length]).toEqual([[1, 1], 2]);
      }
      expect(warn.mock.calls.some((call) => String(call[0]).includes("is not a valid Row child"))).toBe(true);
    } finally {
      warn.mockRestore();
    }
  });
});

describe("markup written in a Row or Column, with a block or a component of the user's own in it", () => {
  // It's left out whole, as 0.1.22 left it out, with its text and the markup a component renders in it: React's
  // render cuts it where a block or component is, and the pieces came out on their own ("Hello" left out, ", welcome
  // back" shown as text straight in the Column, the name as an HTML block). A block, Column or Row in it is kept.
  it("is left out whole, keeping a block in it, in the HTML, the plain text and the design alike", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const Name = () => <b>Ada</b>;
      const Logo = () => <img src="https://example.com/logo.png" alt="Logo" />;
      const Promo = () => <div>Intro <Paragraph>Kept</Paragraph> outro</div>;
      for (const [inColumn, shows] of [
        [<p>Hello <Name />, welcome back</p>, []],
        [<a href="https://example.com/visit">Visit <Logo /></a>, []],
        [<div>Intro <Paragraph>Kept</Paragraph> outro</div>, ["Kept"]],
        [<Promo />, ["Kept"]],
      ] as const) {
        const email = <Email><Row><Column><Paragraph>Before</Paragraph>{inColumn}<Paragraph>After</Paragraph></Column></Row></Email>;
        const words = ["Before", ...shows, "After"];
        expect(renderToPlainText(email).split(/\s+/).filter(Boolean)).toEqual(words);
        const html = renderToHtml(email);
        for (const gone of ["Hello", "welcome", "Ada", "Visit", "logo.png", "example.com/visit", "Intro", "outro"]) expect(html).not.toContain(gone);
        const contents = renderToJson(email).body.rows[0].columns[0].contents as { type: string }[];
        expect(contents.map((content) => content.type)).toEqual(words.map(() => "text"));
      }
      // An end tag that ends nothing open (`</b>` in a component's HTML) doesn't end the markup, as in the browser.
      const stray = <Email><Row><Column><Paragraph>Before</Paragraph><div><Name /><span dangerouslySetInnerHTML={{ __html: "</b>Hidden</p>" }} /> too</div><Paragraph>After</Paragraph></Column></Row></Email>;
      expect(renderToPlainText(stray).split(/\s+/).filter(Boolean)).toEqual(["Before", "After"]);
      expect(renderToHtml(stray)).not.toMatch(/Hidden|too/);
      // In a Row too: the Row says it isn't a Column, and its Column renders.
      const email = <Email><Row><div>Hello <Name /> welcome back</div><Column><Paragraph>In the column</Paragraph></Column></Row></Email>;
      expect(renderToPlainText(email).trim()).toBe("In the column");
      expect(renderToJson(email).body.rows[0].columns.length).toBe(1);
    } finally {
      warn.mockRestore();
    }
  });
});

describe("a render the user's code starts while Elements renders (a custom tool's exporter or head, `onError`, …)", () => {
  // It's a render of its own, as one a component starts is. One a custom tool's exporter or head started, or an
  // `onError` function, shared the outer render's scope: the first `onError`, `idPrefix` and direction set in the
  // render won, so a block that failed after it was left out of an email whose render should have failed, and each
  // render listed the parts the other left out.
  const InnerBroken = (): React.ReactElement => {
    throw new Error("inner data");
  };
  const inner = <Email><Row><Column><Paragraph>Inner</Paragraph><InnerBroken /><Paragraph>{"inner after"}</Paragraph></Column></Row></Email>;
  const hostile = { onError: "omit", idPrefix: "inner-", textDirection: "rtl" } as const;
  const listed = (parts: { omitted: Array<{ component: string; position: string }> }) => JSON.stringify({ ...parts, omitted: parts.omitted.map((e) => [e.component, e.position]) });

  it("keeps the outer render's onError: a block that fails after a custom tool's exporter starts one fails the render", async () => {
    const { registerTool, renderToHtmlParts } = await import("../index");
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const Nested = registerTool({ name: "nested_render", renderer: { exporters: { email: () => (renderToHtmlParts(inner, { onError: "omit" }), "<b>nested</b>") } } });
      const Broken = registerTool({ name: "broken_after", renderer: { exporters: { email: () => { throw new Error("broken exporter"); } } } });
      const email = <Email><Row><Column><Nested /><Broken /></Column></Row></Email>;
      expect(() => renderToHtml(email)).toThrow(/broken exporter/);
      expect(renderToHtmlParts(email, { onError: () => {} }).omitted.map((e) => e.component)).toEqual(["broken_after"]);
    } finally {
      error.mockRestore();
    }
  });

  it("leaves the outer render as it is without it, and gives what it gives alone, wherever the user's code starts it", async () => {
    const { registerTool, renderToHtmlParts } = await import("../index");
    const { Markdown } = await import("../markdown");
    const { Tailwind, loadTailwind } = await import("../tailwind");
    const asyncRenderers = await import("../async");
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      // The renders each place starts: each renderer, with an `onError`, `idPrefix` and direction of its own.
      const renders: Record<string, () => unknown> = {
        html: () => renderToHtml(inner, hostile),
        parts: () => listed(renderToHtmlParts(inner, hostile)),
        text: () => renderToPlainText(inner, hostile),
        json: () => JSON.stringify(renderToJson(inner, hostile)),
        "async html": () => asyncRenderers.renderToHtml(inner, hostile),
        "async parts": async () => listed(await asyncRenderers.renderToHtmlParts(inner, hostile)),
        "async text": () => asyncRenderers.renderToPlainText(inner, hostile),
        "async json": async () => JSON.stringify(await asyncRenderers.renderToJson(inner, hostile)),
      };
      const alone: Record<string, unknown> = {};
      for (const [name, render] of Object.entries(renders)) alone[name] = await render();
      let active = false;
      const started: Array<{ where: string; name: string; got: unknown }> = [];
      const hook = (where: string) => {
        if (active) for (const [name, render] of Object.entries(renders)) started.push({ where, name, got: render() });
      };
      // (Async, it waits for the async ones it starts.)
      const waiting = async (where: string) => {
        hook(where);
        await Promise.all(started.map((s) => s.got));
      };
      // Each place the user's code runs in a render.
      const Tool = registerTool({
        name: "hooked_tool",
        renderer: { exporters: { email: () => (hook("exporter"), "<b>tool</b>") }, head: { css: () => (hook("head"), ".hooked { color: #c00; }") } },
      });
      const Broken = registerTool({ name: "hooked_broken", renderer: { exporters: { email: () => { throw new Error("broken exporter"); } } } });
      const Mine = () => (hook("component"), <Paragraph>{`mine ${useId()}`}</Paragraph>);
      const AsyncMine = async () => (await waiting("async component"), <Paragraph>async mine</Paragraph>);
      const link = "[A link](https://example.com/a)";
      // A Tailwind plugin's utility, which Tailwind calls as the render reads the class, once per compiled Tailwind (the
      // HTML's renders below get one of their own).
      const plugin = ({ matchUtilities }: { matchUtilities: (utilities: object, options: object) => void }) =>
        matchUtilities({ hooked: (color: string) => (hook("Tailwind plugin"), { color }) }, { values: { brand: "#123456" } });
      let tw: Awaited<ReturnType<typeof loadTailwind>>;
      const content = (
        <Row>
          <Column>
            <Mine />
            <Tool />
            <Markdown url={(url) => (hook("Markdown url"), url)}>{link}</Markdown>
            <Paragraph className="hooked-brand">Styled</Paragraph>
            <Broken />
            <Paragraph>After</Paragraph>
          </Column>
        </Row>
      );
      const Template = () => (hook("wrapper"), useId(), <Tailwind tw={tw}><Email>{content}</Email></Tailwind>);
      const AsyncTemplate = async () => (await waiting("async wrapper"), <Tailwind tw={tw}><Email>{content}<Row><Column><AsyncMine /></Column></Row></Email></Tailwind>);
      const onError = () => hook("onError");
      const outer: Record<string, (options: object) => unknown> = {
        html: (options) => renderToHtml(<Template />, options),
        parts: (options) => listed(renderToHtmlParts(<Template />, options)),
        text: (options) => renderToPlainText(<Template />, options),
        json: (options) => JSON.stringify(renderToJson(<Template />, options)),
        "async html": (options) => asyncRenderers.renderToHtml(<AsyncTemplate />, options),
        "async parts": async (options) => listed(await asyncRenderers.renderToHtmlParts(<AsyncTemplate />, options)),
        "async text": (options) => asyncRenderers.renderToPlainText(<AsyncTemplate />, options),
        "async json": async (options) => JSON.stringify(await asyncRenderers.renderToJson(<AsyncTemplate />, options)),
      };
      const given = async (render: () => unknown) => {
        try {
          return await render();
        } catch (thrown) {
          return `threw ${(thrown as Error).message}`;
        }
      };
      const places = new Set<string>();
      // The render's own `onError` (it fails, as the block after the custom tool does), and a function.
      for (const options of [{}, { onError }]) {
        for (const [name, render] of Object.entries(outer)) {
          const compiled = async () => (name === "html" ? (tw = await loadTailwind({ plugins: [plugin] })) : tw);
          active = false;
          await compiled();
          const stubbed = await given(() => render(options));
          active = true;
          started.length = 0;
          await compiled();
          const got = await given(() => render(options));
          active = false;
          const label = `${name}, ${"onError" in options ? "onError function" : "throwing"}`;
          expect(got, label).toEqual(stubbed);
          if (!("onError" in options)) expect(String(got), label).toMatch(name.endsWith("json") ? /^\{/ : /^threw .*broken exporter/);
          for (const s of started) {
            places.add(s.where);
            expect(await s.got, `${s.name} in ${s.where}, in ${label}`).toEqual(alone[s.name]);
          }
        }
      }
      expect([...places].sort()).toEqual(["Markdown url", "Tailwind plugin", "async component", "async wrapper", "component", "exporter", "head", "onError", "wrapper"]);
      // (The class did style the Paragraph.)
      expect(await outer.html({ onError: () => {} })).toMatch(/color: #123456[^>]*>\s*Styled/);
    } finally {
      error.mockRestore();
      warn.mockRestore();
    }
  });
});
