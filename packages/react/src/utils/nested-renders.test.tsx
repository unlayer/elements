/**
 * Elements' renders inside another React render: an app page that renders on the server and works out its design,
 * layout or HTML while it renders (`useMemo(() => toDesign(<T />))`), and a template's component that does. React
 * keeps a render's hook state in its module, so a render started inside another one with the same module breaks
 * the hooks the outer component calls after it (see server-renderer.ts).
 */
import { describe, it, expect, vi } from "vitest";
import React, { useMemo, useState } from "react";
import { renderToString } from "react-dom/server";
// @ts-ignore react-dom/server.browser has no types of its own (the same API as react-dom/server).
import { renderToString as renderToStringWithBrowserBuild } from "react-dom/server.browser";
import { Email, Page, Paragraph, Text, outline, render, validate, type RenderResult } from "../primitives/index";
import { toDesign } from "../builder/index";

const Template = () => (
  <Email>
    <Paragraph>Hello from the template</Paragraph>
  </Email>
);

describe("a page that renders on the server", () => {
  it("can work out the template's design while it renders, and use hooks after", () => {
    function EditorPage() {
      const { design } = useMemo(() => toDesign(<Template />), []);
      const [open] = useState(false);
      return <pre>{`${design.body.rows.length} rows, open=${open}`}</pre>;
    }
    expect(renderToString(<EditorPage />)).toBe("<pre>1 rows, open=false</pre>");
  });

  it("can render it, lay it out and check it too", async () => {
    let rendered: Promise<RenderResult> | undefined;
    function PreviewPage() {
      rendered = useMemo(() => render(<Template />), []);
      const laidOut = useMemo(() => outline(<Template />), []);
      const { valid } = useMemo(() => validate(<Template />), []);
      const [zoom] = useState(1);
      return <pre>{`${laidOut.includes("Hello from the template")}, ${valid}, zoom=${zoom}`}</pre>;
    }
    expect(renderToString(<PreviewPage />)).toBe("<pre>true, true, zoom=1</pre>");
    expect((await rendered!).text).toBe("Hello from the template");
  });
});

describe("a page that renders with react-dom's browser build (react-dom/server.browser)", () => {
  it("can work out the template's design and layout while it renders, and use hooks after", () => {
    function EditorPage() {
      const { design } = useMemo(() => toDesign(<Template />), []);
      const laidOut = useMemo(() => outline(<Template />), []);
      const [open] = useState(false);
      return <pre>{`${design.body.rows.length} rows, ${laidOut.includes("Hello from the template")}, open=${open}`}</pre>;
    }
    expect(renderToStringWithBrowserBuild(<EditorPage />)).toBe("<pre>1 rows, true, open=false</pre>");
  });
});

describe("a template's component", () => {
  // KNOWN GAP: withBuild() (server-renderer.ts) takes another module of react-dom's for "a component an Elements
  // render collects" only where today's collector is collecting (`collecting()` in utils/collect.ts), which the new
  // components' collector (primitives/collect.tsx) doesn't push onto: the nested render runs on the module the
  // template is being collected with, and the component's hook after it throws ("Cannot set properties of null").
  // When that's fixed, make this an `it`.
  it.fails("can work out another template's design while Elements renders it, and use hooks after", async () => {
    function RowCount() {
      const { design } = useMemo(() => toDesign(<Template />), []);
      const [label] = useState("rows");
      return <Paragraph>{`${design.body.rows.length} ${label}`}</Paragraph>;
    }
    expect((await render(<Email><Paragraph>Before</Paragraph><RowCount /></Email>)).text).toBe("Before\n\n1 rows");
  });

  it("can work out another template's layout where no hook follows", async () => {
    function Deepest() {
      return <Paragraph>{outline(<Template />).includes("Hello from the template") ? "nested shown" : "nested missing"}</Paragraph>;
    }
    expect((await render(<Email><Paragraph>Outer</Paragraph><Deepest /></Email>)).text).toBe("Outer\n\nnested shown");
  });
});

describe("an error of the template's own", () => {
  it("is the error it throws, from each of render(), validate(), outline() and toDesign()", async () => {
    const Broken = (): React.ReactElement => {
      throw new Error("no product 42");
    };
    const email = <Email><Broken /></Email>;
    await expect(render(email)).rejects.toThrow("no product 42");
    for (const run of [validate, outline, toDesign]) expect(() => run(email)).toThrow("no product 42");
  });
});

describe("a component that isn't one (undefined: a broken or circular import)", () => {
  const Missing = undefined as unknown as React.ComponentType;
  const fails = async (email: React.ReactElement, why: RegExp) => {
    await expect(render(email)).rejects.toThrow(why);
    for (const run of [validate, outline, toDesign]) expect(() => run(email)).toThrow(why);
  };

  // React says so and the render fails, as an email missing a block shouldn't be sent.
  it("fails every render", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await fails(<Email><Paragraph>Hi</Paragraph><Missing /></Email>, /Element type is invalid/);
    } finally {
      error.mockRestore();
    }
  });

  it("fails them inside a layout or a Provider too, as an object or a Date as a child does", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const Layout = ({ children }: { children?: React.ReactNode }) => <>{children}<Paragraph>Footer</Paragraph></>;
      const Theme = React.createContext("light");
      const blocks = <><Paragraph>Order shipped</Paragraph><Missing /></>;
      await fails(<Email><Layout>{blocks}</Layout></Email>, /Element type is invalid/);
      await fails(<Email><Theme.Provider value="dark">{blocks}</Theme.Provider></Email>, /Element type is invalid/);
      await fails(<Email><Layout><Text>{["Shipped ", new Date(0) as unknown as string]}</Text></Layout></Email>, /Objects are not valid as a React child/);
    } finally {
      error.mockRestore();
    }
  });
});

describe("a component of the user's own that calls a hook, in React's development build", () => {
  // React 18's development build calls a component once more, with hooks off, to say where a warning came from (an
  // undefined component, a list without keys): that call's failure isn't the component's own.
  it("fails the render for an undefined component in a layout with a hook, as without the hook", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const Missing = undefined as unknown as React.ComponentType;
      const Theme = React.createContext("light");
      const HookedLayout = ({ children }: { children?: React.ReactNode }) => {
        React.useContext(Theme);
        return <>{children}<Missing /></>;
      };
      const email = <Email><HookedLayout><Paragraph>Order shipped</Paragraph></HookedLayout></Email>;
      await expect(render(email)).rejects.toThrow(/Element type is invalid/);
      expect(() => toDesign(email)).toThrow(/Element type is invalid/);
    } finally {
      error.mockRestore();
    }
  });

  // React renders a component again when it sets its state while it renders: that render is the one that counts.
  it("renders a template that sets its state while it renders as React does (its last render)", async () => {
    function Counted() {
      const [n, setN] = useState(0);
      if (n < 1) setN(n + 1);
      // The root it picks from that state too: an email, with its preview text.
      return n < 1 ? <Page><Paragraph>{`n=${n}`}</Paragraph></Page> : <Email previewText="Ready"><Paragraph>{`n=${n}`}</Paragraph></Email>;
    }
    const { html, text } = await render(<Counted />);
    expect(text).toBe("n=1");
    expect(html).toContain("Ready");
    // An email (Outlook's settings are an email's).
    expect(html).toContain("<o:PixelsPerInch>96</o:PixelsPerInch>");
    expect(JSON.stringify(toDesign(<Counted />).design)).toContain("n=1");
  });

  it("renders a template with a hook and a list without keys the same every time", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const OrderTemplate = ({ items }: { items: string[] }) => {
        const [title] = useState("Your order");
        return (
          <Email>
            <Paragraph>{title}</Paragraph>
            {items.map((item) => (
              // eslint-disable-next-line react/jsx-key
              <Paragraph>{item}</Paragraph>
            ))}
          </Email>
        );
      };
      const template = <OrderTemplate items={["Shoes", "Hat"]} />;
      const [first, second] = [await render(template), await render(template)];
      expect(first.html).toBe(second.html);
      expect(first.text).toBe("Your order\n\nShoes\n\nHat");
      expect(warn).not.toHaveBeenCalled();
      expect(JSON.stringify(toDesign(template).design)).toContain("Hat");
    } finally {
      error.mockRestore();
      warn.mockRestore();
    }
  });
});
