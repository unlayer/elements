/**
 * One render never leaks into the next: data read by a component, an element
 * kept between renders, and the order renders run in don't carry over, and the
 * same input always gives the same output.
 *
 *   ISOLATION_RUNS=2000 ISOLATION_SEED=7 pnpm vitest run src/regression/render-isolation.test.tsx
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import React, { Component, createContext, memo, Suspense, useContext, useEffect, useId, useState } from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { renderToPipeableStream, renderToStaticMarkup, renderToString } from "react-dom/server";
import { act } from "../test-utils";
import { renderToHtml, renderToHtmlParts, renderToPlainText } from "../utils/render-to-html";
import { renderRowToJson, renderToJson } from "../utils/render-to-json";
import { Email, Page, Row, Column, Paragraph, Html, UnlayerProvider, registerTool } from "../index";
import * as asyncRenderers from "../async";

let user = "Alice";
const Greeting = () => <Row><Column><Paragraph>Hi {user}</Paragraph></Column></Row>;
const MemoGreeting = memo(Greeting);
const HookGreeting = () => {
  const [prefix] = useState("Hello");
  return <Row><Column><Paragraph>{prefix} {user}</Paragraph></Column></Row>;
};
const kept = { plain: <Greeting />, memo: <MemoGreeting />, hooks: <HookGreeting />, fragment: <><Greeting /></> };

describe.each(Object.keys(kept) as Array<keyof typeof kept>)("an element kept between renders (%s)", (kind) => {
  const email = () => <Email>{kept[kind]}</Email>;
  it("shows the data of each render", () => {
    for (const name of ["Alice", "Bob", "Carol"]) {
      user = name;
      const outputs = [renderToHtml(email()), renderToHtmlParts(email()).body, renderToPlainText(email()), JSON.stringify(renderToJson(email()))];
      for (const output of outputs) {
        expect(output).toContain(name);
        for (const other of ["Alice", "Bob", "Carol"].filter((n) => n !== name)) expect(output).not.toContain(other);
      }
    }
  });
});

describe("renders", () => {
  const first = () => <Email previewText="First"><Row><Column><Paragraph>First email</Paragraph></Column></Row></Email>;
  const second = () => <Email><Row><Column><Paragraph textAlign="center">Second email</Paragraph><Paragraph>And more</Paragraph></Column></Row></Email>;

  it("give the same output for the same input, every time", () => {
    user = "Alice";
    for (const make of [first, second, () => <Email>{kept.plain}{kept.hooks}</Email>]) {
      expect(renderToHtml(make())).toBe(renderToHtml(make()));
      expect(JSON.stringify(renderToJson(make()))).toBe(JSON.stringify(renderToJson(make())));
    }
  });

  it("don't depend on what was rendered before, in any order", () => {
    const alone = { first: renderToHtml(first()), second: renderToHtml(second()), design: JSON.stringify(renderToJson(second())) };
    renderToJson(first());
    expect(renderToHtml(second())).toBe(alone.second);
    renderToHtml(second());
    expect(renderToHtml(first())).toBe(alone.first);
    renderToHtmlParts(first());
    expect(JSON.stringify(renderToJson(second()))).toBe(alone.design);
  });
});

describe("useId() in components", () => {
  // A component that links to its own anchor, as a table of contents or a form label does.
  const Section = ({ to }: { to: string }) => {
    const id = useId();
    return <Html html={`<a id="${id}" href="${to}">${to}</a>`} />;
  };
  const SectionRow = ({ to }: { to: string }) => {
    const id = useId();
    return <Row><Column><Html html={`<a id="${id}" href="${to}">${to}</a>`} /></Column></Row>;
  };
  const email = () => (
    <Email>
      <Row><Column><Section to="/one" /><Section to="/two" /></Column></Row>
      <SectionRow to="/three" />
      <SectionRow to="/four" />
    </Email>
  );
  const ids = (html: string) => [...html.matchAll(/<a id="([^"]+)"/g)].map((m) => m[1]);

  it("gives each component its own ids", () => {
    for (const html of [renderToHtml(email()), renderToHtmlParts(email()).body, renderToStaticMarkup(email()), JSON.stringify(renderToJson(email()))]) {
      const found = ids(html.replace(/\\"/g, '"'));
      expect(found).toHaveLength(4);
      expect(new Set(found).size).toBe(4);
    }
  });

  it("gives an element placed twice its own ids in each place", () => {
    const section = <SectionRow to="/again" />;
    const html = renderToHtml(<Email>{section}{section}<Row><Column><Section to="/one" /></Column></Row></Email>);
    const found = ids(html);
    expect(found).toHaveLength(3);
    expect(new Set(found).size).toBe(3);
  });

  it("gives the same ids on every render", () => {
    expect(renderToHtml(email())).toBe(renderToHtml(email()));
    expect(renderToStaticMarkup(email())).toBe(renderToStaticMarkup(email()));
    expect(ids(renderToHtml(email()))).toEqual(ids(renderToStaticMarkup(email())));
    // A row on its own too.
    const row = <Row><Column><Section to="/one" /><Section to="/two" /></Column></Row>;
    expect(JSON.stringify(renderRowToJson(row))).toBe(JSON.stringify(renderRowToJson(row)));
  });

  it("gives template components inside each other their own ids", () => {
    const Inner = ({ outer }: { outer: string }) => {
      const id = useId();
      return <Email><Row><Column><Html html={`<a id="${outer}" href="/outer">outer</a><a id="${id}" href="/inner">inner</a>`} /></Column></Row></Email>;
    };
    const Outer = () => <Inner outer={useId()} />;
    const found = ids(renderToHtml(<Outer />));
    expect(found).toHaveLength(2);
    expect(new Set(found).size).toBe(2);
  });
});

describe("an email rendered inside a component", () => {
  const Count = ({ n }: { n: number }) => {
    const [value] = useState(n);
    return <Paragraph>{`Count ${value}`}</Paragraph>;
  };
  // Renders another email (a signature), with Elements or with react-dom itself.
  const Signature = () => <Html html={renderToHtmlParts(<Email><Row><Column><Paragraph>Signed</Paragraph><Count n={9} /></Column></Row></Email>).body} />;
  const Bold = () => <Html html={renderToStaticMarkup(<b>Bold bit</b>)} />;
  const SignedBy = () => {
    const [who] = useState("Ada");
    return <Html html={renderToHtmlParts(<Email><Row><Column><Paragraph>{`Signed ${who}`}</Paragraph></Column></Row></Email>).body} />;
  };

  it("renders a component that runs a render of react-dom's own before its hooks (as email libraries do)", () => {
    const Late = () => {
      const bold = renderToStaticMarkup(<b>bold</b>);
      const [text] = useState("Still here");
      return <Paragraph>{`${text} ${bold.length}`}</Paragraph>;
    };
    const email = <Email><Row><Column><Paragraph>First</Paragraph><Late /></Column></Row></Email>;
    expect(renderToHtml(email)).toContain("Still here 11");
    expect(JSON.stringify(renderToJson(email))).toContain("Still here 11");
  });

  it("leaves the components after it in the column, and their hooks, as they were", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const email = <Email><Row><Column><Count n={1} /><Bold /><Count n={2} /></Column><Column><Count n={3} /></Column></Row></Email>;
      const html = renderToHtml(email);
      for (const text of ["Count 1", "Count 2", "Count 3", "Bold bit"]) expect(html.split(text).length - 1, text).toBe(1);
      const design = JSON.stringify(renderToJson(email));
      for (const text of ["Count 1", "Count 2", "Count 3"]) expect(design, text).toContain(text);
      expect(error).not.toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });

  it("with Elements' render functions, fails the render, saying react-dom can't start a render inside its own", () => {
    for (const Starts of [Signature, SignedBy]) {
      const email = <Email><Row><Column><Count n={1} /><Starts /><Count n={2} /></Column></Row></Email>;
      expect(() => renderToHtml(email)).toThrow(/can't start while a component of a template that Elements is rendering synchronously is called/);
      expect(() => renderToJson(email)).toThrow(/can't start while a component of a template that Elements is rendering synchronously is called/);
    }
  });
});

describe("a context the template doesn't provide", () => {
  // react-dom's renders leave what their providers gave in the context once they're done: its streaming render, the
  // values of the last part it waited for (a page's tenant, theme or locale); renderToString and renderToStaticMarkup,
  // those of a render that failed or suspended inside a provider. A template reads the context's default (react-dom's
  // static render, which renders it, puts it back as it starts), never what another request's render provided.
  type Brand = { name: string };
  const tenant: Brand = { name: "Tenant A Inc" };
  const BRAND: Brand = { name: "Default Brand" };

  /** A react-dom streaming render of a page, `around` its content, to its end: a part it waits for is inside. */
  const streamed = (around: (page: React.ReactNode) => React.ReactElement) =>
    new Promise<void>((resolve, reject) => {
      let ready = false;
      // (Its data comes once the shell is written, so the part always waits for it: from a timer, it could come before
      // react-dom's scheduled render started, on a busy machine, which then rendered the page in one pass and left
      // the context as it was.)
      let release = () => {};
      const data = new Promise<void>((done) => (release = done)).then(() => void (ready = true));
      const Slow = () => {
        if (!ready) throw data;
        return <p>loaded</p>;
      };
      const page = around(<main><Suspense fallback={<i>…</i>}><Slow /></Suspense></main>);
      // (Written nowhere: Node's streams aren't in this test's environment.)
      const sink = { write: () => true, end: () => {}, destroy: () => {}, on: () => sink } as unknown as NodeJS.WritableStream;
      const stream = renderToPipeableStream(page, { onShellReady: () => (stream.pipe(sink), release()), onAllReady: resolve, onShellError: reject });
    });
  const tenantPage = (context: React.Context<any>, value: unknown) => streamed((page) => <context.Provider value={value}>{page}</context.Provider>);
  /** renderToString of a page that fails inside a provider (the app catches it), and of one that suspends there. */
  const failed = (context: React.Context<any>, value: unknown) => {
    const Fails = () => {
      throw new Error("the page failed");
    };
    expect(() => renderToString(<context.Provider value={value}><Fails /></context.Provider>)).toThrow("the page failed");
  };
  const suspended = (context: React.Context<any>, value: unknown) => {
    const Never = () => {
      throw new Promise(() => {});
    };
    renderToString(<context.Provider value={value}><Suspense fallback="…"><Never /></Suspense></context.Provider>);
  };
  const footer = (context: React.Context<Brand>) => {
    const Footer = () => <Paragraph>{`(c) ${useContext(context).name}`}</Paragraph>;
    return <Email><Row><Column><Footer /></Column></Row></Email>;
  };
  const text = (email: React.ReactElement) => renderToPlainText(email).trim();
  /** What a component reading it gives, in a template. */
  const read = (context: React.Context<unknown>) => {
    const Reads = () => <Paragraph>{String(useContext(context))}</Paragraph>;
    return text(<Email><Row><Column><Reads /></Column></Row></Email>);
  };

  it("reads its default after react-dom streamed another request's page that provided it, as react-dom's own render does", async () => {
    const Brand = createContext(BRAND);
    expect(text(footer(Brand))).toBe("(c) Default Brand");
    await tenantPage(Brand, tenant);
    expect(text(footer(Brand))).toBe("(c) Default Brand");
    expect(renderToHtml(footer(Brand))).not.toContain("Tenant A");
    expect(JSON.stringify(renderToJson(footer(Brand)))).not.toContain("Tenant A");
    expect((await asyncRenderers.renderToPlainText(footer(Brand))).trim()).toBe("(c) Default Brand");
    const Reads = () => <>{useContext(Brand).name}</>;
    expect(renderToStaticMarkup(<Reads />)).toBe("Default Brand");
    // One no render has read before.
    const Fresh = createContext(BRAND);
    await tenantPage(Fresh, tenant);
    expect(text(footer(Fresh))).toBe("(c) Default Brand");
  });

  it("reads it so in every way a component can: useContext, use(), a Consumer, a class's contextType", async () => {
    const Brand = createContext(BRAND);
    await tenantPage(Brand, tenant);
    const use = (React as unknown as { use?: (usable: unknown) => Brand }).use;
    const Hook = () => <Paragraph>{`hook ${useContext(Brand).name}`}</Paragraph>;
    const Used = () => <Paragraph>{`use ${use!(Brand).name}`}</Paragraph>;
    const Consumer = () => <Brand.Consumer>{(brand) => <Paragraph>{`consumer ${brand.name}`}</Paragraph>}</Brand.Consumer>;
    class Classy extends Component {
      static contextType = Brand;
      render() {
        return <Paragraph>{`class ${(this.context as Brand).name}`}</Paragraph>;
      }
    }
    const kinds = use ? ["hook", "use", "consumer", "class"] : ["hook", "consumer", "class"];
    const email = <Email><Row><Column><Hook />{use ? <Used /> : null}<Consumer /><Classy /></Column></Row></Email>;
    for (const output of [renderToPlainText(email), await asyncRenderers.renderToPlainText(email)]) {
      expect(output.split("\n").map((line) => line.trim()).filter(Boolean)).toEqual(kinds.map((kind) => `${kind} Default Brand`));
    }
  });

  it("reads a default of undefined, an object default as itself, and a context no render ever provided", async () => {
    const Maybe = createContext<string | undefined>(undefined);
    const Same = createContext(BRAND);
    const Never = createContext("never provided");
    await streamed((page) => <Maybe.Provider value="tenant"><Same.Provider value={tenant}>{page}</Same.Provider></Maybe.Provider>);
    const Reads = () => <Paragraph>{`${String(useContext(Maybe))} ${useContext(Same) === BRAND} ${useContext(Never)}`}</Paragraph>;
    expect(text(<Email><Row><Column><Reads /></Column></Row></Email>)).toBe("undefined true never provided");
  });

  it("reads the template's own provider, whatever another render left", async () => {
    const Brand = createContext(BRAND);
    await tenantPage(Brand, tenant);
    const Footer = () => <Paragraph>{`(c) ${useContext(Brand).name}`}</Paragraph>;
    expect(text(<Email><Brand.Provider value={{ name: "Its own" }}><Row><Column><Footer /></Column></Row></Brand.Provider></Email>)).toBe("(c) Its own");
  });

  it("reads its default in async renders at once, when react-dom streams another page while they wait", async () => {
    const Brand = createContext(BRAND);
    // (One only read once they've waited: no render has read it before.)
    const Later = createContext(BRAND);
    let open = false;
    const gate = streamed((page) => <Brand.Provider value={tenant}><Later.Provider value={tenant}>{page}</Later.Provider></Brand.Provider>).then(() => void (open = true));
    const Before = () => <Paragraph>{`before ${useContext(Brand).name}`}</Paragraph>;
    const After = () => {
      if (!open) throw gate;
      return <Paragraph>{`after ${useContext(Brand).name} ${useContext(Later).name}`}</Paragraph>;
    };
    const rows = <Row><Column><Before /><After /></Column></Row>;
    const own = { name: "Its own" };
    const [plain, provided] = await Promise.all([
      asyncRenderers.renderToPlainText(<Email>{rows}</Email>),
      asyncRenderers.renderToPlainText(<Email><Brand.Provider value={own}><Later.Provider value={own}>{rows}</Later.Provider></Brand.Provider></Email>),
    ]);
    expect(plain.split(/\n+/).map((line) => line.trim())).toEqual(["before Default Brand", "after Default Brand Default Brand"]);
    expect(provided.split(/\n+/).map((line) => line.trim())).toEqual(["before Its own", "after Its own Its own"]);
  });

  it("reads its default after renderToString failed or suspended inside a provider of it, whether a render read it before or not", async () => {
    // An app's page that failed inside its tenant's provider, then the emails after it. A 0.3.0 build read the page's
    // value in a context no render had read before, in every email till react-dom's next renderToString (0.2.1, which
    // rendered with react-dom's renderToStaticMarkup, had react-dom put it back first).
    const Brand = createContext(BRAND);
    failed(Brand, tenant);
    expect(text(footer(Brand))).toBe("(c) Default Brand");
    // Again, after each of the renderers had read it.
    const renders = [() => text(footer(Brand)), () => renderToHtml(footer(Brand)), () => JSON.stringify(renderToJson(footer(Brand))), () => asyncRenderers.renderToPlainText(footer(Brand))];
    for (const render of renders) {
      failed(Brand, tenant);
      expect(await render()).toContain("Default Brand");
      suspended(Brand, tenant);
      expect(await render()).not.toContain("Tenant A");
    }
    const Suspends = createContext(BRAND);
    suspended(Suspends, tenant);
    expect(text(footer(Suspends))).toBe("(c) Default Brand");
  });

  it("reads its default where a stream and a failed renderToString both left another request's value", async () => {
    // A 0.3.0 build took a value both of React's renders left for the default, and kept it for every render after:
    // here, the tenant's, also over the default it had read before.
    const Learned = createContext<unknown>("default");
    expect(read(Learned)).toBe("default");
    const Fresh = createContext<unknown>("default");
    for (const context of [Learned, Fresh]) {
      await tenantPage(context, "TenantA");
      failed(context, "TenantA");
      expect(read(context)).toBe("default");
      renderToString(<p />);
      expect(read(context)).toBe("default");
      await streamed((page) => <>{page}</>);
      expect(read(context)).toBe("default");
    }
  });

  it("after renderToString failed inside a provider of it: reads its default alone, and inside a later stream", async () => {
    /** What a template reads in a component of a react-dom stream (no provider of the context in it). */
    const inStream = async (context: React.Context<unknown>) => {
      let seen = "";
      const Page = () => ((seen = read(context)), <div />);
      await streamed((page) => <><Page />{page}</>);
      return seen;
    };
    // (0.3.0's own renderer read, inside a later stream, what the failed one left: react-dom's static render, which
    // renders the template, puts the default back as it starts.)
    const Learned = createContext<unknown>("default");
    expect(read(Learned)).toBe("default");
    const Fresh = createContext<unknown>("default");
    for (const context of [Learned, Fresh]) {
      failed(context, "TenantB");
      expect(await inStream(context)).toBe("default");
      expect(read(context)).toBe("default");
      expect(await inStream(context)).toBe("default");
    }
  });
});

describe("a context's default around an app's renders", () => {
  // A template reads its default alone, after an app's render that failed inside a provider (react-dom's static render,
  // which renders it, starts from every context's default, and puts the app's own back when it's done). Inside a
  // component of an app's renderToString, another module of react-dom's renders it (see nested-renders.test.tsx), and
  // it reads the app's provider there, as 0.2 did.
  const tenant = "TenantA";
  /** A context, and what a template reading it renders (its plain text). */
  const brand = <T,>(fallback: T) => {
    const Brand = createContext<T>(fallback);
    const Footer = () => <Paragraph>{`brand=${String(useContext(Brand))}`}</Paragraph>;
    const email = <Email><Row><Column><Footer /></Column></Row></Email>;
    return { Brand, email, read: () => renderToPlainText(email).trim() };
  };
  /** What a component of an app's renderToString reads, `value` provided around it. */
  const inRenderToString = (Brand: React.Context<any>, read: () => string, value: unknown) => {
    let seen = "";
    const Page = () => ((seen = read()), <div />);
    renderToString(<Brand.Provider value={value}><Page /></Brand.Provider>);
    return seen;
  };
  /** renderToString of a page that fails inside a provider of `Brand` (the app catches it): react-dom leaves its value in the context. */
  const failedInside = (Brand: React.Context<any>, value: unknown) => {
    const Fails = () => {
      throw new Error("the page failed");
    };
    expect(() => renderToString(<Brand.Provider value={value}><Fails /></Brand.Provider>)).toThrow("the page failed");
  };
  /** A client render to its end: act() in development, flushSync in production builds (which have no act()). */
  const onClient = (root: Root, element: React.ReactElement) => (process.env.NODE_ENV === "production" ? flushSync(() => root.render(element)) : act(() => root.render(element)));
  const acting = (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT;
  beforeAll(() => void ((globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true));
  afterAll(() => void ((globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = acting));
  /** `element` rendered on the client to its end, and unmounted. */
  const client = (element: React.ReactElement) => {
    const root = createRoot(document.createElement("div"));
    try {
      onClient(root, element);
      return root;
    } finally {
      onClient(root, <></>);
    }
  };

  it("reads its default alone, before and after an app's renderToString, and the app's provider inside it", () => {
    const { Brand, read } = brand("default");
    expect(read()).toBe("brand=default");
    expect(inRenderToString(Brand, read, tenant)).toBe(`brand=${tenant}`);
    expect(read()).toBe("brand=default");
    // (The app's render reads its own provider after it.)
    let after = "";
    const Reads = () => ((after = String(useContext(Brand))), <div />);
    const Page = () => (read(), <div />);
    renderToString(<Brand.Provider value={tenant}><Page /><Reads /></Brand.Provider>);
    expect(after).toBe(tenant);
    expect(read()).toBe("brand=default");
  });

  // A template's own provider, with a <Suspense> whose fallback renders (or `onError: "omit"` and a component that
  // suspends), rendered inside an app's renderToString: react-dom's other module renders it, and React left the
  // template's provider in that module's context, where every later render (Elements', the app's) read it.
  it.each([
    ["a <Suspense> whose fallback renders", false],
    ['onError: "omit" and a component that suspends', true],
  ])("reads its default after a tenant's email with its own provider and %s rendered inside an app's renderToString", async (_, omit) => {
    const { Brand, email, read } = brand("default");
    const loading = new Promise(() => {});
    const Translated = (): React.ReactNode => {
      throw loading;
    };
    const tenantA = (
      <Email config={omit ? { onError: "omit" } : undefined}>
        <Brand.Provider value={tenant}>
          <Row>
            <Column>
              <Paragraph>Welcome</Paragraph>
              {omit ? <Translated /> : <Suspense fallback={<Paragraph>…</Paragraph>}><Translated /></Suspense>}
            </Column>
          </Row>
        </Brand.Provider>
      </Email>
    );
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      let preview = "";
      const Preview = () => ((preview = renderToPlainText(tenantA)), <iframe />);
      renderToString(<main><Preview /></main>);
      expect(preview).toContain("Welcome");
    } finally {
      error.mockRestore();
    }
    // Tenant B's email, sync and async, and tenant C's page.
    expect(read()).toBe("brand=default");
    expect((await asyncRenderers.renderToPlainText(email)).trim()).toBe("brand=default");
    const PageC = () => <footer>{`brand=${String(useContext(Brand))}`}</footer>;
    expect(renderToString(<PageC />)).toBe("<footer>brand=default</footer>");
    expect(read()).toBe("brand=default");
  });

  // An app's stream from another react-dom build (its web stream: react-dom/server.edge on React 19, .browser on 18) that
  // waited for a part in a <Suspense> leaves its provider's value where every react-dom stream reads a context: the
  // async renderers (react-dom's Node.js stream) read it, as react-dom's own Node.js stream does, till that build
  // renders again (README, "Contexts and the async renderers"). The synchronous ones read the default.
  const webStream = () =>
    require(Number.parseInt(React.version) >= 19 ? "react-dom/server.edge" : "react-dom/server.browser") as {
      renderToReadableStream: (node: React.ReactNode) => Promise<ReadableStream & { allReady: Promise<void> }>;
    };
  /** An app's page streamed with that build: `value` provided around a part that waits for its data. */
  const appStream = async (Brand: React.Context<any>, value: unknown) => {
    let ready = false;
    let release = () => {};
    const data = new Promise<void>((done) => (release = done)).then(() => void (ready = true));
    const Slow = () => {
      if (!ready) throw data;
      return <p>{String(useContext(Brand))}</p>;
    };
    const stream = await webStream().renderToReadableStream(<Brand.Provider value={value}><main><Suspense fallback={<i>…</i>}><Slow /></Suspense></main></Brand.Provider>);
    release();
    await new Response(stream).text();
  };
  /** What that build left, taken back (a render of nothing with it), so the tests after this one don't read it. */
  const takeBack = async () => void (await new Response(await webStream().renderToReadableStream(<i />)).text());

  it("reads, in the async renderers, the value an app's stream from another react-dom build left, as react-dom's own Node.js stream does; the default in the synchronous ones", async () => {
    const { Brand, email, read } = brand("default");
    try {
      await appStream(Brand, tenant);
      expect((await asyncRenderers.renderToPlainText(email)).trim()).toBe(`brand=${tenant}`);
      expect(read()).toBe("brand=default");
      // (React's own: react-dom's Node.js stream reads it there too.)
      const Reads = () => <b>{String(useContext(Brand))}</b>;
      const own = await new Promise<string>((resolve, reject) => {
        let html = "";
        const sink = { write: (chunk: unknown) => ((html += typeof chunk === "string" ? chunk : new TextDecoder().decode(chunk as Uint8Array)), true), end: () => resolve(html), destroy: () => {}, on() { return this; }, once() { return this; }, emit: () => true, removeListener() { return this; } } as unknown as NodeJS.WritableStream;
        const stream = renderToPipeableStream(<Reads />, { onAllReady: () => stream.pipe(sink), onShellError: reject });
      });
      expect(own).toBe(`<b>${tenant}</b>`);
    } finally {
      await takeBack();
    }
  });

  // (Documented, not wanted: React's renders share each context's value, so these hold what README's "Contexts and the
  // async renderers" says, as React Email's render does. A template that provides what it reads, and an app's render
  // that provides what it reads, read their own.)
  it("reads, in the synchronous renderers too, the value an app's renderToString of another react-dom build left where it failed inside a provider (documented)", async () => {
    const { Brand, email, read } = brand("default");
    const other = require(Number.parseInt(React.version) >= 19 ? "react-dom/server.edge" : "react-dom/server.browser") as { renderToString: (node: React.ReactNode) => string };
    const Fails = () => {
      throw new Error("the page failed");
    };
    try {
      expect(() => other.renderToString(<Brand.Provider value="TENANT_A_SECRET"><Fails /></Brand.Provider>)).toThrow("the page failed");
      expect(read()).toBe("brand=TENANT_A_SECRET");
      expect(JSON.stringify(renderToJson(email))).toContain("TENANT_A_SECRET");
      // (The template's own provider, read where it gives one: the rule README says.)
      const Footer = () => <Paragraph>{`brand=${String(useContext(Brand))}`}</Paragraph>;
      expect(renderToPlainText(<Email><Brand.Provider value="its own"><Row><Column><Footer /></Column></Row></Brand.Provider></Email>).trim()).toBe("brand=its own");
    } finally {
      other.renderToString(<i />);
    }
    expect(read()).toBe("brand=default");
  });

  it("gives, while an async render waits, the template's provider values to an app's stream of another react-dom build that doesn't provide them (documented)", async () => {
    const { Brand } = brand("default");
    // The template: a part inside its provider that resumes, and one after it that still waits.
    const gate = () => {
      let open = () => {};
      const opened = new Promise<void>((done) => (open = done));
      return { open, opened };
    };
    const [fast, slow, page] = [gate(), gate(), gate()];
    const FastText = () => <Paragraph>{`fast ${String(useContext(Brand))}`}</Paragraph>;
    const Fast = async () => (await fast.opened, <FastText />);
    const Slow = async () => (await slow.opened, <Paragraph>slow</Paragraph>);
    const template = (
      <Email><Row><Column>
        <Brand.Provider value="TEMPLATE_SECRET"><Suspense fallback={null}><Fast /></Suspense></Brand.Provider>
        <Suspense fallback={null}><Slow /></Suspense>
      </Column></Row></Email>
    );
    // The app's page, streamed with another build: a part that waits for its data, then reads the context.
    let ready = false;
    const data = page.opened.then(() => void (ready = true));
    const Reads = ({ wait }: { wait?: boolean }) => {
      if (wait && !ready) throw data;
      return <b>{String(useContext(Brand))}</b>;
    };
    const tick = () => new Promise((done) => setTimeout(done, 5));
    const rendering = asyncRenderers.renderToHtml(template);
    try {
      const streaming = webStream().renderToReadableStream(<div><Suspense fallback="…"><Reads wait /></Suspense></div>);
      await tick();
      fast.open();
      await tick();
      page.open();
      const html = await new Response(await streaming).text();
      expect(html).toContain("<b>TEMPLATE_SECRET</b>");
      // (The app's page that provides what it reads reads its own.)
      expect(await new Response(await webStream().renderToReadableStream(<Brand.Provider value="the page's"><Reads /></Brand.Provider>)).text()).toBe("<b>the page&#x27;s</b>");
    } finally {
      slow.open();
      expect(await rendering).toContain("fast TEMPLATE_SECRET");
      await takeBack();
    }
    expect(await new Response(await webStream().renderToReadableStream(<Reads />)).text()).toBe("<b>default</b>");
  });

  // (Documented, not wanted: while another react-dom build streams in the process, React's own renders read each other's
  // provider values, even where each provides its own: React skips putting back a provider's value where a part resumes
  // under the one it left, which the other build changed meanwhile. React says "Detected multiple renderers concurrently
  // rendering the same context provider" in development. README: "Contexts and the async renderers".)
  describe("an async render and an app's stream of another react-dom build at once, each with its own provider (documented)", () => {
    const gate = () => {
      let open = () => {};
      let opened = false;
      const promise = new Promise<void>((done) => (open = done)).then(() => void (opened = true));
      return { open, promise, get opened() { return opened; } };
    };
    const tick = () => new Promise((done) => setTimeout(done, 20));
    /** A part that waits for `g`, then reads the context itself (a component that suspends, as `use()` does). */
    const waitsThenReads = (Brand: React.Context<string>, g: ReturnType<typeof gate>, label: string, element: (text: string) => React.ReactElement) => {
      const Part = () => {
        if (!g.opened) throw g.promise;
        return element(`${label} reads ${useContext(Brand)}`);
      };
      return Part;
    };
    const quiet = () => vi.spyOn(console, "error").mockImplementation(() => {});

    it("can give the email's own provided value the app's page's", async () => {
      const { Brand } = brand("default");
      const [g1, g2, gx] = [gate(), gate(), gate()];
      const P1 = waitsThenReads(Brand, g1, "P1", (text) => <Paragraph>{text}</Paragraph>);
      const P2 = waitsThenReads(Brand, g2, "P2", (text) => <Paragraph>{text}</Paragraph>);
      const XPart = waitsThenReads(Brand, gx, "X", (text) => <p>{text}</p>);
      const error = quiet();
      try {
        const y = asyncRenderers.renderToHtml(<Email><Brand.Provider value="Y_OWN"><Row><Column><Suspense fallback={null}><P1 /></Suspense><Suspense fallback={null}><P2 /></Suspense></Column></Row></Brand.Provider></Email>);
        await tick();
        g1.open();
        await tick();
        const x = webStream().renderToReadableStream(<Brand.Provider value="X_SECRET"><main><Suspense fallback="…"><XPart /></Suspense></main></Brand.Provider>);
        await tick();
        gx.open();
        await tick();
        g2.open();
        const html = await y;
        await new Response(await x).text();
        expect(html).toContain("P1 reads Y_OWN");
        expect(html).toContain("P2 reads X_SECRET");
      } finally {
        error.mockRestore();
        await takeBack();
      }
    });

    it("can give the app's page, which provides its own, the email's provided value", async () => {
      const { Brand } = brand("default");
      const [gx1, gx2, gy] = [gate(), gate(), gate()];
      const X1 = waitsThenReads(Brand, gx1, "x1", (text) => <p>{text}</p>);
      const X2 = waitsThenReads(Brand, gx2, "x2", (text) => <p>{text}</p>);
      const Y = waitsThenReads(Brand, gy, "Y", (text) => <Paragraph>{text}</Paragraph>);
      const Slow = async () => (await new Promise((done) => setTimeout(done, 200)), <Paragraph>slow</Paragraph>);
      const error = quiet();
      try {
        const x = webStream().renderToReadableStream(<Brand.Provider value="X_OWN"><main><Suspense fallback="…"><X1 /></Suspense><Suspense fallback="…"><X2 /></Suspense></main></Brand.Provider>);
        await tick();
        gx1.open();
        await tick();
        const y = asyncRenderers.renderToHtml(<Email><Brand.Provider value="Y_SECRET"><Row><Column><Suspense fallback={null}><Y /></Suspense><Suspense fallback={null}><Slow /></Suspense></Column></Row></Brand.Provider></Email>);
        await tick();
        gy.open();
        await tick();
        gx2.open();
        const page = await new Response(await x).text();
        await y;
        expect(page).toContain("x1 reads X_OWN");
        expect(page).toContain("x2 reads Y_SECRET");
      } finally {
        error.mockRestore();
        await takeBack();
      }
    });
  });

  it("reads, in the async renderers, the template's own value where it provides the context it reads, whatever an app's stream left", async () => {
    const { Brand } = brand("default");
    const Footer = () => <Paragraph>{`brand=${String(useContext(Brand))}`}</Paragraph>;
    const provided = <Email><Brand.Provider value="its own"><Row><Column><Footer /></Column></Row></Brand.Provider></Email>;
    try {
      await appStream(Brand, tenant);
      expect((await asyncRenderers.renderToPlainText(provided)).trim()).toBe("brand=its own");
      expect(renderToPlainText(provided).trim()).toBe("brand=its own");
    } finally {
      await takeBack();
    }
  });

  // The other way: an async render of Elements' left its template's providers in react-dom's Node.js stream module (a
  // part that waited: a lazy section), where the app's next render read them, on the client or with another build's
  // stream: a tenant's values, and Elements' own collecting context (an app's live preview blank, the finished render's
  // collection still called).
  it("leaves no provider of an async render's for the app's next render, on the client or with another build's stream", async () => {
    const { Brand } = brand("default");
    const Section = () => <Paragraph>lazy section</Paragraph>;
    const Lazy = React.lazy(() => new Promise<{ default: React.ComponentType }>((done) => setTimeout(() => done({ default: Section }), 5)));
    const html = await asyncRenderers.renderToHtml(<Brand.Provider value={tenant}><Email><Row><Column><Lazy /></Column></Row></Email></Brand.Provider>);
    expect(html).toContain("lazy section");
    const Reads = () => <b>{String(useContext(Brand))}</b>;
    let shown = "";
    const Preview = () => ((shown = renderToStaticMarkup(<Reads />)), <i />);
    const div = document.createElement("div");
    const root = createRoot(div);
    try {
      onClient(root, <><Reads /><Email><Row><Column><Paragraph>PREVIEW</Paragraph></Column></Row></Email><Preview /></>);
      expect(div.querySelector("b")?.textContent).toBe("default");
      expect(div.innerHTML).toContain("PREVIEW");
      expect(div.innerHTML).not.toContain("unlayer-mark");
    } finally {
      onClient(root, <></>);
    }
    expect(shown).toBe("<b>default</b>");
    expect(await new Response(await webStream().renderToReadableStream(<Reads />)).text()).toBe("<b>default</b>");
  });

  // A lazy template, or a class template wrapper that fails, rendered inside a provider: the render of react-dom's that
  // finds its root left the provider (and Elements' root capture) where the next render read them.
  it("leaves no provider or root capture of a lazy template's, or a failed class wrapper's, for the renders while or after it", async () => {
    const { Brand, email, read } = brand("default");
    const Reads = () => <b>{String(useContext(Brand))}</b>;
    /** What the app's own stream, another request's async render, the app's client render of an email, and a synchronous render read now. */
    const others = async () => {
      const streamed = await new Promise<string>((resolve, reject) => {
        let html = "";
        const sink = { write: (chunk: unknown) => ((html += typeof chunk === "string" ? chunk : new TextDecoder().decode(chunk as Uint8Array)), true), end: () => resolve(html), destroy: () => {}, on() { return this; }, once() { return this; }, emit: () => true, removeListener() { return this; } } as unknown as NodeJS.WritableStream;
        const stream = renderToPipeableStream(<Reads />, { onAllReady: () => stream.pipe(sink), onShellError: reject });
      });
      expect(streamed).toBe("<b>default</b>");
      const div = document.createElement("div");
      const root = createRoot(div);
      try {
        onClient(root, <><Reads /><Email><Row><Column><Paragraph>PREVIEW</Paragraph></Column></Row></Email></>);
        expect(div.querySelector("b")?.textContent).toBe("default");
        expect(div.innerHTML).toContain("PREVIEW");
      } finally {
        onClient(root, <></>);
      }
      expect((await asyncRenderers.renderToPlainText(email)).trim()).toBe("brand=default");
      expect(read()).toBe("brand=default");
    };
    let load = () => {};
    const Broken = (): React.ReactNode => {
      throw new Error("the template failed");
    };
    const lazy = (content: React.ReactNode) => {
      const Template = () => <Email><Row><Column>{content}</Column></Row></Email>;
      return React.lazy(() => new Promise<{ default: React.ComponentType }>((done) => (load = () => done({ default: Template }))));
    };
    // A's lazy template, not loaded yet: while it waits, and after it fails.
    const Waiting = lazy(<Paragraph>lazy template</Paragraph>);
    const a = asyncRenderers.renderToHtml(<Brand.Provider value={tenant}><Waiting /></Brand.Provider>);
    await new Promise((done) => setTimeout(done, 5));
    await others();
    load();
    expect(await a).toContain("lazy template");
    const Failing = lazy(<Broken />);
    const failing = asyncRenderers.renderToHtml(<Brand.Provider value={tenant}><Failing /></Brand.Provider>);
    await new Promise((done) => setTimeout(done, 5));
    load();
    await expect(failing).rejects.toThrow("the template failed");
    await others();
    // A class template wrapper that fails inside a provider.
    class Fails extends Component {
      constructor(props: object) {
        super(props);
        throw new Error("the wrapper failed");
      }
      render() {
        return <Email />;
      }
    }
    await expect(asyncRenderers.renderToHtml(<Brand.Provider value={tenant}><Fails /></Brand.Provider>)).rejects.toThrow("the wrapper failed");
    await others();
  });

  // While an async render waits (a lazy component's collection, a lazy template's root capture), React leaves Elements'
  // own context values where every react-dom module, and React's client, reads them: an app's preview of a bare block,
  // with another build's stream or on the client, ran under that render's collection (its blocks became the render's
  // markers, its errors the render's), and an <Email> it rendered was taken for the waiting render's root.
  it("hands no element of an async render's to another render while it waits", async () => {
    const LazyBlock = React.lazy(() => Promise.resolve({ default: () => <Paragraph>A-LAZY</Paragraph> }));
    let release = () => {};
    const gate = new Promise<void>((done) => (release = done));
    const Slow = async () => (await gate, <Paragraph>A-SLOW</Paragraph>);
    const a = asyncRenderers.renderToHtml(<Email><Row><Column><LazyBlock /><Slow /></Column></Row></Email>);
    await new Promise((done) => setTimeout(done, 10));
    try {
      const preview = await new Response(await webStream().renderToReadableStream(<main><Paragraph>B-PREVIEW</Paragraph></main>)).text();
      expect(preview).toContain("B-PREVIEW");
      expect(preview).not.toContain("unlayer-mark");
      const div = document.createElement("div");
      const root = createRoot(div);
      try {
        onClient(root, <><Paragraph>B-CLIENT</Paragraph><Email><Row><Column><Paragraph>B-EMAIL</Paragraph></Column></Row></Email></>);
        expect(div.innerHTML).toContain("B-CLIENT");
        expect(div.innerHTML).toContain("B-EMAIL");
        expect(div.innerHTML).not.toContain("unlayer-mark");
      } finally {
        onClient(root, <></>);
      }
    } finally {
      release();
    }
    const html = await a;
    expect(html).toContain("A-LAZY");
    expect(html).toContain("A-SLOW");
  });

  it("renders lazy components and templates where another version's value holds the global slot of Elements' contexts", async () => {
    const keys = ["collects", "root-capture"].map((name) => Symbol.for(`@unlayer/react-elements/${name}`));
    const global = globalThis as Record<symbol, unknown>;
    const kept = keys.map((key) => global[key]);
    const LazyBlock = React.lazy(() => Promise.resolve({ default: () => <Paragraph>LAZY-BLOCK</Paragraph> }));
    const LazyTemplate = React.lazy(() => Promise.resolve({ default: () => <Email><Row><Column><Paragraph>LAZY-TEMPLATE</Paragraph></Column></Row></Email> }));
    try {
      for (const key of keys) global[key] = { another: "version" };
      const block = <Email><Row><Column><LazyBlock /></Column></Row></Email>;
      expect(await asyncRenderers.renderToHtml(block)).toContain("LAZY-BLOCK");
      expect(await asyncRenderers.renderToHtml(<LazyTemplate />)).toContain("LAZY-TEMPLATE");
      expect(renderToJson(block).body.rows[0].columns[0].contents.map((c) => c.type)).toEqual(["text"]);
      expect(renderToHtml(<LazyTemplate />)).toContain("LAZY-TEMPLATE");
    } finally {
      keys.forEach((key, i) => (global[key] = kept[i]));
    }
  });

  it("reads one value for a context throughout a render that starts inside an app's renderToString and goes on after it", async () => {
    const Brand = createContext("default");
    let open = false;
    const gate = new Promise((done) => setTimeout(done, 5)).then(() => void (open = true));
    // The wrapper reads it inside renderToString; the content's components, after renderToString returned (the walk waits).
    const Later = () => {
      if (!open) throw gate;
      return <Paragraph>{`later=${useContext(Brand)}`}</Paragraph>;
    };
    const Welcome = () => (
      <Email>
        <Row>
          <Column>
            <Paragraph>{`wrapper=${useContext(Brand)}`}</Paragraph>
            <Brand.Consumer>{(value) => <Paragraph>{`consumer=${value}`}</Paragraph>}</Brand.Consumer>
            <Later />
          </Column>
        </Row>
      </Email>
    );
    const started = () => {
      let text: Promise<string> | undefined;
      const Page = () => ((text = asyncRenderers.renderToPlainText(<Welcome />)), <div />);
      renderToString(<Brand.Provider value={tenant}><Page /></Brand.Provider>);
      return text!.then((plain) => plain.split(/\n+/).map((line) => line.trim()));
    };
    // Its default, throughout (an async render starts once the call that started it is over); alone, the default too.
    expect(await started()).toEqual(["wrapper=default", "consumer=default", "later=default"]);
    expect((await asyncRenderers.renderToPlainText(<Welcome />)).split(/\n+/).map((line) => line.trim())).toEqual(["wrapper=default", "consumer=default", "later=default"]);
    expect(await started()).toEqual(["wrapper=default", "consumer=default", "later=default"]);
  });

  it("reads a default of undefined", () => {
    const { Brand, read } = brand<string | undefined>(undefined);
    failedInside(Brand, "TenantB");
    expect(read()).toBe("brand=undefined");
    failedInside(Brand, "TenantB");
    expect(read()).toBe("brand=undefined");
  });

  it("reads its default after a client render", () => {
    client(<p>an app's client render</p>);
    const { Brand, read } = brand("default");
    failedInside(Brand, "TenantB");
    expect(read()).toBe("brand=default");
  });

  it("reads its default in an effect of a client render", async () => {
    const { Brand, read } = brand("default");
    const seen: string[] = [];
    const Preview = () => {
      useEffect(() => void seen.push(read()), []);
      return <div />;
    };
    failedInside(Brand, "TenantB");
    client(<Preview />);
    await new Promise((done) => setTimeout(done, 0));
    expect(seen).toEqual(["brand=default"]);
  });

  it("reads its default while a client render runs, not the client's provider", () => {
    const { Brand, read } = brand("default");
    expect(read()).toBe("brand=default");
    // (0.3.0's own renderer read what's there inside an app's render: here, what a renderToString left, which is also
    // the client's provider's.)
    failedInside(Brand, "TenantB");
    const seen: Array<[boolean, string]> = [];
    const Preview = ({ n }: { n: number }) => (seen.push([false, read()]), <div>{n}</div>);
    const root = createRoot(document.createElement("div"));
    try {
      onClient(root, <Brand.Provider value="TenantB"><Preview n={1} /></Brand.Provider>);
      onClient(root, <Brand.Provider value="TenantB"><Preview n={2} /></Brand.Provider>);
    } finally {
      onClient(root, <></>);
    }
    // Mounting and updating: the default.
    expect(seen.map(([, text]) => text)).toEqual(seen.map(() => "brand=default"));
    expect(seen.length).toBeGreaterThanOrEqual(2);
    expect(read()).toBe("brand=default");
    renderToString(<p />);
  });
});

describe("a render", () => {
  // A prerendered page that reads one of these changes with each build: Next.js's Cache Components (its new apps'
  // default since 16) fail the build on one. 0.2.0 asked crypto.getRandomValues() for each render's nonce, so no
  // email could be rendered in a page Next.js prerenders.
  it("reads no random numbers and not the date", () => {
    const sources: Array<[object, string]> = [[globalThis.crypto, "getRandomValues"], [globalThis.crypto, "randomUUID"], [Math, "random"], [Date, "now"]];
    const spies = sources.filter(([owner, name]) => typeof (owner as Record<string, unknown>)?.[name] === "function").map(([owner, name]) => vi.spyOn(owner as any, name as any));
    expect(spies).toHaveLength(4);
    try {
      const email = () => (
        <Email previewText="Hi">
          {kept.hooks}
          <Row><Column><Paragraph>Text</Paragraph><Html html="<p>Kept</p>" /></Column></Row>
        </Email>
      );
      renderToHtml(email());
      renderToHtmlParts(email());
      renderToPlainText(email());
      renderToJson(email());
      renderRowToJson(<Row><Column><Paragraph>Row</Paragraph></Column></Row>);
      for (const spy of spies) expect(spy).not.toHaveBeenCalled();
    } finally {
      for (const spy of spies) spy.mockRestore();
    }
  });

  // Its nonce comes from the clock and a count of renders: where the clock stands still (fake timers) or there's
  // none, an email renders as it does with one, and so does an email rendered inside a component of it.
  it("renders the same where the clock stands still or there's none", () => {
    // (A render the user's code starts while the render runs: a custom tool's exporter's.)
    const Inner = registerTool({ name: "clock-inner", renderer: { exporters: { email: () => (renderToHtml(<Email><Row><Column><Paragraph>Inner email</Paragraph></Column></Row></Email>).includes("Inner email") ? "<p>Inner ok</p>" : "<p>Inner missing</p>") } } });
    const email = () => <Email><Row><Column><Paragraph>Outer</Paragraph><Inner /></Column></Row></Email>;
    const outputs = () => [renderToHtml(email()), JSON.stringify(renderToJson(email())), renderToPlainText(email())];
    const expected = outputs();
    expect(expected[0]).toContain("Inner ok");
    const now = vi.spyOn(performance, "now").mockReturnValue(1000);
    try {
      expect(outputs()).toEqual(expected);
    } finally {
      now.mockRestore();
    }
    const clock = Object.getOwnPropertyDescriptor(globalThis, "performance")!;
    delete (globalThis as { performance?: unknown }).performance;
    try {
      expect(globalThis.performance).toBeUndefined();
      expect(outputs()).toEqual(expected);
    } finally {
      Object.defineProperty(globalThis, "performance", clock);
    }
  });
});

// ── What rendered before ────────────────────────────────────────────────────

/** The text of a component's `useId()` (`uid1 :R5:`), where it shows in the HTML, the plain text and the design. */
const Uid = ({ n }: { n: number }) => <Paragraph>{`uid${n} ${useId()}`}</Paragraph>;
const uids = (output: string) => [...output.matchAll(/uid\d [^<"\\\n]+/g)].map((m) => m[0]);

describe("a root kept between renders, with useId() in its content", () => {
  // A template wrapper that calls useId() moves the ids of the content after it, as React's do. The ids it moved were
  // kept by the root's content, so the root rendered again on its own, or by a wrapper that calls none, had them.
  const content = <Row><Column><Uid n={1} /></Column></Row>;
  const root = <Email>{content}</Email>;
  const Forked = () => (useId(), root);
  const Plain = () => root;

  it("gives the ids of its own render, whatever wrapper returned it before", () => {
    const outputs = () => [renderToHtml(root), renderToHtml(<Plain />), renderToHtmlParts(root).body, renderToPlainText(<Plain />), JSON.stringify(renderToJson(root)), JSON.stringify(renderToJson(<Plain />))];
    const before = outputs();
    const forked = [renderToHtml(<Forked />), JSON.stringify(renderToJson(<Forked />))];
    // (The wrapper's useId() moves the content's.)
    expect(uids(forked[0])).not.toEqual(uids(before[0]));
    expect(uids(forked[1])).toEqual(uids(forked[0]));
    expect(outputs()).toEqual(before);
    expect(new Set(outputs().map((output) => uids(output).join()))).toEqual(new Set([uids(before[0]).join()]));
  });
});

describe("a template whose root's settings can't be read (its root inside markup, or one of several)", () => {
  it("says so on every render of it, not only the first, in every renderer", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const email = <Email><Row><Column><Paragraph>Hi</Paragraph></Column></Row></Email>;
      const Welcome = () => email;
      const InMarkup = () => <div>{email}</div>;
      // (Where unwrapping stops, or inside what a component renders, where only the walk finds it.)
      for (const element of [<InMarkup />, <div>{email}</div>, <><Welcome /><Welcome /></>]) {
        warn.mockClear();
        const said = () => warn.mock.calls.filter((call) => String(call[0]).includes("couldn't unwrap")).length;
        const html = renderToHtml(element);
        expect(said()).toBe(1);
        expect(renderToHtml(element)).toBe(html);
        expect(said()).toBe(2);
        renderToHtmlParts(element);
        renderToPlainText(element);
        expect(said()).toBe(4);
        expect(await asyncRenderers.renderToHtml(element)).toBe(html);
        await asyncRenderers.renderToHtmlParts(element);
        await asyncRenderers.renderToPlainText(element);
        expect(said()).toBe(7);
        // What each says, sync or async, but for the render function's name.
        expect(new Set(warn.mock.calls.map((call) => String(call[0]).replace(/^\[Unlayer\] \w+: /, "[Unlayer] "))).size).toBe(1);
      }
    } finally {
      warn.mockRestore();
    }
  });
});

describe("a root kept between renders, under an <UnlayerProvider config> in one of them", () => {
  it("has that config in that render only", () => {
    const root = <Email><Row><Column><Uid n={1} /></Column></Row></Email>;
    const Provided = () => <UnlayerProvider config={{ textDirection: "rtl", idPrefix: "p-" }}>{root}</UnlayerProvider>;
    const outputs = () => [renderToHtml(root), JSON.stringify(renderToJson(root))];
    const before = outputs();
    const provided = [renderToHtml(<Provided />), JSON.stringify(renderToJson(<Provided />))];
    expect(provided[0]).toContain('dir="rtl"');
    expect(uids(provided[0])[0]).toContain("p-");
    expect(provided[1]).toContain('"textDirection":"rtl"');
    expect(outputs()).toEqual(before);
    expect(before[0]).not.toContain('dir="rtl"');
  });
});

/** A seeded random number generator (mulberry32): the same templates and order every run. */
function random(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return { next, pick: <T,>(list: readonly T[]) => list[Math.floor(next() * list.length)] };
}

describe("templates that share elements kept between renders, at random", () => {
  // The kept elements renders shared what they found in (a root and its content, an <UnlayerProvider> around it), in
  // templates with and without wrappers that call useId(), a custom tool with a head, a block whose exporter fails, and
  // each renderer's options. Each template's output, and what each render says, is the one its first render gave,
  // whatever rendered before it; and two async renders at once give what each gives alone.
  const Badge = registerTool({
    name: "isolation_badge",
    values: { label: "" },
    renderer: {
      exporters: { email: (values) => `<b>badge ${values.label}</b>`, web: (values) => `<i>badge ${values.label}</i>` },
      head: { css: (values) => `.${values._meta?.htmlID} { color: #c00; }` },
    },
  });
  const Broken = registerTool({ name: "isolation_broken", renderer: { exporters: { web: () => { throw new Error("broken exporter"); } } } });
  const contents = [
    <Row><Column><Uid n={1} /><Badge label="a" /></Column></Row>,
    [<Row key="1"><Column><Paragraph>Two rows</Paragraph></Column></Row>, <Row key="2"><Column><Uid n={2} /></Column></Row>],
    <><Row><Column><Badge label="c" /><Uid n={3} /></Column></Row><Row><Column><Uid n={4} /></Column></Row></>,
    <Row><Column><Paragraph>Before</Paragraph><Broken /><Uid n={5} /></Column></Row>,
  ];
  const roots = contents.flatMap((content) => [<Email>{content}</Email>, <Page>{content}</Page>, <Email textDirection="rtl" config={{ idPrefix: "r-" }}>{content}</Email>]);
  const kept = [
    ...roots,
    ...roots.slice(0, 6).map((root) => <UnlayerProvider config={{ textDirection: "rtl", idPrefix: "p-" }}>{root}</UnlayerProvider>),
    <Suspense>{roots[0]}</Suspense>,
    // (Said, as its root's settings go unread.)
    <div>{roots[1]}</div>,
  ];
  const Forked = ({ of }: { of: React.ReactElement }) => (useId(), of);
  const Plain = ({ of }: { of: React.ReactElement }) => of;
  const Twice = ({ of }: { of: React.ReactElement }) => (useId(), useId(), <Plain of={of} />);
  const MemoForked = memo(Forked);
  const wrappers = [Forked, Plain, Twice, MemoForked] as React.ComponentType<{ of: React.ReactElement }>[];
  const options = [{}, { idPrefix: "o-" }, { textDirection: "rtl" }, { onError: "omit" }] as const;
  type Template = { element: React.ReactElement; options: (typeof options)[number] };

  const parts = (p: { omitted: Array<{ message: string; component: string; position: string }> }) => JSON.stringify({ ...p, omitted: p.omitted.map((e) => [e.message, e.component, e.position]) });
  const renderers: Record<string, (t: Template) => unknown> = {
    html: (t) => renderToHtml(t.element, t.options),
    parts: (t) => parts(renderToHtmlParts(t.element, t.options)),
    text: (t) => renderToPlainText(t.element, t.options),
    json: (t) => JSON.stringify(renderToJson(t.element, t.options as object)),
    "async html": (t) => asyncRenderers.renderToHtml(t.element, t.options),
    "async parts": async (t) => parts(await asyncRenderers.renderToHtmlParts(t.element, t.options)),
    "async text": (t) => asyncRenderers.renderToPlainText(t.element, t.options),
    "async json": async (t) => JSON.stringify(await asyncRenderers.renderToJson(t.element, t.options as object)),
  };
  const RUNS = Number(process.env.ISOLATION_RUNS ?? 120);
  const SEED = Number(process.env.ISOLATION_SEED ?? 20261018);

  it(`each give their own output after any other (${RUNS} pairs, seed ${SEED})`, async () => {
    const r = random(SEED);
    const templates: Template[] = Array.from({ length: 24 }, () => {
      let element = r.pick(kept);
      for (let n = Math.floor(r.next() * 3); n > 0; n--) element = React.createElement(r.pick(wrappers), { of: element });
      return { element, options: r.pick(options) };
    });
    const said: string[] = [];
    const spies = (["warn", "error"] as const).map((level) => vi.spyOn(console, level).mockImplementation((...args) => void said.push(`${level}: ${String(args[0])}`)));
    /** What a render gives: its output or its error, and what it said. */
    const observe = async (name: string, t: Template) => {
      const from = said.length;
      let out: unknown;
      try {
        out = await renderers[name](t);
      } catch (error) {
        out = `threw ${(error as Error).message}`;
      }
      return JSON.stringify({ out, said: said.slice(from) });
    };
    const first = new Map<string, string>();
    const check = async (name: string, i: number, after: string) => {
      const got = await observe(name, templates[i]);
      const key = `${name} ${i}`;
      if (!first.has(key)) first.set(key, got);
      expect(got, `${key}, after ${after} (seed ${SEED})`).toBe(first.get(key));
    };
    try {
      for (let run = 0; run < RUNS; run++) {
        const [a, b] = [Math.floor(r.next() * templates.length), Math.floor(r.next() * templates.length)];
        for (const name of Object.keys(renderers)) {
          await check(name, b, "nothing");
          await check(name, a, `${name} ${b}`);
          await check(name, b, `${name} ${a}`);
          await check(name, a, `${name} ${b}`);
        }
        // Two async renders at once: what each gives alone.
        for (const name of Object.keys(renderers).filter((n) => n.startsWith("async"))) {
          const outputs = await Promise.all([a, b].map(async (i) => {
            try {
              return await renderers[name](templates[i]);
            } catch (error) {
              return `threw ${(error as Error).message}`;
            }
          }));
          [a, b].forEach((i, k) => expect(JSON.stringify(JSON.parse(first.get(`${name} ${i}`)!).out), `${name} ${i} with ${a === i ? b : a} at once (seed ${SEED})`).toBe(JSON.stringify(outputs[k])));
        }
      }
    } finally {
      for (const spy of spies) spy.mockRestore();
    }
  }, Math.max(20_000, RUNS * 100));
});
