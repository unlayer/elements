/**
 * Elements' renders inside another React render: an app page that renders on the server and works out its
 * design or HTML while it renders (`useMemo(() => renderToJson(<T />))`), and a template's component that does.
 * Elements' renders put React's hooks dispatcher back as they found it, so the outer component's hooks after the
 * call work, however deep (0.3.0 rendered with react-dom, whose module keeps a render's hook state: three levels
 * deep, a component calling a hook after the call was left out).
 */
import { describe, it, expect, vi } from "vitest";
import React, { useMemo, useState } from "react";
import { renderToString } from "react-dom/server";
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
